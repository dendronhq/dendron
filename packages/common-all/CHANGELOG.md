# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [0.75.1](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.75.1) (2021-12-31)


### Bug Fixes

* **refactor:** refactor crashes when captured note is a stub ([#1910](https://github.com/dendronhq/dendron/issues/1910)) ([24cf219](https://github.com/dendronhq/dendron/commit/24cf219d267ba63b0f9c140f19173898bece75b3))
* **workspace:** autocomplete deletes text following wikilink with no closing brackets ([#1909](https://github.com/dendronhq/dendron/issues/1909)) ([8fd0ef8](https://github.com/dendronhq/dendron/commit/8fd0ef8cd7710b8e6f5e74261d24c606e3c38f13)), closes [#1834](https://github.com/dendronhq/dendron/issues/1834)


### Features Dendron

* **navigation:** Goto Note can open links to non-note files ([#1844](https://github.com/dendronhq/dendron/issues/1844)) ([4223303](https://github.com/dendronhq/dendron/commit/4223303213731b341a45a73d9e2e55d53392630a))
* **navigation:** non-note file enhancements ([#1895](https://github.com/dendronhq/dendron/issues/1895)) ([90e083b](https://github.com/dendronhq/dendron/commit/90e083b5e10073acbc8967ad9649c0008aae381c))
* **notes:** Note Trait System Prototype (Phase 1) ([#1658](https://github.com/dendronhq/dendron/issues/1658)) ([0d5d187](https://github.com/dendronhq/dendron/commit/0d5d187a9aaaaebfc32fa9c7c5b5faa5c3b38eb3))
* **pod:** orbit import pod ([#1637](https://github.com/dendronhq/dendron/issues/1637)) ([66a5b14](https://github.com/dendronhq/dendron/commit/66a5b14019e542ade95f4cd2cb7b5cd3763d3b59))
* **refactoring:** add rename provider ([#1879](https://github.com/dendronhq/dendron/issues/1879)) ([988e18b](https://github.com/dendronhq/dendron/commit/988e18b8e03cb952898cb1cba9caf998b2e994f5))



# 0.72.0 (2021-12-07)


### Bug Fixes

* **views:** tree view not initializing on load ([5590a3c](https://github.com/dendronhq/dendron/commit/5590a3c0aa7476e8984a1e9193697d9984ab00ee))
* decorator lag problems ([#1822](https://github.com/dendronhq/dendron/issues/1822)) ([239bbdc](https://github.com/dendronhq/dendron/commit/239bbdc074e7bfde065a4210084002a0685471e5))
* **lookup:** hierarchy look up when inside parts of the hierarchy are omitted ([#1522](https://github.com/dendronhq/dendron/issues/1522)) ([6c30af5](https://github.com/dendronhq/dendron/commit/6c30af5e5b76297334f15a435fd1f9ad09941e06))
* **markdown:** email parsed as user tag & option to disable user tags and hashtags ([#1562](https://github.com/dendronhq/dendron/issues/1562)) ([fd56f7e](https://github.com/dendronhq/dendron/commit/fd56f7ece1651ea6433ebf481f2c54386ab6fb16))
* **markdown:** footnote links move view in publishing & preview ([#1568](https://github.com/dendronhq/dendron/issues/1568)) ([fbe659d](https://github.com/dendronhq/dendron/commit/fbe659d2be3d1f2534d7437d585e9fa38f1684da))
* **note:** correctly handle note titles containing international characters ([#1801](https://github.com/dendronhq/dendron/issues/1801)) ([03b05f4](https://github.com/dendronhq/dendron/commit/03b05f4aa7887577365059f5bb22d8c3585afe40))
* **pods:** invalid configuration error ([398a599](https://github.com/dendronhq/dendron/commit/398a5995fc594566131eb283ff989a877ca9c995))
* **publish:** make mermaid work consistently on published sites ([2f648e0](https://github.com/dendronhq/dendron/commit/2f648e0a34c95095e86e8535a1fa8ec9ac4de39c))
* **schema:** When applying a schema template, do not override the body but append to the end to it ([#1812](https://github.com/dendronhq/dendron/issues/1812)) ([0a48123](https://github.com/dendronhq/dendron/commit/0a481230c29aee08493937772f1f4d57be511615))
* allow assets to open from preview view ([#1771](https://github.com/dendronhq/dendron/issues/1771)) ([f362bda](https://github.com/dendronhq/dendron/commit/f362bda9726c9dde2c96aa1954aa549c1f013136))
* **workspace:** checks against fnames with all lowercase ([#1739](https://github.com/dendronhq/dendron/issues/1739)) ([8e3f8ec](https://github.com/dendronhq/dendron/commit/8e3f8ec061e0ce7d249a7e92902bb48e7c520793))
* backward compatibility of id matching adding '_' to id regex match. ([#1504](https://github.com/dendronhq/dendron/issues/1504)) ([4bbae40](https://github.com/dendronhq/dendron/commit/4bbae40d81ea064612f605c6f4e18ae8d34ba0de))
* replace auto generated ids (coming from inline schemas) with patterns ([#1632](https://github.com/dendronhq/dendron/issues/1632)) ([af28cf6](https://github.com/dendronhq/dendron/commit/af28cf6ef1d085d22069695e9df128477c024d1b))


### Features Dendron

* decorator improvements ([#1770](https://github.com/dendronhq/dendron/issues/1770)) ([a7227fd](https://github.com/dendronhq/dendron/commit/a7227fd4d8991e44729989c821a22560dcb8348b))
* Native workspace enhancements ([#1670](https://github.com/dendronhq/dendron/issues/1670)) ([7a392bb](https://github.com/dendronhq/dendron/commit/7a392bb47c69b562d54fa15479a184f1441e129e))
* **notes:** task notes (create modifier & editor highlighting) ([#1583](https://github.com/dendronhq/dendron/issues/1583)) ([e785efa](https://github.com/dendronhq/dendron/commit/e785efa8e2ce55bc39fb90cf34984d55035dd6ca))
* **schemas:** adding new command - create schema from hierarchy ([#1673](https://github.com/dendronhq/dendron/issues/1673)) ([14732ec](https://github.com/dendronhq/dendron/commit/14732ecbdd42511337ddaaf3fc91bde288c3036d))
* **workspace:** better note previews ([#1666](https://github.com/dendronhq/dendron/issues/1666)) ([5cf7067](https://github.com/dendronhq/dendron/commit/5cf70672a24a62d528440f38b44813bfa627fb88))
* **workspace:** convert vault command ([#1542](https://github.com/dendronhq/dendron/issues/1542)) ([c265e9d](https://github.com/dendronhq/dendron/commit/c265e9d2c238b5a6b3761f4c073140b1a0debe3a))



## 0.62.3 (2021-10-09)


### Bug Fixes

* template doesn't copy FM tags ([#1488](https://github.com/dendronhq/dendron/issues/1488)) ([0317699](https://github.com/dendronhq/dendron/commit/0317699ef9bfd4d77b1d3d05f8093e725ea5b2c3)), closes [#1481](https://github.com/dendronhq/dendron/issues/1481)
* **view:** enable anchor links to work in preview ([#1375](https://github.com/dendronhq/dendron/issues/1375)) ([f27cfb0](https://github.com/dendronhq/dendron/commit/f27cfb07d612e28fd0d6dd08019d772767900bba))
* preview caching invalidation when notes with ![[ref]] links change ([#1385](https://github.com/dendronhq/dendron/issues/1385)) ([efeef86](https://github.com/dendronhq/dendron/commit/efeef8662ec52e64ba33cae9b1196bba6cc82f95))
* **publish:** bad seo props setter ([373d933](https://github.com/dendronhq/dendron/commit/373d9331aba3b3385632f01661dd6c80835ec5ac))


### Features Dendron

* Lapsed user survey ([#1446](https://github.com/dendronhq/dendron/issues/1446)) ([8094d2b](https://github.com/dendronhq/dendron/commit/8094d2bb1972fecf4fde74e8c5644aeba3eec119)), closes [#1349](https://github.com/dendronhq/dendron/issues/1349)
* **publish:** add table of contents ([#1428](https://github.com/dendronhq/dendron/issues/1428)) ([df4b05b](https://github.com/dendronhq/dendron/commit/df4b05ba8526dc32362d6a59543d880f253f02fc))



# 0.61.0 (2021-09-28)


### Bug Fixes

* **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))
* support activation for older vscode version ([#1426](https://github.com/dendronhq/dendron/issues/1426)) ([5a1c7ed](https://github.com/dendronhq/dendron/commit/5a1c7ed9b45df2f00e61229c0776dad41cc29aba))


### Features Dendron

* **workspace:** add survey for new users([#1409](https://github.com/dendronhq/dendron/issues/1409)) ([e2b1754](https://github.com/dendronhq/dendron/commit/e2b17548fbbe3dffef961eb393f82a6a876940e7))



## 0.60.2 (2021-09-25)



## 0.60.2-alpha.0 (2021-09-24)



## 0.60.1 (2021-09-24)


### Bug Fixes

* pesky error popup when schema lookup is closed ([#1389](https://github.com/dendronhq/dendron/issues/1389)) ([4d2bb40](https://github.com/dendronhq/dendron/commit/4d2bb401b17e926dc2eaa11957536f0c75a1e538))
* single letter look up matches ([#1388](https://github.com/dendronhq/dendron/issues/1388)) ([7de9a71](https://github.com/dendronhq/dendron/commit/7de9a7195a02399b1285b51ef08d6853b1f390f6))



# 0.60.0 (2021-09-21)


### Bug Fixes

* **commands:** rename note leaves incorrect metadata if parent is a stub ([#1348](https://github.com/dendronhq/dendron/issues/1348)) ([d432cc9](https://github.com/dendronhq/dendron/commit/d432cc9e20ff8b9f6cefd7cc4c3a42b567ed9bc5))
* **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))
* **workspace:** disable certain decorations for long notes to avoid performance hit ([#1337](https://github.com/dendronhq/dendron/issues/1337)) ([f1c46f9](https://github.com/dendronhq/dendron/commit/f1c46f95c228ada2126ec7212cede3bf5acc773d))
* direct children query ([#1303](https://github.com/dendronhq/dendron/issues/1303)) ([bcf0dea](https://github.com/dendronhq/dendron/commit/bcf0deae422406564cd9a56c1765f90dd2e66215))
* issue with webpack devCLI ([a4ff4c9](https://github.com/dendronhq/dendron/commit/a4ff4c9ae28ff31ab6f9483c339ae78b5144e185))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))
* stop calendar from auto expanding when the last note is closed ([#1299](https://github.com/dendronhq/dendron/issues/1299)) ([9c8f853](https://github.com/dendronhq/dendron/commit/9c8f8533da5027c122e0d003ce4c61dc866735f5))


### Features Dendron

* consolidate dendron configs ([#1295](https://github.com/dendronhq/dendron/issues/1295)) ([177ac92](https://github.com/dendronhq/dendron/commit/177ac925a5442471f041ce5d991da52cecee6c9b))
* nextjs publishing fulltext search ([#1334](https://github.com/dendronhq/dendron/issues/1334)) ([68f8473](https://github.com/dendronhq/dendron/commit/68f8473badf22494c8d0758f8195e377235321f6))
* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* user tags ([#1228](https://github.com/dendronhq/dendron/issues/1228)) ([98c0106](https://github.com/dendronhq/dendron/commit/98c0106367e384c130a927484b9ea294eb6f84fa))



## 0.55.2 (2021-08-21)


### Bug Fixes

* wrong internal links in nextjs publishing ([#1165](https://github.com/dendronhq/dendron/issues/1165)) ([59a949d](https://github.com/dendronhq/dendron/commit/59a949d2b5b541efb283e851060636b108eb5a98))



## 0.55.1 (2021-08-17)


### Bug Fixes

* multiple issues with lookupv3 ([1fdd9eb](https://github.com/dendronhq/dendron/commit/1fdd9eb3242b43539572a1993fefd174640c6d83))
* properly log error stack ([485e220](https://github.com/dendronhq/dendron/commit/485e220f8ffa6cd63210e106e846ff305b920b77))


### Features Dendron

* Insert Note Index command ([#1142](https://github.com/dendronhq/dendron/issues/1142)) ([c140015](https://github.com/dendronhq/dendron/commit/c140015c19a942cf4696d596e818fd89905eea25))
* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* undefined tags breaks note serialization ([b1d784c](https://github.com/dendronhq/dendron/commit/b1d784c8df18b3b45999f01c14793436ff669a3f))


### Features Dendron

* colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
* resolve vim keybinding conflict on initial install ([#1103](https://github.com/dendronhq/dendron/issues/1103)) ([2278c66](https://github.com/dendronhq/dendron/commit/2278c6616c8297cc414ad02d5323bff5c45072e4))
* **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))
* Add SchemaLookupCommand ([#1082](https://github.com/dendronhq/dendron/issues/1082)) ([fe11a0e](https://github.com/dendronhq/dendron/commit/fe11a0ea1e0214823dd01842b941456df164bc70))
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* generate json schema from config ([#1100](https://github.com/dendronhq/dendron/issues/1100)) ([53b189e](https://github.com/dendronhq/dendron/commit/53b189ec973a8d3d3ccf300a0e59908197f4efb1))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





# [0.75.0](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.75.0) (2021-12-28)


### Bug Fixes

* **refactor:** refactor crashes when captured note is a stub ([#1910](https://github.com/dendronhq/dendron/issues/1910)) ([24cf219](https://github.com/dendronhq/dendron/commit/24cf219d267ba63b0f9c140f19173898bece75b3))
* **workspace:** autocomplete deletes text following wikilink with no closing brackets ([#1909](https://github.com/dendronhq/dendron/issues/1909)) ([8fd0ef8](https://github.com/dendronhq/dendron/commit/8fd0ef8cd7710b8e6f5e74261d24c606e3c38f13)), closes [#1834](https://github.com/dendronhq/dendron/issues/1834)


### Features Dendron

* **navigation:** Goto Note can open links to non-note files ([#1844](https://github.com/dendronhq/dendron/issues/1844)) ([4223303](https://github.com/dendronhq/dendron/commit/4223303213731b341a45a73d9e2e55d53392630a))
* **navigation:** non-note file enhancements ([#1895](https://github.com/dendronhq/dendron/issues/1895)) ([90e083b](https://github.com/dendronhq/dendron/commit/90e083b5e10073acbc8967ad9649c0008aae381c))
* **notes:** Note Trait System Prototype (Phase 1) ([#1658](https://github.com/dendronhq/dendron/issues/1658)) ([0d5d187](https://github.com/dendronhq/dendron/commit/0d5d187a9aaaaebfc32fa9c7c5b5faa5c3b38eb3))
* **pod:** orbit import pod ([#1637](https://github.com/dendronhq/dendron/issues/1637)) ([66a5b14](https://github.com/dendronhq/dendron/commit/66a5b14019e542ade95f4cd2cb7b5cd3763d3b59))
* **refactoring:** add rename provider ([#1879](https://github.com/dendronhq/dendron/issues/1879)) ([988e18b](https://github.com/dendronhq/dendron/commit/988e18b8e03cb952898cb1cba9caf998b2e994f5))



# 0.72.0 (2021-12-07)


### Bug Fixes

* **views:** tree view not initializing on load ([5590a3c](https://github.com/dendronhq/dendron/commit/5590a3c0aa7476e8984a1e9193697d9984ab00ee))
* decorator lag problems ([#1822](https://github.com/dendronhq/dendron/issues/1822)) ([239bbdc](https://github.com/dendronhq/dendron/commit/239bbdc074e7bfde065a4210084002a0685471e5))
* **lookup:** hierarchy look up when inside parts of the hierarchy are omitted ([#1522](https://github.com/dendronhq/dendron/issues/1522)) ([6c30af5](https://github.com/dendronhq/dendron/commit/6c30af5e5b76297334f15a435fd1f9ad09941e06))
* **markdown:** email parsed as user tag & option to disable user tags and hashtags ([#1562](https://github.com/dendronhq/dendron/issues/1562)) ([fd56f7e](https://github.com/dendronhq/dendron/commit/fd56f7ece1651ea6433ebf481f2c54386ab6fb16))
* **markdown:** footnote links move view in publishing & preview ([#1568](https://github.com/dendronhq/dendron/issues/1568)) ([fbe659d](https://github.com/dendronhq/dendron/commit/fbe659d2be3d1f2534d7437d585e9fa38f1684da))
* **note:** correctly handle note titles containing international characters ([#1801](https://github.com/dendronhq/dendron/issues/1801)) ([03b05f4](https://github.com/dendronhq/dendron/commit/03b05f4aa7887577365059f5bb22d8c3585afe40))
* **pods:** invalid configuration error ([398a599](https://github.com/dendronhq/dendron/commit/398a5995fc594566131eb283ff989a877ca9c995))
* **publish:** make mermaid work consistently on published sites ([2f648e0](https://github.com/dendronhq/dendron/commit/2f648e0a34c95095e86e8535a1fa8ec9ac4de39c))
* **schema:** When applying a schema template, do not override the body but append to the end to it ([#1812](https://github.com/dendronhq/dendron/issues/1812)) ([0a48123](https://github.com/dendronhq/dendron/commit/0a481230c29aee08493937772f1f4d57be511615))
* allow assets to open from preview view ([#1771](https://github.com/dendronhq/dendron/issues/1771)) ([f362bda](https://github.com/dendronhq/dendron/commit/f362bda9726c9dde2c96aa1954aa549c1f013136))
* **workspace:** checks against fnames with all lowercase ([#1739](https://github.com/dendronhq/dendron/issues/1739)) ([8e3f8ec](https://github.com/dendronhq/dendron/commit/8e3f8ec061e0ce7d249a7e92902bb48e7c520793))
* backward compatibility of id matching adding '_' to id regex match. ([#1504](https://github.com/dendronhq/dendron/issues/1504)) ([4bbae40](https://github.com/dendronhq/dendron/commit/4bbae40d81ea064612f605c6f4e18ae8d34ba0de))
* replace auto generated ids (coming from inline schemas) with patterns ([#1632](https://github.com/dendronhq/dendron/issues/1632)) ([af28cf6](https://github.com/dendronhq/dendron/commit/af28cf6ef1d085d22069695e9df128477c024d1b))


### Features Dendron

* decorator improvements ([#1770](https://github.com/dendronhq/dendron/issues/1770)) ([a7227fd](https://github.com/dendronhq/dendron/commit/a7227fd4d8991e44729989c821a22560dcb8348b))
* Native workspace enhancements ([#1670](https://github.com/dendronhq/dendron/issues/1670)) ([7a392bb](https://github.com/dendronhq/dendron/commit/7a392bb47c69b562d54fa15479a184f1441e129e))
* **notes:** task notes (create modifier & editor highlighting) ([#1583](https://github.com/dendronhq/dendron/issues/1583)) ([e785efa](https://github.com/dendronhq/dendron/commit/e785efa8e2ce55bc39fb90cf34984d55035dd6ca))
* **schemas:** adding new command - create schema from hierarchy ([#1673](https://github.com/dendronhq/dendron/issues/1673)) ([14732ec](https://github.com/dendronhq/dendron/commit/14732ecbdd42511337ddaaf3fc91bde288c3036d))
* **workspace:** better note previews ([#1666](https://github.com/dendronhq/dendron/issues/1666)) ([5cf7067](https://github.com/dendronhq/dendron/commit/5cf70672a24a62d528440f38b44813bfa627fb88))
* **workspace:** convert vault command ([#1542](https://github.com/dendronhq/dendron/issues/1542)) ([c265e9d](https://github.com/dendronhq/dendron/commit/c265e9d2c238b5a6b3761f4c073140b1a0debe3a))



## 0.62.3 (2021-10-09)


### Bug Fixes

* template doesn't copy FM tags ([#1488](https://github.com/dendronhq/dendron/issues/1488)) ([0317699](https://github.com/dendronhq/dendron/commit/0317699ef9bfd4d77b1d3d05f8093e725ea5b2c3)), closes [#1481](https://github.com/dendronhq/dendron/issues/1481)
* **view:** enable anchor links to work in preview ([#1375](https://github.com/dendronhq/dendron/issues/1375)) ([f27cfb0](https://github.com/dendronhq/dendron/commit/f27cfb07d612e28fd0d6dd08019d772767900bba))
* preview caching invalidation when notes with ![[ref]] links change ([#1385](https://github.com/dendronhq/dendron/issues/1385)) ([efeef86](https://github.com/dendronhq/dendron/commit/efeef8662ec52e64ba33cae9b1196bba6cc82f95))
* **publish:** bad seo props setter ([373d933](https://github.com/dendronhq/dendron/commit/373d9331aba3b3385632f01661dd6c80835ec5ac))


### Features Dendron

* Lapsed user survey ([#1446](https://github.com/dendronhq/dendron/issues/1446)) ([8094d2b](https://github.com/dendronhq/dendron/commit/8094d2bb1972fecf4fde74e8c5644aeba3eec119)), closes [#1349](https://github.com/dendronhq/dendron/issues/1349)
* **publish:** add table of contents ([#1428](https://github.com/dendronhq/dendron/issues/1428)) ([df4b05b](https://github.com/dendronhq/dendron/commit/df4b05ba8526dc32362d6a59543d880f253f02fc))



# 0.61.0 (2021-09-28)


### Bug Fixes

* **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))
* support activation for older vscode version ([#1426](https://github.com/dendronhq/dendron/issues/1426)) ([5a1c7ed](https://github.com/dendronhq/dendron/commit/5a1c7ed9b45df2f00e61229c0776dad41cc29aba))


### Features Dendron

* **workspace:** add survey for new users([#1409](https://github.com/dendronhq/dendron/issues/1409)) ([e2b1754](https://github.com/dendronhq/dendron/commit/e2b17548fbbe3dffef961eb393f82a6a876940e7))



## 0.60.2 (2021-09-25)



## 0.60.2-alpha.0 (2021-09-24)



## 0.60.1 (2021-09-24)


### Bug Fixes

* pesky error popup when schema lookup is closed ([#1389](https://github.com/dendronhq/dendron/issues/1389)) ([4d2bb40](https://github.com/dendronhq/dendron/commit/4d2bb401b17e926dc2eaa11957536f0c75a1e538))
* single letter look up matches ([#1388](https://github.com/dendronhq/dendron/issues/1388)) ([7de9a71](https://github.com/dendronhq/dendron/commit/7de9a7195a02399b1285b51ef08d6853b1f390f6))



# 0.60.0 (2021-09-21)


### Bug Fixes

* **commands:** rename note leaves incorrect metadata if parent is a stub ([#1348](https://github.com/dendronhq/dendron/issues/1348)) ([d432cc9](https://github.com/dendronhq/dendron/commit/d432cc9e20ff8b9f6cefd7cc4c3a42b567ed9bc5))
* **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))
* **workspace:** disable certain decorations for long notes to avoid performance hit ([#1337](https://github.com/dendronhq/dendron/issues/1337)) ([f1c46f9](https://github.com/dendronhq/dendron/commit/f1c46f95c228ada2126ec7212cede3bf5acc773d))
* direct children query ([#1303](https://github.com/dendronhq/dendron/issues/1303)) ([bcf0dea](https://github.com/dendronhq/dendron/commit/bcf0deae422406564cd9a56c1765f90dd2e66215))
* issue with webpack devCLI ([a4ff4c9](https://github.com/dendronhq/dendron/commit/a4ff4c9ae28ff31ab6f9483c339ae78b5144e185))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))
* stop calendar from auto expanding when the last note is closed ([#1299](https://github.com/dendronhq/dendron/issues/1299)) ([9c8f853](https://github.com/dendronhq/dendron/commit/9c8f8533da5027c122e0d003ce4c61dc866735f5))


### Features Dendron

* consolidate dendron configs ([#1295](https://github.com/dendronhq/dendron/issues/1295)) ([177ac92](https://github.com/dendronhq/dendron/commit/177ac925a5442471f041ce5d991da52cecee6c9b))
* nextjs publishing fulltext search ([#1334](https://github.com/dendronhq/dendron/issues/1334)) ([68f8473](https://github.com/dendronhq/dendron/commit/68f8473badf22494c8d0758f8195e377235321f6))
* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* user tags ([#1228](https://github.com/dendronhq/dendron/issues/1228)) ([98c0106](https://github.com/dendronhq/dendron/commit/98c0106367e384c130a927484b9ea294eb6f84fa))



## 0.55.2 (2021-08-21)


### Bug Fixes

* wrong internal links in nextjs publishing ([#1165](https://github.com/dendronhq/dendron/issues/1165)) ([59a949d](https://github.com/dendronhq/dendron/commit/59a949d2b5b541efb283e851060636b108eb5a98))



## 0.55.1 (2021-08-17)


### Bug Fixes

* multiple issues with lookupv3 ([1fdd9eb](https://github.com/dendronhq/dendron/commit/1fdd9eb3242b43539572a1993fefd174640c6d83))
* properly log error stack ([485e220](https://github.com/dendronhq/dendron/commit/485e220f8ffa6cd63210e106e846ff305b920b77))


### Features Dendron

* Insert Note Index command ([#1142](https://github.com/dendronhq/dendron/issues/1142)) ([c140015](https://github.com/dendronhq/dendron/commit/c140015c19a942cf4696d596e818fd89905eea25))
* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* undefined tags breaks note serialization ([b1d784c](https://github.com/dendronhq/dendron/commit/b1d784c8df18b3b45999f01c14793436ff669a3f))


### Features Dendron

* colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
* resolve vim keybinding conflict on initial install ([#1103](https://github.com/dendronhq/dendron/issues/1103)) ([2278c66](https://github.com/dendronhq/dendron/commit/2278c6616c8297cc414ad02d5323bff5c45072e4))
* **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))
* Add SchemaLookupCommand ([#1082](https://github.com/dendronhq/dendron/issues/1082)) ([fe11a0e](https://github.com/dendronhq/dendron/commit/fe11a0ea1e0214823dd01842b941456df164bc70))
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* generate json schema from config ([#1100](https://github.com/dendronhq/dendron/issues/1100)) ([53b189e](https://github.com/dendronhq/dendron/commit/53b189ec973a8d3d3ccf300a0e59908197f4efb1))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





# [0.74.0](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.74.0) (2021-12-21)


### Bug Fixes

* **refactor:** refactor crashes when captured note is a stub ([#1910](https://github.com/dendronhq/dendron/issues/1910)) ([24cf219](https://github.com/dendronhq/dendron/commit/24cf219d267ba63b0f9c140f19173898bece75b3))
* **workspace:** autocomplete deletes text following wikilink with no closing brackets ([#1909](https://github.com/dendronhq/dendron/issues/1909)) ([8fd0ef8](https://github.com/dendronhq/dendron/commit/8fd0ef8cd7710b8e6f5e74261d24c606e3c38f13)), closes [#1834](https://github.com/dendronhq/dendron/issues/1834)


### Features Dendron

* **navigation:** Goto Note can open links to non-note files ([#1844](https://github.com/dendronhq/dendron/issues/1844)) ([4223303](https://github.com/dendronhq/dendron/commit/4223303213731b341a45a73d9e2e55d53392630a))
* **navigation:** non-note file enhancements ([#1895](https://github.com/dendronhq/dendron/issues/1895)) ([90e083b](https://github.com/dendronhq/dendron/commit/90e083b5e10073acbc8967ad9649c0008aae381c))
* **notes:** Note Trait System Prototype (Phase 1) ([#1658](https://github.com/dendronhq/dendron/issues/1658)) ([0d5d187](https://github.com/dendronhq/dendron/commit/0d5d187a9aaaaebfc32fa9c7c5b5faa5c3b38eb3))
* **pod:** orbit import pod ([#1637](https://github.com/dendronhq/dendron/issues/1637)) ([66a5b14](https://github.com/dendronhq/dendron/commit/66a5b14019e542ade95f4cd2cb7b5cd3763d3b59))
* **refactoring:** add rename provider ([#1879](https://github.com/dendronhq/dendron/issues/1879)) ([988e18b](https://github.com/dendronhq/dendron/commit/988e18b8e03cb952898cb1cba9caf998b2e994f5))



# 0.72.0 (2021-12-07)


### Bug Fixes

* **views:** tree view not initializing on load ([5590a3c](https://github.com/dendronhq/dendron/commit/5590a3c0aa7476e8984a1e9193697d9984ab00ee))
* decorator lag problems ([#1822](https://github.com/dendronhq/dendron/issues/1822)) ([239bbdc](https://github.com/dendronhq/dendron/commit/239bbdc074e7bfde065a4210084002a0685471e5))
* **lookup:** hierarchy look up when inside parts of the hierarchy are omitted ([#1522](https://github.com/dendronhq/dendron/issues/1522)) ([6c30af5](https://github.com/dendronhq/dendron/commit/6c30af5e5b76297334f15a435fd1f9ad09941e06))
* **markdown:** email parsed as user tag & option to disable user tags and hashtags ([#1562](https://github.com/dendronhq/dendron/issues/1562)) ([fd56f7e](https://github.com/dendronhq/dendron/commit/fd56f7ece1651ea6433ebf481f2c54386ab6fb16))
* **markdown:** footnote links move view in publishing & preview ([#1568](https://github.com/dendronhq/dendron/issues/1568)) ([fbe659d](https://github.com/dendronhq/dendron/commit/fbe659d2be3d1f2534d7437d585e9fa38f1684da))
* **note:** correctly handle note titles containing international characters ([#1801](https://github.com/dendronhq/dendron/issues/1801)) ([03b05f4](https://github.com/dendronhq/dendron/commit/03b05f4aa7887577365059f5bb22d8c3585afe40))
* **pods:** invalid configuration error ([398a599](https://github.com/dendronhq/dendron/commit/398a5995fc594566131eb283ff989a877ca9c995))
* **publish:** make mermaid work consistently on published sites ([2f648e0](https://github.com/dendronhq/dendron/commit/2f648e0a34c95095e86e8535a1fa8ec9ac4de39c))
* **schema:** When applying a schema template, do not override the body but append to the end to it ([#1812](https://github.com/dendronhq/dendron/issues/1812)) ([0a48123](https://github.com/dendronhq/dendron/commit/0a481230c29aee08493937772f1f4d57be511615))
* allow assets to open from preview view ([#1771](https://github.com/dendronhq/dendron/issues/1771)) ([f362bda](https://github.com/dendronhq/dendron/commit/f362bda9726c9dde2c96aa1954aa549c1f013136))
* **workspace:** checks against fnames with all lowercase ([#1739](https://github.com/dendronhq/dendron/issues/1739)) ([8e3f8ec](https://github.com/dendronhq/dendron/commit/8e3f8ec061e0ce7d249a7e92902bb48e7c520793))
* backward compatibility of id matching adding '_' to id regex match. ([#1504](https://github.com/dendronhq/dendron/issues/1504)) ([4bbae40](https://github.com/dendronhq/dendron/commit/4bbae40d81ea064612f605c6f4e18ae8d34ba0de))
* replace auto generated ids (coming from inline schemas) with patterns ([#1632](https://github.com/dendronhq/dendron/issues/1632)) ([af28cf6](https://github.com/dendronhq/dendron/commit/af28cf6ef1d085d22069695e9df128477c024d1b))


### Features Dendron

* decorator improvements ([#1770](https://github.com/dendronhq/dendron/issues/1770)) ([a7227fd](https://github.com/dendronhq/dendron/commit/a7227fd4d8991e44729989c821a22560dcb8348b))
* Native workspace enhancements ([#1670](https://github.com/dendronhq/dendron/issues/1670)) ([7a392bb](https://github.com/dendronhq/dendron/commit/7a392bb47c69b562d54fa15479a184f1441e129e))
* **notes:** task notes (create modifier & editor highlighting) ([#1583](https://github.com/dendronhq/dendron/issues/1583)) ([e785efa](https://github.com/dendronhq/dendron/commit/e785efa8e2ce55bc39fb90cf34984d55035dd6ca))
* **schemas:** adding new command - create schema from hierarchy ([#1673](https://github.com/dendronhq/dendron/issues/1673)) ([14732ec](https://github.com/dendronhq/dendron/commit/14732ecbdd42511337ddaaf3fc91bde288c3036d))
* **workspace:** better note previews ([#1666](https://github.com/dendronhq/dendron/issues/1666)) ([5cf7067](https://github.com/dendronhq/dendron/commit/5cf70672a24a62d528440f38b44813bfa627fb88))
* **workspace:** convert vault command ([#1542](https://github.com/dendronhq/dendron/issues/1542)) ([c265e9d](https://github.com/dendronhq/dendron/commit/c265e9d2c238b5a6b3761f4c073140b1a0debe3a))



## 0.62.3 (2021-10-09)


### Bug Fixes

* template doesn't copy FM tags ([#1488](https://github.com/dendronhq/dendron/issues/1488)) ([0317699](https://github.com/dendronhq/dendron/commit/0317699ef9bfd4d77b1d3d05f8093e725ea5b2c3)), closes [#1481](https://github.com/dendronhq/dendron/issues/1481)
* **view:** enable anchor links to work in preview ([#1375](https://github.com/dendronhq/dendron/issues/1375)) ([f27cfb0](https://github.com/dendronhq/dendron/commit/f27cfb07d612e28fd0d6dd08019d772767900bba))
* preview caching invalidation when notes with ![[ref]] links change ([#1385](https://github.com/dendronhq/dendron/issues/1385)) ([efeef86](https://github.com/dendronhq/dendron/commit/efeef8662ec52e64ba33cae9b1196bba6cc82f95))
* **publish:** bad seo props setter ([373d933](https://github.com/dendronhq/dendron/commit/373d9331aba3b3385632f01661dd6c80835ec5ac))


### Features Dendron

* Lapsed user survey ([#1446](https://github.com/dendronhq/dendron/issues/1446)) ([8094d2b](https://github.com/dendronhq/dendron/commit/8094d2bb1972fecf4fde74e8c5644aeba3eec119)), closes [#1349](https://github.com/dendronhq/dendron/issues/1349)
* **publish:** add table of contents ([#1428](https://github.com/dendronhq/dendron/issues/1428)) ([df4b05b](https://github.com/dendronhq/dendron/commit/df4b05ba8526dc32362d6a59543d880f253f02fc))



# 0.61.0 (2021-09-28)


### Bug Fixes

* **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))
* support activation for older vscode version ([#1426](https://github.com/dendronhq/dendron/issues/1426)) ([5a1c7ed](https://github.com/dendronhq/dendron/commit/5a1c7ed9b45df2f00e61229c0776dad41cc29aba))


### Features Dendron

* **workspace:** add survey for new users([#1409](https://github.com/dendronhq/dendron/issues/1409)) ([e2b1754](https://github.com/dendronhq/dendron/commit/e2b17548fbbe3dffef961eb393f82a6a876940e7))



## 0.60.2 (2021-09-25)



## 0.60.2-alpha.0 (2021-09-24)



## 0.60.1 (2021-09-24)


### Bug Fixes

* pesky error popup when schema lookup is closed ([#1389](https://github.com/dendronhq/dendron/issues/1389)) ([4d2bb40](https://github.com/dendronhq/dendron/commit/4d2bb401b17e926dc2eaa11957536f0c75a1e538))
* single letter look up matches ([#1388](https://github.com/dendronhq/dendron/issues/1388)) ([7de9a71](https://github.com/dendronhq/dendron/commit/7de9a7195a02399b1285b51ef08d6853b1f390f6))



# 0.60.0 (2021-09-21)


### Bug Fixes

* **commands:** rename note leaves incorrect metadata if parent is a stub ([#1348](https://github.com/dendronhq/dendron/issues/1348)) ([d432cc9](https://github.com/dendronhq/dendron/commit/d432cc9e20ff8b9f6cefd7cc4c3a42b567ed9bc5))
* **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))
* **workspace:** disable certain decorations for long notes to avoid performance hit ([#1337](https://github.com/dendronhq/dendron/issues/1337)) ([f1c46f9](https://github.com/dendronhq/dendron/commit/f1c46f95c228ada2126ec7212cede3bf5acc773d))
* direct children query ([#1303](https://github.com/dendronhq/dendron/issues/1303)) ([bcf0dea](https://github.com/dendronhq/dendron/commit/bcf0deae422406564cd9a56c1765f90dd2e66215))
* issue with webpack devCLI ([a4ff4c9](https://github.com/dendronhq/dendron/commit/a4ff4c9ae28ff31ab6f9483c339ae78b5144e185))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))
* stop calendar from auto expanding when the last note is closed ([#1299](https://github.com/dendronhq/dendron/issues/1299)) ([9c8f853](https://github.com/dendronhq/dendron/commit/9c8f8533da5027c122e0d003ce4c61dc866735f5))


### Features Dendron

* consolidate dendron configs ([#1295](https://github.com/dendronhq/dendron/issues/1295)) ([177ac92](https://github.com/dendronhq/dendron/commit/177ac925a5442471f041ce5d991da52cecee6c9b))
* nextjs publishing fulltext search ([#1334](https://github.com/dendronhq/dendron/issues/1334)) ([68f8473](https://github.com/dendronhq/dendron/commit/68f8473badf22494c8d0758f8195e377235321f6))
* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* user tags ([#1228](https://github.com/dendronhq/dendron/issues/1228)) ([98c0106](https://github.com/dendronhq/dendron/commit/98c0106367e384c130a927484b9ea294eb6f84fa))



## 0.55.2 (2021-08-21)


### Bug Fixes

* wrong internal links in nextjs publishing ([#1165](https://github.com/dendronhq/dendron/issues/1165)) ([59a949d](https://github.com/dendronhq/dendron/commit/59a949d2b5b541efb283e851060636b108eb5a98))



## 0.55.1 (2021-08-17)


### Bug Fixes

* multiple issues with lookupv3 ([1fdd9eb](https://github.com/dendronhq/dendron/commit/1fdd9eb3242b43539572a1993fefd174640c6d83))
* properly log error stack ([485e220](https://github.com/dendronhq/dendron/commit/485e220f8ffa6cd63210e106e846ff305b920b77))


### Features Dendron

* Insert Note Index command ([#1142](https://github.com/dendronhq/dendron/issues/1142)) ([c140015](https://github.com/dendronhq/dendron/commit/c140015c19a942cf4696d596e818fd89905eea25))
* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* undefined tags breaks note serialization ([b1d784c](https://github.com/dendronhq/dendron/commit/b1d784c8df18b3b45999f01c14793436ff669a3f))


### Features Dendron

* colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
* resolve vim keybinding conflict on initial install ([#1103](https://github.com/dendronhq/dendron/issues/1103)) ([2278c66](https://github.com/dendronhq/dendron/commit/2278c6616c8297cc414ad02d5323bff5c45072e4))
* **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))
* Add SchemaLookupCommand ([#1082](https://github.com/dendronhq/dendron/issues/1082)) ([fe11a0e](https://github.com/dendronhq/dendron/commit/fe11a0ea1e0214823dd01842b941456df164bc70))
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* generate json schema from config ([#1100](https://github.com/dendronhq/dendron/issues/1100)) ([53b189e](https://github.com/dendronhq/dendron/commit/53b189ec973a8d3d3ccf300a0e59908197f4efb1))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.73.1](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.73.1) (2021-12-15)


### Features Dendron

* **navigation:** Goto Note can open links to non-note files ([#1844](https://github.com/dendronhq/dendron/issues/1844)) ([4223303](https://github.com/dendronhq/dendron/commit/4223303213731b341a45a73d9e2e55d53392630a))
* **notes:** Note Trait System Prototype (Phase 1) ([#1658](https://github.com/dendronhq/dendron/issues/1658)) ([0d5d187](https://github.com/dendronhq/dendron/commit/0d5d187a9aaaaebfc32fa9c7c5b5faa5c3b38eb3))
* **pod:** orbit import pod ([#1637](https://github.com/dendronhq/dendron/issues/1637)) ([66a5b14](https://github.com/dendronhq/dendron/commit/66a5b14019e542ade95f4cd2cb7b5cd3763d3b59))
* **refactoring:** add rename provider ([#1879](https://github.com/dendronhq/dendron/issues/1879)) ([988e18b](https://github.com/dendronhq/dendron/commit/988e18b8e03cb952898cb1cba9caf998b2e994f5))



# 0.72.0 (2021-12-07)


### Bug Fixes

* **views:** tree view not initializing on load ([5590a3c](https://github.com/dendronhq/dendron/commit/5590a3c0aa7476e8984a1e9193697d9984ab00ee))
* decorator lag problems ([#1822](https://github.com/dendronhq/dendron/issues/1822)) ([239bbdc](https://github.com/dendronhq/dendron/commit/239bbdc074e7bfde065a4210084002a0685471e5))
* **lookup:** hierarchy look up when inside parts of the hierarchy are omitted ([#1522](https://github.com/dendronhq/dendron/issues/1522)) ([6c30af5](https://github.com/dendronhq/dendron/commit/6c30af5e5b76297334f15a435fd1f9ad09941e06))
* **markdown:** email parsed as user tag & option to disable user tags and hashtags ([#1562](https://github.com/dendronhq/dendron/issues/1562)) ([fd56f7e](https://github.com/dendronhq/dendron/commit/fd56f7ece1651ea6433ebf481f2c54386ab6fb16))
* **markdown:** footnote links move view in publishing & preview ([#1568](https://github.com/dendronhq/dendron/issues/1568)) ([fbe659d](https://github.com/dendronhq/dendron/commit/fbe659d2be3d1f2534d7437d585e9fa38f1684da))
* **note:** correctly handle note titles containing international characters ([#1801](https://github.com/dendronhq/dendron/issues/1801)) ([03b05f4](https://github.com/dendronhq/dendron/commit/03b05f4aa7887577365059f5bb22d8c3585afe40))
* **pods:** invalid configuration error ([398a599](https://github.com/dendronhq/dendron/commit/398a5995fc594566131eb283ff989a877ca9c995))
* **publish:** make mermaid work consistently on published sites ([2f648e0](https://github.com/dendronhq/dendron/commit/2f648e0a34c95095e86e8535a1fa8ec9ac4de39c))
* **schema:** When applying a schema template, do not override the body but append to the end to it ([#1812](https://github.com/dendronhq/dendron/issues/1812)) ([0a48123](https://github.com/dendronhq/dendron/commit/0a481230c29aee08493937772f1f4d57be511615))
* allow assets to open from preview view ([#1771](https://github.com/dendronhq/dendron/issues/1771)) ([f362bda](https://github.com/dendronhq/dendron/commit/f362bda9726c9dde2c96aa1954aa549c1f013136))
* **workspace:** checks against fnames with all lowercase ([#1739](https://github.com/dendronhq/dendron/issues/1739)) ([8e3f8ec](https://github.com/dendronhq/dendron/commit/8e3f8ec061e0ce7d249a7e92902bb48e7c520793))
* backward compatibility of id matching adding '_' to id regex match. ([#1504](https://github.com/dendronhq/dendron/issues/1504)) ([4bbae40](https://github.com/dendronhq/dendron/commit/4bbae40d81ea064612f605c6f4e18ae8d34ba0de))
* replace auto generated ids (coming from inline schemas) with patterns ([#1632](https://github.com/dendronhq/dendron/issues/1632)) ([af28cf6](https://github.com/dendronhq/dendron/commit/af28cf6ef1d085d22069695e9df128477c024d1b))


### Features Dendron

* decorator improvements ([#1770](https://github.com/dendronhq/dendron/issues/1770)) ([a7227fd](https://github.com/dendronhq/dendron/commit/a7227fd4d8991e44729989c821a22560dcb8348b))
* Native workspace enhancements ([#1670](https://github.com/dendronhq/dendron/issues/1670)) ([7a392bb](https://github.com/dendronhq/dendron/commit/7a392bb47c69b562d54fa15479a184f1441e129e))
* **notes:** task notes (create modifier & editor highlighting) ([#1583](https://github.com/dendronhq/dendron/issues/1583)) ([e785efa](https://github.com/dendronhq/dendron/commit/e785efa8e2ce55bc39fb90cf34984d55035dd6ca))
* **schemas:** adding new command - create schema from hierarchy ([#1673](https://github.com/dendronhq/dendron/issues/1673)) ([14732ec](https://github.com/dendronhq/dendron/commit/14732ecbdd42511337ddaaf3fc91bde288c3036d))
* **workspace:** better note previews ([#1666](https://github.com/dendronhq/dendron/issues/1666)) ([5cf7067](https://github.com/dendronhq/dendron/commit/5cf70672a24a62d528440f38b44813bfa627fb88))
* **workspace:** convert vault command ([#1542](https://github.com/dendronhq/dendron/issues/1542)) ([c265e9d](https://github.com/dendronhq/dendron/commit/c265e9d2c238b5a6b3761f4c073140b1a0debe3a))



## 0.62.3 (2021-10-09)


### Bug Fixes

* template doesn't copy FM tags ([#1488](https://github.com/dendronhq/dendron/issues/1488)) ([0317699](https://github.com/dendronhq/dendron/commit/0317699ef9bfd4d77b1d3d05f8093e725ea5b2c3)), closes [#1481](https://github.com/dendronhq/dendron/issues/1481)
* **view:** enable anchor links to work in preview ([#1375](https://github.com/dendronhq/dendron/issues/1375)) ([f27cfb0](https://github.com/dendronhq/dendron/commit/f27cfb07d612e28fd0d6dd08019d772767900bba))
* preview caching invalidation when notes with ![[ref]] links change ([#1385](https://github.com/dendronhq/dendron/issues/1385)) ([efeef86](https://github.com/dendronhq/dendron/commit/efeef8662ec52e64ba33cae9b1196bba6cc82f95))
* **publish:** bad seo props setter ([373d933](https://github.com/dendronhq/dendron/commit/373d9331aba3b3385632f01661dd6c80835ec5ac))


### Features Dendron

* Lapsed user survey ([#1446](https://github.com/dendronhq/dendron/issues/1446)) ([8094d2b](https://github.com/dendronhq/dendron/commit/8094d2bb1972fecf4fde74e8c5644aeba3eec119)), closes [#1349](https://github.com/dendronhq/dendron/issues/1349)
* **publish:** add table of contents ([#1428](https://github.com/dendronhq/dendron/issues/1428)) ([df4b05b](https://github.com/dendronhq/dendron/commit/df4b05ba8526dc32362d6a59543d880f253f02fc))



# 0.61.0 (2021-09-28)


### Bug Fixes

* **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))
* support activation for older vscode version ([#1426](https://github.com/dendronhq/dendron/issues/1426)) ([5a1c7ed](https://github.com/dendronhq/dendron/commit/5a1c7ed9b45df2f00e61229c0776dad41cc29aba))


### Features Dendron

* **workspace:** add survey for new users([#1409](https://github.com/dendronhq/dendron/issues/1409)) ([e2b1754](https://github.com/dendronhq/dendron/commit/e2b17548fbbe3dffef961eb393f82a6a876940e7))



## 0.60.2 (2021-09-25)



## 0.60.2-alpha.0 (2021-09-24)



## 0.60.1 (2021-09-24)


### Bug Fixes

* pesky error popup when schema lookup is closed ([#1389](https://github.com/dendronhq/dendron/issues/1389)) ([4d2bb40](https://github.com/dendronhq/dendron/commit/4d2bb401b17e926dc2eaa11957536f0c75a1e538))
* single letter look up matches ([#1388](https://github.com/dendronhq/dendron/issues/1388)) ([7de9a71](https://github.com/dendronhq/dendron/commit/7de9a7195a02399b1285b51ef08d6853b1f390f6))



# 0.60.0 (2021-09-21)


### Bug Fixes

* **commands:** rename note leaves incorrect metadata if parent is a stub ([#1348](https://github.com/dendronhq/dendron/issues/1348)) ([d432cc9](https://github.com/dendronhq/dendron/commit/d432cc9e20ff8b9f6cefd7cc4c3a42b567ed9bc5))
* **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))
* **workspace:** disable certain decorations for long notes to avoid performance hit ([#1337](https://github.com/dendronhq/dendron/issues/1337)) ([f1c46f9](https://github.com/dendronhq/dendron/commit/f1c46f95c228ada2126ec7212cede3bf5acc773d))
* direct children query ([#1303](https://github.com/dendronhq/dendron/issues/1303)) ([bcf0dea](https://github.com/dendronhq/dendron/commit/bcf0deae422406564cd9a56c1765f90dd2e66215))
* issue with webpack devCLI ([a4ff4c9](https://github.com/dendronhq/dendron/commit/a4ff4c9ae28ff31ab6f9483c339ae78b5144e185))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))
* stop calendar from auto expanding when the last note is closed ([#1299](https://github.com/dendronhq/dendron/issues/1299)) ([9c8f853](https://github.com/dendronhq/dendron/commit/9c8f8533da5027c122e0d003ce4c61dc866735f5))


### Features Dendron

* consolidate dendron configs ([#1295](https://github.com/dendronhq/dendron/issues/1295)) ([177ac92](https://github.com/dendronhq/dendron/commit/177ac925a5442471f041ce5d991da52cecee6c9b))
* nextjs publishing fulltext search ([#1334](https://github.com/dendronhq/dendron/issues/1334)) ([68f8473](https://github.com/dendronhq/dendron/commit/68f8473badf22494c8d0758f8195e377235321f6))
* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* user tags ([#1228](https://github.com/dendronhq/dendron/issues/1228)) ([98c0106](https://github.com/dendronhq/dendron/commit/98c0106367e384c130a927484b9ea294eb6f84fa))



## 0.55.2 (2021-08-21)


### Bug Fixes

* wrong internal links in nextjs publishing ([#1165](https://github.com/dendronhq/dendron/issues/1165)) ([59a949d](https://github.com/dendronhq/dendron/commit/59a949d2b5b541efb283e851060636b108eb5a98))



## 0.55.1 (2021-08-17)


### Bug Fixes

* multiple issues with lookupv3 ([1fdd9eb](https://github.com/dendronhq/dendron/commit/1fdd9eb3242b43539572a1993fefd174640c6d83))
* properly log error stack ([485e220](https://github.com/dendronhq/dendron/commit/485e220f8ffa6cd63210e106e846ff305b920b77))


### Features Dendron

* Insert Note Index command ([#1142](https://github.com/dendronhq/dendron/issues/1142)) ([c140015](https://github.com/dendronhq/dendron/commit/c140015c19a942cf4696d596e818fd89905eea25))
* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* undefined tags breaks note serialization ([b1d784c](https://github.com/dendronhq/dendron/commit/b1d784c8df18b3b45999f01c14793436ff669a3f))


### Features Dendron

* colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
* resolve vim keybinding conflict on initial install ([#1103](https://github.com/dendronhq/dendron/issues/1103)) ([2278c66](https://github.com/dendronhq/dendron/commit/2278c6616c8297cc414ad02d5323bff5c45072e4))
* **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))
* Add SchemaLookupCommand ([#1082](https://github.com/dendronhq/dendron/issues/1082)) ([fe11a0e](https://github.com/dendronhq/dendron/commit/fe11a0ea1e0214823dd01842b941456df164bc70))
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* generate json schema from config ([#1100](https://github.com/dendronhq/dendron/issues/1100)) ([53b189e](https://github.com/dendronhq/dendron/commit/53b189ec973a8d3d3ccf300a0e59908197f4efb1))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





# [0.73.0](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.73.0) (2021-12-14)


### Features Dendron

* **navigation:** Goto Note can open links to non-note files ([#1844](https://github.com/dendronhq/dendron/issues/1844)) ([4223303](https://github.com/dendronhq/dendron/commit/4223303213731b341a45a73d9e2e55d53392630a))
* **notes:** Note Trait System Prototype (Phase 1) ([#1658](https://github.com/dendronhq/dendron/issues/1658)) ([0d5d187](https://github.com/dendronhq/dendron/commit/0d5d187a9aaaaebfc32fa9c7c5b5faa5c3b38eb3))
* **pod:** orbit import pod ([#1637](https://github.com/dendronhq/dendron/issues/1637)) ([66a5b14](https://github.com/dendronhq/dendron/commit/66a5b14019e542ade95f4cd2cb7b5cd3763d3b59))
* **refactoring:** add rename provider ([#1879](https://github.com/dendronhq/dendron/issues/1879)) ([988e18b](https://github.com/dendronhq/dendron/commit/988e18b8e03cb952898cb1cba9caf998b2e994f5))



# 0.72.0 (2021-12-07)


### Bug Fixes

* **views:** tree view not initializing on load ([5590a3c](https://github.com/dendronhq/dendron/commit/5590a3c0aa7476e8984a1e9193697d9984ab00ee))
* decorator lag problems ([#1822](https://github.com/dendronhq/dendron/issues/1822)) ([239bbdc](https://github.com/dendronhq/dendron/commit/239bbdc074e7bfde065a4210084002a0685471e5))
* **lookup:** hierarchy look up when inside parts of the hierarchy are omitted ([#1522](https://github.com/dendronhq/dendron/issues/1522)) ([6c30af5](https://github.com/dendronhq/dendron/commit/6c30af5e5b76297334f15a435fd1f9ad09941e06))
* **markdown:** email parsed as user tag & option to disable user tags and hashtags ([#1562](https://github.com/dendronhq/dendron/issues/1562)) ([fd56f7e](https://github.com/dendronhq/dendron/commit/fd56f7ece1651ea6433ebf481f2c54386ab6fb16))
* **markdown:** footnote links move view in publishing & preview ([#1568](https://github.com/dendronhq/dendron/issues/1568)) ([fbe659d](https://github.com/dendronhq/dendron/commit/fbe659d2be3d1f2534d7437d585e9fa38f1684da))
* **note:** correctly handle note titles containing international characters ([#1801](https://github.com/dendronhq/dendron/issues/1801)) ([03b05f4](https://github.com/dendronhq/dendron/commit/03b05f4aa7887577365059f5bb22d8c3585afe40))
* **pods:** invalid configuration error ([398a599](https://github.com/dendronhq/dendron/commit/398a5995fc594566131eb283ff989a877ca9c995))
* **publish:** make mermaid work consistently on published sites ([2f648e0](https://github.com/dendronhq/dendron/commit/2f648e0a34c95095e86e8535a1fa8ec9ac4de39c))
* **schema:** When applying a schema template, do not override the body but append to the end to it ([#1812](https://github.com/dendronhq/dendron/issues/1812)) ([0a48123](https://github.com/dendronhq/dendron/commit/0a481230c29aee08493937772f1f4d57be511615))
* allow assets to open from preview view ([#1771](https://github.com/dendronhq/dendron/issues/1771)) ([f362bda](https://github.com/dendronhq/dendron/commit/f362bda9726c9dde2c96aa1954aa549c1f013136))
* **workspace:** checks against fnames with all lowercase ([#1739](https://github.com/dendronhq/dendron/issues/1739)) ([8e3f8ec](https://github.com/dendronhq/dendron/commit/8e3f8ec061e0ce7d249a7e92902bb48e7c520793))
* backward compatibility of id matching adding '_' to id regex match. ([#1504](https://github.com/dendronhq/dendron/issues/1504)) ([4bbae40](https://github.com/dendronhq/dendron/commit/4bbae40d81ea064612f605c6f4e18ae8d34ba0de))
* replace auto generated ids (coming from inline schemas) with patterns ([#1632](https://github.com/dendronhq/dendron/issues/1632)) ([af28cf6](https://github.com/dendronhq/dendron/commit/af28cf6ef1d085d22069695e9df128477c024d1b))


### Features Dendron

* decorator improvements ([#1770](https://github.com/dendronhq/dendron/issues/1770)) ([a7227fd](https://github.com/dendronhq/dendron/commit/a7227fd4d8991e44729989c821a22560dcb8348b))
* Native workspace enhancements ([#1670](https://github.com/dendronhq/dendron/issues/1670)) ([7a392bb](https://github.com/dendronhq/dendron/commit/7a392bb47c69b562d54fa15479a184f1441e129e))
* **notes:** task notes (create modifier & editor highlighting) ([#1583](https://github.com/dendronhq/dendron/issues/1583)) ([e785efa](https://github.com/dendronhq/dendron/commit/e785efa8e2ce55bc39fb90cf34984d55035dd6ca))
* **schemas:** adding new command - create schema from hierarchy ([#1673](https://github.com/dendronhq/dendron/issues/1673)) ([14732ec](https://github.com/dendronhq/dendron/commit/14732ecbdd42511337ddaaf3fc91bde288c3036d))
* **workspace:** better note previews ([#1666](https://github.com/dendronhq/dendron/issues/1666)) ([5cf7067](https://github.com/dendronhq/dendron/commit/5cf70672a24a62d528440f38b44813bfa627fb88))
* **workspace:** convert vault command ([#1542](https://github.com/dendronhq/dendron/issues/1542)) ([c265e9d](https://github.com/dendronhq/dendron/commit/c265e9d2c238b5a6b3761f4c073140b1a0debe3a))



## 0.62.3 (2021-10-09)


### Bug Fixes

* template doesn't copy FM tags ([#1488](https://github.com/dendronhq/dendron/issues/1488)) ([0317699](https://github.com/dendronhq/dendron/commit/0317699ef9bfd4d77b1d3d05f8093e725ea5b2c3)), closes [#1481](https://github.com/dendronhq/dendron/issues/1481)
* **view:** enable anchor links to work in preview ([#1375](https://github.com/dendronhq/dendron/issues/1375)) ([f27cfb0](https://github.com/dendronhq/dendron/commit/f27cfb07d612e28fd0d6dd08019d772767900bba))
* preview caching invalidation when notes with ![[ref]] links change ([#1385](https://github.com/dendronhq/dendron/issues/1385)) ([efeef86](https://github.com/dendronhq/dendron/commit/efeef8662ec52e64ba33cae9b1196bba6cc82f95))
* **publish:** bad seo props setter ([373d933](https://github.com/dendronhq/dendron/commit/373d9331aba3b3385632f01661dd6c80835ec5ac))


### Features Dendron

* Lapsed user survey ([#1446](https://github.com/dendronhq/dendron/issues/1446)) ([8094d2b](https://github.com/dendronhq/dendron/commit/8094d2bb1972fecf4fde74e8c5644aeba3eec119)), closes [#1349](https://github.com/dendronhq/dendron/issues/1349)
* **publish:** add table of contents ([#1428](https://github.com/dendronhq/dendron/issues/1428)) ([df4b05b](https://github.com/dendronhq/dendron/commit/df4b05ba8526dc32362d6a59543d880f253f02fc))



# 0.61.0 (2021-09-28)


### Bug Fixes

* **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))
* support activation for older vscode version ([#1426](https://github.com/dendronhq/dendron/issues/1426)) ([5a1c7ed](https://github.com/dendronhq/dendron/commit/5a1c7ed9b45df2f00e61229c0776dad41cc29aba))


### Features Dendron

* **workspace:** add survey for new users([#1409](https://github.com/dendronhq/dendron/issues/1409)) ([e2b1754](https://github.com/dendronhq/dendron/commit/e2b17548fbbe3dffef961eb393f82a6a876940e7))



## 0.60.2 (2021-09-25)



## 0.60.2-alpha.0 (2021-09-24)



## 0.60.1 (2021-09-24)


### Bug Fixes

* pesky error popup when schema lookup is closed ([#1389](https://github.com/dendronhq/dendron/issues/1389)) ([4d2bb40](https://github.com/dendronhq/dendron/commit/4d2bb401b17e926dc2eaa11957536f0c75a1e538))
* single letter look up matches ([#1388](https://github.com/dendronhq/dendron/issues/1388)) ([7de9a71](https://github.com/dendronhq/dendron/commit/7de9a7195a02399b1285b51ef08d6853b1f390f6))



# 0.60.0 (2021-09-21)


### Bug Fixes

* **commands:** rename note leaves incorrect metadata if parent is a stub ([#1348](https://github.com/dendronhq/dendron/issues/1348)) ([d432cc9](https://github.com/dendronhq/dendron/commit/d432cc9e20ff8b9f6cefd7cc4c3a42b567ed9bc5))
* **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))
* **workspace:** disable certain decorations for long notes to avoid performance hit ([#1337](https://github.com/dendronhq/dendron/issues/1337)) ([f1c46f9](https://github.com/dendronhq/dendron/commit/f1c46f95c228ada2126ec7212cede3bf5acc773d))
* direct children query ([#1303](https://github.com/dendronhq/dendron/issues/1303)) ([bcf0dea](https://github.com/dendronhq/dendron/commit/bcf0deae422406564cd9a56c1765f90dd2e66215))
* issue with webpack devCLI ([a4ff4c9](https://github.com/dendronhq/dendron/commit/a4ff4c9ae28ff31ab6f9483c339ae78b5144e185))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))
* stop calendar from auto expanding when the last note is closed ([#1299](https://github.com/dendronhq/dendron/issues/1299)) ([9c8f853](https://github.com/dendronhq/dendron/commit/9c8f8533da5027c122e0d003ce4c61dc866735f5))


### Features Dendron

* consolidate dendron configs ([#1295](https://github.com/dendronhq/dendron/issues/1295)) ([177ac92](https://github.com/dendronhq/dendron/commit/177ac925a5442471f041ce5d991da52cecee6c9b))
* nextjs publishing fulltext search ([#1334](https://github.com/dendronhq/dendron/issues/1334)) ([68f8473](https://github.com/dendronhq/dendron/commit/68f8473badf22494c8d0758f8195e377235321f6))
* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* user tags ([#1228](https://github.com/dendronhq/dendron/issues/1228)) ([98c0106](https://github.com/dendronhq/dendron/commit/98c0106367e384c130a927484b9ea294eb6f84fa))



## 0.55.2 (2021-08-21)


### Bug Fixes

* wrong internal links in nextjs publishing ([#1165](https://github.com/dendronhq/dendron/issues/1165)) ([59a949d](https://github.com/dendronhq/dendron/commit/59a949d2b5b541efb283e851060636b108eb5a98))



## 0.55.1 (2021-08-17)


### Bug Fixes

* multiple issues with lookupv3 ([1fdd9eb](https://github.com/dendronhq/dendron/commit/1fdd9eb3242b43539572a1993fefd174640c6d83))
* properly log error stack ([485e220](https://github.com/dendronhq/dendron/commit/485e220f8ffa6cd63210e106e846ff305b920b77))


### Features Dendron

* Insert Note Index command ([#1142](https://github.com/dendronhq/dendron/issues/1142)) ([c140015](https://github.com/dendronhq/dendron/commit/c140015c19a942cf4696d596e818fd89905eea25))
* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* undefined tags breaks note serialization ([b1d784c](https://github.com/dendronhq/dendron/commit/b1d784c8df18b3b45999f01c14793436ff669a3f))


### Features Dendron

* colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
* resolve vim keybinding conflict on initial install ([#1103](https://github.com/dendronhq/dendron/issues/1103)) ([2278c66](https://github.com/dendronhq/dendron/commit/2278c6616c8297cc414ad02d5323bff5c45072e4))
* **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))
* Add SchemaLookupCommand ([#1082](https://github.com/dendronhq/dendron/issues/1082)) ([fe11a0e](https://github.com/dendronhq/dendron/commit/fe11a0ea1e0214823dd01842b941456df164bc70))
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* generate json schema from config ([#1100](https://github.com/dendronhq/dendron/issues/1100)) ([53b189e](https://github.com/dendronhq/dendron/commit/53b189ec973a8d3d3ccf300a0e59908197f4efb1))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





# 0.72.0 (2021-12-07)


### Bug Fixes

* **views:** update webview title name ([16d1f0c](https://github.com/dendronhq/dendron/commit/16d1f0c2454e4056d56d988aa909c2ea70cf18b1))





## [0.71.3](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.71.3) (2021-11-30)


### Bug Fixes

* **note:** correctly handle note titles containing international characters ([#1801](https://github.com/dendronhq/dendron/issues/1801)) ([03b05f4](https://github.com/dendronhq/dendron/commit/03b05f4aa7887577365059f5bb22d8c3585afe40))
* allow assets to open from preview view ([#1771](https://github.com/dendronhq/dendron/issues/1771)) ([f362bda](https://github.com/dendronhq/dendron/commit/f362bda9726c9dde2c96aa1954aa549c1f013136))
* **lookup:** hierarchy look up when inside parts of the hierarchy are omitted ([#1522](https://github.com/dendronhq/dendron/issues/1522)) ([6c30af5](https://github.com/dendronhq/dendron/commit/6c30af5e5b76297334f15a435fd1f9ad09941e06))
* **markdown:** email parsed as user tag & option to disable user tags and hashtags ([#1562](https://github.com/dendronhq/dendron/issues/1562)) ([fd56f7e](https://github.com/dendronhq/dendron/commit/fd56f7ece1651ea6433ebf481f2c54386ab6fb16))
* **markdown:** footnote links move view in publishing & preview ([#1568](https://github.com/dendronhq/dendron/issues/1568)) ([fbe659d](https://github.com/dendronhq/dendron/commit/fbe659d2be3d1f2534d7437d585e9fa38f1684da))
* **pods:** invalid configuration error ([398a599](https://github.com/dendronhq/dendron/commit/398a5995fc594566131eb283ff989a877ca9c995))
* **publish:** make mermaid work consistently on published sites ([2f648e0](https://github.com/dendronhq/dendron/commit/2f648e0a34c95095e86e8535a1fa8ec9ac4de39c))
* **workspace:** checks against fnames with all lowercase ([#1739](https://github.com/dendronhq/dendron/issues/1739)) ([8e3f8ec](https://github.com/dendronhq/dendron/commit/8e3f8ec061e0ce7d249a7e92902bb48e7c520793))
* backward compatibility of id matching adding '_' to id regex match. ([#1504](https://github.com/dendronhq/dendron/issues/1504)) ([4bbae40](https://github.com/dendronhq/dendron/commit/4bbae40d81ea064612f605c6f4e18ae8d34ba0de))
* replace auto generated ids (coming from inline schemas) with patterns ([#1632](https://github.com/dendronhq/dendron/issues/1632)) ([af28cf6](https://github.com/dendronhq/dendron/commit/af28cf6ef1d085d22069695e9df128477c024d1b))


### Features Dendron

* decorator improvements ([#1770](https://github.com/dendronhq/dendron/issues/1770)) ([a7227fd](https://github.com/dendronhq/dendron/commit/a7227fd4d8991e44729989c821a22560dcb8348b))
* Native workspace enhancements ([#1670](https://github.com/dendronhq/dendron/issues/1670)) ([7a392bb](https://github.com/dendronhq/dendron/commit/7a392bb47c69b562d54fa15479a184f1441e129e))
* **notes:** task notes (create modifier & editor highlighting) ([#1583](https://github.com/dendronhq/dendron/issues/1583)) ([e785efa](https://github.com/dendronhq/dendron/commit/e785efa8e2ce55bc39fb90cf34984d55035dd6ca))
* **schemas:** adding new command - create schema from hierarchy ([#1673](https://github.com/dendronhq/dendron/issues/1673)) ([14732ec](https://github.com/dendronhq/dendron/commit/14732ecbdd42511337ddaaf3fc91bde288c3036d))
* **workspace:** better note previews ([#1666](https://github.com/dendronhq/dendron/issues/1666)) ([5cf7067](https://github.com/dendronhq/dendron/commit/5cf70672a24a62d528440f38b44813bfa627fb88))
* **workspace:** convert vault command ([#1542](https://github.com/dendronhq/dendron/issues/1542)) ([c265e9d](https://github.com/dendronhq/dendron/commit/c265e9d2c238b5a6b3761f4c073140b1a0debe3a))



## 0.62.3 (2021-10-09)


### Bug Fixes

* template doesn't copy FM tags ([#1488](https://github.com/dendronhq/dendron/issues/1488)) ([0317699](https://github.com/dendronhq/dendron/commit/0317699ef9bfd4d77b1d3d05f8093e725ea5b2c3)), closes [#1481](https://github.com/dendronhq/dendron/issues/1481)
* **view:** enable anchor links to work in preview ([#1375](https://github.com/dendronhq/dendron/issues/1375)) ([f27cfb0](https://github.com/dendronhq/dendron/commit/f27cfb07d612e28fd0d6dd08019d772767900bba))
* preview caching invalidation when notes with ![[ref]] links change ([#1385](https://github.com/dendronhq/dendron/issues/1385)) ([efeef86](https://github.com/dendronhq/dendron/commit/efeef8662ec52e64ba33cae9b1196bba6cc82f95))
* **publish:** bad seo props setter ([373d933](https://github.com/dendronhq/dendron/commit/373d9331aba3b3385632f01661dd6c80835ec5ac))


### Features Dendron

* Lapsed user survey ([#1446](https://github.com/dendronhq/dendron/issues/1446)) ([8094d2b](https://github.com/dendronhq/dendron/commit/8094d2bb1972fecf4fde74e8c5644aeba3eec119)), closes [#1349](https://github.com/dendronhq/dendron/issues/1349)
* **publish:** add table of contents ([#1428](https://github.com/dendronhq/dendron/issues/1428)) ([df4b05b](https://github.com/dendronhq/dendron/commit/df4b05ba8526dc32362d6a59543d880f253f02fc))



# 0.61.0 (2021-09-28)


### Bug Fixes

* **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))
* support activation for older vscode version ([#1426](https://github.com/dendronhq/dendron/issues/1426)) ([5a1c7ed](https://github.com/dendronhq/dendron/commit/5a1c7ed9b45df2f00e61229c0776dad41cc29aba))


### Features Dendron

* **workspace:** add survey for new users([#1409](https://github.com/dendronhq/dendron/issues/1409)) ([e2b1754](https://github.com/dendronhq/dendron/commit/e2b17548fbbe3dffef961eb393f82a6a876940e7))



## 0.60.2 (2021-09-25)



## 0.60.2-alpha.0 (2021-09-24)



## 0.60.1 (2021-09-24)


### Bug Fixes

* pesky error popup when schema lookup is closed ([#1389](https://github.com/dendronhq/dendron/issues/1389)) ([4d2bb40](https://github.com/dendronhq/dendron/commit/4d2bb401b17e926dc2eaa11957536f0c75a1e538))
* single letter look up matches ([#1388](https://github.com/dendronhq/dendron/issues/1388)) ([7de9a71](https://github.com/dendronhq/dendron/commit/7de9a7195a02399b1285b51ef08d6853b1f390f6))



# 0.60.0 (2021-09-21)


### Bug Fixes

* **commands:** rename note leaves incorrect metadata if parent is a stub ([#1348](https://github.com/dendronhq/dendron/issues/1348)) ([d432cc9](https://github.com/dendronhq/dendron/commit/d432cc9e20ff8b9f6cefd7cc4c3a42b567ed9bc5))
* **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))
* **workspace:** disable certain decorations for long notes to avoid performance hit ([#1337](https://github.com/dendronhq/dendron/issues/1337)) ([f1c46f9](https://github.com/dendronhq/dendron/commit/f1c46f95c228ada2126ec7212cede3bf5acc773d))
* direct children query ([#1303](https://github.com/dendronhq/dendron/issues/1303)) ([bcf0dea](https://github.com/dendronhq/dendron/commit/bcf0deae422406564cd9a56c1765f90dd2e66215))
* issue with webpack devCLI ([a4ff4c9](https://github.com/dendronhq/dendron/commit/a4ff4c9ae28ff31ab6f9483c339ae78b5144e185))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))
* stop calendar from auto expanding when the last note is closed ([#1299](https://github.com/dendronhq/dendron/issues/1299)) ([9c8f853](https://github.com/dendronhq/dendron/commit/9c8f8533da5027c122e0d003ce4c61dc866735f5))


### Features Dendron

* consolidate dendron configs ([#1295](https://github.com/dendronhq/dendron/issues/1295)) ([177ac92](https://github.com/dendronhq/dendron/commit/177ac925a5442471f041ce5d991da52cecee6c9b))
* nextjs publishing fulltext search ([#1334](https://github.com/dendronhq/dendron/issues/1334)) ([68f8473](https://github.com/dendronhq/dendron/commit/68f8473badf22494c8d0758f8195e377235321f6))
* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* user tags ([#1228](https://github.com/dendronhq/dendron/issues/1228)) ([98c0106](https://github.com/dendronhq/dendron/commit/98c0106367e384c130a927484b9ea294eb6f84fa))



## 0.55.2 (2021-08-21)


### Bug Fixes

* wrong internal links in nextjs publishing ([#1165](https://github.com/dendronhq/dendron/issues/1165)) ([59a949d](https://github.com/dendronhq/dendron/commit/59a949d2b5b541efb283e851060636b108eb5a98))



## 0.55.1 (2021-08-17)


### Bug Fixes

* multiple issues with lookupv3 ([1fdd9eb](https://github.com/dendronhq/dendron/commit/1fdd9eb3242b43539572a1993fefd174640c6d83))
* properly log error stack ([485e220](https://github.com/dendronhq/dendron/commit/485e220f8ffa6cd63210e106e846ff305b920b77))


### Features Dendron

* Insert Note Index command ([#1142](https://github.com/dendronhq/dendron/issues/1142)) ([c140015](https://github.com/dendronhq/dendron/commit/c140015c19a942cf4696d596e818fd89905eea25))
* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* undefined tags breaks note serialization ([b1d784c](https://github.com/dendronhq/dendron/commit/b1d784c8df18b3b45999f01c14793436ff669a3f))


### Features Dendron

* colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
* resolve vim keybinding conflict on initial install ([#1103](https://github.com/dendronhq/dendron/issues/1103)) ([2278c66](https://github.com/dendronhq/dendron/commit/2278c6616c8297cc414ad02d5323bff5c45072e4))
* **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))
* Add SchemaLookupCommand ([#1082](https://github.com/dendronhq/dendron/issues/1082)) ([fe11a0e](https://github.com/dendronhq/dendron/commit/fe11a0ea1e0214823dd01842b941456df164bc70))
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* generate json schema from config ([#1100](https://github.com/dendronhq/dendron/issues/1100)) ([53b189e](https://github.com/dendronhq/dendron/commit/53b189ec973a8d3d3ccf300a0e59908197f4efb1))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.71.2](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.71.2) (2021-11-30)


### Bug Fixes

* **note:** correctly handle note titles containing international characters ([#1801](https://github.com/dendronhq/dendron/issues/1801)) ([03b05f4](https://github.com/dendronhq/dendron/commit/03b05f4aa7887577365059f5bb22d8c3585afe40))
* allow assets to open from preview view ([#1771](https://github.com/dendronhq/dendron/issues/1771)) ([f362bda](https://github.com/dendronhq/dendron/commit/f362bda9726c9dde2c96aa1954aa549c1f013136))
* **lookup:** hierarchy look up when inside parts of the hierarchy are omitted ([#1522](https://github.com/dendronhq/dendron/issues/1522)) ([6c30af5](https://github.com/dendronhq/dendron/commit/6c30af5e5b76297334f15a435fd1f9ad09941e06))
* **markdown:** email parsed as user tag & option to disable user tags and hashtags ([#1562](https://github.com/dendronhq/dendron/issues/1562)) ([fd56f7e](https://github.com/dendronhq/dendron/commit/fd56f7ece1651ea6433ebf481f2c54386ab6fb16))
* **markdown:** footnote links move view in publishing & preview ([#1568](https://github.com/dendronhq/dendron/issues/1568)) ([fbe659d](https://github.com/dendronhq/dendron/commit/fbe659d2be3d1f2534d7437d585e9fa38f1684da))
* **pods:** invalid configuration error ([398a599](https://github.com/dendronhq/dendron/commit/398a5995fc594566131eb283ff989a877ca9c995))
* **publish:** make mermaid work consistently on published sites ([2f648e0](https://github.com/dendronhq/dendron/commit/2f648e0a34c95095e86e8535a1fa8ec9ac4de39c))
* **workspace:** checks against fnames with all lowercase ([#1739](https://github.com/dendronhq/dendron/issues/1739)) ([8e3f8ec](https://github.com/dendronhq/dendron/commit/8e3f8ec061e0ce7d249a7e92902bb48e7c520793))
* backward compatibility of id matching adding '_' to id regex match. ([#1504](https://github.com/dendronhq/dendron/issues/1504)) ([4bbae40](https://github.com/dendronhq/dendron/commit/4bbae40d81ea064612f605c6f4e18ae8d34ba0de))
* replace auto generated ids (coming from inline schemas) with patterns ([#1632](https://github.com/dendronhq/dendron/issues/1632)) ([af28cf6](https://github.com/dendronhq/dendron/commit/af28cf6ef1d085d22069695e9df128477c024d1b))


### Features Dendron

* decorator improvements ([#1770](https://github.com/dendronhq/dendron/issues/1770)) ([a7227fd](https://github.com/dendronhq/dendron/commit/a7227fd4d8991e44729989c821a22560dcb8348b))
* Native workspace enhancements ([#1670](https://github.com/dendronhq/dendron/issues/1670)) ([7a392bb](https://github.com/dendronhq/dendron/commit/7a392bb47c69b562d54fa15479a184f1441e129e))
* **notes:** task notes (create modifier & editor highlighting) ([#1583](https://github.com/dendronhq/dendron/issues/1583)) ([e785efa](https://github.com/dendronhq/dendron/commit/e785efa8e2ce55bc39fb90cf34984d55035dd6ca))
* **schemas:** adding new command - create schema from hierarchy ([#1673](https://github.com/dendronhq/dendron/issues/1673)) ([14732ec](https://github.com/dendronhq/dendron/commit/14732ecbdd42511337ddaaf3fc91bde288c3036d))
* **workspace:** better note previews ([#1666](https://github.com/dendronhq/dendron/issues/1666)) ([5cf7067](https://github.com/dendronhq/dendron/commit/5cf70672a24a62d528440f38b44813bfa627fb88))
* **workspace:** convert vault command ([#1542](https://github.com/dendronhq/dendron/issues/1542)) ([c265e9d](https://github.com/dendronhq/dendron/commit/c265e9d2c238b5a6b3761f4c073140b1a0debe3a))



## 0.62.3 (2021-10-09)


### Bug Fixes

* template doesn't copy FM tags ([#1488](https://github.com/dendronhq/dendron/issues/1488)) ([0317699](https://github.com/dendronhq/dendron/commit/0317699ef9bfd4d77b1d3d05f8093e725ea5b2c3)), closes [#1481](https://github.com/dendronhq/dendron/issues/1481)
* **view:** enable anchor links to work in preview ([#1375](https://github.com/dendronhq/dendron/issues/1375)) ([f27cfb0](https://github.com/dendronhq/dendron/commit/f27cfb07d612e28fd0d6dd08019d772767900bba))
* preview caching invalidation when notes with ![[ref]] links change ([#1385](https://github.com/dendronhq/dendron/issues/1385)) ([efeef86](https://github.com/dendronhq/dendron/commit/efeef8662ec52e64ba33cae9b1196bba6cc82f95))
* **publish:** bad seo props setter ([373d933](https://github.com/dendronhq/dendron/commit/373d9331aba3b3385632f01661dd6c80835ec5ac))


### Features Dendron

* Lapsed user survey ([#1446](https://github.com/dendronhq/dendron/issues/1446)) ([8094d2b](https://github.com/dendronhq/dendron/commit/8094d2bb1972fecf4fde74e8c5644aeba3eec119)), closes [#1349](https://github.com/dendronhq/dendron/issues/1349)
* **publish:** add table of contents ([#1428](https://github.com/dendronhq/dendron/issues/1428)) ([df4b05b](https://github.com/dendronhq/dendron/commit/df4b05ba8526dc32362d6a59543d880f253f02fc))



# 0.61.0 (2021-09-28)


### Bug Fixes

* **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))
* support activation for older vscode version ([#1426](https://github.com/dendronhq/dendron/issues/1426)) ([5a1c7ed](https://github.com/dendronhq/dendron/commit/5a1c7ed9b45df2f00e61229c0776dad41cc29aba))


### Features Dendron

* **workspace:** add survey for new users([#1409](https://github.com/dendronhq/dendron/issues/1409)) ([e2b1754](https://github.com/dendronhq/dendron/commit/e2b17548fbbe3dffef961eb393f82a6a876940e7))



## 0.60.2 (2021-09-25)



## 0.60.2-alpha.0 (2021-09-24)



## 0.60.1 (2021-09-24)


### Bug Fixes

* pesky error popup when schema lookup is closed ([#1389](https://github.com/dendronhq/dendron/issues/1389)) ([4d2bb40](https://github.com/dendronhq/dendron/commit/4d2bb401b17e926dc2eaa11957536f0c75a1e538))
* single letter look up matches ([#1388](https://github.com/dendronhq/dendron/issues/1388)) ([7de9a71](https://github.com/dendronhq/dendron/commit/7de9a7195a02399b1285b51ef08d6853b1f390f6))



# 0.60.0 (2021-09-21)


### Bug Fixes

* **commands:** rename note leaves incorrect metadata if parent is a stub ([#1348](https://github.com/dendronhq/dendron/issues/1348)) ([d432cc9](https://github.com/dendronhq/dendron/commit/d432cc9e20ff8b9f6cefd7cc4c3a42b567ed9bc5))
* **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))
* **workspace:** disable certain decorations for long notes to avoid performance hit ([#1337](https://github.com/dendronhq/dendron/issues/1337)) ([f1c46f9](https://github.com/dendronhq/dendron/commit/f1c46f95c228ada2126ec7212cede3bf5acc773d))
* direct children query ([#1303](https://github.com/dendronhq/dendron/issues/1303)) ([bcf0dea](https://github.com/dendronhq/dendron/commit/bcf0deae422406564cd9a56c1765f90dd2e66215))
* issue with webpack devCLI ([a4ff4c9](https://github.com/dendronhq/dendron/commit/a4ff4c9ae28ff31ab6f9483c339ae78b5144e185))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))
* stop calendar from auto expanding when the last note is closed ([#1299](https://github.com/dendronhq/dendron/issues/1299)) ([9c8f853](https://github.com/dendronhq/dendron/commit/9c8f8533da5027c122e0d003ce4c61dc866735f5))


### Features Dendron

* consolidate dendron configs ([#1295](https://github.com/dendronhq/dendron/issues/1295)) ([177ac92](https://github.com/dendronhq/dendron/commit/177ac925a5442471f041ce5d991da52cecee6c9b))
* nextjs publishing fulltext search ([#1334](https://github.com/dendronhq/dendron/issues/1334)) ([68f8473](https://github.com/dendronhq/dendron/commit/68f8473badf22494c8d0758f8195e377235321f6))
* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* user tags ([#1228](https://github.com/dendronhq/dendron/issues/1228)) ([98c0106](https://github.com/dendronhq/dendron/commit/98c0106367e384c130a927484b9ea294eb6f84fa))



## 0.55.2 (2021-08-21)


### Bug Fixes

* wrong internal links in nextjs publishing ([#1165](https://github.com/dendronhq/dendron/issues/1165)) ([59a949d](https://github.com/dendronhq/dendron/commit/59a949d2b5b541efb283e851060636b108eb5a98))



## 0.55.1 (2021-08-17)


### Bug Fixes

* multiple issues with lookupv3 ([1fdd9eb](https://github.com/dendronhq/dendron/commit/1fdd9eb3242b43539572a1993fefd174640c6d83))
* properly log error stack ([485e220](https://github.com/dendronhq/dendron/commit/485e220f8ffa6cd63210e106e846ff305b920b77))


### Features Dendron

* Insert Note Index command ([#1142](https://github.com/dendronhq/dendron/issues/1142)) ([c140015](https://github.com/dendronhq/dendron/commit/c140015c19a942cf4696d596e818fd89905eea25))
* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* undefined tags breaks note serialization ([b1d784c](https://github.com/dendronhq/dendron/commit/b1d784c8df18b3b45999f01c14793436ff669a3f))


### Features Dendron

* colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
* resolve vim keybinding conflict on initial install ([#1103](https://github.com/dendronhq/dendron/issues/1103)) ([2278c66](https://github.com/dendronhq/dendron/commit/2278c6616c8297cc414ad02d5323bff5c45072e4))
* **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))
* Add SchemaLookupCommand ([#1082](https://github.com/dendronhq/dendron/issues/1082)) ([fe11a0e](https://github.com/dendronhq/dendron/commit/fe11a0ea1e0214823dd01842b941456df164bc70))
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* generate json schema from config ([#1100](https://github.com/dendronhq/dendron/issues/1100)) ([53b189e](https://github.com/dendronhq/dendron/commit/53b189ec973a8d3d3ccf300a0e59908197f4efb1))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.71.1](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.71.1) (2021-11-30)


### Bug Fixes

* **note:** correctly handle note titles containing international characters ([#1801](https://github.com/dendronhq/dendron/issues/1801)) ([03b05f4](https://github.com/dendronhq/dendron/commit/03b05f4aa7887577365059f5bb22d8c3585afe40))
* allow assets to open from preview view ([#1771](https://github.com/dendronhq/dendron/issues/1771)) ([f362bda](https://github.com/dendronhq/dendron/commit/f362bda9726c9dde2c96aa1954aa549c1f013136))
* **lookup:** hierarchy look up when inside parts of the hierarchy are omitted ([#1522](https://github.com/dendronhq/dendron/issues/1522)) ([6c30af5](https://github.com/dendronhq/dendron/commit/6c30af5e5b76297334f15a435fd1f9ad09941e06))
* **markdown:** email parsed as user tag & option to disable user tags and hashtags ([#1562](https://github.com/dendronhq/dendron/issues/1562)) ([fd56f7e](https://github.com/dendronhq/dendron/commit/fd56f7ece1651ea6433ebf481f2c54386ab6fb16))
* **markdown:** footnote links move view in publishing & preview ([#1568](https://github.com/dendronhq/dendron/issues/1568)) ([fbe659d](https://github.com/dendronhq/dendron/commit/fbe659d2be3d1f2534d7437d585e9fa38f1684da))
* **pods:** invalid configuration error ([398a599](https://github.com/dendronhq/dendron/commit/398a5995fc594566131eb283ff989a877ca9c995))
* **publish:** make mermaid work consistently on published sites ([2f648e0](https://github.com/dendronhq/dendron/commit/2f648e0a34c95095e86e8535a1fa8ec9ac4de39c))
* **workspace:** checks against fnames with all lowercase ([#1739](https://github.com/dendronhq/dendron/issues/1739)) ([8e3f8ec](https://github.com/dendronhq/dendron/commit/8e3f8ec061e0ce7d249a7e92902bb48e7c520793))
* backward compatibility of id matching adding '_' to id regex match. ([#1504](https://github.com/dendronhq/dendron/issues/1504)) ([4bbae40](https://github.com/dendronhq/dendron/commit/4bbae40d81ea064612f605c6f4e18ae8d34ba0de))
* replace auto generated ids (coming from inline schemas) with patterns ([#1632](https://github.com/dendronhq/dendron/issues/1632)) ([af28cf6](https://github.com/dendronhq/dendron/commit/af28cf6ef1d085d22069695e9df128477c024d1b))


### Features Dendron

* decorator improvements ([#1770](https://github.com/dendronhq/dendron/issues/1770)) ([a7227fd](https://github.com/dendronhq/dendron/commit/a7227fd4d8991e44729989c821a22560dcb8348b))
* Native workspace enhancements ([#1670](https://github.com/dendronhq/dendron/issues/1670)) ([7a392bb](https://github.com/dendronhq/dendron/commit/7a392bb47c69b562d54fa15479a184f1441e129e))
* **notes:** task notes (create modifier & editor highlighting) ([#1583](https://github.com/dendronhq/dendron/issues/1583)) ([e785efa](https://github.com/dendronhq/dendron/commit/e785efa8e2ce55bc39fb90cf34984d55035dd6ca))
* **schemas:** adding new command - create schema from hierarchy ([#1673](https://github.com/dendronhq/dendron/issues/1673)) ([14732ec](https://github.com/dendronhq/dendron/commit/14732ecbdd42511337ddaaf3fc91bde288c3036d))
* **workspace:** better note previews ([#1666](https://github.com/dendronhq/dendron/issues/1666)) ([5cf7067](https://github.com/dendronhq/dendron/commit/5cf70672a24a62d528440f38b44813bfa627fb88))
* **workspace:** convert vault command ([#1542](https://github.com/dendronhq/dendron/issues/1542)) ([c265e9d](https://github.com/dendronhq/dendron/commit/c265e9d2c238b5a6b3761f4c073140b1a0debe3a))



## 0.62.3 (2021-10-09)


### Bug Fixes

* template doesn't copy FM tags ([#1488](https://github.com/dendronhq/dendron/issues/1488)) ([0317699](https://github.com/dendronhq/dendron/commit/0317699ef9bfd4d77b1d3d05f8093e725ea5b2c3)), closes [#1481](https://github.com/dendronhq/dendron/issues/1481)
* **view:** enable anchor links to work in preview ([#1375](https://github.com/dendronhq/dendron/issues/1375)) ([f27cfb0](https://github.com/dendronhq/dendron/commit/f27cfb07d612e28fd0d6dd08019d772767900bba))
* preview caching invalidation when notes with ![[ref]] links change ([#1385](https://github.com/dendronhq/dendron/issues/1385)) ([efeef86](https://github.com/dendronhq/dendron/commit/efeef8662ec52e64ba33cae9b1196bba6cc82f95))
* **publish:** bad seo props setter ([373d933](https://github.com/dendronhq/dendron/commit/373d9331aba3b3385632f01661dd6c80835ec5ac))


### Features Dendron

* Lapsed user survey ([#1446](https://github.com/dendronhq/dendron/issues/1446)) ([8094d2b](https://github.com/dendronhq/dendron/commit/8094d2bb1972fecf4fde74e8c5644aeba3eec119)), closes [#1349](https://github.com/dendronhq/dendron/issues/1349)
* **publish:** add table of contents ([#1428](https://github.com/dendronhq/dendron/issues/1428)) ([df4b05b](https://github.com/dendronhq/dendron/commit/df4b05ba8526dc32362d6a59543d880f253f02fc))



# 0.61.0 (2021-09-28)


### Bug Fixes

* **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))
* support activation for older vscode version ([#1426](https://github.com/dendronhq/dendron/issues/1426)) ([5a1c7ed](https://github.com/dendronhq/dendron/commit/5a1c7ed9b45df2f00e61229c0776dad41cc29aba))


### Features Dendron

* **workspace:** add survey for new users([#1409](https://github.com/dendronhq/dendron/issues/1409)) ([e2b1754](https://github.com/dendronhq/dendron/commit/e2b17548fbbe3dffef961eb393f82a6a876940e7))



## 0.60.2 (2021-09-25)



## 0.60.2-alpha.0 (2021-09-24)



## 0.60.1 (2021-09-24)


### Bug Fixes

* pesky error popup when schema lookup is closed ([#1389](https://github.com/dendronhq/dendron/issues/1389)) ([4d2bb40](https://github.com/dendronhq/dendron/commit/4d2bb401b17e926dc2eaa11957536f0c75a1e538))
* single letter look up matches ([#1388](https://github.com/dendronhq/dendron/issues/1388)) ([7de9a71](https://github.com/dendronhq/dendron/commit/7de9a7195a02399b1285b51ef08d6853b1f390f6))



# 0.60.0 (2021-09-21)


### Bug Fixes

* **commands:** rename note leaves incorrect metadata if parent is a stub ([#1348](https://github.com/dendronhq/dendron/issues/1348)) ([d432cc9](https://github.com/dendronhq/dendron/commit/d432cc9e20ff8b9f6cefd7cc4c3a42b567ed9bc5))
* **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))
* **workspace:** disable certain decorations for long notes to avoid performance hit ([#1337](https://github.com/dendronhq/dendron/issues/1337)) ([f1c46f9](https://github.com/dendronhq/dendron/commit/f1c46f95c228ada2126ec7212cede3bf5acc773d))
* direct children query ([#1303](https://github.com/dendronhq/dendron/issues/1303)) ([bcf0dea](https://github.com/dendronhq/dendron/commit/bcf0deae422406564cd9a56c1765f90dd2e66215))
* issue with webpack devCLI ([a4ff4c9](https://github.com/dendronhq/dendron/commit/a4ff4c9ae28ff31ab6f9483c339ae78b5144e185))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))
* stop calendar from auto expanding when the last note is closed ([#1299](https://github.com/dendronhq/dendron/issues/1299)) ([9c8f853](https://github.com/dendronhq/dendron/commit/9c8f8533da5027c122e0d003ce4c61dc866735f5))


### Features Dendron

* consolidate dendron configs ([#1295](https://github.com/dendronhq/dendron/issues/1295)) ([177ac92](https://github.com/dendronhq/dendron/commit/177ac925a5442471f041ce5d991da52cecee6c9b))
* nextjs publishing fulltext search ([#1334](https://github.com/dendronhq/dendron/issues/1334)) ([68f8473](https://github.com/dendronhq/dendron/commit/68f8473badf22494c8d0758f8195e377235321f6))
* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* user tags ([#1228](https://github.com/dendronhq/dendron/issues/1228)) ([98c0106](https://github.com/dendronhq/dendron/commit/98c0106367e384c130a927484b9ea294eb6f84fa))



## 0.55.2 (2021-08-21)


### Bug Fixes

* wrong internal links in nextjs publishing ([#1165](https://github.com/dendronhq/dendron/issues/1165)) ([59a949d](https://github.com/dendronhq/dendron/commit/59a949d2b5b541efb283e851060636b108eb5a98))



## 0.55.1 (2021-08-17)


### Bug Fixes

* multiple issues with lookupv3 ([1fdd9eb](https://github.com/dendronhq/dendron/commit/1fdd9eb3242b43539572a1993fefd174640c6d83))
* properly log error stack ([485e220](https://github.com/dendronhq/dendron/commit/485e220f8ffa6cd63210e106e846ff305b920b77))


### Features Dendron

* Insert Note Index command ([#1142](https://github.com/dendronhq/dendron/issues/1142)) ([c140015](https://github.com/dendronhq/dendron/commit/c140015c19a942cf4696d596e818fd89905eea25))
* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* undefined tags breaks note serialization ([b1d784c](https://github.com/dendronhq/dendron/commit/b1d784c8df18b3b45999f01c14793436ff669a3f))


### Features Dendron

* colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
* resolve vim keybinding conflict on initial install ([#1103](https://github.com/dendronhq/dendron/issues/1103)) ([2278c66](https://github.com/dendronhq/dendron/commit/2278c6616c8297cc414ad02d5323bff5c45072e4))
* **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))
* Add SchemaLookupCommand ([#1082](https://github.com/dendronhq/dendron/issues/1082)) ([fe11a0e](https://github.com/dendronhq/dendron/commit/fe11a0ea1e0214823dd01842b941456df164bc70))
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* generate json schema from config ([#1100](https://github.com/dendronhq/dendron/issues/1100)) ([53b189e](https://github.com/dendronhq/dendron/commit/53b189ec973a8d3d3ccf300a0e59908197f4efb1))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





# 0.71.0 (2021-11-30)

**Note:** Version bump only for package @dendronhq/common-all





## [0.70.1](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.70.1) (2021-11-26)


### Bug Fixes

* allow assets to open from preview view ([#1771](https://github.com/dendronhq/dendron/issues/1771)) ([f362bda](https://github.com/dendronhq/dendron/commit/f362bda9726c9dde2c96aa1954aa549c1f013136))
* **lookup:** hierarchy look up when inside parts of the hierarchy are omitted ([#1522](https://github.com/dendronhq/dendron/issues/1522)) ([6c30af5](https://github.com/dendronhq/dendron/commit/6c30af5e5b76297334f15a435fd1f9ad09941e06))
* **markdown:** email parsed as user tag & option to disable user tags and hashtags ([#1562](https://github.com/dendronhq/dendron/issues/1562)) ([fd56f7e](https://github.com/dendronhq/dendron/commit/fd56f7ece1651ea6433ebf481f2c54386ab6fb16))
* **markdown:** footnote links move view in publishing & preview ([#1568](https://github.com/dendronhq/dendron/issues/1568)) ([fbe659d](https://github.com/dendronhq/dendron/commit/fbe659d2be3d1f2534d7437d585e9fa38f1684da))
* **pods:** invalid configuration error ([398a599](https://github.com/dendronhq/dendron/commit/398a5995fc594566131eb283ff989a877ca9c995))
* **publish:** make mermaid work consistently on published sites ([2f648e0](https://github.com/dendronhq/dendron/commit/2f648e0a34c95095e86e8535a1fa8ec9ac4de39c))
* **workspace:** checks against fnames with all lowercase ([#1739](https://github.com/dendronhq/dendron/issues/1739)) ([8e3f8ec](https://github.com/dendronhq/dendron/commit/8e3f8ec061e0ce7d249a7e92902bb48e7c520793))
* backward compatibility of id matching adding '_' to id regex match. ([#1504](https://github.com/dendronhq/dendron/issues/1504)) ([4bbae40](https://github.com/dendronhq/dendron/commit/4bbae40d81ea064612f605c6f4e18ae8d34ba0de))
* replace auto generated ids (coming from inline schemas) with patterns ([#1632](https://github.com/dendronhq/dendron/issues/1632)) ([af28cf6](https://github.com/dendronhq/dendron/commit/af28cf6ef1d085d22069695e9df128477c024d1b))


### Features Dendron

* decorator improvements ([#1770](https://github.com/dendronhq/dendron/issues/1770)) ([a7227fd](https://github.com/dendronhq/dendron/commit/a7227fd4d8991e44729989c821a22560dcb8348b))
* Native workspace enhancements ([#1670](https://github.com/dendronhq/dendron/issues/1670)) ([7a392bb](https://github.com/dendronhq/dendron/commit/7a392bb47c69b562d54fa15479a184f1441e129e))
* **notes:** task notes (create modifier & editor highlighting) ([#1583](https://github.com/dendronhq/dendron/issues/1583)) ([e785efa](https://github.com/dendronhq/dendron/commit/e785efa8e2ce55bc39fb90cf34984d55035dd6ca))
* **schemas:** adding new command - create schema from hierarchy ([#1673](https://github.com/dendronhq/dendron/issues/1673)) ([14732ec](https://github.com/dendronhq/dendron/commit/14732ecbdd42511337ddaaf3fc91bde288c3036d))
* **workspace:** better note previews ([#1666](https://github.com/dendronhq/dendron/issues/1666)) ([5cf7067](https://github.com/dendronhq/dendron/commit/5cf70672a24a62d528440f38b44813bfa627fb88))
* **workspace:** convert vault command ([#1542](https://github.com/dendronhq/dendron/issues/1542)) ([c265e9d](https://github.com/dendronhq/dendron/commit/c265e9d2c238b5a6b3761f4c073140b1a0debe3a))



## 0.62.3 (2021-10-09)


### Bug Fixes

* template doesn't copy FM tags ([#1488](https://github.com/dendronhq/dendron/issues/1488)) ([0317699](https://github.com/dendronhq/dendron/commit/0317699ef9bfd4d77b1d3d05f8093e725ea5b2c3)), closes [#1481](https://github.com/dendronhq/dendron/issues/1481)
* **view:** enable anchor links to work in preview ([#1375](https://github.com/dendronhq/dendron/issues/1375)) ([f27cfb0](https://github.com/dendronhq/dendron/commit/f27cfb07d612e28fd0d6dd08019d772767900bba))
* preview caching invalidation when notes with ![[ref]] links change ([#1385](https://github.com/dendronhq/dendron/issues/1385)) ([efeef86](https://github.com/dendronhq/dendron/commit/efeef8662ec52e64ba33cae9b1196bba6cc82f95))
* **publish:** bad seo props setter ([373d933](https://github.com/dendronhq/dendron/commit/373d9331aba3b3385632f01661dd6c80835ec5ac))


### Features Dendron

* Lapsed user survey ([#1446](https://github.com/dendronhq/dendron/issues/1446)) ([8094d2b](https://github.com/dendronhq/dendron/commit/8094d2bb1972fecf4fde74e8c5644aeba3eec119)), closes [#1349](https://github.com/dendronhq/dendron/issues/1349)
* **publish:** add table of contents ([#1428](https://github.com/dendronhq/dendron/issues/1428)) ([df4b05b](https://github.com/dendronhq/dendron/commit/df4b05ba8526dc32362d6a59543d880f253f02fc))



# 0.61.0 (2021-09-28)


### Bug Fixes

* **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))
* support activation for older vscode version ([#1426](https://github.com/dendronhq/dendron/issues/1426)) ([5a1c7ed](https://github.com/dendronhq/dendron/commit/5a1c7ed9b45df2f00e61229c0776dad41cc29aba))


### Features Dendron

* **workspace:** add survey for new users([#1409](https://github.com/dendronhq/dendron/issues/1409)) ([e2b1754](https://github.com/dendronhq/dendron/commit/e2b17548fbbe3dffef961eb393f82a6a876940e7))



## 0.60.2 (2021-09-25)



## 0.60.2-alpha.0 (2021-09-24)



## 0.60.1 (2021-09-24)


### Bug Fixes

* pesky error popup when schema lookup is closed ([#1389](https://github.com/dendronhq/dendron/issues/1389)) ([4d2bb40](https://github.com/dendronhq/dendron/commit/4d2bb401b17e926dc2eaa11957536f0c75a1e538))
* single letter look up matches ([#1388](https://github.com/dendronhq/dendron/issues/1388)) ([7de9a71](https://github.com/dendronhq/dendron/commit/7de9a7195a02399b1285b51ef08d6853b1f390f6))



# 0.60.0 (2021-09-21)


### Bug Fixes

* **commands:** rename note leaves incorrect metadata if parent is a stub ([#1348](https://github.com/dendronhq/dendron/issues/1348)) ([d432cc9](https://github.com/dendronhq/dendron/commit/d432cc9e20ff8b9f6cefd7cc4c3a42b567ed9bc5))
* **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))
* **workspace:** disable certain decorations for long notes to avoid performance hit ([#1337](https://github.com/dendronhq/dendron/issues/1337)) ([f1c46f9](https://github.com/dendronhq/dendron/commit/f1c46f95c228ada2126ec7212cede3bf5acc773d))
* direct children query ([#1303](https://github.com/dendronhq/dendron/issues/1303)) ([bcf0dea](https://github.com/dendronhq/dendron/commit/bcf0deae422406564cd9a56c1765f90dd2e66215))
* issue with webpack devCLI ([a4ff4c9](https://github.com/dendronhq/dendron/commit/a4ff4c9ae28ff31ab6f9483c339ae78b5144e185))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))
* stop calendar from auto expanding when the last note is closed ([#1299](https://github.com/dendronhq/dendron/issues/1299)) ([9c8f853](https://github.com/dendronhq/dendron/commit/9c8f8533da5027c122e0d003ce4c61dc866735f5))


### Features Dendron

* consolidate dendron configs ([#1295](https://github.com/dendronhq/dendron/issues/1295)) ([177ac92](https://github.com/dendronhq/dendron/commit/177ac925a5442471f041ce5d991da52cecee6c9b))
* nextjs publishing fulltext search ([#1334](https://github.com/dendronhq/dendron/issues/1334)) ([68f8473](https://github.com/dendronhq/dendron/commit/68f8473badf22494c8d0758f8195e377235321f6))
* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* user tags ([#1228](https://github.com/dendronhq/dendron/issues/1228)) ([98c0106](https://github.com/dendronhq/dendron/commit/98c0106367e384c130a927484b9ea294eb6f84fa))



## 0.55.2 (2021-08-21)


### Bug Fixes

* wrong internal links in nextjs publishing ([#1165](https://github.com/dendronhq/dendron/issues/1165)) ([59a949d](https://github.com/dendronhq/dendron/commit/59a949d2b5b541efb283e851060636b108eb5a98))



## 0.55.1 (2021-08-17)


### Bug Fixes

* multiple issues with lookupv3 ([1fdd9eb](https://github.com/dendronhq/dendron/commit/1fdd9eb3242b43539572a1993fefd174640c6d83))
* properly log error stack ([485e220](https://github.com/dendronhq/dendron/commit/485e220f8ffa6cd63210e106e846ff305b920b77))


### Features Dendron

* Insert Note Index command ([#1142](https://github.com/dendronhq/dendron/issues/1142)) ([c140015](https://github.com/dendronhq/dendron/commit/c140015c19a942cf4696d596e818fd89905eea25))
* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* undefined tags breaks note serialization ([b1d784c](https://github.com/dendronhq/dendron/commit/b1d784c8df18b3b45999f01c14793436ff669a3f))


### Features Dendron

* colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
* resolve vim keybinding conflict on initial install ([#1103](https://github.com/dendronhq/dendron/issues/1103)) ([2278c66](https://github.com/dendronhq/dendron/commit/2278c6616c8297cc414ad02d5323bff5c45072e4))
* **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))
* Add SchemaLookupCommand ([#1082](https://github.com/dendronhq/dendron/issues/1082)) ([fe11a0e](https://github.com/dendronhq/dendron/commit/fe11a0ea1e0214823dd01842b941456df164bc70))
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* generate json schema from config ([#1100](https://github.com/dendronhq/dendron/issues/1100)) ([53b189e](https://github.com/dendronhq/dendron/commit/53b189ec973a8d3d3ccf300a0e59908197f4efb1))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





# [0.70.0](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.70.0) (2021-11-23)


### Bug Fixes

* **lookup:** hierarchy look up when inside parts of the hierarchy are omitted ([#1522](https://github.com/dendronhq/dendron/issues/1522)) ([6c30af5](https://github.com/dendronhq/dendron/commit/6c30af5e5b76297334f15a435fd1f9ad09941e06))
* **markdown:** email parsed as user tag & option to disable user tags and hashtags ([#1562](https://github.com/dendronhq/dendron/issues/1562)) ([fd56f7e](https://github.com/dendronhq/dendron/commit/fd56f7ece1651ea6433ebf481f2c54386ab6fb16))
* **markdown:** footnote links move view in publishing & preview ([#1568](https://github.com/dendronhq/dendron/issues/1568)) ([fbe659d](https://github.com/dendronhq/dendron/commit/fbe659d2be3d1f2534d7437d585e9fa38f1684da))
* **pods:** invalid configuration error ([398a599](https://github.com/dendronhq/dendron/commit/398a5995fc594566131eb283ff989a877ca9c995))
* **publish:** make mermaid work consistently on published sites ([2f648e0](https://github.com/dendronhq/dendron/commit/2f648e0a34c95095e86e8535a1fa8ec9ac4de39c))
* **workspace:** checks against fnames with all lowercase ([#1739](https://github.com/dendronhq/dendron/issues/1739)) ([8e3f8ec](https://github.com/dendronhq/dendron/commit/8e3f8ec061e0ce7d249a7e92902bb48e7c520793))
* backward compatibility of id matching adding '_' to id regex match. ([#1504](https://github.com/dendronhq/dendron/issues/1504)) ([4bbae40](https://github.com/dendronhq/dendron/commit/4bbae40d81ea064612f605c6f4e18ae8d34ba0de))
* replace auto generated ids (coming from inline schemas) with patterns ([#1632](https://github.com/dendronhq/dendron/issues/1632)) ([af28cf6](https://github.com/dendronhq/dendron/commit/af28cf6ef1d085d22069695e9df128477c024d1b))


### Features Dendron

* Native workspace enhancements ([#1670](https://github.com/dendronhq/dendron/issues/1670)) ([7a392bb](https://github.com/dendronhq/dendron/commit/7a392bb47c69b562d54fa15479a184f1441e129e))
* **notes:** task notes (create modifier & editor highlighting) ([#1583](https://github.com/dendronhq/dendron/issues/1583)) ([e785efa](https://github.com/dendronhq/dendron/commit/e785efa8e2ce55bc39fb90cf34984d55035dd6ca))
* **schemas:** adding new command - create schema from hierarchy ([#1673](https://github.com/dendronhq/dendron/issues/1673)) ([14732ec](https://github.com/dendronhq/dendron/commit/14732ecbdd42511337ddaaf3fc91bde288c3036d))
* **workspace:** better note previews ([#1666](https://github.com/dendronhq/dendron/issues/1666)) ([5cf7067](https://github.com/dendronhq/dendron/commit/5cf70672a24a62d528440f38b44813bfa627fb88))
* **workspace:** convert vault command ([#1542](https://github.com/dendronhq/dendron/issues/1542)) ([c265e9d](https://github.com/dendronhq/dendron/commit/c265e9d2c238b5a6b3761f4c073140b1a0debe3a))



## 0.62.3 (2021-10-09)


### Bug Fixes

* template doesn't copy FM tags ([#1488](https://github.com/dendronhq/dendron/issues/1488)) ([0317699](https://github.com/dendronhq/dendron/commit/0317699ef9bfd4d77b1d3d05f8093e725ea5b2c3)), closes [#1481](https://github.com/dendronhq/dendron/issues/1481)
* **view:** enable anchor links to work in preview ([#1375](https://github.com/dendronhq/dendron/issues/1375)) ([f27cfb0](https://github.com/dendronhq/dendron/commit/f27cfb07d612e28fd0d6dd08019d772767900bba))
* preview caching invalidation when notes with ![[ref]] links change ([#1385](https://github.com/dendronhq/dendron/issues/1385)) ([efeef86](https://github.com/dendronhq/dendron/commit/efeef8662ec52e64ba33cae9b1196bba6cc82f95))
* **publish:** bad seo props setter ([373d933](https://github.com/dendronhq/dendron/commit/373d9331aba3b3385632f01661dd6c80835ec5ac))


### Features Dendron

* Lapsed user survey ([#1446](https://github.com/dendronhq/dendron/issues/1446)) ([8094d2b](https://github.com/dendronhq/dendron/commit/8094d2bb1972fecf4fde74e8c5644aeba3eec119)), closes [#1349](https://github.com/dendronhq/dendron/issues/1349)
* **publish:** add table of contents ([#1428](https://github.com/dendronhq/dendron/issues/1428)) ([df4b05b](https://github.com/dendronhq/dendron/commit/df4b05ba8526dc32362d6a59543d880f253f02fc))



# 0.61.0 (2021-09-28)


### Bug Fixes

* **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))
* support activation for older vscode version ([#1426](https://github.com/dendronhq/dendron/issues/1426)) ([5a1c7ed](https://github.com/dendronhq/dendron/commit/5a1c7ed9b45df2f00e61229c0776dad41cc29aba))


### Features Dendron

* **workspace:** add survey for new users([#1409](https://github.com/dendronhq/dendron/issues/1409)) ([e2b1754](https://github.com/dendronhq/dendron/commit/e2b17548fbbe3dffef961eb393f82a6a876940e7))



## 0.60.2 (2021-09-25)



## 0.60.2-alpha.0 (2021-09-24)



## 0.60.1 (2021-09-24)


### Bug Fixes

* pesky error popup when schema lookup is closed ([#1389](https://github.com/dendronhq/dendron/issues/1389)) ([4d2bb40](https://github.com/dendronhq/dendron/commit/4d2bb401b17e926dc2eaa11957536f0c75a1e538))
* single letter look up matches ([#1388](https://github.com/dendronhq/dendron/issues/1388)) ([7de9a71](https://github.com/dendronhq/dendron/commit/7de9a7195a02399b1285b51ef08d6853b1f390f6))



# 0.60.0 (2021-09-21)


### Bug Fixes

* **commands:** rename note leaves incorrect metadata if parent is a stub ([#1348](https://github.com/dendronhq/dendron/issues/1348)) ([d432cc9](https://github.com/dendronhq/dendron/commit/d432cc9e20ff8b9f6cefd7cc4c3a42b567ed9bc5))
* **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))
* **workspace:** disable certain decorations for long notes to avoid performance hit ([#1337](https://github.com/dendronhq/dendron/issues/1337)) ([f1c46f9](https://github.com/dendronhq/dendron/commit/f1c46f95c228ada2126ec7212cede3bf5acc773d))
* direct children query ([#1303](https://github.com/dendronhq/dendron/issues/1303)) ([bcf0dea](https://github.com/dendronhq/dendron/commit/bcf0deae422406564cd9a56c1765f90dd2e66215))
* issue with webpack devCLI ([a4ff4c9](https://github.com/dendronhq/dendron/commit/a4ff4c9ae28ff31ab6f9483c339ae78b5144e185))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))
* stop calendar from auto expanding when the last note is closed ([#1299](https://github.com/dendronhq/dendron/issues/1299)) ([9c8f853](https://github.com/dendronhq/dendron/commit/9c8f8533da5027c122e0d003ce4c61dc866735f5))


### Features Dendron

* consolidate dendron configs ([#1295](https://github.com/dendronhq/dendron/issues/1295)) ([177ac92](https://github.com/dendronhq/dendron/commit/177ac925a5442471f041ce5d991da52cecee6c9b))
* nextjs publishing fulltext search ([#1334](https://github.com/dendronhq/dendron/issues/1334)) ([68f8473](https://github.com/dendronhq/dendron/commit/68f8473badf22494c8d0758f8195e377235321f6))
* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* user tags ([#1228](https://github.com/dendronhq/dendron/issues/1228)) ([98c0106](https://github.com/dendronhq/dendron/commit/98c0106367e384c130a927484b9ea294eb6f84fa))



## 0.55.2 (2021-08-21)


### Bug Fixes

* wrong internal links in nextjs publishing ([#1165](https://github.com/dendronhq/dendron/issues/1165)) ([59a949d](https://github.com/dendronhq/dendron/commit/59a949d2b5b541efb283e851060636b108eb5a98))



## 0.55.1 (2021-08-17)


### Bug Fixes

* multiple issues with lookupv3 ([1fdd9eb](https://github.com/dendronhq/dendron/commit/1fdd9eb3242b43539572a1993fefd174640c6d83))
* properly log error stack ([485e220](https://github.com/dendronhq/dendron/commit/485e220f8ffa6cd63210e106e846ff305b920b77))


### Features Dendron

* Insert Note Index command ([#1142](https://github.com/dendronhq/dendron/issues/1142)) ([c140015](https://github.com/dendronhq/dendron/commit/c140015c19a942cf4696d596e818fd89905eea25))
* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* undefined tags breaks note serialization ([b1d784c](https://github.com/dendronhq/dendron/commit/b1d784c8df18b3b45999f01c14793436ff669a3f))


### Features Dendron

* colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
* resolve vim keybinding conflict on initial install ([#1103](https://github.com/dendronhq/dendron/issues/1103)) ([2278c66](https://github.com/dendronhq/dendron/commit/2278c6616c8297cc414ad02d5323bff5c45072e4))
* **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))
* Add SchemaLookupCommand ([#1082](https://github.com/dendronhq/dendron/issues/1082)) ([fe11a0e](https://github.com/dendronhq/dendron/commit/fe11a0ea1e0214823dd01842b941456df164bc70))
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* generate json schema from config ([#1100](https://github.com/dendronhq/dendron/issues/1100)) ([53b189e](https://github.com/dendronhq/dendron/commit/53b189ec973a8d3d3ccf300a0e59908197f4efb1))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.69.3-alpha.0](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.69.3-alpha.0) (2021-11-22)


### Bug Fixes

* **lookup:** hierarchy look up when inside parts of the hierarchy are omitted ([#1522](https://github.com/dendronhq/dendron/issues/1522)) ([6c30af5](https://github.com/dendronhq/dendron/commit/6c30af5e5b76297334f15a435fd1f9ad09941e06))
* **markdown:** email parsed as user tag & option to disable user tags and hashtags ([#1562](https://github.com/dendronhq/dendron/issues/1562)) ([fd56f7e](https://github.com/dendronhq/dendron/commit/fd56f7ece1651ea6433ebf481f2c54386ab6fb16))
* **markdown:** footnote links move view in publishing & preview ([#1568](https://github.com/dendronhq/dendron/issues/1568)) ([fbe659d](https://github.com/dendronhq/dendron/commit/fbe659d2be3d1f2534d7437d585e9fa38f1684da))
* **pods:** invalid configuration error ([398a599](https://github.com/dendronhq/dendron/commit/398a5995fc594566131eb283ff989a877ca9c995))
* **publish:** make mermaid work consistently on published sites ([2f648e0](https://github.com/dendronhq/dendron/commit/2f648e0a34c95095e86e8535a1fa8ec9ac4de39c))
* **workspace:** checks against fnames with all lowercase ([#1739](https://github.com/dendronhq/dendron/issues/1739)) ([8e3f8ec](https://github.com/dendronhq/dendron/commit/8e3f8ec061e0ce7d249a7e92902bb48e7c520793))
* backward compatibility of id matching adding '_' to id regex match. ([#1504](https://github.com/dendronhq/dendron/issues/1504)) ([4bbae40](https://github.com/dendronhq/dendron/commit/4bbae40d81ea064612f605c6f4e18ae8d34ba0de))
* replace auto generated ids (coming from inline schemas) with patterns ([#1632](https://github.com/dendronhq/dendron/issues/1632)) ([af28cf6](https://github.com/dendronhq/dendron/commit/af28cf6ef1d085d22069695e9df128477c024d1b))


### Features Dendron

* Native workspace enhancements ([#1670](https://github.com/dendronhq/dendron/issues/1670)) ([7a392bb](https://github.com/dendronhq/dendron/commit/7a392bb47c69b562d54fa15479a184f1441e129e))
* **notes:** task notes (create modifier & editor highlighting) ([#1583](https://github.com/dendronhq/dendron/issues/1583)) ([e785efa](https://github.com/dendronhq/dendron/commit/e785efa8e2ce55bc39fb90cf34984d55035dd6ca))
* **schemas:** adding new command - create schema from hierarchy ([#1673](https://github.com/dendronhq/dendron/issues/1673)) ([14732ec](https://github.com/dendronhq/dendron/commit/14732ecbdd42511337ddaaf3fc91bde288c3036d))
* **workspace:** better note previews ([#1666](https://github.com/dendronhq/dendron/issues/1666)) ([5cf7067](https://github.com/dendronhq/dendron/commit/5cf70672a24a62d528440f38b44813bfa627fb88))
* **workspace:** convert vault command ([#1542](https://github.com/dendronhq/dendron/issues/1542)) ([c265e9d](https://github.com/dendronhq/dendron/commit/c265e9d2c238b5a6b3761f4c073140b1a0debe3a))



## 0.62.3 (2021-10-09)


### Bug Fixes

* template doesn't copy FM tags ([#1488](https://github.com/dendronhq/dendron/issues/1488)) ([0317699](https://github.com/dendronhq/dendron/commit/0317699ef9bfd4d77b1d3d05f8093e725ea5b2c3)), closes [#1481](https://github.com/dendronhq/dendron/issues/1481)
* **view:** enable anchor links to work in preview ([#1375](https://github.com/dendronhq/dendron/issues/1375)) ([f27cfb0](https://github.com/dendronhq/dendron/commit/f27cfb07d612e28fd0d6dd08019d772767900bba))
* preview caching invalidation when notes with ![[ref]] links change ([#1385](https://github.com/dendronhq/dendron/issues/1385)) ([efeef86](https://github.com/dendronhq/dendron/commit/efeef8662ec52e64ba33cae9b1196bba6cc82f95))
* **publish:** bad seo props setter ([373d933](https://github.com/dendronhq/dendron/commit/373d9331aba3b3385632f01661dd6c80835ec5ac))


### Features Dendron

* Lapsed user survey ([#1446](https://github.com/dendronhq/dendron/issues/1446)) ([8094d2b](https://github.com/dendronhq/dendron/commit/8094d2bb1972fecf4fde74e8c5644aeba3eec119)), closes [#1349](https://github.com/dendronhq/dendron/issues/1349)
* **publish:** add table of contents ([#1428](https://github.com/dendronhq/dendron/issues/1428)) ([df4b05b](https://github.com/dendronhq/dendron/commit/df4b05ba8526dc32362d6a59543d880f253f02fc))



# 0.61.0 (2021-09-28)


### Bug Fixes

* **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))
* support activation for older vscode version ([#1426](https://github.com/dendronhq/dendron/issues/1426)) ([5a1c7ed](https://github.com/dendronhq/dendron/commit/5a1c7ed9b45df2f00e61229c0776dad41cc29aba))


### Features Dendron

* **workspace:** add survey for new users([#1409](https://github.com/dendronhq/dendron/issues/1409)) ([e2b1754](https://github.com/dendronhq/dendron/commit/e2b17548fbbe3dffef961eb393f82a6a876940e7))



## 0.60.2 (2021-09-25)



## 0.60.2-alpha.0 (2021-09-24)



## 0.60.1 (2021-09-24)


### Bug Fixes

* pesky error popup when schema lookup is closed ([#1389](https://github.com/dendronhq/dendron/issues/1389)) ([4d2bb40](https://github.com/dendronhq/dendron/commit/4d2bb401b17e926dc2eaa11957536f0c75a1e538))
* single letter look up matches ([#1388](https://github.com/dendronhq/dendron/issues/1388)) ([7de9a71](https://github.com/dendronhq/dendron/commit/7de9a7195a02399b1285b51ef08d6853b1f390f6))



# 0.60.0 (2021-09-21)


### Bug Fixes

* **commands:** rename note leaves incorrect metadata if parent is a stub ([#1348](https://github.com/dendronhq/dendron/issues/1348)) ([d432cc9](https://github.com/dendronhq/dendron/commit/d432cc9e20ff8b9f6cefd7cc4c3a42b567ed9bc5))
* **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))
* **workspace:** disable certain decorations for long notes to avoid performance hit ([#1337](https://github.com/dendronhq/dendron/issues/1337)) ([f1c46f9](https://github.com/dendronhq/dendron/commit/f1c46f95c228ada2126ec7212cede3bf5acc773d))
* direct children query ([#1303](https://github.com/dendronhq/dendron/issues/1303)) ([bcf0dea](https://github.com/dendronhq/dendron/commit/bcf0deae422406564cd9a56c1765f90dd2e66215))
* issue with webpack devCLI ([a4ff4c9](https://github.com/dendronhq/dendron/commit/a4ff4c9ae28ff31ab6f9483c339ae78b5144e185))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))
* stop calendar from auto expanding when the last note is closed ([#1299](https://github.com/dendronhq/dendron/issues/1299)) ([9c8f853](https://github.com/dendronhq/dendron/commit/9c8f8533da5027c122e0d003ce4c61dc866735f5))


### Features Dendron

* consolidate dendron configs ([#1295](https://github.com/dendronhq/dendron/issues/1295)) ([177ac92](https://github.com/dendronhq/dendron/commit/177ac925a5442471f041ce5d991da52cecee6c9b))
* nextjs publishing fulltext search ([#1334](https://github.com/dendronhq/dendron/issues/1334)) ([68f8473](https://github.com/dendronhq/dendron/commit/68f8473badf22494c8d0758f8195e377235321f6))
* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* user tags ([#1228](https://github.com/dendronhq/dendron/issues/1228)) ([98c0106](https://github.com/dendronhq/dendron/commit/98c0106367e384c130a927484b9ea294eb6f84fa))



## 0.55.2 (2021-08-21)


### Bug Fixes

* wrong internal links in nextjs publishing ([#1165](https://github.com/dendronhq/dendron/issues/1165)) ([59a949d](https://github.com/dendronhq/dendron/commit/59a949d2b5b541efb283e851060636b108eb5a98))



## 0.55.1 (2021-08-17)


### Bug Fixes

* multiple issues with lookupv3 ([1fdd9eb](https://github.com/dendronhq/dendron/commit/1fdd9eb3242b43539572a1993fefd174640c6d83))
* properly log error stack ([485e220](https://github.com/dendronhq/dendron/commit/485e220f8ffa6cd63210e106e846ff305b920b77))


### Features Dendron

* Insert Note Index command ([#1142](https://github.com/dendronhq/dendron/issues/1142)) ([c140015](https://github.com/dendronhq/dendron/commit/c140015c19a942cf4696d596e818fd89905eea25))
* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* undefined tags breaks note serialization ([b1d784c](https://github.com/dendronhq/dendron/commit/b1d784c8df18b3b45999f01c14793436ff669a3f))


### Features Dendron

* colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
* resolve vim keybinding conflict on initial install ([#1103](https://github.com/dendronhq/dendron/issues/1103)) ([2278c66](https://github.com/dendronhq/dendron/commit/2278c6616c8297cc414ad02d5323bff5c45072e4))
* **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))
* Add SchemaLookupCommand ([#1082](https://github.com/dendronhq/dendron/issues/1082)) ([fe11a0e](https://github.com/dendronhq/dendron/commit/fe11a0ea1e0214823dd01842b941456df164bc70))
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* generate json schema from config ([#1100](https://github.com/dendronhq/dendron/issues/1100)) ([53b189e](https://github.com/dendronhq/dendron/commit/53b189ec973a8d3d3ccf300a0e59908197f4efb1))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.69.2](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.69.2) (2021-11-19)


### Bug Fixes

* decorations working for long notes, improved task note decorations ([#1725](https://github.com/dendronhq/dendron/issues/1725)) ([f03cd9a](https://github.com/dendronhq/dendron/commit/f03cd9a77e7304af116a633f9a11c486dec5ef9d))
* **pods:** invalid configuration error ([398a599](https://github.com/dendronhq/dendron/commit/398a5995fc594566131eb283ff989a877ca9c995))
* replace auto generated ids (coming from inline schemas) with patterns ([#1632](https://github.com/dendronhq/dendron/issues/1632)) ([af28cf6](https://github.com/dendronhq/dendron/commit/af28cf6ef1d085d22069695e9df128477c024d1b))
* **lookup:** hierarchy look up when inside parts of the hierarchy are omitted ([#1522](https://github.com/dendronhq/dendron/issues/1522)) ([6c30af5](https://github.com/dendronhq/dendron/commit/6c30af5e5b76297334f15a435fd1f9ad09941e06))
* **markdown:** email parsed as user tag & option to disable user tags and hashtags ([#1562](https://github.com/dendronhq/dendron/issues/1562)) ([fd56f7e](https://github.com/dendronhq/dendron/commit/fd56f7ece1651ea6433ebf481f2c54386ab6fb16))
* **markdown:** footnote links move view in publishing & preview ([#1568](https://github.com/dendronhq/dendron/issues/1568)) ([fbe659d](https://github.com/dendronhq/dendron/commit/fbe659d2be3d1f2534d7437d585e9fa38f1684da))
* backward compatibility of id matching adding '_' to id regex match. ([#1504](https://github.com/dendronhq/dendron/issues/1504)) ([4bbae40](https://github.com/dendronhq/dendron/commit/4bbae40d81ea064612f605c6f4e18ae8d34ba0de))


### Features Dendron

* Native workspace enhancements ([#1670](https://github.com/dendronhq/dendron/issues/1670)) ([7a392bb](https://github.com/dendronhq/dendron/commit/7a392bb47c69b562d54fa15479a184f1441e129e))
* **notes:** task notes (create modifier & editor highlighting) ([#1583](https://github.com/dendronhq/dendron/issues/1583)) ([e785efa](https://github.com/dendronhq/dendron/commit/e785efa8e2ce55bc39fb90cf34984d55035dd6ca))
* **schemas:** adding new command - create schema from hierarchy ([#1673](https://github.com/dendronhq/dendron/issues/1673)) ([14732ec](https://github.com/dendronhq/dendron/commit/14732ecbdd42511337ddaaf3fc91bde288c3036d))
* **workspace:** better note previews ([#1666](https://github.com/dendronhq/dendron/issues/1666)) ([5cf7067](https://github.com/dendronhq/dendron/commit/5cf70672a24a62d528440f38b44813bfa627fb88))
* **workspace:** convert vault command ([#1542](https://github.com/dendronhq/dendron/issues/1542)) ([c265e9d](https://github.com/dendronhq/dendron/commit/c265e9d2c238b5a6b3761f4c073140b1a0debe3a))



## 0.62.3 (2021-10-09)


### Bug Fixes

* template doesn't copy FM tags ([#1488](https://github.com/dendronhq/dendron/issues/1488)) ([0317699](https://github.com/dendronhq/dendron/commit/0317699ef9bfd4d77b1d3d05f8093e725ea5b2c3)), closes [#1481](https://github.com/dendronhq/dendron/issues/1481)
* **view:** enable anchor links to work in preview ([#1375](https://github.com/dendronhq/dendron/issues/1375)) ([f27cfb0](https://github.com/dendronhq/dendron/commit/f27cfb07d612e28fd0d6dd08019d772767900bba))
* preview caching invalidation when notes with ![[ref]] links change ([#1385](https://github.com/dendronhq/dendron/issues/1385)) ([efeef86](https://github.com/dendronhq/dendron/commit/efeef8662ec52e64ba33cae9b1196bba6cc82f95))
* **publish:** bad seo props setter ([373d933](https://github.com/dendronhq/dendron/commit/373d9331aba3b3385632f01661dd6c80835ec5ac))


### Features Dendron

* Lapsed user survey ([#1446](https://github.com/dendronhq/dendron/issues/1446)) ([8094d2b](https://github.com/dendronhq/dendron/commit/8094d2bb1972fecf4fde74e8c5644aeba3eec119)), closes [#1349](https://github.com/dendronhq/dendron/issues/1349)
* **publish:** add table of contents ([#1428](https://github.com/dendronhq/dendron/issues/1428)) ([df4b05b](https://github.com/dendronhq/dendron/commit/df4b05ba8526dc32362d6a59543d880f253f02fc))



# 0.61.0 (2021-09-28)


### Bug Fixes

* **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))
* support activation for older vscode version ([#1426](https://github.com/dendronhq/dendron/issues/1426)) ([5a1c7ed](https://github.com/dendronhq/dendron/commit/5a1c7ed9b45df2f00e61229c0776dad41cc29aba))


### Features Dendron

* **workspace:** add survey for new users([#1409](https://github.com/dendronhq/dendron/issues/1409)) ([e2b1754](https://github.com/dendronhq/dendron/commit/e2b17548fbbe3dffef961eb393f82a6a876940e7))



## 0.60.2 (2021-09-25)



## 0.60.2-alpha.0 (2021-09-24)



## 0.60.1 (2021-09-24)


### Bug Fixes

* pesky error popup when schema lookup is closed ([#1389](https://github.com/dendronhq/dendron/issues/1389)) ([4d2bb40](https://github.com/dendronhq/dendron/commit/4d2bb401b17e926dc2eaa11957536f0c75a1e538))
* single letter look up matches ([#1388](https://github.com/dendronhq/dendron/issues/1388)) ([7de9a71](https://github.com/dendronhq/dendron/commit/7de9a7195a02399b1285b51ef08d6853b1f390f6))



# 0.60.0 (2021-09-21)


### Bug Fixes

* **commands:** rename note leaves incorrect metadata if parent is a stub ([#1348](https://github.com/dendronhq/dendron/issues/1348)) ([d432cc9](https://github.com/dendronhq/dendron/commit/d432cc9e20ff8b9f6cefd7cc4c3a42b567ed9bc5))
* **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))
* **workspace:** disable certain decorations for long notes to avoid performance hit ([#1337](https://github.com/dendronhq/dendron/issues/1337)) ([f1c46f9](https://github.com/dendronhq/dendron/commit/f1c46f95c228ada2126ec7212cede3bf5acc773d))
* direct children query ([#1303](https://github.com/dendronhq/dendron/issues/1303)) ([bcf0dea](https://github.com/dendronhq/dendron/commit/bcf0deae422406564cd9a56c1765f90dd2e66215))
* issue with webpack devCLI ([a4ff4c9](https://github.com/dendronhq/dendron/commit/a4ff4c9ae28ff31ab6f9483c339ae78b5144e185))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))
* stop calendar from auto expanding when the last note is closed ([#1299](https://github.com/dendronhq/dendron/issues/1299)) ([9c8f853](https://github.com/dendronhq/dendron/commit/9c8f8533da5027c122e0d003ce4c61dc866735f5))


### Features Dendron

* consolidate dendron configs ([#1295](https://github.com/dendronhq/dendron/issues/1295)) ([177ac92](https://github.com/dendronhq/dendron/commit/177ac925a5442471f041ce5d991da52cecee6c9b))
* nextjs publishing fulltext search ([#1334](https://github.com/dendronhq/dendron/issues/1334)) ([68f8473](https://github.com/dendronhq/dendron/commit/68f8473badf22494c8d0758f8195e377235321f6))
* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* user tags ([#1228](https://github.com/dendronhq/dendron/issues/1228)) ([98c0106](https://github.com/dendronhq/dendron/commit/98c0106367e384c130a927484b9ea294eb6f84fa))



## 0.55.2 (2021-08-21)


### Bug Fixes

* wrong internal links in nextjs publishing ([#1165](https://github.com/dendronhq/dendron/issues/1165)) ([59a949d](https://github.com/dendronhq/dendron/commit/59a949d2b5b541efb283e851060636b108eb5a98))



## 0.55.1 (2021-08-17)


### Bug Fixes

* multiple issues with lookupv3 ([1fdd9eb](https://github.com/dendronhq/dendron/commit/1fdd9eb3242b43539572a1993fefd174640c6d83))
* properly log error stack ([485e220](https://github.com/dendronhq/dendron/commit/485e220f8ffa6cd63210e106e846ff305b920b77))


### Features Dendron

* Insert Note Index command ([#1142](https://github.com/dendronhq/dendron/issues/1142)) ([c140015](https://github.com/dendronhq/dendron/commit/c140015c19a942cf4696d596e818fd89905eea25))
* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* undefined tags breaks note serialization ([b1d784c](https://github.com/dendronhq/dendron/commit/b1d784c8df18b3b45999f01c14793436ff669a3f))


### Features Dendron

* colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
* resolve vim keybinding conflict on initial install ([#1103](https://github.com/dendronhq/dendron/issues/1103)) ([2278c66](https://github.com/dendronhq/dendron/commit/2278c6616c8297cc414ad02d5323bff5c45072e4))
* **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))
* Add SchemaLookupCommand ([#1082](https://github.com/dendronhq/dendron/issues/1082)) ([fe11a0e](https://github.com/dendronhq/dendron/commit/fe11a0ea1e0214823dd01842b941456df164bc70))
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* generate json schema from config ([#1100](https://github.com/dendronhq/dendron/issues/1100)) ([53b189e](https://github.com/dendronhq/dendron/commit/53b189ec973a8d3d3ccf300a0e59908197f4efb1))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.69.2-alpha.0](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.69.2-alpha.0) (2021-11-19)


### Bug Fixes

* decorations working for long notes, improved task note decorations ([#1725](https://github.com/dendronhq/dendron/issues/1725)) ([f03cd9a](https://github.com/dendronhq/dendron/commit/f03cd9a77e7304af116a633f9a11c486dec5ef9d))
* **pods:** invalid configuration error ([398a599](https://github.com/dendronhq/dendron/commit/398a5995fc594566131eb283ff989a877ca9c995))
* replace auto generated ids (coming from inline schemas) with patterns ([#1632](https://github.com/dendronhq/dendron/issues/1632)) ([af28cf6](https://github.com/dendronhq/dendron/commit/af28cf6ef1d085d22069695e9df128477c024d1b))
* **lookup:** hierarchy look up when inside parts of the hierarchy are omitted ([#1522](https://github.com/dendronhq/dendron/issues/1522)) ([6c30af5](https://github.com/dendronhq/dendron/commit/6c30af5e5b76297334f15a435fd1f9ad09941e06))
* **markdown:** email parsed as user tag & option to disable user tags and hashtags ([#1562](https://github.com/dendronhq/dendron/issues/1562)) ([fd56f7e](https://github.com/dendronhq/dendron/commit/fd56f7ece1651ea6433ebf481f2c54386ab6fb16))
* **markdown:** footnote links move view in publishing & preview ([#1568](https://github.com/dendronhq/dendron/issues/1568)) ([fbe659d](https://github.com/dendronhq/dendron/commit/fbe659d2be3d1f2534d7437d585e9fa38f1684da))
* backward compatibility of id matching adding '_' to id regex match. ([#1504](https://github.com/dendronhq/dendron/issues/1504)) ([4bbae40](https://github.com/dendronhq/dendron/commit/4bbae40d81ea064612f605c6f4e18ae8d34ba0de))


### Features Dendron

* Native workspace enhancements ([#1670](https://github.com/dendronhq/dendron/issues/1670)) ([7a392bb](https://github.com/dendronhq/dendron/commit/7a392bb47c69b562d54fa15479a184f1441e129e))
* **notes:** task notes (create modifier & editor highlighting) ([#1583](https://github.com/dendronhq/dendron/issues/1583)) ([e785efa](https://github.com/dendronhq/dendron/commit/e785efa8e2ce55bc39fb90cf34984d55035dd6ca))
* **schemas:** adding new command - create schema from hierarchy ([#1673](https://github.com/dendronhq/dendron/issues/1673)) ([14732ec](https://github.com/dendronhq/dendron/commit/14732ecbdd42511337ddaaf3fc91bde288c3036d))
* **workspace:** better note previews ([#1666](https://github.com/dendronhq/dendron/issues/1666)) ([5cf7067](https://github.com/dendronhq/dendron/commit/5cf70672a24a62d528440f38b44813bfa627fb88))
* **workspace:** convert vault command ([#1542](https://github.com/dendronhq/dendron/issues/1542)) ([c265e9d](https://github.com/dendronhq/dendron/commit/c265e9d2c238b5a6b3761f4c073140b1a0debe3a))



## 0.62.3 (2021-10-09)


### Bug Fixes

* template doesn't copy FM tags ([#1488](https://github.com/dendronhq/dendron/issues/1488)) ([0317699](https://github.com/dendronhq/dendron/commit/0317699ef9bfd4d77b1d3d05f8093e725ea5b2c3)), closes [#1481](https://github.com/dendronhq/dendron/issues/1481)
* **view:** enable anchor links to work in preview ([#1375](https://github.com/dendronhq/dendron/issues/1375)) ([f27cfb0](https://github.com/dendronhq/dendron/commit/f27cfb07d612e28fd0d6dd08019d772767900bba))
* preview caching invalidation when notes with ![[ref]] links change ([#1385](https://github.com/dendronhq/dendron/issues/1385)) ([efeef86](https://github.com/dendronhq/dendron/commit/efeef8662ec52e64ba33cae9b1196bba6cc82f95))
* **publish:** bad seo props setter ([373d933](https://github.com/dendronhq/dendron/commit/373d9331aba3b3385632f01661dd6c80835ec5ac))


### Features Dendron

* Lapsed user survey ([#1446](https://github.com/dendronhq/dendron/issues/1446)) ([8094d2b](https://github.com/dendronhq/dendron/commit/8094d2bb1972fecf4fde74e8c5644aeba3eec119)), closes [#1349](https://github.com/dendronhq/dendron/issues/1349)
* **publish:** add table of contents ([#1428](https://github.com/dendronhq/dendron/issues/1428)) ([df4b05b](https://github.com/dendronhq/dendron/commit/df4b05ba8526dc32362d6a59543d880f253f02fc))



# 0.61.0 (2021-09-28)


### Bug Fixes

* **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))
* support activation for older vscode version ([#1426](https://github.com/dendronhq/dendron/issues/1426)) ([5a1c7ed](https://github.com/dendronhq/dendron/commit/5a1c7ed9b45df2f00e61229c0776dad41cc29aba))


### Features Dendron

* **workspace:** add survey for new users([#1409](https://github.com/dendronhq/dendron/issues/1409)) ([e2b1754](https://github.com/dendronhq/dendron/commit/e2b17548fbbe3dffef961eb393f82a6a876940e7))



## 0.60.2 (2021-09-25)



## 0.60.2-alpha.0 (2021-09-24)



## 0.60.1 (2021-09-24)


### Bug Fixes

* pesky error popup when schema lookup is closed ([#1389](https://github.com/dendronhq/dendron/issues/1389)) ([4d2bb40](https://github.com/dendronhq/dendron/commit/4d2bb401b17e926dc2eaa11957536f0c75a1e538))
* single letter look up matches ([#1388](https://github.com/dendronhq/dendron/issues/1388)) ([7de9a71](https://github.com/dendronhq/dendron/commit/7de9a7195a02399b1285b51ef08d6853b1f390f6))



# 0.60.0 (2021-09-21)


### Bug Fixes

* **commands:** rename note leaves incorrect metadata if parent is a stub ([#1348](https://github.com/dendronhq/dendron/issues/1348)) ([d432cc9](https://github.com/dendronhq/dendron/commit/d432cc9e20ff8b9f6cefd7cc4c3a42b567ed9bc5))
* **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))
* **workspace:** disable certain decorations for long notes to avoid performance hit ([#1337](https://github.com/dendronhq/dendron/issues/1337)) ([f1c46f9](https://github.com/dendronhq/dendron/commit/f1c46f95c228ada2126ec7212cede3bf5acc773d))
* direct children query ([#1303](https://github.com/dendronhq/dendron/issues/1303)) ([bcf0dea](https://github.com/dendronhq/dendron/commit/bcf0deae422406564cd9a56c1765f90dd2e66215))
* issue with webpack devCLI ([a4ff4c9](https://github.com/dendronhq/dendron/commit/a4ff4c9ae28ff31ab6f9483c339ae78b5144e185))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))
* stop calendar from auto expanding when the last note is closed ([#1299](https://github.com/dendronhq/dendron/issues/1299)) ([9c8f853](https://github.com/dendronhq/dendron/commit/9c8f8533da5027c122e0d003ce4c61dc866735f5))


### Features Dendron

* consolidate dendron configs ([#1295](https://github.com/dendronhq/dendron/issues/1295)) ([177ac92](https://github.com/dendronhq/dendron/commit/177ac925a5442471f041ce5d991da52cecee6c9b))
* nextjs publishing fulltext search ([#1334](https://github.com/dendronhq/dendron/issues/1334)) ([68f8473](https://github.com/dendronhq/dendron/commit/68f8473badf22494c8d0758f8195e377235321f6))
* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* user tags ([#1228](https://github.com/dendronhq/dendron/issues/1228)) ([98c0106](https://github.com/dendronhq/dendron/commit/98c0106367e384c130a927484b9ea294eb6f84fa))



## 0.55.2 (2021-08-21)


### Bug Fixes

* wrong internal links in nextjs publishing ([#1165](https://github.com/dendronhq/dendron/issues/1165)) ([59a949d](https://github.com/dendronhq/dendron/commit/59a949d2b5b541efb283e851060636b108eb5a98))



## 0.55.1 (2021-08-17)


### Bug Fixes

* multiple issues with lookupv3 ([1fdd9eb](https://github.com/dendronhq/dendron/commit/1fdd9eb3242b43539572a1993fefd174640c6d83))
* properly log error stack ([485e220](https://github.com/dendronhq/dendron/commit/485e220f8ffa6cd63210e106e846ff305b920b77))


### Features Dendron

* Insert Note Index command ([#1142](https://github.com/dendronhq/dendron/issues/1142)) ([c140015](https://github.com/dendronhq/dendron/commit/c140015c19a942cf4696d596e818fd89905eea25))
* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* undefined tags breaks note serialization ([b1d784c](https://github.com/dendronhq/dendron/commit/b1d784c8df18b3b45999f01c14793436ff669a3f))


### Features Dendron

* colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
* resolve vim keybinding conflict on initial install ([#1103](https://github.com/dendronhq/dendron/issues/1103)) ([2278c66](https://github.com/dendronhq/dendron/commit/2278c6616c8297cc414ad02d5323bff5c45072e4))
* **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))
* Add SchemaLookupCommand ([#1082](https://github.com/dendronhq/dendron/issues/1082)) ([fe11a0e](https://github.com/dendronhq/dendron/commit/fe11a0ea1e0214823dd01842b941456df164bc70))
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* generate json schema from config ([#1100](https://github.com/dendronhq/dendron/issues/1100)) ([53b189e](https://github.com/dendronhq/dendron/commit/53b189ec973a8d3d3ccf300a0e59908197f4efb1))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.69.1](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.69.1) (2021-11-16)


### Bug Fixes

* replace auto generated ids (coming from inline schemas) with patterns ([#1632](https://github.com/dendronhq/dendron/issues/1632)) ([af28cf6](https://github.com/dendronhq/dendron/commit/af28cf6ef1d085d22069695e9df128477c024d1b))
* **lookup:** hierarchy look up when inside parts of the hierarchy are omitted ([#1522](https://github.com/dendronhq/dendron/issues/1522)) ([6c30af5](https://github.com/dendronhq/dendron/commit/6c30af5e5b76297334f15a435fd1f9ad09941e06))
* **markdown:** email parsed as user tag & option to disable user tags and hashtags ([#1562](https://github.com/dendronhq/dendron/issues/1562)) ([fd56f7e](https://github.com/dendronhq/dendron/commit/fd56f7ece1651ea6433ebf481f2c54386ab6fb16))
* **markdown:** footnote links move view in publishing & preview ([#1568](https://github.com/dendronhq/dendron/issues/1568)) ([fbe659d](https://github.com/dendronhq/dendron/commit/fbe659d2be3d1f2534d7437d585e9fa38f1684da))
* backward compatibility of id matching adding '_' to id regex match. ([#1504](https://github.com/dendronhq/dendron/issues/1504)) ([4bbae40](https://github.com/dendronhq/dendron/commit/4bbae40d81ea064612f605c6f4e18ae8d34ba0de))


### Features Dendron

* Native workspace enhancements ([#1670](https://github.com/dendronhq/dendron/issues/1670)) ([7a392bb](https://github.com/dendronhq/dendron/commit/7a392bb47c69b562d54fa15479a184f1441e129e))
* **notes:** task notes (create modifier & editor highlighting) ([#1583](https://github.com/dendronhq/dendron/issues/1583)) ([e785efa](https://github.com/dendronhq/dendron/commit/e785efa8e2ce55bc39fb90cf34984d55035dd6ca))
* **schemas:** adding new command - create schema from hierarchy ([#1673](https://github.com/dendronhq/dendron/issues/1673)) ([14732ec](https://github.com/dendronhq/dendron/commit/14732ecbdd42511337ddaaf3fc91bde288c3036d))
* **workspace:** better note previews ([#1666](https://github.com/dendronhq/dendron/issues/1666)) ([5cf7067](https://github.com/dendronhq/dendron/commit/5cf70672a24a62d528440f38b44813bfa627fb88))
* **workspace:** convert vault command ([#1542](https://github.com/dendronhq/dendron/issues/1542)) ([c265e9d](https://github.com/dendronhq/dendron/commit/c265e9d2c238b5a6b3761f4c073140b1a0debe3a))



## 0.62.3 (2021-10-09)


### Bug Fixes

* template doesn't copy FM tags ([#1488](https://github.com/dendronhq/dendron/issues/1488)) ([0317699](https://github.com/dendronhq/dendron/commit/0317699ef9bfd4d77b1d3d05f8093e725ea5b2c3)), closes [#1481](https://github.com/dendronhq/dendron/issues/1481)
* **view:** enable anchor links to work in preview ([#1375](https://github.com/dendronhq/dendron/issues/1375)) ([f27cfb0](https://github.com/dendronhq/dendron/commit/f27cfb07d612e28fd0d6dd08019d772767900bba))
* preview caching invalidation when notes with ![[ref]] links change ([#1385](https://github.com/dendronhq/dendron/issues/1385)) ([efeef86](https://github.com/dendronhq/dendron/commit/efeef8662ec52e64ba33cae9b1196bba6cc82f95))
* **publish:** bad seo props setter ([373d933](https://github.com/dendronhq/dendron/commit/373d9331aba3b3385632f01661dd6c80835ec5ac))


### Features Dendron

* Lapsed user survey ([#1446](https://github.com/dendronhq/dendron/issues/1446)) ([8094d2b](https://github.com/dendronhq/dendron/commit/8094d2bb1972fecf4fde74e8c5644aeba3eec119)), closes [#1349](https://github.com/dendronhq/dendron/issues/1349)
* **publish:** add table of contents ([#1428](https://github.com/dendronhq/dendron/issues/1428)) ([df4b05b](https://github.com/dendronhq/dendron/commit/df4b05ba8526dc32362d6a59543d880f253f02fc))



# 0.61.0 (2021-09-28)


### Bug Fixes

* **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))
* support activation for older vscode version ([#1426](https://github.com/dendronhq/dendron/issues/1426)) ([5a1c7ed](https://github.com/dendronhq/dendron/commit/5a1c7ed9b45df2f00e61229c0776dad41cc29aba))


### Features Dendron

* **workspace:** add survey for new users([#1409](https://github.com/dendronhq/dendron/issues/1409)) ([e2b1754](https://github.com/dendronhq/dendron/commit/e2b17548fbbe3dffef961eb393f82a6a876940e7))



## 0.60.2 (2021-09-25)



## 0.60.2-alpha.0 (2021-09-24)



## 0.60.1 (2021-09-24)


### Bug Fixes

* pesky error popup when schema lookup is closed ([#1389](https://github.com/dendronhq/dendron/issues/1389)) ([4d2bb40](https://github.com/dendronhq/dendron/commit/4d2bb401b17e926dc2eaa11957536f0c75a1e538))
* single letter look up matches ([#1388](https://github.com/dendronhq/dendron/issues/1388)) ([7de9a71](https://github.com/dendronhq/dendron/commit/7de9a7195a02399b1285b51ef08d6853b1f390f6))



# 0.60.0 (2021-09-21)


### Bug Fixes

* **commands:** rename note leaves incorrect metadata if parent is a stub ([#1348](https://github.com/dendronhq/dendron/issues/1348)) ([d432cc9](https://github.com/dendronhq/dendron/commit/d432cc9e20ff8b9f6cefd7cc4c3a42b567ed9bc5))
* **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))
* **workspace:** disable certain decorations for long notes to avoid performance hit ([#1337](https://github.com/dendronhq/dendron/issues/1337)) ([f1c46f9](https://github.com/dendronhq/dendron/commit/f1c46f95c228ada2126ec7212cede3bf5acc773d))
* direct children query ([#1303](https://github.com/dendronhq/dendron/issues/1303)) ([bcf0dea](https://github.com/dendronhq/dendron/commit/bcf0deae422406564cd9a56c1765f90dd2e66215))
* issue with webpack devCLI ([a4ff4c9](https://github.com/dendronhq/dendron/commit/a4ff4c9ae28ff31ab6f9483c339ae78b5144e185))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))
* stop calendar from auto expanding when the last note is closed ([#1299](https://github.com/dendronhq/dendron/issues/1299)) ([9c8f853](https://github.com/dendronhq/dendron/commit/9c8f8533da5027c122e0d003ce4c61dc866735f5))


### Features Dendron

* consolidate dendron configs ([#1295](https://github.com/dendronhq/dendron/issues/1295)) ([177ac92](https://github.com/dendronhq/dendron/commit/177ac925a5442471f041ce5d991da52cecee6c9b))
* nextjs publishing fulltext search ([#1334](https://github.com/dendronhq/dendron/issues/1334)) ([68f8473](https://github.com/dendronhq/dendron/commit/68f8473badf22494c8d0758f8195e377235321f6))
* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* user tags ([#1228](https://github.com/dendronhq/dendron/issues/1228)) ([98c0106](https://github.com/dendronhq/dendron/commit/98c0106367e384c130a927484b9ea294eb6f84fa))



## 0.55.2 (2021-08-21)


### Bug Fixes

* wrong internal links in nextjs publishing ([#1165](https://github.com/dendronhq/dendron/issues/1165)) ([59a949d](https://github.com/dendronhq/dendron/commit/59a949d2b5b541efb283e851060636b108eb5a98))



## 0.55.1 (2021-08-17)


### Bug Fixes

* multiple issues with lookupv3 ([1fdd9eb](https://github.com/dendronhq/dendron/commit/1fdd9eb3242b43539572a1993fefd174640c6d83))
* properly log error stack ([485e220](https://github.com/dendronhq/dendron/commit/485e220f8ffa6cd63210e106e846ff305b920b77))


### Features Dendron

* Insert Note Index command ([#1142](https://github.com/dendronhq/dendron/issues/1142)) ([c140015](https://github.com/dendronhq/dendron/commit/c140015c19a942cf4696d596e818fd89905eea25))
* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* undefined tags breaks note serialization ([b1d784c](https://github.com/dendronhq/dendron/commit/b1d784c8df18b3b45999f01c14793436ff669a3f))


### Features Dendron

* colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
* resolve vim keybinding conflict on initial install ([#1103](https://github.com/dendronhq/dendron/issues/1103)) ([2278c66](https://github.com/dendronhq/dendron/commit/2278c6616c8297cc414ad02d5323bff5c45072e4))
* **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))
* Add SchemaLookupCommand ([#1082](https://github.com/dendronhq/dendron/issues/1082)) ([fe11a0e](https://github.com/dendronhq/dendron/commit/fe11a0ea1e0214823dd01842b941456df164bc70))
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* generate json schema from config ([#1100](https://github.com/dendronhq/dendron/issues/1100)) ([53b189e](https://github.com/dendronhq/dendron/commit/53b189ec973a8d3d3ccf300a0e59908197f4efb1))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





# [0.69.0](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.69.0) (2021-11-16)


### Bug Fixes

* replace auto generated ids (coming from inline schemas) with patterns ([#1632](https://github.com/dendronhq/dendron/issues/1632)) ([af28cf6](https://github.com/dendronhq/dendron/commit/af28cf6ef1d085d22069695e9df128477c024d1b))
* **lookup:** hierarchy look up when inside parts of the hierarchy are omitted ([#1522](https://github.com/dendronhq/dendron/issues/1522)) ([6c30af5](https://github.com/dendronhq/dendron/commit/6c30af5e5b76297334f15a435fd1f9ad09941e06))
* **markdown:** email parsed as user tag & option to disable user tags and hashtags ([#1562](https://github.com/dendronhq/dendron/issues/1562)) ([fd56f7e](https://github.com/dendronhq/dendron/commit/fd56f7ece1651ea6433ebf481f2c54386ab6fb16))
* **markdown:** footnote links move view in publishing & preview ([#1568](https://github.com/dendronhq/dendron/issues/1568)) ([fbe659d](https://github.com/dendronhq/dendron/commit/fbe659d2be3d1f2534d7437d585e9fa38f1684da))
* backward compatibility of id matching adding '_' to id regex match. ([#1504](https://github.com/dendronhq/dendron/issues/1504)) ([4bbae40](https://github.com/dendronhq/dendron/commit/4bbae40d81ea064612f605c6f4e18ae8d34ba0de))


### Features Dendron

* Native workspace enhancements ([#1670](https://github.com/dendronhq/dendron/issues/1670)) ([7a392bb](https://github.com/dendronhq/dendron/commit/7a392bb47c69b562d54fa15479a184f1441e129e))
* **notes:** task notes (create modifier & editor highlighting) ([#1583](https://github.com/dendronhq/dendron/issues/1583)) ([e785efa](https://github.com/dendronhq/dendron/commit/e785efa8e2ce55bc39fb90cf34984d55035dd6ca))
* **schemas:** adding new command - create schema from hierarchy ([#1673](https://github.com/dendronhq/dendron/issues/1673)) ([14732ec](https://github.com/dendronhq/dendron/commit/14732ecbdd42511337ddaaf3fc91bde288c3036d))
* **workspace:** better note previews ([#1666](https://github.com/dendronhq/dendron/issues/1666)) ([5cf7067](https://github.com/dendronhq/dendron/commit/5cf70672a24a62d528440f38b44813bfa627fb88))
* **workspace:** convert vault command ([#1542](https://github.com/dendronhq/dendron/issues/1542)) ([c265e9d](https://github.com/dendronhq/dendron/commit/c265e9d2c238b5a6b3761f4c073140b1a0debe3a))



## 0.62.3 (2021-10-09)


### Bug Fixes

* template doesn't copy FM tags ([#1488](https://github.com/dendronhq/dendron/issues/1488)) ([0317699](https://github.com/dendronhq/dendron/commit/0317699ef9bfd4d77b1d3d05f8093e725ea5b2c3)), closes [#1481](https://github.com/dendronhq/dendron/issues/1481)
* **view:** enable anchor links to work in preview ([#1375](https://github.com/dendronhq/dendron/issues/1375)) ([f27cfb0](https://github.com/dendronhq/dendron/commit/f27cfb07d612e28fd0d6dd08019d772767900bba))
* preview caching invalidation when notes with ![[ref]] links change ([#1385](https://github.com/dendronhq/dendron/issues/1385)) ([efeef86](https://github.com/dendronhq/dendron/commit/efeef8662ec52e64ba33cae9b1196bba6cc82f95))
* **publish:** bad seo props setter ([373d933](https://github.com/dendronhq/dendron/commit/373d9331aba3b3385632f01661dd6c80835ec5ac))


### Features Dendron

* Lapsed user survey ([#1446](https://github.com/dendronhq/dendron/issues/1446)) ([8094d2b](https://github.com/dendronhq/dendron/commit/8094d2bb1972fecf4fde74e8c5644aeba3eec119)), closes [#1349](https://github.com/dendronhq/dendron/issues/1349)
* **publish:** add table of contents ([#1428](https://github.com/dendronhq/dendron/issues/1428)) ([df4b05b](https://github.com/dendronhq/dendron/commit/df4b05ba8526dc32362d6a59543d880f253f02fc))



# 0.61.0 (2021-09-28)


### Bug Fixes

* **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))
* support activation for older vscode version ([#1426](https://github.com/dendronhq/dendron/issues/1426)) ([5a1c7ed](https://github.com/dendronhq/dendron/commit/5a1c7ed9b45df2f00e61229c0776dad41cc29aba))


### Features Dendron

* **workspace:** add survey for new users([#1409](https://github.com/dendronhq/dendron/issues/1409)) ([e2b1754](https://github.com/dendronhq/dendron/commit/e2b17548fbbe3dffef961eb393f82a6a876940e7))



## 0.60.2 (2021-09-25)



## 0.60.2-alpha.0 (2021-09-24)



## 0.60.1 (2021-09-24)


### Bug Fixes

* pesky error popup when schema lookup is closed ([#1389](https://github.com/dendronhq/dendron/issues/1389)) ([4d2bb40](https://github.com/dendronhq/dendron/commit/4d2bb401b17e926dc2eaa11957536f0c75a1e538))
* single letter look up matches ([#1388](https://github.com/dendronhq/dendron/issues/1388)) ([7de9a71](https://github.com/dendronhq/dendron/commit/7de9a7195a02399b1285b51ef08d6853b1f390f6))



# 0.60.0 (2021-09-21)


### Bug Fixes

* **commands:** rename note leaves incorrect metadata if parent is a stub ([#1348](https://github.com/dendronhq/dendron/issues/1348)) ([d432cc9](https://github.com/dendronhq/dendron/commit/d432cc9e20ff8b9f6cefd7cc4c3a42b567ed9bc5))
* **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))
* **workspace:** disable certain decorations for long notes to avoid performance hit ([#1337](https://github.com/dendronhq/dendron/issues/1337)) ([f1c46f9](https://github.com/dendronhq/dendron/commit/f1c46f95c228ada2126ec7212cede3bf5acc773d))
* direct children query ([#1303](https://github.com/dendronhq/dendron/issues/1303)) ([bcf0dea](https://github.com/dendronhq/dendron/commit/bcf0deae422406564cd9a56c1765f90dd2e66215))
* issue with webpack devCLI ([a4ff4c9](https://github.com/dendronhq/dendron/commit/a4ff4c9ae28ff31ab6f9483c339ae78b5144e185))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))
* stop calendar from auto expanding when the last note is closed ([#1299](https://github.com/dendronhq/dendron/issues/1299)) ([9c8f853](https://github.com/dendronhq/dendron/commit/9c8f8533da5027c122e0d003ce4c61dc866735f5))


### Features Dendron

* consolidate dendron configs ([#1295](https://github.com/dendronhq/dendron/issues/1295)) ([177ac92](https://github.com/dendronhq/dendron/commit/177ac925a5442471f041ce5d991da52cecee6c9b))
* nextjs publishing fulltext search ([#1334](https://github.com/dendronhq/dendron/issues/1334)) ([68f8473](https://github.com/dendronhq/dendron/commit/68f8473badf22494c8d0758f8195e377235321f6))
* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* user tags ([#1228](https://github.com/dendronhq/dendron/issues/1228)) ([98c0106](https://github.com/dendronhq/dendron/commit/98c0106367e384c130a927484b9ea294eb6f84fa))



## 0.55.2 (2021-08-21)


### Bug Fixes

* wrong internal links in nextjs publishing ([#1165](https://github.com/dendronhq/dendron/issues/1165)) ([59a949d](https://github.com/dendronhq/dendron/commit/59a949d2b5b541efb283e851060636b108eb5a98))



## 0.55.1 (2021-08-17)


### Bug Fixes

* multiple issues with lookupv3 ([1fdd9eb](https://github.com/dendronhq/dendron/commit/1fdd9eb3242b43539572a1993fefd174640c6d83))
* properly log error stack ([485e220](https://github.com/dendronhq/dendron/commit/485e220f8ffa6cd63210e106e846ff305b920b77))


### Features Dendron

* Insert Note Index command ([#1142](https://github.com/dendronhq/dendron/issues/1142)) ([c140015](https://github.com/dendronhq/dendron/commit/c140015c19a942cf4696d596e818fd89905eea25))
* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* undefined tags breaks note serialization ([b1d784c](https://github.com/dendronhq/dendron/commit/b1d784c8df18b3b45999f01c14793436ff669a3f))


### Features Dendron

* colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
* resolve vim keybinding conflict on initial install ([#1103](https://github.com/dendronhq/dendron/issues/1103)) ([2278c66](https://github.com/dendronhq/dendron/commit/2278c6616c8297cc414ad02d5323bff5c45072e4))
* **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))
* Add SchemaLookupCommand ([#1082](https://github.com/dendronhq/dendron/issues/1082)) ([fe11a0e](https://github.com/dendronhq/dendron/commit/fe11a0ea1e0214823dd01842b941456df164bc70))
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* generate json schema from config ([#1100](https://github.com/dendronhq/dendron/issues/1100)) ([53b189e](https://github.com/dendronhq/dendron/commit/53b189ec973a8d3d3ccf300a0e59908197f4efb1))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.68.2](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.68.2) (2021-11-12)


### Bug Fixes

* replace auto generated ids (coming from inline schemas) with patterns ([#1632](https://github.com/dendronhq/dendron/issues/1632)) ([af28cf6](https://github.com/dendronhq/dendron/commit/af28cf6ef1d085d22069695e9df128477c024d1b))
* **lookup:** hierarchy look up when inside parts of the hierarchy are omitted ([#1522](https://github.com/dendronhq/dendron/issues/1522)) ([6c30af5](https://github.com/dendronhq/dendron/commit/6c30af5e5b76297334f15a435fd1f9ad09941e06))
* **markdown:** email parsed as user tag & option to disable user tags and hashtags ([#1562](https://github.com/dendronhq/dendron/issues/1562)) ([fd56f7e](https://github.com/dendronhq/dendron/commit/fd56f7ece1651ea6433ebf481f2c54386ab6fb16))
* **markdown:** footnote links move view in publishing & preview ([#1568](https://github.com/dendronhq/dendron/issues/1568)) ([fbe659d](https://github.com/dendronhq/dendron/commit/fbe659d2be3d1f2534d7437d585e9fa38f1684da))
* backward compatibility of id matching adding '_' to id regex match. ([#1504](https://github.com/dendronhq/dendron/issues/1504)) ([4bbae40](https://github.com/dendronhq/dendron/commit/4bbae40d81ea064612f605c6f4e18ae8d34ba0de))


### Features Dendron

* Native workspace enhancements ([#1670](https://github.com/dendronhq/dendron/issues/1670)) ([7a392bb](https://github.com/dendronhq/dendron/commit/7a392bb47c69b562d54fa15479a184f1441e129e))
* **notes:** task notes (create modifier & editor highlighting) ([#1583](https://github.com/dendronhq/dendron/issues/1583)) ([e785efa](https://github.com/dendronhq/dendron/commit/e785efa8e2ce55bc39fb90cf34984d55035dd6ca))
* **schemas:** adding new command - create schema from hierarchy ([#1673](https://github.com/dendronhq/dendron/issues/1673)) ([14732ec](https://github.com/dendronhq/dendron/commit/14732ecbdd42511337ddaaf3fc91bde288c3036d))
* **workspace:** better note previews ([#1666](https://github.com/dendronhq/dendron/issues/1666)) ([5cf7067](https://github.com/dendronhq/dendron/commit/5cf70672a24a62d528440f38b44813bfa627fb88))
* **workspace:** convert vault command ([#1542](https://github.com/dendronhq/dendron/issues/1542)) ([c265e9d](https://github.com/dendronhq/dendron/commit/c265e9d2c238b5a6b3761f4c073140b1a0debe3a))



## 0.62.3 (2021-10-09)


### Bug Fixes

* template doesn't copy FM tags ([#1488](https://github.com/dendronhq/dendron/issues/1488)) ([0317699](https://github.com/dendronhq/dendron/commit/0317699ef9bfd4d77b1d3d05f8093e725ea5b2c3)), closes [#1481](https://github.com/dendronhq/dendron/issues/1481)
* **view:** enable anchor links to work in preview ([#1375](https://github.com/dendronhq/dendron/issues/1375)) ([f27cfb0](https://github.com/dendronhq/dendron/commit/f27cfb07d612e28fd0d6dd08019d772767900bba))
* preview caching invalidation when notes with ![[ref]] links change ([#1385](https://github.com/dendronhq/dendron/issues/1385)) ([efeef86](https://github.com/dendronhq/dendron/commit/efeef8662ec52e64ba33cae9b1196bba6cc82f95))
* **publish:** bad seo props setter ([373d933](https://github.com/dendronhq/dendron/commit/373d9331aba3b3385632f01661dd6c80835ec5ac))


### Features Dendron

* Lapsed user survey ([#1446](https://github.com/dendronhq/dendron/issues/1446)) ([8094d2b](https://github.com/dendronhq/dendron/commit/8094d2bb1972fecf4fde74e8c5644aeba3eec119)), closes [#1349](https://github.com/dendronhq/dendron/issues/1349)
* **publish:** add table of contents ([#1428](https://github.com/dendronhq/dendron/issues/1428)) ([df4b05b](https://github.com/dendronhq/dendron/commit/df4b05ba8526dc32362d6a59543d880f253f02fc))



# 0.61.0 (2021-09-28)


### Bug Fixes

* **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))
* support activation for older vscode version ([#1426](https://github.com/dendronhq/dendron/issues/1426)) ([5a1c7ed](https://github.com/dendronhq/dendron/commit/5a1c7ed9b45df2f00e61229c0776dad41cc29aba))


### Features Dendron

* **workspace:** add survey for new users([#1409](https://github.com/dendronhq/dendron/issues/1409)) ([e2b1754](https://github.com/dendronhq/dendron/commit/e2b17548fbbe3dffef961eb393f82a6a876940e7))



## 0.60.2 (2021-09-25)



## 0.60.2-alpha.0 (2021-09-24)



## 0.60.1 (2021-09-24)


### Bug Fixes

* pesky error popup when schema lookup is closed ([#1389](https://github.com/dendronhq/dendron/issues/1389)) ([4d2bb40](https://github.com/dendronhq/dendron/commit/4d2bb401b17e926dc2eaa11957536f0c75a1e538))
* single letter look up matches ([#1388](https://github.com/dendronhq/dendron/issues/1388)) ([7de9a71](https://github.com/dendronhq/dendron/commit/7de9a7195a02399b1285b51ef08d6853b1f390f6))



# 0.60.0 (2021-09-21)


### Bug Fixes

* **commands:** rename note leaves incorrect metadata if parent is a stub ([#1348](https://github.com/dendronhq/dendron/issues/1348)) ([d432cc9](https://github.com/dendronhq/dendron/commit/d432cc9e20ff8b9f6cefd7cc4c3a42b567ed9bc5))
* **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))
* **workspace:** disable certain decorations for long notes to avoid performance hit ([#1337](https://github.com/dendronhq/dendron/issues/1337)) ([f1c46f9](https://github.com/dendronhq/dendron/commit/f1c46f95c228ada2126ec7212cede3bf5acc773d))
* direct children query ([#1303](https://github.com/dendronhq/dendron/issues/1303)) ([bcf0dea](https://github.com/dendronhq/dendron/commit/bcf0deae422406564cd9a56c1765f90dd2e66215))
* issue with webpack devCLI ([a4ff4c9](https://github.com/dendronhq/dendron/commit/a4ff4c9ae28ff31ab6f9483c339ae78b5144e185))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))
* stop calendar from auto expanding when the last note is closed ([#1299](https://github.com/dendronhq/dendron/issues/1299)) ([9c8f853](https://github.com/dendronhq/dendron/commit/9c8f8533da5027c122e0d003ce4c61dc866735f5))


### Features Dendron

* consolidate dendron configs ([#1295](https://github.com/dendronhq/dendron/issues/1295)) ([177ac92](https://github.com/dendronhq/dendron/commit/177ac925a5442471f041ce5d991da52cecee6c9b))
* nextjs publishing fulltext search ([#1334](https://github.com/dendronhq/dendron/issues/1334)) ([68f8473](https://github.com/dendronhq/dendron/commit/68f8473badf22494c8d0758f8195e377235321f6))
* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* user tags ([#1228](https://github.com/dendronhq/dendron/issues/1228)) ([98c0106](https://github.com/dendronhq/dendron/commit/98c0106367e384c130a927484b9ea294eb6f84fa))



## 0.55.2 (2021-08-21)


### Bug Fixes

* wrong internal links in nextjs publishing ([#1165](https://github.com/dendronhq/dendron/issues/1165)) ([59a949d](https://github.com/dendronhq/dendron/commit/59a949d2b5b541efb283e851060636b108eb5a98))



## 0.55.1 (2021-08-17)


### Bug Fixes

* multiple issues with lookupv3 ([1fdd9eb](https://github.com/dendronhq/dendron/commit/1fdd9eb3242b43539572a1993fefd174640c6d83))
* properly log error stack ([485e220](https://github.com/dendronhq/dendron/commit/485e220f8ffa6cd63210e106e846ff305b920b77))


### Features Dendron

* Insert Note Index command ([#1142](https://github.com/dendronhq/dendron/issues/1142)) ([c140015](https://github.com/dendronhq/dendron/commit/c140015c19a942cf4696d596e818fd89905eea25))
* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* undefined tags breaks note serialization ([b1d784c](https://github.com/dendronhq/dendron/commit/b1d784c8df18b3b45999f01c14793436ff669a3f))


### Features Dendron

* colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
* resolve vim keybinding conflict on initial install ([#1103](https://github.com/dendronhq/dendron/issues/1103)) ([2278c66](https://github.com/dendronhq/dendron/commit/2278c6616c8297cc414ad02d5323bff5c45072e4))
* **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))
* Add SchemaLookupCommand ([#1082](https://github.com/dendronhq/dendron/issues/1082)) ([fe11a0e](https://github.com/dendronhq/dendron/commit/fe11a0ea1e0214823dd01842b941456df164bc70))
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* generate json schema from config ([#1100](https://github.com/dendronhq/dendron/issues/1100)) ([53b189e](https://github.com/dendronhq/dendron/commit/53b189ec973a8d3d3ccf300a0e59908197f4efb1))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.68.1](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.68.1) (2021-11-10)


### Bug Fixes

* replace auto generated ids (coming from inline schemas) with patterns ([#1632](https://github.com/dendronhq/dendron/issues/1632)) ([af28cf6](https://github.com/dendronhq/dendron/commit/af28cf6ef1d085d22069695e9df128477c024d1b))
* **lookup:** hierarchy look up when inside parts of the hierarchy are omitted ([#1522](https://github.com/dendronhq/dendron/issues/1522)) ([6c30af5](https://github.com/dendronhq/dendron/commit/6c30af5e5b76297334f15a435fd1f9ad09941e06))
* **markdown:** email parsed as user tag & option to disable user tags and hashtags ([#1562](https://github.com/dendronhq/dendron/issues/1562)) ([fd56f7e](https://github.com/dendronhq/dendron/commit/fd56f7ece1651ea6433ebf481f2c54386ab6fb16))
* **markdown:** footnote links move view in publishing & preview ([#1568](https://github.com/dendronhq/dendron/issues/1568)) ([fbe659d](https://github.com/dendronhq/dendron/commit/fbe659d2be3d1f2534d7437d585e9fa38f1684da))
* backward compatibility of id matching adding '_' to id regex match. ([#1504](https://github.com/dendronhq/dendron/issues/1504)) ([4bbae40](https://github.com/dendronhq/dendron/commit/4bbae40d81ea064612f605c6f4e18ae8d34ba0de))


### Features Dendron

* **notes:** task notes (create modifier & editor highlighting) ([#1583](https://github.com/dendronhq/dendron/issues/1583)) ([e785efa](https://github.com/dendronhq/dendron/commit/e785efa8e2ce55bc39fb90cf34984d55035dd6ca))
* **schemas:** adding new command - create schema from hierarchy ([#1673](https://github.com/dendronhq/dendron/issues/1673)) ([14732ec](https://github.com/dendronhq/dendron/commit/14732ecbdd42511337ddaaf3fc91bde288c3036d))
* **workspace:** better note previews ([#1666](https://github.com/dendronhq/dendron/issues/1666)) ([5cf7067](https://github.com/dendronhq/dendron/commit/5cf70672a24a62d528440f38b44813bfa627fb88))
* **workspace:** convert vault command ([#1542](https://github.com/dendronhq/dendron/issues/1542)) ([c265e9d](https://github.com/dendronhq/dendron/commit/c265e9d2c238b5a6b3761f4c073140b1a0debe3a))



## 0.62.3 (2021-10-09)


### Bug Fixes

* template doesn't copy FM tags ([#1488](https://github.com/dendronhq/dendron/issues/1488)) ([0317699](https://github.com/dendronhq/dendron/commit/0317699ef9bfd4d77b1d3d05f8093e725ea5b2c3)), closes [#1481](https://github.com/dendronhq/dendron/issues/1481)
* **view:** enable anchor links to work in preview ([#1375](https://github.com/dendronhq/dendron/issues/1375)) ([f27cfb0](https://github.com/dendronhq/dendron/commit/f27cfb07d612e28fd0d6dd08019d772767900bba))
* preview caching invalidation when notes with ![[ref]] links change ([#1385](https://github.com/dendronhq/dendron/issues/1385)) ([efeef86](https://github.com/dendronhq/dendron/commit/efeef8662ec52e64ba33cae9b1196bba6cc82f95))
* **publish:** bad seo props setter ([373d933](https://github.com/dendronhq/dendron/commit/373d9331aba3b3385632f01661dd6c80835ec5ac))


### Features Dendron

* Lapsed user survey ([#1446](https://github.com/dendronhq/dendron/issues/1446)) ([8094d2b](https://github.com/dendronhq/dendron/commit/8094d2bb1972fecf4fde74e8c5644aeba3eec119)), closes [#1349](https://github.com/dendronhq/dendron/issues/1349)
* **publish:** add table of contents ([#1428](https://github.com/dendronhq/dendron/issues/1428)) ([df4b05b](https://github.com/dendronhq/dendron/commit/df4b05ba8526dc32362d6a59543d880f253f02fc))



# 0.61.0 (2021-09-28)


### Bug Fixes

* **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))
* support activation for older vscode version ([#1426](https://github.com/dendronhq/dendron/issues/1426)) ([5a1c7ed](https://github.com/dendronhq/dendron/commit/5a1c7ed9b45df2f00e61229c0776dad41cc29aba))


### Features Dendron

* **workspace:** add survey for new users([#1409](https://github.com/dendronhq/dendron/issues/1409)) ([e2b1754](https://github.com/dendronhq/dendron/commit/e2b17548fbbe3dffef961eb393f82a6a876940e7))



## 0.60.2 (2021-09-25)



## 0.60.2-alpha.0 (2021-09-24)



## 0.60.1 (2021-09-24)


### Bug Fixes

* pesky error popup when schema lookup is closed ([#1389](https://github.com/dendronhq/dendron/issues/1389)) ([4d2bb40](https://github.com/dendronhq/dendron/commit/4d2bb401b17e926dc2eaa11957536f0c75a1e538))
* single letter look up matches ([#1388](https://github.com/dendronhq/dendron/issues/1388)) ([7de9a71](https://github.com/dendronhq/dendron/commit/7de9a7195a02399b1285b51ef08d6853b1f390f6))



# 0.60.0 (2021-09-21)


### Bug Fixes

* **commands:** rename note leaves incorrect metadata if parent is a stub ([#1348](https://github.com/dendronhq/dendron/issues/1348)) ([d432cc9](https://github.com/dendronhq/dendron/commit/d432cc9e20ff8b9f6cefd7cc4c3a42b567ed9bc5))
* **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))
* **workspace:** disable certain decorations for long notes to avoid performance hit ([#1337](https://github.com/dendronhq/dendron/issues/1337)) ([f1c46f9](https://github.com/dendronhq/dendron/commit/f1c46f95c228ada2126ec7212cede3bf5acc773d))
* direct children query ([#1303](https://github.com/dendronhq/dendron/issues/1303)) ([bcf0dea](https://github.com/dendronhq/dendron/commit/bcf0deae422406564cd9a56c1765f90dd2e66215))
* issue with webpack devCLI ([a4ff4c9](https://github.com/dendronhq/dendron/commit/a4ff4c9ae28ff31ab6f9483c339ae78b5144e185))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))
* stop calendar from auto expanding when the last note is closed ([#1299](https://github.com/dendronhq/dendron/issues/1299)) ([9c8f853](https://github.com/dendronhq/dendron/commit/9c8f8533da5027c122e0d003ce4c61dc866735f5))


### Features Dendron

* consolidate dendron configs ([#1295](https://github.com/dendronhq/dendron/issues/1295)) ([177ac92](https://github.com/dendronhq/dendron/commit/177ac925a5442471f041ce5d991da52cecee6c9b))
* nextjs publishing fulltext search ([#1334](https://github.com/dendronhq/dendron/issues/1334)) ([68f8473](https://github.com/dendronhq/dendron/commit/68f8473badf22494c8d0758f8195e377235321f6))
* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* user tags ([#1228](https://github.com/dendronhq/dendron/issues/1228)) ([98c0106](https://github.com/dendronhq/dendron/commit/98c0106367e384c130a927484b9ea294eb6f84fa))



## 0.55.2 (2021-08-21)


### Bug Fixes

* wrong internal links in nextjs publishing ([#1165](https://github.com/dendronhq/dendron/issues/1165)) ([59a949d](https://github.com/dendronhq/dendron/commit/59a949d2b5b541efb283e851060636b108eb5a98))



## 0.55.1 (2021-08-17)


### Bug Fixes

* multiple issues with lookupv3 ([1fdd9eb](https://github.com/dendronhq/dendron/commit/1fdd9eb3242b43539572a1993fefd174640c6d83))
* properly log error stack ([485e220](https://github.com/dendronhq/dendron/commit/485e220f8ffa6cd63210e106e846ff305b920b77))


### Features Dendron

* Insert Note Index command ([#1142](https://github.com/dendronhq/dendron/issues/1142)) ([c140015](https://github.com/dendronhq/dendron/commit/c140015c19a942cf4696d596e818fd89905eea25))
* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* undefined tags breaks note serialization ([b1d784c](https://github.com/dendronhq/dendron/commit/b1d784c8df18b3b45999f01c14793436ff669a3f))


### Features Dendron

* colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
* resolve vim keybinding conflict on initial install ([#1103](https://github.com/dendronhq/dendron/issues/1103)) ([2278c66](https://github.com/dendronhq/dendron/commit/2278c6616c8297cc414ad02d5323bff5c45072e4))
* **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))
* Add SchemaLookupCommand ([#1082](https://github.com/dendronhq/dendron/issues/1082)) ([fe11a0e](https://github.com/dendronhq/dendron/commit/fe11a0ea1e0214823dd01842b941456df164bc70))
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* generate json schema from config ([#1100](https://github.com/dendronhq/dendron/issues/1100)) ([53b189e](https://github.com/dendronhq/dendron/commit/53b189ec973a8d3d3ccf300a0e59908197f4efb1))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





# [0.68.0](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.68.0) (2021-11-09)


### Bug Fixes

* replace auto generated ids (coming from inline schemas) with patterns ([#1632](https://github.com/dendronhq/dendron/issues/1632)) ([af28cf6](https://github.com/dendronhq/dendron/commit/af28cf6ef1d085d22069695e9df128477c024d1b))
* **lookup:** hierarchy look up when inside parts of the hierarchy are omitted ([#1522](https://github.com/dendronhq/dendron/issues/1522)) ([6c30af5](https://github.com/dendronhq/dendron/commit/6c30af5e5b76297334f15a435fd1f9ad09941e06))
* **markdown:** email parsed as user tag & option to disable user tags and hashtags ([#1562](https://github.com/dendronhq/dendron/issues/1562)) ([fd56f7e](https://github.com/dendronhq/dendron/commit/fd56f7ece1651ea6433ebf481f2c54386ab6fb16))
* **markdown:** footnote links move view in publishing & preview ([#1568](https://github.com/dendronhq/dendron/issues/1568)) ([fbe659d](https://github.com/dendronhq/dendron/commit/fbe659d2be3d1f2534d7437d585e9fa38f1684da))
* backward compatibility of id matching adding '_' to id regex match. ([#1504](https://github.com/dendronhq/dendron/issues/1504)) ([4bbae40](https://github.com/dendronhq/dendron/commit/4bbae40d81ea064612f605c6f4e18ae8d34ba0de))


### Features Dendron

* **notes:** task notes (create modifier & editor highlighting) ([#1583](https://github.com/dendronhq/dendron/issues/1583)) ([e785efa](https://github.com/dendronhq/dendron/commit/e785efa8e2ce55bc39fb90cf34984d55035dd6ca))
* **schemas:** adding new command - create schema from hierarchy ([#1673](https://github.com/dendronhq/dendron/issues/1673)) ([14732ec](https://github.com/dendronhq/dendron/commit/14732ecbdd42511337ddaaf3fc91bde288c3036d))
* **workspace:** better note previews ([#1666](https://github.com/dendronhq/dendron/issues/1666)) ([5cf7067](https://github.com/dendronhq/dendron/commit/5cf70672a24a62d528440f38b44813bfa627fb88))
* **workspace:** convert vault command ([#1542](https://github.com/dendronhq/dendron/issues/1542)) ([c265e9d](https://github.com/dendronhq/dendron/commit/c265e9d2c238b5a6b3761f4c073140b1a0debe3a))



## 0.62.3 (2021-10-09)


### Bug Fixes

* template doesn't copy FM tags ([#1488](https://github.com/dendronhq/dendron/issues/1488)) ([0317699](https://github.com/dendronhq/dendron/commit/0317699ef9bfd4d77b1d3d05f8093e725ea5b2c3)), closes [#1481](https://github.com/dendronhq/dendron/issues/1481)
* **view:** enable anchor links to work in preview ([#1375](https://github.com/dendronhq/dendron/issues/1375)) ([f27cfb0](https://github.com/dendronhq/dendron/commit/f27cfb07d612e28fd0d6dd08019d772767900bba))
* preview caching invalidation when notes with ![[ref]] links change ([#1385](https://github.com/dendronhq/dendron/issues/1385)) ([efeef86](https://github.com/dendronhq/dendron/commit/efeef8662ec52e64ba33cae9b1196bba6cc82f95))
* **publish:** bad seo props setter ([373d933](https://github.com/dendronhq/dendron/commit/373d9331aba3b3385632f01661dd6c80835ec5ac))


### Features Dendron

* Lapsed user survey ([#1446](https://github.com/dendronhq/dendron/issues/1446)) ([8094d2b](https://github.com/dendronhq/dendron/commit/8094d2bb1972fecf4fde74e8c5644aeba3eec119)), closes [#1349](https://github.com/dendronhq/dendron/issues/1349)
* **publish:** add table of contents ([#1428](https://github.com/dendronhq/dendron/issues/1428)) ([df4b05b](https://github.com/dendronhq/dendron/commit/df4b05ba8526dc32362d6a59543d880f253f02fc))



# 0.61.0 (2021-09-28)


### Bug Fixes

* **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))
* support activation for older vscode version ([#1426](https://github.com/dendronhq/dendron/issues/1426)) ([5a1c7ed](https://github.com/dendronhq/dendron/commit/5a1c7ed9b45df2f00e61229c0776dad41cc29aba))


### Features Dendron

* **workspace:** add survey for new users([#1409](https://github.com/dendronhq/dendron/issues/1409)) ([e2b1754](https://github.com/dendronhq/dendron/commit/e2b17548fbbe3dffef961eb393f82a6a876940e7))



## 0.60.2 (2021-09-25)



## 0.60.2-alpha.0 (2021-09-24)



## 0.60.1 (2021-09-24)


### Bug Fixes

* pesky error popup when schema lookup is closed ([#1389](https://github.com/dendronhq/dendron/issues/1389)) ([4d2bb40](https://github.com/dendronhq/dendron/commit/4d2bb401b17e926dc2eaa11957536f0c75a1e538))
* single letter look up matches ([#1388](https://github.com/dendronhq/dendron/issues/1388)) ([7de9a71](https://github.com/dendronhq/dendron/commit/7de9a7195a02399b1285b51ef08d6853b1f390f6))



# 0.60.0 (2021-09-21)


### Bug Fixes

* **commands:** rename note leaves incorrect metadata if parent is a stub ([#1348](https://github.com/dendronhq/dendron/issues/1348)) ([d432cc9](https://github.com/dendronhq/dendron/commit/d432cc9e20ff8b9f6cefd7cc4c3a42b567ed9bc5))
* **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))
* **workspace:** disable certain decorations for long notes to avoid performance hit ([#1337](https://github.com/dendronhq/dendron/issues/1337)) ([f1c46f9](https://github.com/dendronhq/dendron/commit/f1c46f95c228ada2126ec7212cede3bf5acc773d))
* direct children query ([#1303](https://github.com/dendronhq/dendron/issues/1303)) ([bcf0dea](https://github.com/dendronhq/dendron/commit/bcf0deae422406564cd9a56c1765f90dd2e66215))
* issue with webpack devCLI ([a4ff4c9](https://github.com/dendronhq/dendron/commit/a4ff4c9ae28ff31ab6f9483c339ae78b5144e185))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))
* stop calendar from auto expanding when the last note is closed ([#1299](https://github.com/dendronhq/dendron/issues/1299)) ([9c8f853](https://github.com/dendronhq/dendron/commit/9c8f8533da5027c122e0d003ce4c61dc866735f5))


### Features Dendron

* consolidate dendron configs ([#1295](https://github.com/dendronhq/dendron/issues/1295)) ([177ac92](https://github.com/dendronhq/dendron/commit/177ac925a5442471f041ce5d991da52cecee6c9b))
* nextjs publishing fulltext search ([#1334](https://github.com/dendronhq/dendron/issues/1334)) ([68f8473](https://github.com/dendronhq/dendron/commit/68f8473badf22494c8d0758f8195e377235321f6))
* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* user tags ([#1228](https://github.com/dendronhq/dendron/issues/1228)) ([98c0106](https://github.com/dendronhq/dendron/commit/98c0106367e384c130a927484b9ea294eb6f84fa))



## 0.55.2 (2021-08-21)


### Bug Fixes

* wrong internal links in nextjs publishing ([#1165](https://github.com/dendronhq/dendron/issues/1165)) ([59a949d](https://github.com/dendronhq/dendron/commit/59a949d2b5b541efb283e851060636b108eb5a98))



## 0.55.1 (2021-08-17)


### Bug Fixes

* multiple issues with lookupv3 ([1fdd9eb](https://github.com/dendronhq/dendron/commit/1fdd9eb3242b43539572a1993fefd174640c6d83))
* properly log error stack ([485e220](https://github.com/dendronhq/dendron/commit/485e220f8ffa6cd63210e106e846ff305b920b77))


### Features Dendron

* Insert Note Index command ([#1142](https://github.com/dendronhq/dendron/issues/1142)) ([c140015](https://github.com/dendronhq/dendron/commit/c140015c19a942cf4696d596e818fd89905eea25))
* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* undefined tags breaks note serialization ([b1d784c](https://github.com/dendronhq/dendron/commit/b1d784c8df18b3b45999f01c14793436ff669a3f))


### Features Dendron

* colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
* resolve vim keybinding conflict on initial install ([#1103](https://github.com/dendronhq/dendron/issues/1103)) ([2278c66](https://github.com/dendronhq/dendron/commit/2278c6616c8297cc414ad02d5323bff5c45072e4))
* **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))
* Add SchemaLookupCommand ([#1082](https://github.com/dendronhq/dendron/issues/1082)) ([fe11a0e](https://github.com/dendronhq/dendron/commit/fe11a0ea1e0214823dd01842b941456df164bc70))
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* generate json schema from config ([#1100](https://github.com/dendronhq/dendron/issues/1100)) ([53b189e](https://github.com/dendronhq/dendron/commit/53b189ec973a8d3d3ccf300a0e59908197f4efb1))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.67.3-alpha.3](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.67.3-alpha.3) (2021-11-09)


### Bug Fixes

* replace auto generated ids (coming from inline schemas) with patterns ([#1632](https://github.com/dendronhq/dendron/issues/1632)) ([af28cf6](https://github.com/dendronhq/dendron/commit/af28cf6ef1d085d22069695e9df128477c024d1b))
* **lookup:** hierarchy look up when inside parts of the hierarchy are omitted ([#1522](https://github.com/dendronhq/dendron/issues/1522)) ([6c30af5](https://github.com/dendronhq/dendron/commit/6c30af5e5b76297334f15a435fd1f9ad09941e06))
* **markdown:** email parsed as user tag & option to disable user tags and hashtags ([#1562](https://github.com/dendronhq/dendron/issues/1562)) ([fd56f7e](https://github.com/dendronhq/dendron/commit/fd56f7ece1651ea6433ebf481f2c54386ab6fb16))
* **markdown:** footnote links move view in publishing & preview ([#1568](https://github.com/dendronhq/dendron/issues/1568)) ([fbe659d](https://github.com/dendronhq/dendron/commit/fbe659d2be3d1f2534d7437d585e9fa38f1684da))
* backward compatibility of id matching adding '_' to id regex match. ([#1504](https://github.com/dendronhq/dendron/issues/1504)) ([4bbae40](https://github.com/dendronhq/dendron/commit/4bbae40d81ea064612f605c6f4e18ae8d34ba0de))


### Features Dendron

* **notes:** task notes (create modifier & editor highlighting) ([#1583](https://github.com/dendronhq/dendron/issues/1583)) ([e785efa](https://github.com/dendronhq/dendron/commit/e785efa8e2ce55bc39fb90cf34984d55035dd6ca))
* **workspace:** convert vault command ([#1542](https://github.com/dendronhq/dendron/issues/1542)) ([c265e9d](https://github.com/dendronhq/dendron/commit/c265e9d2c238b5a6b3761f4c073140b1a0debe3a))



## 0.62.3 (2021-10-09)


### Bug Fixes

* template doesn't copy FM tags ([#1488](https://github.com/dendronhq/dendron/issues/1488)) ([0317699](https://github.com/dendronhq/dendron/commit/0317699ef9bfd4d77b1d3d05f8093e725ea5b2c3)), closes [#1481](https://github.com/dendronhq/dendron/issues/1481)
* **view:** enable anchor links to work in preview ([#1375](https://github.com/dendronhq/dendron/issues/1375)) ([f27cfb0](https://github.com/dendronhq/dendron/commit/f27cfb07d612e28fd0d6dd08019d772767900bba))
* preview caching invalidation when notes with ![[ref]] links change ([#1385](https://github.com/dendronhq/dendron/issues/1385)) ([efeef86](https://github.com/dendronhq/dendron/commit/efeef8662ec52e64ba33cae9b1196bba6cc82f95))
* **publish:** bad seo props setter ([373d933](https://github.com/dendronhq/dendron/commit/373d9331aba3b3385632f01661dd6c80835ec5ac))


### Features Dendron

* Lapsed user survey ([#1446](https://github.com/dendronhq/dendron/issues/1446)) ([8094d2b](https://github.com/dendronhq/dendron/commit/8094d2bb1972fecf4fde74e8c5644aeba3eec119)), closes [#1349](https://github.com/dendronhq/dendron/issues/1349)
* **publish:** add table of contents ([#1428](https://github.com/dendronhq/dendron/issues/1428)) ([df4b05b](https://github.com/dendronhq/dendron/commit/df4b05ba8526dc32362d6a59543d880f253f02fc))



# 0.61.0 (2021-09-28)


### Bug Fixes

* **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))
* support activation for older vscode version ([#1426](https://github.com/dendronhq/dendron/issues/1426)) ([5a1c7ed](https://github.com/dendronhq/dendron/commit/5a1c7ed9b45df2f00e61229c0776dad41cc29aba))


### Features Dendron

* **workspace:** add survey for new users([#1409](https://github.com/dendronhq/dendron/issues/1409)) ([e2b1754](https://github.com/dendronhq/dendron/commit/e2b17548fbbe3dffef961eb393f82a6a876940e7))



## 0.60.2 (2021-09-25)



## 0.60.2-alpha.0 (2021-09-24)



## 0.60.1 (2021-09-24)


### Bug Fixes

* pesky error popup when schema lookup is closed ([#1389](https://github.com/dendronhq/dendron/issues/1389)) ([4d2bb40](https://github.com/dendronhq/dendron/commit/4d2bb401b17e926dc2eaa11957536f0c75a1e538))
* single letter look up matches ([#1388](https://github.com/dendronhq/dendron/issues/1388)) ([7de9a71](https://github.com/dendronhq/dendron/commit/7de9a7195a02399b1285b51ef08d6853b1f390f6))



# 0.60.0 (2021-09-21)


### Bug Fixes

* **commands:** rename note leaves incorrect metadata if parent is a stub ([#1348](https://github.com/dendronhq/dendron/issues/1348)) ([d432cc9](https://github.com/dendronhq/dendron/commit/d432cc9e20ff8b9f6cefd7cc4c3a42b567ed9bc5))
* **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))
* **workspace:** disable certain decorations for long notes to avoid performance hit ([#1337](https://github.com/dendronhq/dendron/issues/1337)) ([f1c46f9](https://github.com/dendronhq/dendron/commit/f1c46f95c228ada2126ec7212cede3bf5acc773d))
* direct children query ([#1303](https://github.com/dendronhq/dendron/issues/1303)) ([bcf0dea](https://github.com/dendronhq/dendron/commit/bcf0deae422406564cd9a56c1765f90dd2e66215))
* issue with webpack devCLI ([a4ff4c9](https://github.com/dendronhq/dendron/commit/a4ff4c9ae28ff31ab6f9483c339ae78b5144e185))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))
* stop calendar from auto expanding when the last note is closed ([#1299](https://github.com/dendronhq/dendron/issues/1299)) ([9c8f853](https://github.com/dendronhq/dendron/commit/9c8f8533da5027c122e0d003ce4c61dc866735f5))


### Features Dendron

* consolidate dendron configs ([#1295](https://github.com/dendronhq/dendron/issues/1295)) ([177ac92](https://github.com/dendronhq/dendron/commit/177ac925a5442471f041ce5d991da52cecee6c9b))
* nextjs publishing fulltext search ([#1334](https://github.com/dendronhq/dendron/issues/1334)) ([68f8473](https://github.com/dendronhq/dendron/commit/68f8473badf22494c8d0758f8195e377235321f6))
* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* user tags ([#1228](https://github.com/dendronhq/dendron/issues/1228)) ([98c0106](https://github.com/dendronhq/dendron/commit/98c0106367e384c130a927484b9ea294eb6f84fa))



## 0.55.2 (2021-08-21)


### Bug Fixes

* wrong internal links in nextjs publishing ([#1165](https://github.com/dendronhq/dendron/issues/1165)) ([59a949d](https://github.com/dendronhq/dendron/commit/59a949d2b5b541efb283e851060636b108eb5a98))



## 0.55.1 (2021-08-17)


### Bug Fixes

* multiple issues with lookupv3 ([1fdd9eb](https://github.com/dendronhq/dendron/commit/1fdd9eb3242b43539572a1993fefd174640c6d83))
* properly log error stack ([485e220](https://github.com/dendronhq/dendron/commit/485e220f8ffa6cd63210e106e846ff305b920b77))


### Features Dendron

* Insert Note Index command ([#1142](https://github.com/dendronhq/dendron/issues/1142)) ([c140015](https://github.com/dendronhq/dendron/commit/c140015c19a942cf4696d596e818fd89905eea25))
* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* undefined tags breaks note serialization ([b1d784c](https://github.com/dendronhq/dendron/commit/b1d784c8df18b3b45999f01c14793436ff669a3f))


### Features Dendron

* colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
* resolve vim keybinding conflict on initial install ([#1103](https://github.com/dendronhq/dendron/issues/1103)) ([2278c66](https://github.com/dendronhq/dendron/commit/2278c6616c8297cc414ad02d5323bff5c45072e4))
* **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))
* Add SchemaLookupCommand ([#1082](https://github.com/dendronhq/dendron/issues/1082)) ([fe11a0e](https://github.com/dendronhq/dendron/commit/fe11a0ea1e0214823dd01842b941456df164bc70))
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* generate json schema from config ([#1100](https://github.com/dendronhq/dendron/issues/1100)) ([53b189e](https://github.com/dendronhq/dendron/commit/53b189ec973a8d3d3ccf300a0e59908197f4efb1))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.67.3-alpha.2](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.67.3-alpha.2) (2021-11-08)


### Bug Fixes

* replace auto generated ids (coming from inline schemas) with patterns ([#1632](https://github.com/dendronhq/dendron/issues/1632)) ([af28cf6](https://github.com/dendronhq/dendron/commit/af28cf6ef1d085d22069695e9df128477c024d1b))
* **lookup:** hierarchy look up when inside parts of the hierarchy are omitted ([#1522](https://github.com/dendronhq/dendron/issues/1522)) ([6c30af5](https://github.com/dendronhq/dendron/commit/6c30af5e5b76297334f15a435fd1f9ad09941e06))
* **markdown:** email parsed as user tag & option to disable user tags and hashtags ([#1562](https://github.com/dendronhq/dendron/issues/1562)) ([fd56f7e](https://github.com/dendronhq/dendron/commit/fd56f7ece1651ea6433ebf481f2c54386ab6fb16))
* **markdown:** footnote links move view in publishing & preview ([#1568](https://github.com/dendronhq/dendron/issues/1568)) ([fbe659d](https://github.com/dendronhq/dendron/commit/fbe659d2be3d1f2534d7437d585e9fa38f1684da))
* backward compatibility of id matching adding '_' to id regex match. ([#1504](https://github.com/dendronhq/dendron/issues/1504)) ([4bbae40](https://github.com/dendronhq/dendron/commit/4bbae40d81ea064612f605c6f4e18ae8d34ba0de))


### Features Dendron

* **notes:** task notes (create modifier & editor highlighting) ([#1583](https://github.com/dendronhq/dendron/issues/1583)) ([e785efa](https://github.com/dendronhq/dendron/commit/e785efa8e2ce55bc39fb90cf34984d55035dd6ca))
* **workspace:** convert vault command ([#1542](https://github.com/dendronhq/dendron/issues/1542)) ([c265e9d](https://github.com/dendronhq/dendron/commit/c265e9d2c238b5a6b3761f4c073140b1a0debe3a))



## 0.62.3 (2021-10-09)


### Bug Fixes

* template doesn't copy FM tags ([#1488](https://github.com/dendronhq/dendron/issues/1488)) ([0317699](https://github.com/dendronhq/dendron/commit/0317699ef9bfd4d77b1d3d05f8093e725ea5b2c3)), closes [#1481](https://github.com/dendronhq/dendron/issues/1481)
* **view:** enable anchor links to work in preview ([#1375](https://github.com/dendronhq/dendron/issues/1375)) ([f27cfb0](https://github.com/dendronhq/dendron/commit/f27cfb07d612e28fd0d6dd08019d772767900bba))
* preview caching invalidation when notes with ![[ref]] links change ([#1385](https://github.com/dendronhq/dendron/issues/1385)) ([efeef86](https://github.com/dendronhq/dendron/commit/efeef8662ec52e64ba33cae9b1196bba6cc82f95))
* **publish:** bad seo props setter ([373d933](https://github.com/dendronhq/dendron/commit/373d9331aba3b3385632f01661dd6c80835ec5ac))


### Features Dendron

* Lapsed user survey ([#1446](https://github.com/dendronhq/dendron/issues/1446)) ([8094d2b](https://github.com/dendronhq/dendron/commit/8094d2bb1972fecf4fde74e8c5644aeba3eec119)), closes [#1349](https://github.com/dendronhq/dendron/issues/1349)
* **publish:** add table of contents ([#1428](https://github.com/dendronhq/dendron/issues/1428)) ([df4b05b](https://github.com/dendronhq/dendron/commit/df4b05ba8526dc32362d6a59543d880f253f02fc))



# 0.61.0 (2021-09-28)


### Bug Fixes

* **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))
* support activation for older vscode version ([#1426](https://github.com/dendronhq/dendron/issues/1426)) ([5a1c7ed](https://github.com/dendronhq/dendron/commit/5a1c7ed9b45df2f00e61229c0776dad41cc29aba))


### Features Dendron

* **workspace:** add survey for new users([#1409](https://github.com/dendronhq/dendron/issues/1409)) ([e2b1754](https://github.com/dendronhq/dendron/commit/e2b17548fbbe3dffef961eb393f82a6a876940e7))



## 0.60.2 (2021-09-25)



## 0.60.2-alpha.0 (2021-09-24)



## 0.60.1 (2021-09-24)


### Bug Fixes

* pesky error popup when schema lookup is closed ([#1389](https://github.com/dendronhq/dendron/issues/1389)) ([4d2bb40](https://github.com/dendronhq/dendron/commit/4d2bb401b17e926dc2eaa11957536f0c75a1e538))
* single letter look up matches ([#1388](https://github.com/dendronhq/dendron/issues/1388)) ([7de9a71](https://github.com/dendronhq/dendron/commit/7de9a7195a02399b1285b51ef08d6853b1f390f6))



# 0.60.0 (2021-09-21)


### Bug Fixes

* **commands:** rename note leaves incorrect metadata if parent is a stub ([#1348](https://github.com/dendronhq/dendron/issues/1348)) ([d432cc9](https://github.com/dendronhq/dendron/commit/d432cc9e20ff8b9f6cefd7cc4c3a42b567ed9bc5))
* **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))
* **workspace:** disable certain decorations for long notes to avoid performance hit ([#1337](https://github.com/dendronhq/dendron/issues/1337)) ([f1c46f9](https://github.com/dendronhq/dendron/commit/f1c46f95c228ada2126ec7212cede3bf5acc773d))
* direct children query ([#1303](https://github.com/dendronhq/dendron/issues/1303)) ([bcf0dea](https://github.com/dendronhq/dendron/commit/bcf0deae422406564cd9a56c1765f90dd2e66215))
* issue with webpack devCLI ([a4ff4c9](https://github.com/dendronhq/dendron/commit/a4ff4c9ae28ff31ab6f9483c339ae78b5144e185))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))
* stop calendar from auto expanding when the last note is closed ([#1299](https://github.com/dendronhq/dendron/issues/1299)) ([9c8f853](https://github.com/dendronhq/dendron/commit/9c8f8533da5027c122e0d003ce4c61dc866735f5))


### Features Dendron

* consolidate dendron configs ([#1295](https://github.com/dendronhq/dendron/issues/1295)) ([177ac92](https://github.com/dendronhq/dendron/commit/177ac925a5442471f041ce5d991da52cecee6c9b))
* nextjs publishing fulltext search ([#1334](https://github.com/dendronhq/dendron/issues/1334)) ([68f8473](https://github.com/dendronhq/dendron/commit/68f8473badf22494c8d0758f8195e377235321f6))
* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* user tags ([#1228](https://github.com/dendronhq/dendron/issues/1228)) ([98c0106](https://github.com/dendronhq/dendron/commit/98c0106367e384c130a927484b9ea294eb6f84fa))



## 0.55.2 (2021-08-21)


### Bug Fixes

* wrong internal links in nextjs publishing ([#1165](https://github.com/dendronhq/dendron/issues/1165)) ([59a949d](https://github.com/dendronhq/dendron/commit/59a949d2b5b541efb283e851060636b108eb5a98))



## 0.55.1 (2021-08-17)


### Bug Fixes

* multiple issues with lookupv3 ([1fdd9eb](https://github.com/dendronhq/dendron/commit/1fdd9eb3242b43539572a1993fefd174640c6d83))
* properly log error stack ([485e220](https://github.com/dendronhq/dendron/commit/485e220f8ffa6cd63210e106e846ff305b920b77))


### Features Dendron

* Insert Note Index command ([#1142](https://github.com/dendronhq/dendron/issues/1142)) ([c140015](https://github.com/dendronhq/dendron/commit/c140015c19a942cf4696d596e818fd89905eea25))
* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* undefined tags breaks note serialization ([b1d784c](https://github.com/dendronhq/dendron/commit/b1d784c8df18b3b45999f01c14793436ff669a3f))


### Features Dendron

* colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
* resolve vim keybinding conflict on initial install ([#1103](https://github.com/dendronhq/dendron/issues/1103)) ([2278c66](https://github.com/dendronhq/dendron/commit/2278c6616c8297cc414ad02d5323bff5c45072e4))
* **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))
* Add SchemaLookupCommand ([#1082](https://github.com/dendronhq/dendron/issues/1082)) ([fe11a0e](https://github.com/dendronhq/dendron/commit/fe11a0ea1e0214823dd01842b941456df164bc70))
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* generate json schema from config ([#1100](https://github.com/dendronhq/dendron/issues/1100)) ([53b189e](https://github.com/dendronhq/dendron/commit/53b189ec973a8d3d3ccf300a0e59908197f4efb1))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.67.3-alpha.1](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.67.3-alpha.1) (2021-11-07)


### Bug Fixes

* replace auto generated ids (coming from inline schemas) with patterns ([#1632](https://github.com/dendronhq/dendron/issues/1632)) ([af28cf6](https://github.com/dendronhq/dendron/commit/af28cf6ef1d085d22069695e9df128477c024d1b))
* **lookup:** hierarchy look up when inside parts of the hierarchy are omitted ([#1522](https://github.com/dendronhq/dendron/issues/1522)) ([6c30af5](https://github.com/dendronhq/dendron/commit/6c30af5e5b76297334f15a435fd1f9ad09941e06))
* **markdown:** email parsed as user tag & option to disable user tags and hashtags ([#1562](https://github.com/dendronhq/dendron/issues/1562)) ([fd56f7e](https://github.com/dendronhq/dendron/commit/fd56f7ece1651ea6433ebf481f2c54386ab6fb16))
* **markdown:** footnote links move view in publishing & preview ([#1568](https://github.com/dendronhq/dendron/issues/1568)) ([fbe659d](https://github.com/dendronhq/dendron/commit/fbe659d2be3d1f2534d7437d585e9fa38f1684da))
* backward compatibility of id matching adding '_' to id regex match. ([#1504](https://github.com/dendronhq/dendron/issues/1504)) ([4bbae40](https://github.com/dendronhq/dendron/commit/4bbae40d81ea064612f605c6f4e18ae8d34ba0de))


### Features Dendron

* **notes:** task notes (create modifier & editor highlighting) ([#1583](https://github.com/dendronhq/dendron/issues/1583)) ([e785efa](https://github.com/dendronhq/dendron/commit/e785efa8e2ce55bc39fb90cf34984d55035dd6ca))
* **workspace:** convert vault command ([#1542](https://github.com/dendronhq/dendron/issues/1542)) ([c265e9d](https://github.com/dendronhq/dendron/commit/c265e9d2c238b5a6b3761f4c073140b1a0debe3a))



## 0.62.3 (2021-10-09)


### Bug Fixes

* template doesn't copy FM tags ([#1488](https://github.com/dendronhq/dendron/issues/1488)) ([0317699](https://github.com/dendronhq/dendron/commit/0317699ef9bfd4d77b1d3d05f8093e725ea5b2c3)), closes [#1481](https://github.com/dendronhq/dendron/issues/1481)
* **view:** enable anchor links to work in preview ([#1375](https://github.com/dendronhq/dendron/issues/1375)) ([f27cfb0](https://github.com/dendronhq/dendron/commit/f27cfb07d612e28fd0d6dd08019d772767900bba))
* preview caching invalidation when notes with ![[ref]] links change ([#1385](https://github.com/dendronhq/dendron/issues/1385)) ([efeef86](https://github.com/dendronhq/dendron/commit/efeef8662ec52e64ba33cae9b1196bba6cc82f95))
* **publish:** bad seo props setter ([373d933](https://github.com/dendronhq/dendron/commit/373d9331aba3b3385632f01661dd6c80835ec5ac))


### Features Dendron

* Lapsed user survey ([#1446](https://github.com/dendronhq/dendron/issues/1446)) ([8094d2b](https://github.com/dendronhq/dendron/commit/8094d2bb1972fecf4fde74e8c5644aeba3eec119)), closes [#1349](https://github.com/dendronhq/dendron/issues/1349)
* **publish:** add table of contents ([#1428](https://github.com/dendronhq/dendron/issues/1428)) ([df4b05b](https://github.com/dendronhq/dendron/commit/df4b05ba8526dc32362d6a59543d880f253f02fc))



# 0.61.0 (2021-09-28)


### Bug Fixes

* **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))
* support activation for older vscode version ([#1426](https://github.com/dendronhq/dendron/issues/1426)) ([5a1c7ed](https://github.com/dendronhq/dendron/commit/5a1c7ed9b45df2f00e61229c0776dad41cc29aba))


### Features Dendron

* **workspace:** add survey for new users([#1409](https://github.com/dendronhq/dendron/issues/1409)) ([e2b1754](https://github.com/dendronhq/dendron/commit/e2b17548fbbe3dffef961eb393f82a6a876940e7))



## 0.60.2 (2021-09-25)



## 0.60.2-alpha.0 (2021-09-24)



## 0.60.1 (2021-09-24)


### Bug Fixes

* pesky error popup when schema lookup is closed ([#1389](https://github.com/dendronhq/dendron/issues/1389)) ([4d2bb40](https://github.com/dendronhq/dendron/commit/4d2bb401b17e926dc2eaa11957536f0c75a1e538))
* single letter look up matches ([#1388](https://github.com/dendronhq/dendron/issues/1388)) ([7de9a71](https://github.com/dendronhq/dendron/commit/7de9a7195a02399b1285b51ef08d6853b1f390f6))



# 0.60.0 (2021-09-21)


### Bug Fixes

* **commands:** rename note leaves incorrect metadata if parent is a stub ([#1348](https://github.com/dendronhq/dendron/issues/1348)) ([d432cc9](https://github.com/dendronhq/dendron/commit/d432cc9e20ff8b9f6cefd7cc4c3a42b567ed9bc5))
* **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))
* **workspace:** disable certain decorations for long notes to avoid performance hit ([#1337](https://github.com/dendronhq/dendron/issues/1337)) ([f1c46f9](https://github.com/dendronhq/dendron/commit/f1c46f95c228ada2126ec7212cede3bf5acc773d))
* direct children query ([#1303](https://github.com/dendronhq/dendron/issues/1303)) ([bcf0dea](https://github.com/dendronhq/dendron/commit/bcf0deae422406564cd9a56c1765f90dd2e66215))
* issue with webpack devCLI ([a4ff4c9](https://github.com/dendronhq/dendron/commit/a4ff4c9ae28ff31ab6f9483c339ae78b5144e185))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))
* stop calendar from auto expanding when the last note is closed ([#1299](https://github.com/dendronhq/dendron/issues/1299)) ([9c8f853](https://github.com/dendronhq/dendron/commit/9c8f8533da5027c122e0d003ce4c61dc866735f5))


### Features Dendron

* consolidate dendron configs ([#1295](https://github.com/dendronhq/dendron/issues/1295)) ([177ac92](https://github.com/dendronhq/dendron/commit/177ac925a5442471f041ce5d991da52cecee6c9b))
* nextjs publishing fulltext search ([#1334](https://github.com/dendronhq/dendron/issues/1334)) ([68f8473](https://github.com/dendronhq/dendron/commit/68f8473badf22494c8d0758f8195e377235321f6))
* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* user tags ([#1228](https://github.com/dendronhq/dendron/issues/1228)) ([98c0106](https://github.com/dendronhq/dendron/commit/98c0106367e384c130a927484b9ea294eb6f84fa))



## 0.55.2 (2021-08-21)


### Bug Fixes

* wrong internal links in nextjs publishing ([#1165](https://github.com/dendronhq/dendron/issues/1165)) ([59a949d](https://github.com/dendronhq/dendron/commit/59a949d2b5b541efb283e851060636b108eb5a98))



## 0.55.1 (2021-08-17)


### Bug Fixes

* multiple issues with lookupv3 ([1fdd9eb](https://github.com/dendronhq/dendron/commit/1fdd9eb3242b43539572a1993fefd174640c6d83))
* properly log error stack ([485e220](https://github.com/dendronhq/dendron/commit/485e220f8ffa6cd63210e106e846ff305b920b77))


### Features Dendron

* Insert Note Index command ([#1142](https://github.com/dendronhq/dendron/issues/1142)) ([c140015](https://github.com/dendronhq/dendron/commit/c140015c19a942cf4696d596e818fd89905eea25))
* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* undefined tags breaks note serialization ([b1d784c](https://github.com/dendronhq/dendron/commit/b1d784c8df18b3b45999f01c14793436ff669a3f))


### Features Dendron

* colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
* resolve vim keybinding conflict on initial install ([#1103](https://github.com/dendronhq/dendron/issues/1103)) ([2278c66](https://github.com/dendronhq/dendron/commit/2278c6616c8297cc414ad02d5323bff5c45072e4))
* **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))
* Add SchemaLookupCommand ([#1082](https://github.com/dendronhq/dendron/issues/1082)) ([fe11a0e](https://github.com/dendronhq/dendron/commit/fe11a0ea1e0214823dd01842b941456df164bc70))
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* generate json schema from config ([#1100](https://github.com/dendronhq/dendron/issues/1100)) ([53b189e](https://github.com/dendronhq/dendron/commit/53b189ec973a8d3d3ccf300a0e59908197f4efb1))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.67.3-alpha.0](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.67.3-alpha.0) (2021-11-07)


### Bug Fixes

* replace auto generated ids (coming from inline schemas) with patterns ([#1632](https://github.com/dendronhq/dendron/issues/1632)) ([af28cf6](https://github.com/dendronhq/dendron/commit/af28cf6ef1d085d22069695e9df128477c024d1b))
* **lookup:** hierarchy look up when inside parts of the hierarchy are omitted ([#1522](https://github.com/dendronhq/dendron/issues/1522)) ([6c30af5](https://github.com/dendronhq/dendron/commit/6c30af5e5b76297334f15a435fd1f9ad09941e06))
* **markdown:** email parsed as user tag & option to disable user tags and hashtags ([#1562](https://github.com/dendronhq/dendron/issues/1562)) ([fd56f7e](https://github.com/dendronhq/dendron/commit/fd56f7ece1651ea6433ebf481f2c54386ab6fb16))
* **markdown:** footnote links move view in publishing & preview ([#1568](https://github.com/dendronhq/dendron/issues/1568)) ([fbe659d](https://github.com/dendronhq/dendron/commit/fbe659d2be3d1f2534d7437d585e9fa38f1684da))
* backward compatibility of id matching adding '_' to id regex match. ([#1504](https://github.com/dendronhq/dendron/issues/1504)) ([4bbae40](https://github.com/dendronhq/dendron/commit/4bbae40d81ea064612f605c6f4e18ae8d34ba0de))


### Features Dendron

* **notes:** task notes (create modifier & editor highlighting) ([#1583](https://github.com/dendronhq/dendron/issues/1583)) ([e785efa](https://github.com/dendronhq/dendron/commit/e785efa8e2ce55bc39fb90cf34984d55035dd6ca))
* **workspace:** convert vault command ([#1542](https://github.com/dendronhq/dendron/issues/1542)) ([c265e9d](https://github.com/dendronhq/dendron/commit/c265e9d2c238b5a6b3761f4c073140b1a0debe3a))



## 0.62.3 (2021-10-09)


### Bug Fixes

* template doesn't copy FM tags ([#1488](https://github.com/dendronhq/dendron/issues/1488)) ([0317699](https://github.com/dendronhq/dendron/commit/0317699ef9bfd4d77b1d3d05f8093e725ea5b2c3)), closes [#1481](https://github.com/dendronhq/dendron/issues/1481)
* **view:** enable anchor links to work in preview ([#1375](https://github.com/dendronhq/dendron/issues/1375)) ([f27cfb0](https://github.com/dendronhq/dendron/commit/f27cfb07d612e28fd0d6dd08019d772767900bba))
* preview caching invalidation when notes with ![[ref]] links change ([#1385](https://github.com/dendronhq/dendron/issues/1385)) ([efeef86](https://github.com/dendronhq/dendron/commit/efeef8662ec52e64ba33cae9b1196bba6cc82f95))
* **publish:** bad seo props setter ([373d933](https://github.com/dendronhq/dendron/commit/373d9331aba3b3385632f01661dd6c80835ec5ac))


### Features Dendron

* Lapsed user survey ([#1446](https://github.com/dendronhq/dendron/issues/1446)) ([8094d2b](https://github.com/dendronhq/dendron/commit/8094d2bb1972fecf4fde74e8c5644aeba3eec119)), closes [#1349](https://github.com/dendronhq/dendron/issues/1349)
* **publish:** add table of contents ([#1428](https://github.com/dendronhq/dendron/issues/1428)) ([df4b05b](https://github.com/dendronhq/dendron/commit/df4b05ba8526dc32362d6a59543d880f253f02fc))



# 0.61.0 (2021-09-28)


### Bug Fixes

* **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))
* support activation for older vscode version ([#1426](https://github.com/dendronhq/dendron/issues/1426)) ([5a1c7ed](https://github.com/dendronhq/dendron/commit/5a1c7ed9b45df2f00e61229c0776dad41cc29aba))


### Features Dendron

* **workspace:** add survey for new users([#1409](https://github.com/dendronhq/dendron/issues/1409)) ([e2b1754](https://github.com/dendronhq/dendron/commit/e2b17548fbbe3dffef961eb393f82a6a876940e7))



## 0.60.2 (2021-09-25)



## 0.60.2-alpha.0 (2021-09-24)



## 0.60.1 (2021-09-24)


### Bug Fixes

* pesky error popup when schema lookup is closed ([#1389](https://github.com/dendronhq/dendron/issues/1389)) ([4d2bb40](https://github.com/dendronhq/dendron/commit/4d2bb401b17e926dc2eaa11957536f0c75a1e538))
* single letter look up matches ([#1388](https://github.com/dendronhq/dendron/issues/1388)) ([7de9a71](https://github.com/dendronhq/dendron/commit/7de9a7195a02399b1285b51ef08d6853b1f390f6))



# 0.60.0 (2021-09-21)


### Bug Fixes

* **commands:** rename note leaves incorrect metadata if parent is a stub ([#1348](https://github.com/dendronhq/dendron/issues/1348)) ([d432cc9](https://github.com/dendronhq/dendron/commit/d432cc9e20ff8b9f6cefd7cc4c3a42b567ed9bc5))
* **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))
* **workspace:** disable certain decorations for long notes to avoid performance hit ([#1337](https://github.com/dendronhq/dendron/issues/1337)) ([f1c46f9](https://github.com/dendronhq/dendron/commit/f1c46f95c228ada2126ec7212cede3bf5acc773d))
* direct children query ([#1303](https://github.com/dendronhq/dendron/issues/1303)) ([bcf0dea](https://github.com/dendronhq/dendron/commit/bcf0deae422406564cd9a56c1765f90dd2e66215))
* issue with webpack devCLI ([a4ff4c9](https://github.com/dendronhq/dendron/commit/a4ff4c9ae28ff31ab6f9483c339ae78b5144e185))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))
* stop calendar from auto expanding when the last note is closed ([#1299](https://github.com/dendronhq/dendron/issues/1299)) ([9c8f853](https://github.com/dendronhq/dendron/commit/9c8f8533da5027c122e0d003ce4c61dc866735f5))


### Features Dendron

* consolidate dendron configs ([#1295](https://github.com/dendronhq/dendron/issues/1295)) ([177ac92](https://github.com/dendronhq/dendron/commit/177ac925a5442471f041ce5d991da52cecee6c9b))
* nextjs publishing fulltext search ([#1334](https://github.com/dendronhq/dendron/issues/1334)) ([68f8473](https://github.com/dendronhq/dendron/commit/68f8473badf22494c8d0758f8195e377235321f6))
* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* user tags ([#1228](https://github.com/dendronhq/dendron/issues/1228)) ([98c0106](https://github.com/dendronhq/dendron/commit/98c0106367e384c130a927484b9ea294eb6f84fa))



## 0.55.2 (2021-08-21)


### Bug Fixes

* wrong internal links in nextjs publishing ([#1165](https://github.com/dendronhq/dendron/issues/1165)) ([59a949d](https://github.com/dendronhq/dendron/commit/59a949d2b5b541efb283e851060636b108eb5a98))



## 0.55.1 (2021-08-17)


### Bug Fixes

* multiple issues with lookupv3 ([1fdd9eb](https://github.com/dendronhq/dendron/commit/1fdd9eb3242b43539572a1993fefd174640c6d83))
* properly log error stack ([485e220](https://github.com/dendronhq/dendron/commit/485e220f8ffa6cd63210e106e846ff305b920b77))


### Features Dendron

* Insert Note Index command ([#1142](https://github.com/dendronhq/dendron/issues/1142)) ([c140015](https://github.com/dendronhq/dendron/commit/c140015c19a942cf4696d596e818fd89905eea25))
* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* undefined tags breaks note serialization ([b1d784c](https://github.com/dendronhq/dendron/commit/b1d784c8df18b3b45999f01c14793436ff669a3f))


### Features Dendron

* colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
* resolve vim keybinding conflict on initial install ([#1103](https://github.com/dendronhq/dendron/issues/1103)) ([2278c66](https://github.com/dendronhq/dendron/commit/2278c6616c8297cc414ad02d5323bff5c45072e4))
* **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))
* Add SchemaLookupCommand ([#1082](https://github.com/dendronhq/dendron/issues/1082)) ([fe11a0e](https://github.com/dendronhq/dendron/commit/fe11a0ea1e0214823dd01842b941456df164bc70))
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* generate json schema from config ([#1100](https://github.com/dendronhq/dendron/issues/1100)) ([53b189e](https://github.com/dendronhq/dendron/commit/53b189ec973a8d3d3ccf300a0e59908197f4efb1))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.67.2](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.67.2) (2021-11-05)


### Bug Fixes

* replace auto generated ids (coming from inline schemas) with patterns ([#1632](https://github.com/dendronhq/dendron/issues/1632)) ([af28cf6](https://github.com/dendronhq/dendron/commit/af28cf6ef1d085d22069695e9df128477c024d1b))
* **lookup:** hierarchy look up when inside parts of the hierarchy are omitted ([#1522](https://github.com/dendronhq/dendron/issues/1522)) ([6c30af5](https://github.com/dendronhq/dendron/commit/6c30af5e5b76297334f15a435fd1f9ad09941e06))
* **markdown:** email parsed as user tag & option to disable user tags and hashtags ([#1562](https://github.com/dendronhq/dendron/issues/1562)) ([fd56f7e](https://github.com/dendronhq/dendron/commit/fd56f7ece1651ea6433ebf481f2c54386ab6fb16))
* **markdown:** footnote links move view in publishing & preview ([#1568](https://github.com/dendronhq/dendron/issues/1568)) ([fbe659d](https://github.com/dendronhq/dendron/commit/fbe659d2be3d1f2534d7437d585e9fa38f1684da))
* backward compatibility of id matching adding '_' to id regex match. ([#1504](https://github.com/dendronhq/dendron/issues/1504)) ([4bbae40](https://github.com/dendronhq/dendron/commit/4bbae40d81ea064612f605c6f4e18ae8d34ba0de))


### Features Dendron

* **notes:** task notes (create modifier & editor highlighting) ([#1583](https://github.com/dendronhq/dendron/issues/1583)) ([e785efa](https://github.com/dendronhq/dendron/commit/e785efa8e2ce55bc39fb90cf34984d55035dd6ca))
* **workspace:** convert vault command ([#1542](https://github.com/dendronhq/dendron/issues/1542)) ([c265e9d](https://github.com/dendronhq/dendron/commit/c265e9d2c238b5a6b3761f4c073140b1a0debe3a))



## 0.62.3 (2021-10-09)


### Bug Fixes

* template doesn't copy FM tags ([#1488](https://github.com/dendronhq/dendron/issues/1488)) ([0317699](https://github.com/dendronhq/dendron/commit/0317699ef9bfd4d77b1d3d05f8093e725ea5b2c3)), closes [#1481](https://github.com/dendronhq/dendron/issues/1481)
* **view:** enable anchor links to work in preview ([#1375](https://github.com/dendronhq/dendron/issues/1375)) ([f27cfb0](https://github.com/dendronhq/dendron/commit/f27cfb07d612e28fd0d6dd08019d772767900bba))
* preview caching invalidation when notes with ![[ref]] links change ([#1385](https://github.com/dendronhq/dendron/issues/1385)) ([efeef86](https://github.com/dendronhq/dendron/commit/efeef8662ec52e64ba33cae9b1196bba6cc82f95))
* **publish:** bad seo props setter ([373d933](https://github.com/dendronhq/dendron/commit/373d9331aba3b3385632f01661dd6c80835ec5ac))


### Features Dendron

* Lapsed user survey ([#1446](https://github.com/dendronhq/dendron/issues/1446)) ([8094d2b](https://github.com/dendronhq/dendron/commit/8094d2bb1972fecf4fde74e8c5644aeba3eec119)), closes [#1349](https://github.com/dendronhq/dendron/issues/1349)
* **publish:** add table of contents ([#1428](https://github.com/dendronhq/dendron/issues/1428)) ([df4b05b](https://github.com/dendronhq/dendron/commit/df4b05ba8526dc32362d6a59543d880f253f02fc))



# 0.61.0 (2021-09-28)


### Bug Fixes

* **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))
* support activation for older vscode version ([#1426](https://github.com/dendronhq/dendron/issues/1426)) ([5a1c7ed](https://github.com/dendronhq/dendron/commit/5a1c7ed9b45df2f00e61229c0776dad41cc29aba))


### Features Dendron

* **workspace:** add survey for new users([#1409](https://github.com/dendronhq/dendron/issues/1409)) ([e2b1754](https://github.com/dendronhq/dendron/commit/e2b17548fbbe3dffef961eb393f82a6a876940e7))



## 0.60.2 (2021-09-25)



## 0.60.2-alpha.0 (2021-09-24)



## 0.60.1 (2021-09-24)


### Bug Fixes

* pesky error popup when schema lookup is closed ([#1389](https://github.com/dendronhq/dendron/issues/1389)) ([4d2bb40](https://github.com/dendronhq/dendron/commit/4d2bb401b17e926dc2eaa11957536f0c75a1e538))
* single letter look up matches ([#1388](https://github.com/dendronhq/dendron/issues/1388)) ([7de9a71](https://github.com/dendronhq/dendron/commit/7de9a7195a02399b1285b51ef08d6853b1f390f6))



# 0.60.0 (2021-09-21)


### Bug Fixes

* **commands:** rename note leaves incorrect metadata if parent is a stub ([#1348](https://github.com/dendronhq/dendron/issues/1348)) ([d432cc9](https://github.com/dendronhq/dendron/commit/d432cc9e20ff8b9f6cefd7cc4c3a42b567ed9bc5))
* **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))
* **workspace:** disable certain decorations for long notes to avoid performance hit ([#1337](https://github.com/dendronhq/dendron/issues/1337)) ([f1c46f9](https://github.com/dendronhq/dendron/commit/f1c46f95c228ada2126ec7212cede3bf5acc773d))
* direct children query ([#1303](https://github.com/dendronhq/dendron/issues/1303)) ([bcf0dea](https://github.com/dendronhq/dendron/commit/bcf0deae422406564cd9a56c1765f90dd2e66215))
* issue with webpack devCLI ([a4ff4c9](https://github.com/dendronhq/dendron/commit/a4ff4c9ae28ff31ab6f9483c339ae78b5144e185))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))
* stop calendar from auto expanding when the last note is closed ([#1299](https://github.com/dendronhq/dendron/issues/1299)) ([9c8f853](https://github.com/dendronhq/dendron/commit/9c8f8533da5027c122e0d003ce4c61dc866735f5))


### Features Dendron

* consolidate dendron configs ([#1295](https://github.com/dendronhq/dendron/issues/1295)) ([177ac92](https://github.com/dendronhq/dendron/commit/177ac925a5442471f041ce5d991da52cecee6c9b))
* nextjs publishing fulltext search ([#1334](https://github.com/dendronhq/dendron/issues/1334)) ([68f8473](https://github.com/dendronhq/dendron/commit/68f8473badf22494c8d0758f8195e377235321f6))
* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* user tags ([#1228](https://github.com/dendronhq/dendron/issues/1228)) ([98c0106](https://github.com/dendronhq/dendron/commit/98c0106367e384c130a927484b9ea294eb6f84fa))



## 0.55.2 (2021-08-21)


### Bug Fixes

* wrong internal links in nextjs publishing ([#1165](https://github.com/dendronhq/dendron/issues/1165)) ([59a949d](https://github.com/dendronhq/dendron/commit/59a949d2b5b541efb283e851060636b108eb5a98))



## 0.55.1 (2021-08-17)


### Bug Fixes

* multiple issues with lookupv3 ([1fdd9eb](https://github.com/dendronhq/dendron/commit/1fdd9eb3242b43539572a1993fefd174640c6d83))
* properly log error stack ([485e220](https://github.com/dendronhq/dendron/commit/485e220f8ffa6cd63210e106e846ff305b920b77))


### Features Dendron

* Insert Note Index command ([#1142](https://github.com/dendronhq/dendron/issues/1142)) ([c140015](https://github.com/dendronhq/dendron/commit/c140015c19a942cf4696d596e818fd89905eea25))
* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* undefined tags breaks note serialization ([b1d784c](https://github.com/dendronhq/dendron/commit/b1d784c8df18b3b45999f01c14793436ff669a3f))


### Features Dendron

* colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
* resolve vim keybinding conflict on initial install ([#1103](https://github.com/dendronhq/dendron/issues/1103)) ([2278c66](https://github.com/dendronhq/dendron/commit/2278c6616c8297cc414ad02d5323bff5c45072e4))
* **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))
* Add SchemaLookupCommand ([#1082](https://github.com/dendronhq/dendron/issues/1082)) ([fe11a0e](https://github.com/dendronhq/dendron/commit/fe11a0ea1e0214823dd01842b941456df164bc70))
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* generate json schema from config ([#1100](https://github.com/dendronhq/dendron/issues/1100)) ([53b189e](https://github.com/dendronhq/dendron/commit/53b189ec973a8d3d3ccf300a0e59908197f4efb1))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.67.1](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.67.1) (2021-11-05)


### Bug Fixes

* replace auto generated ids (coming from inline schemas) with patterns ([#1632](https://github.com/dendronhq/dendron/issues/1632)) ([af28cf6](https://github.com/dendronhq/dendron/commit/af28cf6ef1d085d22069695e9df128477c024d1b))
* **lookup:** hierarchy look up when inside parts of the hierarchy are omitted ([#1522](https://github.com/dendronhq/dendron/issues/1522)) ([6c30af5](https://github.com/dendronhq/dendron/commit/6c30af5e5b76297334f15a435fd1f9ad09941e06))
* **markdown:** email parsed as user tag & option to disable user tags and hashtags ([#1562](https://github.com/dendronhq/dendron/issues/1562)) ([fd56f7e](https://github.com/dendronhq/dendron/commit/fd56f7ece1651ea6433ebf481f2c54386ab6fb16))
* **markdown:** footnote links move view in publishing & preview ([#1568](https://github.com/dendronhq/dendron/issues/1568)) ([fbe659d](https://github.com/dendronhq/dendron/commit/fbe659d2be3d1f2534d7437d585e9fa38f1684da))
* backward compatibility of id matching adding '_' to id regex match. ([#1504](https://github.com/dendronhq/dendron/issues/1504)) ([4bbae40](https://github.com/dendronhq/dendron/commit/4bbae40d81ea064612f605c6f4e18ae8d34ba0de))


### Features Dendron

* **notes:** task notes (create modifier & editor highlighting) ([#1583](https://github.com/dendronhq/dendron/issues/1583)) ([e785efa](https://github.com/dendronhq/dendron/commit/e785efa8e2ce55bc39fb90cf34984d55035dd6ca))
* **workspace:** convert vault command ([#1542](https://github.com/dendronhq/dendron/issues/1542)) ([c265e9d](https://github.com/dendronhq/dendron/commit/c265e9d2c238b5a6b3761f4c073140b1a0debe3a))



## 0.62.3 (2021-10-09)


### Bug Fixes

* template doesn't copy FM tags ([#1488](https://github.com/dendronhq/dendron/issues/1488)) ([0317699](https://github.com/dendronhq/dendron/commit/0317699ef9bfd4d77b1d3d05f8093e725ea5b2c3)), closes [#1481](https://github.com/dendronhq/dendron/issues/1481)
* **view:** enable anchor links to work in preview ([#1375](https://github.com/dendronhq/dendron/issues/1375)) ([f27cfb0](https://github.com/dendronhq/dendron/commit/f27cfb07d612e28fd0d6dd08019d772767900bba))
* preview caching invalidation when notes with ![[ref]] links change ([#1385](https://github.com/dendronhq/dendron/issues/1385)) ([efeef86](https://github.com/dendronhq/dendron/commit/efeef8662ec52e64ba33cae9b1196bba6cc82f95))
* **publish:** bad seo props setter ([373d933](https://github.com/dendronhq/dendron/commit/373d9331aba3b3385632f01661dd6c80835ec5ac))


### Features Dendron

* Lapsed user survey ([#1446](https://github.com/dendronhq/dendron/issues/1446)) ([8094d2b](https://github.com/dendronhq/dendron/commit/8094d2bb1972fecf4fde74e8c5644aeba3eec119)), closes [#1349](https://github.com/dendronhq/dendron/issues/1349)
* **publish:** add table of contents ([#1428](https://github.com/dendronhq/dendron/issues/1428)) ([df4b05b](https://github.com/dendronhq/dendron/commit/df4b05ba8526dc32362d6a59543d880f253f02fc))



# 0.61.0 (2021-09-28)


### Bug Fixes

* **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))
* support activation for older vscode version ([#1426](https://github.com/dendronhq/dendron/issues/1426)) ([5a1c7ed](https://github.com/dendronhq/dendron/commit/5a1c7ed9b45df2f00e61229c0776dad41cc29aba))


### Features Dendron

* **workspace:** add survey for new users([#1409](https://github.com/dendronhq/dendron/issues/1409)) ([e2b1754](https://github.com/dendronhq/dendron/commit/e2b17548fbbe3dffef961eb393f82a6a876940e7))



## 0.60.2 (2021-09-25)



## 0.60.2-alpha.0 (2021-09-24)



## 0.60.1 (2021-09-24)


### Bug Fixes

* pesky error popup when schema lookup is closed ([#1389](https://github.com/dendronhq/dendron/issues/1389)) ([4d2bb40](https://github.com/dendronhq/dendron/commit/4d2bb401b17e926dc2eaa11957536f0c75a1e538))
* single letter look up matches ([#1388](https://github.com/dendronhq/dendron/issues/1388)) ([7de9a71](https://github.com/dendronhq/dendron/commit/7de9a7195a02399b1285b51ef08d6853b1f390f6))



# 0.60.0 (2021-09-21)


### Bug Fixes

* **commands:** rename note leaves incorrect metadata if parent is a stub ([#1348](https://github.com/dendronhq/dendron/issues/1348)) ([d432cc9](https://github.com/dendronhq/dendron/commit/d432cc9e20ff8b9f6cefd7cc4c3a42b567ed9bc5))
* **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))
* **workspace:** disable certain decorations for long notes to avoid performance hit ([#1337](https://github.com/dendronhq/dendron/issues/1337)) ([f1c46f9](https://github.com/dendronhq/dendron/commit/f1c46f95c228ada2126ec7212cede3bf5acc773d))
* direct children query ([#1303](https://github.com/dendronhq/dendron/issues/1303)) ([bcf0dea](https://github.com/dendronhq/dendron/commit/bcf0deae422406564cd9a56c1765f90dd2e66215))
* issue with webpack devCLI ([a4ff4c9](https://github.com/dendronhq/dendron/commit/a4ff4c9ae28ff31ab6f9483c339ae78b5144e185))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))
* stop calendar from auto expanding when the last note is closed ([#1299](https://github.com/dendronhq/dendron/issues/1299)) ([9c8f853](https://github.com/dendronhq/dendron/commit/9c8f8533da5027c122e0d003ce4c61dc866735f5))


### Features Dendron

* consolidate dendron configs ([#1295](https://github.com/dendronhq/dendron/issues/1295)) ([177ac92](https://github.com/dendronhq/dendron/commit/177ac925a5442471f041ce5d991da52cecee6c9b))
* nextjs publishing fulltext search ([#1334](https://github.com/dendronhq/dendron/issues/1334)) ([68f8473](https://github.com/dendronhq/dendron/commit/68f8473badf22494c8d0758f8195e377235321f6))
* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* user tags ([#1228](https://github.com/dendronhq/dendron/issues/1228)) ([98c0106](https://github.com/dendronhq/dendron/commit/98c0106367e384c130a927484b9ea294eb6f84fa))



## 0.55.2 (2021-08-21)


### Bug Fixes

* wrong internal links in nextjs publishing ([#1165](https://github.com/dendronhq/dendron/issues/1165)) ([59a949d](https://github.com/dendronhq/dendron/commit/59a949d2b5b541efb283e851060636b108eb5a98))



## 0.55.1 (2021-08-17)


### Bug Fixes

* multiple issues with lookupv3 ([1fdd9eb](https://github.com/dendronhq/dendron/commit/1fdd9eb3242b43539572a1993fefd174640c6d83))
* properly log error stack ([485e220](https://github.com/dendronhq/dendron/commit/485e220f8ffa6cd63210e106e846ff305b920b77))


### Features Dendron

* Insert Note Index command ([#1142](https://github.com/dendronhq/dendron/issues/1142)) ([c140015](https://github.com/dendronhq/dendron/commit/c140015c19a942cf4696d596e818fd89905eea25))
* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* undefined tags breaks note serialization ([b1d784c](https://github.com/dendronhq/dendron/commit/b1d784c8df18b3b45999f01c14793436ff669a3f))


### Features Dendron

* colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
* resolve vim keybinding conflict on initial install ([#1103](https://github.com/dendronhq/dendron/issues/1103)) ([2278c66](https://github.com/dendronhq/dendron/commit/2278c6616c8297cc414ad02d5323bff5c45072e4))
* **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))
* Add SchemaLookupCommand ([#1082](https://github.com/dendronhq/dendron/issues/1082)) ([fe11a0e](https://github.com/dendronhq/dendron/commit/fe11a0ea1e0214823dd01842b941456df164bc70))
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* generate json schema from config ([#1100](https://github.com/dendronhq/dendron/issues/1100)) ([53b189e](https://github.com/dendronhq/dendron/commit/53b189ec973a8d3d3ccf300a0e59908197f4efb1))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





# [0.67.0](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.67.0) (2021-11-05)


### Bug Fixes

* replace auto generated ids (coming from inline schemas) with patterns ([#1632](https://github.com/dendronhq/dendron/issues/1632)) ([af28cf6](https://github.com/dendronhq/dendron/commit/af28cf6ef1d085d22069695e9df128477c024d1b))
* **lookup:** hierarchy look up when inside parts of the hierarchy are omitted ([#1522](https://github.com/dendronhq/dendron/issues/1522)) ([6c30af5](https://github.com/dendronhq/dendron/commit/6c30af5e5b76297334f15a435fd1f9ad09941e06))
* **markdown:** email parsed as user tag & option to disable user tags and hashtags ([#1562](https://github.com/dendronhq/dendron/issues/1562)) ([fd56f7e](https://github.com/dendronhq/dendron/commit/fd56f7ece1651ea6433ebf481f2c54386ab6fb16))
* **markdown:** footnote links move view in publishing & preview ([#1568](https://github.com/dendronhq/dendron/issues/1568)) ([fbe659d](https://github.com/dendronhq/dendron/commit/fbe659d2be3d1f2534d7437d585e9fa38f1684da))
* backward compatibility of id matching adding '_' to id regex match. ([#1504](https://github.com/dendronhq/dendron/issues/1504)) ([4bbae40](https://github.com/dendronhq/dendron/commit/4bbae40d81ea064612f605c6f4e18ae8d34ba0de))


### Features Dendron

* **notes:** task notes (create modifier & editor highlighting) ([#1583](https://github.com/dendronhq/dendron/issues/1583)) ([e785efa](https://github.com/dendronhq/dendron/commit/e785efa8e2ce55bc39fb90cf34984d55035dd6ca))
* **workspace:** convert vault command ([#1542](https://github.com/dendronhq/dendron/issues/1542)) ([c265e9d](https://github.com/dendronhq/dendron/commit/c265e9d2c238b5a6b3761f4c073140b1a0debe3a))



## 0.62.3 (2021-10-09)


### Bug Fixes

* template doesn't copy FM tags ([#1488](https://github.com/dendronhq/dendron/issues/1488)) ([0317699](https://github.com/dendronhq/dendron/commit/0317699ef9bfd4d77b1d3d05f8093e725ea5b2c3)), closes [#1481](https://github.com/dendronhq/dendron/issues/1481)
* **view:** enable anchor links to work in preview ([#1375](https://github.com/dendronhq/dendron/issues/1375)) ([f27cfb0](https://github.com/dendronhq/dendron/commit/f27cfb07d612e28fd0d6dd08019d772767900bba))
* preview caching invalidation when notes with ![[ref]] links change ([#1385](https://github.com/dendronhq/dendron/issues/1385)) ([efeef86](https://github.com/dendronhq/dendron/commit/efeef8662ec52e64ba33cae9b1196bba6cc82f95))
* **publish:** bad seo props setter ([373d933](https://github.com/dendronhq/dendron/commit/373d9331aba3b3385632f01661dd6c80835ec5ac))


### Features Dendron

* Lapsed user survey ([#1446](https://github.com/dendronhq/dendron/issues/1446)) ([8094d2b](https://github.com/dendronhq/dendron/commit/8094d2bb1972fecf4fde74e8c5644aeba3eec119)), closes [#1349](https://github.com/dendronhq/dendron/issues/1349)
* **publish:** add table of contents ([#1428](https://github.com/dendronhq/dendron/issues/1428)) ([df4b05b](https://github.com/dendronhq/dendron/commit/df4b05ba8526dc32362d6a59543d880f253f02fc))



# 0.61.0 (2021-09-28)


### Bug Fixes

* **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))
* support activation for older vscode version ([#1426](https://github.com/dendronhq/dendron/issues/1426)) ([5a1c7ed](https://github.com/dendronhq/dendron/commit/5a1c7ed9b45df2f00e61229c0776dad41cc29aba))


### Features Dendron

* **workspace:** add survey for new users([#1409](https://github.com/dendronhq/dendron/issues/1409)) ([e2b1754](https://github.com/dendronhq/dendron/commit/e2b17548fbbe3dffef961eb393f82a6a876940e7))



## 0.60.2 (2021-09-25)



## 0.60.2-alpha.0 (2021-09-24)



## 0.60.1 (2021-09-24)


### Bug Fixes

* pesky error popup when schema lookup is closed ([#1389](https://github.com/dendronhq/dendron/issues/1389)) ([4d2bb40](https://github.com/dendronhq/dendron/commit/4d2bb401b17e926dc2eaa11957536f0c75a1e538))
* single letter look up matches ([#1388](https://github.com/dendronhq/dendron/issues/1388)) ([7de9a71](https://github.com/dendronhq/dendron/commit/7de9a7195a02399b1285b51ef08d6853b1f390f6))



# 0.60.0 (2021-09-21)


### Bug Fixes

* **commands:** rename note leaves incorrect metadata if parent is a stub ([#1348](https://github.com/dendronhq/dendron/issues/1348)) ([d432cc9](https://github.com/dendronhq/dendron/commit/d432cc9e20ff8b9f6cefd7cc4c3a42b567ed9bc5))
* **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))
* **workspace:** disable certain decorations for long notes to avoid performance hit ([#1337](https://github.com/dendronhq/dendron/issues/1337)) ([f1c46f9](https://github.com/dendronhq/dendron/commit/f1c46f95c228ada2126ec7212cede3bf5acc773d))
* direct children query ([#1303](https://github.com/dendronhq/dendron/issues/1303)) ([bcf0dea](https://github.com/dendronhq/dendron/commit/bcf0deae422406564cd9a56c1765f90dd2e66215))
* issue with webpack devCLI ([a4ff4c9](https://github.com/dendronhq/dendron/commit/a4ff4c9ae28ff31ab6f9483c339ae78b5144e185))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))
* stop calendar from auto expanding when the last note is closed ([#1299](https://github.com/dendronhq/dendron/issues/1299)) ([9c8f853](https://github.com/dendronhq/dendron/commit/9c8f8533da5027c122e0d003ce4c61dc866735f5))


### Features Dendron

* consolidate dendron configs ([#1295](https://github.com/dendronhq/dendron/issues/1295)) ([177ac92](https://github.com/dendronhq/dendron/commit/177ac925a5442471f041ce5d991da52cecee6c9b))
* nextjs publishing fulltext search ([#1334](https://github.com/dendronhq/dendron/issues/1334)) ([68f8473](https://github.com/dendronhq/dendron/commit/68f8473badf22494c8d0758f8195e377235321f6))
* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* user tags ([#1228](https://github.com/dendronhq/dendron/issues/1228)) ([98c0106](https://github.com/dendronhq/dendron/commit/98c0106367e384c130a927484b9ea294eb6f84fa))



## 0.55.2 (2021-08-21)


### Bug Fixes

* wrong internal links in nextjs publishing ([#1165](https://github.com/dendronhq/dendron/issues/1165)) ([59a949d](https://github.com/dendronhq/dendron/commit/59a949d2b5b541efb283e851060636b108eb5a98))



## 0.55.1 (2021-08-17)


### Bug Fixes

* multiple issues with lookupv3 ([1fdd9eb](https://github.com/dendronhq/dendron/commit/1fdd9eb3242b43539572a1993fefd174640c6d83))
* properly log error stack ([485e220](https://github.com/dendronhq/dendron/commit/485e220f8ffa6cd63210e106e846ff305b920b77))


### Features Dendron

* Insert Note Index command ([#1142](https://github.com/dendronhq/dendron/issues/1142)) ([c140015](https://github.com/dendronhq/dendron/commit/c140015c19a942cf4696d596e818fd89905eea25))
* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* undefined tags breaks note serialization ([b1d784c](https://github.com/dendronhq/dendron/commit/b1d784c8df18b3b45999f01c14793436ff669a3f))


### Features Dendron

* colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
* resolve vim keybinding conflict on initial install ([#1103](https://github.com/dendronhq/dendron/issues/1103)) ([2278c66](https://github.com/dendronhq/dendron/commit/2278c6616c8297cc414ad02d5323bff5c45072e4))
* **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))
* Add SchemaLookupCommand ([#1082](https://github.com/dendronhq/dendron/issues/1082)) ([fe11a0e](https://github.com/dendronhq/dendron/commit/fe11a0ea1e0214823dd01842b941456df164bc70))
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* generate json schema from config ([#1100](https://github.com/dendronhq/dendron/issues/1100)) ([53b189e](https://github.com/dendronhq/dendron/commit/53b189ec973a8d3d3ccf300a0e59908197f4efb1))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.66.2](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.66.2) (2021-11-05)


### Bug Fixes

* replace auto generated ids (coming from inline schemas) with patterns ([#1632](https://github.com/dendronhq/dendron/issues/1632)) ([af28cf6](https://github.com/dendronhq/dendron/commit/af28cf6ef1d085d22069695e9df128477c024d1b))
* **lookup:** hierarchy look up when inside parts of the hierarchy are omitted ([#1522](https://github.com/dendronhq/dendron/issues/1522)) ([6c30af5](https://github.com/dendronhq/dendron/commit/6c30af5e5b76297334f15a435fd1f9ad09941e06))
* **markdown:** email parsed as user tag & option to disable user tags and hashtags ([#1562](https://github.com/dendronhq/dendron/issues/1562)) ([fd56f7e](https://github.com/dendronhq/dendron/commit/fd56f7ece1651ea6433ebf481f2c54386ab6fb16))
* **markdown:** footnote links move view in publishing & preview ([#1568](https://github.com/dendronhq/dendron/issues/1568)) ([fbe659d](https://github.com/dendronhq/dendron/commit/fbe659d2be3d1f2534d7437d585e9fa38f1684da))
* backward compatibility of id matching adding '_' to id regex match. ([#1504](https://github.com/dendronhq/dendron/issues/1504)) ([4bbae40](https://github.com/dendronhq/dendron/commit/4bbae40d81ea064612f605c6f4e18ae8d34ba0de))


### Features Dendron

* **notes:** task notes (create modifier & editor highlighting) ([#1583](https://github.com/dendronhq/dendron/issues/1583)) ([e785efa](https://github.com/dendronhq/dendron/commit/e785efa8e2ce55bc39fb90cf34984d55035dd6ca))
* **workspace:** convert vault command ([#1542](https://github.com/dendronhq/dendron/issues/1542)) ([c265e9d](https://github.com/dendronhq/dendron/commit/c265e9d2c238b5a6b3761f4c073140b1a0debe3a))



## 0.62.3 (2021-10-09)


### Bug Fixes

* template doesn't copy FM tags ([#1488](https://github.com/dendronhq/dendron/issues/1488)) ([0317699](https://github.com/dendronhq/dendron/commit/0317699ef9bfd4d77b1d3d05f8093e725ea5b2c3)), closes [#1481](https://github.com/dendronhq/dendron/issues/1481)
* **view:** enable anchor links to work in preview ([#1375](https://github.com/dendronhq/dendron/issues/1375)) ([f27cfb0](https://github.com/dendronhq/dendron/commit/f27cfb07d612e28fd0d6dd08019d772767900bba))
* preview caching invalidation when notes with ![[ref]] links change ([#1385](https://github.com/dendronhq/dendron/issues/1385)) ([efeef86](https://github.com/dendronhq/dendron/commit/efeef8662ec52e64ba33cae9b1196bba6cc82f95))
* **publish:** bad seo props setter ([373d933](https://github.com/dendronhq/dendron/commit/373d9331aba3b3385632f01661dd6c80835ec5ac))


### Features Dendron

* Lapsed user survey ([#1446](https://github.com/dendronhq/dendron/issues/1446)) ([8094d2b](https://github.com/dendronhq/dendron/commit/8094d2bb1972fecf4fde74e8c5644aeba3eec119)), closes [#1349](https://github.com/dendronhq/dendron/issues/1349)
* **publish:** add table of contents ([#1428](https://github.com/dendronhq/dendron/issues/1428)) ([df4b05b](https://github.com/dendronhq/dendron/commit/df4b05ba8526dc32362d6a59543d880f253f02fc))



# 0.61.0 (2021-09-28)


### Bug Fixes

* **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))
* support activation for older vscode version ([#1426](https://github.com/dendronhq/dendron/issues/1426)) ([5a1c7ed](https://github.com/dendronhq/dendron/commit/5a1c7ed9b45df2f00e61229c0776dad41cc29aba))


### Features Dendron

* **workspace:** add survey for new users([#1409](https://github.com/dendronhq/dendron/issues/1409)) ([e2b1754](https://github.com/dendronhq/dendron/commit/e2b17548fbbe3dffef961eb393f82a6a876940e7))



## 0.60.2 (2021-09-25)



## 0.60.2-alpha.0 (2021-09-24)



## 0.60.1 (2021-09-24)


### Bug Fixes

* pesky error popup when schema lookup is closed ([#1389](https://github.com/dendronhq/dendron/issues/1389)) ([4d2bb40](https://github.com/dendronhq/dendron/commit/4d2bb401b17e926dc2eaa11957536f0c75a1e538))
* single letter look up matches ([#1388](https://github.com/dendronhq/dendron/issues/1388)) ([7de9a71](https://github.com/dendronhq/dendron/commit/7de9a7195a02399b1285b51ef08d6853b1f390f6))



# 0.60.0 (2021-09-21)


### Bug Fixes

* **commands:** rename note leaves incorrect metadata if parent is a stub ([#1348](https://github.com/dendronhq/dendron/issues/1348)) ([d432cc9](https://github.com/dendronhq/dendron/commit/d432cc9e20ff8b9f6cefd7cc4c3a42b567ed9bc5))
* **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))
* **workspace:** disable certain decorations for long notes to avoid performance hit ([#1337](https://github.com/dendronhq/dendron/issues/1337)) ([f1c46f9](https://github.com/dendronhq/dendron/commit/f1c46f95c228ada2126ec7212cede3bf5acc773d))
* direct children query ([#1303](https://github.com/dendronhq/dendron/issues/1303)) ([bcf0dea](https://github.com/dendronhq/dendron/commit/bcf0deae422406564cd9a56c1765f90dd2e66215))
* issue with webpack devCLI ([a4ff4c9](https://github.com/dendronhq/dendron/commit/a4ff4c9ae28ff31ab6f9483c339ae78b5144e185))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))
* stop calendar from auto expanding when the last note is closed ([#1299](https://github.com/dendronhq/dendron/issues/1299)) ([9c8f853](https://github.com/dendronhq/dendron/commit/9c8f8533da5027c122e0d003ce4c61dc866735f5))


### Features Dendron

* consolidate dendron configs ([#1295](https://github.com/dendronhq/dendron/issues/1295)) ([177ac92](https://github.com/dendronhq/dendron/commit/177ac925a5442471f041ce5d991da52cecee6c9b))
* nextjs publishing fulltext search ([#1334](https://github.com/dendronhq/dendron/issues/1334)) ([68f8473](https://github.com/dendronhq/dendron/commit/68f8473badf22494c8d0758f8195e377235321f6))
* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* user tags ([#1228](https://github.com/dendronhq/dendron/issues/1228)) ([98c0106](https://github.com/dendronhq/dendron/commit/98c0106367e384c130a927484b9ea294eb6f84fa))



## 0.55.2 (2021-08-21)


### Bug Fixes

* wrong internal links in nextjs publishing ([#1165](https://github.com/dendronhq/dendron/issues/1165)) ([59a949d](https://github.com/dendronhq/dendron/commit/59a949d2b5b541efb283e851060636b108eb5a98))



## 0.55.1 (2021-08-17)


### Bug Fixes

* multiple issues with lookupv3 ([1fdd9eb](https://github.com/dendronhq/dendron/commit/1fdd9eb3242b43539572a1993fefd174640c6d83))
* properly log error stack ([485e220](https://github.com/dendronhq/dendron/commit/485e220f8ffa6cd63210e106e846ff305b920b77))


### Features Dendron

* Insert Note Index command ([#1142](https://github.com/dendronhq/dendron/issues/1142)) ([c140015](https://github.com/dendronhq/dendron/commit/c140015c19a942cf4696d596e818fd89905eea25))
* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* undefined tags breaks note serialization ([b1d784c](https://github.com/dendronhq/dendron/commit/b1d784c8df18b3b45999f01c14793436ff669a3f))


### Features Dendron

* colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
* resolve vim keybinding conflict on initial install ([#1103](https://github.com/dendronhq/dendron/issues/1103)) ([2278c66](https://github.com/dendronhq/dendron/commit/2278c6616c8297cc414ad02d5323bff5c45072e4))
* **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))
* Add SchemaLookupCommand ([#1082](https://github.com/dendronhq/dendron/issues/1082)) ([fe11a0e](https://github.com/dendronhq/dendron/commit/fe11a0ea1e0214823dd01842b941456df164bc70))
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* generate json schema from config ([#1100](https://github.com/dendronhq/dendron/issues/1100)) ([53b189e](https://github.com/dendronhq/dendron/commit/53b189ec973a8d3d3ccf300a0e59908197f4efb1))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.66.1](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.66.1) (2021-11-03)


### Bug Fixes

* replace auto generated ids (coming from inline schemas) with patterns ([#1632](https://github.com/dendronhq/dendron/issues/1632)) ([af28cf6](https://github.com/dendronhq/dendron/commit/af28cf6ef1d085d22069695e9df128477c024d1b))
* **lookup:** hierarchy look up when inside parts of the hierarchy are omitted ([#1522](https://github.com/dendronhq/dendron/issues/1522)) ([6c30af5](https://github.com/dendronhq/dendron/commit/6c30af5e5b76297334f15a435fd1f9ad09941e06))
* **markdown:** email parsed as user tag & option to disable user tags and hashtags ([#1562](https://github.com/dendronhq/dendron/issues/1562)) ([fd56f7e](https://github.com/dendronhq/dendron/commit/fd56f7ece1651ea6433ebf481f2c54386ab6fb16))
* **markdown:** footnote links move view in publishing & preview ([#1568](https://github.com/dendronhq/dendron/issues/1568)) ([fbe659d](https://github.com/dendronhq/dendron/commit/fbe659d2be3d1f2534d7437d585e9fa38f1684da))
* backward compatibility of id matching adding '_' to id regex match. ([#1504](https://github.com/dendronhq/dendron/issues/1504)) ([4bbae40](https://github.com/dendronhq/dendron/commit/4bbae40d81ea064612f605c6f4e18ae8d34ba0de))


### Features Dendron

* **notes:** task notes (create modifier & editor highlighting) ([#1583](https://github.com/dendronhq/dendron/issues/1583)) ([e785efa](https://github.com/dendronhq/dendron/commit/e785efa8e2ce55bc39fb90cf34984d55035dd6ca))
* **workspace:** convert vault command ([#1542](https://github.com/dendronhq/dendron/issues/1542)) ([c265e9d](https://github.com/dendronhq/dendron/commit/c265e9d2c238b5a6b3761f4c073140b1a0debe3a))



## 0.62.3 (2021-10-09)


### Bug Fixes

* template doesn't copy FM tags ([#1488](https://github.com/dendronhq/dendron/issues/1488)) ([0317699](https://github.com/dendronhq/dendron/commit/0317699ef9bfd4d77b1d3d05f8093e725ea5b2c3)), closes [#1481](https://github.com/dendronhq/dendron/issues/1481)
* **view:** enable anchor links to work in preview ([#1375](https://github.com/dendronhq/dendron/issues/1375)) ([f27cfb0](https://github.com/dendronhq/dendron/commit/f27cfb07d612e28fd0d6dd08019d772767900bba))
* preview caching invalidation when notes with ![[ref]] links change ([#1385](https://github.com/dendronhq/dendron/issues/1385)) ([efeef86](https://github.com/dendronhq/dendron/commit/efeef8662ec52e64ba33cae9b1196bba6cc82f95))
* **publish:** bad seo props setter ([373d933](https://github.com/dendronhq/dendron/commit/373d9331aba3b3385632f01661dd6c80835ec5ac))


### Features Dendron

* Lapsed user survey ([#1446](https://github.com/dendronhq/dendron/issues/1446)) ([8094d2b](https://github.com/dendronhq/dendron/commit/8094d2bb1972fecf4fde74e8c5644aeba3eec119)), closes [#1349](https://github.com/dendronhq/dendron/issues/1349)
* **publish:** add table of contents ([#1428](https://github.com/dendronhq/dendron/issues/1428)) ([df4b05b](https://github.com/dendronhq/dendron/commit/df4b05ba8526dc32362d6a59543d880f253f02fc))



# 0.61.0 (2021-09-28)


### Bug Fixes

* **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))
* support activation for older vscode version ([#1426](https://github.com/dendronhq/dendron/issues/1426)) ([5a1c7ed](https://github.com/dendronhq/dendron/commit/5a1c7ed9b45df2f00e61229c0776dad41cc29aba))


### Features Dendron

* **workspace:** add survey for new users([#1409](https://github.com/dendronhq/dendron/issues/1409)) ([e2b1754](https://github.com/dendronhq/dendron/commit/e2b17548fbbe3dffef961eb393f82a6a876940e7))



## 0.60.2 (2021-09-25)



## 0.60.2-alpha.0 (2021-09-24)



## 0.60.1 (2021-09-24)


### Bug Fixes

* pesky error popup when schema lookup is closed ([#1389](https://github.com/dendronhq/dendron/issues/1389)) ([4d2bb40](https://github.com/dendronhq/dendron/commit/4d2bb401b17e926dc2eaa11957536f0c75a1e538))
* single letter look up matches ([#1388](https://github.com/dendronhq/dendron/issues/1388)) ([7de9a71](https://github.com/dendronhq/dendron/commit/7de9a7195a02399b1285b51ef08d6853b1f390f6))



# 0.60.0 (2021-09-21)


### Bug Fixes

* **commands:** rename note leaves incorrect metadata if parent is a stub ([#1348](https://github.com/dendronhq/dendron/issues/1348)) ([d432cc9](https://github.com/dendronhq/dendron/commit/d432cc9e20ff8b9f6cefd7cc4c3a42b567ed9bc5))
* **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))
* **workspace:** disable certain decorations for long notes to avoid performance hit ([#1337](https://github.com/dendronhq/dendron/issues/1337)) ([f1c46f9](https://github.com/dendronhq/dendron/commit/f1c46f95c228ada2126ec7212cede3bf5acc773d))
* direct children query ([#1303](https://github.com/dendronhq/dendron/issues/1303)) ([bcf0dea](https://github.com/dendronhq/dendron/commit/bcf0deae422406564cd9a56c1765f90dd2e66215))
* issue with webpack devCLI ([a4ff4c9](https://github.com/dendronhq/dendron/commit/a4ff4c9ae28ff31ab6f9483c339ae78b5144e185))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))
* stop calendar from auto expanding when the last note is closed ([#1299](https://github.com/dendronhq/dendron/issues/1299)) ([9c8f853](https://github.com/dendronhq/dendron/commit/9c8f8533da5027c122e0d003ce4c61dc866735f5))


### Features Dendron

* consolidate dendron configs ([#1295](https://github.com/dendronhq/dendron/issues/1295)) ([177ac92](https://github.com/dendronhq/dendron/commit/177ac925a5442471f041ce5d991da52cecee6c9b))
* nextjs publishing fulltext search ([#1334](https://github.com/dendronhq/dendron/issues/1334)) ([68f8473](https://github.com/dendronhq/dendron/commit/68f8473badf22494c8d0758f8195e377235321f6))
* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* user tags ([#1228](https://github.com/dendronhq/dendron/issues/1228)) ([98c0106](https://github.com/dendronhq/dendron/commit/98c0106367e384c130a927484b9ea294eb6f84fa))



## 0.55.2 (2021-08-21)


### Bug Fixes

* wrong internal links in nextjs publishing ([#1165](https://github.com/dendronhq/dendron/issues/1165)) ([59a949d](https://github.com/dendronhq/dendron/commit/59a949d2b5b541efb283e851060636b108eb5a98))



## 0.55.1 (2021-08-17)


### Bug Fixes

* multiple issues with lookupv3 ([1fdd9eb](https://github.com/dendronhq/dendron/commit/1fdd9eb3242b43539572a1993fefd174640c6d83))
* properly log error stack ([485e220](https://github.com/dendronhq/dendron/commit/485e220f8ffa6cd63210e106e846ff305b920b77))


### Features Dendron

* Insert Note Index command ([#1142](https://github.com/dendronhq/dendron/issues/1142)) ([c140015](https://github.com/dendronhq/dendron/commit/c140015c19a942cf4696d596e818fd89905eea25))
* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* undefined tags breaks note serialization ([b1d784c](https://github.com/dendronhq/dendron/commit/b1d784c8df18b3b45999f01c14793436ff669a3f))


### Features Dendron

* colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
* resolve vim keybinding conflict on initial install ([#1103](https://github.com/dendronhq/dendron/issues/1103)) ([2278c66](https://github.com/dendronhq/dendron/commit/2278c6616c8297cc414ad02d5323bff5c45072e4))
* **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))
* Add SchemaLookupCommand ([#1082](https://github.com/dendronhq/dendron/issues/1082)) ([fe11a0e](https://github.com/dendronhq/dendron/commit/fe11a0ea1e0214823dd01842b941456df164bc70))
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* generate json schema from config ([#1100](https://github.com/dendronhq/dendron/issues/1100)) ([53b189e](https://github.com/dendronhq/dendron/commit/53b189ec973a8d3d3ccf300a0e59908197f4efb1))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





# [0.66.0](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.66.0) (2021-11-03)


### Bug Fixes

* replace auto generated ids (coming from inline schemas) with patterns ([#1632](https://github.com/dendronhq/dendron/issues/1632)) ([af28cf6](https://github.com/dendronhq/dendron/commit/af28cf6ef1d085d22069695e9df128477c024d1b))
* **lookup:** hierarchy look up when inside parts of the hierarchy are omitted ([#1522](https://github.com/dendronhq/dendron/issues/1522)) ([6c30af5](https://github.com/dendronhq/dendron/commit/6c30af5e5b76297334f15a435fd1f9ad09941e06))
* **markdown:** email parsed as user tag & option to disable user tags and hashtags ([#1562](https://github.com/dendronhq/dendron/issues/1562)) ([fd56f7e](https://github.com/dendronhq/dendron/commit/fd56f7ece1651ea6433ebf481f2c54386ab6fb16))
* **markdown:** footnote links move view in publishing & preview ([#1568](https://github.com/dendronhq/dendron/issues/1568)) ([fbe659d](https://github.com/dendronhq/dendron/commit/fbe659d2be3d1f2534d7437d585e9fa38f1684da))
* backward compatibility of id matching adding '_' to id regex match. ([#1504](https://github.com/dendronhq/dendron/issues/1504)) ([4bbae40](https://github.com/dendronhq/dendron/commit/4bbae40d81ea064612f605c6f4e18ae8d34ba0de))


### Features Dendron

* **notes:** task notes (create modifier & editor highlighting) ([#1583](https://github.com/dendronhq/dendron/issues/1583)) ([e785efa](https://github.com/dendronhq/dendron/commit/e785efa8e2ce55bc39fb90cf34984d55035dd6ca))
* **workspace:** convert vault command ([#1542](https://github.com/dendronhq/dendron/issues/1542)) ([c265e9d](https://github.com/dendronhq/dendron/commit/c265e9d2c238b5a6b3761f4c073140b1a0debe3a))



## 0.62.3 (2021-10-09)


### Bug Fixes

* template doesn't copy FM tags ([#1488](https://github.com/dendronhq/dendron/issues/1488)) ([0317699](https://github.com/dendronhq/dendron/commit/0317699ef9bfd4d77b1d3d05f8093e725ea5b2c3)), closes [#1481](https://github.com/dendronhq/dendron/issues/1481)
* **view:** enable anchor links to work in preview ([#1375](https://github.com/dendronhq/dendron/issues/1375)) ([f27cfb0](https://github.com/dendronhq/dendron/commit/f27cfb07d612e28fd0d6dd08019d772767900bba))
* preview caching invalidation when notes with ![[ref]] links change ([#1385](https://github.com/dendronhq/dendron/issues/1385)) ([efeef86](https://github.com/dendronhq/dendron/commit/efeef8662ec52e64ba33cae9b1196bba6cc82f95))
* **publish:** bad seo props setter ([373d933](https://github.com/dendronhq/dendron/commit/373d9331aba3b3385632f01661dd6c80835ec5ac))


### Features Dendron

* Lapsed user survey ([#1446](https://github.com/dendronhq/dendron/issues/1446)) ([8094d2b](https://github.com/dendronhq/dendron/commit/8094d2bb1972fecf4fde74e8c5644aeba3eec119)), closes [#1349](https://github.com/dendronhq/dendron/issues/1349)
* **publish:** add table of contents ([#1428](https://github.com/dendronhq/dendron/issues/1428)) ([df4b05b](https://github.com/dendronhq/dendron/commit/df4b05ba8526dc32362d6a59543d880f253f02fc))



# 0.61.0 (2021-09-28)


### Bug Fixes

* **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))
* support activation for older vscode version ([#1426](https://github.com/dendronhq/dendron/issues/1426)) ([5a1c7ed](https://github.com/dendronhq/dendron/commit/5a1c7ed9b45df2f00e61229c0776dad41cc29aba))


### Features Dendron

* **workspace:** add survey for new users([#1409](https://github.com/dendronhq/dendron/issues/1409)) ([e2b1754](https://github.com/dendronhq/dendron/commit/e2b17548fbbe3dffef961eb393f82a6a876940e7))



## 0.60.2 (2021-09-25)



## 0.60.2-alpha.0 (2021-09-24)



## 0.60.1 (2021-09-24)


### Bug Fixes

* pesky error popup when schema lookup is closed ([#1389](https://github.com/dendronhq/dendron/issues/1389)) ([4d2bb40](https://github.com/dendronhq/dendron/commit/4d2bb401b17e926dc2eaa11957536f0c75a1e538))
* single letter look up matches ([#1388](https://github.com/dendronhq/dendron/issues/1388)) ([7de9a71](https://github.com/dendronhq/dendron/commit/7de9a7195a02399b1285b51ef08d6853b1f390f6))



# 0.60.0 (2021-09-21)


### Bug Fixes

* **commands:** rename note leaves incorrect metadata if parent is a stub ([#1348](https://github.com/dendronhq/dendron/issues/1348)) ([d432cc9](https://github.com/dendronhq/dendron/commit/d432cc9e20ff8b9f6cefd7cc4c3a42b567ed9bc5))
* **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))
* **workspace:** disable certain decorations for long notes to avoid performance hit ([#1337](https://github.com/dendronhq/dendron/issues/1337)) ([f1c46f9](https://github.com/dendronhq/dendron/commit/f1c46f95c228ada2126ec7212cede3bf5acc773d))
* direct children query ([#1303](https://github.com/dendronhq/dendron/issues/1303)) ([bcf0dea](https://github.com/dendronhq/dendron/commit/bcf0deae422406564cd9a56c1765f90dd2e66215))
* issue with webpack devCLI ([a4ff4c9](https://github.com/dendronhq/dendron/commit/a4ff4c9ae28ff31ab6f9483c339ae78b5144e185))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))
* stop calendar from auto expanding when the last note is closed ([#1299](https://github.com/dendronhq/dendron/issues/1299)) ([9c8f853](https://github.com/dendronhq/dendron/commit/9c8f8533da5027c122e0d003ce4c61dc866735f5))


### Features Dendron

* consolidate dendron configs ([#1295](https://github.com/dendronhq/dendron/issues/1295)) ([177ac92](https://github.com/dendronhq/dendron/commit/177ac925a5442471f041ce5d991da52cecee6c9b))
* nextjs publishing fulltext search ([#1334](https://github.com/dendronhq/dendron/issues/1334)) ([68f8473](https://github.com/dendronhq/dendron/commit/68f8473badf22494c8d0758f8195e377235321f6))
* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* user tags ([#1228](https://github.com/dendronhq/dendron/issues/1228)) ([98c0106](https://github.com/dendronhq/dendron/commit/98c0106367e384c130a927484b9ea294eb6f84fa))



## 0.55.2 (2021-08-21)


### Bug Fixes

* wrong internal links in nextjs publishing ([#1165](https://github.com/dendronhq/dendron/issues/1165)) ([59a949d](https://github.com/dendronhq/dendron/commit/59a949d2b5b541efb283e851060636b108eb5a98))



## 0.55.1 (2021-08-17)


### Bug Fixes

* multiple issues with lookupv3 ([1fdd9eb](https://github.com/dendronhq/dendron/commit/1fdd9eb3242b43539572a1993fefd174640c6d83))
* properly log error stack ([485e220](https://github.com/dendronhq/dendron/commit/485e220f8ffa6cd63210e106e846ff305b920b77))


### Features Dendron

* Insert Note Index command ([#1142](https://github.com/dendronhq/dendron/issues/1142)) ([c140015](https://github.com/dendronhq/dendron/commit/c140015c19a942cf4696d596e818fd89905eea25))
* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* undefined tags breaks note serialization ([b1d784c](https://github.com/dendronhq/dendron/commit/b1d784c8df18b3b45999f01c14793436ff669a3f))


### Features Dendron

* colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
* resolve vim keybinding conflict on initial install ([#1103](https://github.com/dendronhq/dendron/issues/1103)) ([2278c66](https://github.com/dendronhq/dendron/commit/2278c6616c8297cc414ad02d5323bff5c45072e4))
* **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))
* Add SchemaLookupCommand ([#1082](https://github.com/dendronhq/dendron/issues/1082)) ([fe11a0e](https://github.com/dendronhq/dendron/commit/fe11a0ea1e0214823dd01842b941456df164bc70))
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* generate json schema from config ([#1100](https://github.com/dendronhq/dendron/issues/1100)) ([53b189e](https://github.com/dendronhq/dendron/commit/53b189ec973a8d3d3ccf300a0e59908197f4efb1))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.65.1](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.65.1) (2021-10-29)


### Bug Fixes

* **lookup:** hierarchy look up when inside parts of the hierarchy are omitted ([#1522](https://github.com/dendronhq/dendron/issues/1522)) ([6c30af5](https://github.com/dendronhq/dendron/commit/6c30af5e5b76297334f15a435fd1f9ad09941e06))
* **markdown:** email parsed as user tag & option to disable user tags and hashtags ([#1562](https://github.com/dendronhq/dendron/issues/1562)) ([fd56f7e](https://github.com/dendronhq/dendron/commit/fd56f7ece1651ea6433ebf481f2c54386ab6fb16))
* **markdown:** footnote links move view in publishing & preview ([#1568](https://github.com/dendronhq/dendron/issues/1568)) ([fbe659d](https://github.com/dendronhq/dendron/commit/fbe659d2be3d1f2534d7437d585e9fa38f1684da))
* backward compatibility of id matching adding '_' to id regex match. ([#1504](https://github.com/dendronhq/dendron/issues/1504)) ([4bbae40](https://github.com/dendronhq/dendron/commit/4bbae40d81ea064612f605c6f4e18ae8d34ba0de))


### Features Dendron

* **notes:** task notes (create modifier & editor highlighting) ([#1583](https://github.com/dendronhq/dendron/issues/1583)) ([e785efa](https://github.com/dendronhq/dendron/commit/e785efa8e2ce55bc39fb90cf34984d55035dd6ca))
* **workspace:** convert vault command ([#1542](https://github.com/dendronhq/dendron/issues/1542)) ([c265e9d](https://github.com/dendronhq/dendron/commit/c265e9d2c238b5a6b3761f4c073140b1a0debe3a))



## 0.62.3 (2021-10-09)


### Bug Fixes

* template doesn't copy FM tags ([#1488](https://github.com/dendronhq/dendron/issues/1488)) ([0317699](https://github.com/dendronhq/dendron/commit/0317699ef9bfd4d77b1d3d05f8093e725ea5b2c3)), closes [#1481](https://github.com/dendronhq/dendron/issues/1481)
* **view:** enable anchor links to work in preview ([#1375](https://github.com/dendronhq/dendron/issues/1375)) ([f27cfb0](https://github.com/dendronhq/dendron/commit/f27cfb07d612e28fd0d6dd08019d772767900bba))
* preview caching invalidation when notes with ![[ref]] links change ([#1385](https://github.com/dendronhq/dendron/issues/1385)) ([efeef86](https://github.com/dendronhq/dendron/commit/efeef8662ec52e64ba33cae9b1196bba6cc82f95))
* **publish:** bad seo props setter ([373d933](https://github.com/dendronhq/dendron/commit/373d9331aba3b3385632f01661dd6c80835ec5ac))


### Features Dendron

* Lapsed user survey ([#1446](https://github.com/dendronhq/dendron/issues/1446)) ([8094d2b](https://github.com/dendronhq/dendron/commit/8094d2bb1972fecf4fde74e8c5644aeba3eec119)), closes [#1349](https://github.com/dendronhq/dendron/issues/1349)
* **publish:** add table of contents ([#1428](https://github.com/dendronhq/dendron/issues/1428)) ([df4b05b](https://github.com/dendronhq/dendron/commit/df4b05ba8526dc32362d6a59543d880f253f02fc))



# 0.61.0 (2021-09-28)


### Bug Fixes

* **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))
* support activation for older vscode version ([#1426](https://github.com/dendronhq/dendron/issues/1426)) ([5a1c7ed](https://github.com/dendronhq/dendron/commit/5a1c7ed9b45df2f00e61229c0776dad41cc29aba))


### Features Dendron

* **workspace:** add survey for new users([#1409](https://github.com/dendronhq/dendron/issues/1409)) ([e2b1754](https://github.com/dendronhq/dendron/commit/e2b17548fbbe3dffef961eb393f82a6a876940e7))



## 0.60.2 (2021-09-25)



## 0.60.2-alpha.0 (2021-09-24)



## 0.60.1 (2021-09-24)


### Bug Fixes

* pesky error popup when schema lookup is closed ([#1389](https://github.com/dendronhq/dendron/issues/1389)) ([4d2bb40](https://github.com/dendronhq/dendron/commit/4d2bb401b17e926dc2eaa11957536f0c75a1e538))
* single letter look up matches ([#1388](https://github.com/dendronhq/dendron/issues/1388)) ([7de9a71](https://github.com/dendronhq/dendron/commit/7de9a7195a02399b1285b51ef08d6853b1f390f6))



# 0.60.0 (2021-09-21)


### Bug Fixes

* **commands:** rename note leaves incorrect metadata if parent is a stub ([#1348](https://github.com/dendronhq/dendron/issues/1348)) ([d432cc9](https://github.com/dendronhq/dendron/commit/d432cc9e20ff8b9f6cefd7cc4c3a42b567ed9bc5))
* **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))
* **workspace:** disable certain decorations for long notes to avoid performance hit ([#1337](https://github.com/dendronhq/dendron/issues/1337)) ([f1c46f9](https://github.com/dendronhq/dendron/commit/f1c46f95c228ada2126ec7212cede3bf5acc773d))
* direct children query ([#1303](https://github.com/dendronhq/dendron/issues/1303)) ([bcf0dea](https://github.com/dendronhq/dendron/commit/bcf0deae422406564cd9a56c1765f90dd2e66215))
* issue with webpack devCLI ([a4ff4c9](https://github.com/dendronhq/dendron/commit/a4ff4c9ae28ff31ab6f9483c339ae78b5144e185))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))
* stop calendar from auto expanding when the last note is closed ([#1299](https://github.com/dendronhq/dendron/issues/1299)) ([9c8f853](https://github.com/dendronhq/dendron/commit/9c8f8533da5027c122e0d003ce4c61dc866735f5))


### Features Dendron

* consolidate dendron configs ([#1295](https://github.com/dendronhq/dendron/issues/1295)) ([177ac92](https://github.com/dendronhq/dendron/commit/177ac925a5442471f041ce5d991da52cecee6c9b))
* nextjs publishing fulltext search ([#1334](https://github.com/dendronhq/dendron/issues/1334)) ([68f8473](https://github.com/dendronhq/dendron/commit/68f8473badf22494c8d0758f8195e377235321f6))
* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* user tags ([#1228](https://github.com/dendronhq/dendron/issues/1228)) ([98c0106](https://github.com/dendronhq/dendron/commit/98c0106367e384c130a927484b9ea294eb6f84fa))



## 0.55.2 (2021-08-21)


### Bug Fixes

* wrong internal links in nextjs publishing ([#1165](https://github.com/dendronhq/dendron/issues/1165)) ([59a949d](https://github.com/dendronhq/dendron/commit/59a949d2b5b541efb283e851060636b108eb5a98))



## 0.55.1 (2021-08-17)


### Bug Fixes

* multiple issues with lookupv3 ([1fdd9eb](https://github.com/dendronhq/dendron/commit/1fdd9eb3242b43539572a1993fefd174640c6d83))
* properly log error stack ([485e220](https://github.com/dendronhq/dendron/commit/485e220f8ffa6cd63210e106e846ff305b920b77))


### Features Dendron

* Insert Note Index command ([#1142](https://github.com/dendronhq/dendron/issues/1142)) ([c140015](https://github.com/dendronhq/dendron/commit/c140015c19a942cf4696d596e818fd89905eea25))
* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* undefined tags breaks note serialization ([b1d784c](https://github.com/dendronhq/dendron/commit/b1d784c8df18b3b45999f01c14793436ff669a3f))


### Features Dendron

* colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
* resolve vim keybinding conflict on initial install ([#1103](https://github.com/dendronhq/dendron/issues/1103)) ([2278c66](https://github.com/dendronhq/dendron/commit/2278c6616c8297cc414ad02d5323bff5c45072e4))
* **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))
* Add SchemaLookupCommand ([#1082](https://github.com/dendronhq/dendron/issues/1082)) ([fe11a0e](https://github.com/dendronhq/dendron/commit/fe11a0ea1e0214823dd01842b941456df164bc70))
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* generate json schema from config ([#1100](https://github.com/dendronhq/dendron/issues/1100)) ([53b189e](https://github.com/dendronhq/dendron/commit/53b189ec973a8d3d3ccf300a0e59908197f4efb1))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





# [0.65.0](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.65.0) (2021-10-26)


### Bug Fixes

* **lookup:** hierarchy look up when inside parts of the hierarchy are omitted ([#1522](https://github.com/dendronhq/dendron/issues/1522)) ([6c30af5](https://github.com/dendronhq/dendron/commit/6c30af5e5b76297334f15a435fd1f9ad09941e06))
* **markdown:** email parsed as user tag & option to disable user tags and hashtags ([#1562](https://github.com/dendronhq/dendron/issues/1562)) ([fd56f7e](https://github.com/dendronhq/dendron/commit/fd56f7ece1651ea6433ebf481f2c54386ab6fb16))
* **markdown:** footnote links move view in publishing & preview ([#1568](https://github.com/dendronhq/dendron/issues/1568)) ([fbe659d](https://github.com/dendronhq/dendron/commit/fbe659d2be3d1f2534d7437d585e9fa38f1684da))
* backward compatibility of id matching adding '_' to id regex match. ([#1504](https://github.com/dendronhq/dendron/issues/1504)) ([4bbae40](https://github.com/dendronhq/dendron/commit/4bbae40d81ea064612f605c6f4e18ae8d34ba0de))



## 0.62.3 (2021-10-09)


### Bug Fixes

* template doesn't copy FM tags ([#1488](https://github.com/dendronhq/dendron/issues/1488)) ([0317699](https://github.com/dendronhq/dendron/commit/0317699ef9bfd4d77b1d3d05f8093e725ea5b2c3)), closes [#1481](https://github.com/dendronhq/dendron/issues/1481)
* **view:** enable anchor links to work in preview ([#1375](https://github.com/dendronhq/dendron/issues/1375)) ([f27cfb0](https://github.com/dendronhq/dendron/commit/f27cfb07d612e28fd0d6dd08019d772767900bba))
* preview caching invalidation when notes with ![[ref]] links change ([#1385](https://github.com/dendronhq/dendron/issues/1385)) ([efeef86](https://github.com/dendronhq/dendron/commit/efeef8662ec52e64ba33cae9b1196bba6cc82f95))
* **publish:** bad seo props setter ([373d933](https://github.com/dendronhq/dendron/commit/373d9331aba3b3385632f01661dd6c80835ec5ac))


### Features Dendron

* Lapsed user survey ([#1446](https://github.com/dendronhq/dendron/issues/1446)) ([8094d2b](https://github.com/dendronhq/dendron/commit/8094d2bb1972fecf4fde74e8c5644aeba3eec119)), closes [#1349](https://github.com/dendronhq/dendron/issues/1349)
* **publish:** add table of contents ([#1428](https://github.com/dendronhq/dendron/issues/1428)) ([df4b05b](https://github.com/dendronhq/dendron/commit/df4b05ba8526dc32362d6a59543d880f253f02fc))



# 0.61.0 (2021-09-28)


### Bug Fixes

* **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))
* support activation for older vscode version ([#1426](https://github.com/dendronhq/dendron/issues/1426)) ([5a1c7ed](https://github.com/dendronhq/dendron/commit/5a1c7ed9b45df2f00e61229c0776dad41cc29aba))


### Features Dendron

* **workspace:** add survey for new users([#1409](https://github.com/dendronhq/dendron/issues/1409)) ([e2b1754](https://github.com/dendronhq/dendron/commit/e2b17548fbbe3dffef961eb393f82a6a876940e7))



## 0.60.2 (2021-09-25)



## 0.60.2-alpha.0 (2021-09-24)



## 0.60.1 (2021-09-24)


### Bug Fixes

* pesky error popup when schema lookup is closed ([#1389](https://github.com/dendronhq/dendron/issues/1389)) ([4d2bb40](https://github.com/dendronhq/dendron/commit/4d2bb401b17e926dc2eaa11957536f0c75a1e538))
* single letter look up matches ([#1388](https://github.com/dendronhq/dendron/issues/1388)) ([7de9a71](https://github.com/dendronhq/dendron/commit/7de9a7195a02399b1285b51ef08d6853b1f390f6))



# 0.60.0 (2021-09-21)


### Bug Fixes

* **commands:** rename note leaves incorrect metadata if parent is a stub ([#1348](https://github.com/dendronhq/dendron/issues/1348)) ([d432cc9](https://github.com/dendronhq/dendron/commit/d432cc9e20ff8b9f6cefd7cc4c3a42b567ed9bc5))
* **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))
* **workspace:** disable certain decorations for long notes to avoid performance hit ([#1337](https://github.com/dendronhq/dendron/issues/1337)) ([f1c46f9](https://github.com/dendronhq/dendron/commit/f1c46f95c228ada2126ec7212cede3bf5acc773d))
* direct children query ([#1303](https://github.com/dendronhq/dendron/issues/1303)) ([bcf0dea](https://github.com/dendronhq/dendron/commit/bcf0deae422406564cd9a56c1765f90dd2e66215))
* issue with webpack devCLI ([a4ff4c9](https://github.com/dendronhq/dendron/commit/a4ff4c9ae28ff31ab6f9483c339ae78b5144e185))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))
* stop calendar from auto expanding when the last note is closed ([#1299](https://github.com/dendronhq/dendron/issues/1299)) ([9c8f853](https://github.com/dendronhq/dendron/commit/9c8f8533da5027c122e0d003ce4c61dc866735f5))


### Features Dendron

* consolidate dendron configs ([#1295](https://github.com/dendronhq/dendron/issues/1295)) ([177ac92](https://github.com/dendronhq/dendron/commit/177ac925a5442471f041ce5d991da52cecee6c9b))
* nextjs publishing fulltext search ([#1334](https://github.com/dendronhq/dendron/issues/1334)) ([68f8473](https://github.com/dendronhq/dendron/commit/68f8473badf22494c8d0758f8195e377235321f6))
* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* user tags ([#1228](https://github.com/dendronhq/dendron/issues/1228)) ([98c0106](https://github.com/dendronhq/dendron/commit/98c0106367e384c130a927484b9ea294eb6f84fa))



## 0.55.2 (2021-08-21)


### Bug Fixes

* wrong internal links in nextjs publishing ([#1165](https://github.com/dendronhq/dendron/issues/1165)) ([59a949d](https://github.com/dendronhq/dendron/commit/59a949d2b5b541efb283e851060636b108eb5a98))



## 0.55.1 (2021-08-17)


### Bug Fixes

* multiple issues with lookupv3 ([1fdd9eb](https://github.com/dendronhq/dendron/commit/1fdd9eb3242b43539572a1993fefd174640c6d83))
* properly log error stack ([485e220](https://github.com/dendronhq/dendron/commit/485e220f8ffa6cd63210e106e846ff305b920b77))


### Features Dendron

* Insert Note Index command ([#1142](https://github.com/dendronhq/dendron/issues/1142)) ([c140015](https://github.com/dendronhq/dendron/commit/c140015c19a942cf4696d596e818fd89905eea25))
* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* undefined tags breaks note serialization ([b1d784c](https://github.com/dendronhq/dendron/commit/b1d784c8df18b3b45999f01c14793436ff669a3f))


### Features Dendron

* colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
* resolve vim keybinding conflict on initial install ([#1103](https://github.com/dendronhq/dendron/issues/1103)) ([2278c66](https://github.com/dendronhq/dendron/commit/2278c6616c8297cc414ad02d5323bff5c45072e4))
* **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))
* Add SchemaLookupCommand ([#1082](https://github.com/dendronhq/dendron/issues/1082)) ([fe11a0e](https://github.com/dendronhq/dendron/commit/fe11a0ea1e0214823dd01842b941456df164bc70))
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* generate json schema from config ([#1100](https://github.com/dendronhq/dendron/issues/1100)) ([53b189e](https://github.com/dendronhq/dendron/commit/53b189ec973a8d3d3ccf300a0e59908197f4efb1))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.64.2](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.64.2) (2021-10-23)


### Bug Fixes

* **lookup:** hierarchy look up when inside parts of the hierarchy are omitted ([#1522](https://github.com/dendronhq/dendron/issues/1522)) ([6c30af5](https://github.com/dendronhq/dendron/commit/6c30af5e5b76297334f15a435fd1f9ad09941e06))
* backward compatibility of id matching adding '_' to id regex match. ([#1504](https://github.com/dendronhq/dendron/issues/1504)) ([4bbae40](https://github.com/dendronhq/dendron/commit/4bbae40d81ea064612f605c6f4e18ae8d34ba0de))



## 0.62.3 (2021-10-09)


### Bug Fixes

* template doesn't copy FM tags ([#1488](https://github.com/dendronhq/dendron/issues/1488)) ([0317699](https://github.com/dendronhq/dendron/commit/0317699ef9bfd4d77b1d3d05f8093e725ea5b2c3)), closes [#1481](https://github.com/dendronhq/dendron/issues/1481)
* **view:** enable anchor links to work in preview ([#1375](https://github.com/dendronhq/dendron/issues/1375)) ([f27cfb0](https://github.com/dendronhq/dendron/commit/f27cfb07d612e28fd0d6dd08019d772767900bba))
* preview caching invalidation when notes with ![[ref]] links change ([#1385](https://github.com/dendronhq/dendron/issues/1385)) ([efeef86](https://github.com/dendronhq/dendron/commit/efeef8662ec52e64ba33cae9b1196bba6cc82f95))
* **publish:** bad seo props setter ([373d933](https://github.com/dendronhq/dendron/commit/373d9331aba3b3385632f01661dd6c80835ec5ac))


### Features Dendron

* Lapsed user survey ([#1446](https://github.com/dendronhq/dendron/issues/1446)) ([8094d2b](https://github.com/dendronhq/dendron/commit/8094d2bb1972fecf4fde74e8c5644aeba3eec119)), closes [#1349](https://github.com/dendronhq/dendron/issues/1349)
* **publish:** add table of contents ([#1428](https://github.com/dendronhq/dendron/issues/1428)) ([df4b05b](https://github.com/dendronhq/dendron/commit/df4b05ba8526dc32362d6a59543d880f253f02fc))



# 0.61.0 (2021-09-28)


### Bug Fixes

* **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))
* support activation for older vscode version ([#1426](https://github.com/dendronhq/dendron/issues/1426)) ([5a1c7ed](https://github.com/dendronhq/dendron/commit/5a1c7ed9b45df2f00e61229c0776dad41cc29aba))


### Features Dendron

* **workspace:** add survey for new users([#1409](https://github.com/dendronhq/dendron/issues/1409)) ([e2b1754](https://github.com/dendronhq/dendron/commit/e2b17548fbbe3dffef961eb393f82a6a876940e7))



## 0.60.2 (2021-09-25)



## 0.60.2-alpha.0 (2021-09-24)



## 0.60.1 (2021-09-24)


### Bug Fixes

* pesky error popup when schema lookup is closed ([#1389](https://github.com/dendronhq/dendron/issues/1389)) ([4d2bb40](https://github.com/dendronhq/dendron/commit/4d2bb401b17e926dc2eaa11957536f0c75a1e538))
* single letter look up matches ([#1388](https://github.com/dendronhq/dendron/issues/1388)) ([7de9a71](https://github.com/dendronhq/dendron/commit/7de9a7195a02399b1285b51ef08d6853b1f390f6))



# 0.60.0 (2021-09-21)


### Bug Fixes

* **commands:** rename note leaves incorrect metadata if parent is a stub ([#1348](https://github.com/dendronhq/dendron/issues/1348)) ([d432cc9](https://github.com/dendronhq/dendron/commit/d432cc9e20ff8b9f6cefd7cc4c3a42b567ed9bc5))
* **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))
* **workspace:** disable certain decorations for long notes to avoid performance hit ([#1337](https://github.com/dendronhq/dendron/issues/1337)) ([f1c46f9](https://github.com/dendronhq/dendron/commit/f1c46f95c228ada2126ec7212cede3bf5acc773d))
* direct children query ([#1303](https://github.com/dendronhq/dendron/issues/1303)) ([bcf0dea](https://github.com/dendronhq/dendron/commit/bcf0deae422406564cd9a56c1765f90dd2e66215))
* issue with webpack devCLI ([a4ff4c9](https://github.com/dendronhq/dendron/commit/a4ff4c9ae28ff31ab6f9483c339ae78b5144e185))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))
* stop calendar from auto expanding when the last note is closed ([#1299](https://github.com/dendronhq/dendron/issues/1299)) ([9c8f853](https://github.com/dendronhq/dendron/commit/9c8f8533da5027c122e0d003ce4c61dc866735f5))


### Features Dendron

* consolidate dendron configs ([#1295](https://github.com/dendronhq/dendron/issues/1295)) ([177ac92](https://github.com/dendronhq/dendron/commit/177ac925a5442471f041ce5d991da52cecee6c9b))
* nextjs publishing fulltext search ([#1334](https://github.com/dendronhq/dendron/issues/1334)) ([68f8473](https://github.com/dendronhq/dendron/commit/68f8473badf22494c8d0758f8195e377235321f6))
* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* user tags ([#1228](https://github.com/dendronhq/dendron/issues/1228)) ([98c0106](https://github.com/dendronhq/dendron/commit/98c0106367e384c130a927484b9ea294eb6f84fa))



## 0.55.2 (2021-08-21)


### Bug Fixes

* wrong internal links in nextjs publishing ([#1165](https://github.com/dendronhq/dendron/issues/1165)) ([59a949d](https://github.com/dendronhq/dendron/commit/59a949d2b5b541efb283e851060636b108eb5a98))



## 0.55.1 (2021-08-17)


### Bug Fixes

* multiple issues with lookupv3 ([1fdd9eb](https://github.com/dendronhq/dendron/commit/1fdd9eb3242b43539572a1993fefd174640c6d83))
* properly log error stack ([485e220](https://github.com/dendronhq/dendron/commit/485e220f8ffa6cd63210e106e846ff305b920b77))


### Features Dendron

* Insert Note Index command ([#1142](https://github.com/dendronhq/dendron/issues/1142)) ([c140015](https://github.com/dendronhq/dendron/commit/c140015c19a942cf4696d596e818fd89905eea25))
* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* undefined tags breaks note serialization ([b1d784c](https://github.com/dendronhq/dendron/commit/b1d784c8df18b3b45999f01c14793436ff669a3f))


### Features Dendron

* colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
* resolve vim keybinding conflict on initial install ([#1103](https://github.com/dendronhq/dendron/issues/1103)) ([2278c66](https://github.com/dendronhq/dendron/commit/2278c6616c8297cc414ad02d5323bff5c45072e4))
* **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))
* Add SchemaLookupCommand ([#1082](https://github.com/dendronhq/dendron/issues/1082)) ([fe11a0e](https://github.com/dendronhq/dendron/commit/fe11a0ea1e0214823dd01842b941456df164bc70))
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* generate json schema from config ([#1100](https://github.com/dendronhq/dendron/issues/1100)) ([53b189e](https://github.com/dendronhq/dendron/commit/53b189ec973a8d3d3ccf300a0e59908197f4efb1))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.64.1](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.64.1) (2021-10-22)


### Bug Fixes

* **lookup:** hierarchy look up when inside parts of the hierarchy are omitted ([#1522](https://github.com/dendronhq/dendron/issues/1522)) ([6c30af5](https://github.com/dendronhq/dendron/commit/6c30af5e5b76297334f15a435fd1f9ad09941e06))
* backward compatibility of id matching adding '_' to id regex match. ([#1504](https://github.com/dendronhq/dendron/issues/1504)) ([4bbae40](https://github.com/dendronhq/dendron/commit/4bbae40d81ea064612f605c6f4e18ae8d34ba0de))



## 0.62.3 (2021-10-09)


### Bug Fixes

* template doesn't copy FM tags ([#1488](https://github.com/dendronhq/dendron/issues/1488)) ([0317699](https://github.com/dendronhq/dendron/commit/0317699ef9bfd4d77b1d3d05f8093e725ea5b2c3)), closes [#1481](https://github.com/dendronhq/dendron/issues/1481)
* **view:** enable anchor links to work in preview ([#1375](https://github.com/dendronhq/dendron/issues/1375)) ([f27cfb0](https://github.com/dendronhq/dendron/commit/f27cfb07d612e28fd0d6dd08019d772767900bba))
* preview caching invalidation when notes with ![[ref]] links change ([#1385](https://github.com/dendronhq/dendron/issues/1385)) ([efeef86](https://github.com/dendronhq/dendron/commit/efeef8662ec52e64ba33cae9b1196bba6cc82f95))
* **publish:** bad seo props setter ([373d933](https://github.com/dendronhq/dendron/commit/373d9331aba3b3385632f01661dd6c80835ec5ac))


### Features Dendron

* Lapsed user survey ([#1446](https://github.com/dendronhq/dendron/issues/1446)) ([8094d2b](https://github.com/dendronhq/dendron/commit/8094d2bb1972fecf4fde74e8c5644aeba3eec119)), closes [#1349](https://github.com/dendronhq/dendron/issues/1349)
* **publish:** add table of contents ([#1428](https://github.com/dendronhq/dendron/issues/1428)) ([df4b05b](https://github.com/dendronhq/dendron/commit/df4b05ba8526dc32362d6a59543d880f253f02fc))



# 0.61.0 (2021-09-28)


### Bug Fixes

* **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))
* support activation for older vscode version ([#1426](https://github.com/dendronhq/dendron/issues/1426)) ([5a1c7ed](https://github.com/dendronhq/dendron/commit/5a1c7ed9b45df2f00e61229c0776dad41cc29aba))


### Features Dendron

* **workspace:** add survey for new users([#1409](https://github.com/dendronhq/dendron/issues/1409)) ([e2b1754](https://github.com/dendronhq/dendron/commit/e2b17548fbbe3dffef961eb393f82a6a876940e7))



## 0.60.2 (2021-09-25)



## 0.60.2-alpha.0 (2021-09-24)



## 0.60.1 (2021-09-24)


### Bug Fixes

* pesky error popup when schema lookup is closed ([#1389](https://github.com/dendronhq/dendron/issues/1389)) ([4d2bb40](https://github.com/dendronhq/dendron/commit/4d2bb401b17e926dc2eaa11957536f0c75a1e538))
* single letter look up matches ([#1388](https://github.com/dendronhq/dendron/issues/1388)) ([7de9a71](https://github.com/dendronhq/dendron/commit/7de9a7195a02399b1285b51ef08d6853b1f390f6))



# 0.60.0 (2021-09-21)


### Bug Fixes

* **commands:** rename note leaves incorrect metadata if parent is a stub ([#1348](https://github.com/dendronhq/dendron/issues/1348)) ([d432cc9](https://github.com/dendronhq/dendron/commit/d432cc9e20ff8b9f6cefd7cc4c3a42b567ed9bc5))
* **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))
* **workspace:** disable certain decorations for long notes to avoid performance hit ([#1337](https://github.com/dendronhq/dendron/issues/1337)) ([f1c46f9](https://github.com/dendronhq/dendron/commit/f1c46f95c228ada2126ec7212cede3bf5acc773d))
* direct children query ([#1303](https://github.com/dendronhq/dendron/issues/1303)) ([bcf0dea](https://github.com/dendronhq/dendron/commit/bcf0deae422406564cd9a56c1765f90dd2e66215))
* issue with webpack devCLI ([a4ff4c9](https://github.com/dendronhq/dendron/commit/a4ff4c9ae28ff31ab6f9483c339ae78b5144e185))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))
* stop calendar from auto expanding when the last note is closed ([#1299](https://github.com/dendronhq/dendron/issues/1299)) ([9c8f853](https://github.com/dendronhq/dendron/commit/9c8f8533da5027c122e0d003ce4c61dc866735f5))


### Features Dendron

* consolidate dendron configs ([#1295](https://github.com/dendronhq/dendron/issues/1295)) ([177ac92](https://github.com/dendronhq/dendron/commit/177ac925a5442471f041ce5d991da52cecee6c9b))
* nextjs publishing fulltext search ([#1334](https://github.com/dendronhq/dendron/issues/1334)) ([68f8473](https://github.com/dendronhq/dendron/commit/68f8473badf22494c8d0758f8195e377235321f6))
* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* user tags ([#1228](https://github.com/dendronhq/dendron/issues/1228)) ([98c0106](https://github.com/dendronhq/dendron/commit/98c0106367e384c130a927484b9ea294eb6f84fa))



## 0.55.2 (2021-08-21)


### Bug Fixes

* wrong internal links in nextjs publishing ([#1165](https://github.com/dendronhq/dendron/issues/1165)) ([59a949d](https://github.com/dendronhq/dendron/commit/59a949d2b5b541efb283e851060636b108eb5a98))



## 0.55.1 (2021-08-17)


### Bug Fixes

* multiple issues with lookupv3 ([1fdd9eb](https://github.com/dendronhq/dendron/commit/1fdd9eb3242b43539572a1993fefd174640c6d83))
* properly log error stack ([485e220](https://github.com/dendronhq/dendron/commit/485e220f8ffa6cd63210e106e846ff305b920b77))


### Features Dendron

* Insert Note Index command ([#1142](https://github.com/dendronhq/dendron/issues/1142)) ([c140015](https://github.com/dendronhq/dendron/commit/c140015c19a942cf4696d596e818fd89905eea25))
* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* undefined tags breaks note serialization ([b1d784c](https://github.com/dendronhq/dendron/commit/b1d784c8df18b3b45999f01c14793436ff669a3f))


### Features Dendron

* colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
* resolve vim keybinding conflict on initial install ([#1103](https://github.com/dendronhq/dendron/issues/1103)) ([2278c66](https://github.com/dendronhq/dendron/commit/2278c6616c8297cc414ad02d5323bff5c45072e4))
* **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))
* Add SchemaLookupCommand ([#1082](https://github.com/dendronhq/dendron/issues/1082)) ([fe11a0e](https://github.com/dendronhq/dendron/commit/fe11a0ea1e0214823dd01842b941456df164bc70))
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* generate json schema from config ([#1100](https://github.com/dendronhq/dendron/issues/1100)) ([53b189e](https://github.com/dendronhq/dendron/commit/53b189ec973a8d3d3ccf300a0e59908197f4efb1))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





# [0.64.0](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.64.0) (2021-10-19)


### Bug Fixes

* **lookup:** hierarchy look up when inside parts of the hierarchy are omitted ([#1522](https://github.com/dendronhq/dendron/issues/1522)) ([6c30af5](https://github.com/dendronhq/dendron/commit/6c30af5e5b76297334f15a435fd1f9ad09941e06))
* backward compatibility of id matching adding '_' to id regex match. ([#1504](https://github.com/dendronhq/dendron/issues/1504)) ([4bbae40](https://github.com/dendronhq/dendron/commit/4bbae40d81ea064612f605c6f4e18ae8d34ba0de))



## 0.62.3 (2021-10-09)


### Bug Fixes

* template doesn't copy FM tags ([#1488](https://github.com/dendronhq/dendron/issues/1488)) ([0317699](https://github.com/dendronhq/dendron/commit/0317699ef9bfd4d77b1d3d05f8093e725ea5b2c3)), closes [#1481](https://github.com/dendronhq/dendron/issues/1481)
* **view:** enable anchor links to work in preview ([#1375](https://github.com/dendronhq/dendron/issues/1375)) ([f27cfb0](https://github.com/dendronhq/dendron/commit/f27cfb07d612e28fd0d6dd08019d772767900bba))
* preview caching invalidation when notes with ![[ref]] links change ([#1385](https://github.com/dendronhq/dendron/issues/1385)) ([efeef86](https://github.com/dendronhq/dendron/commit/efeef8662ec52e64ba33cae9b1196bba6cc82f95))
* **publish:** bad seo props setter ([373d933](https://github.com/dendronhq/dendron/commit/373d9331aba3b3385632f01661dd6c80835ec5ac))


### Features Dendron

* Lapsed user survey ([#1446](https://github.com/dendronhq/dendron/issues/1446)) ([8094d2b](https://github.com/dendronhq/dendron/commit/8094d2bb1972fecf4fde74e8c5644aeba3eec119)), closes [#1349](https://github.com/dendronhq/dendron/issues/1349)
* **publish:** add table of contents ([#1428](https://github.com/dendronhq/dendron/issues/1428)) ([df4b05b](https://github.com/dendronhq/dendron/commit/df4b05ba8526dc32362d6a59543d880f253f02fc))



# 0.61.0 (2021-09-28)


### Bug Fixes

* **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))
* support activation for older vscode version ([#1426](https://github.com/dendronhq/dendron/issues/1426)) ([5a1c7ed](https://github.com/dendronhq/dendron/commit/5a1c7ed9b45df2f00e61229c0776dad41cc29aba))


### Features Dendron

* **workspace:** add survey for new users([#1409](https://github.com/dendronhq/dendron/issues/1409)) ([e2b1754](https://github.com/dendronhq/dendron/commit/e2b17548fbbe3dffef961eb393f82a6a876940e7))



## 0.60.2 (2021-09-25)



## 0.60.2-alpha.0 (2021-09-24)



## 0.60.1 (2021-09-24)


### Bug Fixes

* pesky error popup when schema lookup is closed ([#1389](https://github.com/dendronhq/dendron/issues/1389)) ([4d2bb40](https://github.com/dendronhq/dendron/commit/4d2bb401b17e926dc2eaa11957536f0c75a1e538))
* single letter look up matches ([#1388](https://github.com/dendronhq/dendron/issues/1388)) ([7de9a71](https://github.com/dendronhq/dendron/commit/7de9a7195a02399b1285b51ef08d6853b1f390f6))



# 0.60.0 (2021-09-21)


### Bug Fixes

* **commands:** rename note leaves incorrect metadata if parent is a stub ([#1348](https://github.com/dendronhq/dendron/issues/1348)) ([d432cc9](https://github.com/dendronhq/dendron/commit/d432cc9e20ff8b9f6cefd7cc4c3a42b567ed9bc5))
* **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))
* **workspace:** disable certain decorations for long notes to avoid performance hit ([#1337](https://github.com/dendronhq/dendron/issues/1337)) ([f1c46f9](https://github.com/dendronhq/dendron/commit/f1c46f95c228ada2126ec7212cede3bf5acc773d))
* direct children query ([#1303](https://github.com/dendronhq/dendron/issues/1303)) ([bcf0dea](https://github.com/dendronhq/dendron/commit/bcf0deae422406564cd9a56c1765f90dd2e66215))
* issue with webpack devCLI ([a4ff4c9](https://github.com/dendronhq/dendron/commit/a4ff4c9ae28ff31ab6f9483c339ae78b5144e185))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))
* stop calendar from auto expanding when the last note is closed ([#1299](https://github.com/dendronhq/dendron/issues/1299)) ([9c8f853](https://github.com/dendronhq/dendron/commit/9c8f8533da5027c122e0d003ce4c61dc866735f5))


### Features Dendron

* consolidate dendron configs ([#1295](https://github.com/dendronhq/dendron/issues/1295)) ([177ac92](https://github.com/dendronhq/dendron/commit/177ac925a5442471f041ce5d991da52cecee6c9b))
* nextjs publishing fulltext search ([#1334](https://github.com/dendronhq/dendron/issues/1334)) ([68f8473](https://github.com/dendronhq/dendron/commit/68f8473badf22494c8d0758f8195e377235321f6))
* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* user tags ([#1228](https://github.com/dendronhq/dendron/issues/1228)) ([98c0106](https://github.com/dendronhq/dendron/commit/98c0106367e384c130a927484b9ea294eb6f84fa))



## 0.55.2 (2021-08-21)


### Bug Fixes

* wrong internal links in nextjs publishing ([#1165](https://github.com/dendronhq/dendron/issues/1165)) ([59a949d](https://github.com/dendronhq/dendron/commit/59a949d2b5b541efb283e851060636b108eb5a98))



## 0.55.1 (2021-08-17)


### Bug Fixes

* multiple issues with lookupv3 ([1fdd9eb](https://github.com/dendronhq/dendron/commit/1fdd9eb3242b43539572a1993fefd174640c6d83))
* properly log error stack ([485e220](https://github.com/dendronhq/dendron/commit/485e220f8ffa6cd63210e106e846ff305b920b77))


### Features Dendron

* Insert Note Index command ([#1142](https://github.com/dendronhq/dendron/issues/1142)) ([c140015](https://github.com/dendronhq/dendron/commit/c140015c19a942cf4696d596e818fd89905eea25))
* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* undefined tags breaks note serialization ([b1d784c](https://github.com/dendronhq/dendron/commit/b1d784c8df18b3b45999f01c14793436ff669a3f))


### Features Dendron

* colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
* resolve vim keybinding conflict on initial install ([#1103](https://github.com/dendronhq/dendron/issues/1103)) ([2278c66](https://github.com/dendronhq/dendron/commit/2278c6616c8297cc414ad02d5323bff5c45072e4))
* **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))
* Add SchemaLookupCommand ([#1082](https://github.com/dendronhq/dendron/issues/1082)) ([fe11a0e](https://github.com/dendronhq/dendron/commit/fe11a0ea1e0214823dd01842b941456df164bc70))
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* generate json schema from config ([#1100](https://github.com/dendronhq/dendron/issues/1100)) ([53b189e](https://github.com/dendronhq/dendron/commit/53b189ec973a8d3d3ccf300a0e59908197f4efb1))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.63.4-alpha.0](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.63.4-alpha.0) (2021-10-17)


### Bug Fixes

* **lookup:** hierarchy look up when inside parts of the hierarchy are omitted ([#1522](https://github.com/dendronhq/dendron/issues/1522)) ([6c30af5](https://github.com/dendronhq/dendron/commit/6c30af5e5b76297334f15a435fd1f9ad09941e06))
* backward compatibility of id matching adding '_' to id regex match. ([#1504](https://github.com/dendronhq/dendron/issues/1504)) ([4bbae40](https://github.com/dendronhq/dendron/commit/4bbae40d81ea064612f605c6f4e18ae8d34ba0de))



## 0.62.3 (2021-10-09)


### Bug Fixes

* template doesn't copy FM tags ([#1488](https://github.com/dendronhq/dendron/issues/1488)) ([0317699](https://github.com/dendronhq/dendron/commit/0317699ef9bfd4d77b1d3d05f8093e725ea5b2c3)), closes [#1481](https://github.com/dendronhq/dendron/issues/1481)
* **view:** enable anchor links to work in preview ([#1375](https://github.com/dendronhq/dendron/issues/1375)) ([f27cfb0](https://github.com/dendronhq/dendron/commit/f27cfb07d612e28fd0d6dd08019d772767900bba))
* preview caching invalidation when notes with ![[ref]] links change ([#1385](https://github.com/dendronhq/dendron/issues/1385)) ([efeef86](https://github.com/dendronhq/dendron/commit/efeef8662ec52e64ba33cae9b1196bba6cc82f95))
* **publish:** bad seo props setter ([373d933](https://github.com/dendronhq/dendron/commit/373d9331aba3b3385632f01661dd6c80835ec5ac))


### Features Dendron

* Lapsed user survey ([#1446](https://github.com/dendronhq/dendron/issues/1446)) ([8094d2b](https://github.com/dendronhq/dendron/commit/8094d2bb1972fecf4fde74e8c5644aeba3eec119)), closes [#1349](https://github.com/dendronhq/dendron/issues/1349)
* **publish:** add table of contents ([#1428](https://github.com/dendronhq/dendron/issues/1428)) ([df4b05b](https://github.com/dendronhq/dendron/commit/df4b05ba8526dc32362d6a59543d880f253f02fc))



# 0.61.0 (2021-09-28)


### Bug Fixes

* **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))
* support activation for older vscode version ([#1426](https://github.com/dendronhq/dendron/issues/1426)) ([5a1c7ed](https://github.com/dendronhq/dendron/commit/5a1c7ed9b45df2f00e61229c0776dad41cc29aba))


### Features Dendron

* **workspace:** add survey for new users([#1409](https://github.com/dendronhq/dendron/issues/1409)) ([e2b1754](https://github.com/dendronhq/dendron/commit/e2b17548fbbe3dffef961eb393f82a6a876940e7))



## 0.60.2 (2021-09-25)



## 0.60.2-alpha.0 (2021-09-24)



## 0.60.1 (2021-09-24)


### Bug Fixes

* pesky error popup when schema lookup is closed ([#1389](https://github.com/dendronhq/dendron/issues/1389)) ([4d2bb40](https://github.com/dendronhq/dendron/commit/4d2bb401b17e926dc2eaa11957536f0c75a1e538))
* single letter look up matches ([#1388](https://github.com/dendronhq/dendron/issues/1388)) ([7de9a71](https://github.com/dendronhq/dendron/commit/7de9a7195a02399b1285b51ef08d6853b1f390f6))



# 0.60.0 (2021-09-21)


### Bug Fixes

* **commands:** rename note leaves incorrect metadata if parent is a stub ([#1348](https://github.com/dendronhq/dendron/issues/1348)) ([d432cc9](https://github.com/dendronhq/dendron/commit/d432cc9e20ff8b9f6cefd7cc4c3a42b567ed9bc5))
* **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))
* **workspace:** disable certain decorations for long notes to avoid performance hit ([#1337](https://github.com/dendronhq/dendron/issues/1337)) ([f1c46f9](https://github.com/dendronhq/dendron/commit/f1c46f95c228ada2126ec7212cede3bf5acc773d))
* direct children query ([#1303](https://github.com/dendronhq/dendron/issues/1303)) ([bcf0dea](https://github.com/dendronhq/dendron/commit/bcf0deae422406564cd9a56c1765f90dd2e66215))
* issue with webpack devCLI ([a4ff4c9](https://github.com/dendronhq/dendron/commit/a4ff4c9ae28ff31ab6f9483c339ae78b5144e185))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))
* stop calendar from auto expanding when the last note is closed ([#1299](https://github.com/dendronhq/dendron/issues/1299)) ([9c8f853](https://github.com/dendronhq/dendron/commit/9c8f8533da5027c122e0d003ce4c61dc866735f5))


### Features Dendron

* consolidate dendron configs ([#1295](https://github.com/dendronhq/dendron/issues/1295)) ([177ac92](https://github.com/dendronhq/dendron/commit/177ac925a5442471f041ce5d991da52cecee6c9b))
* nextjs publishing fulltext search ([#1334](https://github.com/dendronhq/dendron/issues/1334)) ([68f8473](https://github.com/dendronhq/dendron/commit/68f8473badf22494c8d0758f8195e377235321f6))
* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* user tags ([#1228](https://github.com/dendronhq/dendron/issues/1228)) ([98c0106](https://github.com/dendronhq/dendron/commit/98c0106367e384c130a927484b9ea294eb6f84fa))



## 0.55.2 (2021-08-21)


### Bug Fixes

* wrong internal links in nextjs publishing ([#1165](https://github.com/dendronhq/dendron/issues/1165)) ([59a949d](https://github.com/dendronhq/dendron/commit/59a949d2b5b541efb283e851060636b108eb5a98))



## 0.55.1 (2021-08-17)


### Bug Fixes

* multiple issues with lookupv3 ([1fdd9eb](https://github.com/dendronhq/dendron/commit/1fdd9eb3242b43539572a1993fefd174640c6d83))
* properly log error stack ([485e220](https://github.com/dendronhq/dendron/commit/485e220f8ffa6cd63210e106e846ff305b920b77))


### Features Dendron

* Insert Note Index command ([#1142](https://github.com/dendronhq/dendron/issues/1142)) ([c140015](https://github.com/dendronhq/dendron/commit/c140015c19a942cf4696d596e818fd89905eea25))
* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* undefined tags breaks note serialization ([b1d784c](https://github.com/dendronhq/dendron/commit/b1d784c8df18b3b45999f01c14793436ff669a3f))


### Features Dendron

* colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
* resolve vim keybinding conflict on initial install ([#1103](https://github.com/dendronhq/dendron/issues/1103)) ([2278c66](https://github.com/dendronhq/dendron/commit/2278c6616c8297cc414ad02d5323bff5c45072e4))
* **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))
* Add SchemaLookupCommand ([#1082](https://github.com/dendronhq/dendron/issues/1082)) ([fe11a0e](https://github.com/dendronhq/dendron/commit/fe11a0ea1e0214823dd01842b941456df164bc70))
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* generate json schema from config ([#1100](https://github.com/dendronhq/dendron/issues/1100)) ([53b189e](https://github.com/dendronhq/dendron/commit/53b189ec973a8d3d3ccf300a0e59908197f4efb1))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.63.3](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.63.3) (2021-10-17)


### Bug Fixes

* **lookup:** hierarchy look up when inside parts of the hierarchy are omitted ([#1522](https://github.com/dendronhq/dendron/issues/1522)) ([6c30af5](https://github.com/dendronhq/dendron/commit/6c30af5e5b76297334f15a435fd1f9ad09941e06))
* backward compatibility of id matching adding '_' to id regex match. ([#1504](https://github.com/dendronhq/dendron/issues/1504)) ([4bbae40](https://github.com/dendronhq/dendron/commit/4bbae40d81ea064612f605c6f4e18ae8d34ba0de))



## 0.62.3 (2021-10-09)


### Bug Fixes

* template doesn't copy FM tags ([#1488](https://github.com/dendronhq/dendron/issues/1488)) ([0317699](https://github.com/dendronhq/dendron/commit/0317699ef9bfd4d77b1d3d05f8093e725ea5b2c3)), closes [#1481](https://github.com/dendronhq/dendron/issues/1481)
* **view:** enable anchor links to work in preview ([#1375](https://github.com/dendronhq/dendron/issues/1375)) ([f27cfb0](https://github.com/dendronhq/dendron/commit/f27cfb07d612e28fd0d6dd08019d772767900bba))
* preview caching invalidation when notes with ![[ref]] links change ([#1385](https://github.com/dendronhq/dendron/issues/1385)) ([efeef86](https://github.com/dendronhq/dendron/commit/efeef8662ec52e64ba33cae9b1196bba6cc82f95))
* **publish:** bad seo props setter ([373d933](https://github.com/dendronhq/dendron/commit/373d9331aba3b3385632f01661dd6c80835ec5ac))


### Features Dendron

* Lapsed user survey ([#1446](https://github.com/dendronhq/dendron/issues/1446)) ([8094d2b](https://github.com/dendronhq/dendron/commit/8094d2bb1972fecf4fde74e8c5644aeba3eec119)), closes [#1349](https://github.com/dendronhq/dendron/issues/1349)
* **publish:** add table of contents ([#1428](https://github.com/dendronhq/dendron/issues/1428)) ([df4b05b](https://github.com/dendronhq/dendron/commit/df4b05ba8526dc32362d6a59543d880f253f02fc))



# 0.61.0 (2021-09-28)


### Bug Fixes

* **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))
* support activation for older vscode version ([#1426](https://github.com/dendronhq/dendron/issues/1426)) ([5a1c7ed](https://github.com/dendronhq/dendron/commit/5a1c7ed9b45df2f00e61229c0776dad41cc29aba))


### Features Dendron

* **workspace:** add survey for new users([#1409](https://github.com/dendronhq/dendron/issues/1409)) ([e2b1754](https://github.com/dendronhq/dendron/commit/e2b17548fbbe3dffef961eb393f82a6a876940e7))



## 0.60.2 (2021-09-25)



## 0.60.2-alpha.0 (2021-09-24)



## 0.60.1 (2021-09-24)


### Bug Fixes

* pesky error popup when schema lookup is closed ([#1389](https://github.com/dendronhq/dendron/issues/1389)) ([4d2bb40](https://github.com/dendronhq/dendron/commit/4d2bb401b17e926dc2eaa11957536f0c75a1e538))
* single letter look up matches ([#1388](https://github.com/dendronhq/dendron/issues/1388)) ([7de9a71](https://github.com/dendronhq/dendron/commit/7de9a7195a02399b1285b51ef08d6853b1f390f6))



# 0.60.0 (2021-09-21)


### Bug Fixes

* **commands:** rename note leaves incorrect metadata if parent is a stub ([#1348](https://github.com/dendronhq/dendron/issues/1348)) ([d432cc9](https://github.com/dendronhq/dendron/commit/d432cc9e20ff8b9f6cefd7cc4c3a42b567ed9bc5))
* **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))
* **workspace:** disable certain decorations for long notes to avoid performance hit ([#1337](https://github.com/dendronhq/dendron/issues/1337)) ([f1c46f9](https://github.com/dendronhq/dendron/commit/f1c46f95c228ada2126ec7212cede3bf5acc773d))
* direct children query ([#1303](https://github.com/dendronhq/dendron/issues/1303)) ([bcf0dea](https://github.com/dendronhq/dendron/commit/bcf0deae422406564cd9a56c1765f90dd2e66215))
* issue with webpack devCLI ([a4ff4c9](https://github.com/dendronhq/dendron/commit/a4ff4c9ae28ff31ab6f9483c339ae78b5144e185))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))
* stop calendar from auto expanding when the last note is closed ([#1299](https://github.com/dendronhq/dendron/issues/1299)) ([9c8f853](https://github.com/dendronhq/dendron/commit/9c8f8533da5027c122e0d003ce4c61dc866735f5))


### Features Dendron

* consolidate dendron configs ([#1295](https://github.com/dendronhq/dendron/issues/1295)) ([177ac92](https://github.com/dendronhq/dendron/commit/177ac925a5442471f041ce5d991da52cecee6c9b))
* nextjs publishing fulltext search ([#1334](https://github.com/dendronhq/dendron/issues/1334)) ([68f8473](https://github.com/dendronhq/dendron/commit/68f8473badf22494c8d0758f8195e377235321f6))
* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* user tags ([#1228](https://github.com/dendronhq/dendron/issues/1228)) ([98c0106](https://github.com/dendronhq/dendron/commit/98c0106367e384c130a927484b9ea294eb6f84fa))



## 0.55.2 (2021-08-21)


### Bug Fixes

* wrong internal links in nextjs publishing ([#1165](https://github.com/dendronhq/dendron/issues/1165)) ([59a949d](https://github.com/dendronhq/dendron/commit/59a949d2b5b541efb283e851060636b108eb5a98))



## 0.55.1 (2021-08-17)


### Bug Fixes

* multiple issues with lookupv3 ([1fdd9eb](https://github.com/dendronhq/dendron/commit/1fdd9eb3242b43539572a1993fefd174640c6d83))
* properly log error stack ([485e220](https://github.com/dendronhq/dendron/commit/485e220f8ffa6cd63210e106e846ff305b920b77))


### Features Dendron

* Insert Note Index command ([#1142](https://github.com/dendronhq/dendron/issues/1142)) ([c140015](https://github.com/dendronhq/dendron/commit/c140015c19a942cf4696d596e818fd89905eea25))
* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* undefined tags breaks note serialization ([b1d784c](https://github.com/dendronhq/dendron/commit/b1d784c8df18b3b45999f01c14793436ff669a3f))


### Features Dendron

* colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
* resolve vim keybinding conflict on initial install ([#1103](https://github.com/dendronhq/dendron/issues/1103)) ([2278c66](https://github.com/dendronhq/dendron/commit/2278c6616c8297cc414ad02d5323bff5c45072e4))
* **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))
* Add SchemaLookupCommand ([#1082](https://github.com/dendronhq/dendron/issues/1082)) ([fe11a0e](https://github.com/dendronhq/dendron/commit/fe11a0ea1e0214823dd01842b941456df164bc70))
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* generate json schema from config ([#1100](https://github.com/dendronhq/dendron/issues/1100)) ([53b189e](https://github.com/dendronhq/dendron/commit/53b189ec973a8d3d3ccf300a0e59908197f4efb1))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.63.2](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.63.2) (2021-10-17)


### Bug Fixes

* **lookup:** hierarchy look up when inside parts of the hierarchy are omitted ([#1522](https://github.com/dendronhq/dendron/issues/1522)) ([6c30af5](https://github.com/dendronhq/dendron/commit/6c30af5e5b76297334f15a435fd1f9ad09941e06))
* backward compatibility of id matching adding '_' to id regex match. ([#1504](https://github.com/dendronhq/dendron/issues/1504)) ([4bbae40](https://github.com/dendronhq/dendron/commit/4bbae40d81ea064612f605c6f4e18ae8d34ba0de))



## 0.62.3 (2021-10-09)


### Bug Fixes

* template doesn't copy FM tags ([#1488](https://github.com/dendronhq/dendron/issues/1488)) ([0317699](https://github.com/dendronhq/dendron/commit/0317699ef9bfd4d77b1d3d05f8093e725ea5b2c3)), closes [#1481](https://github.com/dendronhq/dendron/issues/1481)
* **view:** enable anchor links to work in preview ([#1375](https://github.com/dendronhq/dendron/issues/1375)) ([f27cfb0](https://github.com/dendronhq/dendron/commit/f27cfb07d612e28fd0d6dd08019d772767900bba))
* preview caching invalidation when notes with ![[ref]] links change ([#1385](https://github.com/dendronhq/dendron/issues/1385)) ([efeef86](https://github.com/dendronhq/dendron/commit/efeef8662ec52e64ba33cae9b1196bba6cc82f95))
* **publish:** bad seo props setter ([373d933](https://github.com/dendronhq/dendron/commit/373d9331aba3b3385632f01661dd6c80835ec5ac))


### Features Dendron

* Lapsed user survey ([#1446](https://github.com/dendronhq/dendron/issues/1446)) ([8094d2b](https://github.com/dendronhq/dendron/commit/8094d2bb1972fecf4fde74e8c5644aeba3eec119)), closes [#1349](https://github.com/dendronhq/dendron/issues/1349)
* **publish:** add table of contents ([#1428](https://github.com/dendronhq/dendron/issues/1428)) ([df4b05b](https://github.com/dendronhq/dendron/commit/df4b05ba8526dc32362d6a59543d880f253f02fc))



# 0.61.0 (2021-09-28)


### Bug Fixes

* **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))
* support activation for older vscode version ([#1426](https://github.com/dendronhq/dendron/issues/1426)) ([5a1c7ed](https://github.com/dendronhq/dendron/commit/5a1c7ed9b45df2f00e61229c0776dad41cc29aba))


### Features Dendron

* **workspace:** add survey for new users([#1409](https://github.com/dendronhq/dendron/issues/1409)) ([e2b1754](https://github.com/dendronhq/dendron/commit/e2b17548fbbe3dffef961eb393f82a6a876940e7))



## 0.60.2 (2021-09-25)



## 0.60.2-alpha.0 (2021-09-24)



## 0.60.1 (2021-09-24)


### Bug Fixes

* pesky error popup when schema lookup is closed ([#1389](https://github.com/dendronhq/dendron/issues/1389)) ([4d2bb40](https://github.com/dendronhq/dendron/commit/4d2bb401b17e926dc2eaa11957536f0c75a1e538))
* single letter look up matches ([#1388](https://github.com/dendronhq/dendron/issues/1388)) ([7de9a71](https://github.com/dendronhq/dendron/commit/7de9a7195a02399b1285b51ef08d6853b1f390f6))



# 0.60.0 (2021-09-21)


### Bug Fixes

* **commands:** rename note leaves incorrect metadata if parent is a stub ([#1348](https://github.com/dendronhq/dendron/issues/1348)) ([d432cc9](https://github.com/dendronhq/dendron/commit/d432cc9e20ff8b9f6cefd7cc4c3a42b567ed9bc5))
* **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))
* **workspace:** disable certain decorations for long notes to avoid performance hit ([#1337](https://github.com/dendronhq/dendron/issues/1337)) ([f1c46f9](https://github.com/dendronhq/dendron/commit/f1c46f95c228ada2126ec7212cede3bf5acc773d))
* direct children query ([#1303](https://github.com/dendronhq/dendron/issues/1303)) ([bcf0dea](https://github.com/dendronhq/dendron/commit/bcf0deae422406564cd9a56c1765f90dd2e66215))
* issue with webpack devCLI ([a4ff4c9](https://github.com/dendronhq/dendron/commit/a4ff4c9ae28ff31ab6f9483c339ae78b5144e185))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))
* stop calendar from auto expanding when the last note is closed ([#1299](https://github.com/dendronhq/dendron/issues/1299)) ([9c8f853](https://github.com/dendronhq/dendron/commit/9c8f8533da5027c122e0d003ce4c61dc866735f5))


### Features Dendron

* consolidate dendron configs ([#1295](https://github.com/dendronhq/dendron/issues/1295)) ([177ac92](https://github.com/dendronhq/dendron/commit/177ac925a5442471f041ce5d991da52cecee6c9b))
* nextjs publishing fulltext search ([#1334](https://github.com/dendronhq/dendron/issues/1334)) ([68f8473](https://github.com/dendronhq/dendron/commit/68f8473badf22494c8d0758f8195e377235321f6))
* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* user tags ([#1228](https://github.com/dendronhq/dendron/issues/1228)) ([98c0106](https://github.com/dendronhq/dendron/commit/98c0106367e384c130a927484b9ea294eb6f84fa))



## 0.55.2 (2021-08-21)


### Bug Fixes

* wrong internal links in nextjs publishing ([#1165](https://github.com/dendronhq/dendron/issues/1165)) ([59a949d](https://github.com/dendronhq/dendron/commit/59a949d2b5b541efb283e851060636b108eb5a98))



## 0.55.1 (2021-08-17)


### Bug Fixes

* multiple issues with lookupv3 ([1fdd9eb](https://github.com/dendronhq/dendron/commit/1fdd9eb3242b43539572a1993fefd174640c6d83))
* properly log error stack ([485e220](https://github.com/dendronhq/dendron/commit/485e220f8ffa6cd63210e106e846ff305b920b77))


### Features Dendron

* Insert Note Index command ([#1142](https://github.com/dendronhq/dendron/issues/1142)) ([c140015](https://github.com/dendronhq/dendron/commit/c140015c19a942cf4696d596e818fd89905eea25))
* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* undefined tags breaks note serialization ([b1d784c](https://github.com/dendronhq/dendron/commit/b1d784c8df18b3b45999f01c14793436ff669a3f))


### Features Dendron

* colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
* resolve vim keybinding conflict on initial install ([#1103](https://github.com/dendronhq/dendron/issues/1103)) ([2278c66](https://github.com/dendronhq/dendron/commit/2278c6616c8297cc414ad02d5323bff5c45072e4))
* **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))
* Add SchemaLookupCommand ([#1082](https://github.com/dendronhq/dendron/issues/1082)) ([fe11a0e](https://github.com/dendronhq/dendron/commit/fe11a0ea1e0214823dd01842b941456df164bc70))
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* generate json schema from config ([#1100](https://github.com/dendronhq/dendron/issues/1100)) ([53b189e](https://github.com/dendronhq/dendron/commit/53b189ec973a8d3d3ccf300a0e59908197f4efb1))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.63.1](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.63.1) (2021-10-15)


### Bug Fixes

* backward compatibility of id matching adding '_' to id regex match. ([#1504](https://github.com/dendronhq/dendron/issues/1504)) ([4bbae40](https://github.com/dendronhq/dendron/commit/4bbae40d81ea064612f605c6f4e18ae8d34ba0de))



## 0.62.3 (2021-10-09)


### Bug Fixes

* template doesn't copy FM tags ([#1488](https://github.com/dendronhq/dendron/issues/1488)) ([0317699](https://github.com/dendronhq/dendron/commit/0317699ef9bfd4d77b1d3d05f8093e725ea5b2c3)), closes [#1481](https://github.com/dendronhq/dendron/issues/1481)
* **view:** enable anchor links to work in preview ([#1375](https://github.com/dendronhq/dendron/issues/1375)) ([f27cfb0](https://github.com/dendronhq/dendron/commit/f27cfb07d612e28fd0d6dd08019d772767900bba))
* preview caching invalidation when notes with ![[ref]] links change ([#1385](https://github.com/dendronhq/dendron/issues/1385)) ([efeef86](https://github.com/dendronhq/dendron/commit/efeef8662ec52e64ba33cae9b1196bba6cc82f95))
* **publish:** bad seo props setter ([373d933](https://github.com/dendronhq/dendron/commit/373d9331aba3b3385632f01661dd6c80835ec5ac))


### Features Dendron

* Lapsed user survey ([#1446](https://github.com/dendronhq/dendron/issues/1446)) ([8094d2b](https://github.com/dendronhq/dendron/commit/8094d2bb1972fecf4fde74e8c5644aeba3eec119)), closes [#1349](https://github.com/dendronhq/dendron/issues/1349)
* **publish:** add table of contents ([#1428](https://github.com/dendronhq/dendron/issues/1428)) ([df4b05b](https://github.com/dendronhq/dendron/commit/df4b05ba8526dc32362d6a59543d880f253f02fc))



# 0.61.0 (2021-09-28)


### Bug Fixes

* **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))
* support activation for older vscode version ([#1426](https://github.com/dendronhq/dendron/issues/1426)) ([5a1c7ed](https://github.com/dendronhq/dendron/commit/5a1c7ed9b45df2f00e61229c0776dad41cc29aba))


### Features Dendron

* **workspace:** add survey for new users([#1409](https://github.com/dendronhq/dendron/issues/1409)) ([e2b1754](https://github.com/dendronhq/dendron/commit/e2b17548fbbe3dffef961eb393f82a6a876940e7))



## 0.60.2 (2021-09-25)



## 0.60.2-alpha.0 (2021-09-24)



## 0.60.1 (2021-09-24)


### Bug Fixes

* pesky error popup when schema lookup is closed ([#1389](https://github.com/dendronhq/dendron/issues/1389)) ([4d2bb40](https://github.com/dendronhq/dendron/commit/4d2bb401b17e926dc2eaa11957536f0c75a1e538))
* single letter look up matches ([#1388](https://github.com/dendronhq/dendron/issues/1388)) ([7de9a71](https://github.com/dendronhq/dendron/commit/7de9a7195a02399b1285b51ef08d6853b1f390f6))



# 0.60.0 (2021-09-21)


### Bug Fixes

* **commands:** rename note leaves incorrect metadata if parent is a stub ([#1348](https://github.com/dendronhq/dendron/issues/1348)) ([d432cc9](https://github.com/dendronhq/dendron/commit/d432cc9e20ff8b9f6cefd7cc4c3a42b567ed9bc5))
* **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))
* **workspace:** disable certain decorations for long notes to avoid performance hit ([#1337](https://github.com/dendronhq/dendron/issues/1337)) ([f1c46f9](https://github.com/dendronhq/dendron/commit/f1c46f95c228ada2126ec7212cede3bf5acc773d))
* direct children query ([#1303](https://github.com/dendronhq/dendron/issues/1303)) ([bcf0dea](https://github.com/dendronhq/dendron/commit/bcf0deae422406564cd9a56c1765f90dd2e66215))
* issue with webpack devCLI ([a4ff4c9](https://github.com/dendronhq/dendron/commit/a4ff4c9ae28ff31ab6f9483c339ae78b5144e185))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))
* stop calendar from auto expanding when the last note is closed ([#1299](https://github.com/dendronhq/dendron/issues/1299)) ([9c8f853](https://github.com/dendronhq/dendron/commit/9c8f8533da5027c122e0d003ce4c61dc866735f5))


### Features Dendron

* consolidate dendron configs ([#1295](https://github.com/dendronhq/dendron/issues/1295)) ([177ac92](https://github.com/dendronhq/dendron/commit/177ac925a5442471f041ce5d991da52cecee6c9b))
* nextjs publishing fulltext search ([#1334](https://github.com/dendronhq/dendron/issues/1334)) ([68f8473](https://github.com/dendronhq/dendron/commit/68f8473badf22494c8d0758f8195e377235321f6))
* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* user tags ([#1228](https://github.com/dendronhq/dendron/issues/1228)) ([98c0106](https://github.com/dendronhq/dendron/commit/98c0106367e384c130a927484b9ea294eb6f84fa))



## 0.55.2 (2021-08-21)


### Bug Fixes

* wrong internal links in nextjs publishing ([#1165](https://github.com/dendronhq/dendron/issues/1165)) ([59a949d](https://github.com/dendronhq/dendron/commit/59a949d2b5b541efb283e851060636b108eb5a98))



## 0.55.1 (2021-08-17)


### Bug Fixes

* multiple issues with lookupv3 ([1fdd9eb](https://github.com/dendronhq/dendron/commit/1fdd9eb3242b43539572a1993fefd174640c6d83))
* properly log error stack ([485e220](https://github.com/dendronhq/dendron/commit/485e220f8ffa6cd63210e106e846ff305b920b77))


### Features Dendron

* Insert Note Index command ([#1142](https://github.com/dendronhq/dendron/issues/1142)) ([c140015](https://github.com/dendronhq/dendron/commit/c140015c19a942cf4696d596e818fd89905eea25))
* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* undefined tags breaks note serialization ([b1d784c](https://github.com/dendronhq/dendron/commit/b1d784c8df18b3b45999f01c14793436ff669a3f))


### Features Dendron

* colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
* resolve vim keybinding conflict on initial install ([#1103](https://github.com/dendronhq/dendron/issues/1103)) ([2278c66](https://github.com/dendronhq/dendron/commit/2278c6616c8297cc414ad02d5323bff5c45072e4))
* **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))
* Add SchemaLookupCommand ([#1082](https://github.com/dendronhq/dendron/issues/1082)) ([fe11a0e](https://github.com/dendronhq/dendron/commit/fe11a0ea1e0214823dd01842b941456df164bc70))
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* generate json schema from config ([#1100](https://github.com/dendronhq/dendron/issues/1100)) ([53b189e](https://github.com/dendronhq/dendron/commit/53b189ec973a8d3d3ccf300a0e59908197f4efb1))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





# [0.63.0](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.63.0) (2021-10-12)


### Bug Fixes

* backward compatibility of id matching adding '_' to id regex match. ([#1504](https://github.com/dendronhq/dendron/issues/1504)) ([4bbae40](https://github.com/dendronhq/dendron/commit/4bbae40d81ea064612f605c6f4e18ae8d34ba0de))



## 0.62.3 (2021-10-09)


### Bug Fixes

* template doesn't copy FM tags ([#1488](https://github.com/dendronhq/dendron/issues/1488)) ([0317699](https://github.com/dendronhq/dendron/commit/0317699ef9bfd4d77b1d3d05f8093e725ea5b2c3)), closes [#1481](https://github.com/dendronhq/dendron/issues/1481)
* **view:** enable anchor links to work in preview ([#1375](https://github.com/dendronhq/dendron/issues/1375)) ([f27cfb0](https://github.com/dendronhq/dendron/commit/f27cfb07d612e28fd0d6dd08019d772767900bba))
* preview caching invalidation when notes with ![[ref]] links change ([#1385](https://github.com/dendronhq/dendron/issues/1385)) ([efeef86](https://github.com/dendronhq/dendron/commit/efeef8662ec52e64ba33cae9b1196bba6cc82f95))
* **publish:** bad seo props setter ([373d933](https://github.com/dendronhq/dendron/commit/373d9331aba3b3385632f01661dd6c80835ec5ac))


### Features Dendron

* Lapsed user survey ([#1446](https://github.com/dendronhq/dendron/issues/1446)) ([8094d2b](https://github.com/dendronhq/dendron/commit/8094d2bb1972fecf4fde74e8c5644aeba3eec119)), closes [#1349](https://github.com/dendronhq/dendron/issues/1349)
* **publish:** add table of contents ([#1428](https://github.com/dendronhq/dendron/issues/1428)) ([df4b05b](https://github.com/dendronhq/dendron/commit/df4b05ba8526dc32362d6a59543d880f253f02fc))



# 0.61.0 (2021-09-28)


### Bug Fixes

* **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))
* support activation for older vscode version ([#1426](https://github.com/dendronhq/dendron/issues/1426)) ([5a1c7ed](https://github.com/dendronhq/dendron/commit/5a1c7ed9b45df2f00e61229c0776dad41cc29aba))


### Features Dendron

* **workspace:** add survey for new users([#1409](https://github.com/dendronhq/dendron/issues/1409)) ([e2b1754](https://github.com/dendronhq/dendron/commit/e2b17548fbbe3dffef961eb393f82a6a876940e7))



## 0.60.2 (2021-09-25)



## 0.60.2-alpha.0 (2021-09-24)



## 0.60.1 (2021-09-24)


### Bug Fixes

* pesky error popup when schema lookup is closed ([#1389](https://github.com/dendronhq/dendron/issues/1389)) ([4d2bb40](https://github.com/dendronhq/dendron/commit/4d2bb401b17e926dc2eaa11957536f0c75a1e538))
* single letter look up matches ([#1388](https://github.com/dendronhq/dendron/issues/1388)) ([7de9a71](https://github.com/dendronhq/dendron/commit/7de9a7195a02399b1285b51ef08d6853b1f390f6))



# 0.60.0 (2021-09-21)


### Bug Fixes

* **commands:** rename note leaves incorrect metadata if parent is a stub ([#1348](https://github.com/dendronhq/dendron/issues/1348)) ([d432cc9](https://github.com/dendronhq/dendron/commit/d432cc9e20ff8b9f6cefd7cc4c3a42b567ed9bc5))
* **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))
* **workspace:** disable certain decorations for long notes to avoid performance hit ([#1337](https://github.com/dendronhq/dendron/issues/1337)) ([f1c46f9](https://github.com/dendronhq/dendron/commit/f1c46f95c228ada2126ec7212cede3bf5acc773d))
* direct children query ([#1303](https://github.com/dendronhq/dendron/issues/1303)) ([bcf0dea](https://github.com/dendronhq/dendron/commit/bcf0deae422406564cd9a56c1765f90dd2e66215))
* issue with webpack devCLI ([a4ff4c9](https://github.com/dendronhq/dendron/commit/a4ff4c9ae28ff31ab6f9483c339ae78b5144e185))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))
* stop calendar from auto expanding when the last note is closed ([#1299](https://github.com/dendronhq/dendron/issues/1299)) ([9c8f853](https://github.com/dendronhq/dendron/commit/9c8f8533da5027c122e0d003ce4c61dc866735f5))


### Features Dendron

* consolidate dendron configs ([#1295](https://github.com/dendronhq/dendron/issues/1295)) ([177ac92](https://github.com/dendronhq/dendron/commit/177ac925a5442471f041ce5d991da52cecee6c9b))
* nextjs publishing fulltext search ([#1334](https://github.com/dendronhq/dendron/issues/1334)) ([68f8473](https://github.com/dendronhq/dendron/commit/68f8473badf22494c8d0758f8195e377235321f6))
* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* user tags ([#1228](https://github.com/dendronhq/dendron/issues/1228)) ([98c0106](https://github.com/dendronhq/dendron/commit/98c0106367e384c130a927484b9ea294eb6f84fa))



## 0.55.2 (2021-08-21)


### Bug Fixes

* wrong internal links in nextjs publishing ([#1165](https://github.com/dendronhq/dendron/issues/1165)) ([59a949d](https://github.com/dendronhq/dendron/commit/59a949d2b5b541efb283e851060636b108eb5a98))



## 0.55.1 (2021-08-17)


### Bug Fixes

* multiple issues with lookupv3 ([1fdd9eb](https://github.com/dendronhq/dendron/commit/1fdd9eb3242b43539572a1993fefd174640c6d83))
* properly log error stack ([485e220](https://github.com/dendronhq/dendron/commit/485e220f8ffa6cd63210e106e846ff305b920b77))


### Features Dendron

* Insert Note Index command ([#1142](https://github.com/dendronhq/dendron/issues/1142)) ([c140015](https://github.com/dendronhq/dendron/commit/c140015c19a942cf4696d596e818fd89905eea25))
* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* undefined tags breaks note serialization ([b1d784c](https://github.com/dendronhq/dendron/commit/b1d784c8df18b3b45999f01c14793436ff669a3f))


### Features Dendron

* colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
* resolve vim keybinding conflict on initial install ([#1103](https://github.com/dendronhq/dendron/issues/1103)) ([2278c66](https://github.com/dendronhq/dendron/commit/2278c6616c8297cc414ad02d5323bff5c45072e4))
* **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))
* Add SchemaLookupCommand ([#1082](https://github.com/dendronhq/dendron/issues/1082)) ([fe11a0e](https://github.com/dendronhq/dendron/commit/fe11a0ea1e0214823dd01842b941456df164bc70))
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* generate json schema from config ([#1100](https://github.com/dendronhq/dendron/issues/1100)) ([53b189e](https://github.com/dendronhq/dendron/commit/53b189ec973a8d3d3ccf300a0e59908197f4efb1))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.62.3](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.62.3) (2021-10-09)


### Bug Fixes

* template doesn't copy FM tags ([#1488](https://github.com/dendronhq/dendron/issues/1488)) ([0317699](https://github.com/dendronhq/dendron/commit/0317699ef9bfd4d77b1d3d05f8093e725ea5b2c3)), closes [#1481](https://github.com/dendronhq/dendron/issues/1481)
* **view:** enable anchor links to work in preview ([#1375](https://github.com/dendronhq/dendron/issues/1375)) ([f27cfb0](https://github.com/dendronhq/dendron/commit/f27cfb07d612e28fd0d6dd08019d772767900bba))
* preview caching invalidation when notes with ![[ref]] links change ([#1385](https://github.com/dendronhq/dendron/issues/1385)) ([efeef86](https://github.com/dendronhq/dendron/commit/efeef8662ec52e64ba33cae9b1196bba6cc82f95))
* **publish:** bad seo props setter ([373d933](https://github.com/dendronhq/dendron/commit/373d9331aba3b3385632f01661dd6c80835ec5ac))


### Features Dendron

* Lapsed user survey ([#1446](https://github.com/dendronhq/dendron/issues/1446)) ([8094d2b](https://github.com/dendronhq/dendron/commit/8094d2bb1972fecf4fde74e8c5644aeba3eec119)), closes [#1349](https://github.com/dendronhq/dendron/issues/1349)
* **publish:** add table of contents ([#1428](https://github.com/dendronhq/dendron/issues/1428)) ([df4b05b](https://github.com/dendronhq/dendron/commit/df4b05ba8526dc32362d6a59543d880f253f02fc))



# 0.61.0 (2021-09-28)


### Bug Fixes

* **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))
* support activation for older vscode version ([#1426](https://github.com/dendronhq/dendron/issues/1426)) ([5a1c7ed](https://github.com/dendronhq/dendron/commit/5a1c7ed9b45df2f00e61229c0776dad41cc29aba))


### Features Dendron

* **workspace:** add survey for new users([#1409](https://github.com/dendronhq/dendron/issues/1409)) ([e2b1754](https://github.com/dendronhq/dendron/commit/e2b17548fbbe3dffef961eb393f82a6a876940e7))



## 0.60.2 (2021-09-25)



## 0.60.2-alpha.0 (2021-09-24)



## 0.60.1 (2021-09-24)


### Bug Fixes

* pesky error popup when schema lookup is closed ([#1389](https://github.com/dendronhq/dendron/issues/1389)) ([4d2bb40](https://github.com/dendronhq/dendron/commit/4d2bb401b17e926dc2eaa11957536f0c75a1e538))
* single letter look up matches ([#1388](https://github.com/dendronhq/dendron/issues/1388)) ([7de9a71](https://github.com/dendronhq/dendron/commit/7de9a7195a02399b1285b51ef08d6853b1f390f6))



# 0.60.0 (2021-09-21)


### Bug Fixes

* **commands:** rename note leaves incorrect metadata if parent is a stub ([#1348](https://github.com/dendronhq/dendron/issues/1348)) ([d432cc9](https://github.com/dendronhq/dendron/commit/d432cc9e20ff8b9f6cefd7cc4c3a42b567ed9bc5))
* **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))
* **workspace:** disable certain decorations for long notes to avoid performance hit ([#1337](https://github.com/dendronhq/dendron/issues/1337)) ([f1c46f9](https://github.com/dendronhq/dendron/commit/f1c46f95c228ada2126ec7212cede3bf5acc773d))
* direct children query ([#1303](https://github.com/dendronhq/dendron/issues/1303)) ([bcf0dea](https://github.com/dendronhq/dendron/commit/bcf0deae422406564cd9a56c1765f90dd2e66215))
* issue with webpack devCLI ([a4ff4c9](https://github.com/dendronhq/dendron/commit/a4ff4c9ae28ff31ab6f9483c339ae78b5144e185))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))
* stop calendar from auto expanding when the last note is closed ([#1299](https://github.com/dendronhq/dendron/issues/1299)) ([9c8f853](https://github.com/dendronhq/dendron/commit/9c8f8533da5027c122e0d003ce4c61dc866735f5))


### Features Dendron

* consolidate dendron configs ([#1295](https://github.com/dendronhq/dendron/issues/1295)) ([177ac92](https://github.com/dendronhq/dendron/commit/177ac925a5442471f041ce5d991da52cecee6c9b))
* nextjs publishing fulltext search ([#1334](https://github.com/dendronhq/dendron/issues/1334)) ([68f8473](https://github.com/dendronhq/dendron/commit/68f8473badf22494c8d0758f8195e377235321f6))
* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* user tags ([#1228](https://github.com/dendronhq/dendron/issues/1228)) ([98c0106](https://github.com/dendronhq/dendron/commit/98c0106367e384c130a927484b9ea294eb6f84fa))



## 0.55.2 (2021-08-21)


### Bug Fixes

* wrong internal links in nextjs publishing ([#1165](https://github.com/dendronhq/dendron/issues/1165)) ([59a949d](https://github.com/dendronhq/dendron/commit/59a949d2b5b541efb283e851060636b108eb5a98))



## 0.55.1 (2021-08-17)


### Bug Fixes

* multiple issues with lookupv3 ([1fdd9eb](https://github.com/dendronhq/dendron/commit/1fdd9eb3242b43539572a1993fefd174640c6d83))
* properly log error stack ([485e220](https://github.com/dendronhq/dendron/commit/485e220f8ffa6cd63210e106e846ff305b920b77))


### Features Dendron

* Insert Note Index command ([#1142](https://github.com/dendronhq/dendron/issues/1142)) ([c140015](https://github.com/dendronhq/dendron/commit/c140015c19a942cf4696d596e818fd89905eea25))
* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* undefined tags breaks note serialization ([b1d784c](https://github.com/dendronhq/dendron/commit/b1d784c8df18b3b45999f01c14793436ff669a3f))


### Features Dendron

* colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
* resolve vim keybinding conflict on initial install ([#1103](https://github.com/dendronhq/dendron/issues/1103)) ([2278c66](https://github.com/dendronhq/dendron/commit/2278c6616c8297cc414ad02d5323bff5c45072e4))
* **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))
* Add SchemaLookupCommand ([#1082](https://github.com/dendronhq/dendron/issues/1082)) ([fe11a0e](https://github.com/dendronhq/dendron/commit/fe11a0ea1e0214823dd01842b941456df164bc70))
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* generate json schema from config ([#1100](https://github.com/dendronhq/dendron/issues/1100)) ([53b189e](https://github.com/dendronhq/dendron/commit/53b189ec973a8d3d3ccf300a0e59908197f4efb1))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.62.2](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.62.2) (2021-10-08)


### Bug Fixes

* **view:** enable anchor links to work in preview ([#1375](https://github.com/dendronhq/dendron/issues/1375)) ([f27cfb0](https://github.com/dendronhq/dendron/commit/f27cfb07d612e28fd0d6dd08019d772767900bba))
* preview caching invalidation when notes with ![[ref]] links change ([#1385](https://github.com/dendronhq/dendron/issues/1385)) ([efeef86](https://github.com/dendronhq/dendron/commit/efeef8662ec52e64ba33cae9b1196bba6cc82f95))
* **publish:** bad seo props setter ([373d933](https://github.com/dendronhq/dendron/commit/373d9331aba3b3385632f01661dd6c80835ec5ac))


### Features Dendron

* Lapsed user survey ([#1446](https://github.com/dendronhq/dendron/issues/1446)) ([8094d2b](https://github.com/dendronhq/dendron/commit/8094d2bb1972fecf4fde74e8c5644aeba3eec119)), closes [#1349](https://github.com/dendronhq/dendron/issues/1349)
* **publish:** add table of contents ([#1428](https://github.com/dendronhq/dendron/issues/1428)) ([df4b05b](https://github.com/dendronhq/dendron/commit/df4b05ba8526dc32362d6a59543d880f253f02fc))



# 0.61.0 (2021-09-28)


### Bug Fixes

* **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))
* support activation for older vscode version ([#1426](https://github.com/dendronhq/dendron/issues/1426)) ([5a1c7ed](https://github.com/dendronhq/dendron/commit/5a1c7ed9b45df2f00e61229c0776dad41cc29aba))


### Features Dendron

* **workspace:** add survey for new users([#1409](https://github.com/dendronhq/dendron/issues/1409)) ([e2b1754](https://github.com/dendronhq/dendron/commit/e2b17548fbbe3dffef961eb393f82a6a876940e7))



## 0.60.2 (2021-09-25)



## 0.60.2-alpha.0 (2021-09-24)



## 0.60.1 (2021-09-24)


### Bug Fixes

* pesky error popup when schema lookup is closed ([#1389](https://github.com/dendronhq/dendron/issues/1389)) ([4d2bb40](https://github.com/dendronhq/dendron/commit/4d2bb401b17e926dc2eaa11957536f0c75a1e538))
* single letter look up matches ([#1388](https://github.com/dendronhq/dendron/issues/1388)) ([7de9a71](https://github.com/dendronhq/dendron/commit/7de9a7195a02399b1285b51ef08d6853b1f390f6))



# 0.60.0 (2021-09-21)


### Bug Fixes

* **commands:** rename note leaves incorrect metadata if parent is a stub ([#1348](https://github.com/dendronhq/dendron/issues/1348)) ([d432cc9](https://github.com/dendronhq/dendron/commit/d432cc9e20ff8b9f6cefd7cc4c3a42b567ed9bc5))
* **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))
* **workspace:** disable certain decorations for long notes to avoid performance hit ([#1337](https://github.com/dendronhq/dendron/issues/1337)) ([f1c46f9](https://github.com/dendronhq/dendron/commit/f1c46f95c228ada2126ec7212cede3bf5acc773d))
* direct children query ([#1303](https://github.com/dendronhq/dendron/issues/1303)) ([bcf0dea](https://github.com/dendronhq/dendron/commit/bcf0deae422406564cd9a56c1765f90dd2e66215))
* issue with webpack devCLI ([a4ff4c9](https://github.com/dendronhq/dendron/commit/a4ff4c9ae28ff31ab6f9483c339ae78b5144e185))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))
* stop calendar from auto expanding when the last note is closed ([#1299](https://github.com/dendronhq/dendron/issues/1299)) ([9c8f853](https://github.com/dendronhq/dendron/commit/9c8f8533da5027c122e0d003ce4c61dc866735f5))


### Features Dendron

* consolidate dendron configs ([#1295](https://github.com/dendronhq/dendron/issues/1295)) ([177ac92](https://github.com/dendronhq/dendron/commit/177ac925a5442471f041ce5d991da52cecee6c9b))
* nextjs publishing fulltext search ([#1334](https://github.com/dendronhq/dendron/issues/1334)) ([68f8473](https://github.com/dendronhq/dendron/commit/68f8473badf22494c8d0758f8195e377235321f6))
* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* user tags ([#1228](https://github.com/dendronhq/dendron/issues/1228)) ([98c0106](https://github.com/dendronhq/dendron/commit/98c0106367e384c130a927484b9ea294eb6f84fa))



## 0.55.2 (2021-08-21)


### Bug Fixes

* wrong internal links in nextjs publishing ([#1165](https://github.com/dendronhq/dendron/issues/1165)) ([59a949d](https://github.com/dendronhq/dendron/commit/59a949d2b5b541efb283e851060636b108eb5a98))



## 0.55.1 (2021-08-17)


### Bug Fixes

* multiple issues with lookupv3 ([1fdd9eb](https://github.com/dendronhq/dendron/commit/1fdd9eb3242b43539572a1993fefd174640c6d83))
* properly log error stack ([485e220](https://github.com/dendronhq/dendron/commit/485e220f8ffa6cd63210e106e846ff305b920b77))


### Features Dendron

* Insert Note Index command ([#1142](https://github.com/dendronhq/dendron/issues/1142)) ([c140015](https://github.com/dendronhq/dendron/commit/c140015c19a942cf4696d596e818fd89905eea25))
* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* undefined tags breaks note serialization ([b1d784c](https://github.com/dendronhq/dendron/commit/b1d784c8df18b3b45999f01c14793436ff669a3f))


### Features Dendron

* colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
* resolve vim keybinding conflict on initial install ([#1103](https://github.com/dendronhq/dendron/issues/1103)) ([2278c66](https://github.com/dendronhq/dendron/commit/2278c6616c8297cc414ad02d5323bff5c45072e4))
* **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))
* Add SchemaLookupCommand ([#1082](https://github.com/dendronhq/dendron/issues/1082)) ([fe11a0e](https://github.com/dendronhq/dendron/commit/fe11a0ea1e0214823dd01842b941456df164bc70))
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* generate json schema from config ([#1100](https://github.com/dendronhq/dendron/issues/1100)) ([53b189e](https://github.com/dendronhq/dendron/commit/53b189ec973a8d3d3ccf300a0e59908197f4efb1))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.62.1](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.62.1) (2021-10-08)


### Bug Fixes

* **view:** enable anchor links to work in preview ([#1375](https://github.com/dendronhq/dendron/issues/1375)) ([f27cfb0](https://github.com/dendronhq/dendron/commit/f27cfb07d612e28fd0d6dd08019d772767900bba))
* preview caching invalidation when notes with ![[ref]] links change ([#1385](https://github.com/dendronhq/dendron/issues/1385)) ([efeef86](https://github.com/dendronhq/dendron/commit/efeef8662ec52e64ba33cae9b1196bba6cc82f95))
* **publish:** bad seo props setter ([373d933](https://github.com/dendronhq/dendron/commit/373d9331aba3b3385632f01661dd6c80835ec5ac))


### Features Dendron

* Lapsed user survey ([#1446](https://github.com/dendronhq/dendron/issues/1446)) ([8094d2b](https://github.com/dendronhq/dendron/commit/8094d2bb1972fecf4fde74e8c5644aeba3eec119)), closes [#1349](https://github.com/dendronhq/dendron/issues/1349)
* **publish:** add table of contents ([#1428](https://github.com/dendronhq/dendron/issues/1428)) ([df4b05b](https://github.com/dendronhq/dendron/commit/df4b05ba8526dc32362d6a59543d880f253f02fc))



# 0.61.0 (2021-09-28)


### Bug Fixes

* **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))
* support activation for older vscode version ([#1426](https://github.com/dendronhq/dendron/issues/1426)) ([5a1c7ed](https://github.com/dendronhq/dendron/commit/5a1c7ed9b45df2f00e61229c0776dad41cc29aba))


### Features Dendron

* **workspace:** add survey for new users([#1409](https://github.com/dendronhq/dendron/issues/1409)) ([e2b1754](https://github.com/dendronhq/dendron/commit/e2b17548fbbe3dffef961eb393f82a6a876940e7))



## 0.60.2 (2021-09-25)



## 0.60.2-alpha.0 (2021-09-24)



## 0.60.1 (2021-09-24)


### Bug Fixes

* pesky error popup when schema lookup is closed ([#1389](https://github.com/dendronhq/dendron/issues/1389)) ([4d2bb40](https://github.com/dendronhq/dendron/commit/4d2bb401b17e926dc2eaa11957536f0c75a1e538))
* single letter look up matches ([#1388](https://github.com/dendronhq/dendron/issues/1388)) ([7de9a71](https://github.com/dendronhq/dendron/commit/7de9a7195a02399b1285b51ef08d6853b1f390f6))



# 0.60.0 (2021-09-21)


### Bug Fixes

* **commands:** rename note leaves incorrect metadata if parent is a stub ([#1348](https://github.com/dendronhq/dendron/issues/1348)) ([d432cc9](https://github.com/dendronhq/dendron/commit/d432cc9e20ff8b9f6cefd7cc4c3a42b567ed9bc5))
* **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))
* **workspace:** disable certain decorations for long notes to avoid performance hit ([#1337](https://github.com/dendronhq/dendron/issues/1337)) ([f1c46f9](https://github.com/dendronhq/dendron/commit/f1c46f95c228ada2126ec7212cede3bf5acc773d))
* direct children query ([#1303](https://github.com/dendronhq/dendron/issues/1303)) ([bcf0dea](https://github.com/dendronhq/dendron/commit/bcf0deae422406564cd9a56c1765f90dd2e66215))
* issue with webpack devCLI ([a4ff4c9](https://github.com/dendronhq/dendron/commit/a4ff4c9ae28ff31ab6f9483c339ae78b5144e185))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))
* stop calendar from auto expanding when the last note is closed ([#1299](https://github.com/dendronhq/dendron/issues/1299)) ([9c8f853](https://github.com/dendronhq/dendron/commit/9c8f8533da5027c122e0d003ce4c61dc866735f5))


### Features Dendron

* consolidate dendron configs ([#1295](https://github.com/dendronhq/dendron/issues/1295)) ([177ac92](https://github.com/dendronhq/dendron/commit/177ac925a5442471f041ce5d991da52cecee6c9b))
* nextjs publishing fulltext search ([#1334](https://github.com/dendronhq/dendron/issues/1334)) ([68f8473](https://github.com/dendronhq/dendron/commit/68f8473badf22494c8d0758f8195e377235321f6))
* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* user tags ([#1228](https://github.com/dendronhq/dendron/issues/1228)) ([98c0106](https://github.com/dendronhq/dendron/commit/98c0106367e384c130a927484b9ea294eb6f84fa))



## 0.55.2 (2021-08-21)


### Bug Fixes

* wrong internal links in nextjs publishing ([#1165](https://github.com/dendronhq/dendron/issues/1165)) ([59a949d](https://github.com/dendronhq/dendron/commit/59a949d2b5b541efb283e851060636b108eb5a98))



## 0.55.1 (2021-08-17)


### Bug Fixes

* multiple issues with lookupv3 ([1fdd9eb](https://github.com/dendronhq/dendron/commit/1fdd9eb3242b43539572a1993fefd174640c6d83))
* properly log error stack ([485e220](https://github.com/dendronhq/dendron/commit/485e220f8ffa6cd63210e106e846ff305b920b77))


### Features Dendron

* Insert Note Index command ([#1142](https://github.com/dendronhq/dendron/issues/1142)) ([c140015](https://github.com/dendronhq/dendron/commit/c140015c19a942cf4696d596e818fd89905eea25))
* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* undefined tags breaks note serialization ([b1d784c](https://github.com/dendronhq/dendron/commit/b1d784c8df18b3b45999f01c14793436ff669a3f))


### Features Dendron

* colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
* resolve vim keybinding conflict on initial install ([#1103](https://github.com/dendronhq/dendron/issues/1103)) ([2278c66](https://github.com/dendronhq/dendron/commit/2278c6616c8297cc414ad02d5323bff5c45072e4))
* **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))
* Add SchemaLookupCommand ([#1082](https://github.com/dendronhq/dendron/issues/1082)) ([fe11a0e](https://github.com/dendronhq/dendron/commit/fe11a0ea1e0214823dd01842b941456df164bc70))
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* generate json schema from config ([#1100](https://github.com/dendronhq/dendron/issues/1100)) ([53b189e](https://github.com/dendronhq/dendron/commit/53b189ec973a8d3d3ccf300a0e59908197f4efb1))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





# [0.62.0](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.62.0) (2021-10-05)


### Bug Fixes

* **view:** enable anchor links to work in preview ([#1375](https://github.com/dendronhq/dendron/issues/1375)) ([f27cfb0](https://github.com/dendronhq/dendron/commit/f27cfb07d612e28fd0d6dd08019d772767900bba))
* preview caching invalidation when notes with ![[ref]] links change ([#1385](https://github.com/dendronhq/dendron/issues/1385)) ([efeef86](https://github.com/dendronhq/dendron/commit/efeef8662ec52e64ba33cae9b1196bba6cc82f95))
* **publish:** bad seo props setter ([373d933](https://github.com/dendronhq/dendron/commit/373d9331aba3b3385632f01661dd6c80835ec5ac))


### Features Dendron

* Lapsed user survey ([#1446](https://github.com/dendronhq/dendron/issues/1446)) ([8094d2b](https://github.com/dendronhq/dendron/commit/8094d2bb1972fecf4fde74e8c5644aeba3eec119)), closes [#1349](https://github.com/dendronhq/dendron/issues/1349)
* **publish:** add table of contents ([#1428](https://github.com/dendronhq/dendron/issues/1428)) ([df4b05b](https://github.com/dendronhq/dendron/commit/df4b05ba8526dc32362d6a59543d880f253f02fc))



# 0.61.0 (2021-09-28)


### Bug Fixes

* **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))
* support activation for older vscode version ([#1426](https://github.com/dendronhq/dendron/issues/1426)) ([5a1c7ed](https://github.com/dendronhq/dendron/commit/5a1c7ed9b45df2f00e61229c0776dad41cc29aba))


### Features Dendron

* **workspace:** add survey for new users([#1409](https://github.com/dendronhq/dendron/issues/1409)) ([e2b1754](https://github.com/dendronhq/dendron/commit/e2b17548fbbe3dffef961eb393f82a6a876940e7))



## 0.60.2 (2021-09-25)



## 0.60.2-alpha.0 (2021-09-24)



## 0.60.1 (2021-09-24)


### Bug Fixes

* pesky error popup when schema lookup is closed ([#1389](https://github.com/dendronhq/dendron/issues/1389)) ([4d2bb40](https://github.com/dendronhq/dendron/commit/4d2bb401b17e926dc2eaa11957536f0c75a1e538))
* single letter look up matches ([#1388](https://github.com/dendronhq/dendron/issues/1388)) ([7de9a71](https://github.com/dendronhq/dendron/commit/7de9a7195a02399b1285b51ef08d6853b1f390f6))



# 0.60.0 (2021-09-21)


### Bug Fixes

* **commands:** rename note leaves incorrect metadata if parent is a stub ([#1348](https://github.com/dendronhq/dendron/issues/1348)) ([d432cc9](https://github.com/dendronhq/dendron/commit/d432cc9e20ff8b9f6cefd7cc4c3a42b567ed9bc5))
* **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))
* **workspace:** disable certain decorations for long notes to avoid performance hit ([#1337](https://github.com/dendronhq/dendron/issues/1337)) ([f1c46f9](https://github.com/dendronhq/dendron/commit/f1c46f95c228ada2126ec7212cede3bf5acc773d))
* direct children query ([#1303](https://github.com/dendronhq/dendron/issues/1303)) ([bcf0dea](https://github.com/dendronhq/dendron/commit/bcf0deae422406564cd9a56c1765f90dd2e66215))
* issue with webpack devCLI ([a4ff4c9](https://github.com/dendronhq/dendron/commit/a4ff4c9ae28ff31ab6f9483c339ae78b5144e185))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))
* stop calendar from auto expanding when the last note is closed ([#1299](https://github.com/dendronhq/dendron/issues/1299)) ([9c8f853](https://github.com/dendronhq/dendron/commit/9c8f8533da5027c122e0d003ce4c61dc866735f5))


### Features Dendron

* consolidate dendron configs ([#1295](https://github.com/dendronhq/dendron/issues/1295)) ([177ac92](https://github.com/dendronhq/dendron/commit/177ac925a5442471f041ce5d991da52cecee6c9b))
* nextjs publishing fulltext search ([#1334](https://github.com/dendronhq/dendron/issues/1334)) ([68f8473](https://github.com/dendronhq/dendron/commit/68f8473badf22494c8d0758f8195e377235321f6))
* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* user tags ([#1228](https://github.com/dendronhq/dendron/issues/1228)) ([98c0106](https://github.com/dendronhq/dendron/commit/98c0106367e384c130a927484b9ea294eb6f84fa))



## 0.55.2 (2021-08-21)


### Bug Fixes

* wrong internal links in nextjs publishing ([#1165](https://github.com/dendronhq/dendron/issues/1165)) ([59a949d](https://github.com/dendronhq/dendron/commit/59a949d2b5b541efb283e851060636b108eb5a98))



## 0.55.1 (2021-08-17)


### Bug Fixes

* multiple issues with lookupv3 ([1fdd9eb](https://github.com/dendronhq/dendron/commit/1fdd9eb3242b43539572a1993fefd174640c6d83))
* properly log error stack ([485e220](https://github.com/dendronhq/dendron/commit/485e220f8ffa6cd63210e106e846ff305b920b77))


### Features Dendron

* Insert Note Index command ([#1142](https://github.com/dendronhq/dendron/issues/1142)) ([c140015](https://github.com/dendronhq/dendron/commit/c140015c19a942cf4696d596e818fd89905eea25))
* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* undefined tags breaks note serialization ([b1d784c](https://github.com/dendronhq/dendron/commit/b1d784c8df18b3b45999f01c14793436ff669a3f))


### Features Dendron

* colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
* resolve vim keybinding conflict on initial install ([#1103](https://github.com/dendronhq/dendron/issues/1103)) ([2278c66](https://github.com/dendronhq/dendron/commit/2278c6616c8297cc414ad02d5323bff5c45072e4))
* **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))
* Add SchemaLookupCommand ([#1082](https://github.com/dendronhq/dendron/issues/1082)) ([fe11a0e](https://github.com/dendronhq/dendron/commit/fe11a0ea1e0214823dd01842b941456df164bc70))
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* generate json schema from config ([#1100](https://github.com/dendronhq/dendron/issues/1100)) ([53b189e](https://github.com/dendronhq/dendron/commit/53b189ec973a8d3d3ccf300a0e59908197f4efb1))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.61.2](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.61.2) (2021-10-02)


### Bug Fixes

* **view:** enable anchor links to work in preview ([#1375](https://github.com/dendronhq/dendron/issues/1375)) ([f27cfb0](https://github.com/dendronhq/dendron/commit/f27cfb07d612e28fd0d6dd08019d772767900bba))
* preview caching invalidation when notes with ![[ref]] links change ([#1385](https://github.com/dendronhq/dendron/issues/1385)) ([efeef86](https://github.com/dendronhq/dendron/commit/efeef8662ec52e64ba33cae9b1196bba6cc82f95))
* **publish:** bad seo props setter ([373d933](https://github.com/dendronhq/dendron/commit/373d9331aba3b3385632f01661dd6c80835ec5ac))


### Features Dendron

* Lapsed user survey ([#1446](https://github.com/dendronhq/dendron/issues/1446)) ([8094d2b](https://github.com/dendronhq/dendron/commit/8094d2bb1972fecf4fde74e8c5644aeba3eec119)), closes [#1349](https://github.com/dendronhq/dendron/issues/1349)
* **publish:** add table of contents ([#1428](https://github.com/dendronhq/dendron/issues/1428)) ([df4b05b](https://github.com/dendronhq/dendron/commit/df4b05ba8526dc32362d6a59543d880f253f02fc))



# 0.61.0 (2021-09-28)


### Bug Fixes

* **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))
* support activation for older vscode version ([#1426](https://github.com/dendronhq/dendron/issues/1426)) ([5a1c7ed](https://github.com/dendronhq/dendron/commit/5a1c7ed9b45df2f00e61229c0776dad41cc29aba))


### Features Dendron

* **workspace:** add survey for new users([#1409](https://github.com/dendronhq/dendron/issues/1409)) ([e2b1754](https://github.com/dendronhq/dendron/commit/e2b17548fbbe3dffef961eb393f82a6a876940e7))



## 0.60.2 (2021-09-25)



## 0.60.2-alpha.0 (2021-09-24)



## 0.60.1 (2021-09-24)


### Bug Fixes

* pesky error popup when schema lookup is closed ([#1389](https://github.com/dendronhq/dendron/issues/1389)) ([4d2bb40](https://github.com/dendronhq/dendron/commit/4d2bb401b17e926dc2eaa11957536f0c75a1e538))
* single letter look up matches ([#1388](https://github.com/dendronhq/dendron/issues/1388)) ([7de9a71](https://github.com/dendronhq/dendron/commit/7de9a7195a02399b1285b51ef08d6853b1f390f6))



# 0.60.0 (2021-09-21)


### Bug Fixes

* **commands:** rename note leaves incorrect metadata if parent is a stub ([#1348](https://github.com/dendronhq/dendron/issues/1348)) ([d432cc9](https://github.com/dendronhq/dendron/commit/d432cc9e20ff8b9f6cefd7cc4c3a42b567ed9bc5))
* **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))
* **workspace:** disable certain decorations for long notes to avoid performance hit ([#1337](https://github.com/dendronhq/dendron/issues/1337)) ([f1c46f9](https://github.com/dendronhq/dendron/commit/f1c46f95c228ada2126ec7212cede3bf5acc773d))
* direct children query ([#1303](https://github.com/dendronhq/dendron/issues/1303)) ([bcf0dea](https://github.com/dendronhq/dendron/commit/bcf0deae422406564cd9a56c1765f90dd2e66215))
* issue with webpack devCLI ([a4ff4c9](https://github.com/dendronhq/dendron/commit/a4ff4c9ae28ff31ab6f9483c339ae78b5144e185))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))
* stop calendar from auto expanding when the last note is closed ([#1299](https://github.com/dendronhq/dendron/issues/1299)) ([9c8f853](https://github.com/dendronhq/dendron/commit/9c8f8533da5027c122e0d003ce4c61dc866735f5))


### Features Dendron

* consolidate dendron configs ([#1295](https://github.com/dendronhq/dendron/issues/1295)) ([177ac92](https://github.com/dendronhq/dendron/commit/177ac925a5442471f041ce5d991da52cecee6c9b))
* nextjs publishing fulltext search ([#1334](https://github.com/dendronhq/dendron/issues/1334)) ([68f8473](https://github.com/dendronhq/dendron/commit/68f8473badf22494c8d0758f8195e377235321f6))
* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* user tags ([#1228](https://github.com/dendronhq/dendron/issues/1228)) ([98c0106](https://github.com/dendronhq/dendron/commit/98c0106367e384c130a927484b9ea294eb6f84fa))



## 0.55.2 (2021-08-21)


### Bug Fixes

* wrong internal links in nextjs publishing ([#1165](https://github.com/dendronhq/dendron/issues/1165)) ([59a949d](https://github.com/dendronhq/dendron/commit/59a949d2b5b541efb283e851060636b108eb5a98))



## 0.55.1 (2021-08-17)


### Bug Fixes

* multiple issues with lookupv3 ([1fdd9eb](https://github.com/dendronhq/dendron/commit/1fdd9eb3242b43539572a1993fefd174640c6d83))
* properly log error stack ([485e220](https://github.com/dendronhq/dendron/commit/485e220f8ffa6cd63210e106e846ff305b920b77))


### Features Dendron

* Insert Note Index command ([#1142](https://github.com/dendronhq/dendron/issues/1142)) ([c140015](https://github.com/dendronhq/dendron/commit/c140015c19a942cf4696d596e818fd89905eea25))
* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* undefined tags breaks note serialization ([b1d784c](https://github.com/dendronhq/dendron/commit/b1d784c8df18b3b45999f01c14793436ff669a3f))


### Features Dendron

* colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
* resolve vim keybinding conflict on initial install ([#1103](https://github.com/dendronhq/dendron/issues/1103)) ([2278c66](https://github.com/dendronhq/dendron/commit/2278c6616c8297cc414ad02d5323bff5c45072e4))
* **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))
* Add SchemaLookupCommand ([#1082](https://github.com/dendronhq/dendron/issues/1082)) ([fe11a0e](https://github.com/dendronhq/dendron/commit/fe11a0ea1e0214823dd01842b941456df164bc70))
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* generate json schema from config ([#1100](https://github.com/dendronhq/dendron/issues/1100)) ([53b189e](https://github.com/dendronhq/dendron/commit/53b189ec973a8d3d3ccf300a0e59908197f4efb1))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.61.1](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.61.1) (2021-10-01)


### Bug Fixes

* **view:** enable anchor links to work in preview ([#1375](https://github.com/dendronhq/dendron/issues/1375)) ([f27cfb0](https://github.com/dendronhq/dendron/commit/f27cfb07d612e28fd0d6dd08019d772767900bba))
* preview caching invalidation when notes with ![[ref]] links change ([#1385](https://github.com/dendronhq/dendron/issues/1385)) ([efeef86](https://github.com/dendronhq/dendron/commit/efeef8662ec52e64ba33cae9b1196bba6cc82f95))
* **publish:** bad seo props setter ([373d933](https://github.com/dendronhq/dendron/commit/373d9331aba3b3385632f01661dd6c80835ec5ac))


### Features Dendron

* Lapsed user survey ([#1446](https://github.com/dendronhq/dendron/issues/1446)) ([8094d2b](https://github.com/dendronhq/dendron/commit/8094d2bb1972fecf4fde74e8c5644aeba3eec119)), closes [#1349](https://github.com/dendronhq/dendron/issues/1349)
* **publish:** add table of contents ([#1428](https://github.com/dendronhq/dendron/issues/1428)) ([df4b05b](https://github.com/dendronhq/dendron/commit/df4b05ba8526dc32362d6a59543d880f253f02fc))



# 0.61.0 (2021-09-28)


### Bug Fixes

* **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))
* support activation for older vscode version ([#1426](https://github.com/dendronhq/dendron/issues/1426)) ([5a1c7ed](https://github.com/dendronhq/dendron/commit/5a1c7ed9b45df2f00e61229c0776dad41cc29aba))


### Features Dendron

* **workspace:** add survey for new users([#1409](https://github.com/dendronhq/dendron/issues/1409)) ([e2b1754](https://github.com/dendronhq/dendron/commit/e2b17548fbbe3dffef961eb393f82a6a876940e7))



## 0.60.2 (2021-09-25)



## 0.60.2-alpha.0 (2021-09-24)



## 0.60.1 (2021-09-24)


### Bug Fixes

* pesky error popup when schema lookup is closed ([#1389](https://github.com/dendronhq/dendron/issues/1389)) ([4d2bb40](https://github.com/dendronhq/dendron/commit/4d2bb401b17e926dc2eaa11957536f0c75a1e538))
* single letter look up matches ([#1388](https://github.com/dendronhq/dendron/issues/1388)) ([7de9a71](https://github.com/dendronhq/dendron/commit/7de9a7195a02399b1285b51ef08d6853b1f390f6))



# 0.60.0 (2021-09-21)


### Bug Fixes

* **commands:** rename note leaves incorrect metadata if parent is a stub ([#1348](https://github.com/dendronhq/dendron/issues/1348)) ([d432cc9](https://github.com/dendronhq/dendron/commit/d432cc9e20ff8b9f6cefd7cc4c3a42b567ed9bc5))
* **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))
* **workspace:** disable certain decorations for long notes to avoid performance hit ([#1337](https://github.com/dendronhq/dendron/issues/1337)) ([f1c46f9](https://github.com/dendronhq/dendron/commit/f1c46f95c228ada2126ec7212cede3bf5acc773d))
* direct children query ([#1303](https://github.com/dendronhq/dendron/issues/1303)) ([bcf0dea](https://github.com/dendronhq/dendron/commit/bcf0deae422406564cd9a56c1765f90dd2e66215))
* issue with webpack devCLI ([a4ff4c9](https://github.com/dendronhq/dendron/commit/a4ff4c9ae28ff31ab6f9483c339ae78b5144e185))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))
* stop calendar from auto expanding when the last note is closed ([#1299](https://github.com/dendronhq/dendron/issues/1299)) ([9c8f853](https://github.com/dendronhq/dendron/commit/9c8f8533da5027c122e0d003ce4c61dc866735f5))


### Features Dendron

* consolidate dendron configs ([#1295](https://github.com/dendronhq/dendron/issues/1295)) ([177ac92](https://github.com/dendronhq/dendron/commit/177ac925a5442471f041ce5d991da52cecee6c9b))
* nextjs publishing fulltext search ([#1334](https://github.com/dendronhq/dendron/issues/1334)) ([68f8473](https://github.com/dendronhq/dendron/commit/68f8473badf22494c8d0758f8195e377235321f6))
* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* user tags ([#1228](https://github.com/dendronhq/dendron/issues/1228)) ([98c0106](https://github.com/dendronhq/dendron/commit/98c0106367e384c130a927484b9ea294eb6f84fa))



## 0.55.2 (2021-08-21)


### Bug Fixes

* wrong internal links in nextjs publishing ([#1165](https://github.com/dendronhq/dendron/issues/1165)) ([59a949d](https://github.com/dendronhq/dendron/commit/59a949d2b5b541efb283e851060636b108eb5a98))



## 0.55.1 (2021-08-17)


### Bug Fixes

* multiple issues with lookupv3 ([1fdd9eb](https://github.com/dendronhq/dendron/commit/1fdd9eb3242b43539572a1993fefd174640c6d83))
* properly log error stack ([485e220](https://github.com/dendronhq/dendron/commit/485e220f8ffa6cd63210e106e846ff305b920b77))


### Features Dendron

* Insert Note Index command ([#1142](https://github.com/dendronhq/dendron/issues/1142)) ([c140015](https://github.com/dendronhq/dendron/commit/c140015c19a942cf4696d596e818fd89905eea25))
* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* undefined tags breaks note serialization ([b1d784c](https://github.com/dendronhq/dendron/commit/b1d784c8df18b3b45999f01c14793436ff669a3f))


### Features Dendron

* colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
* resolve vim keybinding conflict on initial install ([#1103](https://github.com/dendronhq/dendron/issues/1103)) ([2278c66](https://github.com/dendronhq/dendron/commit/2278c6616c8297cc414ad02d5323bff5c45072e4))
* **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))
* Add SchemaLookupCommand ([#1082](https://github.com/dendronhq/dendron/issues/1082)) ([fe11a0e](https://github.com/dendronhq/dendron/commit/fe11a0ea1e0214823dd01842b941456df164bc70))
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* generate json schema from config ([#1100](https://github.com/dendronhq/dendron/issues/1100)) ([53b189e](https://github.com/dendronhq/dendron/commit/53b189ec973a8d3d3ccf300a0e59908197f4efb1))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.61.1-alpha.0](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.61.1-alpha.0) (2021-09-29)


### Bug Fixes

* **publish:** bad seo props setter ([4cef01a](https://github.com/dendronhq/dendron/commit/4cef01a8b4b83acff707e7636c0b8ab751200c1b))



# 0.61.0 (2021-09-28)


### Bug Fixes

* **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))
* support activation for older vscode version ([#1426](https://github.com/dendronhq/dendron/issues/1426)) ([5a1c7ed](https://github.com/dendronhq/dendron/commit/5a1c7ed9b45df2f00e61229c0776dad41cc29aba))


### Features Dendron

* **workspace:** add survey for new users([#1409](https://github.com/dendronhq/dendron/issues/1409)) ([e2b1754](https://github.com/dendronhq/dendron/commit/e2b17548fbbe3dffef961eb393f82a6a876940e7))



## 0.60.2 (2021-09-25)



## 0.60.2-alpha.0 (2021-09-24)



## 0.60.1 (2021-09-24)


### Bug Fixes

* pesky error popup when schema lookup is closed ([#1389](https://github.com/dendronhq/dendron/issues/1389)) ([4d2bb40](https://github.com/dendronhq/dendron/commit/4d2bb401b17e926dc2eaa11957536f0c75a1e538))
* single letter look up matches ([#1388](https://github.com/dendronhq/dendron/issues/1388)) ([7de9a71](https://github.com/dendronhq/dendron/commit/7de9a7195a02399b1285b51ef08d6853b1f390f6))



# 0.60.0 (2021-09-21)


### Bug Fixes

* **commands:** rename note leaves incorrect metadata if parent is a stub ([#1348](https://github.com/dendronhq/dendron/issues/1348)) ([d432cc9](https://github.com/dendronhq/dendron/commit/d432cc9e20ff8b9f6cefd7cc4c3a42b567ed9bc5))
* **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))
* **workspace:** disable certain decorations for long notes to avoid performance hit ([#1337](https://github.com/dendronhq/dendron/issues/1337)) ([f1c46f9](https://github.com/dendronhq/dendron/commit/f1c46f95c228ada2126ec7212cede3bf5acc773d))
* direct children query ([#1303](https://github.com/dendronhq/dendron/issues/1303)) ([bcf0dea](https://github.com/dendronhq/dendron/commit/bcf0deae422406564cd9a56c1765f90dd2e66215))
* issue with webpack devCLI ([a4ff4c9](https://github.com/dendronhq/dendron/commit/a4ff4c9ae28ff31ab6f9483c339ae78b5144e185))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))
* stop calendar from auto expanding when the last note is closed ([#1299](https://github.com/dendronhq/dendron/issues/1299)) ([9c8f853](https://github.com/dendronhq/dendron/commit/9c8f8533da5027c122e0d003ce4c61dc866735f5))


### Features Dendron

* consolidate dendron configs ([#1295](https://github.com/dendronhq/dendron/issues/1295)) ([177ac92](https://github.com/dendronhq/dendron/commit/177ac925a5442471f041ce5d991da52cecee6c9b))
* nextjs publishing fulltext search ([#1334](https://github.com/dendronhq/dendron/issues/1334)) ([68f8473](https://github.com/dendronhq/dendron/commit/68f8473badf22494c8d0758f8195e377235321f6))
* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* user tags ([#1228](https://github.com/dendronhq/dendron/issues/1228)) ([98c0106](https://github.com/dendronhq/dendron/commit/98c0106367e384c130a927484b9ea294eb6f84fa))



## 0.55.2 (2021-08-21)


### Bug Fixes

* wrong internal links in nextjs publishing ([#1165](https://github.com/dendronhq/dendron/issues/1165)) ([59a949d](https://github.com/dendronhq/dendron/commit/59a949d2b5b541efb283e851060636b108eb5a98))



## 0.55.1 (2021-08-17)


### Bug Fixes

* multiple issues with lookupv3 ([1fdd9eb](https://github.com/dendronhq/dendron/commit/1fdd9eb3242b43539572a1993fefd174640c6d83))
* properly log error stack ([485e220](https://github.com/dendronhq/dendron/commit/485e220f8ffa6cd63210e106e846ff305b920b77))


### Features Dendron

* Insert Note Index command ([#1142](https://github.com/dendronhq/dendron/issues/1142)) ([c140015](https://github.com/dendronhq/dendron/commit/c140015c19a942cf4696d596e818fd89905eea25))
* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* undefined tags breaks note serialization ([b1d784c](https://github.com/dendronhq/dendron/commit/b1d784c8df18b3b45999f01c14793436ff669a3f))


### Features Dendron

* colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
* resolve vim keybinding conflict on initial install ([#1103](https://github.com/dendronhq/dendron/issues/1103)) ([2278c66](https://github.com/dendronhq/dendron/commit/2278c6616c8297cc414ad02d5323bff5c45072e4))
* **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))
* Add SchemaLookupCommand ([#1082](https://github.com/dendronhq/dendron/issues/1082)) ([fe11a0e](https://github.com/dendronhq/dendron/commit/fe11a0ea1e0214823dd01842b941456df164bc70))
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* generate json schema from config ([#1100](https://github.com/dendronhq/dendron/issues/1100)) ([53b189e](https://github.com/dendronhq/dendron/commit/53b189ec973a8d3d3ccf300a0e59908197f4efb1))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





# [0.61.0](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.61.0) (2021-09-28)


### Bug Fixes

* **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))
* support activation for older vscode version ([#1426](https://github.com/dendronhq/dendron/issues/1426)) ([5a1c7ed](https://github.com/dendronhq/dendron/commit/5a1c7ed9b45df2f00e61229c0776dad41cc29aba))


### Features Dendron

* **workspace:** add survey for new users([#1409](https://github.com/dendronhq/dendron/issues/1409)) ([e2b1754](https://github.com/dendronhq/dendron/commit/e2b17548fbbe3dffef961eb393f82a6a876940e7))



## 0.60.2 (2021-09-25)



## 0.60.2-alpha.0 (2021-09-24)



## 0.60.1 (2021-09-24)


### Bug Fixes

* pesky error popup when schema lookup is closed ([#1389](https://github.com/dendronhq/dendron/issues/1389)) ([4d2bb40](https://github.com/dendronhq/dendron/commit/4d2bb401b17e926dc2eaa11957536f0c75a1e538))
* single letter look up matches ([#1388](https://github.com/dendronhq/dendron/issues/1388)) ([7de9a71](https://github.com/dendronhq/dendron/commit/7de9a7195a02399b1285b51ef08d6853b1f390f6))



# 0.60.0 (2021-09-21)


### Bug Fixes

* **commands:** rename note leaves incorrect metadata if parent is a stub ([#1348](https://github.com/dendronhq/dendron/issues/1348)) ([d432cc9](https://github.com/dendronhq/dendron/commit/d432cc9e20ff8b9f6cefd7cc4c3a42b567ed9bc5))
* **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))
* **workspace:** disable certain decorations for long notes to avoid performance hit ([#1337](https://github.com/dendronhq/dendron/issues/1337)) ([f1c46f9](https://github.com/dendronhq/dendron/commit/f1c46f95c228ada2126ec7212cede3bf5acc773d))
* direct children query ([#1303](https://github.com/dendronhq/dendron/issues/1303)) ([bcf0dea](https://github.com/dendronhq/dendron/commit/bcf0deae422406564cd9a56c1765f90dd2e66215))
* issue with webpack devCLI ([a4ff4c9](https://github.com/dendronhq/dendron/commit/a4ff4c9ae28ff31ab6f9483c339ae78b5144e185))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))
* stop calendar from auto expanding when the last note is closed ([#1299](https://github.com/dendronhq/dendron/issues/1299)) ([9c8f853](https://github.com/dendronhq/dendron/commit/9c8f8533da5027c122e0d003ce4c61dc866735f5))


### Features Dendron

* consolidate dendron configs ([#1295](https://github.com/dendronhq/dendron/issues/1295)) ([177ac92](https://github.com/dendronhq/dendron/commit/177ac925a5442471f041ce5d991da52cecee6c9b))
* nextjs publishing fulltext search ([#1334](https://github.com/dendronhq/dendron/issues/1334)) ([68f8473](https://github.com/dendronhq/dendron/commit/68f8473badf22494c8d0758f8195e377235321f6))
* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* user tags ([#1228](https://github.com/dendronhq/dendron/issues/1228)) ([98c0106](https://github.com/dendronhq/dendron/commit/98c0106367e384c130a927484b9ea294eb6f84fa))



## 0.55.2 (2021-08-21)


### Bug Fixes

* wrong internal links in nextjs publishing ([#1165](https://github.com/dendronhq/dendron/issues/1165)) ([59a949d](https://github.com/dendronhq/dendron/commit/59a949d2b5b541efb283e851060636b108eb5a98))



## 0.55.1 (2021-08-17)


### Bug Fixes

* multiple issues with lookupv3 ([1fdd9eb](https://github.com/dendronhq/dendron/commit/1fdd9eb3242b43539572a1993fefd174640c6d83))
* properly log error stack ([485e220](https://github.com/dendronhq/dendron/commit/485e220f8ffa6cd63210e106e846ff305b920b77))


### Features Dendron

* Insert Note Index command ([#1142](https://github.com/dendronhq/dendron/issues/1142)) ([c140015](https://github.com/dendronhq/dendron/commit/c140015c19a942cf4696d596e818fd89905eea25))
* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* undefined tags breaks note serialization ([b1d784c](https://github.com/dendronhq/dendron/commit/b1d784c8df18b3b45999f01c14793436ff669a3f))


### Features Dendron

* colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
* resolve vim keybinding conflict on initial install ([#1103](https://github.com/dendronhq/dendron/issues/1103)) ([2278c66](https://github.com/dendronhq/dendron/commit/2278c6616c8297cc414ad02d5323bff5c45072e4))
* **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))
* Add SchemaLookupCommand ([#1082](https://github.com/dendronhq/dendron/issues/1082)) ([fe11a0e](https://github.com/dendronhq/dendron/commit/fe11a0ea1e0214823dd01842b941456df164bc70))
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* generate json schema from config ([#1100](https://github.com/dendronhq/dendron/issues/1100)) ([53b189e](https://github.com/dendronhq/dendron/commit/53b189ec973a8d3d3ccf300a0e59908197f4efb1))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.60.3-alpha.0](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.60.3-alpha.0) (2021-09-28)


### Bug Fixes

* support activation for older vscode version ([#1426](https://github.com/dendronhq/dendron/issues/1426)) ([5a1c7ed](https://github.com/dendronhq/dendron/commit/5a1c7ed9b45df2f00e61229c0776dad41cc29aba))


### Reverts

* Revert "chore: remove vim fix" ([82b4713](https://github.com/dendronhq/dendron/commit/82b47134073a8107cc479477ad77ba4d143d804d))



## 0.60.2 (2021-09-25)



## 0.60.2-alpha.0 (2021-09-24)



## 0.60.1 (2021-09-24)


### Bug Fixes

* pesky error popup when schema lookup is closed ([#1389](https://github.com/dendronhq/dendron/issues/1389)) ([4d2bb40](https://github.com/dendronhq/dendron/commit/4d2bb401b17e926dc2eaa11957536f0c75a1e538))
* single letter look up matches ([#1388](https://github.com/dendronhq/dendron/issues/1388)) ([7de9a71](https://github.com/dendronhq/dendron/commit/7de9a7195a02399b1285b51ef08d6853b1f390f6))



# 0.60.0 (2021-09-21)


### Bug Fixes

* **commands:** rename note leaves incorrect metadata if parent is a stub ([#1348](https://github.com/dendronhq/dendron/issues/1348)) ([d432cc9](https://github.com/dendronhq/dendron/commit/d432cc9e20ff8b9f6cefd7cc4c3a42b567ed9bc5))
* **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))
* **workspace:** disable certain decorations for long notes to avoid performance hit ([#1337](https://github.com/dendronhq/dendron/issues/1337)) ([f1c46f9](https://github.com/dendronhq/dendron/commit/f1c46f95c228ada2126ec7212cede3bf5acc773d))
* direct children query ([#1303](https://github.com/dendronhq/dendron/issues/1303)) ([bcf0dea](https://github.com/dendronhq/dendron/commit/bcf0deae422406564cd9a56c1765f90dd2e66215))
* issue with webpack devCLI ([a4ff4c9](https://github.com/dendronhq/dendron/commit/a4ff4c9ae28ff31ab6f9483c339ae78b5144e185))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))
* stop calendar from auto expanding when the last note is closed ([#1299](https://github.com/dendronhq/dendron/issues/1299)) ([9c8f853](https://github.com/dendronhq/dendron/commit/9c8f8533da5027c122e0d003ce4c61dc866735f5))


### Features Dendron

* consolidate dendron configs ([#1295](https://github.com/dendronhq/dendron/issues/1295)) ([177ac92](https://github.com/dendronhq/dendron/commit/177ac925a5442471f041ce5d991da52cecee6c9b))
* nextjs publishing fulltext search ([#1334](https://github.com/dendronhq/dendron/issues/1334)) ([68f8473](https://github.com/dendronhq/dendron/commit/68f8473badf22494c8d0758f8195e377235321f6))
* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* user tags ([#1228](https://github.com/dendronhq/dendron/issues/1228)) ([98c0106](https://github.com/dendronhq/dendron/commit/98c0106367e384c130a927484b9ea294eb6f84fa))



## 0.55.2 (2021-08-21)


### Bug Fixes

* wrong internal links in nextjs publishing ([#1165](https://github.com/dendronhq/dendron/issues/1165)) ([59a949d](https://github.com/dendronhq/dendron/commit/59a949d2b5b541efb283e851060636b108eb5a98))



## 0.55.1 (2021-08-17)


### Bug Fixes

* multiple issues with lookupv3 ([1fdd9eb](https://github.com/dendronhq/dendron/commit/1fdd9eb3242b43539572a1993fefd174640c6d83))
* properly log error stack ([485e220](https://github.com/dendronhq/dendron/commit/485e220f8ffa6cd63210e106e846ff305b920b77))


### Features Dendron

* Insert Note Index command ([#1142](https://github.com/dendronhq/dendron/issues/1142)) ([c140015](https://github.com/dendronhq/dendron/commit/c140015c19a942cf4696d596e818fd89905eea25))
* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* undefined tags breaks note serialization ([b1d784c](https://github.com/dendronhq/dendron/commit/b1d784c8df18b3b45999f01c14793436ff669a3f))


### Features Dendron

* colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
* resolve vim keybinding conflict on initial install ([#1103](https://github.com/dendronhq/dendron/issues/1103)) ([2278c66](https://github.com/dendronhq/dendron/commit/2278c6616c8297cc414ad02d5323bff5c45072e4))
* **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))
* Add SchemaLookupCommand ([#1082](https://github.com/dendronhq/dendron/issues/1082)) ([fe11a0e](https://github.com/dendronhq/dendron/commit/fe11a0ea1e0214823dd01842b941456df164bc70))
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* generate json schema from config ([#1100](https://github.com/dendronhq/dendron/issues/1100)) ([53b189e](https://github.com/dendronhq/dendron/commit/53b189ec973a8d3d3ccf300a0e59908197f4efb1))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.60.2](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.60.2) (2021-09-25)



## 0.60.2-alpha.0 (2021-09-24)



## 0.60.1 (2021-09-24)


### Bug Fixes

* pesky error popup when schema lookup is closed ([#1389](https://github.com/dendronhq/dendron/issues/1389)) ([4d2bb40](https://github.com/dendronhq/dendron/commit/4d2bb401b17e926dc2eaa11957536f0c75a1e538))
* single letter look up matches ([#1388](https://github.com/dendronhq/dendron/issues/1388)) ([7de9a71](https://github.com/dendronhq/dendron/commit/7de9a7195a02399b1285b51ef08d6853b1f390f6))



# 0.60.0 (2021-09-21)


### Bug Fixes

* **commands:** rename note leaves incorrect metadata if parent is a stub ([#1348](https://github.com/dendronhq/dendron/issues/1348)) ([d432cc9](https://github.com/dendronhq/dendron/commit/d432cc9e20ff8b9f6cefd7cc4c3a42b567ed9bc5))
* **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))
* **workspace:** disable certain decorations for long notes to avoid performance hit ([#1337](https://github.com/dendronhq/dendron/issues/1337)) ([f1c46f9](https://github.com/dendronhq/dendron/commit/f1c46f95c228ada2126ec7212cede3bf5acc773d))
* direct children query ([#1303](https://github.com/dendronhq/dendron/issues/1303)) ([bcf0dea](https://github.com/dendronhq/dendron/commit/bcf0deae422406564cd9a56c1765f90dd2e66215))
* issue with webpack devCLI ([a4ff4c9](https://github.com/dendronhq/dendron/commit/a4ff4c9ae28ff31ab6f9483c339ae78b5144e185))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))
* stop calendar from auto expanding when the last note is closed ([#1299](https://github.com/dendronhq/dendron/issues/1299)) ([9c8f853](https://github.com/dendronhq/dendron/commit/9c8f8533da5027c122e0d003ce4c61dc866735f5))


### Features Dendron

* consolidate dendron configs ([#1295](https://github.com/dendronhq/dendron/issues/1295)) ([177ac92](https://github.com/dendronhq/dendron/commit/177ac925a5442471f041ce5d991da52cecee6c9b))
* nextjs publishing fulltext search ([#1334](https://github.com/dendronhq/dendron/issues/1334)) ([68f8473](https://github.com/dendronhq/dendron/commit/68f8473badf22494c8d0758f8195e377235321f6))
* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* user tags ([#1228](https://github.com/dendronhq/dendron/issues/1228)) ([98c0106](https://github.com/dendronhq/dendron/commit/98c0106367e384c130a927484b9ea294eb6f84fa))



## 0.55.2 (2021-08-21)


### Bug Fixes

* wrong internal links in nextjs publishing ([#1165](https://github.com/dendronhq/dendron/issues/1165)) ([59a949d](https://github.com/dendronhq/dendron/commit/59a949d2b5b541efb283e851060636b108eb5a98))



## 0.55.1 (2021-08-17)


### Bug Fixes

* multiple issues with lookupv3 ([1fdd9eb](https://github.com/dendronhq/dendron/commit/1fdd9eb3242b43539572a1993fefd174640c6d83))
* properly log error stack ([485e220](https://github.com/dendronhq/dendron/commit/485e220f8ffa6cd63210e106e846ff305b920b77))


### Features Dendron

* Insert Note Index command ([#1142](https://github.com/dendronhq/dendron/issues/1142)) ([c140015](https://github.com/dendronhq/dendron/commit/c140015c19a942cf4696d596e818fd89905eea25))
* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* undefined tags breaks note serialization ([b1d784c](https://github.com/dendronhq/dendron/commit/b1d784c8df18b3b45999f01c14793436ff669a3f))


### Features Dendron

* colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
* resolve vim keybinding conflict on initial install ([#1103](https://github.com/dendronhq/dendron/issues/1103)) ([2278c66](https://github.com/dendronhq/dendron/commit/2278c6616c8297cc414ad02d5323bff5c45072e4))
* **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))
* Add SchemaLookupCommand ([#1082](https://github.com/dendronhq/dendron/issues/1082)) ([fe11a0e](https://github.com/dendronhq/dendron/commit/fe11a0ea1e0214823dd01842b941456df164bc70))
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* generate json schema from config ([#1100](https://github.com/dendronhq/dendron/issues/1100)) ([53b189e](https://github.com/dendronhq/dendron/commit/53b189ec973a8d3d3ccf300a0e59908197f4efb1))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.60.2-alpha.0](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.60.2-alpha.0) (2021-09-24)



## 0.60.1 (2021-09-24)


### Bug Fixes

* pesky error popup when schema lookup is closed ([#1389](https://github.com/dendronhq/dendron/issues/1389)) ([4d2bb40](https://github.com/dendronhq/dendron/commit/4d2bb401b17e926dc2eaa11957536f0c75a1e538))
* single letter look up matches ([#1388](https://github.com/dendronhq/dendron/issues/1388)) ([7de9a71](https://github.com/dendronhq/dendron/commit/7de9a7195a02399b1285b51ef08d6853b1f390f6))



# 0.60.0 (2021-09-21)


### Bug Fixes

* **commands:** rename note leaves incorrect metadata if parent is a stub ([#1348](https://github.com/dendronhq/dendron/issues/1348)) ([d432cc9](https://github.com/dendronhq/dendron/commit/d432cc9e20ff8b9f6cefd7cc4c3a42b567ed9bc5))
* **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))
* **workspace:** disable certain decorations for long notes to avoid performance hit ([#1337](https://github.com/dendronhq/dendron/issues/1337)) ([f1c46f9](https://github.com/dendronhq/dendron/commit/f1c46f95c228ada2126ec7212cede3bf5acc773d))
* direct children query ([#1303](https://github.com/dendronhq/dendron/issues/1303)) ([bcf0dea](https://github.com/dendronhq/dendron/commit/bcf0deae422406564cd9a56c1765f90dd2e66215))
* issue with webpack devCLI ([a4ff4c9](https://github.com/dendronhq/dendron/commit/a4ff4c9ae28ff31ab6f9483c339ae78b5144e185))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))
* stop calendar from auto expanding when the last note is closed ([#1299](https://github.com/dendronhq/dendron/issues/1299)) ([9c8f853](https://github.com/dendronhq/dendron/commit/9c8f8533da5027c122e0d003ce4c61dc866735f5))


### Features Dendron

* consolidate dendron configs ([#1295](https://github.com/dendronhq/dendron/issues/1295)) ([177ac92](https://github.com/dendronhq/dendron/commit/177ac925a5442471f041ce5d991da52cecee6c9b))
* nextjs publishing fulltext search ([#1334](https://github.com/dendronhq/dendron/issues/1334)) ([68f8473](https://github.com/dendronhq/dendron/commit/68f8473badf22494c8d0758f8195e377235321f6))
* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* user tags ([#1228](https://github.com/dendronhq/dendron/issues/1228)) ([98c0106](https://github.com/dendronhq/dendron/commit/98c0106367e384c130a927484b9ea294eb6f84fa))



## 0.55.2 (2021-08-21)


### Bug Fixes

* wrong internal links in nextjs publishing ([#1165](https://github.com/dendronhq/dendron/issues/1165)) ([59a949d](https://github.com/dendronhq/dendron/commit/59a949d2b5b541efb283e851060636b108eb5a98))



## 0.55.1 (2021-08-17)


### Bug Fixes

* multiple issues with lookupv3 ([1fdd9eb](https://github.com/dendronhq/dendron/commit/1fdd9eb3242b43539572a1993fefd174640c6d83))
* properly log error stack ([485e220](https://github.com/dendronhq/dendron/commit/485e220f8ffa6cd63210e106e846ff305b920b77))


### Features Dendron

* Insert Note Index command ([#1142](https://github.com/dendronhq/dendron/issues/1142)) ([c140015](https://github.com/dendronhq/dendron/commit/c140015c19a942cf4696d596e818fd89905eea25))
* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* undefined tags breaks note serialization ([b1d784c](https://github.com/dendronhq/dendron/commit/b1d784c8df18b3b45999f01c14793436ff669a3f))


### Features Dendron

* colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
* resolve vim keybinding conflict on initial install ([#1103](https://github.com/dendronhq/dendron/issues/1103)) ([2278c66](https://github.com/dendronhq/dendron/commit/2278c6616c8297cc414ad02d5323bff5c45072e4))
* **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))
* Add SchemaLookupCommand ([#1082](https://github.com/dendronhq/dendron/issues/1082)) ([fe11a0e](https://github.com/dendronhq/dendron/commit/fe11a0ea1e0214823dd01842b941456df164bc70))
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* generate json schema from config ([#1100](https://github.com/dendronhq/dendron/issues/1100)) ([53b189e](https://github.com/dendronhq/dendron/commit/53b189ec973a8d3d3ccf300a0e59908197f4efb1))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.60.1](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.60.1) (2021-09-24)


### Bug Fixes

* **workspace:** corrupted keybindings ([f63bf5a](https://github.com/dendronhq/dendron/commit/f63bf5afb622f332811047fe48db8e2fd53fc167)), closes [#1290](https://github.com/dendronhq/dendron/issues/1290) [#1392](https://github.com/dendronhq/dendron/issues/1392) [#1371](https://github.com/dendronhq/dendron/issues/1371) [#1389](https://github.com/dendronhq/dendron/issues/1389) [#1388](https://github.com/dendronhq/dendron/issues/1388) [#1369](https://github.com/dendronhq/dendron/issues/1369) [#1387](https://github.com/dendronhq/dendron/issues/1387) [#1386](https://github.com/dendronhq/dendron/issues/1386) [#1384](https://github.com/dendronhq/dendron/issues/1384) [#1383](https://github.com/dendronhq/dendron/issues/1383) [#1370](https://github.com/dendronhq/dendron/issues/1370) [#1352](https://github.com/dendronhq/dendron/issues/1352) [#1382](https://github.com/dendronhq/dendron/issues/1382) [#1332](https://github.com/dendronhq/dendron/issues/1332)



# 0.60.0 (2021-09-21)


### Bug Fixes

* **commands:** rename note leaves incorrect metadata if parent is a stub ([#1348](https://github.com/dendronhq/dendron/issues/1348)) ([d432cc9](https://github.com/dendronhq/dendron/commit/d432cc9e20ff8b9f6cefd7cc4c3a42b567ed9bc5))
* **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))
* **workspace:** disable certain decorations for long notes to avoid performance hit ([#1337](https://github.com/dendronhq/dendron/issues/1337)) ([f1c46f9](https://github.com/dendronhq/dendron/commit/f1c46f95c228ada2126ec7212cede3bf5acc773d))
* direct children query ([#1303](https://github.com/dendronhq/dendron/issues/1303)) ([bcf0dea](https://github.com/dendronhq/dendron/commit/bcf0deae422406564cd9a56c1765f90dd2e66215))
* issue with webpack devCLI ([a4ff4c9](https://github.com/dendronhq/dendron/commit/a4ff4c9ae28ff31ab6f9483c339ae78b5144e185))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))
* stop calendar from auto expanding when the last note is closed ([#1299](https://github.com/dendronhq/dendron/issues/1299)) ([9c8f853](https://github.com/dendronhq/dendron/commit/9c8f8533da5027c122e0d003ce4c61dc866735f5))


### Features Dendron

* consolidate dendron configs ([#1295](https://github.com/dendronhq/dendron/issues/1295)) ([177ac92](https://github.com/dendronhq/dendron/commit/177ac925a5442471f041ce5d991da52cecee6c9b))
* nextjs publishing fulltext search ([#1334](https://github.com/dendronhq/dendron/issues/1334)) ([68f8473](https://github.com/dendronhq/dendron/commit/68f8473badf22494c8d0758f8195e377235321f6))
* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* user tags ([#1228](https://github.com/dendronhq/dendron/issues/1228)) ([98c0106](https://github.com/dendronhq/dendron/commit/98c0106367e384c130a927484b9ea294eb6f84fa))



## 0.55.2 (2021-08-21)


### Bug Fixes

* wrong internal links in nextjs publishing ([#1165](https://github.com/dendronhq/dendron/issues/1165)) ([59a949d](https://github.com/dendronhq/dendron/commit/59a949d2b5b541efb283e851060636b108eb5a98))



## 0.55.1 (2021-08-17)


### Bug Fixes

* multiple issues with lookupv3 ([1fdd9eb](https://github.com/dendronhq/dendron/commit/1fdd9eb3242b43539572a1993fefd174640c6d83))
* properly log error stack ([485e220](https://github.com/dendronhq/dendron/commit/485e220f8ffa6cd63210e106e846ff305b920b77))


### Features Dendron

* Insert Note Index command ([#1142](https://github.com/dendronhq/dendron/issues/1142)) ([c140015](https://github.com/dendronhq/dendron/commit/c140015c19a942cf4696d596e818fd89905eea25))
* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* undefined tags breaks note serialization ([b1d784c](https://github.com/dendronhq/dendron/commit/b1d784c8df18b3b45999f01c14793436ff669a3f))


### Features Dendron

* colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
* resolve vim keybinding conflict on initial install ([#1103](https://github.com/dendronhq/dendron/issues/1103)) ([2278c66](https://github.com/dendronhq/dendron/commit/2278c6616c8297cc414ad02d5323bff5c45072e4))
* **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))
* Add SchemaLookupCommand ([#1082](https://github.com/dendronhq/dendron/issues/1082)) ([fe11a0e](https://github.com/dendronhq/dendron/commit/fe11a0ea1e0214823dd01842b941456df164bc70))
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* generate json schema from config ([#1100](https://github.com/dendronhq/dendron/issues/1100)) ([53b189e](https://github.com/dendronhq/dendron/commit/53b189ec973a8d3d3ccf300a0e59908197f4efb1))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.60.1-alpha.3](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.60.1-alpha.3) (2021-09-23)


### Bug Fixes

* pesky error popup when schema lookup is closed ([#1389](https://github.com/dendronhq/dendron/issues/1389)) ([4d2bb40](https://github.com/dendronhq/dendron/commit/4d2bb401b17e926dc2eaa11957536f0c75a1e538))
* single letter look up matches ([#1388](https://github.com/dendronhq/dendron/issues/1388)) ([7de9a71](https://github.com/dendronhq/dendron/commit/7de9a7195a02399b1285b51ef08d6853b1f390f6))



# 0.60.0 (2021-09-21)


### Bug Fixes

* **commands:** rename note leaves incorrect metadata if parent is a stub ([#1348](https://github.com/dendronhq/dendron/issues/1348)) ([d432cc9](https://github.com/dendronhq/dendron/commit/d432cc9e20ff8b9f6cefd7cc4c3a42b567ed9bc5))
* **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))
* **workspace:** disable certain decorations for long notes to avoid performance hit ([#1337](https://github.com/dendronhq/dendron/issues/1337)) ([f1c46f9](https://github.com/dendronhq/dendron/commit/f1c46f95c228ada2126ec7212cede3bf5acc773d))
* direct children query ([#1303](https://github.com/dendronhq/dendron/issues/1303)) ([bcf0dea](https://github.com/dendronhq/dendron/commit/bcf0deae422406564cd9a56c1765f90dd2e66215))
* issue with webpack devCLI ([a4ff4c9](https://github.com/dendronhq/dendron/commit/a4ff4c9ae28ff31ab6f9483c339ae78b5144e185))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))
* stop calendar from auto expanding when the last note is closed ([#1299](https://github.com/dendronhq/dendron/issues/1299)) ([9c8f853](https://github.com/dendronhq/dendron/commit/9c8f8533da5027c122e0d003ce4c61dc866735f5))


### Features Dendron

* consolidate dendron configs ([#1295](https://github.com/dendronhq/dendron/issues/1295)) ([177ac92](https://github.com/dendronhq/dendron/commit/177ac925a5442471f041ce5d991da52cecee6c9b))
* nextjs publishing fulltext search ([#1334](https://github.com/dendronhq/dendron/issues/1334)) ([68f8473](https://github.com/dendronhq/dendron/commit/68f8473badf22494c8d0758f8195e377235321f6))
* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* user tags ([#1228](https://github.com/dendronhq/dendron/issues/1228)) ([98c0106](https://github.com/dendronhq/dendron/commit/98c0106367e384c130a927484b9ea294eb6f84fa))



## 0.55.2 (2021-08-21)


### Bug Fixes

* wrong internal links in nextjs publishing ([#1165](https://github.com/dendronhq/dendron/issues/1165)) ([59a949d](https://github.com/dendronhq/dendron/commit/59a949d2b5b541efb283e851060636b108eb5a98))



## 0.55.1 (2021-08-17)


### Bug Fixes

* multiple issues with lookupv3 ([1fdd9eb](https://github.com/dendronhq/dendron/commit/1fdd9eb3242b43539572a1993fefd174640c6d83))
* properly log error stack ([485e220](https://github.com/dendronhq/dendron/commit/485e220f8ffa6cd63210e106e846ff305b920b77))


### Features Dendron

* Insert Note Index command ([#1142](https://github.com/dendronhq/dendron/issues/1142)) ([c140015](https://github.com/dendronhq/dendron/commit/c140015c19a942cf4696d596e818fd89905eea25))
* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* undefined tags breaks note serialization ([b1d784c](https://github.com/dendronhq/dendron/commit/b1d784c8df18b3b45999f01c14793436ff669a3f))


### Features Dendron

* colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
* resolve vim keybinding conflict on initial install ([#1103](https://github.com/dendronhq/dendron/issues/1103)) ([2278c66](https://github.com/dendronhq/dendron/commit/2278c6616c8297cc414ad02d5323bff5c45072e4))
* **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))
* Add SchemaLookupCommand ([#1082](https://github.com/dendronhq/dendron/issues/1082)) ([fe11a0e](https://github.com/dendronhq/dendron/commit/fe11a0ea1e0214823dd01842b941456df164bc70))
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* generate json schema from config ([#1100](https://github.com/dendronhq/dendron/issues/1100)) ([53b189e](https://github.com/dendronhq/dendron/commit/53b189ec973a8d3d3ccf300a0e59908197f4efb1))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.60.1-alpha.2](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.60.1-alpha.2) (2021-09-22)



# 0.60.0 (2021-09-21)


### Bug Fixes

* **commands:** rename note leaves incorrect metadata if parent is a stub ([#1348](https://github.com/dendronhq/dendron/issues/1348)) ([d432cc9](https://github.com/dendronhq/dendron/commit/d432cc9e20ff8b9f6cefd7cc4c3a42b567ed9bc5))
* **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))
* **workspace:** disable certain decorations for long notes to avoid performance hit ([#1337](https://github.com/dendronhq/dendron/issues/1337)) ([f1c46f9](https://github.com/dendronhq/dendron/commit/f1c46f95c228ada2126ec7212cede3bf5acc773d))
* direct children query ([#1303](https://github.com/dendronhq/dendron/issues/1303)) ([bcf0dea](https://github.com/dendronhq/dendron/commit/bcf0deae422406564cd9a56c1765f90dd2e66215))
* issue with webpack devCLI ([a4ff4c9](https://github.com/dendronhq/dendron/commit/a4ff4c9ae28ff31ab6f9483c339ae78b5144e185))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))
* stop calendar from auto expanding when the last note is closed ([#1299](https://github.com/dendronhq/dendron/issues/1299)) ([9c8f853](https://github.com/dendronhq/dendron/commit/9c8f8533da5027c122e0d003ce4c61dc866735f5))


### Features Dendron

* consolidate dendron configs ([#1295](https://github.com/dendronhq/dendron/issues/1295)) ([177ac92](https://github.com/dendronhq/dendron/commit/177ac925a5442471f041ce5d991da52cecee6c9b))
* nextjs publishing fulltext search ([#1334](https://github.com/dendronhq/dendron/issues/1334)) ([68f8473](https://github.com/dendronhq/dendron/commit/68f8473badf22494c8d0758f8195e377235321f6))
* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* user tags ([#1228](https://github.com/dendronhq/dendron/issues/1228)) ([98c0106](https://github.com/dendronhq/dendron/commit/98c0106367e384c130a927484b9ea294eb6f84fa))



## 0.55.2 (2021-08-21)


### Bug Fixes

* wrong internal links in nextjs publishing ([#1165](https://github.com/dendronhq/dendron/issues/1165)) ([59a949d](https://github.com/dendronhq/dendron/commit/59a949d2b5b541efb283e851060636b108eb5a98))



## 0.55.1 (2021-08-17)


### Bug Fixes

* multiple issues with lookupv3 ([1fdd9eb](https://github.com/dendronhq/dendron/commit/1fdd9eb3242b43539572a1993fefd174640c6d83))
* properly log error stack ([485e220](https://github.com/dendronhq/dendron/commit/485e220f8ffa6cd63210e106e846ff305b920b77))


### Features Dendron

* Insert Note Index command ([#1142](https://github.com/dendronhq/dendron/issues/1142)) ([c140015](https://github.com/dendronhq/dendron/commit/c140015c19a942cf4696d596e818fd89905eea25))
* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* undefined tags breaks note serialization ([b1d784c](https://github.com/dendronhq/dendron/commit/b1d784c8df18b3b45999f01c14793436ff669a3f))


### Features Dendron

* colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
* resolve vim keybinding conflict on initial install ([#1103](https://github.com/dendronhq/dendron/issues/1103)) ([2278c66](https://github.com/dendronhq/dendron/commit/2278c6616c8297cc414ad02d5323bff5c45072e4))
* **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))
* Add SchemaLookupCommand ([#1082](https://github.com/dendronhq/dendron/issues/1082)) ([fe11a0e](https://github.com/dendronhq/dendron/commit/fe11a0ea1e0214823dd01842b941456df164bc70))
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* generate json schema from config ([#1100](https://github.com/dendronhq/dendron/issues/1100)) ([53b189e](https://github.com/dendronhq/dendron/commit/53b189ec973a8d3d3ccf300a0e59908197f4efb1))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.60.1-alpha.1](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.60.1-alpha.1) (2021-09-21)


### Bug Fixes

* **commands:** rename note leaves incorrect metadata if parent is a stub ([#1348](https://github.com/dendronhq/dendron/issues/1348)) ([d432cc9](https://github.com/dendronhq/dendron/commit/d432cc9e20ff8b9f6cefd7cc4c3a42b567ed9bc5))
* **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))
* **workspace:** disable certain decorations for long notes to avoid performance hit ([#1337](https://github.com/dendronhq/dendron/issues/1337)) ([f1c46f9](https://github.com/dendronhq/dendron/commit/f1c46f95c228ada2126ec7212cede3bf5acc773d))
* direct children query ([#1303](https://github.com/dendronhq/dendron/issues/1303)) ([bcf0dea](https://github.com/dendronhq/dendron/commit/bcf0deae422406564cd9a56c1765f90dd2e66215))
* issue with webpack devCLI ([a4ff4c9](https://github.com/dendronhq/dendron/commit/a4ff4c9ae28ff31ab6f9483c339ae78b5144e185))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))
* stop calendar from auto expanding when the last note is closed ([#1299](https://github.com/dendronhq/dendron/issues/1299)) ([9c8f853](https://github.com/dendronhq/dendron/commit/9c8f8533da5027c122e0d003ce4c61dc866735f5))


### Features Dendron

* consolidate dendron configs ([#1295](https://github.com/dendronhq/dendron/issues/1295)) ([177ac92](https://github.com/dendronhq/dendron/commit/177ac925a5442471f041ce5d991da52cecee6c9b))
* nextjs publishing fulltext search ([#1334](https://github.com/dendronhq/dendron/issues/1334)) ([68f8473](https://github.com/dendronhq/dendron/commit/68f8473badf22494c8d0758f8195e377235321f6))
* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* user tags ([#1228](https://github.com/dendronhq/dendron/issues/1228)) ([98c0106](https://github.com/dendronhq/dendron/commit/98c0106367e384c130a927484b9ea294eb6f84fa))



## 0.55.2 (2021-08-21)


### Bug Fixes

* wrong internal links in nextjs publishing ([#1165](https://github.com/dendronhq/dendron/issues/1165)) ([59a949d](https://github.com/dendronhq/dendron/commit/59a949d2b5b541efb283e851060636b108eb5a98))



## 0.55.1 (2021-08-17)


### Bug Fixes

* multiple issues with lookupv3 ([1fdd9eb](https://github.com/dendronhq/dendron/commit/1fdd9eb3242b43539572a1993fefd174640c6d83))
* properly log error stack ([485e220](https://github.com/dendronhq/dendron/commit/485e220f8ffa6cd63210e106e846ff305b920b77))


### Features Dendron

* Insert Note Index command ([#1142](https://github.com/dendronhq/dendron/issues/1142)) ([c140015](https://github.com/dendronhq/dendron/commit/c140015c19a942cf4696d596e818fd89905eea25))
* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* undefined tags breaks note serialization ([b1d784c](https://github.com/dendronhq/dendron/commit/b1d784c8df18b3b45999f01c14793436ff669a3f))


### Features Dendron

* colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
* resolve vim keybinding conflict on initial install ([#1103](https://github.com/dendronhq/dendron/issues/1103)) ([2278c66](https://github.com/dendronhq/dendron/commit/2278c6616c8297cc414ad02d5323bff5c45072e4))
* **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))
* Add SchemaLookupCommand ([#1082](https://github.com/dendronhq/dendron/issues/1082)) ([fe11a0e](https://github.com/dendronhq/dendron/commit/fe11a0ea1e0214823dd01842b941456df164bc70))
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* generate json schema from config ([#1100](https://github.com/dendronhq/dendron/issues/1100)) ([53b189e](https://github.com/dendronhq/dendron/commit/53b189ec973a8d3d3ccf300a0e59908197f4efb1))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.60.1-alpha.0](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.60.1-alpha.0) (2021-09-20)


### Bug Fixes

* **commands:** rename note leaves incorrect metadata if parent is a stub ([#1348](https://github.com/dendronhq/dendron/issues/1348)) ([d432cc9](https://github.com/dendronhq/dendron/commit/d432cc9e20ff8b9f6cefd7cc4c3a42b567ed9bc5))
* **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))
* **workspace:** disable certain decorations for long notes to avoid performance hit ([#1337](https://github.com/dendronhq/dendron/issues/1337)) ([f1c46f9](https://github.com/dendronhq/dendron/commit/f1c46f95c228ada2126ec7212cede3bf5acc773d))
* direct children query ([#1303](https://github.com/dendronhq/dendron/issues/1303)) ([bcf0dea](https://github.com/dendronhq/dendron/commit/bcf0deae422406564cd9a56c1765f90dd2e66215))
* issue with webpack devCLI ([a4ff4c9](https://github.com/dendronhq/dendron/commit/a4ff4c9ae28ff31ab6f9483c339ae78b5144e185))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))
* stop calendar from auto expanding when the last note is closed ([#1299](https://github.com/dendronhq/dendron/issues/1299)) ([9c8f853](https://github.com/dendronhq/dendron/commit/9c8f8533da5027c122e0d003ce4c61dc866735f5))


### Features Dendron

* consolidate dendron configs ([#1295](https://github.com/dendronhq/dendron/issues/1295)) ([177ac92](https://github.com/dendronhq/dendron/commit/177ac925a5442471f041ce5d991da52cecee6c9b))
* nextjs publishing fulltext search ([#1334](https://github.com/dendronhq/dendron/issues/1334)) ([68f8473](https://github.com/dendronhq/dendron/commit/68f8473badf22494c8d0758f8195e377235321f6))
* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* user tags ([#1228](https://github.com/dendronhq/dendron/issues/1228)) ([98c0106](https://github.com/dendronhq/dendron/commit/98c0106367e384c130a927484b9ea294eb6f84fa))



## 0.55.2 (2021-08-21)


### Bug Fixes

* wrong internal links in nextjs publishing ([#1165](https://github.com/dendronhq/dendron/issues/1165)) ([59a949d](https://github.com/dendronhq/dendron/commit/59a949d2b5b541efb283e851060636b108eb5a98))



## 0.55.1 (2021-08-17)


### Bug Fixes

* multiple issues with lookupv3 ([1fdd9eb](https://github.com/dendronhq/dendron/commit/1fdd9eb3242b43539572a1993fefd174640c6d83))
* properly log error stack ([485e220](https://github.com/dendronhq/dendron/commit/485e220f8ffa6cd63210e106e846ff305b920b77))


### Features Dendron

* Insert Note Index command ([#1142](https://github.com/dendronhq/dendron/issues/1142)) ([c140015](https://github.com/dendronhq/dendron/commit/c140015c19a942cf4696d596e818fd89905eea25))
* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* undefined tags breaks note serialization ([b1d784c](https://github.com/dendronhq/dendron/commit/b1d784c8df18b3b45999f01c14793436ff669a3f))


### Features Dendron

* colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
* resolve vim keybinding conflict on initial install ([#1103](https://github.com/dendronhq/dendron/issues/1103)) ([2278c66](https://github.com/dendronhq/dendron/commit/2278c6616c8297cc414ad02d5323bff5c45072e4))
* **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))
* Add SchemaLookupCommand ([#1082](https://github.com/dendronhq/dendron/issues/1082)) ([fe11a0e](https://github.com/dendronhq/dendron/commit/fe11a0ea1e0214823dd01842b941456df164bc70))
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* generate json schema from config ([#1100](https://github.com/dendronhq/dendron/issues/1100)) ([53b189e](https://github.com/dendronhq/dendron/commit/53b189ec973a8d3d3ccf300a0e59908197f4efb1))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





# [0.60.0](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.60.0) (2021-09-20)


### Bug Fixes

* **commands:** rename note leaves incorrect metadata if parent is a stub ([#1348](https://github.com/dendronhq/dendron/issues/1348)) ([d432cc9](https://github.com/dendronhq/dendron/commit/d432cc9e20ff8b9f6cefd7cc4c3a42b567ed9bc5))
* **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))
* **workspace:** disable certain decorations for long notes to avoid performance hit ([#1337](https://github.com/dendronhq/dendron/issues/1337)) ([f1c46f9](https://github.com/dendronhq/dendron/commit/f1c46f95c228ada2126ec7212cede3bf5acc773d))
* direct children query ([#1303](https://github.com/dendronhq/dendron/issues/1303)) ([bcf0dea](https://github.com/dendronhq/dendron/commit/bcf0deae422406564cd9a56c1765f90dd2e66215))
* issue with webpack devCLI ([a4ff4c9](https://github.com/dendronhq/dendron/commit/a4ff4c9ae28ff31ab6f9483c339ae78b5144e185))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))
* stop calendar from auto expanding when the last note is closed ([#1299](https://github.com/dendronhq/dendron/issues/1299)) ([9c8f853](https://github.com/dendronhq/dendron/commit/9c8f8533da5027c122e0d003ce4c61dc866735f5))


### Features Dendron

* consolidate dendron configs ([#1295](https://github.com/dendronhq/dendron/issues/1295)) ([177ac92](https://github.com/dendronhq/dendron/commit/177ac925a5442471f041ce5d991da52cecee6c9b))
* nextjs publishing fulltext search ([#1334](https://github.com/dendronhq/dendron/issues/1334)) ([68f8473](https://github.com/dendronhq/dendron/commit/68f8473badf22494c8d0758f8195e377235321f6))
* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* user tags ([#1228](https://github.com/dendronhq/dendron/issues/1228)) ([98c0106](https://github.com/dendronhq/dendron/commit/98c0106367e384c130a927484b9ea294eb6f84fa))



## 0.55.2 (2021-08-21)


### Bug Fixes

* wrong internal links in nextjs publishing ([#1165](https://github.com/dendronhq/dendron/issues/1165)) ([59a949d](https://github.com/dendronhq/dendron/commit/59a949d2b5b541efb283e851060636b108eb5a98))



## 0.55.1 (2021-08-17)


### Bug Fixes

* multiple issues with lookupv3 ([1fdd9eb](https://github.com/dendronhq/dendron/commit/1fdd9eb3242b43539572a1993fefd174640c6d83))
* properly log error stack ([485e220](https://github.com/dendronhq/dendron/commit/485e220f8ffa6cd63210e106e846ff305b920b77))


### Features Dendron

* Insert Note Index command ([#1142](https://github.com/dendronhq/dendron/issues/1142)) ([c140015](https://github.com/dendronhq/dendron/commit/c140015c19a942cf4696d596e818fd89905eea25))
* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* undefined tags breaks note serialization ([b1d784c](https://github.com/dendronhq/dendron/commit/b1d784c8df18b3b45999f01c14793436ff669a3f))


### Features Dendron

* colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
* resolve vim keybinding conflict on initial install ([#1103](https://github.com/dendronhq/dendron/issues/1103)) ([2278c66](https://github.com/dendronhq/dendron/commit/2278c6616c8297cc414ad02d5323bff5c45072e4))
* **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))
* Add SchemaLookupCommand ([#1082](https://github.com/dendronhq/dendron/issues/1082)) ([fe11a0e](https://github.com/dendronhq/dendron/commit/fe11a0ea1e0214823dd01842b941456df164bc70))
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* generate json schema from config ([#1100](https://github.com/dendronhq/dendron/issues/1100)) ([53b189e](https://github.com/dendronhq/dendron/commit/53b189ec973a8d3d3ccf300a0e59908197f4efb1))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.59.3-alpha.1](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.59.3-alpha.1) (2021-09-20)


### Bug Fixes

* **commands:** rename note leaves incorrect metadata if parent is a stub ([#1348](https://github.com/dendronhq/dendron/issues/1348)) ([d432cc9](https://github.com/dendronhq/dendron/commit/d432cc9e20ff8b9f6cefd7cc4c3a42b567ed9bc5))
* **workspace:** disable certain decorations for long notes to avoid performance hit ([#1337](https://github.com/dendronhq/dendron/issues/1337)) ([f1c46f9](https://github.com/dendronhq/dendron/commit/f1c46f95c228ada2126ec7212cede3bf5acc773d))
* direct children query ([#1303](https://github.com/dendronhq/dendron/issues/1303)) ([bcf0dea](https://github.com/dendronhq/dendron/commit/bcf0deae422406564cd9a56c1765f90dd2e66215))
* issue with webpack devCLI ([a4ff4c9](https://github.com/dendronhq/dendron/commit/a4ff4c9ae28ff31ab6f9483c339ae78b5144e185))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))
* stop calendar from auto expanding when the last note is closed ([#1299](https://github.com/dendronhq/dendron/issues/1299)) ([9c8f853](https://github.com/dendronhq/dendron/commit/9c8f8533da5027c122e0d003ce4c61dc866735f5))


### Features Dendron

* consolidate dendron configs ([#1295](https://github.com/dendronhq/dendron/issues/1295)) ([177ac92](https://github.com/dendronhq/dendron/commit/177ac925a5442471f041ce5d991da52cecee6c9b))
* nextjs publishing fulltext search ([#1334](https://github.com/dendronhq/dendron/issues/1334)) ([68f8473](https://github.com/dendronhq/dendron/commit/68f8473badf22494c8d0758f8195e377235321f6))
* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* user tags ([#1228](https://github.com/dendronhq/dendron/issues/1228)) ([98c0106](https://github.com/dendronhq/dendron/commit/98c0106367e384c130a927484b9ea294eb6f84fa))



## 0.55.2 (2021-08-21)


### Bug Fixes

* wrong internal links in nextjs publishing ([#1165](https://github.com/dendronhq/dendron/issues/1165)) ([59a949d](https://github.com/dendronhq/dendron/commit/59a949d2b5b541efb283e851060636b108eb5a98))



## 0.55.1 (2021-08-17)


### Bug Fixes

* multiple issues with lookupv3 ([1fdd9eb](https://github.com/dendronhq/dendron/commit/1fdd9eb3242b43539572a1993fefd174640c6d83))
* properly log error stack ([485e220](https://github.com/dendronhq/dendron/commit/485e220f8ffa6cd63210e106e846ff305b920b77))


### Features Dendron

* Insert Note Index command ([#1142](https://github.com/dendronhq/dendron/issues/1142)) ([c140015](https://github.com/dendronhq/dendron/commit/c140015c19a942cf4696d596e818fd89905eea25))
* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* undefined tags breaks note serialization ([b1d784c](https://github.com/dendronhq/dendron/commit/b1d784c8df18b3b45999f01c14793436ff669a3f))


### Features Dendron

* colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
* resolve vim keybinding conflict on initial install ([#1103](https://github.com/dendronhq/dendron/issues/1103)) ([2278c66](https://github.com/dendronhq/dendron/commit/2278c6616c8297cc414ad02d5323bff5c45072e4))
* **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))
* Add SchemaLookupCommand ([#1082](https://github.com/dendronhq/dendron/issues/1082)) ([fe11a0e](https://github.com/dendronhq/dendron/commit/fe11a0ea1e0214823dd01842b941456df164bc70))
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* generate json schema from config ([#1100](https://github.com/dendronhq/dendron/issues/1100)) ([53b189e](https://github.com/dendronhq/dendron/commit/53b189ec973a8d3d3ccf300a0e59908197f4efb1))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.59.3-alpha.0](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.59.3-alpha.0) (2021-09-19)


### Bug Fixes

* **commands:** rename note leaves incorrect metadata if parent is a stub ([#1348](https://github.com/dendronhq/dendron/issues/1348)) ([d432cc9](https://github.com/dendronhq/dendron/commit/d432cc9e20ff8b9f6cefd7cc4c3a42b567ed9bc5))
* **workspace:** disable certain decorations for long notes to avoid performance hit ([#1337](https://github.com/dendronhq/dendron/issues/1337)) ([f1c46f9](https://github.com/dendronhq/dendron/commit/f1c46f95c228ada2126ec7212cede3bf5acc773d))
* direct children query ([#1303](https://github.com/dendronhq/dendron/issues/1303)) ([bcf0dea](https://github.com/dendronhq/dendron/commit/bcf0deae422406564cd9a56c1765f90dd2e66215))
* issue with webpack devCLI ([a4ff4c9](https://github.com/dendronhq/dendron/commit/a4ff4c9ae28ff31ab6f9483c339ae78b5144e185))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))
* stop calendar from auto expanding when the last note is closed ([#1299](https://github.com/dendronhq/dendron/issues/1299)) ([9c8f853](https://github.com/dendronhq/dendron/commit/9c8f8533da5027c122e0d003ce4c61dc866735f5))


### Features Dendron

* consolidate dendron configs ([#1295](https://github.com/dendronhq/dendron/issues/1295)) ([177ac92](https://github.com/dendronhq/dendron/commit/177ac925a5442471f041ce5d991da52cecee6c9b))
* nextjs publishing fulltext search ([#1334](https://github.com/dendronhq/dendron/issues/1334)) ([68f8473](https://github.com/dendronhq/dendron/commit/68f8473badf22494c8d0758f8195e377235321f6))
* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* user tags ([#1228](https://github.com/dendronhq/dendron/issues/1228)) ([98c0106](https://github.com/dendronhq/dendron/commit/98c0106367e384c130a927484b9ea294eb6f84fa))



## 0.55.2 (2021-08-21)


### Bug Fixes

* wrong internal links in nextjs publishing ([#1165](https://github.com/dendronhq/dendron/issues/1165)) ([59a949d](https://github.com/dendronhq/dendron/commit/59a949d2b5b541efb283e851060636b108eb5a98))



## 0.55.1 (2021-08-17)


### Bug Fixes

* multiple issues with lookupv3 ([1fdd9eb](https://github.com/dendronhq/dendron/commit/1fdd9eb3242b43539572a1993fefd174640c6d83))
* properly log error stack ([485e220](https://github.com/dendronhq/dendron/commit/485e220f8ffa6cd63210e106e846ff305b920b77))


### Features Dendron

* Insert Note Index command ([#1142](https://github.com/dendronhq/dendron/issues/1142)) ([c140015](https://github.com/dendronhq/dendron/commit/c140015c19a942cf4696d596e818fd89905eea25))
* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* undefined tags breaks note serialization ([b1d784c](https://github.com/dendronhq/dendron/commit/b1d784c8df18b3b45999f01c14793436ff669a3f))


### Features Dendron

* colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
* resolve vim keybinding conflict on initial install ([#1103](https://github.com/dendronhq/dendron/issues/1103)) ([2278c66](https://github.com/dendronhq/dendron/commit/2278c6616c8297cc414ad02d5323bff5c45072e4))
* **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))
* Add SchemaLookupCommand ([#1082](https://github.com/dendronhq/dendron/issues/1082)) ([fe11a0e](https://github.com/dendronhq/dendron/commit/fe11a0ea1e0214823dd01842b941456df164bc70))
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* generate json schema from config ([#1100](https://github.com/dendronhq/dendron/issues/1100)) ([53b189e](https://github.com/dendronhq/dendron/commit/53b189ec973a8d3d3ccf300a0e59908197f4efb1))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.59.2](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.59.2) (2021-09-17)


### Bug Fixes

* **commands:** rename note leaves incorrect metadata if parent is a stub ([#1348](https://github.com/dendronhq/dendron/issues/1348)) ([d432cc9](https://github.com/dendronhq/dendron/commit/d432cc9e20ff8b9f6cefd7cc4c3a42b567ed9bc5))
* **workspace:** disable certain decorations for long notes to avoid performance hit ([#1337](https://github.com/dendronhq/dendron/issues/1337)) ([f1c46f9](https://github.com/dendronhq/dendron/commit/f1c46f95c228ada2126ec7212cede3bf5acc773d))
* direct children query ([#1303](https://github.com/dendronhq/dendron/issues/1303)) ([bcf0dea](https://github.com/dendronhq/dendron/commit/bcf0deae422406564cd9a56c1765f90dd2e66215))
* issue with webpack devCLI ([a4ff4c9](https://github.com/dendronhq/dendron/commit/a4ff4c9ae28ff31ab6f9483c339ae78b5144e185))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))
* stop calendar from auto expanding when the last note is closed ([#1299](https://github.com/dendronhq/dendron/issues/1299)) ([9c8f853](https://github.com/dendronhq/dendron/commit/9c8f8533da5027c122e0d003ce4c61dc866735f5))


### Features Dendron

* consolidate dendron configs ([#1295](https://github.com/dendronhq/dendron/issues/1295)) ([177ac92](https://github.com/dendronhq/dendron/commit/177ac925a5442471f041ce5d991da52cecee6c9b))
* nextjs publishing fulltext search ([#1334](https://github.com/dendronhq/dendron/issues/1334)) ([68f8473](https://github.com/dendronhq/dendron/commit/68f8473badf22494c8d0758f8195e377235321f6))
* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* user tags ([#1228](https://github.com/dendronhq/dendron/issues/1228)) ([98c0106](https://github.com/dendronhq/dendron/commit/98c0106367e384c130a927484b9ea294eb6f84fa))



## 0.55.2 (2021-08-21)


### Bug Fixes

* wrong internal links in nextjs publishing ([#1165](https://github.com/dendronhq/dendron/issues/1165)) ([59a949d](https://github.com/dendronhq/dendron/commit/59a949d2b5b541efb283e851060636b108eb5a98))



## 0.55.1 (2021-08-17)


### Bug Fixes

* multiple issues with lookupv3 ([1fdd9eb](https://github.com/dendronhq/dendron/commit/1fdd9eb3242b43539572a1993fefd174640c6d83))
* properly log error stack ([485e220](https://github.com/dendronhq/dendron/commit/485e220f8ffa6cd63210e106e846ff305b920b77))


### Features Dendron

* Insert Note Index command ([#1142](https://github.com/dendronhq/dendron/issues/1142)) ([c140015](https://github.com/dendronhq/dendron/commit/c140015c19a942cf4696d596e818fd89905eea25))
* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* undefined tags breaks note serialization ([b1d784c](https://github.com/dendronhq/dendron/commit/b1d784c8df18b3b45999f01c14793436ff669a3f))


### Features Dendron

* colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
* resolve vim keybinding conflict on initial install ([#1103](https://github.com/dendronhq/dendron/issues/1103)) ([2278c66](https://github.com/dendronhq/dendron/commit/2278c6616c8297cc414ad02d5323bff5c45072e4))
* **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))
* Add SchemaLookupCommand ([#1082](https://github.com/dendronhq/dendron/issues/1082)) ([fe11a0e](https://github.com/dendronhq/dendron/commit/fe11a0ea1e0214823dd01842b941456df164bc70))
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* generate json schema from config ([#1100](https://github.com/dendronhq/dendron/issues/1100)) ([53b189e](https://github.com/dendronhq/dendron/commit/53b189ec973a8d3d3ccf300a0e59908197f4efb1))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.59.1](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.59.1) (2021-09-16)


### Bug Fixes

* direct children query ([#1303](https://github.com/dendronhq/dendron/issues/1303)) ([bcf0dea](https://github.com/dendronhq/dendron/commit/bcf0deae422406564cd9a56c1765f90dd2e66215))
* issue with webpack devCLI ([a4ff4c9](https://github.com/dendronhq/dendron/commit/a4ff4c9ae28ff31ab6f9483c339ae78b5144e185))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))
* stop calendar from auto expanding when the last note is closed ([#1299](https://github.com/dendronhq/dendron/issues/1299)) ([9c8f853](https://github.com/dendronhq/dendron/commit/9c8f8533da5027c122e0d003ce4c61dc866735f5))


### Features Dendron

* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* user tags ([#1228](https://github.com/dendronhq/dendron/issues/1228)) ([98c0106](https://github.com/dendronhq/dendron/commit/98c0106367e384c130a927484b9ea294eb6f84fa))



## 0.55.2 (2021-08-21)


### Bug Fixes

* wrong internal links in nextjs publishing ([#1165](https://github.com/dendronhq/dendron/issues/1165)) ([59a949d](https://github.com/dendronhq/dendron/commit/59a949d2b5b541efb283e851060636b108eb5a98))



## 0.55.1 (2021-08-17)


### Bug Fixes

* multiple issues with lookupv3 ([1fdd9eb](https://github.com/dendronhq/dendron/commit/1fdd9eb3242b43539572a1993fefd174640c6d83))
* properly log error stack ([485e220](https://github.com/dendronhq/dendron/commit/485e220f8ffa6cd63210e106e846ff305b920b77))


### Features Dendron

* Insert Note Index command ([#1142](https://github.com/dendronhq/dendron/issues/1142)) ([c140015](https://github.com/dendronhq/dendron/commit/c140015c19a942cf4696d596e818fd89905eea25))
* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* undefined tags breaks note serialization ([b1d784c](https://github.com/dendronhq/dendron/commit/b1d784c8df18b3b45999f01c14793436ff669a3f))


### Features Dendron

* colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
* resolve vim keybinding conflict on initial install ([#1103](https://github.com/dendronhq/dendron/issues/1103)) ([2278c66](https://github.com/dendronhq/dendron/commit/2278c6616c8297cc414ad02d5323bff5c45072e4))
* **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))
* Add SchemaLookupCommand ([#1082](https://github.com/dendronhq/dendron/issues/1082)) ([fe11a0e](https://github.com/dendronhq/dendron/commit/fe11a0ea1e0214823dd01842b941456df164bc70))
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* generate json schema from config ([#1100](https://github.com/dendronhq/dendron/issues/1100)) ([53b189e](https://github.com/dendronhq/dendron/commit/53b189ec973a8d3d3ccf300a0e59908197f4efb1))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.59.2-alpha.5](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.59.2-alpha.5) (2021-09-15)


### Bug Fixes

* direct children query ([#1303](https://github.com/dendronhq/dendron/issues/1303)) ([bcf0dea](https://github.com/dendronhq/dendron/commit/bcf0deae422406564cd9a56c1765f90dd2e66215))
* issue with webpack devCLI ([a4ff4c9](https://github.com/dendronhq/dendron/commit/a4ff4c9ae28ff31ab6f9483c339ae78b5144e185))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))
* stop calendar from auto expanding when the last note is closed ([#1299](https://github.com/dendronhq/dendron/issues/1299)) ([9c8f853](https://github.com/dendronhq/dendron/commit/9c8f8533da5027c122e0d003ce4c61dc866735f5))


### Features Dendron

* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* user tags ([#1228](https://github.com/dendronhq/dendron/issues/1228)) ([98c0106](https://github.com/dendronhq/dendron/commit/98c0106367e384c130a927484b9ea294eb6f84fa))



## 0.55.2 (2021-08-21)


### Bug Fixes

* wrong internal links in nextjs publishing ([#1165](https://github.com/dendronhq/dendron/issues/1165)) ([59a949d](https://github.com/dendronhq/dendron/commit/59a949d2b5b541efb283e851060636b108eb5a98))



## 0.55.1 (2021-08-17)


### Bug Fixes

* multiple issues with lookupv3 ([1fdd9eb](https://github.com/dendronhq/dendron/commit/1fdd9eb3242b43539572a1993fefd174640c6d83))
* properly log error stack ([485e220](https://github.com/dendronhq/dendron/commit/485e220f8ffa6cd63210e106e846ff305b920b77))


### Features Dendron

* Insert Note Index command ([#1142](https://github.com/dendronhq/dendron/issues/1142)) ([c140015](https://github.com/dendronhq/dendron/commit/c140015c19a942cf4696d596e818fd89905eea25))
* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* undefined tags breaks note serialization ([b1d784c](https://github.com/dendronhq/dendron/commit/b1d784c8df18b3b45999f01c14793436ff669a3f))


### Features Dendron

* colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
* resolve vim keybinding conflict on initial install ([#1103](https://github.com/dendronhq/dendron/issues/1103)) ([2278c66](https://github.com/dendronhq/dendron/commit/2278c6616c8297cc414ad02d5323bff5c45072e4))
* **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))
* Add SchemaLookupCommand ([#1082](https://github.com/dendronhq/dendron/issues/1082)) ([fe11a0e](https://github.com/dendronhq/dendron/commit/fe11a0ea1e0214823dd01842b941456df164bc70))
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* generate json schema from config ([#1100](https://github.com/dendronhq/dendron/issues/1100)) ([53b189e](https://github.com/dendronhq/dendron/commit/53b189ec973a8d3d3ccf300a0e59908197f4efb1))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.59.2-alpha.4](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.59.2-alpha.4) (2021-09-15)


### Bug Fixes

* direct children query ([#1303](https://github.com/dendronhq/dendron/issues/1303)) ([bcf0dea](https://github.com/dendronhq/dendron/commit/bcf0deae422406564cd9a56c1765f90dd2e66215))
* issue with webpack devCLI ([a4ff4c9](https://github.com/dendronhq/dendron/commit/a4ff4c9ae28ff31ab6f9483c339ae78b5144e185))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))
* stop calendar from auto expanding when the last note is closed ([#1299](https://github.com/dendronhq/dendron/issues/1299)) ([9c8f853](https://github.com/dendronhq/dendron/commit/9c8f8533da5027c122e0d003ce4c61dc866735f5))


### Features Dendron

* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* user tags ([#1228](https://github.com/dendronhq/dendron/issues/1228)) ([98c0106](https://github.com/dendronhq/dendron/commit/98c0106367e384c130a927484b9ea294eb6f84fa))



## 0.55.2 (2021-08-21)


### Bug Fixes

* wrong internal links in nextjs publishing ([#1165](https://github.com/dendronhq/dendron/issues/1165)) ([59a949d](https://github.com/dendronhq/dendron/commit/59a949d2b5b541efb283e851060636b108eb5a98))



## 0.55.1 (2021-08-17)


### Bug Fixes

* multiple issues with lookupv3 ([1fdd9eb](https://github.com/dendronhq/dendron/commit/1fdd9eb3242b43539572a1993fefd174640c6d83))
* properly log error stack ([485e220](https://github.com/dendronhq/dendron/commit/485e220f8ffa6cd63210e106e846ff305b920b77))


### Features Dendron

* Insert Note Index command ([#1142](https://github.com/dendronhq/dendron/issues/1142)) ([c140015](https://github.com/dendronhq/dendron/commit/c140015c19a942cf4696d596e818fd89905eea25))
* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* undefined tags breaks note serialization ([b1d784c](https://github.com/dendronhq/dendron/commit/b1d784c8df18b3b45999f01c14793436ff669a3f))


### Features Dendron

* colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
* resolve vim keybinding conflict on initial install ([#1103](https://github.com/dendronhq/dendron/issues/1103)) ([2278c66](https://github.com/dendronhq/dendron/commit/2278c6616c8297cc414ad02d5323bff5c45072e4))
* **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))
* Add SchemaLookupCommand ([#1082](https://github.com/dendronhq/dendron/issues/1082)) ([fe11a0e](https://github.com/dendronhq/dendron/commit/fe11a0ea1e0214823dd01842b941456df164bc70))
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* generate json schema from config ([#1100](https://github.com/dendronhq/dendron/issues/1100)) ([53b189e](https://github.com/dendronhq/dendron/commit/53b189ec973a8d3d3ccf300a0e59908197f4efb1))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.59.2-alpha.3](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.59.2-alpha.3) (2021-09-15)


### Bug Fixes

* direct children query ([#1303](https://github.com/dendronhq/dendron/issues/1303)) ([bcf0dea](https://github.com/dendronhq/dendron/commit/bcf0deae422406564cd9a56c1765f90dd2e66215))
* issue with webpack devCLI ([a4ff4c9](https://github.com/dendronhq/dendron/commit/a4ff4c9ae28ff31ab6f9483c339ae78b5144e185))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))
* stop calendar from auto expanding when the last note is closed ([#1299](https://github.com/dendronhq/dendron/issues/1299)) ([9c8f853](https://github.com/dendronhq/dendron/commit/9c8f8533da5027c122e0d003ce4c61dc866735f5))


### Features Dendron

* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* user tags ([#1228](https://github.com/dendronhq/dendron/issues/1228)) ([98c0106](https://github.com/dendronhq/dendron/commit/98c0106367e384c130a927484b9ea294eb6f84fa))



## 0.55.2 (2021-08-21)


### Bug Fixes

* wrong internal links in nextjs publishing ([#1165](https://github.com/dendronhq/dendron/issues/1165)) ([59a949d](https://github.com/dendronhq/dendron/commit/59a949d2b5b541efb283e851060636b108eb5a98))



## 0.55.1 (2021-08-17)


### Bug Fixes

* multiple issues with lookupv3 ([1fdd9eb](https://github.com/dendronhq/dendron/commit/1fdd9eb3242b43539572a1993fefd174640c6d83))
* properly log error stack ([485e220](https://github.com/dendronhq/dendron/commit/485e220f8ffa6cd63210e106e846ff305b920b77))


### Features Dendron

* Insert Note Index command ([#1142](https://github.com/dendronhq/dendron/issues/1142)) ([c140015](https://github.com/dendronhq/dendron/commit/c140015c19a942cf4696d596e818fd89905eea25))
* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* undefined tags breaks note serialization ([b1d784c](https://github.com/dendronhq/dendron/commit/b1d784c8df18b3b45999f01c14793436ff669a3f))


### Features Dendron

* colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
* resolve vim keybinding conflict on initial install ([#1103](https://github.com/dendronhq/dendron/issues/1103)) ([2278c66](https://github.com/dendronhq/dendron/commit/2278c6616c8297cc414ad02d5323bff5c45072e4))
* **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))
* Add SchemaLookupCommand ([#1082](https://github.com/dendronhq/dendron/issues/1082)) ([fe11a0e](https://github.com/dendronhq/dendron/commit/fe11a0ea1e0214823dd01842b941456df164bc70))
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* generate json schema from config ([#1100](https://github.com/dendronhq/dendron/issues/1100)) ([53b189e](https://github.com/dendronhq/dendron/commit/53b189ec973a8d3d3ccf300a0e59908197f4efb1))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.59.2-alpha.2](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.59.2-alpha.2) (2021-09-15)


### Bug Fixes

* direct children query ([#1303](https://github.com/dendronhq/dendron/issues/1303)) ([bcf0dea](https://github.com/dendronhq/dendron/commit/bcf0deae422406564cd9a56c1765f90dd2e66215))
* issue with webpack devCLI ([a4ff4c9](https://github.com/dendronhq/dendron/commit/a4ff4c9ae28ff31ab6f9483c339ae78b5144e185))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))
* stop calendar from auto expanding when the last note is closed ([#1299](https://github.com/dendronhq/dendron/issues/1299)) ([9c8f853](https://github.com/dendronhq/dendron/commit/9c8f8533da5027c122e0d003ce4c61dc866735f5))


### Features Dendron

* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* user tags ([#1228](https://github.com/dendronhq/dendron/issues/1228)) ([98c0106](https://github.com/dendronhq/dendron/commit/98c0106367e384c130a927484b9ea294eb6f84fa))



## 0.55.2 (2021-08-21)


### Bug Fixes

* wrong internal links in nextjs publishing ([#1165](https://github.com/dendronhq/dendron/issues/1165)) ([59a949d](https://github.com/dendronhq/dendron/commit/59a949d2b5b541efb283e851060636b108eb5a98))



## 0.55.1 (2021-08-17)


### Bug Fixes

* multiple issues with lookupv3 ([1fdd9eb](https://github.com/dendronhq/dendron/commit/1fdd9eb3242b43539572a1993fefd174640c6d83))
* properly log error stack ([485e220](https://github.com/dendronhq/dendron/commit/485e220f8ffa6cd63210e106e846ff305b920b77))


### Features Dendron

* Insert Note Index command ([#1142](https://github.com/dendronhq/dendron/issues/1142)) ([c140015](https://github.com/dendronhq/dendron/commit/c140015c19a942cf4696d596e818fd89905eea25))
* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* undefined tags breaks note serialization ([b1d784c](https://github.com/dendronhq/dendron/commit/b1d784c8df18b3b45999f01c14793436ff669a3f))


### Features Dendron

* colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
* resolve vim keybinding conflict on initial install ([#1103](https://github.com/dendronhq/dendron/issues/1103)) ([2278c66](https://github.com/dendronhq/dendron/commit/2278c6616c8297cc414ad02d5323bff5c45072e4))
* **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))
* Add SchemaLookupCommand ([#1082](https://github.com/dendronhq/dendron/issues/1082)) ([fe11a0e](https://github.com/dendronhq/dendron/commit/fe11a0ea1e0214823dd01842b941456df164bc70))
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* generate json schema from config ([#1100](https://github.com/dendronhq/dendron/issues/1100)) ([53b189e](https://github.com/dendronhq/dendron/commit/53b189ec973a8d3d3ccf300a0e59908197f4efb1))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.59.2-alpha.1](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.59.2-alpha.1) (2021-09-15)


### Bug Fixes

* direct children query ([#1303](https://github.com/dendronhq/dendron/issues/1303)) ([bcf0dea](https://github.com/dendronhq/dendron/commit/bcf0deae422406564cd9a56c1765f90dd2e66215))
* issue with webpack devCLI ([a4ff4c9](https://github.com/dendronhq/dendron/commit/a4ff4c9ae28ff31ab6f9483c339ae78b5144e185))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))
* stop calendar from auto expanding when the last note is closed ([#1299](https://github.com/dendronhq/dendron/issues/1299)) ([9c8f853](https://github.com/dendronhq/dendron/commit/9c8f8533da5027c122e0d003ce4c61dc866735f5))


### Features Dendron

* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* user tags ([#1228](https://github.com/dendronhq/dendron/issues/1228)) ([98c0106](https://github.com/dendronhq/dendron/commit/98c0106367e384c130a927484b9ea294eb6f84fa))



## 0.55.2 (2021-08-21)


### Bug Fixes

* wrong internal links in nextjs publishing ([#1165](https://github.com/dendronhq/dendron/issues/1165)) ([59a949d](https://github.com/dendronhq/dendron/commit/59a949d2b5b541efb283e851060636b108eb5a98))



## 0.55.1 (2021-08-17)


### Bug Fixes

* multiple issues with lookupv3 ([1fdd9eb](https://github.com/dendronhq/dendron/commit/1fdd9eb3242b43539572a1993fefd174640c6d83))
* properly log error stack ([485e220](https://github.com/dendronhq/dendron/commit/485e220f8ffa6cd63210e106e846ff305b920b77))


### Features Dendron

* Insert Note Index command ([#1142](https://github.com/dendronhq/dendron/issues/1142)) ([c140015](https://github.com/dendronhq/dendron/commit/c140015c19a942cf4696d596e818fd89905eea25))
* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* undefined tags breaks note serialization ([b1d784c](https://github.com/dendronhq/dendron/commit/b1d784c8df18b3b45999f01c14793436ff669a3f))


### Features Dendron

* colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
* resolve vim keybinding conflict on initial install ([#1103](https://github.com/dendronhq/dendron/issues/1103)) ([2278c66](https://github.com/dendronhq/dendron/commit/2278c6616c8297cc414ad02d5323bff5c45072e4))
* **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))
* Add SchemaLookupCommand ([#1082](https://github.com/dendronhq/dendron/issues/1082)) ([fe11a0e](https://github.com/dendronhq/dendron/commit/fe11a0ea1e0214823dd01842b941456df164bc70))
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* generate json schema from config ([#1100](https://github.com/dendronhq/dendron/issues/1100)) ([53b189e](https://github.com/dendronhq/dendron/commit/53b189ec973a8d3d3ccf300a0e59908197f4efb1))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.59.2-alpha.0](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.59.2-alpha.0) (2021-09-15)


### Bug Fixes

* direct children query ([#1303](https://github.com/dendronhq/dendron/issues/1303)) ([bcf0dea](https://github.com/dendronhq/dendron/commit/bcf0deae422406564cd9a56c1765f90dd2e66215))
* issue with webpack devCLI ([a4ff4c9](https://github.com/dendronhq/dendron/commit/a4ff4c9ae28ff31ab6f9483c339ae78b5144e185))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))
* stop calendar from auto expanding when the last note is closed ([#1299](https://github.com/dendronhq/dendron/issues/1299)) ([9c8f853](https://github.com/dendronhq/dendron/commit/9c8f8533da5027c122e0d003ce4c61dc866735f5))


### Features Dendron

* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* user tags ([#1228](https://github.com/dendronhq/dendron/issues/1228)) ([98c0106](https://github.com/dendronhq/dendron/commit/98c0106367e384c130a927484b9ea294eb6f84fa))



## 0.55.2 (2021-08-21)


### Bug Fixes

* wrong internal links in nextjs publishing ([#1165](https://github.com/dendronhq/dendron/issues/1165)) ([59a949d](https://github.com/dendronhq/dendron/commit/59a949d2b5b541efb283e851060636b108eb5a98))



## 0.55.1 (2021-08-17)


### Bug Fixes

* multiple issues with lookupv3 ([1fdd9eb](https://github.com/dendronhq/dendron/commit/1fdd9eb3242b43539572a1993fefd174640c6d83))
* properly log error stack ([485e220](https://github.com/dendronhq/dendron/commit/485e220f8ffa6cd63210e106e846ff305b920b77))


### Features Dendron

* Insert Note Index command ([#1142](https://github.com/dendronhq/dendron/issues/1142)) ([c140015](https://github.com/dendronhq/dendron/commit/c140015c19a942cf4696d596e818fd89905eea25))
* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* undefined tags breaks note serialization ([b1d784c](https://github.com/dendronhq/dendron/commit/b1d784c8df18b3b45999f01c14793436ff669a3f))


### Features Dendron

* colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
* resolve vim keybinding conflict on initial install ([#1103](https://github.com/dendronhq/dendron/issues/1103)) ([2278c66](https://github.com/dendronhq/dendron/commit/2278c6616c8297cc414ad02d5323bff5c45072e4))
* **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))
* Add SchemaLookupCommand ([#1082](https://github.com/dendronhq/dendron/issues/1082)) ([fe11a0e](https://github.com/dendronhq/dendron/commit/fe11a0ea1e0214823dd01842b941456df164bc70))
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* generate json schema from config ([#1100](https://github.com/dendronhq/dendron/issues/1100)) ([53b189e](https://github.com/dendronhq/dendron/commit/53b189ec973a8d3d3ccf300a0e59908197f4efb1))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.59.1](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.59.1) (2021-09-14)


### Bug Fixes

* direct children query ([#1303](https://github.com/dendronhq/dendron/issues/1303)) ([bcf0dea](https://github.com/dendronhq/dendron/commit/bcf0deae422406564cd9a56c1765f90dd2e66215))
* issue with webpack devCLI ([a4ff4c9](https://github.com/dendronhq/dendron/commit/a4ff4c9ae28ff31ab6f9483c339ae78b5144e185))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))
* stop calendar from auto expanding when the last note is closed ([#1299](https://github.com/dendronhq/dendron/issues/1299)) ([9c8f853](https://github.com/dendronhq/dendron/commit/9c8f8533da5027c122e0d003ce4c61dc866735f5))


### Features Dendron

* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* user tags ([#1228](https://github.com/dendronhq/dendron/issues/1228)) ([98c0106](https://github.com/dendronhq/dendron/commit/98c0106367e384c130a927484b9ea294eb6f84fa))



## 0.55.2 (2021-08-21)


### Bug Fixes

* wrong internal links in nextjs publishing ([#1165](https://github.com/dendronhq/dendron/issues/1165)) ([59a949d](https://github.com/dendronhq/dendron/commit/59a949d2b5b541efb283e851060636b108eb5a98))



## 0.55.1 (2021-08-17)


### Bug Fixes

* multiple issues with lookupv3 ([1fdd9eb](https://github.com/dendronhq/dendron/commit/1fdd9eb3242b43539572a1993fefd174640c6d83))
* properly log error stack ([485e220](https://github.com/dendronhq/dendron/commit/485e220f8ffa6cd63210e106e846ff305b920b77))


### Features Dendron

* Insert Note Index command ([#1142](https://github.com/dendronhq/dendron/issues/1142)) ([c140015](https://github.com/dendronhq/dendron/commit/c140015c19a942cf4696d596e818fd89905eea25))
* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* undefined tags breaks note serialization ([b1d784c](https://github.com/dendronhq/dendron/commit/b1d784c8df18b3b45999f01c14793436ff669a3f))


### Features Dendron

* colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
* resolve vim keybinding conflict on initial install ([#1103](https://github.com/dendronhq/dendron/issues/1103)) ([2278c66](https://github.com/dendronhq/dendron/commit/2278c6616c8297cc414ad02d5323bff5c45072e4))
* **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))
* Add SchemaLookupCommand ([#1082](https://github.com/dendronhq/dendron/issues/1082)) ([fe11a0e](https://github.com/dendronhq/dendron/commit/fe11a0ea1e0214823dd01842b941456df164bc70))
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* generate json schema from config ([#1100](https://github.com/dendronhq/dendron/issues/1100)) ([53b189e](https://github.com/dendronhq/dendron/commit/53b189ec973a8d3d3ccf300a0e59908197f4efb1))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





# [0.59.0](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.59.0) (2021-09-14)


### Bug Fixes

* direct children query ([#1303](https://github.com/dendronhq/dendron/issues/1303)) ([bcf0dea](https://github.com/dendronhq/dendron/commit/bcf0deae422406564cd9a56c1765f90dd2e66215))
* issue with webpack devCLI ([a4ff4c9](https://github.com/dendronhq/dendron/commit/a4ff4c9ae28ff31ab6f9483c339ae78b5144e185))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))
* stop calendar from auto expanding when the last note is closed ([#1299](https://github.com/dendronhq/dendron/issues/1299)) ([9c8f853](https://github.com/dendronhq/dendron/commit/9c8f8533da5027c122e0d003ce4c61dc866735f5))


### Features Dendron

* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* user tags ([#1228](https://github.com/dendronhq/dendron/issues/1228)) ([98c0106](https://github.com/dendronhq/dendron/commit/98c0106367e384c130a927484b9ea294eb6f84fa))



## 0.55.2 (2021-08-21)


### Bug Fixes

* wrong internal links in nextjs publishing ([#1165](https://github.com/dendronhq/dendron/issues/1165)) ([59a949d](https://github.com/dendronhq/dendron/commit/59a949d2b5b541efb283e851060636b108eb5a98))



## 0.55.1 (2021-08-17)


### Bug Fixes

* multiple issues with lookupv3 ([1fdd9eb](https://github.com/dendronhq/dendron/commit/1fdd9eb3242b43539572a1993fefd174640c6d83))
* properly log error stack ([485e220](https://github.com/dendronhq/dendron/commit/485e220f8ffa6cd63210e106e846ff305b920b77))


### Features Dendron

* Insert Note Index command ([#1142](https://github.com/dendronhq/dendron/issues/1142)) ([c140015](https://github.com/dendronhq/dendron/commit/c140015c19a942cf4696d596e818fd89905eea25))
* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* undefined tags breaks note serialization ([b1d784c](https://github.com/dendronhq/dendron/commit/b1d784c8df18b3b45999f01c14793436ff669a3f))


### Features Dendron

* colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
* resolve vim keybinding conflict on initial install ([#1103](https://github.com/dendronhq/dendron/issues/1103)) ([2278c66](https://github.com/dendronhq/dendron/commit/2278c6616c8297cc414ad02d5323bff5c45072e4))
* **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))
* Add SchemaLookupCommand ([#1082](https://github.com/dendronhq/dendron/issues/1082)) ([fe11a0e](https://github.com/dendronhq/dendron/commit/fe11a0ea1e0214823dd01842b941456df164bc70))
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* generate json schema from config ([#1100](https://github.com/dendronhq/dendron/issues/1100)) ([53b189e](https://github.com/dendronhq/dendron/commit/53b189ec973a8d3d3ccf300a0e59908197f4efb1))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.58.4](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.58.4) (2021-09-12)


### Bug Fixes

* direct children query ([#1303](https://github.com/dendronhq/dendron/issues/1303)) ([bcf0dea](https://github.com/dendronhq/dendron/commit/bcf0deae422406564cd9a56c1765f90dd2e66215))
* issue with webpack devCLI ([a4ff4c9](https://github.com/dendronhq/dendron/commit/a4ff4c9ae28ff31ab6f9483c339ae78b5144e185))
* stop calendar from auto expanding when the last note is closed ([#1299](https://github.com/dendronhq/dendron/issues/1299)) ([9c8f853](https://github.com/dendronhq/dendron/commit/9c8f8533da5027c122e0d003ce4c61dc866735f5))


### Features Dendron

* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* user tags ([#1228](https://github.com/dendronhq/dendron/issues/1228)) ([98c0106](https://github.com/dendronhq/dendron/commit/98c0106367e384c130a927484b9ea294eb6f84fa))



## 0.55.2 (2021-08-21)


### Bug Fixes

* wrong internal links in nextjs publishing ([#1165](https://github.com/dendronhq/dendron/issues/1165)) ([59a949d](https://github.com/dendronhq/dendron/commit/59a949d2b5b541efb283e851060636b108eb5a98))



## 0.55.1 (2021-08-17)


### Bug Fixes

* multiple issues with lookupv3 ([1fdd9eb](https://github.com/dendronhq/dendron/commit/1fdd9eb3242b43539572a1993fefd174640c6d83))
* properly log error stack ([485e220](https://github.com/dendronhq/dendron/commit/485e220f8ffa6cd63210e106e846ff305b920b77))


### Features Dendron

* Insert Note Index command ([#1142](https://github.com/dendronhq/dendron/issues/1142)) ([c140015](https://github.com/dendronhq/dendron/commit/c140015c19a942cf4696d596e818fd89905eea25))
* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* undefined tags breaks note serialization ([b1d784c](https://github.com/dendronhq/dendron/commit/b1d784c8df18b3b45999f01c14793436ff669a3f))


### Features Dendron

* colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
* resolve vim keybinding conflict on initial install ([#1103](https://github.com/dendronhq/dendron/issues/1103)) ([2278c66](https://github.com/dendronhq/dendron/commit/2278c6616c8297cc414ad02d5323bff5c45072e4))
* **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))
* Add SchemaLookupCommand ([#1082](https://github.com/dendronhq/dendron/issues/1082)) ([fe11a0e](https://github.com/dendronhq/dendron/commit/fe11a0ea1e0214823dd01842b941456df164bc70))
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* generate json schema from config ([#1100](https://github.com/dendronhq/dendron/issues/1100)) ([53b189e](https://github.com/dendronhq/dendron/commit/53b189ec973a8d3d3ccf300a0e59908197f4efb1))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.58.4-alpha.1](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.58.4-alpha.1) (2021-09-10)


### Bug Fixes

* direct children query ([#1303](https://github.com/dendronhq/dendron/issues/1303)) ([bcf0dea](https://github.com/dendronhq/dendron/commit/bcf0deae422406564cd9a56c1765f90dd2e66215))
* issue with webpack devCLI ([a4ff4c9](https://github.com/dendronhq/dendron/commit/a4ff4c9ae28ff31ab6f9483c339ae78b5144e185))
* stop calendar from auto expanding when the last note is closed ([#1299](https://github.com/dendronhq/dendron/issues/1299)) ([9c8f853](https://github.com/dendronhq/dendron/commit/9c8f8533da5027c122e0d003ce4c61dc866735f5))


### Features Dendron

* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* user tags ([#1228](https://github.com/dendronhq/dendron/issues/1228)) ([98c0106](https://github.com/dendronhq/dendron/commit/98c0106367e384c130a927484b9ea294eb6f84fa))



## 0.55.2 (2021-08-21)


### Bug Fixes

* wrong internal links in nextjs publishing ([#1165](https://github.com/dendronhq/dendron/issues/1165)) ([59a949d](https://github.com/dendronhq/dendron/commit/59a949d2b5b541efb283e851060636b108eb5a98))



## 0.55.1 (2021-08-17)


### Bug Fixes

* multiple issues with lookupv3 ([1fdd9eb](https://github.com/dendronhq/dendron/commit/1fdd9eb3242b43539572a1993fefd174640c6d83))
* properly log error stack ([485e220](https://github.com/dendronhq/dendron/commit/485e220f8ffa6cd63210e106e846ff305b920b77))


### Features Dendron

* Insert Note Index command ([#1142](https://github.com/dendronhq/dendron/issues/1142)) ([c140015](https://github.com/dendronhq/dendron/commit/c140015c19a942cf4696d596e818fd89905eea25))
* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* undefined tags breaks note serialization ([b1d784c](https://github.com/dendronhq/dendron/commit/b1d784c8df18b3b45999f01c14793436ff669a3f))


### Features Dendron

* colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
* resolve vim keybinding conflict on initial install ([#1103](https://github.com/dendronhq/dendron/issues/1103)) ([2278c66](https://github.com/dendronhq/dendron/commit/2278c6616c8297cc414ad02d5323bff5c45072e4))
* **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))
* Add SchemaLookupCommand ([#1082](https://github.com/dendronhq/dendron/issues/1082)) ([fe11a0e](https://github.com/dendronhq/dendron/commit/fe11a0ea1e0214823dd01842b941456df164bc70))
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* generate json schema from config ([#1100](https://github.com/dendronhq/dendron/issues/1100)) ([53b189e](https://github.com/dendronhq/dendron/commit/53b189ec973a8d3d3ccf300a0e59908197f4efb1))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.58.4-alpha.0](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.58.4-alpha.0) (2021-09-09)


### Bug Fixes

* direct children query ([#1303](https://github.com/dendronhq/dendron/issues/1303)) ([bcf0dea](https://github.com/dendronhq/dendron/commit/bcf0deae422406564cd9a56c1765f90dd2e66215))
* issue with webpack devCLI ([a4ff4c9](https://github.com/dendronhq/dendron/commit/a4ff4c9ae28ff31ab6f9483c339ae78b5144e185))
* stop calendar from auto expanding when the last note is closed ([#1299](https://github.com/dendronhq/dendron/issues/1299)) ([9c8f853](https://github.com/dendronhq/dendron/commit/9c8f8533da5027c122e0d003ce4c61dc866735f5))


### Features Dendron

* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* user tags ([#1228](https://github.com/dendronhq/dendron/issues/1228)) ([98c0106](https://github.com/dendronhq/dendron/commit/98c0106367e384c130a927484b9ea294eb6f84fa))



## 0.55.2 (2021-08-21)


### Bug Fixes

* wrong internal links in nextjs publishing ([#1165](https://github.com/dendronhq/dendron/issues/1165)) ([59a949d](https://github.com/dendronhq/dendron/commit/59a949d2b5b541efb283e851060636b108eb5a98))



## 0.55.1 (2021-08-17)


### Bug Fixes

* multiple issues with lookupv3 ([1fdd9eb](https://github.com/dendronhq/dendron/commit/1fdd9eb3242b43539572a1993fefd174640c6d83))
* properly log error stack ([485e220](https://github.com/dendronhq/dendron/commit/485e220f8ffa6cd63210e106e846ff305b920b77))


### Features Dendron

* Insert Note Index command ([#1142](https://github.com/dendronhq/dendron/issues/1142)) ([c140015](https://github.com/dendronhq/dendron/commit/c140015c19a942cf4696d596e818fd89905eea25))
* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* undefined tags breaks note serialization ([b1d784c](https://github.com/dendronhq/dendron/commit/b1d784c8df18b3b45999f01c14793436ff669a3f))


### Features Dendron

* colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
* resolve vim keybinding conflict on initial install ([#1103](https://github.com/dendronhq/dendron/issues/1103)) ([2278c66](https://github.com/dendronhq/dendron/commit/2278c6616c8297cc414ad02d5323bff5c45072e4))
* **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))
* Add SchemaLookupCommand ([#1082](https://github.com/dendronhq/dendron/issues/1082)) ([fe11a0e](https://github.com/dendronhq/dendron/commit/fe11a0ea1e0214823dd01842b941456df164bc70))
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* generate json schema from config ([#1100](https://github.com/dendronhq/dendron/issues/1100)) ([53b189e](https://github.com/dendronhq/dendron/commit/53b189ec973a8d3d3ccf300a0e59908197f4efb1))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.58.3-alpha.0](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.58.3-alpha.0) (2021-09-09)


### Bug Fixes

* issue with webpack devCLI ([a4ff4c9](https://github.com/dendronhq/dendron/commit/a4ff4c9ae28ff31ab6f9483c339ae78b5144e185))


### Features Dendron

* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* user tags ([#1228](https://github.com/dendronhq/dendron/issues/1228)) ([98c0106](https://github.com/dendronhq/dendron/commit/98c0106367e384c130a927484b9ea294eb6f84fa))



## 0.55.2 (2021-08-21)


### Bug Fixes

* wrong internal links in nextjs publishing ([#1165](https://github.com/dendronhq/dendron/issues/1165)) ([59a949d](https://github.com/dendronhq/dendron/commit/59a949d2b5b541efb283e851060636b108eb5a98))



## 0.55.1 (2021-08-17)


### Bug Fixes

* multiple issues with lookupv3 ([1fdd9eb](https://github.com/dendronhq/dendron/commit/1fdd9eb3242b43539572a1993fefd174640c6d83))
* properly log error stack ([485e220](https://github.com/dendronhq/dendron/commit/485e220f8ffa6cd63210e106e846ff305b920b77))


### Features Dendron

* Insert Note Index command ([#1142](https://github.com/dendronhq/dendron/issues/1142)) ([c140015](https://github.com/dendronhq/dendron/commit/c140015c19a942cf4696d596e818fd89905eea25))
* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* undefined tags breaks note serialization ([b1d784c](https://github.com/dendronhq/dendron/commit/b1d784c8df18b3b45999f01c14793436ff669a3f))


### Features Dendron

* colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
* resolve vim keybinding conflict on initial install ([#1103](https://github.com/dendronhq/dendron/issues/1103)) ([2278c66](https://github.com/dendronhq/dendron/commit/2278c6616c8297cc414ad02d5323bff5c45072e4))
* **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))
* Add SchemaLookupCommand ([#1082](https://github.com/dendronhq/dendron/issues/1082)) ([fe11a0e](https://github.com/dendronhq/dendron/commit/fe11a0ea1e0214823dd01842b941456df164bc70))
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* generate json schema from config ([#1100](https://github.com/dendronhq/dendron/issues/1100)) ([53b189e](https://github.com/dendronhq/dendron/commit/53b189ec973a8d3d3ccf300a0e59908197f4efb1))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.58.2-alpha.0](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.58.2-alpha.0) (2021-09-09)


### Bug Fixes

* issue with webpack devCLI ([a4ff4c9](https://github.com/dendronhq/dendron/commit/a4ff4c9ae28ff31ab6f9483c339ae78b5144e185))


### Features Dendron

* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* user tags ([#1228](https://github.com/dendronhq/dendron/issues/1228)) ([98c0106](https://github.com/dendronhq/dendron/commit/98c0106367e384c130a927484b9ea294eb6f84fa))



## 0.55.2 (2021-08-21)


### Bug Fixes

* wrong internal links in nextjs publishing ([#1165](https://github.com/dendronhq/dendron/issues/1165)) ([59a949d](https://github.com/dendronhq/dendron/commit/59a949d2b5b541efb283e851060636b108eb5a98))



## 0.55.1 (2021-08-17)


### Bug Fixes

* multiple issues with lookupv3 ([1fdd9eb](https://github.com/dendronhq/dendron/commit/1fdd9eb3242b43539572a1993fefd174640c6d83))
* properly log error stack ([485e220](https://github.com/dendronhq/dendron/commit/485e220f8ffa6cd63210e106e846ff305b920b77))


### Features Dendron

* Insert Note Index command ([#1142](https://github.com/dendronhq/dendron/issues/1142)) ([c140015](https://github.com/dendronhq/dendron/commit/c140015c19a942cf4696d596e818fd89905eea25))
* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* undefined tags breaks note serialization ([b1d784c](https://github.com/dendronhq/dendron/commit/b1d784c8df18b3b45999f01c14793436ff669a3f))


### Features Dendron

* colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
* resolve vim keybinding conflict on initial install ([#1103](https://github.com/dendronhq/dendron/issues/1103)) ([2278c66](https://github.com/dendronhq/dendron/commit/2278c6616c8297cc414ad02d5323bff5c45072e4))
* **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))
* Add SchemaLookupCommand ([#1082](https://github.com/dendronhq/dendron/issues/1082)) ([fe11a0e](https://github.com/dendronhq/dendron/commit/fe11a0ea1e0214823dd01842b941456df164bc70))
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* generate json schema from config ([#1100](https://github.com/dendronhq/dendron/issues/1100)) ([53b189e](https://github.com/dendronhq/dendron/commit/53b189ec973a8d3d3ccf300a0e59908197f4efb1))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.58.1](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.58.1) (2021-09-08)


### Bug Fixes

* issue with webpack devCLI ([a4ff4c9](https://github.com/dendronhq/dendron/commit/a4ff4c9ae28ff31ab6f9483c339ae78b5144e185))


### Features Dendron

* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* user tags ([#1228](https://github.com/dendronhq/dendron/issues/1228)) ([98c0106](https://github.com/dendronhq/dendron/commit/98c0106367e384c130a927484b9ea294eb6f84fa))



## 0.55.2 (2021-08-21)


### Bug Fixes

* wrong internal links in nextjs publishing ([#1165](https://github.com/dendronhq/dendron/issues/1165)) ([59a949d](https://github.com/dendronhq/dendron/commit/59a949d2b5b541efb283e851060636b108eb5a98))



## 0.55.1 (2021-08-17)


### Bug Fixes

* multiple issues with lookupv3 ([1fdd9eb](https://github.com/dendronhq/dendron/commit/1fdd9eb3242b43539572a1993fefd174640c6d83))
* properly log error stack ([485e220](https://github.com/dendronhq/dendron/commit/485e220f8ffa6cd63210e106e846ff305b920b77))


### Features Dendron

* Insert Note Index command ([#1142](https://github.com/dendronhq/dendron/issues/1142)) ([c140015](https://github.com/dendronhq/dendron/commit/c140015c19a942cf4696d596e818fd89905eea25))
* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* undefined tags breaks note serialization ([b1d784c](https://github.com/dendronhq/dendron/commit/b1d784c8df18b3b45999f01c14793436ff669a3f))


### Features Dendron

* colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
* resolve vim keybinding conflict on initial install ([#1103](https://github.com/dendronhq/dendron/issues/1103)) ([2278c66](https://github.com/dendronhq/dendron/commit/2278c6616c8297cc414ad02d5323bff5c45072e4))
* **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))
* Add SchemaLookupCommand ([#1082](https://github.com/dendronhq/dendron/issues/1082)) ([fe11a0e](https://github.com/dendronhq/dendron/commit/fe11a0ea1e0214823dd01842b941456df164bc70))
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* generate json schema from config ([#1100](https://github.com/dendronhq/dendron/issues/1100)) ([53b189e](https://github.com/dendronhq/dendron/commit/53b189ec973a8d3d3ccf300a0e59908197f4efb1))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





# [0.58.0](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.58.0) (2021-09-07)


### Bug Fixes

* issue with webpack devCLI ([a4ff4c9](https://github.com/dendronhq/dendron/commit/a4ff4c9ae28ff31ab6f9483c339ae78b5144e185))


### Features Dendron

* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* user tags ([#1228](https://github.com/dendronhq/dendron/issues/1228)) ([98c0106](https://github.com/dendronhq/dendron/commit/98c0106367e384c130a927484b9ea294eb6f84fa))



## 0.55.2 (2021-08-21)


### Bug Fixes

* wrong internal links in nextjs publishing ([#1165](https://github.com/dendronhq/dendron/issues/1165)) ([59a949d](https://github.com/dendronhq/dendron/commit/59a949d2b5b541efb283e851060636b108eb5a98))



## 0.55.1 (2021-08-17)


### Bug Fixes

* multiple issues with lookupv3 ([1fdd9eb](https://github.com/dendronhq/dendron/commit/1fdd9eb3242b43539572a1993fefd174640c6d83))
* properly log error stack ([485e220](https://github.com/dendronhq/dendron/commit/485e220f8ffa6cd63210e106e846ff305b920b77))


### Features Dendron

* Insert Note Index command ([#1142](https://github.com/dendronhq/dendron/issues/1142)) ([c140015](https://github.com/dendronhq/dendron/commit/c140015c19a942cf4696d596e818fd89905eea25))
* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* undefined tags breaks note serialization ([b1d784c](https://github.com/dendronhq/dendron/commit/b1d784c8df18b3b45999f01c14793436ff669a3f))


### Features Dendron

* colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
* resolve vim keybinding conflict on initial install ([#1103](https://github.com/dendronhq/dendron/issues/1103)) ([2278c66](https://github.com/dendronhq/dendron/commit/2278c6616c8297cc414ad02d5323bff5c45072e4))
* **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))
* Add SchemaLookupCommand ([#1082](https://github.com/dendronhq/dendron/issues/1082)) ([fe11a0e](https://github.com/dendronhq/dendron/commit/fe11a0ea1e0214823dd01842b941456df164bc70))
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* generate json schema from config ([#1100](https://github.com/dendronhq/dendron/issues/1100)) ([53b189e](https://github.com/dendronhq/dendron/commit/53b189ec973a8d3d3ccf300a0e59908197f4efb1))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.57.3](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.57.3) (2021-09-06)


### Bug Fixes

* issue with webpack devCLI ([a4ff4c9](https://github.com/dendronhq/dendron/commit/a4ff4c9ae28ff31ab6f9483c339ae78b5144e185))


### Features Dendron

* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* user tags ([#1228](https://github.com/dendronhq/dendron/issues/1228)) ([98c0106](https://github.com/dendronhq/dendron/commit/98c0106367e384c130a927484b9ea294eb6f84fa))



## 0.55.2 (2021-08-21)


### Bug Fixes

* wrong internal links in nextjs publishing ([#1165](https://github.com/dendronhq/dendron/issues/1165)) ([59a949d](https://github.com/dendronhq/dendron/commit/59a949d2b5b541efb283e851060636b108eb5a98))



## 0.55.1 (2021-08-17)


### Bug Fixes

* multiple issues with lookupv3 ([1fdd9eb](https://github.com/dendronhq/dendron/commit/1fdd9eb3242b43539572a1993fefd174640c6d83))
* properly log error stack ([485e220](https://github.com/dendronhq/dendron/commit/485e220f8ffa6cd63210e106e846ff305b920b77))


### Features Dendron

* Insert Note Index command ([#1142](https://github.com/dendronhq/dendron/issues/1142)) ([c140015](https://github.com/dendronhq/dendron/commit/c140015c19a942cf4696d596e818fd89905eea25))
* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* undefined tags breaks note serialization ([b1d784c](https://github.com/dendronhq/dendron/commit/b1d784c8df18b3b45999f01c14793436ff669a3f))


### Features Dendron

* colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
* resolve vim keybinding conflict on initial install ([#1103](https://github.com/dendronhq/dendron/issues/1103)) ([2278c66](https://github.com/dendronhq/dendron/commit/2278c6616c8297cc414ad02d5323bff5c45072e4))
* **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))
* Add SchemaLookupCommand ([#1082](https://github.com/dendronhq/dendron/issues/1082)) ([fe11a0e](https://github.com/dendronhq/dendron/commit/fe11a0ea1e0214823dd01842b941456df164bc70))
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* generate json schema from config ([#1100](https://github.com/dendronhq/dendron/issues/1100)) ([53b189e](https://github.com/dendronhq/dendron/commit/53b189ec973a8d3d3ccf300a0e59908197f4efb1))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.57.2](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.57.2) (2021-09-04)


### Bug Fixes

* issue with webpack devCLI ([a4ff4c9](https://github.com/dendronhq/dendron/commit/a4ff4c9ae28ff31ab6f9483c339ae78b5144e185))


### Features Dendron

* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* user tags ([#1228](https://github.com/dendronhq/dendron/issues/1228)) ([98c0106](https://github.com/dendronhq/dendron/commit/98c0106367e384c130a927484b9ea294eb6f84fa))



## 0.55.2 (2021-08-21)


### Bug Fixes

* wrong internal links in nextjs publishing ([#1165](https://github.com/dendronhq/dendron/issues/1165)) ([59a949d](https://github.com/dendronhq/dendron/commit/59a949d2b5b541efb283e851060636b108eb5a98))



## 0.55.1 (2021-08-17)


### Bug Fixes

* multiple issues with lookupv3 ([1fdd9eb](https://github.com/dendronhq/dendron/commit/1fdd9eb3242b43539572a1993fefd174640c6d83))
* properly log error stack ([485e220](https://github.com/dendronhq/dendron/commit/485e220f8ffa6cd63210e106e846ff305b920b77))


### Features Dendron

* Insert Note Index command ([#1142](https://github.com/dendronhq/dendron/issues/1142)) ([c140015](https://github.com/dendronhq/dendron/commit/c140015c19a942cf4696d596e818fd89905eea25))
* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* undefined tags breaks note serialization ([b1d784c](https://github.com/dendronhq/dendron/commit/b1d784c8df18b3b45999f01c14793436ff669a3f))


### Features Dendron

* colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
* resolve vim keybinding conflict on initial install ([#1103](https://github.com/dendronhq/dendron/issues/1103)) ([2278c66](https://github.com/dendronhq/dendron/commit/2278c6616c8297cc414ad02d5323bff5c45072e4))
* **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))
* Add SchemaLookupCommand ([#1082](https://github.com/dendronhq/dendron/issues/1082)) ([fe11a0e](https://github.com/dendronhq/dendron/commit/fe11a0ea1e0214823dd01842b941456df164bc70))
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* generate json schema from config ([#1100](https://github.com/dendronhq/dendron/issues/1100)) ([53b189e](https://github.com/dendronhq/dendron/commit/53b189ec973a8d3d3ccf300a0e59908197f4efb1))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.57.1](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.57.1) (2021-09-04)


### Bug Fixes

* issue with webpack devCLI ([a4ff4c9](https://github.com/dendronhq/dendron/commit/a4ff4c9ae28ff31ab6f9483c339ae78b5144e185))


### Features Dendron

* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* user tags ([#1228](https://github.com/dendronhq/dendron/issues/1228)) ([98c0106](https://github.com/dendronhq/dendron/commit/98c0106367e384c130a927484b9ea294eb6f84fa))



## 0.55.2 (2021-08-21)


### Bug Fixes

* wrong internal links in nextjs publishing ([#1165](https://github.com/dendronhq/dendron/issues/1165)) ([59a949d](https://github.com/dendronhq/dendron/commit/59a949d2b5b541efb283e851060636b108eb5a98))



## 0.55.1 (2021-08-17)


### Bug Fixes

* multiple issues with lookupv3 ([1fdd9eb](https://github.com/dendronhq/dendron/commit/1fdd9eb3242b43539572a1993fefd174640c6d83))
* properly log error stack ([485e220](https://github.com/dendronhq/dendron/commit/485e220f8ffa6cd63210e106e846ff305b920b77))


### Features Dendron

* Insert Note Index command ([#1142](https://github.com/dendronhq/dendron/issues/1142)) ([c140015](https://github.com/dendronhq/dendron/commit/c140015c19a942cf4696d596e818fd89905eea25))
* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* undefined tags breaks note serialization ([b1d784c](https://github.com/dendronhq/dendron/commit/b1d784c8df18b3b45999f01c14793436ff669a3f))


### Features Dendron

* colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
* resolve vim keybinding conflict on initial install ([#1103](https://github.com/dendronhq/dendron/issues/1103)) ([2278c66](https://github.com/dendronhq/dendron/commit/2278c6616c8297cc414ad02d5323bff5c45072e4))
* **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))
* Add SchemaLookupCommand ([#1082](https://github.com/dendronhq/dendron/issues/1082)) ([fe11a0e](https://github.com/dendronhq/dendron/commit/fe11a0ea1e0214823dd01842b941456df164bc70))
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* generate json schema from config ([#1100](https://github.com/dendronhq/dendron/issues/1100)) ([53b189e](https://github.com/dendronhq/dendron/commit/53b189ec973a8d3d3ccf300a0e59908197f4efb1))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





# [0.57.0](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.57.0) (2021-08-31)


### Features Dendron

* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* user tags ([#1228](https://github.com/dendronhq/dendron/issues/1228)) ([98c0106](https://github.com/dendronhq/dendron/commit/98c0106367e384c130a927484b9ea294eb6f84fa))



## 0.55.2 (2021-08-21)


### Bug Fixes

* wrong internal links in nextjs publishing ([#1165](https://github.com/dendronhq/dendron/issues/1165)) ([59a949d](https://github.com/dendronhq/dendron/commit/59a949d2b5b541efb283e851060636b108eb5a98))



## 0.55.1 (2021-08-17)


### Bug Fixes

* multiple issues with lookupv3 ([1fdd9eb](https://github.com/dendronhq/dendron/commit/1fdd9eb3242b43539572a1993fefd174640c6d83))
* properly log error stack ([485e220](https://github.com/dendronhq/dendron/commit/485e220f8ffa6cd63210e106e846ff305b920b77))


### Features Dendron

* Insert Note Index command ([#1142](https://github.com/dendronhq/dendron/issues/1142)) ([c140015](https://github.com/dendronhq/dendron/commit/c140015c19a942cf4696d596e818fd89905eea25))
* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* undefined tags breaks note serialization ([b1d784c](https://github.com/dendronhq/dendron/commit/b1d784c8df18b3b45999f01c14793436ff669a3f))


### Features Dendron

* colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
* resolve vim keybinding conflict on initial install ([#1103](https://github.com/dendronhq/dendron/issues/1103)) ([2278c66](https://github.com/dendronhq/dendron/commit/2278c6616c8297cc414ad02d5323bff5c45072e4))
* **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))
* Add SchemaLookupCommand ([#1082](https://github.com/dendronhq/dendron/issues/1082)) ([fe11a0e](https://github.com/dendronhq/dendron/commit/fe11a0ea1e0214823dd01842b941456df164bc70))
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* generate json schema from config ([#1100](https://github.com/dendronhq/dendron/issues/1100)) ([53b189e](https://github.com/dendronhq/dendron/commit/53b189ec973a8d3d3ccf300a0e59908197f4efb1))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





# [0.56.0](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.56.0) (2021-08-23)



## 0.55.2 (2021-08-21)


### Bug Fixes

* wrong internal links in nextjs publishing ([#1165](https://github.com/dendronhq/dendron/issues/1165)) ([59a949d](https://github.com/dendronhq/dendron/commit/59a949d2b5b541efb283e851060636b108eb5a98))



## 0.55.1 (2021-08-17)


### Bug Fixes

* multiple issues with lookupv3 ([1fdd9eb](https://github.com/dendronhq/dendron/commit/1fdd9eb3242b43539572a1993fefd174640c6d83))
* properly log error stack ([485e220](https://github.com/dendronhq/dendron/commit/485e220f8ffa6cd63210e106e846ff305b920b77))


### Features Dendron

* Insert Note Index command ([#1142](https://github.com/dendronhq/dendron/issues/1142)) ([c140015](https://github.com/dendronhq/dendron/commit/c140015c19a942cf4696d596e818fd89905eea25))
* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* undefined tags breaks note serialization ([b1d784c](https://github.com/dendronhq/dendron/commit/b1d784c8df18b3b45999f01c14793436ff669a3f))


### Features Dendron

* colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
* resolve vim keybinding conflict on initial install ([#1103](https://github.com/dendronhq/dendron/issues/1103)) ([2278c66](https://github.com/dendronhq/dendron/commit/2278c6616c8297cc414ad02d5323bff5c45072e4))
* **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))
* Add SchemaLookupCommand ([#1082](https://github.com/dendronhq/dendron/issues/1082)) ([fe11a0e](https://github.com/dendronhq/dendron/commit/fe11a0ea1e0214823dd01842b941456df164bc70))
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* generate json schema from config ([#1100](https://github.com/dendronhq/dendron/issues/1100)) ([53b189e](https://github.com/dendronhq/dendron/commit/53b189ec973a8d3d3ccf300a0e59908197f4efb1))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.55.2](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.55.2) (2021-08-19)


### Bug Fixes

* wrong internal links in nextjs publishing ([#1165](https://github.com/dendronhq/dendron/issues/1165)) ([59a949d](https://github.com/dendronhq/dendron/commit/59a949d2b5b541efb283e851060636b108eb5a98))



## 0.55.1 (2021-08-17)


### Bug Fixes

* multiple issues with lookupv3 ([1fdd9eb](https://github.com/dendronhq/dendron/commit/1fdd9eb3242b43539572a1993fefd174640c6d83))
* properly log error stack ([485e220](https://github.com/dendronhq/dendron/commit/485e220f8ffa6cd63210e106e846ff305b920b77))


### Features Dendron

* Insert Note Index command ([#1142](https://github.com/dendronhq/dendron/issues/1142)) ([c140015](https://github.com/dendronhq/dendron/commit/c140015c19a942cf4696d596e818fd89905eea25))
* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* undefined tags breaks note serialization ([b1d784c](https://github.com/dendronhq/dendron/commit/b1d784c8df18b3b45999f01c14793436ff669a3f))


### Features Dendron

* colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
* resolve vim keybinding conflict on initial install ([#1103](https://github.com/dendronhq/dendron/issues/1103)) ([2278c66](https://github.com/dendronhq/dendron/commit/2278c6616c8297cc414ad02d5323bff5c45072e4))
* **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))
* Add SchemaLookupCommand ([#1082](https://github.com/dendronhq/dendron/issues/1082)) ([fe11a0e](https://github.com/dendronhq/dendron/commit/fe11a0ea1e0214823dd01842b941456df164bc70))
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* generate json schema from config ([#1100](https://github.com/dendronhq/dendron/issues/1100)) ([53b189e](https://github.com/dendronhq/dendron/commit/53b189ec973a8d3d3ccf300a0e59908197f4efb1))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.55.1](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.55.1) (2021-08-17)


### Bug Fixes

* multiple issues with lookupv3 ([1fdd9eb](https://github.com/dendronhq/dendron/commit/1fdd9eb3242b43539572a1993fefd174640c6d83))
* properly log error stack ([485e220](https://github.com/dendronhq/dendron/commit/485e220f8ffa6cd63210e106e846ff305b920b77))


### Features Dendron

* Insert Note Index command ([#1142](https://github.com/dendronhq/dendron/issues/1142)) ([c140015](https://github.com/dendronhq/dendron/commit/c140015c19a942cf4696d596e818fd89905eea25))
* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* undefined tags breaks note serialization ([b1d784c](https://github.com/dendronhq/dendron/commit/b1d784c8df18b3b45999f01c14793436ff669a3f))


### Features Dendron

* colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
* resolve vim keybinding conflict on initial install ([#1103](https://github.com/dendronhq/dendron/issues/1103)) ([2278c66](https://github.com/dendronhq/dendron/commit/2278c6616c8297cc414ad02d5323bff5c45072e4))
* **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))
* Add SchemaLookupCommand ([#1082](https://github.com/dendronhq/dendron/issues/1082)) ([fe11a0e](https://github.com/dendronhq/dendron/commit/fe11a0ea1e0214823dd01842b941456df164bc70))
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* generate json schema from config ([#1100](https://github.com/dendronhq/dendron/issues/1100)) ([53b189e](https://github.com/dendronhq/dendron/commit/53b189ec973a8d3d3ccf300a0e59908197f4efb1))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





# [0.55.0](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.55.0) (2021-08-17)


### Bug Fixes

* multiple issues with lookupv3 ([1fdd9eb](https://github.com/dendronhq/dendron/commit/1fdd9eb3242b43539572a1993fefd174640c6d83))
* properly log error stack ([485e220](https://github.com/dendronhq/dendron/commit/485e220f8ffa6cd63210e106e846ff305b920b77))


### Features Dendron

* Insert Note Index command ([#1142](https://github.com/dendronhq/dendron/issues/1142)) ([c140015](https://github.com/dendronhq/dendron/commit/c140015c19a942cf4696d596e818fd89905eea25))
* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* undefined tags breaks note serialization ([b1d784c](https://github.com/dendronhq/dendron/commit/b1d784c8df18b3b45999f01c14793436ff669a3f))


### Features Dendron

* colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
* resolve vim keybinding conflict on initial install ([#1103](https://github.com/dendronhq/dendron/issues/1103)) ([2278c66](https://github.com/dendronhq/dendron/commit/2278c6616c8297cc414ad02d5323bff5c45072e4))
* **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))
* Add SchemaLookupCommand ([#1082](https://github.com/dendronhq/dendron/issues/1082)) ([fe11a0e](https://github.com/dendronhq/dendron/commit/fe11a0ea1e0214823dd01842b941456df164bc70))
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* generate json schema from config ([#1100](https://github.com/dendronhq/dendron/issues/1100)) ([53b189e](https://github.com/dendronhq/dendron/commit/53b189ec973a8d3d3ccf300a0e59908197f4efb1))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.54.1](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.54.1) (2021-08-13)


### Bug Fixes

* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* undefined tags breaks note serialization ([b1d784c](https://github.com/dendronhq/dendron/commit/b1d784c8df18b3b45999f01c14793436ff669a3f))


### Features Dendron

* colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
* resolve vim keybinding conflict on initial install ([#1103](https://github.com/dendronhq/dendron/issues/1103)) ([2278c66](https://github.com/dendronhq/dendron/commit/2278c6616c8297cc414ad02d5323bff5c45072e4))
* **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))
* Add SchemaLookupCommand ([#1082](https://github.com/dendronhq/dendron/issues/1082)) ([fe11a0e](https://github.com/dendronhq/dendron/commit/fe11a0ea1e0214823dd01842b941456df164bc70))
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* generate json schema from config ([#1100](https://github.com/dendronhq/dendron/issues/1100)) ([53b189e](https://github.com/dendronhq/dendron/commit/53b189ec973a8d3d3ccf300a0e59908197f4efb1))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





# [0.54.0](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.54.0) (2021-08-10)


### Bug Fixes

* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* undefined tags breaks note serialization ([b1d784c](https://github.com/dendronhq/dendron/commit/b1d784c8df18b3b45999f01c14793436ff669a3f))


### Features Dendron

* resolve vim keybinding conflict on initial install ([#1103](https://github.com/dendronhq/dendron/issues/1103)) ([2278c66](https://github.com/dendronhq/dendron/commit/2278c6616c8297cc414ad02d5323bff5c45072e4))
* **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))
* Add SchemaLookupCommand ([#1082](https://github.com/dendronhq/dendron/issues/1082)) ([fe11a0e](https://github.com/dendronhq/dendron/commit/fe11a0ea1e0214823dd01842b941456df164bc70))
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* generate json schema from config ([#1100](https://github.com/dendronhq/dendron/issues/1100)) ([53b189e](https://github.com/dendronhq/dendron/commit/53b189ec973a8d3d3ccf300a0e59908197f4efb1))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.53.10](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.53.10) (2021-08-10)


### Bug Fixes

* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* undefined tags breaks note serialization ([b1d784c](https://github.com/dendronhq/dendron/commit/b1d784c8df18b3b45999f01c14793436ff669a3f))


### Features Dendron

* resolve vim keybinding conflict on initial install ([#1103](https://github.com/dendronhq/dendron/issues/1103)) ([2278c66](https://github.com/dendronhq/dendron/commit/2278c6616c8297cc414ad02d5323bff5c45072e4))
* **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))
* Add SchemaLookupCommand ([#1082](https://github.com/dendronhq/dendron/issues/1082)) ([fe11a0e](https://github.com/dendronhq/dendron/commit/fe11a0ea1e0214823dd01842b941456df164bc70))
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* generate json schema from config ([#1100](https://github.com/dendronhq/dendron/issues/1100)) ([53b189e](https://github.com/dendronhq/dendron/commit/53b189ec973a8d3d3ccf300a0e59908197f4efb1))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.53.9](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.53.9) (2021-08-10)


### Bug Fixes

* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* undefined tags breaks note serialization ([b1d784c](https://github.com/dendronhq/dendron/commit/b1d784c8df18b3b45999f01c14793436ff669a3f))


### Features Dendron

* resolve vim keybinding conflict on initial install ([#1103](https://github.com/dendronhq/dendron/issues/1103)) ([2278c66](https://github.com/dendronhq/dendron/commit/2278c6616c8297cc414ad02d5323bff5c45072e4))
* **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))
* Add SchemaLookupCommand ([#1082](https://github.com/dendronhq/dendron/issues/1082)) ([fe11a0e](https://github.com/dendronhq/dendron/commit/fe11a0ea1e0214823dd01842b941456df164bc70))
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* generate json schema from config ([#1100](https://github.com/dendronhq/dendron/issues/1100)) ([53b189e](https://github.com/dendronhq/dendron/commit/53b189ec973a8d3d3ccf300a0e59908197f4efb1))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.53.8](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.53.8) (2021-08-10)


### Bug Fixes

* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* undefined tags breaks note serialization ([b1d784c](https://github.com/dendronhq/dendron/commit/b1d784c8df18b3b45999f01c14793436ff669a3f))


### Features Dendron

* resolve vim keybinding conflict on initial install ([#1103](https://github.com/dendronhq/dendron/issues/1103)) ([2278c66](https://github.com/dendronhq/dendron/commit/2278c6616c8297cc414ad02d5323bff5c45072e4))
* **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))
* Add SchemaLookupCommand ([#1082](https://github.com/dendronhq/dendron/issues/1082)) ([fe11a0e](https://github.com/dendronhq/dendron/commit/fe11a0ea1e0214823dd01842b941456df164bc70))
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* generate json schema from config ([#1100](https://github.com/dendronhq/dendron/issues/1100)) ([53b189e](https://github.com/dendronhq/dendron/commit/53b189ec973a8d3d3ccf300a0e59908197f4efb1))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.53.7](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.53.7) (2021-08-10)


### Bug Fixes

* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* undefined tags breaks note serialization ([b1d784c](https://github.com/dendronhq/dendron/commit/b1d784c8df18b3b45999f01c14793436ff669a3f))


### Features Dendron

* resolve vim keybinding conflict on initial install ([#1103](https://github.com/dendronhq/dendron/issues/1103)) ([2278c66](https://github.com/dendronhq/dendron/commit/2278c6616c8297cc414ad02d5323bff5c45072e4))
* **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))
* Add SchemaLookupCommand ([#1082](https://github.com/dendronhq/dendron/issues/1082)) ([fe11a0e](https://github.com/dendronhq/dendron/commit/fe11a0ea1e0214823dd01842b941456df164bc70))
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* generate json schema from config ([#1100](https://github.com/dendronhq/dendron/issues/1100)) ([53b189e](https://github.com/dendronhq/dendron/commit/53b189ec973a8d3d3ccf300a0e59908197f4efb1))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.53.6](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.53.6) (2021-08-10)


### Bug Fixes

* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* undefined tags breaks note serialization ([b1d784c](https://github.com/dendronhq/dendron/commit/b1d784c8df18b3b45999f01c14793436ff669a3f))


### Features Dendron

* resolve vim keybinding conflict on initial install ([#1103](https://github.com/dendronhq/dendron/issues/1103)) ([2278c66](https://github.com/dendronhq/dendron/commit/2278c6616c8297cc414ad02d5323bff5c45072e4))
* **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))
* Add SchemaLookupCommand ([#1082](https://github.com/dendronhq/dendron/issues/1082)) ([fe11a0e](https://github.com/dendronhq/dendron/commit/fe11a0ea1e0214823dd01842b941456df164bc70))
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* generate json schema from config ([#1100](https://github.com/dendronhq/dendron/issues/1100)) ([53b189e](https://github.com/dendronhq/dendron/commit/53b189ec973a8d3d3ccf300a0e59908197f4efb1))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.53.5](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.53.5) (2021-08-10)


### Bug Fixes

* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* undefined tags breaks note serialization ([b1d784c](https://github.com/dendronhq/dendron/commit/b1d784c8df18b3b45999f01c14793436ff669a3f))


### Features Dendron

* resolve vim keybinding conflict on initial install ([#1103](https://github.com/dendronhq/dendron/issues/1103)) ([2278c66](https://github.com/dendronhq/dendron/commit/2278c6616c8297cc414ad02d5323bff5c45072e4))
* **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))
* Add SchemaLookupCommand ([#1082](https://github.com/dendronhq/dendron/issues/1082)) ([fe11a0e](https://github.com/dendronhq/dendron/commit/fe11a0ea1e0214823dd01842b941456df164bc70))
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* generate json schema from config ([#1100](https://github.com/dendronhq/dendron/issues/1100)) ([53b189e](https://github.com/dendronhq/dendron/commit/53b189ec973a8d3d3ccf300a0e59908197f4efb1))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.53.4](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.53.4) (2021-08-10)


### Bug Fixes

* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* undefined tags breaks note serialization ([b1d784c](https://github.com/dendronhq/dendron/commit/b1d784c8df18b3b45999f01c14793436ff669a3f))


### Features Dendron

* resolve vim keybinding conflict on initial install ([#1103](https://github.com/dendronhq/dendron/issues/1103)) ([2278c66](https://github.com/dendronhq/dendron/commit/2278c6616c8297cc414ad02d5323bff5c45072e4))
* **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))
* Add SchemaLookupCommand ([#1082](https://github.com/dendronhq/dendron/issues/1082)) ([fe11a0e](https://github.com/dendronhq/dendron/commit/fe11a0ea1e0214823dd01842b941456df164bc70))
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* generate json schema from config ([#1100](https://github.com/dendronhq/dendron/issues/1100)) ([53b189e](https://github.com/dendronhq/dendron/commit/53b189ec973a8d3d3ccf300a0e59908197f4efb1))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.53.3](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.53.3) (2021-08-08)


### Bug Fixes

* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* undefined tags breaks note serialization ([b1d784c](https://github.com/dendronhq/dendron/commit/b1d784c8df18b3b45999f01c14793436ff669a3f))


### Features Dendron

* Add SchemaLookupCommand ([#1082](https://github.com/dendronhq/dendron/issues/1082)) ([fe11a0e](https://github.com/dendronhq/dendron/commit/fe11a0ea1e0214823dd01842b941456df164bc70))
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* generate json schema from config ([#1100](https://github.com/dendronhq/dendron/issues/1100)) ([53b189e](https://github.com/dendronhq/dendron/commit/53b189ec973a8d3d3ccf300a0e59908197f4efb1))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))





## [0.53.2](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.53.2) (2021-08-06)


### Bug Fixes

* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* undefined tags breaks note serialization ([b1d784c](https://github.com/dendronhq/dendron/commit/b1d784c8df18b3b45999f01c14793436ff669a3f))


### Features Dendron

* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* generate json schema from config ([#1100](https://github.com/dendronhq/dendron/issues/1100)) ([53b189e](https://github.com/dendronhq/dendron/commit/53b189ec973a8d3d3ccf300a0e59908197f4efb1))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))





## [0.53.1](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.53.1) (2021-08-06)


### Bug Fixes

* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* undefined tags breaks note serialization ([b1d784c](https://github.com/dendronhq/dendron/commit/b1d784c8df18b3b45999f01c14793436ff669a3f))


### Features Dendron

* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* generate json schema from config ([#1100](https://github.com/dendronhq/dendron/issues/1100)) ([53b189e](https://github.com/dendronhq/dendron/commit/53b189ec973a8d3d3ccf300a0e59908197f4efb1))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))





# [0.53.0](https://github.com/dendronhq/dendron/compare/v0.52.0...v0.53.0) (2021-08-03)

**Note:** Version bump only for package @dendronhq/common-all





# [0.52.0](https://github.com/dendronhq/dendron/compare/v0.51.3...v0.52.0) (2021-07-26)


### Bug Fixes

* scratch note migration fixes ([5214535](https://github.com/dendronhq/dendron/commit/52145354331d1a9a84e55520550458762eba6df5))


### Features Dendron

* **community issue:** graph zoom speed option ([#1027](https://github.com/dendronhq/dendron/issues/1027)) ([786628b](https://github.com/dendronhq/dendron/commit/786628b6b1437c962872e91792e22f06793e3888))





## [0.51.4](https://github.com/dendronhq/dendron/compare/v0.51.3...v0.51.4) (2021-07-25)


### Bug Fixes

* scratch note migration fixes ([5214535](https://github.com/dendronhq/dendron/commit/52145354331d1a9a84e55520550458762eba6df5))


### Features Dendron

* **community issue:** graph zoom speed option ([#1027](https://github.com/dendronhq/dendron/issues/1027)) ([786628b](https://github.com/dendronhq/dendron/commit/786628b6b1437c962872e91792e22f06793e3888))





## [0.51.2](https://github.com/dendronhq/dendron/compare/v0.51.0...v0.51.2) (2021-07-22)


### Features Dendron

* async launch engine ([0c1a607](https://github.com/dendronhq/dendron/commit/0c1a607d7ec3d19cc369c5f6ca16412c0cd0615e))





## [0.51.1](https://github.com/dendronhq/dendron/compare/v0.51.0...v0.51.1) (2021-07-20)

**Note:** Version bump only for package @dendronhq/common-all





# [0.51.0](https://github.com/dendronhq/dendron/compare/v0.49.0...v0.51.0) (2021-07-19)


### Bug Fixes

* avoid generating IDs containing dashes and underscores ([#947](https://github.com/dendronhq/dendron/issues/947)) ([147772e](https://github.com/dendronhq/dendron/commit/147772e4b5a9eafa34c08aed902d30b00eeb7cb3)), closes [#945](https://github.com/dendronhq/dendron/issues/945)
* Improving Tutorial Telemetry ([#942](https://github.com/dendronhq/dendron/issues/942)) ([5c7f0e0](https://github.com/dendronhq/dendron/commit/5c7f0e0fc7bfd5f8befa46f5b714bfd3b61f2f4f))
* last modiified timestamp not updating ([#961](https://github.com/dendronhq/dendron/issues/961)) ([71afabc](https://github.com/dendronhq/dendron/commit/71afabc1a29a09bd0f9acb5cd215b75e973ae3fd))


### Features Dendron

* add custom graph styling support ([#981](https://github.com/dendronhq/dendron/issues/981)) ([aa88e3a](https://github.com/dendronhq/dendron/commit/aa88e3a0e81f1ceeffe8058eceab93b32120c93b))
* auto completion for anchors and headers ([#894](https://github.com/dendronhq/dendron/issues/894)) ([13e81d4](https://github.com/dendronhq/dendron/commit/13e81d49c1f14ee18457543f8e0818d0e36c17db))
* de-emphasize block anchors in the editor ([#937](https://github.com/dendronhq/dendron/issues/937)) ([de70ca7](https://github.com/dendronhq/dendron/commit/de70ca78cadd68b43a29d3c37f4853365592c4ab))
* hashtags ([#985](https://github.com/dendronhq/dendron/issues/985)) ([85d44fc](https://github.com/dendronhq/dendron/commit/85d44fc975db4564f5826ae87e380d37c0263b0f))
* improved block anchor in publishing ([#933](https://github.com/dendronhq/dendron/issues/933)) ([7b6ab6f](https://github.com/dendronhq/dendron/commit/7b6ab6fbcf22656919ff271382f24011684862a4))
* show unreferenced links in backlink panel ([#909](https://github.com/dendronhq/dendron/issues/909)) ([4e65a20](https://github.com/dendronhq/dendron/commit/4e65a20a344b7276d3452fc0cebb8f19339eea67))
* support dynamic theming ([1da7714](https://github.com/dendronhq/dendron/commit/1da7714f50acbba312a7e2e7a497f9e53920c96f))





## [0.50.3](https://github.com/dendronhq/dendron/compare/v0.49.0...v0.50.3) (2021-07-19)


### Bug Fixes

* avoid generating IDs containing dashes and underscores ([#947](https://github.com/dendronhq/dendron/issues/947)) ([147772e](https://github.com/dendronhq/dendron/commit/147772e4b5a9eafa34c08aed902d30b00eeb7cb3)), closes [#945](https://github.com/dendronhq/dendron/issues/945)
* Improving Tutorial Telemetry ([#942](https://github.com/dendronhq/dendron/issues/942)) ([5c7f0e0](https://github.com/dendronhq/dendron/commit/5c7f0e0fc7bfd5f8befa46f5b714bfd3b61f2f4f))
* last modiified timestamp not updating ([#961](https://github.com/dendronhq/dendron/issues/961)) ([71afabc](https://github.com/dendronhq/dendron/commit/71afabc1a29a09bd0f9acb5cd215b75e973ae3fd))


### Features Dendron

* add custom graph styling support ([#981](https://github.com/dendronhq/dendron/issues/981)) ([aa88e3a](https://github.com/dendronhq/dendron/commit/aa88e3a0e81f1ceeffe8058eceab93b32120c93b))
* auto completion for anchors and headers ([#894](https://github.com/dendronhq/dendron/issues/894)) ([13e81d4](https://github.com/dendronhq/dendron/commit/13e81d49c1f14ee18457543f8e0818d0e36c17db))
* de-emphasize block anchors in the editor ([#937](https://github.com/dendronhq/dendron/issues/937)) ([de70ca7](https://github.com/dendronhq/dendron/commit/de70ca78cadd68b43a29d3c37f4853365592c4ab))
* hashtags ([#985](https://github.com/dendronhq/dendron/issues/985)) ([85d44fc](https://github.com/dendronhq/dendron/commit/85d44fc975db4564f5826ae87e380d37c0263b0f))
* improved block anchor in publishing ([#933](https://github.com/dendronhq/dendron/issues/933)) ([7b6ab6f](https://github.com/dendronhq/dendron/commit/7b6ab6fbcf22656919ff271382f24011684862a4))
* show unreferenced links in backlink panel ([#909](https://github.com/dendronhq/dendron/issues/909)) ([4e65a20](https://github.com/dendronhq/dendron/commit/4e65a20a344b7276d3452fc0cebb8f19339eea67))
* support dynamic theming ([1da7714](https://github.com/dendronhq/dendron/commit/1da7714f50acbba312a7e2e7a497f9e53920c96f))





## [0.50.2](https://github.com/dendronhq/dendron/compare/v0.49.0...v0.50.2) (2021-07-19)


### Bug Fixes

* avoid generating IDs containing dashes and underscores ([#947](https://github.com/dendronhq/dendron/issues/947)) ([147772e](https://github.com/dendronhq/dendron/commit/147772e4b5a9eafa34c08aed902d30b00eeb7cb3)), closes [#945](https://github.com/dendronhq/dendron/issues/945)
* Improving Tutorial Telemetry ([#942](https://github.com/dendronhq/dendron/issues/942)) ([5c7f0e0](https://github.com/dendronhq/dendron/commit/5c7f0e0fc7bfd5f8befa46f5b714bfd3b61f2f4f))
* last modiified timestamp not updating ([#961](https://github.com/dendronhq/dendron/issues/961)) ([71afabc](https://github.com/dendronhq/dendron/commit/71afabc1a29a09bd0f9acb5cd215b75e973ae3fd))


### Features Dendron

* add custom graph styling support ([#981](https://github.com/dendronhq/dendron/issues/981)) ([aa88e3a](https://github.com/dendronhq/dendron/commit/aa88e3a0e81f1ceeffe8058eceab93b32120c93b))
* auto completion for anchors and headers ([#894](https://github.com/dendronhq/dendron/issues/894)) ([13e81d4](https://github.com/dendronhq/dendron/commit/13e81d49c1f14ee18457543f8e0818d0e36c17db))
* de-emphasize block anchors in the editor ([#937](https://github.com/dendronhq/dendron/issues/937)) ([de70ca7](https://github.com/dendronhq/dendron/commit/de70ca78cadd68b43a29d3c37f4853365592c4ab))
* hashtags ([#985](https://github.com/dendronhq/dendron/issues/985)) ([85d44fc](https://github.com/dendronhq/dendron/commit/85d44fc975db4564f5826ae87e380d37c0263b0f))
* improved block anchor in publishing ([#933](https://github.com/dendronhq/dendron/issues/933)) ([7b6ab6f](https://github.com/dendronhq/dendron/commit/7b6ab6fbcf22656919ff271382f24011684862a4))
* show unreferenced links in backlink panel ([#909](https://github.com/dendronhq/dendron/issues/909)) ([4e65a20](https://github.com/dendronhq/dendron/commit/4e65a20a344b7276d3452fc0cebb8f19339eea67))
* support dynamic theming ([1da7714](https://github.com/dendronhq/dendron/commit/1da7714f50acbba312a7e2e7a497f9e53920c96f))





## [0.50.1](https://github.com/dendronhq/dendron/compare/v0.49.0...v0.50.1) (2021-07-16)


### Bug Fixes

* avoid generating IDs containing dashes and underscores ([#947](https://github.com/dendronhq/dendron/issues/947)) ([147772e](https://github.com/dendronhq/dendron/commit/147772e4b5a9eafa34c08aed902d30b00eeb7cb3)), closes [#945](https://github.com/dendronhq/dendron/issues/945)
* Improving Tutorial Telemetry ([#942](https://github.com/dendronhq/dendron/issues/942)) ([5c7f0e0](https://github.com/dendronhq/dendron/commit/5c7f0e0fc7bfd5f8befa46f5b714bfd3b61f2f4f))
* last modiified timestamp not updating ([#961](https://github.com/dendronhq/dendron/issues/961)) ([71afabc](https://github.com/dendronhq/dendron/commit/71afabc1a29a09bd0f9acb5cd215b75e973ae3fd))


### Features Dendron

* auto completion for anchors and headers ([#894](https://github.com/dendronhq/dendron/issues/894)) ([13e81d4](https://github.com/dendronhq/dendron/commit/13e81d49c1f14ee18457543f8e0818d0e36c17db))
* de-emphasize block anchors in the editor ([#937](https://github.com/dendronhq/dendron/issues/937)) ([de70ca7](https://github.com/dendronhq/dendron/commit/de70ca78cadd68b43a29d3c37f4853365592c4ab))
* hashtags ([#985](https://github.com/dendronhq/dendron/issues/985)) ([85d44fc](https://github.com/dendronhq/dendron/commit/85d44fc975db4564f5826ae87e380d37c0263b0f))
* improved block anchor in publishing ([#933](https://github.com/dendronhq/dendron/issues/933)) ([7b6ab6f](https://github.com/dendronhq/dendron/commit/7b6ab6fbcf22656919ff271382f24011684862a4))
* show unreferenced links in backlink panel ([#909](https://github.com/dendronhq/dendron/issues/909)) ([4e65a20](https://github.com/dendronhq/dendron/commit/4e65a20a344b7276d3452fc0cebb8f19339eea67))
* support dynamic theming ([1da7714](https://github.com/dendronhq/dendron/commit/1da7714f50acbba312a7e2e7a497f9e53920c96f))





# [0.50.0](https://github.com/dendronhq/dendron/compare/v0.49.0...v0.50.0) (2021-07-12)


### Bug Fixes

* avoid generating IDs containing dashes and underscores ([#947](https://github.com/dendronhq/dendron/issues/947)) ([147772e](https://github.com/dendronhq/dendron/commit/147772e4b5a9eafa34c08aed902d30b00eeb7cb3)), closes [#945](https://github.com/dendronhq/dendron/issues/945)
* Improving Tutorial Telemetry ([#942](https://github.com/dendronhq/dendron/issues/942)) ([5c7f0e0](https://github.com/dendronhq/dendron/commit/5c7f0e0fc7bfd5f8befa46f5b714bfd3b61f2f4f))


### Features Dendron

* auto completion for anchors and headers ([#894](https://github.com/dendronhq/dendron/issues/894)) ([13e81d4](https://github.com/dendronhq/dendron/commit/13e81d49c1f14ee18457543f8e0818d0e36c17db))
* de-emphasize block anchors in the editor ([#937](https://github.com/dendronhq/dendron/issues/937)) ([de70ca7](https://github.com/dendronhq/dendron/commit/de70ca78cadd68b43a29d3c37f4853365592c4ab))
* improved block anchor in publishing ([#933](https://github.com/dendronhq/dendron/issues/933)) ([7b6ab6f](https://github.com/dendronhq/dendron/commit/7b6ab6fbcf22656919ff271382f24011684862a4))





# [0.49.0](https://github.com/dendronhq/dendron/compare/v0.48.3...v0.49.0) (2021-07-05)

**Note:** Version bump only for package @dendronhq/common-all





## [0.48.3](https://github.com/dendronhq/dendron/compare/v0.48.2...v0.48.3) (2021-07-02)

**Note:** Version bump only for package @dendronhq/common-all





## [0.48.2](https://github.com/dendronhq/dendron/compare/v0.48.1...v0.48.2) (2021-07-01)

**Note:** Version bump only for package @dendronhq/common-all





## [0.48.1](https://github.com/dendronhq/dendron/compare/v0.48.0...v0.48.1) (2021-06-30)

**Note:** Version bump only for package @dendronhq/common-all





# [0.48.0](https://github.com/dendronhq/dendron/compare/v0.47.0...v0.48.0) (2021-06-28)


### Bug Fixes

* note contentHash undefined after save ([c0376d0](https://github.com/dendronhq/dendron/commit/c0376d0be84898a89b003cce33430732f1c0b338))


### Features Dendron

* add canonicalUrl tag ([2334350](https://github.com/dendronhq/dendron/commit/233435094a465731ac1dccb1089563a3da001594))
* Focus after the frontmatter when opening a note & option to auto-fold frontmatter ([#870](https://github.com/dendronhq/dendron/issues/870)) ([41019d3](https://github.com/dendronhq/dendron/commit/41019d3981cb8bf32b581a679f5476c26df7de39))
* workspace-trust-for-hooks ([#845](https://github.com/dendronhq/dendron/issues/845)) ([9fc3e15](https://github.com/dendronhq/dendron/commit/9fc3e15826f62daf87f5d39a93de0d6c33992413))





## [0.47.2](https://github.com/dendronhq/dendron/compare/v0.47.0...v0.47.2) (2021-06-24)


### Features Dendron

* add canonicalUrl tag ([2334350](https://github.com/dendronhq/dendron/commit/233435094a465731ac1dccb1089563a3da001594))
* workspace-trust-for-hooks ([#845](https://github.com/dendronhq/dendron/issues/845)) ([9fc3e15](https://github.com/dendronhq/dendron/commit/9fc3e15826f62daf87f5d39a93de0d6c33992413))





## [0.47.1](https://github.com/dendronhq/dendron/compare/v0.47.0...v0.47.1) (2021-06-23)


### Features Dendron

* workspace-trust-for-hooks ([#845](https://github.com/dendronhq/dendron/issues/845)) ([9fc3e15](https://github.com/dendronhq/dendron/commit/9fc3e15826f62daf87f5d39a93de0d6c33992413))





# [0.47.0](https://github.com/dendronhq/dendron/compare/v0.46.1...v0.47.0) (2021-06-21)


### Features Dendron

* calendar panel ([#806](https://github.com/dendronhq/dendron/issues/806)) ([65ef926](https://github.com/dendronhq/dendron/commit/65ef926564dbaeaaca305e480ac8607c66bcc4b1)), closes [packages/plugin-core/src/views/utils.ts#88](https://github.com/packages/plugin-core/src/views/utils.ts/issues/88) [/github.com/ant-design/ant-design/blob/832aa81c821b7b5750673b5aacafa39c9978b09c/components/calendar/generateCalendar.tsx#L183-L205](https://github.com//github.com/ant-design/ant-design/blob/832aa81c821b7b5750673b5aacafa39c9978b09c/components/calendar/generateCalendar.tsx/issues/L183-L205)
* remove seed cmd ([252f297](https://github.com/dendronhq/dendron/commit/252f29741f1cabb915e9e541d80256b21ef594d0))
* seed add cmd ([a8f245b](https://github.com/dendronhq/dendron/commit/a8f245b1a29f6de0a80839c1bd765a61941ab58f))





## [0.46.3-alpha.0](https://github.com/dendronhq/dendron/compare/v0.46.1...v0.46.3-alpha.0) (2021-06-19)


### Features Dendron

* calendar panel ([#806](https://github.com/dendronhq/dendron/issues/806)) ([65ef926](https://github.com/dendronhq/dendron/commit/65ef926564dbaeaaca305e480ac8607c66bcc4b1)), closes [packages/plugin-core/src/views/utils.ts#88](https://github.com/packages/plugin-core/src/views/utils.ts/issues/88) [/github.com/ant-design/ant-design/blob/832aa81c821b7b5750673b5aacafa39c9978b09c/components/calendar/generateCalendar.tsx#L183-L205](https://github.com//github.com/ant-design/ant-design/blob/832aa81c821b7b5750673b5aacafa39c9978b09c/components/calendar/generateCalendar.tsx/issues/L183-L205)
* remove seed cmd ([252f297](https://github.com/dendronhq/dendron/commit/252f29741f1cabb915e9e541d80256b21ef594d0))
* seed add cmd ([a8f245b](https://github.com/dendronhq/dendron/commit/a8f245b1a29f6de0a80839c1bd765a61941ab58f))





## [0.46.2](https://github.com/dendronhq/dendron/compare/v0.46.1...v0.46.2) (2021-06-19)


### Features Dendron

* calendar panel ([#806](https://github.com/dendronhq/dendron/issues/806)) ([65ef926](https://github.com/dendronhq/dendron/commit/65ef926564dbaeaaca305e480ac8607c66bcc4b1)), closes [packages/plugin-core/src/views/utils.ts#88](https://github.com/packages/plugin-core/src/views/utils.ts/issues/88) [/github.com/ant-design/ant-design/blob/832aa81c821b7b5750673b5aacafa39c9978b09c/components/calendar/generateCalendar.tsx#L183-L205](https://github.com//github.com/ant-design/ant-design/blob/832aa81c821b7b5750673b5aacafa39c9978b09c/components/calendar/generateCalendar.tsx/issues/L183-L205)
* remove seed cmd ([252f297](https://github.com/dendronhq/dendron/commit/252f29741f1cabb915e9e541d80256b21ef594d0))
* seed add cmd ([a8f245b](https://github.com/dendronhq/dendron/commit/a8f245b1a29f6de0a80839c1bd765a61941ab58f))





## [0.46.2-alpha.1](https://github.com/dendronhq/dendron/compare/v0.46.1...v0.46.2-alpha.1) (2021-06-16)


### enhance

* enable web ui by default ([557934f](https://github.com/dendronhq/dendron/commit/557934f344cc416c06f3b4027e59c1272595e39f))


### Features Dendron

* calendar panel ([#806](https://github.com/dendronhq/dendron/issues/806)) ([65ef926](https://github.com/dendronhq/dendron/commit/65ef926564dbaeaaca305e480ac8607c66bcc4b1)), closes [packages/plugin-core/src/views/utils.ts#88](https://github.com/packages/plugin-core/src/views/utils.ts/issues/88) [/github.com/ant-design/ant-design/blob/832aa81c821b7b5750673b5aacafa39c9978b09c/components/calendar/generateCalendar.tsx#L183-L205](https://github.com//github.com/ant-design/ant-design/blob/832aa81c821b7b5750673b5aacafa39c9978b09c/components/calendar/generateCalendar.tsx/issues/L183-L205)
* remove seed cmd ([252f297](https://github.com/dendronhq/dendron/commit/252f29741f1cabb915e9e541d80256b21ef594d0))
* seed add cmd ([a8f245b](https://github.com/dendronhq/dendron/commit/a8f245b1a29f6de0a80839c1bd765a61941ab58f))


### BREAKING CHANGES

* removes the `enableWebUI` configuration and introduces `disableWebUI` configuration that needs to be set to remove the web ui





## [0.46.2-alpha.0](https://github.com/dendronhq/dendron/compare/v0.46.1...v0.46.2-alpha.0) (2021-06-16)


### enhance

* enable web ui by default ([fc68be5](https://github.com/dendronhq/dendron/commit/fc68be5d1fe5355b5bb33d70b4143043f1df20fe))


### Features Dendron

* calendar panel ([#806](https://github.com/dendronhq/dendron/issues/806)) ([65ef926](https://github.com/dendronhq/dendron/commit/65ef926564dbaeaaca305e480ac8607c66bcc4b1)), closes [packages/plugin-core/src/views/utils.ts#88](https://github.com/packages/plugin-core/src/views/utils.ts/issues/88) [/github.com/ant-design/ant-design/blob/832aa81c821b7b5750673b5aacafa39c9978b09c/components/calendar/generateCalendar.tsx#L183-L205](https://github.com//github.com/ant-design/ant-design/blob/832aa81c821b7b5750673b5aacafa39c9978b09c/components/calendar/generateCalendar.tsx/issues/L183-L205)
* seed add cmd ([a8f245b](https://github.com/dendronhq/dendron/commit/a8f245b1a29f6de0a80839c1bd765a61941ab58f))


### BREAKING CHANGES

* removes the `enableWebUI` configuration and introduces `disableWebUI` configuration that needs to be set to remove the web ui





## [0.46.1](https://github.com/dendronhq/dendron/compare/v0.46.0...v0.46.1) (2021-06-14)

**Note:** Version bump only for package @dendronhq/common-all





# [0.46.0](https://github.com/dendronhq/dendron/compare/v0.45.2...v0.46.0) (2021-06-14)


### Features Dendron

* better rename ([#819](https://github.com/dendronhq/dendron/issues/819)) ([93f6898](https://github.com/dendronhq/dendron/commit/93f689875da9535855a5d73df060fc65eaa8e45d))





## [0.45.2](https://github.com/dendronhq/dendron/compare/v0.45.1...v0.45.2) (2021-06-12)


### Features Dendron

* Add initial note filtering, schema graph ([#814](https://github.com/dendronhq/dendron/issues/814)) ([65f2025](https://github.com/dendronhq/dendron/commit/65f20251d42ab9fe630c50025ddebe118d426e28))
* Copy block reference ([#812](https://github.com/dendronhq/dendron/issues/812)) ([ced5946](https://github.com/dendronhq/dendron/commit/ced59467c1c824eaef1a9a3b59f588b2968d8e48))





## [0.45.1](https://github.com/dendronhq/dendron/compare/v0.45.0...v0.45.1) (2021-06-09)


### Bug Fixes

* format issue ([232926d](https://github.com/dendronhq/dendron/commit/232926d88c633aaa052711e9380a9da4a1ecc5d7))





# [0.45.0](https://github.com/dendronhq/dendron/compare/v0.44.1...v0.45.0) (2021-06-07)


### Features Dendron

* Create redesigned note and schema graphs ([#793](https://github.com/dendronhq/dendron/issues/793)) ([57494e4](https://github.com/dendronhq/dendron/commit/57494e4da8f996e20718515e8c14ef5fc04ece66))





## [0.44.2-alpha.1](https://github.com/dendronhq/dendron/compare/v0.44.1...v0.44.2-alpha.1) (2021-06-06)


### Features Dendron

* Create redesigned note and schema graphs ([#793](https://github.com/dendronhq/dendron/issues/793)) ([57494e4](https://github.com/dendronhq/dendron/commit/57494e4da8f996e20718515e8c14ef5fc04ece66))





## [0.44.2-alpha.0](https://github.com/dendronhq/dendron/compare/v0.44.1...v0.44.2-alpha.0) (2021-06-06)


### Features Dendron

* Create redesigned note and schema graphs ([#793](https://github.com/dendronhq/dendron/issues/793)) ([57494e4](https://github.com/dendronhq/dendron/commit/57494e4da8f996e20718515e8c14ef5fc04ece66))





## [0.44.1](https://github.com/dendronhq/dendron/compare/v0.44.1-alpha.5...v0.44.1) (2021-06-04)

**Note:** Version bump only for package @dendronhq/common-all





## [0.44.1-alpha.7](https://github.com/dendronhq/dendron/compare/v0.44.1-alpha.5...v0.44.1-alpha.7) (2021-06-04)

**Note:** Version bump only for package @dendronhq/common-all





## [0.44.1-alpha.6](https://github.com/dendronhq/dendron/compare/v0.44.1-alpha.5...v0.44.1-alpha.6) (2021-06-04)

**Note:** Version bump only for package @dendronhq/common-all





## [0.44.1-alpha.5](https://github.com/dendronhq/dendron/compare/v0.42.0...v0.44.1-alpha.5) (2021-06-04)


### Bug Fixes

* bad import ([9f04493](https://github.com/dendronhq/dendron/commit/9f04493388e921ac1eab687f9f79c438836cba1e))
* don't enable alwaysShow behavior for lookup commands ([83cbda3](https://github.com/dendronhq/dendron/commit/83cbda3a17650e3a01d7c67924913e13a503f232))
* import markdown pod has bad body ([7649309](https://github.com/dendronhq/dendron/commit/7649309f6e953826e9a3f8e7c0c9ce53d6e869a4))
* move file note method into common-server ([29b4ad7](https://github.com/dendronhq/dendron/commit/29b4ad73b0e9501ea76ce3e9ae5b0487e196e7cd))
* remove fs from common ([dadbb96](https://github.com/dendronhq/dendron/commit/dadbb965c802a1a104be1d3779c866d1b25a15df))
* support lookups with workspace vaults ([404fb89](https://github.com/dendronhq/dendron/commit/404fb8922d3f20fa1c4f87ce742a29c1af03b8a6))


### Features Dendron

* Add block anchor HTML generation ([#766](https://github.com/dendronhq/dendron/issues/766)) ([bb0ff8e](https://github.com/dendronhq/dendron/commit/bb0ff8ee53a50768f1908bbabd625c1c2434df39))
* Basic block reference link functionality ([#742](https://github.com/dendronhq/dendron/issues/742)) ([416e382](https://github.com/dendronhq/dendron/commit/416e3825254b57625f7dc2b6063f1e8bc731bf3b))
* insert note link cmd ([cc8a02b](https://github.com/dendronhq/dendron/commit/cc8a02b4e50d98d406ad9ea684f4e11e93e4ad36))
* support initializing remote workspace vault ([6f401d7](https://github.com/dendronhq/dendron/commit/6f401d75f21122c84efd03f4307531fde719e37d))





## [0.44.1-alpha.4](https://github.com/dendronhq/dendron/compare/v0.42.0...v0.44.1-alpha.4) (2021-06-04)


### Bug Fixes

* bad import ([9f04493](https://github.com/dendronhq/dendron/commit/9f04493388e921ac1eab687f9f79c438836cba1e))
* don't enable alwaysShow behavior for lookup commands ([83cbda3](https://github.com/dendronhq/dendron/commit/83cbda3a17650e3a01d7c67924913e13a503f232))
* import markdown pod has bad body ([7649309](https://github.com/dendronhq/dendron/commit/7649309f6e953826e9a3f8e7c0c9ce53d6e869a4))
* move file note method into common-server ([29b4ad7](https://github.com/dendronhq/dendron/commit/29b4ad73b0e9501ea76ce3e9ae5b0487e196e7cd))
* remove fs from common ([dadbb96](https://github.com/dendronhq/dendron/commit/dadbb965c802a1a104be1d3779c866d1b25a15df))
* support lookups with workspace vaults ([404fb89](https://github.com/dendronhq/dendron/commit/404fb8922d3f20fa1c4f87ce742a29c1af03b8a6))


### Features Dendron

* Add block anchor HTML generation ([#766](https://github.com/dendronhq/dendron/issues/766)) ([bb0ff8e](https://github.com/dendronhq/dendron/commit/bb0ff8ee53a50768f1908bbabd625c1c2434df39))
* Basic block reference link functionality ([#742](https://github.com/dendronhq/dendron/issues/742)) ([416e382](https://github.com/dendronhq/dendron/commit/416e3825254b57625f7dc2b6063f1e8bc731bf3b))
* insert note link cmd ([cc8a02b](https://github.com/dendronhq/dendron/commit/cc8a02b4e50d98d406ad9ea684f4e11e93e4ad36))
* support initializing remote workspace vault ([6f401d7](https://github.com/dendronhq/dendron/commit/6f401d75f21122c84efd03f4307531fde719e37d))





## [0.44.1-alpha.3](https://github.com/dendronhq/dendron/compare/v0.42.0...v0.44.1-alpha.3) (2021-06-03)


### Bug Fixes

* bad import ([9f04493](https://github.com/dendronhq/dendron/commit/9f04493388e921ac1eab687f9f79c438836cba1e))
* don't enable alwaysShow behavior for lookup commands ([83cbda3](https://github.com/dendronhq/dendron/commit/83cbda3a17650e3a01d7c67924913e13a503f232))
* import markdown pod has bad body ([7649309](https://github.com/dendronhq/dendron/commit/7649309f6e953826e9a3f8e7c0c9ce53d6e869a4))
* move file note method into common-server ([29b4ad7](https://github.com/dendronhq/dendron/commit/29b4ad73b0e9501ea76ce3e9ae5b0487e196e7cd))
* remove fs from common ([dadbb96](https://github.com/dendronhq/dendron/commit/dadbb965c802a1a104be1d3779c866d1b25a15df))
* support lookups with workspace vaults ([7653a84](https://github.com/dendronhq/dendron/commit/7653a84177b0c5a4c80fa6f48ed784ad9e3ae3d8))


### Features Dendron

* Add block anchor HTML generation ([#766](https://github.com/dendronhq/dendron/issues/766)) ([bb0ff8e](https://github.com/dendronhq/dendron/commit/bb0ff8ee53a50768f1908bbabd625c1c2434df39))
* Basic block reference link functionality ([#742](https://github.com/dendronhq/dendron/issues/742)) ([416e382](https://github.com/dendronhq/dendron/commit/416e3825254b57625f7dc2b6063f1e8bc731bf3b))
* insert note link cmd ([cc8a02b](https://github.com/dendronhq/dendron/commit/cc8a02b4e50d98d406ad9ea684f4e11e93e4ad36))
* support initializing remote workspace vault ([cd59456](https://github.com/dendronhq/dendron/commit/cd594566a4e992dd6a1252c72c2df7a8ebd0eb3d))





## [0.44.1-alpha.2](https://github.com/dendronhq/dendron/compare/v0.42.0...v0.44.1-alpha.2) (2021-06-03)


### Bug Fixes

* bad import ([9f04493](https://github.com/dendronhq/dendron/commit/9f04493388e921ac1eab687f9f79c438836cba1e))
* don't enable alwaysShow behavior for lookup commands ([83cbda3](https://github.com/dendronhq/dendron/commit/83cbda3a17650e3a01d7c67924913e13a503f232))
* import markdown pod has bad body ([7649309](https://github.com/dendronhq/dendron/commit/7649309f6e953826e9a3f8e7c0c9ce53d6e869a4))
* move file note method into common-server ([29b4ad7](https://github.com/dendronhq/dendron/commit/29b4ad73b0e9501ea76ce3e9ae5b0487e196e7cd))
* remove fs from common ([dadbb96](https://github.com/dendronhq/dendron/commit/dadbb965c802a1a104be1d3779c866d1b25a15df))
* support lookups with workspace vaults ([7653a84](https://github.com/dendronhq/dendron/commit/7653a84177b0c5a4c80fa6f48ed784ad9e3ae3d8))


### Features Dendron

* Add block anchor HTML generation ([#766](https://github.com/dendronhq/dendron/issues/766)) ([bb0ff8e](https://github.com/dendronhq/dendron/commit/bb0ff8ee53a50768f1908bbabd625c1c2434df39))
* Basic block reference link functionality ([#742](https://github.com/dendronhq/dendron/issues/742)) ([416e382](https://github.com/dendronhq/dendron/commit/416e3825254b57625f7dc2b6063f1e8bc731bf3b))
* insert note link cmd ([cc8a02b](https://github.com/dendronhq/dendron/commit/cc8a02b4e50d98d406ad9ea684f4e11e93e4ad36))
* support initializing remote workspace vault ([cd59456](https://github.com/dendronhq/dendron/commit/cd594566a4e992dd6a1252c72c2df7a8ebd0eb3d))





## [0.44.1-alpha.1](https://github.com/dendronhq/dendron/compare/v0.42.0...v0.44.1-alpha.1) (2021-06-02)


### Bug Fixes

* bad import ([9f04493](https://github.com/dendronhq/dendron/commit/9f04493388e921ac1eab687f9f79c438836cba1e))
* don't enable alwaysShow behavior for lookup commands ([83cbda3](https://github.com/dendronhq/dendron/commit/83cbda3a17650e3a01d7c67924913e13a503f232))
* import markdown pod has bad body ([7649309](https://github.com/dendronhq/dendron/commit/7649309f6e953826e9a3f8e7c0c9ce53d6e869a4))
* move file note method into common-server ([29b4ad7](https://github.com/dendronhq/dendron/commit/29b4ad73b0e9501ea76ce3e9ae5b0487e196e7cd))
* remove fs from common ([dadbb96](https://github.com/dendronhq/dendron/commit/dadbb965c802a1a104be1d3779c866d1b25a15df))
* support lookups with workspace vaults ([7653a84](https://github.com/dendronhq/dendron/commit/7653a84177b0c5a4c80fa6f48ed784ad9e3ae3d8))


### Features Dendron

* Add block anchor HTML generation ([#766](https://github.com/dendronhq/dendron/issues/766)) ([bb0ff8e](https://github.com/dendronhq/dendron/commit/bb0ff8ee53a50768f1908bbabd625c1c2434df39))
* Basic block reference link functionality ([#742](https://github.com/dendronhq/dendron/issues/742)) ([416e382](https://github.com/dendronhq/dendron/commit/416e3825254b57625f7dc2b6063f1e8bc731bf3b))
* insert note link cmd ([cc8a02b](https://github.com/dendronhq/dendron/commit/cc8a02b4e50d98d406ad9ea684f4e11e93e4ad36))





## [0.44.1-alpha.0](https://github.com/dendronhq/dendron/compare/v0.42.0...v0.44.1-alpha.0) (2021-06-02)


### Bug Fixes

* bad import ([9f04493](https://github.com/dendronhq/dendron/commit/9f04493388e921ac1eab687f9f79c438836cba1e))
* don't enable alwaysShow behavior for lookup commands ([83cbda3](https://github.com/dendronhq/dendron/commit/83cbda3a17650e3a01d7c67924913e13a503f232))
* import markdown pod has bad body ([7649309](https://github.com/dendronhq/dendron/commit/7649309f6e953826e9a3f8e7c0c9ce53d6e869a4))
* move file note method into common-server ([29b4ad7](https://github.com/dendronhq/dendron/commit/29b4ad73b0e9501ea76ce3e9ae5b0487e196e7cd))
* remove fs from common ([dadbb96](https://github.com/dendronhq/dendron/commit/dadbb965c802a1a104be1d3779c866d1b25a15df))
* support lookups with workspace vaults ([7653a84](https://github.com/dendronhq/dendron/commit/7653a84177b0c5a4c80fa6f48ed784ad9e3ae3d8))


### Features Dendron

* Add block anchor HTML generation ([#766](https://github.com/dendronhq/dendron/issues/766)) ([bb0ff8e](https://github.com/dendronhq/dendron/commit/bb0ff8ee53a50768f1908bbabd625c1c2434df39))
* Basic block reference link functionality ([#742](https://github.com/dendronhq/dendron/issues/742)) ([416e382](https://github.com/dendronhq/dendron/commit/416e3825254b57625f7dc2b6063f1e8bc731bf3b))
* insert note link cmd ([cc8a02b](https://github.com/dendronhq/dendron/commit/cc8a02b4e50d98d406ad9ea684f4e11e93e4ad36))





# [0.44.0](https://github.com/dendronhq/dendron/compare/v0.42.0...v0.44.0) (2021-05-31)

### Bug Fixes

- bad import ([9f04493](https://github.com/dendronhq/dendron/commit/9f04493388e921ac1eab687f9f79c438836cba1e))
- don't enable alwaysShow behavior for lookup commands ([83cbda3](https://github.com/dendronhq/dendron/commit/83cbda3a17650e3a01d7c67924913e13a503f232))
- import markdown pod has bad body ([7649309](https://github.com/dendronhq/dendron/commit/7649309f6e953826e9a3f8e7c0c9ce53d6e869a4))

### Features Dendron

- Add block anchor HTML generation ([#766](https://github.com/dendronhq/dendron/issues/766)) ([bb0ff8e](https://github.com/dendronhq/dendron/commit/bb0ff8ee53a50768f1908bbabd625c1c2434df39))
- Basic block reference link functionality ([#742](https://github.com/dendronhq/dendron/issues/742)) ([416e382](https://github.com/dendronhq/dendron/commit/416e3825254b57625f7dc2b6063f1e8bc731bf3b))
- insert note link cmd ([cc8a02b](https://github.com/dendronhq/dendron/commit/cc8a02b4e50d98d406ad9ea684f4e11e93e4ad36))

## [0.43.5-alpha.2](https://github.com/dendronhq/dendron/compare/v0.42.0...v0.43.5-alpha.2) (2021-05-29)

### Bug Fixes

- bad import ([9f04493](https://github.com/dendronhq/dendron/commit/9f04493388e921ac1eab687f9f79c438836cba1e))
- import markdown pod has bad body ([7649309](https://github.com/dendronhq/dendron/commit/7649309f6e953826e9a3f8e7c0c9ce53d6e869a4))

### Features Dendron

- Add block anchor HTML generation ([#766](https://github.com/dendronhq/dendron/issues/766)) ([bb0ff8e](https://github.com/dendronhq/dendron/commit/bb0ff8ee53a50768f1908bbabd625c1c2434df39))
- Basic block reference link functionality ([#742](https://github.com/dendronhq/dendron/issues/742)) ([416e382](https://github.com/dendronhq/dendron/commit/416e3825254b57625f7dc2b6063f1e8bc731bf3b))

## [0.43.5-alpha.1](https://github.com/dendronhq/dendron/compare/v0.42.0...v0.43.5-alpha.1) (2021-05-29)

### Bug Fixes

- bad import ([9f04493](https://github.com/dendronhq/dendron/commit/9f04493388e921ac1eab687f9f79c438836cba1e))
- import markdown pod has bad body ([7649309](https://github.com/dendronhq/dendron/commit/7649309f6e953826e9a3f8e7c0c9ce53d6e869a4))

### Features Dendron

- Add block anchor HTML generation ([#766](https://github.com/dendronhq/dendron/issues/766)) ([bb0ff8e](https://github.com/dendronhq/dendron/commit/bb0ff8ee53a50768f1908bbabd625c1c2434df39))
- Basic block reference link functionality ([#742](https://github.com/dendronhq/dendron/issues/742)) ([416e382](https://github.com/dendronhq/dendron/commit/416e3825254b57625f7dc2b6063f1e8bc731bf3b))

## [0.43.5-alpha.0](https://github.com/dendronhq/dendron/compare/v0.42.0...v0.43.5-alpha.0) (2021-05-28)

### Bug Fixes

- bad import ([9f04493](https://github.com/dendronhq/dendron/commit/9f04493388e921ac1eab687f9f79c438836cba1e))
- import markdown pod has bad body ([7649309](https://github.com/dendronhq/dendron/commit/7649309f6e953826e9a3f8e7c0c9ce53d6e869a4))

### Features Dendron

- Add block anchor HTML generation ([#766](https://github.com/dendronhq/dendron/issues/766)) ([bb0ff8e](https://github.com/dendronhq/dendron/commit/bb0ff8ee53a50768f1908bbabd625c1c2434df39))
- Basic block reference link functionality ([#742](https://github.com/dendronhq/dendron/issues/742)) ([416e382](https://github.com/dendronhq/dendron/commit/416e3825254b57625f7dc2b6063f1e8bc731bf3b))

## [0.43.4-alpha.0](https://github.com/dendronhq/dendron/compare/v0.42.0...v0.43.4-alpha.0) (2021-05-28)

### Bug Fixes

- bad import ([9f04493](https://github.com/dendronhq/dendron/commit/9f04493388e921ac1eab687f9f79c438836cba1e))
- import markdown pod has bad body ([7649309](https://github.com/dendronhq/dendron/commit/7649309f6e953826e9a3f8e7c0c9ce53d6e869a4))

### Features Dendron

- Add block anchor HTML generation ([#766](https://github.com/dendronhq/dendron/issues/766)) ([bb0ff8e](https://github.com/dendronhq/dendron/commit/bb0ff8ee53a50768f1908bbabd625c1c2434df39))
- Basic block reference link functionality ([#742](https://github.com/dendronhq/dendron/issues/742)) ([416e382](https://github.com/dendronhq/dendron/commit/416e3825254b57625f7dc2b6063f1e8bc731bf3b))

## [0.43.3-alpha.0](https://github.com/dendronhq/dendron/compare/v0.42.0...v0.43.3-alpha.0) (2021-05-28)

### Bug Fixes

- bad import ([9f04493](https://github.com/dendronhq/dendron/commit/9f04493388e921ac1eab687f9f79c438836cba1e))
- import markdown pod has bad body ([7649309](https://github.com/dendronhq/dendron/commit/7649309f6e953826e9a3f8e7c0c9ce53d6e869a4))

### Features Dendron

- Add block anchor HTML generation ([#766](https://github.com/dendronhq/dendron/issues/766)) ([bb0ff8e](https://github.com/dendronhq/dendron/commit/bb0ff8ee53a50768f1908bbabd625c1c2434df39))
- Basic block reference link functionality ([#742](https://github.com/dendronhq/dendron/issues/742)) ([416e382](https://github.com/dendronhq/dendron/commit/416e3825254b57625f7dc2b6063f1e8bc731bf3b))

## [0.43.2-alpha.0](https://github.com/dendronhq/dendron/compare/v0.42.0...v0.43.2-alpha.0) (2021-05-27)

### Bug Fixes

- bad import ([9f04493](https://github.com/dendronhq/dendron/commit/9f04493388e921ac1eab687f9f79c438836cba1e))
- import markdown pod has bad body ([3038dd3](https://github.com/dendronhq/dendron/commit/3038dd340ed0f7ac56e34e8b8716962284f586e0))

### Features Dendron

- Basic block reference link functionality ([#742](https://github.com/dendronhq/dendron/issues/742)) ([416e382](https://github.com/dendronhq/dendron/commit/416e3825254b57625f7dc2b6063f1e8bc731bf3b))

## [0.43.1](https://github.com/dendronhq/dendron/compare/v0.42.0...v0.43.1) (2021-05-26)

### Bug Fixes

- bad import ([9f04493](https://github.com/dendronhq/dendron/commit/9f04493388e921ac1eab687f9f79c438836cba1e))
- import markdown pod has bad body ([3038dd3](https://github.com/dendronhq/dendron/commit/3038dd340ed0f7ac56e34e8b8716962284f586e0))

### Features Dendron

- Basic block reference link functionality ([#742](https://github.com/dendronhq/dendron/issues/742)) ([416e382](https://github.com/dendronhq/dendron/commit/416e3825254b57625f7dc2b6063f1e8bc731bf3b))

## [0.43.3-alpha.0](https://github.com/dendronhq/dendron/compare/v0.42.0...v0.43.3-alpha.0) (2021-05-26)

### Bug Fixes

- bad import ([9f04493](https://github.com/dendronhq/dendron/commit/9f04493388e921ac1eab687f9f79c438836cba1e))
- import markdown pod has bad body ([3038dd3](https://github.com/dendronhq/dendron/commit/3038dd340ed0f7ac56e34e8b8716962284f586e0))

### Features Dendron

- Basic block reference link functionality ([#742](https://github.com/dendronhq/dendron/issues/742)) ([416e382](https://github.com/dendronhq/dendron/commit/416e3825254b57625f7dc2b6063f1e8bc731bf3b))

## [0.43.2-alpha.0](https://github.com/dendronhq/dendron/compare/v0.42.0...v0.43.2-alpha.0) (2021-05-25)

### Bug Fixes

- bad import ([9f04493](https://github.com/dendronhq/dendron/commit/9f04493388e921ac1eab687f9f79c438836cba1e))

### Features Dendron

- Basic block reference link functionality ([#742](https://github.com/dendronhq/dendron/issues/742)) ([416e382](https://github.com/dendronhq/dendron/commit/416e3825254b57625f7dc2b6063f1e8bc731bf3b))

## [0.43.1-alpha.0](https://github.com/dendronhq/dendron/compare/v0.42.0...v0.43.1-alpha.0) (2021-05-24)

### Bug Fixes

- bad import ([9f04493](https://github.com/dendronhq/dendron/commit/9f04493388e921ac1eab687f9f79c438836cba1e))

### Features Dendron

- Basic block reference link functionality ([#742](https://github.com/dendronhq/dendron/issues/742)) ([416e382](https://github.com/dendronhq/dendron/commit/416e3825254b57625f7dc2b6063f1e8bc731bf3b))

# [0.43.0](https://github.com/dendronhq/dendron/compare/v0.42.0...v0.43.0) (2021-05-24)

### Bug Fixes

- bad import ([9f04493](https://github.com/dendronhq/dendron/commit/9f04493388e921ac1eab687f9f79c438836cba1e))

### Features Dendron

- Basic block reference link functionality ([#742](https://github.com/dendronhq/dendron/issues/742)) ([416e382](https://github.com/dendronhq/dendron/commit/416e3825254b57625f7dc2b6063f1e8bc731bf3b))

## [0.42.6-alpha.0](https://github.com/dendronhq/dendron/compare/v0.42.0...v0.42.6-alpha.0) (2021-05-24)

### Bug Fixes

- bad import ([9f04493](https://github.com/dendronhq/dendron/commit/9f04493388e921ac1eab687f9f79c438836cba1e))

### Features Dendron

- Basic block reference link functionality ([#742](https://github.com/dendronhq/dendron/issues/742)) ([416e382](https://github.com/dendronhq/dendron/commit/416e3825254b57625f7dc2b6063f1e8bc731bf3b))

## [0.42.5-alpha.0](https://github.com/dendronhq/dendron/compare/v0.42.0...v0.42.5-alpha.0) (2021-05-24)

### Bug Fixes

- bad import ([9f04493](https://github.com/dendronhq/dendron/commit/9f04493388e921ac1eab687f9f79c438836cba1e))

### Features Dendron

- Basic block reference link functionality ([#742](https://github.com/dendronhq/dendron/issues/742)) ([416e382](https://github.com/dendronhq/dendron/commit/416e3825254b57625f7dc2b6063f1e8bc731bf3b))

## [0.42.4-alpha.0](https://github.com/dendronhq/dendron/compare/v0.42.0...v0.42.4-alpha.0) (2021-05-24)

### Bug Fixes

- bad import ([9f04493](https://github.com/dendronhq/dendron/commit/9f04493388e921ac1eab687f9f79c438836cba1e))

### Features Dendron

- Basic block reference link functionality ([#742](https://github.com/dendronhq/dendron/issues/742)) ([416e382](https://github.com/dendronhq/dendron/commit/416e3825254b57625f7dc2b6063f1e8bc731bf3b))

## [0.42.3-alpha.0](https://github.com/dendronhq/dendron/compare/v0.42.0...v0.42.3-alpha.0) (2021-05-24)

### Bug Fixes

- bad import ([9f04493](https://github.com/dendronhq/dendron/commit/9f04493388e921ac1eab687f9f79c438836cba1e))

### Features Dendron

- Basic block reference link functionality ([#742](https://github.com/dendronhq/dendron/issues/742)) ([416e382](https://github.com/dendronhq/dendron/commit/416e3825254b57625f7dc2b6063f1e8bc731bf3b))

## [0.42.2-alpha.0](https://github.com/dendronhq/dendron/compare/v0.42.0...v0.42.2-alpha.0) (2021-05-22)

### Bug Fixes

- bad import ([9f04493](https://github.com/dendronhq/dendron/commit/9f04493388e921ac1eab687f9f79c438836cba1e))

### Features Dendron

- Basic block reference link functionality ([#742](https://github.com/dendronhq/dendron/issues/742)) ([416e382](https://github.com/dendronhq/dendron/commit/416e3825254b57625f7dc2b6063f1e8bc731bf3b))

## [0.42.1-alpha.0](https://github.com/dendronhq/dendron/compare/v0.42.0...v0.42.1-alpha.0) (2021-05-20)

### Bug Fixes

- bad import ([9f04493](https://github.com/dendronhq/dendron/commit/9f04493388e921ac1eab687f9f79c438836cba1e))

### Features Dendron

- Basic block reference link functionality ([#742](https://github.com/dendronhq/dendron/issues/742)) ([416e382](https://github.com/dendronhq/dendron/commit/416e3825254b57625f7dc2b6063f1e8bc731bf3b))

# [0.42.0](https://github.com/dendronhq/dendron/compare/v0.41.0...v0.42.0) (2021-05-17)

**Note:** Version bump only for package @dendronhq/common-all

# [0.41.0](https://github.com/dendronhq/dendron/compare/v0.40.0...v0.41.0) (2021-05-10)

### Bug Fixes

- make requireHook work with webpack ([b1e6447](https://github.com/dendronhq/dendron/commit/b1e644772de9fe583eca4f6e32ac7365ecfa4a67))

## [0.40.4-alpha.0](https://github.com/dendronhq/dendron/compare/v0.40.0...v0.40.4-alpha.0) (2021-05-09)

### Bug Fixes

- make requireHook work with webpack ([c0835d2](https://github.com/dendronhq/dendron/commit/c0835d2e34fde992c5484ac4be7f4eb0ae43dd6a))

## [0.40.4-alpha.0](https://github.com/dendronhq/dendron/compare/v0.40.0...v0.40.4-alpha.0) (2021-05-08)

### Bug Fixes

- make requireHook work with webpack ([c0835d2](https://github.com/dendronhq/dendron/commit/c0835d2e34fde992c5484ac4be7f4eb0ae43dd6a))

## [0.40.3-alpha.0](https://github.com/dendronhq/dendron/compare/v0.40.0...v0.40.3-alpha.0) (2021-05-08)

### Bug Fixes

- make requireHook work with webpack ([c0835d2](https://github.com/dendronhq/dendron/commit/c0835d2e34fde992c5484ac4be7f4eb0ae43dd6a))

## [0.40.2](https://github.com/dendronhq/dendron/compare/v0.40.0...v0.40.2) (2021-05-05)

**Note:** Version bump only for package @dendronhq/common-all

## [0.40.2-alpha.0](https://github.com/dendronhq/dendron/compare/v0.40.0...v0.40.2-alpha.0) (2021-05-05)

**Note:** Version bump only for package @dendronhq/common-all

# [0.40.0](https://github.com/dendronhq/dendron/compare/v0.39.0...v0.40.0) (2021-05-03)

### Bug Fixes

- better error message when moving note results in overwritten note ([a98787a](https://github.com/dendronhq/dendron/commit/a98787afbca2d8c850a399dc656fa7449e7507a3))
- caching for vaults ([c24651a](https://github.com/dendronhq/dendron/commit/c24651a83d002830d837ab94301e54d214a04286))

## [0.39.2](https://github.com/dendronhq/dendron/compare/v0.39.0...v0.39.2) (2021-04-30)

### Bug Fixes

- better error message when moving note results in overwritten note ([a98787a](https://github.com/dendronhq/dendron/commit/a98787afbca2d8c850a399dc656fa7449e7507a3))
- caching for vaults ([c24651a](https://github.com/dendronhq/dendron/commit/c24651a83d002830d837ab94301e54d214a04286))

# [0.39.0](https://github.com/dendronhq/dendron/compare/v0.37.0...v0.39.0) (2021-04-26)

### Bug Fixes

- notes added outside of Dendron get initialized with correct metadata ([5390f2f](https://github.com/dendronhq/dendron/commit/5390f2f893d02a89fe905784a82bba4590c894e7))

### Features Dendron

- initialize notes from cache ([a0a2a1e](https://github.com/dendronhq/dendron/commit/a0a2a1eaeeeee45248ee3cadcda1b033df88d695))
- insert note command ([70065f8](https://github.com/dendronhq/dendron/commit/70065f859db745c725b252c34b452c9d16cf13a4))

## [0.38.6-alpha.0](https://github.com/dendronhq/dendron/compare/v0.37.0...v0.38.6-alpha.0) (2021-04-26)

### Bug Fixes

- notes added outside of Dendron get initialized with correct metadata ([5390f2f](https://github.com/dendronhq/dendron/commit/5390f2f893d02a89fe905784a82bba4590c894e7))

### Features Dendron

- insert note command ([70065f8](https://github.com/dendronhq/dendron/commit/70065f859db745c725b252c34b452c9d16cf13a4))

## [0.38.5-alpha.0](https://github.com/dendronhq/dendron/compare/v0.37.0...v0.38.5-alpha.0) (2021-04-26)

### Bug Fixes

- notes added outside of Dendron get initialized with correct metadata ([5390f2f](https://github.com/dendronhq/dendron/commit/5390f2f893d02a89fe905784a82bba4590c894e7))

### Features Dendron

- insert note command ([70065f8](https://github.com/dendronhq/dendron/commit/70065f859db745c725b252c34b452c9d16cf13a4))

## [0.38.4-alpha.0](https://github.com/dendronhq/dendron/compare/v0.37.0...v0.38.4-alpha.0) (2021-04-26)

### Bug Fixes

- notes added outside of Dendron get initialized with correct metadata ([5390f2f](https://github.com/dendronhq/dendron/commit/5390f2f893d02a89fe905784a82bba4590c894e7))

### Features Dendron

- insert note command ([70065f8](https://github.com/dendronhq/dendron/commit/70065f859db745c725b252c34b452c9d16cf13a4))

## [0.38.3-alpha.0](https://github.com/dendronhq/dendron/compare/v0.37.0...v0.38.3-alpha.0) (2021-04-25)

### Bug Fixes

- notes added outside of Dendron get initialized with correct metadata ([5390f2f](https://github.com/dendronhq/dendron/commit/5390f2f893d02a89fe905784a82bba4590c894e7))

### Features Dendron

- insert note command ([70065f8](https://github.com/dendronhq/dendron/commit/70065f859db745c725b252c34b452c9d16cf13a4))

## [0.38.2-alpha.0](https://github.com/dendronhq/dendron/compare/v0.37.0...v0.38.2-alpha.0) (2021-04-25)

### Bug Fixes

- notes added outside of Dendron get initialized with correct metadata ([5390f2f](https://github.com/dendronhq/dendron/commit/5390f2f893d02a89fe905784a82bba4590c894e7))

### Features Dendron

- insert note command ([70065f8](https://github.com/dendronhq/dendron/commit/70065f859db745c725b252c34b452c9d16cf13a4))

## [0.38.1-alpha.0](https://github.com/dendronhq/dendron/compare/v0.37.0...v0.38.1-alpha.0) (2021-04-23)

### Bug Fixes

- notes added outside of Dendron get initialized with correct metadata ([5390f2f](https://github.com/dendronhq/dendron/commit/5390f2f893d02a89fe905784a82bba4590c894e7))

### Features Dendron

- insert note command ([70065f8](https://github.com/dendronhq/dendron/commit/70065f859db745c725b252c34b452c9d16cf13a4))

# [0.38.0](https://github.com/dendronhq/dendron/compare/v0.37.0...v0.38.0) (2021-04-19)

### Bug Fixes

- notes added outside of Dendron get initialized with correct metadata ([5390f2f](https://github.com/dendronhq/dendron/commit/5390f2f893d02a89fe905784a82bba4590c894e7))

### Features Dendron

- insert note command ([70065f8](https://github.com/dendronhq/dendron/commit/70065f859db745c725b252c34b452c9d16cf13a4))

# [0.37.0](https://github.com/dendronhq/dendron/compare/v0.28.7-alpha.3...v0.37.0) (2021-04-12)

### Bug Fixes

- bad document link provider ([3de7979](https://github.com/dendronhq/dendron/commit/3de797907a76cb320a853634de5085c0f190cfcc))
- display hiearchies for stub nodes ([db02dcc](https://github.com/dendronhq/dendron/commit/db02dccc18e60bdcf8fa0015bbdcddbd6ceefa0f))
- handle links to home page for backlinks ([5d6303b](https://github.com/dendronhq/dendron/commit/5d6303b0155617b940ba489ee7e20f5aa28d42cf))
- issue with mixed case files ([9b72299](https://github.com/dendronhq/dendron/commit/9b7229930b9efe4c68c6bc1f71bce6a03a6d568e))
- more forgiving link parser ([38c973c](https://github.com/dendronhq/dendron/commit/38c973cb2bfc45881778e86c985156da64450249))
- support toggling prettyRef on preview ([62cd98a](https://github.com/dendronhq/dendron/commit/62cd98af09761ff9a639069b3a9848dae209cc62))
- typo in config option ([2be82e8](https://github.com/dendronhq/dendron/commit/2be82e8116e2bf5698abb7660795044ffa3f405d))
- update changelog generation ([58b1a43](https://github.com/dendronhq/dendron/commit/58b1a43630ae26f677f18ac51534f5760f80aec4))

### Features Dendron

- enable nunjucks optionally ([7e97758](https://github.com/dendronhq/dendron/commit/7e97758a4f60824e0a6f132f0f232adc0d20b9f8))
- move child notes generation into remark ([c4b12cf](https://github.com/dendronhq/dendron/commit/c4b12cf91ea48d662b30713033b2b70e10094131))
- variable sub v2 ([d851f7a](https://github.com/dendronhq/dendron/commit/d851f7aacd7bb051d5539175296fb6ada9da72be))
- xvault links for wikilink ([d72b4a0](https://github.com/dendronhq/dendron/commit/d72b4a05d7182bef5ec508192d8f2180ac558937))

### Reverts

- Revert "integ: publish minor" ([38ff5dd](https://github.com/dendronhq/dendron/commit/38ff5dd049cecd939fbd70744ef76a704aec3400))

## [0.36.5-alpha.0](https://github.com/dendronhq/dendron/compare/v0.28.7-alpha.3...v0.36.5-alpha.0) (2021-04-12)

### Bug Fixes

- bad document link provider ([3de7979](https://github.com/dendronhq/dendron/commit/3de797907a76cb320a853634de5085c0f190cfcc))
- display hiearchies for stub nodes ([db02dcc](https://github.com/dendronhq/dendron/commit/db02dccc18e60bdcf8fa0015bbdcddbd6ceefa0f))
- handle links to home page for backlinks ([5d6303b](https://github.com/dendronhq/dendron/commit/5d6303b0155617b940ba489ee7e20f5aa28d42cf))
- issue with mixed case files ([9b72299](https://github.com/dendronhq/dendron/commit/9b7229930b9efe4c68c6bc1f71bce6a03a6d568e))
- more forgiving link parser ([38c973c](https://github.com/dendronhq/dendron/commit/38c973cb2bfc45881778e86c985156da64450249))
- support toggling prettyRef on preview ([62cd98a](https://github.com/dendronhq/dendron/commit/62cd98af09761ff9a639069b3a9848dae209cc62))
- typo in config option ([2be82e8](https://github.com/dendronhq/dendron/commit/2be82e8116e2bf5698abb7660795044ffa3f405d))
- update changelog generation ([58b1a43](https://github.com/dendronhq/dendron/commit/58b1a43630ae26f677f18ac51534f5760f80aec4))

### Features Dendron

- enable nunjucks optionally ([7e97758](https://github.com/dendronhq/dendron/commit/7e97758a4f60824e0a6f132f0f232adc0d20b9f8))
- move child notes generation into remark ([c4b12cf](https://github.com/dendronhq/dendron/commit/c4b12cf91ea48d662b30713033b2b70e10094131))
- variable sub v2 ([d851f7a](https://github.com/dendronhq/dendron/commit/d851f7aacd7bb051d5539175296fb6ada9da72be))
- xvault links for wikilink ([d72b4a0](https://github.com/dendronhq/dendron/commit/d72b4a05d7182bef5ec508192d8f2180ac558937))

### Reverts

- Revert "integ: publish minor" ([38ff5dd](https://github.com/dendronhq/dendron/commit/38ff5dd049cecd939fbd70744ef76a704aec3400))

## [0.35.3](https://github.com/dendronhq/dendron/compare/@dendronhq/common-all@0.35.1...@dendronhq/common-all@0.35.3) (2021-04-09)

### Bug Fixes

- bad document link provider ([3de7979](https://github.com/dendronhq/dendron/commit/3de797907a76cb320a853634de5085c0f190cfcc))

## [0.35.2](https://github.com/dendronhq/dendron/compare/@dendronhq/common-all@0.35.1...@dendronhq/common-all@0.35.2) (2021-04-06)

### Bug Fixes

- bad document link provider ([3de7979](https://github.com/dendronhq/dendron/commit/3de797907a76cb320a853634de5085c0f190cfcc))

## [0.35.1](https://github.com/dendronhq/dendron/compare/@dendronhq/common-all@0.35.0...@dendronhq/common-all@0.35.1) (2021-04-05)

**Note:** Version bump only for package @dendronhq/common-all

# [0.35.0](https://github.com/dendronhq/dendron/compare/@dendronhq/common-all@0.34.0...@dendronhq/common-all@0.35.0) (2021-04-05)

**Note:** Version bump only for package @dendronhq/common-all

## [0.34.3-alpha.0](https://github.com/dendronhq/dendron/compare/@dendronhq/common-all@0.34.0...@dendronhq/common-all@0.34.3-alpha.0) (2021-04-02)

**Note:** Version bump only for package @dendronhq/common-all

## [0.34.2](https://github.com/dendronhq/dendron/compare/@dendronhq/common-all@0.34.0...@dendronhq/common-all@0.34.2) (2021-04-02)

**Note:** Version bump only for package @dendronhq/common-all

## [0.34.2-alpha.0](https://github.com/dendronhq/dendron/compare/@dendronhq/common-all@0.34.0...@dendronhq/common-all@0.34.2-alpha.0) (2021-03-31)

**Note:** Version bump only for package @dendronhq/common-all

## [0.34.1-alpha.0](https://github.com/dendronhq/dendron/compare/@dendronhq/common-all@0.34.0...@dendronhq/common-all@0.34.1-alpha.0) (2021-03-31)

**Note:** Version bump only for package @dendronhq/common-all

# [0.34.0](https://github.com/dendronhq/dendron/compare/@dendronhq/common-all@0.33.0...@dendronhq/common-all@0.34.0) (2021-03-29)

### Bug Fixes

- typo in config option ([2be82e8](https://github.com/dendronhq/dendron/commit/2be82e8116e2bf5698abb7660795044ffa3f405d))

## [0.33.2-alpha.0](https://github.com/dendronhq/dendron/compare/@dendronhq/common-all@0.33.0...@dendronhq/common-all@0.33.2-alpha.0) (2021-03-28)

### Bug Fixes

- typo in config option ([2be82e8](https://github.com/dendronhq/dendron/commit/2be82e8116e2bf5698abb7660795044ffa3f405d))

## [0.33.1-alpha.0](https://github.com/dendronhq/dendron/compare/@dendronhq/common-all@0.33.0...@dendronhq/common-all@0.33.1-alpha.0) (2021-03-28)

### Bug Fixes

- typo in config option ([2be82e8](https://github.com/dendronhq/dendron/commit/2be82e8116e2bf5698abb7660795044ffa3f405d))

# [0.33.0](https://github.com/dendronhq/dendron/compare/@dendronhq/common-all@0.32.2...@dendronhq/common-all@0.33.0) (2021-03-22)

### Bug Fixes

- display hiearchies for stub nodes ([db02dcc](https://github.com/dendronhq/dendron/commit/db02dccc18e60bdcf8fa0015bbdcddbd6ceefa0f))
- more forgiving link parser ([38c973c](https://github.com/dendronhq/dendron/commit/38c973cb2bfc45881778e86c985156da64450249))

## [0.32.7-alpha.0](https://github.com/dendronhq/dendron/compare/@dendronhq/common-all@0.32.2...@dendronhq/common-all@0.32.7-alpha.0) (2021-03-22)

### Bug Fixes

- display hiearchies for stub nodes ([db02dcc](https://github.com/dendronhq/dendron/commit/db02dccc18e60bdcf8fa0015bbdcddbd6ceefa0f))
- more forgiving link parser ([38c973c](https://github.com/dendronhq/dendron/commit/38c973cb2bfc45881778e86c985156da64450249))

## [0.32.6-alpha.0](https://github.com/dendronhq/dendron/compare/@dendronhq/common-all@0.32.2...@dendronhq/common-all@0.32.6-alpha.0) (2021-03-21)

### Bug Fixes

- display hiearchies for stub nodes ([db02dcc](https://github.com/dendronhq/dendron/commit/db02dccc18e60bdcf8fa0015bbdcddbd6ceefa0f))
- more forgiving link parser ([38c973c](https://github.com/dendronhq/dendron/commit/38c973cb2bfc45881778e86c985156da64450249))

## [0.32.5-alpha.0](https://github.com/dendronhq/dendron/compare/@dendronhq/common-all@0.32.2...@dendronhq/common-all@0.32.5-alpha.0) (2021-03-19)

### Bug Fixes

- display hiearchies for stub nodes ([db02dcc](https://github.com/dendronhq/dendron/commit/db02dccc18e60bdcf8fa0015bbdcddbd6ceefa0f))
- more forgiving link parser ([38c973c](https://github.com/dendronhq/dendron/commit/38c973cb2bfc45881778e86c985156da64450249))

## [0.32.4-alpha.0](https://github.com/dendronhq/dendron/compare/@dendronhq/common-all@0.32.2...@dendronhq/common-all@0.32.4-alpha.0) (2021-03-19)

### Bug Fixes

- display hiearchies for stub nodes ([db02dcc](https://github.com/dendronhq/dendron/commit/db02dccc18e60bdcf8fa0015bbdcddbd6ceefa0f))
- more forgiving link parser ([38c973c](https://github.com/dendronhq/dendron/commit/38c973cb2bfc45881778e86c985156da64450249))

## [0.32.3](https://github.com/dendronhq/dendron/compare/@dendronhq/common-all@0.32.2...@dendronhq/common-all@0.32.3) (2021-03-17)

### Bug Fixes

- display hiearchies for stub nodes ([db02dcc](https://github.com/dendronhq/dendron/commit/db02dccc18e60bdcf8fa0015bbdcddbd6ceefa0f))
- more forgiving link parser ([38c973c](https://github.com/dendronhq/dendron/commit/38c973cb2bfc45881778e86c985156da64450249))

## [0.32.2](https://github.com/dendronhq/dendron/compare/@dendronhq/common-all@0.32.0...@dendronhq/common-all@0.32.2) (2021-03-13)

**Note:** Version bump only for package @dendronhq/common-all

## [0.32.1](https://github.com/dendronhq/dendron/compare/@dendronhq/common-all@0.32.0...@dendronhq/common-all@0.32.1) (2021-03-13)

**Note:** Version bump only for package @dendronhq/common-all

# [0.32.0](https://github.com/dendronhq/dendron/compare/@dendronhq/common-all@0.31.2...@dendronhq/common-all@0.32.0) (2021-03-08)

### Bug Fixes

- update changelog generation ([58b1a43](https://github.com/dendronhq/dendron/commit/58b1a43630ae26f677f18ac51534f5760f80aec4))

## [0.31.2](https://github.com/dendronhq/dendron/compare/@dendronhq/common-all@0.31.1...@dendronhq/common-all@0.31.2) (2021-03-07)

**Note:** Version bump only for package @dendronhq/common-all

## [0.31.2-alpha.0](https://github.com/dendronhq/dendron/compare/@dendronhq/common-all@0.31.1...@dendronhq/common-all@0.31.2-alpha.0) (2021-03-05)

**Note:** Version bump only for package @dendronhq/common-all

## [0.31.1](https://github.com/dendronhq/dendron/compare/@dendronhq/common-all@0.31.0...@dendronhq/common-all@0.31.1) (2021-03-02)

### Bug Fixes

- issue with mixed case files ([9b72299](https://github.com/dendronhq/dendron/commit/9b7229930b9efe4c68c6bc1f71bce6a03a6d568e))

# [0.31.0](https://github.com/dendronhq/dendron/compare/@dendronhq/common-all@0.30.1...@dendronhq/common-all@0.31.0) (2021-03-01)

### Bug Fixes

- handle links to home page for backlinks ([5d6303b](https://github.com/dendronhq/dendron/commit/5d6303b0155617b940ba489ee7e20f5aa28d42cf))

### Features Dendron

- move child notes generation into remark ([c4b12cf](https://github.com/dendronhq/dendron/commit/c4b12cf91ea48d662b30713033b2b70e10094131))

### Reverts

- Revert "integ: publish minor" ([38ff5dd](https://github.com/dendronhq/dendron/commit/38ff5dd049cecd939fbd70744ef76a704aec3400))

## [0.30.2-alpha.0](https://github.com/dendronhq/dendron/compare/@dendronhq/common-all@0.30.1...@dendronhq/common-all@0.30.2-alpha.0) (2021-02-28)

**Note:** Version bump only for package @dendronhq/common-all

## [0.30.1](https://github.com/dendronhq/dendron/compare/@dendronhq/common-all@0.29.0...@dendronhq/common-all@0.30.1) (2021-02-26)

### Bug Fixes

- support toggling prettyRef on preview ([62cd98a](https://github.com/dendronhq/dendron/commit/62cd98af09761ff9a639069b3a9848dae209cc62))

### Features Dendron

- enable nunjucks optionally ([7e97758](https://github.com/dendronhq/dendron/commit/7e97758a4f60824e0a6f132f0f232adc0d20b9f8))
- variable sub v2 ([d851f7a](https://github.com/dendronhq/dendron/commit/d851f7aacd7bb051d5539175296fb6ada9da72be))
- xvault links for wikilink ([d72b4a0](https://github.com/dendronhq/dendron/commit/d72b4a05d7182bef5ec508192d8f2180ac558937))

## [0.30.1-alpha.0](https://github.com/dendronhq/dendron/compare/@dendronhq/common-all@0.29.0...@dendronhq/common-all@0.30.1-alpha.0) (2021-02-25)

### Bug Fixes

- support toggling prettyRef on preview ([62cd98a](https://github.com/dendronhq/dendron/commit/62cd98af09761ff9a639069b3a9848dae209cc62))

### Features Dendron

- enable nunjucks optionally ([7e97758](https://github.com/dendronhq/dendron/commit/7e97758a4f60824e0a6f132f0f232adc0d20b9f8))
- variable sub v2 ([d851f7a](https://github.com/dendronhq/dendron/commit/d851f7aacd7bb051d5539175296fb6ada9da72be))

# [0.30.0](https://github.com/dendronhq/dendron/compare/@dendronhq/common-all@0.29.0...@dendronhq/common-all@0.30.0) (2021-02-23)

### Bug Fixes

- support toggling prettyRef on preview ([62cd98a](https://github.com/dendronhq/dendron/commit/62cd98af09761ff9a639069b3a9848dae209cc62))

### Features Dendron

- enable nunjucks optionally ([7e97758](https://github.com/dendronhq/dendron/commit/7e97758a4f60824e0a6f132f0f232adc0d20b9f8))
- variable sub v2 ([d851f7a](https://github.com/dendronhq/dendron/commit/d851f7aacd7bb051d5539175296fb6ada9da72be))

## [0.29.1](https://github.com/dendronhq/dendron/compare/@dendronhq/common-all@0.29.0...@dendronhq/common-all@0.29.1) (2021-02-21)

**Note:** Version bump only for package @dendronhq/common-all

## [0.29.1-alpha.0](https://github.com/dendronhq/dendron/compare/@dendronhq/common-all@0.29.0...@dendronhq/common-all@0.29.1-alpha.0) (2021-02-16)

**Note:** Version bump only for package @dendronhq/common-all

# [0.29.0](https://github.com/dendronhq/dendron/compare/@dendronhq/common-all@0.28.7-alpha.9...@dendronhq/common-all@0.29.0) (2021-02-16)

**Note:** Version bump only for package @dendronhq/common-all

## 0.28.7-alpha.9 (2021-02-15)

## 0.28.7-alpha.1 (2021-02-14)

## 0.28.7-alpha.0 (2021-02-14)

## 0.28.6 (2021-02-14)

### Bug Fixes

- move command error when parent is stub ([d2d6fc8](https://github.com/dendronhq/dendron/commit/d2d6fc8681c06adde03f222ba209f4916ba544a1))

## 0.28.2 (2021-02-08)

## 0.28.1 (2021-02-02)

## 0.28.1-alpha.0 (2021-02-02)

### Reverts

- Revert "chore(release): publish" ([3b2778a](https://github.com/dendronhq/dendron/commit/3b2778a5b1ccc3c53652dcd02e6d42c38f925d2e))

# 0.29.0 (2021-02-02)

# 0.28.0 (2021-02-02)

### Bug Fixes

- aliased vault names would appear with wrong name ([873627e](https://github.com/dendronhq/dendron/commit/873627eabff6ea12631dbec29e16aab00ebd3b71))

## 0.27.1-alpha.0 (2021-02-01)

## 0.26.2 (2021-02-01)

## 0.26.2-alpha.1 (2021-02-01)

### Bug Fixes

- daily journal note nice titles ([6cc036e](https://github.com/dendronhq/dendron/commit/6cc036edceeba6f3a4c985c7584aa492d36d24ba))

## 0.26.2-alpha.0 (2021-01-27)

### Features Dendron

- move note command ([696eb9c](https://github.com/dendronhq/dendron/commit/696eb9c90374a0115835a100a9f580498188eae7))

# 0.26.0 (2021-01-25)

## 0.25.4 (2021-01-25)

## 0.25.4-alpha.0 (2021-01-25)

## 0.25.3 (2021-01-22)

## 0.25.3-alpha.1 (2021-01-22)

### Features Dendron

- support mermaid for publishing ([0313df4](https://github.com/dendronhq/dendron/commit/0313df49ed563d22fc07018c982368965f9d1938))

## 0.25.2 (2021-01-19)

# 0.25.0 (2021-01-18)

## 0.24.2-alpha.1 (2021-01-17)

## 0.24.1 (2021-01-15)

## 0.24.1-alpha.2 (2021-01-14)

## 0.24.1-alpha.1 (2021-01-12)

## 0.24.1-alpha.0 (2021-01-12)

# 0.24.0 (2021-01-11)

## 0.23.2-alpha.3 (2021-01-10)

## 0.23.2-alpha.2 (2021-01-09)

## 0.23.2-alpha.1 (2021-01-09)

### Bug Fixes

- don't throw error if user doesn't choose vault ([c744bc1](https://github.com/dendronhq/dendron/commit/c744bc11429c309a3d045f14039f1548bfa53478))

## 0.23.1 (2021-01-08)

## 0.23.1-alpha.3 (2021-01-06)

# 0.23.0 (2021-01-04)

## 0.22.2-alpha.1 (2021-01-03)

## 0.22.2-alpha.0 (2021-01-02)

## 0.22.1 (2020-12-31)

## 0.22.1-alpha.2 (2020-12-30)

## 0.22.1-alpha.0 (2020-12-29)

# 0.22.0 (2020-12-28)

## 0.21.1-alpha.9 (2020-12-27)

## 0.21.1-alpha.8 (2020-12-27)

## 0.21.1-alpha.5 (2020-12-26)

## 0.21.1-alpha.2 (2020-12-24)

## 0.21.1-alpha.1 (2020-12-23)

# 0.21.0 (2020-12-21)

## 0.20.1-alpha.13 (2020-12-21)

## 0.20.1-alpha.12 (2020-12-21)

## 0.20.1-alpha.11 (2020-12-20)

## 0.20.1-alpha.6 (2020-12-19)

## 0.20.1-alpha.5 (2020-12-19)

## 0.20.1-alpha.0 (2020-12-17)

# 0.20.0 (2020-12-14)

## 0.19.3-alpha.2 (2020-12-14)

### Bug Fixes

- vault not being matched ([fda8d72](https://github.com/dendronhq/dendron/commit/fda8d724f4146cdadd90f2bb44c9a37a8a4d1ecd))

## 0.19.3-alpha.1 (2020-12-13)

## 0.19.2 (2020-12-10)

## 0.19.2-alpha.2 (2020-12-10)

## 0.19.2-alpha.1 (2020-12-10)

## 0.19.2-alpha.0 (2020-12-09)

# 0.19.0 (2020-12-07)

## 0.18.2-alpha.8 (2020-12-07)

### Bug Fixes

- tree view adding new nodes in wrong place ([173f57b](https://github.com/dendronhq/dendron/commit/173f57bfb2730da2361950df35054a53f0aba765))

## 0.18.2-alpha.7 (2020-12-07)

### Bug Fixes

- issue with local vault command ([fb202e9](https://github.com/dendronhq/dendron/commit/fb202e91e501cfd5506fd73c9a005807954e48d3))

## 0.18.2-alpha.2 (2020-12-05)

## 0.18.2-alpha.0 (2020-12-04)

## 0.18.1 (2020-12-04)

## 0.18.1-alpha.4 (2020-12-04)

## 0.18.1-alpha.3 (2020-12-03)

## 0.18.1-alpha.2 (2020-12-03)

### Bug Fixes

- ignore files added by engine ([f76b0ba](https://github.com/dendronhq/dendron/commit/f76b0bacf77186f1023aadb68a0f9e0cdfe74364))

## 0.18.1-alpha.1 (2020-12-03)

### Features Dendron

- support adding remote vaults ([d7501b9](https://github.com/dendronhq/dendron/commit/d7501b9a5cb116faae64d26798cfd7ccfc73a4b0))

# 0.18.0 (2020-11-29)

## 0.17.2 (2020-11-29)

## 0.17.2-alpha.5 (2020-11-29)

## 0.17.2-alpha.1 (2020-11-29)

### Features Dendron

- add config apis ([f022689](https://github.com/dendronhq/dendron/commit/f0226890ff01c4e5c1746d0cee7b9e99db07d4d6))

## 0.17.2-alpha.0 (2020-11-28)

## 0.17.1-alpha.0 (2020-11-25)

### Bug Fixes

- issues with rename in multi-vault ([e26b294](https://github.com/dendronhq/dendron/commit/e26b294e8bbe1e49e44318152c247595e82639bb))
- renaming notes with links within root note ([cb74117](https://github.com/dendronhq/dendron/commit/cb74117ae3fd3d1658e94966a4050c15cf491885))

# 0.17.0 (2020-11-22)

## 0.16.3-alpha.5 (2020-11-22)

## 0.16.3-alpha.4 (2020-11-22)

## 0.16.3-alpha.3 (2020-11-20)

### Bug Fixes

- add note to correct parent when writing in multi-vault ([6daeebc](https://github.com/dendronhq/dendron/commit/6daeebc7bd2bbc68fc105766d30bc10444bcaf61))

## 0.16.3-alpha.2 (2020-11-18)

## 0.16.3-alpha.1 (2020-11-18)

## 0.16.2 (2020-11-18)

## 0.16.1 (2020-11-18)

## 0.16.1-alpha.2 (2020-11-18)

### Bug Fixes

- **engine:** resolve ntoes with same title in multiple vaults ([6326aff](https://github.com/dendronhq/dendron/commit/6326aff28b5f2ff52edf6d190c068364023be8e9))

### Features Dendron

- add completion provider ([9c5ab61](https://github.com/dendronhq/dendron/commit/9c5ab61213a046b7719472faca9bb5e79592fa2f))
- **workbench:** navigate to relative wiki-links ([49c3b54](https://github.com/dendronhq/dendron/commit/49c3b5439fb34b8c6f1f5505fcd90193cbfa28cd))
- add language features ([9c379c1](https://github.com/dendronhq/dendron/commit/9c379c1fb7beda476a8454538a318f43072ad1f0))

# 0.16.0 (2020-11-15)

## 0.15.3-alpha.1 (2020-11-15)

## 0.15.1 (2020-11-14)

## 0.15.1-alpha.5 (2020-11-13)

### Features Dendron

- **workspace:** vault add command ([f2bba25](https://github.com/dendronhq/dendron/commit/f2bba254b4923c97fec6b5830bff3779c533447f))

## 0.15.1-alpha.4 (2020-11-13)

## 0.15.1-alpha.3 (2020-11-12)

## 0.15.1-alpha.2 (2020-11-12)

## 0.15.1-alpha.1 (2020-11-11)

## 0.15.1-alpha.0 (2020-11-10)

# 0.15.0 (2020-11-09)

## 0.14.2-alpha.7 (2020-11-09)

## 0.14.2-alpha.5 (2020-11-08)

## 0.14.2-alpha.0 (2020-11-07)

### Bug Fixes

- **engine:** properly handle \* in refs when refactoring ([704a14f](https://github.com/dendronhq/dendron/commit/704a14f17196e18cb5b26f5fc98ed9f8d492e16a))

### Features Dendron

- **markdown:** wildcard links in note refs ([b8dea8f](https://github.com/dendronhq/dendron/commit/b8dea8f4441cfc01f5acc522ffa3a6402ff50572))

## 0.14.1 (2020-11-05)

## 0.14.1-alpha.6 (2020-11-05)

### Features Dendron

- **lookup:** copy note link cmd ([e38743d](https://github.com/dendronhq/dendron/commit/e38743ddbac8486f2ac778bd546a6373a15a4f6d))

## 0.14.1-alpha.3 (2020-11-04)

## 0.14.1-alpha.0 (2020-11-03)

# 0.14.0 (2020-11-01)

## 0.13.6-alpha.0 (2020-10-31)

## 0.13.5 (2020-10-28)

### Bug Fixes

- **workbench:** tree view can delete notes with caps ([d37926d](https://github.com/dendronhq/dendron/commit/d37926d7f38d784f847a4c2a58fb75ba7c03b0e0))

## 0.13.4 (2020-10-28)

## 0.13.4-alpha.0 (2020-10-27)

## 0.13.3 (2020-10-24)

## 0.13.3-alpha.1 (2020-10-24)

### Bug Fixes

- **notes:** refactor will miss links in newly created notes ([c8a5dde](https://github.com/dendronhq/dendron/commit/c8a5dde2ca46e2402bc50b1a8f635d9fb5318c9d))

## 0.13.3-alpha.0 (2020-10-23)

### Features Dendron

- **lookup:** support direct child lookup ([1cae082](https://github.com/dendronhq/dendron/commit/1cae08294baa844c0c0ee3c8d390e337bd6172be))

## 0.13.2 (2020-10-22)

## 0.13.2-alpha.2 (2020-10-22)

## 0.13.2-alpha.0 (2020-10-21)

## 0.13.1 (2020-10-21)

## 0.13.1-alpha.2 (2020-10-20)

### Bug Fixes

- **schemas:** show namespace schema suggestions ([30737c0](https://github.com/dendronhq/dendron/commit/30737c070cfcf6b5a7f9c2cc1f75a8760019614b))

## 0.13.1-alpha.1 (2020-10-20)

### Features Dendron

- **publishing:** allow custom frontmatter ([782d637](https://github.com/dendronhq/dendron/commit/782d6374c55b00bcda36da9149fb2cedeac0c3d9))

## 0.13.1-alpha.0 (2020-10-20)

### Bug Fixes

- **lookup:** schema suggestions on namespace ([56ee6c4](https://github.com/dendronhq/dendron/commit/56ee6c460dd562200931381923e72971681d1390))

# 0.13.0 (2020-10-19)

## 0.12.12-alpha.0 (2020-10-19)

### Bug Fixes

- **lookup:** display schema id if title undefined ([6c7cc70](https://github.com/dendronhq/dendron/commit/6c7cc70cf85181b11654074e17672e39a44fb874))

## 0.12.11 (2020-10-18)

## 0.12.11-alpha.2 (2020-10-18)

## 0.12.11-alpha.1 (2020-10-17)

## 0.12.10 (2020-10-16)

## 0.12.10-alpha.2 (2020-10-16)

## 0.12.10-alpha.0 (2020-10-16)

## 0.12.9 (2020-10-15)

## 0.12.9-alpha.0 (2020-10-14)

### Bug Fixes

- **server:** issue with goup navigation ([f3722dd](https://github.com/dendronhq/dendron/commit/f3722dd199d7aa4800f88ab5e8388a2a70b611cf))

## 0.12.8 (2020-10-14)

## 0.12.8-alpha.2 (2020-10-14)

## 0.12.8-alpha.0 (2020-10-13)

## 0.12.7 (2020-10-13)

## 0.12.7-alpha.8 (2020-10-12)

### Bug Fixes

- **server:** issue with deleteing schemas ([2aab629](https://github.com/dendronhq/dendron/commit/2aab62961c4c2a6a073104034fc3961ed6cad2a5))

## 0.12.7-alpha.7 (2020-10-12)

## 0.12.7-alpha.5 (2020-10-12)

## 0.12.7-alpha.4 (2020-10-12)

## 0.12.7-alpha.3 (2020-10-11)

## 0.12.7-alpha.0 (2020-10-11)

## 0.12.5 (2020-10-07)

## 0.12.5-alpha.7 (2020-10-07)

## 0.12.5-alpha.6 (2020-10-07)

## 0.12.5-alpha.5 (2020-10-06)

### Bug Fixes

- **lookup:** schemas in lookup ([b4055fd](https://github.com/dendronhq/dendron/commit/b4055fd61d4918cf4c1a44591be31be69a71b93a))

## 0.12.5-alpha.2 (2020-10-05)

## 0.12.5-alpha.1 (2020-10-04)

## 0.12.5-alpha.0 (2020-10-04)

### Bug Fixes

- **server:** schema names ([c457f96](https://github.com/dendronhq/dendron/commit/c457f96cc02accd2811a73e15025f68d6796256d))

## 0.12.4 (2020-09-30)

## 0.12.4-alpha.5 (2020-09-30)

## 0.12.4-alpha.2 (2020-09-30)

## 0.12.4-alpha.0 (2020-09-29)

## 0.12.3 (2020-09-26)

## 0.12.3-alpha.16 (2020-09-25)

## 0.12.3-alpha.11 (2020-09-25)

## 0.12.3-alpha.10 (2020-09-25)

## 0.12.3-alpha.0 (2020-09-24)

## 0.12.2 (2020-09-24)

## 0.12.2-alpha.0 (2020-09-24)

### Bug Fixes

- **publishing:** incremental builds not setting correct links ([e3dedf5](https://github.com/dendronhq/dendron/commit/e3dedf52d79dede98041edc77a41966cc5d6e8b5))

# 0.12.0 (2020-09-20)

## 0.11.5 (2020-09-19)

## 0.11.5-alpha.1 (2020-09-19)

## 0.11.3 (2020-09-17)

## 0.11.3-alpha.3 (2020-09-16)

## 0.11.3-alpha.2 (2020-09-16)

## 0.11.3-alpha.1 (2020-09-16)

# 0.11.0 (2020-09-13)

## 0.10.7 (2020-09-13)

## 0.10.7-alpha.0 (2020-09-12)

## 0.10.6 (2020-09-12)

## 0.10.6-alpha.0 (2020-09-11)

## 0.10.4 (2020-09-10)

## 0.10.4-alpha.0 (2020-09-10)

### Features Dendron

- **cli:** add export pod to cli ([3fbf011](https://github.com/dendronhq/dendron/commit/3fbf01139bfd4f9078906efe9e2e3c6e3f298f08))

## 0.10.3 (2020-09-09)

## 0.10.3-alpha.2 (2020-09-08)

# 0.10.0 (2020-09-07)

## 0.9.5 (2020-09-04)

## 0.9.5-alpha.0 (2020-09-03)

### Bug Fixes

- **engine:** trouble with mixed case file names ([02bcde2](https://github.com/dendronhq/dendron/commit/02bcde2d7f8e9c6bef9753e18fffd9e15c763976))

## 0.9.1 (2020-09-01)

## 0.9.1-alpha.0 (2020-09-01)

### Bug Fixes

- **workbench:** rename note will update tree view correctly ([c98de12](https://github.com/dendronhq/dendron/commit/c98de121406590015bbb395eaa05fbbc83c50ff9))

# 0.9.0 (2020-08-30)

## 0.8.13 (2020-08-29)

## 0.8.13-alpha.1 (2020-08-28)

## 0.8.11 (2020-08-28)

## 0.8.11-alpha.0 (2020-08-27)

### Features Dendron

- **workspace:** add dendron tree view ([73b0b82](https://github.com/dendronhq/dendron/commit/73b0b825586eca81360d92dd5e7f00239149b41e))

## 0.8.6 (2020-08-26)

### Features Dendron

- **workspace:** lookup is MUCH FASTER!!! ([38a3661](https://github.com/dendronhq/dendron/commit/38a366146ef7ce1b47fe06a4be46f7c0e5b41144))

## 0.8.2 (2020-08-25)

### Features Dendron

- **hierarchies:** Add Go Up Hierarchy command ([7b225b9](https://github.com/dendronhq/dendron/commit/7b225b94d2e2ac1d13e0d21f7b8b5bc6604508a9))

# 0.8.0 (2020-08-24)

## 0.7.14 (2020-08-24)

## 0.7.12 (2020-08-23)

### Bug Fixes

- **schema:** autocomplete with imported schemas ([5b6a347](https://github.com/dendronhq/dendron/commit/5b6a3472d2ee895bd64ac365d6ab6f49cb768a4f))

### Features Dendron

- **schemas:** support match by pattern ([ba4f687](https://github.com/dendronhq/dendron/commit/ba4f687f5f837ce244e7f58f2746f06372d85a99))
- **schemas:** support schema import ([7a38f1c](https://github.com/dendronhq/dendron/commit/7a38f1c869f5a20bf81c77682877995dd7bfce87))

## 0.7.11 (2020-08-22)

## 0.7.11-alpha.0 (2020-08-22)

## 0.7.9 (2020-08-20)

## 0.7.9-alpha.1 (2020-08-20)

## 0.7.9-alpha.0 (2020-08-20)

## 0.7.6 (2020-08-19)

### Bug Fixes

- links not being converted to ids ([7106681](https://github.com/dendronhq/dendron/commit/7106681734804ec39990abfdfe9643ba9c006aa5))

## 0.7.6-alpha.0 (2020-08-19)

### Features Dendron

- **pods:** support per hierarchy configuration when publishing ([e68edfa](https://github.com/dendronhq/dendron/commit/e68edfa4cac21230ff77a24b65efa2031eb292dc))

## 0.7.5-alpha.0 (2020-08-19)

### Features Dendron

- **pods:** enable image prefix when building site ([ab86573](https://github.com/dendronhq/dendron/commit/ab865730b0c2da461e2b9fe6851b8784f690be8a))

## 0.7.4 (2020-08-19)

# 0.7.0 (2020-08-17)

## 0.6.10 (2020-08-16)

### Features Dendron

- **pods:** publish multiple roots ([827b2f5](https://github.com/dendronhq/dendron/commit/827b2f52c35fa650b109dc5d929554a3d5db0cf5))

## 0.6.9 (2020-08-16)

### Bug Fixes

- issue with schemas that have same ids ([3f93b31](https://github.com/dendronhq/dendron/commit/3f93b31bffdaa6092a7c03c48db46edf0d89f65a))

## 0.6.1 (2020-08-11)

### Features Dendron

- **commands:** Add Refactor Hierarchy Command ([4fcaf40](https://github.com/dendronhq/dendron/commit/4fcaf40a7fd7b98b658703e726dd8ccf6c14e4c4))

# 0.6.0 (2020-08-09)

## 0.5.15 (2020-08-09)

### Bug Fixes

- index notes created through rename ([40f8fb6](https://github.com/dendronhq/dendron/commit/40f8fb6dd6c810a5ead9de2dedaffd4b55c321e9))

### Features Dendron

- add copy note link command ([5ca2434](https://github.com/dendronhq/dendron/commit/5ca2434de3f19eaa94ef7bc876ad9b8067cdf90a))

## 0.5.10 (2020-08-06)

## 0.5.9 (2020-08-05)

### Bug Fixes

- apply schema descriptions ([e4f7238](https://github.com/dendronhq/dendron/commit/e4f723872db080a3205f305060ebae3c20cb34fb))

## 0.5.8 (2020-08-05)

### Features Dendron

- apply schema description to new notes ([c4b9f15](https://github.com/dendronhq/dendron/commit/c4b9f158daeab5d159e5f4e690ad0c4ad1e3f549))

## 0.5.4 (2020-08-04)

### Features Dendron

- update index when notes are deleted outside of dendron ([93ad260](https://github.com/dendronhq/dendron/commit/93ad26059009f55e4ff1c9a75cfe39c7cff0b376))

## 0.5.3 (2020-08-03)

## 0.5.2 (2020-08-03)

## 0.5.1 (2020-08-03)

# 0.5.0 (2020-08-02)

## 0.4.6 (2020-08-01)

### Features Dendron

- support schema templates ([0205d66](https://github.com/dendronhq/dendron/commit/0205d66fc4538361322ffeabb3e532f0d541b775))

## 0.4.5 (2020-08-01)

## 0.4.4 (2020-08-01)

### Features Dendron

- support deleting schemas ([450f00d](https://github.com/dendronhq/dendron/commit/450f00d6661d1d45dbfed7392bde179a0ab0020c))
- support deleting schemas ([7e6730a](https://github.com/dendronhq/dendron/commit/7e6730a9c3f804d7c039cf74495493839c910fed))
- use lookups to view and create schemas ([19b4677](https://github.com/dendronhq/dendron/commit/19b46770fe6a842831692563de96ff4a823df871))

## 0.4.2 (2020-07-30)

### Bug Fixes

- root should have no parent ([bab72fd](https://github.com/dendronhq/dendron/commit/bab72fd438c541673c128caf96174d43b8eaa43a))

### Features Dendron

- build pod command with github pages support ([e063732](https://github.com/dendronhq/dendron/commit/e063732d1ff082dd8520a479926e7ceb1b0893ab))
- build-site command ([8e5ca80](https://github.com/dendronhq/dendron/commit/8e5ca801237686d70f5955c461049010480837be))
- overwrite fields in backfill ([af504f4](https://github.com/dendronhq/dendron/commit/af504f44d73910e8687367bc203b613d774a039c))

# 0.4.0 (2020-07-26)

## 0.3.42 (2020-07-23)

## 0.3.40 (2020-07-23)

## 0.3.39 (2020-07-23)

## 0.3.38 (2020-07-23)

## 0.3.37 (2020-07-22)

## 0.3.30 (2020-07-21)

### Features Dendron

- custom front matter support [docs](https://github.com/dendronhq/dendron-template/blob/master/vault/pro.dendron.topic.frontmatter.md) ([dadd3fd](https://github.com/dendronhq/dendron/commit/dadd3fd16e2814e378b7af3c097b556c92981de3))

## 0.3.21 (2020-07-19)

## 0.3.19 (2020-07-18)

## 0.3.17 (2020-07-17)

### Features Dendron

- open non-markdown files using native apps. [docs](https://github.com/dendronhq/dendron-template/blob/master/vault/dendron.feature.links.md) ([7f630d1](https://github.com/dendronhq/dendron/commit/7f630d1fb95d5c0d28fc5a83f4cee27bc17d452c))

## 0.3.16 (2020-07-16)

### Features Dendron

- implement journal notes. see details here: https://github.com/dendronhq/dendron-template/blob/master/vault/dendron.feature.journals.md ([5e1236f](https://github.com/dendronhq/dendron/commit/5e1236fddbf1e0fddf4c27d1a40e9841cc99974f))

## 0.3.15 (2020-07-14)

### Bug Fixes

- schema suggestions not always showing ([658c9e3](https://github.com/dendronhq/dendron/commit/658c9e3215cccf1875138928a3c9a8486052b63a))

### Features Dendron

- show note title if differ from file name ([c0e428d](https://github.com/dendronhq/dendron/commit/c0e428d259ef116d66cbe1107d7760cbb84f8d20))

## 0.3.11 (2020-07-13)

## 0.3.10 (2020-07-13)

### Features Dendron

- auto add nodes when deleted or created outside of dendron ([8c311bd](https://github.com/dendronhq/dendron/commit/8c311bda948a1d54088c49fd70eb65d24af5d68f))
- better schema suggestions ([03656bc](https://github.com/dendronhq/dendron/commit/03656bc007810457cb6846f0d6adacab4a7fbd3a))
- match namespace schemas ([7a67b8b](https://github.com/dendronhq/dendron/commit/7a67b8b2fb7caa1b97ee6d492d2801782abecdf6))
- show node descriptions ([aca86f2](https://github.com/dendronhq/dendron/commit/aca86f2a5fd6ee481f93553693a098db0e322890))
- surface unknown schemas ([d014965](https://github.com/dendronhq/dendron/commit/d0149652c985c69a4b2607984d578902820077f1))
- updated icons for schemas ([21804eb](https://github.com/dendronhq/dendron/commit/21804eba61c8dd49e499edd5d548d9d601224e8e))

## 0.1.6 (2020-06-24)

## 0.1.5 (2020-06-24)

## 0.1.4 (2020-06-24)

## 0.1.3 (2020-06-24)

## 0.1.2 (2020-06-24)

# 0.1.0 (2020-06-24)

### Bug Fixes

- write schema properly ([4c56d2d](https://github.com/dendronhq/dendron/commit/4c56d2d326597b8563ae5ebe6b01ce587717a68f))

## [0.28.7-alpha.8](https://github.com/dendronhq/dendron/compare/v0.28.7-alpha.3...v0.28.7-alpha.8) (2021-02-15)

**Note:** Version bump only for package @dendronhq/common-all

## [0.28.7-alpha.7](https://github.com/dendronhq/dendron/compare/v0.28.7-alpha.3...v0.28.7-alpha.7) (2021-02-15)

**Note:** Version bump only for package @dendronhq/common-all

## [0.28.7-alpha.6](https://github.com/dendronhq/dendron/compare/v0.28.7-alpha.3...v0.28.7-alpha.6) (2021-02-15)

**Note:** Version bump only for package @dendronhq/common-all

## [0.28.7-alpha.5](https://github.com/dendronhq/dendron/compare/v0.28.7-alpha.3...v0.28.7-alpha.5) (2021-02-15)

**Note:** Version bump only for package @dendronhq/common-all

## [0.28.7-alpha.4](https://github.com/dendronhq/dendron/compare/v0.28.7-alpha.3...v0.28.7-alpha.4) (2021-02-15)

**Note:** Version bump only for package @dendronhq/common-all

## [0.28.7-alpha.1](https://github.com/dendronhq/dendron/compare/v0.28.7-alpha.0...v0.28.7-alpha.1) (2021-02-14)

**Note:** Version bump only for package @dendronhq/common-all

## [0.28.7-alpha.0](https://github.com/dendronhq/dendron/compare/v0.28.6...v0.28.7-alpha.0) (2021-02-14)

**Note:** Version bump only for package @dendronhq/common-all

## [0.28.6](https://github.com/dendronhq/dendron/compare/v0.28.5...v0.28.6) (2021-02-14)

### Bug Fixes

- move command error when parent is stub ([d2d6fc8](https://github.com/dendronhq/dendron/commit/d2d6fc8681c06adde03f222ba209f4916ba544a1))

# [0.29.0](https://github.com/dendronhq/dendron/compare/v0.28.5...v0.29.0) (2021-02-09)

**Note:** Version bump only for package @dendronhq/common-all

## [0.28.2](https://github.com/dendronhq/dendron/compare/v0.28.2-alpha.2...v0.28.2) (2021-02-08)

**Note:** Version bump only for package @dendronhq/common-all

## [0.28.1](https://github.com/dendronhq/dendron/compare/v0.28.1-alpha.0...v0.28.1) (2021-02-02)

**Note:** Version bump only for package @dendronhq/common-all

## [0.28.1-alpha.0](https://github.com/dendronhq/dendron/compare/v0.29.0...v0.28.1-alpha.0) (2021-02-02)

### Reverts

- Revert "chore(release): publish" ([3b2778a](https://github.com/dendronhq/dendron/commit/3b2778a5b1ccc3c53652dcd02e6d42c38f925d2e))

# [0.28.0](https://github.com/dendronhq/dendron/compare/v0.27.1-alpha.0...v0.28.0) (2021-02-02)

### Bug Fixes

- aliased vault names would appear with wrong name ([873627e](https://github.com/dendronhq/dendron/commit/873627eabff6ea12631dbec29e16aab00ebd3b71))

## [0.27.1-alpha.0](https://github.com/dendronhq/dendron/compare/v0.26.2...v0.27.1-alpha.0) (2021-02-01)

**Note:** Version bump only for package @dendronhq/common-all

# [0.27.0](https://github.com/dendronhq/dendron/compare/v0.26.2...v0.27.0) (2021-02-01)

**Note:** Version bump only for package @dendronhq/common-all

## [0.26.2](https://github.com/dendronhq/dendron/compare/v0.26.2-alpha.1...v0.26.2) (2021-02-01)

**Note:** Version bump only for package @dendronhq/common-all

## [0.26.2-alpha.1](https://github.com/dendronhq/dendron/compare/v0.26.2-alpha.0...v0.26.2-alpha.1) (2021-02-01)

### Bug Fixes

- daily journal note nice titles ([6cc036e](https://github.com/dendronhq/dendron/commit/6cc036edceeba6f3a4c985c7584aa492d36d24ba))

## [0.26.2-alpha.0](https://github.com/dendronhq/dendron/compare/v0.26.1...v0.26.2-alpha.0) (2021-01-27)

### Features

- move note command ([696eb9c](https://github.com/dendronhq/dendron/commit/696eb9c90374a0115835a100a9f580498188eae7))

# [0.26.0](https://github.com/dendronhq/dendron/compare/v0.25.4...v0.26.0) (2021-01-25)

**Note:** Version bump only for package @dendronhq/common-all

## [0.25.4](https://github.com/dendronhq/dendron/compare/v0.25.4-alpha.0...v0.25.4) (2021-01-25)

**Note:** Version bump only for package @dendronhq/common-all

## [0.25.4-alpha.0](https://github.com/dendronhq/dendron/compare/v0.25.3...v0.25.4-alpha.0) (2021-01-25)

**Note:** Version bump only for package @dendronhq/common-all

## [0.25.3](https://github.com/dendronhq/dendron/compare/v0.25.3-alpha.3...v0.25.3) (2021-01-22)

**Note:** Version bump only for package @dendronhq/common-all

## [0.25.3-alpha.1](https://github.com/dendronhq/dendron/compare/v0.25.3-alpha.0...v0.25.3-alpha.1) (2021-01-22)

### Enhancements

- copy header text if selected ([23406d6](https://github.com/dendronhq/dendron/commit/23406d6d641ccc8db5140b0e6afaeb4c38244aee))

### Features

- support mermaid for publishing ([0313df4](https://github.com/dendronhq/dendron/commit/0313df49ed563d22fc07018c982368965f9d1938))

## [0.25.2](https://github.com/dendronhq/dendron/compare/v0.25.1...v0.25.2) (2021-01-19)

### Enhancements

- use multi-vault list to handle dups ([ee50aa5](https://github.com/dendronhq/dendron/commit/ee50aa5494f005be062a9ee40b0bfbdfe5b7607e))

# [0.25.0](https://github.com/dendronhq/dendron/compare/v0.24.2-alpha.1...v0.25.0) (2021-01-18)

**Note:** Version bump only for package @dendronhq/common-all

## [0.24.2-alpha.1](https://github.com/dendronhq/dendron/compare/v0.24.2-alpha.0...v0.24.2-alpha.1) (2021-01-17)

**Note:** Version bump only for package @dendronhq/common-all

## [0.24.1](https://github.com/dendronhq/dendron/compare/v0.24.1-alpha.2...v0.24.1) (2021-01-15)

**Note:** Version bump only for package @dendronhq/common-all

## [0.24.1-alpha.2](https://github.com/dendronhq/dendron/compare/v0.24.1-alpha.1...v0.24.1-alpha.2) (2021-01-14)

**Note:** Version bump only for package @dendronhq/common-all

## [0.24.1-alpha.1](https://github.com/dendronhq/dendron/compare/v0.24.1-alpha.0...v0.24.1-alpha.1) (2021-01-12)

**Note:** Version bump only for package @dendronhq/common-all

## [0.24.1-alpha.0](https://github.com/dendronhq/dendron/compare/v0.24.0...v0.24.1-alpha.0) (2021-01-12)

### Enhancements

- add goog analytics ([1539e09](https://github.com/dendronhq/dendron/commit/1539e098acc4a6ea3e9e802bf904b26fbfaae172))

# [0.24.0](https://github.com/dendronhq/dendron/compare/v0.23.2-alpha.4...v0.24.0) (2021-01-11)

**Note:** Version bump only for package @dendronhq/common-all

## [0.23.2-alpha.3](https://github.com/dendronhq/dendron/compare/v0.23.2-alpha.2...v0.23.2-alpha.3) (2021-01-10)

### Enhancements

- enable pass dict to publish ([ccbc017](https://github.com/dendronhq/dendron/commit/ccbc0178cdc0399230a47e4ab1c90d345e447aeb))

## [0.23.2-alpha.2](https://github.com/dendronhq/dendron/compare/v0.23.2-alpha.1...v0.23.2-alpha.2) (2021-01-09)

**Note:** Version bump only for package @dendronhq/common-all

## [0.23.2-alpha.1](https://github.com/dendronhq/dendron/compare/v0.23.1...v0.23.2-alpha.1) (2021-01-09)

### Bug Fixes

- don't throw error if user doesn't choose vault ([c744bc1](https://github.com/dendronhq/dendron/commit/c744bc11429c309a3d045f14039f1548bfa53478))

## [0.23.2-alpha.0](https://github.com/dendronhq/dendron/compare/v0.23.1...v0.23.2-alpha.0) (2021-01-09)

### Bug Fixes

- don't throw error if user doesn't choose vault ([c744bc1](https://github.com/dendronhq/dendron/commit/c744bc11429c309a3d045f14039f1548bfa53478))

## [0.23.1](https://github.com/dendronhq/dendron/compare/v0.23.1-alpha.6...v0.23.1) (2021-01-08)

**Note:** Version bump only for package @dendronhq/common-all

## [0.23.1-alpha.3](https://github.com/dendronhq/dendron/compare/v0.23.1-alpha.2...v0.23.1-alpha.3) (2021-01-06)

**Note:** Version bump only for package @dendronhq/common-all

# [0.23.0](https://github.com/dendronhq/dendron/compare/v0.22.2-alpha.1...v0.23.0) (2021-01-04)

**Note:** Version bump only for package @dendronhq/common-all

## [0.22.2-alpha.1](https://github.com/dendronhq/dendron/compare/v0.22.2-alpha.0...v0.22.2-alpha.1) (2021-01-03)

### Enhancements

- better titles ([774c826](https://github.com/dendronhq/dendron/commit/774c82660a3e6413953748c790bec202f401e22f))

## [0.22.2-alpha.0](https://github.com/dendronhq/dendron/compare/v0.22.1...v0.22.2-alpha.0) (2021-01-02)

**Note:** Version bump only for package @dendronhq/common-all

## [0.22.1](https://github.com/dendronhq/dendron/compare/v0.22.1-alpha.5...v0.22.1) (2020-12-31)

### Enhancements

- skip children directive ([de136d7](https://github.com/dendronhq/dendron/commit/de136d7d1adc3a35aaf1a567e260cb3c9254125c))

## [0.22.1-alpha.2](https://github.com/dendronhq/dendron/compare/v0.22.1-alpha.1...v0.22.1-alpha.2) (2020-12-30)

**Note:** Version bump only for package @dendronhq/common-all

## [0.22.1-alpha.0](https://github.com/dendronhq/dendron/compare/v0.22.0...v0.22.1-alpha.0) (2020-12-29)

### Enhancements

- add more site specific fm def ([51ef599](https://github.com/dendronhq/dendron/commit/51ef599d6fe00579a61993a3a33791773d4be91f))

# [0.22.0](https://github.com/dendronhq/dendron/compare/v0.21.1-alpha.14...v0.22.0) (2020-12-28)

**Note:** Version bump only for package @dendronhq/common-all

## [0.21.1-alpha.9](https://github.com/dendronhq/dendron/compare/v0.21.1-alpha.8...v0.21.1-alpha.9) (2020-12-27)

### Enhancements

- add useFMTitle ([b50c68c](https://github.com/dendronhq/dendron/commit/b50c68c59ccee6d8170d6d3826521993642e6911))

## [0.21.1-alpha.8](https://github.com/dendronhq/dendron/compare/v0.21.1-alpha.7...v0.21.1-alpha.8) (2020-12-27)

**Note:** Version bump only for package @dendronhq/common-all

## [0.21.1-alpha.5](https://github.com/dendronhq/dendron/compare/v0.21.1-alpha.4...v0.21.1-alpha.5) (2020-12-26)

**Note:** Version bump only for package @dendronhq/common-all

## [0.21.1-alpha.2](https://github.com/dendronhq/dendron/compare/v0.21.1-alpha.1...v0.21.1-alpha.2) (2020-12-24)

**Note:** Version bump only for package @dendronhq/common-all

## [0.21.1-alpha.1](https://github.com/dendronhq/dendron/compare/v0.21.1-alpha.0...v0.21.1-alpha.1) (2020-12-23)

**Note:** Version bump only for package @dendronhq/common-all

# [0.21.0](https://github.com/dendronhq/dendron/compare/v0.20.1-alpha.15...v0.21.0) (2020-12-21)

**Note:** Version bump only for package @dendronhq/common-all

## [0.20.1-alpha.13](https://github.com/dendronhq/dendron/compare/v0.20.1-alpha.12...v0.20.1-alpha.13) (2020-12-21)

### Enhancements

- enable assetPrefix option ([0ae1e23](https://github.com/dendronhq/dendron/commit/0ae1e237c8c89745b42661e88f91b2fdcba28f7e))

## [0.20.1-alpha.12](https://github.com/dendronhq/dendron/compare/v0.20.1-alpha.11...v0.20.1-alpha.12) (2020-12-21)

### Enhancements

- better publishing workflow ([7ebfbba](https://github.com/dendronhq/dendron/commit/7ebfbbadc82d5f707bebd9025c06271aa26eb3b4))

## [0.20.1-alpha.11](https://github.com/dendronhq/dendron/compare/v0.20.1-alpha.10...v0.20.1-alpha.11) (2020-12-20)

**Note:** Version bump only for package @dendronhq/common-all

## [0.20.1-alpha.6](https://github.com/dendronhq/dendron/compare/v0.20.1-alpha.5...v0.20.1-alpha.6) (2020-12-19)

**Note:** Version bump only for package @dendronhq/common-all

## [0.20.1-alpha.5](https://github.com/dendronhq/dendron/compare/v0.20.1-alpha.4...v0.20.1-alpha.5) (2020-12-19)

**Note:** Version bump only for package @dendronhq/common-all

## [0.20.1-alpha.0](https://github.com/dendronhq/dendron/compare/v0.20.0...v0.20.1-alpha.0) (2020-12-17)

**Note:** Version bump only for package @dendronhq/common-all

# [0.20.0](https://github.com/dendronhq/dendron/compare/v0.19.3-alpha.2...v0.20.0) (2020-12-14)

**Note:** Version bump only for package @dendronhq/common-all

## [0.19.3-alpha.2](https://github.com/dendronhq/dendron/compare/v0.19.3-alpha.1...v0.19.3-alpha.2) (2020-12-14)

### Bug Fixes

- vault not being matched ([fda8d72](https://github.com/dendronhq/dendron/commit/fda8d724f4146cdadd90f2bb44c9a37a8a4d1ecd))

## [0.19.3-alpha.1](https://github.com/dendronhq/dendron/compare/v0.19.3-alpha.0...v0.19.3-alpha.1) (2020-12-13)

**Note:** Version bump only for package @dendronhq/common-all

## [0.19.2](https://github.com/dendronhq/dendron/compare/v0.19.2-alpha.2...v0.19.2) (2020-12-10)

**Note:** Version bump only for package @dendronhq/common-all

## [0.19.2-alpha.2](https://github.com/dendronhq/dendron/compare/v0.19.2-alpha.1...v0.19.2-alpha.2) (2020-12-10)

### Enhancements

- choose vault when creating new note ([18fbbbf](https://github.com/dendronhq/dendron/commit/18fbbbf2c47e1ba1cafc6f373cb9bc922883e783))

## [0.19.2-alpha.1](https://github.com/dendronhq/dendron/compare/v0.19.2-alpha.0...v0.19.2-alpha.1) (2020-12-10)

### Enhancements

- initialize remote vaults on startup ([1919fe4](https://github.com/dendronhq/dendron/commit/1919fe4e6d853d1f6ef63564ebbcc9af1e11a41a))

## [0.19.2-alpha.0](https://github.com/dendronhq/dendron/compare/v0.19.1...v0.19.2-alpha.0) (2020-12-09)

**Note:** Version bump only for package @dendronhq/common-all

# [0.19.0](https://github.com/dendronhq/dendron/compare/v0.18.2-alpha.8...v0.19.0) (2020-12-07)

**Note:** Version bump only for package @dendronhq/common-all

## [0.18.2-alpha.8](https://github.com/dendronhq/dendron/compare/v0.18.2-alpha.7...v0.18.2-alpha.8) (2020-12-07)

### Bug Fixes

- tree view adding new nodes in wrong place ([173f57b](https://github.com/dendronhq/dendron/commit/173f57bfb2730da2361950df35054a53f0aba765))

## [0.18.2-alpha.7](https://github.com/dendronhq/dendron/compare/v0.18.2-alpha.6...v0.18.2-alpha.7) (2020-12-07)

### Bug Fixes

- issue with local vault command ([fb202e9](https://github.com/dendronhq/dendron/commit/fb202e91e501cfd5506fd73c9a005807954e48d3))

## [0.18.2-alpha.2](https://github.com/dendronhq/dendron/compare/v0.18.2-alpha.1...v0.18.2-alpha.2) (2020-12-05)

**Note:** Version bump only for package @dendronhq/common-all

## [0.18.2-alpha.0](https://github.com/dendronhq/dendron/compare/v0.18.1...v0.18.2-alpha.0) (2020-12-04)

### Enhancements

- add hover for images ([a726f33](https://github.com/dendronhq/dendron/commit/a726f3322bab98ba33a0690f37e34e5d2e822f2a))

## [0.18.1](https://github.com/dendronhq/dendron/compare/v0.18.1-alpha.4...v0.18.1) (2020-12-04)

**Note:** Version bump only for package @dendronhq/common-all

## [0.18.1-alpha.4](https://github.com/dendronhq/dendron/compare/v0.18.1-alpha.3...v0.18.1-alpha.4) (2020-12-04)

### Enhancements

- support private vaults ([98b4961](https://github.com/dendronhq/dendron/commit/98b4961d791b8a30c45e408fdf926838dfd5e431))

## [0.18.1-alpha.3](https://github.com/dendronhq/dendron/compare/v0.18.1-alpha.2...v0.18.1-alpha.3) (2020-12-03)

**Note:** Version bump only for package @dendronhq/common-all

## [0.18.1-alpha.2](https://github.com/dendronhq/dendron/compare/v0.18.1-alpha.1...v0.18.1-alpha.2) (2020-12-03)

### Bug Fixes

- ignore files added by engine ([f76b0ba](https://github.com/dendronhq/dendron/commit/f76b0bacf77186f1023aadb68a0f9e0cdfe74364))

## [0.18.1-alpha.1](https://github.com/dendronhq/dendron/compare/v0.18.1-alpha.0...v0.18.1-alpha.1) (2020-12-03)

### Features

- support adding remote vaults ([d7501b9](https://github.com/dendronhq/dendron/commit/d7501b9a5cb116faae64d26798cfd7ccfc73a4b0))

# [0.18.0](https://github.com/dendronhq/dendron/compare/v0.17.2...v0.18.0) (2020-11-29)

**Note:** Version bump only for package @dendronhq/common-all

## [0.17.2](https://github.com/dendronhq/dendron/compare/v0.17.2-alpha.5...v0.17.2) (2020-11-29)

**Note:** Version bump only for package @dendronhq/common-all

## [0.17.2-alpha.5](https://github.com/dendronhq/dendron/compare/v0.17.2-alpha.4...v0.17.2-alpha.5) (2020-11-29)

**Note:** Version bump only for package @dendronhq/common-all

## [0.17.2-alpha.1](https://github.com/dendronhq/dendron/compare/v0.17.2-alpha.0...v0.17.2-alpha.1) (2020-11-29)

### Features

- add config apis ([f022689](https://github.com/dendronhq/dendron/commit/f0226890ff01c4e5c1746d0cee7b9e99db07d4d6))

## [0.17.2-alpha.0](https://github.com/dendronhq/dendron/compare/v0.17.1-alpha.1...v0.17.2-alpha.0) (2020-11-28)

### Bug Fixes

- issues with rename in multi-vault ([e26b294](https://github.com/dendronhq/dendron/commit/e26b294e8bbe1e49e44318152c247595e82639bb))
- renaming notes with links within root note ([cb74117](https://github.com/dendronhq/dendron/commit/cb74117ae3fd3d1658e94966a4050c15cf491885))

## [0.17.1](https://github.com/dendronhq/dendron/compare/v0.17.1-alpha.1...v0.17.1) (2020-11-26)

**Note:** Version bump only for package @dendronhq/common-all

## [0.17.1-alpha.0](https://github.com/dendronhq/dendron/compare/v0.17.0...v0.17.1-alpha.0) (2020-11-25)

**Note:** Version bump only for package @dendronhq/common-all

# [0.17.0](https://github.com/dendronhq/dendron/compare/v0.16.3-alpha.5...v0.17.0) (2020-11-22)

**Note:** Version bump only for package @dendronhq/common-all

## [0.16.3-alpha.5](https://github.com/dendronhq/dendron/compare/v0.16.3-alpha.4...v0.16.3-alpha.5) (2020-11-22)

**Note:** Version bump only for package @dendronhq/common-all

## [0.16.3-alpha.4](https://github.com/dendronhq/dendron/compare/v0.16.3-alpha.3...v0.16.3-alpha.4) (2020-11-22)

### Enhancements

- better completion ([e7489b3](https://github.com/dendronhq/dendron/commit/e7489b324fb8b5b1a0cb3daf4bd33978073bd90a))

## [0.16.3-alpha.3](https://github.com/dendronhq/dendron/compare/v0.16.3-alpha.2...v0.16.3-alpha.3) (2020-11-20)

### Bug Fixes

- add note to correct parent when writing in multi-vault ([6daeebc](https://github.com/dendronhq/dendron/commit/6daeebc7bd2bbc68fc105766d30bc10444bcaf61))

### Enhancements

- **notes:** change fm title on rename ([32c77a1](https://github.com/dendronhq/dendron/commit/32c77a1a97162150b88c97c9266bd2a42a816aa0))

## [0.16.3-alpha.2](https://github.com/dendronhq/dendron/compare/v0.16.3-alpha.1...v0.16.3-alpha.2) (2020-11-18)

### Enhancements

- support copy relative header link ([2f4c965](https://github.com/dendronhq/dendron/commit/2f4c96528e696aa8b1171d1d561d73bfa68fcb50))

## [0.16.3-alpha.1](https://github.com/dendronhq/dendron/compare/v0.16.3-alpha.0...v0.16.3-alpha.1) (2020-11-18)

### Enhancements

- support alias links ([bb56e72](https://github.com/dendronhq/dendron/commit/bb56e7217c23e486f2402deffe9398cfa8edee2f))

## [0.16.2](https://github.com/dendronhq/dendron/compare/v0.16.1...v0.16.2) (2020-11-18)

**Note:** Version bump only for package @dendronhq/common-all

## [0.16.1](https://github.com/dendronhq/dendron/compare/v0.16.1-alpha.2...v0.16.1) (2020-11-18)

**Note:** Version bump only for package @dendronhq/common-all

## [0.16.1-alpha.2](https://github.com/dendronhq/dendron/compare/v0.16.1-alpha.1...v0.16.1-alpha.2) (2020-11-18)

### Bug Fixes

- **engine:** resolve ntoes with same title in multiple vaults ([6326aff](https://github.com/dendronhq/dendron/commit/6326aff28b5f2ff52edf6d190c068364023be8e9))

### Features

- add completion provider ([9c5ab61](https://github.com/dendronhq/dendron/commit/9c5ab61213a046b7719472faca9bb5e79592fa2f))
- **workbench:** navigate to relative wiki-links ([49c3b54](https://github.com/dendronhq/dendron/commit/49c3b5439fb34b8c6f1f5505fcd90193cbfa28cd))
- add language features ([9c379c1](https://github.com/dendronhq/dendron/commit/9c379c1fb7beda476a8454538a318f43072ad1f0))

# [0.16.0](https://github.com/dendronhq/dendron/compare/v0.15.3-alpha.5...v0.16.0) (2020-11-15)

**Note:** Version bump only for package @dendronhq/common-all

## [0.15.3-alpha.1](https://github.com/dendronhq/dendron/compare/v0.15.3-alpha.0...v0.15.3-alpha.1) (2020-11-15)

**Note:** Version bump only for package @dendronhq/common-all

## [0.15.1](https://github.com/dendronhq/dendron/compare/v0.15.1-alpha.7...v0.15.1) (2020-11-14)

**Note:** Version bump only for package @dendronhq/common-all

## [0.15.1-alpha.5](https://github.com/dendronhq/dendron/compare/v0.15.1-alpha.4...v0.15.1-alpha.5) (2020-11-13)

### Features

- **workspace:** vault add command ([f2bba25](https://github.com/dendronhq/dendron/commit/f2bba254b4923c97fec6b5830bff3779c533447f))

## [0.15.1-alpha.4](https://github.com/dendronhq/dendron/compare/v0.15.1-alpha.3...v0.15.1-alpha.4) (2020-11-13)

**Note:** Version bump only for package @dendronhq/common-all

## [0.15.1-alpha.3](https://github.com/dendronhq/dendron/compare/v0.15.1-alpha.2...v0.15.1-alpha.3) (2020-11-12)

**Note:** Version bump only for package @dendronhq/common-all

## [0.15.1-alpha.2](https://github.com/dendronhq/dendron/compare/v0.15.1-alpha.1...v0.15.1-alpha.2) (2020-11-12)

**Note:** Version bump only for package @dendronhq/common-all

## [0.15.1-alpha.1](https://github.com/dendronhq/dendron/compare/v0.15.1-alpha.0...v0.15.1-alpha.1) (2020-11-11)

**Note:** Version bump only for package @dendronhq/common-all

## [0.15.1-alpha.0](https://github.com/dendronhq/dendron/compare/v0.15.0...v0.15.1-alpha.0) (2020-11-10)

**Note:** Version bump only for package @dendronhq/common-all

# [0.15.0](https://github.com/dendronhq/dendron/compare/v0.14.2-alpha.7...v0.15.0) (2020-11-09)

**Note:** Version bump only for package @dendronhq/common-all

## [0.14.2-alpha.7](https://github.com/dendronhq/dendron/compare/v0.14.2-alpha.6...v0.14.2-alpha.7) (2020-11-09)

**Note:** Version bump only for package @dendronhq/common-all

## [0.14.2-alpha.5](https://github.com/dendronhq/dendron/compare/v0.14.2-alpha.1...v0.14.2-alpha.5) (2020-11-08)

**Note:** Version bump only for package @dendronhq/common-all

## [0.14.2-alpha.4](https://github.com/dendronhq/dendron/compare/v0.14.2-alpha.3...v0.14.2-alpha.4) (2020-11-08)

**Note:** Version bump only for package @dendronhq/common-all

## [0.14.2-alpha.3](https://github.com/dendronhq/dendron/compare/v0.14.2-alpha.2...v0.14.2-alpha.3) (2020-11-08)

**Note:** Version bump only for package @dendronhq/common-all

## [0.14.2-alpha.2](https://github.com/dendronhq/dendron/compare/v0.14.2-alpha.1...v0.14.2-alpha.2) (2020-11-08)

**Note:** Version bump only for package @dendronhq/common-all

## [0.14.2-alpha.0](https://github.com/dendronhq/dendron/compare/v0.14.1...v0.14.2-alpha.0) (2020-11-07)

### Bug Fixes

- **engine:** properly handle \* in refs when refactoring ([704a14f](https://github.com/dendronhq/dendron/commit/704a14f17196e18cb5b26f5fc98ed9f8d492e16a))

### Enhancements

- **engine:** add sync method ([ec58d39](https://github.com/dendronhq/dendron/commit/ec58d395003640384b7764f4f8b483429cc1ece3))

### Features

- **markdown:** wildcard links in note refs ([b8dea8f](https://github.com/dendronhq/dendron/commit/b8dea8f4441cfc01f5acc522ffa3a6402ff50572))

## [0.14.1](https://github.com/dendronhq/dendron/compare/v0.14.1-alpha.7...v0.14.1) (2020-11-05)

**Note:** Version bump only for package @dendronhq/common-all

## [0.14.1-alpha.6](https://github.com/dendronhq/dendron/compare/v0.14.1-alpha.5...v0.14.1-alpha.6) (2020-11-05)

### Features

- **lookup:** copy note link cmd ([e38743d](https://github.com/dendronhq/dendron/commit/e38743ddbac8486f2ac778bd546a6373a15a4f6d))

## [0.14.1-alpha.3](https://github.com/dendronhq/dendron/compare/v0.14.1-alpha.2...v0.14.1-alpha.3) (2020-11-04)

**Note:** Version bump only for package @dendronhq/common-all

## [0.14.1-alpha.0](https://github.com/dendronhq/dendron/compare/v0.14.0...v0.14.1-alpha.0) (2020-11-03)

**Note:** Version bump only for package @dendronhq/common-all

# [0.14.0](https://github.com/dendronhq/dendron/compare/v0.13.6-alpha.2...v0.14.0) (2020-11-01)

**Note:** Version bump only for package @dendronhq/common-all

## [0.13.6-alpha.0](https://github.com/dendronhq/dendron/compare/v0.13.5...v0.13.6-alpha.0) (2020-10-31)

**Note:** Version bump only for package @dendronhq/common-all

## [0.13.5](https://github.com/dendronhq/dendron/compare/v0.13.4...v0.13.5) (2020-10-28)

### Bug Fixes

- **workbench:** tree view can delete notes with caps ([d37926d](https://github.com/dendronhq/dendron/commit/d37926d7f38d784f847a4c2a58fb75ba7c03b0e0))

## [0.13.4](https://github.com/dendronhq/dendron/compare/v0.13.4-alpha.1...v0.13.4) (2020-10-28)

**Note:** Version bump only for package @dendronhq/common-all

## [0.13.4-alpha.0](https://github.com/dendronhq/dendron/compare/v0.13.3...v0.13.4-alpha.0) (2020-10-27)

### Enhancements

- **workbench:** graceful failure on bad schema ([4db5064](https://github.com/dendronhq/dendron/commit/4db5064e4eef61d9c95b9abe34f2dec41550bd9d))

## [0.13.3](https://github.com/dendronhq/dendron/compare/v0.13.3-alpha.1...v0.13.3) (2020-10-24)

**Note:** Version bump only for package @dendronhq/common-all

## [0.13.3-alpha.1](https://github.com/dendronhq/dendron/compare/v0.13.3-alpha.0...v0.13.3-alpha.1) (2020-10-24)

### Bug Fixes

- **notes:** refactor will miss links in newly created notes ([c8a5dde](https://github.com/dendronhq/dendron/commit/c8a5dde2ca46e2402bc50b1a8f635d9fb5318c9d))

## [0.13.3-alpha.0](https://github.com/dendronhq/dendron/compare/v0.13.2...v0.13.3-alpha.0) (2020-10-23)

### Enhancements

- **schema:** add custom props from schema template ([5264544](https://github.com/dendronhq/dendron/commit/52645449b8e155e168baaac0fa4e99903efafcf0))

### Features

- **lookup:** support direct child lookup ([1cae082](https://github.com/dendronhq/dendron/commit/1cae08294baa844c0c0ee3c8d390e337bd6172be))

## [0.13.2](https://github.com/dendronhq/dendron/compare/v0.13.2-alpha.2...v0.13.2) (2020-10-22)

**Note:** Version bump only for package @dendronhq/common-all

## [0.13.2-alpha.2](https://github.com/dendronhq/dendron/compare/v0.13.2-alpha.1...v0.13.2-alpha.2) (2020-10-22)

**Note:** Version bump only for package @dendronhq/common-all

## [0.13.2-alpha.0](https://github.com/dendronhq/dendron/compare/v0.13.1...v0.13.2-alpha.0) (2020-10-21)

**Note:** Version bump only for package @dendronhq/common-all

## [0.13.1](https://github.com/dendronhq/dendron/compare/v0.13.1-alpha.2...v0.13.1) (2020-10-21)

**Note:** Version bump only for package @dendronhq/common-all

## [0.13.1-alpha.2](https://github.com/dendronhq/dendron/compare/v0.13.1-alpha.1...v0.13.1-alpha.2) (2020-10-20)

### Bug Fixes

- **schemas:** show namespace schema suggestions ([30737c0](https://github.com/dendronhq/dendron/commit/30737c070cfcf6b5a7f9c2cc1f75a8760019614b))

## [0.13.1-alpha.1](https://github.com/dendronhq/dendron/compare/v0.13.1-alpha.0...v0.13.1-alpha.1) (2020-10-20)

### Features

- **publishing:** allow custom frontmatter ([782d637](https://github.com/dendronhq/dendron/commit/782d6374c55b00bcda36da9149fb2cedeac0c3d9))

## [0.13.1-alpha.0](https://github.com/dendronhq/dendron/compare/v0.13.0...v0.13.1-alpha.0) (2020-10-20)

### Bug Fixes

- **lookup:** schema suggestions on namespace ([56ee6c4](https://github.com/dendronhq/dendron/commit/56ee6c460dd562200931381923e72971681d1390))

# [0.13.0](https://github.com/dendronhq/dendron/compare/v0.12.12-alpha.0...v0.13.0) (2020-10-19)

**Note:** Version bump only for package @dendronhq/common-all

## [0.12.12-alpha.0](https://github.com/dendronhq/dendron/compare/v0.12.11...v0.12.12-alpha.0) (2020-10-19)

### Bug Fixes

- **lookup:** display schema id if title undefined ([6c7cc70](https://github.com/dendronhq/dendron/commit/6c7cc70cf85181b11654074e17672e39a44fb874))

## [0.12.11](https://github.com/dendronhq/dendron/compare/v0.12.11-alpha.6...v0.12.11) (2020-10-18)

**Note:** Version bump only for package @dendronhq/common-all

## [0.12.11-alpha.2](https://github.com/dendronhq/dendron/compare/v0.12.11-alpha.1...v0.12.11-alpha.2) (2020-10-18)

**Note:** Version bump only for package @dendronhq/common-all

## [0.12.11-alpha.1](https://github.com/dendronhq/dendron/compare/v0.12.11-alpha.0...v0.12.11-alpha.1) (2020-10-17)

**Note:** Version bump only for package @dendronhq/common-all

## [0.12.10](https://github.com/dendronhq/dendron/compare/v0.12.10-alpha.4...v0.12.10) (2020-10-16)

**Note:** Version bump only for package @dendronhq/common-all

## [0.12.10-alpha.2](https://github.com/dendronhq/dendron/compare/v0.12.10-alpha.1...v0.12.10-alpha.2) (2020-10-16)

### Enhancements

- **server:** apply schema templates in all cases ([2e7407a](https://github.com/dendronhq/dendron/commit/2e7407a05fad1356900582c431a1c9f9841f08a8))

## [0.12.10-alpha.0](https://github.com/dendronhq/dendron/compare/v0.12.9...v0.12.10-alpha.0) (2020-10-16)

**Note:** Version bump only for package @dendronhq/common-all

## [0.12.9](https://github.com/dendronhq/dendron/compare/v0.12.9-alpha.1...v0.12.9) (2020-10-15)

**Note:** Version bump only for package @dendronhq/common-all

## [0.12.9-alpha.0](https://github.com/dendronhq/dendron/compare/v0.12.8...v0.12.9-alpha.0) (2020-10-14)

### Bug Fixes

- **server:** issue with goup navigation ([f3722dd](https://github.com/dendronhq/dendron/commit/f3722dd199d7aa4800f88ab5e8388a2a70b611cf))

### Enhancements

- **publishing:** add copyAssets option ([90c9c62](https://github.com/dendronhq/dendron/commit/90c9c6243f5e45868d423f4ef05adb16b4be8fac))

## [0.12.8](https://github.com/dendronhq/dendron/compare/v0.12.8-alpha.2...v0.12.8) (2020-10-14)

**Note:** Version bump only for package @dendronhq/common-all

## [0.12.8-alpha.2](https://github.com/dendronhq/dendron/compare/v0.12.8-alpha.1...v0.12.8-alpha.2) (2020-10-14)

**Note:** Version bump only for package @dendronhq/common-all

## [0.12.8-alpha.0](https://github.com/dendronhq/dendron/compare/v0.12.7...v0.12.8-alpha.0) (2020-10-13)

**Note:** Version bump only for package @dendronhq/common-all

## [0.12.7](https://github.com/dendronhq/dendron/compare/v0.12.7-alpha.10...v0.12.7) (2020-10-13)

**Note:** Version bump only for package @dendronhq/common-all

## [0.12.7-alpha.8](https://github.com/dendronhq/dendron/compare/v0.12.7-alpha.7...v0.12.7-alpha.8) (2020-10-12)

### Bug Fixes

- **server:** issue with deleteing schemas ([2aab629](https://github.com/dendronhq/dendron/commit/2aab62961c4c2a6a073104034fc3961ed6cad2a5))

## [0.12.7-alpha.7](https://github.com/dendronhq/dendron/compare/v0.12.7-alpha.6...v0.12.7-alpha.7) (2020-10-12)

**Note:** Version bump only for package @dendronhq/common-all

## [0.12.7-alpha.5](https://github.com/dendronhq/dendron/compare/v0.12.7-alpha.4...v0.12.7-alpha.5) (2020-10-12)

**Note:** Version bump only for package @dendronhq/common-all

## [0.12.7-alpha.4](https://github.com/dendronhq/dendron/compare/v0.12.7-alpha.3...v0.12.7-alpha.4) (2020-10-12)

**Note:** Version bump only for package @dendronhq/common-all

## [0.12.7-alpha.3](https://github.com/dendronhq/dendron/compare/v0.12.7-alpha.2...v0.12.7-alpha.3) (2020-10-11)

**Note:** Version bump only for package @dendronhq/common-all

## [0.12.7-alpha.0](https://github.com/dendronhq/dendron/compare/v0.12.6...v0.12.7-alpha.0) (2020-10-11)

**Note:** Version bump only for package @dendronhq/common-all

## [0.12.5](https://github.com/dendronhq/dendron/compare/v0.12.5-alpha.7...v0.12.5) (2020-10-07)

**Note:** Version bump only for package @dendronhq/common-all

## [0.12.5-alpha.7](https://github.com/dendronhq/dendron/compare/v0.12.5-alpha.6...v0.12.5-alpha.7) (2020-10-07)

### Enhancements

- **publishing:** custom repo dir when publishing ([e0f5c0a](https://github.com/dendronhq/dendron/commit/e0f5c0a0e6f543b975a278127fb9213d03b5306f))

## [0.12.5-alpha.6](https://github.com/dendronhq/dendron/compare/v0.12.5-alpha.5...v0.12.5-alpha.6) (2020-10-07)

**Note:** Version bump only for package @dendronhq/common-all

## [0.12.5-alpha.5](https://github.com/dendronhq/dendron/compare/v0.12.5-alpha.4...v0.12.5-alpha.5) (2020-10-06)

### Bug Fixes

- **lookup:** schemas in lookup ([b4055fd](https://github.com/dendronhq/dendron/commit/b4055fd61d4918cf4c1a44591be31be69a71b93a))

## [0.12.5-alpha.2](https://github.com/dendronhq/dendron/compare/v0.12.5-alpha.1...v0.12.5-alpha.2) (2020-10-05)

**Note:** Version bump only for package @dendronhq/common-all

## [0.12.5-alpha.1](https://github.com/dendronhq/dendron/compare/v0.12.5-alpha.0...v0.12.5-alpha.1) (2020-10-04)

**Note:** Version bump only for package @dendronhq/common-all

## [0.12.5-alpha.0](https://github.com/dendronhq/dendron/compare/v0.12.4...v0.12.5-alpha.0) (2020-10-04)

### Bug Fixes

- **server:** schema names ([c457f96](https://github.com/dendronhq/dendron/commit/c457f96cc02accd2811a73e15025f68d6796256d))

## [0.12.4](https://github.com/dendronhq/dendron/compare/v0.12.4-alpha.11...v0.12.4) (2020-09-30)

**Note:** Version bump only for package @dendronhq/common-all

## [0.12.4-alpha.5](https://github.com/dendronhq/dendron/compare/v0.12.4-alpha.4...v0.12.4-alpha.5) (2020-09-30)

**Note:** Version bump only for package @dendronhq/common-all

## [0.12.4-alpha.2](https://github.com/dendronhq/dendron/compare/v0.12.4-alpha.1...v0.12.4-alpha.2) (2020-09-30)

**Note:** Version bump only for package @dendronhq/common-all

## [0.12.4-alpha.0](https://github.com/dendronhq/dendron/compare/v0.12.3...v0.12.4-alpha.0) (2020-09-29)

**Note:** Version bump only for package @dendronhq/common-all

## [0.12.3](https://github.com/dendronhq/dendron/compare/v0.12.3-alpha.16...v0.12.3) (2020-09-26)

**Note:** Version bump only for package @dendronhq/common-all

## [0.12.3-alpha.16](https://github.com/dendronhq/dendron/compare/v0.12.3-alpha.15...v0.12.3-alpha.16) (2020-09-25)

**Note:** Version bump only for package @dendronhq/common-all

## [0.12.3-alpha.11](https://github.com/dendronhq/dendron/compare/v0.12.3-alpha.10...v0.12.3-alpha.11) (2020-09-25)

**Note:** Version bump only for package @dendronhq/common-all

## [0.12.3-alpha.10](https://github.com/dendronhq/dendron/compare/v0.12.3-alpha.9...v0.12.3-alpha.10) (2020-09-25)

**Note:** Version bump only for package @dendronhq/common-all

## [0.12.3-alpha.0](https://github.com/dendronhq/dendron/compare/v0.12.2...v0.12.3-alpha.0) (2020-09-24)

**Note:** Version bump only for package @dendronhq/common-all

## [0.12.2](https://github.com/dendronhq/dendron/compare/v0.12.2-alpha.0...v0.12.2) (2020-09-24)

**Note:** Version bump only for package @dendronhq/common-all

## [0.12.2-alpha.0](https://github.com/dendronhq/dendron/compare/v0.12.1...v0.12.2-alpha.0) (2020-09-24)

### Bug Fixes

- **publishing:** incremental builds not setting correct links ([e3dedf5](https://github.com/dendronhq/dendron/commit/e3dedf52d79dede98041edc77a41966cc5d6e8b5))

# [0.12.0](https://github.com/dendronhq/dendron/compare/v0.11.9...v0.12.0) (2020-09-20)

**Note:** Version bump only for package @dendronhq/common-all

## [0.11.5](https://github.com/dendronhq/dendron/compare/v0.11.5-alpha.8...v0.11.5) (2020-09-19)

**Note:** Version bump only for package @dendronhq/common-all

## [0.11.5-alpha.1](https://github.com/dendronhq/dendron/compare/v0.11.5-alpha.0...v0.11.5-alpha.1) (2020-09-19)

**Note:** Version bump only for package @dendronhq/common-all

## [0.11.3](https://github.com/dendronhq/dendron/compare/v0.11.3-alpha.5...v0.11.3) (2020-09-17)

**Note:** Version bump only for package @dendronhq/common-all

## [0.11.3-alpha.3](https://github.com/dendronhq/dendron/compare/v0.11.3-alpha.2...v0.11.3-alpha.3) (2020-09-16)

**Note:** Version bump only for package @dendronhq/common-all

## [0.11.3-alpha.2](https://github.com/dendronhq/dendron/compare/v0.11.3-alpha.1...v0.11.3-alpha.2) (2020-09-16)

**Note:** Version bump only for package @dendronhq/common-all

## [0.11.3-alpha.1](https://github.com/dendronhq/dendron/compare/v0.11.3-alpha.0...v0.11.3-alpha.1) (2020-09-16)

**Note:** Version bump only for package @dendronhq/common-all

# [0.11.0](https://github.com/dendronhq/dendron/compare/v0.10.7...v0.11.0) (2020-09-13)

**Note:** Version bump only for package @dendronhq/common-all

## [0.10.7](https://github.com/dendronhq/dendron/compare/v0.10.7-alpha.0...v0.10.7) (2020-09-13)

**Note:** Version bump only for package @dendronhq/common-all

## [0.10.7-alpha.0](https://github.com/dendronhq/dendron/compare/v0.10.6...v0.10.7-alpha.0) (2020-09-12)

### Enhancements

- **publishing:** add config to specify pretty refs ([4418316](https://github.com/dendronhq/dendron/commit/4418316f606c0e5b563d44da494f81d125d201b6))

## [0.10.6](https://github.com/dendronhq/dendron/compare/v0.10.6-alpha.8...v0.10.6) (2020-09-12)

**Note:** Version bump only for package @dendronhq/common-all

## [0.10.6-alpha.0](https://github.com/dendronhq/dendron/compare/v0.10.5...v0.10.6-alpha.0) (2020-09-11)

**Note:** Version bump only for package @dendronhq/common-all

## [0.10.4](https://github.com/dendronhq/dendron/compare/v0.10.4-alpha.1...v0.10.4) (2020-09-10)

**Note:** Version bump only for package @dendronhq/common-all

## [0.10.4-alpha.0](https://github.com/dendronhq/dendron/compare/v0.10.3...v0.10.4-alpha.0) (2020-09-10)

### Features

- **cli:** add export pod to cli ([3fbf011](https://github.com/dendronhq/dendron/commit/3fbf01139bfd4f9078906efe9e2e3c6e3f298f08))

## [0.10.3](https://github.com/dendronhq/dendron/compare/v0.10.3-alpha.2...v0.10.3) (2020-09-09)

**Note:** Version bump only for package @dendronhq/common-all

## [0.10.3-alpha.2](https://github.com/dendronhq/dendron/compare/v0.10.3-alpha.1...v0.10.3-alpha.2) (2020-09-08)

### Enhancements

- **pods:** additional options on export ([500a908](https://github.com/dendronhq/dendron/commit/500a90853121874dcff64a6300eb317efb58e8a4))

# [0.10.0](https://github.com/dendronhq/dendron/compare/v0.9.7...v0.10.0) (2020-09-07)

**Note:** Version bump only for package @dendronhq/common-all

## [0.9.5](https://github.com/dendronhq/dendron/compare/v0.9.5-alpha.0...v0.9.5) (2020-09-04)

**Note:** Version bump only for package @dendronhq/common-all

## [0.9.5-alpha.0](https://github.com/dendronhq/dendron/compare/v0.9.4...v0.9.5-alpha.0) (2020-09-03)

### Bug Fixes

- **engine:** trouble with mixed case file names ([02bcde2](https://github.com/dendronhq/dendron/commit/02bcde2d7f8e9c6bef9753e18fffd9e15c763976))

## [0.9.1](https://github.com/dendronhq/dendron/compare/v0.9.1-alpha.0...v0.9.1) (2020-09-01)

**Note:** Version bump only for package @dendronhq/common-all

## [0.9.1-alpha.0](https://github.com/dendronhq/dendron/compare/v0.9.0...v0.9.1-alpha.0) (2020-09-01)

### Bug Fixes

- **workbench:** rename note will update tree view correctly ([c98de12](https://github.com/dendronhq/dendron/commit/c98de121406590015bbb395eaa05fbbc83c50ff9))

# [0.9.0](https://github.com/dendronhq/dendron/compare/v0.8.15-alpha.1...v0.9.0) (2020-08-30)

**Note:** Version bump only for package @dendronhq/common-all

## [0.8.13](https://github.com/dendronhq/dendron/compare/v0.8.13-alpha.4...v0.8.13) (2020-08-29)

**Note:** Version bump only for package @dendronhq/common-all

## [0.8.13-alpha.1](https://github.com/dendronhq/dendron/compare/v0.8.13-alpha.0...v0.8.13-alpha.1) (2020-08-28)

**Note:** Version bump only for package @dendronhq/common-all

## [0.8.11](https://github.com/dendronhq/dendron/compare/v0.8.11-alpha.3...v0.8.11) (2020-08-28)

**Note:** Version bump only for package @dendronhq/common-all

## [0.8.11-alpha.0](https://github.com/dendronhq/dendron/compare/v0.8.10...v0.8.11-alpha.0) (2020-08-27)

### Features

- **workspace:** add dendron tree view ([73b0b82](https://github.com/dendronhq/dendron/commit/73b0b825586eca81360d92dd5e7f00239149b41e))

## [0.8.6](https://github.com/dendronhq/dendron/compare/v0.8.5...v0.8.6) (2020-08-26)

### Features

- **workspace:** lookup is MUCH FASTER!!! ([38a3661](https://github.com/dendronhq/dendron/commit/38a366146ef7ce1b47fe06a4be46f7c0e5b41144))

## [0.7.12](https://github.com/dendronhq/dendron/compare/v0.7.11...v0.7.12) (2020-08-23)

### Bug Fixes

- **schema:** autocomplete with imported schemas ([5b6a347](https://github.com/dendronhq/dendron/commit/5b6a3472d2ee895bd64ac365d6ab6f49cb768a4f))

### Features

- **schemas:** support match by pattern ([ba4f687](https://github.com/dendronhq/dendron/commit/ba4f687f5f837ce244e7f58f2746f06372d85a99))
- **schemas:** support schema import ([7a38f1c](https://github.com/dendronhq/dendron/commit/7a38f1c869f5a20bf81c77682877995dd7bfce87))

## [0.7.11](https://github.com/dendronhq/dendron/compare/v0.7.11-alpha.0...v0.7.11) (2020-08-22)

**Note:** Version bump only for package @dendronhq/common-all

## [0.7.11-alpha.0](https://github.com/dendronhq/dendron/compare/v0.7.10...v0.7.11-alpha.0) (2020-08-22)

**Note:** Version bump only for package @dendronhq/common-all

## [0.7.9](https://github.com/dendronhq/dendron/compare/v0.7.9-alpha.1...v0.7.9) (2020-08-20)

**Note:** Version bump only for package @dendronhq/common-all

## [0.7.9-alpha.1](https://github.com/dendronhq/dendron/compare/v0.7.9-alpha.0...v0.7.9-alpha.1) (2020-08-20)

**Note:** Version bump only for package @dendronhq/common-all

## [0.7.9-alpha.0](https://github.com/dendronhq/dendron/compare/v0.7.8...v0.7.9-alpha.0) (2020-08-20)

**Note:** Version bump only for package @dendronhq/common-all

## [0.7.6](https://github.com/dendronhq/dendron/compare/v0.7.6-alpha.2...v0.7.6) (2020-08-19)

### Bug Fixes

- links not being converted to ids ([7106681](https://github.com/dendronhq/dendron/commit/7106681734804ec39990abfdfe9643ba9c006aa5))

## [0.7.6-alpha.0](https://github.com/dendronhq/dendron/compare/v0.7.5-alpha.0...v0.7.6-alpha.0) (2020-08-19)

### Features

- **pods:** support per hierarchy configuration when publishing ([e68edfa](https://github.com/dendronhq/dendron/commit/e68edfa4cac21230ff77a24b65efa2031eb292dc))

## [0.7.5-alpha.0](https://github.com/dendronhq/dendron/compare/v0.7.4...v0.7.5-alpha.0) (2020-08-19)

### Features

- **pods:** enable image prefix when building site ([ab86573](https://github.com/dendronhq/dendron/commit/ab865730b0c2da461e2b9fe6851b8784f690be8a))

## [0.7.4](https://github.com/dendronhq/dendron/compare/v0.7.3...v0.7.4) (2020-08-19)

**Note:** Version bump only for package @dendronhq/common-all

# [0.7.0](https://github.com/dendronhq/dendron/compare/v0.6.12...v0.7.0) (2020-08-17)

**Note:** Version bump only for package @dendronhq/common-all

## [0.6.10](https://github.com/dendronhq/dendron/compare/v0.6.9...v0.6.10) (2020-08-16)

### Features

- **pods:** publish multiple roots ([827b2f5](https://github.com/dendronhq/dendron/commit/827b2f52c35fa650b109dc5d929554a3d5db0cf5))

## [0.6.9](https://github.com/dendronhq/dendron/compare/v0.6.8...v0.6.9) (2020-08-16)

### Bug Fixes

- issue with schemas that have same ids ([3f93b31](https://github.com/dendronhq/dendron/commit/3f93b31bffdaa6092a7c03c48db46edf0d89f65a))

## [0.6.1](https://github.com/dendronhq/dendron/compare/v0.6.0...v0.6.1) (2020-08-11)

### Features

- **commands:** Add Refactor Hierarchy Command ([4fcaf40](https://github.com/dendronhq/dendron/commit/4fcaf40a7fd7b98b658703e726dd8ccf6c14e4c4))

# [0.6.0](https://github.com/dendronhq/dendron/compare/v0.5.15...v0.6.0) (2020-08-09)

**Note:** Version bump only for package @dendronhq/common-all

## [0.5.15](https://github.com/dendronhq/dendron/compare/v0.5.14...v0.5.15) (2020-08-09)

### Bug Fixes

- index notes created through rename ([40f8fb6](https://github.com/dendronhq/dendron/commit/40f8fb6dd6c810a5ead9de2dedaffd4b55c321e9))

### Features

- add copy note link command ([5ca2434](https://github.com/dendronhq/dendron/commit/5ca2434de3f19eaa94ef7bc876ad9b8067cdf90a))

## [0.5.10](https://github.com/dendronhq/dendron/compare/v0.5.9...v0.5.10) (2020-08-06)

**Note:** Version bump only for package @dendronhq/common-all

## [0.5.9](https://github.com/dendronhq/dendron/compare/v0.5.8...v0.5.9) (2020-08-05)

### Bug Fixes

- apply schema descriptions ([e4f7238](https://github.com/dendronhq/dendron/commit/e4f723872db080a3205f305060ebae3c20cb34fb))

## [0.5.8](https://github.com/dendronhq/dendron/compare/v0.5.7...v0.5.8) (2020-08-05)

### Features

- apply schema description to new notes ([c4b9f15](https://github.com/dendronhq/dendron/commit/c4b9f158daeab5d159e5f4e690ad0c4ad1e3f549))

## [0.5.4](https://github.com/dendronhq/dendron/compare/v0.5.3...v0.5.4) (2020-08-04)

### Features

- update index when notes are deleted outside of dendron ([93ad260](https://github.com/dendronhq/dendron/commit/93ad26059009f55e4ff1c9a75cfe39c7cff0b376))

## [0.5.3](https://github.com/dendronhq/dendron/compare/v0.5.2...v0.5.3) (2020-08-03)

**Note:** Version bump only for package @dendronhq/common-all

## [0.5.2](https://github.com/dendronhq/dendron/compare/v0.5.1...v0.5.2) (2020-08-03)

**Note:** Version bump only for package @dendronhq/common-all

## [0.5.1](https://github.com/dendronhq/dendron/compare/v0.5.0...v0.5.1) (2020-08-03)

**Note:** Version bump only for package @dendronhq/common-all

# [0.5.0](https://github.com/dendronhq/dendron/compare/v0.4.8...v0.5.0) (2020-08-02)

**Note:** Version bump only for package @dendronhq/common-all

## [0.4.6](https://github.com/dendronhq/dendron/compare/v0.4.5...v0.4.6) (2020-08-01)

### Features

- support schema templates ([0205d66](https://github.com/dendronhq/dendron/commit/0205d66fc4538361322ffeabb3e532f0d541b775))

## [0.4.5](https://github.com/dendronhq/dendron/compare/v0.4.4...v0.4.5) (2020-08-01)

**Note:** Version bump only for package @dendronhq/common-all

## [0.4.4](https://github.com/dendronhq/dendron/compare/v0.4.3...v0.4.4) (2020-08-01)

### Features

- support deleting schemas ([450f00d](https://github.com/dendronhq/dendron/commit/450f00d6661d1d45dbfed7392bde179a0ab0020c))
- support deleting schemas ([7e6730a](https://github.com/dendronhq/dendron/commit/7e6730a9c3f804d7c039cf74495493839c910fed))
- use lookups to view and create schemas ([19b4677](https://github.com/dendronhq/dendron/commit/19b46770fe6a842831692563de96ff4a823df871))

## [0.4.2](https://github.com/dendronhq/dendron/compare/v0.4.1...v0.4.2) (2020-07-30)

### Bug Fixes

- root should have no parent ([bab72fd](https://github.com/dendronhq/dendron/commit/bab72fd438c541673c128caf96174d43b8eaa43a))

### Features

- build pod command with github pages support ([e063732](https://github.com/dendronhq/dendron/commit/e063732d1ff082dd8520a479926e7ceb1b0893ab))
- build-site command ([8e5ca80](https://github.com/dendronhq/dendron/commit/8e5ca801237686d70f5955c461049010480837be))
- overwrite fields in backfill ([af504f4](https://github.com/dendronhq/dendron/commit/af504f44d73910e8687367bc203b613d774a039c))

## 0.4.0 (2020-07-26)

**Note:** Version bump only for package @dendronhq/common-all

## [0.3.42](https://github.com/dendronhq/dendron/compare/v0.3.41...v0.3.42) (2020-07-23)

**Note:** Version bump only for package @dendronhq/common-all

## [0.3.40](https://github.com/dendronhq/dendron/compare/v0.3.39...v0.3.40) (2020-07-23)

**Note:** Version bump only for package @dendronhq/common-all

## [0.3.39](https://github.com/dendronhq/dendron/compare/v0.3.38...v0.3.39) (2020-07-23)

**Note:** Version bump only for package @dendronhq/common-all

## [0.3.38](https://github.com/dendronhq/dendron/compare/v0.3.37...v0.3.38) (2020-07-23)

**Note:** Version bump only for package @dendronhq/common-all

## [0.3.37](https://github.com/dendronhq/dendron/compare/v0.3.36...v0.3.37) (2020-07-22)

**Note:** Version bump only for package @dendronhq/common-all

## [0.3.30](https://github.com/dendronhq/dendron/compare/v0.3.29...v0.3.30) (2020-07-21)

### Features

- custom front matter support [docs](https://github.com/dendronhq/dendron-template/blob/master/vault/pro.dendron.topic.frontmatter.md) ([dadd3fd](https://github.com/dendronhq/dendron/commit/dadd3fd16e2814e378b7af3c097b556c92981de3))

## [0.3.21](https://github.com/dendronhq/dendron/compare/v0.3.20...v0.3.21) (2020-07-19)

**Note:** Version bump only for package @dendronhq/common-all

## [0.3.19](https://github.com/dendronhq/dendron/compare/v0.3.18...v0.3.19) (2020-07-18)

**Note:** Version bump only for package @dendronhq/common-all

## [0.3.17](https://github.com/dendronhq/dendron/compare/v0.3.16...v0.3.17) (2020-07-17)

### Features

- open non-markdown files using native apps. [docs](https://github.com/dendronhq/dendron-template/blob/master/vault/dendron.feature.links.md) ([7f630d1](https://github.com/dendronhq/dendron/commit/7f630d1fb95d5c0d28fc5a83f4cee27bc17d452c))

## [0.3.16](https://github.com/dendronhq/dendron/compare/v0.3.15...v0.3.16) (2020-07-16)

### Features

- implement journal notes. see details here: https://github.com/dendronhq/dendron-template/blob/master/vault/dendron.feature.journals.md ([5e1236f](https://github.com/dendronhq/dendron/commit/5e1236fddbf1e0fddf4c27d1a40e9841cc99974f))

## [0.3.15](https://github.com/dendronhq/dendron/compare/v0.3.14...v0.3.15) (2020-07-14)

### Bug Fixes

- schema suggestions not always showing ([658c9e3](https://github.com/dendronhq/dendron/commit/658c9e3215cccf1875138928a3c9a8486052b63a))

### Features

- show note title if differ from file name ([c0e428d](https://github.com/dendronhq/dendron/commit/c0e428d259ef116d66cbe1107d7760cbb84f8d20))

## [0.3.11](https://github.com/dendronhq/dendron/compare/v0.3.10...v0.3.11) (2020-07-13)

**Note:** Version bump only for package @dendronhq/common-all

## [0.3.10](https://github.com/dendronhq/dendron/compare/v0.1.6...v0.3.10) (2020-07-13)

### Features

- auto add nodes when deleted or created outside of dendron ([8c311bd](https://github.com/dendronhq/dendron/commit/8c311bda948a1d54088c49fd70eb65d24af5d68f))
- better schema suggestions ([03656bc](https://github.com/dendronhq/dendron/commit/03656bc007810457cb6846f0d6adacab4a7fbd3a))
- match namespace schemas ([7a67b8b](https://github.com/dendronhq/dendron/commit/7a67b8b2fb7caa1b97ee6d492d2801782abecdf6))
- show node descriptions ([aca86f2](https://github.com/dendronhq/dendron/commit/aca86f2a5fd6ee481f93553693a098db0e322890))
- surface unknown schemas ([d014965](https://github.com/dendronhq/dendron/commit/d0149652c985c69a4b2607984d578902820077f1))
- updated icons for schemas ([21804eb](https://github.com/dendronhq/dendron/commit/21804eba61c8dd49e499edd5d548d9d601224e8e))

## [0.3.9](https://github.com/dendronhq/dendron/compare/v0.3.8...v0.3.9) (2020-07-09)

### Features

- updated icons for schemas ([b7a2d8a](https://github.com/dendronhq/dendron/commit/b7a2d8aa517cf88d7a93d07cd2ef19305e48d069))

## [0.3.7](https://github.com/dendronhq/dendron/compare/v0.3.6...v0.3.7) (2020-07-08)

### Features

- better schema suggestions ([ad74bc0](https://github.com/dendronhq/dendron/commit/ad74bc009e1544319a49689394ab8d6b684f6578))
- show node descriptions ([e08fce9](https://github.com/dendronhq/dendron/commit/e08fce994153e28fe504b85e6d9bc1f5fdd93e20))

## [0.3.6](https://github.com/dendronhq/dendron/compare/v0.3.5...v0.3.6) (2020-07-07)

### Features

- auto add nodes when deleted or created outside of dendron ([a7e1ac9](https://github.com/dendronhq/dendron/commit/a7e1ac9b8a4f7f0592ab1b9f86a7a40182693a73))

# [0.3.0](https://github.com/dendronhq/dendron/compare/v0.2.20...v0.3.0) (2020-07-05)

### Features

- match namespace schemas ([1a960bf](https://github.com/dendronhq/dendron/commit/1a960bf26f8984e541b3eb118f60bdc09d8250fe))
- surface unknown schemas ([9bf4d0e](https://github.com/dendronhq/dendron/commit/9bf4d0e61cce2f76bddae1f686f29474201466cb))
