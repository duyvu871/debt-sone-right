import fs from "node:fs";

function parseSemverLoose(version) {
  // Accepts strings like "16.2.0", "^16.2.0", ">=16.0.7".
  const match = String(version).match(/(\d+)\.(\d+)\.(\d+)/);
  if (!match) return null;
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
  };
}

function gte(a, b) {
  if (a.major !== b.major) return a.major > b.major;
  if (a.minor !== b.minor) return a.minor > b.minor;
  return a.patch >= b.patch;
}

const pkg = JSON.parse(
  fs.readFileSync(new URL("../package.json", import.meta.url), "utf8"),
);

const next = parseSemverLoose(pkg?.dependencies?.next);
const react = parseSemverLoose(pkg?.dependencies?.react);

const minNext = { major: 16, minor: 0, patch: 7 };
const minReact = { major: 19, minor: 2, patch: 1 };

let ok = true;

if (!next || !gte(next, minNext)) {
  ok = false;
  console.error(
    `[security-version-gate] Invalid next version. Required: >= ${minNext.major}.${minNext.minor}.${minNext.patch}, ` +
      `found: ${pkg?.dependencies?.next ?? "undefined"}`,
  );
}

if (!react || !gte(react, minReact)) {
  ok = false;
  console.error(
    `[security-version-gate] Invalid react version. Required: >= ${minReact.major}.${minReact.minor}.${minReact.patch}, ` +
      `found: ${pkg?.dependencies?.react ?? "undefined"}`,
  );
}

if (!ok) {
  console.error(
    "[security-version-gate] Fail-fast: update dependencies to patched versions to prevent React2Shell RSC exploits.",
  );
  process.exit(1);
}

console.log(
  "[security-version-gate] Next.js and React versions satisfy the security requirements.",
);
