#!/usr/bin/env bash
# Point this demo at locally packed @0xkey-io/* packages from an sdk-js
# checkout, for local testing of unreleased SDK changes only.
#
#   scripts/use-local-sdk.sh /path/to/sdk-js   # pack + write overrides + install
#   scripts/use-local-sdk.sh --restore         # restore npm versions + install
#
# The sdk-js checkout must already be installed and built, e.g.
#   pnpm install --frozen-lockfile
#   pnpm exec turbo --filter "@0xkey-io/react-wallet-kit..." \
#     --filter "@0xkey-io/viem..." --filter "@0xkey-io/sdk-server..." build
#
# Tarballs go to .local-sdk/ (gitignored). package.json and pnpm-lock.yaml are
# backed up there and rewritten in place; never commit them while the local
# overrides are active. A committed `file:./.local-sdk/...` override also fails
# CI's frozen install, because the tarballs are not in the repository.
set -euo pipefail

DEMO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOCAL_DIR="$DEMO_DIR/.local-sdk"
BACKUP_DIR="$LOCAL_DIR/backup"
DEMO_PNPM=(corepack pnpm)

PACKAGES=(
  api-key-stamper
  attested-stamper
  core
  crypto
  encoding
  http
  iframe-stamper
  indexed-db-stamper
  react-wallet-kit
  sdk-browser
  sdk-server
  sdk-types
  viem
  wallet-stamper
  webauthn-stamper
)

usage() {
  sed -n '2,6p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'
  exit 2
}

restore() {
  if [[ ! -f "$BACKUP_DIR/package.json" || ! -f "$BACKUP_DIR/pnpm-lock.yaml" ]]; then
    echo "No local SDK backup in $BACKUP_DIR; nothing to restore." >&2
    exit 1
  fi
  cp "$BACKUP_DIR/package.json" "$DEMO_DIR/package.json"
  cp "$BACKUP_DIR/pnpm-lock.yaml" "$DEMO_DIR/pnpm-lock.yaml"
  rm -rf "$LOCAL_DIR"
  (cd "$DEMO_DIR" && "${DEMO_PNPM[@]}" install --frozen-lockfile)
  echo "Restored npm @0xkey-io/* versions."
}

apply() {
  local sdk_dir
  sdk_dir="$(cd "$1" && pwd)"
  if [[ ! -f "$sdk_dir/pnpm-workspace.yaml" || ! -d "$sdk_dir/packages/react-wallet-kit" ]]; then
    echo "$sdk_dir does not look like an sdk-js checkout." >&2
    exit 1
  fi
  for pkg in "${PACKAGES[@]}"; do
    if [[ ! -d "$sdk_dir/packages/$pkg/dist" ]]; then
      echo "packages/$pkg/dist is missing; build sdk-js first (see header)." >&2
      exit 1
    fi
  done

  if [[ ! -f "$BACKUP_DIR/package.json" ]]; then
    if ! git -C "$DEMO_DIR" diff --quiet -- package.json pnpm-lock.yaml; then
      echo "package.json or pnpm-lock.yaml has uncommitted changes; commit or stash them first." >&2
      exit 1
    fi
    mkdir -p "$BACKUP_DIR"
    cp "$DEMO_DIR/package.json" "$DEMO_DIR/pnpm-lock.yaml" "$BACKUP_DIR/"
  fi
  find "$LOCAL_DIR" -maxdepth 1 -name '*.tgz' -delete

  for pkg in "${PACKAGES[@]}"; do
    # pnpm pack rewrites workspace: ranges to the checkout's real versions.
    (cd "$sdk_dir/packages/$pkg" && pnpm pack --pack-destination "$LOCAL_DIR" >/dev/null)
  done

  (cd "$sdk_dir" && git rev-parse HEAD) >"$LOCAL_DIR/SDK_COMMIT"

  LOCAL_DIR="$LOCAL_DIR" BACKUP_DIR="$BACKUP_DIR" DEMO_DIR="$DEMO_DIR" node <<'NODE'
const fs = require("node:fs")
const path = require("node:path")
const { LOCAL_DIR, BACKUP_DIR, DEMO_DIR } = process.env
const pkg = JSON.parse(fs.readFileSync(path.join(BACKUP_DIR, "package.json"), "utf8"))
const overrides = { ...(pkg.pnpm?.overrides ?? {}) }
for (const file of fs.readdirSync(LOCAL_DIR).filter((f) => f.endsWith(".tgz"))) {
  const name = file.match(/^0xkey-io-(.+)-\d+\.\d+\.\d+(?:-[\w.]+)?\.tgz$/)?.[1]
  if (!name) throw new Error(`unexpected tarball name: ${file}`)
  overrides[`@0xkey-io/${name}`] = `file:./.local-sdk/${file}`
}
pkg.pnpm = { ...(pkg.pnpm ?? {}), overrides }
fs.writeFileSync(path.join(DEMO_DIR, "package.json"), JSON.stringify(pkg, null, 2) + "\n")
NODE

  (cd "$DEMO_DIR" && "${DEMO_PNPM[@]}" install --no-frozen-lockfile)
  echo "Demo now uses local sdk-js $(cat "$LOCAL_DIR/SDK_COMMIT")."
  echo "Do not commit package.json or pnpm-lock.yaml; run '$0 --restore' when done."
}

case "${1:-}" in
  "" | -h | --help) usage ;;
  --restore) restore ;;
  *) apply "$1" ;;
esac
