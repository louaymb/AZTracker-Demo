import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // shadcn/ui and Firebase subscription hooks intentionally sync state from
      // external systems (matchMedia, Firestore snapshots) inside effects.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Generated shadcn/ui primitives, the standalone Cloud Functions project
    // (has its own tsconfig) and build output.
    "src/components/ui/**",
    "functions/**",
    "out/**",
  ]),
]);

export default eslintConfig;
