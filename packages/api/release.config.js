const _default = {
    branches: ["release", { name: "main", prerelease: "beta" }],
    tagFormat: "bridge-hub-api-v${version}",
    plugins: [
        "@semantic-release/commit-analyzer",
        "@semantic-release/release-notes-generator",
        "@semantic-release/github",
    ],
};
export { _default as default };
