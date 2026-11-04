import { describe, expect, it } from "bun:test";
import { ContentBuildMarkerSchema } from "@howardism/article-contract/manifests/content-release";

import { contentMarker } from "../content/marker.ts";

const DIGEST = "a".repeat(64);
const COMMIT = "b".repeat(40);

describe("contentMarker", () => {
  it("drops prepare's bookkeeping so a full marker passes the strict schema", () => {
    const state = {
      schemaVersion: 1,
      profile: "full",
      releaseSha256: DIGEST,
      materializedTreeSha256: DIGEST,
      materializedFiles: [["content/assets/a.webp", 1024]],
    };
    const marker = contentMarker(state, COMMIT);
    expect(marker).not.toHaveProperty("materializedFiles");
    expect(ContentBuildMarkerSchema.parse(marker)).toEqual({
      schemaVersion: 1,
      profile: "full",
      applicationCommit: COMMIT,
      releaseSha256: DIGEST,
      materializedTreeSha256: DIGEST,
    });
  });

  it("omits releaseSha256 when the state has none", () => {
    const marker = contentMarker(
      { schemaVersion: 1, profile: "sample", materializedTreeSha256: DIGEST },
      COMMIT
    );
    expect(marker).not.toHaveProperty("releaseSha256");
  });
});
