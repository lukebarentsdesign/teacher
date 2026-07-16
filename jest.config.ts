import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/__tests__/**/*.test.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  transformIgnorePatterns: [
    "/node_modules/(?!better-auth)/"
  ],
  transform: {
    "^.+\\.(t|j)sx?$": "ts-jest",
    "^.+\\.mjs$": "ts-jest",
  },
  setupFiles: ["dotenv/config"],
};

export default config;
