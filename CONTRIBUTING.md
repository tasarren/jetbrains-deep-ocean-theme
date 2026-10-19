# Contributing

## Branches and PRs

- Start feature/fix branches from `next`; open PRs into `next` and squash merge them.
- For a release, open a PR from this repository's `next` into `main`. Use a merge commit, not squash, so repeated releases preserve shared ancestry.
- Both branches require passing CI, branch-policy checks, resolved conversations, and PRs. Independent approval is not required for this solo-maintainer repository.
- Do not force push either branch or delete `next` after a release. Never merge upstream One Dark history; port selected changes as new commits.

## Theme sources

Canonical sources are `src/main/resources/deep_ocean_dark.xml` and the regular/Islands `deep_ocean_dark*.theme.json` files. Preserve existing editor attribute coverage and literal dotted UI keys such as `arc.compact`.

Generate Vivid variants after changing base resources or Vivid mappings:

```bash
node scripts/create-deep-ocean-vivid-variants.js
node scripts/check-deep-ocean-theme.js
node scripts/check-branch-policy.js --check
./gradlew buildPlugin --no-daemon
python3 scripts/check-plugin.py
```

Use Java 25 and Node 24 LTS. No npm dependencies. Output: `build/distributions/deep-ocean-dark-1.0.0.zip`. CI also checks that Vivid regeneration leaves no diff and validates the Gradle wrapper.

Minimum supported IDE is 2025.3 (build 253); development target is 2026.1. Before publishing, smoke-test all four providers in both versions and inspect New UI Islands rendering. Classic UI does not support native Islands geometry. Plugin Verifier alone cannot establish visual correctness.

## Publishing

Update `pluginVersion` and release notes on `next`, then merge a release PR into `main`. Run **Publish** manually on `main` after compatibility checks. Marketplace ownership of `com.deepocean.theme` and a valid publishing token are prerequisites; repository setup does not create a Marketplace listing.

Store `PUBLISH_TOKEN` only in GitHub's protected `release` environment, restricted to `main`. The workflow passes it through `ORG_GRADLE_PROJECT_intellijPlatformPublishingToken`. Never put credentials in files, command arguments, logs, or PR workflows.

## Attribution

Keep the ISC license, Mark Skelton copyright, and README credit to [One Dark](https://github.com/one-dark/jetbrains-one-dark-theme). Upstream history is available there; this repository's history starts at the Deep Ocean rebrand.
