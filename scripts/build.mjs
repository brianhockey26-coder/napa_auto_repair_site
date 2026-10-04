import { copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function normalizeBaseUrl(origin) {
  let url;
  try {
    url = new URL(origin);
  } catch {
    throw new Error("Origin must be a valid HTTPS base URL");
  }

  if (
    url.protocol !== "https:" ||
    !url.hostname ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  ) {
    throw new Error("Origin must be a valid HTTPS base URL without credentials, query, or fragment");
  }

  url.pathname = `${url.pathname.replace(/\/+$/, "")}/`;
  return url.toString();
}

function escapeXml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export async function buildSite({ origin, outputDir }) {
  const baseUrl = normalizeBaseUrl(origin);
  const resolvedOutput = path.resolve(outputDir);
  const sourceHtml = await readFile(path.join(projectRoot, "src", "index.html"), "utf8");
  const html = sourceHtml.replaceAll("{{SITE_ORIGIN}}", baseUrl);

  const robots = [
    "User-agent: Googlebot",
    "Allow: /",
    "",
    "User-agent: OAI-SearchBot",
    "Allow: /",
    "",
    "User-agent: *",
    "Allow: /",
    "",
    `Sitemap: ${baseUrl}sitemap.xml`,
    "",
  ].join("\n");

  const sitemap = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    "  <url>",
    `    <loc>${escapeXml(baseUrl)}</loc>`,
    "  </url>",
    "</urlset>",
    "",
  ].join("\n");

  await rm(resolvedOutput, { recursive: true, force: true });
  await mkdir(resolvedOutput, { recursive: true });
  await Promise.all([
    writeFile(path.join(resolvedOutput, "index.html"), html, "utf8"),
    copyFile(path.join(projectRoot, "src", "styles.css"), path.join(resolvedOutput, "styles.css")),
    writeFile(path.join(resolvedOutput, "robots.txt"), robots, "utf8"),
    writeFile(path.join(resolvedOutput, "sitemap.xml"), sitemap, "utf8"),
  ]);

  return { baseUrl, outputDir: resolvedOutput };
}

function parseArguments(argv) {
  let origin;
  let outputDir = path.join(projectRoot, "dist");

  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === "--origin") origin = argv[++index];
    else if (argv[index] === "--output") outputDir = argv[++index];
    else throw new Error(`Unknown argument: ${argv[index]}`);
  }

  if (!origin) throw new Error("Missing required --origin argument");
  if (!outputDir) throw new Error("Missing value for --output");
  return { origin, outputDir };
}

const isCli = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isCli) {
  try {
    const result = await buildSite(parseArguments(process.argv.slice(2)));
    process.stdout.write(`Built static site for ${result.baseUrl} in ${result.outputDir}\n`);
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}
