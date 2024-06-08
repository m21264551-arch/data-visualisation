import { gzipSync } from "node:zlib";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const budgets = {
  js: 90 * 1024,
  css: 10 * 1024,
};

const assetsDir = join(process.cwd(), "dist", "assets");
const files = readdirSync(assetsDir);

const totals = files.reduce(
  (acc, file) => {
    const extension = file.endsWith(".js")
      ? "js"
      : file.endsWith(".css")
        ? "css"
        : null;

    if (!extension) {
      return acc;
    }

    const gzipBytes = gzipSync(readFileSync(join(assetsDir, file))).length;
    acc[extension] += gzipBytes;
    return acc;
  },
  { js: 0, css: 0 }
);

const failures = Object.entries(budgets).filter(
  ([extension, limit]) => totals[extension] > limit
);

for (const [extension, total] of Object.entries(totals)) {
  const limit = budgets[extension];
  console.log(
    `${extension.toUpperCase()} gzip: ${(total / 1024).toFixed(1)} KB / ${(limit / 1024).toFixed(1)} KB`
  );
}

if (failures.length > 0) {
  throw new Error(
    `Bundle budget exceeded: ${failures
      .map(([extension]) => extension.toUpperCase())
      .join(", ")}`
  );
}
