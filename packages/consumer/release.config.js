module.exports = {
    branches: ["release"],
    tagFormat: "bridge-hub-consumer-v${version}",
    plugins: [
        "@semantic-release/commit-analyzer",
        "@semantic-release/release-notes-generator",
        "@semantic-release/changelog",
        [
            "@semantic-release/git",
            {
                assets: [
                    "packages/consumer/package.json",
                    "packages/consumer/CHANGELOG.md",
                ],
                message:
                    "chore(bridge-hub-consumer release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}",
            },
        ],
        "@semantic-release/github",
    ],
};
