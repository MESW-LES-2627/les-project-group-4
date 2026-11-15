// Runs the merge-base acceptance suite for the report.
//
//   npm run acceptance:baseline -- --base <sha> --out reports/base.json
//
// The step is always green: when the baseline cannot run, the report falls
// back to reporting the head results without a comparison.

import { runBaseline } from "./baseline";

function argValue(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

const base = argValue("--base");
const out = argValue("--out") ?? "reports/base.json";

if (!base) {
  console.error(
    "Usage: npm run acceptance:baseline -- --base <sha> [--out reports/base.json]",
  );
  process.exit(1);
}

const result = runBaseline({ base, out });

if (result.status === "written") {
  console.log(`Baseline written to ${result.file}`);
} else {
  console.log(
    `Baseline skipped (${result.reason}). The report will not compare against the merge-base.`,
  );
}
