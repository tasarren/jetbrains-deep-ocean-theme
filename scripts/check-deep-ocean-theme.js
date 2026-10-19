#!/usr/bin/env node

import { readFile } from "fs/promises";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import assert from "node:assert/strict";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const RES = join(ROOT, "src/main/resources");
const THEMES = [
  "deep_ocean_dark.theme.json",
  "deep_ocean_dark_islands.theme.json",
  "deep_ocean_vivid.theme.json",
  "deep_ocean_vivid_islands.theme.json",
];
const SCHEMES = ["deep_ocean_dark.xml", "deep_ocean_vivid.xml"];

function flatten(value, path = "", result = {}) {
  for (const [key, child] of Object.entries(value)) {
    const name = path ? `${path}.${key}` : key;
    if (child && typeof child === "object") flatten(child, name, result);
    else result[name] = child;
  }
  return result;
}

function walk(value, tokens, path = "") {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    for (const [key, child] of Object.entries(value)) {
      walk(child, tokens, path ? `${path}.${key}` : key);
    }
    return;
  }
  if (typeof value !== "string") return;

  if (/^#[0-9a-fA-F]+$/.test(value)) {
    if (!/^#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/.test(value)) {
      throw new Error(`Invalid hex ${value} at ${path}`);
    }
    return;
  }

  if (value === "" || value === "true" || value === "false") return;
  if (/^[0-9.,-]+$/.test(value)) return;
  if (/^[A-Za-z][A-Za-z0-9]*$/.test(value) && !tokens.has(value)) {
    throw new Error(`Unresolved token "${value}" at ${path}`);
  }
}

for (const file of THEMES) {
  const theme = JSON.parse(await readFile(join(RES, file), "utf8"));
  const tokens = new Set(Object.keys(theme.colors ?? {}));
  walk(theme.ui, tokens);

  if (!theme.name || !theme.editorScheme) {
    throw new Error(`${file}: missing name or editorScheme`);
  }
  if (file.includes("islands") && theme.parentTheme !== "Islands Dark") {
    throw new Error(`${file}: Islands theme must inherit from Islands Dark`);
  }

  const ui = flatten(theme.ui);
  const resolve = (value) => theme.colors[value] ?? value;
  assert.equal(resolve(ui["Button.default.foreground"]), "#090B10", `${file}: cyan buttons need dark labels`);
  for (const key of ["Panel.background", "Tree.background", "List.background", "Table.background", "ToolWindow.Header.inactiveBackground"]) {
    assert.equal(resolve(ui[key]), "#0F111A", `${file}: ${key} must match editor`);
  }
  for (const key of ["MainWindow.background", "MainToolbar.background", "MainToolbar.inactiveBackground", "StatusBar.background", "ToolWindow.Stripe.background"]) {
    assert.equal(resolve(ui[key]), "#090B10", `${file}: ${key} must use dark frame`);
  }
  assert.equal(resolve(ui["ToolWindow.Header.background"]), "#181A1F", `${file}: header must remain subtle`);
  if (file.includes("islands")) {
    assert.equal(ui["Island.inactiveAlpha"], 0, `${file}: no inactive washout`);
    assert.equal(ui["Island.toolWindowAlpha"], 0, `${file}: no tool-window washout`);
    for (const os of ["mac", "windows", "linux"]) {
      assert.equal(ui[`Island.inactiveAlphaInStatusBar.os.${os}`], 0, `${file}: no status-bar washout on ${os}`);
    }
    for (const key of ["MainWindow.background", "MainToolbar.background", "ToolWindow.Stripe.background", "StatusBar.background"]) {
      assert.equal(resolve(ui[`alt.${key}`]), "#090B10", `${file}: alt.${key} must not inherit gray`);
    }
  }
}

for (const file of SCHEMES) {
  const xml = await readFile(join(RES, file), "utf8");
  for (const match of xml.matchAll(/value="([0-9A-Fa-f]+)"/g)) {
    const value = match[1];
    if (value.length <= 2) continue; // font type / effect type / boolean-ish values
    if (value.length !== 6 && value.length !== 8) {
      throw new Error(`${file}: invalid hex ${value}`);
    }
  }
  if (!xml.includes('<scheme name="Deep Ocean')) {
    throw new Error(`${file}: scheme name not renamed`);
  }
  assert.match(xml, /name="GUTTER_BACKGROUND" value="0F111A"/i, `${file}: gutter must match editor`);
  assert.match(xml, /name="TEXT">\s*<value>\s*<option name="BACKGROUND" value="0F111A"/i, `${file}: editor background changed`);
}

const islands = JSON.parse(
  await readFile(join(RES, "deep_ocean_dark_islands.theme.json"), "utf8")
).ui.Island;
if (
  islands.arc !== 20 ||
  islands["arc.compact"] !== 16 ||
  islands.borderWidth !== 5 ||
  islands["borderWidth.compact"] !== 4
) {
  throw new Error("Islands scalar/compact geometry was flattened incorrectly");
}

const vivid = JSON.parse(
  await readFile(join(RES, "deep_ocean_vivid.theme.json"), "utf8")
);
if (
  vivid.colors.accentColor !== "#2BE7E0" ||
  vivid.colors.foregroundColor !== "#FFFFFF"
) {
  throw new Error("Vivid tokens not applied");
}

const plugin = await readFile(join(RES, "META-INF/plugin.xml"), "utf8");
const providers = [...plugin.matchAll(/themeProvider[^>]+path="([^"]+)"/g)].map(
  (m) => m[1]
);
if (providers.length !== 4 || providers.some((p) => p.includes("one_dark"))) {
  throw new Error(`Expected four Deep Ocean theme providers, got ${providers}`);
}

console.log("Deep Ocean theme check passed.");
