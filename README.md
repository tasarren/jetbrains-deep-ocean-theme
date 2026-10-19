# Deep Ocean Dark

A blue-black dark theme for JetBrains IDEs, with regular, Islands, and Vivid variants.

Repository: [tasarren/jetbrains-one-dark-theme](https://github.com/tasarren/jetbrains-one-dark-theme).

## Themes

- **Deep Ocean Dark** — balanced deep-ocean surfaces with coral, cyan, teal, and violet syntax accents.
- **Deep Ocean Dark Islands** — Islands layout with the same palette.
- **Deep Ocean Vivid** — brighter text, stronger accents, and saturated syntax colors.
- **Deep Ocean Vivid Islands** — Islands layout with the Vivid palette.

## Setup

Requires JetBrains IDE 2025.3 or later. Build with `./gradlew buildPlugin`, or download a ZIP from a successful [CI run](https://github.com/tasarren/jetbrains-one-dark-theme/actions/workflows/ci.yml). In `Settings | Plugins`, use the gear menu's **Install Plugin from Disk…** and select `deep-ocean-dark-1.0.0.zip`.

Then go to `Settings | Appearance & Behavior | Appearance` and choose one of the four themes. Native Islands layout requires New UI; Classic UI retains the colors without Islands rounding and gaps.

## Development

Feature and fix PRs target `next`. Release PRs merge `next` into protected `main`; Marketplace publishing is a separate manual action. See [CONTRIBUTING.md](CONTRIBUTING.md).

## Attribution

Based on the ISC-licensed [One Dark theme](https://github.com/one-dark/jetbrains-one-dark-theme) by Mark Skelton, retaining its editor attribute coverage and UI structure. Material Deep Ocean provided visual palette inspiration; no Material plugin code or assets are bundled. Original copyright and license notices remain in [LICENSE](LICENSE) and the packaged plugin.

## License

ISC. See [LICENSE](LICENSE).
