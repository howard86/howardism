/**
 * The public build marker, `/.well-known/howardism-content.json`. It carries
 * only the fields `ContentBuildMarkerSchema` allows (a strict object), picked
 * from `.content-state.json`: that state also holds prepare's own bookkeeping
 * (`materializedFiles`, every content file with its size), which once leaked
 * into the marker, made it 105KB, and failed `content:verify-build` and
 * `content:verify-deployment`.
 */
interface ContentState {
  materializedTreeSha256: string;
  profile: string;
  releaseSha256?: string;
  schemaVersion: number;
}

export function contentMarker(
  state: ContentState,
  applicationCommit: string
): Record<string, unknown> {
  return {
    schemaVersion: state.schemaVersion,
    profile: state.profile,
    ...(state.releaseSha256 ? { releaseSha256: state.releaseSha256 } : {}),
    materializedTreeSha256: state.materializedTreeSha256,
    applicationCommit,
  };
}
