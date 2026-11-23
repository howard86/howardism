/** biome-ignore-all lint/performance/noAwaitInLoops: Reads are deliberately sequential so memory stays bounded and replay order is deterministic. */
import {
  EMPTY_RELEASE_HISTORY,
  type ReleaseHistoryManifest,
} from "@howardism/article-contract/manifests/release-history";
import {
  type ArticleDigest,
  digestArticle,
  recordRelease,
  resolvedFromOpenQuestions,
  type Snapshot,
  summarize,
} from "./history";

const ARTICLES_DIR = "apps/blog/src/content/articles";
const QUESTIONS_PATH = "apps/blog/src/data/open-questions.json";
const MDX_SUFFIX = /\.mdx$/;

async function git(
  repo: string,
  args: string[],
  stdin?: string
): Promise<Uint8Array> {
  const proc = Bun.spawn(["git", "-C", repo, ...args], {
    stdin: stdin === undefined ? "ignore" : "pipe",
    stdout: "pipe",
    stderr: "pipe",
  });
  const out = new Response(proc.stdout).arrayBuffer();
  const err = new Response(proc.stderr).text();
  if (stdin !== undefined) {
    proc.stdin?.write(stdin);
    await proc.stdin?.end();
  }
  const [bytes, message, code] = await Promise.all([out, err, proc.exited]);
  if (code !== 0) {
    throw new Error(`git ${args.join(" ")} failed: ${message.trim()}`);
  }
  return new Uint8Array(bytes);
}

const gitText = async (repo: string, args: string[]): Promise<string> =>
  new TextDecoder().decode(await git(repo, args));

export interface SeedCommit {
  date: string;
  sha: string;
}

/** Last commit of each calendar date that touched the corpus and still has it. */
export async function seedCommits(repo: string): Promise<SeedCommit[]> {
  const log = await gitText(repo, [
    "log",
    "--reverse",
    "--format=%H %ad",
    "--date=short",
    "--",
    ARTICLES_DIR,
  ]);
  const byDate = new Map<string, string>();
  for (const line of log.split("\n").filter(Boolean)) {
    const [sha, date] = line.split(" ");
    const tree = await gitText(repo, ["ls-tree", sha, `${ARTICLES_DIR}/`]);
    if (tree.trim()) {
      byDate.set(date, sha);
    }
  }
  return [...byDate].map(([date, sha]) => ({ date, sha }));
}

/** Read blobs by oid in one `cat-file --batch` call. */
async function readBlobs(
  repo: string,
  oids: string[]
): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  if (oids.length === 0) {
    return out;
  }
  const bytes = await git(
    repo,
    ["cat-file", "--batch"],
    `${oids.join("\n")}\n`
  );
  const decoder = new TextDecoder();
  let offset = 0;
  for (const oid of oids) {
    const newline = bytes.indexOf(10, offset);
    const [, , size] = decoder
      .decode(bytes.subarray(offset, newline))
      .split(" ");
    const start = newline + 1;
    const end = start + Number(size);
    out.set(oid, decoder.decode(bytes.subarray(start, end)));
    offset = end + 1;
  }
  return out;
}

/** Build a snapshot for one commit; `cache` memoizes digests by blob oid. */
async function commitSnapshot(
  repo: string,
  sha: string,
  cache: Map<string, ArticleDigest>
): Promise<Snapshot> {
  const listing = await gitText(repo, [
    "ls-tree",
    "-r",
    sha,
    "--",
    ARTICLES_DIR,
    QUESTIONS_PATH,
  ]);
  const articles: Record<string, string> = {};
  let questionsOid: string | undefined;
  for (const line of listing.split("\n").filter(Boolean)) {
    const [meta, path] = line.split("\t");
    const [, , oid] = meta.split(" ");
    if (path === QUESTIONS_PATH) {
      questionsOid = oid;
    } else if (
      path.startsWith(`${ARTICLES_DIR}/`) &&
      !path.slice(ARTICLES_DIR.length + 1).includes("/") &&
      MDX_SUFFIX.test(path)
    ) {
      articles[path.slice(ARTICLES_DIR.length + 1).replace(MDX_SUFFIX, "")] =
        oid;
    }
  }
  const missing = [
    ...new Set(Object.values(articles).filter((oid) => !cache.has(oid))),
  ];
  const wanted = questionsOid ? [...missing, questionsOid] : missing;
  const blobs = await readBlobs(repo, wanted);
  for (const oid of missing) {
    cache.set(oid, digestArticle(blobs.get(oid) ?? ""));
  }
  let resolved: Snapshot["resolved"] = {};
  if (questionsOid) {
    try {
      resolved = resolvedFromOpenQuestions(
        JSON.parse(blobs.get(questionsOid) ?? "null")
      );
    } catch {
      resolved = {};
    }
  }
  return {
    articles: Object.fromEntries(
      Object.entries(articles).map(([slug, oid]) => [
        slug,
        cache.get(oid) as ArticleDigest,
      ])
    ),
    resolved,
  };
}

/** Replay the repo's corpus history into a release-history manifest. */
export async function seedHistoryFromGit(
  repo: string,
  log: (line: string) => void = () => undefined
): Promise<ReleaseHistoryManifest> {
  let history = EMPTY_RELEASE_HISTORY;
  const cache = new Map<string, ArticleDigest>();
  for (const { sha, date } of await seedCommits(repo)) {
    const result = recordRelease(
      history,
      await commitSnapshot(repo, sha, cache),
      date
    );
    if (result.release) {
      const row = summarize(result.release);
      log(
        `${String(row.no).padStart(3)}  ${row.date}  new=${row.new} revised=${row.revised} resolved=${row.resolved}  ${sha.slice(0, 8)}`
      );
    }
    ({ history } = result);
  }
  return history;
}
