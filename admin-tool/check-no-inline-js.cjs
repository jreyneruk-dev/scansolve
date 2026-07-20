#!/usr/bin/env node
// Regression guard for issue #34 (stored XSS via org name -> admin privilege escalation).
//
// Inline event handlers must never be built by interpolation. HTML-escaping is not
// enough there: the browser HTML-decodes an attribute before the JS parser sees it,
// so an escaped &#x27; round-trips to a literal ' and breaks out of the JS string.
// Untrusted values belong in data-* attributes, read back via dataset.
//
// Run: node admin-tool/check-no-inline-js.cjs
const fs = require("fs");
const path = require("path");

const file = path.join(__dirname, "server.js");
const src = fs.readFileSync(file, "utf8");

// capture the *value* of every on*="..." handler, then flag any that interpolates
const bad = [];
for (const m of src.matchAll(/\son[a-z]+="([^"]*)"/gi)) {
  if (m[1].includes("${")) {
    const line = src.slice(0, m.index).split("\n").length;
    bad.push(`  server.js:${line}  ${m[0].trim().slice(0, 90)}`);
  }
}

if (bad.length) {
  console.error(
    `\n✗ ${bad.length} inline handler(s) built by interpolation — this is the issue #34 XSS pattern:\n` +
      bad.join("\n") +
      `\n\nUse data-* attributes + the delegated click listener instead.\n`,
  );
  process.exit(1);
}

// sanity: the delegated listener and the data-driven buttons must both still exist
const required = ["delete-btn", "ban-btn", "unban-btn", "copy-code-btn", "el.dataset"];
const missing = required.filter((r) => !src.includes(r));
if (missing.length) {
  console.error(`\n✗ expected wiring missing from server.js: ${missing.join(", ")}\n`);
  process.exit(1);
}

console.log("✓ no interpolated inline handlers; data-* wiring intact");
