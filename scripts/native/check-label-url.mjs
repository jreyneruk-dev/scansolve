// G6: the label parser accepts only our host and /scan/{n}/{n}.
import assert from "node:assert/strict";
const { parseLabelUrl } = await import("../../lib/label-url.ts");
const H = "scansolve.co";
assert.deepEqual(parseLabelUrl("https://scansolve.co/scan/1001/1026000001", H), { orgNumber: "1001", uid: "1026000001" });
assert.deepEqual(parseLabelUrl("  https://scansolve.co/scan/1001/1026000001/ ", H), { orgNumber: "1001", uid: "1026000001" });
for (const bad of [
  "https://evil.com/scan/1001/1026000001",
  "https://scansolve.co.evil.com/scan/1001/1",
  "http://scansolve.co/scan/1001/1",
  "javascript:alert(1)//scansolve.co/scan/1/1",
  "https://scansolve.co/scan/1001/1026000001/extra",
  "https://scansolve.co/commission/1001/1",
  "https://scansolve.co/scan/abc/1",
  "https://user:pw@scansolve.co/scan/1/1",
  "not a url",
]) assert.equal(parseLabelUrl(bad, H), null, bad);
console.log("PARSE_OK");
