const _default = {
    branches: ["main"],
    tagFormat: "bridge-hub-commons-v${version}",
    plugins: [
        "@semantic-release/commit-analyzer",
        "@semantic-release/release-notes-generator",
        "@semantic-release/github",
    ],
};
export { _default as default };
