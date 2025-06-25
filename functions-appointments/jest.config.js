// functions/jest.config.js

module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",

  // All paths are relative to functions/
  rootDir: ".",
  roots: ["<rootDir>/src"],

  // Tell ts-jest which tsconfig to use (with jest types)
  transform: {
    "^.+\\.(ts|tsx)$": ["ts-jest", { tsconfig: "tsconfig.functions.json" }]
  },

  // Recognize these extensions
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],

  // Which files to treat as tests
  testMatch: [
    "**/__tests__/**/*.+(ts|js)",
    "**/?(*.)+(spec|test).+(ts|js)"
  ],

  // Do not transform node_modules
  transformIgnorePatterns: ["/node_modules/"]
};
