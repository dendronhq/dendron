# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [0.60.1-alpha.3](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.60.1-alpha.3) (2021-09-23)


### Bug Fixes

* resolve relative links on import ([#1371](https://github.com/dendronhq/dendron/issues/1371)) ([d4cee4c](https://github.com/dendronhq/dendron/commit/d4cee4c978ddcc56ad13a17ec0988be1420f789c))
* single letter look up matches ([#1388](https://github.com/dendronhq/dendron/issues/1388)) ([7de9a71](https://github.com/dendronhq/dendron/commit/7de9a7195a02399b1285b51ef08d6853b1f390f6))


### Features Dendron

* **cli:** initialize workspace from CLI ([31a734d](https://github.com/dendronhq/dendron/commit/31a734dbd48c2a75bdb85a1e2e299d4b77311d65))



# 0.60.0 (2021-09-21)


### Bug Fixes

* **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))
* block anchor in list with single top level element ([#1242](https://github.com/dendronhq/dendron/issues/1242)) ([1ce3a21](https://github.com/dendronhq/dendron/commit/1ce3a216047d5a1a1638509cdc92e36e7ec86a1c)), closes [#1235](https://github.com/dendronhq/dendron/issues/1235)
* block anchors attached to code blocks in publishing ([#1267](https://github.com/dendronhq/dendron/issues/1267)) ([6b3c71c](https://github.com/dendronhq/dendron/commit/6b3c71cd6728dfee7eaa74db9f9b8168ad7a2e39))
* wrong assetPrefix in 11ty ([e5cb251](https://github.com/dendronhq/dendron/commit/e5cb251afbd6b76cbb52ab5046e7ca4ac816e06c))
* **commands:** rename note leaves incorrect metadata if parent is a stub ([#1348](https://github.com/dendronhq/dendron/issues/1348)) ([d432cc9](https://github.com/dendronhq/dendron/commit/d432cc9e20ff8b9f6cefd7cc4c3a42b567ed9bc5))
* correctly render cross-vault note references in preview v2 ([#1310](https://github.com/dendronhq/dendron/issues/1310)) ([1198449](https://github.com/dendronhq/dendron/commit/11984494ca7c889790a0c0288fe97b8687398e4f))
* direct children query ([#1303](https://github.com/dendronhq/dendron/issues/1303)) ([bcf0dea](https://github.com/dendronhq/dendron/commit/bcf0deae422406564cd9a56c1765f90dd2e66215))
* exclude private vault backlinks ([#1301](https://github.com/dendronhq/dendron/issues/1301)) ([837c50e](https://github.com/dendronhq/dendron/commit/837c50efad4d80d4a41d73a39287053b7ff7e365))
* Frontmatter tags display similar to Children ([#1285](https://github.com/dendronhq/dendron/issues/1285)) ([a0ce014](https://github.com/dendronhq/dendron/commit/a0ce01469bd0de17768d1aff2711807425027d87))
* slugify github issue title ([#1218](https://github.com/dendronhq/dendron/issues/1218)) ([e6c2638](https://github.com/dendronhq/dendron/commit/e6c26380abd68f076dbe1d8ed542327c3ff558f3))


### Features Dendron

* dendron publishing with nextjs commands ([#1266](https://github.com/dendronhq/dendron/issues/1266)) ([fb90e98](https://github.com/dendronhq/dendron/commit/fb90e98999c1073b58480eb7364f6a70e31a6903))
* enable usePrettyRefs for nextJS publishing and preview ([#1239](https://github.com/dendronhq/dendron/issues/1239)) ([8a456a9](https://github.com/dendronhq/dendron/commit/8a456a910c45e927c8413d881324bd28401e2aca))
* extended images for custom CSS properties ([#1315](https://github.com/dendronhq/dendron/issues/1315)) ([f9ed88f](https://github.com/dendronhq/dendron/commit/f9ed88ff91916c444607d7842027c79085d077ae)), closes [#1273](https://github.com/dendronhq/dendron/issues/1273)
* github publish to create new issue ([#1206](https://github.com/dendronhq/dendron/issues/1206)) ([67abef0](https://github.com/dendronhq/dendron/commit/67abef02c5615385a8a7f82fe290c8a443605a7f))
* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* user tag autocomplete & user tags updated on rename ([#1278](https://github.com/dendronhq/dendron/issues/1278)) ([9719f99](https://github.com/dendronhq/dendron/commit/9719f99550a2c51c1a22f6fb21ff750bb4115f89))
* user tags ([#1228](https://github.com/dendronhq/dendron/issues/1228)) ([98c0106](https://github.com/dendronhq/dendron/commit/98c0106367e384c130a927484b9ea294eb6f84fa))



## 0.55.2 (2021-08-21)


### Bug Fixes

* don't insert title when rendering note refs in preview ([#1157](https://github.com/dendronhq/dendron/issues/1157)) ([9d447af](https://github.com/dendronhq/dendron/commit/9d447af8ad7381bb8d3078fc44d4a188618acdfd))
* wrong internal links in nextjs publishing ([#1165](https://github.com/dendronhq/dendron/issues/1165)) ([59a949d](https://github.com/dendronhq/dendron/commit/59a949d2b5b541efb283e851060636b108eb5a98))



## 0.55.1 (2021-08-17)


### Features Dendron

* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* add new vaults from CLI to code workspace ([#1094](https://github.com/dendronhq/dendron/issues/1094)) ([2cde108](https://github.com/dendronhq/dendron/commit/2cde108b4c88a5c9d13b8eb6370f69879d6c9a62))
* CopyNoteLink copies footnotes as anchors ([#1117](https://github.com/dendronhq/dendron/issues/1117)) ([2168991](https://github.com/dendronhq/dendron/commit/21689914d0c84735d243b988dcceb276df97380f))
* frontmatter tags ([#1104](https://github.com/dendronhq/dendron/issues/1104)) ([e4c022f](https://github.com/dendronhq/dendron/commit/e4c022f422b1ce020215d59d2658218f10c75250))
* leading slash in markdown export pod ([#1136](https://github.com/dendronhq/dendron/issues/1136)) ([0f8ebbf](https://github.com/dendronhq/dendron/commit/0f8ebbf228f7af1bbbf677c9fea38989f87c635e))


### Features Dendron

* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))
* remove frontmatter tags if tag is moved outside `tags.` ([1bce9af](https://github.com/dendronhq/dendron/commit/1bce9af293a60fd453389a907fc3043fe173330c))
* seed cmds in plugin ([#1080](https://github.com/dendronhq/dendron/issues/1080)) ([e07a092](https://github.com/dendronhq/dendron/commit/e07a092b1a75548574f2ea45f1b465490b2091f3))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.60.1-alpha.2](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.60.1-alpha.2) (2021-09-22)



# 0.60.0 (2021-09-21)


### Bug Fixes

* **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))
* block anchor in list with single top level element ([#1242](https://github.com/dendronhq/dendron/issues/1242)) ([1ce3a21](https://github.com/dendronhq/dendron/commit/1ce3a216047d5a1a1638509cdc92e36e7ec86a1c)), closes [#1235](https://github.com/dendronhq/dendron/issues/1235)
* block anchors attached to code blocks in publishing ([#1267](https://github.com/dendronhq/dendron/issues/1267)) ([6b3c71c](https://github.com/dendronhq/dendron/commit/6b3c71cd6728dfee7eaa74db9f9b8168ad7a2e39))
* wrong assetPrefix in 11ty ([e5cb251](https://github.com/dendronhq/dendron/commit/e5cb251afbd6b76cbb52ab5046e7ca4ac816e06c))
* **commands:** rename note leaves incorrect metadata if parent is a stub ([#1348](https://github.com/dendronhq/dendron/issues/1348)) ([d432cc9](https://github.com/dendronhq/dendron/commit/d432cc9e20ff8b9f6cefd7cc4c3a42b567ed9bc5))
* correctly render cross-vault note references in preview v2 ([#1310](https://github.com/dendronhq/dendron/issues/1310)) ([1198449](https://github.com/dendronhq/dendron/commit/11984494ca7c889790a0c0288fe97b8687398e4f))
* direct children query ([#1303](https://github.com/dendronhq/dendron/issues/1303)) ([bcf0dea](https://github.com/dendronhq/dendron/commit/bcf0deae422406564cd9a56c1765f90dd2e66215))
* exclude private vault backlinks ([#1301](https://github.com/dendronhq/dendron/issues/1301)) ([837c50e](https://github.com/dendronhq/dendron/commit/837c50efad4d80d4a41d73a39287053b7ff7e365))
* Frontmatter tags display similar to Children ([#1285](https://github.com/dendronhq/dendron/issues/1285)) ([a0ce014](https://github.com/dendronhq/dendron/commit/a0ce01469bd0de17768d1aff2711807425027d87))
* slugify github issue title ([#1218](https://github.com/dendronhq/dendron/issues/1218)) ([e6c2638](https://github.com/dendronhq/dendron/commit/e6c26380abd68f076dbe1d8ed542327c3ff558f3))


### Features Dendron

* dendron publishing with nextjs commands ([#1266](https://github.com/dendronhq/dendron/issues/1266)) ([fb90e98](https://github.com/dendronhq/dendron/commit/fb90e98999c1073b58480eb7364f6a70e31a6903))
* enable usePrettyRefs for nextJS publishing and preview ([#1239](https://github.com/dendronhq/dendron/issues/1239)) ([8a456a9](https://github.com/dendronhq/dendron/commit/8a456a910c45e927c8413d881324bd28401e2aca))
* extended images for custom CSS properties ([#1315](https://github.com/dendronhq/dendron/issues/1315)) ([f9ed88f](https://github.com/dendronhq/dendron/commit/f9ed88ff91916c444607d7842027c79085d077ae)), closes [#1273](https://github.com/dendronhq/dendron/issues/1273)
* github publish to create new issue ([#1206](https://github.com/dendronhq/dendron/issues/1206)) ([67abef0](https://github.com/dendronhq/dendron/commit/67abef02c5615385a8a7f82fe290c8a443605a7f))
* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* user tag autocomplete & user tags updated on rename ([#1278](https://github.com/dendronhq/dendron/issues/1278)) ([9719f99](https://github.com/dendronhq/dendron/commit/9719f99550a2c51c1a22f6fb21ff750bb4115f89))
* user tags ([#1228](https://github.com/dendronhq/dendron/issues/1228)) ([98c0106](https://github.com/dendronhq/dendron/commit/98c0106367e384c130a927484b9ea294eb6f84fa))



## 0.55.2 (2021-08-21)


### Bug Fixes

* don't insert title when rendering note refs in preview ([#1157](https://github.com/dendronhq/dendron/issues/1157)) ([9d447af](https://github.com/dendronhq/dendron/commit/9d447af8ad7381bb8d3078fc44d4a188618acdfd))
* wrong internal links in nextjs publishing ([#1165](https://github.com/dendronhq/dendron/issues/1165)) ([59a949d](https://github.com/dendronhq/dendron/commit/59a949d2b5b541efb283e851060636b108eb5a98))



## 0.55.1 (2021-08-17)


### Features Dendron

* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* add new vaults from CLI to code workspace ([#1094](https://github.com/dendronhq/dendron/issues/1094)) ([2cde108](https://github.com/dendronhq/dendron/commit/2cde108b4c88a5c9d13b8eb6370f69879d6c9a62))
* CopyNoteLink copies footnotes as anchors ([#1117](https://github.com/dendronhq/dendron/issues/1117)) ([2168991](https://github.com/dendronhq/dendron/commit/21689914d0c84735d243b988dcceb276df97380f))
* frontmatter tags ([#1104](https://github.com/dendronhq/dendron/issues/1104)) ([e4c022f](https://github.com/dendronhq/dendron/commit/e4c022f422b1ce020215d59d2658218f10c75250))
* leading slash in markdown export pod ([#1136](https://github.com/dendronhq/dendron/issues/1136)) ([0f8ebbf](https://github.com/dendronhq/dendron/commit/0f8ebbf228f7af1bbbf677c9fea38989f87c635e))


### Features Dendron

* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))
* remove frontmatter tags if tag is moved outside `tags.` ([1bce9af](https://github.com/dendronhq/dendron/commit/1bce9af293a60fd453389a907fc3043fe173330c))
* seed cmds in plugin ([#1080](https://github.com/dendronhq/dendron/issues/1080)) ([e07a092](https://github.com/dendronhq/dendron/commit/e07a092b1a75548574f2ea45f1b465490b2091f3))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.60.1-alpha.1](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.60.1-alpha.1) (2021-09-21)


### Bug Fixes

* **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))
* block anchor in list with single top level element ([#1242](https://github.com/dendronhq/dendron/issues/1242)) ([1ce3a21](https://github.com/dendronhq/dendron/commit/1ce3a216047d5a1a1638509cdc92e36e7ec86a1c)), closes [#1235](https://github.com/dendronhq/dendron/issues/1235)
* block anchors attached to code blocks in publishing ([#1267](https://github.com/dendronhq/dendron/issues/1267)) ([6b3c71c](https://github.com/dendronhq/dendron/commit/6b3c71cd6728dfee7eaa74db9f9b8168ad7a2e39))
* wrong assetPrefix in 11ty ([e5cb251](https://github.com/dendronhq/dendron/commit/e5cb251afbd6b76cbb52ab5046e7ca4ac816e06c))
* **commands:** rename note leaves incorrect metadata if parent is a stub ([#1348](https://github.com/dendronhq/dendron/issues/1348)) ([d432cc9](https://github.com/dendronhq/dendron/commit/d432cc9e20ff8b9f6cefd7cc4c3a42b567ed9bc5))
* correctly render cross-vault note references in preview v2 ([#1310](https://github.com/dendronhq/dendron/issues/1310)) ([1198449](https://github.com/dendronhq/dendron/commit/11984494ca7c889790a0c0288fe97b8687398e4f))
* direct children query ([#1303](https://github.com/dendronhq/dendron/issues/1303)) ([bcf0dea](https://github.com/dendronhq/dendron/commit/bcf0deae422406564cd9a56c1765f90dd2e66215))
* exclude private vault backlinks ([#1301](https://github.com/dendronhq/dendron/issues/1301)) ([837c50e](https://github.com/dendronhq/dendron/commit/837c50efad4d80d4a41d73a39287053b7ff7e365))
* Frontmatter tags display similar to Children ([#1285](https://github.com/dendronhq/dendron/issues/1285)) ([a0ce014](https://github.com/dendronhq/dendron/commit/a0ce01469bd0de17768d1aff2711807425027d87))
* slugify github issue title ([#1218](https://github.com/dendronhq/dendron/issues/1218)) ([e6c2638](https://github.com/dendronhq/dendron/commit/e6c26380abd68f076dbe1d8ed542327c3ff558f3))


### Features Dendron

* dendron publishing with nextjs commands ([#1266](https://github.com/dendronhq/dendron/issues/1266)) ([fb90e98](https://github.com/dendronhq/dendron/commit/fb90e98999c1073b58480eb7364f6a70e31a6903))
* enable usePrettyRefs for nextJS publishing and preview ([#1239](https://github.com/dendronhq/dendron/issues/1239)) ([8a456a9](https://github.com/dendronhq/dendron/commit/8a456a910c45e927c8413d881324bd28401e2aca))
* extended images for custom CSS properties ([#1315](https://github.com/dendronhq/dendron/issues/1315)) ([f9ed88f](https://github.com/dendronhq/dendron/commit/f9ed88ff91916c444607d7842027c79085d077ae)), closes [#1273](https://github.com/dendronhq/dendron/issues/1273)
* github publish to create new issue ([#1206](https://github.com/dendronhq/dendron/issues/1206)) ([67abef0](https://github.com/dendronhq/dendron/commit/67abef02c5615385a8a7f82fe290c8a443605a7f))
* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* user tag autocomplete & user tags updated on rename ([#1278](https://github.com/dendronhq/dendron/issues/1278)) ([9719f99](https://github.com/dendronhq/dendron/commit/9719f99550a2c51c1a22f6fb21ff750bb4115f89))
* user tags ([#1228](https://github.com/dendronhq/dendron/issues/1228)) ([98c0106](https://github.com/dendronhq/dendron/commit/98c0106367e384c130a927484b9ea294eb6f84fa))



## 0.55.2 (2021-08-21)


### Bug Fixes

* don't insert title when rendering note refs in preview ([#1157](https://github.com/dendronhq/dendron/issues/1157)) ([9d447af](https://github.com/dendronhq/dendron/commit/9d447af8ad7381bb8d3078fc44d4a188618acdfd))
* wrong internal links in nextjs publishing ([#1165](https://github.com/dendronhq/dendron/issues/1165)) ([59a949d](https://github.com/dendronhq/dendron/commit/59a949d2b5b541efb283e851060636b108eb5a98))



## 0.55.1 (2021-08-17)


### Features Dendron

* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* add new vaults from CLI to code workspace ([#1094](https://github.com/dendronhq/dendron/issues/1094)) ([2cde108](https://github.com/dendronhq/dendron/commit/2cde108b4c88a5c9d13b8eb6370f69879d6c9a62))
* CopyNoteLink copies footnotes as anchors ([#1117](https://github.com/dendronhq/dendron/issues/1117)) ([2168991](https://github.com/dendronhq/dendron/commit/21689914d0c84735d243b988dcceb276df97380f))
* frontmatter tags ([#1104](https://github.com/dendronhq/dendron/issues/1104)) ([e4c022f](https://github.com/dendronhq/dendron/commit/e4c022f422b1ce020215d59d2658218f10c75250))
* leading slash in markdown export pod ([#1136](https://github.com/dendronhq/dendron/issues/1136)) ([0f8ebbf](https://github.com/dendronhq/dendron/commit/0f8ebbf228f7af1bbbf677c9fea38989f87c635e))


### Features Dendron

* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))
* remove frontmatter tags if tag is moved outside `tags.` ([1bce9af](https://github.com/dendronhq/dendron/commit/1bce9af293a60fd453389a907fc3043fe173330c))
* seed cmds in plugin ([#1080](https://github.com/dendronhq/dendron/issues/1080)) ([e07a092](https://github.com/dendronhq/dendron/commit/e07a092b1a75548574f2ea45f1b465490b2091f3))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.60.1-alpha.0](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.60.1-alpha.0) (2021-09-20)


### Bug Fixes

* **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))
* block anchor in list with single top level element ([#1242](https://github.com/dendronhq/dendron/issues/1242)) ([1ce3a21](https://github.com/dendronhq/dendron/commit/1ce3a216047d5a1a1638509cdc92e36e7ec86a1c)), closes [#1235](https://github.com/dendronhq/dendron/issues/1235)
* block anchors attached to code blocks in publishing ([#1267](https://github.com/dendronhq/dendron/issues/1267)) ([6b3c71c](https://github.com/dendronhq/dendron/commit/6b3c71cd6728dfee7eaa74db9f9b8168ad7a2e39))
* wrong assetPrefix in 11ty ([e5cb251](https://github.com/dendronhq/dendron/commit/e5cb251afbd6b76cbb52ab5046e7ca4ac816e06c))
* **commands:** rename note leaves incorrect metadata if parent is a stub ([#1348](https://github.com/dendronhq/dendron/issues/1348)) ([d432cc9](https://github.com/dendronhq/dendron/commit/d432cc9e20ff8b9f6cefd7cc4c3a42b567ed9bc5))
* correctly render cross-vault note references in preview v2 ([#1310](https://github.com/dendronhq/dendron/issues/1310)) ([1198449](https://github.com/dendronhq/dendron/commit/11984494ca7c889790a0c0288fe97b8687398e4f))
* direct children query ([#1303](https://github.com/dendronhq/dendron/issues/1303)) ([bcf0dea](https://github.com/dendronhq/dendron/commit/bcf0deae422406564cd9a56c1765f90dd2e66215))
* exclude private vault backlinks ([#1301](https://github.com/dendronhq/dendron/issues/1301)) ([837c50e](https://github.com/dendronhq/dendron/commit/837c50efad4d80d4a41d73a39287053b7ff7e365))
* Frontmatter tags display similar to Children ([#1285](https://github.com/dendronhq/dendron/issues/1285)) ([a0ce014](https://github.com/dendronhq/dendron/commit/a0ce01469bd0de17768d1aff2711807425027d87))
* slugify github issue title ([#1218](https://github.com/dendronhq/dendron/issues/1218)) ([e6c2638](https://github.com/dendronhq/dendron/commit/e6c26380abd68f076dbe1d8ed542327c3ff558f3))


### Features Dendron

* dendron publishing with nextjs commands ([#1266](https://github.com/dendronhq/dendron/issues/1266)) ([fb90e98](https://github.com/dendronhq/dendron/commit/fb90e98999c1073b58480eb7364f6a70e31a6903))
* enable usePrettyRefs for nextJS publishing and preview ([#1239](https://github.com/dendronhq/dendron/issues/1239)) ([8a456a9](https://github.com/dendronhq/dendron/commit/8a456a910c45e927c8413d881324bd28401e2aca))
* extended images for custom CSS properties ([#1315](https://github.com/dendronhq/dendron/issues/1315)) ([f9ed88f](https://github.com/dendronhq/dendron/commit/f9ed88ff91916c444607d7842027c79085d077ae)), closes [#1273](https://github.com/dendronhq/dendron/issues/1273)
* github publish to create new issue ([#1206](https://github.com/dendronhq/dendron/issues/1206)) ([67abef0](https://github.com/dendronhq/dendron/commit/67abef02c5615385a8a7f82fe290c8a443605a7f))
* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* user tag autocomplete & user tags updated on rename ([#1278](https://github.com/dendronhq/dendron/issues/1278)) ([9719f99](https://github.com/dendronhq/dendron/commit/9719f99550a2c51c1a22f6fb21ff750bb4115f89))
* user tags ([#1228](https://github.com/dendronhq/dendron/issues/1228)) ([98c0106](https://github.com/dendronhq/dendron/commit/98c0106367e384c130a927484b9ea294eb6f84fa))



## 0.55.2 (2021-08-21)


### Bug Fixes

* don't insert title when rendering note refs in preview ([#1157](https://github.com/dendronhq/dendron/issues/1157)) ([9d447af](https://github.com/dendronhq/dendron/commit/9d447af8ad7381bb8d3078fc44d4a188618acdfd))
* wrong internal links in nextjs publishing ([#1165](https://github.com/dendronhq/dendron/issues/1165)) ([59a949d](https://github.com/dendronhq/dendron/commit/59a949d2b5b541efb283e851060636b108eb5a98))



## 0.55.1 (2021-08-17)


### Features Dendron

* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* add new vaults from CLI to code workspace ([#1094](https://github.com/dendronhq/dendron/issues/1094)) ([2cde108](https://github.com/dendronhq/dendron/commit/2cde108b4c88a5c9d13b8eb6370f69879d6c9a62))
* CopyNoteLink copies footnotes as anchors ([#1117](https://github.com/dendronhq/dendron/issues/1117)) ([2168991](https://github.com/dendronhq/dendron/commit/21689914d0c84735d243b988dcceb276df97380f))
* frontmatter tags ([#1104](https://github.com/dendronhq/dendron/issues/1104)) ([e4c022f](https://github.com/dendronhq/dendron/commit/e4c022f422b1ce020215d59d2658218f10c75250))
* leading slash in markdown export pod ([#1136](https://github.com/dendronhq/dendron/issues/1136)) ([0f8ebbf](https://github.com/dendronhq/dendron/commit/0f8ebbf228f7af1bbbf677c9fea38989f87c635e))


### Features Dendron

* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))
* remove frontmatter tags if tag is moved outside `tags.` ([1bce9af](https://github.com/dendronhq/dendron/commit/1bce9af293a60fd453389a907fc3043fe173330c))
* seed cmds in plugin ([#1080](https://github.com/dendronhq/dendron/issues/1080)) ([e07a092](https://github.com/dendronhq/dendron/commit/e07a092b1a75548574f2ea45f1b465490b2091f3))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





# [0.60.0](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.60.0) (2021-09-20)


### Bug Fixes

* **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))
* block anchor in list with single top level element ([#1242](https://github.com/dendronhq/dendron/issues/1242)) ([1ce3a21](https://github.com/dendronhq/dendron/commit/1ce3a216047d5a1a1638509cdc92e36e7ec86a1c)), closes [#1235](https://github.com/dendronhq/dendron/issues/1235)
* block anchors attached to code blocks in publishing ([#1267](https://github.com/dendronhq/dendron/issues/1267)) ([6b3c71c](https://github.com/dendronhq/dendron/commit/6b3c71cd6728dfee7eaa74db9f9b8168ad7a2e39))
* wrong assetPrefix in 11ty ([e5cb251](https://github.com/dendronhq/dendron/commit/e5cb251afbd6b76cbb52ab5046e7ca4ac816e06c))
* **commands:** rename note leaves incorrect metadata if parent is a stub ([#1348](https://github.com/dendronhq/dendron/issues/1348)) ([d432cc9](https://github.com/dendronhq/dendron/commit/d432cc9e20ff8b9f6cefd7cc4c3a42b567ed9bc5))
* correctly render cross-vault note references in preview v2 ([#1310](https://github.com/dendronhq/dendron/issues/1310)) ([1198449](https://github.com/dendronhq/dendron/commit/11984494ca7c889790a0c0288fe97b8687398e4f))
* direct children query ([#1303](https://github.com/dendronhq/dendron/issues/1303)) ([bcf0dea](https://github.com/dendronhq/dendron/commit/bcf0deae422406564cd9a56c1765f90dd2e66215))
* exclude private vault backlinks ([#1301](https://github.com/dendronhq/dendron/issues/1301)) ([837c50e](https://github.com/dendronhq/dendron/commit/837c50efad4d80d4a41d73a39287053b7ff7e365))
* Frontmatter tags display similar to Children ([#1285](https://github.com/dendronhq/dendron/issues/1285)) ([a0ce014](https://github.com/dendronhq/dendron/commit/a0ce01469bd0de17768d1aff2711807425027d87))
* slugify github issue title ([#1218](https://github.com/dendronhq/dendron/issues/1218)) ([e6c2638](https://github.com/dendronhq/dendron/commit/e6c26380abd68f076dbe1d8ed542327c3ff558f3))


### Features Dendron

* dendron publishing with nextjs commands ([#1266](https://github.com/dendronhq/dendron/issues/1266)) ([fb90e98](https://github.com/dendronhq/dendron/commit/fb90e98999c1073b58480eb7364f6a70e31a6903))
* enable usePrettyRefs for nextJS publishing and preview ([#1239](https://github.com/dendronhq/dendron/issues/1239)) ([8a456a9](https://github.com/dendronhq/dendron/commit/8a456a910c45e927c8413d881324bd28401e2aca))
* extended images for custom CSS properties ([#1315](https://github.com/dendronhq/dendron/issues/1315)) ([f9ed88f](https://github.com/dendronhq/dendron/commit/f9ed88ff91916c444607d7842027c79085d077ae)), closes [#1273](https://github.com/dendronhq/dendron/issues/1273)
* github publish to create new issue ([#1206](https://github.com/dendronhq/dendron/issues/1206)) ([67abef0](https://github.com/dendronhq/dendron/commit/67abef02c5615385a8a7f82fe290c8a443605a7f))
* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* user tag autocomplete & user tags updated on rename ([#1278](https://github.com/dendronhq/dendron/issues/1278)) ([9719f99](https://github.com/dendronhq/dendron/commit/9719f99550a2c51c1a22f6fb21ff750bb4115f89))
* user tags ([#1228](https://github.com/dendronhq/dendron/issues/1228)) ([98c0106](https://github.com/dendronhq/dendron/commit/98c0106367e384c130a927484b9ea294eb6f84fa))



## 0.55.2 (2021-08-21)


### Bug Fixes

* don't insert title when rendering note refs in preview ([#1157](https://github.com/dendronhq/dendron/issues/1157)) ([9d447af](https://github.com/dendronhq/dendron/commit/9d447af8ad7381bb8d3078fc44d4a188618acdfd))
* wrong internal links in nextjs publishing ([#1165](https://github.com/dendronhq/dendron/issues/1165)) ([59a949d](https://github.com/dendronhq/dendron/commit/59a949d2b5b541efb283e851060636b108eb5a98))



## 0.55.1 (2021-08-17)


### Features Dendron

* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* add new vaults from CLI to code workspace ([#1094](https://github.com/dendronhq/dendron/issues/1094)) ([2cde108](https://github.com/dendronhq/dendron/commit/2cde108b4c88a5c9d13b8eb6370f69879d6c9a62))
* CopyNoteLink copies footnotes as anchors ([#1117](https://github.com/dendronhq/dendron/issues/1117)) ([2168991](https://github.com/dendronhq/dendron/commit/21689914d0c84735d243b988dcceb276df97380f))
* frontmatter tags ([#1104](https://github.com/dendronhq/dendron/issues/1104)) ([e4c022f](https://github.com/dendronhq/dendron/commit/e4c022f422b1ce020215d59d2658218f10c75250))
* leading slash in markdown export pod ([#1136](https://github.com/dendronhq/dendron/issues/1136)) ([0f8ebbf](https://github.com/dendronhq/dendron/commit/0f8ebbf228f7af1bbbf677c9fea38989f87c635e))


### Features Dendron

* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))
* remove frontmatter tags if tag is moved outside `tags.` ([1bce9af](https://github.com/dendronhq/dendron/commit/1bce9af293a60fd453389a907fc3043fe173330c))
* seed cmds in plugin ([#1080](https://github.com/dendronhq/dendron/issues/1080)) ([e07a092](https://github.com/dendronhq/dendron/commit/e07a092b1a75548574f2ea45f1b465490b2091f3))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.59.3-alpha.1](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.59.3-alpha.1) (2021-09-20)


### Bug Fixes

* wrong assetPrefix in 11ty ([e5cb251](https://github.com/dendronhq/dendron/commit/e5cb251afbd6b76cbb52ab5046e7ca4ac816e06c))
* **commands:** rename note leaves incorrect metadata if parent is a stub ([#1348](https://github.com/dendronhq/dendron/issues/1348)) ([d432cc9](https://github.com/dendronhq/dendron/commit/d432cc9e20ff8b9f6cefd7cc4c3a42b567ed9bc5))
* block anchor in list with single top level element ([#1242](https://github.com/dendronhq/dendron/issues/1242)) ([1ce3a21](https://github.com/dendronhq/dendron/commit/1ce3a216047d5a1a1638509cdc92e36e7ec86a1c)), closes [#1235](https://github.com/dendronhq/dendron/issues/1235)
* block anchors attached to code blocks in publishing ([#1267](https://github.com/dendronhq/dendron/issues/1267)) ([6b3c71c](https://github.com/dendronhq/dendron/commit/6b3c71cd6728dfee7eaa74db9f9b8168ad7a2e39))
* correctly render cross-vault note references in preview v2 ([#1310](https://github.com/dendronhq/dendron/issues/1310)) ([1198449](https://github.com/dendronhq/dendron/commit/11984494ca7c889790a0c0288fe97b8687398e4f))
* direct children query ([#1303](https://github.com/dendronhq/dendron/issues/1303)) ([bcf0dea](https://github.com/dendronhq/dendron/commit/bcf0deae422406564cd9a56c1765f90dd2e66215))
* exclude private vault backlinks ([#1301](https://github.com/dendronhq/dendron/issues/1301)) ([837c50e](https://github.com/dendronhq/dendron/commit/837c50efad4d80d4a41d73a39287053b7ff7e365))
* Frontmatter tags display similar to Children ([#1285](https://github.com/dendronhq/dendron/issues/1285)) ([a0ce014](https://github.com/dendronhq/dendron/commit/a0ce01469bd0de17768d1aff2711807425027d87))
* slugify github issue title ([#1218](https://github.com/dendronhq/dendron/issues/1218)) ([e6c2638](https://github.com/dendronhq/dendron/commit/e6c26380abd68f076dbe1d8ed542327c3ff558f3))


### Features Dendron

* dendron publishing with nextjs commands ([#1266](https://github.com/dendronhq/dendron/issues/1266)) ([fb90e98](https://github.com/dendronhq/dendron/commit/fb90e98999c1073b58480eb7364f6a70e31a6903))
* enable usePrettyRefs for nextJS publishing and preview ([#1239](https://github.com/dendronhq/dendron/issues/1239)) ([8a456a9](https://github.com/dendronhq/dendron/commit/8a456a910c45e927c8413d881324bd28401e2aca))
* extended images for custom CSS properties ([#1315](https://github.com/dendronhq/dendron/issues/1315)) ([f9ed88f](https://github.com/dendronhq/dendron/commit/f9ed88ff91916c444607d7842027c79085d077ae)), closes [#1273](https://github.com/dendronhq/dendron/issues/1273)
* github publish to create new issue ([#1206](https://github.com/dendronhq/dendron/issues/1206)) ([67abef0](https://github.com/dendronhq/dendron/commit/67abef02c5615385a8a7f82fe290c8a443605a7f))
* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* user tag autocomplete & user tags updated on rename ([#1278](https://github.com/dendronhq/dendron/issues/1278)) ([9719f99](https://github.com/dendronhq/dendron/commit/9719f99550a2c51c1a22f6fb21ff750bb4115f89))
* user tags ([#1228](https://github.com/dendronhq/dendron/issues/1228)) ([98c0106](https://github.com/dendronhq/dendron/commit/98c0106367e384c130a927484b9ea294eb6f84fa))



## 0.55.2 (2021-08-21)


### Bug Fixes

* don't insert title when rendering note refs in preview ([#1157](https://github.com/dendronhq/dendron/issues/1157)) ([9d447af](https://github.com/dendronhq/dendron/commit/9d447af8ad7381bb8d3078fc44d4a188618acdfd))
* wrong internal links in nextjs publishing ([#1165](https://github.com/dendronhq/dendron/issues/1165)) ([59a949d](https://github.com/dendronhq/dendron/commit/59a949d2b5b541efb283e851060636b108eb5a98))



## 0.55.1 (2021-08-17)


### Features Dendron

* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* add new vaults from CLI to code workspace ([#1094](https://github.com/dendronhq/dendron/issues/1094)) ([2cde108](https://github.com/dendronhq/dendron/commit/2cde108b4c88a5c9d13b8eb6370f69879d6c9a62))
* CopyNoteLink copies footnotes as anchors ([#1117](https://github.com/dendronhq/dendron/issues/1117)) ([2168991](https://github.com/dendronhq/dendron/commit/21689914d0c84735d243b988dcceb276df97380f))
* frontmatter tags ([#1104](https://github.com/dendronhq/dendron/issues/1104)) ([e4c022f](https://github.com/dendronhq/dendron/commit/e4c022f422b1ce020215d59d2658218f10c75250))
* leading slash in markdown export pod ([#1136](https://github.com/dendronhq/dendron/issues/1136)) ([0f8ebbf](https://github.com/dendronhq/dendron/commit/0f8ebbf228f7af1bbbf677c9fea38989f87c635e))


### Features Dendron

* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))
* remove frontmatter tags if tag is moved outside `tags.` ([1bce9af](https://github.com/dendronhq/dendron/commit/1bce9af293a60fd453389a907fc3043fe173330c))
* seed cmds in plugin ([#1080](https://github.com/dendronhq/dendron/issues/1080)) ([e07a092](https://github.com/dendronhq/dendron/commit/e07a092b1a75548574f2ea45f1b465490b2091f3))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.59.3-alpha.0](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.59.3-alpha.0) (2021-09-19)


### Bug Fixes

* wrong assetPrefix in 11ty ([e5cb251](https://github.com/dendronhq/dendron/commit/e5cb251afbd6b76cbb52ab5046e7ca4ac816e06c))
* **commands:** rename note leaves incorrect metadata if parent is a stub ([#1348](https://github.com/dendronhq/dendron/issues/1348)) ([d432cc9](https://github.com/dendronhq/dendron/commit/d432cc9e20ff8b9f6cefd7cc4c3a42b567ed9bc5))
* block anchor in list with single top level element ([#1242](https://github.com/dendronhq/dendron/issues/1242)) ([1ce3a21](https://github.com/dendronhq/dendron/commit/1ce3a216047d5a1a1638509cdc92e36e7ec86a1c)), closes [#1235](https://github.com/dendronhq/dendron/issues/1235)
* block anchors attached to code blocks in publishing ([#1267](https://github.com/dendronhq/dendron/issues/1267)) ([6b3c71c](https://github.com/dendronhq/dendron/commit/6b3c71cd6728dfee7eaa74db9f9b8168ad7a2e39))
* correctly render cross-vault note references in preview v2 ([#1310](https://github.com/dendronhq/dendron/issues/1310)) ([1198449](https://github.com/dendronhq/dendron/commit/11984494ca7c889790a0c0288fe97b8687398e4f))
* direct children query ([#1303](https://github.com/dendronhq/dendron/issues/1303)) ([bcf0dea](https://github.com/dendronhq/dendron/commit/bcf0deae422406564cd9a56c1765f90dd2e66215))
* exclude private vault backlinks ([#1301](https://github.com/dendronhq/dendron/issues/1301)) ([837c50e](https://github.com/dendronhq/dendron/commit/837c50efad4d80d4a41d73a39287053b7ff7e365))
* Frontmatter tags display similar to Children ([#1285](https://github.com/dendronhq/dendron/issues/1285)) ([a0ce014](https://github.com/dendronhq/dendron/commit/a0ce01469bd0de17768d1aff2711807425027d87))
* slugify github issue title ([#1218](https://github.com/dendronhq/dendron/issues/1218)) ([e6c2638](https://github.com/dendronhq/dendron/commit/e6c26380abd68f076dbe1d8ed542327c3ff558f3))


### Features Dendron

* dendron publishing with nextjs commands ([#1266](https://github.com/dendronhq/dendron/issues/1266)) ([fb90e98](https://github.com/dendronhq/dendron/commit/fb90e98999c1073b58480eb7364f6a70e31a6903))
* enable usePrettyRefs for nextJS publishing and preview ([#1239](https://github.com/dendronhq/dendron/issues/1239)) ([8a456a9](https://github.com/dendronhq/dendron/commit/8a456a910c45e927c8413d881324bd28401e2aca))
* extended images for custom CSS properties ([#1315](https://github.com/dendronhq/dendron/issues/1315)) ([f9ed88f](https://github.com/dendronhq/dendron/commit/f9ed88ff91916c444607d7842027c79085d077ae)), closes [#1273](https://github.com/dendronhq/dendron/issues/1273)
* github publish to create new issue ([#1206](https://github.com/dendronhq/dendron/issues/1206)) ([67abef0](https://github.com/dendronhq/dendron/commit/67abef02c5615385a8a7f82fe290c8a443605a7f))
* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* user tag autocomplete & user tags updated on rename ([#1278](https://github.com/dendronhq/dendron/issues/1278)) ([9719f99](https://github.com/dendronhq/dendron/commit/9719f99550a2c51c1a22f6fb21ff750bb4115f89))
* user tags ([#1228](https://github.com/dendronhq/dendron/issues/1228)) ([98c0106](https://github.com/dendronhq/dendron/commit/98c0106367e384c130a927484b9ea294eb6f84fa))



## 0.55.2 (2021-08-21)


### Bug Fixes

* don't insert title when rendering note refs in preview ([#1157](https://github.com/dendronhq/dendron/issues/1157)) ([9d447af](https://github.com/dendronhq/dendron/commit/9d447af8ad7381bb8d3078fc44d4a188618acdfd))
* wrong internal links in nextjs publishing ([#1165](https://github.com/dendronhq/dendron/issues/1165)) ([59a949d](https://github.com/dendronhq/dendron/commit/59a949d2b5b541efb283e851060636b108eb5a98))



## 0.55.1 (2021-08-17)


### Features Dendron

* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* add new vaults from CLI to code workspace ([#1094](https://github.com/dendronhq/dendron/issues/1094)) ([2cde108](https://github.com/dendronhq/dendron/commit/2cde108b4c88a5c9d13b8eb6370f69879d6c9a62))
* CopyNoteLink copies footnotes as anchors ([#1117](https://github.com/dendronhq/dendron/issues/1117)) ([2168991](https://github.com/dendronhq/dendron/commit/21689914d0c84735d243b988dcceb276df97380f))
* frontmatter tags ([#1104](https://github.com/dendronhq/dendron/issues/1104)) ([e4c022f](https://github.com/dendronhq/dendron/commit/e4c022f422b1ce020215d59d2658218f10c75250))
* leading slash in markdown export pod ([#1136](https://github.com/dendronhq/dendron/issues/1136)) ([0f8ebbf](https://github.com/dendronhq/dendron/commit/0f8ebbf228f7af1bbbf677c9fea38989f87c635e))


### Features Dendron

* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))
* remove frontmatter tags if tag is moved outside `tags.` ([1bce9af](https://github.com/dendronhq/dendron/commit/1bce9af293a60fd453389a907fc3043fe173330c))
* seed cmds in plugin ([#1080](https://github.com/dendronhq/dendron/issues/1080)) ([e07a092](https://github.com/dendronhq/dendron/commit/e07a092b1a75548574f2ea45f1b465490b2091f3))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.59.2](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.59.2) (2021-09-17)


### Bug Fixes

* **commands:** rename note leaves incorrect metadata if parent is a stub ([#1348](https://github.com/dendronhq/dendron/issues/1348)) ([d432cc9](https://github.com/dendronhq/dendron/commit/d432cc9e20ff8b9f6cefd7cc4c3a42b567ed9bc5))
* block anchor in list with single top level element ([#1242](https://github.com/dendronhq/dendron/issues/1242)) ([1ce3a21](https://github.com/dendronhq/dendron/commit/1ce3a216047d5a1a1638509cdc92e36e7ec86a1c)), closes [#1235](https://github.com/dendronhq/dendron/issues/1235)
* block anchors attached to code blocks in publishing ([#1267](https://github.com/dendronhq/dendron/issues/1267)) ([6b3c71c](https://github.com/dendronhq/dendron/commit/6b3c71cd6728dfee7eaa74db9f9b8168ad7a2e39))
* correctly render cross-vault note references in preview v2 ([#1310](https://github.com/dendronhq/dendron/issues/1310)) ([1198449](https://github.com/dendronhq/dendron/commit/11984494ca7c889790a0c0288fe97b8687398e4f))
* direct children query ([#1303](https://github.com/dendronhq/dendron/issues/1303)) ([bcf0dea](https://github.com/dendronhq/dendron/commit/bcf0deae422406564cd9a56c1765f90dd2e66215))
* exclude private vault backlinks ([#1301](https://github.com/dendronhq/dendron/issues/1301)) ([837c50e](https://github.com/dendronhq/dendron/commit/837c50efad4d80d4a41d73a39287053b7ff7e365))
* Frontmatter tags display similar to Children ([#1285](https://github.com/dendronhq/dendron/issues/1285)) ([a0ce014](https://github.com/dendronhq/dendron/commit/a0ce01469bd0de17768d1aff2711807425027d87))
* slugify github issue title ([#1218](https://github.com/dendronhq/dendron/issues/1218)) ([e6c2638](https://github.com/dendronhq/dendron/commit/e6c26380abd68f076dbe1d8ed542327c3ff558f3))


### Features Dendron

* dendron publishing with nextjs commands ([#1266](https://github.com/dendronhq/dendron/issues/1266)) ([fb90e98](https://github.com/dendronhq/dendron/commit/fb90e98999c1073b58480eb7364f6a70e31a6903))
* enable usePrettyRefs for nextJS publishing and preview ([#1239](https://github.com/dendronhq/dendron/issues/1239)) ([8a456a9](https://github.com/dendronhq/dendron/commit/8a456a910c45e927c8413d881324bd28401e2aca))
* extended images for custom CSS properties ([#1315](https://github.com/dendronhq/dendron/issues/1315)) ([f9ed88f](https://github.com/dendronhq/dendron/commit/f9ed88ff91916c444607d7842027c79085d077ae)), closes [#1273](https://github.com/dendronhq/dendron/issues/1273)
* github publish to create new issue ([#1206](https://github.com/dendronhq/dendron/issues/1206)) ([67abef0](https://github.com/dendronhq/dendron/commit/67abef02c5615385a8a7f82fe290c8a443605a7f))
* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* user tag autocomplete & user tags updated on rename ([#1278](https://github.com/dendronhq/dendron/issues/1278)) ([9719f99](https://github.com/dendronhq/dendron/commit/9719f99550a2c51c1a22f6fb21ff750bb4115f89))
* user tags ([#1228](https://github.com/dendronhq/dendron/issues/1228)) ([98c0106](https://github.com/dendronhq/dendron/commit/98c0106367e384c130a927484b9ea294eb6f84fa))



## 0.55.2 (2021-08-21)


### Bug Fixes

* don't insert title when rendering note refs in preview ([#1157](https://github.com/dendronhq/dendron/issues/1157)) ([9d447af](https://github.com/dendronhq/dendron/commit/9d447af8ad7381bb8d3078fc44d4a188618acdfd))
* wrong internal links in nextjs publishing ([#1165](https://github.com/dendronhq/dendron/issues/1165)) ([59a949d](https://github.com/dendronhq/dendron/commit/59a949d2b5b541efb283e851060636b108eb5a98))



## 0.55.1 (2021-08-17)


### Features Dendron

* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* add new vaults from CLI to code workspace ([#1094](https://github.com/dendronhq/dendron/issues/1094)) ([2cde108](https://github.com/dendronhq/dendron/commit/2cde108b4c88a5c9d13b8eb6370f69879d6c9a62))
* CopyNoteLink copies footnotes as anchors ([#1117](https://github.com/dendronhq/dendron/issues/1117)) ([2168991](https://github.com/dendronhq/dendron/commit/21689914d0c84735d243b988dcceb276df97380f))
* frontmatter tags ([#1104](https://github.com/dendronhq/dendron/issues/1104)) ([e4c022f](https://github.com/dendronhq/dendron/commit/e4c022f422b1ce020215d59d2658218f10c75250))
* leading slash in markdown export pod ([#1136](https://github.com/dendronhq/dendron/issues/1136)) ([0f8ebbf](https://github.com/dendronhq/dendron/commit/0f8ebbf228f7af1bbbf677c9fea38989f87c635e))


### Features Dendron

* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))
* remove frontmatter tags if tag is moved outside `tags.` ([1bce9af](https://github.com/dendronhq/dendron/commit/1bce9af293a60fd453389a907fc3043fe173330c))
* seed cmds in plugin ([#1080](https://github.com/dendronhq/dendron/issues/1080)) ([e07a092](https://github.com/dendronhq/dendron/commit/e07a092b1a75548574f2ea45f1b465490b2091f3))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.59.1](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.59.1) (2021-09-16)


### Bug Fixes

* block anchor in list with single top level element ([#1242](https://github.com/dendronhq/dendron/issues/1242)) ([1ce3a21](https://github.com/dendronhq/dendron/commit/1ce3a216047d5a1a1638509cdc92e36e7ec86a1c)), closes [#1235](https://github.com/dendronhq/dendron/issues/1235)
* block anchors attached to code blocks in publishing ([#1267](https://github.com/dendronhq/dendron/issues/1267)) ([6b3c71c](https://github.com/dendronhq/dendron/commit/6b3c71cd6728dfee7eaa74db9f9b8168ad7a2e39))
* correctly render cross-vault note references in preview v2 ([#1310](https://github.com/dendronhq/dendron/issues/1310)) ([1198449](https://github.com/dendronhq/dendron/commit/11984494ca7c889790a0c0288fe97b8687398e4f))
* direct children query ([#1303](https://github.com/dendronhq/dendron/issues/1303)) ([bcf0dea](https://github.com/dendronhq/dendron/commit/bcf0deae422406564cd9a56c1765f90dd2e66215))
* exclude private vault backlinks ([#1301](https://github.com/dendronhq/dendron/issues/1301)) ([837c50e](https://github.com/dendronhq/dendron/commit/837c50efad4d80d4a41d73a39287053b7ff7e365))
* Frontmatter tags display similar to Children ([#1285](https://github.com/dendronhq/dendron/issues/1285)) ([a0ce014](https://github.com/dendronhq/dendron/commit/a0ce01469bd0de17768d1aff2711807425027d87))
* slugify github issue title ([#1218](https://github.com/dendronhq/dendron/issues/1218)) ([e6c2638](https://github.com/dendronhq/dendron/commit/e6c26380abd68f076dbe1d8ed542327c3ff558f3))


### Features Dendron

* dendron publishing with nextjs commands ([#1266](https://github.com/dendronhq/dendron/issues/1266)) ([fb90e98](https://github.com/dendronhq/dendron/commit/fb90e98999c1073b58480eb7364f6a70e31a6903))
* enable usePrettyRefs for nextJS publishing and preview ([#1239](https://github.com/dendronhq/dendron/issues/1239)) ([8a456a9](https://github.com/dendronhq/dendron/commit/8a456a910c45e927c8413d881324bd28401e2aca))
* extended images for custom CSS properties ([#1315](https://github.com/dendronhq/dendron/issues/1315)) ([f9ed88f](https://github.com/dendronhq/dendron/commit/f9ed88ff91916c444607d7842027c79085d077ae)), closes [#1273](https://github.com/dendronhq/dendron/issues/1273)
* github publish to create new issue ([#1206](https://github.com/dendronhq/dendron/issues/1206)) ([67abef0](https://github.com/dendronhq/dendron/commit/67abef02c5615385a8a7f82fe290c8a443605a7f))
* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* user tag autocomplete & user tags updated on rename ([#1278](https://github.com/dendronhq/dendron/issues/1278)) ([9719f99](https://github.com/dendronhq/dendron/commit/9719f99550a2c51c1a22f6fb21ff750bb4115f89))
* user tags ([#1228](https://github.com/dendronhq/dendron/issues/1228)) ([98c0106](https://github.com/dendronhq/dendron/commit/98c0106367e384c130a927484b9ea294eb6f84fa))



## 0.55.2 (2021-08-21)


### Bug Fixes

* don't insert title when rendering note refs in preview ([#1157](https://github.com/dendronhq/dendron/issues/1157)) ([9d447af](https://github.com/dendronhq/dendron/commit/9d447af8ad7381bb8d3078fc44d4a188618acdfd))
* wrong internal links in nextjs publishing ([#1165](https://github.com/dendronhq/dendron/issues/1165)) ([59a949d](https://github.com/dendronhq/dendron/commit/59a949d2b5b541efb283e851060636b108eb5a98))



## 0.55.1 (2021-08-17)


### Features Dendron

* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* add new vaults from CLI to code workspace ([#1094](https://github.com/dendronhq/dendron/issues/1094)) ([2cde108](https://github.com/dendronhq/dendron/commit/2cde108b4c88a5c9d13b8eb6370f69879d6c9a62))
* CopyNoteLink copies footnotes as anchors ([#1117](https://github.com/dendronhq/dendron/issues/1117)) ([2168991](https://github.com/dendronhq/dendron/commit/21689914d0c84735d243b988dcceb276df97380f))
* frontmatter tags ([#1104](https://github.com/dendronhq/dendron/issues/1104)) ([e4c022f](https://github.com/dendronhq/dendron/commit/e4c022f422b1ce020215d59d2658218f10c75250))
* leading slash in markdown export pod ([#1136](https://github.com/dendronhq/dendron/issues/1136)) ([0f8ebbf](https://github.com/dendronhq/dendron/commit/0f8ebbf228f7af1bbbf677c9fea38989f87c635e))


### Features Dendron

* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))
* remove frontmatter tags if tag is moved outside `tags.` ([1bce9af](https://github.com/dendronhq/dendron/commit/1bce9af293a60fd453389a907fc3043fe173330c))
* seed cmds in plugin ([#1080](https://github.com/dendronhq/dendron/issues/1080)) ([e07a092](https://github.com/dendronhq/dendron/commit/e07a092b1a75548574f2ea45f1b465490b2091f3))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.59.2-alpha.5](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.59.2-alpha.5) (2021-09-15)


### Bug Fixes

* block anchor in list with single top level element ([#1242](https://github.com/dendronhq/dendron/issues/1242)) ([1ce3a21](https://github.com/dendronhq/dendron/commit/1ce3a216047d5a1a1638509cdc92e36e7ec86a1c)), closes [#1235](https://github.com/dendronhq/dendron/issues/1235)
* block anchors attached to code blocks in publishing ([#1267](https://github.com/dendronhq/dendron/issues/1267)) ([6b3c71c](https://github.com/dendronhq/dendron/commit/6b3c71cd6728dfee7eaa74db9f9b8168ad7a2e39))
* correctly render cross-vault note references in preview v2 ([#1310](https://github.com/dendronhq/dendron/issues/1310)) ([1198449](https://github.com/dendronhq/dendron/commit/11984494ca7c889790a0c0288fe97b8687398e4f))
* direct children query ([#1303](https://github.com/dendronhq/dendron/issues/1303)) ([bcf0dea](https://github.com/dendronhq/dendron/commit/bcf0deae422406564cd9a56c1765f90dd2e66215))
* exclude private vault backlinks ([#1301](https://github.com/dendronhq/dendron/issues/1301)) ([837c50e](https://github.com/dendronhq/dendron/commit/837c50efad4d80d4a41d73a39287053b7ff7e365))
* Frontmatter tags display similar to Children ([#1285](https://github.com/dendronhq/dendron/issues/1285)) ([a0ce014](https://github.com/dendronhq/dendron/commit/a0ce01469bd0de17768d1aff2711807425027d87))
* slugify github issue title ([#1218](https://github.com/dendronhq/dendron/issues/1218)) ([e6c2638](https://github.com/dendronhq/dendron/commit/e6c26380abd68f076dbe1d8ed542327c3ff558f3))


### Features Dendron

* dendron publishing with nextjs commands ([#1266](https://github.com/dendronhq/dendron/issues/1266)) ([fb90e98](https://github.com/dendronhq/dendron/commit/fb90e98999c1073b58480eb7364f6a70e31a6903))
* enable usePrettyRefs for nextJS publishing and preview ([#1239](https://github.com/dendronhq/dendron/issues/1239)) ([8a456a9](https://github.com/dendronhq/dendron/commit/8a456a910c45e927c8413d881324bd28401e2aca))
* extended images for custom CSS properties ([#1315](https://github.com/dendronhq/dendron/issues/1315)) ([f9ed88f](https://github.com/dendronhq/dendron/commit/f9ed88ff91916c444607d7842027c79085d077ae)), closes [#1273](https://github.com/dendronhq/dendron/issues/1273)
* github publish to create new issue ([#1206](https://github.com/dendronhq/dendron/issues/1206)) ([67abef0](https://github.com/dendronhq/dendron/commit/67abef02c5615385a8a7f82fe290c8a443605a7f))
* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* user tag autocomplete & user tags updated on rename ([#1278](https://github.com/dendronhq/dendron/issues/1278)) ([9719f99](https://github.com/dendronhq/dendron/commit/9719f99550a2c51c1a22f6fb21ff750bb4115f89))
* user tags ([#1228](https://github.com/dendronhq/dendron/issues/1228)) ([98c0106](https://github.com/dendronhq/dendron/commit/98c0106367e384c130a927484b9ea294eb6f84fa))



## 0.55.2 (2021-08-21)


### Bug Fixes

* don't insert title when rendering note refs in preview ([#1157](https://github.com/dendronhq/dendron/issues/1157)) ([9d447af](https://github.com/dendronhq/dendron/commit/9d447af8ad7381bb8d3078fc44d4a188618acdfd))
* wrong internal links in nextjs publishing ([#1165](https://github.com/dendronhq/dendron/issues/1165)) ([59a949d](https://github.com/dendronhq/dendron/commit/59a949d2b5b541efb283e851060636b108eb5a98))



## 0.55.1 (2021-08-17)


### Features Dendron

* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* add new vaults from CLI to code workspace ([#1094](https://github.com/dendronhq/dendron/issues/1094)) ([2cde108](https://github.com/dendronhq/dendron/commit/2cde108b4c88a5c9d13b8eb6370f69879d6c9a62))
* CopyNoteLink copies footnotes as anchors ([#1117](https://github.com/dendronhq/dendron/issues/1117)) ([2168991](https://github.com/dendronhq/dendron/commit/21689914d0c84735d243b988dcceb276df97380f))
* frontmatter tags ([#1104](https://github.com/dendronhq/dendron/issues/1104)) ([e4c022f](https://github.com/dendronhq/dendron/commit/e4c022f422b1ce020215d59d2658218f10c75250))
* leading slash in markdown export pod ([#1136](https://github.com/dendronhq/dendron/issues/1136)) ([0f8ebbf](https://github.com/dendronhq/dendron/commit/0f8ebbf228f7af1bbbf677c9fea38989f87c635e))


### Features Dendron

* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))
* remove frontmatter tags if tag is moved outside `tags.` ([1bce9af](https://github.com/dendronhq/dendron/commit/1bce9af293a60fd453389a907fc3043fe173330c))
* seed cmds in plugin ([#1080](https://github.com/dendronhq/dendron/issues/1080)) ([e07a092](https://github.com/dendronhq/dendron/commit/e07a092b1a75548574f2ea45f1b465490b2091f3))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.59.2-alpha.4](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.59.2-alpha.4) (2021-09-15)


### Bug Fixes

* block anchor in list with single top level element ([#1242](https://github.com/dendronhq/dendron/issues/1242)) ([1ce3a21](https://github.com/dendronhq/dendron/commit/1ce3a216047d5a1a1638509cdc92e36e7ec86a1c)), closes [#1235](https://github.com/dendronhq/dendron/issues/1235)
* block anchors attached to code blocks in publishing ([#1267](https://github.com/dendronhq/dendron/issues/1267)) ([6b3c71c](https://github.com/dendronhq/dendron/commit/6b3c71cd6728dfee7eaa74db9f9b8168ad7a2e39))
* correctly render cross-vault note references in preview v2 ([#1310](https://github.com/dendronhq/dendron/issues/1310)) ([1198449](https://github.com/dendronhq/dendron/commit/11984494ca7c889790a0c0288fe97b8687398e4f))
* direct children query ([#1303](https://github.com/dendronhq/dendron/issues/1303)) ([bcf0dea](https://github.com/dendronhq/dendron/commit/bcf0deae422406564cd9a56c1765f90dd2e66215))
* exclude private vault backlinks ([#1301](https://github.com/dendronhq/dendron/issues/1301)) ([837c50e](https://github.com/dendronhq/dendron/commit/837c50efad4d80d4a41d73a39287053b7ff7e365))
* Frontmatter tags display similar to Children ([#1285](https://github.com/dendronhq/dendron/issues/1285)) ([a0ce014](https://github.com/dendronhq/dendron/commit/a0ce01469bd0de17768d1aff2711807425027d87))
* slugify github issue title ([#1218](https://github.com/dendronhq/dendron/issues/1218)) ([e6c2638](https://github.com/dendronhq/dendron/commit/e6c26380abd68f076dbe1d8ed542327c3ff558f3))


### Features Dendron

* dendron publishing with nextjs commands ([#1266](https://github.com/dendronhq/dendron/issues/1266)) ([fb90e98](https://github.com/dendronhq/dendron/commit/fb90e98999c1073b58480eb7364f6a70e31a6903))
* enable usePrettyRefs for nextJS publishing and preview ([#1239](https://github.com/dendronhq/dendron/issues/1239)) ([8a456a9](https://github.com/dendronhq/dendron/commit/8a456a910c45e927c8413d881324bd28401e2aca))
* extended images for custom CSS properties ([#1315](https://github.com/dendronhq/dendron/issues/1315)) ([f9ed88f](https://github.com/dendronhq/dendron/commit/f9ed88ff91916c444607d7842027c79085d077ae)), closes [#1273](https://github.com/dendronhq/dendron/issues/1273)
* github publish to create new issue ([#1206](https://github.com/dendronhq/dendron/issues/1206)) ([67abef0](https://github.com/dendronhq/dendron/commit/67abef02c5615385a8a7f82fe290c8a443605a7f))
* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* user tag autocomplete & user tags updated on rename ([#1278](https://github.com/dendronhq/dendron/issues/1278)) ([9719f99](https://github.com/dendronhq/dendron/commit/9719f99550a2c51c1a22f6fb21ff750bb4115f89))
* user tags ([#1228](https://github.com/dendronhq/dendron/issues/1228)) ([98c0106](https://github.com/dendronhq/dendron/commit/98c0106367e384c130a927484b9ea294eb6f84fa))



## 0.55.2 (2021-08-21)


### Bug Fixes

* don't insert title when rendering note refs in preview ([#1157](https://github.com/dendronhq/dendron/issues/1157)) ([9d447af](https://github.com/dendronhq/dendron/commit/9d447af8ad7381bb8d3078fc44d4a188618acdfd))
* wrong internal links in nextjs publishing ([#1165](https://github.com/dendronhq/dendron/issues/1165)) ([59a949d](https://github.com/dendronhq/dendron/commit/59a949d2b5b541efb283e851060636b108eb5a98))



## 0.55.1 (2021-08-17)


### Features Dendron

* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* add new vaults from CLI to code workspace ([#1094](https://github.com/dendronhq/dendron/issues/1094)) ([2cde108](https://github.com/dendronhq/dendron/commit/2cde108b4c88a5c9d13b8eb6370f69879d6c9a62))
* CopyNoteLink copies footnotes as anchors ([#1117](https://github.com/dendronhq/dendron/issues/1117)) ([2168991](https://github.com/dendronhq/dendron/commit/21689914d0c84735d243b988dcceb276df97380f))
* frontmatter tags ([#1104](https://github.com/dendronhq/dendron/issues/1104)) ([e4c022f](https://github.com/dendronhq/dendron/commit/e4c022f422b1ce020215d59d2658218f10c75250))
* leading slash in markdown export pod ([#1136](https://github.com/dendronhq/dendron/issues/1136)) ([0f8ebbf](https://github.com/dendronhq/dendron/commit/0f8ebbf228f7af1bbbf677c9fea38989f87c635e))


### Features Dendron

* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))
* remove frontmatter tags if tag is moved outside `tags.` ([1bce9af](https://github.com/dendronhq/dendron/commit/1bce9af293a60fd453389a907fc3043fe173330c))
* seed cmds in plugin ([#1080](https://github.com/dendronhq/dendron/issues/1080)) ([e07a092](https://github.com/dendronhq/dendron/commit/e07a092b1a75548574f2ea45f1b465490b2091f3))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.59.2-alpha.3](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.59.2-alpha.3) (2021-09-15)


### Bug Fixes

* block anchor in list with single top level element ([#1242](https://github.com/dendronhq/dendron/issues/1242)) ([1ce3a21](https://github.com/dendronhq/dendron/commit/1ce3a216047d5a1a1638509cdc92e36e7ec86a1c)), closes [#1235](https://github.com/dendronhq/dendron/issues/1235)
* block anchors attached to code blocks in publishing ([#1267](https://github.com/dendronhq/dendron/issues/1267)) ([6b3c71c](https://github.com/dendronhq/dendron/commit/6b3c71cd6728dfee7eaa74db9f9b8168ad7a2e39))
* correctly render cross-vault note references in preview v2 ([#1310](https://github.com/dendronhq/dendron/issues/1310)) ([1198449](https://github.com/dendronhq/dendron/commit/11984494ca7c889790a0c0288fe97b8687398e4f))
* direct children query ([#1303](https://github.com/dendronhq/dendron/issues/1303)) ([bcf0dea](https://github.com/dendronhq/dendron/commit/bcf0deae422406564cd9a56c1765f90dd2e66215))
* exclude private vault backlinks ([#1301](https://github.com/dendronhq/dendron/issues/1301)) ([837c50e](https://github.com/dendronhq/dendron/commit/837c50efad4d80d4a41d73a39287053b7ff7e365))
* Frontmatter tags display similar to Children ([#1285](https://github.com/dendronhq/dendron/issues/1285)) ([a0ce014](https://github.com/dendronhq/dendron/commit/a0ce01469bd0de17768d1aff2711807425027d87))
* slugify github issue title ([#1218](https://github.com/dendronhq/dendron/issues/1218)) ([e6c2638](https://github.com/dendronhq/dendron/commit/e6c26380abd68f076dbe1d8ed542327c3ff558f3))


### Features Dendron

* dendron publishing with nextjs commands ([#1266](https://github.com/dendronhq/dendron/issues/1266)) ([fb90e98](https://github.com/dendronhq/dendron/commit/fb90e98999c1073b58480eb7364f6a70e31a6903))
* enable usePrettyRefs for nextJS publishing and preview ([#1239](https://github.com/dendronhq/dendron/issues/1239)) ([8a456a9](https://github.com/dendronhq/dendron/commit/8a456a910c45e927c8413d881324bd28401e2aca))
* extended images for custom CSS properties ([#1315](https://github.com/dendronhq/dendron/issues/1315)) ([f9ed88f](https://github.com/dendronhq/dendron/commit/f9ed88ff91916c444607d7842027c79085d077ae)), closes [#1273](https://github.com/dendronhq/dendron/issues/1273)
* github publish to create new issue ([#1206](https://github.com/dendronhq/dendron/issues/1206)) ([67abef0](https://github.com/dendronhq/dendron/commit/67abef02c5615385a8a7f82fe290c8a443605a7f))
* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* user tag autocomplete & user tags updated on rename ([#1278](https://github.com/dendronhq/dendron/issues/1278)) ([9719f99](https://github.com/dendronhq/dendron/commit/9719f99550a2c51c1a22f6fb21ff750bb4115f89))
* user tags ([#1228](https://github.com/dendronhq/dendron/issues/1228)) ([98c0106](https://github.com/dendronhq/dendron/commit/98c0106367e384c130a927484b9ea294eb6f84fa))



## 0.55.2 (2021-08-21)


### Bug Fixes

* don't insert title when rendering note refs in preview ([#1157](https://github.com/dendronhq/dendron/issues/1157)) ([9d447af](https://github.com/dendronhq/dendron/commit/9d447af8ad7381bb8d3078fc44d4a188618acdfd))
* wrong internal links in nextjs publishing ([#1165](https://github.com/dendronhq/dendron/issues/1165)) ([59a949d](https://github.com/dendronhq/dendron/commit/59a949d2b5b541efb283e851060636b108eb5a98))



## 0.55.1 (2021-08-17)


### Features Dendron

* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* add new vaults from CLI to code workspace ([#1094](https://github.com/dendronhq/dendron/issues/1094)) ([2cde108](https://github.com/dendronhq/dendron/commit/2cde108b4c88a5c9d13b8eb6370f69879d6c9a62))
* CopyNoteLink copies footnotes as anchors ([#1117](https://github.com/dendronhq/dendron/issues/1117)) ([2168991](https://github.com/dendronhq/dendron/commit/21689914d0c84735d243b988dcceb276df97380f))
* frontmatter tags ([#1104](https://github.com/dendronhq/dendron/issues/1104)) ([e4c022f](https://github.com/dendronhq/dendron/commit/e4c022f422b1ce020215d59d2658218f10c75250))
* leading slash in markdown export pod ([#1136](https://github.com/dendronhq/dendron/issues/1136)) ([0f8ebbf](https://github.com/dendronhq/dendron/commit/0f8ebbf228f7af1bbbf677c9fea38989f87c635e))


### Features Dendron

* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))
* remove frontmatter tags if tag is moved outside `tags.` ([1bce9af](https://github.com/dendronhq/dendron/commit/1bce9af293a60fd453389a907fc3043fe173330c))
* seed cmds in plugin ([#1080](https://github.com/dendronhq/dendron/issues/1080)) ([e07a092](https://github.com/dendronhq/dendron/commit/e07a092b1a75548574f2ea45f1b465490b2091f3))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.59.2-alpha.2](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.59.2-alpha.2) (2021-09-15)


### Bug Fixes

* block anchor in list with single top level element ([#1242](https://github.com/dendronhq/dendron/issues/1242)) ([1ce3a21](https://github.com/dendronhq/dendron/commit/1ce3a216047d5a1a1638509cdc92e36e7ec86a1c)), closes [#1235](https://github.com/dendronhq/dendron/issues/1235)
* block anchors attached to code blocks in publishing ([#1267](https://github.com/dendronhq/dendron/issues/1267)) ([6b3c71c](https://github.com/dendronhq/dendron/commit/6b3c71cd6728dfee7eaa74db9f9b8168ad7a2e39))
* correctly render cross-vault note references in preview v2 ([#1310](https://github.com/dendronhq/dendron/issues/1310)) ([1198449](https://github.com/dendronhq/dendron/commit/11984494ca7c889790a0c0288fe97b8687398e4f))
* direct children query ([#1303](https://github.com/dendronhq/dendron/issues/1303)) ([bcf0dea](https://github.com/dendronhq/dendron/commit/bcf0deae422406564cd9a56c1765f90dd2e66215))
* exclude private vault backlinks ([#1301](https://github.com/dendronhq/dendron/issues/1301)) ([837c50e](https://github.com/dendronhq/dendron/commit/837c50efad4d80d4a41d73a39287053b7ff7e365))
* Frontmatter tags display similar to Children ([#1285](https://github.com/dendronhq/dendron/issues/1285)) ([a0ce014](https://github.com/dendronhq/dendron/commit/a0ce01469bd0de17768d1aff2711807425027d87))
* slugify github issue title ([#1218](https://github.com/dendronhq/dendron/issues/1218)) ([e6c2638](https://github.com/dendronhq/dendron/commit/e6c26380abd68f076dbe1d8ed542327c3ff558f3))


### Features Dendron

* dendron publishing with nextjs commands ([#1266](https://github.com/dendronhq/dendron/issues/1266)) ([fb90e98](https://github.com/dendronhq/dendron/commit/fb90e98999c1073b58480eb7364f6a70e31a6903))
* enable usePrettyRefs for nextJS publishing and preview ([#1239](https://github.com/dendronhq/dendron/issues/1239)) ([8a456a9](https://github.com/dendronhq/dendron/commit/8a456a910c45e927c8413d881324bd28401e2aca))
* extended images for custom CSS properties ([#1315](https://github.com/dendronhq/dendron/issues/1315)) ([f9ed88f](https://github.com/dendronhq/dendron/commit/f9ed88ff91916c444607d7842027c79085d077ae)), closes [#1273](https://github.com/dendronhq/dendron/issues/1273)
* github publish to create new issue ([#1206](https://github.com/dendronhq/dendron/issues/1206)) ([67abef0](https://github.com/dendronhq/dendron/commit/67abef02c5615385a8a7f82fe290c8a443605a7f))
* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* user tag autocomplete & user tags updated on rename ([#1278](https://github.com/dendronhq/dendron/issues/1278)) ([9719f99](https://github.com/dendronhq/dendron/commit/9719f99550a2c51c1a22f6fb21ff750bb4115f89))
* user tags ([#1228](https://github.com/dendronhq/dendron/issues/1228)) ([98c0106](https://github.com/dendronhq/dendron/commit/98c0106367e384c130a927484b9ea294eb6f84fa))



## 0.55.2 (2021-08-21)


### Bug Fixes

* don't insert title when rendering note refs in preview ([#1157](https://github.com/dendronhq/dendron/issues/1157)) ([9d447af](https://github.com/dendronhq/dendron/commit/9d447af8ad7381bb8d3078fc44d4a188618acdfd))
* wrong internal links in nextjs publishing ([#1165](https://github.com/dendronhq/dendron/issues/1165)) ([59a949d](https://github.com/dendronhq/dendron/commit/59a949d2b5b541efb283e851060636b108eb5a98))



## 0.55.1 (2021-08-17)


### Features Dendron

* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* add new vaults from CLI to code workspace ([#1094](https://github.com/dendronhq/dendron/issues/1094)) ([2cde108](https://github.com/dendronhq/dendron/commit/2cde108b4c88a5c9d13b8eb6370f69879d6c9a62))
* CopyNoteLink copies footnotes as anchors ([#1117](https://github.com/dendronhq/dendron/issues/1117)) ([2168991](https://github.com/dendronhq/dendron/commit/21689914d0c84735d243b988dcceb276df97380f))
* frontmatter tags ([#1104](https://github.com/dendronhq/dendron/issues/1104)) ([e4c022f](https://github.com/dendronhq/dendron/commit/e4c022f422b1ce020215d59d2658218f10c75250))
* leading slash in markdown export pod ([#1136](https://github.com/dendronhq/dendron/issues/1136)) ([0f8ebbf](https://github.com/dendronhq/dendron/commit/0f8ebbf228f7af1bbbf677c9fea38989f87c635e))


### Features Dendron

* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))
* remove frontmatter tags if tag is moved outside `tags.` ([1bce9af](https://github.com/dendronhq/dendron/commit/1bce9af293a60fd453389a907fc3043fe173330c))
* seed cmds in plugin ([#1080](https://github.com/dendronhq/dendron/issues/1080)) ([e07a092](https://github.com/dendronhq/dendron/commit/e07a092b1a75548574f2ea45f1b465490b2091f3))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.59.2-alpha.1](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.59.2-alpha.1) (2021-09-15)


### Bug Fixes

* block anchor in list with single top level element ([#1242](https://github.com/dendronhq/dendron/issues/1242)) ([1ce3a21](https://github.com/dendronhq/dendron/commit/1ce3a216047d5a1a1638509cdc92e36e7ec86a1c)), closes [#1235](https://github.com/dendronhq/dendron/issues/1235)
* block anchors attached to code blocks in publishing ([#1267](https://github.com/dendronhq/dendron/issues/1267)) ([6b3c71c](https://github.com/dendronhq/dendron/commit/6b3c71cd6728dfee7eaa74db9f9b8168ad7a2e39))
* correctly render cross-vault note references in preview v2 ([#1310](https://github.com/dendronhq/dendron/issues/1310)) ([1198449](https://github.com/dendronhq/dendron/commit/11984494ca7c889790a0c0288fe97b8687398e4f))
* direct children query ([#1303](https://github.com/dendronhq/dendron/issues/1303)) ([bcf0dea](https://github.com/dendronhq/dendron/commit/bcf0deae422406564cd9a56c1765f90dd2e66215))
* exclude private vault backlinks ([#1301](https://github.com/dendronhq/dendron/issues/1301)) ([837c50e](https://github.com/dendronhq/dendron/commit/837c50efad4d80d4a41d73a39287053b7ff7e365))
* Frontmatter tags display similar to Children ([#1285](https://github.com/dendronhq/dendron/issues/1285)) ([a0ce014](https://github.com/dendronhq/dendron/commit/a0ce01469bd0de17768d1aff2711807425027d87))
* slugify github issue title ([#1218](https://github.com/dendronhq/dendron/issues/1218)) ([e6c2638](https://github.com/dendronhq/dendron/commit/e6c26380abd68f076dbe1d8ed542327c3ff558f3))


### Features Dendron

* dendron publishing with nextjs commands ([#1266](https://github.com/dendronhq/dendron/issues/1266)) ([fb90e98](https://github.com/dendronhq/dendron/commit/fb90e98999c1073b58480eb7364f6a70e31a6903))
* enable usePrettyRefs for nextJS publishing and preview ([#1239](https://github.com/dendronhq/dendron/issues/1239)) ([8a456a9](https://github.com/dendronhq/dendron/commit/8a456a910c45e927c8413d881324bd28401e2aca))
* extended images for custom CSS properties ([#1315](https://github.com/dendronhq/dendron/issues/1315)) ([f9ed88f](https://github.com/dendronhq/dendron/commit/f9ed88ff91916c444607d7842027c79085d077ae)), closes [#1273](https://github.com/dendronhq/dendron/issues/1273)
* github publish to create new issue ([#1206](https://github.com/dendronhq/dendron/issues/1206)) ([67abef0](https://github.com/dendronhq/dendron/commit/67abef02c5615385a8a7f82fe290c8a443605a7f))
* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* user tag autocomplete & user tags updated on rename ([#1278](https://github.com/dendronhq/dendron/issues/1278)) ([9719f99](https://github.com/dendronhq/dendron/commit/9719f99550a2c51c1a22f6fb21ff750bb4115f89))
* user tags ([#1228](https://github.com/dendronhq/dendron/issues/1228)) ([98c0106](https://github.com/dendronhq/dendron/commit/98c0106367e384c130a927484b9ea294eb6f84fa))



## 0.55.2 (2021-08-21)


### Bug Fixes

* don't insert title when rendering note refs in preview ([#1157](https://github.com/dendronhq/dendron/issues/1157)) ([9d447af](https://github.com/dendronhq/dendron/commit/9d447af8ad7381bb8d3078fc44d4a188618acdfd))
* wrong internal links in nextjs publishing ([#1165](https://github.com/dendronhq/dendron/issues/1165)) ([59a949d](https://github.com/dendronhq/dendron/commit/59a949d2b5b541efb283e851060636b108eb5a98))



## 0.55.1 (2021-08-17)


### Features Dendron

* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* add new vaults from CLI to code workspace ([#1094](https://github.com/dendronhq/dendron/issues/1094)) ([2cde108](https://github.com/dendronhq/dendron/commit/2cde108b4c88a5c9d13b8eb6370f69879d6c9a62))
* CopyNoteLink copies footnotes as anchors ([#1117](https://github.com/dendronhq/dendron/issues/1117)) ([2168991](https://github.com/dendronhq/dendron/commit/21689914d0c84735d243b988dcceb276df97380f))
* frontmatter tags ([#1104](https://github.com/dendronhq/dendron/issues/1104)) ([e4c022f](https://github.com/dendronhq/dendron/commit/e4c022f422b1ce020215d59d2658218f10c75250))
* leading slash in markdown export pod ([#1136](https://github.com/dendronhq/dendron/issues/1136)) ([0f8ebbf](https://github.com/dendronhq/dendron/commit/0f8ebbf228f7af1bbbf677c9fea38989f87c635e))


### Features Dendron

* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))
* remove frontmatter tags if tag is moved outside `tags.` ([1bce9af](https://github.com/dendronhq/dendron/commit/1bce9af293a60fd453389a907fc3043fe173330c))
* seed cmds in plugin ([#1080](https://github.com/dendronhq/dendron/issues/1080)) ([e07a092](https://github.com/dendronhq/dendron/commit/e07a092b1a75548574f2ea45f1b465490b2091f3))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.59.2-alpha.0](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.59.2-alpha.0) (2021-09-15)


### Bug Fixes

* block anchor in list with single top level element ([#1242](https://github.com/dendronhq/dendron/issues/1242)) ([1ce3a21](https://github.com/dendronhq/dendron/commit/1ce3a216047d5a1a1638509cdc92e36e7ec86a1c)), closes [#1235](https://github.com/dendronhq/dendron/issues/1235)
* block anchors attached to code blocks in publishing ([#1267](https://github.com/dendronhq/dendron/issues/1267)) ([6b3c71c](https://github.com/dendronhq/dendron/commit/6b3c71cd6728dfee7eaa74db9f9b8168ad7a2e39))
* correctly render cross-vault note references in preview v2 ([#1310](https://github.com/dendronhq/dendron/issues/1310)) ([1198449](https://github.com/dendronhq/dendron/commit/11984494ca7c889790a0c0288fe97b8687398e4f))
* direct children query ([#1303](https://github.com/dendronhq/dendron/issues/1303)) ([bcf0dea](https://github.com/dendronhq/dendron/commit/bcf0deae422406564cd9a56c1765f90dd2e66215))
* exclude private vault backlinks ([#1301](https://github.com/dendronhq/dendron/issues/1301)) ([837c50e](https://github.com/dendronhq/dendron/commit/837c50efad4d80d4a41d73a39287053b7ff7e365))
* Frontmatter tags display similar to Children ([#1285](https://github.com/dendronhq/dendron/issues/1285)) ([a0ce014](https://github.com/dendronhq/dendron/commit/a0ce01469bd0de17768d1aff2711807425027d87))
* slugify github issue title ([#1218](https://github.com/dendronhq/dendron/issues/1218)) ([e6c2638](https://github.com/dendronhq/dendron/commit/e6c26380abd68f076dbe1d8ed542327c3ff558f3))


### Features Dendron

* dendron publishing with nextjs commands ([#1266](https://github.com/dendronhq/dendron/issues/1266)) ([fb90e98](https://github.com/dendronhq/dendron/commit/fb90e98999c1073b58480eb7364f6a70e31a6903))
* enable usePrettyRefs for nextJS publishing and preview ([#1239](https://github.com/dendronhq/dendron/issues/1239)) ([8a456a9](https://github.com/dendronhq/dendron/commit/8a456a910c45e927c8413d881324bd28401e2aca))
* extended images for custom CSS properties ([#1315](https://github.com/dendronhq/dendron/issues/1315)) ([f9ed88f](https://github.com/dendronhq/dendron/commit/f9ed88ff91916c444607d7842027c79085d077ae)), closes [#1273](https://github.com/dendronhq/dendron/issues/1273)
* github publish to create new issue ([#1206](https://github.com/dendronhq/dendron/issues/1206)) ([67abef0](https://github.com/dendronhq/dendron/commit/67abef02c5615385a8a7f82fe290c8a443605a7f))
* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* user tag autocomplete & user tags updated on rename ([#1278](https://github.com/dendronhq/dendron/issues/1278)) ([9719f99](https://github.com/dendronhq/dendron/commit/9719f99550a2c51c1a22f6fb21ff750bb4115f89))
* user tags ([#1228](https://github.com/dendronhq/dendron/issues/1228)) ([98c0106](https://github.com/dendronhq/dendron/commit/98c0106367e384c130a927484b9ea294eb6f84fa))



## 0.55.2 (2021-08-21)


### Bug Fixes

* don't insert title when rendering note refs in preview ([#1157](https://github.com/dendronhq/dendron/issues/1157)) ([9d447af](https://github.com/dendronhq/dendron/commit/9d447af8ad7381bb8d3078fc44d4a188618acdfd))
* wrong internal links in nextjs publishing ([#1165](https://github.com/dendronhq/dendron/issues/1165)) ([59a949d](https://github.com/dendronhq/dendron/commit/59a949d2b5b541efb283e851060636b108eb5a98))



## 0.55.1 (2021-08-17)


### Features Dendron

* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* add new vaults from CLI to code workspace ([#1094](https://github.com/dendronhq/dendron/issues/1094)) ([2cde108](https://github.com/dendronhq/dendron/commit/2cde108b4c88a5c9d13b8eb6370f69879d6c9a62))
* CopyNoteLink copies footnotes as anchors ([#1117](https://github.com/dendronhq/dendron/issues/1117)) ([2168991](https://github.com/dendronhq/dendron/commit/21689914d0c84735d243b988dcceb276df97380f))
* frontmatter tags ([#1104](https://github.com/dendronhq/dendron/issues/1104)) ([e4c022f](https://github.com/dendronhq/dendron/commit/e4c022f422b1ce020215d59d2658218f10c75250))
* leading slash in markdown export pod ([#1136](https://github.com/dendronhq/dendron/issues/1136)) ([0f8ebbf](https://github.com/dendronhq/dendron/commit/0f8ebbf228f7af1bbbf677c9fea38989f87c635e))


### Features Dendron

* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))
* remove frontmatter tags if tag is moved outside `tags.` ([1bce9af](https://github.com/dendronhq/dendron/commit/1bce9af293a60fd453389a907fc3043fe173330c))
* seed cmds in plugin ([#1080](https://github.com/dendronhq/dendron/issues/1080)) ([e07a092](https://github.com/dendronhq/dendron/commit/e07a092b1a75548574f2ea45f1b465490b2091f3))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.59.1](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.59.1) (2021-09-14)


### Bug Fixes

* block anchor in list with single top level element ([#1242](https://github.com/dendronhq/dendron/issues/1242)) ([1ce3a21](https://github.com/dendronhq/dendron/commit/1ce3a216047d5a1a1638509cdc92e36e7ec86a1c)), closes [#1235](https://github.com/dendronhq/dendron/issues/1235)
* block anchors attached to code blocks in publishing ([#1267](https://github.com/dendronhq/dendron/issues/1267)) ([6b3c71c](https://github.com/dendronhq/dendron/commit/6b3c71cd6728dfee7eaa74db9f9b8168ad7a2e39))
* correctly render cross-vault note references in preview v2 ([#1310](https://github.com/dendronhq/dendron/issues/1310)) ([1198449](https://github.com/dendronhq/dendron/commit/11984494ca7c889790a0c0288fe97b8687398e4f))
* direct children query ([#1303](https://github.com/dendronhq/dendron/issues/1303)) ([bcf0dea](https://github.com/dendronhq/dendron/commit/bcf0deae422406564cd9a56c1765f90dd2e66215))
* exclude private vault backlinks ([#1301](https://github.com/dendronhq/dendron/issues/1301)) ([837c50e](https://github.com/dendronhq/dendron/commit/837c50efad4d80d4a41d73a39287053b7ff7e365))
* Frontmatter tags display similar to Children ([#1285](https://github.com/dendronhq/dendron/issues/1285)) ([a0ce014](https://github.com/dendronhq/dendron/commit/a0ce01469bd0de17768d1aff2711807425027d87))
* slugify github issue title ([#1218](https://github.com/dendronhq/dendron/issues/1218)) ([e6c2638](https://github.com/dendronhq/dendron/commit/e6c26380abd68f076dbe1d8ed542327c3ff558f3))


### Features Dendron

* dendron publishing with nextjs commands ([#1266](https://github.com/dendronhq/dendron/issues/1266)) ([fb90e98](https://github.com/dendronhq/dendron/commit/fb90e98999c1073b58480eb7364f6a70e31a6903))
* enable usePrettyRefs for nextJS publishing and preview ([#1239](https://github.com/dendronhq/dendron/issues/1239)) ([8a456a9](https://github.com/dendronhq/dendron/commit/8a456a910c45e927c8413d881324bd28401e2aca))
* extended images for custom CSS properties ([#1315](https://github.com/dendronhq/dendron/issues/1315)) ([f9ed88f](https://github.com/dendronhq/dendron/commit/f9ed88ff91916c444607d7842027c79085d077ae)), closes [#1273](https://github.com/dendronhq/dendron/issues/1273)
* github publish to create new issue ([#1206](https://github.com/dendronhq/dendron/issues/1206)) ([67abef0](https://github.com/dendronhq/dendron/commit/67abef02c5615385a8a7f82fe290c8a443605a7f))
* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* user tag autocomplete & user tags updated on rename ([#1278](https://github.com/dendronhq/dendron/issues/1278)) ([9719f99](https://github.com/dendronhq/dendron/commit/9719f99550a2c51c1a22f6fb21ff750bb4115f89))
* user tags ([#1228](https://github.com/dendronhq/dendron/issues/1228)) ([98c0106](https://github.com/dendronhq/dendron/commit/98c0106367e384c130a927484b9ea294eb6f84fa))



## 0.55.2 (2021-08-21)


### Bug Fixes

* don't insert title when rendering note refs in preview ([#1157](https://github.com/dendronhq/dendron/issues/1157)) ([9d447af](https://github.com/dendronhq/dendron/commit/9d447af8ad7381bb8d3078fc44d4a188618acdfd))
* wrong internal links in nextjs publishing ([#1165](https://github.com/dendronhq/dendron/issues/1165)) ([59a949d](https://github.com/dendronhq/dendron/commit/59a949d2b5b541efb283e851060636b108eb5a98))



## 0.55.1 (2021-08-17)


### Features Dendron

* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* add new vaults from CLI to code workspace ([#1094](https://github.com/dendronhq/dendron/issues/1094)) ([2cde108](https://github.com/dendronhq/dendron/commit/2cde108b4c88a5c9d13b8eb6370f69879d6c9a62))
* CopyNoteLink copies footnotes as anchors ([#1117](https://github.com/dendronhq/dendron/issues/1117)) ([2168991](https://github.com/dendronhq/dendron/commit/21689914d0c84735d243b988dcceb276df97380f))
* frontmatter tags ([#1104](https://github.com/dendronhq/dendron/issues/1104)) ([e4c022f](https://github.com/dendronhq/dendron/commit/e4c022f422b1ce020215d59d2658218f10c75250))
* leading slash in markdown export pod ([#1136](https://github.com/dendronhq/dendron/issues/1136)) ([0f8ebbf](https://github.com/dendronhq/dendron/commit/0f8ebbf228f7af1bbbf677c9fea38989f87c635e))


### Features Dendron

* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))
* remove frontmatter tags if tag is moved outside `tags.` ([1bce9af](https://github.com/dendronhq/dendron/commit/1bce9af293a60fd453389a907fc3043fe173330c))
* seed cmds in plugin ([#1080](https://github.com/dendronhq/dendron/issues/1080)) ([e07a092](https://github.com/dendronhq/dendron/commit/e07a092b1a75548574f2ea45f1b465490b2091f3))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





# [0.59.0](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.59.0) (2021-09-14)


### Bug Fixes

* block anchor in list with single top level element ([#1242](https://github.com/dendronhq/dendron/issues/1242)) ([1ce3a21](https://github.com/dendronhq/dendron/commit/1ce3a216047d5a1a1638509cdc92e36e7ec86a1c)), closes [#1235](https://github.com/dendronhq/dendron/issues/1235)
* block anchors attached to code blocks in publishing ([#1267](https://github.com/dendronhq/dendron/issues/1267)) ([6b3c71c](https://github.com/dendronhq/dendron/commit/6b3c71cd6728dfee7eaa74db9f9b8168ad7a2e39))
* correctly render cross-vault note references in preview v2 ([#1310](https://github.com/dendronhq/dendron/issues/1310)) ([1198449](https://github.com/dendronhq/dendron/commit/11984494ca7c889790a0c0288fe97b8687398e4f))
* direct children query ([#1303](https://github.com/dendronhq/dendron/issues/1303)) ([bcf0dea](https://github.com/dendronhq/dendron/commit/bcf0deae422406564cd9a56c1765f90dd2e66215))
* exclude private vault backlinks ([#1301](https://github.com/dendronhq/dendron/issues/1301)) ([837c50e](https://github.com/dendronhq/dendron/commit/837c50efad4d80d4a41d73a39287053b7ff7e365))
* Frontmatter tags display similar to Children ([#1285](https://github.com/dendronhq/dendron/issues/1285)) ([a0ce014](https://github.com/dendronhq/dendron/commit/a0ce01469bd0de17768d1aff2711807425027d87))
* slugify github issue title ([#1218](https://github.com/dendronhq/dendron/issues/1218)) ([e6c2638](https://github.com/dendronhq/dendron/commit/e6c26380abd68f076dbe1d8ed542327c3ff558f3))


### Features Dendron

* dendron publishing with nextjs commands ([#1266](https://github.com/dendronhq/dendron/issues/1266)) ([fb90e98](https://github.com/dendronhq/dendron/commit/fb90e98999c1073b58480eb7364f6a70e31a6903))
* enable usePrettyRefs for nextJS publishing and preview ([#1239](https://github.com/dendronhq/dendron/issues/1239)) ([8a456a9](https://github.com/dendronhq/dendron/commit/8a456a910c45e927c8413d881324bd28401e2aca))
* extended images for custom CSS properties ([#1315](https://github.com/dendronhq/dendron/issues/1315)) ([f9ed88f](https://github.com/dendronhq/dendron/commit/f9ed88ff91916c444607d7842027c79085d077ae)), closes [#1273](https://github.com/dendronhq/dendron/issues/1273)
* github publish to create new issue ([#1206](https://github.com/dendronhq/dendron/issues/1206)) ([67abef0](https://github.com/dendronhq/dendron/commit/67abef02c5615385a8a7f82fe290c8a443605a7f))
* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* user tag autocomplete & user tags updated on rename ([#1278](https://github.com/dendronhq/dendron/issues/1278)) ([9719f99](https://github.com/dendronhq/dendron/commit/9719f99550a2c51c1a22f6fb21ff750bb4115f89))
* user tags ([#1228](https://github.com/dendronhq/dendron/issues/1228)) ([98c0106](https://github.com/dendronhq/dendron/commit/98c0106367e384c130a927484b9ea294eb6f84fa))



## 0.55.2 (2021-08-21)


### Bug Fixes

* don't insert title when rendering note refs in preview ([#1157](https://github.com/dendronhq/dendron/issues/1157)) ([9d447af](https://github.com/dendronhq/dendron/commit/9d447af8ad7381bb8d3078fc44d4a188618acdfd))
* wrong internal links in nextjs publishing ([#1165](https://github.com/dendronhq/dendron/issues/1165)) ([59a949d](https://github.com/dendronhq/dendron/commit/59a949d2b5b541efb283e851060636b108eb5a98))



## 0.55.1 (2021-08-17)


### Features Dendron

* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* add new vaults from CLI to code workspace ([#1094](https://github.com/dendronhq/dendron/issues/1094)) ([2cde108](https://github.com/dendronhq/dendron/commit/2cde108b4c88a5c9d13b8eb6370f69879d6c9a62))
* CopyNoteLink copies footnotes as anchors ([#1117](https://github.com/dendronhq/dendron/issues/1117)) ([2168991](https://github.com/dendronhq/dendron/commit/21689914d0c84735d243b988dcceb276df97380f))
* frontmatter tags ([#1104](https://github.com/dendronhq/dendron/issues/1104)) ([e4c022f](https://github.com/dendronhq/dendron/commit/e4c022f422b1ce020215d59d2658218f10c75250))
* leading slash in markdown export pod ([#1136](https://github.com/dendronhq/dendron/issues/1136)) ([0f8ebbf](https://github.com/dendronhq/dendron/commit/0f8ebbf228f7af1bbbf677c9fea38989f87c635e))


### Features Dendron

* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))
* remove frontmatter tags if tag is moved outside `tags.` ([1bce9af](https://github.com/dendronhq/dendron/commit/1bce9af293a60fd453389a907fc3043fe173330c))
* seed cmds in plugin ([#1080](https://github.com/dendronhq/dendron/issues/1080)) ([e07a092](https://github.com/dendronhq/dendron/commit/e07a092b1a75548574f2ea45f1b465490b2091f3))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.58.4](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.58.4) (2021-09-12)


### Bug Fixes

* block anchor in list with single top level element ([#1242](https://github.com/dendronhq/dendron/issues/1242)) ([1ce3a21](https://github.com/dendronhq/dendron/commit/1ce3a216047d5a1a1638509cdc92e36e7ec86a1c)), closes [#1235](https://github.com/dendronhq/dendron/issues/1235)
* block anchors attached to code blocks in publishing ([#1267](https://github.com/dendronhq/dendron/issues/1267)) ([6b3c71c](https://github.com/dendronhq/dendron/commit/6b3c71cd6728dfee7eaa74db9f9b8168ad7a2e39))
* correctly render cross-vault note references in preview v2 ([#1310](https://github.com/dendronhq/dendron/issues/1310)) ([1198449](https://github.com/dendronhq/dendron/commit/11984494ca7c889790a0c0288fe97b8687398e4f))
* direct children query ([#1303](https://github.com/dendronhq/dendron/issues/1303)) ([bcf0dea](https://github.com/dendronhq/dendron/commit/bcf0deae422406564cd9a56c1765f90dd2e66215))
* exclude private vault backlinks ([#1301](https://github.com/dendronhq/dendron/issues/1301)) ([837c50e](https://github.com/dendronhq/dendron/commit/837c50efad4d80d4a41d73a39287053b7ff7e365))
* Frontmatter tags display similar to Children ([#1285](https://github.com/dendronhq/dendron/issues/1285)) ([a0ce014](https://github.com/dendronhq/dendron/commit/a0ce01469bd0de17768d1aff2711807425027d87))
* slugify github issue title ([#1218](https://github.com/dendronhq/dendron/issues/1218)) ([e6c2638](https://github.com/dendronhq/dendron/commit/e6c26380abd68f076dbe1d8ed542327c3ff558f3))


### Features Dendron

* dendron publishing with nextjs commands ([#1266](https://github.com/dendronhq/dendron/issues/1266)) ([fb90e98](https://github.com/dendronhq/dendron/commit/fb90e98999c1073b58480eb7364f6a70e31a6903))
* enable usePrettyRefs for nextJS publishing and preview ([#1239](https://github.com/dendronhq/dendron/issues/1239)) ([8a456a9](https://github.com/dendronhq/dendron/commit/8a456a910c45e927c8413d881324bd28401e2aca))
* extended images for custom CSS properties ([#1315](https://github.com/dendronhq/dendron/issues/1315)) ([f9ed88f](https://github.com/dendronhq/dendron/commit/f9ed88ff91916c444607d7842027c79085d077ae)), closes [#1273](https://github.com/dendronhq/dendron/issues/1273)
* github publish to create new issue ([#1206](https://github.com/dendronhq/dendron/issues/1206)) ([67abef0](https://github.com/dendronhq/dendron/commit/67abef02c5615385a8a7f82fe290c8a443605a7f))
* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* user tag autocomplete & user tags updated on rename ([#1278](https://github.com/dendronhq/dendron/issues/1278)) ([9719f99](https://github.com/dendronhq/dendron/commit/9719f99550a2c51c1a22f6fb21ff750bb4115f89))
* user tags ([#1228](https://github.com/dendronhq/dendron/issues/1228)) ([98c0106](https://github.com/dendronhq/dendron/commit/98c0106367e384c130a927484b9ea294eb6f84fa))



## 0.55.2 (2021-08-21)


### Bug Fixes

* don't insert title when rendering note refs in preview ([#1157](https://github.com/dendronhq/dendron/issues/1157)) ([9d447af](https://github.com/dendronhq/dendron/commit/9d447af8ad7381bb8d3078fc44d4a188618acdfd))
* wrong internal links in nextjs publishing ([#1165](https://github.com/dendronhq/dendron/issues/1165)) ([59a949d](https://github.com/dendronhq/dendron/commit/59a949d2b5b541efb283e851060636b108eb5a98))



## 0.55.1 (2021-08-17)


### Features Dendron

* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* add new vaults from CLI to code workspace ([#1094](https://github.com/dendronhq/dendron/issues/1094)) ([2cde108](https://github.com/dendronhq/dendron/commit/2cde108b4c88a5c9d13b8eb6370f69879d6c9a62))
* CopyNoteLink copies footnotes as anchors ([#1117](https://github.com/dendronhq/dendron/issues/1117)) ([2168991](https://github.com/dendronhq/dendron/commit/21689914d0c84735d243b988dcceb276df97380f))
* frontmatter tags ([#1104](https://github.com/dendronhq/dendron/issues/1104)) ([e4c022f](https://github.com/dendronhq/dendron/commit/e4c022f422b1ce020215d59d2658218f10c75250))
* leading slash in markdown export pod ([#1136](https://github.com/dendronhq/dendron/issues/1136)) ([0f8ebbf](https://github.com/dendronhq/dendron/commit/0f8ebbf228f7af1bbbf677c9fea38989f87c635e))


### Features Dendron

* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))
* remove frontmatter tags if tag is moved outside `tags.` ([1bce9af](https://github.com/dendronhq/dendron/commit/1bce9af293a60fd453389a907fc3043fe173330c))
* seed cmds in plugin ([#1080](https://github.com/dendronhq/dendron/issues/1080)) ([e07a092](https://github.com/dendronhq/dendron/commit/e07a092b1a75548574f2ea45f1b465490b2091f3))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.58.4-alpha.3](https://github.com/dendronhq/dendron/compare/v0.58.4-alpha.1...v0.58.4-alpha.3) (2021-09-10)

**Note:** Version bump only for package @dendronhq/engine-test-utils





## [0.58.4-alpha.2](https://github.com/dendronhq/dendron/compare/v0.58.4-alpha.1...v0.58.4-alpha.2) (2021-09-10)

**Note:** Version bump only for package @dendronhq/engine-test-utils





## [0.58.4-alpha.1](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.58.4-alpha.1) (2021-09-10)


### Bug Fixes

* block anchor in list with single top level element ([#1242](https://github.com/dendronhq/dendron/issues/1242)) ([1ce3a21](https://github.com/dendronhq/dendron/commit/1ce3a216047d5a1a1638509cdc92e36e7ec86a1c)), closes [#1235](https://github.com/dendronhq/dendron/issues/1235)
* block anchors attached to code blocks in publishing ([#1267](https://github.com/dendronhq/dendron/issues/1267)) ([6b3c71c](https://github.com/dendronhq/dendron/commit/6b3c71cd6728dfee7eaa74db9f9b8168ad7a2e39))
* correctly render cross-vault note references in preview v2 ([#1310](https://github.com/dendronhq/dendron/issues/1310)) ([1198449](https://github.com/dendronhq/dendron/commit/11984494ca7c889790a0c0288fe97b8687398e4f))
* direct children query ([#1303](https://github.com/dendronhq/dendron/issues/1303)) ([bcf0dea](https://github.com/dendronhq/dendron/commit/bcf0deae422406564cd9a56c1765f90dd2e66215))
* exclude private vault backlinks ([#1301](https://github.com/dendronhq/dendron/issues/1301)) ([837c50e](https://github.com/dendronhq/dendron/commit/837c50efad4d80d4a41d73a39287053b7ff7e365))
* Frontmatter tags display similar to Children ([#1285](https://github.com/dendronhq/dendron/issues/1285)) ([a0ce014](https://github.com/dendronhq/dendron/commit/a0ce01469bd0de17768d1aff2711807425027d87))
* slugify github issue title ([#1218](https://github.com/dendronhq/dendron/issues/1218)) ([e6c2638](https://github.com/dendronhq/dendron/commit/e6c26380abd68f076dbe1d8ed542327c3ff558f3))


### Features Dendron

* dendron publishing with nextjs commands ([#1266](https://github.com/dendronhq/dendron/issues/1266)) ([fb90e98](https://github.com/dendronhq/dendron/commit/fb90e98999c1073b58480eb7364f6a70e31a6903))
* enable usePrettyRefs for nextJS publishing and preview ([#1239](https://github.com/dendronhq/dendron/issues/1239)) ([8a456a9](https://github.com/dendronhq/dendron/commit/8a456a910c45e927c8413d881324bd28401e2aca))
* extended images for custom CSS properties ([#1315](https://github.com/dendronhq/dendron/issues/1315)) ([f9ed88f](https://github.com/dendronhq/dendron/commit/f9ed88ff91916c444607d7842027c79085d077ae)), closes [#1273](https://github.com/dendronhq/dendron/issues/1273)
* github publish to create new issue ([#1206](https://github.com/dendronhq/dendron/issues/1206)) ([67abef0](https://github.com/dendronhq/dendron/commit/67abef02c5615385a8a7f82fe290c8a443605a7f))
* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* user tag autocomplete & user tags updated on rename ([#1278](https://github.com/dendronhq/dendron/issues/1278)) ([9719f99](https://github.com/dendronhq/dendron/commit/9719f99550a2c51c1a22f6fb21ff750bb4115f89))
* user tags ([#1228](https://github.com/dendronhq/dendron/issues/1228)) ([98c0106](https://github.com/dendronhq/dendron/commit/98c0106367e384c130a927484b9ea294eb6f84fa))



## 0.55.2 (2021-08-21)


### Bug Fixes

* don't insert title when rendering note refs in preview ([#1157](https://github.com/dendronhq/dendron/issues/1157)) ([9d447af](https://github.com/dendronhq/dendron/commit/9d447af8ad7381bb8d3078fc44d4a188618acdfd))
* wrong internal links in nextjs publishing ([#1165](https://github.com/dendronhq/dendron/issues/1165)) ([59a949d](https://github.com/dendronhq/dendron/commit/59a949d2b5b541efb283e851060636b108eb5a98))



## 0.55.1 (2021-08-17)


### Features Dendron

* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* add new vaults from CLI to code workspace ([#1094](https://github.com/dendronhq/dendron/issues/1094)) ([2cde108](https://github.com/dendronhq/dendron/commit/2cde108b4c88a5c9d13b8eb6370f69879d6c9a62))
* CopyNoteLink copies footnotes as anchors ([#1117](https://github.com/dendronhq/dendron/issues/1117)) ([2168991](https://github.com/dendronhq/dendron/commit/21689914d0c84735d243b988dcceb276df97380f))
* frontmatter tags ([#1104](https://github.com/dendronhq/dendron/issues/1104)) ([e4c022f](https://github.com/dendronhq/dendron/commit/e4c022f422b1ce020215d59d2658218f10c75250))
* leading slash in markdown export pod ([#1136](https://github.com/dendronhq/dendron/issues/1136)) ([0f8ebbf](https://github.com/dendronhq/dendron/commit/0f8ebbf228f7af1bbbf677c9fea38989f87c635e))


### Features Dendron

* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))
* remove frontmatter tags if tag is moved outside `tags.` ([1bce9af](https://github.com/dendronhq/dendron/commit/1bce9af293a60fd453389a907fc3043fe173330c))
* seed cmds in plugin ([#1080](https://github.com/dendronhq/dendron/issues/1080)) ([e07a092](https://github.com/dendronhq/dendron/commit/e07a092b1a75548574f2ea45f1b465490b2091f3))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.58.4-alpha.0](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.58.4-alpha.0) (2021-09-09)


### Bug Fixes

* block anchor in list with single top level element ([#1242](https://github.com/dendronhq/dendron/issues/1242)) ([1ce3a21](https://github.com/dendronhq/dendron/commit/1ce3a216047d5a1a1638509cdc92e36e7ec86a1c)), closes [#1235](https://github.com/dendronhq/dendron/issues/1235)
* block anchors attached to code blocks in publishing ([#1267](https://github.com/dendronhq/dendron/issues/1267)) ([6b3c71c](https://github.com/dendronhq/dendron/commit/6b3c71cd6728dfee7eaa74db9f9b8168ad7a2e39))
* correctly render cross-vault note references in preview v2 ([#1310](https://github.com/dendronhq/dendron/issues/1310)) ([1198449](https://github.com/dendronhq/dendron/commit/11984494ca7c889790a0c0288fe97b8687398e4f))
* direct children query ([#1303](https://github.com/dendronhq/dendron/issues/1303)) ([bcf0dea](https://github.com/dendronhq/dendron/commit/bcf0deae422406564cd9a56c1765f90dd2e66215))
* exclude private vault backlinks ([#1301](https://github.com/dendronhq/dendron/issues/1301)) ([837c50e](https://github.com/dendronhq/dendron/commit/837c50efad4d80d4a41d73a39287053b7ff7e365))
* Frontmatter tags display similar to Children ([#1285](https://github.com/dendronhq/dendron/issues/1285)) ([a0ce014](https://github.com/dendronhq/dendron/commit/a0ce01469bd0de17768d1aff2711807425027d87))
* slugify github issue title ([#1218](https://github.com/dendronhq/dendron/issues/1218)) ([e6c2638](https://github.com/dendronhq/dendron/commit/e6c26380abd68f076dbe1d8ed542327c3ff558f3))


### Features Dendron

* dendron publishing with nextjs commands ([#1266](https://github.com/dendronhq/dendron/issues/1266)) ([fb90e98](https://github.com/dendronhq/dendron/commit/fb90e98999c1073b58480eb7364f6a70e31a6903))
* enable usePrettyRefs for nextJS publishing and preview ([#1239](https://github.com/dendronhq/dendron/issues/1239)) ([8a456a9](https://github.com/dendronhq/dendron/commit/8a456a910c45e927c8413d881324bd28401e2aca))
* extended images for custom CSS properties ([#1315](https://github.com/dendronhq/dendron/issues/1315)) ([f9ed88f](https://github.com/dendronhq/dendron/commit/f9ed88ff91916c444607d7842027c79085d077ae)), closes [#1273](https://github.com/dendronhq/dendron/issues/1273)
* github publish to create new issue ([#1206](https://github.com/dendronhq/dendron/issues/1206)) ([67abef0](https://github.com/dendronhq/dendron/commit/67abef02c5615385a8a7f82fe290c8a443605a7f))
* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* user tag autocomplete & user tags updated on rename ([#1278](https://github.com/dendronhq/dendron/issues/1278)) ([9719f99](https://github.com/dendronhq/dendron/commit/9719f99550a2c51c1a22f6fb21ff750bb4115f89))
* user tags ([#1228](https://github.com/dendronhq/dendron/issues/1228)) ([98c0106](https://github.com/dendronhq/dendron/commit/98c0106367e384c130a927484b9ea294eb6f84fa))



## 0.55.2 (2021-08-21)


### Bug Fixes

* don't insert title when rendering note refs in preview ([#1157](https://github.com/dendronhq/dendron/issues/1157)) ([9d447af](https://github.com/dendronhq/dendron/commit/9d447af8ad7381bb8d3078fc44d4a188618acdfd))
* wrong internal links in nextjs publishing ([#1165](https://github.com/dendronhq/dendron/issues/1165)) ([59a949d](https://github.com/dendronhq/dendron/commit/59a949d2b5b541efb283e851060636b108eb5a98))



## 0.55.1 (2021-08-17)


### Features Dendron

* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* add new vaults from CLI to code workspace ([#1094](https://github.com/dendronhq/dendron/issues/1094)) ([2cde108](https://github.com/dendronhq/dendron/commit/2cde108b4c88a5c9d13b8eb6370f69879d6c9a62))
* CopyNoteLink copies footnotes as anchors ([#1117](https://github.com/dendronhq/dendron/issues/1117)) ([2168991](https://github.com/dendronhq/dendron/commit/21689914d0c84735d243b988dcceb276df97380f))
* frontmatter tags ([#1104](https://github.com/dendronhq/dendron/issues/1104)) ([e4c022f](https://github.com/dendronhq/dendron/commit/e4c022f422b1ce020215d59d2658218f10c75250))
* leading slash in markdown export pod ([#1136](https://github.com/dendronhq/dendron/issues/1136)) ([0f8ebbf](https://github.com/dendronhq/dendron/commit/0f8ebbf228f7af1bbbf677c9fea38989f87c635e))


### Features Dendron

* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))
* remove frontmatter tags if tag is moved outside `tags.` ([1bce9af](https://github.com/dendronhq/dendron/commit/1bce9af293a60fd453389a907fc3043fe173330c))
* seed cmds in plugin ([#1080](https://github.com/dendronhq/dendron/issues/1080)) ([e07a092](https://github.com/dendronhq/dendron/commit/e07a092b1a75548574f2ea45f1b465490b2091f3))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.58.3-alpha.0](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.58.3-alpha.0) (2021-09-09)


### Bug Fixes

* block anchor in list with single top level element ([#1242](https://github.com/dendronhq/dendron/issues/1242)) ([1ce3a21](https://github.com/dendronhq/dendron/commit/1ce3a216047d5a1a1638509cdc92e36e7ec86a1c)), closes [#1235](https://github.com/dendronhq/dendron/issues/1235)
* block anchors attached to code blocks in publishing ([#1267](https://github.com/dendronhq/dendron/issues/1267)) ([6b3c71c](https://github.com/dendronhq/dendron/commit/6b3c71cd6728dfee7eaa74db9f9b8168ad7a2e39))
* Frontmatter tags display similar to Children ([#1285](https://github.com/dendronhq/dendron/issues/1285)) ([a0ce014](https://github.com/dendronhq/dendron/commit/a0ce01469bd0de17768d1aff2711807425027d87))
* slugify github issue title ([#1218](https://github.com/dendronhq/dendron/issues/1218)) ([e6c2638](https://github.com/dendronhq/dendron/commit/e6c26380abd68f076dbe1d8ed542327c3ff558f3))


### Features Dendron

* dendron publishing with nextjs commands ([#1266](https://github.com/dendronhq/dendron/issues/1266)) ([fb90e98](https://github.com/dendronhq/dendron/commit/fb90e98999c1073b58480eb7364f6a70e31a6903))
* enable usePrettyRefs for nextJS publishing and preview ([#1239](https://github.com/dendronhq/dendron/issues/1239)) ([8a456a9](https://github.com/dendronhq/dendron/commit/8a456a910c45e927c8413d881324bd28401e2aca))
* github publish to create new issue ([#1206](https://github.com/dendronhq/dendron/issues/1206)) ([67abef0](https://github.com/dendronhq/dendron/commit/67abef02c5615385a8a7f82fe290c8a443605a7f))
* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* user tag autocomplete & user tags updated on rename ([#1278](https://github.com/dendronhq/dendron/issues/1278)) ([9719f99](https://github.com/dendronhq/dendron/commit/9719f99550a2c51c1a22f6fb21ff750bb4115f89))
* user tags ([#1228](https://github.com/dendronhq/dendron/issues/1228)) ([98c0106](https://github.com/dendronhq/dendron/commit/98c0106367e384c130a927484b9ea294eb6f84fa))



## 0.55.2 (2021-08-21)


### Bug Fixes

* don't insert title when rendering note refs in preview ([#1157](https://github.com/dendronhq/dendron/issues/1157)) ([9d447af](https://github.com/dendronhq/dendron/commit/9d447af8ad7381bb8d3078fc44d4a188618acdfd))
* wrong internal links in nextjs publishing ([#1165](https://github.com/dendronhq/dendron/issues/1165)) ([59a949d](https://github.com/dendronhq/dendron/commit/59a949d2b5b541efb283e851060636b108eb5a98))



## 0.55.1 (2021-08-17)


### Features Dendron

* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* add new vaults from CLI to code workspace ([#1094](https://github.com/dendronhq/dendron/issues/1094)) ([2cde108](https://github.com/dendronhq/dendron/commit/2cde108b4c88a5c9d13b8eb6370f69879d6c9a62))
* CopyNoteLink copies footnotes as anchors ([#1117](https://github.com/dendronhq/dendron/issues/1117)) ([2168991](https://github.com/dendronhq/dendron/commit/21689914d0c84735d243b988dcceb276df97380f))
* frontmatter tags ([#1104](https://github.com/dendronhq/dendron/issues/1104)) ([e4c022f](https://github.com/dendronhq/dendron/commit/e4c022f422b1ce020215d59d2658218f10c75250))
* leading slash in markdown export pod ([#1136](https://github.com/dendronhq/dendron/issues/1136)) ([0f8ebbf](https://github.com/dendronhq/dendron/commit/0f8ebbf228f7af1bbbf677c9fea38989f87c635e))


### Features Dendron

* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))
* remove frontmatter tags if tag is moved outside `tags.` ([1bce9af](https://github.com/dendronhq/dendron/commit/1bce9af293a60fd453389a907fc3043fe173330c))
* seed cmds in plugin ([#1080](https://github.com/dendronhq/dendron/issues/1080)) ([e07a092](https://github.com/dendronhq/dendron/commit/e07a092b1a75548574f2ea45f1b465490b2091f3))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.58.2-alpha.0](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.58.2-alpha.0) (2021-09-09)


### Bug Fixes

* block anchor in list with single top level element ([#1242](https://github.com/dendronhq/dendron/issues/1242)) ([1ce3a21](https://github.com/dendronhq/dendron/commit/1ce3a216047d5a1a1638509cdc92e36e7ec86a1c)), closes [#1235](https://github.com/dendronhq/dendron/issues/1235)
* block anchors attached to code blocks in publishing ([#1267](https://github.com/dendronhq/dendron/issues/1267)) ([6b3c71c](https://github.com/dendronhq/dendron/commit/6b3c71cd6728dfee7eaa74db9f9b8168ad7a2e39))
* Frontmatter tags display similar to Children ([#1285](https://github.com/dendronhq/dendron/issues/1285)) ([a0ce014](https://github.com/dendronhq/dendron/commit/a0ce01469bd0de17768d1aff2711807425027d87))
* slugify github issue title ([#1218](https://github.com/dendronhq/dendron/issues/1218)) ([e6c2638](https://github.com/dendronhq/dendron/commit/e6c26380abd68f076dbe1d8ed542327c3ff558f3))


### Features Dendron

* dendron publishing with nextjs commands ([#1266](https://github.com/dendronhq/dendron/issues/1266)) ([fb90e98](https://github.com/dendronhq/dendron/commit/fb90e98999c1073b58480eb7364f6a70e31a6903))
* enable usePrettyRefs for nextJS publishing and preview ([#1239](https://github.com/dendronhq/dendron/issues/1239)) ([8a456a9](https://github.com/dendronhq/dendron/commit/8a456a910c45e927c8413d881324bd28401e2aca))
* github publish to create new issue ([#1206](https://github.com/dendronhq/dendron/issues/1206)) ([67abef0](https://github.com/dendronhq/dendron/commit/67abef02c5615385a8a7f82fe290c8a443605a7f))
* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* user tag autocomplete & user tags updated on rename ([#1278](https://github.com/dendronhq/dendron/issues/1278)) ([9719f99](https://github.com/dendronhq/dendron/commit/9719f99550a2c51c1a22f6fb21ff750bb4115f89))
* user tags ([#1228](https://github.com/dendronhq/dendron/issues/1228)) ([98c0106](https://github.com/dendronhq/dendron/commit/98c0106367e384c130a927484b9ea294eb6f84fa))



## 0.55.2 (2021-08-21)


### Bug Fixes

* don't insert title when rendering note refs in preview ([#1157](https://github.com/dendronhq/dendron/issues/1157)) ([9d447af](https://github.com/dendronhq/dendron/commit/9d447af8ad7381bb8d3078fc44d4a188618acdfd))
* wrong internal links in nextjs publishing ([#1165](https://github.com/dendronhq/dendron/issues/1165)) ([59a949d](https://github.com/dendronhq/dendron/commit/59a949d2b5b541efb283e851060636b108eb5a98))



## 0.55.1 (2021-08-17)


### Features Dendron

* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* add new vaults from CLI to code workspace ([#1094](https://github.com/dendronhq/dendron/issues/1094)) ([2cde108](https://github.com/dendronhq/dendron/commit/2cde108b4c88a5c9d13b8eb6370f69879d6c9a62))
* CopyNoteLink copies footnotes as anchors ([#1117](https://github.com/dendronhq/dendron/issues/1117)) ([2168991](https://github.com/dendronhq/dendron/commit/21689914d0c84735d243b988dcceb276df97380f))
* frontmatter tags ([#1104](https://github.com/dendronhq/dendron/issues/1104)) ([e4c022f](https://github.com/dendronhq/dendron/commit/e4c022f422b1ce020215d59d2658218f10c75250))
* leading slash in markdown export pod ([#1136](https://github.com/dendronhq/dendron/issues/1136)) ([0f8ebbf](https://github.com/dendronhq/dendron/commit/0f8ebbf228f7af1bbbf677c9fea38989f87c635e))


### Features Dendron

* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))
* remove frontmatter tags if tag is moved outside `tags.` ([1bce9af](https://github.com/dendronhq/dendron/commit/1bce9af293a60fd453389a907fc3043fe173330c))
* seed cmds in plugin ([#1080](https://github.com/dendronhq/dendron/issues/1080)) ([e07a092](https://github.com/dendronhq/dendron/commit/e07a092b1a75548574f2ea45f1b465490b2091f3))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.58.1](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.58.1) (2021-09-08)


### Bug Fixes

* block anchor in list with single top level element ([#1242](https://github.com/dendronhq/dendron/issues/1242)) ([1ce3a21](https://github.com/dendronhq/dendron/commit/1ce3a216047d5a1a1638509cdc92e36e7ec86a1c)), closes [#1235](https://github.com/dendronhq/dendron/issues/1235)
* block anchors attached to code blocks in publishing ([#1267](https://github.com/dendronhq/dendron/issues/1267)) ([6b3c71c](https://github.com/dendronhq/dendron/commit/6b3c71cd6728dfee7eaa74db9f9b8168ad7a2e39))
* Frontmatter tags display similar to Children ([#1285](https://github.com/dendronhq/dendron/issues/1285)) ([a0ce014](https://github.com/dendronhq/dendron/commit/a0ce01469bd0de17768d1aff2711807425027d87))
* slugify github issue title ([#1218](https://github.com/dendronhq/dendron/issues/1218)) ([e6c2638](https://github.com/dendronhq/dendron/commit/e6c26380abd68f076dbe1d8ed542327c3ff558f3))


### Features Dendron

* dendron publishing with nextjs commands ([#1266](https://github.com/dendronhq/dendron/issues/1266)) ([fb90e98](https://github.com/dendronhq/dendron/commit/fb90e98999c1073b58480eb7364f6a70e31a6903))
* enable usePrettyRefs for nextJS publishing and preview ([#1239](https://github.com/dendronhq/dendron/issues/1239)) ([8a456a9](https://github.com/dendronhq/dendron/commit/8a456a910c45e927c8413d881324bd28401e2aca))
* github publish to create new issue ([#1206](https://github.com/dendronhq/dendron/issues/1206)) ([67abef0](https://github.com/dendronhq/dendron/commit/67abef02c5615385a8a7f82fe290c8a443605a7f))
* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* user tag autocomplete & user tags updated on rename ([#1278](https://github.com/dendronhq/dendron/issues/1278)) ([9719f99](https://github.com/dendronhq/dendron/commit/9719f99550a2c51c1a22f6fb21ff750bb4115f89))
* user tags ([#1228](https://github.com/dendronhq/dendron/issues/1228)) ([98c0106](https://github.com/dendronhq/dendron/commit/98c0106367e384c130a927484b9ea294eb6f84fa))



## 0.55.2 (2021-08-21)


### Bug Fixes

* don't insert title when rendering note refs in preview ([#1157](https://github.com/dendronhq/dendron/issues/1157)) ([9d447af](https://github.com/dendronhq/dendron/commit/9d447af8ad7381bb8d3078fc44d4a188618acdfd))
* wrong internal links in nextjs publishing ([#1165](https://github.com/dendronhq/dendron/issues/1165)) ([59a949d](https://github.com/dendronhq/dendron/commit/59a949d2b5b541efb283e851060636b108eb5a98))



## 0.55.1 (2021-08-17)


### Features Dendron

* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* add new vaults from CLI to code workspace ([#1094](https://github.com/dendronhq/dendron/issues/1094)) ([2cde108](https://github.com/dendronhq/dendron/commit/2cde108b4c88a5c9d13b8eb6370f69879d6c9a62))
* CopyNoteLink copies footnotes as anchors ([#1117](https://github.com/dendronhq/dendron/issues/1117)) ([2168991](https://github.com/dendronhq/dendron/commit/21689914d0c84735d243b988dcceb276df97380f))
* frontmatter tags ([#1104](https://github.com/dendronhq/dendron/issues/1104)) ([e4c022f](https://github.com/dendronhq/dendron/commit/e4c022f422b1ce020215d59d2658218f10c75250))
* leading slash in markdown export pod ([#1136](https://github.com/dendronhq/dendron/issues/1136)) ([0f8ebbf](https://github.com/dendronhq/dendron/commit/0f8ebbf228f7af1bbbf677c9fea38989f87c635e))


### Features Dendron

* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))
* remove frontmatter tags if tag is moved outside `tags.` ([1bce9af](https://github.com/dendronhq/dendron/commit/1bce9af293a60fd453389a907fc3043fe173330c))
* seed cmds in plugin ([#1080](https://github.com/dendronhq/dendron/issues/1080)) ([e07a092](https://github.com/dendronhq/dendron/commit/e07a092b1a75548574f2ea45f1b465490b2091f3))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





# [0.58.0](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.58.0) (2021-09-07)


### Bug Fixes

* block anchor in list with single top level element ([#1242](https://github.com/dendronhq/dendron/issues/1242)) ([1ce3a21](https://github.com/dendronhq/dendron/commit/1ce3a216047d5a1a1638509cdc92e36e7ec86a1c)), closes [#1235](https://github.com/dendronhq/dendron/issues/1235)
* block anchors attached to code blocks in publishing ([#1267](https://github.com/dendronhq/dendron/issues/1267)) ([6b3c71c](https://github.com/dendronhq/dendron/commit/6b3c71cd6728dfee7eaa74db9f9b8168ad7a2e39))
* Frontmatter tags display similar to Children ([#1285](https://github.com/dendronhq/dendron/issues/1285)) ([a0ce014](https://github.com/dendronhq/dendron/commit/a0ce01469bd0de17768d1aff2711807425027d87))
* slugify github issue title ([#1218](https://github.com/dendronhq/dendron/issues/1218)) ([e6c2638](https://github.com/dendronhq/dendron/commit/e6c26380abd68f076dbe1d8ed542327c3ff558f3))


### Features Dendron

* dendron publishing with nextjs commands ([#1266](https://github.com/dendronhq/dendron/issues/1266)) ([fb90e98](https://github.com/dendronhq/dendron/commit/fb90e98999c1073b58480eb7364f6a70e31a6903))
* enable usePrettyRefs for nextJS publishing and preview ([#1239](https://github.com/dendronhq/dendron/issues/1239)) ([8a456a9](https://github.com/dendronhq/dendron/commit/8a456a910c45e927c8413d881324bd28401e2aca))
* github publish to create new issue ([#1206](https://github.com/dendronhq/dendron/issues/1206)) ([67abef0](https://github.com/dendronhq/dendron/commit/67abef02c5615385a8a7f82fe290c8a443605a7f))
* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* user tag autocomplete & user tags updated on rename ([#1278](https://github.com/dendronhq/dendron/issues/1278)) ([9719f99](https://github.com/dendronhq/dendron/commit/9719f99550a2c51c1a22f6fb21ff750bb4115f89))
* user tags ([#1228](https://github.com/dendronhq/dendron/issues/1228)) ([98c0106](https://github.com/dendronhq/dendron/commit/98c0106367e384c130a927484b9ea294eb6f84fa))



## 0.55.2 (2021-08-21)


### Bug Fixes

* don't insert title when rendering note refs in preview ([#1157](https://github.com/dendronhq/dendron/issues/1157)) ([9d447af](https://github.com/dendronhq/dendron/commit/9d447af8ad7381bb8d3078fc44d4a188618acdfd))
* wrong internal links in nextjs publishing ([#1165](https://github.com/dendronhq/dendron/issues/1165)) ([59a949d](https://github.com/dendronhq/dendron/commit/59a949d2b5b541efb283e851060636b108eb5a98))



## 0.55.1 (2021-08-17)


### Features Dendron

* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* add new vaults from CLI to code workspace ([#1094](https://github.com/dendronhq/dendron/issues/1094)) ([2cde108](https://github.com/dendronhq/dendron/commit/2cde108b4c88a5c9d13b8eb6370f69879d6c9a62))
* CopyNoteLink copies footnotes as anchors ([#1117](https://github.com/dendronhq/dendron/issues/1117)) ([2168991](https://github.com/dendronhq/dendron/commit/21689914d0c84735d243b988dcceb276df97380f))
* frontmatter tags ([#1104](https://github.com/dendronhq/dendron/issues/1104)) ([e4c022f](https://github.com/dendronhq/dendron/commit/e4c022f422b1ce020215d59d2658218f10c75250))
* leading slash in markdown export pod ([#1136](https://github.com/dendronhq/dendron/issues/1136)) ([0f8ebbf](https://github.com/dendronhq/dendron/commit/0f8ebbf228f7af1bbbf677c9fea38989f87c635e))


### Features Dendron

* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))
* remove frontmatter tags if tag is moved outside `tags.` ([1bce9af](https://github.com/dendronhq/dendron/commit/1bce9af293a60fd453389a907fc3043fe173330c))
* seed cmds in plugin ([#1080](https://github.com/dendronhq/dendron/issues/1080)) ([e07a092](https://github.com/dendronhq/dendron/commit/e07a092b1a75548574f2ea45f1b465490b2091f3))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.57.3](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.57.3) (2021-09-06)


### Bug Fixes

* block anchor in list with single top level element ([#1242](https://github.com/dendronhq/dendron/issues/1242)) ([1ce3a21](https://github.com/dendronhq/dendron/commit/1ce3a216047d5a1a1638509cdc92e36e7ec86a1c)), closes [#1235](https://github.com/dendronhq/dendron/issues/1235)
* block anchors attached to code blocks in publishing ([#1267](https://github.com/dendronhq/dendron/issues/1267)) ([6b3c71c](https://github.com/dendronhq/dendron/commit/6b3c71cd6728dfee7eaa74db9f9b8168ad7a2e39))
* Frontmatter tags display similar to Children ([#1285](https://github.com/dendronhq/dendron/issues/1285)) ([a0ce014](https://github.com/dendronhq/dendron/commit/a0ce01469bd0de17768d1aff2711807425027d87))
* slugify github issue title ([#1218](https://github.com/dendronhq/dendron/issues/1218)) ([e6c2638](https://github.com/dendronhq/dendron/commit/e6c26380abd68f076dbe1d8ed542327c3ff558f3))


### Features Dendron

* dendron publishing with nextjs commands ([#1266](https://github.com/dendronhq/dendron/issues/1266)) ([fb90e98](https://github.com/dendronhq/dendron/commit/fb90e98999c1073b58480eb7364f6a70e31a6903))
* enable usePrettyRefs for nextJS publishing and preview ([#1239](https://github.com/dendronhq/dendron/issues/1239)) ([8a456a9](https://github.com/dendronhq/dendron/commit/8a456a910c45e927c8413d881324bd28401e2aca))
* github publish to create new issue ([#1206](https://github.com/dendronhq/dendron/issues/1206)) ([67abef0](https://github.com/dendronhq/dendron/commit/67abef02c5615385a8a7f82fe290c8a443605a7f))
* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* user tag autocomplete & user tags updated on rename ([#1278](https://github.com/dendronhq/dendron/issues/1278)) ([9719f99](https://github.com/dendronhq/dendron/commit/9719f99550a2c51c1a22f6fb21ff750bb4115f89))
* user tags ([#1228](https://github.com/dendronhq/dendron/issues/1228)) ([98c0106](https://github.com/dendronhq/dendron/commit/98c0106367e384c130a927484b9ea294eb6f84fa))



## 0.55.2 (2021-08-21)


### Bug Fixes

* don't insert title when rendering note refs in preview ([#1157](https://github.com/dendronhq/dendron/issues/1157)) ([9d447af](https://github.com/dendronhq/dendron/commit/9d447af8ad7381bb8d3078fc44d4a188618acdfd))
* wrong internal links in nextjs publishing ([#1165](https://github.com/dendronhq/dendron/issues/1165)) ([59a949d](https://github.com/dendronhq/dendron/commit/59a949d2b5b541efb283e851060636b108eb5a98))



## 0.55.1 (2021-08-17)


### Features Dendron

* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* add new vaults from CLI to code workspace ([#1094](https://github.com/dendronhq/dendron/issues/1094)) ([2cde108](https://github.com/dendronhq/dendron/commit/2cde108b4c88a5c9d13b8eb6370f69879d6c9a62))
* CopyNoteLink copies footnotes as anchors ([#1117](https://github.com/dendronhq/dendron/issues/1117)) ([2168991](https://github.com/dendronhq/dendron/commit/21689914d0c84735d243b988dcceb276df97380f))
* frontmatter tags ([#1104](https://github.com/dendronhq/dendron/issues/1104)) ([e4c022f](https://github.com/dendronhq/dendron/commit/e4c022f422b1ce020215d59d2658218f10c75250))
* leading slash in markdown export pod ([#1136](https://github.com/dendronhq/dendron/issues/1136)) ([0f8ebbf](https://github.com/dendronhq/dendron/commit/0f8ebbf228f7af1bbbf677c9fea38989f87c635e))


### Features Dendron

* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))
* remove frontmatter tags if tag is moved outside `tags.` ([1bce9af](https://github.com/dendronhq/dendron/commit/1bce9af293a60fd453389a907fc3043fe173330c))
* seed cmds in plugin ([#1080](https://github.com/dendronhq/dendron/issues/1080)) ([e07a092](https://github.com/dendronhq/dendron/commit/e07a092b1a75548574f2ea45f1b465490b2091f3))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.57.2](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.57.2) (2021-09-04)


### Bug Fixes

* block anchor in list with single top level element ([#1242](https://github.com/dendronhq/dendron/issues/1242)) ([1ce3a21](https://github.com/dendronhq/dendron/commit/1ce3a216047d5a1a1638509cdc92e36e7ec86a1c)), closes [#1235](https://github.com/dendronhq/dendron/issues/1235)
* block anchors attached to code blocks in publishing ([#1267](https://github.com/dendronhq/dendron/issues/1267)) ([6b3c71c](https://github.com/dendronhq/dendron/commit/6b3c71cd6728dfee7eaa74db9f9b8168ad7a2e39))
* Frontmatter tags display similar to Children ([#1285](https://github.com/dendronhq/dendron/issues/1285)) ([a0ce014](https://github.com/dendronhq/dendron/commit/a0ce01469bd0de17768d1aff2711807425027d87))
* slugify github issue title ([#1218](https://github.com/dendronhq/dendron/issues/1218)) ([e6c2638](https://github.com/dendronhq/dendron/commit/e6c26380abd68f076dbe1d8ed542327c3ff558f3))


### Features Dendron

* dendron publishing with nextjs commands ([#1266](https://github.com/dendronhq/dendron/issues/1266)) ([fb90e98](https://github.com/dendronhq/dendron/commit/fb90e98999c1073b58480eb7364f6a70e31a6903))
* enable usePrettyRefs for nextJS publishing and preview ([#1239](https://github.com/dendronhq/dendron/issues/1239)) ([8a456a9](https://github.com/dendronhq/dendron/commit/8a456a910c45e927c8413d881324bd28401e2aca))
* github publish to create new issue ([#1206](https://github.com/dendronhq/dendron/issues/1206)) ([67abef0](https://github.com/dendronhq/dendron/commit/67abef02c5615385a8a7f82fe290c8a443605a7f))
* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* user tag autocomplete & user tags updated on rename ([#1278](https://github.com/dendronhq/dendron/issues/1278)) ([9719f99](https://github.com/dendronhq/dendron/commit/9719f99550a2c51c1a22f6fb21ff750bb4115f89))
* user tags ([#1228](https://github.com/dendronhq/dendron/issues/1228)) ([98c0106](https://github.com/dendronhq/dendron/commit/98c0106367e384c130a927484b9ea294eb6f84fa))



## 0.55.2 (2021-08-21)


### Bug Fixes

* don't insert title when rendering note refs in preview ([#1157](https://github.com/dendronhq/dendron/issues/1157)) ([9d447af](https://github.com/dendronhq/dendron/commit/9d447af8ad7381bb8d3078fc44d4a188618acdfd))
* wrong internal links in nextjs publishing ([#1165](https://github.com/dendronhq/dendron/issues/1165)) ([59a949d](https://github.com/dendronhq/dendron/commit/59a949d2b5b541efb283e851060636b108eb5a98))



## 0.55.1 (2021-08-17)


### Features Dendron

* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* add new vaults from CLI to code workspace ([#1094](https://github.com/dendronhq/dendron/issues/1094)) ([2cde108](https://github.com/dendronhq/dendron/commit/2cde108b4c88a5c9d13b8eb6370f69879d6c9a62))
* CopyNoteLink copies footnotes as anchors ([#1117](https://github.com/dendronhq/dendron/issues/1117)) ([2168991](https://github.com/dendronhq/dendron/commit/21689914d0c84735d243b988dcceb276df97380f))
* frontmatter tags ([#1104](https://github.com/dendronhq/dendron/issues/1104)) ([e4c022f](https://github.com/dendronhq/dendron/commit/e4c022f422b1ce020215d59d2658218f10c75250))
* leading slash in markdown export pod ([#1136](https://github.com/dendronhq/dendron/issues/1136)) ([0f8ebbf](https://github.com/dendronhq/dendron/commit/0f8ebbf228f7af1bbbf677c9fea38989f87c635e))


### Features Dendron

* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))
* remove frontmatter tags if tag is moved outside `tags.` ([1bce9af](https://github.com/dendronhq/dendron/commit/1bce9af293a60fd453389a907fc3043fe173330c))
* seed cmds in plugin ([#1080](https://github.com/dendronhq/dendron/issues/1080)) ([e07a092](https://github.com/dendronhq/dendron/commit/e07a092b1a75548574f2ea45f1b465490b2091f3))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.57.1](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.57.1) (2021-09-04)


### Bug Fixes

* block anchor in list with single top level element ([#1242](https://github.com/dendronhq/dendron/issues/1242)) ([1ce3a21](https://github.com/dendronhq/dendron/commit/1ce3a216047d5a1a1638509cdc92e36e7ec86a1c)), closes [#1235](https://github.com/dendronhq/dendron/issues/1235)
* block anchors attached to code blocks in publishing ([#1267](https://github.com/dendronhq/dendron/issues/1267)) ([6b3c71c](https://github.com/dendronhq/dendron/commit/6b3c71cd6728dfee7eaa74db9f9b8168ad7a2e39))
* Frontmatter tags display similar to Children ([#1285](https://github.com/dendronhq/dendron/issues/1285)) ([a0ce014](https://github.com/dendronhq/dendron/commit/a0ce01469bd0de17768d1aff2711807425027d87))
* slugify github issue title ([#1218](https://github.com/dendronhq/dendron/issues/1218)) ([e6c2638](https://github.com/dendronhq/dendron/commit/e6c26380abd68f076dbe1d8ed542327c3ff558f3))


### Features Dendron

* dendron publishing with nextjs commands ([#1266](https://github.com/dendronhq/dendron/issues/1266)) ([fb90e98](https://github.com/dendronhq/dendron/commit/fb90e98999c1073b58480eb7364f6a70e31a6903))
* enable usePrettyRefs for nextJS publishing and preview ([#1239](https://github.com/dendronhq/dendron/issues/1239)) ([8a456a9](https://github.com/dendronhq/dendron/commit/8a456a910c45e927c8413d881324bd28401e2aca))
* github publish to create new issue ([#1206](https://github.com/dendronhq/dendron/issues/1206)) ([67abef0](https://github.com/dendronhq/dendron/commit/67abef02c5615385a8a7f82fe290c8a443605a7f))
* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* user tag autocomplete & user tags updated on rename ([#1278](https://github.com/dendronhq/dendron/issues/1278)) ([9719f99](https://github.com/dendronhq/dendron/commit/9719f99550a2c51c1a22f6fb21ff750bb4115f89))
* user tags ([#1228](https://github.com/dendronhq/dendron/issues/1228)) ([98c0106](https://github.com/dendronhq/dendron/commit/98c0106367e384c130a927484b9ea294eb6f84fa))



## 0.55.2 (2021-08-21)


### Bug Fixes

* don't insert title when rendering note refs in preview ([#1157](https://github.com/dendronhq/dendron/issues/1157)) ([9d447af](https://github.com/dendronhq/dendron/commit/9d447af8ad7381bb8d3078fc44d4a188618acdfd))
* wrong internal links in nextjs publishing ([#1165](https://github.com/dendronhq/dendron/issues/1165)) ([59a949d](https://github.com/dendronhq/dendron/commit/59a949d2b5b541efb283e851060636b108eb5a98))



## 0.55.1 (2021-08-17)


### Features Dendron

* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* add new vaults from CLI to code workspace ([#1094](https://github.com/dendronhq/dendron/issues/1094)) ([2cde108](https://github.com/dendronhq/dendron/commit/2cde108b4c88a5c9d13b8eb6370f69879d6c9a62))
* CopyNoteLink copies footnotes as anchors ([#1117](https://github.com/dendronhq/dendron/issues/1117)) ([2168991](https://github.com/dendronhq/dendron/commit/21689914d0c84735d243b988dcceb276df97380f))
* frontmatter tags ([#1104](https://github.com/dendronhq/dendron/issues/1104)) ([e4c022f](https://github.com/dendronhq/dendron/commit/e4c022f422b1ce020215d59d2658218f10c75250))
* leading slash in markdown export pod ([#1136](https://github.com/dendronhq/dendron/issues/1136)) ([0f8ebbf](https://github.com/dendronhq/dendron/commit/0f8ebbf228f7af1bbbf677c9fea38989f87c635e))


### Features Dendron

* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))
* remove frontmatter tags if tag is moved outside `tags.` ([1bce9af](https://github.com/dendronhq/dendron/commit/1bce9af293a60fd453389a907fc3043fe173330c))
* seed cmds in plugin ([#1080](https://github.com/dendronhq/dendron/issues/1080)) ([e07a092](https://github.com/dendronhq/dendron/commit/e07a092b1a75548574f2ea45f1b465490b2091f3))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





# [0.57.0](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.57.0) (2021-08-31)


### Bug Fixes

* **workspace:** browse note fail on windows ([3523f2a](https://github.com/dendronhq/dendron/commit/3523f2a2ad71743b3ee31293474a63336367f488))
* slugify github issue title ([#1218](https://github.com/dendronhq/dendron/issues/1218)) ([e6c2638](https://github.com/dendronhq/dendron/commit/e6c26380abd68f076dbe1d8ed542327c3ff558f3))


### Features Dendron

* github publish to create new issue ([#1206](https://github.com/dendronhq/dendron/issues/1206)) ([67abef0](https://github.com/dendronhq/dendron/commit/67abef02c5615385a8a7f82fe290c8a443605a7f))
* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* user tags ([#1228](https://github.com/dendronhq/dendron/issues/1228)) ([98c0106](https://github.com/dendronhq/dendron/commit/98c0106367e384c130a927484b9ea294eb6f84fa))



## 0.55.2 (2021-08-21)


### Bug Fixes

* don't insert title when rendering note refs in preview ([#1157](https://github.com/dendronhq/dendron/issues/1157)) ([9d447af](https://github.com/dendronhq/dendron/commit/9d447af8ad7381bb8d3078fc44d4a188618acdfd))
* wrong internal links in nextjs publishing ([#1165](https://github.com/dendronhq/dendron/issues/1165)) ([59a949d](https://github.com/dendronhq/dendron/commit/59a949d2b5b541efb283e851060636b108eb5a98))



## 0.55.1 (2021-08-17)


### Features Dendron

* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* add new vaults from CLI to code workspace ([#1094](https://github.com/dendronhq/dendron/issues/1094)) ([2cde108](https://github.com/dendronhq/dendron/commit/2cde108b4c88a5c9d13b8eb6370f69879d6c9a62))
* CopyNoteLink copies footnotes as anchors ([#1117](https://github.com/dendronhq/dendron/issues/1117)) ([2168991](https://github.com/dendronhq/dendron/commit/21689914d0c84735d243b988dcceb276df97380f))
* frontmatter tags ([#1104](https://github.com/dendronhq/dendron/issues/1104)) ([e4c022f](https://github.com/dendronhq/dendron/commit/e4c022f422b1ce020215d59d2658218f10c75250))
* leading slash in markdown export pod ([#1136](https://github.com/dendronhq/dendron/issues/1136)) ([0f8ebbf](https://github.com/dendronhq/dendron/commit/0f8ebbf228f7af1bbbf677c9fea38989f87c635e))


### Features Dendron

* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))
* remove frontmatter tags if tag is moved outside `tags.` ([1bce9af](https://github.com/dendronhq/dendron/commit/1bce9af293a60fd453389a907fc3043fe173330c))
* seed cmds in plugin ([#1080](https://github.com/dendronhq/dendron/issues/1080)) ([e07a092](https://github.com/dendronhq/dendron/commit/e07a092b1a75548574f2ea45f1b465490b2091f3))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





# [0.56.0](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.56.0) (2021-08-23)



## 0.55.2 (2021-08-21)


### Bug Fixes

* don't insert title when rendering note refs in preview ([#1157](https://github.com/dendronhq/dendron/issues/1157)) ([9d447af](https://github.com/dendronhq/dendron/commit/9d447af8ad7381bb8d3078fc44d4a188618acdfd))
* wrong internal links in nextjs publishing ([#1165](https://github.com/dendronhq/dendron/issues/1165)) ([59a949d](https://github.com/dendronhq/dendron/commit/59a949d2b5b541efb283e851060636b108eb5a98))



## 0.55.1 (2021-08-17)


### Features Dendron

* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* add new vaults from CLI to code workspace ([#1094](https://github.com/dendronhq/dendron/issues/1094)) ([2cde108](https://github.com/dendronhq/dendron/commit/2cde108b4c88a5c9d13b8eb6370f69879d6c9a62))
* CopyNoteLink copies footnotes as anchors ([#1117](https://github.com/dendronhq/dendron/issues/1117)) ([2168991](https://github.com/dendronhq/dendron/commit/21689914d0c84735d243b988dcceb276df97380f))
* frontmatter tags ([#1104](https://github.com/dendronhq/dendron/issues/1104)) ([e4c022f](https://github.com/dendronhq/dendron/commit/e4c022f422b1ce020215d59d2658218f10c75250))
* leading slash in markdown export pod ([#1136](https://github.com/dendronhq/dendron/issues/1136)) ([0f8ebbf](https://github.com/dendronhq/dendron/commit/0f8ebbf228f7af1bbbf677c9fea38989f87c635e))


### Features Dendron

* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))
* remove frontmatter tags if tag is moved outside `tags.` ([1bce9af](https://github.com/dendronhq/dendron/commit/1bce9af293a60fd453389a907fc3043fe173330c))
* seed cmds in plugin ([#1080](https://github.com/dendronhq/dendron/issues/1080)) ([e07a092](https://github.com/dendronhq/dendron/commit/e07a092b1a75548574f2ea45f1b465490b2091f3))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.55.2](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.55.2) (2021-08-19)


### Bug Fixes

* don't insert title when rendering note refs in preview ([#1157](https://github.com/dendronhq/dendron/issues/1157)) ([9d447af](https://github.com/dendronhq/dendron/commit/9d447af8ad7381bb8d3078fc44d4a188618acdfd))
* wrong internal links in nextjs publishing ([#1165](https://github.com/dendronhq/dendron/issues/1165)) ([59a949d](https://github.com/dendronhq/dendron/commit/59a949d2b5b541efb283e851060636b108eb5a98))



## 0.55.1 (2021-08-17)


### Features Dendron

* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* add new vaults from CLI to code workspace ([#1094](https://github.com/dendronhq/dendron/issues/1094)) ([2cde108](https://github.com/dendronhq/dendron/commit/2cde108b4c88a5c9d13b8eb6370f69879d6c9a62))
* CopyNoteLink copies footnotes as anchors ([#1117](https://github.com/dendronhq/dendron/issues/1117)) ([2168991](https://github.com/dendronhq/dendron/commit/21689914d0c84735d243b988dcceb276df97380f))
* frontmatter tags ([#1104](https://github.com/dendronhq/dendron/issues/1104)) ([e4c022f](https://github.com/dendronhq/dendron/commit/e4c022f422b1ce020215d59d2658218f10c75250))
* leading slash in markdown export pod ([#1136](https://github.com/dendronhq/dendron/issues/1136)) ([0f8ebbf](https://github.com/dendronhq/dendron/commit/0f8ebbf228f7af1bbbf677c9fea38989f87c635e))


### Features Dendron

* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))
* remove frontmatter tags if tag is moved outside `tags.` ([1bce9af](https://github.com/dendronhq/dendron/commit/1bce9af293a60fd453389a907fc3043fe173330c))
* seed cmds in plugin ([#1080](https://github.com/dendronhq/dendron/issues/1080)) ([e07a092](https://github.com/dendronhq/dendron/commit/e07a092b1a75548574f2ea45f1b465490b2091f3))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.55.1](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.55.1) (2021-08-17)


### Features Dendron

* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* add new vaults from CLI to code workspace ([#1094](https://github.com/dendronhq/dendron/issues/1094)) ([2cde108](https://github.com/dendronhq/dendron/commit/2cde108b4c88a5c9d13b8eb6370f69879d6c9a62))
* CopyNoteLink copies footnotes as anchors ([#1117](https://github.com/dendronhq/dendron/issues/1117)) ([2168991](https://github.com/dendronhq/dendron/commit/21689914d0c84735d243b988dcceb276df97380f))
* frontmatter tags ([#1104](https://github.com/dendronhq/dendron/issues/1104)) ([e4c022f](https://github.com/dendronhq/dendron/commit/e4c022f422b1ce020215d59d2658218f10c75250))
* leading slash in markdown export pod ([#1136](https://github.com/dendronhq/dendron/issues/1136)) ([0f8ebbf](https://github.com/dendronhq/dendron/commit/0f8ebbf228f7af1bbbf677c9fea38989f87c635e))


### Features Dendron

* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))
* remove frontmatter tags if tag is moved outside `tags.` ([1bce9af](https://github.com/dendronhq/dendron/commit/1bce9af293a60fd453389a907fc3043fe173330c))
* seed cmds in plugin ([#1080](https://github.com/dendronhq/dendron/issues/1080)) ([e07a092](https://github.com/dendronhq/dendron/commit/e07a092b1a75548574f2ea45f1b465490b2091f3))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





# [0.55.0](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.55.0) (2021-08-17)


### Features Dendron

* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* add new vaults from CLI to code workspace ([#1094](https://github.com/dendronhq/dendron/issues/1094)) ([2cde108](https://github.com/dendronhq/dendron/commit/2cde108b4c88a5c9d13b8eb6370f69879d6c9a62))
* CopyNoteLink copies footnotes as anchors ([#1117](https://github.com/dendronhq/dendron/issues/1117)) ([2168991](https://github.com/dendronhq/dendron/commit/21689914d0c84735d243b988dcceb276df97380f))
* frontmatter tags ([#1104](https://github.com/dendronhq/dendron/issues/1104)) ([e4c022f](https://github.com/dendronhq/dendron/commit/e4c022f422b1ce020215d59d2658218f10c75250))
* leading slash in markdown export pod ([#1136](https://github.com/dendronhq/dendron/issues/1136)) ([0f8ebbf](https://github.com/dendronhq/dendron/commit/0f8ebbf228f7af1bbbf677c9fea38989f87c635e))


### Features Dendron

* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))
* remove frontmatter tags if tag is moved outside `tags.` ([1bce9af](https://github.com/dendronhq/dendron/commit/1bce9af293a60fd453389a907fc3043fe173330c))
* seed cmds in plugin ([#1080](https://github.com/dendronhq/dendron/issues/1080)) ([e07a092](https://github.com/dendronhq/dendron/commit/e07a092b1a75548574f2ea45f1b465490b2091f3))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.54.1](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.54.1) (2021-08-13)


### Bug Fixes

* add new vaults from CLI to code workspace ([#1094](https://github.com/dendronhq/dendron/issues/1094)) ([2cde108](https://github.com/dendronhq/dendron/commit/2cde108b4c88a5c9d13b8eb6370f69879d6c9a62))
* CopyNoteLink copies footnotes as anchors ([#1117](https://github.com/dendronhq/dendron/issues/1117)) ([2168991](https://github.com/dendronhq/dendron/commit/21689914d0c84735d243b988dcceb276df97380f))
* frontmatter tags ([#1104](https://github.com/dendronhq/dendron/issues/1104)) ([e4c022f](https://github.com/dendronhq/dendron/commit/e4c022f422b1ce020215d59d2658218f10c75250))
* leading slash in markdown export pod ([#1136](https://github.com/dendronhq/dendron/issues/1136)) ([0f8ebbf](https://github.com/dendronhq/dendron/commit/0f8ebbf228f7af1bbbf677c9fea38989f87c635e))


### Features Dendron

* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))
* remove frontmatter tags if tag is moved outside `tags.` ([1bce9af](https://github.com/dendronhq/dendron/commit/1bce9af293a60fd453389a907fc3043fe173330c))
* seed cmds in plugin ([#1080](https://github.com/dendronhq/dendron/issues/1080)) ([e07a092](https://github.com/dendronhq/dendron/commit/e07a092b1a75548574f2ea45f1b465490b2091f3))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





# [0.54.0](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.54.0) (2021-08-10)


### Bug Fixes

* add new vaults from CLI to code workspace ([#1094](https://github.com/dendronhq/dendron/issues/1094)) ([2cde108](https://github.com/dendronhq/dendron/commit/2cde108b4c88a5c9d13b8eb6370f69879d6c9a62))
* frontmatter tags ([#1104](https://github.com/dendronhq/dendron/issues/1104)) ([e4c022f](https://github.com/dendronhq/dendron/commit/e4c022f422b1ce020215d59d2658218f10c75250))


### Features Dendron

* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))
* remove frontmatter tags if tag is moved outside `tags.` ([1bce9af](https://github.com/dendronhq/dendron/commit/1bce9af293a60fd453389a907fc3043fe173330c))
* seed cmds in plugin ([#1080](https://github.com/dendronhq/dendron/issues/1080)) ([e07a092](https://github.com/dendronhq/dendron/commit/e07a092b1a75548574f2ea45f1b465490b2091f3))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.53.10](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.53.10) (2021-08-10)


### Bug Fixes

* add new vaults from CLI to code workspace ([#1094](https://github.com/dendronhq/dendron/issues/1094)) ([2cde108](https://github.com/dendronhq/dendron/commit/2cde108b4c88a5c9d13b8eb6370f69879d6c9a62))
* frontmatter tags ([#1104](https://github.com/dendronhq/dendron/issues/1104)) ([e4c022f](https://github.com/dendronhq/dendron/commit/e4c022f422b1ce020215d59d2658218f10c75250))


### Features Dendron

* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))
* remove frontmatter tags if tag is moved outside `tags.` ([1bce9af](https://github.com/dendronhq/dendron/commit/1bce9af293a60fd453389a907fc3043fe173330c))
* seed cmds in plugin ([#1080](https://github.com/dendronhq/dendron/issues/1080)) ([e07a092](https://github.com/dendronhq/dendron/commit/e07a092b1a75548574f2ea45f1b465490b2091f3))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.53.9](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.53.9) (2021-08-10)


### Bug Fixes

* add new vaults from CLI to code workspace ([#1094](https://github.com/dendronhq/dendron/issues/1094)) ([2cde108](https://github.com/dendronhq/dendron/commit/2cde108b4c88a5c9d13b8eb6370f69879d6c9a62))
* frontmatter tags ([#1104](https://github.com/dendronhq/dendron/issues/1104)) ([e4c022f](https://github.com/dendronhq/dendron/commit/e4c022f422b1ce020215d59d2658218f10c75250))


### Features Dendron

* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))
* remove frontmatter tags if tag is moved outside `tags.` ([1bce9af](https://github.com/dendronhq/dendron/commit/1bce9af293a60fd453389a907fc3043fe173330c))
* seed cmds in plugin ([#1080](https://github.com/dendronhq/dendron/issues/1080)) ([e07a092](https://github.com/dendronhq/dendron/commit/e07a092b1a75548574f2ea45f1b465490b2091f3))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.53.8](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.53.8) (2021-08-10)


### Bug Fixes

* add new vaults from CLI to code workspace ([#1094](https://github.com/dendronhq/dendron/issues/1094)) ([2cde108](https://github.com/dendronhq/dendron/commit/2cde108b4c88a5c9d13b8eb6370f69879d6c9a62))
* frontmatter tags ([#1104](https://github.com/dendronhq/dendron/issues/1104)) ([e4c022f](https://github.com/dendronhq/dendron/commit/e4c022f422b1ce020215d59d2658218f10c75250))


### Features Dendron

* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))
* remove frontmatter tags if tag is moved outside `tags.` ([1bce9af](https://github.com/dendronhq/dendron/commit/1bce9af293a60fd453389a907fc3043fe173330c))
* seed cmds in plugin ([#1080](https://github.com/dendronhq/dendron/issues/1080)) ([e07a092](https://github.com/dendronhq/dendron/commit/e07a092b1a75548574f2ea45f1b465490b2091f3))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.53.7](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.53.7) (2021-08-10)


### Bug Fixes

* add new vaults from CLI to code workspace ([#1094](https://github.com/dendronhq/dendron/issues/1094)) ([2cde108](https://github.com/dendronhq/dendron/commit/2cde108b4c88a5c9d13b8eb6370f69879d6c9a62))
* frontmatter tags ([#1104](https://github.com/dendronhq/dendron/issues/1104)) ([e4c022f](https://github.com/dendronhq/dendron/commit/e4c022f422b1ce020215d59d2658218f10c75250))


### Features Dendron

* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))
* remove frontmatter tags if tag is moved outside `tags.` ([1bce9af](https://github.com/dendronhq/dendron/commit/1bce9af293a60fd453389a907fc3043fe173330c))
* seed cmds in plugin ([#1080](https://github.com/dendronhq/dendron/issues/1080)) ([e07a092](https://github.com/dendronhq/dendron/commit/e07a092b1a75548574f2ea45f1b465490b2091f3))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.53.6](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.53.6) (2021-08-10)


### Bug Fixes

* add new vaults from CLI to code workspace ([#1094](https://github.com/dendronhq/dendron/issues/1094)) ([2cde108](https://github.com/dendronhq/dendron/commit/2cde108b4c88a5c9d13b8eb6370f69879d6c9a62))
* frontmatter tags ([#1104](https://github.com/dendronhq/dendron/issues/1104)) ([e4c022f](https://github.com/dendronhq/dendron/commit/e4c022f422b1ce020215d59d2658218f10c75250))


### Features Dendron

* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))
* remove frontmatter tags if tag is moved outside `tags.` ([1bce9af](https://github.com/dendronhq/dendron/commit/1bce9af293a60fd453389a907fc3043fe173330c))
* seed cmds in plugin ([#1080](https://github.com/dendronhq/dendron/issues/1080)) ([e07a092](https://github.com/dendronhq/dendron/commit/e07a092b1a75548574f2ea45f1b465490b2091f3))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.53.5](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.53.5) (2021-08-10)


### Bug Fixes

* add new vaults from CLI to code workspace ([#1094](https://github.com/dendronhq/dendron/issues/1094)) ([2cde108](https://github.com/dendronhq/dendron/commit/2cde108b4c88a5c9d13b8eb6370f69879d6c9a62))
* frontmatter tags ([#1104](https://github.com/dendronhq/dendron/issues/1104)) ([e4c022f](https://github.com/dendronhq/dendron/commit/e4c022f422b1ce020215d59d2658218f10c75250))


### Features Dendron

* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))
* remove frontmatter tags if tag is moved outside `tags.` ([1bce9af](https://github.com/dendronhq/dendron/commit/1bce9af293a60fd453389a907fc3043fe173330c))
* seed cmds in plugin ([#1080](https://github.com/dendronhq/dendron/issues/1080)) ([e07a092](https://github.com/dendronhq/dendron/commit/e07a092b1a75548574f2ea45f1b465490b2091f3))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.53.4](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.53.4) (2021-08-10)


### Bug Fixes

* add new vaults from CLI to code workspace ([#1094](https://github.com/dendronhq/dendron/issues/1094)) ([2cde108](https://github.com/dendronhq/dendron/commit/2cde108b4c88a5c9d13b8eb6370f69879d6c9a62))
* frontmatter tags ([#1104](https://github.com/dendronhq/dendron/issues/1104)) ([e4c022f](https://github.com/dendronhq/dendron/commit/e4c022f422b1ce020215d59d2658218f10c75250))


### Features Dendron

* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))
* remove frontmatter tags if tag is moved outside `tags.` ([1bce9af](https://github.com/dendronhq/dendron/commit/1bce9af293a60fd453389a907fc3043fe173330c))
* seed cmds in plugin ([#1080](https://github.com/dendronhq/dendron/issues/1080)) ([e07a092](https://github.com/dendronhq/dendron/commit/e07a092b1a75548574f2ea45f1b465490b2091f3))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.53.3](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.53.3) (2021-08-08)


### Bug Fixes

* add new vaults from CLI to code workspace ([#1094](https://github.com/dendronhq/dendron/issues/1094)) ([2cde108](https://github.com/dendronhq/dendron/commit/2cde108b4c88a5c9d13b8eb6370f69879d6c9a62))
* frontmatter tags ([#1104](https://github.com/dendronhq/dendron/issues/1104)) ([e4c022f](https://github.com/dendronhq/dendron/commit/e4c022f422b1ce020215d59d2658218f10c75250))


### Features Dendron

* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))
* remove frontmatter tags if tag is moved outside `tags.` ([1bce9af](https://github.com/dendronhq/dendron/commit/1bce9af293a60fd453389a907fc3043fe173330c))
* seed cmds in plugin ([#1080](https://github.com/dendronhq/dendron/issues/1080)) ([e07a092](https://github.com/dendronhq/dendron/commit/e07a092b1a75548574f2ea45f1b465490b2091f3))





## [0.53.2](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.53.2) (2021-08-06)


### Bug Fixes

* add new vaults from CLI to code workspace ([#1094](https://github.com/dendronhq/dendron/issues/1094)) ([2cde108](https://github.com/dendronhq/dendron/commit/2cde108b4c88a5c9d13b8eb6370f69879d6c9a62))


### Features Dendron

* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))
* remove frontmatter tags if tag is moved outside `tags.` ([1bce9af](https://github.com/dendronhq/dendron/commit/1bce9af293a60fd453389a907fc3043fe173330c))
* seed cmds in plugin ([#1080](https://github.com/dendronhq/dendron/issues/1080)) ([e07a092](https://github.com/dendronhq/dendron/commit/e07a092b1a75548574f2ea45f1b465490b2091f3))





## [0.53.1](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.53.1) (2021-08-06)


### Bug Fixes

* add new vaults from CLI to code workspace ([#1094](https://github.com/dendronhq/dendron/issues/1094)) ([2cde108](https://github.com/dendronhq/dendron/commit/2cde108b4c88a5c9d13b8eb6370f69879d6c9a62))


### Features Dendron

* option to disable frontmatter tag rendering ([7985e23](https://github.com/dendronhq/dendron/commit/7985e2323950f16f2c5afa55c115a1af52e82b07))
* remove frontmatter tags if tag is moved outside `tags.` ([1bce9af](https://github.com/dendronhq/dendron/commit/1bce9af293a60fd453389a907fc3043fe173330c))
* seed cmds in plugin ([#1080](https://github.com/dendronhq/dendron/issues/1080)) ([e07a092](https://github.com/dendronhq/dendron/commit/e07a092b1a75548574f2ea45f1b465490b2091f3))





# [0.53.0](https://github.com/dendronhq/dendron/compare/v0.52.0...v0.53.0) (2021-08-03)


### Bug Fixes

* hashtags include punctuation and quotation marks ([#1054](https://github.com/dendronhq/dendron/issues/1054)) ([8afa5bf](https://github.com/dendronhq/dendron/commit/8afa5bf07853d98f3c9939e3b8490c45cf2a5e1a)), closes [#1048](https://github.com/dendronhq/dendron/issues/1048)





# [0.52.0](https://github.com/dendronhq/dendron/compare/v0.51.3...v0.52.0) (2021-07-26)


### Features Dendron

* handle local images in preview v2 ([e4da5aa](https://github.com/dendronhq/dendron/commit/e4da5aa4ddb77eefde5118543b83f2784af34870))





## [0.51.4](https://github.com/dendronhq/dendron/compare/v0.51.3...v0.51.4) (2021-07-25)


### Features Dendron

* handle local images in preview v2 ([e4da5aa](https://github.com/dendronhq/dendron/commit/e4da5aa4ddb77eefde5118543b83f2784af34870))





## [0.51.2](https://github.com/dendronhq/dendron/compare/v0.51.0...v0.51.2) (2021-07-22)


### Bug Fixes

* hashtags links duplicate the text following them ([#1003](https://github.com/dendronhq/dendron/issues/1003)) ([ef5afed](https://github.com/dendronhq/dendron/commit/ef5afedffad293aa0c363a87a6abe5c425b653e5))
* wikilink aliases with apostrophes & headers containing wikilinks ([#1004](https://github.com/dendronhq/dendron/issues/1004)) ([11bd317](https://github.com/dendronhq/dendron/commit/11bd317bd4f7dfe1fff3dccc87b90aea7f6c0742)), closes [#958](https://github.com/dendronhq/dendron/issues/958) [#959](https://github.com/dendronhq/dendron/issues/959)





## [0.51.1](https://github.com/dendronhq/dendron/compare/v0.51.0...v0.51.1) (2021-07-20)


### Bug Fixes

* hashtags links duplicate the text following them ([#1003](https://github.com/dendronhq/dendron/issues/1003)) ([ef5afed](https://github.com/dendronhq/dendron/commit/ef5afedffad293aa0c363a87a6abe5c425b653e5))





# [0.51.0](https://github.com/dendronhq/dendron/compare/v0.49.0...v0.51.0) (2021-07-19)


### Bug Fixes

* avoid parsing bad wikilinks instead of erroring out ([#951](https://github.com/dendronhq/dendron/issues/951)) ([00668b0](https://github.com/dendronhq/dendron/commit/00668b0fd3ba12d39a3774d3835ebb64d13f4a1f))
* last modiified timestamp not updating ([#961](https://github.com/dendronhq/dendron/issues/961)) ([71afabc](https://github.com/dendronhq/dendron/commit/71afabc1a29a09bd0f9acb5cd215b75e973ae3fd))
* local images in hover preview are now displayed ([#946](https://github.com/dendronhq/dendron/issues/946)) ([04b8374](https://github.com/dendronhq/dendron/commit/04b8374dff5b062819a3a1c56e79dc74631f4fe0))
* normalize casing when fetchiing assets ([3b42ec4](https://github.com/dendronhq/dendron/commit/3b42ec4dca32f98574092373ecdf61b61f06de55))
* note ref use title of referenced note ([a3e217d](https://github.com/dendronhq/dendron/commit/a3e217d3be0774e0ba2b78ad6503e385a8028a80))
* store workspace using case insensitive keys ([#934](https://github.com/dendronhq/dendron/issues/934)) ([4de138b](https://github.com/dendronhq/dendron/commit/4de138be7853f35103ca46533546b6275df4193e))


### Features Dendron

* auto completion for anchors and headers ([#894](https://github.com/dendronhq/dendron/issues/894)) ([13e81d4](https://github.com/dendronhq/dendron/commit/13e81d49c1f14ee18457543f8e0818d0e36c17db))
* hashtags ([#985](https://github.com/dendronhq/dendron/issues/985)) ([85d44fc](https://github.com/dendronhq/dendron/commit/85d44fc975db4564f5826ae87e380d37c0263b0f))
* improved block anchor in publishing ([#933](https://github.com/dendronhq/dendron/issues/933)) ([7b6ab6f](https://github.com/dendronhq/dendron/commit/7b6ab6fbcf22656919ff271382f24011684862a4))
* show unreferenced links in backlink panel ([#909](https://github.com/dendronhq/dendron/issues/909)) ([4e65a20](https://github.com/dendronhq/dendron/commit/4e65a20a344b7276d3452fc0cebb8f19339eea67))
* support dynamic theming ([1da7714](https://github.com/dendronhq/dendron/commit/1da7714f50acbba312a7e2e7a497f9e53920c96f))





## [0.50.3](https://github.com/dendronhq/dendron/compare/v0.49.0...v0.50.3) (2021-07-19)


### Bug Fixes

* avoid parsing bad wikilinks instead of erroring out ([#951](https://github.com/dendronhq/dendron/issues/951)) ([00668b0](https://github.com/dendronhq/dendron/commit/00668b0fd3ba12d39a3774d3835ebb64d13f4a1f))
* last modiified timestamp not updating ([#961](https://github.com/dendronhq/dendron/issues/961)) ([71afabc](https://github.com/dendronhq/dendron/commit/71afabc1a29a09bd0f9acb5cd215b75e973ae3fd))
* local images in hover preview are now displayed ([#946](https://github.com/dendronhq/dendron/issues/946)) ([04b8374](https://github.com/dendronhq/dendron/commit/04b8374dff5b062819a3a1c56e79dc74631f4fe0))
* normalize casing when fetchiing assets ([3b42ec4](https://github.com/dendronhq/dendron/commit/3b42ec4dca32f98574092373ecdf61b61f06de55))
* note ref use title of referenced note ([a3e217d](https://github.com/dendronhq/dendron/commit/a3e217d3be0774e0ba2b78ad6503e385a8028a80))
* store workspace using case insensitive keys ([#934](https://github.com/dendronhq/dendron/issues/934)) ([4de138b](https://github.com/dendronhq/dendron/commit/4de138be7853f35103ca46533546b6275df4193e))


### Features Dendron

* auto completion for anchors and headers ([#894](https://github.com/dendronhq/dendron/issues/894)) ([13e81d4](https://github.com/dendronhq/dendron/commit/13e81d49c1f14ee18457543f8e0818d0e36c17db))
* hashtags ([#985](https://github.com/dendronhq/dendron/issues/985)) ([85d44fc](https://github.com/dendronhq/dendron/commit/85d44fc975db4564f5826ae87e380d37c0263b0f))
* improved block anchor in publishing ([#933](https://github.com/dendronhq/dendron/issues/933)) ([7b6ab6f](https://github.com/dendronhq/dendron/commit/7b6ab6fbcf22656919ff271382f24011684862a4))
* show unreferenced links in backlink panel ([#909](https://github.com/dendronhq/dendron/issues/909)) ([4e65a20](https://github.com/dendronhq/dendron/commit/4e65a20a344b7276d3452fc0cebb8f19339eea67))
* support dynamic theming ([1da7714](https://github.com/dendronhq/dendron/commit/1da7714f50acbba312a7e2e7a497f9e53920c96f))





## [0.50.2](https://github.com/dendronhq/dendron/compare/v0.49.0...v0.50.2) (2021-07-19)


### Bug Fixes

* avoid parsing bad wikilinks instead of erroring out ([#951](https://github.com/dendronhq/dendron/issues/951)) ([00668b0](https://github.com/dendronhq/dendron/commit/00668b0fd3ba12d39a3774d3835ebb64d13f4a1f))
* last modiified timestamp not updating ([#961](https://github.com/dendronhq/dendron/issues/961)) ([71afabc](https://github.com/dendronhq/dendron/commit/71afabc1a29a09bd0f9acb5cd215b75e973ae3fd))
* local images in hover preview are now displayed ([#946](https://github.com/dendronhq/dendron/issues/946)) ([04b8374](https://github.com/dendronhq/dendron/commit/04b8374dff5b062819a3a1c56e79dc74631f4fe0))
* normalize casing when fetchiing assets ([3b42ec4](https://github.com/dendronhq/dendron/commit/3b42ec4dca32f98574092373ecdf61b61f06de55))
* note ref use title of referenced note ([a3e217d](https://github.com/dendronhq/dendron/commit/a3e217d3be0774e0ba2b78ad6503e385a8028a80))
* store workspace using case insensitive keys ([#934](https://github.com/dendronhq/dendron/issues/934)) ([4de138b](https://github.com/dendronhq/dendron/commit/4de138be7853f35103ca46533546b6275df4193e))


### Features Dendron

* auto completion for anchors and headers ([#894](https://github.com/dendronhq/dendron/issues/894)) ([13e81d4](https://github.com/dendronhq/dendron/commit/13e81d49c1f14ee18457543f8e0818d0e36c17db))
* hashtags ([#985](https://github.com/dendronhq/dendron/issues/985)) ([85d44fc](https://github.com/dendronhq/dendron/commit/85d44fc975db4564f5826ae87e380d37c0263b0f))
* improved block anchor in publishing ([#933](https://github.com/dendronhq/dendron/issues/933)) ([7b6ab6f](https://github.com/dendronhq/dendron/commit/7b6ab6fbcf22656919ff271382f24011684862a4))
* show unreferenced links in backlink panel ([#909](https://github.com/dendronhq/dendron/issues/909)) ([4e65a20](https://github.com/dendronhq/dendron/commit/4e65a20a344b7276d3452fc0cebb8f19339eea67))
* support dynamic theming ([1da7714](https://github.com/dendronhq/dendron/commit/1da7714f50acbba312a7e2e7a497f9e53920c96f))





## [0.50.1](https://github.com/dendronhq/dendron/compare/v0.49.0...v0.50.1) (2021-07-16)


### Bug Fixes

* avoid parsing bad wikilinks instead of erroring out ([#951](https://github.com/dendronhq/dendron/issues/951)) ([00668b0](https://github.com/dendronhq/dendron/commit/00668b0fd3ba12d39a3774d3835ebb64d13f4a1f))
* last modiified timestamp not updating ([#961](https://github.com/dendronhq/dendron/issues/961)) ([71afabc](https://github.com/dendronhq/dendron/commit/71afabc1a29a09bd0f9acb5cd215b75e973ae3fd))
* local images in hover preview are now displayed ([#946](https://github.com/dendronhq/dendron/issues/946)) ([04b8374](https://github.com/dendronhq/dendron/commit/04b8374dff5b062819a3a1c56e79dc74631f4fe0))
* note ref use title of referenced note ([a3e217d](https://github.com/dendronhq/dendron/commit/a3e217d3be0774e0ba2b78ad6503e385a8028a80))
* store workspace using case insensitive keys ([#934](https://github.com/dendronhq/dendron/issues/934)) ([4de138b](https://github.com/dendronhq/dendron/commit/4de138be7853f35103ca46533546b6275df4193e))


### Features Dendron

* auto completion for anchors and headers ([#894](https://github.com/dendronhq/dendron/issues/894)) ([13e81d4](https://github.com/dendronhq/dendron/commit/13e81d49c1f14ee18457543f8e0818d0e36c17db))
* hashtags ([#985](https://github.com/dendronhq/dendron/issues/985)) ([85d44fc](https://github.com/dendronhq/dendron/commit/85d44fc975db4564f5826ae87e380d37c0263b0f))
* improved block anchor in publishing ([#933](https://github.com/dendronhq/dendron/issues/933)) ([7b6ab6f](https://github.com/dendronhq/dendron/commit/7b6ab6fbcf22656919ff271382f24011684862a4))
* show unreferenced links in backlink panel ([#909](https://github.com/dendronhq/dendron/issues/909)) ([4e65a20](https://github.com/dendronhq/dendron/commit/4e65a20a344b7276d3452fc0cebb8f19339eea67))
* support dynamic theming ([1da7714](https://github.com/dendronhq/dendron/commit/1da7714f50acbba312a7e2e7a497f9e53920c96f))





# [0.50.0](https://github.com/dendronhq/dendron/compare/v0.49.0...v0.50.0) (2021-07-12)


### Bug Fixes

* avoid parsing bad wikilinks instead of erroring out ([#951](https://github.com/dendronhq/dendron/issues/951)) ([00668b0](https://github.com/dendronhq/dendron/commit/00668b0fd3ba12d39a3774d3835ebb64d13f4a1f))
* local images in hover preview are now displayed ([#946](https://github.com/dendronhq/dendron/issues/946)) ([04b8374](https://github.com/dendronhq/dendron/commit/04b8374dff5b062819a3a1c56e79dc74631f4fe0))
* store workspace using case insensitive keys ([#934](https://github.com/dendronhq/dendron/issues/934)) ([4de138b](https://github.com/dendronhq/dendron/commit/4de138be7853f35103ca46533546b6275df4193e))


### Features Dendron

* auto completion for anchors and headers ([#894](https://github.com/dendronhq/dendron/issues/894)) ([13e81d4](https://github.com/dendronhq/dendron/commit/13e81d49c1f14ee18457543f8e0818d0e36c17db))
* improved block anchor in publishing ([#933](https://github.com/dendronhq/dendron/issues/933)) ([7b6ab6f](https://github.com/dendronhq/dendron/commit/7b6ab6fbcf22656919ff271382f24011684862a4))





# [0.49.0](https://github.com/dendronhq/dendron/compare/v0.48.3...v0.49.0) (2021-07-05)


### Features Dendron

* support rendering images for preview ([b4a109a](https://github.com/dendronhq/dendron/commit/b4a109a16cca846006069db2953baa8a11527117))





## [0.48.3](https://github.com/dendronhq/dendron/compare/v0.48.2...v0.48.3) (2021-07-02)


### Bug Fixes

* block anchors inside links are parsed as anchors ([#911](https://github.com/dendronhq/dendron/issues/911)) ([80eef6c](https://github.com/dendronhq/dendron/commit/80eef6ca95af447938de2dbcf132ca05ede6956d))





## [0.48.2](https://github.com/dendronhq/dendron/compare/v0.48.1...v0.48.2) (2021-07-01)

**Note:** Version bump only for package @dendronhq/engine-test-utils





## [0.48.1](https://github.com/dendronhq/dendron/compare/v0.48.0...v0.48.1) (2021-06-30)


### Features Dendron

* preview v2 mvp ([a9b6d07](https://github.com/dendronhq/dendron/commit/a9b6d071ccca5f182d8a7985c68926424a2a1f2d))





# [0.48.0](https://github.com/dendronhq/dendron/compare/v0.47.0...v0.48.0) (2021-06-28)


### Bug Fixes

* Ensure `runEngineTestV5` always restores mocks ([#850](https://github.com/dendronhq/dendron/issues/850)) ([a81b249](https://github.com/dendronhq/dendron/commit/a81b24984e90feb40249bb72426e0d84e1df5802))
* notes failing parsing shouldn't crash initialization ([#855](https://github.com/dendronhq/dendron/issues/855)) ([8f96c6f](https://github.com/dendronhq/dendron/commit/8f96c6f47fa0f0ba7d05d6dbc939928b8f4b754f))


### Features Dendron

* workspace-trust-for-hooks ([#845](https://github.com/dendronhq/dendron/issues/845)) ([9fc3e15](https://github.com/dendronhq/dendron/commit/9fc3e15826f62daf87f5d39a93de0d6c33992413))





## [0.47.2](https://github.com/dendronhq/dendron/compare/v0.47.0...v0.47.2) (2021-06-24)


### Bug Fixes

* Ensure `runEngineTestV5` always restores mocks ([#850](https://github.com/dendronhq/dendron/issues/850)) ([a81b249](https://github.com/dendronhq/dendron/commit/a81b24984e90feb40249bb72426e0d84e1df5802))
* notes failing parsing shouldn't crash initialization ([#855](https://github.com/dendronhq/dendron/issues/855)) ([8f96c6f](https://github.com/dendronhq/dendron/commit/8f96c6f47fa0f0ba7d05d6dbc939928b8f4b754f))


### Features Dendron

* workspace-trust-for-hooks ([#845](https://github.com/dendronhq/dendron/issues/845)) ([9fc3e15](https://github.com/dendronhq/dendron/commit/9fc3e15826f62daf87f5d39a93de0d6c33992413))





## [0.47.1](https://github.com/dendronhq/dendron/compare/v0.47.0...v0.47.1) (2021-06-23)


### Bug Fixes

* Ensure `runEngineTestV5` always restores mocks ([#850](https://github.com/dendronhq/dendron/issues/850)) ([a81b249](https://github.com/dendronhq/dendron/commit/a81b24984e90feb40249bb72426e0d84e1df5802))


### Features Dendron

* workspace-trust-for-hooks ([#845](https://github.com/dendronhq/dendron/issues/845)) ([9fc3e15](https://github.com/dendronhq/dendron/commit/9fc3e15826f62daf87f5d39a93de0d6c33992413))





# [0.47.0](https://github.com/dendronhq/dendron/compare/v0.46.1...v0.47.0) (2021-06-21)


### Bug Fixes

* **preview:** note refs showing first line as html ([5a025e3](https://github.com/dendronhq/dendron/commit/5a025e3ccd3e2c40ee2975577b831339b272e75d))
* order of vaults for tests ([edec699](https://github.com/dendronhq/dendron/commit/edec6998e7cb3deb659b2da41be02264e7aaaa1f))


### Features Dendron

* airtable export pod ([e04dfb4](https://github.com/dendronhq/dendron/commit/e04dfb4d26edecbe02fbdd99adf1a387ef6dfd45))
* remove seed cmd ([252f297](https://github.com/dendronhq/dendron/commit/252f29741f1cabb915e9e541d80256b21ef594d0))
* seed add cmd ([a8f245b](https://github.com/dendronhq/dendron/commit/a8f245b1a29f6de0a80839c1bd765a61941ab58f))
* support init seeds on startup ([ef095a6](https://github.com/dendronhq/dendron/commit/ef095a60d646df510b18971264a1443c13e41653))





## [0.46.3-alpha.0](https://github.com/dendronhq/dendron/compare/v0.46.1...v0.46.3-alpha.0) (2021-06-19)


### Bug Fixes

* **preview:** note refs showing first line as html ([5a025e3](https://github.com/dendronhq/dendron/commit/5a025e3ccd3e2c40ee2975577b831339b272e75d))
* order of vaults for tests ([edec699](https://github.com/dendronhq/dendron/commit/edec6998e7cb3deb659b2da41be02264e7aaaa1f))


### Features Dendron

* airtable export pod ([e04dfb4](https://github.com/dendronhq/dendron/commit/e04dfb4d26edecbe02fbdd99adf1a387ef6dfd45))
* remove seed cmd ([252f297](https://github.com/dendronhq/dendron/commit/252f29741f1cabb915e9e541d80256b21ef594d0))
* seed add cmd ([a8f245b](https://github.com/dendronhq/dendron/commit/a8f245b1a29f6de0a80839c1bd765a61941ab58f))
* support init seeds on startup ([ef095a6](https://github.com/dendronhq/dendron/commit/ef095a60d646df510b18971264a1443c13e41653))





## [0.46.2](https://github.com/dendronhq/dendron/compare/v0.46.1...v0.46.2) (2021-06-19)


### Bug Fixes

* **preview:** note refs showing first line as html ([5a025e3](https://github.com/dendronhq/dendron/commit/5a025e3ccd3e2c40ee2975577b831339b272e75d))
* order of vaults for tests ([edec699](https://github.com/dendronhq/dendron/commit/edec6998e7cb3deb659b2da41be02264e7aaaa1f))


### Features Dendron

* airtable export pod ([e04dfb4](https://github.com/dendronhq/dendron/commit/e04dfb4d26edecbe02fbdd99adf1a387ef6dfd45))
* remove seed cmd ([252f297](https://github.com/dendronhq/dendron/commit/252f29741f1cabb915e9e541d80256b21ef594d0))
* seed add cmd ([a8f245b](https://github.com/dendronhq/dendron/commit/a8f245b1a29f6de0a80839c1bd765a61941ab58f))
* support init seeds on startup ([ef095a6](https://github.com/dendronhq/dendron/commit/ef095a60d646df510b18971264a1443c13e41653))





## [0.46.2-alpha.1](https://github.com/dendronhq/dendron/compare/v0.46.1...v0.46.2-alpha.1) (2021-06-16)


### Bug Fixes

* **preview:** note refs showing first line as html ([5a025e3](https://github.com/dendronhq/dendron/commit/5a025e3ccd3e2c40ee2975577b831339b272e75d))
* order of vaults for tests ([edec699](https://github.com/dendronhq/dendron/commit/edec6998e7cb3deb659b2da41be02264e7aaaa1f))


### Features Dendron

* airtable export pod ([e04dfb4](https://github.com/dendronhq/dendron/commit/e04dfb4d26edecbe02fbdd99adf1a387ef6dfd45))
* remove seed cmd ([252f297](https://github.com/dendronhq/dendron/commit/252f29741f1cabb915e9e541d80256b21ef594d0))
* seed add cmd ([a8f245b](https://github.com/dendronhq/dendron/commit/a8f245b1a29f6de0a80839c1bd765a61941ab58f))
* support init seeds on startup ([ef095a6](https://github.com/dendronhq/dendron/commit/ef095a60d646df510b18971264a1443c13e41653))





## [0.46.2-alpha.0](https://github.com/dendronhq/dendron/compare/v0.46.1...v0.46.2-alpha.0) (2021-06-16)


### Bug Fixes

* order of vaults for tests ([edec699](https://github.com/dendronhq/dendron/commit/edec6998e7cb3deb659b2da41be02264e7aaaa1f))


### Features Dendron

* airtable export pod ([e04dfb4](https://github.com/dendronhq/dendron/commit/e04dfb4d26edecbe02fbdd99adf1a387ef6dfd45))
* seed add cmd ([a8f245b](https://github.com/dendronhq/dendron/commit/a8f245b1a29f6de0a80839c1bd765a61941ab58f))
* support init seeds on startup ([ef095a6](https://github.com/dendronhq/dendron/commit/ef095a60d646df510b18971264a1443c13e41653))





## [0.46.1](https://github.com/dendronhq/dendron/compare/v0.46.0...v0.46.1) (2021-06-14)

**Note:** Version bump only for package @dendronhq/engine-test-utils





# [0.46.0](https://github.com/dendronhq/dendron/compare/v0.45.2...v0.46.0) (2021-06-14)


### Features Dendron

* better rename ([#819](https://github.com/dendronhq/dendron/issues/819)) ([93f6898](https://github.com/dendronhq/dendron/commit/93f689875da9535855a5d73df060fc65eaa8e45d))





## [0.45.2](https://github.com/dendronhq/dendron/compare/v0.45.1...v0.45.2) (2021-06-12)


### Features Dendron

* Copy block reference ([#812](https://github.com/dendronhq/dendron/issues/812)) ([ced5946](https://github.com/dendronhq/dendron/commit/ced59467c1c824eaef1a9a3b59f588b2968d8e48))





## [0.45.1](https://github.com/dendronhq/dendron/compare/v0.45.0...v0.45.1) (2021-06-09)


### Bug Fixes

* format issue ([232926d](https://github.com/dendronhq/dendron/commit/232926d88c633aaa052711e9380a9da4a1ecc5d7))
* incorrect parsing of aliases starting with `#` ([#804](https://github.com/dendronhq/dendron/issues/804)) ([a3e0099](https://github.com/dendronhq/dendron/commit/a3e0099acb816f31066779844d951bb6cc0bda5d)), closes [#790](https://github.com/dendronhq/dendron/issues/790)





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

**Note:** Version bump only for package @dendronhq/engine-test-utils





## [0.44.1-alpha.7](https://github.com/dendronhq/dendron/compare/v0.44.1-alpha.5...v0.44.1-alpha.7) (2021-06-04)

**Note:** Version bump only for package @dendronhq/engine-test-utils





## [0.44.1-alpha.6](https://github.com/dendronhq/dendron/compare/v0.44.1-alpha.5...v0.44.1-alpha.6) (2021-06-04)

**Note:** Version bump only for package @dendronhq/engine-test-utils





## [0.44.1-alpha.5](https://github.com/dendronhq/dendron/compare/v0.42.0...v0.44.1-alpha.5) (2021-06-04)


### Bug Fixes

* block anchor parsing in wikilinks and multi-line paragraphs ([#785](https://github.com/dendronhq/dendron/issues/785)) ([10a5ebb](https://github.com/dendronhq/dendron/commit/10a5ebb7644c63716db52b436ffb006a4e29ba09))
* Block anchors hide sibling nodes in HTML ([#773](https://github.com/dendronhq/dendron/issues/773)) ([4803441](https://github.com/dendronhq/dendron/commit/480344173cf113407e358ba89f841880b6da6be4))
* handle anchor range queries with header ([de18f27](https://github.com/dendronhq/dendron/commit/de18f27973bdc3b757f2835dc4eaa8e2b73e9bf4))
* import markdown pod has bad body ([7649309](https://github.com/dendronhq/dendron/commit/7649309f6e953826e9a3f8e7c0c9ce53d6e869a4))
* support lookups with workspace vaults ([56abe59](https://github.com/dendronhq/dendron/commit/56abe592a9991a4d9c8386418a3da91a2412a660))
* support lookups with workspace vaults ([404fb89](https://github.com/dendronhq/dendron/commit/404fb8922d3f20fa1c4f87ce742a29c1af03b8a6))
* wildcard note refs ([c8087e5](https://github.com/dendronhq/dendron/commit/c8087e5834ad7698df2219a43585833d9cadbe61))


### Features Dendron

* Add block anchor HTML generation ([#766](https://github.com/dendronhq/dendron/issues/766)) ([bb0ff8e](https://github.com/dendronhq/dendron/commit/bb0ff8ee53a50768f1908bbabd625c1c2434df39))
* Add Doctor command to create missing linked notes ([#713](https://github.com/dendronhq/dendron/issues/713)) ([9558353](https://github.com/dendronhq/dendron/commit/9558353c8a636c8a8d400fc3109f75b387da37a6))
* Basic block reference link functionality ([#742](https://github.com/dendronhq/dendron/issues/742)) ([416e382](https://github.com/dendronhq/dendron/commit/416e3825254b57625f7dc2b6063f1e8bc731bf3b))
* Block reference support in HTML ([#782](https://github.com/dendronhq/dendron/issues/782)) ([79aff94](https://github.com/dendronhq/dendron/commit/79aff949598d4bdf036a9cb1c81f3b56a106b359))
* support initializing remote workspace vault ([ea73ca6](https://github.com/dendronhq/dendron/commit/ea73ca6ef8e731182e05220555553071225657c3))
* support initializing remote workspace vault ([6f401d7](https://github.com/dendronhq/dendron/commit/6f401d75f21122c84efd03f4307531fde719e37d))
* Workspace Sync command ([#738](https://github.com/dendronhq/dendron/issues/738)) ([7e462c0](https://github.com/dendronhq/dendron/commit/7e462c07ecec73982f3293ff80cfa3041d0ceabf))





## [0.44.1-alpha.4](https://github.com/dendronhq/dendron/compare/v0.42.0...v0.44.1-alpha.4) (2021-06-04)


### Bug Fixes

* block anchor parsing in wikilinks and multi-line paragraphs ([#785](https://github.com/dendronhq/dendron/issues/785)) ([10a5ebb](https://github.com/dendronhq/dendron/commit/10a5ebb7644c63716db52b436ffb006a4e29ba09))
* Block anchors hide sibling nodes in HTML ([#773](https://github.com/dendronhq/dendron/issues/773)) ([4803441](https://github.com/dendronhq/dendron/commit/480344173cf113407e358ba89f841880b6da6be4))
* handle anchor range queries with header ([de18f27](https://github.com/dendronhq/dendron/commit/de18f27973bdc3b757f2835dc4eaa8e2b73e9bf4))
* import markdown pod has bad body ([7649309](https://github.com/dendronhq/dendron/commit/7649309f6e953826e9a3f8e7c0c9ce53d6e869a4))
* support lookups with workspace vaults ([56abe59](https://github.com/dendronhq/dendron/commit/56abe592a9991a4d9c8386418a3da91a2412a660))
* support lookups with workspace vaults ([404fb89](https://github.com/dendronhq/dendron/commit/404fb8922d3f20fa1c4f87ce742a29c1af03b8a6))
* wildcard note refs ([c8087e5](https://github.com/dendronhq/dendron/commit/c8087e5834ad7698df2219a43585833d9cadbe61))


### Features Dendron

* Add block anchor HTML generation ([#766](https://github.com/dendronhq/dendron/issues/766)) ([bb0ff8e](https://github.com/dendronhq/dendron/commit/bb0ff8ee53a50768f1908bbabd625c1c2434df39))
* Add Doctor command to create missing linked notes ([#713](https://github.com/dendronhq/dendron/issues/713)) ([9558353](https://github.com/dendronhq/dendron/commit/9558353c8a636c8a8d400fc3109f75b387da37a6))
* Basic block reference link functionality ([#742](https://github.com/dendronhq/dendron/issues/742)) ([416e382](https://github.com/dendronhq/dendron/commit/416e3825254b57625f7dc2b6063f1e8bc731bf3b))
* Block reference support in HTML ([#782](https://github.com/dendronhq/dendron/issues/782)) ([79aff94](https://github.com/dendronhq/dendron/commit/79aff949598d4bdf036a9cb1c81f3b56a106b359))
* support initializing remote workspace vault ([ea73ca6](https://github.com/dendronhq/dendron/commit/ea73ca6ef8e731182e05220555553071225657c3))
* support initializing remote workspace vault ([6f401d7](https://github.com/dendronhq/dendron/commit/6f401d75f21122c84efd03f4307531fde719e37d))
* Workspace Sync command ([#738](https://github.com/dendronhq/dendron/issues/738)) ([7e462c0](https://github.com/dendronhq/dendron/commit/7e462c07ecec73982f3293ff80cfa3041d0ceabf))





## [0.44.1-alpha.3](https://github.com/dendronhq/dendron/compare/v0.42.0...v0.44.1-alpha.3) (2021-06-03)


### Bug Fixes

* block anchor parsing in wikilinks and multi-line paragraphs ([#785](https://github.com/dendronhq/dendron/issues/785)) ([10a5ebb](https://github.com/dendronhq/dendron/commit/10a5ebb7644c63716db52b436ffb006a4e29ba09))
* Block anchors hide sibling nodes in HTML ([#773](https://github.com/dendronhq/dendron/issues/773)) ([4803441](https://github.com/dendronhq/dendron/commit/480344173cf113407e358ba89f841880b6da6be4))
* import markdown pod has bad body ([7649309](https://github.com/dendronhq/dendron/commit/7649309f6e953826e9a3f8e7c0c9ce53d6e869a4))
* support lookups with workspace vaults ([404fb89](https://github.com/dendronhq/dendron/commit/404fb8922d3f20fa1c4f87ce742a29c1af03b8a6))


### Features Dendron

* Add block anchor HTML generation ([#766](https://github.com/dendronhq/dendron/issues/766)) ([bb0ff8e](https://github.com/dendronhq/dendron/commit/bb0ff8ee53a50768f1908bbabd625c1c2434df39))
* Add Doctor command to create missing linked notes ([#713](https://github.com/dendronhq/dendron/issues/713)) ([9558353](https://github.com/dendronhq/dendron/commit/9558353c8a636c8a8d400fc3109f75b387da37a6))
* Basic block reference link functionality ([#742](https://github.com/dendronhq/dendron/issues/742)) ([416e382](https://github.com/dendronhq/dendron/commit/416e3825254b57625f7dc2b6063f1e8bc731bf3b))
* Block reference support in HTML ([#782](https://github.com/dendronhq/dendron/issues/782)) ([79aff94](https://github.com/dendronhq/dendron/commit/79aff949598d4bdf036a9cb1c81f3b56a106b359))
* support initializing remote workspace vault ([6f401d7](https://github.com/dendronhq/dendron/commit/6f401d75f21122c84efd03f4307531fde719e37d))
* Workspace Sync command ([#738](https://github.com/dendronhq/dendron/issues/738)) ([7e462c0](https://github.com/dendronhq/dendron/commit/7e462c07ecec73982f3293ff80cfa3041d0ceabf))





## [0.44.1-alpha.2](https://github.com/dendronhq/dendron/compare/v0.42.0...v0.44.1-alpha.2) (2021-06-03)


### Bug Fixes

* block anchor parsing in wikilinks and multi-line paragraphs ([#785](https://github.com/dendronhq/dendron/issues/785)) ([10a5ebb](https://github.com/dendronhq/dendron/commit/10a5ebb7644c63716db52b436ffb006a4e29ba09))
* Block anchors hide sibling nodes in HTML ([#773](https://github.com/dendronhq/dendron/issues/773)) ([4803441](https://github.com/dendronhq/dendron/commit/480344173cf113407e358ba89f841880b6da6be4))
* import markdown pod has bad body ([7649309](https://github.com/dendronhq/dendron/commit/7649309f6e953826e9a3f8e7c0c9ce53d6e869a4))
* support lookups with workspace vaults ([404fb89](https://github.com/dendronhq/dendron/commit/404fb8922d3f20fa1c4f87ce742a29c1af03b8a6))


### Features Dendron

* Add block anchor HTML generation ([#766](https://github.com/dendronhq/dendron/issues/766)) ([bb0ff8e](https://github.com/dendronhq/dendron/commit/bb0ff8ee53a50768f1908bbabd625c1c2434df39))
* Add Doctor command to create missing linked notes ([#713](https://github.com/dendronhq/dendron/issues/713)) ([9558353](https://github.com/dendronhq/dendron/commit/9558353c8a636c8a8d400fc3109f75b387da37a6))
* Basic block reference link functionality ([#742](https://github.com/dendronhq/dendron/issues/742)) ([416e382](https://github.com/dendronhq/dendron/commit/416e3825254b57625f7dc2b6063f1e8bc731bf3b))
* Block reference support in HTML ([#782](https://github.com/dendronhq/dendron/issues/782)) ([79aff94](https://github.com/dendronhq/dendron/commit/79aff949598d4bdf036a9cb1c81f3b56a106b359))
* support initializing remote workspace vault ([6f401d7](https://github.com/dendronhq/dendron/commit/6f401d75f21122c84efd03f4307531fde719e37d))
* Workspace Sync command ([#738](https://github.com/dendronhq/dendron/issues/738)) ([7e462c0](https://github.com/dendronhq/dendron/commit/7e462c07ecec73982f3293ff80cfa3041d0ceabf))





## [0.44.1-alpha.1](https://github.com/dendronhq/dendron/compare/v0.42.0...v0.44.1-alpha.1) (2021-06-02)


### Bug Fixes

* Block anchors hide sibling nodes in HTML ([#773](https://github.com/dendronhq/dendron/issues/773)) ([4803441](https://github.com/dendronhq/dendron/commit/480344173cf113407e358ba89f841880b6da6be4))
* import markdown pod has bad body ([7649309](https://github.com/dendronhq/dendron/commit/7649309f6e953826e9a3f8e7c0c9ce53d6e869a4))
* support lookups with workspace vaults ([7653a84](https://github.com/dendronhq/dendron/commit/7653a84177b0c5a4c80fa6f48ed784ad9e3ae3d8))


### Features Dendron

* Add block anchor HTML generation ([#766](https://github.com/dendronhq/dendron/issues/766)) ([bb0ff8e](https://github.com/dendronhq/dendron/commit/bb0ff8ee53a50768f1908bbabd625c1c2434df39))
* Add Doctor command to create missing linked notes ([#713](https://github.com/dendronhq/dendron/issues/713)) ([9558353](https://github.com/dendronhq/dendron/commit/9558353c8a636c8a8d400fc3109f75b387da37a6))
* Basic block reference link functionality ([#742](https://github.com/dendronhq/dendron/issues/742)) ([416e382](https://github.com/dendronhq/dendron/commit/416e3825254b57625f7dc2b6063f1e8bc731bf3b))
* Block reference support in HTML ([#782](https://github.com/dendronhq/dendron/issues/782)) ([79aff94](https://github.com/dendronhq/dendron/commit/79aff949598d4bdf036a9cb1c81f3b56a106b359))
* Workspace Sync command ([#738](https://github.com/dendronhq/dendron/issues/738)) ([7e462c0](https://github.com/dendronhq/dendron/commit/7e462c07ecec73982f3293ff80cfa3041d0ceabf))





## [0.44.1-alpha.0](https://github.com/dendronhq/dendron/compare/v0.42.0...v0.44.1-alpha.0) (2021-06-02)


### Bug Fixes

* Block anchors hide sibling nodes in HTML ([#773](https://github.com/dendronhq/dendron/issues/773)) ([4803441](https://github.com/dendronhq/dendron/commit/480344173cf113407e358ba89f841880b6da6be4))
* import markdown pod has bad body ([7649309](https://github.com/dendronhq/dendron/commit/7649309f6e953826e9a3f8e7c0c9ce53d6e869a4))
* support lookups with workspace vaults ([7653a84](https://github.com/dendronhq/dendron/commit/7653a84177b0c5a4c80fa6f48ed784ad9e3ae3d8))


### Features Dendron

* Add block anchor HTML generation ([#766](https://github.com/dendronhq/dendron/issues/766)) ([bb0ff8e](https://github.com/dendronhq/dendron/commit/bb0ff8ee53a50768f1908bbabd625c1c2434df39))
* Add Doctor command to create missing linked notes ([#713](https://github.com/dendronhq/dendron/issues/713)) ([9558353](https://github.com/dendronhq/dendron/commit/9558353c8a636c8a8d400fc3109f75b387da37a6))
* Basic block reference link functionality ([#742](https://github.com/dendronhq/dendron/issues/742)) ([416e382](https://github.com/dendronhq/dendron/commit/416e3825254b57625f7dc2b6063f1e8bc731bf3b))
* Block reference support in HTML ([#782](https://github.com/dendronhq/dendron/issues/782)) ([79aff94](https://github.com/dendronhq/dendron/commit/79aff949598d4bdf036a9cb1c81f3b56a106b359))
* Workspace Sync command ([#738](https://github.com/dendronhq/dendron/issues/738)) ([7e462c0](https://github.com/dendronhq/dendron/commit/7e462c07ecec73982f3293ff80cfa3041d0ceabf))





# [0.44.0](https://github.com/dendronhq/dendron/compare/v0.42.0...v0.44.0) (2021-05-31)

### Bug Fixes

- Block anchors hide sibling nodes in HTML ([#773](https://github.com/dendronhq/dendron/issues/773)) ([4803441](https://github.com/dendronhq/dendron/commit/480344173cf113407e358ba89f841880b6da6be4))
- import markdown pod has bad body ([7649309](https://github.com/dendronhq/dendron/commit/7649309f6e953826e9a3f8e7c0c9ce53d6e869a4))

### Features Dendron

- Add block anchor HTML generation ([#766](https://github.com/dendronhq/dendron/issues/766)) ([bb0ff8e](https://github.com/dendronhq/dendron/commit/bb0ff8ee53a50768f1908bbabd625c1c2434df39))
- Add Doctor command to create missing linked notes ([#713](https://github.com/dendronhq/dendron/issues/713)) ([9558353](https://github.com/dendronhq/dendron/commit/9558353c8a636c8a8d400fc3109f75b387da37a6))
- Basic block reference link functionality ([#742](https://github.com/dendronhq/dendron/issues/742)) ([416e382](https://github.com/dendronhq/dendron/commit/416e3825254b57625f7dc2b6063f1e8bc731bf3b))
- Workspace Sync command ([#738](https://github.com/dendronhq/dendron/issues/738)) ([7e462c0](https://github.com/dendronhq/dendron/commit/7e462c07ecec73982f3293ff80cfa3041d0ceabf))

## [0.43.5-alpha.2](https://github.com/dendronhq/dendron/compare/v0.42.0...v0.43.5-alpha.2) (2021-05-29)

### Bug Fixes

- Block anchors hide sibling nodes in HTML ([#773](https://github.com/dendronhq/dendron/issues/773)) ([4803441](https://github.com/dendronhq/dendron/commit/480344173cf113407e358ba89f841880b6da6be4))
- import markdown pod has bad body ([7649309](https://github.com/dendronhq/dendron/commit/7649309f6e953826e9a3f8e7c0c9ce53d6e869a4))

### Features Dendron

- Add block anchor HTML generation ([#766](https://github.com/dendronhq/dendron/issues/766)) ([bb0ff8e](https://github.com/dendronhq/dendron/commit/bb0ff8ee53a50768f1908bbabd625c1c2434df39))
- Add Doctor command to create missing linked notes ([#713](https://github.com/dendronhq/dendron/issues/713)) ([9558353](https://github.com/dendronhq/dendron/commit/9558353c8a636c8a8d400fc3109f75b387da37a6))
- Basic block reference link functionality ([#742](https://github.com/dendronhq/dendron/issues/742)) ([416e382](https://github.com/dendronhq/dendron/commit/416e3825254b57625f7dc2b6063f1e8bc731bf3b))
- Workspace Sync command ([#738](https://github.com/dendronhq/dendron/issues/738)) ([7e462c0](https://github.com/dendronhq/dendron/commit/7e462c07ecec73982f3293ff80cfa3041d0ceabf))

## [0.43.5-alpha.1](https://github.com/dendronhq/dendron/compare/v0.42.0...v0.43.5-alpha.1) (2021-05-29)

### Bug Fixes

- Block anchors hide sibling nodes in HTML ([#773](https://github.com/dendronhq/dendron/issues/773)) ([4803441](https://github.com/dendronhq/dendron/commit/480344173cf113407e358ba89f841880b6da6be4))
- import markdown pod has bad body ([7649309](https://github.com/dendronhq/dendron/commit/7649309f6e953826e9a3f8e7c0c9ce53d6e869a4))

### Features Dendron

- Add block anchor HTML generation ([#766](https://github.com/dendronhq/dendron/issues/766)) ([bb0ff8e](https://github.com/dendronhq/dendron/commit/bb0ff8ee53a50768f1908bbabd625c1c2434df39))
- Add Doctor command to create missing linked notes ([#713](https://github.com/dendronhq/dendron/issues/713)) ([9558353](https://github.com/dendronhq/dendron/commit/9558353c8a636c8a8d400fc3109f75b387da37a6))
- Basic block reference link functionality ([#742](https://github.com/dendronhq/dendron/issues/742)) ([416e382](https://github.com/dendronhq/dendron/commit/416e3825254b57625f7dc2b6063f1e8bc731bf3b))
- Workspace Sync command ([#738](https://github.com/dendronhq/dendron/issues/738)) ([7e462c0](https://github.com/dendronhq/dendron/commit/7e462c07ecec73982f3293ff80cfa3041d0ceabf))

## [0.43.5-alpha.0](https://github.com/dendronhq/dendron/compare/v0.42.0...v0.43.5-alpha.0) (2021-05-28)

### Bug Fixes

- import markdown pod has bad body ([7649309](https://github.com/dendronhq/dendron/commit/7649309f6e953826e9a3f8e7c0c9ce53d6e869a4))

### Features Dendron

- Add block anchor HTML generation ([#766](https://github.com/dendronhq/dendron/issues/766)) ([bb0ff8e](https://github.com/dendronhq/dendron/commit/bb0ff8ee53a50768f1908bbabd625c1c2434df39))
- Add Doctor command to create missing linked notes ([#713](https://github.com/dendronhq/dendron/issues/713)) ([9558353](https://github.com/dendronhq/dendron/commit/9558353c8a636c8a8d400fc3109f75b387da37a6))
- Basic block reference link functionality ([#742](https://github.com/dendronhq/dendron/issues/742)) ([416e382](https://github.com/dendronhq/dendron/commit/416e3825254b57625f7dc2b6063f1e8bc731bf3b))
- Workspace Sync command ([#738](https://github.com/dendronhq/dendron/issues/738)) ([7e462c0](https://github.com/dendronhq/dendron/commit/7e462c07ecec73982f3293ff80cfa3041d0ceabf))

## [0.43.4-alpha.0](https://github.com/dendronhq/dendron/compare/v0.42.0...v0.43.4-alpha.0) (2021-05-28)

### Bug Fixes

- import markdown pod has bad body ([7649309](https://github.com/dendronhq/dendron/commit/7649309f6e953826e9a3f8e7c0c9ce53d6e869a4))

### Features Dendron

- Add block anchor HTML generation ([#766](https://github.com/dendronhq/dendron/issues/766)) ([bb0ff8e](https://github.com/dendronhq/dendron/commit/bb0ff8ee53a50768f1908bbabd625c1c2434df39))
- Add Doctor command to create missing linked notes ([#713](https://github.com/dendronhq/dendron/issues/713)) ([9558353](https://github.com/dendronhq/dendron/commit/9558353c8a636c8a8d400fc3109f75b387da37a6))
- Basic block reference link functionality ([#742](https://github.com/dendronhq/dendron/issues/742)) ([416e382](https://github.com/dendronhq/dendron/commit/416e3825254b57625f7dc2b6063f1e8bc731bf3b))
- Workspace Sync command ([#738](https://github.com/dendronhq/dendron/issues/738)) ([7e462c0](https://github.com/dendronhq/dendron/commit/7e462c07ecec73982f3293ff80cfa3041d0ceabf))

## [0.43.3-alpha.0](https://github.com/dendronhq/dendron/compare/v0.42.0...v0.43.3-alpha.0) (2021-05-28)

### Bug Fixes

- import markdown pod has bad body ([7649309](https://github.com/dendronhq/dendron/commit/7649309f6e953826e9a3f8e7c0c9ce53d6e869a4))

### Features Dendron

- Add block anchor HTML generation ([#766](https://github.com/dendronhq/dendron/issues/766)) ([bb0ff8e](https://github.com/dendronhq/dendron/commit/bb0ff8ee53a50768f1908bbabd625c1c2434df39))
- Add Doctor command to create missing linked notes ([#713](https://github.com/dendronhq/dendron/issues/713)) ([9558353](https://github.com/dendronhq/dendron/commit/9558353c8a636c8a8d400fc3109f75b387da37a6))
- Basic block reference link functionality ([#742](https://github.com/dendronhq/dendron/issues/742)) ([416e382](https://github.com/dendronhq/dendron/commit/416e3825254b57625f7dc2b6063f1e8bc731bf3b))
- Workspace Sync command ([#738](https://github.com/dendronhq/dendron/issues/738)) ([7e462c0](https://github.com/dendronhq/dendron/commit/7e462c07ecec73982f3293ff80cfa3041d0ceabf))

## [0.43.2-alpha.0](https://github.com/dendronhq/dendron/compare/v0.42.0...v0.43.2-alpha.0) (2021-05-27)

### Bug Fixes

- import markdown pod has bad body ([3038dd3](https://github.com/dendronhq/dendron/commit/3038dd340ed0f7ac56e34e8b8716962284f586e0))

### Features Dendron

- Add Doctor command to create missing linked notes ([#713](https://github.com/dendronhq/dendron/issues/713)) ([9558353](https://github.com/dendronhq/dendron/commit/9558353c8a636c8a8d400fc3109f75b387da37a6))
- Basic block reference link functionality ([#742](https://github.com/dendronhq/dendron/issues/742)) ([416e382](https://github.com/dendronhq/dendron/commit/416e3825254b57625f7dc2b6063f1e8bc731bf3b))
- Workspace Sync command ([#738](https://github.com/dendronhq/dendron/issues/738)) ([7e462c0](https://github.com/dendronhq/dendron/commit/7e462c07ecec73982f3293ff80cfa3041d0ceabf))

## [0.43.1](https://github.com/dendronhq/dendron/compare/v0.42.0...v0.43.1) (2021-05-26)

### Bug Fixes

- import markdown pod has bad body ([3038dd3](https://github.com/dendronhq/dendron/commit/3038dd340ed0f7ac56e34e8b8716962284f586e0))

### Features Dendron

- Add Doctor command to create missing linked notes ([#713](https://github.com/dendronhq/dendron/issues/713)) ([9558353](https://github.com/dendronhq/dendron/commit/9558353c8a636c8a8d400fc3109f75b387da37a6))
- Basic block reference link functionality ([#742](https://github.com/dendronhq/dendron/issues/742)) ([416e382](https://github.com/dendronhq/dendron/commit/416e3825254b57625f7dc2b6063f1e8bc731bf3b))
- Workspace Sync command ([#738](https://github.com/dendronhq/dendron/issues/738)) ([7e462c0](https://github.com/dendronhq/dendron/commit/7e462c07ecec73982f3293ff80cfa3041d0ceabf))

## [0.43.3-alpha.0](https://github.com/dendronhq/dendron/compare/v0.42.0...v0.43.3-alpha.0) (2021-05-26)

### Bug Fixes

- import markdown pod has bad body ([3038dd3](https://github.com/dendronhq/dendron/commit/3038dd340ed0f7ac56e34e8b8716962284f586e0))

### Features Dendron

- Add Doctor command to create missing linked notes ([#713](https://github.com/dendronhq/dendron/issues/713)) ([9558353](https://github.com/dendronhq/dendron/commit/9558353c8a636c8a8d400fc3109f75b387da37a6))
- Basic block reference link functionality ([#742](https://github.com/dendronhq/dendron/issues/742)) ([416e382](https://github.com/dendronhq/dendron/commit/416e3825254b57625f7dc2b6063f1e8bc731bf3b))
- Workspace Sync command ([#738](https://github.com/dendronhq/dendron/issues/738)) ([7e462c0](https://github.com/dendronhq/dendron/commit/7e462c07ecec73982f3293ff80cfa3041d0ceabf))

## [0.43.2-alpha.0](https://github.com/dendronhq/dendron/compare/v0.42.0...v0.43.2-alpha.0) (2021-05-25)

### Features Dendron

- Add Doctor command to create missing linked notes ([#713](https://github.com/dendronhq/dendron/issues/713)) ([9558353](https://github.com/dendronhq/dendron/commit/9558353c8a636c8a8d400fc3109f75b387da37a6))
- Basic block reference link functionality ([#742](https://github.com/dendronhq/dendron/issues/742)) ([416e382](https://github.com/dendronhq/dendron/commit/416e3825254b57625f7dc2b6063f1e8bc731bf3b))
- Workspace Sync command ([#738](https://github.com/dendronhq/dendron/issues/738)) ([7e462c0](https://github.com/dendronhq/dendron/commit/7e462c07ecec73982f3293ff80cfa3041d0ceabf))

## [0.43.1-alpha.0](https://github.com/dendronhq/dendron/compare/v0.42.0...v0.43.1-alpha.0) (2021-05-24)

### Features Dendron

- Add Doctor command to create missing linked notes ([#713](https://github.com/dendronhq/dendron/issues/713)) ([9558353](https://github.com/dendronhq/dendron/commit/9558353c8a636c8a8d400fc3109f75b387da37a6))
- Basic block reference link functionality ([#742](https://github.com/dendronhq/dendron/issues/742)) ([416e382](https://github.com/dendronhq/dendron/commit/416e3825254b57625f7dc2b6063f1e8bc731bf3b))
- Workspace Sync command ([#738](https://github.com/dendronhq/dendron/issues/738)) ([7e462c0](https://github.com/dendronhq/dendron/commit/7e462c07ecec73982f3293ff80cfa3041d0ceabf))

# [0.43.0](https://github.com/dendronhq/dendron/compare/v0.42.0...v0.43.0) (2021-05-24)

### Features Dendron

- Add Doctor command to create missing linked notes ([#713](https://github.com/dendronhq/dendron/issues/713)) ([9558353](https://github.com/dendronhq/dendron/commit/9558353c8a636c8a8d400fc3109f75b387da37a6))
- Basic block reference link functionality ([#742](https://github.com/dendronhq/dendron/issues/742)) ([416e382](https://github.com/dendronhq/dendron/commit/416e3825254b57625f7dc2b6063f1e8bc731bf3b))
- Workspace Sync command ([#738](https://github.com/dendronhq/dendron/issues/738)) ([7e462c0](https://github.com/dendronhq/dendron/commit/7e462c07ecec73982f3293ff80cfa3041d0ceabf))

## [0.42.6-alpha.0](https://github.com/dendronhq/dendron/compare/v0.42.0...v0.42.6-alpha.0) (2021-05-24)

### Features Dendron

- Add Doctor command to create missing linked notes ([#713](https://github.com/dendronhq/dendron/issues/713)) ([9558353](https://github.com/dendronhq/dendron/commit/9558353c8a636c8a8d400fc3109f75b387da37a6))
- Basic block reference link functionality ([#742](https://github.com/dendronhq/dendron/issues/742)) ([416e382](https://github.com/dendronhq/dendron/commit/416e3825254b57625f7dc2b6063f1e8bc731bf3b))
- Workspace Sync command ([#738](https://github.com/dendronhq/dendron/issues/738)) ([7e462c0](https://github.com/dendronhq/dendron/commit/7e462c07ecec73982f3293ff80cfa3041d0ceabf))

## [0.42.5-alpha.0](https://github.com/dendronhq/dendron/compare/v0.42.0...v0.42.5-alpha.0) (2021-05-24)

### Features Dendron

- Add Doctor command to create missing linked notes ([#713](https://github.com/dendronhq/dendron/issues/713)) ([9558353](https://github.com/dendronhq/dendron/commit/9558353c8a636c8a8d400fc3109f75b387da37a6))
- Basic block reference link functionality ([#742](https://github.com/dendronhq/dendron/issues/742)) ([416e382](https://github.com/dendronhq/dendron/commit/416e3825254b57625f7dc2b6063f1e8bc731bf3b))
- Workspace Sync command ([#738](https://github.com/dendronhq/dendron/issues/738)) ([7e462c0](https://github.com/dendronhq/dendron/commit/7e462c07ecec73982f3293ff80cfa3041d0ceabf))

## [0.42.4-alpha.0](https://github.com/dendronhq/dendron/compare/v0.42.0...v0.42.4-alpha.0) (2021-05-24)

### Features Dendron

- Add Doctor command to create missing linked notes ([#713](https://github.com/dendronhq/dendron/issues/713)) ([9558353](https://github.com/dendronhq/dendron/commit/9558353c8a636c8a8d400fc3109f75b387da37a6))
- Basic block reference link functionality ([#742](https://github.com/dendronhq/dendron/issues/742)) ([416e382](https://github.com/dendronhq/dendron/commit/416e3825254b57625f7dc2b6063f1e8bc731bf3b))
- Workspace Sync command ([#738](https://github.com/dendronhq/dendron/issues/738)) ([7e462c0](https://github.com/dendronhq/dendron/commit/7e462c07ecec73982f3293ff80cfa3041d0ceabf))

## [0.42.3-alpha.0](https://github.com/dendronhq/dendron/compare/v0.42.0...v0.42.3-alpha.0) (2021-05-24)

### Features Dendron

- Add Doctor command to create missing linked notes ([#713](https://github.com/dendronhq/dendron/issues/713)) ([9558353](https://github.com/dendronhq/dendron/commit/9558353c8a636c8a8d400fc3109f75b387da37a6))
- Basic block reference link functionality ([#742](https://github.com/dendronhq/dendron/issues/742)) ([416e382](https://github.com/dendronhq/dendron/commit/416e3825254b57625f7dc2b6063f1e8bc731bf3b))
- Workspace Sync command ([#738](https://github.com/dendronhq/dendron/issues/738)) ([7e462c0](https://github.com/dendronhq/dendron/commit/7e462c07ecec73982f3293ff80cfa3041d0ceabf))

## [0.42.2-alpha.0](https://github.com/dendronhq/dendron/compare/v0.42.0...v0.42.2-alpha.0) (2021-05-22)

### Features Dendron

- Basic block reference link functionality ([#742](https://github.com/dendronhq/dendron/issues/742)) ([416e382](https://github.com/dendronhq/dendron/commit/416e3825254b57625f7dc2b6063f1e8bc731bf3b))
- Workspace Sync command ([#738](https://github.com/dendronhq/dendron/issues/738)) ([7e462c0](https://github.com/dendronhq/dendron/commit/7e462c07ecec73982f3293ff80cfa3041d0ceabf))

## [0.42.1-alpha.0](https://github.com/dendronhq/dendron/compare/v0.42.0...v0.42.1-alpha.0) (2021-05-20)

### Features Dendron

- Basic block reference link functionality ([#742](https://github.com/dendronhq/dendron/issues/742)) ([416e382](https://github.com/dendronhq/dendron/commit/416e3825254b57625f7dc2b6063f1e8bc731bf3b))
- Workspace Sync command ([#738](https://github.com/dendronhq/dendron/issues/738)) ([7e462c0](https://github.com/dendronhq/dendron/commit/7e462c07ecec73982f3293ff80cfa3041d0ceabf))

# [0.42.0](https://github.com/dendronhq/dendron/compare/v0.41.0...v0.42.0) (2021-05-17)

### Bug Fixes

- bad test ([712a76f](https://github.com/dendronhq/dendron/commit/712a76f46f567f6646e44f6dc548d16b250bf9c6))

### Features Dendron

- add graphviz pod to export notes as a graph in dot language ([#721](https://github.com/dendronhq/dendron/issues/721)) ([c1a7632](https://github.com/dendronhq/dendron/commit/c1a76320171809d987652afe203b36fe506b7c31))

# [0.41.0](https://github.com/dendronhq/dendron/compare/v0.40.0...v0.41.0) (2021-05-10)

**Note:** Version bump only for package @dendronhq/engine-test-utils

## [0.40.4-alpha.0](https://github.com/dendronhq/dendron/compare/v0.40.0...v0.40.4-alpha.0) (2021-05-09)

**Note:** Version bump only for package @dendronhq/engine-test-utils

## [0.40.4-alpha.0](https://github.com/dendronhq/dendron/compare/v0.40.0...v0.40.4-alpha.0) (2021-05-08)

**Note:** Version bump only for package @dendronhq/engine-test-utils

## [0.40.3-alpha.0](https://github.com/dendronhq/dendron/compare/v0.40.0...v0.40.3-alpha.0) (2021-05-08)

**Note:** Version bump only for package @dendronhq/engine-test-utils

## [0.40.2](https://github.com/dendronhq/dendron/compare/v0.40.0...v0.40.2) (2021-05-05)

**Note:** Version bump only for package @dendronhq/engine-test-utils

## [0.40.2-alpha.0](https://github.com/dendronhq/dendron/compare/v0.40.0...v0.40.2-alpha.0) (2021-05-05)

**Note:** Version bump only for package @dendronhq/engine-test-utils

# [0.40.0](https://github.com/dendronhq/dendron/compare/v0.39.0...v0.40.0) (2021-05-03)

### Bug Fixes

- caching for vaults ([c24651a](https://github.com/dendronhq/dendron/commit/c24651a83d002830d837ab94301e54d214a04286))
- insert note resulting in error ([b48721d](https://github.com/dendronhq/dendron/commit/b48721db9518100868a34278a5dfd2beac16f207))
- nested note refs in preview not rendering well ([372f6f3](https://github.com/dendronhq/dendron/commit/372f6f3f77d4a2d5310cf2dd9536bddb007271c5))
- properly initialize links from cache ([a0e9680](https://github.com/dendronhq/dendron/commit/a0e9680821a275d97771538c8ffeef14fcb63f4e))
- use new remark plugins for markdown pod ([c19c500](https://github.com/dendronhq/dendron/commit/c19c500525dce79f10a7d98866fe292cf84060a4))

## [0.39.2](https://github.com/dendronhq/dendron/compare/v0.39.0...v0.39.2) (2021-04-30)

### Bug Fixes

- caching for vaults ([c24651a](https://github.com/dendronhq/dendron/commit/c24651a83d002830d837ab94301e54d214a04286))
- insert note resulting in error ([b48721d](https://github.com/dendronhq/dendron/commit/b48721db9518100868a34278a5dfd2beac16f207))
- nested note refs in preview not rendering well ([372f6f3](https://github.com/dendronhq/dendron/commit/372f6f3f77d4a2d5310cf2dd9536bddb007271c5))
- properly initialize links from cache ([a0e9680](https://github.com/dendronhq/dendron/commit/a0e9680821a275d97771538c8ffeef14fcb63f4e))
- use new remark plugins for markdown pod ([c19c500](https://github.com/dendronhq/dendron/commit/c19c500525dce79f10a7d98866fe292cf84060a4))

## [0.39.2-alpha.0](https://github.com/dendronhq/dendron/compare/v0.39.0...v0.39.2-alpha.0) (2021-04-29)

### Bug Fixes

- insert note resulting in error ([b48721d](https://github.com/dendronhq/dendron/commit/b48721db9518100868a34278a5dfd2beac16f207))
- nested note refs in preview not rendering well ([372f6f3](https://github.com/dendronhq/dendron/commit/372f6f3f77d4a2d5310cf2dd9536bddb007271c5))
- properly initialize links from cache ([a0e9680](https://github.com/dendronhq/dendron/commit/a0e9680821a275d97771538c8ffeef14fcb63f4e))
- use new remark plugins for markdown pod ([c19c500](https://github.com/dendronhq/dendron/commit/c19c500525dce79f10a7d98866fe292cf84060a4))

## [0.39.1](https://github.com/dendronhq/dendron/compare/v0.39.0...v0.39.1) (2021-04-27)

### Bug Fixes

- properly initialize links from cache ([a0e9680](https://github.com/dendronhq/dendron/commit/a0e9680821a275d97771538c8ffeef14fcb63f4e))

# [0.39.0](https://github.com/dendronhq/dendron/compare/v0.37.0...v0.39.0) (2021-04-26)

### Bug Fixes

- issues with caching notes ([f6e3825](https://github.com/dendronhq/dendron/commit/f6e38250e6fa5c57bfdaaba1a0be87ff933620c5))

### Features Dendron

- initialize notes from cache ([a0a2a1e](https://github.com/dendronhq/dendron/commit/a0a2a1eaeeeee45248ee3cadcda1b033df88d695))

## [0.38.6-alpha.0](https://github.com/dendronhq/dendron/compare/v0.37.0...v0.38.6-alpha.0) (2021-04-26)

### Bug Fixes

- issues with caching notes ([6a65d4e](https://github.com/dendronhq/dendron/commit/6a65d4e179f755324d68c01a3ca9d767e71b7dfc))

## [0.38.5-alpha.0](https://github.com/dendronhq/dendron/compare/v0.37.0...v0.38.5-alpha.0) (2021-04-26)

### Bug Fixes

- issues with caching notes ([6a65d4e](https://github.com/dendronhq/dendron/commit/6a65d4e179f755324d68c01a3ca9d767e71b7dfc))

## [0.38.4-alpha.0](https://github.com/dendronhq/dendron/compare/v0.37.0...v0.38.4-alpha.0) (2021-04-26)

**Note:** Version bump only for package @dendronhq/engine-test-utils

## [0.38.3-alpha.0](https://github.com/dendronhq/dendron/compare/v0.37.0...v0.38.3-alpha.0) (2021-04-25)

**Note:** Version bump only for package @dendronhq/engine-test-utils

## [0.38.2-alpha.0](https://github.com/dendronhq/dendron/compare/v0.37.0...v0.38.2-alpha.0) (2021-04-25)

**Note:** Version bump only for package @dendronhq/engine-test-utils

## [0.38.1-alpha.0](https://github.com/dendronhq/dendron/compare/v0.37.0...v0.38.1-alpha.0) (2021-04-23)

**Note:** Version bump only for package @dendronhq/engine-test-utils

# [0.38.0](https://github.com/dendronhq/dendron/compare/v0.37.0...v0.38.0) (2021-04-19)

**Note:** Version bump only for package @dendronhq/engine-test-utils

# [0.37.0](https://github.com/dendronhq/dendron/compare/v0.28.7-alpha.3...v0.37.0) (2021-04-12)

### Bug Fixes

- bad document link provider ([3de7979](https://github.com/dendronhq/dendron/commit/3de797907a76cb320a853634de5085c0f190cfcc))
- disable pretty ref when exporting markdown ([c0791da](https://github.com/dendronhq/dendron/commit/c0791da911b665ca66f1b3829784cf8a95ef9952))
- handle links to home page for backlinks ([5d6303b](https://github.com/dendronhq/dendron/commit/5d6303b0155617b940ba489ee7e20f5aa28d42cf))
- multi-case parent hiearchies ([aca4df1](https://github.com/dendronhq/dendron/commit/aca4df178b6fa8eb5703afdca4ddc36a46e81134))
- multi-link wikilink not resolving ([cfaf2c0](https://github.com/dendronhq/dendron/commit/cfaf2c0ae58464ceef2edcd2b5c182b93136fa80))
- publish pod updates ([fd29e9a](https://github.com/dendronhq/dendron/commit/fd29e9af13bf2c41c39f32da42dba31bb65013d6))
- typo in config option ([2be82e8](https://github.com/dendronhq/dendron/commit/2be82e8116e2bf5698abb7660795044ffa3f405d))

### Features Dendron

- and and commit cmd ([9b9d86c](https://github.com/dendronhq/dendron/commit/9b9d86ccf54fdb8b58f4c04bd57700d8c4c84cf7))
- create notes from cli ([ee2afa1](https://github.com/dendronhq/dendron/commit/ee2afa1ba1299d4e42bf4642010dc14381ad943a))
- delete note via cli ([87139ad](https://github.com/dendronhq/dendron/commit/87139addf0d804dbd903196b0e5e7bb7aca9a492))
- markdown export pod ([552e01f](https://github.com/dendronhq/dendron/commit/552e01fa21bb6d6da1e243696a67382afda23194))
- move child notes generation into remark ([c4b12cf](https://github.com/dendronhq/dendron/commit/c4b12cf91ea48d662b30713033b2b70e10094131))

### Reverts

- Revert "integ: publish minor" ([38ff5dd](https://github.com/dendronhq/dendron/commit/38ff5dd049cecd939fbd70744ef76a704aec3400))

## [0.36.5-alpha.0](https://github.com/dendronhq/dendron/compare/v0.28.7-alpha.3...v0.36.5-alpha.0) (2021-04-12)

### Bug Fixes

- bad document link provider ([3de7979](https://github.com/dendronhq/dendron/commit/3de797907a76cb320a853634de5085c0f190cfcc))
- disable pretty ref when exporting markdown ([c0791da](https://github.com/dendronhq/dendron/commit/c0791da911b665ca66f1b3829784cf8a95ef9952))
- handle links to home page for backlinks ([5d6303b](https://github.com/dendronhq/dendron/commit/5d6303b0155617b940ba489ee7e20f5aa28d42cf))
- multi-case parent hiearchies ([aca4df1](https://github.com/dendronhq/dendron/commit/aca4df178b6fa8eb5703afdca4ddc36a46e81134))
- multi-link wikilink not resolving ([cfaf2c0](https://github.com/dendronhq/dendron/commit/cfaf2c0ae58464ceef2edcd2b5c182b93136fa80))
- publish pod updates ([fd29e9a](https://github.com/dendronhq/dendron/commit/fd29e9af13bf2c41c39f32da42dba31bb65013d6))
- typo in config option ([2be82e8](https://github.com/dendronhq/dendron/commit/2be82e8116e2bf5698abb7660795044ffa3f405d))

### Features Dendron

- and and commit cmd ([9b9d86c](https://github.com/dendronhq/dendron/commit/9b9d86ccf54fdb8b58f4c04bd57700d8c4c84cf7))
- create notes from cli ([ee2afa1](https://github.com/dendronhq/dendron/commit/ee2afa1ba1299d4e42bf4642010dc14381ad943a))
- delete note via cli ([87139ad](https://github.com/dendronhq/dendron/commit/87139addf0d804dbd903196b0e5e7bb7aca9a492))
- markdown export pod ([552e01f](https://github.com/dendronhq/dendron/commit/552e01fa21bb6d6da1e243696a67382afda23194))
- move child notes generation into remark ([c4b12cf](https://github.com/dendronhq/dendron/commit/c4b12cf91ea48d662b30713033b2b70e10094131))

### Reverts

- Revert "integ: publish minor" ([38ff5dd](https://github.com/dendronhq/dendron/commit/38ff5dd049cecd939fbd70744ef76a704aec3400))

## [0.36.3](https://github.com/dendronhq/dendron/compare/@dendronhq/engine-test-utils@0.36.1...@dendronhq/engine-test-utils@0.36.3) (2021-04-09)

### Bug Fixes

- bad document link provider ([3de7979](https://github.com/dendronhq/dendron/commit/3de797907a76cb320a853634de5085c0f190cfcc))

### Features Dendron

- create notes from cli ([ee2afa1](https://github.com/dendronhq/dendron/commit/ee2afa1ba1299d4e42bf4642010dc14381ad943a))
- delete note via cli ([87139ad](https://github.com/dendronhq/dendron/commit/87139addf0d804dbd903196b0e5e7bb7aca9a492))

## [0.36.2](https://github.com/dendronhq/dendron/compare/@dendronhq/engine-test-utils@0.36.1...@dendronhq/engine-test-utils@0.36.2) (2021-04-06)

### Bug Fixes

- bad document link provider ([3de7979](https://github.com/dendronhq/dendron/commit/3de797907a76cb320a853634de5085c0f190cfcc))

## [0.36.1](https://github.com/dendronhq/dendron/compare/@dendronhq/engine-test-utils@0.36.0...@dendronhq/engine-test-utils@0.36.1) (2021-04-05)

**Note:** Version bump only for package @dendronhq/engine-test-utils

# [0.36.0](https://github.com/dendronhq/dendron/compare/@dendronhq/engine-test-utils@0.35.0...@dendronhq/engine-test-utils@0.36.0) (2021-04-05)

### Features Dendron

- and and commit cmd ([9b9d86c](https://github.com/dendronhq/dendron/commit/9b9d86ccf54fdb8b58f4c04bd57700d8c4c84cf7))

## [0.35.4-alpha.0](https://github.com/dendronhq/dendron/compare/@dendronhq/engine-test-utils@0.35.0...@dendronhq/engine-test-utils@0.35.4-alpha.0) (2021-04-02)

### Features Dendron

- and and commit cmd ([9b9d86c](https://github.com/dendronhq/dendron/commit/9b9d86ccf54fdb8b58f4c04bd57700d8c4c84cf7))

## [0.35.3](https://github.com/dendronhq/dendron/compare/@dendronhq/engine-test-utils@0.35.0...@dendronhq/engine-test-utils@0.35.3) (2021-04-02)

### Features Dendron

- and and commit cmd ([9b9d86c](https://github.com/dendronhq/dendron/commit/9b9d86ccf54fdb8b58f4c04bd57700d8c4c84cf7))

## [0.35.3-alpha.0](https://github.com/dendronhq/dendron/compare/@dendronhq/engine-test-utils@0.35.0...@dendronhq/engine-test-utils@0.35.3-alpha.0) (2021-03-31)

### Features Dendron

- and and commit cmd ([9b9d86c](https://github.com/dendronhq/dendron/commit/9b9d86ccf54fdb8b58f4c04bd57700d8c4c84cf7))

## [0.35.2-alpha.0](https://github.com/dendronhq/dendron/compare/@dendronhq/engine-test-utils@0.35.0...@dendronhq/engine-test-utils@0.35.2-alpha.0) (2021-03-31)

### Features Dendron

- and and commit cmd ([9b9d86c](https://github.com/dendronhq/dendron/commit/9b9d86ccf54fdb8b58f4c04bd57700d8c4c84cf7))

## [0.35.1-alpha.0](https://github.com/dendronhq/dendron/compare/@dendronhq/engine-test-utils@0.35.0...@dendronhq/engine-test-utils@0.35.1-alpha.0) (2021-03-30)

### Features Dendron

- and and commit cmd ([9b9d86c](https://github.com/dendronhq/dendron/commit/9b9d86ccf54fdb8b58f4c04bd57700d8c4c84cf7))

# [0.35.0](https://github.com/dendronhq/dendron/compare/@dendronhq/engine-test-utils@0.34.0...@dendronhq/engine-test-utils@0.35.0) (2021-03-29)

### Bug Fixes

- typo in config option ([2be82e8](https://github.com/dendronhq/dendron/commit/2be82e8116e2bf5698abb7660795044ffa3f405d))

## [0.34.2-alpha.0](https://github.com/dendronhq/dendron/compare/@dendronhq/engine-test-utils@0.34.0...@dendronhq/engine-test-utils@0.34.2-alpha.0) (2021-03-28)

### Bug Fixes

- typo in config option ([2be82e8](https://github.com/dendronhq/dendron/commit/2be82e8116e2bf5698abb7660795044ffa3f405d))

## [0.34.1-alpha.0](https://github.com/dendronhq/dendron/compare/@dendronhq/engine-test-utils@0.34.0...@dendronhq/engine-test-utils@0.34.1-alpha.0) (2021-03-28)

### Bug Fixes

- typo in config option ([2be82e8](https://github.com/dendronhq/dendron/commit/2be82e8116e2bf5698abb7660795044ffa3f405d))

# [0.34.0](https://github.com/dendronhq/dendron/compare/@dendronhq/engine-test-utils@0.32.2...@dendronhq/engine-test-utils@0.34.0) (2021-03-22)

### Bug Fixes

- disable pretty ref when exporting markdown ([c0791da](https://github.com/dendronhq/dendron/commit/c0791da911b665ca66f1b3829784cf8a95ef9952))

### Features Dendron

- markdown export pod ([552e01f](https://github.com/dendronhq/dendron/commit/552e01fa21bb6d6da1e243696a67382afda23194))

## [0.33.5-alpha.0](https://github.com/dendronhq/dendron/compare/@dendronhq/engine-test-utils@0.32.2...@dendronhq/engine-test-utils@0.33.5-alpha.0) (2021-03-22)

### Bug Fixes

- disable pretty ref when exporting markdown ([c0791da](https://github.com/dendronhq/dendron/commit/c0791da911b665ca66f1b3829784cf8a95ef9952))

### Features Dendron

- markdown export pod ([552e01f](https://github.com/dendronhq/dendron/commit/552e01fa21bb6d6da1e243696a67382afda23194))

## [0.33.4-alpha.0](https://github.com/dendronhq/dendron/compare/@dendronhq/engine-test-utils@0.32.2...@dendronhq/engine-test-utils@0.33.4-alpha.0) (2021-03-21)

### Bug Fixes

- disable pretty ref when exporting markdown ([c0791da](https://github.com/dendronhq/dendron/commit/c0791da911b665ca66f1b3829784cf8a95ef9952))

### Features Dendron

- markdown export pod ([552e01f](https://github.com/dendronhq/dendron/commit/552e01fa21bb6d6da1e243696a67382afda23194))

## [0.33.3-alpha.0](https://github.com/dendronhq/dendron/compare/@dendronhq/engine-test-utils@0.32.2...@dendronhq/engine-test-utils@0.33.3-alpha.0) (2021-03-19)

### Bug Fixes

- disable pretty ref when exporting markdown ([c0791da](https://github.com/dendronhq/dendron/commit/c0791da911b665ca66f1b3829784cf8a95ef9952))

### Features Dendron

- markdown export pod ([552e01f](https://github.com/dendronhq/dendron/commit/552e01fa21bb6d6da1e243696a67382afda23194))

## [0.33.2-alpha.0](https://github.com/dendronhq/dendron/compare/@dendronhq/engine-test-utils@0.32.2...@dendronhq/engine-test-utils@0.33.2-alpha.0) (2021-03-19)

### Bug Fixes

- disable pretty ref when exporting markdown ([c0791da](https://github.com/dendronhq/dendron/commit/c0791da911b665ca66f1b3829784cf8a95ef9952))

### Features Dendron

- markdown export pod ([552e01f](https://github.com/dendronhq/dendron/commit/552e01fa21bb6d6da1e243696a67382afda23194))

## [0.33.1](https://github.com/dendronhq/dendron/compare/@dendronhq/engine-test-utils@0.32.2...@dendronhq/engine-test-utils@0.33.1) (2021-03-17)

### Bug Fixes

- disable pretty ref when exporting markdown ([c0791da](https://github.com/dendronhq/dendron/commit/c0791da911b665ca66f1b3829784cf8a95ef9952))

### Features Dendron

- markdown export pod ([552e01f](https://github.com/dendronhq/dendron/commit/552e01fa21bb6d6da1e243696a67382afda23194))

# [0.33.0](https://github.com/dendronhq/dendron/compare/@dendronhq/engine-test-utils@0.32.2...@dendronhq/engine-test-utils@0.33.0) (2021-03-15)

### Bug Fixes

- disable pretty ref when exporting markdown ([c0791da](https://github.com/dendronhq/dendron/commit/c0791da911b665ca66f1b3829784cf8a95ef9952))

### Features Dendron

- markdown export pod ([552e01f](https://github.com/dendronhq/dendron/commit/552e01fa21bb6d6da1e243696a67382afda23194))

## [0.32.2](https://github.com/dendronhq/dendron/compare/@dendronhq/engine-test-utils@0.32.0...@dendronhq/engine-test-utils@0.32.2) (2021-03-13)

**Note:** Version bump only for package @dendronhq/engine-test-utils

## [0.32.1](https://github.com/dendronhq/dendron/compare/@dendronhq/engine-test-utils@0.32.0...@dendronhq/engine-test-utils@0.32.1) (2021-03-13)

**Note:** Version bump only for package @dendronhq/engine-test-utils

# [0.32.0](https://github.com/dendronhq/dendron/compare/@dendronhq/engine-test-utils@0.31.3-alpha.0...@dendronhq/engine-test-utils@0.32.0) (2021-03-08)

**Note:** Version bump only for package @dendronhq/engine-test-utils

## [0.31.3-alpha.0](https://github.com/dendronhq/dendron/compare/@dendronhq/engine-test-utils@0.31.2...@dendronhq/engine-test-utils@0.31.3-alpha.0) (2021-03-07)

**Note:** Version bump only for package @dendronhq/engine-test-utils

## [0.31.2](https://github.com/dendronhq/dendron/compare/@dendronhq/engine-test-utils@0.31.1...@dendronhq/engine-test-utils@0.31.2) (2021-03-07)

### Bug Fixes

- multi-link wikilink not resolving ([cfaf2c0](https://github.com/dendronhq/dendron/commit/cfaf2c0ae58464ceef2edcd2b5c182b93136fa80))

## [0.31.2-alpha.0](https://github.com/dendronhq/dendron/compare/@dendronhq/engine-test-utils@0.31.1...@dendronhq/engine-test-utils@0.31.2-alpha.0) (2021-03-05)

### Bug Fixes

- multi-link wikilink not resolving ([cfaf2c0](https://github.com/dendronhq/dendron/commit/cfaf2c0ae58464ceef2edcd2b5c182b93136fa80))

## [0.31.1](https://github.com/dendronhq/dendron/compare/@dendronhq/engine-test-utils@0.31.0...@dendronhq/engine-test-utils@0.31.1) (2021-03-02)

**Note:** Version bump only for package @dendronhq/engine-test-utils

# [0.31.0](https://github.com/dendronhq/dendron/compare/@dendronhq/engine-test-utils@0.30.1...@dendronhq/engine-test-utils@0.31.0) (2021-03-01)

### Bug Fixes

- handle links to home page for backlinks ([5d6303b](https://github.com/dendronhq/dendron/commit/5d6303b0155617b940ba489ee7e20f5aa28d42cf))
- multi-case parent hiearchies ([aca4df1](https://github.com/dendronhq/dendron/commit/aca4df178b6fa8eb5703afdca4ddc36a46e81134))

### Features Dendron

- move child notes generation into remark ([c4b12cf](https://github.com/dendronhq/dendron/commit/c4b12cf91ea48d662b30713033b2b70e10094131))

### Reverts

- Revert "integ: publish minor" ([38ff5dd](https://github.com/dendronhq/dendron/commit/38ff5dd049cecd939fbd70744ef76a704aec3400))

## [0.30.2-alpha.0](https://github.com/dendronhq/dendron/compare/@dendronhq/engine-test-utils@0.30.1...@dendronhq/engine-test-utils@0.30.2-alpha.0) (2021-02-28)

**Note:** Version bump only for package @dendronhq/engine-test-utils

## [0.30.1](https://github.com/dendronhq/dendron/compare/@dendronhq/engine-test-utils@0.29.1-alpha.0...@dendronhq/engine-test-utils@0.30.1) (2021-02-26)

### Bug Fixes

- publish pod updates ([fd29e9a](https://github.com/dendronhq/dendron/commit/fd29e9af13bf2c41c39f32da42dba31bb65013d6))

## [0.30.1-alpha.0](https://github.com/dendronhq/dendron/compare/@dendronhq/engine-test-utils@0.29.1-alpha.0...@dendronhq/engine-test-utils@0.30.1-alpha.0) (2021-02-25)

### Bug Fixes

- publish pod updates ([fd29e9a](https://github.com/dendronhq/dendron/commit/fd29e9af13bf2c41c39f32da42dba31bb65013d6))

# [0.30.0](https://github.com/dendronhq/dendron/compare/@dendronhq/engine-test-utils@0.29.1-alpha.0...@dendronhq/engine-test-utils@0.30.0) (2021-02-23)

**Note:** Version bump only for package @dendronhq/engine-test-utils

## [0.29.2](https://github.com/dendronhq/dendron/compare/@dendronhq/engine-test-utils@0.29.1-alpha.0...@dendronhq/engine-test-utils@0.29.2) (2021-02-21)

**Note:** Version bump only for package @dendronhq/engine-test-utils

## [0.29.2-alpha.0](https://github.com/dendronhq/dendron/compare/@dendronhq/engine-test-utils@0.29.1-alpha.0...@dendronhq/engine-test-utils@0.29.2-alpha.0) (2021-02-16)

**Note:** Version bump only for package @dendronhq/engine-test-utils

## [0.29.1-alpha.0](https://github.com/dendronhq/dendron/compare/@dendronhq/engine-test-utils@0.29.0...@dendronhq/engine-test-utils@0.29.1-alpha.0) (2021-02-16)

**Note:** Version bump only for package @dendronhq/engine-test-utils

# [0.29.0](https://github.com/dendronhq/dendron/compare/@dendronhq/engine-test-utils@0.28.7-alpha.10...@dendronhq/engine-test-utils@0.29.0) (2021-02-16)

**Note:** Version bump only for package @dendronhq/engine-test-utils

## [0.28.7-alpha.11](https://github.com/dendronhq/dendron/compare/@dendronhq/engine-test-utils@0.28.7-alpha.10...@dendronhq/engine-test-utils@0.28.7-alpha.11) (2021-02-16)

**Note:** Version bump only for package @dendronhq/engine-test-utils

## [0.28.7-alpha.10](https://github.com/dendronhq/dendron/compare/@dendronhq/engine-test-utils@0.28.7-alpha.9...@dendronhq/engine-test-utils@0.28.7-alpha.10) (2021-02-15)

**Note:** Version bump only for package @dendronhq/engine-test-utils

## 0.28.7-alpha.9 (2021-02-15)

## 0.28.7-alpha.3 (2021-02-15)

## 0.28.7-alpha.2 (2021-02-14)

## 0.28.7-alpha.1 (2021-02-14)

## 0.28.7-alpha.0 (2021-02-14)

## 0.28.6 (2021-02-14)

## 0.28.2 (2021-02-08)

## 0.28.1 (2021-02-02)

## 0.28.1-alpha.0 (2021-02-02)

### Bug Fixes

- site filter issues ([d38f4fc](https://github.com/dendronhq/dendron/commit/d38f4fc14e9b502946c7f0717f42cc816afa4aed))

### Reverts

- Revert "chore(release): publish" ([3b2778a](https://github.com/dendronhq/dendron/commit/3b2778a5b1ccc3c53652dcd02e6d42c38f925d2e))

# 0.29.0 (2021-02-02)

# 0.28.0 (2021-02-02)

## 0.27.1-alpha.0 (2021-02-01)

## 0.26.2 (2021-02-01)

## 0.26.2-alpha.1 (2021-02-01)

## 0.26.2-alpha.0 (2021-01-27)

# 0.26.0 (2021-01-25)

## 0.25.4 (2021-01-25)

## 0.25.4-alpha.0 (2021-01-25)

## 0.25.3 (2021-01-22)

## 0.25.3-alpha.3 (2021-01-22)

## 0.25.3-alpha.2 (2021-01-22)

## 0.25.3-alpha.1 (2021-01-22)

## 0.25.2 (2021-01-19)

# 0.25.0 (2021-01-18)

## 0.24.2-alpha.1 (2021-01-17)

## 0.24.2-alpha.0 (2021-01-16)

## 0.24.1 (2021-01-15)

## 0.24.1-alpha.2 (2021-01-14)

## 0.24.1-alpha.1 (2021-01-12)

## 0.24.1-alpha.0 (2021-01-12)

# 0.24.0 (2021-01-11)

## 0.23.2-alpha.4 (2021-01-10)

## 0.23.2-alpha.3 (2021-01-10)

## 0.23.2-alpha.2 (2021-01-09)

## 0.23.2-alpha.1 (2021-01-09)

## 0.23.1 (2021-01-08)

## 0.23.1-alpha.6 (2021-01-07)

## 0.23.1-alpha.4 (2021-01-06)

## 0.23.1-alpha.3 (2021-01-06)

## 0.23.1-alpha.2 (2021-01-06)

## 0.23.1-alpha.1 (2021-01-06)

## 0.23.1-alpha.0 (2021-01-04)

# 0.23.0 (2021-01-04)

## 0.22.2-alpha.1 (2021-01-03)

## 0.22.2-alpha.0 (2021-01-02)

## 0.22.1 (2020-12-31)

## 0.22.1-alpha.5 (2020-12-30)

## 0.22.1-alpha.2 (2020-12-30)

## 0.22.1-alpha.0 (2020-12-29)

# 0.22.0 (2020-12-28)

## 0.21.1-alpha.14 (2020-12-28)

## 0.21.1-alpha.11 (2020-12-28)

## 0.21.1-alpha.10 (2020-12-27)

## 0.21.1-alpha.9 (2020-12-27)

## 0.21.1-alpha.8 (2020-12-27)

## 0.21.1-alpha.7 (2020-12-27)

## 0.21.1-alpha.6 (2020-12-26)

## 0.21.1-alpha.5 (2020-12-26)

## 0.21.1-alpha.3 (2020-12-24)

## 0.21.1-alpha.2 (2020-12-24)

## 0.21.1-alpha.1 (2020-12-23)

## 0.21.1-alpha.0 (2020-12-22)

# 0.21.0 (2020-12-21)

## 0.20.1-alpha.14 (2020-12-21)

### Bug Fixes

- handle single hiearchy properly ([3e822a6](https://github.com/dendronhq/dendron/commit/3e822a6d659c5f4da6bd3ddad9bf1d93a5c353e3))

## 0.20.1-alpha.13 (2020-12-21)

## 0.20.1-alpha.12 (2020-12-21)

## 0.20.1-alpha.11 (2020-12-20)

## 0.20.1-alpha.10 (2020-12-20)

## 0.20.1-alpha.7 (2020-12-19)

## 0.20.1-alpha.6 (2020-12-19)

## 0.20.1-alpha.5 (2020-12-19)

## 0.20.1-alpha.0 (2020-12-17)

## [0.28.7-alpha.8](https://github.com/dendronhq/dendron/compare/v0.28.7-alpha.3...v0.28.7-alpha.8) (2021-02-15)

**Note:** Version bump only for package @dendronhq/engine-test-utils

## [0.28.7-alpha.7](https://github.com/dendronhq/dendron/compare/v0.28.7-alpha.3...v0.28.7-alpha.7) (2021-02-15)

**Note:** Version bump only for package @dendronhq/engine-test-utils

## [0.28.7-alpha.6](https://github.com/dendronhq/dendron/compare/v0.28.7-alpha.3...v0.28.7-alpha.6) (2021-02-15)

**Note:** Version bump only for package @dendronhq/engine-test-utils

## [0.28.7-alpha.5](https://github.com/dendronhq/dendron/compare/v0.28.7-alpha.3...v0.28.7-alpha.5) (2021-02-15)

**Note:** Version bump only for package @dendronhq/engine-test-utils

## [0.28.7-alpha.4](https://github.com/dendronhq/dendron/compare/v0.28.7-alpha.3...v0.28.7-alpha.4) (2021-02-15)

**Note:** Version bump only for package @dendronhq/engine-test-utils

## [0.28.7-alpha.3](https://github.com/dendronhq/dendron/compare/v0.28.7-alpha.2...v0.28.7-alpha.3) (2021-02-15)

**Note:** Version bump only for package @dendronhq/engine-test-utils

## [0.28.7-alpha.2](https://github.com/dendronhq/dendron/compare/v0.28.7-alpha.1...v0.28.7-alpha.2) (2021-02-14)

**Note:** Version bump only for package @dendronhq/engine-test-utils

## [0.28.7-alpha.1](https://github.com/dendronhq/dendron/compare/v0.28.7-alpha.0...v0.28.7-alpha.1) (2021-02-14)

**Note:** Version bump only for package @dendronhq/engine-test-utils

## [0.28.7-alpha.0](https://github.com/dendronhq/dendron/compare/v0.28.6...v0.28.7-alpha.0) (2021-02-14)

**Note:** Version bump only for package @dendronhq/engine-test-utils

## [0.28.6](https://github.com/dendronhq/dendron/compare/v0.28.5...v0.28.6) (2021-02-14)

**Note:** Version bump only for package @dendronhq/engine-test-utils

# [0.29.0](https://github.com/dendronhq/dendron/compare/v0.28.5...v0.29.0) (2021-02-09)

**Note:** Version bump only for package @dendronhq/engine-test-utils

## [0.28.2](https://github.com/dendronhq/dendron/compare/v0.28.2-alpha.2...v0.28.2) (2021-02-08)

**Note:** Version bump only for package @dendronhq/engine-test-utils

## [0.28.1](https://github.com/dendronhq/dendron/compare/v0.28.1-alpha.0...v0.28.1) (2021-02-02)

**Note:** Version bump only for package @dendronhq/engine-test-utils

## [0.28.1-alpha.0](https://github.com/dendronhq/dendron/compare/v0.29.0...v0.28.1-alpha.0) (2021-02-02)

### Bug Fixes

- site filter issues ([d38f4fc](https://github.com/dendronhq/dendron/commit/d38f4fc14e9b502946c7f0717f42cc816afa4aed))

### Reverts

- Revert "chore(release): publish" ([3b2778a](https://github.com/dendronhq/dendron/commit/3b2778a5b1ccc3c53652dcd02e6d42c38f925d2e))

# [0.28.0](https://github.com/dendronhq/dendron/compare/v0.27.1-alpha.0...v0.28.0) (2021-02-02)

**Note:** Version bump only for package @dendronhq/engine-test-utils

## [0.27.1-alpha.0](https://github.com/dendronhq/dendron/compare/v0.26.2...v0.27.1-alpha.0) (2021-02-01)

**Note:** Version bump only for package @dendronhq/engine-test-utils

# [0.27.0](https://github.com/dendronhq/dendron/compare/v0.26.2...v0.27.0) (2021-02-01)

**Note:** Version bump only for package @dendronhq/engine-test-utils

## [0.26.2](https://github.com/dendronhq/dendron/compare/v0.26.2-alpha.1...v0.26.2) (2021-02-01)

**Note:** Version bump only for package @dendronhq/engine-test-utils

## [0.26.2-alpha.1](https://github.com/dendronhq/dendron/compare/v0.26.2-alpha.0...v0.26.2-alpha.1) (2021-02-01)

**Note:** Version bump only for package @dendronhq/engine-test-utils

## [0.26.2-alpha.0](https://github.com/dendronhq/dendron/compare/v0.26.1...v0.26.2-alpha.0) (2021-01-27)

**Note:** Version bump only for package @dendronhq/engine-test-utils

# [0.26.0](https://github.com/dendronhq/dendron/compare/v0.25.4...v0.26.0) (2021-01-25)

**Note:** Version bump only for package @dendronhq/engine-test-utils

## [0.25.4](https://github.com/dendronhq/dendron/compare/v0.25.4-alpha.0...v0.25.4) (2021-01-25)

**Note:** Version bump only for package @dendronhq/engine-test-utils

## [0.25.4-alpha.0](https://github.com/dendronhq/dendron/compare/v0.25.3...v0.25.4-alpha.0) (2021-01-25)

**Note:** Version bump only for package @dendronhq/engine-test-utils

## [0.25.3](https://github.com/dendronhq/dendron/compare/v0.25.3-alpha.3...v0.25.3) (2021-01-22)

**Note:** Version bump only for package @dendronhq/engine-test-utils

## [0.25.3-alpha.3](https://github.com/dendronhq/dendron/compare/v0.25.3-alpha.2...v0.25.3-alpha.3) (2021-01-22)

**Note:** Version bump only for package @dendronhq/engine-test-utils

## [0.25.3-alpha.2](https://github.com/dendronhq/dendron/compare/v0.25.3-alpha.1...v0.25.3-alpha.2) (2021-01-22)

**Note:** Version bump only for package @dendronhq/engine-test-utils

## [0.25.3-alpha.1](https://github.com/dendronhq/dendron/compare/v0.25.3-alpha.0...v0.25.3-alpha.1) (2021-01-22)

**Note:** Version bump only for package @dendronhq/engine-test-utils

## [0.25.2](https://github.com/dendronhq/dendron/compare/v0.25.1...v0.25.2) (2021-01-19)

### Enhancements

- use multi-vault list to handle dups ([ee50aa5](https://github.com/dendronhq/dendron/commit/ee50aa5494f005be062a9ee40b0bfbdfe5b7607e))

# [0.25.0](https://github.com/dendronhq/dendron/compare/v0.24.2-alpha.1...v0.25.0) (2021-01-18)

**Note:** Version bump only for package @dendronhq/engine-test-utils

## [0.24.2-alpha.1](https://github.com/dendronhq/dendron/compare/v0.24.2-alpha.0...v0.24.2-alpha.1) (2021-01-17)

**Note:** Version bump only for package @dendronhq/engine-test-utils

## [0.24.2-alpha.0](https://github.com/dendronhq/dendron/compare/v0.24.1...v0.24.2-alpha.0) (2021-01-16)

**Note:** Version bump only for package @dendronhq/engine-test-utils

## [0.24.1](https://github.com/dendronhq/dendron/compare/v0.24.1-alpha.2...v0.24.1) (2021-01-15)

**Note:** Version bump only for package @dendronhq/engine-test-utils

## [0.24.1-alpha.2](https://github.com/dendronhq/dendron/compare/v0.24.1-alpha.1...v0.24.1-alpha.2) (2021-01-14)

**Note:** Version bump only for package @dendronhq/engine-test-utils

## [0.24.1-alpha.1](https://github.com/dendronhq/dendron/compare/v0.24.1-alpha.0...v0.24.1-alpha.1) (2021-01-12)

**Note:** Version bump only for package @dendronhq/engine-test-utils

## [0.24.1-alpha.0](https://github.com/dendronhq/dendron/compare/v0.24.0...v0.24.1-alpha.0) (2021-01-12)

**Note:** Version bump only for package @dendronhq/engine-test-utils

# [0.24.0](https://github.com/dendronhq/dendron/compare/v0.23.2-alpha.4...v0.24.0) (2021-01-11)

**Note:** Version bump only for package @dendronhq/engine-test-utils

## [0.23.2-alpha.4](https://github.com/dendronhq/dendron/compare/v0.23.2-alpha.3...v0.23.2-alpha.4) (2021-01-10)

**Note:** Version bump only for package @dendronhq/engine-test-utils

## [0.23.2-alpha.3](https://github.com/dendronhq/dendron/compare/v0.23.2-alpha.2...v0.23.2-alpha.3) (2021-01-10)

### Enhancements

- enable pass dict to publish ([ccbc017](https://github.com/dendronhq/dendron/commit/ccbc0178cdc0399230a47e4ab1c90d345e447aeb))

## [0.23.2-alpha.2](https://github.com/dendronhq/dendron/compare/v0.23.2-alpha.1...v0.23.2-alpha.2) (2021-01-09)

**Note:** Version bump only for package @dendronhq/engine-test-utils

## [0.23.2-alpha.1](https://github.com/dendronhq/dendron/compare/v0.23.1...v0.23.2-alpha.1) (2021-01-09)

**Note:** Version bump only for package @dendronhq/engine-test-utils

## [0.23.2-alpha.0](https://github.com/dendronhq/dendron/compare/v0.23.1...v0.23.2-alpha.0) (2021-01-09)

**Note:** Version bump only for package @dendronhq/engine-test-utils

## [0.23.1](https://github.com/dendronhq/dendron/compare/v0.23.1-alpha.6...v0.23.1) (2021-01-08)

**Note:** Version bump only for package @dendronhq/engine-test-utils

## [0.23.1-alpha.6](https://github.com/dendronhq/dendron/compare/v0.23.1-alpha.5...v0.23.1-alpha.6) (2021-01-07)

**Note:** Version bump only for package @dendronhq/engine-test-utils

## [0.23.1-alpha.4](https://github.com/dendronhq/dendron/compare/v0.23.1-alpha.3...v0.23.1-alpha.4) (2021-01-06)

**Note:** Version bump only for package @dendronhq/engine-test-utils

## [0.23.1-alpha.3](https://github.com/dendronhq/dendron/compare/v0.23.1-alpha.2...v0.23.1-alpha.3) (2021-01-06)

**Note:** Version bump only for package @dendronhq/engine-test-utils

## [0.23.1-alpha.2](https://github.com/dendronhq/dendron/compare/v0.23.1-alpha.1...v0.23.1-alpha.2) (2021-01-06)

**Note:** Version bump only for package @dendronhq/engine-test-utils

## [0.23.1-alpha.1](https://github.com/dendronhq/dendron/compare/v0.23.1-alpha.0...v0.23.1-alpha.1) (2021-01-06)

**Note:** Version bump only for package @dendronhq/engine-test-utils

## [0.23.1-alpha.0](https://github.com/dendronhq/dendron/compare/v0.23.0...v0.23.1-alpha.0) (2021-01-04)

**Note:** Version bump only for package @dendronhq/engine-test-utils

# [0.23.0](https://github.com/dendronhq/dendron/compare/v0.22.2-alpha.1...v0.23.0) (2021-01-04)

**Note:** Version bump only for package @dendronhq/engine-test-utils

## [0.22.2-alpha.1](https://github.com/dendronhq/dendron/compare/v0.22.2-alpha.0...v0.22.2-alpha.1) (2021-01-03)

**Note:** Version bump only for package @dendronhq/engine-test-utils

## [0.22.2-alpha.0](https://github.com/dendronhq/dendron/compare/v0.22.1...v0.22.2-alpha.0) (2021-01-02)

**Note:** Version bump only for package @dendronhq/engine-test-utils

## [0.22.1](https://github.com/dendronhq/dendron/compare/v0.22.1-alpha.5...v0.22.1) (2020-12-31)

### Enhancements

- skip children directive ([de136d7](https://github.com/dendronhq/dendron/commit/de136d7d1adc3a35aaf1a567e260cb3c9254125c))

## [0.22.1-alpha.5](https://github.com/dendronhq/dendron/compare/v0.22.1-alpha.4...v0.22.1-alpha.5) (2020-12-30)

**Note:** Version bump only for package @dendronhq/engine-test-utils

## [0.22.1-alpha.2](https://github.com/dendronhq/dendron/compare/v0.22.1-alpha.1...v0.22.1-alpha.2) (2020-12-30)

**Note:** Version bump only for package @dendronhq/engine-test-utils

## [0.22.1-alpha.0](https://github.com/dendronhq/dendron/compare/v0.22.0...v0.22.1-alpha.0) (2020-12-29)

**Note:** Version bump only for package @dendronhq/engine-test-utils

# [0.22.0](https://github.com/dendronhq/dendron/compare/v0.21.1-alpha.14...v0.22.0) (2020-12-28)

**Note:** Version bump only for package @dendronhq/engine-test-utils

## [0.21.1-alpha.14](https://github.com/dendronhq/dendron/compare/v0.21.1-alpha.13...v0.21.1-alpha.14) (2020-12-28)

**Note:** Version bump only for package @dendronhq/engine-test-utils

## [0.21.1-alpha.11](https://github.com/dendronhq/dendron/compare/v0.21.1-alpha.10...v0.21.1-alpha.11) (2020-12-28)

**Note:** Version bump only for package @dendronhq/engine-test-utils

## [0.21.1-alpha.10](https://github.com/dendronhq/dendron/compare/v0.21.1-alpha.9...v0.21.1-alpha.10) (2020-12-27)

**Note:** Version bump only for package @dendronhq/engine-test-utils

## [0.21.1-alpha.9](https://github.com/dendronhq/dendron/compare/v0.21.1-alpha.8...v0.21.1-alpha.9) (2020-12-27)

**Note:** Version bump only for package @dendronhq/engine-test-utils

## [0.21.1-alpha.8](https://github.com/dendronhq/dendron/compare/v0.21.1-alpha.7...v0.21.1-alpha.8) (2020-12-27)

**Note:** Version bump only for package @dendronhq/engine-test-utils

## [0.21.1-alpha.7](https://github.com/dendronhq/dendron/compare/v0.21.1-alpha.6...v0.21.1-alpha.7) (2020-12-27)

**Note:** Version bump only for package @dendronhq/engine-test-utils

## [0.21.1-alpha.6](https://github.com/dendronhq/dendron/compare/v0.21.1-alpha.5...v0.21.1-alpha.6) (2020-12-26)

**Note:** Version bump only for package @dendronhq/engine-test-utils

## [0.21.1-alpha.5](https://github.com/dendronhq/dendron/compare/v0.21.1-alpha.4...v0.21.1-alpha.5) (2020-12-26)

**Note:** Version bump only for package @dendronhq/engine-test-utils

## [0.21.1-alpha.3](https://github.com/dendronhq/dendron/compare/v0.21.1-alpha.2...v0.21.1-alpha.3) (2020-12-24)

**Note:** Version bump only for package @dendronhq/engine-test-utils

## [0.21.1-alpha.2](https://github.com/dendronhq/dendron/compare/v0.21.1-alpha.1...v0.21.1-alpha.2) (2020-12-24)

**Note:** Version bump only for package @dendronhq/engine-test-utils

## [0.21.1-alpha.1](https://github.com/dendronhq/dendron/compare/v0.21.1-alpha.0...v0.21.1-alpha.1) (2020-12-23)

**Note:** Version bump only for package @dendronhq/engine-test-utils

## [0.21.1-alpha.0](https://github.com/dendronhq/dendron/compare/v0.21.0...v0.21.1-alpha.0) (2020-12-22)

**Note:** Version bump only for package @dendronhq/engine-test-utils

# [0.21.0](https://github.com/dendronhq/dendron/compare/v0.20.1-alpha.15...v0.21.0) (2020-12-21)

**Note:** Version bump only for package @dendronhq/engine-test-utils

## [0.20.1-alpha.14](https://github.com/dendronhq/dendron/compare/v0.20.1-alpha.13...v0.20.1-alpha.14) (2020-12-21)

### Bug Fixes

- handle single hiearchy properly ([3e822a6](https://github.com/dendronhq/dendron/commit/3e822a6d659c5f4da6bd3ddad9bf1d93a5c353e3))

## [0.20.1-alpha.13](https://github.com/dendronhq/dendron/compare/v0.20.1-alpha.12...v0.20.1-alpha.13) (2020-12-21)

**Note:** Version bump only for package @dendronhq/engine-test-utils

## [0.20.1-alpha.12](https://github.com/dendronhq/dendron/compare/v0.20.1-alpha.11...v0.20.1-alpha.12) (2020-12-21)

### Enhancements

- better publishing workflow ([7ebfbba](https://github.com/dendronhq/dendron/commit/7ebfbbadc82d5f707bebd9025c06271aa26eb3b4))

## [0.20.1-alpha.11](https://github.com/dendronhq/dendron/compare/v0.20.1-alpha.10...v0.20.1-alpha.11) (2020-12-20)

**Note:** Version bump only for package @dendronhq/engine-test-utils

## [0.20.1-alpha.10](https://github.com/dendronhq/dendron/compare/v0.20.1-alpha.9...v0.20.1-alpha.10) (2020-12-20)

**Note:** Version bump only for package @dendronhq/engine-test-utils

## [0.20.1-alpha.7](https://github.com/dendronhq/dendron/compare/v0.20.1-alpha.6...v0.20.1-alpha.7) (2020-12-19)

**Note:** Version bump only for package @dendronhq/engine-test-utils

## [0.20.1-alpha.6](https://github.com/dendronhq/dendron/compare/v0.20.1-alpha.5...v0.20.1-alpha.6) (2020-12-19)

**Note:** Version bump only for package @dendronhq/engine-test-utils

## [0.20.1-alpha.5](https://github.com/dendronhq/dendron/compare/v0.20.1-alpha.4...v0.20.1-alpha.5) (2020-12-19)

**Note:** Version bump only for package @dendronhq/engine-test-utils

## [0.20.1-alpha.0](https://github.com/dendronhq/dendron/compare/v0.20.0...v0.20.1-alpha.0) (2020-12-17)

**Note:** Version bump only for package @dendronhq/engine-test-utils

# [0.20.0](https://github.com/dendronhq/dendron/compare/v0.19.3-alpha.2...v0.20.0) (2020-12-14)

**Note:** Version bump only for package @dendronhq/common-test-utils

## [0.19.3-alpha.2](https://github.com/dendronhq/dendron/compare/v0.19.3-alpha.1...v0.19.3-alpha.2) (2020-12-14)

**Note:** Version bump only for package @dendronhq/common-test-utils

## [0.19.3-alpha.1](https://github.com/dendronhq/dendron/compare/v0.19.3-alpha.0...v0.19.3-alpha.1) (2020-12-13)

**Note:** Version bump only for package @dendronhq/common-test-utils

## [0.19.2](https://github.com/dendronhq/dendron/compare/v0.19.2-alpha.2...v0.19.2) (2020-12-10)

**Note:** Version bump only for package @dendronhq/common-test-utils

## [0.19.2-alpha.2](https://github.com/dendronhq/dendron/compare/v0.19.2-alpha.1...v0.19.2-alpha.2) (2020-12-10)

**Note:** Version bump only for package @dendronhq/common-test-utils

## [0.19.2-alpha.1](https://github.com/dendronhq/dendron/compare/v0.19.2-alpha.0...v0.19.2-alpha.1) (2020-12-10)

### Enhancements

- write remote url to dendron config ([2a285ea](https://github.com/dendronhq/dendron/commit/2a285eacaeef8224d2a3530dc991b4977443c039))

## [0.19.2-alpha.0](https://github.com/dendronhq/dendron/compare/v0.19.1...v0.19.2-alpha.0) (2020-12-09)

**Note:** Version bump only for package @dendronhq/common-test-utils

# [0.19.0](https://github.com/dendronhq/dendron/compare/v0.18.2-alpha.8...v0.19.0) (2020-12-07)

**Note:** Version bump only for package @dendronhq/common-test-utils

## [0.18.2-alpha.8](https://github.com/dendronhq/dendron/compare/v0.18.2-alpha.7...v0.18.2-alpha.8) (2020-12-07)

### Bug Fixes

- tree view adding new nodes in wrong place ([173f57b](https://github.com/dendronhq/dendron/commit/173f57bfb2730da2361950df35054a53f0aba765))

## [0.18.2-alpha.7](https://github.com/dendronhq/dendron/compare/v0.18.2-alpha.6...v0.18.2-alpha.7) (2020-12-07)

**Note:** Version bump only for package @dendronhq/common-test-utils

## [0.18.2-alpha.2](https://github.com/dendronhq/dendron/compare/v0.18.2-alpha.1...v0.18.2-alpha.2) (2020-12-05)

**Note:** Version bump only for package @dendronhq/common-test-utils

## [0.18.2-alpha.0](https://github.com/dendronhq/dendron/compare/v0.18.1...v0.18.2-alpha.0) (2020-12-04)

**Note:** Version bump only for package @dendronhq/common-test-utils

## [0.18.1](https://github.com/dendronhq/dendron/compare/v0.18.1-alpha.4...v0.18.1) (2020-12-04)

**Note:** Version bump only for package @dendronhq/common-test-utils

## [0.18.1-alpha.4](https://github.com/dendronhq/dendron/compare/v0.18.1-alpha.3...v0.18.1-alpha.4) (2020-12-04)

### Enhancements

- support private vaults ([98b4961](https://github.com/dendronhq/dendron/commit/98b4961d791b8a30c45e408fdf926838dfd5e431))

## [0.18.1-alpha.3](https://github.com/dendronhq/dendron/compare/v0.18.1-alpha.2...v0.18.1-alpha.3) (2020-12-03)

**Note:** Version bump only for package @dendronhq/common-test-utils

## [0.18.1-alpha.2](https://github.com/dendronhq/dendron/compare/v0.18.1-alpha.1...v0.18.1-alpha.2) (2020-12-03)

**Note:** Version bump only for package @dendronhq/common-test-utils

## [0.18.1-alpha.1](https://github.com/dendronhq/dendron/compare/v0.18.1-alpha.0...v0.18.1-alpha.1) (2020-12-03)

**Note:** Version bump only for package @dendronhq/common-test-utils

# [0.18.0](https://github.com/dendronhq/dendron/compare/v0.17.2...v0.18.0) (2020-11-29)

**Note:** Version bump only for package @dendronhq/common-test-utils

## [0.17.2](https://github.com/dendronhq/dendron/compare/v0.17.2-alpha.5...v0.17.2) (2020-11-29)

**Note:** Version bump only for package @dendronhq/common-test-utils

## [0.17.2-alpha.5](https://github.com/dendronhq/dendron/compare/v0.17.2-alpha.4...v0.17.2-alpha.5) (2020-11-29)

**Note:** Version bump only for package @dendronhq/common-test-utils

## [0.17.2-alpha.1](https://github.com/dendronhq/dendron/compare/v0.17.2-alpha.0...v0.17.2-alpha.1) (2020-11-29)

### Features

- add config apis ([f022689](https://github.com/dendronhq/dendron/commit/f0226890ff01c4e5c1746d0cee7b9e99db07d4d6))

## [0.17.2-alpha.0](https://github.com/dendronhq/dendron/compare/v0.17.1-alpha.1...v0.17.2-alpha.0) (2020-11-28)

### Enhancements

- enable rename with multivault ([50304da](https://github.com/dendronhq/dendron/commit/50304da8b419ad1ff3e8380e2c2d57e4fa8694b3))

## [0.17.1](https://github.com/dendronhq/dendron/compare/v0.17.1-alpha.1...v0.17.1) (2020-11-26)

**Note:** Version bump only for package @dendronhq/common-test-utils

## [0.17.1-alpha.0](https://github.com/dendronhq/dendron/compare/v0.17.0...v0.17.1-alpha.0) (2020-11-25)

**Note:** Version bump only for package @dendronhq/common-test-utils

# [0.17.0](https://github.com/dendronhq/dendron/compare/v0.16.3-alpha.5...v0.17.0) (2020-11-22)

**Note:** Version bump only for package @dendronhq/common-test-utils

## [0.16.3-alpha.5](https://github.com/dendronhq/dendron/compare/v0.16.3-alpha.4...v0.16.3-alpha.5) (2020-11-22)

**Note:** Version bump only for package @dendronhq/common-test-utils

## [0.16.3-alpha.4](https://github.com/dendronhq/dendron/compare/v0.16.3-alpha.3...v0.16.3-alpha.4) (2020-11-22)

### Bug Fixes

- **pods:** publishing markdown in multi-vault ([cc50327](https://github.com/dendronhq/dendron/commit/cc503276a0ca0545e2793449f7382bc810216377))

### Enhancements

- remove opinionated presets ([6b6bd8d](https://github.com/dendronhq/dendron/commit/6b6bd8d1b866bfe881b8ed7c341e5f2191bfa741))
- support relative links in publishing ([d7d612d](https://github.com/dendronhq/dendron/commit/d7d612d00bf0fedfc5e7dc9beda1e00927be83a9))

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

**Note:** Version bump only for package @dendronhq/common-test-utils

## [0.16.1](https://github.com/dendronhq/dendron/compare/v0.16.1-alpha.2...v0.16.1) (2020-11-18)

**Note:** Version bump only for package @dendronhq/common-test-utils

## [0.16.1-alpha.2](https://github.com/dendronhq/dendron/compare/v0.16.1-alpha.1...v0.16.1-alpha.2) (2020-11-18)

### Enhancements

- **md:** go to link via slug ([a0f9556](https://github.com/dendronhq/dendron/commit/a0f9556e49c34f83288f87dd7423ebb8e4dbf43f))
- in house link provider ([3c54022](https://github.com/dendronhq/dendron/commit/3c54022724d78d8019a25e60a489e585e7af8209))

### Features

- **workbench:** navigate to relative wiki-links ([49c3b54](https://github.com/dendronhq/dendron/commit/49c3b5439fb34b8c6f1f5505fcd90193cbfa28cd))

# [0.16.0](https://github.com/dendronhq/dendron/compare/v0.15.3-alpha.5...v0.16.0) (2020-11-15)

**Note:** Version bump only for package @dendronhq/common-test-utils

## [0.15.3-alpha.1](https://github.com/dendronhq/dendron/compare/v0.15.3-alpha.0...v0.15.3-alpha.1) (2020-11-15)

### Bug Fixes

- sync issues btw server and client nodes ([a446aba](https://github.com/dendronhq/dendron/commit/a446aba9d931d7732553e1ecb43302208d6f798a))

## [0.15.1](https://github.com/dendronhq/dendron/compare/v0.15.1-alpha.7...v0.15.1) (2020-11-14)

**Note:** Version bump only for package @dendronhq/common-test-utils

## [0.15.1-alpha.5](https://github.com/dendronhq/dendron/compare/v0.15.1-alpha.4...v0.15.1-alpha.5) (2020-11-13)

### Bug Fixes

- **engine:** rename fail in some cases ([de44f9f](https://github.com/dendronhq/dendron/commit/de44f9f4d38651d75433ae885fdc78bb762fb1f6))

## [0.15.1-alpha.4](https://github.com/dendronhq/dendron/compare/v0.15.1-alpha.3...v0.15.1-alpha.4) (2020-11-13)

**Note:** Version bump only for package @dendronhq/common-test-utils

## [0.15.1-alpha.3](https://github.com/dendronhq/dendron/compare/v0.15.1-alpha.2...v0.15.1-alpha.3) (2020-11-12)

### Bug Fixes

- **notes:** fix issue when importing note that already exists ([a08a34a](https://github.com/dendronhq/dendron/commit/a08a34a0563bb4047bd9c7cfc5f2bf150873fdc8))

## [0.15.1-alpha.2](https://github.com/dendronhq/dendron/compare/v0.15.1-alpha.1...v0.15.1-alpha.2) (2020-11-12)

**Note:** Version bump only for package @dendronhq/common-test-utils

## [0.15.1-alpha.1](https://github.com/dendronhq/dendron/compare/v0.15.1-alpha.0...v0.15.1-alpha.1) (2020-11-11)

### Enhancements

- **refs:** wildcard refs get nice links ([98a1177](https://github.com/dendronhq/dendron/commit/98a117715a967492ab9d7b8749d964b07bde4055))

## [0.15.1-alpha.0](https://github.com/dendronhq/dendron/compare/v0.15.0...v0.15.1-alpha.0) (2020-11-10)

**Note:** Version bump only for package @dendronhq/common-test-utils

# [0.15.0](https://github.com/dendronhq/dendron/compare/v0.14.2-alpha.7...v0.15.0) (2020-11-09)

**Note:** Version bump only for package @dendronhq/common-test-utils

## [0.14.2-alpha.7](https://github.com/dendronhq/dendron/compare/v0.14.2-alpha.6...v0.14.2-alpha.7) (2020-11-09)

**Note:** Version bump only for package @dendronhq/common-test-utils

## [0.14.2-alpha.5](https://github.com/dendronhq/dendron/compare/v0.14.2-alpha.1...v0.14.2-alpha.5) (2020-11-08)

**Note:** Version bump only for package @dendronhq/common-test-utils

## [0.14.2-alpha.4](https://github.com/dendronhq/dendron/compare/v0.14.2-alpha.3...v0.14.2-alpha.4) (2020-11-08)

**Note:** Version bump only for package @dendronhq/common-test-utils

## [0.14.2-alpha.3](https://github.com/dendronhq/dendron/compare/v0.14.2-alpha.2...v0.14.2-alpha.3) (2020-11-08)

**Note:** Version bump only for package @dendronhq/common-test-utils

## [0.14.2-alpha.2](https://github.com/dendronhq/dendron/compare/v0.14.2-alpha.1...v0.14.2-alpha.2) (2020-11-08)

**Note:** Version bump only for package @dendronhq/common-test-utils

## [0.14.2-alpha.0](https://github.com/dendronhq/dendron/compare/v0.14.1...v0.14.2-alpha.0) (2020-11-07)

### Enhancements

- **engine:** add sync method ([ec58d39](https://github.com/dendronhq/dendron/commit/ec58d395003640384b7764f4f8b483429cc1ece3))

### Features

- **markdown:** wildcard links in note refs ([b8dea8f](https://github.com/dendronhq/dendron/commit/b8dea8f4441cfc01f5acc522ffa3a6402ff50572))
- **refs:** support wildcard links when publishing ([74079fa](https://github.com/dendronhq/dendron/commit/74079fa4ed9c08b1890852738df858f1f393bec6))

## [0.14.1](https://github.com/dendronhq/dendron/compare/v0.14.1-alpha.7...v0.14.1) (2020-11-05)

**Note:** Version bump only for package @dendronhq/common-test-utils

## [0.14.1-alpha.6](https://github.com/dendronhq/dendron/compare/v0.14.1-alpha.5...v0.14.1-alpha.6) (2020-11-05)

**Note:** Version bump only for package @dendronhq/common-test-utils

## [0.14.1-alpha.3](https://github.com/dendronhq/dendron/compare/v0.14.1-alpha.2...v0.14.1-alpha.3) (2020-11-04)

**Note:** Version bump only for package @dendronhq/common-test-utils

## [0.14.1-alpha.0](https://github.com/dendronhq/dendron/compare/v0.14.0...v0.14.1-alpha.0) (2020-11-03)

**Note:** Version bump only for package @dendronhq/common-test-utils

# [0.14.0](https://github.com/dendronhq/dendron/compare/v0.13.6-alpha.2...v0.14.0) (2020-11-01)

**Note:** Version bump only for package @dendronhq/common-test-utils

## [0.13.6-alpha.0](https://github.com/dendronhq/dendron/compare/v0.13.5...v0.13.6-alpha.0) (2020-10-31)

**Note:** Version bump only for package @dendronhq/common-test-utils

## [0.13.5](https://github.com/dendronhq/dendron/compare/v0.13.4...v0.13.5) (2020-10-28)

**Note:** Version bump only for package @dendronhq/common-test-utils

## [0.13.4](https://github.com/dendronhq/dendron/compare/v0.13.4-alpha.1...v0.13.4) (2020-10-28)

**Note:** Version bump only for package @dendronhq/common-test-utils

## [0.13.4-alpha.0](https://github.com/dendronhq/dendron/compare/v0.13.3...v0.13.4-alpha.0) (2020-10-27)

### Enhancements

- **workbench:** graceful failure on bad schema ([4db5064](https://github.com/dendronhq/dendron/commit/4db5064e4eef61d9c95b9abe34f2dec41550bd9d))

## [0.13.3](https://github.com/dendronhq/dendron/compare/v0.13.3-alpha.1...v0.13.3) (2020-10-24)

**Note:** Version bump only for package @dendronhq/common-test-utils

## [0.13.3-alpha.1](https://github.com/dendronhq/dendron/compare/v0.13.3-alpha.0...v0.13.3-alpha.1) (2020-10-24)

**Note:** Version bump only for package @dendronhq/common-test-utils

## [0.13.3-alpha.0](https://github.com/dendronhq/dendron/compare/v0.13.2...v0.13.3-alpha.0) (2020-10-23)

**Note:** Version bump only for package @dendronhq/common-test-utils

## [0.13.2](https://github.com/dendronhq/dendron/compare/v0.13.2-alpha.2...v0.13.2) (2020-10-22)

**Note:** Version bump only for package @dendronhq/common-test-utils

## [0.13.2-alpha.2](https://github.com/dendronhq/dendron/compare/v0.13.2-alpha.1...v0.13.2-alpha.2) (2020-10-22)

**Note:** Version bump only for package @dendronhq/common-test-utils

## [0.13.2-alpha.0](https://github.com/dendronhq/dendron/compare/v0.13.1...v0.13.2-alpha.0) (2020-10-21)

### Features

- **pods:** add publish pod cmd ([8947a60](https://github.com/dendronhq/dendron/commit/8947a60cbc2e76f00d214a1913952c58db86f2f1))

## [0.13.1](https://github.com/dendronhq/dendron/compare/v0.13.1-alpha.2...v0.13.1) (2020-10-21)

**Note:** Version bump only for package @dendronhq/common-test-utils

## [0.13.1-alpha.2](https://github.com/dendronhq/dendron/compare/v0.13.1-alpha.1...v0.13.1-alpha.2) (2020-10-20)

**Note:** Version bump only for package @dendronhq/common-test-utils

## [0.13.1-alpha.1](https://github.com/dendronhq/dendron/compare/v0.13.1-alpha.0...v0.13.1-alpha.1) (2020-10-20)

**Note:** Version bump only for package @dendronhq/common-test-utils

## [0.13.1-alpha.0](https://github.com/dendronhq/dendron/compare/v0.13.0...v0.13.1-alpha.0) (2020-10-20)

**Note:** Version bump only for package @dendronhq/common-test-utils

# [0.13.0](https://github.com/dendronhq/dendron/compare/v0.12.12-alpha.0...v0.13.0) (2020-10-19)

**Note:** Version bump only for package @dendronhq/common-test-utils

## [0.12.12-alpha.0](https://github.com/dendronhq/dendron/compare/v0.12.11...v0.12.12-alpha.0) (2020-10-19)

**Note:** Version bump only for package @dendronhq/common-test-utils

## [0.12.11](https://github.com/dendronhq/dendron/compare/v0.12.11-alpha.6...v0.12.11) (2020-10-18)

**Note:** Version bump only for package @dendronhq/common-test-utils

## [0.12.11-alpha.2](https://github.com/dendronhq/dendron/compare/v0.12.11-alpha.1...v0.12.11-alpha.2) (2020-10-18)

**Note:** Version bump only for package @dendronhq/common-test-utils

## [0.12.11-alpha.1](https://github.com/dendronhq/dendron/compare/v0.12.11-alpha.0...v0.12.11-alpha.1) (2020-10-17)

### Bug Fixes

- **server:** rename note doesn't preserve body in some cases ([656e730](https://github.com/dendronhq/dendron/commit/656e730c998772b009086a2edaaac7d2566efd92))

## [0.12.10](https://github.com/dendronhq/dendron/compare/v0.12.10-alpha.4...v0.12.10) (2020-10-16)

**Note:** Version bump only for package @dendronhq/common-test-utils

## [0.12.10-alpha.2](https://github.com/dendronhq/dendron/compare/v0.12.10-alpha.1...v0.12.10-alpha.2) (2020-10-16)

### Enhancements

- **server:** apply schema templates in all cases ([2e7407a](https://github.com/dendronhq/dendron/commit/2e7407a05fad1356900582c431a1c9f9841f08a8))

## [0.12.10-alpha.0](https://github.com/dendronhq/dendron/compare/v0.12.9...v0.12.10-alpha.0) (2020-10-16)

### Enhancements

- **server:** migrate refactor hierarchy cmd ([b39ab13](https://github.com/dendronhq/dendron/commit/b39ab131678cec43b8f74efdde5372e90e4c11ce))

## [0.12.9](https://github.com/dendronhq/dendron/compare/v0.12.9-alpha.1...v0.12.9) (2020-10-15)

**Note:** Version bump only for package @dendronhq/common-test-utils

## [0.12.9-alpha.0](https://github.com/dendronhq/dendron/compare/v0.12.8...v0.12.9-alpha.0) (2020-10-14)

**Note:** Version bump only for package @dendronhq/common-test-utils

## [0.12.8](https://github.com/dendronhq/dendron/compare/v0.12.8-alpha.2...v0.12.8) (2020-10-14)

**Note:** Version bump only for package @dendronhq/common-test-utils

## [0.12.8-alpha.2](https://github.com/dendronhq/dendron/compare/v0.12.8-alpha.1...v0.12.8-alpha.2) (2020-10-14)

**Note:** Version bump only for package @dendronhq/common-test-utils

## [0.12.8-alpha.0](https://github.com/dendronhq/dendron/compare/v0.12.7...v0.12.8-alpha.0) (2020-10-13)

**Note:** Version bump only for package @dendronhq/common-test-utils

## [0.12.7](https://github.com/dendronhq/dendron/compare/v0.12.7-alpha.10...v0.12.7) (2020-10-13)

**Note:** Version bump only for package @dendronhq/common-test-utils

## [0.12.7-alpha.8](https://github.com/dendronhq/dendron/compare/v0.12.7-alpha.7...v0.12.7-alpha.8) (2020-10-12)

**Note:** Version bump only for package @dendronhq/common-test-utils

## [0.12.7-alpha.7](https://github.com/dendronhq/dendron/compare/v0.12.7-alpha.6...v0.12.7-alpha.7) (2020-10-12)

**Note:** Version bump only for package @dendronhq/common-test-utils

## [0.12.7-alpha.5](https://github.com/dendronhq/dendron/compare/v0.12.7-alpha.4...v0.12.7-alpha.5) (2020-10-12)

**Note:** Version bump only for package @dendronhq/common-test-utils

## [0.12.7-alpha.4](https://github.com/dendronhq/dendron/compare/v0.12.7-alpha.3...v0.12.7-alpha.4) (2020-10-12)

**Note:** Version bump only for package @dendronhq/common-test-utils

## [0.12.7-alpha.3](https://github.com/dendronhq/dendron/compare/v0.12.7-alpha.2...v0.12.7-alpha.3) (2020-10-11)

**Note:** Version bump only for package @dendronhq/common-test-utils

## [0.12.7-alpha.0](https://github.com/dendronhq/dendron/compare/v0.12.6...v0.12.7-alpha.0) (2020-10-11)

**Note:** Version bump only for package @dendronhq/common-test-utils

## [0.12.5](https://github.com/dendronhq/dendron/compare/v0.12.5-alpha.7...v0.12.5) (2020-10-07)

**Note:** Version bump only for package @dendronhq/common-test-utils

## [0.12.5-alpha.7](https://github.com/dendronhq/dendron/compare/v0.12.5-alpha.6...v0.12.5-alpha.7) (2020-10-07)

**Note:** Version bump only for package @dendronhq/common-test-utils

## [0.12.5-alpha.6](https://github.com/dendronhq/dendron/compare/v0.12.5-alpha.5...v0.12.5-alpha.6) (2020-10-07)

**Note:** Version bump only for package @dendronhq/common-test-utils

## [0.12.5-alpha.5](https://github.com/dendronhq/dendron/compare/v0.12.5-alpha.4...v0.12.5-alpha.5) (2020-10-06)

**Note:** Version bump only for package @dendronhq/common-test-utils

## [0.12.5-alpha.2](https://github.com/dendronhq/dendron/compare/v0.12.5-alpha.1...v0.12.5-alpha.2) (2020-10-05)

**Note:** Version bump only for package @dendronhq/common-test-utils

## [0.12.5-alpha.1](https://github.com/dendronhq/dendron/compare/v0.12.5-alpha.0...v0.12.5-alpha.1) (2020-10-04)

**Note:** Version bump only for package @dendronhq/common-test-utils

## [0.12.5-alpha.0](https://github.com/dendronhq/dendron/compare/v0.12.4...v0.12.5-alpha.0) (2020-10-04)

**Note:** Version bump only for package @dendronhq/common-test-utils

## [0.12.3](https://github.com/dendronhq/dendron/compare/v0.12.3-alpha.16...v0.12.3) (2020-09-26)

**Note:** Version bump only for package @dendronhq/common-test-utils

## [0.12.3-alpha.12](https://github.com/dendronhq/dendron/compare/v0.12.3-alpha.11...v0.12.3-alpha.12) (2020-09-25)

**Note:** Version bump only for package @dendronhq/common-test-utils

## [0.12.3-alpha.10](https://github.com/dendronhq/dendron/compare/v0.12.3-alpha.9...v0.12.3-alpha.10) (2020-09-25)

**Note:** Version bump only for package @dendronhq/common-test-utils

## [0.12.3-alpha.0](https://github.com/dendronhq/dendron/compare/v0.12.2...v0.12.3-alpha.0) (2020-09-24)

**Note:** Version bump only for package @dendronhq/seeds-core

## [0.12.2](https://github.com/dendronhq/dendron/compare/v0.12.2-alpha.0...v0.12.2) (2020-09-24)

**Note:** Version bump only for package @dendronhq/seeds-core

## [0.12.2-alpha.0](https://github.com/dendronhq/dendron/compare/v0.12.1...v0.12.2-alpha.0) (2020-09-24)

**Note:** Version bump only for package @dendronhq/seeds-core

## [0.12.1](https://github.com/dendronhq/dendron/compare/v0.12.1-alpha.2...v0.12.1) (2020-09-22)

**Note:** Version bump only for package @dendronhq/seeds-core

## [0.12.1-alpha.1](https://github.com/dendronhq/dendron/compare/v0.12.1-alpha.0...v0.12.1-alpha.1) (2020-09-22)

**Note:** Version bump only for package @dendronhq/seeds-core

# [0.12.0](https://github.com/dendronhq/dendron/compare/v0.11.9...v0.12.0) (2020-09-20)

**Note:** Version bump only for package @dendronhq/seeds-core

## [0.11.9](https://github.com/dendronhq/dendron/compare/v0.11.9-alpha.4...v0.11.9) (2020-09-20)

**Note:** Version bump only for package @dendronhq/seeds-core

## [0.11.9-alpha.4](https://github.com/dendronhq/dendron/compare/v0.11.9-alpha.3...v0.11.9-alpha.4) (2020-09-20)

**Note:** Version bump only for package @dendronhq/seeds-core

## [0.11.5](https://github.com/dendronhq/dendron/compare/v0.11.5-alpha.8...v0.11.5) (2020-09-19)

**Note:** Version bump only for package @dendronhq/seeds-core

## [0.11.5-alpha.1](https://github.com/dendronhq/dendron/compare/v0.11.5-alpha.0...v0.11.5-alpha.1) (2020-09-19)

**Note:** Version bump only for package @dendronhq/seeds-core

## [0.11.5-alpha.0](https://github.com/dendronhq/dendron/compare/v0.11.4...v0.11.5-alpha.0) (2020-09-18)

**Note:** Version bump only for package @dendronhq/seeds-core

## [0.11.4](https://github.com/dendronhq/dendron/compare/v0.11.4-alpha.1...v0.11.4) (2020-09-18)

**Note:** Version bump only for package @dendronhq/seeds-core

## [0.11.4-alpha.0](https://github.com/dendronhq/dendron/compare/v0.11.3...v0.11.4-alpha.0) (2020-09-17)

### Enhancements

- **seeds:** better planting options ([c0a1dd4](https://github.com/dendronhq/dendron/commit/c0a1dd4b81418950091a8557583d322cf87a095f))

## [0.11.3](https://github.com/dendronhq/dendron/compare/v0.11.3-alpha.5...v0.11.3) (2020-09-17)

**Note:** Version bump only for package @dendronhq/seeds-core

## [0.11.3-alpha.5](https://github.com/dendronhq/dendron/compare/v0.11.3-alpha.4...v0.11.3-alpha.5) (2020-09-16)

**Note:** Version bump only for package @dendronhq/seeds-core

## [0.11.3-alpha.4](https://github.com/dendronhq/dendron/compare/v0.11.3-alpha.3...v0.11.3-alpha.4) (2020-09-16)

**Note:** Version bump only for package @dendronhq/seeds-core

## [0.11.3-alpha.3](https://github.com/dendronhq/dendron/compare/v0.11.3-alpha.2...v0.11.3-alpha.3) (2020-09-16)

**Note:** Version bump only for package @dendronhq/seeds-core

## [0.11.3-alpha.2](https://github.com/dendronhq/dendron/compare/v0.11.3-alpha.1...v0.11.3-alpha.2) (2020-09-16)

**Note:** Version bump only for package @dendronhq/seeds-core

## [0.11.3-alpha.1](https://github.com/dendronhq/dendron/compare/v0.11.3-alpha.0...v0.11.3-alpha.1) (2020-09-16)

**Note:** Version bump only for package @dendronhq/seeds-core

## [0.11.3-alpha.0](https://github.com/dendronhq/dendron/compare/v0.11.2...v0.11.3-alpha.0) (2020-09-16)

**Note:** Version bump only for package @dendronhq/seeds-core

# Change Log
