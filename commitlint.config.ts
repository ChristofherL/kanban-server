const config = {
  extends: ["@commitlint/config-conventional"],
  parserPreset: "conventional-changelog-atom",
  rules: {
    "body-max-line-length": [1, "always", 72],
    "header-max-length": [1, "always", 52],
    "type-enum": [
      2,
      "always",
      [
        "build",
        "chore",
        "ci",
        "change",
        "docs",
        "feat",
        "fix",
        "perf",
        "refactor",
        "style",
        "test",
      ],
    ],
  },
};

export default config;
