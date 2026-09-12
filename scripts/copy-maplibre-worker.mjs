// Turbopack doesn't resolve maplibre-gl's `import.meta.url`-based worker lookup, and its
// separate worker script (which itself imports a sibling "shared" chunk via a relative
// path) can't be bundled through the asset pipeline without breaking that import. Serving
// both files verbatim from /public, side by side as they are in the package, sidesteps the
// bundler entirely — see maplibregl.setWorkerUrl() in search-map.tsx.
import { copyFileSync, mkdirSync } from 'node:fs';

const files = ['maplibre-gl-worker.mjs', 'maplibre-gl-shared.mjs'];
const destDir = 'public/vendor/maplibre-gl';

mkdirSync(destDir, { recursive: true });
for (const file of files) {
  copyFileSync(`node_modules/maplibre-gl/dist/${file}`, `${destDir}/${file}`);
}
