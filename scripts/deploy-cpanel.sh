#!/usr/bin/env bash
# Uploads greenpages-cpanel.zip (from scripts/package-cpanel.ps1) to the
# Onic Host cPanel account and swaps it in as the live build.
# This deploys to PRODUCTION - only run it when a deploy was explicitly asked for.
# Usage (repo root, Git Bash):  bash scripts/deploy-cpanel.sh
set -euo pipefail
cd "$(dirname "$0")/.."

HOST="greenpag@144.76.111.139"
KEY="$HOME/.ssh/greenpages_cpanel"
SSH=(ssh -i "$KEY" -o BatchMode=yes "$HOST")

test -f greenpages-cpanel.zip || { echo "Run scripts/package-cpanel.ps1 first"; exit 1; }

scp -q -i "$KEY" greenpages-cpanel.zip "$HOST:~/greenpages-cpanel.zip"

# package.json changes still need "Run NPM Install" in cPanel's Node.js page.
"${SSH[@]}" 'set -e
cd ~
rm -rf deploy-stage && mkdir deploy-stage && unzip -q greenpages-cpanel.zip -d deploy-stage
test -f deploy-stage/.next/BUILD_ID
chmod -R u=rwX,go=rX deploy-stage
cd greenpages
rm -rf .next.old && mv .next .next.old && mv ~/deploy-stage/.next ./.next
cp -r ~/deploy-stage/public/. ./public/
cp ~/deploy-stage/server.js ~/deploy-stage/next.config.js ~/deploy-stage/package.json ~/deploy-stage/package-lock.json ./
mkdir -p tmp && touch tmp/restart.txt
rm -rf ~/deploy-stage ~/greenpages-cpanel.zip .next.old
echo "Deployed build $(cat .next/BUILD_ID)"'
