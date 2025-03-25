module.exports = {
    branches: ["release"],
    tagFormat: "bridge-hub-api-v${version}",
    plugins: [
        "@semantic-release/commit-analyzer",
        "@semantic-release/release-notes-generator",
        "@semantic-release/changelog",
        [
            "@semantic-release/git",
            {
                assets: [
                    "packages/api/package.json",
                    "packages/api/CHANGELOG.md",
                ],
                message:
                    "chore(bridge-hub-api release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}",
            },
        ],
        "@semantic-release/github",
    ],
};
