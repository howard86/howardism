import { execSync } from "node:child_process";
import { appendFileSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

interface PackageJson {
  name: string;
  version: string;
  [key: string]: unknown;
}

const CONVENTIONAL_MAJOR_REGEX = /^[a-z]+(\([a-z0-9_-]+\))?!:/;

const getCommits = (lastTag: string): string[] => {
  let tagExists = false;
  try {
    execSync(`git rev-parse ${lastTag}`, { stdio: "ignore" });
    tagExists = true;
  } catch {
    return [];
  }

  if (!tagExists) {
    return [];
  }

  try {
    const gitLog = execSync(`git log ${lastTag}..HEAD --format=%s`, {
      encoding: "utf-8",
    });
    return gitLog
      .split("\n")
      .map((c) => c.trim())
      .filter(Boolean);
  } catch (error) {
    console.warn(
      `Failed to get commits since ${lastTag}:`,
      (error as Error).message
    );
    return [];
  }
};

const determineBumpType = (commits: string[]): "major" | "minor" | "patch" => {
  let bumpType: "major" | "minor" | "patch" = "patch";

  for (const commit of commits) {
    const lower = commit.toLowerCase();

    // Check for Major / Breaking changes
    if (
      lower.includes("breaking change") ||
      CONVENTIONAL_MAJOR_REGEX.test(lower) ||
      lower.includes(":boom:") ||
      commit.includes("💥")
    ) {
      bumpType = "major";
      break; // Major takes priority over everything
    }

    // Check for Minor / Feature changes
    if (
      lower.startsWith("feat") ||
      lower.includes(":sparkles:") ||
      commit.includes("✨")
    ) {
      bumpType = "minor";
    }
  }

  return bumpType;
};

const incrementVersion = (
  currentVersion: string,
  bumpType: "major" | "minor" | "patch"
): string => {
  const versionParts = currentVersion.split(".");
  if (versionParts.length !== 3) {
    throw new Error(`Invalid version format: ${currentVersion}`);
  }

  const [major, minor, patch] = versionParts.map(Number);
  if (Number.isNaN(major) || Number.isNaN(minor) || Number.isNaN(patch)) {
    throw new Error(`Non-numeric version segments: ${currentVersion}`);
  }

  if (bumpType === "major") {
    return `${major + 1}.0.0`;
  }

  if (bumpType === "minor") {
    return `${major}.${minor + 1}.0`;
  }

  return `${major}.${minor}.${patch + 1}`;
};

const main = (): void => {
  const pkgPath = join(process.cwd(), "package.json");
  let pkgContent = "";
  try {
    pkgContent = readFileSync(pkgPath, "utf-8");
  } catch (error) {
    throw new Error(
      `Failed to read package.json at ${pkgPath}: ${(error as Error).message}`
    );
  }

  const pkg = JSON.parse(pkgContent) as PackageJson;
  const currentVersion = pkg.version;
  if (!currentVersion) {
    throw new Error("package.json does not contain a version field");
  }

  let lastTag = "";
  try {
    lastTag = execSync("git describe --tags --abbrev=0", {
      encoding: "utf-8",
    }).trim();
  } catch {
    lastTag = `v${currentVersion}`;
  }

  const commits = getCommits(lastTag);
  const bumpType = determineBumpType(commits);
  const newVersion = incrementVersion(currentVersion, bumpType);

  pkg.version = newVersion;
  try {
    writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`, "utf-8");
  } catch (error) {
    throw new Error(
      `Failed to write package.json at ${pkgPath}: ${(error as Error).message}`
    );
  }

  const newTag = `v${newVersion}`;
  console.info(
    `Bumped version from ${currentVersion} to ${newVersion} (${bumpType} bump)`
  );
  console.info(`New tag: ${newTag}`);

  const githubOutput = process.env.GITHUB_OUTPUT;
  if (githubOutput) {
    try {
      appendFileSync(githubOutput, `tag=${newTag}\n`);
      appendFileSync(githubOutput, `version=${newVersion}\n`);
    } catch (error) {
      throw new Error(
        `Failed to write to GITHUB_OUTPUT at ${githubOutput}: ${(error as Error).message}`
      );
    }
  }
};

main();
