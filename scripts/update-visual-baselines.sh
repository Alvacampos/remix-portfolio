#!/usr/bin/env bash
# Regenerate visual-regression baselines inside Playwright's official
# Docker image so the resulting PNGs match the Linux runners on CI.
#
# Why Docker: Playwright screenshots are pixel-level. Fonts, sub-pixel
# antialiasing, and emoji rendering differ between macOS and Linux,
# so a baseline taken on a Mac fails on Ubuntu in CI. The Docker image
# is the standard fix.
#
# Usage:
#   npm run test:visual:update
#
# Pulls the image whose tag matches the local @playwright/test version
# so a Playwright bump produces matching baselines.

set -euo pipefail

PW_VERSION="$(node -e 'console.log(JSON.parse(require("fs").readFileSync("package.json","utf8")).devDependencies["@playwright/test"].replace(/^[^0-9]+/, ""))')"
IMAGE="mcr.microsoft.com/playwright:v${PW_VERSION}-jammy"

echo "Using image: ${IMAGE}"

docker run --rm \
  --platform=linux/amd64 \
  -v "$(pwd)":/work \
  -v "remix-portfolio-visual-node-modules:/work/node_modules" \
  -w /work \
  -e UPDATE_VISUAL=1 \
  -e CI=1 \
  --ipc=host \
  "${IMAGE}" \
  bash -c "npm ci && npx playwright test visual.spec.ts --project=chromium --update-snapshots"
# Note on --platform=linux/amd64: GitHub Actions runners are x86_64 but
# Apple Silicon Macs default to arm64 when pulling a multi-arch image.
# freetype's sub-pixel font rendering math diverges between the two
# architectures, so an arm64-generated baseline can differ from the
# x86_64-rendered CI run by ~0.4% of pixels — invisible to the eye but
# above the 0.2% diff budget. Forcing amd64 makes Docker emulate
# x86_64 via QEMU (3-5x slower regen on M-series, ~2-3 min total) but
# produces pixel-identical output to CI.
# Note on the named volume: the container needs `npm ci` to install Linux
# binaries (rollup-linux, esbuild-linux, etc), but bind-mounting the host's
# node_modules from a Mac would replace the macOS native binaries with
# Linux ones — breaking the host's `npm test` until you reinstall. Stashing
# node_modules in a named Docker volume keeps the install Linux-only and
# the host workspace untouched. The volume persists between runs so the
# install is fast on subsequent regens; remove it manually if a Playwright
# version bump pulls in incompatible deps:
#   docker volume rm remix-portfolio-visual-node-modules

echo "Baselines updated under tests/e2e/visual.spec.ts-snapshots/."
echo "Review the diff and commit the regenerated PNGs."
