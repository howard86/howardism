# R2 migration status

Gate ledger and evidence for [README.md](README.md). A gate is `pending`,
`passed` or `failed`. An external check that hasn't been run stays `pending`.
Evidence for the final SHA goes in the PR or CI record, not in a commit that
would have to cite itself.

Last updated 2026-10-02 (Asia/Taipei).

## Gates

| Gate | Requires | Status | Remaining |
|---|---|---|---|
| **G0** Baseline and recovery | Full inventory, independent backup, recorded production revision, a restore that succeeds | **passed** | Both backups share one machine |
| **G1** Release correctness | Real-R2 publication with exact reconstruction, idempotency, immutable manifests, no partial releases | **passed** | — |
| **G2** Build and profile safety | Cold/warm, sample/full isolation, checksum/deletion/interruption tests, correct turbo identity, secret-free fresh-clone previews | pending | Local trusted cold/warm full build passed. Still needed: the same run in `content-integration.yml`, which GitHub can dispatch only once the file is on `main`, and fresh-clone sample checks at the final head |
| **G3** Deployment and rollback rehearsal | A trusted full deployment with no tracked-content fallback, parity, observed Vercel cache behaviour, previous-release restore, promotion controls | **blocked** | No pre-merge path deploys a full build: previews reject `full`, and the integration workflow builds but doesn't deploy |
| **G4** Untracking and final verification | G0–G3 first; then the full pin plus corpus untracking, fresh-clone cold full and sample builds, a lockfile-only deployment | pending | The public fixture tree is already untracked |
| **G5** Production activation | The approved commit and release, a verified full marker, smoke tests, and the previous deployment kept available | pending | Not merged, not activated |
| **G6** Retention activation | Observed stability, a demonstrated restore, reviewed protected releases, an approved dry-run | pending | GC is implemented and tested; live deletion stays off |

G3 runs as an isolated trusted deployment; it doesn't promote the sample or
replace the live site. G4 has two parts: G0–G3 authorize the untracking commit,
and that commit must pass verification before merge.

## Evidence

The receipts hold the digests, counts and deployment IDs:
[baseline-receipt.json](baseline-receipt.json) for G0 and the sample preview,
[sample-receipt.json](sample-receipt.json) for the public sample release. The
receipts don't record these:

- **Restore:** both full copies were restored into fresh roots, and each
  reproduced the baseline release digest exactly. Full integrity validation of the
  authoring root found zero failures and zero editorial warnings.
- **Off-repo locations,** all beside the checkout:
  - SQLite backup: `../howardism-local-state-backup-2026-10-01`
  - curated sample authoring copy: `../howardism-fixtures`
- **Fresh clone:** with both content trees and the generated manifests removed,
  a fresh clone passed type-check, tests and an uncached sample build. This ran
  at `633502c4`, before the history was reorganized.

- **Private release (G1):** `content:acceptance` published release
  `41239a1c…`, the same digest as the G0 baseline. A second publish was a no-op
  with the same identity. The cold reconstruction downloaded 59.5 MB and the warm
  one 0 bytes, and the restored tree matched byte-for-byte.
- **Local trusted full build (G2):** the corpus and owned manifests were removed,
  then a cold and a warm `CONTENT_PROFILE=full VERCEL_ENV=production` build ran
  from the pinned release. Cold: 1,534 objects, 0 cache hits, 58.8 MB
  downloaded. Warm: 1,534 hits, 0 bytes. `content:verify-build` passed and
  scanned 12,942 output files.
- **Hosting config:** the protected `content-integration` GitHub environment has
  a required reviewer, the read-only keys and the account and bucket variables.
  Vercel production has the read-only keys and `CONTENT_PROFILE=full`.

The full corpus is still tracked. There has been no merge, no production
activation and no live GC.
