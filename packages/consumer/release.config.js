const _default = {
    branches: ["release"],
    tagFormat: "bridge-hub-commons-v${version}",
    plugins: [
        "@semantic-release/commit-analyzer",
        "@semantic-release/release-notes-generator",
        "@semantic-release/changelog",
        [
            "@semantic-release/git",
            {
                assets: [
                    "packages/commons/package.json",
                    "packages/commons/CHANGELOG.md",
                ],
                message:
                    "chore(bridge-hub-commons release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}",
            },
        ],
        "@semantic-release/github",
    ],
};
export { _default as default };
