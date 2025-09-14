const _default = {
    branches: [
        "release",
        { name: "main", prerelease: "beta" },
        { name: "86abqfye1-last-updated-inclusion", prerelease: "beta" },
    ],
    tagFormat: "bridge-hub-api-v${version}",
    plugins: [
        "@semantic-release/commit-analyzer",
        "@semantic-release/release-notes-generator",
        "@semantic-release/github",
    ],
};
export { _default as default };
