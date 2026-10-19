#!/usr/bin/env node

import { readFile, writeFile } from "fs/promises";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

// Deep Ocean base -> Deep Ocean Vivid. Keys are uppercase without "#".
const VIVID_MAP = {
  "717CB4": "8D9CD4",
  "82AAFF": "4DC8FF",
  "84FFFF": "2BE7E0",
  "84FFFF35": "2BE7E035",
  "89DDFF": "4DE1FF",
  "C3E88D": "6BE38F",
  "8F93A2": "B5BDD2",
  "C3CEE3": "FFFFFF",
  "C792EA": "D96CFF",
  "FFCB6B": "FFD166",
  "F07178": "FF5C7A",
  "F78C6C": "FF8A65",
  "FF5370": "FF3B5C",
  "FF9E60": "FFB067",
};

const VIVID_ISLANDS_COLORS = {
  accentColor: "#2BE7E0",
  backgroundColor: "#0F111A",
  panelColor: "#0F111A",
  borderColor: "#292D3E",
  errorForeground: "#FF3B5C",
  foregroundColor: "#FFFFFF",
  foregroundSoft: "#B5BDD2",
  hoverBackground: "#1F2233",
  infoForeground: "#8D9CD4",
  notificationBackground: "#181A1F",
  selectionBackground: "#222533",
  selectionForeground: "#FFFFFF",
  selectionInactiveBackground: "#1A1C25",
  borderTransparent: "#00000000",
};

const VIVID_ISLANDS_OVERRIDES = {
  "*.selectionInactiveBackground": "selectionBackground",
  "AlertDialog.background": "backgroundColor",
  "EditorTabs.underlinedBorderColor": "borderColor",
  "EditorTabs.underlinedTabBackground": "selectionInactiveBackground",
  "EditorTabs.underlinedTabForeground": "#FFFFFF",
  "MainWindow.Tab.selectedBackground": "selectionBackground",
  "Plugins.SectionHeader.background": "panelColor",
  "ToolWindow.HeaderTab.selectedBackground": "selectionBackground",
  "VersionControl.Log.Commit.currentBranchBackground": "panelColor",
  "WelcomeScreen.Projects.actions.background": "selectionBackground",
};

function replaceHexes(source) {
  // XML color-scheme values often omit "#"; JSON values always include it.
  const withBareXmlValues = source.replace(
    /(value=")(#?)([0-9a-fA-F]{6}(?:[0-9a-fA-F]{2})?)(")/g,
    (match, prefix, hash, raw, suffix) => {
      const mapped = VIVID_MAP[raw.toUpperCase()];
      return mapped ? `${prefix}${hash}${mapped}${suffix}` : match;
    }
  );

  return withBareXmlValues.replace(
    /#[0-9a-fA-F]{6}(?:[0-9a-fA-F]{2})?/g,
    (value) => {
      const raw = value.slice(1).toUpperCase();
      const mapped = VIVID_MAP[raw];
      return mapped ? `#${mapped}` : value;
    }
  );
}

function setUiPath(root, path, value) {
  const parts = path.split(".");
  let cur = root;
  let i = 0;

  while (i < parts.length - 1) {
    let matched = false;

    for (let j = parts.length - 1; j > i; j--) {
      const key = parts.slice(i, j + 1).join(".");
      if (!Object.prototype.hasOwnProperty.call(cur, key)) continue;

      if (j === parts.length - 1) {
        cur[key] = value;
        return;
      }

      const next = cur[key];
      if (next && typeof next === "object" && !Array.isArray(next)) {
        cur = next;
        i = j + 1;
        matched = true;
        break;
      }
    }

    if (matched) continue;

    const key = parts[i];
    if (!cur[key] || typeof cur[key] !== "object" || Array.isArray(cur[key])) {
      cur[key] = {};
    }
    cur = cur[key];
    i++;
  }

  cur[parts[i]] = value;
}

async function buildVividTheme(inputPath, outputPath, { name, islands }) {
  const source = await readFile(join(ROOT, inputPath), "utf8");
  const theme = JSON.parse(replaceHexes(source));

  theme.name = name;
  theme.editorScheme = "/deep_ocean_vivid.xml";

  if (islands) {
    theme.colors = { ...theme.colors, ...VIVID_ISLANDS_COLORS };
    for (const [path, value] of Object.entries(VIVID_ISLANDS_OVERRIDES)) {
      setUiPath(theme.ui, path, value);
    }
  }

  await writeFile(join(ROOT, outputPath), JSON.stringify(theme, null, 2) + "\n");
}

async function main() {
  const baseXml = await readFile(
    join(ROOT, "src/main/resources/deep_ocean_dark.xml"),
    "utf8"
  );
  const vividXml = replaceHexes(baseXml).replace(
    '<scheme name="Deep Ocean Dark"',
    '<scheme name="Deep Ocean Vivid"'
  );

  await writeFile(
    join(ROOT, "src/main/resources/deep_ocean_vivid.xml"),
    vividXml
  );
  await buildVividTheme(
    "src/main/resources/deep_ocean_dark.theme.json",
    "src/main/resources/deep_ocean_vivid.theme.json",
    { name: "Deep Ocean Vivid", islands: false }
  );
  await buildVividTheme(
    "src/main/resources/deep_ocean_dark_islands.theme.json",
    "src/main/resources/deep_ocean_vivid_islands.theme.json",
    { name: "Deep Ocean Vivid Islands", islands: true }
  );

  console.log("Wrote deep_ocean_vivid.xml + Vivid regular/Islands theme JSON files.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
