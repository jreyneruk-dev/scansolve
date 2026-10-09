// Lets check scripts import app modules that use the "@/" path alias (tsconfig paths).
import { registerHooks } from "node:module";
import { existsSync } from "node:fs";
import { pathToFileURL, fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../", import.meta.url));
registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith("@/")) {
      const base = root + specifier.slice(2);
      const hit = [".ts", ".tsx", "/index.ts", ""].map((ext) => base + ext).find(existsSync);
      if (hit) return { url: pathToFileURL(hit).href, shortCircuit: true };
    }
    return next(specifier, context);
  },
});
