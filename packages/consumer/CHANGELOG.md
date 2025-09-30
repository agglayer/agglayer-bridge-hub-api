# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [1.1.3](https://github.com/agglayer/agglayer-bridge-hub-api/compare/bridge-hub-consumer@1.1.2...bridge-hub-consumer@1.1.3) (2025-09-30)

### Bug Fixes

- decode pre etrog global index correctly ([5baad63](https://github.com/agglayer/agglayer-bridge-hub-api/commit/5baad63b16add02e8399952c4a3310ff488fb022))
- update the global index unit test ([115c39b](https://github.com/agglayer/agglayer-bridge-hub-api/commit/115c39b65f7001f041edf1bcbf409ba6be65ca87))

## [1.1.2](https://github.com/agglayer/agglayer-bridge-hub-api/compare/bridge-hub-consumer@1.1.1...bridge-hub-consumer@1.1.2) (2025-09-25)

### Bug Fixes

- change error logging to info level in ClaimReadinessConsumer ([9f973eb](https://github.com/agglayer/agglayer-bridge-hub-api/commit/9f973eb882160dbf5efb2251f8260f47464df2a4))

## [1.1.1](https://github.com/agglayer/agglayer-bridge-hub-api/compare/bridge-hub-consumer@1.1.0...bridge-hub-consumer@1.1.1) (2025-09-21)

### Bug Fixes

- add fuzzy tests on api package ([c86c37b](https://github.com/agglayer/agglayer-bridge-hub-api/commit/c86c37bda7eae48adf1aa2b7731492bae0f27e18))

# 1.1.0 (2025-09-20)

### Bug Fixes

- add hubUID field on transactions for pagiantion ([10d477f](https://github.com/agglayer/agglayer-bridge-hub-api/commit/10d477f60a8b535bf24100678dddc0e19aaac3e4))
- add logic to generate docIds for mappings ([276b75d](https://github.com/agglayer/agglayer-bridge-hub-api/commit/276b75d6814ab6516100426189ef5e4f7238de9f))
- add network env to separate mainnet and testnet on consumer ([e2d4a6e](https://github.com/agglayer/agglayer-bridge-hub-api/commit/e2d4a6ead2cbc59111b3b83430bdcf52e3cd2c53))
- add package version fields to sub packages ([acb471e](https://github.com/agglayer/agglayer-bridge-hub-api/commit/acb471e8e62ce97f26517b7ba3d9ce074b4fca31))
- add srevices tests to consumer package ([f7d4956](https://github.com/agglayer/agglayer-bridge-hub-api/commit/f7d4956e65253b50a462321b1468b29e5523154b))
- add tests on consumer mappers ([a5082fd](https://github.com/agglayer/agglayer-bridge-hub-api/commit/a5082fd125b08ddd8873900d4055ae923c8827da))
- allow semantic release to release from 86abqfye1-last-updated-inclusion branch ([dde64ff](https://github.com/agglayer/agglayer-bridge-hub-api/commit/dde64ff5dbe91300b721f8e154c59b5fe6d4c007))
- block_number param key for claims and mappings ([a5eded2](https://github.com/agglayer/agglayer-bridge-hub-api/commit/a5eded2b074cee6f6ddf1ef64ce35e1355a68c51))
- change class properties to readonly in various services for better immutability ([cd91507](https://github.com/agglayer/agglayer-bridge-hub-api/commit/cd91507d2123b0f8c9d5d0ed78f43b617a99e3d7))
- change consumer app server port to 3001 ([2b7e57a](https://github.com/agglayer/agglayer-bridge-hub-api/commit/2b7e57a4900f3deb4e5cc583f08eb29a72d54cca))
- change leaType type to enum from number ([2c0ba15](https://github.com/agglayer/agglayer-bridge-hub-api/commit/2c0ba156022957681ce955960def212073480c97))
- correct NODE_EVN typo to NODE_ENV in environment configuration files ([ca6d118](https://github.com/agglayer/agglayer-bridge-hub-api/commit/ca6d118577535f78b03e6bcd53058ab883efe403))
- countKey value on claims and mappings consumer ([c57ca1d](https://github.com/agglayer/agglayer-bridge-hub-api/commit/c57ca1dc3d9b342cda6d9d9ba9d2844ed30f7799))
- disable metadata indexing in bridge transactions ([4f5b3c7](https://github.com/agglayer/agglayer-bridge-hub-api/commit/4f5b3c743792a1a4296ae40dc49f92e5a2660bcc))
- health check controller on api ([60e8bdc](https://github.com/agglayer/agglayer-bridge-hub-api/commit/60e8bdce41b9c32d2cb60eeff2f37870a9b7bfc8))
- install semantic-release modules to api and consumer packages ([665135e](https://github.com/agglayer/agglayer-bridge-hub-api/commit/665135ea98a8cc5b0e2f237c7ffd08a545fd411b))
- refactor code style to use consistent indentation and formatting across multiple files ([9902ea6](https://github.com/agglayer/agglayer-bridge-hub-api/commit/9902ea64e2a953830a90fab062b53529ad5fa3d6))
- refactor consumer package configuration and services ([df9a443](https://github.com/agglayer/agglayer-bridge-hub-api/commit/df9a443eec22580ac974a33678ae3ec543488a32))
- remove individual release config files ([f5b25a9](https://github.com/agglayer/agglayer-bridge-hub-api/commit/f5b25a92cfa3d1cf654d6bb7fa5dda1c70824737))
- semantic-release config and workflow ([a291838](https://github.com/agglayer/agglayer-bridge-hub-api/commit/a291838864fbbc7bed3c6aecdd2118e119b93c1f))
- send collectionId as string for claim updates ([0c534a1](https://github.com/agglayer/agglayer-bridge-hub-api/commit/0c534a11995dc94c774b4983dff06d4512b3da9d))
- stop indexing metadata on mapping txs ([ded0fab](https://github.com/agglayer/agglayer-bridge-hub-api/commit/ded0fab8ed461ba421d39ee78894a567f65cea34))
- use servercore logger instead of console logging ([7c90eb1](https://github.com/agglayer/agglayer-bridge-hub-api/commit/7c90eb147e7958b96aa621aec6a15e45e69e2bf0))

### Features

- add claim readiness consumer ([a82cd19](https://github.com/agglayer/agglayer-bridge-hub-api/commit/a82cd19d939ebbac6539954a15b044e40afd5bfa))
- add health-check endpoint to the consumer ([f89161d](https://github.com/agglayer/agglayer-bridge-hub-api/commit/f89161d7c6dc7cdb5bc6c0e86c51c3b8f7b5416a))
- add lastUpdatedAt field to transaction and mapping interfaces ([70f90cb](https://github.com/agglayer/agglayer-bridge-hub-api/commit/70f90cb3c3b79995712c8babb78876f116bd5a30))
- add support to tx ordering query param ([e8f45e9](https://github.com/agglayer/agglayer-bridge-hub-api/commit/e8f45e9d18f0e332132a6f72bcca000a84dee519))
- add transaction service functions for claim consumer ([c105b17](https://github.com/agglayer/agglayer-bridge-hub-api/commit/c105b178e6669069f21d24e851e2f25266ae91d4))
- user servercore instead of commons package ([c3d40c6](https://github.com/agglayer/agglayer-bridge-hub-api/commit/c3d40c63cfe0270e90534f584add19a6bd022bf5))
