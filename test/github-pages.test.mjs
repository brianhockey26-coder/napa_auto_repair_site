import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("workflow_tests_builds_and_deploys_pages", async () => {
  const workflow = await readFile(new URL("../.github/workflows/deploy-pages.yml", import.meta.url), "utf8");

  for (const required of [
    "actions/checkout@v4",
    "actions/setup-node@v4",
    "actions/configure-pages@v5",
    "actions/upload-pages-artifact@v3",
    "actions/deploy-pages@v4",
    "node --test",
    "steps.pages.outputs.base_url",
    "PAGES_BASE_URL",
    "HTTPS_BASE_URL",
    "path: dist",
  ]) {
    assert.match(workflow, new RegExp(required.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }

  assert.match(workflow, /pages:\s*write/);
  assert.match(workflow, /id-token:\s*write/);
  assert.match(workflow, /environment:\s*\n\s*name:\s*github-pages/);
  assert.match(workflow, /enablement:\s*true/);
  assert.match(workflow, /PAGES_BASE_URL\/http:\\\/\\\/\/https:\\\/\\\//);
});
