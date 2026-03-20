import fs from "node:fs";
import path from "node:path";

const SRC_ROOT = path.resolve(process.cwd(), "src");

const LAYERS = [
  { name: "Shared", dir: "shared", level: 0 },
  { name: "Entities", dir: "entities", level: 1 },
  { name: "Features", dir: "features", level: 2 },
  { name: "Widgets", dir: "widgets", level: 3 },
  { name: "App", dir: "App", level: 4 }, // src/App/*
  { name: "Views", dir: path.join("app"), level: 5 }, // files under src/app/*
];

function getLayerFromFile(absFilePath) {
  const rel = path.relative(SRC_ROOT, absFilePath);
  if (rel.startsWith(`shared${path.sep}`)) return "Shared";
  if (rel.startsWith(`entities${path.sep}`)) return "Entities";
  if (rel.startsWith(`features${path.sep}`)) return "Features";
  if (rel.startsWith(`widgets${path.sep}`)) return "Widgets";
  if (rel.startsWith(`app${path.sep}`)) return "Views";
  if (rel.startsWith(`App${path.sep}`)) return "App";
  return null;
}

function getLayerLevel(layerName) {
  return LAYERS.find((l) => l.name === layerName)?.level ?? null;
}

function getSliceDomainForFeatures(absFilePath) {
  const rel = path.relative(SRC_ROOT, absFilePath);
  if (!rel.startsWith(`features${path.sep}`)) return null;
  const parts = rel.split(path.sep);
  // src/features/<domain>/...
  return parts[1] ?? null;
}

function resolveImportToAbs(_fromFile, specifier) {
  // We only enforce for project-local absolute imports using "@/..."
  if (!specifier.startsWith("@/")) return null;
  const withoutAt = specifier.slice(2); // "src/..."
  const absTarget = path.resolve(process.cwd(), "src", withoutAt);
  if (!absTarget.startsWith(SRC_ROOT)) return null;
  return absTarget;
}

function listTsFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // skip build caches
      if (entry.name === ".next" || entry.name === "node_modules") continue;
      out.push(...listTsFiles(abs));
    } else if (entry.isFile()) {
      if (/\.(ts|tsx|mts|cts)$/.test(entry.name)) out.push(abs);
    }
  }
  return out;
}

function extractImportSpecifiers(fileContent) {
  const fromRegex = /\bfrom\s+['"](@\/[^'"]+)['"]/g;
  const importRegex = /\bimport\s+['"](@\/[^'"]+)['"]/g;
  const specsFrom =
    // eslint-disable-next-line -- matchAll typing differs across TS/ESM targets; it's safe here
    [...fileContent.matchAll(fromRegex)].map((m) => m[1]);
  const specsImport = [...fileContent.matchAll(importRegex)].map((m) => m[1]);
  return [...specsFrom, ...specsImport];
}

const files = listTsFiles(SRC_ROOT);
const errors = [];

for (const absFile of files) {
  const layer = getLayerFromFile(absFile);
  if (!layer) continue;

  const content = fs.readFileSync(absFile, "utf8");
  const specs = extractImportSpecifiers(content);

  for (const specifier of specs) {
    const absTarget = resolveImportToAbs(absFile, specifier);
    if (!absTarget) continue;

    const targetLayer = getLayerFromFile(absTarget);
    if (!targetLayer) continue;

    const sourceLevel = getLayerLevel(layer);
    const targetLevel = getLayerLevel(targetLayer);
    if (sourceLevel === null || targetLevel === null) continue;

    // Dependency rule: upper layers may import lower layers only.
    // level: Shared(0) -> ... -> App(5)
    if (sourceLevel < targetLevel) {
      errors.push(
        `Layer violation: ${absFile} (${layer}) imports ${specifier} (${targetLayer}). Imports must go downward only.`,
      );
      continue;
    }

    // Additional rule: Features cannot import across feature domains.
    if (layer === "Features" && targetLayer === "Features") {
      const srcDomain = getSliceDomainForFeatures(absFile);
      const dstDomain = getSliceDomainForFeatures(absTarget);
      if (srcDomain && dstDomain && srcDomain !== dstDomain) {
        errors.push(
          `Feature cross-domain import: ${absFile} (domain=${srcDomain}) imports ${specifier} (domain=${dstDomain}). Use public API via respective slices instead of direct imports.`,
        );
      }
    }
  }
}

if (errors.length > 0) {
  console.error("[layer-imports-check] Found forbidden imports:");
  for (const e of errors) console.error(` - ${e}`);
  process.exit(1);
}

console.log("[layer-imports-check] Layer dependency rules satisfied.");
