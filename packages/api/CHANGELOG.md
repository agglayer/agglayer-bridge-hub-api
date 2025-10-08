# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [1.5.0](https://github.com/agglayer/agglayer-bridge-hub-api/compare/bridge-hub-api@1.4.1...bridge-hub-api@1.5.0) (2025-10-08)

### Bug Fixes

- healthcheck for autoclaim ([1e405bc](https://github.com/agglayer/agglayer-bridge-hub-api/commit/1e405bcd7a3be629d02f9f33d86b56ec4486c78d))

### Features

- add metadata field to bridge transactions ([41784a6](https://github.com/agglayer/agglayer-bridge-hub-api/commit/41784a6c04367e6a631e23a26d54db263a960c13))
- tx-sender in transactions ([b17517b](https://github.com/agglayer/agglayer-bridge-hub-api/commit/b17517b85d1ca836b0c5c9e40ad1b9bcd32a6fc1))

## [1.4.1](https://github.com/agglayer/agglayer-bridge-hub-api/compare/bridge-hub-api@1.4.0...bridge-hub-api@1.4.1) (2025-10-06)

### Bug Fixes

- autoclaim health check ([e34f204](https://github.com/agglayer/agglayer-bridge-hub-api/commit/e34f20498a70d5ed004159bc7c3eb2b30e4620b4))

# [1.4.0](https://github.com/agglayer/agglayer-bridge-hub-api/compare/bridge-hub-api@1.3.0...bridge-hub-api@1.4.0) (2025-10-03)

### Bug Fixes

- version BRIDGE_ABI ([5ff1335](https://github.com/agglayer/agglayer-bridge-hub-api/commit/5ff13350c6d1b9f395fa6aa3665f841620e1249c))

### Features

- add wrappedTokenAddress versioning to token metadata endpoint ([9652704](https://github.com/agglayer/agglayer-bridge-hub-api/commit/9652704d604927c7a818605aa378c74831b1b0bd))

# [1.3.0](https://github.com/agglayer/agglayer-bridge-hub-api/compare/bridge-hub-api@1.2.4...bridge-hub-api@1.3.0) (2025-10-03)

### Bug Fixes

- health check auto claim ([d4a3e89](https://github.com/agglayer/agglayer-bridge-hub-api/commit/d4a3e8983208887708b2caad8648057b5ab63741))
- health check for autoclaim ([f025917](https://github.com/agglayer/agglayer-bridge-hub-api/commit/f0259178e349977c4c1618d82dc94fe385ccabce))

### Features

- health check for auto claim ([4399b39](https://github.com/agglayer/agglayer-bridge-hub-api/commit/4399b397a3d4b0cbc0b488e5466eeb26c427c19d))
- shift to viem from ethers ([075878a](https://github.com/agglayer/agglayer-bridge-hub-api/commit/075878aefd2681b7ce66dc24a4a5c90674dcda5f))

## [1.2.4](https://github.com/agglayer/agglayer-bridge-hub-api/compare/bridge-hub-api@1.2.3...bridge-hub-api@1.2.4) (2025-10-01)

### Bug Fixes

- set max pagination startAfter value limit to 40 ([5c8e34e](https://github.com/agglayer/agglayer-bridge-hub-api/commit/5c8e34e443cc8532168324b843003d4c2dd19ede))

## [1.2.3](https://github.com/agglayer/agglayer-bridge-hub-api/compare/bridge-hub-api@1.2.2...bridge-hub-api@1.2.3) (2025-09-30)

### Bug Fixes

- change getMappingsByToken to fetch using where filters instead of or ([f4d05fb](https://github.com/agglayer/agglayer-bridge-hub-api/commit/f4d05fb8b95f5ac8af8464560fe7deb6c72e7bd2))
- set pagination startAfter max string limit to 32 ([091c5df](https://github.com/agglayer/agglayer-bridge-hub-api/commit/091c5df47133e052badc90809f73fc22b265e5dc))
- start after param validation ([7d326df](https://github.com/agglayer/agglayer-bridge-hub-api/commit/7d326dfd8845d5bd0c3a3f8ea9659f0ca027597e))

## [1.2.2](https://github.com/agglayer/agglayer-bridge-hub-api/compare/bridge-hub-api@1.2.1...bridge-hub-api@1.2.2) (2025-09-24)

### Bug Fixes

- convert address to lowercase on schema ([46a3c01](https://github.com/agglayer/agglayer-bridge-hub-api/commit/46a3c016d43ecf5ebb2a05986bf4faeedccbbd66))
- restore address transformation to lowercase in schema ([4e4aef1](https://github.com/agglayer/agglayer-bridge-hub-api/commit/4e4aef1126eb2ca4f723beb4b1768915c5c4d82d))

## [1.2.1](https://github.com/agglayer/agglayer-bridge-hub-api/compare/bridge-hub-api@1.2.0...bridge-hub-api@1.2.1) (2025-09-22)

### Bug Fixes

- remove dynamic versioning for openapi docs ([28cb684](https://github.com/agglayer/agglayer-bridge-hub-api/commit/28cb684cae52fb97b3db930ec364202f0986fad2))

# [1.2.0](https://github.com/agglayer/agglayer-bridge-hub-api/compare/bridge-hub-api@1.1.1...bridge-hub-api@1.2.0) (2025-09-21)

### Bug Fixes

- add page title to docs ui ([4c278a2](https://github.com/agglayer/agglayer-bridge-hub-api/commit/4c278a2e91b4987abc3a2a8160460efc00541e3c))

### Features

- add openapi spec doc and docs ui ([6411bc0](https://github.com/agglayer/agglayer-bridge-hub-api/commit/6411bc015b1c407b334df438244b61455cbf33cc))

## [1.1.1](https://github.com/agglayer/agglayer-bridge-hub-api/compare/bridge-hub-api@1.1.0...bridge-hub-api@1.1.1) (2025-09-21)

### Bug Fixes

- add fuzzy tests on api package ([c86c37b](https://github.com/agglayer/agglayer-bridge-hub-api/commit/c86c37bda7eae48adf1aa2b7731492bae0f27e18))
- auto release packages on new tag release ([cf56a97](https://github.com/agglayer/agglayer-bridge-hub-api/commit/cf56a975f17e1d1ed2fc259ae651e2c162164f18))

# 1.1.0 (2025-09-20)

### Bug Fixes

- add hubUID field on transactions for pagiantion ([10d477f](https://github.com/agglayer/agglayer-bridge-hub-api/commit/10d477f60a8b535bf24100678dddc0e19aaac3e4))
- add logic to generate docIds for mappings ([276b75d](https://github.com/agglayer/agglayer-bridge-hub-api/commit/276b75d6814ab6516100426189ef5e4f7238de9f))
- add mappings service ([4d107bb](https://github.com/agglayer/agglayer-bridge-hub-api/commit/4d107bb5c107654bb3a2c558eb041357bb528441))
- add network path param to separate mainnet and testnet on api ([d57a7e7](https://github.com/agglayer/agglayer-bridge-hub-api/commit/d57a7e7c62b23f49d7d88ab8d783647182fd8083))
- add package version fields to sub packages ([acb471e](https://github.com/agglayer/agglayer-bridge-hub-api/commit/acb471e8e62ce97f26517b7ba3d9ce074b4fca31))
- add tests for api package ([cba504a](https://github.com/agglayer/agglayer-bridge-hub-api/commit/cba504a7333215ecb3a6e6e92127bb2fd8dc7f67))
- allow semantic release to release from 86abqfye1-last-updated-inclusion branch ([dde64ff](https://github.com/agglayer/agglayer-bridge-hub-api/commit/dde64ff5dbe91300b721f8e154c59b5fe6d4c007))
- bring health-check route outside network routes ([30d3f4f](https://github.com/agglayer/agglayer-bridge-hub-api/commit/30d3f4f3858c0c7d085d202b0585d73ccb3debeb))
- change class properties to readonly in various services for better immutability ([cd91507](https://github.com/agglayer/agglayer-bridge-hub-api/commit/cd91507d2123b0f8c9d5d0ed78f43b617a99e3d7))
- change leaType type to enum from number ([2c0ba15](https://github.com/agglayer/agglayer-bridge-hub-api/commit/2c0ba156022957681ce955960def212073480c97))
- change prerelease tag for 86abqfye1-last-updated-inclusion branch from beta to dev ([2f330dc](https://github.com/agglayer/agglayer-bridge-hub-api/commit/2f330dc6a0a67d15184e28947fec41f5096a5625))
- change updatedSince param schema to only accept unic timestamps in milliseconds ([9e16137](https://github.com/agglayer/agglayer-bridge-hub-api/commit/9e161379f4141f6f861860a2527c7eac0615bcb7))
- comment out health-check logic till the connection issue is resolved ([b118225](https://github.com/agglayer/agglayer-bridge-hub-api/commit/b11822539455258cdcb25ee3349ce8a0f2f34177))
- correct NODE_EVN typo to NODE_ENV in environment configuration files ([ca6d118](https://github.com/agglayer/agglayer-bridge-hub-api/commit/ca6d118577535f78b03e6bcd53058ab883efe403))
- enhance error handling in token metadata fetching ([db38b35](https://github.com/agglayer/agglayer-bridge-hub-api/commit/db38b352e4020e6014cb7ec3613d99eb1f9f8ada))
- fix startAfterTimestamp param validation ([11eca49](https://github.com/agglayer/agglayer-bridge-hub-api/commit/11eca491b83570e8f585ae7057286260a7f6b9b7))
- get token mappings db call query operator fix ([d269ece](https://github.com/agglayer/agglayer-bridge-hub-api/commit/d269ece41d33180b9713d04f67292fa76cf8d02e))
- health check controller on api ([60e8bdc](https://github.com/agglayer/agglayer-bridge-hub-api/commit/60e8bdce41b9c32d2cb60eeff2f37870a9b7bfc8))
- include new PROOF_CONFIG and RPC_CONFIG var to .env.example ([67e90e6](https://github.com/agglayer/agglayer-bridge-hub-api/commit/67e90e6dd995c71860dd9ee693aab50495e8952a))
- initialize mappings service ([7ba6d93](https://github.com/agglayer/agglayer-bridge-hub-api/commit/7ba6d931ce4883c9565237deacbc76b34e41f0bc))
- install semantic-release modules to api and consumer packages ([665135e](https://github.com/agglayer/agglayer-bridge-hub-api/commit/665135ea98a8cc5b0e2f237c7ffd08a545fd411b))
- NetworkSchema parsing for transactions and mappings endpoints ([73fbc69](https://github.com/agglayer/agglayer-bridge-hub-api/commit/73fbc69539e5beac3d7e78082a632b578049b1b1))
- pass orQueryParams to getDocuments call in getMappings ([4b6edc1](https://github.com/agglayer/agglayer-bridge-hub-api/commit/4b6edc1cdaaffa60bc784a3287c06e4064205aaa))
- refactor api code to move query building logic to services ([118168b](https://github.com/agglayer/agglayer-bridge-hub-api/commit/118168bc98b2d38fd20b47dbaf2ee376bc3b1f08))
- refactor code style to use consistent indentation and formatting across multiple files ([9902ea6](https://github.com/agglayer/agglayer-bridge-hub-api/commit/9902ea64e2a953830a90fab062b53529ad5fa3d6))
- refactor consumer package configuration and services ([df9a443](https://github.com/agglayer/agglayer-bridge-hub-api/commit/df9a443eec22580ac974a33678ae3ec543488a32))
- remove individual release config files ([f5b25a9](https://github.com/agglayer/agglayer-bridge-hub-api/commit/f5b25a92cfa3d1cf654d6bb7fa5dda1c70824737))
- remove optional tag on limit param in pagination ([ec4e742](https://github.com/agglayer/agglayer-bridge-hub-api/commit/ec4e742f65cfca3c5f409325def546b6df849685))
- remove response contect tests ([024aea5](https://github.com/agglayer/agglayer-bridge-hub-api/commit/024aea5e2916eaa73f487d66f050ad5aa5693343))
- remove unused import on mappings route ([2a652c0](https://github.com/agglayer/agglayer-bridge-hub-api/commit/2a652c0a69c476dc4be74e2a06da111067fc2216))
- response context tests failures on github actions ([7b199eb](https://github.com/agglayer/agglayer-bridge-hub-api/commit/7b199ebcd452744a59634feacc47c9aa3eb4d71d))
- semantic-release config and workflow ([a291838](https://github.com/agglayer/agglayer-bridge-hub-api/commit/a291838864fbbc7bed3c6aecdd2118e119b93c1f))
- set default api port to 3001 ([f2ad7c2](https://github.com/agglayer/agglayer-bridge-hub-api/commit/f2ad7c229102db6f97b486497fc5046ff1b13e1d))
- successful healthcheck response message ([ba81160](https://github.com/agglayer/agglayer-bridge-hub-api/commit/ba8116097ca8a1287bfa9912090cc1a119d48cd0))
- update health-check to throw api error instead of external dependancy error ([4235830](https://github.com/agglayer/agglayer-bridge-hub-api/commit/4235830300598b895e126e80efa2a3c515139df1))
- update servercore and servercore-firestore dependencies ([49369e1](https://github.com/agglayer/agglayer-bridge-hub-api/commit/49369e19f5f40a7d68ecad28e2381bcb4cb6e44e))
- use response handlers from servercore ([913e0c0](https://github.com/agglayer/agglayer-bridge-hub-api/commit/913e0c03f04ded648f942d651bfae8d25524b14d))
- use server.js to start api app from Dockefile ([4fb290f](https://github.com/agglayer/agglayer-bridge-hub-api/commit/4fb290fb96a00793be8a7622479e43d1a470a17c))
- use servercore logger instead of console logging ([7c90eb1](https://github.com/agglayer/agglayer-bridge-hub-api/commit/7c90eb147e7958b96aa621aec6a15e45e69e2bf0))

### Features

- add lastUpdatedAt field to API tx interfaces ([ee343bb](https://github.com/agglayer/agglayer-bridge-hub-api/commit/ee343bbe378d293b3b786ba253c0994c1d3b67ad))
- add mappings routes ([d15120f](https://github.com/agglayer/agglayer-bridge-hub-api/commit/d15120ff3b900f97202fbff1114a6a0137e49fd1))
- add orderParamsOverride to getTransactions method for customizable sorting ([efd59a2](https://github.com/agglayer/agglayer-bridge-hub-api/commit/efd59a2e2bec911f19a9385760d1cd14a016c25f))
- add proof urls ([63d45d1](https://github.com/agglayer/agglayer-bridge-hub-api/commit/63d45d1bbe9426470890322ec78ea98f4f85c4ff))
- add support for fetching token metadata ([1d42e10](https://github.com/agglayer/agglayer-bridge-hub-api/commit/1d42e10206ead11b8591a58f59b43c9fc7c2c26b))
- add support to hubUID in api ([f7c23cd](https://github.com/agglayer/agglayer-bridge-hub-api/commit/f7c23cda7a2f0ba893dac2c200ce095efec0dde8))
- add support to tx ordering query param ([e8f45e9](https://github.com/agglayer/agglayer-bridge-hub-api/commit/e8f45e9d18f0e332132a6f72bcca000a84dee519))
- add transaction service functions for claim consumer ([c105b17](https://github.com/agglayer/agglayer-bridge-hub-api/commit/c105b178e6669069f21d24e851e2f25266ae91d4))
- add updatedSince query param to fetch transactions updated after a certain timestamp ([d4e9a5a](https://github.com/agglayer/agglayer-bridge-hub-api/commit/d4e9a5a010d13507ddef93c6b9647ab27f16c4eb))
- implement bridge ABI and support token metadata fetching logic for non mapped tokens ([d7380a9](https://github.com/agglayer/agglayer-bridge-hub-api/commit/d7380a9228f744eab84e4255bdd2f43ff19e4d30))
- implement status filtering on transactions ([454f2d5](https://github.com/agglayer/agglayer-bridge-hub-api/commit/454f2d5714e89ffbca3cd102066a3d8ee1182f8b))
- user servercore instead of commons package ([c3d40c6](https://github.com/agglayer/agglayer-bridge-hub-api/commit/c3d40c63cfe0270e90534f584add19a6bd022bf5))
