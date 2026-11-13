import type { AtResult, AtStatus, AtSummary } from "../../../tools/acceptance/report";
import type { Registry } from "../../../tools/acceptance/registry";

export const registry: Registry = {
  repository: "owner/repo",
  stories: {
    "US-15": {
      issue: 37,
      title: "Set my location",
      ats: [
        { id: "AT-1", title: "City" },
        { id: "AT-2", title: "Geolocation" },
        { id: "AT-3", title: "Permission denied" },
      ],
    },
  },
};

export function atResult(
  key: string,
  status: AtStatus,
  options: {
    message?: string;
    line?: number;
    tests?: number;
    issue?: number;
  } = {},
): AtResult {
  const [story, at] = key.split("/");
  const count = options.tests ?? 1;

  return {
    key,
    story,
    at,
    title: at,
    issue: options.issue ?? 37,
    known: true,
    status,
    tests: Array.from({ length: count }, (_, index) => ({
      story,
      at,
      file: `tests/acceptance/US-15/${at}-${index}.test.ts`,
      line: options.line ?? 12,
      fullName: `${at} test ${index}`,
      status: status === "failed" ? "failed" : "passed",
      messages:
        status === "failed" && index === 0
          ? [options.message ?? "failed"]
          : [],
    })),
  };
}

export function summaryOf(results: AtResult[]): AtSummary {
  return { results, untagged: 0, tagged: results.length };
}
