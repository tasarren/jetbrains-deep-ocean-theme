#!/usr/bin/env node

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { appendFileSync, readFileSync } from "node:fs";

function version(properties) {
  const match = properties.match(/^pluginVersion\s*=\s*(\S+)\s*$/m);
  assert(match, "Missing pluginVersion in gradle.properties");
  return match[1];
}

function shouldPublish(eventName, current, previous) {
  assert(["push", "workflow_dispatch"].includes(eventName), "Unsupported release event");
  return eventName === "workflow_dispatch" || current !== previous;
}

if (process.argv.includes("--check")) {
  assert.equal(version("pluginVersion = 1.0.0\n"), "1.0.0");
  assert.equal(version("pluginVersion = 1.1.0-beta.1\n"), "1.1.0-beta.1");
  assert.throws(() => version("pluginName = Deep Ocean Dark\n"));
  assert(!shouldPublish("push", "1.0.0", "1.0.0"));
  assert(shouldPublish("push", "1.1.0", "1.0.0"));
  assert(shouldPublish("workflow_dispatch", "1.0.0", "1.0.0"));
  assert.throws(() => shouldPublish("pull_request", "1.1.0", "1.0.0"));
  console.log("Release gate checks passed.");
} else {
  const current = version(readFileSync("gradle.properties", "utf8"));
  let previous;
  if (process.env.GITHUB_EVENT_NAME === "push") {
    const event = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, "utf8"));
    assert(/^[a-f0-9]{40}$/.test(event.before) && !/^0+$/.test(event.before), "Missing previous main commit");
    previous = version(execFileSync("git", ["show", `${event.before}:gradle.properties`], { encoding: "utf8" }));
  }
  const publish = shouldPublish(process.env.GITHUB_EVENT_NAME, current, previous);
  appendFileSync(process.env.GITHUB_OUTPUT, `publish=${publish}\n`);
  console.log(publish ? `Publish requested for ${current}.` : `Skip publishing: pluginVersion remains ${current}.`);
}
