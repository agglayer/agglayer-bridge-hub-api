# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [1.7.3](https://github.com/agglayer/agglayer-bridge-hub-api/compare/bridge-hub-api@1.7.2...bridge-hub-api@1.7.3) (2026-07-21)

### Bug Fixes

- **errors:** stop echoing raw error messages and internal URLs in proof error responses ([b4e5a70](https://github.com/agglayer/agglayer-bridge-hub-api/commit/b4e5a70c899c719bbb06cb896c358ee227833f3f))
- make bun tests order-independent and fix lerna hang in nested checkouts ([be97af3](https://github.com/agglayer/agglayer-bridge-hub-api/commit/be97af3b8bf60fc3a42eca38a91690c429ba8a0e))

## [1.7.2](https://github.com/agglayer/agglayer-bridge-hub-api/compare/bridge-hub-api@1.7.1...bridge-hub-api@1.7.2) (2026-06-18)

### Bug Fixes

- **api:** paginate transactions forward when order=asc ([c2f6cfd](https://github.com/agglayer/agglayer-bridge-hub-api/commit/c2f6cfd77dbbffe008c4a45d8f4fd41a27467814))

## [1.7.1](https://github.com/agglayer/agglayer-bridge-hub-api/compare/bridge-hub-api@1.7.0...bridge-hub-api@1.7.1) (2026-06-17)

### Bug Fixes

- **api:** exclude orphan claims without transactionHash from getTransactions ([a47daea](https://github.com/agglayer/agglayer-bridge-hub-api/commit/a47daea17d7c873cfd25fa29f1bd35636fae487b))

# [1.7.0](https://github.com/agglayer/agglayer-bridge-hub-api/compare/bridge-hub-api@1.6.2...bridge-hub-api@1.7.0) (2026-06-16)

### Bug Fixes

- **build:** unblock release build — build before type-check + fix proof leafIndex type ([5754ba6](https://github.com/agglayer/agglayer-bridge-hub-api/commit/5754ba6fdac62e810d57c491c45743b79505df90))
- change default collection names for devnet ([43be8e9](https://github.com/agglayer/agglayer-bridge-hub-api/commit/43be8e90db239ef097de17199a9a4001ef6c7383))
- delete backup test files ([3c1d6aa](https://github.com/agglayer/agglayer-bridge-hub-api/commit/3c1d6aa36e2a7887b4a3b75384e43e80535798de))
- fix test coverage ([a3ae6c3](https://github.com/agglayer/agglayer-bridge-hub-api/commit/a3ae6c38ea276584d47e3a01a34f51b0786e5c47))
- remove unnecessary constructor on health-check controller ([84b02ba](https://github.com/agglayer/agglayer-bridge-hub-api/commit/84b02ba7c41b0c64769ab65605e3f783cf6b75e3))
- solve type issues in tests ([c567148](https://github.com/agglayer/agglayer-bridge-hub-api/commit/c56714873f1ca093bf27e9d71999b5ecd10ce1c5))

### Features

- remove auto claim health-check from hub api ([dace7b5](https://github.com/agglayer/agglayer-bridge-hub-api/commit/dace7b547fdad6b8775dde9dd80db1f15bb96deb))

## [1.6.2](https://github.com/agglayer/agglayer-bridge-hub-api/compare/bridge-hub-api@1.6.1...bridge-hub-api@1.6.2) (2026-01-30)

### Bug Fixes

- deployment.md to include docker deployments ([799a12e](https://github.com/agglayer/agglayer-bridge-hub-api/commit/799a12ea7c8ae578a8a170653113b3666b57bebe))

## [1.6.1](https://github.com/agglayer/agglayer-bridge-hub-api/compare/bridge-hub-api@1.6.0...bridge-hub-api@1.6.1) (2026-01-29)

### Bug Fixes

- proofService getProof function return type ([3d9985c](https://github.com/agglayer/agglayer-bridge-hub-api/commit/3d9985cd8d924fa834b5c99a457d4703f2b2bca1))
- update package documentation to be lean ([ab7dd5d](https://github.com/agglayer/agglayer-bridge-hub-api/commit/ab7dd5d5186f2c74cd7e6b386fece868ab7fa237))

# [1.6.0](https://github.com/agglayer/agglayer-bridge-hub-api/compare/bridge-hub-api@1.5.17...bridge-hub-api@1.6.0) (2026-01-28)

### Bug Fixes

- proofService getProof function return type ([87a7ca7](https://github.com/agglayer/agglayer-bridge-hub-api/commit/87a7ca7a843896faccf10da1442fe15c21471a97))
- stop re-exporting common's types in api package ([2b2baa9](https://github.com/agglayer/agglayer-bridge-hub-api/commit/2b2baa9a75135fc52cd2d785df06dc1463409be0))
- typo in bridge_tx_metadata for claim-proof ([dda6d59](https://github.com/agglayer/agglayer-bridge-hub-api/commit/dda6d59d790e2dc9493c0acb37a800bafb1c9bdd))

### Features

- move proof and transaction response types to commons ([70100b6](https://github.com/agglayer/agglayer-bridge-hub-api/commit/70100b6f949e8682655152fcce715c9612f491fc))
- pass tx metadata for claim with claim-proof ([60de720](https://github.com/agglayer/agglayer-bridge-hub-api/commit/60de720a1d314be5ea1e4c4c85b1e32808caefc1))

## [1.5.17](https://github.com/agglayer/agglayer-bridge-hub-api/compare/bridge-hub-api@1.5.16...bridge-hub-api@1.5.17) (2026-01-27)

### Bug Fixes

- move mongodb code from commons to servercore ([3c9191f](https://github.com/agglayer/agglayer-bridge-hub-api/commit/3c9191ff3d3b7ea4d7e7be084668f66522058330))

## [1.5.16](https://github.com/agglayer/agglayer-bridge-hub-api/compare/bridge-hub-api@1.5.15...bridge-hub-api@1.5.16) (2026-01-23)

### Bug Fixes

- devnet bridge address ([7105a1a](https://github.com/agglayer/agglayer-bridge-hub-api/commit/7105a1a79334523996689746cf07b5254858d03b))

## [1.5.15](https://github.com/agglayer/agglayer-bridge-hub-api/compare/bridge-hub-api@1.5.14...bridge-hub-api@1.5.15) (2026-01-23)

**Note:** Version bump only for package bridge-hub-api

## [1.5.14](https://github.com/agglayer/agglayer-bridge-hub-api/compare/bridge-hub-api@1.5.13...bridge-hub-api@1.5.14) (2026-01-22)

### Bug Fixes

- mark limit param as required, since default limit is being set in query validation ([6e18754](https://github.com/agglayer/agglayer-bridge-hub-api/commit/6e18754d7ab7f2803377edfe76742271f175b73c))
- modify tokenMetadata file constants to SCREAMING_SNAKE_CASE ([1398001](https://github.com/agglayer/agglayer-bridge-hub-api/commit/13980016e18adc09b5dfb1c74f2f8bd8a414dc35))
- pass limit to getTransactions call in healthcheck for auto-claim ([fb9a63f](https://github.com/agglayer/agglayer-bridge-hub-api/commit/fb9a63f59f7d1d381608b149301f30f94af7f7e7))
- remove test for totalDocuments number when limit is not provided ([0540301](https://github.com/agglayer/agglayer-bridge-hub-api/commit/054030121f4471d61c1450cc664006c1e8e2b177))
- set tokenNetwork param in mapping services to accept number ([a87e3eb](https://github.com/agglayer/agglayer-bridge-hub-api/commit/a87e3eb25bc8f97ae47655df9c205c7a539ce75d))
- use Filter and Sort mongodb types fot the services filter and sort params ([e2edc9d](https://github.com/agglayer/agglayer-bridge-hub-api/commit/e2edc9d08e99c1edd7dbaf6c4d49bee7675be556))
- use Networks enum type for network params in services ([c37fe47](https://github.com/agglayer/agglayer-bridge-hub-api/commit/c37fe47a5fa4f9ba0925b8d951b7b7750e2ee177))

## [1.5.13](https://github.com/agglayer/agglayer-bridge-hub-api/compare/bridge-hub-api@1.5.12...bridge-hub-api@1.5.13) (2026-01-13)

**Note:** Version bump only for package bridge-hub-api

## [1.5.12](https://github.com/agglayer/agglayer-bridge-hub-api/compare/bridge-hub-api@1.5.11...bridge-hub-api@1.5.12) (2026-01-12)

**Note:** Version bump only for package bridge-hub-api

## [1.5.11](https://github.com/agglayer/agglayer-bridge-hub-api/compare/bridge-hub-api@1.5.10...bridge-hub-api@1.5.11) (2026-01-08)

**Note:** Version bump only for package bridge-hub-api

## [1.5.10](https://github.com/agglayer/agglayer-bridge-hub-api/compare/bridge-hub-api@1.5.9...bridge-hub-api@1.5.10) (2026-01-04)

### Bug Fixes

- check on source network ids to be non negetive integers ([26ac74b](https://github.com/agglayer/agglayer-bridge-hub-api/commit/26ac74b17dbdc8a212c42af05754e04c770ecfef))

## [1.5.9](https://github.com/agglayer/agglayer-bridge-hub-api/compare/bridge-hub-api@1.5.8...bridge-hub-api@1.5.9) (2025-12-20)

### Bug Fixes

- add new devnet network ([405f0d2](https://github.com/agglayer/agglayer-bridge-hub-api/commit/405f0d276dbbe80eac7203ebd692fcc421a48745))

## [1.5.8](https://github.com/agglayer/agglayer-bridge-hub-api/compare/bridge-hub-api@1.5.7...bridge-hub-api@1.5.8) (2025-11-04)

### Bug Fixes

- make leafIndex param optional for proof generation ([b265f1a](https://github.com/agglayer/agglayer-bridge-hub-api/commit/b265f1adf4575bc191e8964d70afbbe050c63d5f))

## [1.5.7](https://github.com/agglayer/agglayer-bridge-hub-api/compare/bridge-hub-api@1.5.6...bridge-hub-api@1.5.7) (2025-10-28)

### Bug Fixes

- change server url on the docs and fix proof response schema ([6d80927](https://github.com/agglayer/agglayer-bridge-hub-api/commit/6d8092737e572da056c04b2509b6e1629e15ea39))

## [1.5.6](https://github.com/agglayer/agglayer-bridge-hub-api/compare/bridge-hub-api@1.5.5...bridge-hub-api@1.5.6) (2025-10-16)

### Bug Fixes

- health auto claim ([a339e04](https://github.com/agglayer/agglayer-bridge-hub-api/commit/a339e0484917b6c1a2769d2070a30e4def1830b3))

## [1.5.5](https://github.com/agglayer/agglayer-bridge-hub-api/compare/bridge-hub-api@1.5.4...bridge-hub-api@1.5.5) (2025-10-13)

### Bug Fixes

- auto claim health check apis ([f95cf23](https://github.com/agglayer/agglayer-bridge-hub-api/commit/f95cf23c4dee9944ff4383d90b13abfa273d98dd))

## [1.5.4](https://github.com/agglayer/agglayer-bridge-hub-api/compare/bridge-hub-api@1.5.3...bridge-hub-api@1.5.4) (2025-10-13)

### Bug Fixes

- do not override order params on updatedSince query ([0b52177](https://github.com/agglayer/agglayer-bridge-hub-api/commit/0b52177ac51cf7c3cf3336e3e9536d2c05ef981b))
- handle removal of orderParams in updatedSince in tests ([d3d6061](https://github.com/agglayer/agglayer-bridge-hub-api/commit/d3d60613e72c1291d8ee6ec5f28a8c7aa5f9f698))
- install viem as dependency ([d72b94e](https://github.com/agglayer/agglayer-bridge-hub-api/commit/d72b94e7cf15ae6946b95b059bf941962f9068c6))

## [1.5.3](https://github.com/agglayer/agglayer-bridge-hub-api/compare/bridge-hub-api@1.5.2...bridge-hub-api@1.5.3) (2025-10-10)

### Bug Fixes

- add filtering for transactionHash on getTransactions ([fe8cb9e](https://github.com/agglayer/agglayer-bridge-hub-api/commit/fe8cb9ea468cdb2ca13f8b1e044d9a89e96b9776))

## [1.5.2](https://github.com/agglayer/agglayer-bridge-hub-api/compare/bridge-hub-api@1.5.1...bridge-hub-api@1.5.2) (2025-10-10)

### Bug Fixes

- reorder param additions to transactions query ([8499267](https://github.com/agglayer/agglayer-bridge-hub-api/commit/84992676f544b23e4b0caad2d4ecb03881ba8be5))

## [1.5.1](https://github.com/agglayer/agglayer-bridge-hub-api/compare/bridge-hub-api@1.5.0...bridge-hub-api@1.5.1) (2025-10-09)

### Bug Fixes

- remove txSender filtering till indexes are added ([2fb55e5](https://github.com/agglayer/agglayer-bridge-hub-api/commit/2fb55e5d91b7de903fd9680216f56844f659987a))

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
