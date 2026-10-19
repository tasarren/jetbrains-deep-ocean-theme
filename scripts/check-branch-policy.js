#!/usr/bin/env node

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

function allowed(pr) {
  const sameRepo = pr.head.repo?.full_name === pr.base.repo.full_name;
  if (pr.base.ref === "main") return sameRepo && pr.head.ref === "next";
  return pr.base.ref === "next";
}

if (process.argv.includes("--check")) {
  const pr = (base, head, repo = "owner/project") => ({
    base: { ref: base, repo: { full_name: "owner/project" } },
    head: { ref: head, repo: repo && { full_name: repo } },
  });
  assert(allowed(pr("main", "next")));
  assert(!allowed(pr("main", "next", "fork/project")));
  assert(!allowed(pr("main", "feature")));
  assert(!allowed(pr("main", "next", null)));
  assert(allowed(pr("next", "feature")));
  assert(allowed(pr("next", "main", "fork/project")));
  assert(allowed(pr("next", "main"))); // Allow post-release sync PRs.
  assert(!allowed(pr("other", "feature")));
  console.log("Branch policy checks passed.");
} else {
  const event = JSON.parse(await readFile(process.env.GITHUB_EVENT_PATH, "utf8"));
  assert(allowed(event.pull_request), "Feature PRs target next; main accepts only this repository's next.");
}
