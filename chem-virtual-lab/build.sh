#!/usr/bin/env bash
# Builds a single self-contained page: dist/chem-virtual-lab.html
set -euo pipefail
cd "$(dirname "$0")"
out=dist/chem-virtual-lab.html
mkdir -p dist
{
  cat src/shell.html
  echo '<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>'
  echo '<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js"></script>'
  echo '<script>'; cat src/lib.js; echo '</script>'
  echo '<script>(function(){'; cat src/content1.js src/content2.js src/content3.js; echo 'window.CVL = { TOPICS: TOPICS, EX: EX };})();</script>'
  echo '<script>'; cat src/app.js; echo '</script>'
} > "$out"
echo "built $out ($(wc -c < "$out") bytes)"
