# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [0.60.1-alpha.3](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.60.1-alpha.3) (2021-09-23)


### Bug Fixes

* hashtags not at the start of line don't autocomplete ([#1370](https://github.com/dendronhq/dendron/issues/1370)) ([83f7a56](https://github.com/dendronhq/dendron/commit/83f7a56bb76336c3192c29dc03619e9ea2bcff85)), closes [#1352](https://github.com/dendronhq/dendron/issues/1352)
* no-op completion provider when dendron isn't active ([#1392](https://github.com/dendronhq/dendron/issues/1392)) ([8136b9c](https://github.com/dendronhq/dendron/commit/8136b9c6bad293ac77aae78a9426c3b27c4d38d3))
* pesky error popup when schema lookup is closed ([#1389](https://github.com/dendronhq/dendron/issues/1389)) ([4d2bb40](https://github.com/dendronhq/dendron/commit/4d2bb401b17e926dc2eaa11957536f0c75a1e538))
* selection2link doesn't update note with link ([#1383](https://github.com/dendronhq/dendron/issues/1383)) ([737d584](https://github.com/dendronhq/dendron/commit/737d584c42a8033131437085ff5b2e4db3f18e8a))



# 0.60.0 (2021-09-21)


### Bug Fixes

* **commands:** rename note leaves incorrect metadata if parent is a stub ([#1348](https://github.com/dendronhq/dendron/issues/1348)) ([d432cc9](https://github.com/dendronhq/dendron/commit/d432cc9e20ff8b9f6cefd7cc4c3a42b567ed9bc5))
* **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))
* **workspace:** disable certain decorations for long notes to avoid performance hit ([#1337](https://github.com/dendronhq/dendron/issues/1337)) ([f1c46f9](https://github.com/dendronhq/dendron/commit/f1c46f95c228ada2126ec7212cede3bf5acc773d))
* creating scratch when text is selected within a note SHOULD not match scratches just due to prefix ([#1292](https://github.com/dendronhq/dendron/issues/1292)) ([cea4568](https://github.com/dendronhq/dendron/commit/cea456809b0da327bff5e06c1a796323d3eb257f))
* decorations for erased tags persist ([#1291](https://github.com/dendronhq/dendron/issues/1291)) ([e3284f6](https://github.com/dendronhq/dendron/commit/e3284f6449fe36edb81deb2ae4c97612fdf2b8de))
* direct children query ([#1303](https://github.com/dendronhq/dendron/issues/1303)) ([bcf0dea](https://github.com/dendronhq/dendron/commit/bcf0deae422406564cd9a56c1765f90dd2e66215))
* disallow toggling of vault selection behavior in move note ([#1296](https://github.com/dendronhq/dendron/issues/1296)) ([4dc7ca4](https://github.com/dendronhq/dendron/commit/4dc7ca4547bc0c7bcb8eb3e27f64ad7236ef4fd5))
* do not show multi select button on note rename ([#1293](https://github.com/dendronhq/dendron/issues/1293)) ([bd283c1](https://github.com/dendronhq/dendron/commit/bd283c1427f5b1f611885dd8499b2bd5b5bf98c3))
* fix move note to have exact match ([#1331](https://github.com/dendronhq/dendron/issues/1331)) ([a5f4f9b](https://github.com/dendronhq/dendron/commit/a5f4f9b5220d67621e508a68ad2386cd481db21f))
* fixing cmd tab typo in tutorial.2 ([#1234](https://github.com/dendronhq/dendron/issues/1234)) ([6e0543d](https://github.com/dendronhq/dendron/commit/6e0543d5077d40f2e9fc12325d3e111cad7e9a01))
* highlight same file wikilinks, wildcard references, links with anchors ([#1306](https://github.com/dendronhq/dendron/issues/1306)) ([956aa2a](https://github.com/dendronhq/dendron/commit/956aa2a7079eaa93acd2a66ace3c44f3f874c0f8))
* hover provider shouldn't recommend Ctrl+click for missing notes unless configured ([#1276](https://github.com/dendronhq/dendron/issues/1276)) ([cc037b6](https://github.com/dendronhq/dendron/commit/cc037b6e53c21389be8507e8088dc65bff0d7259))
* Ignore lookupConfirm if dailyVault is set ([#1311](https://github.com/dendronhq/dendron/issues/1311)) ([1c734da](https://github.com/dendronhq/dendron/commit/1c734daa45cc1e655638d754267c6bdf5bdcab90))
* issue with init workspace ([94d05c8](https://github.com/dendronhq/dendron/commit/94d05c8f1b6856c769d0cd2964d1dece9decb37c))
* reload index to be silent by default ([#1269](https://github.com/dendronhq/dendron/issues/1269)) ([2c0bf03](https://github.com/dendronhq/dendron/commit/2c0bf03d997ee3abc1f802f80e4b177feb44ae8b))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))
* stop calendar from auto expanding when the last note is closed ([#1299](https://github.com/dendronhq/dendron/issues/1299)) ([9c8f853](https://github.com/dendronhq/dendron/commit/9c8f8533da5027c122e0d003ce4c61dc866735f5))
* unhandled error in insert note link ([#1192](https://github.com/dendronhq/dendron/issues/1192)) ([a73420c](https://github.com/dendronhq/dendron/commit/a73420cd0f3d9f933256be43b839226b15b1e837))
* update links on frontmatter tags changes ([#1214](https://github.com/dendronhq/dendron/issues/1214)) ([4d344fe](https://github.com/dendronhq/dendron/commit/4d344fe40701a259e3ac4399899dab4099c8614f))
* update vs code compat version + husky hook check ([#1346](https://github.com/dendronhq/dendron/issues/1346)) ([1ae3fc6](https://github.com/dendronhq/dendron/commit/1ae3fc6da41084adc1e19f4c09b3a75d00ca0cb3))


### Features Dendron

* Add smart vault selection to NoteLookupCommand ([#1174](https://github.com/dendronhq/dendron/issues/1174)) ([742cab6](https://github.com/dendronhq/dendron/commit/742cab6c683bb14b6baff6c786957a5cc7228894))
* enable usePrettyRefs for nextJS publishing and preview ([#1239](https://github.com/dendronhq/dendron/issues/1239)) ([8a456a9](https://github.com/dendronhq/dendron/commit/8a456a910c45e927c8413d881324bd28401e2aca))
* github publish to create new issue ([#1206](https://github.com/dendronhq/dendron/issues/1206)) ([67abef0](https://github.com/dendronhq/dendron/commit/67abef02c5615385a8a7f82fe290c8a443605a7f))
* run migration command ([#1177](https://github.com/dendronhq/dendron/issues/1177)) ([98bd000](https://github.com/dendronhq/dendron/commit/98bd000236e8c3a7def6b6895fa8d24315c54cf2))
* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))
* user tag autocomplete & user tags updated on rename ([#1278](https://github.com/dendronhq/dendron/issues/1278)) ([9719f99](https://github.com/dendronhq/dendron/commit/9719f99550a2c51c1a22f6fb21ff750bb4115f89))
* user tags ([#1228](https://github.com/dendronhq/dendron/issues/1228)) ([98c0106](https://github.com/dendronhq/dendron/commit/98c0106367e384c130a927484b9ea294eb6f84fa))



## 0.55.2 (2021-08-21)


### Bug Fixes

* force update picker item on button trigger even when value hasn't changed ([#1176](https://github.com/dendronhq/dendron/issues/1176)) ([46449a4](https://github.com/dendronhq/dendron/commit/46449a44009913af6340b26660fd5b5b2a79d57f))



## 0.55.1 (2021-08-17)


### Bug Fixes

* hiding quickpick doesn't dispose of picker ([781923a](https://github.com/dendronhq/dendron/commit/781923a679426ec4f29bd4600e29437ce1902d6f))
* multiple issues with lookupv3 ([1fdd9eb](https://github.com/dendronhq/dendron/commit/1fdd9eb3242b43539572a1993fefd174640c6d83))
* regression with move note command ([5e357b8](https://github.com/dendronhq/dendron/commit/5e357b8995ff335aa36ad48777a96ee56b196c01))


### Features Dendron

* Insert Note Index command ([#1142](https://github.com/dendronhq/dendron/issues/1142)) ([c140015](https://github.com/dendronhq/dendron/commit/c140015c19a942cf4696d596e818fd89905eea25))
* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* accept splitType argument in lookup v2 ([#1102](https://github.com/dendronhq/dendron/issues/1102)) ([a1120e4](https://github.com/dendronhq/dendron/commit/a1120e449af9776a14d2bcbb47f8d877ebd1227b))
* CopyNoteLink copies footnotes as anchors ([#1117](https://github.com/dendronhq/dendron/issues/1117)) ([2168991](https://github.com/dendronhq/dendron/commit/21689914d0c84735d243b988dcceb276df97380f))
* CopyNoteRef respects noXVaultWikiLink option ([#1085](https://github.com/dendronhq/dendron/issues/1085)) ([b4b3da3](https://github.com/dendronhq/dendron/commit/b4b3da3306e2c5621c3c79a53b9f6e4cc31856c6)), closes [#1072](https://github.com/dendronhq/dendron/issues/1072)
* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* extension readme getting started link ([#1084](https://github.com/dendronhq/dendron/issues/1084)) ([d3f5b7d](https://github.com/dendronhq/dendron/commit/d3f5b7dc49873cbbb9e44ce1ff473cd4d95e1214))
* FM tags with quoted strings & with spaces ([1a16689](https://github.com/dendronhq/dendron/commit/1a1668914f70b48a4e74a218bd43521df226de38))
* highlighting is not displayed ([#1083](https://github.com/dendronhq/dendron/issues/1083)) ([86ead9b](https://github.com/dendronhq/dendron/commit/86ead9b7ec66a51712a265f263a515c624f2861c))
* issue with direct child filter partially omitting values in quickpick ([#1123](https://github.com/dendronhq/dendron/issues/1123)) ([fbabab4](https://github.com/dendronhq/dendron/commit/fbabab4b61c91f3ebbe62def339efb32e1815178))
* lookupv3 selection issue ([#1130](https://github.com/dendronhq/dendron/issues/1130)) ([c807e88](https://github.com/dendronhq/dendron/commit/c807e88a82217e5a04dfddb5a24259a50bea4813))
* properly debounce picker update ([#1111](https://github.com/dendronhq/dendron/issues/1111)) ([ae12e1e](https://github.com/dendronhq/dendron/commit/ae12e1ec39e6d75c9c47e27eff7f96418984da4a))
* skip delayed decoration update if note is closed ([2d91164](https://github.com/dendronhq/dendron/commit/2d9116489b2d1f4d5ccd6d22c022af2da9984817))
* uninstall hook force flush ([#1087](https://github.com/dendronhq/dendron/issues/1087)) ([386aac2](https://github.com/dendronhq/dendron/commit/386aac2b8036cd58c190da99609cef2d3ed2467f))


### Features Dendron

* add journal title override to NoteLookupCommand ([#1140](https://github.com/dendronhq/dendron/issues/1140)) ([173b0c9](https://github.com/dendronhq/dendron/commit/173b0c95d7ca9593e72e2cd1c39e4fdcf31fa64a))
* **calendar:** enable webui by default ([#1127](https://github.com/dendronhq/dendron/issues/1127)) ([3ce8be0](https://github.com/dendronhq/dendron/commit/3ce8be05f50c0fef784eef1b6d02e4816e1bf44a))
* add remaining modifiers to NoteLookup ([#1056](https://github.com/dendronhq/dendron/issues/1056)) ([49c6005](https://github.com/dendronhq/dendron/commit/49c6005d2a2c8fd422eb653977e926084e743d6a)), closes [#1045](https://github.com/dendronhq/dendron/issues/1045) [#1046](https://github.com/dendronhq/dendron/issues/1046)
* add schema suggestion to NoteLookupCommand ([#1113](https://github.com/dendronhq/dendron/issues/1113)) ([7dbd03f](https://github.com/dendronhq/dendron/commit/7dbd03f20586d5174c13a40ed50eecfd8b4c788d))
* add schema templating feature to NoteLookupCommand ([#1118](https://github.com/dendronhq/dendron/issues/1118)) ([8a4cd2b](https://github.com/dendronhq/dendron/commit/8a4cd2b337521abcc25df61e145ef6868c50ea0f))
* Add SchemaLookupCommand ([#1082](https://github.com/dendronhq/dendron/issues/1082)) ([fe11a0e](https://github.com/dendronhq/dendron/commit/fe11a0ea1e0214823dd01842b941456df164bc70))
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* provide YAML validator & suggest YAML extension ([#1116](https://github.com/dendronhq/dendron/issues/1116)) ([b46f091](https://github.com/dendronhq/dendron/commit/b46f0916f9f01fdd7b71b6b5120c38a71d58b113))
* re-engage lapsed users with prompt ([#1086](https://github.com/dendronhq/dendron/issues/1086)) ([f4e6dc5](https://github.com/dendronhq/dendron/commit/f4e6dc563aafdfc0b46966e74d9b38920aee1207))
* rename header updates default link aliases ([1f0e405](https://github.com/dendronhq/dendron/commit/1f0e405d2c67a547fdecc41d76f062251a7cae01))
* resolve vim keybinding conflict on initial install ([#1103](https://github.com/dendronhq/dendron/issues/1103)) ([2278c66](https://github.com/dendronhq/dendron/commit/2278c6616c8297cc414ad02d5323bff5c45072e4))
* seed cmds in plugin ([#1080](https://github.com/dendronhq/dendron/issues/1080)) ([e07a092](https://github.com/dendronhq/dendron/commit/e07a092b1a75548574f2ea45f1b465490b2091f3))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.60.1-alpha.2](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.60.1-alpha.2) (2021-09-22)



# 0.60.0 (2021-09-21)


### Bug Fixes

* **commands:** rename note leaves incorrect metadata if parent is a stub ([#1348](https://github.com/dendronhq/dendron/issues/1348)) ([d432cc9](https://github.com/dendronhq/dendron/commit/d432cc9e20ff8b9f6cefd7cc4c3a42b567ed9bc5))
* **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))
* **workspace:** disable certain decorations for long notes to avoid performance hit ([#1337](https://github.com/dendronhq/dendron/issues/1337)) ([f1c46f9](https://github.com/dendronhq/dendron/commit/f1c46f95c228ada2126ec7212cede3bf5acc773d))
* creating scratch when text is selected within a note SHOULD not match scratches just due to prefix ([#1292](https://github.com/dendronhq/dendron/issues/1292)) ([cea4568](https://github.com/dendronhq/dendron/commit/cea456809b0da327bff5e06c1a796323d3eb257f))
* decorations for erased tags persist ([#1291](https://github.com/dendronhq/dendron/issues/1291)) ([e3284f6](https://github.com/dendronhq/dendron/commit/e3284f6449fe36edb81deb2ae4c97612fdf2b8de))
* direct children query ([#1303](https://github.com/dendronhq/dendron/issues/1303)) ([bcf0dea](https://github.com/dendronhq/dendron/commit/bcf0deae422406564cd9a56c1765f90dd2e66215))
* disallow toggling of vault selection behavior in move note ([#1296](https://github.com/dendronhq/dendron/issues/1296)) ([4dc7ca4](https://github.com/dendronhq/dendron/commit/4dc7ca4547bc0c7bcb8eb3e27f64ad7236ef4fd5))
* do not show multi select button on note rename ([#1293](https://github.com/dendronhq/dendron/issues/1293)) ([bd283c1](https://github.com/dendronhq/dendron/commit/bd283c1427f5b1f611885dd8499b2bd5b5bf98c3))
* fix move note to have exact match ([#1331](https://github.com/dendronhq/dendron/issues/1331)) ([a5f4f9b](https://github.com/dendronhq/dendron/commit/a5f4f9b5220d67621e508a68ad2386cd481db21f))
* fixing cmd tab typo in tutorial.2 ([#1234](https://github.com/dendronhq/dendron/issues/1234)) ([6e0543d](https://github.com/dendronhq/dendron/commit/6e0543d5077d40f2e9fc12325d3e111cad7e9a01))
* highlight same file wikilinks, wildcard references, links with anchors ([#1306](https://github.com/dendronhq/dendron/issues/1306)) ([956aa2a](https://github.com/dendronhq/dendron/commit/956aa2a7079eaa93acd2a66ace3c44f3f874c0f8))
* hover provider shouldn't recommend Ctrl+click for missing notes unless configured ([#1276](https://github.com/dendronhq/dendron/issues/1276)) ([cc037b6](https://github.com/dendronhq/dendron/commit/cc037b6e53c21389be8507e8088dc65bff0d7259))
* Ignore lookupConfirm if dailyVault is set ([#1311](https://github.com/dendronhq/dendron/issues/1311)) ([1c734da](https://github.com/dendronhq/dendron/commit/1c734daa45cc1e655638d754267c6bdf5bdcab90))
* issue with init workspace ([94d05c8](https://github.com/dendronhq/dendron/commit/94d05c8f1b6856c769d0cd2964d1dece9decb37c))
* reload index to be silent by default ([#1269](https://github.com/dendronhq/dendron/issues/1269)) ([2c0bf03](https://github.com/dendronhq/dendron/commit/2c0bf03d997ee3abc1f802f80e4b177feb44ae8b))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))
* stop calendar from auto expanding when the last note is closed ([#1299](https://github.com/dendronhq/dendron/issues/1299)) ([9c8f853](https://github.com/dendronhq/dendron/commit/9c8f8533da5027c122e0d003ce4c61dc866735f5))
* unhandled error in insert note link ([#1192](https://github.com/dendronhq/dendron/issues/1192)) ([a73420c](https://github.com/dendronhq/dendron/commit/a73420cd0f3d9f933256be43b839226b15b1e837))
* update links on frontmatter tags changes ([#1214](https://github.com/dendronhq/dendron/issues/1214)) ([4d344fe](https://github.com/dendronhq/dendron/commit/4d344fe40701a259e3ac4399899dab4099c8614f))
* update vs code compat version + husky hook check ([#1346](https://github.com/dendronhq/dendron/issues/1346)) ([1ae3fc6](https://github.com/dendronhq/dendron/commit/1ae3fc6da41084adc1e19f4c09b3a75d00ca0cb3))


### Features Dendron

* Add smart vault selection to NoteLookupCommand ([#1174](https://github.com/dendronhq/dendron/issues/1174)) ([742cab6](https://github.com/dendronhq/dendron/commit/742cab6c683bb14b6baff6c786957a5cc7228894))
* enable usePrettyRefs for nextJS publishing and preview ([#1239](https://github.com/dendronhq/dendron/issues/1239)) ([8a456a9](https://github.com/dendronhq/dendron/commit/8a456a910c45e927c8413d881324bd28401e2aca))
* github publish to create new issue ([#1206](https://github.com/dendronhq/dendron/issues/1206)) ([67abef0](https://github.com/dendronhq/dendron/commit/67abef02c5615385a8a7f82fe290c8a443605a7f))
* run migration command ([#1177](https://github.com/dendronhq/dendron/issues/1177)) ([98bd000](https://github.com/dendronhq/dendron/commit/98bd000236e8c3a7def6b6895fa8d24315c54cf2))
* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))
* user tag autocomplete & user tags updated on rename ([#1278](https://github.com/dendronhq/dendron/issues/1278)) ([9719f99](https://github.com/dendronhq/dendron/commit/9719f99550a2c51c1a22f6fb21ff750bb4115f89))
* user tags ([#1228](https://github.com/dendronhq/dendron/issues/1228)) ([98c0106](https://github.com/dendronhq/dendron/commit/98c0106367e384c130a927484b9ea294eb6f84fa))



## 0.55.2 (2021-08-21)


### Bug Fixes

* force update picker item on button trigger even when value hasn't changed ([#1176](https://github.com/dendronhq/dendron/issues/1176)) ([46449a4](https://github.com/dendronhq/dendron/commit/46449a44009913af6340b26660fd5b5b2a79d57f))



## 0.55.1 (2021-08-17)


### Bug Fixes

* hiding quickpick doesn't dispose of picker ([781923a](https://github.com/dendronhq/dendron/commit/781923a679426ec4f29bd4600e29437ce1902d6f))
* multiple issues with lookupv3 ([1fdd9eb](https://github.com/dendronhq/dendron/commit/1fdd9eb3242b43539572a1993fefd174640c6d83))
* regression with move note command ([5e357b8](https://github.com/dendronhq/dendron/commit/5e357b8995ff335aa36ad48777a96ee56b196c01))


### Features Dendron

* Insert Note Index command ([#1142](https://github.com/dendronhq/dendron/issues/1142)) ([c140015](https://github.com/dendronhq/dendron/commit/c140015c19a942cf4696d596e818fd89905eea25))
* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* accept splitType argument in lookup v2 ([#1102](https://github.com/dendronhq/dendron/issues/1102)) ([a1120e4](https://github.com/dendronhq/dendron/commit/a1120e449af9776a14d2bcbb47f8d877ebd1227b))
* CopyNoteLink copies footnotes as anchors ([#1117](https://github.com/dendronhq/dendron/issues/1117)) ([2168991](https://github.com/dendronhq/dendron/commit/21689914d0c84735d243b988dcceb276df97380f))
* CopyNoteRef respects noXVaultWikiLink option ([#1085](https://github.com/dendronhq/dendron/issues/1085)) ([b4b3da3](https://github.com/dendronhq/dendron/commit/b4b3da3306e2c5621c3c79a53b9f6e4cc31856c6)), closes [#1072](https://github.com/dendronhq/dendron/issues/1072)
* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* extension readme getting started link ([#1084](https://github.com/dendronhq/dendron/issues/1084)) ([d3f5b7d](https://github.com/dendronhq/dendron/commit/d3f5b7dc49873cbbb9e44ce1ff473cd4d95e1214))
* FM tags with quoted strings & with spaces ([1a16689](https://github.com/dendronhq/dendron/commit/1a1668914f70b48a4e74a218bd43521df226de38))
* highlighting is not displayed ([#1083](https://github.com/dendronhq/dendron/issues/1083)) ([86ead9b](https://github.com/dendronhq/dendron/commit/86ead9b7ec66a51712a265f263a515c624f2861c))
* issue with direct child filter partially omitting values in quickpick ([#1123](https://github.com/dendronhq/dendron/issues/1123)) ([fbabab4](https://github.com/dendronhq/dendron/commit/fbabab4b61c91f3ebbe62def339efb32e1815178))
* lookupv3 selection issue ([#1130](https://github.com/dendronhq/dendron/issues/1130)) ([c807e88](https://github.com/dendronhq/dendron/commit/c807e88a82217e5a04dfddb5a24259a50bea4813))
* properly debounce picker update ([#1111](https://github.com/dendronhq/dendron/issues/1111)) ([ae12e1e](https://github.com/dendronhq/dendron/commit/ae12e1ec39e6d75c9c47e27eff7f96418984da4a))
* skip delayed decoration update if note is closed ([2d91164](https://github.com/dendronhq/dendron/commit/2d9116489b2d1f4d5ccd6d22c022af2da9984817))
* uninstall hook force flush ([#1087](https://github.com/dendronhq/dendron/issues/1087)) ([386aac2](https://github.com/dendronhq/dendron/commit/386aac2b8036cd58c190da99609cef2d3ed2467f))


### Features Dendron

* add journal title override to NoteLookupCommand ([#1140](https://github.com/dendronhq/dendron/issues/1140)) ([173b0c9](https://github.com/dendronhq/dendron/commit/173b0c95d7ca9593e72e2cd1c39e4fdcf31fa64a))
* **calendar:** enable webui by default ([#1127](https://github.com/dendronhq/dendron/issues/1127)) ([3ce8be0](https://github.com/dendronhq/dendron/commit/3ce8be05f50c0fef784eef1b6d02e4816e1bf44a))
* add remaining modifiers to NoteLookup ([#1056](https://github.com/dendronhq/dendron/issues/1056)) ([49c6005](https://github.com/dendronhq/dendron/commit/49c6005d2a2c8fd422eb653977e926084e743d6a)), closes [#1045](https://github.com/dendronhq/dendron/issues/1045) [#1046](https://github.com/dendronhq/dendron/issues/1046)
* add schema suggestion to NoteLookupCommand ([#1113](https://github.com/dendronhq/dendron/issues/1113)) ([7dbd03f](https://github.com/dendronhq/dendron/commit/7dbd03f20586d5174c13a40ed50eecfd8b4c788d))
* add schema templating feature to NoteLookupCommand ([#1118](https://github.com/dendronhq/dendron/issues/1118)) ([8a4cd2b](https://github.com/dendronhq/dendron/commit/8a4cd2b337521abcc25df61e145ef6868c50ea0f))
* Add SchemaLookupCommand ([#1082](https://github.com/dendronhq/dendron/issues/1082)) ([fe11a0e](https://github.com/dendronhq/dendron/commit/fe11a0ea1e0214823dd01842b941456df164bc70))
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* provide YAML validator & suggest YAML extension ([#1116](https://github.com/dendronhq/dendron/issues/1116)) ([b46f091](https://github.com/dendronhq/dendron/commit/b46f0916f9f01fdd7b71b6b5120c38a71d58b113))
* re-engage lapsed users with prompt ([#1086](https://github.com/dendronhq/dendron/issues/1086)) ([f4e6dc5](https://github.com/dendronhq/dendron/commit/f4e6dc563aafdfc0b46966e74d9b38920aee1207))
* rename header updates default link aliases ([1f0e405](https://github.com/dendronhq/dendron/commit/1f0e405d2c67a547fdecc41d76f062251a7cae01))
* resolve vim keybinding conflict on initial install ([#1103](https://github.com/dendronhq/dendron/issues/1103)) ([2278c66](https://github.com/dendronhq/dendron/commit/2278c6616c8297cc414ad02d5323bff5c45072e4))
* seed cmds in plugin ([#1080](https://github.com/dendronhq/dendron/issues/1080)) ([e07a092](https://github.com/dendronhq/dendron/commit/e07a092b1a75548574f2ea45f1b465490b2091f3))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.60.1-alpha.1](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.60.1-alpha.1) (2021-09-21)


### Bug Fixes

* minor sentry cleanup ([#1374](https://github.com/dendronhq/dendron/issues/1374)) ([e9cdd8e](https://github.com/dendronhq/dendron/commit/e9cdd8e538740ca80012f52a96ceb063482d7c66))
* **commands:** rename note leaves incorrect metadata if parent is a stub ([#1348](https://github.com/dendronhq/dendron/issues/1348)) ([d432cc9](https://github.com/dendronhq/dendron/commit/d432cc9e20ff8b9f6cefd7cc4c3a42b567ed9bc5))
* **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))
* **workspace:** disable certain decorations for long notes to avoid performance hit ([#1337](https://github.com/dendronhq/dendron/issues/1337)) ([f1c46f9](https://github.com/dendronhq/dendron/commit/f1c46f95c228ada2126ec7212cede3bf5acc773d))
* creating scratch when text is selected within a note SHOULD not match scratches just due to prefix ([#1292](https://github.com/dendronhq/dendron/issues/1292)) ([cea4568](https://github.com/dendronhq/dendron/commit/cea456809b0da327bff5e06c1a796323d3eb257f))
* decorations for erased tags persist ([#1291](https://github.com/dendronhq/dendron/issues/1291)) ([e3284f6](https://github.com/dendronhq/dendron/commit/e3284f6449fe36edb81deb2ae4c97612fdf2b8de))
* direct children query ([#1303](https://github.com/dendronhq/dendron/issues/1303)) ([bcf0dea](https://github.com/dendronhq/dendron/commit/bcf0deae422406564cd9a56c1765f90dd2e66215))
* disallow toggling of vault selection behavior in move note ([#1296](https://github.com/dendronhq/dendron/issues/1296)) ([4dc7ca4](https://github.com/dendronhq/dendron/commit/4dc7ca4547bc0c7bcb8eb3e27f64ad7236ef4fd5))
* do not show multi select button on note rename ([#1293](https://github.com/dendronhq/dendron/issues/1293)) ([bd283c1](https://github.com/dendronhq/dendron/commit/bd283c1427f5b1f611885dd8499b2bd5b5bf98c3))
* fix move note to have exact match ([#1331](https://github.com/dendronhq/dendron/issues/1331)) ([a5f4f9b](https://github.com/dendronhq/dendron/commit/a5f4f9b5220d67621e508a68ad2386cd481db21f))
* fixing cmd tab typo in tutorial.2 ([#1234](https://github.com/dendronhq/dendron/issues/1234)) ([6e0543d](https://github.com/dendronhq/dendron/commit/6e0543d5077d40f2e9fc12325d3e111cad7e9a01))
* highlight same file wikilinks, wildcard references, links with anchors ([#1306](https://github.com/dendronhq/dendron/issues/1306)) ([956aa2a](https://github.com/dendronhq/dendron/commit/956aa2a7079eaa93acd2a66ace3c44f3f874c0f8))
* hover provider shouldn't recommend Ctrl+click for missing notes unless configured ([#1276](https://github.com/dendronhq/dendron/issues/1276)) ([cc037b6](https://github.com/dendronhq/dendron/commit/cc037b6e53c21389be8507e8088dc65bff0d7259))
* Ignore lookupConfirm if dailyVault is set ([#1311](https://github.com/dendronhq/dendron/issues/1311)) ([1c734da](https://github.com/dendronhq/dendron/commit/1c734daa45cc1e655638d754267c6bdf5bdcab90))
* issue with init workspace ([94d05c8](https://github.com/dendronhq/dendron/commit/94d05c8f1b6856c769d0cd2964d1dece9decb37c))
* reload index to be silent by default ([#1269](https://github.com/dendronhq/dendron/issues/1269)) ([2c0bf03](https://github.com/dendronhq/dendron/commit/2c0bf03d997ee3abc1f802f80e4b177feb44ae8b))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))
* stop calendar from auto expanding when the last note is closed ([#1299](https://github.com/dendronhq/dendron/issues/1299)) ([9c8f853](https://github.com/dendronhq/dendron/commit/9c8f8533da5027c122e0d003ce4c61dc866735f5))
* unhandled error in insert note link ([#1192](https://github.com/dendronhq/dendron/issues/1192)) ([a73420c](https://github.com/dendronhq/dendron/commit/a73420cd0f3d9f933256be43b839226b15b1e837))
* update links on frontmatter tags changes ([#1214](https://github.com/dendronhq/dendron/issues/1214)) ([4d344fe](https://github.com/dendronhq/dendron/commit/4d344fe40701a259e3ac4399899dab4099c8614f))
* update vs code compat version + husky hook check ([#1346](https://github.com/dendronhq/dendron/issues/1346)) ([1ae3fc6](https://github.com/dendronhq/dendron/commit/1ae3fc6da41084adc1e19f4c09b3a75d00ca0cb3))


### Features Dendron

* Add smart vault selection to NoteLookupCommand ([#1174](https://github.com/dendronhq/dendron/issues/1174)) ([742cab6](https://github.com/dendronhq/dendron/commit/742cab6c683bb14b6baff6c786957a5cc7228894))
* enable usePrettyRefs for nextJS publishing and preview ([#1239](https://github.com/dendronhq/dendron/issues/1239)) ([8a456a9](https://github.com/dendronhq/dendron/commit/8a456a910c45e927c8413d881324bd28401e2aca))
* github publish to create new issue ([#1206](https://github.com/dendronhq/dendron/issues/1206)) ([67abef0](https://github.com/dendronhq/dendron/commit/67abef02c5615385a8a7f82fe290c8a443605a7f))
* run migration command ([#1177](https://github.com/dendronhq/dendron/issues/1177)) ([98bd000](https://github.com/dendronhq/dendron/commit/98bd000236e8c3a7def6b6895fa8d24315c54cf2))
* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))
* user tag autocomplete & user tags updated on rename ([#1278](https://github.com/dendronhq/dendron/issues/1278)) ([9719f99](https://github.com/dendronhq/dendron/commit/9719f99550a2c51c1a22f6fb21ff750bb4115f89))
* user tags ([#1228](https://github.com/dendronhq/dendron/issues/1228)) ([98c0106](https://github.com/dendronhq/dendron/commit/98c0106367e384c130a927484b9ea294eb6f84fa))



## 0.55.2 (2021-08-21)


### Bug Fixes

* force update picker item on button trigger even when value hasn't changed ([#1176](https://github.com/dendronhq/dendron/issues/1176)) ([46449a4](https://github.com/dendronhq/dendron/commit/46449a44009913af6340b26660fd5b5b2a79d57f))



## 0.55.1 (2021-08-17)


### Bug Fixes

* hiding quickpick doesn't dispose of picker ([781923a](https://github.com/dendronhq/dendron/commit/781923a679426ec4f29bd4600e29437ce1902d6f))
* multiple issues with lookupv3 ([1fdd9eb](https://github.com/dendronhq/dendron/commit/1fdd9eb3242b43539572a1993fefd174640c6d83))
* regression with move note command ([5e357b8](https://github.com/dendronhq/dendron/commit/5e357b8995ff335aa36ad48777a96ee56b196c01))


### Features Dendron

* Insert Note Index command ([#1142](https://github.com/dendronhq/dendron/issues/1142)) ([c140015](https://github.com/dendronhq/dendron/commit/c140015c19a942cf4696d596e818fd89905eea25))
* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* accept splitType argument in lookup v2 ([#1102](https://github.com/dendronhq/dendron/issues/1102)) ([a1120e4](https://github.com/dendronhq/dendron/commit/a1120e449af9776a14d2bcbb47f8d877ebd1227b))
* CopyNoteLink copies footnotes as anchors ([#1117](https://github.com/dendronhq/dendron/issues/1117)) ([2168991](https://github.com/dendronhq/dendron/commit/21689914d0c84735d243b988dcceb276df97380f))
* CopyNoteRef respects noXVaultWikiLink option ([#1085](https://github.com/dendronhq/dendron/issues/1085)) ([b4b3da3](https://github.com/dendronhq/dendron/commit/b4b3da3306e2c5621c3c79a53b9f6e4cc31856c6)), closes [#1072](https://github.com/dendronhq/dendron/issues/1072)
* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* extension readme getting started link ([#1084](https://github.com/dendronhq/dendron/issues/1084)) ([d3f5b7d](https://github.com/dendronhq/dendron/commit/d3f5b7dc49873cbbb9e44ce1ff473cd4d95e1214))
* FM tags with quoted strings & with spaces ([1a16689](https://github.com/dendronhq/dendron/commit/1a1668914f70b48a4e74a218bd43521df226de38))
* highlighting is not displayed ([#1083](https://github.com/dendronhq/dendron/issues/1083)) ([86ead9b](https://github.com/dendronhq/dendron/commit/86ead9b7ec66a51712a265f263a515c624f2861c))
* issue with direct child filter partially omitting values in quickpick ([#1123](https://github.com/dendronhq/dendron/issues/1123)) ([fbabab4](https://github.com/dendronhq/dendron/commit/fbabab4b61c91f3ebbe62def339efb32e1815178))
* lookupv3 selection issue ([#1130](https://github.com/dendronhq/dendron/issues/1130)) ([c807e88](https://github.com/dendronhq/dendron/commit/c807e88a82217e5a04dfddb5a24259a50bea4813))
* properly debounce picker update ([#1111](https://github.com/dendronhq/dendron/issues/1111)) ([ae12e1e](https://github.com/dendronhq/dendron/commit/ae12e1ec39e6d75c9c47e27eff7f96418984da4a))
* skip delayed decoration update if note is closed ([2d91164](https://github.com/dendronhq/dendron/commit/2d9116489b2d1f4d5ccd6d22c022af2da9984817))
* uninstall hook force flush ([#1087](https://github.com/dendronhq/dendron/issues/1087)) ([386aac2](https://github.com/dendronhq/dendron/commit/386aac2b8036cd58c190da99609cef2d3ed2467f))


### Features Dendron

* add journal title override to NoteLookupCommand ([#1140](https://github.com/dendronhq/dendron/issues/1140)) ([173b0c9](https://github.com/dendronhq/dendron/commit/173b0c95d7ca9593e72e2cd1c39e4fdcf31fa64a))
* **calendar:** enable webui by default ([#1127](https://github.com/dendronhq/dendron/issues/1127)) ([3ce8be0](https://github.com/dendronhq/dendron/commit/3ce8be05f50c0fef784eef1b6d02e4816e1bf44a))
* add remaining modifiers to NoteLookup ([#1056](https://github.com/dendronhq/dendron/issues/1056)) ([49c6005](https://github.com/dendronhq/dendron/commit/49c6005d2a2c8fd422eb653977e926084e743d6a)), closes [#1045](https://github.com/dendronhq/dendron/issues/1045) [#1046](https://github.com/dendronhq/dendron/issues/1046)
* add schema suggestion to NoteLookupCommand ([#1113](https://github.com/dendronhq/dendron/issues/1113)) ([7dbd03f](https://github.com/dendronhq/dendron/commit/7dbd03f20586d5174c13a40ed50eecfd8b4c788d))
* add schema templating feature to NoteLookupCommand ([#1118](https://github.com/dendronhq/dendron/issues/1118)) ([8a4cd2b](https://github.com/dendronhq/dendron/commit/8a4cd2b337521abcc25df61e145ef6868c50ea0f))
* Add SchemaLookupCommand ([#1082](https://github.com/dendronhq/dendron/issues/1082)) ([fe11a0e](https://github.com/dendronhq/dendron/commit/fe11a0ea1e0214823dd01842b941456df164bc70))
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* provide YAML validator & suggest YAML extension ([#1116](https://github.com/dendronhq/dendron/issues/1116)) ([b46f091](https://github.com/dendronhq/dendron/commit/b46f0916f9f01fdd7b71b6b5120c38a71d58b113))
* re-engage lapsed users with prompt ([#1086](https://github.com/dendronhq/dendron/issues/1086)) ([f4e6dc5](https://github.com/dendronhq/dendron/commit/f4e6dc563aafdfc0b46966e74d9b38920aee1207))
* rename header updates default link aliases ([1f0e405](https://github.com/dendronhq/dendron/commit/1f0e405d2c67a547fdecc41d76f062251a7cae01))
* resolve vim keybinding conflict on initial install ([#1103](https://github.com/dendronhq/dendron/issues/1103)) ([2278c66](https://github.com/dendronhq/dendron/commit/2278c6616c8297cc414ad02d5323bff5c45072e4))
* seed cmds in plugin ([#1080](https://github.com/dendronhq/dendron/issues/1080)) ([e07a092](https://github.com/dendronhq/dendron/commit/e07a092b1a75548574f2ea45f1b465490b2091f3))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.60.1-alpha.0](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.60.1-alpha.0) (2021-09-20)


### Bug Fixes

* **commands:** rename note leaves incorrect metadata if parent is a stub ([#1348](https://github.com/dendronhq/dendron/issues/1348)) ([d432cc9](https://github.com/dendronhq/dendron/commit/d432cc9e20ff8b9f6cefd7cc4c3a42b567ed9bc5))
* **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))
* **workspace:** disable certain decorations for long notes to avoid performance hit ([#1337](https://github.com/dendronhq/dendron/issues/1337)) ([f1c46f9](https://github.com/dendronhq/dendron/commit/f1c46f95c228ada2126ec7212cede3bf5acc773d))
* creating scratch when text is selected within a note SHOULD not match scratches just due to prefix ([#1292](https://github.com/dendronhq/dendron/issues/1292)) ([cea4568](https://github.com/dendronhq/dendron/commit/cea456809b0da327bff5e06c1a796323d3eb257f))
* decorations for erased tags persist ([#1291](https://github.com/dendronhq/dendron/issues/1291)) ([e3284f6](https://github.com/dendronhq/dendron/commit/e3284f6449fe36edb81deb2ae4c97612fdf2b8de))
* direct children query ([#1303](https://github.com/dendronhq/dendron/issues/1303)) ([bcf0dea](https://github.com/dendronhq/dendron/commit/bcf0deae422406564cd9a56c1765f90dd2e66215))
* disallow toggling of vault selection behavior in move note ([#1296](https://github.com/dendronhq/dendron/issues/1296)) ([4dc7ca4](https://github.com/dendronhq/dendron/commit/4dc7ca4547bc0c7bcb8eb3e27f64ad7236ef4fd5))
* do not show multi select button on note rename ([#1293](https://github.com/dendronhq/dendron/issues/1293)) ([bd283c1](https://github.com/dendronhq/dendron/commit/bd283c1427f5b1f611885dd8499b2bd5b5bf98c3))
* fix move note to have exact match ([#1331](https://github.com/dendronhq/dendron/issues/1331)) ([a5f4f9b](https://github.com/dendronhq/dendron/commit/a5f4f9b5220d67621e508a68ad2386cd481db21f))
* fixing cmd tab typo in tutorial.2 ([#1234](https://github.com/dendronhq/dendron/issues/1234)) ([6e0543d](https://github.com/dendronhq/dendron/commit/6e0543d5077d40f2e9fc12325d3e111cad7e9a01))
* highlight same file wikilinks, wildcard references, links with anchors ([#1306](https://github.com/dendronhq/dendron/issues/1306)) ([956aa2a](https://github.com/dendronhq/dendron/commit/956aa2a7079eaa93acd2a66ace3c44f3f874c0f8))
* hover provider shouldn't recommend Ctrl+click for missing notes unless configured ([#1276](https://github.com/dendronhq/dendron/issues/1276)) ([cc037b6](https://github.com/dendronhq/dendron/commit/cc037b6e53c21389be8507e8088dc65bff0d7259))
* Ignore lookupConfirm if dailyVault is set ([#1311](https://github.com/dendronhq/dendron/issues/1311)) ([1c734da](https://github.com/dendronhq/dendron/commit/1c734daa45cc1e655638d754267c6bdf5bdcab90))
* issue with init workspace ([94d05c8](https://github.com/dendronhq/dendron/commit/94d05c8f1b6856c769d0cd2964d1dece9decb37c))
* reload index to be silent by default ([#1269](https://github.com/dendronhq/dendron/issues/1269)) ([2c0bf03](https://github.com/dendronhq/dendron/commit/2c0bf03d997ee3abc1f802f80e4b177feb44ae8b))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))
* stop calendar from auto expanding when the last note is closed ([#1299](https://github.com/dendronhq/dendron/issues/1299)) ([9c8f853](https://github.com/dendronhq/dendron/commit/9c8f8533da5027c122e0d003ce4c61dc866735f5))
* unhandled error in insert note link ([#1192](https://github.com/dendronhq/dendron/issues/1192)) ([a73420c](https://github.com/dendronhq/dendron/commit/a73420cd0f3d9f933256be43b839226b15b1e837))
* update links on frontmatter tags changes ([#1214](https://github.com/dendronhq/dendron/issues/1214)) ([4d344fe](https://github.com/dendronhq/dendron/commit/4d344fe40701a259e3ac4399899dab4099c8614f))
* update vs code compat version + husky hook check ([#1346](https://github.com/dendronhq/dendron/issues/1346)) ([1ae3fc6](https://github.com/dendronhq/dendron/commit/1ae3fc6da41084adc1e19f4c09b3a75d00ca0cb3))


### Features Dendron

* Add smart vault selection to NoteLookupCommand ([#1174](https://github.com/dendronhq/dendron/issues/1174)) ([742cab6](https://github.com/dendronhq/dendron/commit/742cab6c683bb14b6baff6c786957a5cc7228894))
* enable usePrettyRefs for nextJS publishing and preview ([#1239](https://github.com/dendronhq/dendron/issues/1239)) ([8a456a9](https://github.com/dendronhq/dendron/commit/8a456a910c45e927c8413d881324bd28401e2aca))
* github publish to create new issue ([#1206](https://github.com/dendronhq/dendron/issues/1206)) ([67abef0](https://github.com/dendronhq/dendron/commit/67abef02c5615385a8a7f82fe290c8a443605a7f))
* run migration command ([#1177](https://github.com/dendronhq/dendron/issues/1177)) ([98bd000](https://github.com/dendronhq/dendron/commit/98bd000236e8c3a7def6b6895fa8d24315c54cf2))
* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))
* user tag autocomplete & user tags updated on rename ([#1278](https://github.com/dendronhq/dendron/issues/1278)) ([9719f99](https://github.com/dendronhq/dendron/commit/9719f99550a2c51c1a22f6fb21ff750bb4115f89))
* user tags ([#1228](https://github.com/dendronhq/dendron/issues/1228)) ([98c0106](https://github.com/dendronhq/dendron/commit/98c0106367e384c130a927484b9ea294eb6f84fa))



## 0.55.2 (2021-08-21)


### Bug Fixes

* force update picker item on button trigger even when value hasn't changed ([#1176](https://github.com/dendronhq/dendron/issues/1176)) ([46449a4](https://github.com/dendronhq/dendron/commit/46449a44009913af6340b26660fd5b5b2a79d57f))



## 0.55.1 (2021-08-17)


### Bug Fixes

* hiding quickpick doesn't dispose of picker ([781923a](https://github.com/dendronhq/dendron/commit/781923a679426ec4f29bd4600e29437ce1902d6f))
* multiple issues with lookupv3 ([1fdd9eb](https://github.com/dendronhq/dendron/commit/1fdd9eb3242b43539572a1993fefd174640c6d83))
* regression with move note command ([5e357b8](https://github.com/dendronhq/dendron/commit/5e357b8995ff335aa36ad48777a96ee56b196c01))


### Features Dendron

* Insert Note Index command ([#1142](https://github.com/dendronhq/dendron/issues/1142)) ([c140015](https://github.com/dendronhq/dendron/commit/c140015c19a942cf4696d596e818fd89905eea25))
* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* accept splitType argument in lookup v2 ([#1102](https://github.com/dendronhq/dendron/issues/1102)) ([a1120e4](https://github.com/dendronhq/dendron/commit/a1120e449af9776a14d2bcbb47f8d877ebd1227b))
* CopyNoteLink copies footnotes as anchors ([#1117](https://github.com/dendronhq/dendron/issues/1117)) ([2168991](https://github.com/dendronhq/dendron/commit/21689914d0c84735d243b988dcceb276df97380f))
* CopyNoteRef respects noXVaultWikiLink option ([#1085](https://github.com/dendronhq/dendron/issues/1085)) ([b4b3da3](https://github.com/dendronhq/dendron/commit/b4b3da3306e2c5621c3c79a53b9f6e4cc31856c6)), closes [#1072](https://github.com/dendronhq/dendron/issues/1072)
* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* extension readme getting started link ([#1084](https://github.com/dendronhq/dendron/issues/1084)) ([d3f5b7d](https://github.com/dendronhq/dendron/commit/d3f5b7dc49873cbbb9e44ce1ff473cd4d95e1214))
* FM tags with quoted strings & with spaces ([1a16689](https://github.com/dendronhq/dendron/commit/1a1668914f70b48a4e74a218bd43521df226de38))
* highlighting is not displayed ([#1083](https://github.com/dendronhq/dendron/issues/1083)) ([86ead9b](https://github.com/dendronhq/dendron/commit/86ead9b7ec66a51712a265f263a515c624f2861c))
* issue with direct child filter partially omitting values in quickpick ([#1123](https://github.com/dendronhq/dendron/issues/1123)) ([fbabab4](https://github.com/dendronhq/dendron/commit/fbabab4b61c91f3ebbe62def339efb32e1815178))
* lookupv3 selection issue ([#1130](https://github.com/dendronhq/dendron/issues/1130)) ([c807e88](https://github.com/dendronhq/dendron/commit/c807e88a82217e5a04dfddb5a24259a50bea4813))
* properly debounce picker update ([#1111](https://github.com/dendronhq/dendron/issues/1111)) ([ae12e1e](https://github.com/dendronhq/dendron/commit/ae12e1ec39e6d75c9c47e27eff7f96418984da4a))
* skip delayed decoration update if note is closed ([2d91164](https://github.com/dendronhq/dendron/commit/2d9116489b2d1f4d5ccd6d22c022af2da9984817))
* uninstall hook force flush ([#1087](https://github.com/dendronhq/dendron/issues/1087)) ([386aac2](https://github.com/dendronhq/dendron/commit/386aac2b8036cd58c190da99609cef2d3ed2467f))


### Features Dendron

* add journal title override to NoteLookupCommand ([#1140](https://github.com/dendronhq/dendron/issues/1140)) ([173b0c9](https://github.com/dendronhq/dendron/commit/173b0c95d7ca9593e72e2cd1c39e4fdcf31fa64a))
* **calendar:** enable webui by default ([#1127](https://github.com/dendronhq/dendron/issues/1127)) ([3ce8be0](https://github.com/dendronhq/dendron/commit/3ce8be05f50c0fef784eef1b6d02e4816e1bf44a))
* add remaining modifiers to NoteLookup ([#1056](https://github.com/dendronhq/dendron/issues/1056)) ([49c6005](https://github.com/dendronhq/dendron/commit/49c6005d2a2c8fd422eb653977e926084e743d6a)), closes [#1045](https://github.com/dendronhq/dendron/issues/1045) [#1046](https://github.com/dendronhq/dendron/issues/1046)
* add schema suggestion to NoteLookupCommand ([#1113](https://github.com/dendronhq/dendron/issues/1113)) ([7dbd03f](https://github.com/dendronhq/dendron/commit/7dbd03f20586d5174c13a40ed50eecfd8b4c788d))
* add schema templating feature to NoteLookupCommand ([#1118](https://github.com/dendronhq/dendron/issues/1118)) ([8a4cd2b](https://github.com/dendronhq/dendron/commit/8a4cd2b337521abcc25df61e145ef6868c50ea0f))
* Add SchemaLookupCommand ([#1082](https://github.com/dendronhq/dendron/issues/1082)) ([fe11a0e](https://github.com/dendronhq/dendron/commit/fe11a0ea1e0214823dd01842b941456df164bc70))
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* provide YAML validator & suggest YAML extension ([#1116](https://github.com/dendronhq/dendron/issues/1116)) ([b46f091](https://github.com/dendronhq/dendron/commit/b46f0916f9f01fdd7b71b6b5120c38a71d58b113))
* re-engage lapsed users with prompt ([#1086](https://github.com/dendronhq/dendron/issues/1086)) ([f4e6dc5](https://github.com/dendronhq/dendron/commit/f4e6dc563aafdfc0b46966e74d9b38920aee1207))
* rename header updates default link aliases ([1f0e405](https://github.com/dendronhq/dendron/commit/1f0e405d2c67a547fdecc41d76f062251a7cae01))
* resolve vim keybinding conflict on initial install ([#1103](https://github.com/dendronhq/dendron/issues/1103)) ([2278c66](https://github.com/dendronhq/dendron/commit/2278c6616c8297cc414ad02d5323bff5c45072e4))
* seed cmds in plugin ([#1080](https://github.com/dendronhq/dendron/issues/1080)) ([e07a092](https://github.com/dendronhq/dendron/commit/e07a092b1a75548574f2ea45f1b465490b2091f3))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





# [0.60.0](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.60.0) (2021-09-20)


### Bug Fixes

* **commands:** rename note leaves incorrect metadata if parent is a stub ([#1348](https://github.com/dendronhq/dendron/issues/1348)) ([d432cc9](https://github.com/dendronhq/dendron/commit/d432cc9e20ff8b9f6cefd7cc4c3a42b567ed9bc5))
* **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))
* **workspace:** disable certain decorations for long notes to avoid performance hit ([#1337](https://github.com/dendronhq/dendron/issues/1337)) ([f1c46f9](https://github.com/dendronhq/dendron/commit/f1c46f95c228ada2126ec7212cede3bf5acc773d))
* creating scratch when text is selected within a note SHOULD not match scratches just due to prefix ([#1292](https://github.com/dendronhq/dendron/issues/1292)) ([cea4568](https://github.com/dendronhq/dendron/commit/cea456809b0da327bff5e06c1a796323d3eb257f))
* decorations for erased tags persist ([#1291](https://github.com/dendronhq/dendron/issues/1291)) ([e3284f6](https://github.com/dendronhq/dendron/commit/e3284f6449fe36edb81deb2ae4c97612fdf2b8de))
* direct children query ([#1303](https://github.com/dendronhq/dendron/issues/1303)) ([bcf0dea](https://github.com/dendronhq/dendron/commit/bcf0deae422406564cd9a56c1765f90dd2e66215))
* disallow toggling of vault selection behavior in move note ([#1296](https://github.com/dendronhq/dendron/issues/1296)) ([4dc7ca4](https://github.com/dendronhq/dendron/commit/4dc7ca4547bc0c7bcb8eb3e27f64ad7236ef4fd5))
* do not show multi select button on note rename ([#1293](https://github.com/dendronhq/dendron/issues/1293)) ([bd283c1](https://github.com/dendronhq/dendron/commit/bd283c1427f5b1f611885dd8499b2bd5b5bf98c3))
* fix move note to have exact match ([#1331](https://github.com/dendronhq/dendron/issues/1331)) ([a5f4f9b](https://github.com/dendronhq/dendron/commit/a5f4f9b5220d67621e508a68ad2386cd481db21f))
* fixing cmd tab typo in tutorial.2 ([#1234](https://github.com/dendronhq/dendron/issues/1234)) ([6e0543d](https://github.com/dendronhq/dendron/commit/6e0543d5077d40f2e9fc12325d3e111cad7e9a01))
* highlight same file wikilinks, wildcard references, links with anchors ([#1306](https://github.com/dendronhq/dendron/issues/1306)) ([956aa2a](https://github.com/dendronhq/dendron/commit/956aa2a7079eaa93acd2a66ace3c44f3f874c0f8))
* hover provider shouldn't recommend Ctrl+click for missing notes unless configured ([#1276](https://github.com/dendronhq/dendron/issues/1276)) ([cc037b6](https://github.com/dendronhq/dendron/commit/cc037b6e53c21389be8507e8088dc65bff0d7259))
* Ignore lookupConfirm if dailyVault is set ([#1311](https://github.com/dendronhq/dendron/issues/1311)) ([1c734da](https://github.com/dendronhq/dendron/commit/1c734daa45cc1e655638d754267c6bdf5bdcab90))
* issue with init workspace ([94d05c8](https://github.com/dendronhq/dendron/commit/94d05c8f1b6856c769d0cd2964d1dece9decb37c))
* reload index to be silent by default ([#1269](https://github.com/dendronhq/dendron/issues/1269)) ([2c0bf03](https://github.com/dendronhq/dendron/commit/2c0bf03d997ee3abc1f802f80e4b177feb44ae8b))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))
* stop calendar from auto expanding when the last note is closed ([#1299](https://github.com/dendronhq/dendron/issues/1299)) ([9c8f853](https://github.com/dendronhq/dendron/commit/9c8f8533da5027c122e0d003ce4c61dc866735f5))
* unhandled error in insert note link ([#1192](https://github.com/dendronhq/dendron/issues/1192)) ([a73420c](https://github.com/dendronhq/dendron/commit/a73420cd0f3d9f933256be43b839226b15b1e837))
* update links on frontmatter tags changes ([#1214](https://github.com/dendronhq/dendron/issues/1214)) ([4d344fe](https://github.com/dendronhq/dendron/commit/4d344fe40701a259e3ac4399899dab4099c8614f))
* update vs code compat version + husky hook check ([#1346](https://github.com/dendronhq/dendron/issues/1346)) ([1ae3fc6](https://github.com/dendronhq/dendron/commit/1ae3fc6da41084adc1e19f4c09b3a75d00ca0cb3))


### Features Dendron

* Add smart vault selection to NoteLookupCommand ([#1174](https://github.com/dendronhq/dendron/issues/1174)) ([742cab6](https://github.com/dendronhq/dendron/commit/742cab6c683bb14b6baff6c786957a5cc7228894))
* enable usePrettyRefs for nextJS publishing and preview ([#1239](https://github.com/dendronhq/dendron/issues/1239)) ([8a456a9](https://github.com/dendronhq/dendron/commit/8a456a910c45e927c8413d881324bd28401e2aca))
* github publish to create new issue ([#1206](https://github.com/dendronhq/dendron/issues/1206)) ([67abef0](https://github.com/dendronhq/dendron/commit/67abef02c5615385a8a7f82fe290c8a443605a7f))
* run migration command ([#1177](https://github.com/dendronhq/dendron/issues/1177)) ([98bd000](https://github.com/dendronhq/dendron/commit/98bd000236e8c3a7def6b6895fa8d24315c54cf2))
* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))
* user tag autocomplete & user tags updated on rename ([#1278](https://github.com/dendronhq/dendron/issues/1278)) ([9719f99](https://github.com/dendronhq/dendron/commit/9719f99550a2c51c1a22f6fb21ff750bb4115f89))
* user tags ([#1228](https://github.com/dendronhq/dendron/issues/1228)) ([98c0106](https://github.com/dendronhq/dendron/commit/98c0106367e384c130a927484b9ea294eb6f84fa))



## 0.55.2 (2021-08-21)


### Bug Fixes

* force update picker item on button trigger even when value hasn't changed ([#1176](https://github.com/dendronhq/dendron/issues/1176)) ([46449a4](https://github.com/dendronhq/dendron/commit/46449a44009913af6340b26660fd5b5b2a79d57f))



## 0.55.1 (2021-08-17)


### Bug Fixes

* hiding quickpick doesn't dispose of picker ([781923a](https://github.com/dendronhq/dendron/commit/781923a679426ec4f29bd4600e29437ce1902d6f))
* multiple issues with lookupv3 ([1fdd9eb](https://github.com/dendronhq/dendron/commit/1fdd9eb3242b43539572a1993fefd174640c6d83))
* regression with move note command ([5e357b8](https://github.com/dendronhq/dendron/commit/5e357b8995ff335aa36ad48777a96ee56b196c01))


### Features Dendron

* Insert Note Index command ([#1142](https://github.com/dendronhq/dendron/issues/1142)) ([c140015](https://github.com/dendronhq/dendron/commit/c140015c19a942cf4696d596e818fd89905eea25))
* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* accept splitType argument in lookup v2 ([#1102](https://github.com/dendronhq/dendron/issues/1102)) ([a1120e4](https://github.com/dendronhq/dendron/commit/a1120e449af9776a14d2bcbb47f8d877ebd1227b))
* CopyNoteLink copies footnotes as anchors ([#1117](https://github.com/dendronhq/dendron/issues/1117)) ([2168991](https://github.com/dendronhq/dendron/commit/21689914d0c84735d243b988dcceb276df97380f))
* CopyNoteRef respects noXVaultWikiLink option ([#1085](https://github.com/dendronhq/dendron/issues/1085)) ([b4b3da3](https://github.com/dendronhq/dendron/commit/b4b3da3306e2c5621c3c79a53b9f6e4cc31856c6)), closes [#1072](https://github.com/dendronhq/dendron/issues/1072)
* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* extension readme getting started link ([#1084](https://github.com/dendronhq/dendron/issues/1084)) ([d3f5b7d](https://github.com/dendronhq/dendron/commit/d3f5b7dc49873cbbb9e44ce1ff473cd4d95e1214))
* FM tags with quoted strings & with spaces ([1a16689](https://github.com/dendronhq/dendron/commit/1a1668914f70b48a4e74a218bd43521df226de38))
* highlighting is not displayed ([#1083](https://github.com/dendronhq/dendron/issues/1083)) ([86ead9b](https://github.com/dendronhq/dendron/commit/86ead9b7ec66a51712a265f263a515c624f2861c))
* issue with direct child filter partially omitting values in quickpick ([#1123](https://github.com/dendronhq/dendron/issues/1123)) ([fbabab4](https://github.com/dendronhq/dendron/commit/fbabab4b61c91f3ebbe62def339efb32e1815178))
* lookupv3 selection issue ([#1130](https://github.com/dendronhq/dendron/issues/1130)) ([c807e88](https://github.com/dendronhq/dendron/commit/c807e88a82217e5a04dfddb5a24259a50bea4813))
* properly debounce picker update ([#1111](https://github.com/dendronhq/dendron/issues/1111)) ([ae12e1e](https://github.com/dendronhq/dendron/commit/ae12e1ec39e6d75c9c47e27eff7f96418984da4a))
* skip delayed decoration update if note is closed ([2d91164](https://github.com/dendronhq/dendron/commit/2d9116489b2d1f4d5ccd6d22c022af2da9984817))
* uninstall hook force flush ([#1087](https://github.com/dendronhq/dendron/issues/1087)) ([386aac2](https://github.com/dendronhq/dendron/commit/386aac2b8036cd58c190da99609cef2d3ed2467f))


### Features Dendron

* add journal title override to NoteLookupCommand ([#1140](https://github.com/dendronhq/dendron/issues/1140)) ([173b0c9](https://github.com/dendronhq/dendron/commit/173b0c95d7ca9593e72e2cd1c39e4fdcf31fa64a))
* **calendar:** enable webui by default ([#1127](https://github.com/dendronhq/dendron/issues/1127)) ([3ce8be0](https://github.com/dendronhq/dendron/commit/3ce8be05f50c0fef784eef1b6d02e4816e1bf44a))
* add remaining modifiers to NoteLookup ([#1056](https://github.com/dendronhq/dendron/issues/1056)) ([49c6005](https://github.com/dendronhq/dendron/commit/49c6005d2a2c8fd422eb653977e926084e743d6a)), closes [#1045](https://github.com/dendronhq/dendron/issues/1045) [#1046](https://github.com/dendronhq/dendron/issues/1046)
* add schema suggestion to NoteLookupCommand ([#1113](https://github.com/dendronhq/dendron/issues/1113)) ([7dbd03f](https://github.com/dendronhq/dendron/commit/7dbd03f20586d5174c13a40ed50eecfd8b4c788d))
* add schema templating feature to NoteLookupCommand ([#1118](https://github.com/dendronhq/dendron/issues/1118)) ([8a4cd2b](https://github.com/dendronhq/dendron/commit/8a4cd2b337521abcc25df61e145ef6868c50ea0f))
* Add SchemaLookupCommand ([#1082](https://github.com/dendronhq/dendron/issues/1082)) ([fe11a0e](https://github.com/dendronhq/dendron/commit/fe11a0ea1e0214823dd01842b941456df164bc70))
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* provide YAML validator & suggest YAML extension ([#1116](https://github.com/dendronhq/dendron/issues/1116)) ([b46f091](https://github.com/dendronhq/dendron/commit/b46f0916f9f01fdd7b71b6b5120c38a71d58b113))
* re-engage lapsed users with prompt ([#1086](https://github.com/dendronhq/dendron/issues/1086)) ([f4e6dc5](https://github.com/dendronhq/dendron/commit/f4e6dc563aafdfc0b46966e74d9b38920aee1207))
* rename header updates default link aliases ([1f0e405](https://github.com/dendronhq/dendron/commit/1f0e405d2c67a547fdecc41d76f062251a7cae01))
* resolve vim keybinding conflict on initial install ([#1103](https://github.com/dendronhq/dendron/issues/1103)) ([2278c66](https://github.com/dendronhq/dendron/commit/2278c6616c8297cc414ad02d5323bff5c45072e4))
* seed cmds in plugin ([#1080](https://github.com/dendronhq/dendron/issues/1080)) ([e07a092](https://github.com/dendronhq/dendron/commit/e07a092b1a75548574f2ea45f1b465490b2091f3))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.59.3-alpha.1](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.59.3-alpha.1) (2021-09-20)


### Bug Fixes

* **commands:** rename note leaves incorrect metadata if parent is a stub ([#1348](https://github.com/dendronhq/dendron/issues/1348)) ([d432cc9](https://github.com/dendronhq/dendron/commit/d432cc9e20ff8b9f6cefd7cc4c3a42b567ed9bc5))
* **workspace:** disable certain decorations for long notes to avoid performance hit ([#1337](https://github.com/dendronhq/dendron/issues/1337)) ([f1c46f9](https://github.com/dendronhq/dendron/commit/f1c46f95c228ada2126ec7212cede3bf5acc773d))
* creating scratch when text is selected within a note SHOULD not match scratches just due to prefix ([#1292](https://github.com/dendronhq/dendron/issues/1292)) ([cea4568](https://github.com/dendronhq/dendron/commit/cea456809b0da327bff5e06c1a796323d3eb257f))
* decorations for erased tags persist ([#1291](https://github.com/dendronhq/dendron/issues/1291)) ([e3284f6](https://github.com/dendronhq/dendron/commit/e3284f6449fe36edb81deb2ae4c97612fdf2b8de))
* direct children query ([#1303](https://github.com/dendronhq/dendron/issues/1303)) ([bcf0dea](https://github.com/dendronhq/dendron/commit/bcf0deae422406564cd9a56c1765f90dd2e66215))
* disallow toggling of vault selection behavior in move note ([#1296](https://github.com/dendronhq/dendron/issues/1296)) ([4dc7ca4](https://github.com/dendronhq/dendron/commit/4dc7ca4547bc0c7bcb8eb3e27f64ad7236ef4fd5))
* do not show multi select button on note rename ([#1293](https://github.com/dendronhq/dendron/issues/1293)) ([bd283c1](https://github.com/dendronhq/dendron/commit/bd283c1427f5b1f611885dd8499b2bd5b5bf98c3))
* fix move note to have exact match ([#1331](https://github.com/dendronhq/dendron/issues/1331)) ([a5f4f9b](https://github.com/dendronhq/dendron/commit/a5f4f9b5220d67621e508a68ad2386cd481db21f))
* fixing cmd tab typo in tutorial.2 ([#1234](https://github.com/dendronhq/dendron/issues/1234)) ([6e0543d](https://github.com/dendronhq/dendron/commit/6e0543d5077d40f2e9fc12325d3e111cad7e9a01))
* highlight same file wikilinks, wildcard references, links with anchors ([#1306](https://github.com/dendronhq/dendron/issues/1306)) ([956aa2a](https://github.com/dendronhq/dendron/commit/956aa2a7079eaa93acd2a66ace3c44f3f874c0f8))
* hover provider shouldn't recommend Ctrl+click for missing notes unless configured ([#1276](https://github.com/dendronhq/dendron/issues/1276)) ([cc037b6](https://github.com/dendronhq/dendron/commit/cc037b6e53c21389be8507e8088dc65bff0d7259))
* Ignore lookupConfirm if dailyVault is set ([#1311](https://github.com/dendronhq/dendron/issues/1311)) ([1c734da](https://github.com/dendronhq/dendron/commit/1c734daa45cc1e655638d754267c6bdf5bdcab90))
* issue with init workspace ([94d05c8](https://github.com/dendronhq/dendron/commit/94d05c8f1b6856c769d0cd2964d1dece9decb37c))
* reload index to be silent by default ([#1269](https://github.com/dendronhq/dendron/issues/1269)) ([2c0bf03](https://github.com/dendronhq/dendron/commit/2c0bf03d997ee3abc1f802f80e4b177feb44ae8b))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))
* stop calendar from auto expanding when the last note is closed ([#1299](https://github.com/dendronhq/dendron/issues/1299)) ([9c8f853](https://github.com/dendronhq/dendron/commit/9c8f8533da5027c122e0d003ce4c61dc866735f5))
* unhandled error in insert note link ([#1192](https://github.com/dendronhq/dendron/issues/1192)) ([a73420c](https://github.com/dendronhq/dendron/commit/a73420cd0f3d9f933256be43b839226b15b1e837))
* update links on frontmatter tags changes ([#1214](https://github.com/dendronhq/dendron/issues/1214)) ([4d344fe](https://github.com/dendronhq/dendron/commit/4d344fe40701a259e3ac4399899dab4099c8614f))
* update vs code compat version + husky hook check ([#1346](https://github.com/dendronhq/dendron/issues/1346)) ([1ae3fc6](https://github.com/dendronhq/dendron/commit/1ae3fc6da41084adc1e19f4c09b3a75d00ca0cb3))


### Features Dendron

* Add smart vault selection to NoteLookupCommand ([#1174](https://github.com/dendronhq/dendron/issues/1174)) ([742cab6](https://github.com/dendronhq/dendron/commit/742cab6c683bb14b6baff6c786957a5cc7228894))
* enable usePrettyRefs for nextJS publishing and preview ([#1239](https://github.com/dendronhq/dendron/issues/1239)) ([8a456a9](https://github.com/dendronhq/dendron/commit/8a456a910c45e927c8413d881324bd28401e2aca))
* github publish to create new issue ([#1206](https://github.com/dendronhq/dendron/issues/1206)) ([67abef0](https://github.com/dendronhq/dendron/commit/67abef02c5615385a8a7f82fe290c8a443605a7f))
* run migration command ([#1177](https://github.com/dendronhq/dendron/issues/1177)) ([98bd000](https://github.com/dendronhq/dendron/commit/98bd000236e8c3a7def6b6895fa8d24315c54cf2))
* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))
* user tag autocomplete & user tags updated on rename ([#1278](https://github.com/dendronhq/dendron/issues/1278)) ([9719f99](https://github.com/dendronhq/dendron/commit/9719f99550a2c51c1a22f6fb21ff750bb4115f89))
* user tags ([#1228](https://github.com/dendronhq/dendron/issues/1228)) ([98c0106](https://github.com/dendronhq/dendron/commit/98c0106367e384c130a927484b9ea294eb6f84fa))



## 0.55.2 (2021-08-21)


### Bug Fixes

* force update picker item on button trigger even when value hasn't changed ([#1176](https://github.com/dendronhq/dendron/issues/1176)) ([46449a4](https://github.com/dendronhq/dendron/commit/46449a44009913af6340b26660fd5b5b2a79d57f))



## 0.55.1 (2021-08-17)


### Bug Fixes

* hiding quickpick doesn't dispose of picker ([781923a](https://github.com/dendronhq/dendron/commit/781923a679426ec4f29bd4600e29437ce1902d6f))
* multiple issues with lookupv3 ([1fdd9eb](https://github.com/dendronhq/dendron/commit/1fdd9eb3242b43539572a1993fefd174640c6d83))
* regression with move note command ([5e357b8](https://github.com/dendronhq/dendron/commit/5e357b8995ff335aa36ad48777a96ee56b196c01))


### Features Dendron

* Insert Note Index command ([#1142](https://github.com/dendronhq/dendron/issues/1142)) ([c140015](https://github.com/dendronhq/dendron/commit/c140015c19a942cf4696d596e818fd89905eea25))
* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* accept splitType argument in lookup v2 ([#1102](https://github.com/dendronhq/dendron/issues/1102)) ([a1120e4](https://github.com/dendronhq/dendron/commit/a1120e449af9776a14d2bcbb47f8d877ebd1227b))
* CopyNoteLink copies footnotes as anchors ([#1117](https://github.com/dendronhq/dendron/issues/1117)) ([2168991](https://github.com/dendronhq/dendron/commit/21689914d0c84735d243b988dcceb276df97380f))
* CopyNoteRef respects noXVaultWikiLink option ([#1085](https://github.com/dendronhq/dendron/issues/1085)) ([b4b3da3](https://github.com/dendronhq/dendron/commit/b4b3da3306e2c5621c3c79a53b9f6e4cc31856c6)), closes [#1072](https://github.com/dendronhq/dendron/issues/1072)
* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* extension readme getting started link ([#1084](https://github.com/dendronhq/dendron/issues/1084)) ([d3f5b7d](https://github.com/dendronhq/dendron/commit/d3f5b7dc49873cbbb9e44ce1ff473cd4d95e1214))
* FM tags with quoted strings & with spaces ([1a16689](https://github.com/dendronhq/dendron/commit/1a1668914f70b48a4e74a218bd43521df226de38))
* highlighting is not displayed ([#1083](https://github.com/dendronhq/dendron/issues/1083)) ([86ead9b](https://github.com/dendronhq/dendron/commit/86ead9b7ec66a51712a265f263a515c624f2861c))
* issue with direct child filter partially omitting values in quickpick ([#1123](https://github.com/dendronhq/dendron/issues/1123)) ([fbabab4](https://github.com/dendronhq/dendron/commit/fbabab4b61c91f3ebbe62def339efb32e1815178))
* lookupv3 selection issue ([#1130](https://github.com/dendronhq/dendron/issues/1130)) ([c807e88](https://github.com/dendronhq/dendron/commit/c807e88a82217e5a04dfddb5a24259a50bea4813))
* properly debounce picker update ([#1111](https://github.com/dendronhq/dendron/issues/1111)) ([ae12e1e](https://github.com/dendronhq/dendron/commit/ae12e1ec39e6d75c9c47e27eff7f96418984da4a))
* skip delayed decoration update if note is closed ([2d91164](https://github.com/dendronhq/dendron/commit/2d9116489b2d1f4d5ccd6d22c022af2da9984817))
* uninstall hook force flush ([#1087](https://github.com/dendronhq/dendron/issues/1087)) ([386aac2](https://github.com/dendronhq/dendron/commit/386aac2b8036cd58c190da99609cef2d3ed2467f))


### Features Dendron

* add journal title override to NoteLookupCommand ([#1140](https://github.com/dendronhq/dendron/issues/1140)) ([173b0c9](https://github.com/dendronhq/dendron/commit/173b0c95d7ca9593e72e2cd1c39e4fdcf31fa64a))
* **calendar:** enable webui by default ([#1127](https://github.com/dendronhq/dendron/issues/1127)) ([3ce8be0](https://github.com/dendronhq/dendron/commit/3ce8be05f50c0fef784eef1b6d02e4816e1bf44a))
* add remaining modifiers to NoteLookup ([#1056](https://github.com/dendronhq/dendron/issues/1056)) ([49c6005](https://github.com/dendronhq/dendron/commit/49c6005d2a2c8fd422eb653977e926084e743d6a)), closes [#1045](https://github.com/dendronhq/dendron/issues/1045) [#1046](https://github.com/dendronhq/dendron/issues/1046)
* add schema suggestion to NoteLookupCommand ([#1113](https://github.com/dendronhq/dendron/issues/1113)) ([7dbd03f](https://github.com/dendronhq/dendron/commit/7dbd03f20586d5174c13a40ed50eecfd8b4c788d))
* add schema templating feature to NoteLookupCommand ([#1118](https://github.com/dendronhq/dendron/issues/1118)) ([8a4cd2b](https://github.com/dendronhq/dendron/commit/8a4cd2b337521abcc25df61e145ef6868c50ea0f))
* Add SchemaLookupCommand ([#1082](https://github.com/dendronhq/dendron/issues/1082)) ([fe11a0e](https://github.com/dendronhq/dendron/commit/fe11a0ea1e0214823dd01842b941456df164bc70))
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* provide YAML validator & suggest YAML extension ([#1116](https://github.com/dendronhq/dendron/issues/1116)) ([b46f091](https://github.com/dendronhq/dendron/commit/b46f0916f9f01fdd7b71b6b5120c38a71d58b113))
* re-engage lapsed users with prompt ([#1086](https://github.com/dendronhq/dendron/issues/1086)) ([f4e6dc5](https://github.com/dendronhq/dendron/commit/f4e6dc563aafdfc0b46966e74d9b38920aee1207))
* rename header updates default link aliases ([1f0e405](https://github.com/dendronhq/dendron/commit/1f0e405d2c67a547fdecc41d76f062251a7cae01))
* resolve vim keybinding conflict on initial install ([#1103](https://github.com/dendronhq/dendron/issues/1103)) ([2278c66](https://github.com/dendronhq/dendron/commit/2278c6616c8297cc414ad02d5323bff5c45072e4))
* seed cmds in plugin ([#1080](https://github.com/dendronhq/dendron/issues/1080)) ([e07a092](https://github.com/dendronhq/dendron/commit/e07a092b1a75548574f2ea45f1b465490b2091f3))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.59.3-alpha.0](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.59.3-alpha.0) (2021-09-19)


### Bug Fixes

* **commands:** rename note leaves incorrect metadata if parent is a stub ([#1348](https://github.com/dendronhq/dendron/issues/1348)) ([d432cc9](https://github.com/dendronhq/dendron/commit/d432cc9e20ff8b9f6cefd7cc4c3a42b567ed9bc5))
* **workspace:** disable certain decorations for long notes to avoid performance hit ([#1337](https://github.com/dendronhq/dendron/issues/1337)) ([f1c46f9](https://github.com/dendronhq/dendron/commit/f1c46f95c228ada2126ec7212cede3bf5acc773d))
* creating scratch when text is selected within a note SHOULD not match scratches just due to prefix ([#1292](https://github.com/dendronhq/dendron/issues/1292)) ([cea4568](https://github.com/dendronhq/dendron/commit/cea456809b0da327bff5e06c1a796323d3eb257f))
* decorations for erased tags persist ([#1291](https://github.com/dendronhq/dendron/issues/1291)) ([e3284f6](https://github.com/dendronhq/dendron/commit/e3284f6449fe36edb81deb2ae4c97612fdf2b8de))
* direct children query ([#1303](https://github.com/dendronhq/dendron/issues/1303)) ([bcf0dea](https://github.com/dendronhq/dendron/commit/bcf0deae422406564cd9a56c1765f90dd2e66215))
* disallow toggling of vault selection behavior in move note ([#1296](https://github.com/dendronhq/dendron/issues/1296)) ([4dc7ca4](https://github.com/dendronhq/dendron/commit/4dc7ca4547bc0c7bcb8eb3e27f64ad7236ef4fd5))
* do not show multi select button on note rename ([#1293](https://github.com/dendronhq/dendron/issues/1293)) ([bd283c1](https://github.com/dendronhq/dendron/commit/bd283c1427f5b1f611885dd8499b2bd5b5bf98c3))
* fix move note to have exact match ([#1331](https://github.com/dendronhq/dendron/issues/1331)) ([a5f4f9b](https://github.com/dendronhq/dendron/commit/a5f4f9b5220d67621e508a68ad2386cd481db21f))
* fixing cmd tab typo in tutorial.2 ([#1234](https://github.com/dendronhq/dendron/issues/1234)) ([6e0543d](https://github.com/dendronhq/dendron/commit/6e0543d5077d40f2e9fc12325d3e111cad7e9a01))
* highlight same file wikilinks, wildcard references, links with anchors ([#1306](https://github.com/dendronhq/dendron/issues/1306)) ([956aa2a](https://github.com/dendronhq/dendron/commit/956aa2a7079eaa93acd2a66ace3c44f3f874c0f8))
* hover provider shouldn't recommend Ctrl+click for missing notes unless configured ([#1276](https://github.com/dendronhq/dendron/issues/1276)) ([cc037b6](https://github.com/dendronhq/dendron/commit/cc037b6e53c21389be8507e8088dc65bff0d7259))
* Ignore lookupConfirm if dailyVault is set ([#1311](https://github.com/dendronhq/dendron/issues/1311)) ([1c734da](https://github.com/dendronhq/dendron/commit/1c734daa45cc1e655638d754267c6bdf5bdcab90))
* issue with init workspace ([94d05c8](https://github.com/dendronhq/dendron/commit/94d05c8f1b6856c769d0cd2964d1dece9decb37c))
* reload index to be silent by default ([#1269](https://github.com/dendronhq/dendron/issues/1269)) ([2c0bf03](https://github.com/dendronhq/dendron/commit/2c0bf03d997ee3abc1f802f80e4b177feb44ae8b))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))
* stop calendar from auto expanding when the last note is closed ([#1299](https://github.com/dendronhq/dendron/issues/1299)) ([9c8f853](https://github.com/dendronhq/dendron/commit/9c8f8533da5027c122e0d003ce4c61dc866735f5))
* unhandled error in insert note link ([#1192](https://github.com/dendronhq/dendron/issues/1192)) ([a73420c](https://github.com/dendronhq/dendron/commit/a73420cd0f3d9f933256be43b839226b15b1e837))
* update links on frontmatter tags changes ([#1214](https://github.com/dendronhq/dendron/issues/1214)) ([4d344fe](https://github.com/dendronhq/dendron/commit/4d344fe40701a259e3ac4399899dab4099c8614f))
* update vs code compat version + husky hook check ([#1346](https://github.com/dendronhq/dendron/issues/1346)) ([1ae3fc6](https://github.com/dendronhq/dendron/commit/1ae3fc6da41084adc1e19f4c09b3a75d00ca0cb3))


### Features Dendron

* Add smart vault selection to NoteLookupCommand ([#1174](https://github.com/dendronhq/dendron/issues/1174)) ([742cab6](https://github.com/dendronhq/dendron/commit/742cab6c683bb14b6baff6c786957a5cc7228894))
* enable usePrettyRefs for nextJS publishing and preview ([#1239](https://github.com/dendronhq/dendron/issues/1239)) ([8a456a9](https://github.com/dendronhq/dendron/commit/8a456a910c45e927c8413d881324bd28401e2aca))
* github publish to create new issue ([#1206](https://github.com/dendronhq/dendron/issues/1206)) ([67abef0](https://github.com/dendronhq/dendron/commit/67abef02c5615385a8a7f82fe290c8a443605a7f))
* run migration command ([#1177](https://github.com/dendronhq/dendron/issues/1177)) ([98bd000](https://github.com/dendronhq/dendron/commit/98bd000236e8c3a7def6b6895fa8d24315c54cf2))
* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))
* user tag autocomplete & user tags updated on rename ([#1278](https://github.com/dendronhq/dendron/issues/1278)) ([9719f99](https://github.com/dendronhq/dendron/commit/9719f99550a2c51c1a22f6fb21ff750bb4115f89))
* user tags ([#1228](https://github.com/dendronhq/dendron/issues/1228)) ([98c0106](https://github.com/dendronhq/dendron/commit/98c0106367e384c130a927484b9ea294eb6f84fa))



## 0.55.2 (2021-08-21)


### Bug Fixes

* force update picker item on button trigger even when value hasn't changed ([#1176](https://github.com/dendronhq/dendron/issues/1176)) ([46449a4](https://github.com/dendronhq/dendron/commit/46449a44009913af6340b26660fd5b5b2a79d57f))



## 0.55.1 (2021-08-17)


### Bug Fixes

* hiding quickpick doesn't dispose of picker ([781923a](https://github.com/dendronhq/dendron/commit/781923a679426ec4f29bd4600e29437ce1902d6f))
* multiple issues with lookupv3 ([1fdd9eb](https://github.com/dendronhq/dendron/commit/1fdd9eb3242b43539572a1993fefd174640c6d83))
* regression with move note command ([5e357b8](https://github.com/dendronhq/dendron/commit/5e357b8995ff335aa36ad48777a96ee56b196c01))


### Features Dendron

* Insert Note Index command ([#1142](https://github.com/dendronhq/dendron/issues/1142)) ([c140015](https://github.com/dendronhq/dendron/commit/c140015c19a942cf4696d596e818fd89905eea25))
* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* accept splitType argument in lookup v2 ([#1102](https://github.com/dendronhq/dendron/issues/1102)) ([a1120e4](https://github.com/dendronhq/dendron/commit/a1120e449af9776a14d2bcbb47f8d877ebd1227b))
* CopyNoteLink copies footnotes as anchors ([#1117](https://github.com/dendronhq/dendron/issues/1117)) ([2168991](https://github.com/dendronhq/dendron/commit/21689914d0c84735d243b988dcceb276df97380f))
* CopyNoteRef respects noXVaultWikiLink option ([#1085](https://github.com/dendronhq/dendron/issues/1085)) ([b4b3da3](https://github.com/dendronhq/dendron/commit/b4b3da3306e2c5621c3c79a53b9f6e4cc31856c6)), closes [#1072](https://github.com/dendronhq/dendron/issues/1072)
* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* extension readme getting started link ([#1084](https://github.com/dendronhq/dendron/issues/1084)) ([d3f5b7d](https://github.com/dendronhq/dendron/commit/d3f5b7dc49873cbbb9e44ce1ff473cd4d95e1214))
* FM tags with quoted strings & with spaces ([1a16689](https://github.com/dendronhq/dendron/commit/1a1668914f70b48a4e74a218bd43521df226de38))
* highlighting is not displayed ([#1083](https://github.com/dendronhq/dendron/issues/1083)) ([86ead9b](https://github.com/dendronhq/dendron/commit/86ead9b7ec66a51712a265f263a515c624f2861c))
* issue with direct child filter partially omitting values in quickpick ([#1123](https://github.com/dendronhq/dendron/issues/1123)) ([fbabab4](https://github.com/dendronhq/dendron/commit/fbabab4b61c91f3ebbe62def339efb32e1815178))
* lookupv3 selection issue ([#1130](https://github.com/dendronhq/dendron/issues/1130)) ([c807e88](https://github.com/dendronhq/dendron/commit/c807e88a82217e5a04dfddb5a24259a50bea4813))
* properly debounce picker update ([#1111](https://github.com/dendronhq/dendron/issues/1111)) ([ae12e1e](https://github.com/dendronhq/dendron/commit/ae12e1ec39e6d75c9c47e27eff7f96418984da4a))
* skip delayed decoration update if note is closed ([2d91164](https://github.com/dendronhq/dendron/commit/2d9116489b2d1f4d5ccd6d22c022af2da9984817))
* uninstall hook force flush ([#1087](https://github.com/dendronhq/dendron/issues/1087)) ([386aac2](https://github.com/dendronhq/dendron/commit/386aac2b8036cd58c190da99609cef2d3ed2467f))


### Features Dendron

* add journal title override to NoteLookupCommand ([#1140](https://github.com/dendronhq/dendron/issues/1140)) ([173b0c9](https://github.com/dendronhq/dendron/commit/173b0c95d7ca9593e72e2cd1c39e4fdcf31fa64a))
* **calendar:** enable webui by default ([#1127](https://github.com/dendronhq/dendron/issues/1127)) ([3ce8be0](https://github.com/dendronhq/dendron/commit/3ce8be05f50c0fef784eef1b6d02e4816e1bf44a))
* add remaining modifiers to NoteLookup ([#1056](https://github.com/dendronhq/dendron/issues/1056)) ([49c6005](https://github.com/dendronhq/dendron/commit/49c6005d2a2c8fd422eb653977e926084e743d6a)), closes [#1045](https://github.com/dendronhq/dendron/issues/1045) [#1046](https://github.com/dendronhq/dendron/issues/1046)
* add schema suggestion to NoteLookupCommand ([#1113](https://github.com/dendronhq/dendron/issues/1113)) ([7dbd03f](https://github.com/dendronhq/dendron/commit/7dbd03f20586d5174c13a40ed50eecfd8b4c788d))
* add schema templating feature to NoteLookupCommand ([#1118](https://github.com/dendronhq/dendron/issues/1118)) ([8a4cd2b](https://github.com/dendronhq/dendron/commit/8a4cd2b337521abcc25df61e145ef6868c50ea0f))
* Add SchemaLookupCommand ([#1082](https://github.com/dendronhq/dendron/issues/1082)) ([fe11a0e](https://github.com/dendronhq/dendron/commit/fe11a0ea1e0214823dd01842b941456df164bc70))
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* provide YAML validator & suggest YAML extension ([#1116](https://github.com/dendronhq/dendron/issues/1116)) ([b46f091](https://github.com/dendronhq/dendron/commit/b46f0916f9f01fdd7b71b6b5120c38a71d58b113))
* re-engage lapsed users with prompt ([#1086](https://github.com/dendronhq/dendron/issues/1086)) ([f4e6dc5](https://github.com/dendronhq/dendron/commit/f4e6dc563aafdfc0b46966e74d9b38920aee1207))
* rename header updates default link aliases ([1f0e405](https://github.com/dendronhq/dendron/commit/1f0e405d2c67a547fdecc41d76f062251a7cae01))
* resolve vim keybinding conflict on initial install ([#1103](https://github.com/dendronhq/dendron/issues/1103)) ([2278c66](https://github.com/dendronhq/dendron/commit/2278c6616c8297cc414ad02d5323bff5c45072e4))
* seed cmds in plugin ([#1080](https://github.com/dendronhq/dendron/issues/1080)) ([e07a092](https://github.com/dendronhq/dendron/commit/e07a092b1a75548574f2ea45f1b465490b2091f3))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.59.2](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.59.2) (2021-09-17)


### Bug Fixes

* **commands:** rename note leaves incorrect metadata if parent is a stub ([#1348](https://github.com/dendronhq/dendron/issues/1348)) ([d432cc9](https://github.com/dendronhq/dendron/commit/d432cc9e20ff8b9f6cefd7cc4c3a42b567ed9bc5))
* **workspace:** disable certain decorations for long notes to avoid performance hit ([#1337](https://github.com/dendronhq/dendron/issues/1337)) ([f1c46f9](https://github.com/dendronhq/dendron/commit/f1c46f95c228ada2126ec7212cede3bf5acc773d))
* creating scratch when text is selected within a note SHOULD not match scratches just due to prefix ([#1292](https://github.com/dendronhq/dendron/issues/1292)) ([cea4568](https://github.com/dendronhq/dendron/commit/cea456809b0da327bff5e06c1a796323d3eb257f))
* decorations for erased tags persist ([#1291](https://github.com/dendronhq/dendron/issues/1291)) ([e3284f6](https://github.com/dendronhq/dendron/commit/e3284f6449fe36edb81deb2ae4c97612fdf2b8de))
* direct children query ([#1303](https://github.com/dendronhq/dendron/issues/1303)) ([bcf0dea](https://github.com/dendronhq/dendron/commit/bcf0deae422406564cd9a56c1765f90dd2e66215))
* disallow toggling of vault selection behavior in move note ([#1296](https://github.com/dendronhq/dendron/issues/1296)) ([4dc7ca4](https://github.com/dendronhq/dendron/commit/4dc7ca4547bc0c7bcb8eb3e27f64ad7236ef4fd5))
* do not show multi select button on note rename ([#1293](https://github.com/dendronhq/dendron/issues/1293)) ([bd283c1](https://github.com/dendronhq/dendron/commit/bd283c1427f5b1f611885dd8499b2bd5b5bf98c3))
* fix move note to have exact match ([#1331](https://github.com/dendronhq/dendron/issues/1331)) ([a5f4f9b](https://github.com/dendronhq/dendron/commit/a5f4f9b5220d67621e508a68ad2386cd481db21f))
* fixing cmd tab typo in tutorial.2 ([#1234](https://github.com/dendronhq/dendron/issues/1234)) ([6e0543d](https://github.com/dendronhq/dendron/commit/6e0543d5077d40f2e9fc12325d3e111cad7e9a01))
* highlight same file wikilinks, wildcard references, links with anchors ([#1306](https://github.com/dendronhq/dendron/issues/1306)) ([956aa2a](https://github.com/dendronhq/dendron/commit/956aa2a7079eaa93acd2a66ace3c44f3f874c0f8))
* hover provider shouldn't recommend Ctrl+click for missing notes unless configured ([#1276](https://github.com/dendronhq/dendron/issues/1276)) ([cc037b6](https://github.com/dendronhq/dendron/commit/cc037b6e53c21389be8507e8088dc65bff0d7259))
* Ignore lookupConfirm if dailyVault is set ([#1311](https://github.com/dendronhq/dendron/issues/1311)) ([1c734da](https://github.com/dendronhq/dendron/commit/1c734daa45cc1e655638d754267c6bdf5bdcab90))
* issue with init workspace ([94d05c8](https://github.com/dendronhq/dendron/commit/94d05c8f1b6856c769d0cd2964d1dece9decb37c))
* reload index to be silent by default ([#1269](https://github.com/dendronhq/dendron/issues/1269)) ([2c0bf03](https://github.com/dendronhq/dendron/commit/2c0bf03d997ee3abc1f802f80e4b177feb44ae8b))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))
* stop calendar from auto expanding when the last note is closed ([#1299](https://github.com/dendronhq/dendron/issues/1299)) ([9c8f853](https://github.com/dendronhq/dendron/commit/9c8f8533da5027c122e0d003ce4c61dc866735f5))
* unhandled error in insert note link ([#1192](https://github.com/dendronhq/dendron/issues/1192)) ([a73420c](https://github.com/dendronhq/dendron/commit/a73420cd0f3d9f933256be43b839226b15b1e837))
* update links on frontmatter tags changes ([#1214](https://github.com/dendronhq/dendron/issues/1214)) ([4d344fe](https://github.com/dendronhq/dendron/commit/4d344fe40701a259e3ac4399899dab4099c8614f))
* update vs code compat version + husky hook check ([#1346](https://github.com/dendronhq/dendron/issues/1346)) ([1ae3fc6](https://github.com/dendronhq/dendron/commit/1ae3fc6da41084adc1e19f4c09b3a75d00ca0cb3))


### Features Dendron

* Add smart vault selection to NoteLookupCommand ([#1174](https://github.com/dendronhq/dendron/issues/1174)) ([742cab6](https://github.com/dendronhq/dendron/commit/742cab6c683bb14b6baff6c786957a5cc7228894))
* enable usePrettyRefs for nextJS publishing and preview ([#1239](https://github.com/dendronhq/dendron/issues/1239)) ([8a456a9](https://github.com/dendronhq/dendron/commit/8a456a910c45e927c8413d881324bd28401e2aca))
* github publish to create new issue ([#1206](https://github.com/dendronhq/dendron/issues/1206)) ([67abef0](https://github.com/dendronhq/dendron/commit/67abef02c5615385a8a7f82fe290c8a443605a7f))
* run migration command ([#1177](https://github.com/dendronhq/dendron/issues/1177)) ([98bd000](https://github.com/dendronhq/dendron/commit/98bd000236e8c3a7def6b6895fa8d24315c54cf2))
* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))
* user tag autocomplete & user tags updated on rename ([#1278](https://github.com/dendronhq/dendron/issues/1278)) ([9719f99](https://github.com/dendronhq/dendron/commit/9719f99550a2c51c1a22f6fb21ff750bb4115f89))
* user tags ([#1228](https://github.com/dendronhq/dendron/issues/1228)) ([98c0106](https://github.com/dendronhq/dendron/commit/98c0106367e384c130a927484b9ea294eb6f84fa))



## 0.55.2 (2021-08-21)


### Bug Fixes

* force update picker item on button trigger even when value hasn't changed ([#1176](https://github.com/dendronhq/dendron/issues/1176)) ([46449a4](https://github.com/dendronhq/dendron/commit/46449a44009913af6340b26660fd5b5b2a79d57f))



## 0.55.1 (2021-08-17)


### Bug Fixes

* hiding quickpick doesn't dispose of picker ([781923a](https://github.com/dendronhq/dendron/commit/781923a679426ec4f29bd4600e29437ce1902d6f))
* multiple issues with lookupv3 ([1fdd9eb](https://github.com/dendronhq/dendron/commit/1fdd9eb3242b43539572a1993fefd174640c6d83))
* regression with move note command ([5e357b8](https://github.com/dendronhq/dendron/commit/5e357b8995ff335aa36ad48777a96ee56b196c01))


### Features Dendron

* Insert Note Index command ([#1142](https://github.com/dendronhq/dendron/issues/1142)) ([c140015](https://github.com/dendronhq/dendron/commit/c140015c19a942cf4696d596e818fd89905eea25))
* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* accept splitType argument in lookup v2 ([#1102](https://github.com/dendronhq/dendron/issues/1102)) ([a1120e4](https://github.com/dendronhq/dendron/commit/a1120e449af9776a14d2bcbb47f8d877ebd1227b))
* CopyNoteLink copies footnotes as anchors ([#1117](https://github.com/dendronhq/dendron/issues/1117)) ([2168991](https://github.com/dendronhq/dendron/commit/21689914d0c84735d243b988dcceb276df97380f))
* CopyNoteRef respects noXVaultWikiLink option ([#1085](https://github.com/dendronhq/dendron/issues/1085)) ([b4b3da3](https://github.com/dendronhq/dendron/commit/b4b3da3306e2c5621c3c79a53b9f6e4cc31856c6)), closes [#1072](https://github.com/dendronhq/dendron/issues/1072)
* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* extension readme getting started link ([#1084](https://github.com/dendronhq/dendron/issues/1084)) ([d3f5b7d](https://github.com/dendronhq/dendron/commit/d3f5b7dc49873cbbb9e44ce1ff473cd4d95e1214))
* FM tags with quoted strings & with spaces ([1a16689](https://github.com/dendronhq/dendron/commit/1a1668914f70b48a4e74a218bd43521df226de38))
* highlighting is not displayed ([#1083](https://github.com/dendronhq/dendron/issues/1083)) ([86ead9b](https://github.com/dendronhq/dendron/commit/86ead9b7ec66a51712a265f263a515c624f2861c))
* issue with direct child filter partially omitting values in quickpick ([#1123](https://github.com/dendronhq/dendron/issues/1123)) ([fbabab4](https://github.com/dendronhq/dendron/commit/fbabab4b61c91f3ebbe62def339efb32e1815178))
* lookupv3 selection issue ([#1130](https://github.com/dendronhq/dendron/issues/1130)) ([c807e88](https://github.com/dendronhq/dendron/commit/c807e88a82217e5a04dfddb5a24259a50bea4813))
* properly debounce picker update ([#1111](https://github.com/dendronhq/dendron/issues/1111)) ([ae12e1e](https://github.com/dendronhq/dendron/commit/ae12e1ec39e6d75c9c47e27eff7f96418984da4a))
* skip delayed decoration update if note is closed ([2d91164](https://github.com/dendronhq/dendron/commit/2d9116489b2d1f4d5ccd6d22c022af2da9984817))
* uninstall hook force flush ([#1087](https://github.com/dendronhq/dendron/issues/1087)) ([386aac2](https://github.com/dendronhq/dendron/commit/386aac2b8036cd58c190da99609cef2d3ed2467f))


### Features Dendron

* add journal title override to NoteLookupCommand ([#1140](https://github.com/dendronhq/dendron/issues/1140)) ([173b0c9](https://github.com/dendronhq/dendron/commit/173b0c95d7ca9593e72e2cd1c39e4fdcf31fa64a))
* **calendar:** enable webui by default ([#1127](https://github.com/dendronhq/dendron/issues/1127)) ([3ce8be0](https://github.com/dendronhq/dendron/commit/3ce8be05f50c0fef784eef1b6d02e4816e1bf44a))
* add remaining modifiers to NoteLookup ([#1056](https://github.com/dendronhq/dendron/issues/1056)) ([49c6005](https://github.com/dendronhq/dendron/commit/49c6005d2a2c8fd422eb653977e926084e743d6a)), closes [#1045](https://github.com/dendronhq/dendron/issues/1045) [#1046](https://github.com/dendronhq/dendron/issues/1046)
* add schema suggestion to NoteLookupCommand ([#1113](https://github.com/dendronhq/dendron/issues/1113)) ([7dbd03f](https://github.com/dendronhq/dendron/commit/7dbd03f20586d5174c13a40ed50eecfd8b4c788d))
* add schema templating feature to NoteLookupCommand ([#1118](https://github.com/dendronhq/dendron/issues/1118)) ([8a4cd2b](https://github.com/dendronhq/dendron/commit/8a4cd2b337521abcc25df61e145ef6868c50ea0f))
* Add SchemaLookupCommand ([#1082](https://github.com/dendronhq/dendron/issues/1082)) ([fe11a0e](https://github.com/dendronhq/dendron/commit/fe11a0ea1e0214823dd01842b941456df164bc70))
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* provide YAML validator & suggest YAML extension ([#1116](https://github.com/dendronhq/dendron/issues/1116)) ([b46f091](https://github.com/dendronhq/dendron/commit/b46f0916f9f01fdd7b71b6b5120c38a71d58b113))
* re-engage lapsed users with prompt ([#1086](https://github.com/dendronhq/dendron/issues/1086)) ([f4e6dc5](https://github.com/dendronhq/dendron/commit/f4e6dc563aafdfc0b46966e74d9b38920aee1207))
* rename header updates default link aliases ([1f0e405](https://github.com/dendronhq/dendron/commit/1f0e405d2c67a547fdecc41d76f062251a7cae01))
* resolve vim keybinding conflict on initial install ([#1103](https://github.com/dendronhq/dendron/issues/1103)) ([2278c66](https://github.com/dendronhq/dendron/commit/2278c6616c8297cc414ad02d5323bff5c45072e4))
* seed cmds in plugin ([#1080](https://github.com/dendronhq/dendron/issues/1080)) ([e07a092](https://github.com/dendronhq/dendron/commit/e07a092b1a75548574f2ea45f1b465490b2091f3))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.59.1](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.59.1) (2021-09-16)


### Bug Fixes

* creating scratch when text is selected within a note SHOULD not match scratches just due to prefix ([#1292](https://github.com/dendronhq/dendron/issues/1292)) ([cea4568](https://github.com/dendronhq/dendron/commit/cea456809b0da327bff5e06c1a796323d3eb257f))
* decorations for erased tags persist ([#1291](https://github.com/dendronhq/dendron/issues/1291)) ([e3284f6](https://github.com/dendronhq/dendron/commit/e3284f6449fe36edb81deb2ae4c97612fdf2b8de))
* direct children query ([#1303](https://github.com/dendronhq/dendron/issues/1303)) ([bcf0dea](https://github.com/dendronhq/dendron/commit/bcf0deae422406564cd9a56c1765f90dd2e66215))
* disallow toggling of vault selection behavior in move note ([#1296](https://github.com/dendronhq/dendron/issues/1296)) ([4dc7ca4](https://github.com/dendronhq/dendron/commit/4dc7ca4547bc0c7bcb8eb3e27f64ad7236ef4fd5))
* do not show multi select button on note rename ([#1293](https://github.com/dendronhq/dendron/issues/1293)) ([bd283c1](https://github.com/dendronhq/dendron/commit/bd283c1427f5b1f611885dd8499b2bd5b5bf98c3))
* fix move note to have exact match ([#1331](https://github.com/dendronhq/dendron/issues/1331)) ([a5f4f9b](https://github.com/dendronhq/dendron/commit/a5f4f9b5220d67621e508a68ad2386cd481db21f))
* fixing cmd tab typo in tutorial.2 ([#1234](https://github.com/dendronhq/dendron/issues/1234)) ([6e0543d](https://github.com/dendronhq/dendron/commit/6e0543d5077d40f2e9fc12325d3e111cad7e9a01))
* highlight same file wikilinks, wildcard references, links with anchors ([#1306](https://github.com/dendronhq/dendron/issues/1306)) ([956aa2a](https://github.com/dendronhq/dendron/commit/956aa2a7079eaa93acd2a66ace3c44f3f874c0f8))
* hover provider shouldn't recommend Ctrl+click for missing notes unless configured ([#1276](https://github.com/dendronhq/dendron/issues/1276)) ([cc037b6](https://github.com/dendronhq/dendron/commit/cc037b6e53c21389be8507e8088dc65bff0d7259))
* Ignore lookupConfirm if dailyVault is set ([#1311](https://github.com/dendronhq/dendron/issues/1311)) ([1c734da](https://github.com/dendronhq/dendron/commit/1c734daa45cc1e655638d754267c6bdf5bdcab90))
* issue with init workspace ([94d05c8](https://github.com/dendronhq/dendron/commit/94d05c8f1b6856c769d0cd2964d1dece9decb37c))
* reload index to be silent by default ([#1269](https://github.com/dendronhq/dendron/issues/1269)) ([2c0bf03](https://github.com/dendronhq/dendron/commit/2c0bf03d997ee3abc1f802f80e4b177feb44ae8b))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))
* stop calendar from auto expanding when the last note is closed ([#1299](https://github.com/dendronhq/dendron/issues/1299)) ([9c8f853](https://github.com/dendronhq/dendron/commit/9c8f8533da5027c122e0d003ce4c61dc866735f5))
* unhandled error in insert note link ([#1192](https://github.com/dendronhq/dendron/issues/1192)) ([a73420c](https://github.com/dendronhq/dendron/commit/a73420cd0f3d9f933256be43b839226b15b1e837))
* update links on frontmatter tags changes ([#1214](https://github.com/dendronhq/dendron/issues/1214)) ([4d344fe](https://github.com/dendronhq/dendron/commit/4d344fe40701a259e3ac4399899dab4099c8614f))
* update vs code compat version + husky hook check ([#1346](https://github.com/dendronhq/dendron/issues/1346)) ([1ae3fc6](https://github.com/dendronhq/dendron/commit/1ae3fc6da41084adc1e19f4c09b3a75d00ca0cb3))


### Features Dendron

* Add smart vault selection to NoteLookupCommand ([#1174](https://github.com/dendronhq/dendron/issues/1174)) ([742cab6](https://github.com/dendronhq/dendron/commit/742cab6c683bb14b6baff6c786957a5cc7228894))
* enable usePrettyRefs for nextJS publishing and preview ([#1239](https://github.com/dendronhq/dendron/issues/1239)) ([8a456a9](https://github.com/dendronhq/dendron/commit/8a456a910c45e927c8413d881324bd28401e2aca))
* github publish to create new issue ([#1206](https://github.com/dendronhq/dendron/issues/1206)) ([67abef0](https://github.com/dendronhq/dendron/commit/67abef02c5615385a8a7f82fe290c8a443605a7f))
* run migration command ([#1177](https://github.com/dendronhq/dendron/issues/1177)) ([98bd000](https://github.com/dendronhq/dendron/commit/98bd000236e8c3a7def6b6895fa8d24315c54cf2))
* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))
* user tag autocomplete & user tags updated on rename ([#1278](https://github.com/dendronhq/dendron/issues/1278)) ([9719f99](https://github.com/dendronhq/dendron/commit/9719f99550a2c51c1a22f6fb21ff750bb4115f89))
* user tags ([#1228](https://github.com/dendronhq/dendron/issues/1228)) ([98c0106](https://github.com/dendronhq/dendron/commit/98c0106367e384c130a927484b9ea294eb6f84fa))



## 0.55.2 (2021-08-21)


### Bug Fixes

* force update picker item on button trigger even when value hasn't changed ([#1176](https://github.com/dendronhq/dendron/issues/1176)) ([46449a4](https://github.com/dendronhq/dendron/commit/46449a44009913af6340b26660fd5b5b2a79d57f))



## 0.55.1 (2021-08-17)


### Bug Fixes

* hiding quickpick doesn't dispose of picker ([781923a](https://github.com/dendronhq/dendron/commit/781923a679426ec4f29bd4600e29437ce1902d6f))
* multiple issues with lookupv3 ([1fdd9eb](https://github.com/dendronhq/dendron/commit/1fdd9eb3242b43539572a1993fefd174640c6d83))
* regression with move note command ([5e357b8](https://github.com/dendronhq/dendron/commit/5e357b8995ff335aa36ad48777a96ee56b196c01))


### Features Dendron

* Insert Note Index command ([#1142](https://github.com/dendronhq/dendron/issues/1142)) ([c140015](https://github.com/dendronhq/dendron/commit/c140015c19a942cf4696d596e818fd89905eea25))
* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* accept splitType argument in lookup v2 ([#1102](https://github.com/dendronhq/dendron/issues/1102)) ([a1120e4](https://github.com/dendronhq/dendron/commit/a1120e449af9776a14d2bcbb47f8d877ebd1227b))
* CopyNoteLink copies footnotes as anchors ([#1117](https://github.com/dendronhq/dendron/issues/1117)) ([2168991](https://github.com/dendronhq/dendron/commit/21689914d0c84735d243b988dcceb276df97380f))
* CopyNoteRef respects noXVaultWikiLink option ([#1085](https://github.com/dendronhq/dendron/issues/1085)) ([b4b3da3](https://github.com/dendronhq/dendron/commit/b4b3da3306e2c5621c3c79a53b9f6e4cc31856c6)), closes [#1072](https://github.com/dendronhq/dendron/issues/1072)
* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* extension readme getting started link ([#1084](https://github.com/dendronhq/dendron/issues/1084)) ([d3f5b7d](https://github.com/dendronhq/dendron/commit/d3f5b7dc49873cbbb9e44ce1ff473cd4d95e1214))
* FM tags with quoted strings & with spaces ([1a16689](https://github.com/dendronhq/dendron/commit/1a1668914f70b48a4e74a218bd43521df226de38))
* highlighting is not displayed ([#1083](https://github.com/dendronhq/dendron/issues/1083)) ([86ead9b](https://github.com/dendronhq/dendron/commit/86ead9b7ec66a51712a265f263a515c624f2861c))
* issue with direct child filter partially omitting values in quickpick ([#1123](https://github.com/dendronhq/dendron/issues/1123)) ([fbabab4](https://github.com/dendronhq/dendron/commit/fbabab4b61c91f3ebbe62def339efb32e1815178))
* lookupv3 selection issue ([#1130](https://github.com/dendronhq/dendron/issues/1130)) ([c807e88](https://github.com/dendronhq/dendron/commit/c807e88a82217e5a04dfddb5a24259a50bea4813))
* properly debounce picker update ([#1111](https://github.com/dendronhq/dendron/issues/1111)) ([ae12e1e](https://github.com/dendronhq/dendron/commit/ae12e1ec39e6d75c9c47e27eff7f96418984da4a))
* skip delayed decoration update if note is closed ([2d91164](https://github.com/dendronhq/dendron/commit/2d9116489b2d1f4d5ccd6d22c022af2da9984817))
* uninstall hook force flush ([#1087](https://github.com/dendronhq/dendron/issues/1087)) ([386aac2](https://github.com/dendronhq/dendron/commit/386aac2b8036cd58c190da99609cef2d3ed2467f))


### Features Dendron

* add journal title override to NoteLookupCommand ([#1140](https://github.com/dendronhq/dendron/issues/1140)) ([173b0c9](https://github.com/dendronhq/dendron/commit/173b0c95d7ca9593e72e2cd1c39e4fdcf31fa64a))
* **calendar:** enable webui by default ([#1127](https://github.com/dendronhq/dendron/issues/1127)) ([3ce8be0](https://github.com/dendronhq/dendron/commit/3ce8be05f50c0fef784eef1b6d02e4816e1bf44a))
* add remaining modifiers to NoteLookup ([#1056](https://github.com/dendronhq/dendron/issues/1056)) ([49c6005](https://github.com/dendronhq/dendron/commit/49c6005d2a2c8fd422eb653977e926084e743d6a)), closes [#1045](https://github.com/dendronhq/dendron/issues/1045) [#1046](https://github.com/dendronhq/dendron/issues/1046)
* add schema suggestion to NoteLookupCommand ([#1113](https://github.com/dendronhq/dendron/issues/1113)) ([7dbd03f](https://github.com/dendronhq/dendron/commit/7dbd03f20586d5174c13a40ed50eecfd8b4c788d))
* add schema templating feature to NoteLookupCommand ([#1118](https://github.com/dendronhq/dendron/issues/1118)) ([8a4cd2b](https://github.com/dendronhq/dendron/commit/8a4cd2b337521abcc25df61e145ef6868c50ea0f))
* Add SchemaLookupCommand ([#1082](https://github.com/dendronhq/dendron/issues/1082)) ([fe11a0e](https://github.com/dendronhq/dendron/commit/fe11a0ea1e0214823dd01842b941456df164bc70))
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* provide YAML validator & suggest YAML extension ([#1116](https://github.com/dendronhq/dendron/issues/1116)) ([b46f091](https://github.com/dendronhq/dendron/commit/b46f0916f9f01fdd7b71b6b5120c38a71d58b113))
* re-engage lapsed users with prompt ([#1086](https://github.com/dendronhq/dendron/issues/1086)) ([f4e6dc5](https://github.com/dendronhq/dendron/commit/f4e6dc563aafdfc0b46966e74d9b38920aee1207))
* rename header updates default link aliases ([1f0e405](https://github.com/dendronhq/dendron/commit/1f0e405d2c67a547fdecc41d76f062251a7cae01))
* resolve vim keybinding conflict on initial install ([#1103](https://github.com/dendronhq/dendron/issues/1103)) ([2278c66](https://github.com/dendronhq/dendron/commit/2278c6616c8297cc414ad02d5323bff5c45072e4))
* seed cmds in plugin ([#1080](https://github.com/dendronhq/dendron/issues/1080)) ([e07a092](https://github.com/dendronhq/dendron/commit/e07a092b1a75548574f2ea45f1b465490b2091f3))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.59.2-alpha.5](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.59.2-alpha.5) (2021-09-15)


### Bug Fixes

* creating scratch when text is selected within a note SHOULD not match scratches just due to prefix ([#1292](https://github.com/dendronhq/dendron/issues/1292)) ([cea4568](https://github.com/dendronhq/dendron/commit/cea456809b0da327bff5e06c1a796323d3eb257f))
* decorations for erased tags persist ([#1291](https://github.com/dendronhq/dendron/issues/1291)) ([e3284f6](https://github.com/dendronhq/dendron/commit/e3284f6449fe36edb81deb2ae4c97612fdf2b8de))
* direct children query ([#1303](https://github.com/dendronhq/dendron/issues/1303)) ([bcf0dea](https://github.com/dendronhq/dendron/commit/bcf0deae422406564cd9a56c1765f90dd2e66215))
* disallow toggling of vault selection behavior in move note ([#1296](https://github.com/dendronhq/dendron/issues/1296)) ([4dc7ca4](https://github.com/dendronhq/dendron/commit/4dc7ca4547bc0c7bcb8eb3e27f64ad7236ef4fd5))
* do not show multi select button on note rename ([#1293](https://github.com/dendronhq/dendron/issues/1293)) ([bd283c1](https://github.com/dendronhq/dendron/commit/bd283c1427f5b1f611885dd8499b2bd5b5bf98c3))
* fix move note to have exact match ([#1331](https://github.com/dendronhq/dendron/issues/1331)) ([a5f4f9b](https://github.com/dendronhq/dendron/commit/a5f4f9b5220d67621e508a68ad2386cd481db21f))
* fixing cmd tab typo in tutorial.2 ([#1234](https://github.com/dendronhq/dendron/issues/1234)) ([6e0543d](https://github.com/dendronhq/dendron/commit/6e0543d5077d40f2e9fc12325d3e111cad7e9a01))
* highlight same file wikilinks, wildcard references, links with anchors ([#1306](https://github.com/dendronhq/dendron/issues/1306)) ([956aa2a](https://github.com/dendronhq/dendron/commit/956aa2a7079eaa93acd2a66ace3c44f3f874c0f8))
* hover provider shouldn't recommend Ctrl+click for missing notes unless configured ([#1276](https://github.com/dendronhq/dendron/issues/1276)) ([cc037b6](https://github.com/dendronhq/dendron/commit/cc037b6e53c21389be8507e8088dc65bff0d7259))
* Ignore lookupConfirm if dailyVault is set ([#1311](https://github.com/dendronhq/dendron/issues/1311)) ([1c734da](https://github.com/dendronhq/dendron/commit/1c734daa45cc1e655638d754267c6bdf5bdcab90))
* issue with init workspace ([94d05c8](https://github.com/dendronhq/dendron/commit/94d05c8f1b6856c769d0cd2964d1dece9decb37c))
* reload index to be silent by default ([#1269](https://github.com/dendronhq/dendron/issues/1269)) ([2c0bf03](https://github.com/dendronhq/dendron/commit/2c0bf03d997ee3abc1f802f80e4b177feb44ae8b))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))
* stop calendar from auto expanding when the last note is closed ([#1299](https://github.com/dendronhq/dendron/issues/1299)) ([9c8f853](https://github.com/dendronhq/dendron/commit/9c8f8533da5027c122e0d003ce4c61dc866735f5))
* unhandled error in insert note link ([#1192](https://github.com/dendronhq/dendron/issues/1192)) ([a73420c](https://github.com/dendronhq/dendron/commit/a73420cd0f3d9f933256be43b839226b15b1e837))
* update links on frontmatter tags changes ([#1214](https://github.com/dendronhq/dendron/issues/1214)) ([4d344fe](https://github.com/dendronhq/dendron/commit/4d344fe40701a259e3ac4399899dab4099c8614f))


### Features Dendron

* Add smart vault selection to NoteLookupCommand ([#1174](https://github.com/dendronhq/dendron/issues/1174)) ([742cab6](https://github.com/dendronhq/dendron/commit/742cab6c683bb14b6baff6c786957a5cc7228894))
* enable usePrettyRefs for nextJS publishing and preview ([#1239](https://github.com/dendronhq/dendron/issues/1239)) ([8a456a9](https://github.com/dendronhq/dendron/commit/8a456a910c45e927c8413d881324bd28401e2aca))
* github publish to create new issue ([#1206](https://github.com/dendronhq/dendron/issues/1206)) ([67abef0](https://github.com/dendronhq/dendron/commit/67abef02c5615385a8a7f82fe290c8a443605a7f))
* run migration command ([#1177](https://github.com/dendronhq/dendron/issues/1177)) ([98bd000](https://github.com/dendronhq/dendron/commit/98bd000236e8c3a7def6b6895fa8d24315c54cf2))
* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))
* user tag autocomplete & user tags updated on rename ([#1278](https://github.com/dendronhq/dendron/issues/1278)) ([9719f99](https://github.com/dendronhq/dendron/commit/9719f99550a2c51c1a22f6fb21ff750bb4115f89))
* user tags ([#1228](https://github.com/dendronhq/dendron/issues/1228)) ([98c0106](https://github.com/dendronhq/dendron/commit/98c0106367e384c130a927484b9ea294eb6f84fa))



## 0.55.2 (2021-08-21)


### Bug Fixes

* force update picker item on button trigger even when value hasn't changed ([#1176](https://github.com/dendronhq/dendron/issues/1176)) ([46449a4](https://github.com/dendronhq/dendron/commit/46449a44009913af6340b26660fd5b5b2a79d57f))



## 0.55.1 (2021-08-17)


### Bug Fixes

* hiding quickpick doesn't dispose of picker ([781923a](https://github.com/dendronhq/dendron/commit/781923a679426ec4f29bd4600e29437ce1902d6f))
* multiple issues with lookupv3 ([1fdd9eb](https://github.com/dendronhq/dendron/commit/1fdd9eb3242b43539572a1993fefd174640c6d83))
* regression with move note command ([5e357b8](https://github.com/dendronhq/dendron/commit/5e357b8995ff335aa36ad48777a96ee56b196c01))


### Features Dendron

* Insert Note Index command ([#1142](https://github.com/dendronhq/dendron/issues/1142)) ([c140015](https://github.com/dendronhq/dendron/commit/c140015c19a942cf4696d596e818fd89905eea25))
* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* accept splitType argument in lookup v2 ([#1102](https://github.com/dendronhq/dendron/issues/1102)) ([a1120e4](https://github.com/dendronhq/dendron/commit/a1120e449af9776a14d2bcbb47f8d877ebd1227b))
* CopyNoteLink copies footnotes as anchors ([#1117](https://github.com/dendronhq/dendron/issues/1117)) ([2168991](https://github.com/dendronhq/dendron/commit/21689914d0c84735d243b988dcceb276df97380f))
* CopyNoteRef respects noXVaultWikiLink option ([#1085](https://github.com/dendronhq/dendron/issues/1085)) ([b4b3da3](https://github.com/dendronhq/dendron/commit/b4b3da3306e2c5621c3c79a53b9f6e4cc31856c6)), closes [#1072](https://github.com/dendronhq/dendron/issues/1072)
* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* extension readme getting started link ([#1084](https://github.com/dendronhq/dendron/issues/1084)) ([d3f5b7d](https://github.com/dendronhq/dendron/commit/d3f5b7dc49873cbbb9e44ce1ff473cd4d95e1214))
* FM tags with quoted strings & with spaces ([1a16689](https://github.com/dendronhq/dendron/commit/1a1668914f70b48a4e74a218bd43521df226de38))
* highlighting is not displayed ([#1083](https://github.com/dendronhq/dendron/issues/1083)) ([86ead9b](https://github.com/dendronhq/dendron/commit/86ead9b7ec66a51712a265f263a515c624f2861c))
* issue with direct child filter partially omitting values in quickpick ([#1123](https://github.com/dendronhq/dendron/issues/1123)) ([fbabab4](https://github.com/dendronhq/dendron/commit/fbabab4b61c91f3ebbe62def339efb32e1815178))
* lookupv3 selection issue ([#1130](https://github.com/dendronhq/dendron/issues/1130)) ([c807e88](https://github.com/dendronhq/dendron/commit/c807e88a82217e5a04dfddb5a24259a50bea4813))
* properly debounce picker update ([#1111](https://github.com/dendronhq/dendron/issues/1111)) ([ae12e1e](https://github.com/dendronhq/dendron/commit/ae12e1ec39e6d75c9c47e27eff7f96418984da4a))
* skip delayed decoration update if note is closed ([2d91164](https://github.com/dendronhq/dendron/commit/2d9116489b2d1f4d5ccd6d22c022af2da9984817))
* uninstall hook force flush ([#1087](https://github.com/dendronhq/dendron/issues/1087)) ([386aac2](https://github.com/dendronhq/dendron/commit/386aac2b8036cd58c190da99609cef2d3ed2467f))


### Features Dendron

* add journal title override to NoteLookupCommand ([#1140](https://github.com/dendronhq/dendron/issues/1140)) ([173b0c9](https://github.com/dendronhq/dendron/commit/173b0c95d7ca9593e72e2cd1c39e4fdcf31fa64a))
* **calendar:** enable webui by default ([#1127](https://github.com/dendronhq/dendron/issues/1127)) ([3ce8be0](https://github.com/dendronhq/dendron/commit/3ce8be05f50c0fef784eef1b6d02e4816e1bf44a))
* add remaining modifiers to NoteLookup ([#1056](https://github.com/dendronhq/dendron/issues/1056)) ([49c6005](https://github.com/dendronhq/dendron/commit/49c6005d2a2c8fd422eb653977e926084e743d6a)), closes [#1045](https://github.com/dendronhq/dendron/issues/1045) [#1046](https://github.com/dendronhq/dendron/issues/1046)
* add schema suggestion to NoteLookupCommand ([#1113](https://github.com/dendronhq/dendron/issues/1113)) ([7dbd03f](https://github.com/dendronhq/dendron/commit/7dbd03f20586d5174c13a40ed50eecfd8b4c788d))
* add schema templating feature to NoteLookupCommand ([#1118](https://github.com/dendronhq/dendron/issues/1118)) ([8a4cd2b](https://github.com/dendronhq/dendron/commit/8a4cd2b337521abcc25df61e145ef6868c50ea0f))
* Add SchemaLookupCommand ([#1082](https://github.com/dendronhq/dendron/issues/1082)) ([fe11a0e](https://github.com/dendronhq/dendron/commit/fe11a0ea1e0214823dd01842b941456df164bc70))
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* provide YAML validator & suggest YAML extension ([#1116](https://github.com/dendronhq/dendron/issues/1116)) ([b46f091](https://github.com/dendronhq/dendron/commit/b46f0916f9f01fdd7b71b6b5120c38a71d58b113))
* re-engage lapsed users with prompt ([#1086](https://github.com/dendronhq/dendron/issues/1086)) ([f4e6dc5](https://github.com/dendronhq/dendron/commit/f4e6dc563aafdfc0b46966e74d9b38920aee1207))
* rename header updates default link aliases ([1f0e405](https://github.com/dendronhq/dendron/commit/1f0e405d2c67a547fdecc41d76f062251a7cae01))
* resolve vim keybinding conflict on initial install ([#1103](https://github.com/dendronhq/dendron/issues/1103)) ([2278c66](https://github.com/dendronhq/dendron/commit/2278c6616c8297cc414ad02d5323bff5c45072e4))
* seed cmds in plugin ([#1080](https://github.com/dendronhq/dendron/issues/1080)) ([e07a092](https://github.com/dendronhq/dendron/commit/e07a092b1a75548574f2ea45f1b465490b2091f3))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.59.2-alpha.4](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.59.2-alpha.4) (2021-09-15)


### Bug Fixes

* creating scratch when text is selected within a note SHOULD not match scratches just due to prefix ([#1292](https://github.com/dendronhq/dendron/issues/1292)) ([cea4568](https://github.com/dendronhq/dendron/commit/cea456809b0da327bff5e06c1a796323d3eb257f))
* decorations for erased tags persist ([#1291](https://github.com/dendronhq/dendron/issues/1291)) ([e3284f6](https://github.com/dendronhq/dendron/commit/e3284f6449fe36edb81deb2ae4c97612fdf2b8de))
* direct children query ([#1303](https://github.com/dendronhq/dendron/issues/1303)) ([bcf0dea](https://github.com/dendronhq/dendron/commit/bcf0deae422406564cd9a56c1765f90dd2e66215))
* disallow toggling of vault selection behavior in move note ([#1296](https://github.com/dendronhq/dendron/issues/1296)) ([4dc7ca4](https://github.com/dendronhq/dendron/commit/4dc7ca4547bc0c7bcb8eb3e27f64ad7236ef4fd5))
* do not show multi select button on note rename ([#1293](https://github.com/dendronhq/dendron/issues/1293)) ([bd283c1](https://github.com/dendronhq/dendron/commit/bd283c1427f5b1f611885dd8499b2bd5b5bf98c3))
* fix move note to have exact match ([#1331](https://github.com/dendronhq/dendron/issues/1331)) ([a5f4f9b](https://github.com/dendronhq/dendron/commit/a5f4f9b5220d67621e508a68ad2386cd481db21f))
* fixing cmd tab typo in tutorial.2 ([#1234](https://github.com/dendronhq/dendron/issues/1234)) ([6e0543d](https://github.com/dendronhq/dendron/commit/6e0543d5077d40f2e9fc12325d3e111cad7e9a01))
* highlight same file wikilinks, wildcard references, links with anchors ([#1306](https://github.com/dendronhq/dendron/issues/1306)) ([956aa2a](https://github.com/dendronhq/dendron/commit/956aa2a7079eaa93acd2a66ace3c44f3f874c0f8))
* hover provider shouldn't recommend Ctrl+click for missing notes unless configured ([#1276](https://github.com/dendronhq/dendron/issues/1276)) ([cc037b6](https://github.com/dendronhq/dendron/commit/cc037b6e53c21389be8507e8088dc65bff0d7259))
* Ignore lookupConfirm if dailyVault is set ([#1311](https://github.com/dendronhq/dendron/issues/1311)) ([1c734da](https://github.com/dendronhq/dendron/commit/1c734daa45cc1e655638d754267c6bdf5bdcab90))
* issue with init workspace ([94d05c8](https://github.com/dendronhq/dendron/commit/94d05c8f1b6856c769d0cd2964d1dece9decb37c))
* reload index to be silent by default ([#1269](https://github.com/dendronhq/dendron/issues/1269)) ([2c0bf03](https://github.com/dendronhq/dendron/commit/2c0bf03d997ee3abc1f802f80e4b177feb44ae8b))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))
* stop calendar from auto expanding when the last note is closed ([#1299](https://github.com/dendronhq/dendron/issues/1299)) ([9c8f853](https://github.com/dendronhq/dendron/commit/9c8f8533da5027c122e0d003ce4c61dc866735f5))
* unhandled error in insert note link ([#1192](https://github.com/dendronhq/dendron/issues/1192)) ([a73420c](https://github.com/dendronhq/dendron/commit/a73420cd0f3d9f933256be43b839226b15b1e837))
* update links on frontmatter tags changes ([#1214](https://github.com/dendronhq/dendron/issues/1214)) ([4d344fe](https://github.com/dendronhq/dendron/commit/4d344fe40701a259e3ac4399899dab4099c8614f))


### Features Dendron

* Add smart vault selection to NoteLookupCommand ([#1174](https://github.com/dendronhq/dendron/issues/1174)) ([742cab6](https://github.com/dendronhq/dendron/commit/742cab6c683bb14b6baff6c786957a5cc7228894))
* enable usePrettyRefs for nextJS publishing and preview ([#1239](https://github.com/dendronhq/dendron/issues/1239)) ([8a456a9](https://github.com/dendronhq/dendron/commit/8a456a910c45e927c8413d881324bd28401e2aca))
* github publish to create new issue ([#1206](https://github.com/dendronhq/dendron/issues/1206)) ([67abef0](https://github.com/dendronhq/dendron/commit/67abef02c5615385a8a7f82fe290c8a443605a7f))
* run migration command ([#1177](https://github.com/dendronhq/dendron/issues/1177)) ([98bd000](https://github.com/dendronhq/dendron/commit/98bd000236e8c3a7def6b6895fa8d24315c54cf2))
* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))
* user tag autocomplete & user tags updated on rename ([#1278](https://github.com/dendronhq/dendron/issues/1278)) ([9719f99](https://github.com/dendronhq/dendron/commit/9719f99550a2c51c1a22f6fb21ff750bb4115f89))
* user tags ([#1228](https://github.com/dendronhq/dendron/issues/1228)) ([98c0106](https://github.com/dendronhq/dendron/commit/98c0106367e384c130a927484b9ea294eb6f84fa))



## 0.55.2 (2021-08-21)


### Bug Fixes

* force update picker item on button trigger even when value hasn't changed ([#1176](https://github.com/dendronhq/dendron/issues/1176)) ([46449a4](https://github.com/dendronhq/dendron/commit/46449a44009913af6340b26660fd5b5b2a79d57f))



## 0.55.1 (2021-08-17)


### Bug Fixes

* hiding quickpick doesn't dispose of picker ([781923a](https://github.com/dendronhq/dendron/commit/781923a679426ec4f29bd4600e29437ce1902d6f))
* multiple issues with lookupv3 ([1fdd9eb](https://github.com/dendronhq/dendron/commit/1fdd9eb3242b43539572a1993fefd174640c6d83))
* regression with move note command ([5e357b8](https://github.com/dendronhq/dendron/commit/5e357b8995ff335aa36ad48777a96ee56b196c01))


### Features Dendron

* Insert Note Index command ([#1142](https://github.com/dendronhq/dendron/issues/1142)) ([c140015](https://github.com/dendronhq/dendron/commit/c140015c19a942cf4696d596e818fd89905eea25))
* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* accept splitType argument in lookup v2 ([#1102](https://github.com/dendronhq/dendron/issues/1102)) ([a1120e4](https://github.com/dendronhq/dendron/commit/a1120e449af9776a14d2bcbb47f8d877ebd1227b))
* CopyNoteLink copies footnotes as anchors ([#1117](https://github.com/dendronhq/dendron/issues/1117)) ([2168991](https://github.com/dendronhq/dendron/commit/21689914d0c84735d243b988dcceb276df97380f))
* CopyNoteRef respects noXVaultWikiLink option ([#1085](https://github.com/dendronhq/dendron/issues/1085)) ([b4b3da3](https://github.com/dendronhq/dendron/commit/b4b3da3306e2c5621c3c79a53b9f6e4cc31856c6)), closes [#1072](https://github.com/dendronhq/dendron/issues/1072)
* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* extension readme getting started link ([#1084](https://github.com/dendronhq/dendron/issues/1084)) ([d3f5b7d](https://github.com/dendronhq/dendron/commit/d3f5b7dc49873cbbb9e44ce1ff473cd4d95e1214))
* FM tags with quoted strings & with spaces ([1a16689](https://github.com/dendronhq/dendron/commit/1a1668914f70b48a4e74a218bd43521df226de38))
* highlighting is not displayed ([#1083](https://github.com/dendronhq/dendron/issues/1083)) ([86ead9b](https://github.com/dendronhq/dendron/commit/86ead9b7ec66a51712a265f263a515c624f2861c))
* issue with direct child filter partially omitting values in quickpick ([#1123](https://github.com/dendronhq/dendron/issues/1123)) ([fbabab4](https://github.com/dendronhq/dendron/commit/fbabab4b61c91f3ebbe62def339efb32e1815178))
* lookupv3 selection issue ([#1130](https://github.com/dendronhq/dendron/issues/1130)) ([c807e88](https://github.com/dendronhq/dendron/commit/c807e88a82217e5a04dfddb5a24259a50bea4813))
* properly debounce picker update ([#1111](https://github.com/dendronhq/dendron/issues/1111)) ([ae12e1e](https://github.com/dendronhq/dendron/commit/ae12e1ec39e6d75c9c47e27eff7f96418984da4a))
* skip delayed decoration update if note is closed ([2d91164](https://github.com/dendronhq/dendron/commit/2d9116489b2d1f4d5ccd6d22c022af2da9984817))
* uninstall hook force flush ([#1087](https://github.com/dendronhq/dendron/issues/1087)) ([386aac2](https://github.com/dendronhq/dendron/commit/386aac2b8036cd58c190da99609cef2d3ed2467f))


### Features Dendron

* add journal title override to NoteLookupCommand ([#1140](https://github.com/dendronhq/dendron/issues/1140)) ([173b0c9](https://github.com/dendronhq/dendron/commit/173b0c95d7ca9593e72e2cd1c39e4fdcf31fa64a))
* **calendar:** enable webui by default ([#1127](https://github.com/dendronhq/dendron/issues/1127)) ([3ce8be0](https://github.com/dendronhq/dendron/commit/3ce8be05f50c0fef784eef1b6d02e4816e1bf44a))
* add remaining modifiers to NoteLookup ([#1056](https://github.com/dendronhq/dendron/issues/1056)) ([49c6005](https://github.com/dendronhq/dendron/commit/49c6005d2a2c8fd422eb653977e926084e743d6a)), closes [#1045](https://github.com/dendronhq/dendron/issues/1045) [#1046](https://github.com/dendronhq/dendron/issues/1046)
* add schema suggestion to NoteLookupCommand ([#1113](https://github.com/dendronhq/dendron/issues/1113)) ([7dbd03f](https://github.com/dendronhq/dendron/commit/7dbd03f20586d5174c13a40ed50eecfd8b4c788d))
* add schema templating feature to NoteLookupCommand ([#1118](https://github.com/dendronhq/dendron/issues/1118)) ([8a4cd2b](https://github.com/dendronhq/dendron/commit/8a4cd2b337521abcc25df61e145ef6868c50ea0f))
* Add SchemaLookupCommand ([#1082](https://github.com/dendronhq/dendron/issues/1082)) ([fe11a0e](https://github.com/dendronhq/dendron/commit/fe11a0ea1e0214823dd01842b941456df164bc70))
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* provide YAML validator & suggest YAML extension ([#1116](https://github.com/dendronhq/dendron/issues/1116)) ([b46f091](https://github.com/dendronhq/dendron/commit/b46f0916f9f01fdd7b71b6b5120c38a71d58b113))
* re-engage lapsed users with prompt ([#1086](https://github.com/dendronhq/dendron/issues/1086)) ([f4e6dc5](https://github.com/dendronhq/dendron/commit/f4e6dc563aafdfc0b46966e74d9b38920aee1207))
* rename header updates default link aliases ([1f0e405](https://github.com/dendronhq/dendron/commit/1f0e405d2c67a547fdecc41d76f062251a7cae01))
* resolve vim keybinding conflict on initial install ([#1103](https://github.com/dendronhq/dendron/issues/1103)) ([2278c66](https://github.com/dendronhq/dendron/commit/2278c6616c8297cc414ad02d5323bff5c45072e4))
* seed cmds in plugin ([#1080](https://github.com/dendronhq/dendron/issues/1080)) ([e07a092](https://github.com/dendronhq/dendron/commit/e07a092b1a75548574f2ea45f1b465490b2091f3))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.59.2-alpha.3](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.59.2-alpha.3) (2021-09-15)


### Bug Fixes

* creating scratch when text is selected within a note SHOULD not match scratches just due to prefix ([#1292](https://github.com/dendronhq/dendron/issues/1292)) ([cea4568](https://github.com/dendronhq/dendron/commit/cea456809b0da327bff5e06c1a796323d3eb257f))
* decorations for erased tags persist ([#1291](https://github.com/dendronhq/dendron/issues/1291)) ([e3284f6](https://github.com/dendronhq/dendron/commit/e3284f6449fe36edb81deb2ae4c97612fdf2b8de))
* direct children query ([#1303](https://github.com/dendronhq/dendron/issues/1303)) ([bcf0dea](https://github.com/dendronhq/dendron/commit/bcf0deae422406564cd9a56c1765f90dd2e66215))
* disallow toggling of vault selection behavior in move note ([#1296](https://github.com/dendronhq/dendron/issues/1296)) ([4dc7ca4](https://github.com/dendronhq/dendron/commit/4dc7ca4547bc0c7bcb8eb3e27f64ad7236ef4fd5))
* do not show multi select button on note rename ([#1293](https://github.com/dendronhq/dendron/issues/1293)) ([bd283c1](https://github.com/dendronhq/dendron/commit/bd283c1427f5b1f611885dd8499b2bd5b5bf98c3))
* fix move note to have exact match ([#1331](https://github.com/dendronhq/dendron/issues/1331)) ([a5f4f9b](https://github.com/dendronhq/dendron/commit/a5f4f9b5220d67621e508a68ad2386cd481db21f))
* fixing cmd tab typo in tutorial.2 ([#1234](https://github.com/dendronhq/dendron/issues/1234)) ([6e0543d](https://github.com/dendronhq/dendron/commit/6e0543d5077d40f2e9fc12325d3e111cad7e9a01))
* highlight same file wikilinks, wildcard references, links with anchors ([#1306](https://github.com/dendronhq/dendron/issues/1306)) ([956aa2a](https://github.com/dendronhq/dendron/commit/956aa2a7079eaa93acd2a66ace3c44f3f874c0f8))
* hover provider shouldn't recommend Ctrl+click for missing notes unless configured ([#1276](https://github.com/dendronhq/dendron/issues/1276)) ([cc037b6](https://github.com/dendronhq/dendron/commit/cc037b6e53c21389be8507e8088dc65bff0d7259))
* Ignore lookupConfirm if dailyVault is set ([#1311](https://github.com/dendronhq/dendron/issues/1311)) ([1c734da](https://github.com/dendronhq/dendron/commit/1c734daa45cc1e655638d754267c6bdf5bdcab90))
* issue with init workspace ([94d05c8](https://github.com/dendronhq/dendron/commit/94d05c8f1b6856c769d0cd2964d1dece9decb37c))
* reload index to be silent by default ([#1269](https://github.com/dendronhq/dendron/issues/1269)) ([2c0bf03](https://github.com/dendronhq/dendron/commit/2c0bf03d997ee3abc1f802f80e4b177feb44ae8b))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))
* stop calendar from auto expanding when the last note is closed ([#1299](https://github.com/dendronhq/dendron/issues/1299)) ([9c8f853](https://github.com/dendronhq/dendron/commit/9c8f8533da5027c122e0d003ce4c61dc866735f5))
* unhandled error in insert note link ([#1192](https://github.com/dendronhq/dendron/issues/1192)) ([a73420c](https://github.com/dendronhq/dendron/commit/a73420cd0f3d9f933256be43b839226b15b1e837))
* update links on frontmatter tags changes ([#1214](https://github.com/dendronhq/dendron/issues/1214)) ([4d344fe](https://github.com/dendronhq/dendron/commit/4d344fe40701a259e3ac4399899dab4099c8614f))


### Features Dendron

* Add smart vault selection to NoteLookupCommand ([#1174](https://github.com/dendronhq/dendron/issues/1174)) ([742cab6](https://github.com/dendronhq/dendron/commit/742cab6c683bb14b6baff6c786957a5cc7228894))
* enable usePrettyRefs for nextJS publishing and preview ([#1239](https://github.com/dendronhq/dendron/issues/1239)) ([8a456a9](https://github.com/dendronhq/dendron/commit/8a456a910c45e927c8413d881324bd28401e2aca))
* github publish to create new issue ([#1206](https://github.com/dendronhq/dendron/issues/1206)) ([67abef0](https://github.com/dendronhq/dendron/commit/67abef02c5615385a8a7f82fe290c8a443605a7f))
* run migration command ([#1177](https://github.com/dendronhq/dendron/issues/1177)) ([98bd000](https://github.com/dendronhq/dendron/commit/98bd000236e8c3a7def6b6895fa8d24315c54cf2))
* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))
* user tag autocomplete & user tags updated on rename ([#1278](https://github.com/dendronhq/dendron/issues/1278)) ([9719f99](https://github.com/dendronhq/dendron/commit/9719f99550a2c51c1a22f6fb21ff750bb4115f89))
* user tags ([#1228](https://github.com/dendronhq/dendron/issues/1228)) ([98c0106](https://github.com/dendronhq/dendron/commit/98c0106367e384c130a927484b9ea294eb6f84fa))



## 0.55.2 (2021-08-21)


### Bug Fixes

* force update picker item on button trigger even when value hasn't changed ([#1176](https://github.com/dendronhq/dendron/issues/1176)) ([46449a4](https://github.com/dendronhq/dendron/commit/46449a44009913af6340b26660fd5b5b2a79d57f))



## 0.55.1 (2021-08-17)


### Bug Fixes

* hiding quickpick doesn't dispose of picker ([781923a](https://github.com/dendronhq/dendron/commit/781923a679426ec4f29bd4600e29437ce1902d6f))
* multiple issues with lookupv3 ([1fdd9eb](https://github.com/dendronhq/dendron/commit/1fdd9eb3242b43539572a1993fefd174640c6d83))
* regression with move note command ([5e357b8](https://github.com/dendronhq/dendron/commit/5e357b8995ff335aa36ad48777a96ee56b196c01))


### Features Dendron

* Insert Note Index command ([#1142](https://github.com/dendronhq/dendron/issues/1142)) ([c140015](https://github.com/dendronhq/dendron/commit/c140015c19a942cf4696d596e818fd89905eea25))
* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* accept splitType argument in lookup v2 ([#1102](https://github.com/dendronhq/dendron/issues/1102)) ([a1120e4](https://github.com/dendronhq/dendron/commit/a1120e449af9776a14d2bcbb47f8d877ebd1227b))
* CopyNoteLink copies footnotes as anchors ([#1117](https://github.com/dendronhq/dendron/issues/1117)) ([2168991](https://github.com/dendronhq/dendron/commit/21689914d0c84735d243b988dcceb276df97380f))
* CopyNoteRef respects noXVaultWikiLink option ([#1085](https://github.com/dendronhq/dendron/issues/1085)) ([b4b3da3](https://github.com/dendronhq/dendron/commit/b4b3da3306e2c5621c3c79a53b9f6e4cc31856c6)), closes [#1072](https://github.com/dendronhq/dendron/issues/1072)
* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* extension readme getting started link ([#1084](https://github.com/dendronhq/dendron/issues/1084)) ([d3f5b7d](https://github.com/dendronhq/dendron/commit/d3f5b7dc49873cbbb9e44ce1ff473cd4d95e1214))
* FM tags with quoted strings & with spaces ([1a16689](https://github.com/dendronhq/dendron/commit/1a1668914f70b48a4e74a218bd43521df226de38))
* highlighting is not displayed ([#1083](https://github.com/dendronhq/dendron/issues/1083)) ([86ead9b](https://github.com/dendronhq/dendron/commit/86ead9b7ec66a51712a265f263a515c624f2861c))
* issue with direct child filter partially omitting values in quickpick ([#1123](https://github.com/dendronhq/dendron/issues/1123)) ([fbabab4](https://github.com/dendronhq/dendron/commit/fbabab4b61c91f3ebbe62def339efb32e1815178))
* lookupv3 selection issue ([#1130](https://github.com/dendronhq/dendron/issues/1130)) ([c807e88](https://github.com/dendronhq/dendron/commit/c807e88a82217e5a04dfddb5a24259a50bea4813))
* properly debounce picker update ([#1111](https://github.com/dendronhq/dendron/issues/1111)) ([ae12e1e](https://github.com/dendronhq/dendron/commit/ae12e1ec39e6d75c9c47e27eff7f96418984da4a))
* skip delayed decoration update if note is closed ([2d91164](https://github.com/dendronhq/dendron/commit/2d9116489b2d1f4d5ccd6d22c022af2da9984817))
* uninstall hook force flush ([#1087](https://github.com/dendronhq/dendron/issues/1087)) ([386aac2](https://github.com/dendronhq/dendron/commit/386aac2b8036cd58c190da99609cef2d3ed2467f))


### Features Dendron

* add journal title override to NoteLookupCommand ([#1140](https://github.com/dendronhq/dendron/issues/1140)) ([173b0c9](https://github.com/dendronhq/dendron/commit/173b0c95d7ca9593e72e2cd1c39e4fdcf31fa64a))
* **calendar:** enable webui by default ([#1127](https://github.com/dendronhq/dendron/issues/1127)) ([3ce8be0](https://github.com/dendronhq/dendron/commit/3ce8be05f50c0fef784eef1b6d02e4816e1bf44a))
* add remaining modifiers to NoteLookup ([#1056](https://github.com/dendronhq/dendron/issues/1056)) ([49c6005](https://github.com/dendronhq/dendron/commit/49c6005d2a2c8fd422eb653977e926084e743d6a)), closes [#1045](https://github.com/dendronhq/dendron/issues/1045) [#1046](https://github.com/dendronhq/dendron/issues/1046)
* add schema suggestion to NoteLookupCommand ([#1113](https://github.com/dendronhq/dendron/issues/1113)) ([7dbd03f](https://github.com/dendronhq/dendron/commit/7dbd03f20586d5174c13a40ed50eecfd8b4c788d))
* add schema templating feature to NoteLookupCommand ([#1118](https://github.com/dendronhq/dendron/issues/1118)) ([8a4cd2b](https://github.com/dendronhq/dendron/commit/8a4cd2b337521abcc25df61e145ef6868c50ea0f))
* Add SchemaLookupCommand ([#1082](https://github.com/dendronhq/dendron/issues/1082)) ([fe11a0e](https://github.com/dendronhq/dendron/commit/fe11a0ea1e0214823dd01842b941456df164bc70))
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* provide YAML validator & suggest YAML extension ([#1116](https://github.com/dendronhq/dendron/issues/1116)) ([b46f091](https://github.com/dendronhq/dendron/commit/b46f0916f9f01fdd7b71b6b5120c38a71d58b113))
* re-engage lapsed users with prompt ([#1086](https://github.com/dendronhq/dendron/issues/1086)) ([f4e6dc5](https://github.com/dendronhq/dendron/commit/f4e6dc563aafdfc0b46966e74d9b38920aee1207))
* rename header updates default link aliases ([1f0e405](https://github.com/dendronhq/dendron/commit/1f0e405d2c67a547fdecc41d76f062251a7cae01))
* resolve vim keybinding conflict on initial install ([#1103](https://github.com/dendronhq/dendron/issues/1103)) ([2278c66](https://github.com/dendronhq/dendron/commit/2278c6616c8297cc414ad02d5323bff5c45072e4))
* seed cmds in plugin ([#1080](https://github.com/dendronhq/dendron/issues/1080)) ([e07a092](https://github.com/dendronhq/dendron/commit/e07a092b1a75548574f2ea45f1b465490b2091f3))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.59.2-alpha.2](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.59.2-alpha.2) (2021-09-15)


### Bug Fixes

* creating scratch when text is selected within a note SHOULD not match scratches just due to prefix ([#1292](https://github.com/dendronhq/dendron/issues/1292)) ([cea4568](https://github.com/dendronhq/dendron/commit/cea456809b0da327bff5e06c1a796323d3eb257f))
* decorations for erased tags persist ([#1291](https://github.com/dendronhq/dendron/issues/1291)) ([e3284f6](https://github.com/dendronhq/dendron/commit/e3284f6449fe36edb81deb2ae4c97612fdf2b8de))
* direct children query ([#1303](https://github.com/dendronhq/dendron/issues/1303)) ([bcf0dea](https://github.com/dendronhq/dendron/commit/bcf0deae422406564cd9a56c1765f90dd2e66215))
* disallow toggling of vault selection behavior in move note ([#1296](https://github.com/dendronhq/dendron/issues/1296)) ([4dc7ca4](https://github.com/dendronhq/dendron/commit/4dc7ca4547bc0c7bcb8eb3e27f64ad7236ef4fd5))
* do not show multi select button on note rename ([#1293](https://github.com/dendronhq/dendron/issues/1293)) ([bd283c1](https://github.com/dendronhq/dendron/commit/bd283c1427f5b1f611885dd8499b2bd5b5bf98c3))
* fix move note to have exact match ([#1331](https://github.com/dendronhq/dendron/issues/1331)) ([a5f4f9b](https://github.com/dendronhq/dendron/commit/a5f4f9b5220d67621e508a68ad2386cd481db21f))
* fixing cmd tab typo in tutorial.2 ([#1234](https://github.com/dendronhq/dendron/issues/1234)) ([6e0543d](https://github.com/dendronhq/dendron/commit/6e0543d5077d40f2e9fc12325d3e111cad7e9a01))
* highlight same file wikilinks, wildcard references, links with anchors ([#1306](https://github.com/dendronhq/dendron/issues/1306)) ([956aa2a](https://github.com/dendronhq/dendron/commit/956aa2a7079eaa93acd2a66ace3c44f3f874c0f8))
* hover provider shouldn't recommend Ctrl+click for missing notes unless configured ([#1276](https://github.com/dendronhq/dendron/issues/1276)) ([cc037b6](https://github.com/dendronhq/dendron/commit/cc037b6e53c21389be8507e8088dc65bff0d7259))
* Ignore lookupConfirm if dailyVault is set ([#1311](https://github.com/dendronhq/dendron/issues/1311)) ([1c734da](https://github.com/dendronhq/dendron/commit/1c734daa45cc1e655638d754267c6bdf5bdcab90))
* issue with init workspace ([94d05c8](https://github.com/dendronhq/dendron/commit/94d05c8f1b6856c769d0cd2964d1dece9decb37c))
* reload index to be silent by default ([#1269](https://github.com/dendronhq/dendron/issues/1269)) ([2c0bf03](https://github.com/dendronhq/dendron/commit/2c0bf03d997ee3abc1f802f80e4b177feb44ae8b))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))
* stop calendar from auto expanding when the last note is closed ([#1299](https://github.com/dendronhq/dendron/issues/1299)) ([9c8f853](https://github.com/dendronhq/dendron/commit/9c8f8533da5027c122e0d003ce4c61dc866735f5))
* unhandled error in insert note link ([#1192](https://github.com/dendronhq/dendron/issues/1192)) ([a73420c](https://github.com/dendronhq/dendron/commit/a73420cd0f3d9f933256be43b839226b15b1e837))
* update links on frontmatter tags changes ([#1214](https://github.com/dendronhq/dendron/issues/1214)) ([4d344fe](https://github.com/dendronhq/dendron/commit/4d344fe40701a259e3ac4399899dab4099c8614f))


### Features Dendron

* Add smart vault selection to NoteLookupCommand ([#1174](https://github.com/dendronhq/dendron/issues/1174)) ([742cab6](https://github.com/dendronhq/dendron/commit/742cab6c683bb14b6baff6c786957a5cc7228894))
* enable usePrettyRefs for nextJS publishing and preview ([#1239](https://github.com/dendronhq/dendron/issues/1239)) ([8a456a9](https://github.com/dendronhq/dendron/commit/8a456a910c45e927c8413d881324bd28401e2aca))
* github publish to create new issue ([#1206](https://github.com/dendronhq/dendron/issues/1206)) ([67abef0](https://github.com/dendronhq/dendron/commit/67abef02c5615385a8a7f82fe290c8a443605a7f))
* run migration command ([#1177](https://github.com/dendronhq/dendron/issues/1177)) ([98bd000](https://github.com/dendronhq/dendron/commit/98bd000236e8c3a7def6b6895fa8d24315c54cf2))
* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))
* user tag autocomplete & user tags updated on rename ([#1278](https://github.com/dendronhq/dendron/issues/1278)) ([9719f99](https://github.com/dendronhq/dendron/commit/9719f99550a2c51c1a22f6fb21ff750bb4115f89))
* user tags ([#1228](https://github.com/dendronhq/dendron/issues/1228)) ([98c0106](https://github.com/dendronhq/dendron/commit/98c0106367e384c130a927484b9ea294eb6f84fa))



## 0.55.2 (2021-08-21)


### Bug Fixes

* force update picker item on button trigger even when value hasn't changed ([#1176](https://github.com/dendronhq/dendron/issues/1176)) ([46449a4](https://github.com/dendronhq/dendron/commit/46449a44009913af6340b26660fd5b5b2a79d57f))



## 0.55.1 (2021-08-17)


### Bug Fixes

* hiding quickpick doesn't dispose of picker ([781923a](https://github.com/dendronhq/dendron/commit/781923a679426ec4f29bd4600e29437ce1902d6f))
* multiple issues with lookupv3 ([1fdd9eb](https://github.com/dendronhq/dendron/commit/1fdd9eb3242b43539572a1993fefd174640c6d83))
* regression with move note command ([5e357b8](https://github.com/dendronhq/dendron/commit/5e357b8995ff335aa36ad48777a96ee56b196c01))


### Features Dendron

* Insert Note Index command ([#1142](https://github.com/dendronhq/dendron/issues/1142)) ([c140015](https://github.com/dendronhq/dendron/commit/c140015c19a942cf4696d596e818fd89905eea25))
* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* accept splitType argument in lookup v2 ([#1102](https://github.com/dendronhq/dendron/issues/1102)) ([a1120e4](https://github.com/dendronhq/dendron/commit/a1120e449af9776a14d2bcbb47f8d877ebd1227b))
* CopyNoteLink copies footnotes as anchors ([#1117](https://github.com/dendronhq/dendron/issues/1117)) ([2168991](https://github.com/dendronhq/dendron/commit/21689914d0c84735d243b988dcceb276df97380f))
* CopyNoteRef respects noXVaultWikiLink option ([#1085](https://github.com/dendronhq/dendron/issues/1085)) ([b4b3da3](https://github.com/dendronhq/dendron/commit/b4b3da3306e2c5621c3c79a53b9f6e4cc31856c6)), closes [#1072](https://github.com/dendronhq/dendron/issues/1072)
* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* extension readme getting started link ([#1084](https://github.com/dendronhq/dendron/issues/1084)) ([d3f5b7d](https://github.com/dendronhq/dendron/commit/d3f5b7dc49873cbbb9e44ce1ff473cd4d95e1214))
* FM tags with quoted strings & with spaces ([1a16689](https://github.com/dendronhq/dendron/commit/1a1668914f70b48a4e74a218bd43521df226de38))
* highlighting is not displayed ([#1083](https://github.com/dendronhq/dendron/issues/1083)) ([86ead9b](https://github.com/dendronhq/dendron/commit/86ead9b7ec66a51712a265f263a515c624f2861c))
* issue with direct child filter partially omitting values in quickpick ([#1123](https://github.com/dendronhq/dendron/issues/1123)) ([fbabab4](https://github.com/dendronhq/dendron/commit/fbabab4b61c91f3ebbe62def339efb32e1815178))
* lookupv3 selection issue ([#1130](https://github.com/dendronhq/dendron/issues/1130)) ([c807e88](https://github.com/dendronhq/dendron/commit/c807e88a82217e5a04dfddb5a24259a50bea4813))
* properly debounce picker update ([#1111](https://github.com/dendronhq/dendron/issues/1111)) ([ae12e1e](https://github.com/dendronhq/dendron/commit/ae12e1ec39e6d75c9c47e27eff7f96418984da4a))
* skip delayed decoration update if note is closed ([2d91164](https://github.com/dendronhq/dendron/commit/2d9116489b2d1f4d5ccd6d22c022af2da9984817))
* uninstall hook force flush ([#1087](https://github.com/dendronhq/dendron/issues/1087)) ([386aac2](https://github.com/dendronhq/dendron/commit/386aac2b8036cd58c190da99609cef2d3ed2467f))


### Features Dendron

* add journal title override to NoteLookupCommand ([#1140](https://github.com/dendronhq/dendron/issues/1140)) ([173b0c9](https://github.com/dendronhq/dendron/commit/173b0c95d7ca9593e72e2cd1c39e4fdcf31fa64a))
* **calendar:** enable webui by default ([#1127](https://github.com/dendronhq/dendron/issues/1127)) ([3ce8be0](https://github.com/dendronhq/dendron/commit/3ce8be05f50c0fef784eef1b6d02e4816e1bf44a))
* add remaining modifiers to NoteLookup ([#1056](https://github.com/dendronhq/dendron/issues/1056)) ([49c6005](https://github.com/dendronhq/dendron/commit/49c6005d2a2c8fd422eb653977e926084e743d6a)), closes [#1045](https://github.com/dendronhq/dendron/issues/1045) [#1046](https://github.com/dendronhq/dendron/issues/1046)
* add schema suggestion to NoteLookupCommand ([#1113](https://github.com/dendronhq/dendron/issues/1113)) ([7dbd03f](https://github.com/dendronhq/dendron/commit/7dbd03f20586d5174c13a40ed50eecfd8b4c788d))
* add schema templating feature to NoteLookupCommand ([#1118](https://github.com/dendronhq/dendron/issues/1118)) ([8a4cd2b](https://github.com/dendronhq/dendron/commit/8a4cd2b337521abcc25df61e145ef6868c50ea0f))
* Add SchemaLookupCommand ([#1082](https://github.com/dendronhq/dendron/issues/1082)) ([fe11a0e](https://github.com/dendronhq/dendron/commit/fe11a0ea1e0214823dd01842b941456df164bc70))
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* provide YAML validator & suggest YAML extension ([#1116](https://github.com/dendronhq/dendron/issues/1116)) ([b46f091](https://github.com/dendronhq/dendron/commit/b46f0916f9f01fdd7b71b6b5120c38a71d58b113))
* re-engage lapsed users with prompt ([#1086](https://github.com/dendronhq/dendron/issues/1086)) ([f4e6dc5](https://github.com/dendronhq/dendron/commit/f4e6dc563aafdfc0b46966e74d9b38920aee1207))
* rename header updates default link aliases ([1f0e405](https://github.com/dendronhq/dendron/commit/1f0e405d2c67a547fdecc41d76f062251a7cae01))
* resolve vim keybinding conflict on initial install ([#1103](https://github.com/dendronhq/dendron/issues/1103)) ([2278c66](https://github.com/dendronhq/dendron/commit/2278c6616c8297cc414ad02d5323bff5c45072e4))
* seed cmds in plugin ([#1080](https://github.com/dendronhq/dendron/issues/1080)) ([e07a092](https://github.com/dendronhq/dendron/commit/e07a092b1a75548574f2ea45f1b465490b2091f3))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.59.2-alpha.1](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.59.2-alpha.1) (2021-09-15)


### Bug Fixes

* creating scratch when text is selected within a note SHOULD not match scratches just due to prefix ([#1292](https://github.com/dendronhq/dendron/issues/1292)) ([cea4568](https://github.com/dendronhq/dendron/commit/cea456809b0da327bff5e06c1a796323d3eb257f))
* decorations for erased tags persist ([#1291](https://github.com/dendronhq/dendron/issues/1291)) ([e3284f6](https://github.com/dendronhq/dendron/commit/e3284f6449fe36edb81deb2ae4c97612fdf2b8de))
* direct children query ([#1303](https://github.com/dendronhq/dendron/issues/1303)) ([bcf0dea](https://github.com/dendronhq/dendron/commit/bcf0deae422406564cd9a56c1765f90dd2e66215))
* disallow toggling of vault selection behavior in move note ([#1296](https://github.com/dendronhq/dendron/issues/1296)) ([4dc7ca4](https://github.com/dendronhq/dendron/commit/4dc7ca4547bc0c7bcb8eb3e27f64ad7236ef4fd5))
* do not show multi select button on note rename ([#1293](https://github.com/dendronhq/dendron/issues/1293)) ([bd283c1](https://github.com/dendronhq/dendron/commit/bd283c1427f5b1f611885dd8499b2bd5b5bf98c3))
* fix move note to have exact match ([#1331](https://github.com/dendronhq/dendron/issues/1331)) ([a5f4f9b](https://github.com/dendronhq/dendron/commit/a5f4f9b5220d67621e508a68ad2386cd481db21f))
* fixing cmd tab typo in tutorial.2 ([#1234](https://github.com/dendronhq/dendron/issues/1234)) ([6e0543d](https://github.com/dendronhq/dendron/commit/6e0543d5077d40f2e9fc12325d3e111cad7e9a01))
* highlight same file wikilinks, wildcard references, links with anchors ([#1306](https://github.com/dendronhq/dendron/issues/1306)) ([956aa2a](https://github.com/dendronhq/dendron/commit/956aa2a7079eaa93acd2a66ace3c44f3f874c0f8))
* hover provider shouldn't recommend Ctrl+click for missing notes unless configured ([#1276](https://github.com/dendronhq/dendron/issues/1276)) ([cc037b6](https://github.com/dendronhq/dendron/commit/cc037b6e53c21389be8507e8088dc65bff0d7259))
* Ignore lookupConfirm if dailyVault is set ([#1311](https://github.com/dendronhq/dendron/issues/1311)) ([1c734da](https://github.com/dendronhq/dendron/commit/1c734daa45cc1e655638d754267c6bdf5bdcab90))
* issue with init workspace ([94d05c8](https://github.com/dendronhq/dendron/commit/94d05c8f1b6856c769d0cd2964d1dece9decb37c))
* reload index to be silent by default ([#1269](https://github.com/dendronhq/dendron/issues/1269)) ([2c0bf03](https://github.com/dendronhq/dendron/commit/2c0bf03d997ee3abc1f802f80e4b177feb44ae8b))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))
* stop calendar from auto expanding when the last note is closed ([#1299](https://github.com/dendronhq/dendron/issues/1299)) ([9c8f853](https://github.com/dendronhq/dendron/commit/9c8f8533da5027c122e0d003ce4c61dc866735f5))
* unhandled error in insert note link ([#1192](https://github.com/dendronhq/dendron/issues/1192)) ([a73420c](https://github.com/dendronhq/dendron/commit/a73420cd0f3d9f933256be43b839226b15b1e837))
* update links on frontmatter tags changes ([#1214](https://github.com/dendronhq/dendron/issues/1214)) ([4d344fe](https://github.com/dendronhq/dendron/commit/4d344fe40701a259e3ac4399899dab4099c8614f))


### Features Dendron

* Add smart vault selection to NoteLookupCommand ([#1174](https://github.com/dendronhq/dendron/issues/1174)) ([742cab6](https://github.com/dendronhq/dendron/commit/742cab6c683bb14b6baff6c786957a5cc7228894))
* enable usePrettyRefs for nextJS publishing and preview ([#1239](https://github.com/dendronhq/dendron/issues/1239)) ([8a456a9](https://github.com/dendronhq/dendron/commit/8a456a910c45e927c8413d881324bd28401e2aca))
* github publish to create new issue ([#1206](https://github.com/dendronhq/dendron/issues/1206)) ([67abef0](https://github.com/dendronhq/dendron/commit/67abef02c5615385a8a7f82fe290c8a443605a7f))
* run migration command ([#1177](https://github.com/dendronhq/dendron/issues/1177)) ([98bd000](https://github.com/dendronhq/dendron/commit/98bd000236e8c3a7def6b6895fa8d24315c54cf2))
* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))
* user tag autocomplete & user tags updated on rename ([#1278](https://github.com/dendronhq/dendron/issues/1278)) ([9719f99](https://github.com/dendronhq/dendron/commit/9719f99550a2c51c1a22f6fb21ff750bb4115f89))
* user tags ([#1228](https://github.com/dendronhq/dendron/issues/1228)) ([98c0106](https://github.com/dendronhq/dendron/commit/98c0106367e384c130a927484b9ea294eb6f84fa))


### Reverts

* Revert "chore: remove sentry plugin" ([e879757](https://github.com/dendronhq/dendron/commit/e8797575cee725836992d8fe4ca0cecd6de64b0c))



## 0.55.2 (2021-08-21)


### Bug Fixes

* force update picker item on button trigger even when value hasn't changed ([#1176](https://github.com/dendronhq/dendron/issues/1176)) ([46449a4](https://github.com/dendronhq/dendron/commit/46449a44009913af6340b26660fd5b5b2a79d57f))



## 0.55.1 (2021-08-17)


### Bug Fixes

* hiding quickpick doesn't dispose of picker ([781923a](https://github.com/dendronhq/dendron/commit/781923a679426ec4f29bd4600e29437ce1902d6f))
* multiple issues with lookupv3 ([1fdd9eb](https://github.com/dendronhq/dendron/commit/1fdd9eb3242b43539572a1993fefd174640c6d83))
* regression with move note command ([5e357b8](https://github.com/dendronhq/dendron/commit/5e357b8995ff335aa36ad48777a96ee56b196c01))


### Features Dendron

* Insert Note Index command ([#1142](https://github.com/dendronhq/dendron/issues/1142)) ([c140015](https://github.com/dendronhq/dendron/commit/c140015c19a942cf4696d596e818fd89905eea25))
* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* accept splitType argument in lookup v2 ([#1102](https://github.com/dendronhq/dendron/issues/1102)) ([a1120e4](https://github.com/dendronhq/dendron/commit/a1120e449af9776a14d2bcbb47f8d877ebd1227b))
* CopyNoteLink copies footnotes as anchors ([#1117](https://github.com/dendronhq/dendron/issues/1117)) ([2168991](https://github.com/dendronhq/dendron/commit/21689914d0c84735d243b988dcceb276df97380f))
* CopyNoteRef respects noXVaultWikiLink option ([#1085](https://github.com/dendronhq/dendron/issues/1085)) ([b4b3da3](https://github.com/dendronhq/dendron/commit/b4b3da3306e2c5621c3c79a53b9f6e4cc31856c6)), closes [#1072](https://github.com/dendronhq/dendron/issues/1072)
* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* extension readme getting started link ([#1084](https://github.com/dendronhq/dendron/issues/1084)) ([d3f5b7d](https://github.com/dendronhq/dendron/commit/d3f5b7dc49873cbbb9e44ce1ff473cd4d95e1214))
* FM tags with quoted strings & with spaces ([1a16689](https://github.com/dendronhq/dendron/commit/1a1668914f70b48a4e74a218bd43521df226de38))
* highlighting is not displayed ([#1083](https://github.com/dendronhq/dendron/issues/1083)) ([86ead9b](https://github.com/dendronhq/dendron/commit/86ead9b7ec66a51712a265f263a515c624f2861c))
* issue with direct child filter partially omitting values in quickpick ([#1123](https://github.com/dendronhq/dendron/issues/1123)) ([fbabab4](https://github.com/dendronhq/dendron/commit/fbabab4b61c91f3ebbe62def339efb32e1815178))
* lookupv3 selection issue ([#1130](https://github.com/dendronhq/dendron/issues/1130)) ([c807e88](https://github.com/dendronhq/dendron/commit/c807e88a82217e5a04dfddb5a24259a50bea4813))
* properly debounce picker update ([#1111](https://github.com/dendronhq/dendron/issues/1111)) ([ae12e1e](https://github.com/dendronhq/dendron/commit/ae12e1ec39e6d75c9c47e27eff7f96418984da4a))
* skip delayed decoration update if note is closed ([2d91164](https://github.com/dendronhq/dendron/commit/2d9116489b2d1f4d5ccd6d22c022af2da9984817))
* uninstall hook force flush ([#1087](https://github.com/dendronhq/dendron/issues/1087)) ([386aac2](https://github.com/dendronhq/dendron/commit/386aac2b8036cd58c190da99609cef2d3ed2467f))


### Features Dendron

* add journal title override to NoteLookupCommand ([#1140](https://github.com/dendronhq/dendron/issues/1140)) ([173b0c9](https://github.com/dendronhq/dendron/commit/173b0c95d7ca9593e72e2cd1c39e4fdcf31fa64a))
* **calendar:** enable webui by default ([#1127](https://github.com/dendronhq/dendron/issues/1127)) ([3ce8be0](https://github.com/dendronhq/dendron/commit/3ce8be05f50c0fef784eef1b6d02e4816e1bf44a))
* add remaining modifiers to NoteLookup ([#1056](https://github.com/dendronhq/dendron/issues/1056)) ([49c6005](https://github.com/dendronhq/dendron/commit/49c6005d2a2c8fd422eb653977e926084e743d6a)), closes [#1045](https://github.com/dendronhq/dendron/issues/1045) [#1046](https://github.com/dendronhq/dendron/issues/1046)
* add schema suggestion to NoteLookupCommand ([#1113](https://github.com/dendronhq/dendron/issues/1113)) ([7dbd03f](https://github.com/dendronhq/dendron/commit/7dbd03f20586d5174c13a40ed50eecfd8b4c788d))
* add schema templating feature to NoteLookupCommand ([#1118](https://github.com/dendronhq/dendron/issues/1118)) ([8a4cd2b](https://github.com/dendronhq/dendron/commit/8a4cd2b337521abcc25df61e145ef6868c50ea0f))
* Add SchemaLookupCommand ([#1082](https://github.com/dendronhq/dendron/issues/1082)) ([fe11a0e](https://github.com/dendronhq/dendron/commit/fe11a0ea1e0214823dd01842b941456df164bc70))
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* provide YAML validator & suggest YAML extension ([#1116](https://github.com/dendronhq/dendron/issues/1116)) ([b46f091](https://github.com/dendronhq/dendron/commit/b46f0916f9f01fdd7b71b6b5120c38a71d58b113))
* re-engage lapsed users with prompt ([#1086](https://github.com/dendronhq/dendron/issues/1086)) ([f4e6dc5](https://github.com/dendronhq/dendron/commit/f4e6dc563aafdfc0b46966e74d9b38920aee1207))
* rename header updates default link aliases ([1f0e405](https://github.com/dendronhq/dendron/commit/1f0e405d2c67a547fdecc41d76f062251a7cae01))
* resolve vim keybinding conflict on initial install ([#1103](https://github.com/dendronhq/dendron/issues/1103)) ([2278c66](https://github.com/dendronhq/dendron/commit/2278c6616c8297cc414ad02d5323bff5c45072e4))
* seed cmds in plugin ([#1080](https://github.com/dendronhq/dendron/issues/1080)) ([e07a092](https://github.com/dendronhq/dendron/commit/e07a092b1a75548574f2ea45f1b465490b2091f3))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.59.2-alpha.0](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.59.2-alpha.0) (2021-09-15)


### Bug Fixes

* creating scratch when text is selected within a note SHOULD not match scratches just due to prefix ([#1292](https://github.com/dendronhq/dendron/issues/1292)) ([cea4568](https://github.com/dendronhq/dendron/commit/cea456809b0da327bff5e06c1a796323d3eb257f))
* decorations for erased tags persist ([#1291](https://github.com/dendronhq/dendron/issues/1291)) ([e3284f6](https://github.com/dendronhq/dendron/commit/e3284f6449fe36edb81deb2ae4c97612fdf2b8de))
* direct children query ([#1303](https://github.com/dendronhq/dendron/issues/1303)) ([bcf0dea](https://github.com/dendronhq/dendron/commit/bcf0deae422406564cd9a56c1765f90dd2e66215))
* disallow toggling of vault selection behavior in move note ([#1296](https://github.com/dendronhq/dendron/issues/1296)) ([4dc7ca4](https://github.com/dendronhq/dendron/commit/4dc7ca4547bc0c7bcb8eb3e27f64ad7236ef4fd5))
* do not show multi select button on note rename ([#1293](https://github.com/dendronhq/dendron/issues/1293)) ([bd283c1](https://github.com/dendronhq/dendron/commit/bd283c1427f5b1f611885dd8499b2bd5b5bf98c3))
* fix move note to have exact match ([#1331](https://github.com/dendronhq/dendron/issues/1331)) ([a5f4f9b](https://github.com/dendronhq/dendron/commit/a5f4f9b5220d67621e508a68ad2386cd481db21f))
* fixing cmd tab typo in tutorial.2 ([#1234](https://github.com/dendronhq/dendron/issues/1234)) ([6e0543d](https://github.com/dendronhq/dendron/commit/6e0543d5077d40f2e9fc12325d3e111cad7e9a01))
* highlight same file wikilinks, wildcard references, links with anchors ([#1306](https://github.com/dendronhq/dendron/issues/1306)) ([956aa2a](https://github.com/dendronhq/dendron/commit/956aa2a7079eaa93acd2a66ace3c44f3f874c0f8))
* hover provider shouldn't recommend Ctrl+click for missing notes unless configured ([#1276](https://github.com/dendronhq/dendron/issues/1276)) ([cc037b6](https://github.com/dendronhq/dendron/commit/cc037b6e53c21389be8507e8088dc65bff0d7259))
* Ignore lookupConfirm if dailyVault is set ([#1311](https://github.com/dendronhq/dendron/issues/1311)) ([1c734da](https://github.com/dendronhq/dendron/commit/1c734daa45cc1e655638d754267c6bdf5bdcab90))
* issue with init workspace ([94d05c8](https://github.com/dendronhq/dendron/commit/94d05c8f1b6856c769d0cd2964d1dece9decb37c))
* reload index to be silent by default ([#1269](https://github.com/dendronhq/dendron/issues/1269)) ([2c0bf03](https://github.com/dendronhq/dendron/commit/2c0bf03d997ee3abc1f802f80e4b177feb44ae8b))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))
* stop calendar from auto expanding when the last note is closed ([#1299](https://github.com/dendronhq/dendron/issues/1299)) ([9c8f853](https://github.com/dendronhq/dendron/commit/9c8f8533da5027c122e0d003ce4c61dc866735f5))
* unhandled error in insert note link ([#1192](https://github.com/dendronhq/dendron/issues/1192)) ([a73420c](https://github.com/dendronhq/dendron/commit/a73420cd0f3d9f933256be43b839226b15b1e837))
* update links on frontmatter tags changes ([#1214](https://github.com/dendronhq/dendron/issues/1214)) ([4d344fe](https://github.com/dendronhq/dendron/commit/4d344fe40701a259e3ac4399899dab4099c8614f))


### Features Dendron

* Add smart vault selection to NoteLookupCommand ([#1174](https://github.com/dendronhq/dendron/issues/1174)) ([742cab6](https://github.com/dendronhq/dendron/commit/742cab6c683bb14b6baff6c786957a5cc7228894))
* enable usePrettyRefs for nextJS publishing and preview ([#1239](https://github.com/dendronhq/dendron/issues/1239)) ([8a456a9](https://github.com/dendronhq/dendron/commit/8a456a910c45e927c8413d881324bd28401e2aca))
* github publish to create new issue ([#1206](https://github.com/dendronhq/dendron/issues/1206)) ([67abef0](https://github.com/dendronhq/dendron/commit/67abef02c5615385a8a7f82fe290c8a443605a7f))
* run migration command ([#1177](https://github.com/dendronhq/dendron/issues/1177)) ([98bd000](https://github.com/dendronhq/dendron/commit/98bd000236e8c3a7def6b6895fa8d24315c54cf2))
* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))
* user tag autocomplete & user tags updated on rename ([#1278](https://github.com/dendronhq/dendron/issues/1278)) ([9719f99](https://github.com/dendronhq/dendron/commit/9719f99550a2c51c1a22f6fb21ff750bb4115f89))
* user tags ([#1228](https://github.com/dendronhq/dendron/issues/1228)) ([98c0106](https://github.com/dendronhq/dendron/commit/98c0106367e384c130a927484b9ea294eb6f84fa))



## 0.55.2 (2021-08-21)


### Bug Fixes

* force update picker item on button trigger even when value hasn't changed ([#1176](https://github.com/dendronhq/dendron/issues/1176)) ([46449a4](https://github.com/dendronhq/dendron/commit/46449a44009913af6340b26660fd5b5b2a79d57f))



## 0.55.1 (2021-08-17)


### Bug Fixes

* hiding quickpick doesn't dispose of picker ([781923a](https://github.com/dendronhq/dendron/commit/781923a679426ec4f29bd4600e29437ce1902d6f))
* multiple issues with lookupv3 ([1fdd9eb](https://github.com/dendronhq/dendron/commit/1fdd9eb3242b43539572a1993fefd174640c6d83))
* regression with move note command ([5e357b8](https://github.com/dendronhq/dendron/commit/5e357b8995ff335aa36ad48777a96ee56b196c01))


### Features Dendron

* Insert Note Index command ([#1142](https://github.com/dendronhq/dendron/issues/1142)) ([c140015](https://github.com/dendronhq/dendron/commit/c140015c19a942cf4696d596e818fd89905eea25))
* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* accept splitType argument in lookup v2 ([#1102](https://github.com/dendronhq/dendron/issues/1102)) ([a1120e4](https://github.com/dendronhq/dendron/commit/a1120e449af9776a14d2bcbb47f8d877ebd1227b))
* CopyNoteLink copies footnotes as anchors ([#1117](https://github.com/dendronhq/dendron/issues/1117)) ([2168991](https://github.com/dendronhq/dendron/commit/21689914d0c84735d243b988dcceb276df97380f))
* CopyNoteRef respects noXVaultWikiLink option ([#1085](https://github.com/dendronhq/dendron/issues/1085)) ([b4b3da3](https://github.com/dendronhq/dendron/commit/b4b3da3306e2c5621c3c79a53b9f6e4cc31856c6)), closes [#1072](https://github.com/dendronhq/dendron/issues/1072)
* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* extension readme getting started link ([#1084](https://github.com/dendronhq/dendron/issues/1084)) ([d3f5b7d](https://github.com/dendronhq/dendron/commit/d3f5b7dc49873cbbb9e44ce1ff473cd4d95e1214))
* FM tags with quoted strings & with spaces ([1a16689](https://github.com/dendronhq/dendron/commit/1a1668914f70b48a4e74a218bd43521df226de38))
* highlighting is not displayed ([#1083](https://github.com/dendronhq/dendron/issues/1083)) ([86ead9b](https://github.com/dendronhq/dendron/commit/86ead9b7ec66a51712a265f263a515c624f2861c))
* issue with direct child filter partially omitting values in quickpick ([#1123](https://github.com/dendronhq/dendron/issues/1123)) ([fbabab4](https://github.com/dendronhq/dendron/commit/fbabab4b61c91f3ebbe62def339efb32e1815178))
* lookupv3 selection issue ([#1130](https://github.com/dendronhq/dendron/issues/1130)) ([c807e88](https://github.com/dendronhq/dendron/commit/c807e88a82217e5a04dfddb5a24259a50bea4813))
* properly debounce picker update ([#1111](https://github.com/dendronhq/dendron/issues/1111)) ([ae12e1e](https://github.com/dendronhq/dendron/commit/ae12e1ec39e6d75c9c47e27eff7f96418984da4a))
* skip delayed decoration update if note is closed ([2d91164](https://github.com/dendronhq/dendron/commit/2d9116489b2d1f4d5ccd6d22c022af2da9984817))
* uninstall hook force flush ([#1087](https://github.com/dendronhq/dendron/issues/1087)) ([386aac2](https://github.com/dendronhq/dendron/commit/386aac2b8036cd58c190da99609cef2d3ed2467f))


### Features Dendron

* add journal title override to NoteLookupCommand ([#1140](https://github.com/dendronhq/dendron/issues/1140)) ([173b0c9](https://github.com/dendronhq/dendron/commit/173b0c95d7ca9593e72e2cd1c39e4fdcf31fa64a))
* **calendar:** enable webui by default ([#1127](https://github.com/dendronhq/dendron/issues/1127)) ([3ce8be0](https://github.com/dendronhq/dendron/commit/3ce8be05f50c0fef784eef1b6d02e4816e1bf44a))
* add remaining modifiers to NoteLookup ([#1056](https://github.com/dendronhq/dendron/issues/1056)) ([49c6005](https://github.com/dendronhq/dendron/commit/49c6005d2a2c8fd422eb653977e926084e743d6a)), closes [#1045](https://github.com/dendronhq/dendron/issues/1045) [#1046](https://github.com/dendronhq/dendron/issues/1046)
* add schema suggestion to NoteLookupCommand ([#1113](https://github.com/dendronhq/dendron/issues/1113)) ([7dbd03f](https://github.com/dendronhq/dendron/commit/7dbd03f20586d5174c13a40ed50eecfd8b4c788d))
* add schema templating feature to NoteLookupCommand ([#1118](https://github.com/dendronhq/dendron/issues/1118)) ([8a4cd2b](https://github.com/dendronhq/dendron/commit/8a4cd2b337521abcc25df61e145ef6868c50ea0f))
* Add SchemaLookupCommand ([#1082](https://github.com/dendronhq/dendron/issues/1082)) ([fe11a0e](https://github.com/dendronhq/dendron/commit/fe11a0ea1e0214823dd01842b941456df164bc70))
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* provide YAML validator & suggest YAML extension ([#1116](https://github.com/dendronhq/dendron/issues/1116)) ([b46f091](https://github.com/dendronhq/dendron/commit/b46f0916f9f01fdd7b71b6b5120c38a71d58b113))
* re-engage lapsed users with prompt ([#1086](https://github.com/dendronhq/dendron/issues/1086)) ([f4e6dc5](https://github.com/dendronhq/dendron/commit/f4e6dc563aafdfc0b46966e74d9b38920aee1207))
* rename header updates default link aliases ([1f0e405](https://github.com/dendronhq/dendron/commit/1f0e405d2c67a547fdecc41d76f062251a7cae01))
* resolve vim keybinding conflict on initial install ([#1103](https://github.com/dendronhq/dendron/issues/1103)) ([2278c66](https://github.com/dendronhq/dendron/commit/2278c6616c8297cc414ad02d5323bff5c45072e4))
* seed cmds in plugin ([#1080](https://github.com/dendronhq/dendron/issues/1080)) ([e07a092](https://github.com/dendronhq/dendron/commit/e07a092b1a75548574f2ea45f1b465490b2091f3))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.59.1](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.59.1) (2021-09-14)


### Bug Fixes

* creating scratch when text is selected within a note SHOULD not match scratches just due to prefix ([#1292](https://github.com/dendronhq/dendron/issues/1292)) ([cea4568](https://github.com/dendronhq/dendron/commit/cea456809b0da327bff5e06c1a796323d3eb257f))
* decorations for erased tags persist ([#1291](https://github.com/dendronhq/dendron/issues/1291)) ([e3284f6](https://github.com/dendronhq/dendron/commit/e3284f6449fe36edb81deb2ae4c97612fdf2b8de))
* direct children query ([#1303](https://github.com/dendronhq/dendron/issues/1303)) ([bcf0dea](https://github.com/dendronhq/dendron/commit/bcf0deae422406564cd9a56c1765f90dd2e66215))
* disallow toggling of vault selection behavior in move note ([#1296](https://github.com/dendronhq/dendron/issues/1296)) ([4dc7ca4](https://github.com/dendronhq/dendron/commit/4dc7ca4547bc0c7bcb8eb3e27f64ad7236ef4fd5))
* do not show multi select button on note rename ([#1293](https://github.com/dendronhq/dendron/issues/1293)) ([bd283c1](https://github.com/dendronhq/dendron/commit/bd283c1427f5b1f611885dd8499b2bd5b5bf98c3))
* fix move note to have exact match ([#1331](https://github.com/dendronhq/dendron/issues/1331)) ([a5f4f9b](https://github.com/dendronhq/dendron/commit/a5f4f9b5220d67621e508a68ad2386cd481db21f))
* fixing cmd tab typo in tutorial.2 ([#1234](https://github.com/dendronhq/dendron/issues/1234)) ([6e0543d](https://github.com/dendronhq/dendron/commit/6e0543d5077d40f2e9fc12325d3e111cad7e9a01))
* highlight same file wikilinks, wildcard references, links with anchors ([#1306](https://github.com/dendronhq/dendron/issues/1306)) ([956aa2a](https://github.com/dendronhq/dendron/commit/956aa2a7079eaa93acd2a66ace3c44f3f874c0f8))
* hover provider shouldn't recommend Ctrl+click for missing notes unless configured ([#1276](https://github.com/dendronhq/dendron/issues/1276)) ([cc037b6](https://github.com/dendronhq/dendron/commit/cc037b6e53c21389be8507e8088dc65bff0d7259))
* Ignore lookupConfirm if dailyVault is set ([#1311](https://github.com/dendronhq/dendron/issues/1311)) ([1c734da](https://github.com/dendronhq/dendron/commit/1c734daa45cc1e655638d754267c6bdf5bdcab90))
* issue with init workspace ([94d05c8](https://github.com/dendronhq/dendron/commit/94d05c8f1b6856c769d0cd2964d1dece9decb37c))
* reload index to be silent by default ([#1269](https://github.com/dendronhq/dendron/issues/1269)) ([2c0bf03](https://github.com/dendronhq/dendron/commit/2c0bf03d997ee3abc1f802f80e4b177feb44ae8b))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))
* stop calendar from auto expanding when the last note is closed ([#1299](https://github.com/dendronhq/dendron/issues/1299)) ([9c8f853](https://github.com/dendronhq/dendron/commit/9c8f8533da5027c122e0d003ce4c61dc866735f5))
* unhandled error in insert note link ([#1192](https://github.com/dendronhq/dendron/issues/1192)) ([a73420c](https://github.com/dendronhq/dendron/commit/a73420cd0f3d9f933256be43b839226b15b1e837))
* update links on frontmatter tags changes ([#1214](https://github.com/dendronhq/dendron/issues/1214)) ([4d344fe](https://github.com/dendronhq/dendron/commit/4d344fe40701a259e3ac4399899dab4099c8614f))


### Features Dendron

* Add smart vault selection to NoteLookupCommand ([#1174](https://github.com/dendronhq/dendron/issues/1174)) ([742cab6](https://github.com/dendronhq/dendron/commit/742cab6c683bb14b6baff6c786957a5cc7228894))
* enable usePrettyRefs for nextJS publishing and preview ([#1239](https://github.com/dendronhq/dendron/issues/1239)) ([8a456a9](https://github.com/dendronhq/dendron/commit/8a456a910c45e927c8413d881324bd28401e2aca))
* github publish to create new issue ([#1206](https://github.com/dendronhq/dendron/issues/1206)) ([67abef0](https://github.com/dendronhq/dendron/commit/67abef02c5615385a8a7f82fe290c8a443605a7f))
* run migration command ([#1177](https://github.com/dendronhq/dendron/issues/1177)) ([98bd000](https://github.com/dendronhq/dendron/commit/98bd000236e8c3a7def6b6895fa8d24315c54cf2))
* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))
* user tag autocomplete & user tags updated on rename ([#1278](https://github.com/dendronhq/dendron/issues/1278)) ([9719f99](https://github.com/dendronhq/dendron/commit/9719f99550a2c51c1a22f6fb21ff750bb4115f89))
* user tags ([#1228](https://github.com/dendronhq/dendron/issues/1228)) ([98c0106](https://github.com/dendronhq/dendron/commit/98c0106367e384c130a927484b9ea294eb6f84fa))



## 0.55.2 (2021-08-21)


### Bug Fixes

* force update picker item on button trigger even when value hasn't changed ([#1176](https://github.com/dendronhq/dendron/issues/1176)) ([46449a4](https://github.com/dendronhq/dendron/commit/46449a44009913af6340b26660fd5b5b2a79d57f))



## 0.55.1 (2021-08-17)


### Bug Fixes

* hiding quickpick doesn't dispose of picker ([781923a](https://github.com/dendronhq/dendron/commit/781923a679426ec4f29bd4600e29437ce1902d6f))
* multiple issues with lookupv3 ([1fdd9eb](https://github.com/dendronhq/dendron/commit/1fdd9eb3242b43539572a1993fefd174640c6d83))
* regression with move note command ([5e357b8](https://github.com/dendronhq/dendron/commit/5e357b8995ff335aa36ad48777a96ee56b196c01))


### Features Dendron

* Insert Note Index command ([#1142](https://github.com/dendronhq/dendron/issues/1142)) ([c140015](https://github.com/dendronhq/dendron/commit/c140015c19a942cf4696d596e818fd89905eea25))
* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* accept splitType argument in lookup v2 ([#1102](https://github.com/dendronhq/dendron/issues/1102)) ([a1120e4](https://github.com/dendronhq/dendron/commit/a1120e449af9776a14d2bcbb47f8d877ebd1227b))
* CopyNoteLink copies footnotes as anchors ([#1117](https://github.com/dendronhq/dendron/issues/1117)) ([2168991](https://github.com/dendronhq/dendron/commit/21689914d0c84735d243b988dcceb276df97380f))
* CopyNoteRef respects noXVaultWikiLink option ([#1085](https://github.com/dendronhq/dendron/issues/1085)) ([b4b3da3](https://github.com/dendronhq/dendron/commit/b4b3da3306e2c5621c3c79a53b9f6e4cc31856c6)), closes [#1072](https://github.com/dendronhq/dendron/issues/1072)
* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* extension readme getting started link ([#1084](https://github.com/dendronhq/dendron/issues/1084)) ([d3f5b7d](https://github.com/dendronhq/dendron/commit/d3f5b7dc49873cbbb9e44ce1ff473cd4d95e1214))
* FM tags with quoted strings & with spaces ([1a16689](https://github.com/dendronhq/dendron/commit/1a1668914f70b48a4e74a218bd43521df226de38))
* highlighting is not displayed ([#1083](https://github.com/dendronhq/dendron/issues/1083)) ([86ead9b](https://github.com/dendronhq/dendron/commit/86ead9b7ec66a51712a265f263a515c624f2861c))
* issue with direct child filter partially omitting values in quickpick ([#1123](https://github.com/dendronhq/dendron/issues/1123)) ([fbabab4](https://github.com/dendronhq/dendron/commit/fbabab4b61c91f3ebbe62def339efb32e1815178))
* lookupv3 selection issue ([#1130](https://github.com/dendronhq/dendron/issues/1130)) ([c807e88](https://github.com/dendronhq/dendron/commit/c807e88a82217e5a04dfddb5a24259a50bea4813))
* properly debounce picker update ([#1111](https://github.com/dendronhq/dendron/issues/1111)) ([ae12e1e](https://github.com/dendronhq/dendron/commit/ae12e1ec39e6d75c9c47e27eff7f96418984da4a))
* skip delayed decoration update if note is closed ([2d91164](https://github.com/dendronhq/dendron/commit/2d9116489b2d1f4d5ccd6d22c022af2da9984817))
* uninstall hook force flush ([#1087](https://github.com/dendronhq/dendron/issues/1087)) ([386aac2](https://github.com/dendronhq/dendron/commit/386aac2b8036cd58c190da99609cef2d3ed2467f))


### Features Dendron

* add journal title override to NoteLookupCommand ([#1140](https://github.com/dendronhq/dendron/issues/1140)) ([173b0c9](https://github.com/dendronhq/dendron/commit/173b0c95d7ca9593e72e2cd1c39e4fdcf31fa64a))
* **calendar:** enable webui by default ([#1127](https://github.com/dendronhq/dendron/issues/1127)) ([3ce8be0](https://github.com/dendronhq/dendron/commit/3ce8be05f50c0fef784eef1b6d02e4816e1bf44a))
* add remaining modifiers to NoteLookup ([#1056](https://github.com/dendronhq/dendron/issues/1056)) ([49c6005](https://github.com/dendronhq/dendron/commit/49c6005d2a2c8fd422eb653977e926084e743d6a)), closes [#1045](https://github.com/dendronhq/dendron/issues/1045) [#1046](https://github.com/dendronhq/dendron/issues/1046)
* add schema suggestion to NoteLookupCommand ([#1113](https://github.com/dendronhq/dendron/issues/1113)) ([7dbd03f](https://github.com/dendronhq/dendron/commit/7dbd03f20586d5174c13a40ed50eecfd8b4c788d))
* add schema templating feature to NoteLookupCommand ([#1118](https://github.com/dendronhq/dendron/issues/1118)) ([8a4cd2b](https://github.com/dendronhq/dendron/commit/8a4cd2b337521abcc25df61e145ef6868c50ea0f))
* Add SchemaLookupCommand ([#1082](https://github.com/dendronhq/dendron/issues/1082)) ([fe11a0e](https://github.com/dendronhq/dendron/commit/fe11a0ea1e0214823dd01842b941456df164bc70))
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* provide YAML validator & suggest YAML extension ([#1116](https://github.com/dendronhq/dendron/issues/1116)) ([b46f091](https://github.com/dendronhq/dendron/commit/b46f0916f9f01fdd7b71b6b5120c38a71d58b113))
* re-engage lapsed users with prompt ([#1086](https://github.com/dendronhq/dendron/issues/1086)) ([f4e6dc5](https://github.com/dendronhq/dendron/commit/f4e6dc563aafdfc0b46966e74d9b38920aee1207))
* rename header updates default link aliases ([1f0e405](https://github.com/dendronhq/dendron/commit/1f0e405d2c67a547fdecc41d76f062251a7cae01))
* resolve vim keybinding conflict on initial install ([#1103](https://github.com/dendronhq/dendron/issues/1103)) ([2278c66](https://github.com/dendronhq/dendron/commit/2278c6616c8297cc414ad02d5323bff5c45072e4))
* seed cmds in plugin ([#1080](https://github.com/dendronhq/dendron/issues/1080)) ([e07a092](https://github.com/dendronhq/dendron/commit/e07a092b1a75548574f2ea45f1b465490b2091f3))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





# [0.59.0](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.59.0) (2021-09-14)


### Bug Fixes

* creating scratch when text is selected within a note SHOULD not match scratches just due to prefix ([#1292](https://github.com/dendronhq/dendron/issues/1292)) ([cea4568](https://github.com/dendronhq/dendron/commit/cea456809b0da327bff5e06c1a796323d3eb257f))
* decorations for erased tags persist ([#1291](https://github.com/dendronhq/dendron/issues/1291)) ([e3284f6](https://github.com/dendronhq/dendron/commit/e3284f6449fe36edb81deb2ae4c97612fdf2b8de))
* direct children query ([#1303](https://github.com/dendronhq/dendron/issues/1303)) ([bcf0dea](https://github.com/dendronhq/dendron/commit/bcf0deae422406564cd9a56c1765f90dd2e66215))
* disallow toggling of vault selection behavior in move note ([#1296](https://github.com/dendronhq/dendron/issues/1296)) ([4dc7ca4](https://github.com/dendronhq/dendron/commit/4dc7ca4547bc0c7bcb8eb3e27f64ad7236ef4fd5))
* do not show multi select button on note rename ([#1293](https://github.com/dendronhq/dendron/issues/1293)) ([bd283c1](https://github.com/dendronhq/dendron/commit/bd283c1427f5b1f611885dd8499b2bd5b5bf98c3))
* fix move note to have exact match ([#1331](https://github.com/dendronhq/dendron/issues/1331)) ([a5f4f9b](https://github.com/dendronhq/dendron/commit/a5f4f9b5220d67621e508a68ad2386cd481db21f))
* fixing cmd tab typo in tutorial.2 ([#1234](https://github.com/dendronhq/dendron/issues/1234)) ([6e0543d](https://github.com/dendronhq/dendron/commit/6e0543d5077d40f2e9fc12325d3e111cad7e9a01))
* highlight same file wikilinks, wildcard references, links with anchors ([#1306](https://github.com/dendronhq/dendron/issues/1306)) ([956aa2a](https://github.com/dendronhq/dendron/commit/956aa2a7079eaa93acd2a66ace3c44f3f874c0f8))
* hover provider shouldn't recommend Ctrl+click for missing notes unless configured ([#1276](https://github.com/dendronhq/dendron/issues/1276)) ([cc037b6](https://github.com/dendronhq/dendron/commit/cc037b6e53c21389be8507e8088dc65bff0d7259))
* Ignore lookupConfirm if dailyVault is set ([#1311](https://github.com/dendronhq/dendron/issues/1311)) ([1c734da](https://github.com/dendronhq/dendron/commit/1c734daa45cc1e655638d754267c6bdf5bdcab90))
* issue with init workspace ([94d05c8](https://github.com/dendronhq/dendron/commit/94d05c8f1b6856c769d0cd2964d1dece9decb37c))
* reload index to be silent by default ([#1269](https://github.com/dendronhq/dendron/issues/1269)) ([2c0bf03](https://github.com/dendronhq/dendron/commit/2c0bf03d997ee3abc1f802f80e4b177feb44ae8b))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))
* stop calendar from auto expanding when the last note is closed ([#1299](https://github.com/dendronhq/dendron/issues/1299)) ([9c8f853](https://github.com/dendronhq/dendron/commit/9c8f8533da5027c122e0d003ce4c61dc866735f5))
* unhandled error in insert note link ([#1192](https://github.com/dendronhq/dendron/issues/1192)) ([a73420c](https://github.com/dendronhq/dendron/commit/a73420cd0f3d9f933256be43b839226b15b1e837))
* update links on frontmatter tags changes ([#1214](https://github.com/dendronhq/dendron/issues/1214)) ([4d344fe](https://github.com/dendronhq/dendron/commit/4d344fe40701a259e3ac4399899dab4099c8614f))


### Features Dendron

* Add smart vault selection to NoteLookupCommand ([#1174](https://github.com/dendronhq/dendron/issues/1174)) ([742cab6](https://github.com/dendronhq/dendron/commit/742cab6c683bb14b6baff6c786957a5cc7228894))
* enable usePrettyRefs for nextJS publishing and preview ([#1239](https://github.com/dendronhq/dendron/issues/1239)) ([8a456a9](https://github.com/dendronhq/dendron/commit/8a456a910c45e927c8413d881324bd28401e2aca))
* github publish to create new issue ([#1206](https://github.com/dendronhq/dendron/issues/1206)) ([67abef0](https://github.com/dendronhq/dendron/commit/67abef02c5615385a8a7f82fe290c8a443605a7f))
* run migration command ([#1177](https://github.com/dendronhq/dendron/issues/1177)) ([98bd000](https://github.com/dendronhq/dendron/commit/98bd000236e8c3a7def6b6895fa8d24315c54cf2))
* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))
* user tag autocomplete & user tags updated on rename ([#1278](https://github.com/dendronhq/dendron/issues/1278)) ([9719f99](https://github.com/dendronhq/dendron/commit/9719f99550a2c51c1a22f6fb21ff750bb4115f89))
* user tags ([#1228](https://github.com/dendronhq/dendron/issues/1228)) ([98c0106](https://github.com/dendronhq/dendron/commit/98c0106367e384c130a927484b9ea294eb6f84fa))



## 0.55.2 (2021-08-21)


### Bug Fixes

* force update picker item on button trigger even when value hasn't changed ([#1176](https://github.com/dendronhq/dendron/issues/1176)) ([46449a4](https://github.com/dendronhq/dendron/commit/46449a44009913af6340b26660fd5b5b2a79d57f))



## 0.55.1 (2021-08-17)


### Bug Fixes

* hiding quickpick doesn't dispose of picker ([781923a](https://github.com/dendronhq/dendron/commit/781923a679426ec4f29bd4600e29437ce1902d6f))
* multiple issues with lookupv3 ([1fdd9eb](https://github.com/dendronhq/dendron/commit/1fdd9eb3242b43539572a1993fefd174640c6d83))
* regression with move note command ([5e357b8](https://github.com/dendronhq/dendron/commit/5e357b8995ff335aa36ad48777a96ee56b196c01))


### Features Dendron

* Insert Note Index command ([#1142](https://github.com/dendronhq/dendron/issues/1142)) ([c140015](https://github.com/dendronhq/dendron/commit/c140015c19a942cf4696d596e818fd89905eea25))
* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* accept splitType argument in lookup v2 ([#1102](https://github.com/dendronhq/dendron/issues/1102)) ([a1120e4](https://github.com/dendronhq/dendron/commit/a1120e449af9776a14d2bcbb47f8d877ebd1227b))
* CopyNoteLink copies footnotes as anchors ([#1117](https://github.com/dendronhq/dendron/issues/1117)) ([2168991](https://github.com/dendronhq/dendron/commit/21689914d0c84735d243b988dcceb276df97380f))
* CopyNoteRef respects noXVaultWikiLink option ([#1085](https://github.com/dendronhq/dendron/issues/1085)) ([b4b3da3](https://github.com/dendronhq/dendron/commit/b4b3da3306e2c5621c3c79a53b9f6e4cc31856c6)), closes [#1072](https://github.com/dendronhq/dendron/issues/1072)
* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* extension readme getting started link ([#1084](https://github.com/dendronhq/dendron/issues/1084)) ([d3f5b7d](https://github.com/dendronhq/dendron/commit/d3f5b7dc49873cbbb9e44ce1ff473cd4d95e1214))
* FM tags with quoted strings & with spaces ([1a16689](https://github.com/dendronhq/dendron/commit/1a1668914f70b48a4e74a218bd43521df226de38))
* highlighting is not displayed ([#1083](https://github.com/dendronhq/dendron/issues/1083)) ([86ead9b](https://github.com/dendronhq/dendron/commit/86ead9b7ec66a51712a265f263a515c624f2861c))
* issue with direct child filter partially omitting values in quickpick ([#1123](https://github.com/dendronhq/dendron/issues/1123)) ([fbabab4](https://github.com/dendronhq/dendron/commit/fbabab4b61c91f3ebbe62def339efb32e1815178))
* lookupv3 selection issue ([#1130](https://github.com/dendronhq/dendron/issues/1130)) ([c807e88](https://github.com/dendronhq/dendron/commit/c807e88a82217e5a04dfddb5a24259a50bea4813))
* properly debounce picker update ([#1111](https://github.com/dendronhq/dendron/issues/1111)) ([ae12e1e](https://github.com/dendronhq/dendron/commit/ae12e1ec39e6d75c9c47e27eff7f96418984da4a))
* skip delayed decoration update if note is closed ([2d91164](https://github.com/dendronhq/dendron/commit/2d9116489b2d1f4d5ccd6d22c022af2da9984817))
* uninstall hook force flush ([#1087](https://github.com/dendronhq/dendron/issues/1087)) ([386aac2](https://github.com/dendronhq/dendron/commit/386aac2b8036cd58c190da99609cef2d3ed2467f))


### Features Dendron

* add journal title override to NoteLookupCommand ([#1140](https://github.com/dendronhq/dendron/issues/1140)) ([173b0c9](https://github.com/dendronhq/dendron/commit/173b0c95d7ca9593e72e2cd1c39e4fdcf31fa64a))
* **calendar:** enable webui by default ([#1127](https://github.com/dendronhq/dendron/issues/1127)) ([3ce8be0](https://github.com/dendronhq/dendron/commit/3ce8be05f50c0fef784eef1b6d02e4816e1bf44a))
* add remaining modifiers to NoteLookup ([#1056](https://github.com/dendronhq/dendron/issues/1056)) ([49c6005](https://github.com/dendronhq/dendron/commit/49c6005d2a2c8fd422eb653977e926084e743d6a)), closes [#1045](https://github.com/dendronhq/dendron/issues/1045) [#1046](https://github.com/dendronhq/dendron/issues/1046)
* add schema suggestion to NoteLookupCommand ([#1113](https://github.com/dendronhq/dendron/issues/1113)) ([7dbd03f](https://github.com/dendronhq/dendron/commit/7dbd03f20586d5174c13a40ed50eecfd8b4c788d))
* add schema templating feature to NoteLookupCommand ([#1118](https://github.com/dendronhq/dendron/issues/1118)) ([8a4cd2b](https://github.com/dendronhq/dendron/commit/8a4cd2b337521abcc25df61e145ef6868c50ea0f))
* Add SchemaLookupCommand ([#1082](https://github.com/dendronhq/dendron/issues/1082)) ([fe11a0e](https://github.com/dendronhq/dendron/commit/fe11a0ea1e0214823dd01842b941456df164bc70))
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* provide YAML validator & suggest YAML extension ([#1116](https://github.com/dendronhq/dendron/issues/1116)) ([b46f091](https://github.com/dendronhq/dendron/commit/b46f0916f9f01fdd7b71b6b5120c38a71d58b113))
* re-engage lapsed users with prompt ([#1086](https://github.com/dendronhq/dendron/issues/1086)) ([f4e6dc5](https://github.com/dendronhq/dendron/commit/f4e6dc563aafdfc0b46966e74d9b38920aee1207))
* rename header updates default link aliases ([1f0e405](https://github.com/dendronhq/dendron/commit/1f0e405d2c67a547fdecc41d76f062251a7cae01))
* resolve vim keybinding conflict on initial install ([#1103](https://github.com/dendronhq/dendron/issues/1103)) ([2278c66](https://github.com/dendronhq/dendron/commit/2278c6616c8297cc414ad02d5323bff5c45072e4))
* seed cmds in plugin ([#1080](https://github.com/dendronhq/dendron/issues/1080)) ([e07a092](https://github.com/dendronhq/dendron/commit/e07a092b1a75548574f2ea45f1b465490b2091f3))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.58.4](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.58.4) (2021-09-12)


### Bug Fixes

* creating scratch when text is selected within a note SHOULD not match scratches just due to prefix ([#1292](https://github.com/dendronhq/dendron/issues/1292)) ([cea4568](https://github.com/dendronhq/dendron/commit/cea456809b0da327bff5e06c1a796323d3eb257f))
* decorations for erased tags persist ([#1291](https://github.com/dendronhq/dendron/issues/1291)) ([e3284f6](https://github.com/dendronhq/dendron/commit/e3284f6449fe36edb81deb2ae4c97612fdf2b8de))
* direct children query ([#1303](https://github.com/dendronhq/dendron/issues/1303)) ([bcf0dea](https://github.com/dendronhq/dendron/commit/bcf0deae422406564cd9a56c1765f90dd2e66215))
* do not show multi select button on note rename ([#1293](https://github.com/dendronhq/dendron/issues/1293)) ([bd283c1](https://github.com/dendronhq/dendron/commit/bd283c1427f5b1f611885dd8499b2bd5b5bf98c3))
* fixing cmd tab typo in tutorial.2 ([#1234](https://github.com/dendronhq/dendron/issues/1234)) ([6e0543d](https://github.com/dendronhq/dendron/commit/6e0543d5077d40f2e9fc12325d3e111cad7e9a01))
* highlight same file wikilinks, wildcard references, links with anchors ([#1306](https://github.com/dendronhq/dendron/issues/1306)) ([956aa2a](https://github.com/dendronhq/dendron/commit/956aa2a7079eaa93acd2a66ace3c44f3f874c0f8))
* hover provider shouldn't recommend Ctrl+click for missing notes unless configured ([#1276](https://github.com/dendronhq/dendron/issues/1276)) ([cc037b6](https://github.com/dendronhq/dendron/commit/cc037b6e53c21389be8507e8088dc65bff0d7259))
* Ignore lookupConfirm if dailyVault is set ([#1311](https://github.com/dendronhq/dendron/issues/1311)) ([1c734da](https://github.com/dendronhq/dendron/commit/1c734daa45cc1e655638d754267c6bdf5bdcab90))
* issue with init workspace ([94d05c8](https://github.com/dendronhq/dendron/commit/94d05c8f1b6856c769d0cd2964d1dece9decb37c))
* reload index to be silent by default ([#1269](https://github.com/dendronhq/dendron/issues/1269)) ([2c0bf03](https://github.com/dendronhq/dendron/commit/2c0bf03d997ee3abc1f802f80e4b177feb44ae8b))
* stop calendar from auto expanding when the last note is closed ([#1299](https://github.com/dendronhq/dendron/issues/1299)) ([9c8f853](https://github.com/dendronhq/dendron/commit/9c8f8533da5027c122e0d003ce4c61dc866735f5))
* unhandled error in insert note link ([#1192](https://github.com/dendronhq/dendron/issues/1192)) ([a73420c](https://github.com/dendronhq/dendron/commit/a73420cd0f3d9f933256be43b839226b15b1e837))
* update links on frontmatter tags changes ([#1214](https://github.com/dendronhq/dendron/issues/1214)) ([4d344fe](https://github.com/dendronhq/dendron/commit/4d344fe40701a259e3ac4399899dab4099c8614f))


### Features Dendron

* Add smart vault selection to NoteLookupCommand ([#1174](https://github.com/dendronhq/dendron/issues/1174)) ([742cab6](https://github.com/dendronhq/dendron/commit/742cab6c683bb14b6baff6c786957a5cc7228894))
* enable usePrettyRefs for nextJS publishing and preview ([#1239](https://github.com/dendronhq/dendron/issues/1239)) ([8a456a9](https://github.com/dendronhq/dendron/commit/8a456a910c45e927c8413d881324bd28401e2aca))
* github publish to create new issue ([#1206](https://github.com/dendronhq/dendron/issues/1206)) ([67abef0](https://github.com/dendronhq/dendron/commit/67abef02c5615385a8a7f82fe290c8a443605a7f))
* run migration command ([#1177](https://github.com/dendronhq/dendron/issues/1177)) ([98bd000](https://github.com/dendronhq/dendron/commit/98bd000236e8c3a7def6b6895fa8d24315c54cf2))
* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))
* user tag autocomplete & user tags updated on rename ([#1278](https://github.com/dendronhq/dendron/issues/1278)) ([9719f99](https://github.com/dendronhq/dendron/commit/9719f99550a2c51c1a22f6fb21ff750bb4115f89))
* user tags ([#1228](https://github.com/dendronhq/dendron/issues/1228)) ([98c0106](https://github.com/dendronhq/dendron/commit/98c0106367e384c130a927484b9ea294eb6f84fa))



## 0.55.2 (2021-08-21)


### Bug Fixes

* force update picker item on button trigger even when value hasn't changed ([#1176](https://github.com/dendronhq/dendron/issues/1176)) ([46449a4](https://github.com/dendronhq/dendron/commit/46449a44009913af6340b26660fd5b5b2a79d57f))



## 0.55.1 (2021-08-17)


### Bug Fixes

* hiding quickpick doesn't dispose of picker ([781923a](https://github.com/dendronhq/dendron/commit/781923a679426ec4f29bd4600e29437ce1902d6f))
* multiple issues with lookupv3 ([1fdd9eb](https://github.com/dendronhq/dendron/commit/1fdd9eb3242b43539572a1993fefd174640c6d83))
* regression with move note command ([5e357b8](https://github.com/dendronhq/dendron/commit/5e357b8995ff335aa36ad48777a96ee56b196c01))


### Features Dendron

* Insert Note Index command ([#1142](https://github.com/dendronhq/dendron/issues/1142)) ([c140015](https://github.com/dendronhq/dendron/commit/c140015c19a942cf4696d596e818fd89905eea25))
* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* accept splitType argument in lookup v2 ([#1102](https://github.com/dendronhq/dendron/issues/1102)) ([a1120e4](https://github.com/dendronhq/dendron/commit/a1120e449af9776a14d2bcbb47f8d877ebd1227b))
* CopyNoteLink copies footnotes as anchors ([#1117](https://github.com/dendronhq/dendron/issues/1117)) ([2168991](https://github.com/dendronhq/dendron/commit/21689914d0c84735d243b988dcceb276df97380f))
* CopyNoteRef respects noXVaultWikiLink option ([#1085](https://github.com/dendronhq/dendron/issues/1085)) ([b4b3da3](https://github.com/dendronhq/dendron/commit/b4b3da3306e2c5621c3c79a53b9f6e4cc31856c6)), closes [#1072](https://github.com/dendronhq/dendron/issues/1072)
* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* extension readme getting started link ([#1084](https://github.com/dendronhq/dendron/issues/1084)) ([d3f5b7d](https://github.com/dendronhq/dendron/commit/d3f5b7dc49873cbbb9e44ce1ff473cd4d95e1214))
* FM tags with quoted strings & with spaces ([1a16689](https://github.com/dendronhq/dendron/commit/1a1668914f70b48a4e74a218bd43521df226de38))
* highlighting is not displayed ([#1083](https://github.com/dendronhq/dendron/issues/1083)) ([86ead9b](https://github.com/dendronhq/dendron/commit/86ead9b7ec66a51712a265f263a515c624f2861c))
* issue with direct child filter partially omitting values in quickpick ([#1123](https://github.com/dendronhq/dendron/issues/1123)) ([fbabab4](https://github.com/dendronhq/dendron/commit/fbabab4b61c91f3ebbe62def339efb32e1815178))
* lookupv3 selection issue ([#1130](https://github.com/dendronhq/dendron/issues/1130)) ([c807e88](https://github.com/dendronhq/dendron/commit/c807e88a82217e5a04dfddb5a24259a50bea4813))
* properly debounce picker update ([#1111](https://github.com/dendronhq/dendron/issues/1111)) ([ae12e1e](https://github.com/dendronhq/dendron/commit/ae12e1ec39e6d75c9c47e27eff7f96418984da4a))
* skip delayed decoration update if note is closed ([2d91164](https://github.com/dendronhq/dendron/commit/2d9116489b2d1f4d5ccd6d22c022af2da9984817))
* uninstall hook force flush ([#1087](https://github.com/dendronhq/dendron/issues/1087)) ([386aac2](https://github.com/dendronhq/dendron/commit/386aac2b8036cd58c190da99609cef2d3ed2467f))


### Features Dendron

* add journal title override to NoteLookupCommand ([#1140](https://github.com/dendronhq/dendron/issues/1140)) ([173b0c9](https://github.com/dendronhq/dendron/commit/173b0c95d7ca9593e72e2cd1c39e4fdcf31fa64a))
* **calendar:** enable webui by default ([#1127](https://github.com/dendronhq/dendron/issues/1127)) ([3ce8be0](https://github.com/dendronhq/dendron/commit/3ce8be05f50c0fef784eef1b6d02e4816e1bf44a))
* add remaining modifiers to NoteLookup ([#1056](https://github.com/dendronhq/dendron/issues/1056)) ([49c6005](https://github.com/dendronhq/dendron/commit/49c6005d2a2c8fd422eb653977e926084e743d6a)), closes [#1045](https://github.com/dendronhq/dendron/issues/1045) [#1046](https://github.com/dendronhq/dendron/issues/1046)
* add schema suggestion to NoteLookupCommand ([#1113](https://github.com/dendronhq/dendron/issues/1113)) ([7dbd03f](https://github.com/dendronhq/dendron/commit/7dbd03f20586d5174c13a40ed50eecfd8b4c788d))
* add schema templating feature to NoteLookupCommand ([#1118](https://github.com/dendronhq/dendron/issues/1118)) ([8a4cd2b](https://github.com/dendronhq/dendron/commit/8a4cd2b337521abcc25df61e145ef6868c50ea0f))
* Add SchemaLookupCommand ([#1082](https://github.com/dendronhq/dendron/issues/1082)) ([fe11a0e](https://github.com/dendronhq/dendron/commit/fe11a0ea1e0214823dd01842b941456df164bc70))
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* provide YAML validator & suggest YAML extension ([#1116](https://github.com/dendronhq/dendron/issues/1116)) ([b46f091](https://github.com/dendronhq/dendron/commit/b46f0916f9f01fdd7b71b6b5120c38a71d58b113))
* re-engage lapsed users with prompt ([#1086](https://github.com/dendronhq/dendron/issues/1086)) ([f4e6dc5](https://github.com/dendronhq/dendron/commit/f4e6dc563aafdfc0b46966e74d9b38920aee1207))
* rename header updates default link aliases ([1f0e405](https://github.com/dendronhq/dendron/commit/1f0e405d2c67a547fdecc41d76f062251a7cae01))
* resolve vim keybinding conflict on initial install ([#1103](https://github.com/dendronhq/dendron/issues/1103)) ([2278c66](https://github.com/dendronhq/dendron/commit/2278c6616c8297cc414ad02d5323bff5c45072e4))
* seed cmds in plugin ([#1080](https://github.com/dendronhq/dendron/issues/1080)) ([e07a092](https://github.com/dendronhq/dendron/commit/e07a092b1a75548574f2ea45f1b465490b2091f3))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.58.4-alpha.3](https://github.com/dendronhq/dendron/compare/v0.58.4-alpha.1...v0.58.4-alpha.3) (2021-09-10)

**Note:** Version bump only for package @dendronhq/plugin-core





## [0.58.4-alpha.2](https://github.com/dendronhq/dendron/compare/v0.58.4-alpha.1...v0.58.4-alpha.2) (2021-09-10)

**Note:** Version bump only for package @dendronhq/plugin-core





## [0.58.4-alpha.1](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.58.4-alpha.1) (2021-09-10)


### Bug Fixes

* creating scratch when text is selected within a note SHOULD not match scratches just due to prefix ([#1292](https://github.com/dendronhq/dendron/issues/1292)) ([cea4568](https://github.com/dendronhq/dendron/commit/cea456809b0da327bff5e06c1a796323d3eb257f))
* decorations for erased tags persist ([#1291](https://github.com/dendronhq/dendron/issues/1291)) ([e3284f6](https://github.com/dendronhq/dendron/commit/e3284f6449fe36edb81deb2ae4c97612fdf2b8de))
* direct children query ([#1303](https://github.com/dendronhq/dendron/issues/1303)) ([bcf0dea](https://github.com/dendronhq/dendron/commit/bcf0deae422406564cd9a56c1765f90dd2e66215))
* do not show multi select button on note rename ([#1293](https://github.com/dendronhq/dendron/issues/1293)) ([bd283c1](https://github.com/dendronhq/dendron/commit/bd283c1427f5b1f611885dd8499b2bd5b5bf98c3))
* fixing cmd tab typo in tutorial.2 ([#1234](https://github.com/dendronhq/dendron/issues/1234)) ([6e0543d](https://github.com/dendronhq/dendron/commit/6e0543d5077d40f2e9fc12325d3e111cad7e9a01))
* highlight same file wikilinks, wildcard references, links with anchors ([#1306](https://github.com/dendronhq/dendron/issues/1306)) ([956aa2a](https://github.com/dendronhq/dendron/commit/956aa2a7079eaa93acd2a66ace3c44f3f874c0f8))
* hover provider shouldn't recommend Ctrl+click for missing notes unless configured ([#1276](https://github.com/dendronhq/dendron/issues/1276)) ([cc037b6](https://github.com/dendronhq/dendron/commit/cc037b6e53c21389be8507e8088dc65bff0d7259))
* Ignore lookupConfirm if dailyVault is set ([#1311](https://github.com/dendronhq/dendron/issues/1311)) ([1c734da](https://github.com/dendronhq/dendron/commit/1c734daa45cc1e655638d754267c6bdf5bdcab90))
* issue with init workspace ([94d05c8](https://github.com/dendronhq/dendron/commit/94d05c8f1b6856c769d0cd2964d1dece9decb37c))
* reload index to be silent by default ([#1269](https://github.com/dendronhq/dendron/issues/1269)) ([2c0bf03](https://github.com/dendronhq/dendron/commit/2c0bf03d997ee3abc1f802f80e4b177feb44ae8b))
* stop calendar from auto expanding when the last note is closed ([#1299](https://github.com/dendronhq/dendron/issues/1299)) ([9c8f853](https://github.com/dendronhq/dendron/commit/9c8f8533da5027c122e0d003ce4c61dc866735f5))
* unhandled error in insert note link ([#1192](https://github.com/dendronhq/dendron/issues/1192)) ([a73420c](https://github.com/dendronhq/dendron/commit/a73420cd0f3d9f933256be43b839226b15b1e837))
* update links on frontmatter tags changes ([#1214](https://github.com/dendronhq/dendron/issues/1214)) ([4d344fe](https://github.com/dendronhq/dendron/commit/4d344fe40701a259e3ac4399899dab4099c8614f))


### Features Dendron

* Add smart vault selection to NoteLookupCommand ([#1174](https://github.com/dendronhq/dendron/issues/1174)) ([742cab6](https://github.com/dendronhq/dendron/commit/742cab6c683bb14b6baff6c786957a5cc7228894))
* enable usePrettyRefs for nextJS publishing and preview ([#1239](https://github.com/dendronhq/dendron/issues/1239)) ([8a456a9](https://github.com/dendronhq/dendron/commit/8a456a910c45e927c8413d881324bd28401e2aca))
* github publish to create new issue ([#1206](https://github.com/dendronhq/dendron/issues/1206)) ([67abef0](https://github.com/dendronhq/dendron/commit/67abef02c5615385a8a7f82fe290c8a443605a7f))
* run migration command ([#1177](https://github.com/dendronhq/dendron/issues/1177)) ([98bd000](https://github.com/dendronhq/dendron/commit/98bd000236e8c3a7def6b6895fa8d24315c54cf2))
* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))
* user tag autocomplete & user tags updated on rename ([#1278](https://github.com/dendronhq/dendron/issues/1278)) ([9719f99](https://github.com/dendronhq/dendron/commit/9719f99550a2c51c1a22f6fb21ff750bb4115f89))
* user tags ([#1228](https://github.com/dendronhq/dendron/issues/1228)) ([98c0106](https://github.com/dendronhq/dendron/commit/98c0106367e384c130a927484b9ea294eb6f84fa))



## 0.55.2 (2021-08-21)


### Bug Fixes

* force update picker item on button trigger even when value hasn't changed ([#1176](https://github.com/dendronhq/dendron/issues/1176)) ([46449a4](https://github.com/dendronhq/dendron/commit/46449a44009913af6340b26660fd5b5b2a79d57f))



## 0.55.1 (2021-08-17)


### Bug Fixes

* hiding quickpick doesn't dispose of picker ([781923a](https://github.com/dendronhq/dendron/commit/781923a679426ec4f29bd4600e29437ce1902d6f))
* multiple issues with lookupv3 ([1fdd9eb](https://github.com/dendronhq/dendron/commit/1fdd9eb3242b43539572a1993fefd174640c6d83))
* regression with move note command ([5e357b8](https://github.com/dendronhq/dendron/commit/5e357b8995ff335aa36ad48777a96ee56b196c01))


### Features Dendron

* Insert Note Index command ([#1142](https://github.com/dendronhq/dendron/issues/1142)) ([c140015](https://github.com/dendronhq/dendron/commit/c140015c19a942cf4696d596e818fd89905eea25))
* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* accept splitType argument in lookup v2 ([#1102](https://github.com/dendronhq/dendron/issues/1102)) ([a1120e4](https://github.com/dendronhq/dendron/commit/a1120e449af9776a14d2bcbb47f8d877ebd1227b))
* CopyNoteLink copies footnotes as anchors ([#1117](https://github.com/dendronhq/dendron/issues/1117)) ([2168991](https://github.com/dendronhq/dendron/commit/21689914d0c84735d243b988dcceb276df97380f))
* CopyNoteRef respects noXVaultWikiLink option ([#1085](https://github.com/dendronhq/dendron/issues/1085)) ([b4b3da3](https://github.com/dendronhq/dendron/commit/b4b3da3306e2c5621c3c79a53b9f6e4cc31856c6)), closes [#1072](https://github.com/dendronhq/dendron/issues/1072)
* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* extension readme getting started link ([#1084](https://github.com/dendronhq/dendron/issues/1084)) ([d3f5b7d](https://github.com/dendronhq/dendron/commit/d3f5b7dc49873cbbb9e44ce1ff473cd4d95e1214))
* FM tags with quoted strings & with spaces ([1a16689](https://github.com/dendronhq/dendron/commit/1a1668914f70b48a4e74a218bd43521df226de38))
* highlighting is not displayed ([#1083](https://github.com/dendronhq/dendron/issues/1083)) ([86ead9b](https://github.com/dendronhq/dendron/commit/86ead9b7ec66a51712a265f263a515c624f2861c))
* issue with direct child filter partially omitting values in quickpick ([#1123](https://github.com/dendronhq/dendron/issues/1123)) ([fbabab4](https://github.com/dendronhq/dendron/commit/fbabab4b61c91f3ebbe62def339efb32e1815178))
* lookupv3 selection issue ([#1130](https://github.com/dendronhq/dendron/issues/1130)) ([c807e88](https://github.com/dendronhq/dendron/commit/c807e88a82217e5a04dfddb5a24259a50bea4813))
* properly debounce picker update ([#1111](https://github.com/dendronhq/dendron/issues/1111)) ([ae12e1e](https://github.com/dendronhq/dendron/commit/ae12e1ec39e6d75c9c47e27eff7f96418984da4a))
* skip delayed decoration update if note is closed ([2d91164](https://github.com/dendronhq/dendron/commit/2d9116489b2d1f4d5ccd6d22c022af2da9984817))
* uninstall hook force flush ([#1087](https://github.com/dendronhq/dendron/issues/1087)) ([386aac2](https://github.com/dendronhq/dendron/commit/386aac2b8036cd58c190da99609cef2d3ed2467f))


### Features Dendron

* add journal title override to NoteLookupCommand ([#1140](https://github.com/dendronhq/dendron/issues/1140)) ([173b0c9](https://github.com/dendronhq/dendron/commit/173b0c95d7ca9593e72e2cd1c39e4fdcf31fa64a))
* **calendar:** enable webui by default ([#1127](https://github.com/dendronhq/dendron/issues/1127)) ([3ce8be0](https://github.com/dendronhq/dendron/commit/3ce8be05f50c0fef784eef1b6d02e4816e1bf44a))
* add remaining modifiers to NoteLookup ([#1056](https://github.com/dendronhq/dendron/issues/1056)) ([49c6005](https://github.com/dendronhq/dendron/commit/49c6005d2a2c8fd422eb653977e926084e743d6a)), closes [#1045](https://github.com/dendronhq/dendron/issues/1045) [#1046](https://github.com/dendronhq/dendron/issues/1046)
* add schema suggestion to NoteLookupCommand ([#1113](https://github.com/dendronhq/dendron/issues/1113)) ([7dbd03f](https://github.com/dendronhq/dendron/commit/7dbd03f20586d5174c13a40ed50eecfd8b4c788d))
* add schema templating feature to NoteLookupCommand ([#1118](https://github.com/dendronhq/dendron/issues/1118)) ([8a4cd2b](https://github.com/dendronhq/dendron/commit/8a4cd2b337521abcc25df61e145ef6868c50ea0f))
* Add SchemaLookupCommand ([#1082](https://github.com/dendronhq/dendron/issues/1082)) ([fe11a0e](https://github.com/dendronhq/dendron/commit/fe11a0ea1e0214823dd01842b941456df164bc70))
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* provide YAML validator & suggest YAML extension ([#1116](https://github.com/dendronhq/dendron/issues/1116)) ([b46f091](https://github.com/dendronhq/dendron/commit/b46f0916f9f01fdd7b71b6b5120c38a71d58b113))
* re-engage lapsed users with prompt ([#1086](https://github.com/dendronhq/dendron/issues/1086)) ([f4e6dc5](https://github.com/dendronhq/dendron/commit/f4e6dc563aafdfc0b46966e74d9b38920aee1207))
* rename header updates default link aliases ([1f0e405](https://github.com/dendronhq/dendron/commit/1f0e405d2c67a547fdecc41d76f062251a7cae01))
* resolve vim keybinding conflict on initial install ([#1103](https://github.com/dendronhq/dendron/issues/1103)) ([2278c66](https://github.com/dendronhq/dendron/commit/2278c6616c8297cc414ad02d5323bff5c45072e4))
* seed cmds in plugin ([#1080](https://github.com/dendronhq/dendron/issues/1080)) ([e07a092](https://github.com/dendronhq/dendron/commit/e07a092b1a75548574f2ea45f1b465490b2091f3))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.58.4-alpha.0](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.58.4-alpha.0) (2021-09-09)


### Bug Fixes

* creating scratch when text is selected within a note SHOULD not match scratches just due to prefix ([#1292](https://github.com/dendronhq/dendron/issues/1292)) ([cea4568](https://github.com/dendronhq/dendron/commit/cea456809b0da327bff5e06c1a796323d3eb257f))
* decorations for erased tags persist ([#1291](https://github.com/dendronhq/dendron/issues/1291)) ([e3284f6](https://github.com/dendronhq/dendron/commit/e3284f6449fe36edb81deb2ae4c97612fdf2b8de))
* direct children query ([#1303](https://github.com/dendronhq/dendron/issues/1303)) ([bcf0dea](https://github.com/dendronhq/dendron/commit/bcf0deae422406564cd9a56c1765f90dd2e66215))
* do not show multi select button on note rename ([#1293](https://github.com/dendronhq/dendron/issues/1293)) ([bd283c1](https://github.com/dendronhq/dendron/commit/bd283c1427f5b1f611885dd8499b2bd5b5bf98c3))
* fixing cmd tab typo in tutorial.2 ([#1234](https://github.com/dendronhq/dendron/issues/1234)) ([6e0543d](https://github.com/dendronhq/dendron/commit/6e0543d5077d40f2e9fc12325d3e111cad7e9a01))
* highlight same file wikilinks, wildcard references, links with anchors ([#1306](https://github.com/dendronhq/dendron/issues/1306)) ([956aa2a](https://github.com/dendronhq/dendron/commit/956aa2a7079eaa93acd2a66ace3c44f3f874c0f8))
* hover provider shouldn't recommend Ctrl+click for missing notes unless configured ([#1276](https://github.com/dendronhq/dendron/issues/1276)) ([cc037b6](https://github.com/dendronhq/dendron/commit/cc037b6e53c21389be8507e8088dc65bff0d7259))
* Ignore lookupConfirm if dailyVault is set ([#1311](https://github.com/dendronhq/dendron/issues/1311)) ([1c734da](https://github.com/dendronhq/dendron/commit/1c734daa45cc1e655638d754267c6bdf5bdcab90))
* issue with init workspace ([94d05c8](https://github.com/dendronhq/dendron/commit/94d05c8f1b6856c769d0cd2964d1dece9decb37c))
* reload index to be silent by default ([#1269](https://github.com/dendronhq/dendron/issues/1269)) ([2c0bf03](https://github.com/dendronhq/dendron/commit/2c0bf03d997ee3abc1f802f80e4b177feb44ae8b))
* stop calendar from auto expanding when the last note is closed ([#1299](https://github.com/dendronhq/dendron/issues/1299)) ([9c8f853](https://github.com/dendronhq/dendron/commit/9c8f8533da5027c122e0d003ce4c61dc866735f5))
* unhandled error in insert note link ([#1192](https://github.com/dendronhq/dendron/issues/1192)) ([a73420c](https://github.com/dendronhq/dendron/commit/a73420cd0f3d9f933256be43b839226b15b1e837))
* update links on frontmatter tags changes ([#1214](https://github.com/dendronhq/dendron/issues/1214)) ([4d344fe](https://github.com/dendronhq/dendron/commit/4d344fe40701a259e3ac4399899dab4099c8614f))


### Features Dendron

* Add smart vault selection to NoteLookupCommand ([#1174](https://github.com/dendronhq/dendron/issues/1174)) ([742cab6](https://github.com/dendronhq/dendron/commit/742cab6c683bb14b6baff6c786957a5cc7228894))
* enable usePrettyRefs for nextJS publishing and preview ([#1239](https://github.com/dendronhq/dendron/issues/1239)) ([8a456a9](https://github.com/dendronhq/dendron/commit/8a456a910c45e927c8413d881324bd28401e2aca))
* github publish to create new issue ([#1206](https://github.com/dendronhq/dendron/issues/1206)) ([67abef0](https://github.com/dendronhq/dendron/commit/67abef02c5615385a8a7f82fe290c8a443605a7f))
* run migration command ([#1177](https://github.com/dendronhq/dendron/issues/1177)) ([98bd000](https://github.com/dendronhq/dendron/commit/98bd000236e8c3a7def6b6895fa8d24315c54cf2))
* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))
* user tag autocomplete & user tags updated on rename ([#1278](https://github.com/dendronhq/dendron/issues/1278)) ([9719f99](https://github.com/dendronhq/dendron/commit/9719f99550a2c51c1a22f6fb21ff750bb4115f89))
* user tags ([#1228](https://github.com/dendronhq/dendron/issues/1228)) ([98c0106](https://github.com/dendronhq/dendron/commit/98c0106367e384c130a927484b9ea294eb6f84fa))



## 0.55.2 (2021-08-21)


### Bug Fixes

* force update picker item on button trigger even when value hasn't changed ([#1176](https://github.com/dendronhq/dendron/issues/1176)) ([46449a4](https://github.com/dendronhq/dendron/commit/46449a44009913af6340b26660fd5b5b2a79d57f))



## 0.55.1 (2021-08-17)


### Bug Fixes

* hiding quickpick doesn't dispose of picker ([781923a](https://github.com/dendronhq/dendron/commit/781923a679426ec4f29bd4600e29437ce1902d6f))
* multiple issues with lookupv3 ([1fdd9eb](https://github.com/dendronhq/dendron/commit/1fdd9eb3242b43539572a1993fefd174640c6d83))
* regression with move note command ([5e357b8](https://github.com/dendronhq/dendron/commit/5e357b8995ff335aa36ad48777a96ee56b196c01))


### Features Dendron

* Insert Note Index command ([#1142](https://github.com/dendronhq/dendron/issues/1142)) ([c140015](https://github.com/dendronhq/dendron/commit/c140015c19a942cf4696d596e818fd89905eea25))
* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* accept splitType argument in lookup v2 ([#1102](https://github.com/dendronhq/dendron/issues/1102)) ([a1120e4](https://github.com/dendronhq/dendron/commit/a1120e449af9776a14d2bcbb47f8d877ebd1227b))
* CopyNoteLink copies footnotes as anchors ([#1117](https://github.com/dendronhq/dendron/issues/1117)) ([2168991](https://github.com/dendronhq/dendron/commit/21689914d0c84735d243b988dcceb276df97380f))
* CopyNoteRef respects noXVaultWikiLink option ([#1085](https://github.com/dendronhq/dendron/issues/1085)) ([b4b3da3](https://github.com/dendronhq/dendron/commit/b4b3da3306e2c5621c3c79a53b9f6e4cc31856c6)), closes [#1072](https://github.com/dendronhq/dendron/issues/1072)
* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* extension readme getting started link ([#1084](https://github.com/dendronhq/dendron/issues/1084)) ([d3f5b7d](https://github.com/dendronhq/dendron/commit/d3f5b7dc49873cbbb9e44ce1ff473cd4d95e1214))
* FM tags with quoted strings & with spaces ([1a16689](https://github.com/dendronhq/dendron/commit/1a1668914f70b48a4e74a218bd43521df226de38))
* highlighting is not displayed ([#1083](https://github.com/dendronhq/dendron/issues/1083)) ([86ead9b](https://github.com/dendronhq/dendron/commit/86ead9b7ec66a51712a265f263a515c624f2861c))
* issue with direct child filter partially omitting values in quickpick ([#1123](https://github.com/dendronhq/dendron/issues/1123)) ([fbabab4](https://github.com/dendronhq/dendron/commit/fbabab4b61c91f3ebbe62def339efb32e1815178))
* lookupv3 selection issue ([#1130](https://github.com/dendronhq/dendron/issues/1130)) ([c807e88](https://github.com/dendronhq/dendron/commit/c807e88a82217e5a04dfddb5a24259a50bea4813))
* properly debounce picker update ([#1111](https://github.com/dendronhq/dendron/issues/1111)) ([ae12e1e](https://github.com/dendronhq/dendron/commit/ae12e1ec39e6d75c9c47e27eff7f96418984da4a))
* skip delayed decoration update if note is closed ([2d91164](https://github.com/dendronhq/dendron/commit/2d9116489b2d1f4d5ccd6d22c022af2da9984817))
* uninstall hook force flush ([#1087](https://github.com/dendronhq/dendron/issues/1087)) ([386aac2](https://github.com/dendronhq/dendron/commit/386aac2b8036cd58c190da99609cef2d3ed2467f))


### Features Dendron

* add journal title override to NoteLookupCommand ([#1140](https://github.com/dendronhq/dendron/issues/1140)) ([173b0c9](https://github.com/dendronhq/dendron/commit/173b0c95d7ca9593e72e2cd1c39e4fdcf31fa64a))
* **calendar:** enable webui by default ([#1127](https://github.com/dendronhq/dendron/issues/1127)) ([3ce8be0](https://github.com/dendronhq/dendron/commit/3ce8be05f50c0fef784eef1b6d02e4816e1bf44a))
* add remaining modifiers to NoteLookup ([#1056](https://github.com/dendronhq/dendron/issues/1056)) ([49c6005](https://github.com/dendronhq/dendron/commit/49c6005d2a2c8fd422eb653977e926084e743d6a)), closes [#1045](https://github.com/dendronhq/dendron/issues/1045) [#1046](https://github.com/dendronhq/dendron/issues/1046)
* add schema suggestion to NoteLookupCommand ([#1113](https://github.com/dendronhq/dendron/issues/1113)) ([7dbd03f](https://github.com/dendronhq/dendron/commit/7dbd03f20586d5174c13a40ed50eecfd8b4c788d))
* add schema templating feature to NoteLookupCommand ([#1118](https://github.com/dendronhq/dendron/issues/1118)) ([8a4cd2b](https://github.com/dendronhq/dendron/commit/8a4cd2b337521abcc25df61e145ef6868c50ea0f))
* Add SchemaLookupCommand ([#1082](https://github.com/dendronhq/dendron/issues/1082)) ([fe11a0e](https://github.com/dendronhq/dendron/commit/fe11a0ea1e0214823dd01842b941456df164bc70))
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* provide YAML validator & suggest YAML extension ([#1116](https://github.com/dendronhq/dendron/issues/1116)) ([b46f091](https://github.com/dendronhq/dendron/commit/b46f0916f9f01fdd7b71b6b5120c38a71d58b113))
* re-engage lapsed users with prompt ([#1086](https://github.com/dendronhq/dendron/issues/1086)) ([f4e6dc5](https://github.com/dendronhq/dendron/commit/f4e6dc563aafdfc0b46966e74d9b38920aee1207))
* rename header updates default link aliases ([1f0e405](https://github.com/dendronhq/dendron/commit/1f0e405d2c67a547fdecc41d76f062251a7cae01))
* resolve vim keybinding conflict on initial install ([#1103](https://github.com/dendronhq/dendron/issues/1103)) ([2278c66](https://github.com/dendronhq/dendron/commit/2278c6616c8297cc414ad02d5323bff5c45072e4))
* seed cmds in plugin ([#1080](https://github.com/dendronhq/dendron/issues/1080)) ([e07a092](https://github.com/dendronhq/dendron/commit/e07a092b1a75548574f2ea45f1b465490b2091f3))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.58.3-alpha.0](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.58.3-alpha.0) (2021-09-09)


### Bug Fixes

* creating scratch when text is selected within a note SHOULD not match scratches just due to prefix ([#1292](https://github.com/dendronhq/dendron/issues/1292)) ([cea4568](https://github.com/dendronhq/dendron/commit/cea456809b0da327bff5e06c1a796323d3eb257f))
* decorations for erased tags persist ([#1291](https://github.com/dendronhq/dendron/issues/1291)) ([e3284f6](https://github.com/dendronhq/dendron/commit/e3284f6449fe36edb81deb2ae4c97612fdf2b8de))
* do not show multi select button on note rename ([#1293](https://github.com/dendronhq/dendron/issues/1293)) ([bd283c1](https://github.com/dendronhq/dendron/commit/bd283c1427f5b1f611885dd8499b2bd5b5bf98c3))
* fixing cmd tab typo in tutorial.2 ([#1234](https://github.com/dendronhq/dendron/issues/1234)) ([6e0543d](https://github.com/dendronhq/dendron/commit/6e0543d5077d40f2e9fc12325d3e111cad7e9a01))
* hover provider shouldn't recommend Ctrl+click for missing notes unless configured ([#1276](https://github.com/dendronhq/dendron/issues/1276)) ([cc037b6](https://github.com/dendronhq/dendron/commit/cc037b6e53c21389be8507e8088dc65bff0d7259))
* reload index to be silent by default ([#1269](https://github.com/dendronhq/dendron/issues/1269)) ([2c0bf03](https://github.com/dendronhq/dendron/commit/2c0bf03d997ee3abc1f802f80e4b177feb44ae8b))
* unhandled error in insert note link ([#1192](https://github.com/dendronhq/dendron/issues/1192)) ([a73420c](https://github.com/dendronhq/dendron/commit/a73420cd0f3d9f933256be43b839226b15b1e837))
* update links on frontmatter tags changes ([#1214](https://github.com/dendronhq/dendron/issues/1214)) ([4d344fe](https://github.com/dendronhq/dendron/commit/4d344fe40701a259e3ac4399899dab4099c8614f))


### Features Dendron

* Add smart vault selection to NoteLookupCommand ([#1174](https://github.com/dendronhq/dendron/issues/1174)) ([742cab6](https://github.com/dendronhq/dendron/commit/742cab6c683bb14b6baff6c786957a5cc7228894))
* enable usePrettyRefs for nextJS publishing and preview ([#1239](https://github.com/dendronhq/dendron/issues/1239)) ([8a456a9](https://github.com/dendronhq/dendron/commit/8a456a910c45e927c8413d881324bd28401e2aca))
* github publish to create new issue ([#1206](https://github.com/dendronhq/dendron/issues/1206)) ([67abef0](https://github.com/dendronhq/dendron/commit/67abef02c5615385a8a7f82fe290c8a443605a7f))
* run migration command ([#1177](https://github.com/dendronhq/dendron/issues/1177)) ([98bd000](https://github.com/dendronhq/dendron/commit/98bd000236e8c3a7def6b6895fa8d24315c54cf2))
* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))
* user tag autocomplete & user tags updated on rename ([#1278](https://github.com/dendronhq/dendron/issues/1278)) ([9719f99](https://github.com/dendronhq/dendron/commit/9719f99550a2c51c1a22f6fb21ff750bb4115f89))
* user tags ([#1228](https://github.com/dendronhq/dendron/issues/1228)) ([98c0106](https://github.com/dendronhq/dendron/commit/98c0106367e384c130a927484b9ea294eb6f84fa))



## 0.55.2 (2021-08-21)


### Bug Fixes

* force update picker item on button trigger even when value hasn't changed ([#1176](https://github.com/dendronhq/dendron/issues/1176)) ([46449a4](https://github.com/dendronhq/dendron/commit/46449a44009913af6340b26660fd5b5b2a79d57f))



## 0.55.1 (2021-08-17)


### Bug Fixes

* hiding quickpick doesn't dispose of picker ([781923a](https://github.com/dendronhq/dendron/commit/781923a679426ec4f29bd4600e29437ce1902d6f))
* multiple issues with lookupv3 ([1fdd9eb](https://github.com/dendronhq/dendron/commit/1fdd9eb3242b43539572a1993fefd174640c6d83))
* regression with move note command ([5e357b8](https://github.com/dendronhq/dendron/commit/5e357b8995ff335aa36ad48777a96ee56b196c01))


### Features Dendron

* Insert Note Index command ([#1142](https://github.com/dendronhq/dendron/issues/1142)) ([c140015](https://github.com/dendronhq/dendron/commit/c140015c19a942cf4696d596e818fd89905eea25))
* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* accept splitType argument in lookup v2 ([#1102](https://github.com/dendronhq/dendron/issues/1102)) ([a1120e4](https://github.com/dendronhq/dendron/commit/a1120e449af9776a14d2bcbb47f8d877ebd1227b))
* CopyNoteLink copies footnotes as anchors ([#1117](https://github.com/dendronhq/dendron/issues/1117)) ([2168991](https://github.com/dendronhq/dendron/commit/21689914d0c84735d243b988dcceb276df97380f))
* CopyNoteRef respects noXVaultWikiLink option ([#1085](https://github.com/dendronhq/dendron/issues/1085)) ([b4b3da3](https://github.com/dendronhq/dendron/commit/b4b3da3306e2c5621c3c79a53b9f6e4cc31856c6)), closes [#1072](https://github.com/dendronhq/dendron/issues/1072)
* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* extension readme getting started link ([#1084](https://github.com/dendronhq/dendron/issues/1084)) ([d3f5b7d](https://github.com/dendronhq/dendron/commit/d3f5b7dc49873cbbb9e44ce1ff473cd4d95e1214))
* FM tags with quoted strings & with spaces ([1a16689](https://github.com/dendronhq/dendron/commit/1a1668914f70b48a4e74a218bd43521df226de38))
* highlighting is not displayed ([#1083](https://github.com/dendronhq/dendron/issues/1083)) ([86ead9b](https://github.com/dendronhq/dendron/commit/86ead9b7ec66a51712a265f263a515c624f2861c))
* issue with direct child filter partially omitting values in quickpick ([#1123](https://github.com/dendronhq/dendron/issues/1123)) ([fbabab4](https://github.com/dendronhq/dendron/commit/fbabab4b61c91f3ebbe62def339efb32e1815178))
* lookupv3 selection issue ([#1130](https://github.com/dendronhq/dendron/issues/1130)) ([c807e88](https://github.com/dendronhq/dendron/commit/c807e88a82217e5a04dfddb5a24259a50bea4813))
* properly debounce picker update ([#1111](https://github.com/dendronhq/dendron/issues/1111)) ([ae12e1e](https://github.com/dendronhq/dendron/commit/ae12e1ec39e6d75c9c47e27eff7f96418984da4a))
* skip delayed decoration update if note is closed ([2d91164](https://github.com/dendronhq/dendron/commit/2d9116489b2d1f4d5ccd6d22c022af2da9984817))
* uninstall hook force flush ([#1087](https://github.com/dendronhq/dendron/issues/1087)) ([386aac2](https://github.com/dendronhq/dendron/commit/386aac2b8036cd58c190da99609cef2d3ed2467f))


### Features Dendron

* add journal title override to NoteLookupCommand ([#1140](https://github.com/dendronhq/dendron/issues/1140)) ([173b0c9](https://github.com/dendronhq/dendron/commit/173b0c95d7ca9593e72e2cd1c39e4fdcf31fa64a))
* **calendar:** enable webui by default ([#1127](https://github.com/dendronhq/dendron/issues/1127)) ([3ce8be0](https://github.com/dendronhq/dendron/commit/3ce8be05f50c0fef784eef1b6d02e4816e1bf44a))
* add remaining modifiers to NoteLookup ([#1056](https://github.com/dendronhq/dendron/issues/1056)) ([49c6005](https://github.com/dendronhq/dendron/commit/49c6005d2a2c8fd422eb653977e926084e743d6a)), closes [#1045](https://github.com/dendronhq/dendron/issues/1045) [#1046](https://github.com/dendronhq/dendron/issues/1046)
* add schema suggestion to NoteLookupCommand ([#1113](https://github.com/dendronhq/dendron/issues/1113)) ([7dbd03f](https://github.com/dendronhq/dendron/commit/7dbd03f20586d5174c13a40ed50eecfd8b4c788d))
* add schema templating feature to NoteLookupCommand ([#1118](https://github.com/dendronhq/dendron/issues/1118)) ([8a4cd2b](https://github.com/dendronhq/dendron/commit/8a4cd2b337521abcc25df61e145ef6868c50ea0f))
* Add SchemaLookupCommand ([#1082](https://github.com/dendronhq/dendron/issues/1082)) ([fe11a0e](https://github.com/dendronhq/dendron/commit/fe11a0ea1e0214823dd01842b941456df164bc70))
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* provide YAML validator & suggest YAML extension ([#1116](https://github.com/dendronhq/dendron/issues/1116)) ([b46f091](https://github.com/dendronhq/dendron/commit/b46f0916f9f01fdd7b71b6b5120c38a71d58b113))
* re-engage lapsed users with prompt ([#1086](https://github.com/dendronhq/dendron/issues/1086)) ([f4e6dc5](https://github.com/dendronhq/dendron/commit/f4e6dc563aafdfc0b46966e74d9b38920aee1207))
* rename header updates default link aliases ([1f0e405](https://github.com/dendronhq/dendron/commit/1f0e405d2c67a547fdecc41d76f062251a7cae01))
* resolve vim keybinding conflict on initial install ([#1103](https://github.com/dendronhq/dendron/issues/1103)) ([2278c66](https://github.com/dendronhq/dendron/commit/2278c6616c8297cc414ad02d5323bff5c45072e4))
* seed cmds in plugin ([#1080](https://github.com/dendronhq/dendron/issues/1080)) ([e07a092](https://github.com/dendronhq/dendron/commit/e07a092b1a75548574f2ea45f1b465490b2091f3))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.58.2-alpha.0](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.58.2-alpha.0) (2021-09-09)


### Bug Fixes

* creating scratch when text is selected within a note SHOULD not match scratches just due to prefix ([#1292](https://github.com/dendronhq/dendron/issues/1292)) ([cea4568](https://github.com/dendronhq/dendron/commit/cea456809b0da327bff5e06c1a796323d3eb257f))
* decorations for erased tags persist ([#1291](https://github.com/dendronhq/dendron/issues/1291)) ([e3284f6](https://github.com/dendronhq/dendron/commit/e3284f6449fe36edb81deb2ae4c97612fdf2b8de))
* do not show multi select button on note rename ([#1293](https://github.com/dendronhq/dendron/issues/1293)) ([bd283c1](https://github.com/dendronhq/dendron/commit/bd283c1427f5b1f611885dd8499b2bd5b5bf98c3))
* fixing cmd tab typo in tutorial.2 ([#1234](https://github.com/dendronhq/dendron/issues/1234)) ([6e0543d](https://github.com/dendronhq/dendron/commit/6e0543d5077d40f2e9fc12325d3e111cad7e9a01))
* hover provider shouldn't recommend Ctrl+click for missing notes unless configured ([#1276](https://github.com/dendronhq/dendron/issues/1276)) ([cc037b6](https://github.com/dendronhq/dendron/commit/cc037b6e53c21389be8507e8088dc65bff0d7259))
* reload index to be silent by default ([#1269](https://github.com/dendronhq/dendron/issues/1269)) ([2c0bf03](https://github.com/dendronhq/dendron/commit/2c0bf03d997ee3abc1f802f80e4b177feb44ae8b))
* unhandled error in insert note link ([#1192](https://github.com/dendronhq/dendron/issues/1192)) ([a73420c](https://github.com/dendronhq/dendron/commit/a73420cd0f3d9f933256be43b839226b15b1e837))
* update links on frontmatter tags changes ([#1214](https://github.com/dendronhq/dendron/issues/1214)) ([4d344fe](https://github.com/dendronhq/dendron/commit/4d344fe40701a259e3ac4399899dab4099c8614f))


### Features Dendron

* Add smart vault selection to NoteLookupCommand ([#1174](https://github.com/dendronhq/dendron/issues/1174)) ([742cab6](https://github.com/dendronhq/dendron/commit/742cab6c683bb14b6baff6c786957a5cc7228894))
* enable usePrettyRefs for nextJS publishing and preview ([#1239](https://github.com/dendronhq/dendron/issues/1239)) ([8a456a9](https://github.com/dendronhq/dendron/commit/8a456a910c45e927c8413d881324bd28401e2aca))
* github publish to create new issue ([#1206](https://github.com/dendronhq/dendron/issues/1206)) ([67abef0](https://github.com/dendronhq/dendron/commit/67abef02c5615385a8a7f82fe290c8a443605a7f))
* run migration command ([#1177](https://github.com/dendronhq/dendron/issues/1177)) ([98bd000](https://github.com/dendronhq/dendron/commit/98bd000236e8c3a7def6b6895fa8d24315c54cf2))
* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))
* user tag autocomplete & user tags updated on rename ([#1278](https://github.com/dendronhq/dendron/issues/1278)) ([9719f99](https://github.com/dendronhq/dendron/commit/9719f99550a2c51c1a22f6fb21ff750bb4115f89))
* user tags ([#1228](https://github.com/dendronhq/dendron/issues/1228)) ([98c0106](https://github.com/dendronhq/dendron/commit/98c0106367e384c130a927484b9ea294eb6f84fa))



## 0.55.2 (2021-08-21)


### Bug Fixes

* force update picker item on button trigger even when value hasn't changed ([#1176](https://github.com/dendronhq/dendron/issues/1176)) ([46449a4](https://github.com/dendronhq/dendron/commit/46449a44009913af6340b26660fd5b5b2a79d57f))



## 0.55.1 (2021-08-17)


### Bug Fixes

* hiding quickpick doesn't dispose of picker ([781923a](https://github.com/dendronhq/dendron/commit/781923a679426ec4f29bd4600e29437ce1902d6f))
* multiple issues with lookupv3 ([1fdd9eb](https://github.com/dendronhq/dendron/commit/1fdd9eb3242b43539572a1993fefd174640c6d83))
* regression with move note command ([5e357b8](https://github.com/dendronhq/dendron/commit/5e357b8995ff335aa36ad48777a96ee56b196c01))


### Features Dendron

* Insert Note Index command ([#1142](https://github.com/dendronhq/dendron/issues/1142)) ([c140015](https://github.com/dendronhq/dendron/commit/c140015c19a942cf4696d596e818fd89905eea25))
* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* accept splitType argument in lookup v2 ([#1102](https://github.com/dendronhq/dendron/issues/1102)) ([a1120e4](https://github.com/dendronhq/dendron/commit/a1120e449af9776a14d2bcbb47f8d877ebd1227b))
* CopyNoteLink copies footnotes as anchors ([#1117](https://github.com/dendronhq/dendron/issues/1117)) ([2168991](https://github.com/dendronhq/dendron/commit/21689914d0c84735d243b988dcceb276df97380f))
* CopyNoteRef respects noXVaultWikiLink option ([#1085](https://github.com/dendronhq/dendron/issues/1085)) ([b4b3da3](https://github.com/dendronhq/dendron/commit/b4b3da3306e2c5621c3c79a53b9f6e4cc31856c6)), closes [#1072](https://github.com/dendronhq/dendron/issues/1072)
* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* extension readme getting started link ([#1084](https://github.com/dendronhq/dendron/issues/1084)) ([d3f5b7d](https://github.com/dendronhq/dendron/commit/d3f5b7dc49873cbbb9e44ce1ff473cd4d95e1214))
* FM tags with quoted strings & with spaces ([1a16689](https://github.com/dendronhq/dendron/commit/1a1668914f70b48a4e74a218bd43521df226de38))
* highlighting is not displayed ([#1083](https://github.com/dendronhq/dendron/issues/1083)) ([86ead9b](https://github.com/dendronhq/dendron/commit/86ead9b7ec66a51712a265f263a515c624f2861c))
* issue with direct child filter partially omitting values in quickpick ([#1123](https://github.com/dendronhq/dendron/issues/1123)) ([fbabab4](https://github.com/dendronhq/dendron/commit/fbabab4b61c91f3ebbe62def339efb32e1815178))
* lookupv3 selection issue ([#1130](https://github.com/dendronhq/dendron/issues/1130)) ([c807e88](https://github.com/dendronhq/dendron/commit/c807e88a82217e5a04dfddb5a24259a50bea4813))
* properly debounce picker update ([#1111](https://github.com/dendronhq/dendron/issues/1111)) ([ae12e1e](https://github.com/dendronhq/dendron/commit/ae12e1ec39e6d75c9c47e27eff7f96418984da4a))
* skip delayed decoration update if note is closed ([2d91164](https://github.com/dendronhq/dendron/commit/2d9116489b2d1f4d5ccd6d22c022af2da9984817))
* uninstall hook force flush ([#1087](https://github.com/dendronhq/dendron/issues/1087)) ([386aac2](https://github.com/dendronhq/dendron/commit/386aac2b8036cd58c190da99609cef2d3ed2467f))


### Features Dendron

* add journal title override to NoteLookupCommand ([#1140](https://github.com/dendronhq/dendron/issues/1140)) ([173b0c9](https://github.com/dendronhq/dendron/commit/173b0c95d7ca9593e72e2cd1c39e4fdcf31fa64a))
* **calendar:** enable webui by default ([#1127](https://github.com/dendronhq/dendron/issues/1127)) ([3ce8be0](https://github.com/dendronhq/dendron/commit/3ce8be05f50c0fef784eef1b6d02e4816e1bf44a))
* add remaining modifiers to NoteLookup ([#1056](https://github.com/dendronhq/dendron/issues/1056)) ([49c6005](https://github.com/dendronhq/dendron/commit/49c6005d2a2c8fd422eb653977e926084e743d6a)), closes [#1045](https://github.com/dendronhq/dendron/issues/1045) [#1046](https://github.com/dendronhq/dendron/issues/1046)
* add schema suggestion to NoteLookupCommand ([#1113](https://github.com/dendronhq/dendron/issues/1113)) ([7dbd03f](https://github.com/dendronhq/dendron/commit/7dbd03f20586d5174c13a40ed50eecfd8b4c788d))
* add schema templating feature to NoteLookupCommand ([#1118](https://github.com/dendronhq/dendron/issues/1118)) ([8a4cd2b](https://github.com/dendronhq/dendron/commit/8a4cd2b337521abcc25df61e145ef6868c50ea0f))
* Add SchemaLookupCommand ([#1082](https://github.com/dendronhq/dendron/issues/1082)) ([fe11a0e](https://github.com/dendronhq/dendron/commit/fe11a0ea1e0214823dd01842b941456df164bc70))
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* provide YAML validator & suggest YAML extension ([#1116](https://github.com/dendronhq/dendron/issues/1116)) ([b46f091](https://github.com/dendronhq/dendron/commit/b46f0916f9f01fdd7b71b6b5120c38a71d58b113))
* re-engage lapsed users with prompt ([#1086](https://github.com/dendronhq/dendron/issues/1086)) ([f4e6dc5](https://github.com/dendronhq/dendron/commit/f4e6dc563aafdfc0b46966e74d9b38920aee1207))
* rename header updates default link aliases ([1f0e405](https://github.com/dendronhq/dendron/commit/1f0e405d2c67a547fdecc41d76f062251a7cae01))
* resolve vim keybinding conflict on initial install ([#1103](https://github.com/dendronhq/dendron/issues/1103)) ([2278c66](https://github.com/dendronhq/dendron/commit/2278c6616c8297cc414ad02d5323bff5c45072e4))
* seed cmds in plugin ([#1080](https://github.com/dendronhq/dendron/issues/1080)) ([e07a092](https://github.com/dendronhq/dendron/commit/e07a092b1a75548574f2ea45f1b465490b2091f3))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.58.1](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.58.1) (2021-09-08)


### Bug Fixes

* creating scratch when text is selected within a note SHOULD not match scratches just due to prefix ([#1292](https://github.com/dendronhq/dendron/issues/1292)) ([cea4568](https://github.com/dendronhq/dendron/commit/cea456809b0da327bff5e06c1a796323d3eb257f))
* decorations for erased tags persist ([#1291](https://github.com/dendronhq/dendron/issues/1291)) ([e3284f6](https://github.com/dendronhq/dendron/commit/e3284f6449fe36edb81deb2ae4c97612fdf2b8de))
* do not show multi select button on note rename ([#1293](https://github.com/dendronhq/dendron/issues/1293)) ([bd283c1](https://github.com/dendronhq/dendron/commit/bd283c1427f5b1f611885dd8499b2bd5b5bf98c3))
* fixing cmd tab typo in tutorial.2 ([#1234](https://github.com/dendronhq/dendron/issues/1234)) ([6e0543d](https://github.com/dendronhq/dendron/commit/6e0543d5077d40f2e9fc12325d3e111cad7e9a01))
* hover provider shouldn't recommend Ctrl+click for missing notes unless configured ([#1276](https://github.com/dendronhq/dendron/issues/1276)) ([cc037b6](https://github.com/dendronhq/dendron/commit/cc037b6e53c21389be8507e8088dc65bff0d7259))
* reload index to be silent by default ([#1269](https://github.com/dendronhq/dendron/issues/1269)) ([2c0bf03](https://github.com/dendronhq/dendron/commit/2c0bf03d997ee3abc1f802f80e4b177feb44ae8b))
* unhandled error in insert note link ([#1192](https://github.com/dendronhq/dendron/issues/1192)) ([a73420c](https://github.com/dendronhq/dendron/commit/a73420cd0f3d9f933256be43b839226b15b1e837))
* update links on frontmatter tags changes ([#1214](https://github.com/dendronhq/dendron/issues/1214)) ([4d344fe](https://github.com/dendronhq/dendron/commit/4d344fe40701a259e3ac4399899dab4099c8614f))


### Features Dendron

* Add smart vault selection to NoteLookupCommand ([#1174](https://github.com/dendronhq/dendron/issues/1174)) ([742cab6](https://github.com/dendronhq/dendron/commit/742cab6c683bb14b6baff6c786957a5cc7228894))
* enable usePrettyRefs for nextJS publishing and preview ([#1239](https://github.com/dendronhq/dendron/issues/1239)) ([8a456a9](https://github.com/dendronhq/dendron/commit/8a456a910c45e927c8413d881324bd28401e2aca))
* github publish to create new issue ([#1206](https://github.com/dendronhq/dendron/issues/1206)) ([67abef0](https://github.com/dendronhq/dendron/commit/67abef02c5615385a8a7f82fe290c8a443605a7f))
* run migration command ([#1177](https://github.com/dendronhq/dendron/issues/1177)) ([98bd000](https://github.com/dendronhq/dendron/commit/98bd000236e8c3a7def6b6895fa8d24315c54cf2))
* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))
* user tag autocomplete & user tags updated on rename ([#1278](https://github.com/dendronhq/dendron/issues/1278)) ([9719f99](https://github.com/dendronhq/dendron/commit/9719f99550a2c51c1a22f6fb21ff750bb4115f89))
* user tags ([#1228](https://github.com/dendronhq/dendron/issues/1228)) ([98c0106](https://github.com/dendronhq/dendron/commit/98c0106367e384c130a927484b9ea294eb6f84fa))



## 0.55.2 (2021-08-21)


### Bug Fixes

* force update picker item on button trigger even when value hasn't changed ([#1176](https://github.com/dendronhq/dendron/issues/1176)) ([46449a4](https://github.com/dendronhq/dendron/commit/46449a44009913af6340b26660fd5b5b2a79d57f))



## 0.55.1 (2021-08-17)


### Bug Fixes

* hiding quickpick doesn't dispose of picker ([781923a](https://github.com/dendronhq/dendron/commit/781923a679426ec4f29bd4600e29437ce1902d6f))
* multiple issues with lookupv3 ([1fdd9eb](https://github.com/dendronhq/dendron/commit/1fdd9eb3242b43539572a1993fefd174640c6d83))
* regression with move note command ([5e357b8](https://github.com/dendronhq/dendron/commit/5e357b8995ff335aa36ad48777a96ee56b196c01))


### Features Dendron

* Insert Note Index command ([#1142](https://github.com/dendronhq/dendron/issues/1142)) ([c140015](https://github.com/dendronhq/dendron/commit/c140015c19a942cf4696d596e818fd89905eea25))
* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* accept splitType argument in lookup v2 ([#1102](https://github.com/dendronhq/dendron/issues/1102)) ([a1120e4](https://github.com/dendronhq/dendron/commit/a1120e449af9776a14d2bcbb47f8d877ebd1227b))
* CopyNoteLink copies footnotes as anchors ([#1117](https://github.com/dendronhq/dendron/issues/1117)) ([2168991](https://github.com/dendronhq/dendron/commit/21689914d0c84735d243b988dcceb276df97380f))
* CopyNoteRef respects noXVaultWikiLink option ([#1085](https://github.com/dendronhq/dendron/issues/1085)) ([b4b3da3](https://github.com/dendronhq/dendron/commit/b4b3da3306e2c5621c3c79a53b9f6e4cc31856c6)), closes [#1072](https://github.com/dendronhq/dendron/issues/1072)
* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* extension readme getting started link ([#1084](https://github.com/dendronhq/dendron/issues/1084)) ([d3f5b7d](https://github.com/dendronhq/dendron/commit/d3f5b7dc49873cbbb9e44ce1ff473cd4d95e1214))
* FM tags with quoted strings & with spaces ([1a16689](https://github.com/dendronhq/dendron/commit/1a1668914f70b48a4e74a218bd43521df226de38))
* highlighting is not displayed ([#1083](https://github.com/dendronhq/dendron/issues/1083)) ([86ead9b](https://github.com/dendronhq/dendron/commit/86ead9b7ec66a51712a265f263a515c624f2861c))
* issue with direct child filter partially omitting values in quickpick ([#1123](https://github.com/dendronhq/dendron/issues/1123)) ([fbabab4](https://github.com/dendronhq/dendron/commit/fbabab4b61c91f3ebbe62def339efb32e1815178))
* lookupv3 selection issue ([#1130](https://github.com/dendronhq/dendron/issues/1130)) ([c807e88](https://github.com/dendronhq/dendron/commit/c807e88a82217e5a04dfddb5a24259a50bea4813))
* properly debounce picker update ([#1111](https://github.com/dendronhq/dendron/issues/1111)) ([ae12e1e](https://github.com/dendronhq/dendron/commit/ae12e1ec39e6d75c9c47e27eff7f96418984da4a))
* skip delayed decoration update if note is closed ([2d91164](https://github.com/dendronhq/dendron/commit/2d9116489b2d1f4d5ccd6d22c022af2da9984817))
* uninstall hook force flush ([#1087](https://github.com/dendronhq/dendron/issues/1087)) ([386aac2](https://github.com/dendronhq/dendron/commit/386aac2b8036cd58c190da99609cef2d3ed2467f))


### Features Dendron

* add journal title override to NoteLookupCommand ([#1140](https://github.com/dendronhq/dendron/issues/1140)) ([173b0c9](https://github.com/dendronhq/dendron/commit/173b0c95d7ca9593e72e2cd1c39e4fdcf31fa64a))
* **calendar:** enable webui by default ([#1127](https://github.com/dendronhq/dendron/issues/1127)) ([3ce8be0](https://github.com/dendronhq/dendron/commit/3ce8be05f50c0fef784eef1b6d02e4816e1bf44a))
* add remaining modifiers to NoteLookup ([#1056](https://github.com/dendronhq/dendron/issues/1056)) ([49c6005](https://github.com/dendronhq/dendron/commit/49c6005d2a2c8fd422eb653977e926084e743d6a)), closes [#1045](https://github.com/dendronhq/dendron/issues/1045) [#1046](https://github.com/dendronhq/dendron/issues/1046)
* add schema suggestion to NoteLookupCommand ([#1113](https://github.com/dendronhq/dendron/issues/1113)) ([7dbd03f](https://github.com/dendronhq/dendron/commit/7dbd03f20586d5174c13a40ed50eecfd8b4c788d))
* add schema templating feature to NoteLookupCommand ([#1118](https://github.com/dendronhq/dendron/issues/1118)) ([8a4cd2b](https://github.com/dendronhq/dendron/commit/8a4cd2b337521abcc25df61e145ef6868c50ea0f))
* Add SchemaLookupCommand ([#1082](https://github.com/dendronhq/dendron/issues/1082)) ([fe11a0e](https://github.com/dendronhq/dendron/commit/fe11a0ea1e0214823dd01842b941456df164bc70))
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* provide YAML validator & suggest YAML extension ([#1116](https://github.com/dendronhq/dendron/issues/1116)) ([b46f091](https://github.com/dendronhq/dendron/commit/b46f0916f9f01fdd7b71b6b5120c38a71d58b113))
* re-engage lapsed users with prompt ([#1086](https://github.com/dendronhq/dendron/issues/1086)) ([f4e6dc5](https://github.com/dendronhq/dendron/commit/f4e6dc563aafdfc0b46966e74d9b38920aee1207))
* rename header updates default link aliases ([1f0e405](https://github.com/dendronhq/dendron/commit/1f0e405d2c67a547fdecc41d76f062251a7cae01))
* resolve vim keybinding conflict on initial install ([#1103](https://github.com/dendronhq/dendron/issues/1103)) ([2278c66](https://github.com/dendronhq/dendron/commit/2278c6616c8297cc414ad02d5323bff5c45072e4))
* seed cmds in plugin ([#1080](https://github.com/dendronhq/dendron/issues/1080)) ([e07a092](https://github.com/dendronhq/dendron/commit/e07a092b1a75548574f2ea45f1b465490b2091f3))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





# [0.58.0](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.58.0) (2021-09-07)


### Bug Fixes

* creating scratch when text is selected within a note SHOULD not match scratches just due to prefix ([#1292](https://github.com/dendronhq/dendron/issues/1292)) ([cea4568](https://github.com/dendronhq/dendron/commit/cea456809b0da327bff5e06c1a796323d3eb257f))
* decorations for erased tags persist ([#1291](https://github.com/dendronhq/dendron/issues/1291)) ([e3284f6](https://github.com/dendronhq/dendron/commit/e3284f6449fe36edb81deb2ae4c97612fdf2b8de))
* do not show multi select button on note rename ([#1293](https://github.com/dendronhq/dendron/issues/1293)) ([bd283c1](https://github.com/dendronhq/dendron/commit/bd283c1427f5b1f611885dd8499b2bd5b5bf98c3))
* fixing cmd tab typo in tutorial.2 ([#1234](https://github.com/dendronhq/dendron/issues/1234)) ([6e0543d](https://github.com/dendronhq/dendron/commit/6e0543d5077d40f2e9fc12325d3e111cad7e9a01))
* hover provider shouldn't recommend Ctrl+click for missing notes unless configured ([#1276](https://github.com/dendronhq/dendron/issues/1276)) ([cc037b6](https://github.com/dendronhq/dendron/commit/cc037b6e53c21389be8507e8088dc65bff0d7259))
* reload index to be silent by default ([#1269](https://github.com/dendronhq/dendron/issues/1269)) ([2c0bf03](https://github.com/dendronhq/dendron/commit/2c0bf03d997ee3abc1f802f80e4b177feb44ae8b))
* unhandled error in insert note link ([#1192](https://github.com/dendronhq/dendron/issues/1192)) ([a73420c](https://github.com/dendronhq/dendron/commit/a73420cd0f3d9f933256be43b839226b15b1e837))
* update links on frontmatter tags changes ([#1214](https://github.com/dendronhq/dendron/issues/1214)) ([4d344fe](https://github.com/dendronhq/dendron/commit/4d344fe40701a259e3ac4399899dab4099c8614f))


### Features Dendron

* Add smart vault selection to NoteLookupCommand ([#1174](https://github.com/dendronhq/dendron/issues/1174)) ([742cab6](https://github.com/dendronhq/dendron/commit/742cab6c683bb14b6baff6c786957a5cc7228894))
* enable usePrettyRefs for nextJS publishing and preview ([#1239](https://github.com/dendronhq/dendron/issues/1239)) ([8a456a9](https://github.com/dendronhq/dendron/commit/8a456a910c45e927c8413d881324bd28401e2aca))
* github publish to create new issue ([#1206](https://github.com/dendronhq/dendron/issues/1206)) ([67abef0](https://github.com/dendronhq/dendron/commit/67abef02c5615385a8a7f82fe290c8a443605a7f))
* run migration command ([#1177](https://github.com/dendronhq/dendron/issues/1177)) ([98bd000](https://github.com/dendronhq/dendron/commit/98bd000236e8c3a7def6b6895fa8d24315c54cf2))
* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))
* user tag autocomplete & user tags updated on rename ([#1278](https://github.com/dendronhq/dendron/issues/1278)) ([9719f99](https://github.com/dendronhq/dendron/commit/9719f99550a2c51c1a22f6fb21ff750bb4115f89))
* user tags ([#1228](https://github.com/dendronhq/dendron/issues/1228)) ([98c0106](https://github.com/dendronhq/dendron/commit/98c0106367e384c130a927484b9ea294eb6f84fa))



## 0.55.2 (2021-08-21)


### Bug Fixes

* force update picker item on button trigger even when value hasn't changed ([#1176](https://github.com/dendronhq/dendron/issues/1176)) ([46449a4](https://github.com/dendronhq/dendron/commit/46449a44009913af6340b26660fd5b5b2a79d57f))



## 0.55.1 (2021-08-17)


### Bug Fixes

* hiding quickpick doesn't dispose of picker ([781923a](https://github.com/dendronhq/dendron/commit/781923a679426ec4f29bd4600e29437ce1902d6f))
* multiple issues with lookupv3 ([1fdd9eb](https://github.com/dendronhq/dendron/commit/1fdd9eb3242b43539572a1993fefd174640c6d83))
* regression with move note command ([5e357b8](https://github.com/dendronhq/dendron/commit/5e357b8995ff335aa36ad48777a96ee56b196c01))


### Features Dendron

* Insert Note Index command ([#1142](https://github.com/dendronhq/dendron/issues/1142)) ([c140015](https://github.com/dendronhq/dendron/commit/c140015c19a942cf4696d596e818fd89905eea25))
* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* accept splitType argument in lookup v2 ([#1102](https://github.com/dendronhq/dendron/issues/1102)) ([a1120e4](https://github.com/dendronhq/dendron/commit/a1120e449af9776a14d2bcbb47f8d877ebd1227b))
* CopyNoteLink copies footnotes as anchors ([#1117](https://github.com/dendronhq/dendron/issues/1117)) ([2168991](https://github.com/dendronhq/dendron/commit/21689914d0c84735d243b988dcceb276df97380f))
* CopyNoteRef respects noXVaultWikiLink option ([#1085](https://github.com/dendronhq/dendron/issues/1085)) ([b4b3da3](https://github.com/dendronhq/dendron/commit/b4b3da3306e2c5621c3c79a53b9f6e4cc31856c6)), closes [#1072](https://github.com/dendronhq/dendron/issues/1072)
* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* extension readme getting started link ([#1084](https://github.com/dendronhq/dendron/issues/1084)) ([d3f5b7d](https://github.com/dendronhq/dendron/commit/d3f5b7dc49873cbbb9e44ce1ff473cd4d95e1214))
* FM tags with quoted strings & with spaces ([1a16689](https://github.com/dendronhq/dendron/commit/1a1668914f70b48a4e74a218bd43521df226de38))
* highlighting is not displayed ([#1083](https://github.com/dendronhq/dendron/issues/1083)) ([86ead9b](https://github.com/dendronhq/dendron/commit/86ead9b7ec66a51712a265f263a515c624f2861c))
* issue with direct child filter partially omitting values in quickpick ([#1123](https://github.com/dendronhq/dendron/issues/1123)) ([fbabab4](https://github.com/dendronhq/dendron/commit/fbabab4b61c91f3ebbe62def339efb32e1815178))
* lookupv3 selection issue ([#1130](https://github.com/dendronhq/dendron/issues/1130)) ([c807e88](https://github.com/dendronhq/dendron/commit/c807e88a82217e5a04dfddb5a24259a50bea4813))
* properly debounce picker update ([#1111](https://github.com/dendronhq/dendron/issues/1111)) ([ae12e1e](https://github.com/dendronhq/dendron/commit/ae12e1ec39e6d75c9c47e27eff7f96418984da4a))
* skip delayed decoration update if note is closed ([2d91164](https://github.com/dendronhq/dendron/commit/2d9116489b2d1f4d5ccd6d22c022af2da9984817))
* uninstall hook force flush ([#1087](https://github.com/dendronhq/dendron/issues/1087)) ([386aac2](https://github.com/dendronhq/dendron/commit/386aac2b8036cd58c190da99609cef2d3ed2467f))


### Features Dendron

* add journal title override to NoteLookupCommand ([#1140](https://github.com/dendronhq/dendron/issues/1140)) ([173b0c9](https://github.com/dendronhq/dendron/commit/173b0c95d7ca9593e72e2cd1c39e4fdcf31fa64a))
* **calendar:** enable webui by default ([#1127](https://github.com/dendronhq/dendron/issues/1127)) ([3ce8be0](https://github.com/dendronhq/dendron/commit/3ce8be05f50c0fef784eef1b6d02e4816e1bf44a))
* add remaining modifiers to NoteLookup ([#1056](https://github.com/dendronhq/dendron/issues/1056)) ([49c6005](https://github.com/dendronhq/dendron/commit/49c6005d2a2c8fd422eb653977e926084e743d6a)), closes [#1045](https://github.com/dendronhq/dendron/issues/1045) [#1046](https://github.com/dendronhq/dendron/issues/1046)
* add schema suggestion to NoteLookupCommand ([#1113](https://github.com/dendronhq/dendron/issues/1113)) ([7dbd03f](https://github.com/dendronhq/dendron/commit/7dbd03f20586d5174c13a40ed50eecfd8b4c788d))
* add schema templating feature to NoteLookupCommand ([#1118](https://github.com/dendronhq/dendron/issues/1118)) ([8a4cd2b](https://github.com/dendronhq/dendron/commit/8a4cd2b337521abcc25df61e145ef6868c50ea0f))
* Add SchemaLookupCommand ([#1082](https://github.com/dendronhq/dendron/issues/1082)) ([fe11a0e](https://github.com/dendronhq/dendron/commit/fe11a0ea1e0214823dd01842b941456df164bc70))
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* provide YAML validator & suggest YAML extension ([#1116](https://github.com/dendronhq/dendron/issues/1116)) ([b46f091](https://github.com/dendronhq/dendron/commit/b46f0916f9f01fdd7b71b6b5120c38a71d58b113))
* re-engage lapsed users with prompt ([#1086](https://github.com/dendronhq/dendron/issues/1086)) ([f4e6dc5](https://github.com/dendronhq/dendron/commit/f4e6dc563aafdfc0b46966e74d9b38920aee1207))
* rename header updates default link aliases ([1f0e405](https://github.com/dendronhq/dendron/commit/1f0e405d2c67a547fdecc41d76f062251a7cae01))
* resolve vim keybinding conflict on initial install ([#1103](https://github.com/dendronhq/dendron/issues/1103)) ([2278c66](https://github.com/dendronhq/dendron/commit/2278c6616c8297cc414ad02d5323bff5c45072e4))
* seed cmds in plugin ([#1080](https://github.com/dendronhq/dendron/issues/1080)) ([e07a092](https://github.com/dendronhq/dendron/commit/e07a092b1a75548574f2ea45f1b465490b2091f3))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.57.3](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.57.3) (2021-09-06)


### Bug Fixes

* decorations for erased tags persist ([#1291](https://github.com/dendronhq/dendron/issues/1291)) ([e3284f6](https://github.com/dendronhq/dendron/commit/e3284f6449fe36edb81deb2ae4c97612fdf2b8de))
* fixing cmd tab typo in tutorial.2 ([#1234](https://github.com/dendronhq/dendron/issues/1234)) ([6e0543d](https://github.com/dendronhq/dendron/commit/6e0543d5077d40f2e9fc12325d3e111cad7e9a01))
* hover provider shouldn't recommend Ctrl+click for missing notes unless configured ([#1276](https://github.com/dendronhq/dendron/issues/1276)) ([cc037b6](https://github.com/dendronhq/dendron/commit/cc037b6e53c21389be8507e8088dc65bff0d7259))
* reload index to be silent by default ([#1269](https://github.com/dendronhq/dendron/issues/1269)) ([2c0bf03](https://github.com/dendronhq/dendron/commit/2c0bf03d997ee3abc1f802f80e4b177feb44ae8b))
* unhandled error in insert note link ([#1192](https://github.com/dendronhq/dendron/issues/1192)) ([a73420c](https://github.com/dendronhq/dendron/commit/a73420cd0f3d9f933256be43b839226b15b1e837))
* update links on frontmatter tags changes ([#1214](https://github.com/dendronhq/dendron/issues/1214)) ([4d344fe](https://github.com/dendronhq/dendron/commit/4d344fe40701a259e3ac4399899dab4099c8614f))


### Features Dendron

* Add smart vault selection to NoteLookupCommand ([#1174](https://github.com/dendronhq/dendron/issues/1174)) ([742cab6](https://github.com/dendronhq/dendron/commit/742cab6c683bb14b6baff6c786957a5cc7228894))
* enable usePrettyRefs for nextJS publishing and preview ([#1239](https://github.com/dendronhq/dendron/issues/1239)) ([8a456a9](https://github.com/dendronhq/dendron/commit/8a456a910c45e927c8413d881324bd28401e2aca))
* github publish to create new issue ([#1206](https://github.com/dendronhq/dendron/issues/1206)) ([67abef0](https://github.com/dendronhq/dendron/commit/67abef02c5615385a8a7f82fe290c8a443605a7f))
* run migration command ([#1177](https://github.com/dendronhq/dendron/issues/1177)) ([98bd000](https://github.com/dendronhq/dendron/commit/98bd000236e8c3a7def6b6895fa8d24315c54cf2))
* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))
* user tag autocomplete & user tags updated on rename ([#1278](https://github.com/dendronhq/dendron/issues/1278)) ([9719f99](https://github.com/dendronhq/dendron/commit/9719f99550a2c51c1a22f6fb21ff750bb4115f89))
* user tags ([#1228](https://github.com/dendronhq/dendron/issues/1228)) ([98c0106](https://github.com/dendronhq/dendron/commit/98c0106367e384c130a927484b9ea294eb6f84fa))



## 0.55.2 (2021-08-21)


### Bug Fixes

* force update picker item on button trigger even when value hasn't changed ([#1176](https://github.com/dendronhq/dendron/issues/1176)) ([46449a4](https://github.com/dendronhq/dendron/commit/46449a44009913af6340b26660fd5b5b2a79d57f))



## 0.55.1 (2021-08-17)


### Bug Fixes

* hiding quickpick doesn't dispose of picker ([781923a](https://github.com/dendronhq/dendron/commit/781923a679426ec4f29bd4600e29437ce1902d6f))
* multiple issues with lookupv3 ([1fdd9eb](https://github.com/dendronhq/dendron/commit/1fdd9eb3242b43539572a1993fefd174640c6d83))
* regression with move note command ([5e357b8](https://github.com/dendronhq/dendron/commit/5e357b8995ff335aa36ad48777a96ee56b196c01))


### Features Dendron

* Insert Note Index command ([#1142](https://github.com/dendronhq/dendron/issues/1142)) ([c140015](https://github.com/dendronhq/dendron/commit/c140015c19a942cf4696d596e818fd89905eea25))
* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* accept splitType argument in lookup v2 ([#1102](https://github.com/dendronhq/dendron/issues/1102)) ([a1120e4](https://github.com/dendronhq/dendron/commit/a1120e449af9776a14d2bcbb47f8d877ebd1227b))
* CopyNoteLink copies footnotes as anchors ([#1117](https://github.com/dendronhq/dendron/issues/1117)) ([2168991](https://github.com/dendronhq/dendron/commit/21689914d0c84735d243b988dcceb276df97380f))
* CopyNoteRef respects noXVaultWikiLink option ([#1085](https://github.com/dendronhq/dendron/issues/1085)) ([b4b3da3](https://github.com/dendronhq/dendron/commit/b4b3da3306e2c5621c3c79a53b9f6e4cc31856c6)), closes [#1072](https://github.com/dendronhq/dendron/issues/1072)
* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* extension readme getting started link ([#1084](https://github.com/dendronhq/dendron/issues/1084)) ([d3f5b7d](https://github.com/dendronhq/dendron/commit/d3f5b7dc49873cbbb9e44ce1ff473cd4d95e1214))
* FM tags with quoted strings & with spaces ([1a16689](https://github.com/dendronhq/dendron/commit/1a1668914f70b48a4e74a218bd43521df226de38))
* highlighting is not displayed ([#1083](https://github.com/dendronhq/dendron/issues/1083)) ([86ead9b](https://github.com/dendronhq/dendron/commit/86ead9b7ec66a51712a265f263a515c624f2861c))
* issue with direct child filter partially omitting values in quickpick ([#1123](https://github.com/dendronhq/dendron/issues/1123)) ([fbabab4](https://github.com/dendronhq/dendron/commit/fbabab4b61c91f3ebbe62def339efb32e1815178))
* lookupv3 selection issue ([#1130](https://github.com/dendronhq/dendron/issues/1130)) ([c807e88](https://github.com/dendronhq/dendron/commit/c807e88a82217e5a04dfddb5a24259a50bea4813))
* properly debounce picker update ([#1111](https://github.com/dendronhq/dendron/issues/1111)) ([ae12e1e](https://github.com/dendronhq/dendron/commit/ae12e1ec39e6d75c9c47e27eff7f96418984da4a))
* skip delayed decoration update if note is closed ([2d91164](https://github.com/dendronhq/dendron/commit/2d9116489b2d1f4d5ccd6d22c022af2da9984817))
* uninstall hook force flush ([#1087](https://github.com/dendronhq/dendron/issues/1087)) ([386aac2](https://github.com/dendronhq/dendron/commit/386aac2b8036cd58c190da99609cef2d3ed2467f))


### Features Dendron

* add journal title override to NoteLookupCommand ([#1140](https://github.com/dendronhq/dendron/issues/1140)) ([173b0c9](https://github.com/dendronhq/dendron/commit/173b0c95d7ca9593e72e2cd1c39e4fdcf31fa64a))
* **calendar:** enable webui by default ([#1127](https://github.com/dendronhq/dendron/issues/1127)) ([3ce8be0](https://github.com/dendronhq/dendron/commit/3ce8be05f50c0fef784eef1b6d02e4816e1bf44a))
* add remaining modifiers to NoteLookup ([#1056](https://github.com/dendronhq/dendron/issues/1056)) ([49c6005](https://github.com/dendronhq/dendron/commit/49c6005d2a2c8fd422eb653977e926084e743d6a)), closes [#1045](https://github.com/dendronhq/dendron/issues/1045) [#1046](https://github.com/dendronhq/dendron/issues/1046)
* add schema suggestion to NoteLookupCommand ([#1113](https://github.com/dendronhq/dendron/issues/1113)) ([7dbd03f](https://github.com/dendronhq/dendron/commit/7dbd03f20586d5174c13a40ed50eecfd8b4c788d))
* add schema templating feature to NoteLookupCommand ([#1118](https://github.com/dendronhq/dendron/issues/1118)) ([8a4cd2b](https://github.com/dendronhq/dendron/commit/8a4cd2b337521abcc25df61e145ef6868c50ea0f))
* Add SchemaLookupCommand ([#1082](https://github.com/dendronhq/dendron/issues/1082)) ([fe11a0e](https://github.com/dendronhq/dendron/commit/fe11a0ea1e0214823dd01842b941456df164bc70))
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* provide YAML validator & suggest YAML extension ([#1116](https://github.com/dendronhq/dendron/issues/1116)) ([b46f091](https://github.com/dendronhq/dendron/commit/b46f0916f9f01fdd7b71b6b5120c38a71d58b113))
* re-engage lapsed users with prompt ([#1086](https://github.com/dendronhq/dendron/issues/1086)) ([f4e6dc5](https://github.com/dendronhq/dendron/commit/f4e6dc563aafdfc0b46966e74d9b38920aee1207))
* rename header updates default link aliases ([1f0e405](https://github.com/dendronhq/dendron/commit/1f0e405d2c67a547fdecc41d76f062251a7cae01))
* resolve vim keybinding conflict on initial install ([#1103](https://github.com/dendronhq/dendron/issues/1103)) ([2278c66](https://github.com/dendronhq/dendron/commit/2278c6616c8297cc414ad02d5323bff5c45072e4))
* seed cmds in plugin ([#1080](https://github.com/dendronhq/dendron/issues/1080)) ([e07a092](https://github.com/dendronhq/dendron/commit/e07a092b1a75548574f2ea45f1b465490b2091f3))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.57.2](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.57.2) (2021-09-04)


### Bug Fixes

* add wsConfig back to migrations ([711015a](https://github.com/dendronhq/dendron/commit/711015a65ade01a8aef5a93c80668ff27e7dd41d))
* fixing cmd tab typo in tutorial.2 ([#1234](https://github.com/dendronhq/dendron/issues/1234)) ([6e0543d](https://github.com/dendronhq/dendron/commit/6e0543d5077d40f2e9fc12325d3e111cad7e9a01))
* hover provider shouldn't recommend Ctrl+click for missing notes unless configured ([#1276](https://github.com/dendronhq/dendron/issues/1276)) ([cc037b6](https://github.com/dendronhq/dendron/commit/cc037b6e53c21389be8507e8088dc65bff0d7259))
* reload index to be silent by default ([#1269](https://github.com/dendronhq/dendron/issues/1269)) ([2c0bf03](https://github.com/dendronhq/dendron/commit/2c0bf03d997ee3abc1f802f80e4b177feb44ae8b))
* unhandled error in insert note link ([#1192](https://github.com/dendronhq/dendron/issues/1192)) ([a73420c](https://github.com/dendronhq/dendron/commit/a73420cd0f3d9f933256be43b839226b15b1e837))
* update links on frontmatter tags changes ([#1214](https://github.com/dendronhq/dendron/issues/1214)) ([4d344fe](https://github.com/dendronhq/dendron/commit/4d344fe40701a259e3ac4399899dab4099c8614f))


### Features Dendron

* Add smart vault selection to NoteLookupCommand ([#1174](https://github.com/dendronhq/dendron/issues/1174)) ([742cab6](https://github.com/dendronhq/dendron/commit/742cab6c683bb14b6baff6c786957a5cc7228894))
* enable usePrettyRefs for nextJS publishing and preview ([#1239](https://github.com/dendronhq/dendron/issues/1239)) ([8a456a9](https://github.com/dendronhq/dendron/commit/8a456a910c45e927c8413d881324bd28401e2aca))
* github publish to create new issue ([#1206](https://github.com/dendronhq/dendron/issues/1206)) ([67abef0](https://github.com/dendronhq/dendron/commit/67abef02c5615385a8a7f82fe290c8a443605a7f))
* run migration command ([#1177](https://github.com/dendronhq/dendron/issues/1177)) ([98bd000](https://github.com/dendronhq/dendron/commit/98bd000236e8c3a7def6b6895fa8d24315c54cf2))
* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))
* user tag autocomplete & user tags updated on rename ([#1278](https://github.com/dendronhq/dendron/issues/1278)) ([9719f99](https://github.com/dendronhq/dendron/commit/9719f99550a2c51c1a22f6fb21ff750bb4115f89))
* user tags ([#1228](https://github.com/dendronhq/dendron/issues/1228)) ([98c0106](https://github.com/dendronhq/dendron/commit/98c0106367e384c130a927484b9ea294eb6f84fa))



## 0.55.2 (2021-08-21)


### Bug Fixes

* force update picker item on button trigger even when value hasn't changed ([#1176](https://github.com/dendronhq/dendron/issues/1176)) ([46449a4](https://github.com/dendronhq/dendron/commit/46449a44009913af6340b26660fd5b5b2a79d57f))



## 0.55.1 (2021-08-17)


### Bug Fixes

* hiding quickpick doesn't dispose of picker ([781923a](https://github.com/dendronhq/dendron/commit/781923a679426ec4f29bd4600e29437ce1902d6f))
* multiple issues with lookupv3 ([1fdd9eb](https://github.com/dendronhq/dendron/commit/1fdd9eb3242b43539572a1993fefd174640c6d83))
* regression with move note command ([5e357b8](https://github.com/dendronhq/dendron/commit/5e357b8995ff335aa36ad48777a96ee56b196c01))


### Features Dendron

* Insert Note Index command ([#1142](https://github.com/dendronhq/dendron/issues/1142)) ([c140015](https://github.com/dendronhq/dendron/commit/c140015c19a942cf4696d596e818fd89905eea25))
* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* accept splitType argument in lookup v2 ([#1102](https://github.com/dendronhq/dendron/issues/1102)) ([a1120e4](https://github.com/dendronhq/dendron/commit/a1120e449af9776a14d2bcbb47f8d877ebd1227b))
* CopyNoteLink copies footnotes as anchors ([#1117](https://github.com/dendronhq/dendron/issues/1117)) ([2168991](https://github.com/dendronhq/dendron/commit/21689914d0c84735d243b988dcceb276df97380f))
* CopyNoteRef respects noXVaultWikiLink option ([#1085](https://github.com/dendronhq/dendron/issues/1085)) ([b4b3da3](https://github.com/dendronhq/dendron/commit/b4b3da3306e2c5621c3c79a53b9f6e4cc31856c6)), closes [#1072](https://github.com/dendronhq/dendron/issues/1072)
* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* extension readme getting started link ([#1084](https://github.com/dendronhq/dendron/issues/1084)) ([d3f5b7d](https://github.com/dendronhq/dendron/commit/d3f5b7dc49873cbbb9e44ce1ff473cd4d95e1214))
* FM tags with quoted strings & with spaces ([1a16689](https://github.com/dendronhq/dendron/commit/1a1668914f70b48a4e74a218bd43521df226de38))
* highlighting is not displayed ([#1083](https://github.com/dendronhq/dendron/issues/1083)) ([86ead9b](https://github.com/dendronhq/dendron/commit/86ead9b7ec66a51712a265f263a515c624f2861c))
* issue with direct child filter partially omitting values in quickpick ([#1123](https://github.com/dendronhq/dendron/issues/1123)) ([fbabab4](https://github.com/dendronhq/dendron/commit/fbabab4b61c91f3ebbe62def339efb32e1815178))
* lookupv3 selection issue ([#1130](https://github.com/dendronhq/dendron/issues/1130)) ([c807e88](https://github.com/dendronhq/dendron/commit/c807e88a82217e5a04dfddb5a24259a50bea4813))
* properly debounce picker update ([#1111](https://github.com/dendronhq/dendron/issues/1111)) ([ae12e1e](https://github.com/dendronhq/dendron/commit/ae12e1ec39e6d75c9c47e27eff7f96418984da4a))
* skip delayed decoration update if note is closed ([2d91164](https://github.com/dendronhq/dendron/commit/2d9116489b2d1f4d5ccd6d22c022af2da9984817))
* uninstall hook force flush ([#1087](https://github.com/dendronhq/dendron/issues/1087)) ([386aac2](https://github.com/dendronhq/dendron/commit/386aac2b8036cd58c190da99609cef2d3ed2467f))


### Features Dendron

* add journal title override to NoteLookupCommand ([#1140](https://github.com/dendronhq/dendron/issues/1140)) ([173b0c9](https://github.com/dendronhq/dendron/commit/173b0c95d7ca9593e72e2cd1c39e4fdcf31fa64a))
* **calendar:** enable webui by default ([#1127](https://github.com/dendronhq/dendron/issues/1127)) ([3ce8be0](https://github.com/dendronhq/dendron/commit/3ce8be05f50c0fef784eef1b6d02e4816e1bf44a))
* add remaining modifiers to NoteLookup ([#1056](https://github.com/dendronhq/dendron/issues/1056)) ([49c6005](https://github.com/dendronhq/dendron/commit/49c6005d2a2c8fd422eb653977e926084e743d6a)), closes [#1045](https://github.com/dendronhq/dendron/issues/1045) [#1046](https://github.com/dendronhq/dendron/issues/1046)
* add schema suggestion to NoteLookupCommand ([#1113](https://github.com/dendronhq/dendron/issues/1113)) ([7dbd03f](https://github.com/dendronhq/dendron/commit/7dbd03f20586d5174c13a40ed50eecfd8b4c788d))
* add schema templating feature to NoteLookupCommand ([#1118](https://github.com/dendronhq/dendron/issues/1118)) ([8a4cd2b](https://github.com/dendronhq/dendron/commit/8a4cd2b337521abcc25df61e145ef6868c50ea0f))
* Add SchemaLookupCommand ([#1082](https://github.com/dendronhq/dendron/issues/1082)) ([fe11a0e](https://github.com/dendronhq/dendron/commit/fe11a0ea1e0214823dd01842b941456df164bc70))
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* provide YAML validator & suggest YAML extension ([#1116](https://github.com/dendronhq/dendron/issues/1116)) ([b46f091](https://github.com/dendronhq/dendron/commit/b46f0916f9f01fdd7b71b6b5120c38a71d58b113))
* re-engage lapsed users with prompt ([#1086](https://github.com/dendronhq/dendron/issues/1086)) ([f4e6dc5](https://github.com/dendronhq/dendron/commit/f4e6dc563aafdfc0b46966e74d9b38920aee1207))
* rename header updates default link aliases ([1f0e405](https://github.com/dendronhq/dendron/commit/1f0e405d2c67a547fdecc41d76f062251a7cae01))
* resolve vim keybinding conflict on initial install ([#1103](https://github.com/dendronhq/dendron/issues/1103)) ([2278c66](https://github.com/dendronhq/dendron/commit/2278c6616c8297cc414ad02d5323bff5c45072e4))
* seed cmds in plugin ([#1080](https://github.com/dendronhq/dendron/issues/1080)) ([e07a092](https://github.com/dendronhq/dendron/commit/e07a092b1a75548574f2ea45f1b465490b2091f3))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.57.1](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.57.1) (2021-09-04)


### Bug Fixes

* add wsConfig back to migrations ([711015a](https://github.com/dendronhq/dendron/commit/711015a65ade01a8aef5a93c80668ff27e7dd41d))
* fixing cmd tab typo in tutorial.2 ([#1234](https://github.com/dendronhq/dendron/issues/1234)) ([6e0543d](https://github.com/dendronhq/dendron/commit/6e0543d5077d40f2e9fc12325d3e111cad7e9a01))
* hover provider shouldn't recommend Ctrl+click for missing notes unless configured ([#1276](https://github.com/dendronhq/dendron/issues/1276)) ([cc037b6](https://github.com/dendronhq/dendron/commit/cc037b6e53c21389be8507e8088dc65bff0d7259))
* reload index to be silent by default ([#1269](https://github.com/dendronhq/dendron/issues/1269)) ([2c0bf03](https://github.com/dendronhq/dendron/commit/2c0bf03d997ee3abc1f802f80e4b177feb44ae8b))
* unhandled error in insert note link ([#1192](https://github.com/dendronhq/dendron/issues/1192)) ([a73420c](https://github.com/dendronhq/dendron/commit/a73420cd0f3d9f933256be43b839226b15b1e837))
* update links on frontmatter tags changes ([#1214](https://github.com/dendronhq/dendron/issues/1214)) ([4d344fe](https://github.com/dendronhq/dendron/commit/4d344fe40701a259e3ac4399899dab4099c8614f))


### Features Dendron

* Add smart vault selection to NoteLookupCommand ([#1174](https://github.com/dendronhq/dendron/issues/1174)) ([742cab6](https://github.com/dendronhq/dendron/commit/742cab6c683bb14b6baff6c786957a5cc7228894))
* enable usePrettyRefs for nextJS publishing and preview ([#1239](https://github.com/dendronhq/dendron/issues/1239)) ([8a456a9](https://github.com/dendronhq/dendron/commit/8a456a910c45e927c8413d881324bd28401e2aca))
* github publish to create new issue ([#1206](https://github.com/dendronhq/dendron/issues/1206)) ([67abef0](https://github.com/dendronhq/dendron/commit/67abef02c5615385a8a7f82fe290c8a443605a7f))
* run migration command ([#1177](https://github.com/dendronhq/dendron/issues/1177)) ([98bd000](https://github.com/dendronhq/dendron/commit/98bd000236e8c3a7def6b6895fa8d24315c54cf2))
* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))
* user tag autocomplete & user tags updated on rename ([#1278](https://github.com/dendronhq/dendron/issues/1278)) ([9719f99](https://github.com/dendronhq/dendron/commit/9719f99550a2c51c1a22f6fb21ff750bb4115f89))
* user tags ([#1228](https://github.com/dendronhq/dendron/issues/1228)) ([98c0106](https://github.com/dendronhq/dendron/commit/98c0106367e384c130a927484b9ea294eb6f84fa))



## 0.55.2 (2021-08-21)


### Bug Fixes

* force update picker item on button trigger even when value hasn't changed ([#1176](https://github.com/dendronhq/dendron/issues/1176)) ([46449a4](https://github.com/dendronhq/dendron/commit/46449a44009913af6340b26660fd5b5b2a79d57f))



## 0.55.1 (2021-08-17)


### Bug Fixes

* hiding quickpick doesn't dispose of picker ([781923a](https://github.com/dendronhq/dendron/commit/781923a679426ec4f29bd4600e29437ce1902d6f))
* multiple issues with lookupv3 ([1fdd9eb](https://github.com/dendronhq/dendron/commit/1fdd9eb3242b43539572a1993fefd174640c6d83))
* regression with move note command ([5e357b8](https://github.com/dendronhq/dendron/commit/5e357b8995ff335aa36ad48777a96ee56b196c01))


### Features Dendron

* Insert Note Index command ([#1142](https://github.com/dendronhq/dendron/issues/1142)) ([c140015](https://github.com/dendronhq/dendron/commit/c140015c19a942cf4696d596e818fd89905eea25))
* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* accept splitType argument in lookup v2 ([#1102](https://github.com/dendronhq/dendron/issues/1102)) ([a1120e4](https://github.com/dendronhq/dendron/commit/a1120e449af9776a14d2bcbb47f8d877ebd1227b))
* CopyNoteLink copies footnotes as anchors ([#1117](https://github.com/dendronhq/dendron/issues/1117)) ([2168991](https://github.com/dendronhq/dendron/commit/21689914d0c84735d243b988dcceb276df97380f))
* CopyNoteRef respects noXVaultWikiLink option ([#1085](https://github.com/dendronhq/dendron/issues/1085)) ([b4b3da3](https://github.com/dendronhq/dendron/commit/b4b3da3306e2c5621c3c79a53b9f6e4cc31856c6)), closes [#1072](https://github.com/dendronhq/dendron/issues/1072)
* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* extension readme getting started link ([#1084](https://github.com/dendronhq/dendron/issues/1084)) ([d3f5b7d](https://github.com/dendronhq/dendron/commit/d3f5b7dc49873cbbb9e44ce1ff473cd4d95e1214))
* FM tags with quoted strings & with spaces ([1a16689](https://github.com/dendronhq/dendron/commit/1a1668914f70b48a4e74a218bd43521df226de38))
* highlighting is not displayed ([#1083](https://github.com/dendronhq/dendron/issues/1083)) ([86ead9b](https://github.com/dendronhq/dendron/commit/86ead9b7ec66a51712a265f263a515c624f2861c))
* issue with direct child filter partially omitting values in quickpick ([#1123](https://github.com/dendronhq/dendron/issues/1123)) ([fbabab4](https://github.com/dendronhq/dendron/commit/fbabab4b61c91f3ebbe62def339efb32e1815178))
* lookupv3 selection issue ([#1130](https://github.com/dendronhq/dendron/issues/1130)) ([c807e88](https://github.com/dendronhq/dendron/commit/c807e88a82217e5a04dfddb5a24259a50bea4813))
* properly debounce picker update ([#1111](https://github.com/dendronhq/dendron/issues/1111)) ([ae12e1e](https://github.com/dendronhq/dendron/commit/ae12e1ec39e6d75c9c47e27eff7f96418984da4a))
* skip delayed decoration update if note is closed ([2d91164](https://github.com/dendronhq/dendron/commit/2d9116489b2d1f4d5ccd6d22c022af2da9984817))
* uninstall hook force flush ([#1087](https://github.com/dendronhq/dendron/issues/1087)) ([386aac2](https://github.com/dendronhq/dendron/commit/386aac2b8036cd58c190da99609cef2d3ed2467f))


### Features Dendron

* add journal title override to NoteLookupCommand ([#1140](https://github.com/dendronhq/dendron/issues/1140)) ([173b0c9](https://github.com/dendronhq/dendron/commit/173b0c95d7ca9593e72e2cd1c39e4fdcf31fa64a))
* **calendar:** enable webui by default ([#1127](https://github.com/dendronhq/dendron/issues/1127)) ([3ce8be0](https://github.com/dendronhq/dendron/commit/3ce8be05f50c0fef784eef1b6d02e4816e1bf44a))
* add remaining modifiers to NoteLookup ([#1056](https://github.com/dendronhq/dendron/issues/1056)) ([49c6005](https://github.com/dendronhq/dendron/commit/49c6005d2a2c8fd422eb653977e926084e743d6a)), closes [#1045](https://github.com/dendronhq/dendron/issues/1045) [#1046](https://github.com/dendronhq/dendron/issues/1046)
* add schema suggestion to NoteLookupCommand ([#1113](https://github.com/dendronhq/dendron/issues/1113)) ([7dbd03f](https://github.com/dendronhq/dendron/commit/7dbd03f20586d5174c13a40ed50eecfd8b4c788d))
* add schema templating feature to NoteLookupCommand ([#1118](https://github.com/dendronhq/dendron/issues/1118)) ([8a4cd2b](https://github.com/dendronhq/dendron/commit/8a4cd2b337521abcc25df61e145ef6868c50ea0f))
* Add SchemaLookupCommand ([#1082](https://github.com/dendronhq/dendron/issues/1082)) ([fe11a0e](https://github.com/dendronhq/dendron/commit/fe11a0ea1e0214823dd01842b941456df164bc70))
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* provide YAML validator & suggest YAML extension ([#1116](https://github.com/dendronhq/dendron/issues/1116)) ([b46f091](https://github.com/dendronhq/dendron/commit/b46f0916f9f01fdd7b71b6b5120c38a71d58b113))
* re-engage lapsed users with prompt ([#1086](https://github.com/dendronhq/dendron/issues/1086)) ([f4e6dc5](https://github.com/dendronhq/dendron/commit/f4e6dc563aafdfc0b46966e74d9b38920aee1207))
* rename header updates default link aliases ([1f0e405](https://github.com/dendronhq/dendron/commit/1f0e405d2c67a547fdecc41d76f062251a7cae01))
* resolve vim keybinding conflict on initial install ([#1103](https://github.com/dendronhq/dendron/issues/1103)) ([2278c66](https://github.com/dendronhq/dendron/commit/2278c6616c8297cc414ad02d5323bff5c45072e4))
* seed cmds in plugin ([#1080](https://github.com/dendronhq/dendron/issues/1080)) ([e07a092](https://github.com/dendronhq/dendron/commit/e07a092b1a75548574f2ea45f1b465490b2091f3))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





# [0.57.0](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.57.0) (2021-08-31)


### Bug Fixes

* **workspace:** browse note fail on windows ([3523f2a](https://github.com/dendronhq/dendron/commit/3523f2a2ad71743b3ee31293474a63336367f488))
* fixing cmd tab typo in tutorial.2 ([#1234](https://github.com/dendronhq/dendron/issues/1234)) ([6e0543d](https://github.com/dendronhq/dendron/commit/6e0543d5077d40f2e9fc12325d3e111cad7e9a01))
* unhandled error in insert note link ([#1192](https://github.com/dendronhq/dendron/issues/1192)) ([a73420c](https://github.com/dendronhq/dendron/commit/a73420cd0f3d9f933256be43b839226b15b1e837))
* update links on frontmatter tags changes ([#1214](https://github.com/dendronhq/dendron/issues/1214)) ([4d344fe](https://github.com/dendronhq/dendron/commit/4d344fe40701a259e3ac4399899dab4099c8614f))


### Features Dendron

* Add smart vault selection to NoteLookupCommand ([#1174](https://github.com/dendronhq/dendron/issues/1174)) ([742cab6](https://github.com/dendronhq/dendron/commit/742cab6c683bb14b6baff6c786957a5cc7228894))
* github publish to create new issue ([#1206](https://github.com/dendronhq/dendron/issues/1206)) ([67abef0](https://github.com/dendronhq/dendron/commit/67abef02c5615385a8a7f82fe290c8a443605a7f))
* run migration command ([#1177](https://github.com/dendronhq/dendron/issues/1177)) ([98bd000](https://github.com/dendronhq/dendron/commit/98bd000236e8c3a7def6b6895fa8d24315c54cf2))
* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* user tags ([#1228](https://github.com/dendronhq/dendron/issues/1228)) ([98c0106](https://github.com/dendronhq/dendron/commit/98c0106367e384c130a927484b9ea294eb6f84fa))



## 0.55.2 (2021-08-21)


### Bug Fixes

* force update picker item on button trigger even when value hasn't changed ([#1176](https://github.com/dendronhq/dendron/issues/1176)) ([46449a4](https://github.com/dendronhq/dendron/commit/46449a44009913af6340b26660fd5b5b2a79d57f))



## 0.55.1 (2021-08-17)


### Bug Fixes

* hiding quickpick doesn't dispose of picker ([781923a](https://github.com/dendronhq/dendron/commit/781923a679426ec4f29bd4600e29437ce1902d6f))
* multiple issues with lookupv3 ([1fdd9eb](https://github.com/dendronhq/dendron/commit/1fdd9eb3242b43539572a1993fefd174640c6d83))
* regression with move note command ([5e357b8](https://github.com/dendronhq/dendron/commit/5e357b8995ff335aa36ad48777a96ee56b196c01))


### Features Dendron

* Insert Note Index command ([#1142](https://github.com/dendronhq/dendron/issues/1142)) ([c140015](https://github.com/dendronhq/dendron/commit/c140015c19a942cf4696d596e818fd89905eea25))
* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* accept splitType argument in lookup v2 ([#1102](https://github.com/dendronhq/dendron/issues/1102)) ([a1120e4](https://github.com/dendronhq/dendron/commit/a1120e449af9776a14d2bcbb47f8d877ebd1227b))
* CopyNoteLink copies footnotes as anchors ([#1117](https://github.com/dendronhq/dendron/issues/1117)) ([2168991](https://github.com/dendronhq/dendron/commit/21689914d0c84735d243b988dcceb276df97380f))
* CopyNoteRef respects noXVaultWikiLink option ([#1085](https://github.com/dendronhq/dendron/issues/1085)) ([b4b3da3](https://github.com/dendronhq/dendron/commit/b4b3da3306e2c5621c3c79a53b9f6e4cc31856c6)), closes [#1072](https://github.com/dendronhq/dendron/issues/1072)
* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* extension readme getting started link ([#1084](https://github.com/dendronhq/dendron/issues/1084)) ([d3f5b7d](https://github.com/dendronhq/dendron/commit/d3f5b7dc49873cbbb9e44ce1ff473cd4d95e1214))
* FM tags with quoted strings & with spaces ([1a16689](https://github.com/dendronhq/dendron/commit/1a1668914f70b48a4e74a218bd43521df226de38))
* highlighting is not displayed ([#1083](https://github.com/dendronhq/dendron/issues/1083)) ([86ead9b](https://github.com/dendronhq/dendron/commit/86ead9b7ec66a51712a265f263a515c624f2861c))
* issue with direct child filter partially omitting values in quickpick ([#1123](https://github.com/dendronhq/dendron/issues/1123)) ([fbabab4](https://github.com/dendronhq/dendron/commit/fbabab4b61c91f3ebbe62def339efb32e1815178))
* lookupv3 selection issue ([#1130](https://github.com/dendronhq/dendron/issues/1130)) ([c807e88](https://github.com/dendronhq/dendron/commit/c807e88a82217e5a04dfddb5a24259a50bea4813))
* properly debounce picker update ([#1111](https://github.com/dendronhq/dendron/issues/1111)) ([ae12e1e](https://github.com/dendronhq/dendron/commit/ae12e1ec39e6d75c9c47e27eff7f96418984da4a))
* skip delayed decoration update if note is closed ([2d91164](https://github.com/dendronhq/dendron/commit/2d9116489b2d1f4d5ccd6d22c022af2da9984817))
* uninstall hook force flush ([#1087](https://github.com/dendronhq/dendron/issues/1087)) ([386aac2](https://github.com/dendronhq/dendron/commit/386aac2b8036cd58c190da99609cef2d3ed2467f))


### Features Dendron

* add journal title override to NoteLookupCommand ([#1140](https://github.com/dendronhq/dendron/issues/1140)) ([173b0c9](https://github.com/dendronhq/dendron/commit/173b0c95d7ca9593e72e2cd1c39e4fdcf31fa64a))
* **calendar:** enable webui by default ([#1127](https://github.com/dendronhq/dendron/issues/1127)) ([3ce8be0](https://github.com/dendronhq/dendron/commit/3ce8be05f50c0fef784eef1b6d02e4816e1bf44a))
* add remaining modifiers to NoteLookup ([#1056](https://github.com/dendronhq/dendron/issues/1056)) ([49c6005](https://github.com/dendronhq/dendron/commit/49c6005d2a2c8fd422eb653977e926084e743d6a)), closes [#1045](https://github.com/dendronhq/dendron/issues/1045) [#1046](https://github.com/dendronhq/dendron/issues/1046)
* add schema suggestion to NoteLookupCommand ([#1113](https://github.com/dendronhq/dendron/issues/1113)) ([7dbd03f](https://github.com/dendronhq/dendron/commit/7dbd03f20586d5174c13a40ed50eecfd8b4c788d))
* add schema templating feature to NoteLookupCommand ([#1118](https://github.com/dendronhq/dendron/issues/1118)) ([8a4cd2b](https://github.com/dendronhq/dendron/commit/8a4cd2b337521abcc25df61e145ef6868c50ea0f))
* Add SchemaLookupCommand ([#1082](https://github.com/dendronhq/dendron/issues/1082)) ([fe11a0e](https://github.com/dendronhq/dendron/commit/fe11a0ea1e0214823dd01842b941456df164bc70))
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* provide YAML validator & suggest YAML extension ([#1116](https://github.com/dendronhq/dendron/issues/1116)) ([b46f091](https://github.com/dendronhq/dendron/commit/b46f0916f9f01fdd7b71b6b5120c38a71d58b113))
* re-engage lapsed users with prompt ([#1086](https://github.com/dendronhq/dendron/issues/1086)) ([f4e6dc5](https://github.com/dendronhq/dendron/commit/f4e6dc563aafdfc0b46966e74d9b38920aee1207))
* rename header updates default link aliases ([1f0e405](https://github.com/dendronhq/dendron/commit/1f0e405d2c67a547fdecc41d76f062251a7cae01))
* resolve vim keybinding conflict on initial install ([#1103](https://github.com/dendronhq/dendron/issues/1103)) ([2278c66](https://github.com/dendronhq/dendron/commit/2278c6616c8297cc414ad02d5323bff5c45072e4))
* seed cmds in plugin ([#1080](https://github.com/dendronhq/dendron/issues/1080)) ([e07a092](https://github.com/dendronhq/dendron/commit/e07a092b1a75548574f2ea45f1b465490b2091f3))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





# [0.56.0](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.56.0) (2021-08-23)


### Bug Fixes

* unhandled error in insert note link ([#1192](https://github.com/dendronhq/dendron/issues/1192)) ([a73420c](https://github.com/dendronhq/dendron/commit/a73420cd0f3d9f933256be43b839226b15b1e837))


### Features Dendron

* Add smart vault selection to NoteLookupCommand ([#1174](https://github.com/dendronhq/dendron/issues/1174)) ([742cab6](https://github.com/dendronhq/dendron/commit/742cab6c683bb14b6baff6c786957a5cc7228894))



## 0.55.2 (2021-08-21)


### Bug Fixes

* force update picker item on button trigger even when value hasn't changed ([#1176](https://github.com/dendronhq/dendron/issues/1176)) ([46449a4](https://github.com/dendronhq/dendron/commit/46449a44009913af6340b26660fd5b5b2a79d57f))



## 0.55.1 (2021-08-17)


### Bug Fixes

* hiding quickpick doesn't dispose of picker ([781923a](https://github.com/dendronhq/dendron/commit/781923a679426ec4f29bd4600e29437ce1902d6f))
* multiple issues with lookupv3 ([1fdd9eb](https://github.com/dendronhq/dendron/commit/1fdd9eb3242b43539572a1993fefd174640c6d83))
* regression with move note command ([5e357b8](https://github.com/dendronhq/dendron/commit/5e357b8995ff335aa36ad48777a96ee56b196c01))


### Features Dendron

* Insert Note Index command ([#1142](https://github.com/dendronhq/dendron/issues/1142)) ([c140015](https://github.com/dendronhq/dendron/commit/c140015c19a942cf4696d596e818fd89905eea25))
* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* accept splitType argument in lookup v2 ([#1102](https://github.com/dendronhq/dendron/issues/1102)) ([a1120e4](https://github.com/dendronhq/dendron/commit/a1120e449af9776a14d2bcbb47f8d877ebd1227b))
* CopyNoteLink copies footnotes as anchors ([#1117](https://github.com/dendronhq/dendron/issues/1117)) ([2168991](https://github.com/dendronhq/dendron/commit/21689914d0c84735d243b988dcceb276df97380f))
* CopyNoteRef respects noXVaultWikiLink option ([#1085](https://github.com/dendronhq/dendron/issues/1085)) ([b4b3da3](https://github.com/dendronhq/dendron/commit/b4b3da3306e2c5621c3c79a53b9f6e4cc31856c6)), closes [#1072](https://github.com/dendronhq/dendron/issues/1072)
* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* extension readme getting started link ([#1084](https://github.com/dendronhq/dendron/issues/1084)) ([d3f5b7d](https://github.com/dendronhq/dendron/commit/d3f5b7dc49873cbbb9e44ce1ff473cd4d95e1214))
* FM tags with quoted strings & with spaces ([1a16689](https://github.com/dendronhq/dendron/commit/1a1668914f70b48a4e74a218bd43521df226de38))
* highlighting is not displayed ([#1083](https://github.com/dendronhq/dendron/issues/1083)) ([86ead9b](https://github.com/dendronhq/dendron/commit/86ead9b7ec66a51712a265f263a515c624f2861c))
* issue with direct child filter partially omitting values in quickpick ([#1123](https://github.com/dendronhq/dendron/issues/1123)) ([fbabab4](https://github.com/dendronhq/dendron/commit/fbabab4b61c91f3ebbe62def339efb32e1815178))
* lookupv3 selection issue ([#1130](https://github.com/dendronhq/dendron/issues/1130)) ([c807e88](https://github.com/dendronhq/dendron/commit/c807e88a82217e5a04dfddb5a24259a50bea4813))
* properly debounce picker update ([#1111](https://github.com/dendronhq/dendron/issues/1111)) ([ae12e1e](https://github.com/dendronhq/dendron/commit/ae12e1ec39e6d75c9c47e27eff7f96418984da4a))
* skip delayed decoration update if note is closed ([2d91164](https://github.com/dendronhq/dendron/commit/2d9116489b2d1f4d5ccd6d22c022af2da9984817))
* uninstall hook force flush ([#1087](https://github.com/dendronhq/dendron/issues/1087)) ([386aac2](https://github.com/dendronhq/dendron/commit/386aac2b8036cd58c190da99609cef2d3ed2467f))


### Features Dendron

* add journal title override to NoteLookupCommand ([#1140](https://github.com/dendronhq/dendron/issues/1140)) ([173b0c9](https://github.com/dendronhq/dendron/commit/173b0c95d7ca9593e72e2cd1c39e4fdcf31fa64a))
* **calendar:** enable webui by default ([#1127](https://github.com/dendronhq/dendron/issues/1127)) ([3ce8be0](https://github.com/dendronhq/dendron/commit/3ce8be05f50c0fef784eef1b6d02e4816e1bf44a))
* add remaining modifiers to NoteLookup ([#1056](https://github.com/dendronhq/dendron/issues/1056)) ([49c6005](https://github.com/dendronhq/dendron/commit/49c6005d2a2c8fd422eb653977e926084e743d6a)), closes [#1045](https://github.com/dendronhq/dendron/issues/1045) [#1046](https://github.com/dendronhq/dendron/issues/1046)
* add schema suggestion to NoteLookupCommand ([#1113](https://github.com/dendronhq/dendron/issues/1113)) ([7dbd03f](https://github.com/dendronhq/dendron/commit/7dbd03f20586d5174c13a40ed50eecfd8b4c788d))
* add schema templating feature to NoteLookupCommand ([#1118](https://github.com/dendronhq/dendron/issues/1118)) ([8a4cd2b](https://github.com/dendronhq/dendron/commit/8a4cd2b337521abcc25df61e145ef6868c50ea0f))
* Add SchemaLookupCommand ([#1082](https://github.com/dendronhq/dendron/issues/1082)) ([fe11a0e](https://github.com/dendronhq/dendron/commit/fe11a0ea1e0214823dd01842b941456df164bc70))
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* provide YAML validator & suggest YAML extension ([#1116](https://github.com/dendronhq/dendron/issues/1116)) ([b46f091](https://github.com/dendronhq/dendron/commit/b46f0916f9f01fdd7b71b6b5120c38a71d58b113))
* re-engage lapsed users with prompt ([#1086](https://github.com/dendronhq/dendron/issues/1086)) ([f4e6dc5](https://github.com/dendronhq/dendron/commit/f4e6dc563aafdfc0b46966e74d9b38920aee1207))
* rename header updates default link aliases ([1f0e405](https://github.com/dendronhq/dendron/commit/1f0e405d2c67a547fdecc41d76f062251a7cae01))
* resolve vim keybinding conflict on initial install ([#1103](https://github.com/dendronhq/dendron/issues/1103)) ([2278c66](https://github.com/dendronhq/dendron/commit/2278c6616c8297cc414ad02d5323bff5c45072e4))
* seed cmds in plugin ([#1080](https://github.com/dendronhq/dendron/issues/1080)) ([e07a092](https://github.com/dendronhq/dendron/commit/e07a092b1a75548574f2ea45f1b465490b2091f3))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.55.2](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.55.2) (2021-08-19)



## 0.55.1 (2021-08-17)


### Bug Fixes

* hiding quickpick doesn't dispose of picker ([781923a](https://github.com/dendronhq/dendron/commit/781923a679426ec4f29bd4600e29437ce1902d6f))
* multiple issues with lookupv3 ([1fdd9eb](https://github.com/dendronhq/dendron/commit/1fdd9eb3242b43539572a1993fefd174640c6d83))
* regression with move note command ([5e357b8](https://github.com/dendronhq/dendron/commit/5e357b8995ff335aa36ad48777a96ee56b196c01))


### Features Dendron

* Insert Note Index command ([#1142](https://github.com/dendronhq/dendron/issues/1142)) ([c140015](https://github.com/dendronhq/dendron/commit/c140015c19a942cf4696d596e818fd89905eea25))
* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* accept splitType argument in lookup v2 ([#1102](https://github.com/dendronhq/dendron/issues/1102)) ([a1120e4](https://github.com/dendronhq/dendron/commit/a1120e449af9776a14d2bcbb47f8d877ebd1227b))
* CopyNoteLink copies footnotes as anchors ([#1117](https://github.com/dendronhq/dendron/issues/1117)) ([2168991](https://github.com/dendronhq/dendron/commit/21689914d0c84735d243b988dcceb276df97380f))
* CopyNoteRef respects noXVaultWikiLink option ([#1085](https://github.com/dendronhq/dendron/issues/1085)) ([b4b3da3](https://github.com/dendronhq/dendron/commit/b4b3da3306e2c5621c3c79a53b9f6e4cc31856c6)), closes [#1072](https://github.com/dendronhq/dendron/issues/1072)
* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* extension readme getting started link ([#1084](https://github.com/dendronhq/dendron/issues/1084)) ([d3f5b7d](https://github.com/dendronhq/dendron/commit/d3f5b7dc49873cbbb9e44ce1ff473cd4d95e1214))
* FM tags with quoted strings & with spaces ([1a16689](https://github.com/dendronhq/dendron/commit/1a1668914f70b48a4e74a218bd43521df226de38))
* highlighting is not displayed ([#1083](https://github.com/dendronhq/dendron/issues/1083)) ([86ead9b](https://github.com/dendronhq/dendron/commit/86ead9b7ec66a51712a265f263a515c624f2861c))
* issue with direct child filter partially omitting values in quickpick ([#1123](https://github.com/dendronhq/dendron/issues/1123)) ([fbabab4](https://github.com/dendronhq/dendron/commit/fbabab4b61c91f3ebbe62def339efb32e1815178))
* lookupv3 selection issue ([#1130](https://github.com/dendronhq/dendron/issues/1130)) ([c807e88](https://github.com/dendronhq/dendron/commit/c807e88a82217e5a04dfddb5a24259a50bea4813))
* properly debounce picker update ([#1111](https://github.com/dendronhq/dendron/issues/1111)) ([ae12e1e](https://github.com/dendronhq/dendron/commit/ae12e1ec39e6d75c9c47e27eff7f96418984da4a))
* skip delayed decoration update if note is closed ([2d91164](https://github.com/dendronhq/dendron/commit/2d9116489b2d1f4d5ccd6d22c022af2da9984817))
* uninstall hook force flush ([#1087](https://github.com/dendronhq/dendron/issues/1087)) ([386aac2](https://github.com/dendronhq/dendron/commit/386aac2b8036cd58c190da99609cef2d3ed2467f))


### Features Dendron

* add journal title override to NoteLookupCommand ([#1140](https://github.com/dendronhq/dendron/issues/1140)) ([173b0c9](https://github.com/dendronhq/dendron/commit/173b0c95d7ca9593e72e2cd1c39e4fdcf31fa64a))
* **calendar:** enable webui by default ([#1127](https://github.com/dendronhq/dendron/issues/1127)) ([3ce8be0](https://github.com/dendronhq/dendron/commit/3ce8be05f50c0fef784eef1b6d02e4816e1bf44a))
* add remaining modifiers to NoteLookup ([#1056](https://github.com/dendronhq/dendron/issues/1056)) ([49c6005](https://github.com/dendronhq/dendron/commit/49c6005d2a2c8fd422eb653977e926084e743d6a)), closes [#1045](https://github.com/dendronhq/dendron/issues/1045) [#1046](https://github.com/dendronhq/dendron/issues/1046)
* add schema suggestion to NoteLookupCommand ([#1113](https://github.com/dendronhq/dendron/issues/1113)) ([7dbd03f](https://github.com/dendronhq/dendron/commit/7dbd03f20586d5174c13a40ed50eecfd8b4c788d))
* add schema templating feature to NoteLookupCommand ([#1118](https://github.com/dendronhq/dendron/issues/1118)) ([8a4cd2b](https://github.com/dendronhq/dendron/commit/8a4cd2b337521abcc25df61e145ef6868c50ea0f))
* Add SchemaLookupCommand ([#1082](https://github.com/dendronhq/dendron/issues/1082)) ([fe11a0e](https://github.com/dendronhq/dendron/commit/fe11a0ea1e0214823dd01842b941456df164bc70))
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* provide YAML validator & suggest YAML extension ([#1116](https://github.com/dendronhq/dendron/issues/1116)) ([b46f091](https://github.com/dendronhq/dendron/commit/b46f0916f9f01fdd7b71b6b5120c38a71d58b113))
* re-engage lapsed users with prompt ([#1086](https://github.com/dendronhq/dendron/issues/1086)) ([f4e6dc5](https://github.com/dendronhq/dendron/commit/f4e6dc563aafdfc0b46966e74d9b38920aee1207))
* rename header updates default link aliases ([1f0e405](https://github.com/dendronhq/dendron/commit/1f0e405d2c67a547fdecc41d76f062251a7cae01))
* resolve vim keybinding conflict on initial install ([#1103](https://github.com/dendronhq/dendron/issues/1103)) ([2278c66](https://github.com/dendronhq/dendron/commit/2278c6616c8297cc414ad02d5323bff5c45072e4))
* seed cmds in plugin ([#1080](https://github.com/dendronhq/dendron/issues/1080)) ([e07a092](https://github.com/dendronhq/dendron/commit/e07a092b1a75548574f2ea45f1b465490b2091f3))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.55.1](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.55.1) (2021-08-17)


### Bug Fixes

* hiding quickpick doesn't dispose of picker ([781923a](https://github.com/dendronhq/dendron/commit/781923a679426ec4f29bd4600e29437ce1902d6f))
* multiple issues with lookupv3 ([1fdd9eb](https://github.com/dendronhq/dendron/commit/1fdd9eb3242b43539572a1993fefd174640c6d83))
* regression with move note command ([5e357b8](https://github.com/dendronhq/dendron/commit/5e357b8995ff335aa36ad48777a96ee56b196c01))


### Features Dendron

* Insert Note Index command ([#1142](https://github.com/dendronhq/dendron/issues/1142)) ([c140015](https://github.com/dendronhq/dendron/commit/c140015c19a942cf4696d596e818fd89905eea25))
* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* accept splitType argument in lookup v2 ([#1102](https://github.com/dendronhq/dendron/issues/1102)) ([a1120e4](https://github.com/dendronhq/dendron/commit/a1120e449af9776a14d2bcbb47f8d877ebd1227b))
* CopyNoteLink copies footnotes as anchors ([#1117](https://github.com/dendronhq/dendron/issues/1117)) ([2168991](https://github.com/dendronhq/dendron/commit/21689914d0c84735d243b988dcceb276df97380f))
* CopyNoteRef respects noXVaultWikiLink option ([#1085](https://github.com/dendronhq/dendron/issues/1085)) ([b4b3da3](https://github.com/dendronhq/dendron/commit/b4b3da3306e2c5621c3c79a53b9f6e4cc31856c6)), closes [#1072](https://github.com/dendronhq/dendron/issues/1072)
* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* extension readme getting started link ([#1084](https://github.com/dendronhq/dendron/issues/1084)) ([d3f5b7d](https://github.com/dendronhq/dendron/commit/d3f5b7dc49873cbbb9e44ce1ff473cd4d95e1214))
* FM tags with quoted strings & with spaces ([1a16689](https://github.com/dendronhq/dendron/commit/1a1668914f70b48a4e74a218bd43521df226de38))
* highlighting is not displayed ([#1083](https://github.com/dendronhq/dendron/issues/1083)) ([86ead9b](https://github.com/dendronhq/dendron/commit/86ead9b7ec66a51712a265f263a515c624f2861c))
* issue with direct child filter partially omitting values in quickpick ([#1123](https://github.com/dendronhq/dendron/issues/1123)) ([fbabab4](https://github.com/dendronhq/dendron/commit/fbabab4b61c91f3ebbe62def339efb32e1815178))
* lookupv3 selection issue ([#1130](https://github.com/dendronhq/dendron/issues/1130)) ([c807e88](https://github.com/dendronhq/dendron/commit/c807e88a82217e5a04dfddb5a24259a50bea4813))
* properly debounce picker update ([#1111](https://github.com/dendronhq/dendron/issues/1111)) ([ae12e1e](https://github.com/dendronhq/dendron/commit/ae12e1ec39e6d75c9c47e27eff7f96418984da4a))
* skip delayed decoration update if note is closed ([2d91164](https://github.com/dendronhq/dendron/commit/2d9116489b2d1f4d5ccd6d22c022af2da9984817))
* uninstall hook force flush ([#1087](https://github.com/dendronhq/dendron/issues/1087)) ([386aac2](https://github.com/dendronhq/dendron/commit/386aac2b8036cd58c190da99609cef2d3ed2467f))


### Features Dendron

* add journal title override to NoteLookupCommand ([#1140](https://github.com/dendronhq/dendron/issues/1140)) ([173b0c9](https://github.com/dendronhq/dendron/commit/173b0c95d7ca9593e72e2cd1c39e4fdcf31fa64a))
* **calendar:** enable webui by default ([#1127](https://github.com/dendronhq/dendron/issues/1127)) ([3ce8be0](https://github.com/dendronhq/dendron/commit/3ce8be05f50c0fef784eef1b6d02e4816e1bf44a))
* add remaining modifiers to NoteLookup ([#1056](https://github.com/dendronhq/dendron/issues/1056)) ([49c6005](https://github.com/dendronhq/dendron/commit/49c6005d2a2c8fd422eb653977e926084e743d6a)), closes [#1045](https://github.com/dendronhq/dendron/issues/1045) [#1046](https://github.com/dendronhq/dendron/issues/1046)
* add schema suggestion to NoteLookupCommand ([#1113](https://github.com/dendronhq/dendron/issues/1113)) ([7dbd03f](https://github.com/dendronhq/dendron/commit/7dbd03f20586d5174c13a40ed50eecfd8b4c788d))
* add schema templating feature to NoteLookupCommand ([#1118](https://github.com/dendronhq/dendron/issues/1118)) ([8a4cd2b](https://github.com/dendronhq/dendron/commit/8a4cd2b337521abcc25df61e145ef6868c50ea0f))
* Add SchemaLookupCommand ([#1082](https://github.com/dendronhq/dendron/issues/1082)) ([fe11a0e](https://github.com/dendronhq/dendron/commit/fe11a0ea1e0214823dd01842b941456df164bc70))
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* provide YAML validator & suggest YAML extension ([#1116](https://github.com/dendronhq/dendron/issues/1116)) ([b46f091](https://github.com/dendronhq/dendron/commit/b46f0916f9f01fdd7b71b6b5120c38a71d58b113))
* re-engage lapsed users with prompt ([#1086](https://github.com/dendronhq/dendron/issues/1086)) ([f4e6dc5](https://github.com/dendronhq/dendron/commit/f4e6dc563aafdfc0b46966e74d9b38920aee1207))
* rename header updates default link aliases ([1f0e405](https://github.com/dendronhq/dendron/commit/1f0e405d2c67a547fdecc41d76f062251a7cae01))
* resolve vim keybinding conflict on initial install ([#1103](https://github.com/dendronhq/dendron/issues/1103)) ([2278c66](https://github.com/dendronhq/dendron/commit/2278c6616c8297cc414ad02d5323bff5c45072e4))
* seed cmds in plugin ([#1080](https://github.com/dendronhq/dendron/issues/1080)) ([e07a092](https://github.com/dendronhq/dendron/commit/e07a092b1a75548574f2ea45f1b465490b2091f3))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





# [0.55.0](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.55.0) (2021-08-17)


### Bug Fixes

* hiding quickpick doesn't dispose of picker ([781923a](https://github.com/dendronhq/dendron/commit/781923a679426ec4f29bd4600e29437ce1902d6f))
* multiple issues with lookupv3 ([1fdd9eb](https://github.com/dendronhq/dendron/commit/1fdd9eb3242b43539572a1993fefd174640c6d83))
* regression with move note command ([5e357b8](https://github.com/dendronhq/dendron/commit/5e357b8995ff335aa36ad48777a96ee56b196c01))


### Features Dendron

* Insert Note Index command ([#1142](https://github.com/dendronhq/dendron/issues/1142)) ([c140015](https://github.com/dendronhq/dendron/commit/c140015c19a942cf4696d596e818fd89905eea25))
* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Bug Fixes

* accept splitType argument in lookup v2 ([#1102](https://github.com/dendronhq/dendron/issues/1102)) ([a1120e4](https://github.com/dendronhq/dendron/commit/a1120e449af9776a14d2bcbb47f8d877ebd1227b))
* CopyNoteLink copies footnotes as anchors ([#1117](https://github.com/dendronhq/dendron/issues/1117)) ([2168991](https://github.com/dendronhq/dendron/commit/21689914d0c84735d243b988dcceb276df97380f))
* CopyNoteRef respects noXVaultWikiLink option ([#1085](https://github.com/dendronhq/dendron/issues/1085)) ([b4b3da3](https://github.com/dendronhq/dendron/commit/b4b3da3306e2c5621c3c79a53b9f6e4cc31856c6)), closes [#1072](https://github.com/dendronhq/dendron/issues/1072)
* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* extension readme getting started link ([#1084](https://github.com/dendronhq/dendron/issues/1084)) ([d3f5b7d](https://github.com/dendronhq/dendron/commit/d3f5b7dc49873cbbb9e44ce1ff473cd4d95e1214))
* FM tags with quoted strings & with spaces ([1a16689](https://github.com/dendronhq/dendron/commit/1a1668914f70b48a4e74a218bd43521df226de38))
* highlighting is not displayed ([#1083](https://github.com/dendronhq/dendron/issues/1083)) ([86ead9b](https://github.com/dendronhq/dendron/commit/86ead9b7ec66a51712a265f263a515c624f2861c))
* issue with direct child filter partially omitting values in quickpick ([#1123](https://github.com/dendronhq/dendron/issues/1123)) ([fbabab4](https://github.com/dendronhq/dendron/commit/fbabab4b61c91f3ebbe62def339efb32e1815178))
* lookupv3 selection issue ([#1130](https://github.com/dendronhq/dendron/issues/1130)) ([c807e88](https://github.com/dendronhq/dendron/commit/c807e88a82217e5a04dfddb5a24259a50bea4813))
* properly debounce picker update ([#1111](https://github.com/dendronhq/dendron/issues/1111)) ([ae12e1e](https://github.com/dendronhq/dendron/commit/ae12e1ec39e6d75c9c47e27eff7f96418984da4a))
* skip delayed decoration update if note is closed ([2d91164](https://github.com/dendronhq/dendron/commit/2d9116489b2d1f4d5ccd6d22c022af2da9984817))
* uninstall hook force flush ([#1087](https://github.com/dendronhq/dendron/issues/1087)) ([386aac2](https://github.com/dendronhq/dendron/commit/386aac2b8036cd58c190da99609cef2d3ed2467f))


### Features Dendron

* add journal title override to NoteLookupCommand ([#1140](https://github.com/dendronhq/dendron/issues/1140)) ([173b0c9](https://github.com/dendronhq/dendron/commit/173b0c95d7ca9593e72e2cd1c39e4fdcf31fa64a))
* **calendar:** enable webui by default ([#1127](https://github.com/dendronhq/dendron/issues/1127)) ([3ce8be0](https://github.com/dendronhq/dendron/commit/3ce8be05f50c0fef784eef1b6d02e4816e1bf44a))
* add remaining modifiers to NoteLookup ([#1056](https://github.com/dendronhq/dendron/issues/1056)) ([49c6005](https://github.com/dendronhq/dendron/commit/49c6005d2a2c8fd422eb653977e926084e743d6a)), closes [#1045](https://github.com/dendronhq/dendron/issues/1045) [#1046](https://github.com/dendronhq/dendron/issues/1046)
* add schema suggestion to NoteLookupCommand ([#1113](https://github.com/dendronhq/dendron/issues/1113)) ([7dbd03f](https://github.com/dendronhq/dendron/commit/7dbd03f20586d5174c13a40ed50eecfd8b4c788d))
* add schema templating feature to NoteLookupCommand ([#1118](https://github.com/dendronhq/dendron/issues/1118)) ([8a4cd2b](https://github.com/dendronhq/dendron/commit/8a4cd2b337521abcc25df61e145ef6868c50ea0f))
* Add SchemaLookupCommand ([#1082](https://github.com/dendronhq/dendron/issues/1082)) ([fe11a0e](https://github.com/dendronhq/dendron/commit/fe11a0ea1e0214823dd01842b941456df164bc70))
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* provide YAML validator & suggest YAML extension ([#1116](https://github.com/dendronhq/dendron/issues/1116)) ([b46f091](https://github.com/dendronhq/dendron/commit/b46f0916f9f01fdd7b71b6b5120c38a71d58b113))
* re-engage lapsed users with prompt ([#1086](https://github.com/dendronhq/dendron/issues/1086)) ([f4e6dc5](https://github.com/dendronhq/dendron/commit/f4e6dc563aafdfc0b46966e74d9b38920aee1207))
* rename header updates default link aliases ([1f0e405](https://github.com/dendronhq/dendron/commit/1f0e405d2c67a547fdecc41d76f062251a7cae01))
* resolve vim keybinding conflict on initial install ([#1103](https://github.com/dendronhq/dendron/issues/1103)) ([2278c66](https://github.com/dendronhq/dendron/commit/2278c6616c8297cc414ad02d5323bff5c45072e4))
* seed cmds in plugin ([#1080](https://github.com/dendronhq/dendron/issues/1080)) ([e07a092](https://github.com/dendronhq/dendron/commit/e07a092b1a75548574f2ea45f1b465490b2091f3))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.54.1](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.54.1) (2021-08-13)


### Bug Fixes

* accept splitType argument in lookup v2 ([#1102](https://github.com/dendronhq/dendron/issues/1102)) ([a1120e4](https://github.com/dendronhq/dendron/commit/a1120e449af9776a14d2bcbb47f8d877ebd1227b))
* CopyNoteLink copies footnotes as anchors ([#1117](https://github.com/dendronhq/dendron/issues/1117)) ([2168991](https://github.com/dendronhq/dendron/commit/21689914d0c84735d243b988dcceb276df97380f))
* CopyNoteRef respects noXVaultWikiLink option ([#1085](https://github.com/dendronhq/dendron/issues/1085)) ([b4b3da3](https://github.com/dendronhq/dendron/commit/b4b3da3306e2c5621c3c79a53b9f6e4cc31856c6)), closes [#1072](https://github.com/dendronhq/dendron/issues/1072)
* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* extension readme getting started link ([#1084](https://github.com/dendronhq/dendron/issues/1084)) ([d3f5b7d](https://github.com/dendronhq/dendron/commit/d3f5b7dc49873cbbb9e44ce1ff473cd4d95e1214))
* FM tags with quoted strings & with spaces ([1a16689](https://github.com/dendronhq/dendron/commit/1a1668914f70b48a4e74a218bd43521df226de38))
* highlighting is not displayed ([#1083](https://github.com/dendronhq/dendron/issues/1083)) ([86ead9b](https://github.com/dendronhq/dendron/commit/86ead9b7ec66a51712a265f263a515c624f2861c))
* issue with direct child filter partially omitting values in quickpick ([#1123](https://github.com/dendronhq/dendron/issues/1123)) ([fbabab4](https://github.com/dendronhq/dendron/commit/fbabab4b61c91f3ebbe62def339efb32e1815178))
* lookupv3 selection issue ([#1130](https://github.com/dendronhq/dendron/issues/1130)) ([c807e88](https://github.com/dendronhq/dendron/commit/c807e88a82217e5a04dfddb5a24259a50bea4813))
* properly debounce picker update ([#1111](https://github.com/dendronhq/dendron/issues/1111)) ([ae12e1e](https://github.com/dendronhq/dendron/commit/ae12e1ec39e6d75c9c47e27eff7f96418984da4a))
* skip delayed decoration update if note is closed ([2d91164](https://github.com/dendronhq/dendron/commit/2d9116489b2d1f4d5ccd6d22c022af2da9984817))
* uninstall hook force flush ([#1087](https://github.com/dendronhq/dendron/issues/1087)) ([386aac2](https://github.com/dendronhq/dendron/commit/386aac2b8036cd58c190da99609cef2d3ed2467f))


### Features Dendron

* add journal title override to NoteLookupCommand ([#1140](https://github.com/dendronhq/dendron/issues/1140)) ([173b0c9](https://github.com/dendronhq/dendron/commit/173b0c95d7ca9593e72e2cd1c39e4fdcf31fa64a))
* **calendar:** enable webui by default ([#1127](https://github.com/dendronhq/dendron/issues/1127)) ([3ce8be0](https://github.com/dendronhq/dendron/commit/3ce8be05f50c0fef784eef1b6d02e4816e1bf44a))
* add remaining modifiers to NoteLookup ([#1056](https://github.com/dendronhq/dendron/issues/1056)) ([49c6005](https://github.com/dendronhq/dendron/commit/49c6005d2a2c8fd422eb653977e926084e743d6a)), closes [#1045](https://github.com/dendronhq/dendron/issues/1045) [#1046](https://github.com/dendronhq/dendron/issues/1046)
* add schema suggestion to NoteLookupCommand ([#1113](https://github.com/dendronhq/dendron/issues/1113)) ([7dbd03f](https://github.com/dendronhq/dendron/commit/7dbd03f20586d5174c13a40ed50eecfd8b4c788d))
* add schema templating feature to NoteLookupCommand ([#1118](https://github.com/dendronhq/dendron/issues/1118)) ([8a4cd2b](https://github.com/dendronhq/dendron/commit/8a4cd2b337521abcc25df61e145ef6868c50ea0f))
* Add SchemaLookupCommand ([#1082](https://github.com/dendronhq/dendron/issues/1082)) ([fe11a0e](https://github.com/dendronhq/dendron/commit/fe11a0ea1e0214823dd01842b941456df164bc70))
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* provide YAML validator & suggest YAML extension ([#1116](https://github.com/dendronhq/dendron/issues/1116)) ([b46f091](https://github.com/dendronhq/dendron/commit/b46f0916f9f01fdd7b71b6b5120c38a71d58b113))
* re-engage lapsed users with prompt ([#1086](https://github.com/dendronhq/dendron/issues/1086)) ([f4e6dc5](https://github.com/dendronhq/dendron/commit/f4e6dc563aafdfc0b46966e74d9b38920aee1207))
* rename header updates default link aliases ([1f0e405](https://github.com/dendronhq/dendron/commit/1f0e405d2c67a547fdecc41d76f062251a7cae01))
* resolve vim keybinding conflict on initial install ([#1103](https://github.com/dendronhq/dendron/issues/1103)) ([2278c66](https://github.com/dendronhq/dendron/commit/2278c6616c8297cc414ad02d5323bff5c45072e4))
* seed cmds in plugin ([#1080](https://github.com/dendronhq/dendron/issues/1080)) ([e07a092](https://github.com/dendronhq/dendron/commit/e07a092b1a75548574f2ea45f1b465490b2091f3))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





# [0.54.0](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.54.0) (2021-08-10)


### Bug Fixes

* accept splitType argument in lookup v2 ([#1102](https://github.com/dendronhq/dendron/issues/1102)) ([a1120e4](https://github.com/dendronhq/dendron/commit/a1120e449af9776a14d2bcbb47f8d877ebd1227b))
* CopyNoteRef respects noXVaultWikiLink option ([#1085](https://github.com/dendronhq/dendron/issues/1085)) ([b4b3da3](https://github.com/dendronhq/dendron/commit/b4b3da3306e2c5621c3c79a53b9f6e4cc31856c6)), closes [#1072](https://github.com/dendronhq/dendron/issues/1072)
* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* extension readme getting started link ([#1084](https://github.com/dendronhq/dendron/issues/1084)) ([d3f5b7d](https://github.com/dendronhq/dendron/commit/d3f5b7dc49873cbbb9e44ce1ff473cd4d95e1214))
* FM tags with quoted strings & with spaces ([1a16689](https://github.com/dendronhq/dendron/commit/1a1668914f70b48a4e74a218bd43521df226de38))
* highlighting is not displayed ([#1083](https://github.com/dendronhq/dendron/issues/1083)) ([86ead9b](https://github.com/dendronhq/dendron/commit/86ead9b7ec66a51712a265f263a515c624f2861c))
* properly debounce picker update ([#1111](https://github.com/dendronhq/dendron/issues/1111)) ([ae12e1e](https://github.com/dendronhq/dendron/commit/ae12e1ec39e6d75c9c47e27eff7f96418984da4a))
* skip delayed decoration update if note is closed ([2d91164](https://github.com/dendronhq/dendron/commit/2d9116489b2d1f4d5ccd6d22c022af2da9984817))
* uninstall hook force flush ([#1087](https://github.com/dendronhq/dendron/issues/1087)) ([386aac2](https://github.com/dendronhq/dendron/commit/386aac2b8036cd58c190da99609cef2d3ed2467f))


### Features Dendron

* add remaining modifiers to NoteLookup ([#1056](https://github.com/dendronhq/dendron/issues/1056)) ([49c6005](https://github.com/dendronhq/dendron/commit/49c6005d2a2c8fd422eb653977e926084e743d6a)), closes [#1045](https://github.com/dendronhq/dendron/issues/1045) [#1046](https://github.com/dendronhq/dendron/issues/1046)
* add schema suggestion to NoteLookupCommand ([#1113](https://github.com/dendronhq/dendron/issues/1113)) ([7dbd03f](https://github.com/dendronhq/dendron/commit/7dbd03f20586d5174c13a40ed50eecfd8b4c788d))
* Add SchemaLookupCommand ([#1082](https://github.com/dendronhq/dendron/issues/1082)) ([fe11a0e](https://github.com/dendronhq/dendron/commit/fe11a0ea1e0214823dd01842b941456df164bc70))
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* re-engage lapsed users with prompt ([#1086](https://github.com/dendronhq/dendron/issues/1086)) ([f4e6dc5](https://github.com/dendronhq/dendron/commit/f4e6dc563aafdfc0b46966e74d9b38920aee1207))
* rename header updates default link aliases ([1f0e405](https://github.com/dendronhq/dendron/commit/1f0e405d2c67a547fdecc41d76f062251a7cae01))
* resolve vim keybinding conflict on initial install ([#1103](https://github.com/dendronhq/dendron/issues/1103)) ([2278c66](https://github.com/dendronhq/dendron/commit/2278c6616c8297cc414ad02d5323bff5c45072e4))
* seed cmds in plugin ([#1080](https://github.com/dendronhq/dendron/issues/1080)) ([e07a092](https://github.com/dendronhq/dendron/commit/e07a092b1a75548574f2ea45f1b465490b2091f3))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.53.10](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.53.10) (2021-08-10)


### Bug Fixes

* accept splitType argument in lookup v2 ([#1102](https://github.com/dendronhq/dendron/issues/1102)) ([a1120e4](https://github.com/dendronhq/dendron/commit/a1120e449af9776a14d2bcbb47f8d877ebd1227b))
* CopyNoteRef respects noXVaultWikiLink option ([#1085](https://github.com/dendronhq/dendron/issues/1085)) ([b4b3da3](https://github.com/dendronhq/dendron/commit/b4b3da3306e2c5621c3c79a53b9f6e4cc31856c6)), closes [#1072](https://github.com/dendronhq/dendron/issues/1072)
* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* extension readme getting started link ([#1084](https://github.com/dendronhq/dendron/issues/1084)) ([d3f5b7d](https://github.com/dendronhq/dendron/commit/d3f5b7dc49873cbbb9e44ce1ff473cd4d95e1214))
* FM tags with quoted strings & with spaces ([1a16689](https://github.com/dendronhq/dendron/commit/1a1668914f70b48a4e74a218bd43521df226de38))
* highlighting is not displayed ([#1083](https://github.com/dendronhq/dendron/issues/1083)) ([86ead9b](https://github.com/dendronhq/dendron/commit/86ead9b7ec66a51712a265f263a515c624f2861c))
* properly debounce picker update ([#1111](https://github.com/dendronhq/dendron/issues/1111)) ([ae12e1e](https://github.com/dendronhq/dendron/commit/ae12e1ec39e6d75c9c47e27eff7f96418984da4a))
* skip delayed decoration update if note is closed ([2d91164](https://github.com/dendronhq/dendron/commit/2d9116489b2d1f4d5ccd6d22c022af2da9984817))
* uninstall hook force flush ([#1087](https://github.com/dendronhq/dendron/issues/1087)) ([386aac2](https://github.com/dendronhq/dendron/commit/386aac2b8036cd58c190da99609cef2d3ed2467f))


### Features Dendron

* add remaining modifiers to NoteLookup ([#1056](https://github.com/dendronhq/dendron/issues/1056)) ([49c6005](https://github.com/dendronhq/dendron/commit/49c6005d2a2c8fd422eb653977e926084e743d6a)), closes [#1045](https://github.com/dendronhq/dendron/issues/1045) [#1046](https://github.com/dendronhq/dendron/issues/1046)
* add schema suggestion to NoteLookupCommand ([#1113](https://github.com/dendronhq/dendron/issues/1113)) ([7dbd03f](https://github.com/dendronhq/dendron/commit/7dbd03f20586d5174c13a40ed50eecfd8b4c788d))
* Add SchemaLookupCommand ([#1082](https://github.com/dendronhq/dendron/issues/1082)) ([fe11a0e](https://github.com/dendronhq/dendron/commit/fe11a0ea1e0214823dd01842b941456df164bc70))
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* re-engage lapsed users with prompt ([#1086](https://github.com/dendronhq/dendron/issues/1086)) ([f4e6dc5](https://github.com/dendronhq/dendron/commit/f4e6dc563aafdfc0b46966e74d9b38920aee1207))
* rename header updates default link aliases ([1f0e405](https://github.com/dendronhq/dendron/commit/1f0e405d2c67a547fdecc41d76f062251a7cae01))
* resolve vim keybinding conflict on initial install ([#1103](https://github.com/dendronhq/dendron/issues/1103)) ([2278c66](https://github.com/dendronhq/dendron/commit/2278c6616c8297cc414ad02d5323bff5c45072e4))
* seed cmds in plugin ([#1080](https://github.com/dendronhq/dendron/issues/1080)) ([e07a092](https://github.com/dendronhq/dendron/commit/e07a092b1a75548574f2ea45f1b465490b2091f3))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.53.9](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.53.9) (2021-08-10)


### Bug Fixes

* accept splitType argument in lookup v2 ([#1102](https://github.com/dendronhq/dendron/issues/1102)) ([a1120e4](https://github.com/dendronhq/dendron/commit/a1120e449af9776a14d2bcbb47f8d877ebd1227b))
* CopyNoteRef respects noXVaultWikiLink option ([#1085](https://github.com/dendronhq/dendron/issues/1085)) ([b4b3da3](https://github.com/dendronhq/dendron/commit/b4b3da3306e2c5621c3c79a53b9f6e4cc31856c6)), closes [#1072](https://github.com/dendronhq/dendron/issues/1072)
* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* extension readme getting started link ([#1084](https://github.com/dendronhq/dendron/issues/1084)) ([d3f5b7d](https://github.com/dendronhq/dendron/commit/d3f5b7dc49873cbbb9e44ce1ff473cd4d95e1214))
* FM tags with quoted strings & with spaces ([1a16689](https://github.com/dendronhq/dendron/commit/1a1668914f70b48a4e74a218bd43521df226de38))
* highlighting is not displayed ([#1083](https://github.com/dendronhq/dendron/issues/1083)) ([86ead9b](https://github.com/dendronhq/dendron/commit/86ead9b7ec66a51712a265f263a515c624f2861c))
* properly debounce picker update ([#1111](https://github.com/dendronhq/dendron/issues/1111)) ([ae12e1e](https://github.com/dendronhq/dendron/commit/ae12e1ec39e6d75c9c47e27eff7f96418984da4a))
* skip delayed decoration update if note is closed ([2d91164](https://github.com/dendronhq/dendron/commit/2d9116489b2d1f4d5ccd6d22c022af2da9984817))
* uninstall hook force flush ([#1087](https://github.com/dendronhq/dendron/issues/1087)) ([386aac2](https://github.com/dendronhq/dendron/commit/386aac2b8036cd58c190da99609cef2d3ed2467f))


### Features Dendron

* add remaining modifiers to NoteLookup ([#1056](https://github.com/dendronhq/dendron/issues/1056)) ([49c6005](https://github.com/dendronhq/dendron/commit/49c6005d2a2c8fd422eb653977e926084e743d6a)), closes [#1045](https://github.com/dendronhq/dendron/issues/1045) [#1046](https://github.com/dendronhq/dendron/issues/1046)
* add schema suggestion to NoteLookupCommand ([#1113](https://github.com/dendronhq/dendron/issues/1113)) ([7dbd03f](https://github.com/dendronhq/dendron/commit/7dbd03f20586d5174c13a40ed50eecfd8b4c788d))
* Add SchemaLookupCommand ([#1082](https://github.com/dendronhq/dendron/issues/1082)) ([fe11a0e](https://github.com/dendronhq/dendron/commit/fe11a0ea1e0214823dd01842b941456df164bc70))
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* re-engage lapsed users with prompt ([#1086](https://github.com/dendronhq/dendron/issues/1086)) ([f4e6dc5](https://github.com/dendronhq/dendron/commit/f4e6dc563aafdfc0b46966e74d9b38920aee1207))
* rename header updates default link aliases ([1f0e405](https://github.com/dendronhq/dendron/commit/1f0e405d2c67a547fdecc41d76f062251a7cae01))
* resolve vim keybinding conflict on initial install ([#1103](https://github.com/dendronhq/dendron/issues/1103)) ([2278c66](https://github.com/dendronhq/dendron/commit/2278c6616c8297cc414ad02d5323bff5c45072e4))
* seed cmds in plugin ([#1080](https://github.com/dendronhq/dendron/issues/1080)) ([e07a092](https://github.com/dendronhq/dendron/commit/e07a092b1a75548574f2ea45f1b465490b2091f3))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.53.8](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.53.8) (2021-08-10)


### Bug Fixes

* accept splitType argument in lookup v2 ([#1102](https://github.com/dendronhq/dendron/issues/1102)) ([a1120e4](https://github.com/dendronhq/dendron/commit/a1120e449af9776a14d2bcbb47f8d877ebd1227b))
* CopyNoteRef respects noXVaultWikiLink option ([#1085](https://github.com/dendronhq/dendron/issues/1085)) ([b4b3da3](https://github.com/dendronhq/dendron/commit/b4b3da3306e2c5621c3c79a53b9f6e4cc31856c6)), closes [#1072](https://github.com/dendronhq/dendron/issues/1072)
* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* extension readme getting started link ([#1084](https://github.com/dendronhq/dendron/issues/1084)) ([d3f5b7d](https://github.com/dendronhq/dendron/commit/d3f5b7dc49873cbbb9e44ce1ff473cd4d95e1214))
* FM tags with quoted strings & with spaces ([1a16689](https://github.com/dendronhq/dendron/commit/1a1668914f70b48a4e74a218bd43521df226de38))
* highlighting is not displayed ([#1083](https://github.com/dendronhq/dendron/issues/1083)) ([86ead9b](https://github.com/dendronhq/dendron/commit/86ead9b7ec66a51712a265f263a515c624f2861c))
* properly debounce picker update ([#1111](https://github.com/dendronhq/dendron/issues/1111)) ([ae12e1e](https://github.com/dendronhq/dendron/commit/ae12e1ec39e6d75c9c47e27eff7f96418984da4a))
* skip delayed decoration update if note is closed ([2d91164](https://github.com/dendronhq/dendron/commit/2d9116489b2d1f4d5ccd6d22c022af2da9984817))
* uninstall hook force flush ([#1087](https://github.com/dendronhq/dendron/issues/1087)) ([386aac2](https://github.com/dendronhq/dendron/commit/386aac2b8036cd58c190da99609cef2d3ed2467f))


### Features Dendron

* add remaining modifiers to NoteLookup ([#1056](https://github.com/dendronhq/dendron/issues/1056)) ([49c6005](https://github.com/dendronhq/dendron/commit/49c6005d2a2c8fd422eb653977e926084e743d6a)), closes [#1045](https://github.com/dendronhq/dendron/issues/1045) [#1046](https://github.com/dendronhq/dendron/issues/1046)
* add schema suggestion to NoteLookupCommand ([#1113](https://github.com/dendronhq/dendron/issues/1113)) ([7dbd03f](https://github.com/dendronhq/dendron/commit/7dbd03f20586d5174c13a40ed50eecfd8b4c788d))
* Add SchemaLookupCommand ([#1082](https://github.com/dendronhq/dendron/issues/1082)) ([fe11a0e](https://github.com/dendronhq/dendron/commit/fe11a0ea1e0214823dd01842b941456df164bc70))
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* re-engage lapsed users with prompt ([#1086](https://github.com/dendronhq/dendron/issues/1086)) ([f4e6dc5](https://github.com/dendronhq/dendron/commit/f4e6dc563aafdfc0b46966e74d9b38920aee1207))
* rename header updates default link aliases ([1f0e405](https://github.com/dendronhq/dendron/commit/1f0e405d2c67a547fdecc41d76f062251a7cae01))
* resolve vim keybinding conflict on initial install ([#1103](https://github.com/dendronhq/dendron/issues/1103)) ([2278c66](https://github.com/dendronhq/dendron/commit/2278c6616c8297cc414ad02d5323bff5c45072e4))
* seed cmds in plugin ([#1080](https://github.com/dendronhq/dendron/issues/1080)) ([e07a092](https://github.com/dendronhq/dendron/commit/e07a092b1a75548574f2ea45f1b465490b2091f3))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.53.7](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.53.7) (2021-08-10)


### Bug Fixes

* accept splitType argument in lookup v2 ([#1102](https://github.com/dendronhq/dendron/issues/1102)) ([a1120e4](https://github.com/dendronhq/dendron/commit/a1120e449af9776a14d2bcbb47f8d877ebd1227b))
* CopyNoteRef respects noXVaultWikiLink option ([#1085](https://github.com/dendronhq/dendron/issues/1085)) ([b4b3da3](https://github.com/dendronhq/dendron/commit/b4b3da3306e2c5621c3c79a53b9f6e4cc31856c6)), closes [#1072](https://github.com/dendronhq/dendron/issues/1072)
* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* extension readme getting started link ([#1084](https://github.com/dendronhq/dendron/issues/1084)) ([d3f5b7d](https://github.com/dendronhq/dendron/commit/d3f5b7dc49873cbbb9e44ce1ff473cd4d95e1214))
* FM tags with quoted strings & with spaces ([1a16689](https://github.com/dendronhq/dendron/commit/1a1668914f70b48a4e74a218bd43521df226de38))
* highlighting is not displayed ([#1083](https://github.com/dendronhq/dendron/issues/1083)) ([86ead9b](https://github.com/dendronhq/dendron/commit/86ead9b7ec66a51712a265f263a515c624f2861c))
* properly debounce picker update ([#1111](https://github.com/dendronhq/dendron/issues/1111)) ([ae12e1e](https://github.com/dendronhq/dendron/commit/ae12e1ec39e6d75c9c47e27eff7f96418984da4a))
* skip delayed decoration update if note is closed ([2d91164](https://github.com/dendronhq/dendron/commit/2d9116489b2d1f4d5ccd6d22c022af2da9984817))
* uninstall hook force flush ([#1087](https://github.com/dendronhq/dendron/issues/1087)) ([386aac2](https://github.com/dendronhq/dendron/commit/386aac2b8036cd58c190da99609cef2d3ed2467f))


### Features Dendron

* add remaining modifiers to NoteLookup ([#1056](https://github.com/dendronhq/dendron/issues/1056)) ([49c6005](https://github.com/dendronhq/dendron/commit/49c6005d2a2c8fd422eb653977e926084e743d6a)), closes [#1045](https://github.com/dendronhq/dendron/issues/1045) [#1046](https://github.com/dendronhq/dendron/issues/1046)
* add schema suggestion to NoteLookupCommand ([#1113](https://github.com/dendronhq/dendron/issues/1113)) ([7dbd03f](https://github.com/dendronhq/dendron/commit/7dbd03f20586d5174c13a40ed50eecfd8b4c788d))
* Add SchemaLookupCommand ([#1082](https://github.com/dendronhq/dendron/issues/1082)) ([fe11a0e](https://github.com/dendronhq/dendron/commit/fe11a0ea1e0214823dd01842b941456df164bc70))
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* re-engage lapsed users with prompt ([#1086](https://github.com/dendronhq/dendron/issues/1086)) ([f4e6dc5](https://github.com/dendronhq/dendron/commit/f4e6dc563aafdfc0b46966e74d9b38920aee1207))
* rename header updates default link aliases ([1f0e405](https://github.com/dendronhq/dendron/commit/1f0e405d2c67a547fdecc41d76f062251a7cae01))
* resolve vim keybinding conflict on initial install ([#1103](https://github.com/dendronhq/dendron/issues/1103)) ([2278c66](https://github.com/dendronhq/dendron/commit/2278c6616c8297cc414ad02d5323bff5c45072e4))
* seed cmds in plugin ([#1080](https://github.com/dendronhq/dendron/issues/1080)) ([e07a092](https://github.com/dendronhq/dendron/commit/e07a092b1a75548574f2ea45f1b465490b2091f3))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.53.6](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.53.6) (2021-08-10)


### Bug Fixes

* accept splitType argument in lookup v2 ([#1102](https://github.com/dendronhq/dendron/issues/1102)) ([a1120e4](https://github.com/dendronhq/dendron/commit/a1120e449af9776a14d2bcbb47f8d877ebd1227b))
* CopyNoteRef respects noXVaultWikiLink option ([#1085](https://github.com/dendronhq/dendron/issues/1085)) ([b4b3da3](https://github.com/dendronhq/dendron/commit/b4b3da3306e2c5621c3c79a53b9f6e4cc31856c6)), closes [#1072](https://github.com/dendronhq/dendron/issues/1072)
* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* extension readme getting started link ([#1084](https://github.com/dendronhq/dendron/issues/1084)) ([d3f5b7d](https://github.com/dendronhq/dendron/commit/d3f5b7dc49873cbbb9e44ce1ff473cd4d95e1214))
* FM tags with quoted strings & with spaces ([1a16689](https://github.com/dendronhq/dendron/commit/1a1668914f70b48a4e74a218bd43521df226de38))
* highlighting is not displayed ([#1083](https://github.com/dendronhq/dendron/issues/1083)) ([86ead9b](https://github.com/dendronhq/dendron/commit/86ead9b7ec66a51712a265f263a515c624f2861c))
* properly debounce picker update ([#1111](https://github.com/dendronhq/dendron/issues/1111)) ([ae12e1e](https://github.com/dendronhq/dendron/commit/ae12e1ec39e6d75c9c47e27eff7f96418984da4a))
* skip delayed decoration update if note is closed ([2d91164](https://github.com/dendronhq/dendron/commit/2d9116489b2d1f4d5ccd6d22c022af2da9984817))
* uninstall hook force flush ([#1087](https://github.com/dendronhq/dendron/issues/1087)) ([386aac2](https://github.com/dendronhq/dendron/commit/386aac2b8036cd58c190da99609cef2d3ed2467f))


### Features Dendron

* add remaining modifiers to NoteLookup ([#1056](https://github.com/dendronhq/dendron/issues/1056)) ([49c6005](https://github.com/dendronhq/dendron/commit/49c6005d2a2c8fd422eb653977e926084e743d6a)), closes [#1045](https://github.com/dendronhq/dendron/issues/1045) [#1046](https://github.com/dendronhq/dendron/issues/1046)
* add schema suggestion to NoteLookupCommand ([#1113](https://github.com/dendronhq/dendron/issues/1113)) ([7dbd03f](https://github.com/dendronhq/dendron/commit/7dbd03f20586d5174c13a40ed50eecfd8b4c788d))
* Add SchemaLookupCommand ([#1082](https://github.com/dendronhq/dendron/issues/1082)) ([fe11a0e](https://github.com/dendronhq/dendron/commit/fe11a0ea1e0214823dd01842b941456df164bc70))
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* re-engage lapsed users with prompt ([#1086](https://github.com/dendronhq/dendron/issues/1086)) ([f4e6dc5](https://github.com/dendronhq/dendron/commit/f4e6dc563aafdfc0b46966e74d9b38920aee1207))
* rename header updates default link aliases ([1f0e405](https://github.com/dendronhq/dendron/commit/1f0e405d2c67a547fdecc41d76f062251a7cae01))
* resolve vim keybinding conflict on initial install ([#1103](https://github.com/dendronhq/dendron/issues/1103)) ([2278c66](https://github.com/dendronhq/dendron/commit/2278c6616c8297cc414ad02d5323bff5c45072e4))
* seed cmds in plugin ([#1080](https://github.com/dendronhq/dendron/issues/1080)) ([e07a092](https://github.com/dendronhq/dendron/commit/e07a092b1a75548574f2ea45f1b465490b2091f3))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.53.5](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.53.5) (2021-08-10)


### Bug Fixes

* accept splitType argument in lookup v2 ([#1102](https://github.com/dendronhq/dendron/issues/1102)) ([a1120e4](https://github.com/dendronhq/dendron/commit/a1120e449af9776a14d2bcbb47f8d877ebd1227b))
* CopyNoteRef respects noXVaultWikiLink option ([#1085](https://github.com/dendronhq/dendron/issues/1085)) ([b4b3da3](https://github.com/dendronhq/dendron/commit/b4b3da3306e2c5621c3c79a53b9f6e4cc31856c6)), closes [#1072](https://github.com/dendronhq/dendron/issues/1072)
* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* extension readme getting started link ([#1084](https://github.com/dendronhq/dendron/issues/1084)) ([d3f5b7d](https://github.com/dendronhq/dendron/commit/d3f5b7dc49873cbbb9e44ce1ff473cd4d95e1214))
* FM tags with quoted strings & with spaces ([1a16689](https://github.com/dendronhq/dendron/commit/1a1668914f70b48a4e74a218bd43521df226de38))
* highlighting is not displayed ([#1083](https://github.com/dendronhq/dendron/issues/1083)) ([86ead9b](https://github.com/dendronhq/dendron/commit/86ead9b7ec66a51712a265f263a515c624f2861c))
* properly debounce picker update ([#1111](https://github.com/dendronhq/dendron/issues/1111)) ([ae12e1e](https://github.com/dendronhq/dendron/commit/ae12e1ec39e6d75c9c47e27eff7f96418984da4a))
* skip delayed decoration update if note is closed ([2d91164](https://github.com/dendronhq/dendron/commit/2d9116489b2d1f4d5ccd6d22c022af2da9984817))
* uninstall hook force flush ([#1087](https://github.com/dendronhq/dendron/issues/1087)) ([386aac2](https://github.com/dendronhq/dendron/commit/386aac2b8036cd58c190da99609cef2d3ed2467f))


### Features Dendron

* add remaining modifiers to NoteLookup ([#1056](https://github.com/dendronhq/dendron/issues/1056)) ([49c6005](https://github.com/dendronhq/dendron/commit/49c6005d2a2c8fd422eb653977e926084e743d6a)), closes [#1045](https://github.com/dendronhq/dendron/issues/1045) [#1046](https://github.com/dendronhq/dendron/issues/1046)
* add schema suggestion to NoteLookupCommand ([#1113](https://github.com/dendronhq/dendron/issues/1113)) ([7dbd03f](https://github.com/dendronhq/dendron/commit/7dbd03f20586d5174c13a40ed50eecfd8b4c788d))
* Add SchemaLookupCommand ([#1082](https://github.com/dendronhq/dendron/issues/1082)) ([fe11a0e](https://github.com/dendronhq/dendron/commit/fe11a0ea1e0214823dd01842b941456df164bc70))
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* re-engage lapsed users with prompt ([#1086](https://github.com/dendronhq/dendron/issues/1086)) ([f4e6dc5](https://github.com/dendronhq/dendron/commit/f4e6dc563aafdfc0b46966e74d9b38920aee1207))
* rename header updates default link aliases ([1f0e405](https://github.com/dendronhq/dendron/commit/1f0e405d2c67a547fdecc41d76f062251a7cae01))
* resolve vim keybinding conflict on initial install ([#1103](https://github.com/dendronhq/dendron/issues/1103)) ([2278c66](https://github.com/dendronhq/dendron/commit/2278c6616c8297cc414ad02d5323bff5c45072e4))
* seed cmds in plugin ([#1080](https://github.com/dendronhq/dendron/issues/1080)) ([e07a092](https://github.com/dendronhq/dendron/commit/e07a092b1a75548574f2ea45f1b465490b2091f3))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.53.4](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.53.4) (2021-08-10)


### Bug Fixes

* accept splitType argument in lookup v2 ([#1102](https://github.com/dendronhq/dendron/issues/1102)) ([a1120e4](https://github.com/dendronhq/dendron/commit/a1120e449af9776a14d2bcbb47f8d877ebd1227b))
* CopyNoteRef respects noXVaultWikiLink option ([#1085](https://github.com/dendronhq/dendron/issues/1085)) ([b4b3da3](https://github.com/dendronhq/dendron/commit/b4b3da3306e2c5621c3c79a53b9f6e4cc31856c6)), closes [#1072](https://github.com/dendronhq/dendron/issues/1072)
* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* extension readme getting started link ([#1084](https://github.com/dendronhq/dendron/issues/1084)) ([d3f5b7d](https://github.com/dendronhq/dendron/commit/d3f5b7dc49873cbbb9e44ce1ff473cd4d95e1214))
* FM tags with quoted strings & with spaces ([1a16689](https://github.com/dendronhq/dendron/commit/1a1668914f70b48a4e74a218bd43521df226de38))
* highlighting is not displayed ([#1083](https://github.com/dendronhq/dendron/issues/1083)) ([86ead9b](https://github.com/dendronhq/dendron/commit/86ead9b7ec66a51712a265f263a515c624f2861c))
* properly debounce picker update ([#1111](https://github.com/dendronhq/dendron/issues/1111)) ([ae12e1e](https://github.com/dendronhq/dendron/commit/ae12e1ec39e6d75c9c47e27eff7f96418984da4a))
* skip delayed decoration update if note is closed ([2d91164](https://github.com/dendronhq/dendron/commit/2d9116489b2d1f4d5ccd6d22c022af2da9984817))
* uninstall hook force flush ([#1087](https://github.com/dendronhq/dendron/issues/1087)) ([386aac2](https://github.com/dendronhq/dendron/commit/386aac2b8036cd58c190da99609cef2d3ed2467f))


### Features Dendron

* add remaining modifiers to NoteLookup ([#1056](https://github.com/dendronhq/dendron/issues/1056)) ([49c6005](https://github.com/dendronhq/dendron/commit/49c6005d2a2c8fd422eb653977e926084e743d6a)), closes [#1045](https://github.com/dendronhq/dendron/issues/1045) [#1046](https://github.com/dendronhq/dendron/issues/1046)
* add schema suggestion to NoteLookupCommand ([#1113](https://github.com/dendronhq/dendron/issues/1113)) ([7dbd03f](https://github.com/dendronhq/dendron/commit/7dbd03f20586d5174c13a40ed50eecfd8b4c788d))
* Add SchemaLookupCommand ([#1082](https://github.com/dendronhq/dendron/issues/1082)) ([fe11a0e](https://github.com/dendronhq/dendron/commit/fe11a0ea1e0214823dd01842b941456df164bc70))
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* re-engage lapsed users with prompt ([#1086](https://github.com/dendronhq/dendron/issues/1086)) ([f4e6dc5](https://github.com/dendronhq/dendron/commit/f4e6dc563aafdfc0b46966e74d9b38920aee1207))
* rename header updates default link aliases ([1f0e405](https://github.com/dendronhq/dendron/commit/1f0e405d2c67a547fdecc41d76f062251a7cae01))
* resolve vim keybinding conflict on initial install ([#1103](https://github.com/dendronhq/dendron/issues/1103)) ([2278c66](https://github.com/dendronhq/dendron/commit/2278c6616c8297cc414ad02d5323bff5c45072e4))
* seed cmds in plugin ([#1080](https://github.com/dendronhq/dendron/issues/1080)) ([e07a092](https://github.com/dendronhq/dendron/commit/e07a092b1a75548574f2ea45f1b465490b2091f3))
* tag colors in parents cascade to children ([3c77c06](https://github.com/dendronhq/dendron/commit/3c77c06daad5e32d3d72a4b329632100f7345460))





## [0.53.3](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.53.3) (2021-08-08)


### Bug Fixes

* accept splitType argument in lookup v2 ([#1102](https://github.com/dendronhq/dendron/issues/1102)) ([a1120e4](https://github.com/dendronhq/dendron/commit/a1120e449af9776a14d2bcbb47f8d877ebd1227b))
* CopyNoteRef respects noXVaultWikiLink option ([#1085](https://github.com/dendronhq/dendron/issues/1085)) ([b4b3da3](https://github.com/dendronhq/dendron/commit/b4b3da3306e2c5621c3c79a53b9f6e4cc31856c6)), closes [#1072](https://github.com/dendronhq/dendron/issues/1072)
* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* extension readme getting started link ([#1084](https://github.com/dendronhq/dendron/issues/1084)) ([d3f5b7d](https://github.com/dendronhq/dendron/commit/d3f5b7dc49873cbbb9e44ce1ff473cd4d95e1214))
* FM tags with quoted strings & with spaces ([1a16689](https://github.com/dendronhq/dendron/commit/1a1668914f70b48a4e74a218bd43521df226de38))
* highlighting is not displayed ([#1083](https://github.com/dendronhq/dendron/issues/1083)) ([86ead9b](https://github.com/dendronhq/dendron/commit/86ead9b7ec66a51712a265f263a515c624f2861c))
* skip delayed decoration update if note is closed ([2d91164](https://github.com/dendronhq/dendron/commit/2d9116489b2d1f4d5ccd6d22c022af2da9984817))
* uninstall hook force flush ([#1087](https://github.com/dendronhq/dendron/issues/1087)) ([386aac2](https://github.com/dendronhq/dendron/commit/386aac2b8036cd58c190da99609cef2d3ed2467f))


### Features Dendron

* add remaining modifiers to NoteLookup ([#1056](https://github.com/dendronhq/dendron/issues/1056)) ([49c6005](https://github.com/dendronhq/dendron/commit/49c6005d2a2c8fd422eb653977e926084e743d6a)), closes [#1045](https://github.com/dendronhq/dendron/issues/1045) [#1046](https://github.com/dendronhq/dendron/issues/1046)
* Add SchemaLookupCommand ([#1082](https://github.com/dendronhq/dendron/issues/1082)) ([fe11a0e](https://github.com/dendronhq/dendron/commit/fe11a0ea1e0214823dd01842b941456df164bc70))
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* custom tag coloring ([#1069](https://github.com/dendronhq/dendron/issues/1069)) ([5fe0a3c](https://github.com/dendronhq/dendron/commit/5fe0a3c7c62608f3796c58e4b807061498199168))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* re-engage lapsed users with prompt ([#1086](https://github.com/dendronhq/dendron/issues/1086)) ([f4e6dc5](https://github.com/dendronhq/dendron/commit/f4e6dc563aafdfc0b46966e74d9b38920aee1207))
* rename header updates default link aliases ([1f0e405](https://github.com/dendronhq/dendron/commit/1f0e405d2c67a547fdecc41d76f062251a7cae01))
* seed cmds in plugin ([#1080](https://github.com/dendronhq/dendron/issues/1080)) ([e07a092](https://github.com/dendronhq/dendron/commit/e07a092b1a75548574f2ea45f1b465490b2091f3))





## [0.53.2](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.53.2) (2021-08-06)


### Bug Fixes

* CopyNoteRef respects noXVaultWikiLink option ([#1085](https://github.com/dendronhq/dendron/issues/1085)) ([b4b3da3](https://github.com/dendronhq/dendron/commit/b4b3da3306e2c5621c3c79a53b9f6e4cc31856c6)), closes [#1072](https://github.com/dendronhq/dendron/issues/1072)
* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* extension readme getting started link ([#1084](https://github.com/dendronhq/dendron/issues/1084)) ([d3f5b7d](https://github.com/dendronhq/dendron/commit/d3f5b7dc49873cbbb9e44ce1ff473cd4d95e1214))
* FM tags with quoted strings & with spaces ([1a16689](https://github.com/dendronhq/dendron/commit/1a1668914f70b48a4e74a218bd43521df226de38))
* highlighting is not displayed ([#1083](https://github.com/dendronhq/dendron/issues/1083)) ([86ead9b](https://github.com/dendronhq/dendron/commit/86ead9b7ec66a51712a265f263a515c624f2861c))
* uninstall hook force flush ([#1087](https://github.com/dendronhq/dendron/issues/1087)) ([386aac2](https://github.com/dendronhq/dendron/commit/386aac2b8036cd58c190da99609cef2d3ed2467f))


### Features Dendron

* add remaining modifiers to NoteLookup ([#1056](https://github.com/dendronhq/dendron/issues/1056)) ([49c6005](https://github.com/dendronhq/dendron/commit/49c6005d2a2c8fd422eb653977e926084e743d6a)), closes [#1045](https://github.com/dendronhq/dendron/issues/1045) [#1046](https://github.com/dendronhq/dendron/issues/1046)
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* re-engage lapsed users with prompt ([#1086](https://github.com/dendronhq/dendron/issues/1086)) ([f4e6dc5](https://github.com/dendronhq/dendron/commit/f4e6dc563aafdfc0b46966e74d9b38920aee1207))
* seed cmds in plugin ([#1080](https://github.com/dendronhq/dendron/issues/1080)) ([e07a092](https://github.com/dendronhq/dendron/commit/e07a092b1a75548574f2ea45f1b465490b2091f3))





## [0.53.1](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.53.1) (2021-08-06)


### Bug Fixes

* CopyNoteRef respects noXVaultWikiLink option ([#1085](https://github.com/dendronhq/dendron/issues/1085)) ([b4b3da3](https://github.com/dendronhq/dendron/commit/b4b3da3306e2c5621c3c79a53b9f6e4cc31856c6)), closes [#1072](https://github.com/dendronhq/dendron/issues/1072)
* Doctor `regenerateNoteId` action error ([#1097](https://github.com/dendronhq/dendron/issues/1097)) ([f0480c7](https://github.com/dendronhq/dendron/commit/f0480c7306eb07a2d40ea2b4278757d6c8dd26bb))
* extension readme getting started link ([#1084](https://github.com/dendronhq/dendron/issues/1084)) ([d3f5b7d](https://github.com/dendronhq/dendron/commit/d3f5b7dc49873cbbb9e44ce1ff473cd4d95e1214))
* FM tags with quoted strings & with spaces ([1a16689](https://github.com/dendronhq/dendron/commit/1a1668914f70b48a4e74a218bd43521df226de38))
* highlighting is not displayed ([#1083](https://github.com/dendronhq/dendron/issues/1083)) ([86ead9b](https://github.com/dendronhq/dendron/commit/86ead9b7ec66a51712a265f263a515c624f2861c))
* uninstall hook force flush ([#1087](https://github.com/dendronhq/dendron/issues/1087)) ([386aac2](https://github.com/dendronhq/dendron/commit/386aac2b8036cd58c190da99609cef2d3ed2467f))


### Features Dendron

* add remaining modifiers to NoteLookup ([#1056](https://github.com/dendronhq/dendron/issues/1056)) ([49c6005](https://github.com/dendronhq/dendron/commit/49c6005d2a2c8fd422eb653977e926084e743d6a)), closes [#1045](https://github.com/dendronhq/dendron/issues/1045) [#1046](https://github.com/dendronhq/dendron/issues/1046)
* basic frontmatter tag support ([2fe8ea5](https://github.com/dendronhq/dendron/commit/2fe8ea5733cdf6c047c39b8b9865cb7e5fdb541b))
* goto definition & hover support for frontmatter tags ([18faa1e](https://github.com/dendronhq/dendron/commit/18faa1e1549d2ed6a29118a0fb5a888c7e92f927))
* GotoNote support for frontmatter tags ([4b3ba55](https://github.com/dendronhq/dendron/commit/4b3ba55ceb8459652b09f8be1f79e842d90213d9))
* re-engage lapsed users with prompt ([#1086](https://github.com/dendronhq/dendron/issues/1086)) ([f4e6dc5](https://github.com/dendronhq/dendron/commit/f4e6dc563aafdfc0b46966e74d9b38920aee1207))
* seed cmds in plugin ([#1080](https://github.com/dendronhq/dendron/issues/1080)) ([e07a092](https://github.com/dendronhq/dendron/commit/e07a092b1a75548574f2ea45f1b465490b2091f3))





# [0.53.0](https://github.com/dendronhq/dendron/compare/v0.52.0...v0.53.0) (2021-08-03)


### Bug Fixes

* clear out decoration types that have no decorations ([#1064](https://github.com/dendronhq/dendron/issues/1064)) ([7e8ff0b](https://github.com/dendronhq/dendron/commit/7e8ff0b96a25cc0377497766c69594486e593347))
* hashtags include punctuation and quotation marks ([#1054](https://github.com/dendronhq/dendron/issues/1054)) ([8afa5bf](https://github.com/dendronhq/dendron/commit/8afa5bf07853d98f3c9939e3b8490c45cf2a5e1a)), closes [#1048](https://github.com/dendronhq/dendron/issues/1048)





# [0.52.0](https://github.com/dendronhq/dendron/compare/v0.51.3...v0.52.0) (2021-07-26)


### Bug Fixes

* scratch note migration fixes ([5214535](https://github.com/dendronhq/dendron/commit/52145354331d1a9a84e55520550458762eba6df5))
* update welcome screen look ([#1043](https://github.com/dendronhq/dendron/issues/1043)) ([ebf0135](https://github.com/dendronhq/dendron/commit/ebf0135384672caac08e65656968eb0c468c35c6))


### Features Dendron

* scratch modifier for lookup V3 ([#1010](https://github.com/dendronhq/dendron/issues/1010)) ([581a4aa](https://github.com/dendronhq/dendron/commit/581a4aa6d1618a8e8c8af50afb80b9b253bd2671)), closes [#1012](https://github.com/dendronhq/dendron/issues/1012)





## [0.51.4](https://github.com/dendronhq/dendron/compare/v0.51.3...v0.51.4) (2021-07-25)


### Bug Fixes

* scratch note migration fixes ([5214535](https://github.com/dendronhq/dendron/commit/52145354331d1a9a84e55520550458762eba6df5))





## [0.51.2](https://github.com/dendronhq/dendron/compare/v0.51.0...v0.51.2) (2021-07-22)


### Bug Fixes

* check for undefined ([355289e](https://github.com/dendronhq/dendron/commit/355289e7ffab0ce9d7697551e1af65b8747cf487))
* decorations & warnings on non-note files ([#1017](https://github.com/dendronhq/dendron/issues/1017)) ([77c923e](https://github.com/dendronhq/dendron/commit/77c923eeade2f61bb400923f06210662ca1df73a))
* wikilink aliases with apostrophes & headers containing wikilinks ([#1004](https://github.com/dendronhq/dendron/issues/1004)) ([11bd317](https://github.com/dendronhq/dendron/commit/11bd317bd4f7dfe1fff3dccc87b90aea7f6c0742)), closes [#958](https://github.com/dendronhq/dendron/issues/958) [#959](https://github.com/dendronhq/dendron/issues/959)


### Features Dendron

* async launch engine ([0c1a607](https://github.com/dendronhq/dendron/commit/0c1a607d7ec3d19cc369c5f6ca16412c0cd0615e))
* hashtag & reference autocomplete, and multi-vault autocomplete improvements ([#991](https://github.com/dendronhq/dendron/issues/991)) ([983b149](https://github.com/dendronhq/dendron/commit/983b149c48343b2dc340a0b418fddd0d1adddf2b)), closes [#887](https://github.com/dendronhq/dendron/issues/887)
* warn against missing or bad frontmatter ([#1005](https://github.com/dendronhq/dendron/issues/1005)) ([cbacf69](https://github.com/dendronhq/dendron/commit/cbacf6986491c44c9d97db8b52fae31dda0860eb))





## [0.51.1](https://github.com/dendronhq/dendron/compare/v0.51.0...v0.51.1) (2021-07-20)

**Note:** Version bump only for package @dendronhq/plugin-core





# [0.51.0](https://github.com/dendronhq/dendron/compare/v0.49.0...v0.51.0) (2021-07-19)


### Bug Fixes

* anchors within wikilinks interpreted as hashtags ([#990](https://github.com/dendronhq/dendron/issues/990)) ([74d3ccc](https://github.com/dendronhq/dendron/commit/74d3ccc326a24ac350c6157bb6523cde4e7d0151))
* avoid generating IDs containing dashes and underscores ([#947](https://github.com/dendronhq/dendron/issues/947)) ([147772e](https://github.com/dendronhq/dendron/commit/147772e4b5a9eafa34c08aed902d30b00eeb7cb3)), closes [#945](https://github.com/dendronhq/dendron/issues/945)
* hide backlink item when it has no children ([#989](https://github.com/dendronhq/dendron/issues/989)) ([0e3b8eb](https://github.com/dendronhq/dendron/commit/0e3b8eb5a8b10b3628ef7724005e395fae7520b0))
* Improving Tutorial Telemetry ([#942](https://github.com/dendronhq/dendron/issues/942)) ([5c7f0e0](https://github.com/dendronhq/dendron/commit/5c7f0e0fc7bfd5f8befa46f5b714bfd3b61f2f4f))
* lapsed user delay prompt ([#1002](https://github.com/dendronhq/dendron/issues/1002)) ([90edbb7](https://github.com/dendronhq/dendron/commit/90edbb7f8571657584a49122bc64d774e993137d))
* last modiified timestamp not updating ([#961](https://github.com/dendronhq/dendron/issues/961)) ([71afabc](https://github.com/dendronhq/dendron/commit/71afabc1a29a09bd0f9acb5cd215b75e973ae3fd))
* local images in hover preview are now displayed ([#946](https://github.com/dendronhq/dendron/issues/946)) ([04b8374](https://github.com/dendronhq/dendron/commit/04b8374dff5b062819a3a1c56e79dc74631f4fe0))
* onDidChange event taking focus from window ([7167e16](https://github.com/dendronhq/dendron/commit/7167e16334d490f8c1cf8e2926662b5c453ead87))
* race condition in web ui ([eba5adc](https://github.com/dendronhq/dendron/commit/eba5adcf3607aad0d833052e50c911b2b73b5ae4))
* update ts on save ([6950e6e](https://github.com/dendronhq/dendron/commit/6950e6ec989b7a637f64537b0358d3fe83760179))
* Use new config when creating special notes ([#984](https://github.com/dendronhq/dendron/issues/984)) ([3e9509d](https://github.com/dendronhq/dendron/commit/3e9509d5e322d0e21c3953c3770ac6f96c6492b2))


### Features Dendron

* add custom graph styling support ([#981](https://github.com/dendronhq/dendron/issues/981)) ([aa88e3a](https://github.com/dendronhq/dendron/commit/aa88e3a0e81f1ceeffe8058eceab93b32120c93b))
* add local note graph ([#899](https://github.com/dendronhq/dendron/issues/899)) ([6e9ed81](https://github.com/dendronhq/dendron/commit/6e9ed81c14897d95280ce5f881c7467589cb89ad))
* auto completion for anchors and headers ([#894](https://github.com/dendronhq/dendron/issues/894)) ([13e81d4](https://github.com/dendronhq/dendron/commit/13e81d49c1f14ee18457543f8e0818d0e36c17db))
* de-emphasize block anchors in the editor ([#937](https://github.com/dendronhq/dendron/issues/937)) ([de70ca7](https://github.com/dendronhq/dendron/commit/de70ca78cadd68b43a29d3c37f4853365592c4ab))
* Doctor "fix frontmatter" fixes broken note ids ([#950](https://github.com/dendronhq/dendron/issues/950)) ([1298093](https://github.com/dendronhq/dendron/commit/1298093620a8be2070d5e91e40e6a70a115c7756))
* editor highlighting for wikilinks & references ([#960](https://github.com/dendronhq/dendron/issues/960)) ([4e1653b](https://github.com/dendronhq/dendron/commit/4e1653b53856fa605e82bacb592d6b59449aa149))
* filter non-stubs in directChildOnly filter ([#940](https://github.com/dendronhq/dendron/issues/940)) ([2cdf8e3](https://github.com/dendronhq/dendron/commit/2cdf8e3de32d6d4a91a7606a85e692695ccbd6e2)), closes [#917](https://github.com/dendronhq/dendron/issues/917)
* hashtags ([#985](https://github.com/dendronhq/dendron/issues/985)) ([85d44fc](https://github.com/dendronhq/dendron/commit/85d44fc975db4564f5826ae87e380d37c0263b0f))
* show unreferenced links in backlink panel ([#909](https://github.com/dendronhq/dendron/issues/909)) ([4e65a20](https://github.com/dendronhq/dendron/commit/4e65a20a344b7276d3452fc0cebb8f19339eea67))
* support dynamic theming ([1da7714](https://github.com/dendronhq/dendron/commit/1da7714f50acbba312a7e2e7a497f9e53920c96f))
* wikilink autocomplete sorts current vault notes before other notes ([#949](https://github.com/dendronhq/dendron/issues/949)) ([c195275](https://github.com/dendronhq/dendron/commit/c19527572c039f7ec7bb621e3810c299cc542969))





## [0.50.3](https://github.com/dendronhq/dendron/compare/v0.49.0...v0.50.3) (2021-07-19)


### Bug Fixes

* anchors within wikilinks interpreted as hashtags ([#990](https://github.com/dendronhq/dendron/issues/990)) ([74d3ccc](https://github.com/dendronhq/dendron/commit/74d3ccc326a24ac350c6157bb6523cde4e7d0151))
* avoid generating IDs containing dashes and underscores ([#947](https://github.com/dendronhq/dendron/issues/947)) ([147772e](https://github.com/dendronhq/dendron/commit/147772e4b5a9eafa34c08aed902d30b00eeb7cb3)), closes [#945](https://github.com/dendronhq/dendron/issues/945)
* hide backlink item when it has no children ([#989](https://github.com/dendronhq/dendron/issues/989)) ([0e3b8eb](https://github.com/dendronhq/dendron/commit/0e3b8eb5a8b10b3628ef7724005e395fae7520b0))
* Improving Tutorial Telemetry ([#942](https://github.com/dendronhq/dendron/issues/942)) ([5c7f0e0](https://github.com/dendronhq/dendron/commit/5c7f0e0fc7bfd5f8befa46f5b714bfd3b61f2f4f))
* lapsed user delay prompt ([#1002](https://github.com/dendronhq/dendron/issues/1002)) ([90edbb7](https://github.com/dendronhq/dendron/commit/90edbb7f8571657584a49122bc64d774e993137d))
* last modiified timestamp not updating ([#961](https://github.com/dendronhq/dendron/issues/961)) ([71afabc](https://github.com/dendronhq/dendron/commit/71afabc1a29a09bd0f9acb5cd215b75e973ae3fd))
* local images in hover preview are now displayed ([#946](https://github.com/dendronhq/dendron/issues/946)) ([04b8374](https://github.com/dendronhq/dendron/commit/04b8374dff5b062819a3a1c56e79dc74631f4fe0))
* onDidChange event taking focus from window ([7167e16](https://github.com/dendronhq/dendron/commit/7167e16334d490f8c1cf8e2926662b5c453ead87))
* race condition in web ui ([eba5adc](https://github.com/dendronhq/dendron/commit/eba5adcf3607aad0d833052e50c911b2b73b5ae4))
* update ts on save ([6950e6e](https://github.com/dendronhq/dendron/commit/6950e6ec989b7a637f64537b0358d3fe83760179))
* Use new config when creating special notes ([#984](https://github.com/dendronhq/dendron/issues/984)) ([3e9509d](https://github.com/dendronhq/dendron/commit/3e9509d5e322d0e21c3953c3770ac6f96c6492b2))


### Features Dendron

* add custom graph styling support ([#981](https://github.com/dendronhq/dendron/issues/981)) ([aa88e3a](https://github.com/dendronhq/dendron/commit/aa88e3a0e81f1ceeffe8058eceab93b32120c93b))
* add local note graph ([#899](https://github.com/dendronhq/dendron/issues/899)) ([6e9ed81](https://github.com/dendronhq/dendron/commit/6e9ed81c14897d95280ce5f881c7467589cb89ad))
* auto completion for anchors and headers ([#894](https://github.com/dendronhq/dendron/issues/894)) ([13e81d4](https://github.com/dendronhq/dendron/commit/13e81d49c1f14ee18457543f8e0818d0e36c17db))
* de-emphasize block anchors in the editor ([#937](https://github.com/dendronhq/dendron/issues/937)) ([de70ca7](https://github.com/dendronhq/dendron/commit/de70ca78cadd68b43a29d3c37f4853365592c4ab))
* Doctor "fix frontmatter" fixes broken note ids ([#950](https://github.com/dendronhq/dendron/issues/950)) ([1298093](https://github.com/dendronhq/dendron/commit/1298093620a8be2070d5e91e40e6a70a115c7756))
* editor highlighting for wikilinks & references ([#960](https://github.com/dendronhq/dendron/issues/960)) ([4e1653b](https://github.com/dendronhq/dendron/commit/4e1653b53856fa605e82bacb592d6b59449aa149))
* filter non-stubs in directChildOnly filter ([#940](https://github.com/dendronhq/dendron/issues/940)) ([2cdf8e3](https://github.com/dendronhq/dendron/commit/2cdf8e3de32d6d4a91a7606a85e692695ccbd6e2)), closes [#917](https://github.com/dendronhq/dendron/issues/917)
* hashtags ([#985](https://github.com/dendronhq/dendron/issues/985)) ([85d44fc](https://github.com/dendronhq/dendron/commit/85d44fc975db4564f5826ae87e380d37c0263b0f))
* show unreferenced links in backlink panel ([#909](https://github.com/dendronhq/dendron/issues/909)) ([4e65a20](https://github.com/dendronhq/dendron/commit/4e65a20a344b7276d3452fc0cebb8f19339eea67))
* support dynamic theming ([1da7714](https://github.com/dendronhq/dendron/commit/1da7714f50acbba312a7e2e7a497f9e53920c96f))
* wikilink autocomplete sorts current vault notes before other notes ([#949](https://github.com/dendronhq/dendron/issues/949)) ([c195275](https://github.com/dendronhq/dendron/commit/c19527572c039f7ec7bb621e3810c299cc542969))





## [0.50.2](https://github.com/dendronhq/dendron/compare/v0.49.0...v0.50.2) (2021-07-19)


### Bug Fixes

* anchors within wikilinks interpreted as hashtags ([#990](https://github.com/dendronhq/dendron/issues/990)) ([74d3ccc](https://github.com/dendronhq/dendron/commit/74d3ccc326a24ac350c6157bb6523cde4e7d0151))
* avoid generating IDs containing dashes and underscores ([#947](https://github.com/dendronhq/dendron/issues/947)) ([147772e](https://github.com/dendronhq/dendron/commit/147772e4b5a9eafa34c08aed902d30b00eeb7cb3)), closes [#945](https://github.com/dendronhq/dendron/issues/945)
* hide backlink item when it has no children ([#989](https://github.com/dendronhq/dendron/issues/989)) ([0e3b8eb](https://github.com/dendronhq/dendron/commit/0e3b8eb5a8b10b3628ef7724005e395fae7520b0))
* Improving Tutorial Telemetry ([#942](https://github.com/dendronhq/dendron/issues/942)) ([5c7f0e0](https://github.com/dendronhq/dendron/commit/5c7f0e0fc7bfd5f8befa46f5b714bfd3b61f2f4f))
* lapsed user delay prompt ([#1002](https://github.com/dendronhq/dendron/issues/1002)) ([90edbb7](https://github.com/dendronhq/dendron/commit/90edbb7f8571657584a49122bc64d774e993137d))
* last modiified timestamp not updating ([#961](https://github.com/dendronhq/dendron/issues/961)) ([71afabc](https://github.com/dendronhq/dendron/commit/71afabc1a29a09bd0f9acb5cd215b75e973ae3fd))
* local images in hover preview are now displayed ([#946](https://github.com/dendronhq/dendron/issues/946)) ([04b8374](https://github.com/dendronhq/dendron/commit/04b8374dff5b062819a3a1c56e79dc74631f4fe0))
* onDidChange event taking focus from window ([7167e16](https://github.com/dendronhq/dendron/commit/7167e16334d490f8c1cf8e2926662b5c453ead87))
* race condition in web ui ([eba5adc](https://github.com/dendronhq/dendron/commit/eba5adcf3607aad0d833052e50c911b2b73b5ae4))
* update ts on save ([6950e6e](https://github.com/dendronhq/dendron/commit/6950e6ec989b7a637f64537b0358d3fe83760179))
* Use new config when creating special notes ([#984](https://github.com/dendronhq/dendron/issues/984)) ([3e9509d](https://github.com/dendronhq/dendron/commit/3e9509d5e322d0e21c3953c3770ac6f96c6492b2))


### Features Dendron

* add custom graph styling support ([#981](https://github.com/dendronhq/dendron/issues/981)) ([aa88e3a](https://github.com/dendronhq/dendron/commit/aa88e3a0e81f1ceeffe8058eceab93b32120c93b))
* add local note graph ([#899](https://github.com/dendronhq/dendron/issues/899)) ([6e9ed81](https://github.com/dendronhq/dendron/commit/6e9ed81c14897d95280ce5f881c7467589cb89ad))
* auto completion for anchors and headers ([#894](https://github.com/dendronhq/dendron/issues/894)) ([13e81d4](https://github.com/dendronhq/dendron/commit/13e81d49c1f14ee18457543f8e0818d0e36c17db))
* de-emphasize block anchors in the editor ([#937](https://github.com/dendronhq/dendron/issues/937)) ([de70ca7](https://github.com/dendronhq/dendron/commit/de70ca78cadd68b43a29d3c37f4853365592c4ab))
* Doctor "fix frontmatter" fixes broken note ids ([#950](https://github.com/dendronhq/dendron/issues/950)) ([1298093](https://github.com/dendronhq/dendron/commit/1298093620a8be2070d5e91e40e6a70a115c7756))
* editor highlighting for wikilinks & references ([#960](https://github.com/dendronhq/dendron/issues/960)) ([4e1653b](https://github.com/dendronhq/dendron/commit/4e1653b53856fa605e82bacb592d6b59449aa149))
* filter non-stubs in directChildOnly filter ([#940](https://github.com/dendronhq/dendron/issues/940)) ([2cdf8e3](https://github.com/dendronhq/dendron/commit/2cdf8e3de32d6d4a91a7606a85e692695ccbd6e2)), closes [#917](https://github.com/dendronhq/dendron/issues/917)
* hashtags ([#985](https://github.com/dendronhq/dendron/issues/985)) ([85d44fc](https://github.com/dendronhq/dendron/commit/85d44fc975db4564f5826ae87e380d37c0263b0f))
* show unreferenced links in backlink panel ([#909](https://github.com/dendronhq/dendron/issues/909)) ([4e65a20](https://github.com/dendronhq/dendron/commit/4e65a20a344b7276d3452fc0cebb8f19339eea67))
* support dynamic theming ([1da7714](https://github.com/dendronhq/dendron/commit/1da7714f50acbba312a7e2e7a497f9e53920c96f))
* wikilink autocomplete sorts current vault notes before other notes ([#949](https://github.com/dendronhq/dendron/issues/949)) ([c195275](https://github.com/dendronhq/dendron/commit/c19527572c039f7ec7bb621e3810c299cc542969))





## [0.50.1](https://github.com/dendronhq/dendron/compare/v0.49.0...v0.50.1) (2021-07-16)


### Bug Fixes

* anchors within wikilinks interpreted as hashtags ([#990](https://github.com/dendronhq/dendron/issues/990)) ([74d3ccc](https://github.com/dendronhq/dendron/commit/74d3ccc326a24ac350c6157bb6523cde4e7d0151))
* avoid generating IDs containing dashes and underscores ([#947](https://github.com/dendronhq/dendron/issues/947)) ([147772e](https://github.com/dendronhq/dendron/commit/147772e4b5a9eafa34c08aed902d30b00eeb7cb3)), closes [#945](https://github.com/dendronhq/dendron/issues/945)
* hide backlink item when it has no children ([#989](https://github.com/dendronhq/dendron/issues/989)) ([0e3b8eb](https://github.com/dendronhq/dendron/commit/0e3b8eb5a8b10b3628ef7724005e395fae7520b0))
* Improving Tutorial Telemetry ([#942](https://github.com/dendronhq/dendron/issues/942)) ([5c7f0e0](https://github.com/dendronhq/dendron/commit/5c7f0e0fc7bfd5f8befa46f5b714bfd3b61f2f4f))
* last modiified timestamp not updating ([#961](https://github.com/dendronhq/dendron/issues/961)) ([71afabc](https://github.com/dendronhq/dendron/commit/71afabc1a29a09bd0f9acb5cd215b75e973ae3fd))
* local images in hover preview are now displayed ([#946](https://github.com/dendronhq/dendron/issues/946)) ([04b8374](https://github.com/dendronhq/dendron/commit/04b8374dff5b062819a3a1c56e79dc74631f4fe0))
* onDidChange event taking focus from window ([7167e16](https://github.com/dendronhq/dendron/commit/7167e16334d490f8c1cf8e2926662b5c453ead87))
* race condition in web ui ([eba5adc](https://github.com/dendronhq/dendron/commit/eba5adcf3607aad0d833052e50c911b2b73b5ae4))
* update ts on save ([6950e6e](https://github.com/dendronhq/dendron/commit/6950e6ec989b7a637f64537b0358d3fe83760179))


### Features Dendron

* add local note graph ([#899](https://github.com/dendronhq/dendron/issues/899)) ([6e9ed81](https://github.com/dendronhq/dendron/commit/6e9ed81c14897d95280ce5f881c7467589cb89ad))
* auto completion for anchors and headers ([#894](https://github.com/dendronhq/dendron/issues/894)) ([13e81d4](https://github.com/dendronhq/dendron/commit/13e81d49c1f14ee18457543f8e0818d0e36c17db))
* de-emphasize block anchors in the editor ([#937](https://github.com/dendronhq/dendron/issues/937)) ([de70ca7](https://github.com/dendronhq/dendron/commit/de70ca78cadd68b43a29d3c37f4853365592c4ab))
* Doctor "fix frontmatter" fixes broken note ids ([#950](https://github.com/dendronhq/dendron/issues/950)) ([1298093](https://github.com/dendronhq/dendron/commit/1298093620a8be2070d5e91e40e6a70a115c7756))
* editor highlighting for wikilinks & references ([#960](https://github.com/dendronhq/dendron/issues/960)) ([4e1653b](https://github.com/dendronhq/dendron/commit/4e1653b53856fa605e82bacb592d6b59449aa149))
* filter non-stubs in directChildOnly filter ([#940](https://github.com/dendronhq/dendron/issues/940)) ([2cdf8e3](https://github.com/dendronhq/dendron/commit/2cdf8e3de32d6d4a91a7606a85e692695ccbd6e2)), closes [#917](https://github.com/dendronhq/dendron/issues/917)
* hashtags ([#985](https://github.com/dendronhq/dendron/issues/985)) ([85d44fc](https://github.com/dendronhq/dendron/commit/85d44fc975db4564f5826ae87e380d37c0263b0f))
* show unreferenced links in backlink panel ([#909](https://github.com/dendronhq/dendron/issues/909)) ([4e65a20](https://github.com/dendronhq/dendron/commit/4e65a20a344b7276d3452fc0cebb8f19339eea67))
* support dynamic theming ([1da7714](https://github.com/dendronhq/dendron/commit/1da7714f50acbba312a7e2e7a497f9e53920c96f))
* wikilink autocomplete sorts current vault notes before other notes ([#949](https://github.com/dendronhq/dendron/issues/949)) ([c195275](https://github.com/dendronhq/dendron/commit/c19527572c039f7ec7bb621e3810c299cc542969))





# [0.50.0](https://github.com/dendronhq/dendron/compare/v0.49.0...v0.50.0) (2021-07-12)


### Bug Fixes

* avoid generating IDs containing dashes and underscores ([#947](https://github.com/dendronhq/dendron/issues/947)) ([147772e](https://github.com/dendronhq/dendron/commit/147772e4b5a9eafa34c08aed902d30b00eeb7cb3)), closes [#945](https://github.com/dendronhq/dendron/issues/945)
* Improving Tutorial Telemetry ([#942](https://github.com/dendronhq/dendron/issues/942)) ([5c7f0e0](https://github.com/dendronhq/dendron/commit/5c7f0e0fc7bfd5f8befa46f5b714bfd3b61f2f4f))
* local images in hover preview are now displayed ([#946](https://github.com/dendronhq/dendron/issues/946)) ([04b8374](https://github.com/dendronhq/dendron/commit/04b8374dff5b062819a3a1c56e79dc74631f4fe0))


### Features Dendron

* add local note graph ([#899](https://github.com/dendronhq/dendron/issues/899)) ([6e9ed81](https://github.com/dendronhq/dendron/commit/6e9ed81c14897d95280ce5f881c7467589cb89ad))
* auto completion for anchors and headers ([#894](https://github.com/dendronhq/dendron/issues/894)) ([13e81d4](https://github.com/dendronhq/dendron/commit/13e81d49c1f14ee18457543f8e0818d0e36c17db))
* de-emphasize block anchors in the editor ([#937](https://github.com/dendronhq/dendron/issues/937)) ([de70ca7](https://github.com/dendronhq/dendron/commit/de70ca78cadd68b43a29d3c37f4853365592c4ab))
* Doctor "fix frontmatter" fixes broken note ids ([#950](https://github.com/dendronhq/dendron/issues/950)) ([1298093](https://github.com/dendronhq/dendron/commit/1298093620a8be2070d5e91e40e6a70a115c7756))
* filter non-stubs in directChildOnly filter ([#940](https://github.com/dendronhq/dendron/issues/940)) ([2cdf8e3](https://github.com/dendronhq/dendron/commit/2cdf8e3de32d6d4a91a7606a85e692695ccbd6e2)), closes [#917](https://github.com/dendronhq/dendron/issues/917)





# [0.49.0](https://github.com/dendronhq/dendron/compare/v0.48.3...v0.49.0) (2021-07-05)


### Bug Fixes

* **preview:** show current active note when exec ShowPreview command ([1d4898d](https://github.com/dendronhq/dendron/commit/1d4898d6ce45d74a54d697dead43992f35dbebc3))





## [0.48.3](https://github.com/dendronhq/dendron/compare/v0.48.2...v0.48.3) (2021-07-02)


### Bug Fixes

* block anchors inside links are parsed as anchors ([#911](https://github.com/dendronhq/dendron/issues/911)) ([80eef6c](https://github.com/dendronhq/dendron/commit/80eef6ca95af447938de2dbcf132ca05ede6956d))
* sync service trigger perpetually when opening log ([785e0af](https://github.com/dendronhq/dendron/commit/785e0af826da1415ca0fdc873f66bae4d92ca4f6))





## [0.48.2](https://github.com/dendronhq/dendron/compare/v0.48.1...v0.48.2) (2021-07-01)


### Bug Fixes

* correct command name in prod telemetry ([#902](https://github.com/dendronhq/dendron/issues/902)) ([f96701c](https://github.com/dendronhq/dendron/commit/f96701c2093ee82b7f0efd38ca819f141e9e3e47))
* dont count undefined as tutorial workspace ([453e955](https://github.com/dendronhq/dendron/commit/453e955ca595b6462352816734e4d46defd80fd9))
* make prep.sh executable ([ebebfd8](https://github.com/dendronhq/dendron/commit/ebebfd82c4964dc023639a6badce51f8f4434be2))
* **calendar-view:** prevent calendar-view from popping up when saving files ([#904](https://github.com/dendronhq/dendron/issues/904)) ([fd371f3](https://github.com/dendronhq/dendron/commit/fd371f325160593132d613515b7f3b115f06f476))


### Features Dendron

* anallytics on command invocation ([#896](https://github.com/dendronhq/dendron/issues/896)) ([70c0e3e](https://github.com/dendronhq/dendron/commit/70c0e3eb8f865caa1ce241c6ab5577f263161cd0))
* native dendron preview ([f23df1b](https://github.com/dendronhq/dendron/commit/f23df1bd57564c1c4831a44c031952c4e494c8df))
* new onboarding experience ([#859](https://github.com/dendronhq/dendron/issues/859)) ([732a2dc](https://github.com/dendronhq/dendron/commit/732a2dcb13447b3581dff26922c005aecf24a02f))


### Reverts

* Revert "chore: using preview v2 for launch tutorial" ([3613a91](https://github.com/dendronhq/dendron/commit/3613a916c07e0601591d90304754c9041bb8bf8f))





## [0.48.1](https://github.com/dendronhq/dendron/compare/v0.48.0...v0.48.1) (2021-06-30)


### Bug Fixes

* horizontal line folded as frontmatter ([#886](https://github.com/dendronhq/dendron/issues/886)) ([b7f6fab](https://github.com/dendronhq/dendron/commit/b7f6fab109a9f9bb22a6eb769f675e6f1f3a85ad)), closes [#883](https://github.com/dendronhq/dendron/issues/883)
* lookup missing some results ([60f20fe](https://github.com/dendronhq/dendron/commit/60f20fea1698d47b8063b26778ac8a759686835d))


### Features Dendron

* preview v2 mvp ([a9b6d07](https://github.com/dendronhq/dendron/commit/a9b6d071ccca5f182d8a7985c68926424a2a1f2d))





# [0.48.0](https://github.com/dendronhq/dendron/compare/v0.47.0...v0.48.0) (2021-06-28)


### Bug Fixes

* dendron not applying version migrations ([7c1ca7c](https://github.com/dendronhq/dendron/commit/7c1ca7cadc594ed60320007204e0f90b2fd8ee2c))
* import pod YML errors ([#865](https://github.com/dendronhq/dendron/issues/865)) ([d3bfc09](https://github.com/dendronhq/dendron/commit/d3bfc097372bce7830665a9352d9b46fa7991d7e))
* note contentHash undefined after save ([c0376d0](https://github.com/dendronhq/dendron/commit/c0376d0be84898a89b003cce33430732f1c0b338))
* updated should only change if note content changes ([7eaf916](https://github.com/dendronhq/dendron/commit/7eaf9166f572a6bd0b1d4772593e70707b8e6be8))


### Features Dendron

* filter graph by string ([#828](https://github.com/dendronhq/dendron/issues/828)) ([114f6a2](https://github.com/dendronhq/dendron/commit/114f6a2b67cbe38a62f76b1459b373b64a6a669c))
* Focus after the frontmatter when opening a note & option to auto-fold frontmatter ([#870](https://github.com/dendronhq/dendron/issues/870)) ([41019d3](https://github.com/dendronhq/dendron/commit/41019d3981cb8bf32b581a679f5476c26df7de39))
* workspace-trust-for-hooks ([#845](https://github.com/dendronhq/dendron/issues/845)) ([9fc3e15](https://github.com/dendronhq/dendron/commit/9fc3e15826f62daf87f5d39a93de0d6c33992413))





## [0.47.2](https://github.com/dendronhq/dendron/compare/v0.47.0...v0.47.2) (2021-06-24)


### Bug Fixes

* dendron not applying version migrations ([7c1ca7c](https://github.com/dendronhq/dendron/commit/7c1ca7cadc594ed60320007204e0f90b2fd8ee2c))
* updated should only change if note content changes ([7eaf916](https://github.com/dendronhq/dendron/commit/7eaf9166f572a6bd0b1d4772593e70707b8e6be8))


### Features Dendron

* filter graph by string ([#828](https://github.com/dendronhq/dendron/issues/828)) ([114f6a2](https://github.com/dendronhq/dendron/commit/114f6a2b67cbe38a62f76b1459b373b64a6a669c))
* workspace-trust-for-hooks ([#845](https://github.com/dendronhq/dendron/issues/845)) ([9fc3e15](https://github.com/dendronhq/dendron/commit/9fc3e15826f62daf87f5d39a93de0d6c33992413))





## [0.47.1](https://github.com/dendronhq/dendron/compare/v0.47.0...v0.47.1) (2021-06-23)


### Bug Fixes

* dendron not applying version migrations ([7c1ca7c](https://github.com/dendronhq/dendron/commit/7c1ca7cadc594ed60320007204e0f90b2fd8ee2c))


### Features Dendron

* filter graph by string ([#828](https://github.com/dendronhq/dendron/issues/828)) ([114f6a2](https://github.com/dendronhq/dendron/commit/114f6a2b67cbe38a62f76b1459b373b64a6a669c))
* workspace-trust-for-hooks ([#845](https://github.com/dendronhq/dendron/issues/845)) ([9fc3e15](https://github.com/dendronhq/dendron/commit/9fc3e15826f62daf87f5d39a93de0d6c33992413))





# [0.47.0](https://github.com/dendronhq/dendron/compare/v0.46.1...v0.47.0) (2021-06-21)


### Bug Fixes

* anchors now update when note is modified ([#823](https://github.com/dendronhq/dendron/issues/823)) ([be91b8d](https://github.com/dendronhq/dendron/commit/be91b8dd45a507e07d742d323323853227f41c6e)), closes [#817](https://github.com/dendronhq/dendron/issues/817)
* calendar view should not pop out when hidden ([d6a9431](https://github.com/dendronhq/dendron/commit/d6a9431023fe7f5743152807dd11092025e82a46))
* issue with welcome screen showing up each time ([4291e3a](https://github.com/dendronhq/dendron/commit/4291e3a03eb11e02734523d34e59cecf3791c3c7))
* **plugin:** handle default selection type being undefined ([92b8d2a](https://github.com/dendronhq/dendron/commit/92b8d2a3cc67605c9371e70457e93d2b08e02bce))


### Features Dendron

* calendar panel ([#806](https://github.com/dendronhq/dendron/issues/806)) ([65ef926](https://github.com/dendronhq/dendron/commit/65ef926564dbaeaaca305e480ac8607c66bcc4b1)), closes [packages/plugin-core/src/views/utils.ts#88](https://github.com/packages/plugin-core/src/views/utils.ts/issues/88) [/github.com/ant-design/ant-design/blob/832aa81c821b7b5750673b5aacafa39c9978b09c/components/calendar/generateCalendar.tsx#L183-L205](https://github.com//github.com/ant-design/ant-design/blob/832aa81c821b7b5750673b5aacafa39c9978b09c/components/calendar/generateCalendar.tsx/issues/L183-L205)
* remove seed cmd ([252f297](https://github.com/dendronhq/dendron/commit/252f29741f1cabb915e9e541d80256b21ef594d0))





## [0.46.3-alpha.0](https://github.com/dendronhq/dendron/compare/v0.46.1...v0.46.3-alpha.0) (2021-06-19)


### Bug Fixes

* calendar view should not pop out when hidden ([d6a9431](https://github.com/dendronhq/dendron/commit/d6a9431023fe7f5743152807dd11092025e82a46))
* **plugin:** handle default selection type being undefined ([92b8d2a](https://github.com/dendronhq/dendron/commit/92b8d2a3cc67605c9371e70457e93d2b08e02bce))
* anchors now update when note is modified ([#823](https://github.com/dendronhq/dendron/issues/823)) ([be91b8d](https://github.com/dendronhq/dendron/commit/be91b8dd45a507e07d742d323323853227f41c6e)), closes [#817](https://github.com/dendronhq/dendron/issues/817)


### Features Dendron

* calendar panel ([#806](https://github.com/dendronhq/dendron/issues/806)) ([65ef926](https://github.com/dendronhq/dendron/commit/65ef926564dbaeaaca305e480ac8607c66bcc4b1)), closes [packages/plugin-core/src/views/utils.ts#88](https://github.com/packages/plugin-core/src/views/utils.ts/issues/88) [/github.com/ant-design/ant-design/blob/832aa81c821b7b5750673b5aacafa39c9978b09c/components/calendar/generateCalendar.tsx#L183-L205](https://github.com//github.com/ant-design/ant-design/blob/832aa81c821b7b5750673b5aacafa39c9978b09c/components/calendar/generateCalendar.tsx/issues/L183-L205)
* remove seed cmd ([252f297](https://github.com/dendronhq/dendron/commit/252f29741f1cabb915e9e541d80256b21ef594d0))





## [0.46.2](https://github.com/dendronhq/dendron/compare/v0.46.1...v0.46.2) (2021-06-19)


### Bug Fixes

* calendar view should not pop out when hidden ([d6a9431](https://github.com/dendronhq/dendron/commit/d6a9431023fe7f5743152807dd11092025e82a46))
* **plugin:** handle default selection type being undefined ([92b8d2a](https://github.com/dendronhq/dendron/commit/92b8d2a3cc67605c9371e70457e93d2b08e02bce))
* anchors now update when note is modified ([#823](https://github.com/dendronhq/dendron/issues/823)) ([be91b8d](https://github.com/dendronhq/dendron/commit/be91b8dd45a507e07d742d323323853227f41c6e)), closes [#817](https://github.com/dendronhq/dendron/issues/817)


### Features Dendron

* calendar panel ([#806](https://github.com/dendronhq/dendron/issues/806)) ([65ef926](https://github.com/dendronhq/dendron/commit/65ef926564dbaeaaca305e480ac8607c66bcc4b1)), closes [packages/plugin-core/src/views/utils.ts#88](https://github.com/packages/plugin-core/src/views/utils.ts/issues/88) [/github.com/ant-design/ant-design/blob/832aa81c821b7b5750673b5aacafa39c9978b09c/components/calendar/generateCalendar.tsx#L183-L205](https://github.com//github.com/ant-design/ant-design/blob/832aa81c821b7b5750673b5aacafa39c9978b09c/components/calendar/generateCalendar.tsx/issues/L183-L205)
* remove seed cmd ([252f297](https://github.com/dendronhq/dendron/commit/252f29741f1cabb915e9e541d80256b21ef594d0))





## [0.46.2-alpha.1](https://github.com/dendronhq/dendron/compare/v0.46.1...v0.46.2-alpha.1) (2021-06-16)


### Bug Fixes

* **plugin:** handle default selection type being undefined ([92b8d2a](https://github.com/dendronhq/dendron/commit/92b8d2a3cc67605c9371e70457e93d2b08e02bce))
* anchors now update when note is modified ([#823](https://github.com/dendronhq/dendron/issues/823)) ([be91b8d](https://github.com/dendronhq/dendron/commit/be91b8dd45a507e07d742d323323853227f41c6e)), closes [#817](https://github.com/dendronhq/dendron/issues/817)


### enhance

* enable web ui by default ([557934f](https://github.com/dendronhq/dendron/commit/557934f344cc416c06f3b4027e59c1272595e39f))


### Features Dendron

* calendar panel ([#806](https://github.com/dendronhq/dendron/issues/806)) ([65ef926](https://github.com/dendronhq/dendron/commit/65ef926564dbaeaaca305e480ac8607c66bcc4b1)), closes [packages/plugin-core/src/views/utils.ts#88](https://github.com/packages/plugin-core/src/views/utils.ts/issues/88) [/github.com/ant-design/ant-design/blob/832aa81c821b7b5750673b5aacafa39c9978b09c/components/calendar/generateCalendar.tsx#L183-L205](https://github.com//github.com/ant-design/ant-design/blob/832aa81c821b7b5750673b5aacafa39c9978b09c/components/calendar/generateCalendar.tsx/issues/L183-L205)
* remove seed cmd ([252f297](https://github.com/dendronhq/dendron/commit/252f29741f1cabb915e9e541d80256b21ef594d0))


### BREAKING CHANGES

* removes the `enableWebUI` configuration and introduces `disableWebUI` configuration that needs to be set to remove the web ui





## [0.46.2-alpha.0](https://github.com/dendronhq/dendron/compare/v0.46.1...v0.46.2-alpha.0) (2021-06-16)


### Bug Fixes

* **plugin:** handle default selection type being undefined ([92b8d2a](https://github.com/dendronhq/dendron/commit/92b8d2a3cc67605c9371e70457e93d2b08e02bce))
* anchors now update when note is modified ([#823](https://github.com/dendronhq/dendron/issues/823)) ([be91b8d](https://github.com/dendronhq/dendron/commit/be91b8dd45a507e07d742d323323853227f41c6e)), closes [#817](https://github.com/dendronhq/dendron/issues/817)


### enhance

* enable web ui by default ([fc68be5](https://github.com/dendronhq/dendron/commit/fc68be5d1fe5355b5bb33d70b4143043f1df20fe))


### Features Dendron

* calendar panel ([#806](https://github.com/dendronhq/dendron/issues/806)) ([65ef926](https://github.com/dendronhq/dendron/commit/65ef926564dbaeaaca305e480ac8607c66bcc4b1)), closes [packages/plugin-core/src/views/utils.ts#88](https://github.com/packages/plugin-core/src/views/utils.ts/issues/88) [/github.com/ant-design/ant-design/blob/832aa81c821b7b5750673b5aacafa39c9978b09c/components/calendar/generateCalendar.tsx#L183-L205](https://github.com//github.com/ant-design/ant-design/blob/832aa81c821b7b5750673b5aacafa39c9978b09c/components/calendar/generateCalendar.tsx/issues/L183-L205)


### BREAKING CHANGES

* removes the `enableWebUI` configuration and introduces `disableWebUI` configuration that needs to be set to remove the web ui





## [0.46.1](https://github.com/dendronhq/dendron/compare/v0.46.0...v0.46.1) (2021-06-14)

**Note:** Version bump only for package @dendronhq/plugin-core





# [0.46.0](https://github.com/dendronhq/dendron/compare/v0.45.2...v0.46.0) (2021-06-14)


### Bug Fixes

* version numbers ([1400249](https://github.com/dendronhq/dendron/commit/1400249340635e6503b2913147081b6ac157bf48))


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

**Note:** Version bump only for package @dendronhq/plugin-core





## [0.44.1-alpha.7](https://github.com/dendronhq/dendron/compare/v0.44.1-alpha.5...v0.44.1-alpha.7) (2021-06-04)

**Note:** Version bump only for package @dendronhq/plugin-core





## [0.44.1-alpha.6](https://github.com/dendronhq/dendron/compare/v0.44.1-alpha.5...v0.44.1-alpha.6) (2021-06-04)

**Note:** Version bump only for package @dendronhq/plugin-core





## [0.44.1-alpha.5](https://github.com/dendronhq/dendron/compare/v0.42.0...v0.44.1-alpha.5) (2021-06-04)


### Bug Fixes

* don't enable alwaysShow behavior for lookup commands ([83cbda3](https://github.com/dendronhq/dendron/commit/83cbda3a17650e3a01d7c67924913e13a503f232))
* extension packaging ([48f79c5](https://github.com/dendronhq/dendron/commit/48f79c50fde74d85e843fbfce563a17c75b7e705))
* handle file names with non-ascii in paste file ([97a3437](https://github.com/dendronhq/dendron/commit/97a34372f7c638731a74e9935ca57bf0810f2c19))
* lookupConfirmVaultOnCreate not set in note lookup ([f67ee2b](https://github.com/dendronhq/dendron/commit/f67ee2b42f6353331c714b034c6b48b5761d74f9))
* only refresh treeview if visible ([1471cb9](https://github.com/dendronhq/dendron/commit/1471cb9fa196e912edcc7a834a7babc433966c24))
* only refresh treeview if visible ([6b55bc1](https://github.com/dendronhq/dendron/commit/6b55bc16592b678e7385d140885d22a81325aad9))
* show welcome on first install ([1338e47](https://github.com/dendronhq/dendron/commit/1338e47c49da1ab9a45c2c813a1645cb22a58ab6))
* support lookups with workspace vaults ([404fb89](https://github.com/dendronhq/dendron/commit/404fb8922d3f20fa1c4f87ce742a29c1af03b8a6))
* sync test ([40c8958](https://github.com/dendronhq/dendron/commit/40c89580cd6729db1e103deba070ce0babe36e0a))


### Features Dendron

* Add Doctor command to create missing linked notes ([#713](https://github.com/dendronhq/dendron/issues/713)) ([9558353](https://github.com/dendronhq/dendron/commit/9558353c8a636c8a8d400fc3109f75b387da37a6))
* Basic block reference link functionality ([#742](https://github.com/dendronhq/dendron/issues/742)) ([416e382](https://github.com/dendronhq/dendron/commit/416e3825254b57625f7dc2b6063f1e8bc731bf3b))
* insert note link cmd ([cc8a02b](https://github.com/dendronhq/dendron/commit/cc8a02b4e50d98d406ad9ea684f4e11e93e4ad36))
* paste file cmd ([3e3f419](https://github.com/dendronhq/dendron/commit/3e3f41971607c12705df4830f3ff88e67a2788e0))
* paste file cmd ([51ab5aa](https://github.com/dendronhq/dendron/commit/51ab5aaf4d440f7e7f5bd765b9b5378f346076b8))
* support initializing remote workspace vault ([6f401d7](https://github.com/dendronhq/dendron/commit/6f401d75f21122c84efd03f4307531fde719e37d))
* Workspace Sync command ([#738](https://github.com/dendronhq/dendron/issues/738)) ([7e462c0](https://github.com/dendronhq/dendron/commit/7e462c07ecec73982f3293ff80cfa3041d0ceabf))





## [0.44.1-alpha.4](https://github.com/dendronhq/dendron/compare/v0.42.0...v0.44.1-alpha.4) (2021-06-04)


### Bug Fixes

* don't enable alwaysShow behavior for lookup commands ([83cbda3](https://github.com/dendronhq/dendron/commit/83cbda3a17650e3a01d7c67924913e13a503f232))
* extension packaging ([48f79c5](https://github.com/dendronhq/dendron/commit/48f79c50fde74d85e843fbfce563a17c75b7e705))
* handle file names with non-ascii in paste file ([97a3437](https://github.com/dendronhq/dendron/commit/97a34372f7c638731a74e9935ca57bf0810f2c19))
* lookupConfirmVaultOnCreate not set in note lookup ([f67ee2b](https://github.com/dendronhq/dendron/commit/f67ee2b42f6353331c714b034c6b48b5761d74f9))
* only refresh treeview if visible ([1471cb9](https://github.com/dendronhq/dendron/commit/1471cb9fa196e912edcc7a834a7babc433966c24))
* only refresh treeview if visible ([6b55bc1](https://github.com/dendronhq/dendron/commit/6b55bc16592b678e7385d140885d22a81325aad9))
* show welcome on first install ([1338e47](https://github.com/dendronhq/dendron/commit/1338e47c49da1ab9a45c2c813a1645cb22a58ab6))
* support lookups with workspace vaults ([404fb89](https://github.com/dendronhq/dendron/commit/404fb8922d3f20fa1c4f87ce742a29c1af03b8a6))
* sync test ([40c8958](https://github.com/dendronhq/dendron/commit/40c89580cd6729db1e103deba070ce0babe36e0a))


### Features Dendron

* Add Doctor command to create missing linked notes ([#713](https://github.com/dendronhq/dendron/issues/713)) ([9558353](https://github.com/dendronhq/dendron/commit/9558353c8a636c8a8d400fc3109f75b387da37a6))
* Basic block reference link functionality ([#742](https://github.com/dendronhq/dendron/issues/742)) ([416e382](https://github.com/dendronhq/dendron/commit/416e3825254b57625f7dc2b6063f1e8bc731bf3b))
* insert note link cmd ([cc8a02b](https://github.com/dendronhq/dendron/commit/cc8a02b4e50d98d406ad9ea684f4e11e93e4ad36))
* paste file cmd ([3e3f419](https://github.com/dendronhq/dendron/commit/3e3f41971607c12705df4830f3ff88e67a2788e0))
* paste file cmd ([51ab5aa](https://github.com/dendronhq/dendron/commit/51ab5aaf4d440f7e7f5bd765b9b5378f346076b8))
* support initializing remote workspace vault ([6f401d7](https://github.com/dendronhq/dendron/commit/6f401d75f21122c84efd03f4307531fde719e37d))
* Workspace Sync command ([#738](https://github.com/dendronhq/dendron/issues/738)) ([7e462c0](https://github.com/dendronhq/dendron/commit/7e462c07ecec73982f3293ff80cfa3041d0ceabf))





## [0.44.1-alpha.3](https://github.com/dendronhq/dendron/compare/v0.42.0...v0.44.1-alpha.3) (2021-06-03)


### Bug Fixes

* don't enable alwaysShow behavior for lookup commands ([83cbda3](https://github.com/dendronhq/dendron/commit/83cbda3a17650e3a01d7c67924913e13a503f232))
* extension packaging ([48f79c5](https://github.com/dendronhq/dendron/commit/48f79c50fde74d85e843fbfce563a17c75b7e705))
* handle file names with non-ascii in paste file ([97a3437](https://github.com/dendronhq/dendron/commit/97a34372f7c638731a74e9935ca57bf0810f2c19))
* lookupConfirmVaultOnCreate not set in note lookup ([f67ee2b](https://github.com/dendronhq/dendron/commit/f67ee2b42f6353331c714b034c6b48b5761d74f9))
* only refresh treeview if visible ([1471cb9](https://github.com/dendronhq/dendron/commit/1471cb9fa196e912edcc7a834a7babc433966c24))
* only refresh treeview if visible ([6b55bc1](https://github.com/dendronhq/dendron/commit/6b55bc16592b678e7385d140885d22a81325aad9))
* show welcome on first install ([1338e47](https://github.com/dendronhq/dendron/commit/1338e47c49da1ab9a45c2c813a1645cb22a58ab6))
* support lookups with workspace vaults ([7653a84](https://github.com/dendronhq/dendron/commit/7653a84177b0c5a4c80fa6f48ed784ad9e3ae3d8))
* sync test ([40c8958](https://github.com/dendronhq/dendron/commit/40c89580cd6729db1e103deba070ce0babe36e0a))


### Features Dendron

* Add Doctor command to create missing linked notes ([#713](https://github.com/dendronhq/dendron/issues/713)) ([9558353](https://github.com/dendronhq/dendron/commit/9558353c8a636c8a8d400fc3109f75b387da37a6))
* Basic block reference link functionality ([#742](https://github.com/dendronhq/dendron/issues/742)) ([416e382](https://github.com/dendronhq/dendron/commit/416e3825254b57625f7dc2b6063f1e8bc731bf3b))
* insert note link cmd ([cc8a02b](https://github.com/dendronhq/dendron/commit/cc8a02b4e50d98d406ad9ea684f4e11e93e4ad36))
* paste file cmd ([3e3f419](https://github.com/dendronhq/dendron/commit/3e3f41971607c12705df4830f3ff88e67a2788e0))
* paste file cmd ([51ab5aa](https://github.com/dendronhq/dendron/commit/51ab5aaf4d440f7e7f5bd765b9b5378f346076b8))
* support initializing remote workspace vault ([cd59456](https://github.com/dendronhq/dendron/commit/cd594566a4e992dd6a1252c72c2df7a8ebd0eb3d))
* Workspace Sync command ([#738](https://github.com/dendronhq/dendron/issues/738)) ([7e462c0](https://github.com/dendronhq/dendron/commit/7e462c07ecec73982f3293ff80cfa3041d0ceabf))





## [0.44.1-alpha.2](https://github.com/dendronhq/dendron/compare/v0.42.0...v0.44.1-alpha.2) (2021-06-03)


### Bug Fixes

* don't enable alwaysShow behavior for lookup commands ([83cbda3](https://github.com/dendronhq/dendron/commit/83cbda3a17650e3a01d7c67924913e13a503f232))
* extension packaging ([48f79c5](https://github.com/dendronhq/dendron/commit/48f79c50fde74d85e843fbfce563a17c75b7e705))
* handle file names with non-ascii in paste file ([97a3437](https://github.com/dendronhq/dendron/commit/97a34372f7c638731a74e9935ca57bf0810f2c19))
* lookupConfirmVaultOnCreate not set in note lookup ([f67ee2b](https://github.com/dendronhq/dendron/commit/f67ee2b42f6353331c714b034c6b48b5761d74f9))
* only refresh treeview if visible ([1471cb9](https://github.com/dendronhq/dendron/commit/1471cb9fa196e912edcc7a834a7babc433966c24))
* only refresh treeview if visible ([6b55bc1](https://github.com/dendronhq/dendron/commit/6b55bc16592b678e7385d140885d22a81325aad9))
* show welcome on first install ([1338e47](https://github.com/dendronhq/dendron/commit/1338e47c49da1ab9a45c2c813a1645cb22a58ab6))
* support lookups with workspace vaults ([7653a84](https://github.com/dendronhq/dendron/commit/7653a84177b0c5a4c80fa6f48ed784ad9e3ae3d8))
* sync test ([40c8958](https://github.com/dendronhq/dendron/commit/40c89580cd6729db1e103deba070ce0babe36e0a))


### Features Dendron

* Add Doctor command to create missing linked notes ([#713](https://github.com/dendronhq/dendron/issues/713)) ([9558353](https://github.com/dendronhq/dendron/commit/9558353c8a636c8a8d400fc3109f75b387da37a6))
* Basic block reference link functionality ([#742](https://github.com/dendronhq/dendron/issues/742)) ([416e382](https://github.com/dendronhq/dendron/commit/416e3825254b57625f7dc2b6063f1e8bc731bf3b))
* insert note link cmd ([cc8a02b](https://github.com/dendronhq/dendron/commit/cc8a02b4e50d98d406ad9ea684f4e11e93e4ad36))
* paste file cmd ([3e3f419](https://github.com/dendronhq/dendron/commit/3e3f41971607c12705df4830f3ff88e67a2788e0))
* paste file cmd ([51ab5aa](https://github.com/dendronhq/dendron/commit/51ab5aaf4d440f7e7f5bd765b9b5378f346076b8))
* support initializing remote workspace vault ([cd59456](https://github.com/dendronhq/dendron/commit/cd594566a4e992dd6a1252c72c2df7a8ebd0eb3d))
* Workspace Sync command ([#738](https://github.com/dendronhq/dendron/issues/738)) ([7e462c0](https://github.com/dendronhq/dendron/commit/7e462c07ecec73982f3293ff80cfa3041d0ceabf))





## [0.44.1-alpha.1](https://github.com/dendronhq/dendron/compare/v0.42.0...v0.44.1-alpha.1) (2021-06-02)


### Bug Fixes

* don't enable alwaysShow behavior for lookup commands ([83cbda3](https://github.com/dendronhq/dendron/commit/83cbda3a17650e3a01d7c67924913e13a503f232))
* extension packaging ([48f79c5](https://github.com/dendronhq/dendron/commit/48f79c50fde74d85e843fbfce563a17c75b7e705))
* handle file names with non-ascii in paste file ([97a3437](https://github.com/dendronhq/dendron/commit/97a34372f7c638731a74e9935ca57bf0810f2c19))
* lookupConfirmVaultOnCreate not set in note lookup ([f67ee2b](https://github.com/dendronhq/dendron/commit/f67ee2b42f6353331c714b034c6b48b5761d74f9))
* only refresh treeview if visible ([1471cb9](https://github.com/dendronhq/dendron/commit/1471cb9fa196e912edcc7a834a7babc433966c24))
* only refresh treeview if visible ([6b55bc1](https://github.com/dendronhq/dendron/commit/6b55bc16592b678e7385d140885d22a81325aad9))
* show welcome on first install ([1338e47](https://github.com/dendronhq/dendron/commit/1338e47c49da1ab9a45c2c813a1645cb22a58ab6))
* support lookups with workspace vaults ([7653a84](https://github.com/dendronhq/dendron/commit/7653a84177b0c5a4c80fa6f48ed784ad9e3ae3d8))
* sync test ([40c8958](https://github.com/dendronhq/dendron/commit/40c89580cd6729db1e103deba070ce0babe36e0a))


### Features Dendron

* Add Doctor command to create missing linked notes ([#713](https://github.com/dendronhq/dendron/issues/713)) ([9558353](https://github.com/dendronhq/dendron/commit/9558353c8a636c8a8d400fc3109f75b387da37a6))
* Basic block reference link functionality ([#742](https://github.com/dendronhq/dendron/issues/742)) ([416e382](https://github.com/dendronhq/dendron/commit/416e3825254b57625f7dc2b6063f1e8bc731bf3b))
* insert note link cmd ([cc8a02b](https://github.com/dendronhq/dendron/commit/cc8a02b4e50d98d406ad9ea684f4e11e93e4ad36))
* paste file cmd ([3e3f419](https://github.com/dendronhq/dendron/commit/3e3f41971607c12705df4830f3ff88e67a2788e0))
* paste file cmd ([51ab5aa](https://github.com/dendronhq/dendron/commit/51ab5aaf4d440f7e7f5bd765b9b5378f346076b8))
* Workspace Sync command ([#738](https://github.com/dendronhq/dendron/issues/738)) ([7e462c0](https://github.com/dendronhq/dendron/commit/7e462c07ecec73982f3293ff80cfa3041d0ceabf))





## [0.44.1-alpha.0](https://github.com/dendronhq/dendron/compare/v0.42.0...v0.44.1-alpha.0) (2021-06-02)


### Bug Fixes

* don't enable alwaysShow behavior for lookup commands ([83cbda3](https://github.com/dendronhq/dendron/commit/83cbda3a17650e3a01d7c67924913e13a503f232))
* extension packaging ([48f79c5](https://github.com/dendronhq/dendron/commit/48f79c50fde74d85e843fbfce563a17c75b7e705))
* handle file names with non-ascii in paste file ([97a3437](https://github.com/dendronhq/dendron/commit/97a34372f7c638731a74e9935ca57bf0810f2c19))
* lookupConfirmVaultOnCreate not set in note lookup ([f67ee2b](https://github.com/dendronhq/dendron/commit/f67ee2b42f6353331c714b034c6b48b5761d74f9))
* only refresh treeview if visible ([1471cb9](https://github.com/dendronhq/dendron/commit/1471cb9fa196e912edcc7a834a7babc433966c24))
* only refresh treeview if visible ([6b55bc1](https://github.com/dendronhq/dendron/commit/6b55bc16592b678e7385d140885d22a81325aad9))
* show welcome on first install ([1338e47](https://github.com/dendronhq/dendron/commit/1338e47c49da1ab9a45c2c813a1645cb22a58ab6))
* support lookups with workspace vaults ([7653a84](https://github.com/dendronhq/dendron/commit/7653a84177b0c5a4c80fa6f48ed784ad9e3ae3d8))
* sync test ([40c8958](https://github.com/dendronhq/dendron/commit/40c89580cd6729db1e103deba070ce0babe36e0a))


### Features Dendron

* Add Doctor command to create missing linked notes ([#713](https://github.com/dendronhq/dendron/issues/713)) ([9558353](https://github.com/dendronhq/dendron/commit/9558353c8a636c8a8d400fc3109f75b387da37a6))
* Basic block reference link functionality ([#742](https://github.com/dendronhq/dendron/issues/742)) ([416e382](https://github.com/dendronhq/dendron/commit/416e3825254b57625f7dc2b6063f1e8bc731bf3b))
* insert note link cmd ([cc8a02b](https://github.com/dendronhq/dendron/commit/cc8a02b4e50d98d406ad9ea684f4e11e93e4ad36))
* paste file cmd ([3e3f419](https://github.com/dendronhq/dendron/commit/3e3f41971607c12705df4830f3ff88e67a2788e0))
* paste file cmd ([51ab5aa](https://github.com/dendronhq/dendron/commit/51ab5aaf4d440f7e7f5bd765b9b5378f346076b8))
* Workspace Sync command ([#738](https://github.com/dendronhq/dendron/issues/738)) ([7e462c0](https://github.com/dendronhq/dendron/commit/7e462c07ecec73982f3293ff80cfa3041d0ceabf))





# [0.44.0](https://github.com/dendronhq/dendron/compare/v0.42.0...v0.44.0) (2021-05-31)

### Bug Fixes

- don't enable alwaysShow behavior for lookup commands ([83cbda3](https://github.com/dendronhq/dendron/commit/83cbda3a17650e3a01d7c67924913e13a503f232))
- extension packaging ([48f79c5](https://github.com/dendronhq/dendron/commit/48f79c50fde74d85e843fbfce563a17c75b7e705))
- handle file names with non-ascii in paste file ([97a3437](https://github.com/dendronhq/dendron/commit/97a34372f7c638731a74e9935ca57bf0810f2c19))
- lookupConfirmVaultOnCreate not set in note lookup ([f67ee2b](https://github.com/dendronhq/dendron/commit/f67ee2b42f6353331c714b034c6b48b5761d74f9))
- only refresh treeview if visible ([1471cb9](https://github.com/dendronhq/dendron/commit/1471cb9fa196e912edcc7a834a7babc433966c24))
- only refresh treeview if visible ([6b55bc1](https://github.com/dendronhq/dendron/commit/6b55bc16592b678e7385d140885d22a81325aad9))
- show welcome on first install ([1338e47](https://github.com/dendronhq/dendron/commit/1338e47c49da1ab9a45c2c813a1645cb22a58ab6))
- sync test ([40c8958](https://github.com/dendronhq/dendron/commit/40c89580cd6729db1e103deba070ce0babe36e0a))

### Features Dendron

- Add Doctor command to create missing linked notes ([#713](https://github.com/dendronhq/dendron/issues/713)) ([9558353](https://github.com/dendronhq/dendron/commit/9558353c8a636c8a8d400fc3109f75b387da37a6))
- Basic block reference link functionality ([#742](https://github.com/dendronhq/dendron/issues/742)) ([416e382](https://github.com/dendronhq/dendron/commit/416e3825254b57625f7dc2b6063f1e8bc731bf3b))
- insert note link cmd ([cc8a02b](https://github.com/dendronhq/dendron/commit/cc8a02b4e50d98d406ad9ea684f4e11e93e4ad36))
- paste file cmd ([3e3f419](https://github.com/dendronhq/dendron/commit/3e3f41971607c12705df4830f3ff88e67a2788e0))
- paste file cmd ([51ab5aa](https://github.com/dendronhq/dendron/commit/51ab5aaf4d440f7e7f5bd765b9b5378f346076b8))
- Workspace Sync command ([#738](https://github.com/dendronhq/dendron/issues/738)) ([7e462c0](https://github.com/dendronhq/dendron/commit/7e462c07ecec73982f3293ff80cfa3041d0ceabf))

## [0.43.5-alpha.2](https://github.com/dendronhq/dendron/compare/v0.42.0...v0.43.5-alpha.2) (2021-05-29)

### Bug Fixes

- extension packaging ([48f79c5](https://github.com/dendronhq/dendron/commit/48f79c50fde74d85e843fbfce563a17c75b7e705))
- handle file names with non-ascii in paste file ([97a3437](https://github.com/dendronhq/dendron/commit/97a34372f7c638731a74e9935ca57bf0810f2c19))
- lookupConfirmVaultOnCreate not set in note lookup ([f67ee2b](https://github.com/dendronhq/dendron/commit/f67ee2b42f6353331c714b034c6b48b5761d74f9))
- only refresh treeview if visible ([1471cb9](https://github.com/dendronhq/dendron/commit/1471cb9fa196e912edcc7a834a7babc433966c24))
- only refresh treeview if visible ([6b55bc1](https://github.com/dendronhq/dendron/commit/6b55bc16592b678e7385d140885d22a81325aad9))
- show welcome on first install ([1338e47](https://github.com/dendronhq/dendron/commit/1338e47c49da1ab9a45c2c813a1645cb22a58ab6))
- sync test ([40c8958](https://github.com/dendronhq/dendron/commit/40c89580cd6729db1e103deba070ce0babe36e0a))

### Features Dendron

- Add Doctor command to create missing linked notes ([#713](https://github.com/dendronhq/dendron/issues/713)) ([9558353](https://github.com/dendronhq/dendron/commit/9558353c8a636c8a8d400fc3109f75b387da37a6))
- Basic block reference link functionality ([#742](https://github.com/dendronhq/dendron/issues/742)) ([416e382](https://github.com/dendronhq/dendron/commit/416e3825254b57625f7dc2b6063f1e8bc731bf3b))
- paste file cmd ([3e3f419](https://github.com/dendronhq/dendron/commit/3e3f41971607c12705df4830f3ff88e67a2788e0))
- paste file cmd ([51ab5aa](https://github.com/dendronhq/dendron/commit/51ab5aaf4d440f7e7f5bd765b9b5378f346076b8))
- Workspace Sync command ([#738](https://github.com/dendronhq/dendron/issues/738)) ([7e462c0](https://github.com/dendronhq/dendron/commit/7e462c07ecec73982f3293ff80cfa3041d0ceabf))

## [0.43.5-alpha.1](https://github.com/dendronhq/dendron/compare/v0.42.0...v0.43.5-alpha.1) (2021-05-29)

### Bug Fixes

- extension packaging ([48f79c5](https://github.com/dendronhq/dendron/commit/48f79c50fde74d85e843fbfce563a17c75b7e705))
- handle file names with non-ascii in paste file ([97a3437](https://github.com/dendronhq/dendron/commit/97a34372f7c638731a74e9935ca57bf0810f2c19))
- lookupConfirmVaultOnCreate not set in note lookup ([f67ee2b](https://github.com/dendronhq/dendron/commit/f67ee2b42f6353331c714b034c6b48b5761d74f9))
- only refresh treeview if visible ([1471cb9](https://github.com/dendronhq/dendron/commit/1471cb9fa196e912edcc7a834a7babc433966c24))
- only refresh treeview if visible ([6b55bc1](https://github.com/dendronhq/dendron/commit/6b55bc16592b678e7385d140885d22a81325aad9))
- show welcome on first install ([1338e47](https://github.com/dendronhq/dendron/commit/1338e47c49da1ab9a45c2c813a1645cb22a58ab6))
- sync test ([40c8958](https://github.com/dendronhq/dendron/commit/40c89580cd6729db1e103deba070ce0babe36e0a))

### Features Dendron

- Add Doctor command to create missing linked notes ([#713](https://github.com/dendronhq/dendron/issues/713)) ([9558353](https://github.com/dendronhq/dendron/commit/9558353c8a636c8a8d400fc3109f75b387da37a6))
- Basic block reference link functionality ([#742](https://github.com/dendronhq/dendron/issues/742)) ([416e382](https://github.com/dendronhq/dendron/commit/416e3825254b57625f7dc2b6063f1e8bc731bf3b))
- paste file cmd ([3e3f419](https://github.com/dendronhq/dendron/commit/3e3f41971607c12705df4830f3ff88e67a2788e0))
- paste file cmd ([51ab5aa](https://github.com/dendronhq/dendron/commit/51ab5aaf4d440f7e7f5bd765b9b5378f346076b8))
- Workspace Sync command ([#738](https://github.com/dendronhq/dendron/issues/738)) ([7e462c0](https://github.com/dendronhq/dendron/commit/7e462c07ecec73982f3293ff80cfa3041d0ceabf))

## [0.43.5-alpha.0](https://github.com/dendronhq/dendron/compare/v0.42.0...v0.43.5-alpha.0) (2021-05-28)

### Bug Fixes

- extension packaging ([48f79c5](https://github.com/dendronhq/dendron/commit/48f79c50fde74d85e843fbfce563a17c75b7e705))
- handle file names with non-ascii in paste file ([97a3437](https://github.com/dendronhq/dendron/commit/97a34372f7c638731a74e9935ca57bf0810f2c19))
- lookupConfirmVaultOnCreate not set in note lookup ([a560603](https://github.com/dendronhq/dendron/commit/a5606030c559f0f35a22c40552b25d29e266b0b8))
- only refresh treeview if visible ([1471cb9](https://github.com/dendronhq/dendron/commit/1471cb9fa196e912edcc7a834a7babc433966c24))
- only refresh treeview if visible ([6b55bc1](https://github.com/dendronhq/dendron/commit/6b55bc16592b678e7385d140885d22a81325aad9))
- show welcome on first install ([1338e47](https://github.com/dendronhq/dendron/commit/1338e47c49da1ab9a45c2c813a1645cb22a58ab6))
- sync test ([40c8958](https://github.com/dendronhq/dendron/commit/40c89580cd6729db1e103deba070ce0babe36e0a))

### Features Dendron

- Add Doctor command to create missing linked notes ([#713](https://github.com/dendronhq/dendron/issues/713)) ([9558353](https://github.com/dendronhq/dendron/commit/9558353c8a636c8a8d400fc3109f75b387da37a6))
- Basic block reference link functionality ([#742](https://github.com/dendronhq/dendron/issues/742)) ([416e382](https://github.com/dendronhq/dendron/commit/416e3825254b57625f7dc2b6063f1e8bc731bf3b))
- paste file cmd ([3e3f419](https://github.com/dendronhq/dendron/commit/3e3f41971607c12705df4830f3ff88e67a2788e0))
- paste file cmd ([51ab5aa](https://github.com/dendronhq/dendron/commit/51ab5aaf4d440f7e7f5bd765b9b5378f346076b8))
- Workspace Sync command ([#738](https://github.com/dendronhq/dendron/issues/738)) ([7e462c0](https://github.com/dendronhq/dendron/commit/7e462c07ecec73982f3293ff80cfa3041d0ceabf))

## [0.43.4-alpha.0](https://github.com/dendronhq/dendron/compare/v0.42.0...v0.43.4-alpha.0) (2021-05-28)

### Bug Fixes

- extension packaging ([48f79c5](https://github.com/dendronhq/dendron/commit/48f79c50fde74d85e843fbfce563a17c75b7e705))
- handle file names with non-ascii in paste file ([97a3437](https://github.com/dendronhq/dendron/commit/97a34372f7c638731a74e9935ca57bf0810f2c19))
- lookupConfirmVaultOnCreate not set in note lookup ([a560603](https://github.com/dendronhq/dendron/commit/a5606030c559f0f35a22c40552b25d29e266b0b8))
- only refresh treeview if visible ([1471cb9](https://github.com/dendronhq/dendron/commit/1471cb9fa196e912edcc7a834a7babc433966c24))
- only refresh treeview if visible ([6b55bc1](https://github.com/dendronhq/dendron/commit/6b55bc16592b678e7385d140885d22a81325aad9))
- show welcome on first install ([1338e47](https://github.com/dendronhq/dendron/commit/1338e47c49da1ab9a45c2c813a1645cb22a58ab6))
- sync test ([40c8958](https://github.com/dendronhq/dendron/commit/40c89580cd6729db1e103deba070ce0babe36e0a))

### Features Dendron

- Add Doctor command to create missing linked notes ([#713](https://github.com/dendronhq/dendron/issues/713)) ([9558353](https://github.com/dendronhq/dendron/commit/9558353c8a636c8a8d400fc3109f75b387da37a6))
- Basic block reference link functionality ([#742](https://github.com/dendronhq/dendron/issues/742)) ([416e382](https://github.com/dendronhq/dendron/commit/416e3825254b57625f7dc2b6063f1e8bc731bf3b))
- paste file cmd ([3e3f419](https://github.com/dendronhq/dendron/commit/3e3f41971607c12705df4830f3ff88e67a2788e0))
- paste file cmd ([51ab5aa](https://github.com/dendronhq/dendron/commit/51ab5aaf4d440f7e7f5bd765b9b5378f346076b8))
- Workspace Sync command ([#738](https://github.com/dendronhq/dendron/issues/738)) ([7e462c0](https://github.com/dendronhq/dendron/commit/7e462c07ecec73982f3293ff80cfa3041d0ceabf))

## [0.43.3-alpha.0](https://github.com/dendronhq/dendron/compare/v0.42.0...v0.43.3-alpha.0) (2021-05-28)

### Bug Fixes

- extension packaging ([48f79c5](https://github.com/dendronhq/dendron/commit/48f79c50fde74d85e843fbfce563a17c75b7e705))
- handle file names with non-ascii in paste file ([97a3437](https://github.com/dendronhq/dendron/commit/97a34372f7c638731a74e9935ca57bf0810f2c19))
- lookupConfirmVaultOnCreate not set in note lookup ([a560603](https://github.com/dendronhq/dendron/commit/a5606030c559f0f35a22c40552b25d29e266b0b8))
- only refresh treeview if visible ([1471cb9](https://github.com/dendronhq/dendron/commit/1471cb9fa196e912edcc7a834a7babc433966c24))
- only refresh treeview if visible ([6b55bc1](https://github.com/dendronhq/dendron/commit/6b55bc16592b678e7385d140885d22a81325aad9))
- show welcome on first install ([1338e47](https://github.com/dendronhq/dendron/commit/1338e47c49da1ab9a45c2c813a1645cb22a58ab6))
- sync test ([40c8958](https://github.com/dendronhq/dendron/commit/40c89580cd6729db1e103deba070ce0babe36e0a))

### Features Dendron

- Add Doctor command to create missing linked notes ([#713](https://github.com/dendronhq/dendron/issues/713)) ([9558353](https://github.com/dendronhq/dendron/commit/9558353c8a636c8a8d400fc3109f75b387da37a6))
- Basic block reference link functionality ([#742](https://github.com/dendronhq/dendron/issues/742)) ([416e382](https://github.com/dendronhq/dendron/commit/416e3825254b57625f7dc2b6063f1e8bc731bf3b))
- paste file cmd ([3e3f419](https://github.com/dendronhq/dendron/commit/3e3f41971607c12705df4830f3ff88e67a2788e0))
- paste file cmd ([51ab5aa](https://github.com/dendronhq/dendron/commit/51ab5aaf4d440f7e7f5bd765b9b5378f346076b8))
- Workspace Sync command ([#738](https://github.com/dendronhq/dendron/issues/738)) ([7e462c0](https://github.com/dendronhq/dendron/commit/7e462c07ecec73982f3293ff80cfa3041d0ceabf))

## [0.43.2-alpha.0](https://github.com/dendronhq/dendron/compare/v0.42.0...v0.43.2-alpha.0) (2021-05-27)

### Bug Fixes

- extension packaging ([48f79c5](https://github.com/dendronhq/dendron/commit/48f79c50fde74d85e843fbfce563a17c75b7e705))
- handle file names with non-ascii in paste file ([61407df](https://github.com/dendronhq/dendron/commit/61407df5bac4282c480ff521ab39f6568e306ee1))
- only refresh treeview if visible ([1471cb9](https://github.com/dendronhq/dendron/commit/1471cb9fa196e912edcc7a834a7babc433966c24))
- only refresh treeview if visible ([6b55bc1](https://github.com/dendronhq/dendron/commit/6b55bc16592b678e7385d140885d22a81325aad9))
- show welcome on first install ([9a29117](https://github.com/dendronhq/dendron/commit/9a29117ce3036683dc41c072aff404cedb94882d))
- sync test ([40c8958](https://github.com/dendronhq/dendron/commit/40c89580cd6729db1e103deba070ce0babe36e0a))

### Features Dendron

- Add Doctor command to create missing linked notes ([#713](https://github.com/dendronhq/dendron/issues/713)) ([9558353](https://github.com/dendronhq/dendron/commit/9558353c8a636c8a8d400fc3109f75b387da37a6))
- Basic block reference link functionality ([#742](https://github.com/dendronhq/dendron/issues/742)) ([416e382](https://github.com/dendronhq/dendron/commit/416e3825254b57625f7dc2b6063f1e8bc731bf3b))
- paste file cmd ([3e3f419](https://github.com/dendronhq/dendron/commit/3e3f41971607c12705df4830f3ff88e67a2788e0))
- paste file cmd ([51ab5aa](https://github.com/dendronhq/dendron/commit/51ab5aaf4d440f7e7f5bd765b9b5378f346076b8))
- Workspace Sync command ([#738](https://github.com/dendronhq/dendron/issues/738)) ([7e462c0](https://github.com/dendronhq/dendron/commit/7e462c07ecec73982f3293ff80cfa3041d0ceabf))

## [0.43.1](https://github.com/dendronhq/dendron/compare/v0.42.0...v0.43.1) (2021-05-26)

### Bug Fixes

- extension packaging ([48f79c5](https://github.com/dendronhq/dendron/commit/48f79c50fde74d85e843fbfce563a17c75b7e705))
- handle file names with non-ascii in paste file ([61407df](https://github.com/dendronhq/dendron/commit/61407df5bac4282c480ff521ab39f6568e306ee1))
- only refresh treeview if visible ([1471cb9](https://github.com/dendronhq/dendron/commit/1471cb9fa196e912edcc7a834a7babc433966c24))
- only refresh treeview if visible ([6b55bc1](https://github.com/dendronhq/dendron/commit/6b55bc16592b678e7385d140885d22a81325aad9))
- show welcome on first install ([9a29117](https://github.com/dendronhq/dendron/commit/9a29117ce3036683dc41c072aff404cedb94882d))
- sync test ([40c8958](https://github.com/dendronhq/dendron/commit/40c89580cd6729db1e103deba070ce0babe36e0a))

### Features Dendron

- Add Doctor command to create missing linked notes ([#713](https://github.com/dendronhq/dendron/issues/713)) ([9558353](https://github.com/dendronhq/dendron/commit/9558353c8a636c8a8d400fc3109f75b387da37a6))
- Basic block reference link functionality ([#742](https://github.com/dendronhq/dendron/issues/742)) ([416e382](https://github.com/dendronhq/dendron/commit/416e3825254b57625f7dc2b6063f1e8bc731bf3b))
- paste file cmd ([3e3f419](https://github.com/dendronhq/dendron/commit/3e3f41971607c12705df4830f3ff88e67a2788e0))
- paste file cmd ([51ab5aa](https://github.com/dendronhq/dendron/commit/51ab5aaf4d440f7e7f5bd765b9b5378f346076b8))
- Workspace Sync command ([#738](https://github.com/dendronhq/dendron/issues/738)) ([7e462c0](https://github.com/dendronhq/dendron/commit/7e462c07ecec73982f3293ff80cfa3041d0ceabf))

## [0.43.3-alpha.0](https://github.com/dendronhq/dendron/compare/v0.42.0...v0.43.3-alpha.0) (2021-05-26)

### Bug Fixes

- extension packaging ([48f79c5](https://github.com/dendronhq/dendron/commit/48f79c50fde74d85e843fbfce563a17c75b7e705))
- only refresh treeview if visible ([1471cb9](https://github.com/dendronhq/dendron/commit/1471cb9fa196e912edcc7a834a7babc433966c24))
- only refresh treeview if visible ([6b55bc1](https://github.com/dendronhq/dendron/commit/6b55bc16592b678e7385d140885d22a81325aad9))
- show welcome on first install ([9a29117](https://github.com/dendronhq/dendron/commit/9a29117ce3036683dc41c072aff404cedb94882d))
- sync test ([40c8958](https://github.com/dendronhq/dendron/commit/40c89580cd6729db1e103deba070ce0babe36e0a))

### Features Dendron

- Add Doctor command to create missing linked notes ([#713](https://github.com/dendronhq/dendron/issues/713)) ([9558353](https://github.com/dendronhq/dendron/commit/9558353c8a636c8a8d400fc3109f75b387da37a6))
- Basic block reference link functionality ([#742](https://github.com/dendronhq/dendron/issues/742)) ([416e382](https://github.com/dendronhq/dendron/commit/416e3825254b57625f7dc2b6063f1e8bc731bf3b))
- paste file cmd ([3e3f419](https://github.com/dendronhq/dendron/commit/3e3f41971607c12705df4830f3ff88e67a2788e0))
- paste file cmd ([51ab5aa](https://github.com/dendronhq/dendron/commit/51ab5aaf4d440f7e7f5bd765b9b5378f346076b8))
- Workspace Sync command ([#738](https://github.com/dendronhq/dendron/issues/738)) ([7e462c0](https://github.com/dendronhq/dendron/commit/7e462c07ecec73982f3293ff80cfa3041d0ceabf))

## [0.43.2-alpha.0](https://github.com/dendronhq/dendron/compare/v0.42.0...v0.43.2-alpha.0) (2021-05-25)

### Bug Fixes

- extension packaging ([48f79c5](https://github.com/dendronhq/dendron/commit/48f79c50fde74d85e843fbfce563a17c75b7e705))
- only refresh treeview if visible ([1471cb9](https://github.com/dendronhq/dendron/commit/1471cb9fa196e912edcc7a834a7babc433966c24))
- only refresh treeview if visible ([6b55bc1](https://github.com/dendronhq/dendron/commit/6b55bc16592b678e7385d140885d22a81325aad9))
- show welcome on first install ([9a29117](https://github.com/dendronhq/dendron/commit/9a29117ce3036683dc41c072aff404cedb94882d))
- sync test ([40c8958](https://github.com/dendronhq/dendron/commit/40c89580cd6729db1e103deba070ce0babe36e0a))

### Features Dendron

- Add Doctor command to create missing linked notes ([#713](https://github.com/dendronhq/dendron/issues/713)) ([9558353](https://github.com/dendronhq/dendron/commit/9558353c8a636c8a8d400fc3109f75b387da37a6))
- Basic block reference link functionality ([#742](https://github.com/dendronhq/dendron/issues/742)) ([416e382](https://github.com/dendronhq/dendron/commit/416e3825254b57625f7dc2b6063f1e8bc731bf3b))
- paste file cmd ([3e3f419](https://github.com/dendronhq/dendron/commit/3e3f41971607c12705df4830f3ff88e67a2788e0))
- paste file cmd ([51ab5aa](https://github.com/dendronhq/dendron/commit/51ab5aaf4d440f7e7f5bd765b9b5378f346076b8))
- Workspace Sync command ([#738](https://github.com/dendronhq/dendron/issues/738)) ([7e462c0](https://github.com/dendronhq/dendron/commit/7e462c07ecec73982f3293ff80cfa3041d0ceabf))

## [0.43.1-alpha.0](https://github.com/dendronhq/dendron/compare/v0.42.0...v0.43.1-alpha.0) (2021-05-24)

### Bug Fixes

- extension packaging ([48f79c5](https://github.com/dendronhq/dendron/commit/48f79c50fde74d85e843fbfce563a17c75b7e705))
- only refresh treeview if visible ([1471cb9](https://github.com/dendronhq/dendron/commit/1471cb9fa196e912edcc7a834a7babc433966c24))
- only refresh treeview if visible ([6b55bc1](https://github.com/dendronhq/dendron/commit/6b55bc16592b678e7385d140885d22a81325aad9))
- show welcome on first install ([9a29117](https://github.com/dendronhq/dendron/commit/9a29117ce3036683dc41c072aff404cedb94882d))
- sync test ([40c8958](https://github.com/dendronhq/dendron/commit/40c89580cd6729db1e103deba070ce0babe36e0a))

### Features Dendron

- Add Doctor command to create missing linked notes ([#713](https://github.com/dendronhq/dendron/issues/713)) ([9558353](https://github.com/dendronhq/dendron/commit/9558353c8a636c8a8d400fc3109f75b387da37a6))
- Basic block reference link functionality ([#742](https://github.com/dendronhq/dendron/issues/742)) ([416e382](https://github.com/dendronhq/dendron/commit/416e3825254b57625f7dc2b6063f1e8bc731bf3b))
- paste file cmd ([3e3f419](https://github.com/dendronhq/dendron/commit/3e3f41971607c12705df4830f3ff88e67a2788e0))
- paste file cmd ([51ab5aa](https://github.com/dendronhq/dendron/commit/51ab5aaf4d440f7e7f5bd765b9b5378f346076b8))
- Workspace Sync command ([#738](https://github.com/dendronhq/dendron/issues/738)) ([7e462c0](https://github.com/dendronhq/dendron/commit/7e462c07ecec73982f3293ff80cfa3041d0ceabf))

# [0.43.0](https://github.com/dendronhq/dendron/compare/v0.42.0...v0.43.0) (2021-05-24)

### Bug Fixes

- extension packaging ([48f79c5](https://github.com/dendronhq/dendron/commit/48f79c50fde74d85e843fbfce563a17c75b7e705))
- only refresh treeview if visible ([1471cb9](https://github.com/dendronhq/dendron/commit/1471cb9fa196e912edcc7a834a7babc433966c24))
- only refresh treeview if visible ([6b55bc1](https://github.com/dendronhq/dendron/commit/6b55bc16592b678e7385d140885d22a81325aad9))
- sync test ([40c8958](https://github.com/dendronhq/dendron/commit/40c89580cd6729db1e103deba070ce0babe36e0a))

### Features Dendron

- Add Doctor command to create missing linked notes ([#713](https://github.com/dendronhq/dendron/issues/713)) ([9558353](https://github.com/dendronhq/dendron/commit/9558353c8a636c8a8d400fc3109f75b387da37a6))
- Basic block reference link functionality ([#742](https://github.com/dendronhq/dendron/issues/742)) ([416e382](https://github.com/dendronhq/dendron/commit/416e3825254b57625f7dc2b6063f1e8bc731bf3b))
- paste file cmd ([3e3f419](https://github.com/dendronhq/dendron/commit/3e3f41971607c12705df4830f3ff88e67a2788e0))
- paste file cmd ([51ab5aa](https://github.com/dendronhq/dendron/commit/51ab5aaf4d440f7e7f5bd765b9b5378f346076b8))
- Workspace Sync command ([#738](https://github.com/dendronhq/dendron/issues/738)) ([7e462c0](https://github.com/dendronhq/dendron/commit/7e462c07ecec73982f3293ff80cfa3041d0ceabf))

## [0.42.6-alpha.0](https://github.com/dendronhq/dendron/compare/v0.42.0...v0.42.6-alpha.0) (2021-05-24)

### Bug Fixes

- extension packaging ([48f79c5](https://github.com/dendronhq/dendron/commit/48f79c50fde74d85e843fbfce563a17c75b7e705))
- only refresh treeview if visible ([1471cb9](https://github.com/dendronhq/dendron/commit/1471cb9fa196e912edcc7a834a7babc433966c24))
- only refresh treeview if visible ([6b55bc1](https://github.com/dendronhq/dendron/commit/6b55bc16592b678e7385d140885d22a81325aad9))
- sync test ([40c8958](https://github.com/dendronhq/dendron/commit/40c89580cd6729db1e103deba070ce0babe36e0a))

### Features Dendron

- Add Doctor command to create missing linked notes ([#713](https://github.com/dendronhq/dendron/issues/713)) ([9558353](https://github.com/dendronhq/dendron/commit/9558353c8a636c8a8d400fc3109f75b387da37a6))
- Basic block reference link functionality ([#742](https://github.com/dendronhq/dendron/issues/742)) ([416e382](https://github.com/dendronhq/dendron/commit/416e3825254b57625f7dc2b6063f1e8bc731bf3b))
- paste file cmd ([3e3f419](https://github.com/dendronhq/dendron/commit/3e3f41971607c12705df4830f3ff88e67a2788e0))
- paste file cmd ([51ab5aa](https://github.com/dendronhq/dendron/commit/51ab5aaf4d440f7e7f5bd765b9b5378f346076b8))
- Workspace Sync command ([#738](https://github.com/dendronhq/dendron/issues/738)) ([7e462c0](https://github.com/dendronhq/dendron/commit/7e462c07ecec73982f3293ff80cfa3041d0ceabf))

## [0.42.5-alpha.0](https://github.com/dendronhq/dendron/compare/v0.42.0...v0.42.5-alpha.0) (2021-05-24)

### Bug Fixes

- only refresh treeview if visible ([1471cb9](https://github.com/dendronhq/dendron/commit/1471cb9fa196e912edcc7a834a7babc433966c24))
- only refresh treeview if visible ([6b55bc1](https://github.com/dendronhq/dendron/commit/6b55bc16592b678e7385d140885d22a81325aad9))
- sync test ([40c8958](https://github.com/dendronhq/dendron/commit/40c89580cd6729db1e103deba070ce0babe36e0a))

### Features Dendron

- Add Doctor command to create missing linked notes ([#713](https://github.com/dendronhq/dendron/issues/713)) ([9558353](https://github.com/dendronhq/dendron/commit/9558353c8a636c8a8d400fc3109f75b387da37a6))
- Basic block reference link functionality ([#742](https://github.com/dendronhq/dendron/issues/742)) ([416e382](https://github.com/dendronhq/dendron/commit/416e3825254b57625f7dc2b6063f1e8bc731bf3b))
- paste file cmd ([3e3f419](https://github.com/dendronhq/dendron/commit/3e3f41971607c12705df4830f3ff88e67a2788e0))
- paste file cmd ([51ab5aa](https://github.com/dendronhq/dendron/commit/51ab5aaf4d440f7e7f5bd765b9b5378f346076b8))
- Workspace Sync command ([#738](https://github.com/dendronhq/dendron/issues/738)) ([7e462c0](https://github.com/dendronhq/dendron/commit/7e462c07ecec73982f3293ff80cfa3041d0ceabf))

## [0.42.4-alpha.0](https://github.com/dendronhq/dendron/compare/v0.42.0...v0.42.4-alpha.0) (2021-05-24)

### Bug Fixes

- only refresh treeview if visible ([1471cb9](https://github.com/dendronhq/dendron/commit/1471cb9fa196e912edcc7a834a7babc433966c24))
- only refresh treeview if visible ([6b55bc1](https://github.com/dendronhq/dendron/commit/6b55bc16592b678e7385d140885d22a81325aad9))
- sync test ([40c8958](https://github.com/dendronhq/dendron/commit/40c89580cd6729db1e103deba070ce0babe36e0a))

### Features Dendron

- Add Doctor command to create missing linked notes ([#713](https://github.com/dendronhq/dendron/issues/713)) ([9558353](https://github.com/dendronhq/dendron/commit/9558353c8a636c8a8d400fc3109f75b387da37a6))
- Basic block reference link functionality ([#742](https://github.com/dendronhq/dendron/issues/742)) ([416e382](https://github.com/dendronhq/dendron/commit/416e3825254b57625f7dc2b6063f1e8bc731bf3b))
- paste file cmd ([3e3f419](https://github.com/dendronhq/dendron/commit/3e3f41971607c12705df4830f3ff88e67a2788e0))
- paste file cmd ([51ab5aa](https://github.com/dendronhq/dendron/commit/51ab5aaf4d440f7e7f5bd765b9b5378f346076b8))
- Workspace Sync command ([#738](https://github.com/dendronhq/dendron/issues/738)) ([7e462c0](https://github.com/dendronhq/dendron/commit/7e462c07ecec73982f3293ff80cfa3041d0ceabf))

## [0.42.3-alpha.0](https://github.com/dendronhq/dendron/compare/v0.42.0...v0.42.3-alpha.0) (2021-05-24)

### Bug Fixes

- only refresh treeview if visible ([1471cb9](https://github.com/dendronhq/dendron/commit/1471cb9fa196e912edcc7a834a7babc433966c24))

### Features Dendron

- Add Doctor command to create missing linked notes ([#713](https://github.com/dendronhq/dendron/issues/713)) ([9558353](https://github.com/dendronhq/dendron/commit/9558353c8a636c8a8d400fc3109f75b387da37a6))
- Basic block reference link functionality ([#742](https://github.com/dendronhq/dendron/issues/742)) ([416e382](https://github.com/dendronhq/dendron/commit/416e3825254b57625f7dc2b6063f1e8bc731bf3b))
- paste file cmd ([3e3f419](https://github.com/dendronhq/dendron/commit/3e3f41971607c12705df4830f3ff88e67a2788e0))
- Workspace Sync command ([#738](https://github.com/dendronhq/dendron/issues/738)) ([7e462c0](https://github.com/dendronhq/dendron/commit/7e462c07ecec73982f3293ff80cfa3041d0ceabf))

## [0.42.2-alpha.0](https://github.com/dendronhq/dendron/compare/v0.42.0...v0.42.2-alpha.0) (2021-05-22)

### Bug Fixes

- only refresh treeview if visible ([6b55bc1](https://github.com/dendronhq/dendron/commit/6b55bc16592b678e7385d140885d22a81325aad9))

### Features Dendron

- Basic block reference link functionality ([#742](https://github.com/dendronhq/dendron/issues/742)) ([416e382](https://github.com/dendronhq/dendron/commit/416e3825254b57625f7dc2b6063f1e8bc731bf3b))
- Workspace Sync command ([#738](https://github.com/dendronhq/dendron/issues/738)) ([7e462c0](https://github.com/dendronhq/dendron/commit/7e462c07ecec73982f3293ff80cfa3041d0ceabf))

## [0.42.1-alpha.0](https://github.com/dendronhq/dendron/compare/v0.42.0...v0.42.1-alpha.0) (2021-05-20)

### Features Dendron

- Basic block reference link functionality ([#742](https://github.com/dendronhq/dendron/issues/742)) ([416e382](https://github.com/dendronhq/dendron/commit/416e3825254b57625f7dc2b6063f1e8bc731bf3b))
- Workspace Sync command ([#738](https://github.com/dendronhq/dendron/issues/738)) ([7e462c0](https://github.com/dendronhq/dendron/commit/7e462c07ecec73982f3293ff80cfa3041d0ceabf))

# [0.42.0](https://github.com/dendronhq/dendron/compare/v0.41.0...v0.42.0) (2021-05-17)

### Features Dendron

- pass custom values to lookup ([9a74fb0](https://github.com/dendronhq/dendron/commit/9a74fb0ded9218a931981f8148bff2b6fc542582))

# [0.41.0](https://github.com/dendronhq/dendron/compare/v0.40.0...v0.41.0) (2021-05-10)

### Bug Fixes

- double confirmation when using publish pod ([50183ef](https://github.com/dendronhq/dendron/commit/50183ef29eea7e9a3c953fe569f2ab6df2f413b9))
- go prev hierarchy accidentally removed ([08d7e93](https://github.com/dendronhq/dendron/commit/08d7e93143761285f247fc9e5087f126be93066d))
- maintain alphabetical sort order for trees ([97a6e42](https://github.com/dendronhq/dendron/commit/97a6e42f7a32292bb086b57936ce340a0cc0b12d))
- make requireHook work with webpack ([b1e6447](https://github.com/dendronhq/dendron/commit/b1e644772de9fe583eca4f6e32ac7365ecfa4a67))

### Features Dendron

- delete hook command ([14f8d20](https://github.com/dendronhq/dendron/commit/14f8d20a1a5759271071c553624c5df45b3f8772))

## [0.40.4-alpha.0](https://github.com/dendronhq/dendron/compare/v0.40.0...v0.40.4-alpha.0) (2021-05-09)

### Bug Fixes

- double confirmation when using publish pod ([6a6cc1b](https://github.com/dendronhq/dendron/commit/6a6cc1b6367a8260a05a9b4f26491a265caf37f9))
- go prev hierarchy accidentally removed ([08d7e93](https://github.com/dendronhq/dendron/commit/08d7e93143761285f247fc9e5087f126be93066d))
- maintain alphabetical sort order for trees ([b7b2b59](https://github.com/dendronhq/dendron/commit/b7b2b59686326603281013fe128b095cff0868b8))
- make requireHook work with webpack ([c0835d2](https://github.com/dendronhq/dendron/commit/c0835d2e34fde992c5484ac4be7f4eb0ae43dd6a))

### Features Dendron

- delete hook command ([59c078a](https://github.com/dendronhq/dendron/commit/59c078a200b15953d60de978952ec50429be9313))

## [0.40.4-alpha.0](https://github.com/dendronhq/dendron/compare/v0.40.0...v0.40.4-alpha.0) (2021-05-08)

### Bug Fixes

- go prev hierarchy accidentally removed ([08d7e93](https://github.com/dendronhq/dendron/commit/08d7e93143761285f247fc9e5087f126be93066d))
- maintain alphabetical sort order for trees ([b7b2b59](https://github.com/dendronhq/dendron/commit/b7b2b59686326603281013fe128b095cff0868b8))
- make requireHook work with webpack ([c0835d2](https://github.com/dendronhq/dendron/commit/c0835d2e34fde992c5484ac4be7f4eb0ae43dd6a))

### Features Dendron

- delete hook command ([59c078a](https://github.com/dendronhq/dendron/commit/59c078a200b15953d60de978952ec50429be9313))

## [0.40.3-alpha.0](https://github.com/dendronhq/dendron/compare/v0.40.0...v0.40.3-alpha.0) (2021-05-08)

### Bug Fixes

- go prev hierarchy accidentally removed ([08d7e93](https://github.com/dendronhq/dendron/commit/08d7e93143761285f247fc9e5087f126be93066d))
- maintain alphabetical sort order for trees ([b7b2b59](https://github.com/dendronhq/dendron/commit/b7b2b59686326603281013fe128b095cff0868b8))
- make requireHook work with webpack ([c0835d2](https://github.com/dendronhq/dendron/commit/c0835d2e34fde992c5484ac4be7f4eb0ae43dd6a))

### Features Dendron

- delete hook command ([59c078a](https://github.com/dendronhq/dendron/commit/59c078a200b15953d60de978952ec50429be9313))

## [0.40.2](https://github.com/dendronhq/dendron/compare/v0.40.0...v0.40.2) (2021-05-05)

### Bug Fixes

- go prev hierarchy accidentally removed ([08d7e93](https://github.com/dendronhq/dendron/commit/08d7e93143761285f247fc9e5087f126be93066d))

## [0.40.2-alpha.0](https://github.com/dendronhq/dendron/compare/v0.40.0...v0.40.2-alpha.0) (2021-05-05)

### Bug Fixes

- go prev hierarchy accidentally removed ([08d7e93](https://github.com/dendronhq/dendron/commit/08d7e93143761285f247fc9e5087f126be93066d))

## [0.40.1](https://github.com/dendronhq/dendron/compare/v0.40.0...v0.40.1) (2021-05-04)

### Bug Fixes

- go prev hierarchy accidentally removed ([08d7e93](https://github.com/dendronhq/dendron/commit/08d7e93143761285f247fc9e5087f126be93066d))

# [0.40.0](https://github.com/dendronhq/dendron/compare/v0.39.0...v0.40.0) (2021-05-03)

### Bug Fixes

- better error message when moving note results in overwritten note ([a98787a](https://github.com/dendronhq/dendron/commit/a98787afbca2d8c850a399dc656fa7449e7507a3))
- cancel vault selection cancels command ([042bb59](https://github.com/dendronhq/dendron/commit/042bb598eeeef94879108f16ce5f8d5078e7b536))
- goto note prefer existing note for multi-vault workspace ([e0f8bb7](https://github.com/dendronhq/dendron/commit/e0f8bb77c1d0558d37b55fe775813aa821e1798e))
- insert note resulting in error ([b48721d](https://github.com/dendronhq/dendron/commit/b48721db9518100868a34278a5dfd2beac16f207))
- properly initialize links from cache ([a0e9680](https://github.com/dendronhq/dendron/commit/a0e9680821a275d97771538c8ffeef14fcb63f4e))
- tree view not refreshing on new note ([11882ca](https://github.com/dendronhq/dendron/commit/11882ca9d20cbb87faca784989eab9a5fafd2c4c))
- use new remark plugins for markdown pod ([c19c500](https://github.com/dendronhq/dendron/commit/c19c500525dce79f10a7d98866fe292cf84060a4))

## [0.39.2](https://github.com/dendronhq/dendron/compare/v0.39.0...v0.39.2) (2021-04-30)

### Bug Fixes

- better error message when moving note results in overwritten note ([a98787a](https://github.com/dendronhq/dendron/commit/a98787afbca2d8c850a399dc656fa7449e7507a3))
- goto note prefer existing note for multi-vault workspace ([e0f8bb7](https://github.com/dendronhq/dendron/commit/e0f8bb77c1d0558d37b55fe775813aa821e1798e))
- insert note resulting in error ([b48721d](https://github.com/dendronhq/dendron/commit/b48721db9518100868a34278a5dfd2beac16f207))
- properly initialize links from cache ([a0e9680](https://github.com/dendronhq/dendron/commit/a0e9680821a275d97771538c8ffeef14fcb63f4e))
- tree view not refreshing on new note ([11882ca](https://github.com/dendronhq/dendron/commit/11882ca9d20cbb87faca784989eab9a5fafd2c4c))
- use new remark plugins for markdown pod ([c19c500](https://github.com/dendronhq/dendron/commit/c19c500525dce79f10a7d98866fe292cf84060a4))

## [0.39.2-alpha.0](https://github.com/dendronhq/dendron/compare/v0.39.0...v0.39.2-alpha.0) (2021-04-29)

### Bug Fixes

- goto note prefer existing note for multi-vault workspace ([e0f8bb7](https://github.com/dendronhq/dendron/commit/e0f8bb77c1d0558d37b55fe775813aa821e1798e))
- insert note resulting in error ([b48721d](https://github.com/dendronhq/dendron/commit/b48721db9518100868a34278a5dfd2beac16f207))
- properly initialize links from cache ([a0e9680](https://github.com/dendronhq/dendron/commit/a0e9680821a275d97771538c8ffeef14fcb63f4e))
- tree view not refreshing on new note ([11882ca](https://github.com/dendronhq/dendron/commit/11882ca9d20cbb87faca784989eab9a5fafd2c4c))
- use new remark plugins for markdown pod ([c19c500](https://github.com/dendronhq/dendron/commit/c19c500525dce79f10a7d98866fe292cf84060a4))

# Change Log

For up to date changes, please go to our published changelog [here](https://wiki.dendron.so/notes/9bc92432-a24c-492b-b831-4d5378c1692b.html).
The changelog below lists changes that follow the [conventional commits](https://conventionalcommits.org) guidelines but may be incomplete.

## [0.39.1](https://github.com/dendronhq/dendron/compare/v0.39.0...v0.39.1) (2021-04-27)

### Bug Fixes

- properly initialize links from cache ([a0e9680](https://github.com/dendronhq/dendron/commit/a0e9680821a275d97771538c8ffeef14fcb63f4e))

# [0.39.0](https://github.com/dendronhq/dendron/compare/v0.37.0...v0.39.0) (2021-04-26)

### Bug Fixes

- create daily journal note without open note ([eb792cb](https://github.com/dendronhq/dendron/commit/eb792cbe22e6297c20d66362791a597e9e99ff8b))
- go-down at root matches itself only ([#623](https://github.com/dendronhq/dendron/issues/623)) ([d70c120](https://github.com/dendronhq/dendron/commit/d70c1203085a1a00b135999c669d18cb500fcfb3)), closes [#619](https://github.com/dendronhq/dendron/issues/619)
- goto note issue [#662](https://github.com/dendronhq/dendron/issues/662) ([952b41e](https://github.com/dendronhq/dendron/commit/952b41e0183d5b0a304a1824c7d8fb9b25fb2b02))
- issues with caching notes ([f6e3825](https://github.com/dendronhq/dendron/commit/f6e38250e6fa5c57bfdaaba1a0be87ff933620c5))
- notes added outside of Dendron get initialized with correct metadata ([5390f2f](https://github.com/dendronhq/dendron/commit/5390f2f893d02a89fe905784a82bba4590c894e7))

### Features Dendron

- add auth based analytics ([39f8f6b](https://github.com/dendronhq/dendron/commit/39f8f6b57c7acfcb5435debfeee128019c748529))
- add feedback to site ([aebbab9](https://github.com/dendronhq/dendron/commit/aebbab980eb846a0f81f993de422f42b6b4a6708))
- add svg and rollup image ([#625](https://github.com/dendronhq/dendron/issues/625)) ([44c0103](https://github.com/dendronhq/dendron/commit/44c010305a830dfc06f78ffd171f741b86308770))
- initialize notes from cache ([a0a2a1e](https://github.com/dendronhq/dendron/commit/a0a2a1eaeeeee45248ee3cadcda1b033df88d695))
- insert note command ([70065f8](https://github.com/dendronhq/dendron/commit/70065f859db745c725b252c34b452c9d16cf13a4))
- workspace push and pull commands ([e1a4ab3](https://github.com/dendronhq/dendron/commit/e1a4ab38329bbfe4bf190b019c2d855f0b239ab8))

## [0.38.6-alpha.0](https://github.com/dendronhq/dendron/compare/v0.37.0...v0.38.6-alpha.0) (2021-04-26)

### Bug Fixes

- create daily journal note without open note ([25f2f59](https://github.com/dendronhq/dendron/commit/25f2f59615105882565a48c6f16ed335b83a3fe8))
- fix goto note issue `Dendron: Goto Note` fails on one link, but `Goto Definition` works [#662](https://github.com/dendronhq/dendron/issues/662) ([b116a4e](https://github.com/dendronhq/dendron/commit/b116a4e54212ab58dabeaa6957118f0f980f345a))
- go-down at root matches itself only ([#623](https://github.com/dendronhq/dendron/issues/623)) ([d70c120](https://github.com/dendronhq/dendron/commit/d70c1203085a1a00b135999c669d18cb500fcfb3)), closes [#619](https://github.com/dendronhq/dendron/issues/619)
- issues with caching notes ([6a65d4e](https://github.com/dendronhq/dendron/commit/6a65d4e179f755324d68c01a3ca9d767e71b7dfc))
- notes added outside of Dendron get initialized with correct metadata ([5390f2f](https://github.com/dendronhq/dendron/commit/5390f2f893d02a89fe905784a82bba4590c894e7))

### Features Dendron

- add svg and rollup image ([#625](https://github.com/dendronhq/dendron/issues/625)) ([44c0103](https://github.com/dendronhq/dendron/commit/44c010305a830dfc06f78ffd171f741b86308770))
- insert note command ([70065f8](https://github.com/dendronhq/dendron/commit/70065f859db745c725b252c34b452c9d16cf13a4))
- workspace push and pull commands ([e1a4ab3](https://github.com/dendronhq/dendron/commit/e1a4ab38329bbfe4bf190b019c2d855f0b239ab8))

## [0.38.5-alpha.0](https://github.com/dendronhq/dendron/compare/v0.37.0...v0.38.5-alpha.0) (2021-04-26)

### Bug Fixes

- create daily journal note without open note ([25f2f59](https://github.com/dendronhq/dendron/commit/25f2f59615105882565a48c6f16ed335b83a3fe8))
- fix goto note issue `Dendron: Goto Note` fails on one link, but `Goto Definition` works [#662](https://github.com/dendronhq/dendron/issues/662) ([b116a4e](https://github.com/dendronhq/dendron/commit/b116a4e54212ab58dabeaa6957118f0f980f345a))
- go-down at root matches itself only ([#623](https://github.com/dendronhq/dendron/issues/623)) ([d70c120](https://github.com/dendronhq/dendron/commit/d70c1203085a1a00b135999c669d18cb500fcfb3)), closes [#619](https://github.com/dendronhq/dendron/issues/619)
- issues with caching notes ([6a65d4e](https://github.com/dendronhq/dendron/commit/6a65d4e179f755324d68c01a3ca9d767e71b7dfc))
- notes added outside of Dendron get initialized with correct metadata ([5390f2f](https://github.com/dendronhq/dendron/commit/5390f2f893d02a89fe905784a82bba4590c894e7))

### Features Dendron

- add svg and rollup image ([#625](https://github.com/dendronhq/dendron/issues/625)) ([44c0103](https://github.com/dendronhq/dendron/commit/44c010305a830dfc06f78ffd171f741b86308770))
- insert note command ([70065f8](https://github.com/dendronhq/dendron/commit/70065f859db745c725b252c34b452c9d16cf13a4))
- workspace push and pull commands ([e1a4ab3](https://github.com/dendronhq/dendron/commit/e1a4ab38329bbfe4bf190b019c2d855f0b239ab8))

## [0.38.4-alpha.0](https://github.com/dendronhq/dendron/compare/v0.37.0...v0.38.4-alpha.0) (2021-04-26)

### Bug Fixes

- create daily journal note without open note ([25f2f59](https://github.com/dendronhq/dendron/commit/25f2f59615105882565a48c6f16ed335b83a3fe8))
- fix goto note issue `Dendron: Goto Note` fails on one link, but `Goto Definition` works [#662](https://github.com/dendronhq/dendron/issues/662) ([b116a4e](https://github.com/dendronhq/dendron/commit/b116a4e54212ab58dabeaa6957118f0f980f345a))
- go-down at root matches itself only ([#623](https://github.com/dendronhq/dendron/issues/623)) ([d70c120](https://github.com/dendronhq/dendron/commit/d70c1203085a1a00b135999c669d18cb500fcfb3)), closes [#619](https://github.com/dendronhq/dendron/issues/619)
- notes added outside of Dendron get initialized with correct metadata ([5390f2f](https://github.com/dendronhq/dendron/commit/5390f2f893d02a89fe905784a82bba4590c894e7))

### Features Dendron

- add svg and rollup image ([#625](https://github.com/dendronhq/dendron/issues/625)) ([44c0103](https://github.com/dendronhq/dendron/commit/44c010305a830dfc06f78ffd171f741b86308770))
- insert note command ([70065f8](https://github.com/dendronhq/dendron/commit/70065f859db745c725b252c34b452c9d16cf13a4))
- workspace push and pull commands ([e1a4ab3](https://github.com/dendronhq/dendron/commit/e1a4ab38329bbfe4bf190b019c2d855f0b239ab8))

## [0.38.3-alpha.0](https://github.com/dendronhq/dendron/compare/v0.37.0...v0.38.3-alpha.0) (2021-04-25)

### Bug Fixes

- create daily journal note without open note ([25f2f59](https://github.com/dendronhq/dendron/commit/25f2f59615105882565a48c6f16ed335b83a3fe8))
- fix goto note issue `Dendron: Goto Note` fails on one link, but `Goto Definition` works [#662](https://github.com/dendronhq/dendron/issues/662) ([b116a4e](https://github.com/dendronhq/dendron/commit/b116a4e54212ab58dabeaa6957118f0f980f345a))
- go-down at root matches itself only ([#623](https://github.com/dendronhq/dendron/issues/623)) ([d70c120](https://github.com/dendronhq/dendron/commit/d70c1203085a1a00b135999c669d18cb500fcfb3)), closes [#619](https://github.com/dendronhq/dendron/issues/619)
- notes added outside of Dendron get initialized with correct metadata ([5390f2f](https://github.com/dendronhq/dendron/commit/5390f2f893d02a89fe905784a82bba4590c894e7))

### Features Dendron

- add svg and rollup image ([#625](https://github.com/dendronhq/dendron/issues/625)) ([44c0103](https://github.com/dendronhq/dendron/commit/44c010305a830dfc06f78ffd171f741b86308770))
- insert note command ([70065f8](https://github.com/dendronhq/dendron/commit/70065f859db745c725b252c34b452c9d16cf13a4))
- workspace push and pull commands ([e1a4ab3](https://github.com/dendronhq/dendron/commit/e1a4ab38329bbfe4bf190b019c2d855f0b239ab8))

## [0.38.2-alpha.0](https://github.com/dendronhq/dendron/compare/v0.37.0...v0.38.2-alpha.0) (2021-04-25)

### Bug Fixes

- create daily journal note without open note ([25f2f59](https://github.com/dendronhq/dendron/commit/25f2f59615105882565a48c6f16ed335b83a3fe8))
- fix goto note issue `Dendron: Goto Note` fails on one link, but `Goto Definition` works [#662](https://github.com/dendronhq/dendron/issues/662) ([b116a4e](https://github.com/dendronhq/dendron/commit/b116a4e54212ab58dabeaa6957118f0f980f345a))
- go-down at root matches itself only ([#623](https://github.com/dendronhq/dendron/issues/623)) ([d70c120](https://github.com/dendronhq/dendron/commit/d70c1203085a1a00b135999c669d18cb500fcfb3)), closes [#619](https://github.com/dendronhq/dendron/issues/619)
- notes added outside of Dendron get initialized with correct metadata ([5390f2f](https://github.com/dendronhq/dendron/commit/5390f2f893d02a89fe905784a82bba4590c894e7))

### Features Dendron

- add svg and rollup image ([#625](https://github.com/dendronhq/dendron/issues/625)) ([44c0103](https://github.com/dendronhq/dendron/commit/44c010305a830dfc06f78ffd171f741b86308770))
- insert note command ([70065f8](https://github.com/dendronhq/dendron/commit/70065f859db745c725b252c34b452c9d16cf13a4))
- workspace push and pull commands ([e1a4ab3](https://github.com/dendronhq/dendron/commit/e1a4ab38329bbfe4bf190b019c2d855f0b239ab8))

## [0.38.1-alpha.0](https://github.com/dendronhq/dendron/compare/v0.37.0...v0.38.1-alpha.0) (2021-04-23)

### Bug Fixes

- go-down at root matches itself only ([#623](https://github.com/dendronhq/dendron/issues/623)) ([d70c120](https://github.com/dendronhq/dendron/commit/d70c1203085a1a00b135999c669d18cb500fcfb3)), closes [#619](https://github.com/dendronhq/dendron/issues/619)
- notes added outside of Dendron get initialized with correct metadata ([5390f2f](https://github.com/dendronhq/dendron/commit/5390f2f893d02a89fe905784a82bba4590c894e7))

### Features Dendron

- add svg and rollup image ([#625](https://github.com/dendronhq/dendron/issues/625)) ([44c0103](https://github.com/dendronhq/dendron/commit/44c010305a830dfc06f78ffd171f741b86308770))
- insert note command ([70065f8](https://github.com/dendronhq/dendron/commit/70065f859db745c725b252c34b452c9d16cf13a4))
- workspace push and pull commands ([e1a4ab3](https://github.com/dendronhq/dendron/commit/e1a4ab38329bbfe4bf190b019c2d855f0b239ab8))

# [0.38.0](https://github.com/dendronhq/dendron/compare/v0.37.0...v0.38.0) (2021-04-19)

### Bug Fixes

- go-down at root matches itself only ([#623](https://github.com/dendronhq/dendron/issues/623)) ([d70c120](https://github.com/dendronhq/dendron/commit/d70c1203085a1a00b135999c669d18cb500fcfb3)), closes [#619](https://github.com/dendronhq/dendron/issues/619)
- notes added outside of Dendron get initialized with correct metadata ([5390f2f](https://github.com/dendronhq/dendron/commit/5390f2f893d02a89fe905784a82bba4590c894e7))

### Features Dendron

- add svg and rollup image ([#625](https://github.com/dendronhq/dendron/issues/625)) ([44c0103](https://github.com/dendronhq/dendron/commit/44c010305a830dfc06f78ffd171f741b86308770))
- insert note command ([70065f8](https://github.com/dendronhq/dendron/commit/70065f859db745c725b252c34b452c9d16cf13a4))
- workspace push and pull commands ([e1a4ab3](https://github.com/dendronhq/dendron/commit/e1a4ab38329bbfe4bf190b019c2d855f0b239ab8))

# [0.37.0](https://github.com/dendronhq/dendron/compare/v0.28.7-alpha.3...v0.37.0) (2021-04-12)

### Bug Fixes

- bad document link provider ([3de7979](https://github.com/dendronhq/dendron/commit/3de797907a76cb320a853634de5085c0f190cfcc))
- Cannot open secondary roots when using multiple vaults [#495](https://github.com/dendronhq/dendron/issues/495) ([f5dc840](https://github.com/dendronhq/dendron/commit/f5dc8400727bb5fa5d3cb7507d4a8a6d5fdcaf73))
- Clean up config after vault remove command ([#517](https://github.com/dendronhq/dendron/issues/517)) ([96fd09b](https://github.com/dendronhq/dendron/commit/96fd09ba43b009444d3ed313f93724311b020f24))
- default layout last_edit ([c7d6f7b](https://github.com/dendronhq/dendron/commit/c7d6f7b1b79e772c56ff443fc1102f8618123a93))
- deleted notes don't require reload for publishing ([9a10462](https://github.com/dendronhq/dendron/commit/9a1046290c2c3111dacb08401c108bf790ae617d))
- disable pretty ref when exporting markdown ([c0791da](https://github.com/dendronhq/dendron/commit/c0791da911b665ca66f1b3829784cf8a95ef9952))
- display hiearchies for stub nodes ([db02dcc](https://github.com/dendronhq/dendron/commit/db02dccc18e60bdcf8fa0015bbdcddbd6ceefa0f))
- don't publish private note refs ([67efb66](https://github.com/dendronhq/dendron/commit/67efb66a2fd3a82dd108fd621c8057a789c19f6b))
- error with wiki links when private ([f07ca3b](https://github.com/dendronhq/dendron/commit/f07ca3b174b7047f9d5e8c1a820e9dce15120972))
- exit if no path selected when adding a new vault ([4421d51](https://github.com/dendronhq/dendron/commit/4421d51c51b78300d4488b56a82ecd39e291abdf))
- goto note default to current vault ([43fabbb](https://github.com/dendronhq/dendron/commit/43fabbbe87a4efaba7b1fea98f38392a4e4d73e9))
- handle links to home page for backlinks ([5d6303b](https://github.com/dendronhq/dendron/commit/5d6303b0155617b940ba489ee7e20f5aa28d42cf))
- issue with mixed case files ([9b72299](https://github.com/dendronhq/dendron/commit/9b7229930b9efe4c68c6bc1f71bce6a03a6d568e))
- issues with recursive note references ([17879ec](https://github.com/dendronhq/dendron/commit/17879ecddb1c0a65ead09ca9b0a716414e438632))
- issues with search overlay ([a4fbe70](https://github.com/dendronhq/dendron/commit/a4fbe7060a157e69827d52f1dd0e7a6ec2df98fa))
- link wrap in samll viewport [#535](https://github.com/dendronhq/dendron/issues/535) ([b8366e8](https://github.com/dendronhq/dendron/commit/b8366e89733181971584f92280b9e5e238f27351))
- more forgiving link parser ([38c973c](https://github.com/dendronhq/dendron/commit/38c973cb2bfc45881778e86c985156da64450249))
- multi-case parent hiearchies ([aca4df1](https://github.com/dendronhq/dendron/commit/aca4df178b6fa8eb5703afdca4ddc36a46e81134))
- multi-link wikilink not resolving ([cfaf2c0](https://github.com/dendronhq/dendron/commit/cfaf2c0ae58464ceef2edcd2b5c182b93136fa80))
- pass vaults with names into engine api ([c9a42c6](https://github.com/dendronhq/dendron/commit/c9a42c6c2f1f8a7752b1c54441180237085de52f))
- publish pod updates ([fd29e9a](https://github.com/dendronhq/dendron/commit/fd29e9af13bf2c41c39f32da42dba31bb65013d6))
- ref to bad file in gitpod ([963f9cd](https://github.com/dendronhq/dendron/commit/963f9cd416851ae3217ad0278c8898a90dfecb44))
- siteUrl typo in cli error output ([#515](https://github.com/dendronhq/dendron/issues/515)) ([59084fd](https://github.com/dendronhq/dendron/commit/59084fd0975618eeac045913cdb74108f57f4fc1))
- spurious getVault errors ([b00e25b](https://github.com/dendronhq/dendron/commit/b00e25b0a7ef41eaa14a7e5f6cf5db194fd85879))
- support toggling prettyRef on preview ([62cd98a](https://github.com/dendronhq/dendron/commit/62cd98af09761ff9a639069b3a9848dae209cc62))
- typo in config option ([2be82e8](https://github.com/dendronhq/dendron/commit/2be82e8116e2bf5698abb7660795044ffa3f405d))
- update changelog generation ([58b1a43](https://github.com/dendronhq/dendron/commit/58b1a43630ae26f677f18ac51534f5760f80aec4))
- update site ([df985a2](https://github.com/dendronhq/dendron/commit/df985a25a17b7c2f2ee19411f4a9117e769a2d93))
- update slugger rules ([18b0090](https://github.com/dendronhq/dendron/commit/18b0090bd1f13168d33d66c1bcbda02e39b98124))

### Features Dendron

- add git punchcard pod ([50019c0](https://github.com/dendronhq/dendron/commit/50019c0f6405be449b446901809a9d2b787aa625))
- add html pod ([85c4075](https://github.com/dendronhq/dendron/commit/85c40750bfab2a711b6e1ad57dec0b7c7e9f09f5))
- and and commit cmd ([9b9d86c](https://github.com/dendronhq/dendron/commit/9b9d86ccf54fdb8b58f4c04bd57700d8c4c84cf7))
- browse note command ([c69ae9d](https://github.com/dendronhq/dendron/commit/c69ae9df5ff36f3a21465e91f0463012477f93ef))
- Changelog support ([#514](https://github.com/dendronhq/dendron/issues/514)) ([60f103b](https://github.com/dendronhq/dendron/commit/60f103b7b9c5f23fe0cdcc6321447381b087c653))
- create notes from cli ([ee2afa1](https://github.com/dendronhq/dendron/commit/ee2afa1ba1299d4e42bf4642010dc14381ad943a))
- delete note via cli ([87139ad](https://github.com/dendronhq/dendron/commit/87139addf0d804dbd903196b0e5e7bb7aca9a492))
- enable nunjucks optionally ([7e97758](https://github.com/dendronhq/dendron/commit/7e97758a4f60824e0a6f132f0f232adc0d20b9f8))
- markdown export pod ([552e01f](https://github.com/dendronhq/dendron/commit/552e01fa21bb6d6da1e243696a67382afda23194))
- move child notes generation into remark ([c4b12cf](https://github.com/dendronhq/dendron/commit/c4b12cf91ea48d662b30713033b2b70e10094131))
- Show backlinks at the end of pages ([#506](https://github.com/dendronhq/dendron/issues/506)) ([54e6580](https://github.com/dendronhq/dendron/commit/54e658086cebcdc6807548393e1e98c23e1602bd))
- variable sub v2 ([d851f7a](https://github.com/dendronhq/dendron/commit/d851f7aacd7bb051d5539175296fb6ada9da72be))
- vault add command ([10ddf86](https://github.com/dendronhq/dendron/commit/10ddf866140c1590964de823f310055ef8066ed4))
- xvault links for wikilink ([d72b4a0](https://github.com/dendronhq/dendron/commit/d72b4a05d7182bef5ec508192d8f2180ac558937))

### Reverts

- Revert "integ: publish minor" ([38ff5dd](https://github.com/dendronhq/dendron/commit/38ff5dd049cecd939fbd70744ef76a704aec3400))
- nunjucks ([fa42045](https://github.com/dendronhq/dendron/commit/fa4204525f36675e6d5091eff5b7a8eebf7daa21))

## [0.36.5-alpha.0](https://github.com/dendronhq/dendron/compare/v0.28.7-alpha.3...v0.36.5-alpha.0) (2021-04-12)

### Bug Fixes

- bad document link provider ([3de7979](https://github.com/dendronhq/dendron/commit/3de797907a76cb320a853634de5085c0f190cfcc))
- Cannot open secondary roots when using multiple vaults [#495](https://github.com/dendronhq/dendron/issues/495) ([f5dc840](https://github.com/dendronhq/dendron/commit/f5dc8400727bb5fa5d3cb7507d4a8a6d5fdcaf73))
- Clean up config after vault remove command ([#517](https://github.com/dendronhq/dendron/issues/517)) ([96fd09b](https://github.com/dendronhq/dendron/commit/96fd09ba43b009444d3ed313f93724311b020f24))
- default layout last_edit ([c7d6f7b](https://github.com/dendronhq/dendron/commit/c7d6f7b1b79e772c56ff443fc1102f8618123a93))
- deleted notes don't require reload for publishing ([9a10462](https://github.com/dendronhq/dendron/commit/9a1046290c2c3111dacb08401c108bf790ae617d))
- disable pretty ref when exporting markdown ([c0791da](https://github.com/dendronhq/dendron/commit/c0791da911b665ca66f1b3829784cf8a95ef9952))
- display hiearchies for stub nodes ([db02dcc](https://github.com/dendronhq/dendron/commit/db02dccc18e60bdcf8fa0015bbdcddbd6ceefa0f))
- don't publish private note refs ([67efb66](https://github.com/dendronhq/dendron/commit/67efb66a2fd3a82dd108fd621c8057a789c19f6b))
- error with wiki links when private ([f07ca3b](https://github.com/dendronhq/dendron/commit/f07ca3b174b7047f9d5e8c1a820e9dce15120972))
- exit if no path selected when adding a new vault ([4421d51](https://github.com/dendronhq/dendron/commit/4421d51c51b78300d4488b56a82ecd39e291abdf))
- goto note default to current vault ([43fabbb](https://github.com/dendronhq/dendron/commit/43fabbbe87a4efaba7b1fea98f38392a4e4d73e9))
- handle links to home page for backlinks ([5d6303b](https://github.com/dendronhq/dendron/commit/5d6303b0155617b940ba489ee7e20f5aa28d42cf))
- issue with mixed case files ([9b72299](https://github.com/dendronhq/dendron/commit/9b7229930b9efe4c68c6bc1f71bce6a03a6d568e))
- issues with recursive note references ([17879ec](https://github.com/dendronhq/dendron/commit/17879ecddb1c0a65ead09ca9b0a716414e438632))
- issues with search overlay ([a4fbe70](https://github.com/dendronhq/dendron/commit/a4fbe7060a157e69827d52f1dd0e7a6ec2df98fa))
- link wrap in samll viewport [#535](https://github.com/dendronhq/dendron/issues/535) ([b8366e8](https://github.com/dendronhq/dendron/commit/b8366e89733181971584f92280b9e5e238f27351))
- more forgiving link parser ([38c973c](https://github.com/dendronhq/dendron/commit/38c973cb2bfc45881778e86c985156da64450249))
- multi-case parent hiearchies ([aca4df1](https://github.com/dendronhq/dendron/commit/aca4df178b6fa8eb5703afdca4ddc36a46e81134))
- multi-link wikilink not resolving ([cfaf2c0](https://github.com/dendronhq/dendron/commit/cfaf2c0ae58464ceef2edcd2b5c182b93136fa80))
- pass vaults with names into engine api ([c9a42c6](https://github.com/dendronhq/dendron/commit/c9a42c6c2f1f8a7752b1c54441180237085de52f))
- publish pod updates ([fd29e9a](https://github.com/dendronhq/dendron/commit/fd29e9af13bf2c41c39f32da42dba31bb65013d6))
- ref to bad file in gitpod ([963f9cd](https://github.com/dendronhq/dendron/commit/963f9cd416851ae3217ad0278c8898a90dfecb44))
- siteUrl typo in cli error output ([#515](https://github.com/dendronhq/dendron/issues/515)) ([59084fd](https://github.com/dendronhq/dendron/commit/59084fd0975618eeac045913cdb74108f57f4fc1))
- spurious getVault errors ([b00e25b](https://github.com/dendronhq/dendron/commit/b00e25b0a7ef41eaa14a7e5f6cf5db194fd85879))
- support toggling prettyRef on preview ([62cd98a](https://github.com/dendronhq/dendron/commit/62cd98af09761ff9a639069b3a9848dae209cc62))
- typo in config option ([2be82e8](https://github.com/dendronhq/dendron/commit/2be82e8116e2bf5698abb7660795044ffa3f405d))
- update changelog generation ([58b1a43](https://github.com/dendronhq/dendron/commit/58b1a43630ae26f677f18ac51534f5760f80aec4))
- update site ([df985a2](https://github.com/dendronhq/dendron/commit/df985a25a17b7c2f2ee19411f4a9117e769a2d93))
- update slugger rules ([18b0090](https://github.com/dendronhq/dendron/commit/18b0090bd1f13168d33d66c1bcbda02e39b98124))

### Features Dendron

- add git punchcard pod ([50019c0](https://github.com/dendronhq/dendron/commit/50019c0f6405be449b446901809a9d2b787aa625))
- add html pod ([85c4075](https://github.com/dendronhq/dendron/commit/85c40750bfab2a711b6e1ad57dec0b7c7e9f09f5))
- and and commit cmd ([9b9d86c](https://github.com/dendronhq/dendron/commit/9b9d86ccf54fdb8b58f4c04bd57700d8c4c84cf7))
- browse note command ([c69ae9d](https://github.com/dendronhq/dendron/commit/c69ae9df5ff36f3a21465e91f0463012477f93ef))
- Changelog support ([#514](https://github.com/dendronhq/dendron/issues/514)) ([60f103b](https://github.com/dendronhq/dendron/commit/60f103b7b9c5f23fe0cdcc6321447381b087c653))
- create notes from cli ([ee2afa1](https://github.com/dendronhq/dendron/commit/ee2afa1ba1299d4e42bf4642010dc14381ad943a))
- delete note via cli ([87139ad](https://github.com/dendronhq/dendron/commit/87139addf0d804dbd903196b0e5e7bb7aca9a492))
- enable nunjucks optionally ([7e97758](https://github.com/dendronhq/dendron/commit/7e97758a4f60824e0a6f132f0f232adc0d20b9f8))
- markdown export pod ([552e01f](https://github.com/dendronhq/dendron/commit/552e01fa21bb6d6da1e243696a67382afda23194))
- move child notes generation into remark ([c4b12cf](https://github.com/dendronhq/dendron/commit/c4b12cf91ea48d662b30713033b2b70e10094131))
- Show backlinks at the end of pages ([#506](https://github.com/dendronhq/dendron/issues/506)) ([54e6580](https://github.com/dendronhq/dendron/commit/54e658086cebcdc6807548393e1e98c23e1602bd))
- variable sub v2 ([d851f7a](https://github.com/dendronhq/dendron/commit/d851f7aacd7bb051d5539175296fb6ada9da72be))
- xvault links for wikilink ([d72b4a0](https://github.com/dendronhq/dendron/commit/d72b4a05d7182bef5ec508192d8f2180ac558937))

### Reverts

- Revert "integ: publish minor" ([38ff5dd](https://github.com/dendronhq/dendron/commit/38ff5dd049cecd939fbd70744ef76a704aec3400))
- nunjucks ([fa42045](https://github.com/dendronhq/dendron/commit/fa4204525f36675e6d5091eff5b7a8eebf7daa21))

## [0.28.7-alpha.8](https://github.com/dendronhq/dendron/compare/v0.28.7-alpha.3...v0.28.7-alpha.8) (2021-02-15)

**Note:** Version bump only for package root

## [0.28.7-alpha.7](https://github.com/dendronhq/dendron/compare/v0.28.7-alpha.3...v0.28.7-alpha.7) (2021-02-15)

**Note:** Version bump only for package root

## [0.28.7-alpha.6](https://github.com/dendronhq/dendron/compare/v0.28.7-alpha.3...v0.28.7-alpha.6) (2021-02-15)

**Note:** Version bump only for package root

## [0.28.7-alpha.5](https://github.com/dendronhq/dendron/compare/v0.28.7-alpha.3...v0.28.7-alpha.5) (2021-02-15)

**Note:** Version bump only for package root

## [0.28.7-alpha.4](https://github.com/dendronhq/dendron/compare/v0.28.7-alpha.3...v0.28.7-alpha.4) (2021-02-15)

**Note:** Version bump only for package root

## [0.28.7-alpha.3](https://github.com/dendronhq/dendron/compare/v0.28.7-alpha.2...v0.28.7-alpha.3) (2021-02-15)

**Note:** Version bump only for package root

## [0.28.7-alpha.2](https://github.com/dendronhq/dendron/compare/v0.28.7-alpha.1...v0.28.7-alpha.2) (2021-02-14)

**Note:** Version bump only for package root

## [0.28.7-alpha.1](https://github.com/dendronhq/dendron/compare/v0.28.7-alpha.0...v0.28.7-alpha.1) (2021-02-14)

**Note:** Version bump only for package root

## [0.28.7-alpha.0](https://github.com/dendronhq/dendron/compare/v0.28.6...v0.28.7-alpha.0) (2021-02-14)

**Note:** Version bump only for package root

## [0.28.6](https://github.com/dendronhq/dendron/compare/v0.28.5...v0.28.6) (2021-02-14)

### Bug Fixes

- integ test failing ([ac97c1c](https://github.com/dendronhq/dendron/commit/ac97c1c7908b9010a0d16da3ad020e5352eb819b))
- make publish work with multi-vault assets ([31dbb7b](https://github.com/dendronhq/dendron/commit/31dbb7b6134fb24ddc1c46fce7e34267bb4de0bc))
- move command error when parent is stub ([d2d6fc8](https://github.com/dendronhq/dendron/commit/d2d6fc8681c06adde03f222ba209f4916ba544a1))
- update tree view after move cmd ([fdc1dce](https://github.com/dendronhq/dendron/commit/fdc1dcecc84603be3ad7d60ed66f2c10cd79ab01))

### Features Dendron

- add option to configure human readable ts formatting ([#479](https://github.com/dendronhq/dendron/issues/479)) ([2e1c22b](https://github.com/dendronhq/dendron/commit/2e1c22b7aa946a071daf2964ec76d0893ead6c8a))

# [0.29.0](https://github.com/dendronhq/dendron/compare/v0.28.5...v0.29.0) (2021-02-09)

**Note:** Version bump only for package root

## [0.28.5](https://github.com/dendronhq/dendron/compare/v0.28.4...v0.28.5) (2021-02-08)

**Note:** Version bump only for package root

## [0.28.4](https://github.com/dendronhq/dendron/compare/v0.28.3...v0.28.4) (2021-02-08)

**Note:** Version bump only for package root

## [0.28.3](https://github.com/dendronhq/dendron/compare/v0.28.2...v0.28.3) (2021-02-08)

**Note:** Version bump only for package root

## [0.28.2](https://github.com/dendronhq/dendron/compare/v0.28.2-alpha.2...v0.28.2) (2021-02-08)

### Bug Fixes

- add new vaults to .gitignore ([88dee05](https://github.com/dendronhq/dendron/commit/88dee054000ac15e5b4d479edf78569a5968e67f))

### Features Dendron

- add diagnostics report ([9e8dbef](https://github.com/dendronhq/dendron/commit/9e8dbef7092d7448fc824884d8fb0e9aefc0d083))

## [0.28.2-alpha.2](https://github.com/dendronhq/dendron/compare/v0.28.2-alpha.1...v0.28.2-alpha.2) (2021-02-04)

### Bug Fixes

- build-site shouldn't overwrite stage ([b202347](https://github.com/dendronhq/dendron/commit/b202347d6d7aa44964c7b0ae94b4ff7b32745ed3))

## [0.28.2-alpha.1](https://github.com/dendronhq/dendron/compare/v0.28.2-alpha.0...v0.28.2-alpha.1) (2021-02-02)

**Note:** Version bump only for package root

## [0.28.2-alpha.0](https://github.com/dendronhq/dendron/compare/v0.28.1...v0.28.2-alpha.0) (2021-02-02)

### Bug Fixes

- server close issue ([f6cc3f9](https://github.com/dendronhq/dendron/commit/f6cc3f9f5e4f6bc530be304eaed3020a3f629361))

## [0.28.1](https://github.com/dendronhq/dendron/compare/v0.28.1-alpha.0...v0.28.1) (2021-02-02)

**Note:** Version bump only for package root

## [0.28.1-alpha.0](https://github.com/dendronhq/dendron/compare/v0.29.0...v0.28.1-alpha.0) (2021-02-02)

### Bug Fixes

- site filter issues ([d38f4fc](https://github.com/dendronhq/dendron/commit/d38f4fc14e9b502946c7f0717f42cc816afa4aed))

### Reverts

- Revert "chore(release): publish" ([3b2778a](https://github.com/dendronhq/dendron/commit/3b2778a5b1ccc3c53652dcd02e6d42c38f925d2e))

# [0.28.0](https://github.com/dendronhq/dendron/compare/v0.27.1-alpha.0...v0.28.0) (2021-02-02)

### Bug Fixes

- aliased vault names would appear with wrong name ([873627e](https://github.com/dendronhq/dendron/commit/873627eabff6ea12631dbec29e16aab00ebd3b71))

## [0.27.1-alpha.0](https://github.com/dendronhq/dendron/compare/v0.26.2...v0.27.1-alpha.0) (2021-02-01)

### Bug Fixes

- issue with build-site closing prematurely ([faab22a](https://github.com/dendronhq/dendron/commit/faab22a768677201e75062110b7919bb53524dee))

# [0.27.0](https://github.com/dendronhq/dendron/compare/v0.26.2...v0.27.0) (2021-02-01)

**Note:** Version bump only for package root

## [0.26.2](https://github.com/dendronhq/dendron/compare/v0.26.2-alpha.1...v0.26.2) (2021-02-01)

**Note:** Version bump only for package root

## [0.26.2-alpha.1](https://github.com/dendronhq/dendron/compare/v0.26.2-alpha.0...v0.26.2-alpha.1) (2021-02-01)

### Bug Fixes

- create notes when hovering over images ([b2eabc0](https://github.com/dendronhq/dendron/commit/b2eabc0cc3d9fb71ec6652d4011642c82c0b95dc))
- daily journal note nice titles ([6cc036e](https://github.com/dendronhq/dendron/commit/6cc036edceeba6f3a4c985c7584aa492d36d24ba))
- move note command fixes ([ace1ab8](https://github.com/dendronhq/dendron/commit/ace1ab82ca7e457c7072f765dee7448785e92b0a))

## [0.26.2-alpha.0](https://github.com/dendronhq/dendron/compare/v0.26.1...v0.26.2-alpha.0) (2021-01-27)

### Bug Fixes

- remove parent stubs when deleting a note ([dd79174](https://github.com/dendronhq/dendron/commit/dd79174d9ed7b2c870e0f0ed41e9e7c44f3c3121))

### Enhancements

- add image to 403 page ([1038b13](https://github.com/dendronhq/dendron/commit/1038b135fddb38320fc260a40422081aba39e872))

### Features

- move note command ([696eb9c](https://github.com/dendronhq/dendron/commit/696eb9c90374a0115835a100a9f580498188eae7))

## [0.26.1](https://github.com/dendronhq/dendron/compare/v0.26.0...v0.26.1) (2021-01-25)

**Note:** Version bump only for package root

# [0.26.0](https://github.com/dendronhq/dendron/compare/v0.25.4...v0.26.0) (2021-01-25)

**Note:** Version bump only for package root

## [0.25.4](https://github.com/dendronhq/dendron/compare/v0.25.4-alpha.0...v0.25.4) (2021-01-25)

**Note:** Version bump only for package root

## [0.25.4-alpha.0](https://github.com/dendronhq/dendron/compare/v0.25.3...v0.25.4-alpha.0) (2021-01-25)

### Enhancements

- new landing page ([b624b7d](https://github.com/dendronhq/dendron/commit/b624b7ddd6140e2ba6aa994a673996d75dd71d50))

### Features

- add signup and signin ([0cab181](https://github.com/dendronhq/dendron/commit/0cab18136db64d6847a7dd8821ed526ffe39853d))

## [0.25.3](https://github.com/dendronhq/dendron/compare/v0.25.3-alpha.3...v0.25.3) (2021-01-22)

### Enhancements

- go to definition works for `![[refs]]` ([eae4209](https://github.com/dendronhq/dendron/commit/eae4209afd460dc89009e0789c32ae46ed362f08))

## [0.25.3-alpha.3](https://github.com/dendronhq/dendron/compare/v0.25.3-alpha.2...v0.25.3-alpha.3) (2021-01-22)

**Note:** Version bump only for package root

## [0.25.3-alpha.2](https://github.com/dendronhq/dendron/compare/v0.25.3-alpha.1...v0.25.3-alpha.2) (2021-01-22)

**Note:** Version bump only for package root

## [0.25.3-alpha.1](https://github.com/dendronhq/dendron/compare/v0.25.3-alpha.0...v0.25.3-alpha.1) (2021-01-22)

### Bug Fixes

- grammar on 403 page ([f76b6d8](https://github.com/dendronhq/dendron/commit/f76b6d86428a9f613cf125a86f6d47788c8d7202))

### Enhancements

- copy header text if selected ([23406d6](https://github.com/dendronhq/dendron/commit/23406d6d641ccc8db5140b0e6afaeb4c38244aee))
- support cross vault wiki links ([26ec4c4](https://github.com/dendronhq/dendron/commit/26ec4c41eb1da1ceb59409c764431931a0d54b97))

### Features

- support mermaid for publishing ([0313df4](https://github.com/dendronhq/dendron/commit/0313df49ed563d22fc07018c982368965f9d1938))

## [0.25.3-alpha.0](https://github.com/dendronhq/dendron/compare/v0.25.2...v0.25.3-alpha.0) (2021-01-20)

**Note:** Version bump only for package root

## [0.25.2](https://github.com/dendronhq/dendron/compare/v0.25.1...v0.25.2) (2021-01-19)

### Enhancements

- use multi-vault list to handle dups ([ee50aa5](https://github.com/dendronhq/dendron/commit/ee50aa5494f005be062a9ee40b0bfbdfe5b7607e))

## [0.25.1](https://github.com/dendronhq/dendron/compare/v0.25.1-alpha.0...v0.25.1) (2021-01-19)

**Note:** Version bump only for package root

## [0.25.1-alpha.0](https://github.com/dendronhq/dendron/compare/v0.25.0...v0.25.1-alpha.0) (2021-01-19)

**Note:** Version bump only for package root

# [0.25.0](https://github.com/dendronhq/dendron/compare/v0.24.2-alpha.1...v0.25.0) (2021-01-18)

**Note:** Version bump only for package root

## [0.24.2-alpha.1](https://github.com/dendronhq/dendron/compare/v0.24.2-alpha.0...v0.24.2-alpha.1) (2021-01-17)

### Enhancements

- update fmtitle default ([98d9b14](https://github.com/dendronhq/dendron/commit/98d9b14e0c6cd11680feae95bf7425a8aa702772))

### Features

- add dendron to regular md preview ([68dfdfc](https://github.com/dendronhq/dendron/commit/68dfdfc3d897210cfc05ff05de3b0137ee9de9d5))

## [0.24.2-alpha.0](https://github.com/dendronhq/dendron/compare/v0.24.1...v0.24.2-alpha.0) (2021-01-16)

### Enhancements

- show progress when install dependencies ([1c14380](https://github.com/dendronhq/dendron/commit/1c143805edc72130a0f36af03e43b6890282ccfa))
- switch to express for preview ([3cd1e75](https://github.com/dendronhq/dendron/commit/3cd1e75a03edd9e317897596927fa6e870d92eb9))

## [0.24.1](https://github.com/dendronhq/dendron/compare/v0.24.1-alpha.2...v0.24.1) (2021-01-15)

### Bug Fixes

- mult nodes and override titles ([cbd2991](https://github.com/dendronhq/dendron/commit/cbd2991d1e3c02e06c9e6fb7d6dc26ff7814186b))

## [0.24.1-alpha.2](https://github.com/dendronhq/dendron/compare/v0.24.1-alpha.1...v0.24.1-alpha.2) (2021-01-14)

**Note:** Version bump only for package root

## [0.24.1-alpha.1](https://github.com/dendronhq/dendron/compare/v0.24.1-alpha.0...v0.24.1-alpha.1) (2021-01-12)

### Bug Fixes

- issue with publishing from root ([b258cd1](https://github.com/dendronhq/dendron/commit/b258cd1c4b09d80c45d51a367cf6b9609480e016))

## [0.24.1-alpha.0](https://github.com/dendronhq/dendron/compare/v0.24.0...v0.24.1-alpha.0) (2021-01-12)

### Bug Fixes

- multi-vault publish have corret parent relationship when publishing ([4bd6845](https://github.com/dendronhq/dendron/commit/4bd68450567c2ab0d1c6a097016fe723218485b2))

### Enhancements

- add goog analytics ([1539e09](https://github.com/dendronhq/dendron/commit/1539e098acc4a6ea3e9e802bf904b26fbfaae172))

# [0.24.0](https://github.com/dendronhq/dendron/compare/v0.23.2-alpha.4...v0.24.0) (2021-01-11)

**Note:** Version bump only for package root

## [0.23.2-alpha.4](https://github.com/dendronhq/dendron/compare/v0.23.2-alpha.3...v0.23.2-alpha.4) (2021-01-10)

### Enhancements

- more flexible assetprefix tags ([ba0fd5e](https://github.com/dendronhq/dendron/commit/ba0fd5e464fd854bd61449ebeb0cc8e018e6deb0))

## [0.23.2-alpha.3](https://github.com/dendronhq/dendron/compare/v0.23.2-alpha.2...v0.23.2-alpha.3) (2021-01-10)

### Enhancements

- enable pass dict to publish ([ccbc017](https://github.com/dendronhq/dendron/commit/ccbc0178cdc0399230a47e4ab1c90d345e447aeb))
- use enhanced filter when creating 403 links ([65afe8c](https://github.com/dendronhq/dendron/commit/65afe8c084d1a657e943edb3ef1b497f3fd97ea6))

## [0.23.2-alpha.2](https://github.com/dendronhq/dendron/compare/v0.23.2-alpha.1...v0.23.2-alpha.2) (2021-01-09)

**Note:** Version bump only for package root

## [0.23.2-alpha.1](https://github.com/dendronhq/dendron/compare/v0.23.1...v0.23.2-alpha.1) (2021-01-09)

### Bug Fixes

- don't throw error if user doesn't choose vault ([c744bc1](https://github.com/dendronhq/dendron/commit/c744bc11429c309a3d045f14039f1548bfa53478))
- perfect match queries sometimes don't show results ([c05b33a](https://github.com/dendronhq/dendron/commit/c05b33ac9cc9ca82f6999d693c9a19ee53efc8dc))

### Enhancements

- better default journal note titles ([99e0a03](https://github.com/dendronhq/dendron/commit/99e0a033bd042f23fc28ebdc78d942d9d83a7aca))
- update access denied message ([3f9fe14](https://github.com/dendronhq/dendron/commit/3f9fe142f45ec3d42b3322dc5094a363c6c5499d))

## [0.23.2-alpha.0](https://github.com/dendronhq/dendron/compare/v0.23.1...v0.23.2-alpha.0) (2021-01-09)

### Bug Fixes

- don't throw error if user doesn't choose vault ([c744bc1](https://github.com/dendronhq/dendron/commit/c744bc11429c309a3d045f14039f1548bfa53478))
- perfect match queries sometimes don't show results ([c05b33a](https://github.com/dendronhq/dendron/commit/c05b33ac9cc9ca82f6999d693c9a19ee53efc8dc))

### Enhancements

- better default journal note titles ([99e0a03](https://github.com/dendronhq/dendron/commit/99e0a033bd042f23fc28ebdc78d942d9d83a7aca))
- update access denied message ([3f9fe14](https://github.com/dendronhq/dendron/commit/3f9fe142f45ec3d42b3322dc5094a363c6c5499d))

## [0.23.1](https://github.com/dendronhq/dendron/compare/v0.23.1-alpha.6...v0.23.1) (2021-01-08)

**Note:** Version bump only for package root

## [0.23.1-alpha.6](https://github.com/dendronhq/dendron/compare/v0.23.1-alpha.5...v0.23.1-alpha.6) (2021-01-07)

### Bug Fixes

- issue with noteRef mangling when using doctor ([5d9b711](https://github.com/dendronhq/dendron/commit/5d9b711d37ab7ac1688bd66908d82285a242edd9))
- remove debug line ([4ca3a1e](https://github.com/dendronhq/dendron/commit/4ca3a1efb9101c1fc7975dbdd43b0f6379f6b8b1))

### Enhancements

- support note ref based on inserted header ([78bd906](https://github.com/dendronhq/dendron/commit/78bd906243dbbae8fba4c9531542e660601f8224))
- use new style note ref ([f709ee5](https://github.com/dendronhq/dendron/commit/f709ee5db07c87df24c245f1cb81bfe3ca0a25e7))

## [0.23.1-alpha.5](https://github.com/dendronhq/dendron/compare/v0.23.1-alpha.4...v0.23.1-alpha.5) (2021-01-07)

### Enhancements

- add sitebuild command ([dccde03](https://github.com/dendronhq/dendron/commit/dccde0387f1438084ff8b6efa56796fc4791643a))
- betters ite build integrations ([30185a4](https://github.com/dendronhq/dendron/commit/30185a4fcd8a23dd52eae13cbc921de7d4365891))

### Features

- site preview command ([7bc838b](https://github.com/dendronhq/dendron/commit/7bc838bae885e6932752ea8335e9a76935377a69))

## [0.23.1-alpha.4](https://github.com/dendronhq/dendron/compare/v0.23.1-alpha.3...v0.23.1-alpha.4) (2021-01-06)

### Bug Fixes

- 403 followup ([91c2b46](https://github.com/dendronhq/dendron/commit/91c2b460c1fa642860bcd25cbb16506dee2ced3e))

## [0.23.1-alpha.3](https://github.com/dendronhq/dendron/compare/v0.23.1-alpha.2...v0.23.1-alpha.3) (2021-01-06)

### Bug Fixes

- spurious 403 links ([b13d2a5](https://github.com/dendronhq/dendron/commit/b13d2a527d8db50d5cbd09f7eacf652103f2f32c))

## [0.23.1-alpha.2](https://github.com/dendronhq/dendron/compare/v0.23.1-alpha.1...v0.23.1-alpha.2) (2021-01-06)

**Note:** Version bump only for package root

## [0.23.1-alpha.1](https://github.com/dendronhq/dendron/compare/v0.23.1-alpha.0...v0.23.1-alpha.1) (2021-01-06)

### Bug Fixes

- publish wiki links with spaces ([e41d6ca](https://github.com/dendronhq/dendron/commit/e41d6ca8423b9ceb1da05a9e9b3f9b55117890c0))

### Enhancements

- access denied on non-published links ([bff651f](https://github.com/dendronhq/dendron/commit/bff651fb018ba941a5277ec4af18dcf696ae0e32))

### Features

- support footnotes in markdown ([a86d067](https://github.com/dendronhq/dendron/commit/a86d067e925b7d3ce82e942e6a19bd335425f76c))
- support new note ref syntax ([2659d63](https://github.com/dendronhq/dendron/commit/2659d634e5bd147574054ff4c39f74d025cbccba))

## [0.23.1-alpha.0](https://github.com/dendronhq/dendron/compare/v0.23.0...v0.23.1-alpha.0) (2021-01-04)

### Enhancements

- ignore un-supported code blocks ([27cccca](https://github.com/dendronhq/dendron/commit/27cccca3a7c5df3a2ca1f0b123f9fb14f5f2de1a))

# [0.23.0](https://github.com/dendronhq/dendron/compare/v0.22.2-alpha.1...v0.23.0) (2021-01-04)

**Note:** Version bump only for package root

## [0.22.2-alpha.1](https://github.com/dendronhq/dendron/compare/v0.22.2-alpha.0...v0.22.2-alpha.1) (2021-01-03)

### Bug Fixes

- doctor exit after running ([7411362](https://github.com/dendronhq/dendron/commit/74113626a176bee54a94a226c5368b4d2c60a0b4))

### Enhancements

- add abbreviations back ([6c3b2b4](https://github.com/dendronhq/dendron/commit/6c3b2b4eec50850135799f5bc920705c8247f3ba))
- better titles ([774c826](https://github.com/dendronhq/dendron/commit/774c82660a3e6413953748c790bec202f401e22f))
- tweak fuzzyness results ([9dd55c9](https://github.com/dendronhq/dendron/commit/9dd55c960baa4eadf4b02df6b8b35eea7b47c0b0))

## [0.22.2-alpha.0](https://github.com/dendronhq/dendron/compare/v0.22.1...v0.22.2-alpha.0) (2021-01-02)

### Features

- variable support ([c56b826](https://github.com/dendronhq/dendron/commit/c56b8265da5ee6b85c5d7abf37a9154b6824ad6f))

## [0.22.1](https://github.com/dendronhq/dendron/compare/v0.22.1-alpha.5...v0.22.1) (2020-12-31)

### Enhancements

- skip children directive ([de136d7](https://github.com/dendronhq/dendron/commit/de136d7d1adc3a35aaf1a567e260cb3c9254125c))

## [0.22.1-alpha.5](https://github.com/dendronhq/dendron/compare/v0.22.1-alpha.4...v0.22.1-alpha.5) (2020-12-30)

**Note:** Version bump only for package root

## [0.22.1-alpha.4](https://github.com/dendronhq/dendron/compare/v0.22.1-alpha.3...v0.22.1-alpha.4) (2020-12-30)

### Enhancements

- add output override to build-site ([92ffc59](https://github.com/dendronhq/dendron/commit/92ffc599f17f53c96d38ea4ab3405503e5166013))

## [0.22.1-alpha.3](https://github.com/dendronhq/dendron/compare/v0.22.1-alpha.2...v0.22.1-alpha.3) (2020-12-30)

**Note:** Version bump only for package root

## [0.22.1-alpha.2](https://github.com/dendronhq/dendron/compare/v0.22.1-alpha.1...v0.22.1-alpha.2) (2020-12-30)

### Enhancements

- add github access token init ([6d14076](https://github.com/dendronhq/dendron/commit/6d14076b339bd086652ed9758ba230803647720c))

## [0.22.1-alpha.1](https://github.com/dendronhq/dendron/compare/v0.22.1-alpha.0...v0.22.1-alpha.1) (2020-12-29)

### Bug Fixes

- regression in build-site cli ([c7f9b38](https://github.com/dendronhq/dendron/commit/c7f9b38eb7443f198265176342b49a481cea188c))

## [0.22.1-alpha.0](https://github.com/dendronhq/dendron/compare/v0.22.0...v0.22.1-alpha.0) (2020-12-29)

### Enhancements

- add more site specific fm def ([51ef599](https://github.com/dendronhq/dendron/commit/51ef599d6fe00579a61993a3a33791773d4be91f))
- add prism highlighting ([5542a53](https://github.com/dendronhq/dendron/commit/5542a53a0cacdbd9c3f508b6da56d3582e98d319))
- build site work with existing workspace ([88740a2](https://github.com/dendronhq/dendron/commit/88740a258a1305a4088feb7bbe2c00a5c9db17a5))
- support dry-run doctor cmd ([9080bd0](https://github.com/dendronhq/dendron/commit/9080bd004785a1d68e7b04f29aa95f0a24130731))

# [0.22.0](https://github.com/dendronhq/dendron/compare/v0.21.1-alpha.14...v0.22.0) (2020-12-28)

**Note:** Version bump only for package root

## [0.21.1-alpha.14](https://github.com/dendronhq/dendron/compare/v0.21.1-alpha.13...v0.21.1-alpha.14) (2020-12-28)

### Enhancements

- support anchor headings ([576c50a](https://github.com/dendronhq/dendron/commit/576c50a5893256c0a850f385269e6ec7894332ac))

## [0.21.1-alpha.13](https://github.com/dendronhq/dendron/compare/v0.21.1-alpha.12...v0.21.1-alpha.13) (2020-12-28)

**Note:** Version bump only for package root

## [0.21.1-alpha.12](https://github.com/dendronhq/dendron/compare/v0.21.1-alpha.11...v0.21.1-alpha.12) (2020-12-28)

**Note:** Version bump only for package root

## [0.21.1-alpha.11](https://github.com/dendronhq/dendron/compare/v0.21.1-alpha.10...v0.21.1-alpha.11) (2020-12-28)

**Note:** Version bump only for package root

## [0.21.1-alpha.10](https://github.com/dendronhq/dendron/compare/v0.21.1-alpha.9...v0.21.1-alpha.10) (2020-12-27)

**Note:** Version bump only for package root

## [0.21.1-alpha.9](https://github.com/dendronhq/dendron/compare/v0.21.1-alpha.8...v0.21.1-alpha.9) (2020-12-27)

### Enhancements

- add useFMTitle ([b50c68c](https://github.com/dendronhq/dendron/commit/b50c68c59ccee6d8170d6d3826521993642e6911))
- auto title insertion ([21773c6](https://github.com/dendronhq/dendron/commit/21773c6133c91ec9d6f45bf733cb7ad21d5801b1))

## [0.21.1-alpha.8](https://github.com/dendronhq/dendron/compare/v0.21.1-alpha.7...v0.21.1-alpha.8) (2020-12-27)

### Enhancements

- better note refs ([3b4f442](https://github.com/dendronhq/dendron/commit/3b4f442d886442255a98b62049807e2c8f3bf80d))

## [0.21.1-alpha.7](https://github.com/dendronhq/dendron/compare/v0.21.1-alpha.6...v0.21.1-alpha.7) (2020-12-27)

### Enhancements

- enable wiki link with rehype ([d561279](https://github.com/dendronhq/dendron/commit/d5612798d75d1b5f587dd5f5835c8f1bb1693726))

## [0.21.1-alpha.6](https://github.com/dendronhq/dendron/compare/v0.21.1-alpha.5...v0.21.1-alpha.6) (2020-12-26)

**Note:** Version bump only for package root

## [0.21.1-alpha.5](https://github.com/dendronhq/dendron/compare/v0.21.1-alpha.4...v0.21.1-alpha.5) (2020-12-26)

### Bug Fixes

- note refs for remarkable rendering ([5a9ae3d](https://github.com/dendronhq/dendron/commit/5a9ae3ddf7b4de25890877609baf63378bbd5a97))
- relative links rendering in html ([a4b995c](https://github.com/dendronhq/dendron/commit/a4b995c33c81ce3b31aed9b46193306c4d3d4f98))

### Enhancements

- better highlight support ([605f46e](https://github.com/dendronhq/dendron/commit/605f46eb2bf59649fef285ff6120debe8972cf80))

## [0.21.1-alpha.4](https://github.com/dendronhq/dendron/compare/v0.21.1-alpha.3...v0.21.1-alpha.4) (2020-12-24)

### Bug Fixes

- early exit ([f007ce7](https://github.com/dendronhq/dendron/commit/f007ce774a7dd55f1626c810be3a4e438d4bd993))

## [0.21.1-alpha.3](https://github.com/dendronhq/dendron/compare/v0.21.1-alpha.2...v0.21.1-alpha.3) (2020-12-24)

### Bug Fixes

- resolve relative path ([710509d](https://github.com/dendronhq/dendron/commit/710509d893b595142c517881924e90a239798669))

### Enhancements

- add enginePort option ([03ded39](https://github.com/dendronhq/dendron/commit/03ded39c0aa782889b216e539373c0b18eae1420))

## [0.21.1-alpha.2](https://github.com/dendronhq/dendron/compare/v0.21.1-alpha.1...v0.21.1-alpha.2) (2020-12-24)

### Bug Fixes

- build-site not working in certain os ([279701d](https://github.com/dendronhq/dendron/commit/279701d00b658398ee22f5ce5b41be69b58255e4))

## [0.21.1-alpha.1](https://github.com/dendronhq/dendron/compare/v0.21.1-alpha.0...v0.21.1-alpha.1) (2020-12-23)

### Bug Fixes

- check for assets folder ([dabf54e](https://github.com/dendronhq/dendron/commit/dabf54e7bb60910e7ee4d75420915020fb56a9b9))

### Enhancements

- exist cli if not watching ([a337cd2](https://github.com/dendronhq/dendron/commit/a337cd26ec6bcbc3b77153aff28c3e518e1bfc02))

## [0.21.1-alpha.0](https://github.com/dendronhq/dendron/compare/v0.21.0...v0.21.1-alpha.0) (2020-12-22)

### Bug Fixes

- typecast when writing port ([b5def56](https://github.com/dendronhq/dendron/commit/b5def5687ac977232f89152c42b1e1f849cf2f7a))

# [0.21.0](https://github.com/dendronhq/dendron/compare/v0.20.1-alpha.15...v0.21.0) (2020-12-21)

**Note:** Version bump only for package root

## [0.20.1-alpha.15](https://github.com/dendronhq/dendron/compare/v0.20.1-alpha.14...v0.20.1-alpha.15) (2020-12-21)

**Note:** Version bump only for package root

## [0.20.1-alpha.14](https://github.com/dendronhq/dendron/compare/v0.20.1-alpha.13...v0.20.1-alpha.14) (2020-12-21)

### Bug Fixes

- handle single hiearchy properly ([3e822a6](https://github.com/dendronhq/dendron/commit/3e822a6d659c5f4da6bd3ddad9bf1d93a5c353e3))

## [0.20.1-alpha.13](https://github.com/dendronhq/dendron/compare/v0.20.1-alpha.12...v0.20.1-alpha.13) (2020-12-21)

### Enhancements

- enable assetPrefix option ([0ae1e23](https://github.com/dendronhq/dendron/commit/0ae1e237c8c89745b42661e88f91b2fdcba28f7e))

## [0.20.1-alpha.12](https://github.com/dendronhq/dendron/compare/v0.20.1-alpha.11...v0.20.1-alpha.12) (2020-12-21)

### Enhancements

- better publishing workflow ([7ebfbba](https://github.com/dendronhq/dendron/commit/7ebfbbadc82d5f707bebd9025c06271aa26eb3b4))
- pass server port when building ([61449ca](https://github.com/dendronhq/dendron/commit/61449cad6d74bd44444405b368f9c5aa2946aa62))

## [0.20.1-alpha.11](https://github.com/dendronhq/dendron/compare/v0.20.1-alpha.10...v0.20.1-alpha.11) (2020-12-20)

### Enhancements

- creating engine via cli also initializes meta files ([d72f097](https://github.com/dendronhq/dendron/commit/d72f097e63d1fda065ac7ad50f85bebe99d6da66))

## [0.20.1-alpha.10](https://github.com/dendronhq/dendron/compare/v0.20.1-alpha.9...v0.20.1-alpha.10) (2020-12-20)

### Bug Fixes

- refactor hiearchy miss self referential links ([00b385d](https://github.com/dendronhq/dendron/commit/00b385dd0d13e5809da012bbc88388886012b837))

## [0.20.1-alpha.9](https://github.com/dendronhq/dendron/compare/v0.20.1-alpha.8...v0.20.1-alpha.9) (2020-12-19)

**Note:** Version bump only for package root

## [0.20.1-alpha.8](https://github.com/dendronhq/dendron/compare/v0.20.1-alpha.7...v0.20.1-alpha.8) (2020-12-19)

**Note:** Version bump only for package root

## [0.20.1-alpha.7](https://github.com/dendronhq/dendron/compare/v0.20.1-alpha.6...v0.20.1-alpha.7) (2020-12-19)

### Enhancements

- remove github light theme ([33d5708](https://github.com/dendronhq/dendron/commit/33d57086510cdaefbb8af8f72c945d6f5e02be5c))

## [0.20.1-alpha.6](https://github.com/dendronhq/dendron/compare/v0.20.1-alpha.5...v0.20.1-alpha.6) (2020-12-19)

**Note:** Version bump only for package root

## [0.20.1-alpha.5](https://github.com/dendronhq/dendron/compare/v0.20.1-alpha.4...v0.20.1-alpha.5) (2020-12-19)

**Note:** Version bump only for package root

## [0.20.1-alpha.4](https://github.com/dendronhq/dendron/compare/v0.20.1-alpha.3...v0.20.1-alpha.4) (2020-12-17)

**Note:** Version bump only for package root

## [0.20.1-alpha.3](https://github.com/dendronhq/dendron/compare/v0.20.1-alpha.2...v0.20.1-alpha.3) (2020-12-17)

**Note:** Version bump only for package root

## [0.20.1-alpha.2](https://github.com/dendronhq/dendron/compare/v0.20.1-alpha.1...v0.20.1-alpha.2) (2020-12-17)

**Note:** Version bump only for package root

## [0.20.1-alpha.1](https://github.com/dendronhq/dendron/compare/v0.20.1-alpha.0...v0.20.1-alpha.1) (2020-12-17)

### Bug Fixes

- clean up log files ([16b6a99](https://github.com/dendronhq/dendron/commit/16b6a993b68362d45586e699a23c9d17d97fbf57))

## [0.20.1-alpha.0](https://github.com/dendronhq/dendron/compare/v0.20.0...v0.20.1-alpha.0) (2020-12-17)

### Enhancements

- handle note ref for published home page ([42245d9](https://github.com/dendronhq/dendron/commit/42245d9225a4119acdc2a2470f0f483dcc21ee0f))

# [0.20.0](https://github.com/dendronhq/dendron/compare/v0.19.3-alpha.2...v0.20.0) (2020-12-14)

**Note:** Version bump only for package root

## [0.19.3-alpha.2](https://github.com/dendronhq/dendron/compare/v0.19.3-alpha.1...v0.19.3-alpha.2) (2020-12-14)

### Bug Fixes

- vault not being matched ([fda8d72](https://github.com/dendronhq/dendron/commit/fda8d724f4146cdadd90f2bb44c9a37a8a4d1ecd))

### Enhancements

- better tree view perf ([bbc5860](https://github.com/dendronhq/dendron/commit/bbc5860e94cad6062a1da044cdc3bdc600ff29f0))
- faster tree view ([a1fac4f](https://github.com/dendronhq/dendron/commit/a1fac4fd3cf4bffc7f6181d79b23db92af8fa9a0))

## [0.19.3-alpha.1](https://github.com/dendronhq/dendron/compare/v0.19.3-alpha.0...v0.19.3-alpha.1) (2020-12-13)

### Bug Fixes

- add name to remote vaults ([6da3973](https://github.com/dendronhq/dendron/commit/6da39730f735f4700479f002f57d2a7802398ff5))
- doctor doesn't create stubs ([e812f34](https://github.com/dendronhq/dendron/commit/e812f34246d88b007fb45ca03443a74ac27a5e62))
- help command ([02fc08a](https://github.com/dendronhq/dendron/commit/02fc08a907e196b39c23db36b82565c15588673f))
- nested git repos not showing up in source control view ([37adc5e](https://github.com/dendronhq/dendron/commit/37adc5e528e0b9fa6c86105b39ebb40384023da4))
- tree view stub ([ea0e17e](https://github.com/dendronhq/dendron/commit/ea0e17e7ec8afed44cee1fd0fe442ba4c2064f92))

## [0.19.3-alpha.0](https://github.com/dendronhq/dendron/compare/v0.19.2...v0.19.3-alpha.0) (2020-12-10)

**Note:** Version bump only for package root

## [0.19.2](https://github.com/dendronhq/dendron/compare/v0.19.2-alpha.2...v0.19.2) (2020-12-10)

**Note:** Version bump only for package root

## [0.19.2-alpha.2](https://github.com/dendronhq/dendron/compare/v0.19.2-alpha.1...v0.19.2-alpha.2) (2020-12-10)

### Enhancements

- choose vault when creating new note ([18fbbbf](https://github.com/dendronhq/dendron/commit/18fbbbf2c47e1ba1cafc6f373cb9bc922883e783))

## [0.19.2-alpha.1](https://github.com/dendronhq/dendron/compare/v0.19.2-alpha.0...v0.19.2-alpha.1) (2020-12-10)

### Enhancements

- add remote vault to gitignore if exist ([1c252db](https://github.com/dendronhq/dendron/commit/1c252db60c0ea69be8dd10c1768c2dd302711e13))
- initialize remote vaults on startup ([1919fe4](https://github.com/dendronhq/dendron/commit/1919fe4e6d853d1f6ef63564ebbcc9af1e11a41a))
- write remote url to dendron config ([2a285ea](https://github.com/dendronhq/dendron/commit/2a285eacaeef8224d2a3530dc991b4977443c039))

## [0.19.2-alpha.0](https://github.com/dendronhq/dendron/compare/v0.19.1...v0.19.2-alpha.0) (2020-12-09)

### Bug Fixes

- completion on schema suggestions ([223d6a5](https://github.com/dendronhq/dendron/commit/223d6a501bd9e51331d28e21d77408b7ca3fba50))

### Enhancements

- add aws as a remote preset ([818bc05](https://github.com/dendronhq/dendron/commit/818bc0510e3b3b99057ef7cda8d9c61be2b6ebc6))
- nicer refactor formatting ([0e7749a](https://github.com/dendronhq/dendron/commit/0e7749a175a0ce80903cde5c9773649779100a9c))
- preset remote vaults ([c7ba3a4](https://github.com/dendronhq/dendron/commit/c7ba3a4c7e82628676cea4702635acfca7cd91e7))
- support refactor for multi-vault ([e370811](https://github.com/dendronhq/dendron/commit/e37081174e56662c5cd29c95344c07433b7155e3))
- upgrade seed interface ([86a3b13](https://github.com/dendronhq/dendron/commit/86a3b131f4dd2dae6269497dae482769d640c7db))

## [0.19.1](https://github.com/dendronhq/dendron/compare/v0.19.0...v0.19.1) (2020-12-07)

**Note:** Version bump only for package root

# [0.19.0](https://github.com/dendronhq/dendron/compare/v0.18.2-alpha.8...v0.19.0) (2020-12-07)

**Note:** Version bump only for package root

## [0.18.2-alpha.8](https://github.com/dendronhq/dendron/compare/v0.18.2-alpha.7...v0.18.2-alpha.8) (2020-12-07)

### Bug Fixes

- tree view adding new nodes in wrong place ([173f57b](https://github.com/dendronhq/dendron/commit/173f57bfb2730da2361950df35054a53f0aba765))

## [0.18.2-alpha.7](https://github.com/dendronhq/dendron/compare/v0.18.2-alpha.6...v0.18.2-alpha.7) (2020-12-07)

### Bug Fixes

- issue with local vault command ([fb202e9](https://github.com/dendronhq/dendron/commit/fb202e91e501cfd5506fd73c9a005807954e48d3))

## [0.18.2-alpha.6](https://github.com/dendronhq/dendron/compare/v0.18.2-alpha.5...v0.18.2-alpha.6) (2020-12-07)

**Note:** Version bump only for package root

## [0.18.2-alpha.5](https://github.com/dendronhq/dendron/compare/v0.18.2-alpha.4...v0.18.2-alpha.5) (2020-12-07)

### Enhancements

- support image hover ([8fee313](https://github.com/dendronhq/dendron/commit/8fee313785dfc4ac2564f74911a4b51879be0673))

## [0.18.2-alpha.4](https://github.com/dendronhq/dendron/compare/v0.18.2-alpha.3...v0.18.2-alpha.4) (2020-12-06)

**Note:** Version bump only for package root

## [0.18.2-alpha.3](https://github.com/dendronhq/dendron/compare/v0.18.2-alpha.2...v0.18.2-alpha.3) (2020-12-06)

### Bug Fixes

- doctor errors when backfilling +100 notes ([862e917](https://github.com/dendronhq/dendron/commit/862e9173e92a2e5d964273bb87c19e79177a6200))

### Enhancements

- support relative links in preview ([a485570](https://github.com/dendronhq/dendron/commit/a485570213d4e345e97306983211a7d5e200fb74))

## [0.18.2-alpha.2](https://github.com/dendronhq/dendron/compare/v0.18.2-alpha.1...v0.18.2-alpha.2) (2020-12-05)

### Bug Fixes

- errors with doctor ([35f10c1](https://github.com/dendronhq/dendron/commit/35f10c10b2271dd3f8f86c2cdc47ba1b8fc92e21))

### Enhancements

- nicer relative note titles ([cd40080](https://github.com/dendronhq/dendron/commit/cd400804d168883be6d12af90e98bc4db0b33f32))

## [0.18.2-alpha.1](https://github.com/dendronhq/dendron/compare/v0.18.2-alpha.0...v0.18.2-alpha.1) (2020-12-05)

### Bug Fixes

- issue with ref parsing ([b2dbdfc](https://github.com/dendronhq/dendron/commit/b2dbdfc9e49aa1fa74d5097500eeaddf05bf7ccc))

## [0.18.2-alpha.0](https://github.com/dendronhq/dendron/compare/v0.18.1...v0.18.2-alpha.0) (2020-12-04)

### Bug Fixes

- completion only fire for wiki links ([f49972e](https://github.com/dendronhq/dendron/commit/f49972ee436f9f637bd68729e702ba2169e68faf))

### Enhancements

- add hover for images ([a726f33](https://github.com/dendronhq/dendron/commit/a726f3322bab98ba33a0690f37e34e5d2e822f2a))
- better completion ([d9d4598](https://github.com/dendronhq/dendron/commit/d9d4598c1996fdb5eb24e4bda0e51e777b476f6e))

## [0.18.1](https://github.com/dendronhq/dendron/compare/v0.18.1-alpha.4...v0.18.1) (2020-12-04)

**Note:** Version bump only for package root

## [0.18.1-alpha.4](https://github.com/dendronhq/dendron/compare/v0.18.1-alpha.3...v0.18.1-alpha.4) (2020-12-04)

### Enhancements

- support pods for multi-vault ([661fe21](https://github.com/dendronhq/dendron/commit/661fe218d448e6f32f86bf60dabe635b71d67251))
- support private vaults ([98b4961](https://github.com/dendronhq/dendron/commit/98b4961d791b8a30c45e408fdf926838dfd5e431))

## [0.18.1-alpha.3](https://github.com/dendronhq/dendron/compare/v0.18.1-alpha.2...v0.18.1-alpha.3) (2020-12-03)

### Bug Fixes

- enable multi-vault for publishing ([0ebac81](https://github.com/dendronhq/dendron/commit/0ebac8191291f48ab42fbc30279e9615c96a5245))
- prefix generation for special notes in multi-vault ([5c04ccd](https://github.com/dendronhq/dendron/commit/5c04ccd666511abb79554b7a24c02efd46d93c3a))
- remove single-vault note references ([fd5a381](https://github.com/dendronhq/dendron/commit/fd5a381674384588850b07b193fc0bf609abc0fd))

## [0.18.1-alpha.2](https://github.com/dendronhq/dendron/compare/v0.18.1-alpha.1...v0.18.1-alpha.2) (2020-12-03)

### Bug Fixes

- getNoteByPath get wrong note ([03589f1](https://github.com/dendronhq/dendron/commit/03589f1eafeca3d5b9e919ab11897cc1bdc87415))
- ignore files added by engine ([f76b0ba](https://github.com/dendronhq/dendron/commit/f76b0bacf77186f1023aadb68a0f9e0cdfe74364))

## [0.18.1-alpha.1](https://github.com/dendronhq/dendron/compare/v0.18.1-alpha.0...v0.18.1-alpha.1) (2020-12-03)

### Enhancements

- faster lookup on large results ([3ddeba8](https://github.com/dendronhq/dendron/commit/3ddeba8a596be4bc9316e0cc5e63025d7bf4460f))
- support sibling nav for multi-vault ([235bfc7](https://github.com/dendronhq/dendron/commit/235bfc77505b403bf32c78ce3df6b7005c37dfba))

### Features

- support adding remote vaults ([d7501b9](https://github.com/dendronhq/dendron/commit/d7501b9a5cb116faae64d26798cfd7ccfc73a4b0))

## [0.18.1-alpha.0](https://github.com/dendronhq/dendron/compare/v0.18.0...v0.18.1-alpha.0) (2020-11-30)

**Note:** Version bump only for package root

# [0.18.0](https://github.com/dendronhq/dendron/compare/v0.17.2...v0.18.0) (2020-11-29)

**Note:** Version bump only for package root

## [0.17.2](https://github.com/dendronhq/dendron/compare/v0.17.2-alpha.5...v0.17.2) (2020-11-29)

**Note:** Version bump only for package root

## [0.17.2-alpha.5](https://github.com/dendronhq/dendron/compare/v0.17.2-alpha.4...v0.17.2-alpha.5) (2020-11-29)

### Enhancements

- update config commands ([44dce76](https://github.com/dendronhq/dendron/commit/44dce76b6fd447cd29a2f4f594632ef758eff927))

## [0.17.2-alpha.4](https://github.com/dendronhq/dendron/compare/v0.17.2-alpha.3...v0.17.2-alpha.4) (2020-11-29)

**Note:** Version bump only for package root

## [0.17.2-alpha.3](https://github.com/dendronhq/dendron/compare/v0.17.2-alpha.2...v0.17.2-alpha.3) (2020-11-29)

**Note:** Version bump only for package root

## [0.17.2-alpha.2](https://github.com/dendronhq/dendron/compare/v0.17.2-alpha.1...v0.17.2-alpha.2) (2020-11-29)

### Enhancements

- integrate ui with vscode ([2215c56](https://github.com/dendronhq/dendron/commit/2215c56b3a6f1ef07b609fece09e0148f05c12e9))

## [0.17.2-alpha.1](https://github.com/dendronhq/dendron/compare/v0.17.2-alpha.0...v0.17.2-alpha.1) (2020-11-29)

### Bug Fixes

- **cli:** maybe vaults relative to wsRoot ([a45a371](https://github.com/dendronhq/dendron/commit/a45a371c2bd9d95b56eb51a901118ea2e7f2604e))

### Enhancements

- update config api ([41fb2d9](https://github.com/dendronhq/dendron/commit/41fb2d9888bbf446bee65f39ee82ab0ec668dddb))
- update ui ([83ccc97](https://github.com/dendronhq/dendron/commit/83ccc9702a6c946832adf275e64ce1888fac1d64))

### Features

- add config apis ([f022689](https://github.com/dendronhq/dendron/commit/f0226890ff01c4e5c1746d0cee7b9e99db07d4d6))

## [0.17.2-alpha.0](https://github.com/dendronhq/dendron/compare/v0.17.1-alpha.1...v0.17.2-alpha.0) (2020-11-28)

### Bug Fixes

- issues with rename in multi-vault ([e26b294](https://github.com/dendronhq/dendron/commit/e26b294e8bbe1e49e44318152c247595e82639bb))
- renaming notes with links within root note ([cb74117](https://github.com/dendronhq/dendron/commit/cb74117ae3fd3d1658e94966a4050c15cf491885))

### Enhancements

- enable rename with multivault ([50304da](https://github.com/dendronhq/dendron/commit/50304da8b419ad1ff3e8380e2c2d57e4fa8694b3))

## [0.17.1](https://github.com/dendronhq/dendron/compare/v0.17.1-alpha.1...v0.17.1) (2020-11-26)

**Note:** Version bump only for package root

## [0.17.1-alpha.1](https://github.com/dendronhq/dendron/compare/v0.17.1-alpha.0...v0.17.1-alpha.1) (2020-11-26)

### Bug Fixes

- copy header will chop of last character ([34c2530](https://github.com/dendronhq/dendron/commit/34c253036cf959ef00620db9063c8de36ae9c848))
- relative links sometimes don't resolve ([c1ffa54](https://github.com/dendronhq/dendron/commit/c1ffa54ab780bec98cb5b322b4d0905cc26acce7))

## [0.17.1-alpha.0](https://github.com/dendronhq/dendron/compare/v0.17.0...v0.17.1-alpha.0) (2020-11-25)

### Bug Fixes

- hover provider ([9c55a2f](https://github.com/dendronhq/dendron/commit/9c55a2fd91ae25455d3b232a3ed0bdb274b8f973))

### Features

- add hover provider ([8d19a1b](https://github.com/dendronhq/dendron/commit/8d19a1b47f114ae738f7483fd751b62f68b46d24))

# [0.17.0](https://github.com/dendronhq/dendron/compare/v0.16.3-alpha.5...v0.17.0) (2020-11-22)

**Note:** Version bump only for package root

## [0.16.3-alpha.5](https://github.com/dendronhq/dendron/compare/v0.16.3-alpha.4...v0.16.3-alpha.5) (2020-11-22)

### Enhancements

- **workbench:** auto-update workspace settings ([fec9cf3](https://github.com/dendronhq/dendron/commit/fec9cf315f0b508d5b185788deff1b889d4904ec))

## [0.16.3-alpha.4](https://github.com/dendronhq/dendron/compare/v0.16.3-alpha.3...v0.16.3-alpha.4) (2020-11-22)

### Bug Fixes

- enable preview when goto def ([afe71c4](https://github.com/dendronhq/dendron/commit/afe71c41daff3acc935cb5bed7b51d20ef8e6267))
- initialize dendron when no ws present ([c1aabb4](https://github.com/dendronhq/dendron/commit/c1aabb4a6b2084990269ea169c1a90d800b430c3))
- vault add cancel if no input ([86baed6](https://github.com/dendronhq/dendron/commit/86baed6e0938132709e4cfbd2008f1f8fadc77cb))
- **pods:** publishing markdown in multi-vault ([cc50327](https://github.com/dendronhq/dendron/commit/cc503276a0ca0545e2793449f7382bc810216377))
- add note to correct parent when writing in multi-vault ([6daeebc](https://github.com/dendronhq/dendron/commit/6daeebc7bd2bbc68fc105766d30bc10444bcaf61))

### Enhancements

- better completion ([e7489b3](https://github.com/dendronhq/dendron/commit/e7489b324fb8b5b1a0cb3daf4bd33978073bd90a))
- remove opinionated presets ([6b6bd8d](https://github.com/dendronhq/dendron/commit/6b6bd8d1b866bfe881b8ed7c341e5f2191bfa741))
- support relative links in publishing ([d7d612d](https://github.com/dendronhq/dendron/commit/d7d612d00bf0fedfc5e7dc9beda1e00927be83a9))
- **notes:** change fm title on rename ([32c77a1](https://github.com/dendronhq/dendron/commit/32c77a1a97162150b88c97c9266bd2a42a816aa0))

## [0.16.3-alpha.2](https://github.com/dendronhq/dendron/compare/v0.16.3-alpha.1...v0.16.3-alpha.2) (2020-11-18)

### Enhancements

- support copy relative header link ([2f4c965](https://github.com/dendronhq/dendron/commit/2f4c96528e696aa8b1171d1d561d73bfa68fcb50))

## [0.16.3-alpha.1](https://github.com/dendronhq/dendron/compare/v0.16.3-alpha.0...v0.16.3-alpha.1) (2020-11-18)

### Enhancements

- support alias links ([bb56e72](https://github.com/dendronhq/dendron/commit/bb56e7217c23e486f2402deffe9398cfa8edee2f))
- support creating same note in multiple vaults ([64fe9d0](https://github.com/dendronhq/dendron/commit/64fe9d0081c90ca0d30fc58e69310b74172ba849))

## [0.16.3-alpha.0](https://github.com/dendronhq/dendron/compare/v0.16.2...v0.16.3-alpha.0) (2020-11-18)

**Note:** Version bump only for package root

## [0.16.2](https://github.com/dendronhq/dendron/compare/v0.16.1...v0.16.2) (2020-11-18)

**Note:** Version bump only for package root

## [0.16.1](https://github.com/dendronhq/dendron/compare/v0.16.1-alpha.2...v0.16.1) (2020-11-18)

**Note:** Version bump only for package root

## [0.16.1-alpha.2](https://github.com/dendronhq/dendron/compare/v0.16.1-alpha.1...v0.16.1-alpha.2) (2020-11-18)

### Bug Fixes

- missing init note ([4e41724](https://github.com/dendronhq/dendron/commit/4e41724a52ec5e32cbf6a290763eeaef7cbd50aa))
- **engine:** resolve ntoes with same title in multiple vaults ([6326aff](https://github.com/dendronhq/dendron/commit/6326aff28b5f2ff52edf6d190c068364023be8e9))

### Enhancements

- support alias completion ([34268c1](https://github.com/dendronhq/dendron/commit/34268c18b28214fffb98a702c4fc74ef59cc76d5))
- **md:** go to link via slug ([a0f9556](https://github.com/dendronhq/dendron/commit/a0f9556e49c34f83288f87dd7423ebb8e4dbf43f))
- in house link provider ([3c54022](https://github.com/dendronhq/dendron/commit/3c54022724d78d8019a25e60a489e585e7af8209))
- update label parsing ([b0fadac](https://github.com/dendronhq/dendron/commit/b0fadac6e4dd32227225c589ffa87605fb7c3b99))

### Features

- add backlinks provider ([aee483c](https://github.com/dendronhq/dendron/commit/aee483c92fd628ffdcb8250bc812cc2efae8a247))
- add completion provider ([9c5ab61](https://github.com/dendronhq/dendron/commit/9c5ab61213a046b7719472faca9bb5e79592fa2f))
- **workbench:** navigate to relative wiki-links ([49c3b54](https://github.com/dendronhq/dendron/commit/49c3b5439fb34b8c6f1f5505fcd90193cbfa28cd))
- add hover provider ([8b55251](https://github.com/dendronhq/dendron/commit/8b552517c27bf6ded5515e9c0a7912e788420827))
- add language features ([9c379c1](https://github.com/dendronhq/dendron/commit/9c379c1fb7beda476a8454538a318f43072ad1f0))

## [0.16.1-alpha.1](https://github.com/dendronhq/dendron/compare/v0.16.1-alpha.0...v0.16.1-alpha.1) (2020-11-16)

**Note:** Version bump only for package root

## [0.16.1-alpha.0](https://github.com/dendronhq/dendron/compare/v0.16.0...v0.16.1-alpha.0) (2020-11-16)

**Note:** Version bump only for package root

# [0.16.0](https://github.com/dendronhq/dendron/compare/v0.15.3-alpha.5...v0.16.0) (2020-11-15)

**Note:** Version bump only for package root

## [0.15.3-alpha.5](https://github.com/dendronhq/dendron/compare/v0.15.3-alpha.4...v0.15.3-alpha.5) (2020-11-15)

### Enhancements

- **lookup:** better debouncing ([c943a73](https://github.com/dendronhq/dendron/commit/c943a73cb45ab7267148e989c29be759ec47479b))

## [0.15.3-alpha.4](https://github.com/dendronhq/dendron/compare/v0.15.3-alpha.3...v0.15.3-alpha.4) (2020-11-15)

### Bug Fixes

- make tests better ([bfb07d7](https://github.com/dendronhq/dendron/commit/bfb07d721f88553004206121f45d99a86dd35a7c))
- **lookup:** proprely debounce lookup ([4ee86dd](https://github.com/dendronhq/dendron/commit/4ee86dd26db21025fadb4f936fc286550983753a))

## [0.15.3-alpha.3](https://github.com/dendronhq/dendron/compare/v0.15.3-alpha.2...v0.15.3-alpha.3) (2020-11-15)

### Bug Fixes

- don't throw error on no document ([c31c611](https://github.com/dendronhq/dendron/commit/c31c611d975b8eeee4f63abec742edf88dac66ac))
- overwrite old log files ([3f1362c](https://github.com/dendronhq/dendron/commit/3f1362c224ff7dae5de721dd2f2c8cba22db4d84))
- sync issues btw server and client nodes ([a446aba](https://github.com/dendronhq/dendron/commit/a446aba9d931d7732553e1ecb43302208d6f798a))

### Enhancements

- update getting started ([af5dde9](https://github.com/dendronhq/dendron/commit/af5dde91d153ce46089c8688caec0e583eddb939))
- better logging ([2d7fd78](https://github.com/dendronhq/dendron/commit/2d7fd780d3c548a362dcf01a2620409b1bcdff3e))
- better logging on lookup ([3d09986](https://github.com/dendronhq/dendron/commit/3d09986f1270b70849f7c0dbc67c2c4cc5fdba58))
- nicer error messages ([e1e87a1](https://github.com/dendronhq/dendron/commit/e1e87a16186b1e8b8aae6f77fe8a2c5c865c4071))
- **lookup:** better lookup performance ([f14eed8](https://github.com/dendronhq/dendron/commit/f14eed8da822eb75f130edb7364a1f9f0c2fe354))
- **lookup:** intelligently debounce queries ([2f0ac56](https://github.com/dendronhq/dendron/commit/2f0ac56bd6f64d0b99fcb82d6effa9f062d18fc2))

## [0.15.2](https://github.com/dendronhq/dendron/compare/v0.15.1...v0.15.2) (2020-11-14)

### Enhancements

- **engine:** delete for multi-vault ([83676dc](https://github.com/dendronhq/dendron/commit/83676dc3c5761b489ff44fd18364233ccb4310c8))
- **engine:** support tree view ([e283160](https://github.com/dendronhq/dendron/commit/e283160bfea1d8adee726497947abab1c6f2e0c7))
- **workbench:** reload after adding vault ([1230163](https://github.com/dendronhq/dendron/commit/1230163ba41e915395438821724bfbaaaa212e76))
- **engine:** add vault with existing files ([0c04294](https://github.com/dendronhq/dendron/commit/0c04294f17da741f7b96ed443b9972f4b33a5774))
- **engine:** remove relative vault ([437ba7f](https://github.com/dendronhq/dendron/commit/437ba7f1e68f8d145c430aaa24b272522275885a))
- **engine:** support adding relative vaults ([0ea4d92](https://github.com/dendronhq/dendron/commit/0ea4d922a5e45c5836a511f6219457abdc441f4d))

### Bug Fixes

- **engine:** init with empty config ([7beb90f](https://github.com/dendronhq/dendron/commit/7beb90fa243bc73563a3ce16b5305345f7348d9f))
- **engine:** rename fail in some cases ([de44f9f](https://github.com/dendronhq/dendron/commit/de44f9f4d38651d75433ae885fdc78bb762fb1f6))
- **notes:** fix issue when importing note that already exists ([a08a34a](https://github.com/dendronhq/dendron/commit/a08a34a0563bb4047bd9c7cfc5f2bf150873fdc8))

### Features

- **engine:** add remove vault cmd ([cd77cf2](https://github.com/dendronhq/dendron/commit/cd77cf2705a61c5631a2f229a069644e30ba966c))
- **workspace:** vault add command ([f2bba25](https://github.com/dendronhq/dendron/commit/f2bba254b4923c97fec6b5830bff3779c533447f))

## [0.15.1](https://github.com/dendronhq/dendron/compare/v0.15.1-alpha.7...v0.15.1) (2020-11-14)

### Features

- **workbench:** add configure command ([db51dc3](https://github.com/dendronhq/dendron/commit/db51dc35864d0c4434f70620ef0e88451c198fa4))

### Enhancements

- **refs:** wildcard refs get nice links ([98a1177](https://github.com/dendronhq/dendron/commit/98a117715a967492ab9d7b8749d964b07bde4055))

# [0.15.0](https://github.com/dendronhq/dendron/compare/v0.14.2-alpha.7...v0.15.0) (2020-11-09)

### Bug Fixes

- typo in daily journal note cmd ([5ec96ef](https://github.com/dendronhq/dendron/commit/5ec96efd9a006e5e5999f2704dfb3d1e97e60a5c))
- **engine:** properly handle \* in refs when refactoring ([704a14f](https://github.com/dendronhq/dendron/commit/704a14f17196e18cb5b26f5fc98ed9f8d492e16a))

### Enhancements

- **engine:** add sync method ([ec58d39](https://github.com/dendronhq/dendron/commit/ec58d395003640384b7764f4f8b483429cc1ece3))
- **workspace:** write server port in workspace ([6a0ff84](https://github.com/dendronhq/dendron/commit/6a0ff845ebbf010073b271123779fc3f56ac2821))

### Features

- **cli:** launch engine server using cli ([25eae3f](https://github.com/dendronhq/dendron/commit/25eae3fddd6a2d26dcf9e2f3e664b377c2cca978))
- **markdown:** wildcard links in note refs ([b8dea8f](https://github.com/dendronhq/dendron/commit/b8dea8f4441cfc01f5acc522ffa3a6402ff50572))
- **refs:** support wildcard links when publishing ([74079fa](https://github.com/dendronhq/dendron/commit/74079fa4ed9c08b1890852738df858f1f393bec6))

## [0.14.1](https://github.com/dendronhq/dendron/compare/v0.14.1-alpha.7...v0.14.1) (2020-11-05)

### Enhancements

- **lookup:** add multi-select as toggle ([d84c03e](https://github.com/dendronhq/dendron/commit/d84c03eeac38a01cc0261ee3436d66a734659992))

### Features

- **lookup:** copy note link cmd ([e38743d](https://github.com/dendronhq/dendron/commit/e38743ddbac8486f2ac778bd546a6373a15a4f6d))
- **lookup:** support multi-select ([b409c05](https://github.com/dendronhq/dendron/commit/b409c05d3b19797de714dbf10b6a4249758eae8a))

### Bug Fixes

- **pods:** don't re-initialize engine when using pods ([4687285](https://github.com/dendronhq/dendron/commit/4687285dabad761360b7108cc9d36f131c385e29))

# [0.14.0](https://github.com/dendronhq/dendron/compare/v0.13.6-alpha.2...v0.14.0) (2020-11-01)

### Bug Fixes

- **publishing:** use remark-abbr types from DT ([04be351](https://github.com/dendronhq/dendron/commit/04be351f79a0abf21cb1059fbb284630ab2688a6))

### Features

- **workbench:** add contribute command ([130a58a](https://github.com/dendronhq/dendron/commit/130a58a62cc40eb4178afac554f8f4ff30c93055))
- **workbench:** restore from snapshot cmd ([3af64b7](https://github.com/dendronhq/dendron/commit/3af64b701d47ed28818d7e6017c758f63be617f0))

## [0.13.5](https://github.com/dendronhq/dendron/compare/v0.13.4...v0.13.5) (2020-10-28)

### Bug Fixes

- **workbench:** tree view can delete notes with caps ([d37926d](https://github.com/dendronhq/dendron/commit/d37926d7f38d784f847a4c2a58fb75ba7c03b0e0))

## [0.13.4](https://github.com/dendronhq/dendron/compare/v0.13.4-alpha.1...v0.13.4) (2020-10-28)

**Note:** Version bump only for package root

## [0.13.4-alpha.1](https://github.com/dendronhq/dendron/compare/v0.13.4-alpha.0...v0.13.4-alpha.1) (2020-10-27)

**Note:** Version bump only for package root

## [0.13.4-alpha.0](https://github.com/dendronhq/dendron/compare/v0.13.3...v0.13.4-alpha.0) (2020-10-27)

### Bug Fixes

- **workbench:** read json config with comments ([1741553](https://github.com/dendronhq/dendron/commit/1741553695b1c7cced54bf04b26700076a38a19c))

### Enhancements

- **notes:** scratch notes will now auto-slug selection as title ([9964339](https://github.com/dendronhq/dendron/commit/9964339138bde18dc022fdd62ce9ba9d529cfa2b))
- **workbench:** graceful failure on bad schema ([4db5064](https://github.com/dendronhq/dendron/commit/4db5064e4eef61d9c95b9abe34f2dec41550bd9d))
- **workbench:** nicer error messages ([9e371e1](https://github.com/dendronhq/dendron/commit/9e371e132b565ae2abebaa2bf1307a5a03a91b9b))

### Features

- **server:** upgrade existing workspaces to server mode ([d19b6ec](https://github.com/dendronhq/dendron/commit/d19b6ecb97fb60d8706e14f0181795113b5e108b))

## [0.13.3](https://github.com/dendronhq/dendron/compare/v0.13.3-alpha.1...v0.13.3) (2020-10-24)

**Note:** Version bump only for package root

## [0.13.3-alpha.1](https://github.com/dendronhq/dendron/compare/v0.13.3-alpha.0...v0.13.3-alpha.1) (2020-10-24)

### Bug Fixes

- **comp:common-server:** don't throw error on missing log vars ([9d00e55](https://github.com/dendronhq/dendron/commit/9d00e55b2104efa7739ec94f0bb2793daa888450))
- **notes:** refactor will miss links in newly created notes ([c8a5dde](https://github.com/dendronhq/dendron/commit/c8a5dde2ca46e2402bc50b1a8f635d9fb5318c9d))
- **lookup:** don't update lookup unless note btn is pressed ([30140f7](https://github.com/dendronhq/dendron/commit/30140f7a16c6fb5ab81a9eae8af13f17575c78f3))

### Enhancements

- **lookup:** update filter btn icon ([b4af860](https://github.com/dendronhq/dendron/commit/b4af8608ce1c1f05e04f1b23e23d1fff833bf3d9))
- **publish:** be able to set config for all hiearchies ([a27d94a](https://github.com/dendronhq/dendron/commit/a27d94a3c469a4efaf2ee8c2bca40a8a471773f2))
- **schema:** add custom props from schema template ([5264544](https://github.com/dendronhq/dendron/commit/52645449b8e155e168baaac0fa4e99903efafcf0))
- **workbench:** reload index re-create root if not exist ([c66e242](https://github.com/dendronhq/dendron/commit/c66e242bac91c73404a5dd21ed3813c0dc2f022b))

### Features

- **lookup:** support direct child lookup ([1cae082](https://github.com/dendronhq/dendron/commit/1cae08294baa844c0c0ee3c8d390e337bd6172be))

## [0.13.2](https://github.com/dendronhq/dendron/compare/v0.13.2-alpha.2...v0.13.2) (2020-10-22)

**Note:** Version bump only for package root

## [0.13.2-alpha.2](https://github.com/dendronhq/dendron/compare/v0.13.2-alpha.1...v0.13.2-alpha.2) (2020-10-22)

**Note:** Version bump only for package root

## [0.13.2-alpha.1](https://github.com/dendronhq/dendron/compare/v0.13.2-alpha.0...v0.13.2-alpha.1) (2020-10-21)

**Note:** Version bump only for package root

## [0.13.2-alpha.0](https://github.com/dendronhq/dendron/compare/v0.13.1...v0.13.2-alpha.0) (2020-10-21)

### Bug Fixes

- **pods:** update placeholder text ([57a4af8](https://github.com/dendronhq/dendron/commit/57a4af8887404c21d07b45a3a565516bf73cc944))
- **refs:** render error when ref doesn't exist ([ba1be1a](https://github.com/dendronhq/dendron/commit/ba1be1a12c4a1742e93ab4058d0f132b320be539))

### Enhancements

- **pods:** enable json publish pod ([127dd7c](https://github.com/dendronhq/dendron/commit/127dd7c02a0081b027e06c40d6189904c5da0694))

### Features

- **pods:** add publish pod cmd ([8947a60](https://github.com/dendronhq/dendron/commit/8947a60cbc2e76f00d214a1913952c58db86f2f1))
- publish pod using cli ([553243f](https://github.com/dendronhq/dendron/commit/553243f7cf331a1b74a2e1ea20c65eff23f475a0))
- **publishing:** preserve abbreviations ([06d9191](https://github.com/dendronhq/dendron/commit/06d91912b34bc5f81b20fce77652366c501865ec))

## [0.13.1](https://github.com/dendronhq/dendron/compare/v0.13.1-alpha.2...v0.13.1) (2020-10-21)

**Note:** Version bump only for package root

## [0.13.1-alpha.2](https://github.com/dendronhq/dendron/compare/v0.13.1-alpha.1...v0.13.1-alpha.2) (2020-10-20)

### Bug Fixes

- **schemas:** show namespace schema suggestions ([30737c0](https://github.com/dendronhq/dendron/commit/30737c070cfcf6b5a7f9c2cc1f75a8760019614b))

## [0.13.1-alpha.1](https://github.com/dendronhq/dendron/compare/v0.13.1-alpha.0...v0.13.1-alpha.1) (2020-10-20)

### Features

- **publishing:** allow custom frontmatter ([782d637](https://github.com/dendronhq/dendron/commit/782d6374c55b00bcda36da9149fb2cedeac0c3d9))
- **publishing:** generate toc ([53ee270](https://github.com/dendronhq/dendron/commit/53ee270c89f530b9224f33a28dc811de7e5cb2ad))

## [0.13.1-alpha.0](https://github.com/dendronhq/dendron/compare/v0.13.0...v0.13.1-alpha.0) (2020-10-20)

### Bug Fixes

- **lookup:** schema suggestions on namespace ([56ee6c4](https://github.com/dendronhq/dendron/commit/56ee6c460dd562200931381923e72971681d1390))
- **seeds:** update replace merge strategy ([a02e08a](https://github.com/dendronhq/dendron/commit/a02e08a753c0603871a1ff76e6de78906a04b056))
- **workbench:** reload index will update tree view ([deadedc](https://github.com/dendronhq/dendron/commit/deadedc30358ee668806434196ddd45b74aff0cc))

### Enhancements

- **lookup:** add contrast btw note/schema lookup ([4faec8e](https://github.com/dendronhq/dendron/commit/4faec8e4548a80eb56469c46efadd608c26e0230))
- **publish:** use new md parser when publishing ([7f3789a](https://github.com/dendronhq/dendron/commit/7f3789a88a01465cca30efe3b3d261bf89a100df))

# [0.13.0](https://github.com/dendronhq/dendron/compare/v0.12.12-alpha.0...v0.13.0) (2020-10-19)

**Note:** Version bump only for package root
gg

## [0.12.12-alpha.0](https://github.com/dendronhq/dendron/compare/v0.12.11...v0.12.12-alpha.0) (2020-10-19)

### Bug Fixes

- **lookup:** display schema id if title undefined ([6c7cc70](https://github.com/dendronhq/dendron/commit/6c7cc70cf85181b11654074e17672e39a44fb874))

### Features

- **workbench:** set server mode as default ([19753ff](https://github.com/dendronhq/dendron/commit/19753ff2cbdf18977e23df33df41ca66334b8da9))

## [0.12.11](https://github.com/dendronhq/dendron/compare/v0.12.11-alpha.6...v0.12.11) (2020-10-18)

**Note:** Version bump only for package root

## [0.12.11-alpha.6](https://github.com/dendronhq/dendron/compare/v0.12.11-alpha.5...v0.12.11-alpha.6) (2020-10-18)

### Bug Fixes

- **workbench:** time decorator losing position after update ([41177be](https://github.com/dendronhq/dendron/commit/41177be2b094f9156e5bd365b4cf0608fe10d8ed))
- **server:** rename note doesn't preserve body in some cases ([656e730](https://github.com/dendronhq/dendron/commit/656e730c998772b009086a2edaaac7d2566efd92))

### Enhancements

- **cli:** stop putting verbose logs to stdout ([7ccc9e2](https://github.com/dendronhq/dendron/commit/7ccc9e2aa33420c6c048fbba14b824357f8a40c8))

### Features

- **markdown:** support recursive note ref in preview ([7efe0de](https://github.com/dendronhq/dendron/commit/7efe0de6328202b3f381d56aacdc9c1db6705047))

### Reverts

- Revert "chore: turn off workspace watcher" ([2953bf6](https://github.com/dendronhq/dendron/commit/2953bf6ac8ea4a97133e152fc2a57f005d5498de))

## [0.12.10](https://github.com/dendronhq/dendron/compare/v0.12.10-alpha.4...v0.12.10) (2020-10-16)

### Enhancements

- **server:** progress indicator on startup ([5795366](https://github.com/dendronhq/dendron/commit/579536671211c57fe8088145edf144bd8a40e940))
- **server:** add doctor command ([51726b4](https://github.com/dendronhq/dendron/commit/51726b41f4467e8eb70843164a0223d8984dcee4))
- **server:** apply schema templates in all cases ([2e7407a](https://github.com/dendronhq/dendron/commit/2e7407a05fad1356900582c431a1c9f9841f08a8))
- **server:** migrate archive command ([54c3cd7](https://github.com/dendronhq/dendron/commit/54c3cd7a0b91cf5c7200e34b326130603e5cd52e))
- **server:** better link parsing ([943a86c](https://github.com/dendronhq/dendron/commit/943a86cebd4aa0c9017f4f49124bb1b4039a327f))
- **server:** enable publishing ([9d3cc87](https://github.com/dendronhq/dendron/commit/9d3cc87d418f76eead047a26b9a47714a3fe5429))
- **server:** migrate refactor hierarchy cmd ([b39ab13](https://github.com/dendronhq/dendron/commit/b39ab131678cec43b8f74efdde5372e90e4c11ce))

### Bug Fixes

- **server:** rename note doesn't get edits after engine init ([fc97c18](https://github.com/dendronhq/dendron/commit/fc97c18c4a59f41b9ccd33e7f10a5af0b4271e86))

## [0.12.9](https://github.com/dendronhq/dendron/compare/v0.12.9-alpha.1...v0.12.9) (2020-10-15)

### Bug Fixes

- **server:** issue with goup navigation ([f3722dd](https://github.com/dendronhq/dendron/commit/f3722dd199d7aa4800f88ab5e8388a2a70b611cf))

### Enhancements

- **publishing:** add copyAssets option ([90c9c62](https://github.com/dendronhq/dendron/commit/90c9c6243f5e45868d423f4ef05adb16b4be8fac))
- **server:** read contents from disk when updating ts ([1bef413](https://github.com/dendronhq/dendron/commit/1bef413412bcacaf25bbb861cc03c2744b2a5575))

## [0.12.8](https://github.com/dendronhq/dendron/compare/v0.12.8-alpha.2...v0.12.8) (2020-10-14)

**Note:** Version bump only for package root

## [0.12.8-alpha.2](https://github.com/dendronhq/dendron/compare/v0.12.8-alpha.1...v0.12.8-alpha.2) (2020-10-14)

### Features

- **workbench:** track updated time in frontmatter ([ddc1867](https://github.com/dendronhq/dendron/commit/ddc186711ddd49fa2b9393cf58163b54aab56d9e))

## [0.12.8-alpha.1](https://github.com/dendronhq/dendron/compare/v0.12.8-alpha.0...v0.12.8-alpha.1) (2020-10-13)

**Note:** Version bump only for package root

## [0.12.8-alpha.0](https://github.com/dendronhq/dendron/compare/v0.12.7...v0.12.8-alpha.0) (2020-10-13)

### Bug Fixes

- **server:** create journal note if note exists ([7c0c741](https://github.com/dendronhq/dendron/commit/7c0c74153225527d7f01815cdb2df128dbc60dbd))

### Enhancements

- **server:** enable build pod cmd ([c27af60](https://github.com/dendronhq/dendron/commit/c27af6042e837c0b55335e63d71fd447ae7d3113))
- **server:** support build-site with new engine ([37e4ab0](https://github.com/dendronhq/dendron/commit/37e4ab0fc78a0d7df641545e46f6035866af9b91))

## [0.12.7](https://github.com/dendronhq/dendron/compare/v0.12.7-alpha.10...v0.12.7) (2020-10-13)

### Enhancements

- **server:** enable daily journal note ([ca02481](https://github.com/dendronhq/dendron/commit/ca024818585265c28192348b3098ffcb2405e426))
- **server:** support schema imports ([22d01e5](https://github.com/dendronhq/dendron/commit/22d01e5a8141eae5066155523b0369e5660e524c))
- better docs for config ([9f33c86](https://github.com/dendronhq/dendron/commit/9f33c867ca09c6310e40588c817f83243b86d4c1))
- **workbench:** better todo snippet ([51dd968](https://github.com/dendronhq/dendron/commit/51dd9681dca23d8362bbb65ff231d26c02c94870))

### Bug Fixes

- **server:** issue with journal notes ([4d0ba5c](https://github.com/dendronhq/dendron/commit/4d0ba5cfd80fea0247ac405ddb38549073e1cd56))
- **server:** update index after mutating notes ([9a71ae3](https://github.com/dendronhq/dendron/commit/9a71ae3852d9b58633ce47a37494a53a3a704561))
- **server:** issue with deleteing schemas ([2aab629](https://github.com/dendronhq/dendron/commit/2aab62961c4c2a6a073104034fc3961ed6cad2a5))

- **server:** schema imports ([a24ada0](https://github.com/dendronhq/dendron/commit/a24ada0b07adedcecd016836359fa9d5913f547a))
- **workbench:** show error message on bad initialization ([402a23f](https://github.com/dendronhq/dendron/commit/402a23fcd10a01e1d3f251015dd2302e054b065d))
- **workbench:** wait for snippets to be initialized before showing upgrade msg ([ea2ae09](https://github.com/dendronhq/dendron/commit/ea2ae09848f00c5e6406584ab2166d767a92d8b9))
- **workbench:** issue upgrading snippets with comments ([af05350](https://github.com/dendronhq/dendron/commit/af0535049f27ed7aa8e5f634e79678d9a163b870))
- **workbench:** treeview not initializing ([44acda2](https://github.com/dendronhq/dendron/commit/44acda22bf04bd5df9e132e3011697328d667850))
- **server:** schema stub not updated after creation ([045888a](https://github.com/dendronhq/dendron/commit/045888a527080626bd2da262278fd0774f490e65))

## [0.12.6](https://github.com/dendronhq/dendron/compare/v0.12.5...v0.12.6) (2020-10-07)

### Enhancements

- **publishing:** custom repo dir when publishing ([e0f5c0a](https://github.com/dendronhq/dendron/commit/e0f5c0a0e6f543b975a278127fb9213d03b5306f))
- **workbench:** upgrade dendron snippets ([26e7a90](https://github.com/dendronhq/dendron/commit/26e7a903de8d14e815caab515e7535f1873252c4))
- **workbench:** default snippets ([7e959a4](https://github.com/dendronhq/dendron/commit/7e959a432c03fcb953bfd8890369cd91f1242dcc))

### Bug Fixes

- **lookup:** schemas in lookup ([b4055fd](https://github.com/dendronhq/dendron/commit/b4055fd61d4918cf4c1a44591be31be69a71b93a))
- **server:** schema names ([c457f96](https://github.com/dendronhq/dendron/commit/c457f96cc02accd2811a73e15025f68d6796256d))

## 0.12.4

- All changelogs post 0.12.3 are now published on [Dendron](https://www.dendron.so/notes/9bc92432-a24c-492b-b831-4d5378c1692b.html)

## [0.12.3](https://github.com/dendronhq/dendron/compare/v0.12.3-alpha.16...v0.12.3) (2020-09-26)

### Feature

- **publishing:** generate bad links report ([2097d39](https://github.com/dendronhq/dendron/commit/2097d39))

When building your site by running `Dendron: Build Pod`, Dendron will generate a bad links report of all wiki-links that did not resolve. It will also update the links to point to a 404 page instead.

<a href="https://www.loom.com/share/91c4d7b023754b76b4d02519946603e0"> 
<img style="" src="https://cdn.loom.com/sessions/thumbnails/91c4d7b023754b76b4d02519946603e0-with-play.gif"> </a>

### Enhancements

- **lookup:** lookup command accept args ([3e1fe8a](https://github.com/dendronhq/dendron/commit/3e1fe8a33344c3e79c1fb5bd758eaeab23b7fb9f))
- **publishing:** better 404 page ([e74c4a2](https://github.com/dendronhq/dendron/commit/e74c4a2c97197f5d43132be6ac9436ac91d9db8a))
- **plugin:** dramatically reduce extension bundle size ([22cfff8](https://github.com/dendronhq/dendron/commit/22cfff8398611f54f7a88d7e110aa9f9f602ad4e))

### Work in Progress

- **lsp:** add log lvl config when using lsp ([b93b8fa](https://github.com/dendronhq/dendron/commit/b93b8fa32c65a91ad87bc6116f57b5a4c4f9a22c))
- **lsp:** enable experimental lsp mode
- **lsp:** setup lsp scaffolding

## [0.12.2](https://github.com/dendronhq/dendron/compare/v0.12.2-alpha.0...v0.12.2) (2020-09-24)

### Enhancements

- **refs:** support partial header selection ([6e35393](https://github.com/dendronhq/dendron/commit/6e35393fe2d321b8d708fe1efd40c1eb4ad304e3))

### Bug Fixes

- **publishing:** incremental builds not setting correct links ([e3dedf5](https://github.com/dendronhq/dendron/commit/e3dedf52d79dede98041edc77a41966cc5d6e8b5))

## [0.12.1](https://github.com/dendronhq/dendron/compare/v0.12.1-alpha.2...v0.12.1) (2020-09-22)

### Features

- **lookup:** create scratch or journal notes via lookup ([591c55f](https://github.com/dendronhq/dendron/commit/591c55f792ad8121d27af3a1c645ff9a2458f19c))

A journal note is a self contained note that is meant to track something over time. Examples of journals include recording **workout sessions**, making **meeting notes**, and keeping a **mood journal**.

To create a journal note, trigger a lookup and then click on the calendar icon.

<a href="https://www.loom.com/share/3c3ddc1dc63547cea8bf186bec31f71b"> 
<img style="" src="https://cdn.loom.com/sessions/thumbnails/3c3ddc1dc63547cea8bf186bec31f71b-with-play.gif"> </a>

A scratch note is a self contained note that is meant to be used as scratchpad. Use it for thoughts or when you want to expand on a bullet point. Scratch notes are created in the `scratch` domain and have the following format: `{domain}.journal.{Y-MM-DD-HHHHmmss}`.

<a href="https://www.loom.com/share/2fd3042119124df8bb4592d8ffe6d708"> 
<img style="" src="https://cdn.loom.com/sessions/thumbnails/2fd3042119124df8bb4592d8ffe6d708-with-play.gif"> </a>

- **lookup:** support selection modifiers when creating special notes ([591c55f](https://github.com/dendronhq/dendron/commit/591c55f792ad8121d27af3a1c645ff9a2458f19c))

### Enhancements

- **lookup:** support selection and note toggles ([70cf9eb](https://github.com/dendronhq/dendron/commit/70cf9ebc7a02cc5f256c2a1ffeec62f1bf1642b8))
- **refs:** better header selection ([ba9a4d9](https://github.com/dendronhq/dendron/commit/ba9a4d975b115e4cf8bc211f5e00f0557f26693b))
- **refs:** emit error when header not found ([5deb2d1](https://github.com/dendronhq/dendron/commit/5deb2d18160974bd035b3703715acc16d0dcb012))
- **publish:** configure repoDir via config ([fa838e4](https://github.com/dendronhq/dendron/commit/fa838e48bc5e33b8aa00d5aa954283c55af4d917))

# [0.12.0](https://github.com/dendronhq/dendron/compare/v0.11.9...v0.12.0) (2020-09-20)

### Bug Fixes

- **notes:** truncating url prefix ([3adf80c](https://github.com/dendronhq/dendron/commit/3adf80c6d94099db94f0a53ca9f993a1bc0301bc))

## [0.11.9](https://github.com/dendronhq/dendron/compare/v0.11.9-alpha.4...v0.11.9) (2020-09-20)

### Features

- **publishing:** support incremental page building ([3189590](https://github.com/dendronhq/dendron/commit/31895904e55953776f5e048c32e7dfbc9b579f1c)) ([docs](https:/dendron.so/notes/8b03ed06-4f46-46e0-8652-c6abf2266a79.html#buildsite))

* **publishing:** support automatic attributions of page via frontmatter ([docs](https:/dendron.so/notes/f9c646b1-34ab-4b18-8ec1-cabb8b2c7066.html#sources-sourc$$e))

### Enhancements

- **publishing:** specify publish repo ([7b3c1f0](https://github.com/dendronhq/dendron/commit/7b3c1f0076ca13e35ebaafcbbe6623c45b88d08c)) ([docs](https:/dendron.so/notes/8b03ed06-4f46-46e0-8652-c6abf2266a79.html#publishnotes))
- **publishing:** support relative path when specifying publishing targets ([af1c1b6](https://github.com/dendronhq/dendron/commit/af1c1b6f90aaeb3d967e10031be0fdab62d6ac89))
- **publishing:** be able to pass in custom args to publishing commands ([3a97d9a](https://github.com/dendronhq/dendron/commit/3a97d9a23d7616d62146e6e8c74c5d479cfdede4))

### Bug Fixes

- **publishing:** issue where citations without a name results in a blank url

## [0.11.5](https://github.com/dendronhq/dendron/compare/v0.11.5-alpha.8...v0.11.5) (2020-09-19)

### Features

- **publish:** publish command ([bef8a53](https://github.com/dendronhq/dendron/commit/bef8a53b1c32223ad1fc8dfbc2932fe7e523fb9d))

### Enhancements

- **cli:** use consistent interface for buildSite ([972fe73](https://github.com/dendronhq/dendron/commit/972fe73deb479a536a43fedf3114dfedf5ecc335))

## [0.11.4](https://github.com/dendronhq/dendron/compare/v0.11.4-alpha.1...v0.11.4) (2020-09-18)

### Features

- **lookup:** enhanced lookups

If you have text highlighted while creating a new note with a lookup, the new note will be created using the text selected. How the text will be used depends on the `dendron.defaultLookupCreateBehavior` setting.

- values:
  - selectionExtract (default): create new note with text from the old note. remove text from the old note
  - selection2link: create new empty note and turn selection into a link referencing the old note

<a href="https://www.loom.com/share/61d754c1dca84b99b2786b2f89473566">
<img style="" src="https://cdn.loom.com/sessions/thumbnails/61d754c1dca84b99b2786b2f89473566-with-play.gif"> </a>

### Enhancements

- **seeds:** better planting options ([c0a1dd4](https://github.com/dendronhq/dendron/commit/c0a1dd4b81418950091a8557583d322cf87a095f))

You know have more options when creating seeds from existing content. You will be able to read the soon to be coming API docs [here](https:/dendron.so/notes/08a917a9-31f1-434d-bc7f-71dce2b63a27.html)

## [0.11.3](https://github.com/dendronhq/dendron/compare/v0.11.3-alpha.5...v0.11.3) (2020-09-17)

### Dendron-CLI

#### Features

- support for seeds ([docs](https:/dendron.so/notes/4fdf54ac-599e-42e7-90a5-38964913a9a7.html))

> Note: Seeds are highly experimental and under active development. Content here is subject to change.

Seeds represent existing knowledge out in the world. A seed could be a wikipedia article, a github repo, or an arbitrary website.

You can use a **Dendron Seed** to ingest data from existing sources and import them into your vault. Data ingestion is also refereed to as **planting**.

Note that seeds differ from [[pods|dendron.topic.pod]] in that they help you ingest content from external sources from content that you might have no control over. Pods help you import/export your content between various platforms.

You can see an example of a published seeded vault [here](https://aws.dendron.so/).

## [0.11.2](https://github.com/dendronhq/dendron/compare/v0.11.2-alpha.0...v0.11.2) (2020-09-16)

### Enhancements

- **workbench:** lookup can extract highlighted text ([87effa2](https://github.com/dendronhq/dendron/commit/87effa26f134e1c7cd129e4d5b4f244977141fc5))

If you have text highlighted while creating a new note with a lookup, the new note will be created with the text from the old note. The highlighted text will also be removed from the original note.

<a href="https://www.loom.com/share/33b6ad44479c4902834b01db0feeee43"> <img style="" src="https://cdn.loom.com/sessions/thumbnails/33b6ad44479c4902834b01db0feeee43-with-play.gif"> </a>

## [0.11.1](https://github.com/dendronhq/dendron/compare/v0.11.1-alpha.3...v0.11.1) (2020-09-14)

### Features

- **pods:** json import pod ([5b1fd8d](https://github.com/dendronhq/dendron/commit/5b1fd8db5de4f25987ba6f388b3f557038377d76))

  Imports a JSON file as Dendron notes
  <a href="https://www.loom.com/share/375b64a6597346ec8e6be5ca35049194"> <img style="" src="https://cdn.loom.com/sessions/thumbnails/375b64a6597346ec8e6be5ca35049194-with-play.gif"> </a>

- **notes:** add copy note url command ([1e4142e](https://github.com/dendronhq/dendron/commit/1e4142e5ecbe41f8a542a454ea1b8db10e93fb7c))

  Get URL of current note from published site

  If you highlight a header, will copy the url with the header set as the anchor

  ![](https://foundation-prod-assetspublic53c57cce-8cpvgjldwysl.s3-us-west-2.amazonaws.com/assets/images/notes.copy-url.gif)

### Enhancements

- **publish:** keyboard shortcuts for copy note url cmd ([a579d7f](https://github.com/dendronhq/dendron/commit/a579d7f339b2eb1713178f4ad93beec822a0eba1))
- **pods:** work with relative file paths ([21ee4c5](https://github.com/dendronhq/dendron/commit/21ee4c585ab100d2f80436d01ef80afab67d3b09))
- **pods:** configure import and export pods ([363285f](https://github.com/dendronhq/dendron/commit/363285f4777a6c1525a4880d3e3bd7384da9d42f))
- **pods:** json pod import fnames as links ([8113594](https://github.com/dendronhq/dendron/commit/8113594c4def9f21f801439c435fe30e79b2b457))

### Bug Fixes

- **hiearchies:** rename when stub is present ([abd8ca5](https://github.com/dendronhq/dendron/commit/abd8ca586f3db50b1f482d8064a656787580ea4b))
- **pods:** handle stub notes correctly on import ([df22b59](https://github.com/dendronhq/dendron/commit/df22b595088a2e08be23ee0ad2e462317f0e9642))

# [0.11.0](https://github.com/dendronhq/dendron/compare/v0.10.7...v0.11.0) (2020-09-13)

Read the release notes [here](https://www.dendron.so/notes/50071eda-fc46-4aca-ba6c-9d53db00d068.html)

## [0.10.9-alpha.1](https://github.com/dendronhq/dendron/compare/v0.10.9-alpha.0...v0.10.9-alpha.1) (2020-09-13)

### Features

- **pods:** json import pod ([5b1fd8d](https://github.com/dendronhq/dendron/commit/5b1fd8db5de4f25987ba6f388b3f557038377d76))

## [0.10.9-alpha.0](https://github.com/dendronhq/dendron/compare/v0.10.8...v0.10.9-alpha.0) (2020-09-13)

### Bug Fixes

- **hiearchies:** rename when stub is present ([abd8ca5](https://github.com/dendronhq/dendron/commit/abd8ca586f3db50b1f482d8064a656787580ea4b))

## [0.10.8](https://github.com/dendronhq/dendron/compare/v0.10.7...v0.10.8) (2020-09-13)

### Enhancements

- **publish:** keyboard shortcuts for copy note url cmd ([a579d7f](https://github.com/dendronhq/dendron/commit/a579d7f339b2eb1713178f4ad93beec822a0eba1))

### Features

- add copy note url command ([1e4142e](https://github.com/dendronhq/dendron/commit/1e4142e5ecbe41f8a542a454ea1b8db10e93fb7c))

## [0.10.7](https://github.com/dendronhq/dendron/compare/v0.10.7-alpha.0...v0.10.7) (2020-09-13)

### Features

- **publishing:** use pretty refs when publishing ([72ea20c](https://github.com/dendronhq/dendron/commit/72ea20cae7209076e5f76d7bd5d0f0db88f7b112))

### Enhancements

- **publishing:** add config to toggle pretty refs when publishing ([4418316](https://github.com/dendronhq/dendron/commit/4418316f606c0e5b563d44da494f81d125d201b6))

## [0.10.6](https://github.com/dendronhq/dendron/compare/v0.10.6-alpha.8...v0.10.6) (2020-09-12)

### Features

- **note refs:** support pretty refs with outline

Note references are now outlined and have links going to the referred document. If you prefer to be sneaky, you can get the old stye refs back by setting the following option to false.

```
"markdown-preview-enhanced.renderRefWithOutline": true
```

![](https://foundation-prod-assetspublic53c57cce-8cpvgjldwysl.s3-us-west-2.amazonaws.com/assets/images/refs.block.gif)

- **publishing:** support noindex option (per page) (d582580)

To tell google to not index a page, you can set `noindex: true` to the frontmatter. You can also have this as a default for a given hierarchy by setting `noIndexByDefault: true` in the site config.

Setting `noindex: true` will add the following meta tag to your site.

```html
<meta name="robots" content="noindex, nofollow”>
```

### Enhancements

- **workbench:** friendlier default settings ([5719d88](https://github.com/dendronhq/dendron/commit/5719d8878c9904be8cbddf6082c15c6533ddde4f))

New workspaces will be initialized to autocomplete links automatically without any triggers. Special thanks to Ed for the contribution :)

![](https://foundation-prod-assetspublic53c57cce-8cpvgjldwysl.s3-us-west-2.amazonaws.com/assets/images/workbench.suggest.gif)

## 0.10.5 (2020-09-11)VV

### Enhancements

- **refs:** support wildcard refs ([7161363](https://github.com/dendronhq/dendron/commit/7161363897b069b11981caa51af914b7529d13e4))

When you're referencing a header by reference, sometimes you don't care what the next header is, just that the reference covers all text up to the next header. You can now specify this using the `*` symbol in a header reference.

For example, the following would reference the content from header1 to the next header.

```
((ref:[[demo.embed.block]]#head1:#*))
```

![](https://foundation-prod-assetspublic53c57cce-8cpvgjldwysl.s3-us-west-2.amazonaws.com/assets/images/refs.wildcard.gif)

- **refs:** more intelligent ref copying ([6f1906f](https://github.com/dendronhq/dendron/commit/6f1906f410e84bc9782af415c5fcefc6a18ddf7c))

If you have a header selected while running this command, it will copy the note ref with the selected header to the next note ref
![](https://foundation-prod-assetspublic53c57cce-8cpvgjldwysl.s3-us-west-2.amazonaws.com/assets/images/refs.copy-selection.gif)

- **pods:** use consistent interface for import/export ([6a824dd](https://github.com/dendronhq/dendron/commit/6a824dd3bcf0d202107d3044f9406949258507c7))

## [0.10.4](https://github.com/dendronhq/dendron/compare/v0.10.4-alpha.1...v0.10.4) (2020-09-10)

### Features

- **workbench:** add create snippet functionality ([e9b7fec](https://github.com/dendronhq/dendron/commit/e9b7fec0fd3b2c46b7f3c39f3613f61b3882aff1))

Create snippets from the highlighted selection

![](https://foundation-prod-assetspublic53c57cce-8cpvgjldwysl.s3-us-west-2.amazonaws.com/assets/images/snippet.create.gif)

- **workbench:** add goto snippet functionality ([e9b7fec](https://github.com/dendronhq/dendron/commit/e9b7fec0fd3b2c46b7f3c39f3613f61b3882aff1))

Goto existing snippet

![](https://foundation-prod-assetspublic53c57cce-8cpvgjldwysl.s3-us-west-2.amazonaws.com/assets/images/snippet.goto.gif)

### Bug Fixes

- **cli:** initialize pods on import using cli ([28c5fc4](https://github.com/dendronhq/dendron/commit/28c5fc4adff092bde108af9b9315ade91508fa09))

### Enhancements

- **cli:** make cli executable ([1ff6e64](https://github.com/dendronhq/dendron/commit/1ff6e646d8b459b68ee7dafe8922df4706712553))
- **cli:** import pod from cli ([bcfd9cc](https://github.com/dendronhq/dendron/commit/bcfd9cc0680324b6e98ca621c38380ba451b4860))
- **cli:** export pod from cli ([dd21f31](https://github.com/dendronhq/dendron/commit/dd21f31a7270b4449995caf28f5a5aa40a56e160))

## [0.10.3](https://github.com/dendronhq/dendron/compare/v0.10.3-alpha.2...v0.10.3) (2020-09-09)

### Features

- **pods:** Add configure pod command ([254ae08](https://github.com/dendronhq/dendron/commit/254ae08aceef4e1fecc80688c5f92c9bb03d3502))

![](https://foundation-prod-assetspublic53c57cce-8cpvgjldwysl.s3-us-west-2.amazonaws.com/assets/images/pods.configure.gif)

### Enhancements

- **pods:** additional options on export ([500a908](https://github.com/dendronhq/dendron/commit/500a90853121874dcff64a6300eb317efb58e8a4))
- **workbench:** add [code server support](https://github.com/cdr/code-server) ([e50fe3](https://github.com/dendronhq/dendron/commit/e50fe351c1486acdf5f36ef89db0209e19008120))

## [0.10.2](https://github.com/dendronhq/dendron/compare/v0.10.1...v0.10.2) (2020-09-08)

### Features

- **notes:** new note from selection cmd ([d2a917a](https://github.com/dendronhq/dendron/commit/d2a917a31c135b6222c3c3083ba1413298bb095d))

![](https://foundation-prod-assetspublic53c57cce-8cpvgjldwysl.s3-us-west-2.amazonaws.com/assets/images/notes.new-from-select.gif)

## [0.10.1](https://github.com/dendronhq/dendron/compare/v0.10.0...v0.10.1) (2020-09-07)

### Bug Fixes

- **pods:** deal with dots when importing directories ([5e45e1d](https://github.com/dendronhq/dendron/commit/5e45e1df132a1cfc234d1ce149ddfedcdee25d44))

# [0.10.0](https://github.com/dendronhq/dendron/compare/v0.9.7...v0.10.0) (2020-09-07)

See our release notes [here](https://www.dendron.so/notes/08b2e6ea-bd3e-4f4b-b2b9-676a7b743a65.html)

## [0.9.7](https://github.com/dendronhq/dendron/compare/v0.9.7-alpha.2...v0.9.7) (2020-09-06)

### Features

- **pods:** support note references when publishing notes ([dbd50d6](https://github.com/dendronhq/dendron/commit/dbd50d699703d64402918cc40f1a8d7f89e0a789))

<a href="https://www.loom.com/share/8eb01f6c3196415c8aadc4992805a176"> <img style="" src="https://cdn.loom.com/sessions/thumbnails/8eb01f6c3196415c8aadc4992805a176-with-play.gif"> </a>

- **markdown:** support note reference offsets ([645e90f](https://github.com/dendronhq/dendron/commit/645e90f))

A note reference offset is a way to skip a number of lines when using a note reference. The syntax is `,{number}`. Below is an example of using a note reference offset to offset an initial heading, skipping the actual header when doing the embeding.

- NOTE: currently, note reference offsets are limited to the first anchor inside a block reference. They must also be a positive value

```
((ref:[[demo.embed.block]]#head1,1))
```

<a href="https://www.loom.com/share/31cb62916586453f8475f94ba68b74a1"> <img style="" src="https://cdn.loom.com/sessions/thumbnails/31cb62916586453f8475f94ba68b74a1-with-play.gif"> </a>

## Dendron Markdown Preview

### Bug Fixes

- fix issue with preview checkbox not updating markdown
- fix issue with `\` causing in certain markdown blocks

## [0.9.6](https://github.com/dendronhq/dendron/compare/v0.9.6-alpha.0...v0.9.6) (2020-09-05)

### Features

- **pods:** Pod Exports ([ba22bbe](https://github.com/dendronhq/dendron/commitkkk/ba22bbe85d76f6665eeaf1e5deebb11f96132794))

Export notes to an external data source. Currently only JSON is supported.

<a href="https://www.loom.com/share/d49e5f4155af485cadc9cd810b6cab28"> <img src="https://cdn.loom.com/sessions/thumbnails/d49e5f4155af485cadc9cd810b6cab28-with-play.gif"> </a>

### Bug Fixes

- **engine:** bad sibling traversal in certain cases ([17a1a13](https://github.com/dendronhq/dendron/commit/17a1a13874df1fd763954bce622ebfda346c02a9))
- **workbench:** don't update color theme on upgrade ([266e46e](https://github.com/dendronhq/dendron/commit/266e46ec08fafa87df62dfb8ff4a3b8aa7bbd5b4))

## [0.9.5](https://github.com/dendronhq/dendron/compare/v0.9.5-alpha.0...v0.9.5) (2020-09-04)

### Features

- **workbench:** go to sibling command ([261fc0c](https://github.com/dendronhq/dendron/commit/261fc0cf85202651fde286ba79b81f09b6580a42))

![](https://foundation-prod-assetspublic53c57cce-8cpvgjldwysl.s3-us-west-2.amazonaws.com/assets/images/hierarchy.go-sibling.gif)

### Bug Fixes

- **engine:** trouble with mixed case file names ([02bcde2](https://github.com/dendronhq/dendron/commit/02bcde2d7f8e9c6bef9753e18fffd9e15c763976))

## [0.9.4](https://github.com/dendronhq/dendron/compare/v0.9.4-alpha.0...v0.9.4) (2020-09-0-4)

### Bug Fixes

- **pods:** use new ref parser when building site ([79b0a59](https://github.com/dendronhq/dendron/commit/79b0a597bed24f5f95d11977c1337ac25eae174f))

## [0.9.3](https://github.com/dendronhq/dendron/compare/v0.9.3-alpha.3...v0.9.3) (2020-09-03)

### Features

- **workbench:** add GoDown command ([bddc344](https://github.com/dendronhq/dendron/commit/bddc3442043918519d5dfb72b5ea4571b22568bf))
  ![](https://foundation-prod-assetspublic53c57cce-8cpvgjldwysl.s3-us-west-2.amazonaws.com/assets/images/hierarchy.go-down.gif)

### Bug Fixes

- **workbench:** upgrade settings sometimes override existing settings ([8cf9f24](https://github.com/dendronhq/dendron/commit/8cf9f2435a24f5e90ef8a0a259acc811f2e341b1))

### Enhancements

- **workbench:** don't focus tree view if not visible ([2628dd9](https://github.com/dendronhq/dendron/commit/2628dd9f0c667cc367a0545b393e08e31ad52025))

## [0.9.2](https://github.com/dendronhq/dendron/compare/v0.9.2-alpha.0...v0.9.2) (2020-09-02)

### Enhancements

- **workbench:** create note from tree view if not exist ([6c0ea7d](https://github.com/dendronhq/dendron/commit/6c0ea7d889530ff385aa5b249e12235b635c85cd))

![](https://foundation-prod-assetspublic53c57cce-8cpvgjldwysl.s3-us-west-2.amazonaws.com/assets/images/workbench.treeview.stub.gif)

### Dendron Markdown Preview

#### Enhancements

- note refs will not resolve when inside an inline code span or a fenced code block
- switch to use new markdown parser for resolving note refs

#### Bug Fixes

- edge case with note refs not resolving ([8e26da1](https://github.com/dendronhq/dendron/commit/8e26da119e48fc6dc5eccf724fc3cdff3d876fee))

## [0.9.1](https://github.com/dendronhq/dendron/compare/v0.9.1-alpha.0...v0.9.1) (2020-09-01)

### [Dendron Jekyll](http://dendron.so/notes/4c0ef322-3006-405c-9a66-3134dd9649a5.html)

#### Nav Based Hierarchy Hints

You can see at a glance which notes have children and explore them from the nav without refreshing the page.

![](https://foundation-prod-assetspublic53c57cce-8cpvgjldwysl.s3-us-west-2.amazonaws.com/assets/images/dendron.jekyll.gif)

#### Edit on Github

Every page can accept one-click contributions as long as the contributor has a github account.

![](https://foundation-prod-assetspublic53c57cce-8cpvgjldwysl.s3-us-west-2.amazonaws.com/assets/images/jekyll.edit.jpg)

Example of making a contribution to Dendron.

<a href="https://www.loom.com/share/4a1b67f3fd1a40dab16949e9ea5e53dc"> <img style="" src="https://cdn.loom.com/sessions/thumbnails/4a1b67f3fd1a40dab16949e9ea5e53dc-with-play.gif"> </a>

### Bug Fixes

- **workbench:** rename note will update tree view correctly ([c98de12](https://github.com/dendronhq/dendron/commit/c98de121406590015bbb395eaa05fbbc83c50ff9))
- **dev:** bad case in import statement ([c6ab92a](https://github.com/dendronhq/dendron/commit/c6ab92af9b27fa1535d98043af411172d105b728))

# [0.9.0](https://github.com/dendronhq/dendron/compare/v0.8.15-alpha.1...v0.9.0) (2020-08-30)

Read the [release notes](https://www.dendron.so/notes/1a79e2a1-c906-4ed4-a528-15bd34c4e649.html) for a sumary of all notable changes.

## 0.8.15 (2020-08-30)

### Bug Fixes

- **workbench:** clipboard fallback on windows ([de35c03](https://github.com/dendronhq/dendron/commit/de35c032cfa0ea66e37c2907cd819fdccc8f37ca))
- **workbench:** copy note link could sometimes fail ([9618488](https://github.com/dendronhq/dendron/commit/96184889092415f31e7ceea864ca4c9a68cc3877))

## [0.8.14](https://github.com/dendronhq/dendron/compare/v0.8.14-alpha.1...v0.8.14) (2020-08-30)

### Features

- **workspace:** Show cheatsheet of all commands ([e434a9d](https://github.com/dendronhq/dendron/commit/e434a9d7755880cd5a1de81045c4409b2e8e83b3))

![](https://foundation-prod-assetspublic53c57cce-8cpvgjldwysl.s3-us-west-2.amazonaws.com/assets/images/workbench.help.gif)

- **workbench:** tree view focus on active editor ([2e3a81d](https://github.com/dendronhq/dendron/commit/2e3a81dd24c3c3322aa8dc8aaa3fbdc4d58c103d))

![](https://foundation-prod-assetspublic53c57cce-8cpvgjldwysl.s3-us-west-2.amazonaws.com/assets/images/workbench.treeview-active-doc.gif)

### Enhancements

- **workbench:** show collapse all in tree view ([5a2469b](https://github.com/dendronhq/dendron/commit/5a2469bf6d4261fd0ff898a28b1683bf6aa1f9c8))
- **plugin:** don't ignore focus out ([c87af7b](https://github.com/dendronhq/dendron/commit/c87af7bb828a8fe532f37d00acddbba0ed3e1e08))

## [0.8.13](https://github.com/dendronhq/dendron/compare/v0.8.13-alpha.4...v0.8.13) (2020-08-29)

### Bug Fixes

- **plugin:** remove stub icons after creating note ([43eab44](https://github.com/dendronhq/dendron/commit/43eab44917b44aceaad04467234b3dc4738c5097))
- **engine:** more lookup edge case ([b5680dd](https://github.com/dendronhq/dendron/commit/b5680dd448a756a3b45ca457464d1fce704f1807))
- **engine:** edge case in lookup ([7d47119](https://github.com/dendronhq/dendron/commit/7d47119d7a66df69cfa0d925078d95af20e6ddd8))
- **engine:** invalid create new prompt ([0ce026d](https://github.com/dendronhq/dendron/commit/0ce026d882aa42d8884d7c4856912511c74a8bfb))

## [0.8.12](https://github.com/dendronhq/dendron/compare/v0.8.11...v0.8.12) (2020-08-28)

### Bug Fixes

- **engine:** [error when setting unquoted date in frontmatter](https://github.com/dendronhq/dendron/issues/137) ([6a7f0bb](https://github.com/dendronhq/dendron/commit/6a7f0bb22630cb364797d75bf4e1d7f2d8d08368))

## [0.8.11](https://github.com/dendronhq/dendron/compare/v0.8.11-alpha.3...v0.8.11) (2020-08-28)

### Features

- **workbench:** add dendron tree view ([73b0b82](https://github.com/dendronhq/dendron/commit/73b0b825586eca81360d92dd5e7f00239149b41e))([docs](http://dendron.so/notes/f7ebd4aa-8ba7-4bc5-bd00-a1efc5315f07.html#dendron-tree-view))

![](https://foundation-prod-assetspublic53c57cce-8cpvgjldwysl.s3-us-west-2.amazonaws.com/assets/images/workbench.treeview.gif)

### Enhancements

- **workbench:** refresh tree view on note deletion ([d3919f0](https://github.com/dendronhq/dendron/commit/d3919f0d53455d4a2a6a45d2390c5c63f8829bf8))
- **workbench:** treeview tooltip reflect note title ([ec1d43d](https://github.com/dendronhq/dendron/commit/ec1d43dda87f0017cb7f9f5ba57e3bc108f9fadd))
- **workbench:** add sort to tree view ([945976b](https://github.com/dendronhq/dendron/commit/945976ba1f00c2978a2a644cd5d9206bd55bae84))
- **workbench:** keyboard shortcuts don't require editor focus ([df5d7b4](https://github.com/dendronhq/dendron/commit/df5d7b43ee33f3a6e86d59a368faaedb026c2710))

## [0.8.10](https://github.com/dendronhq/dendron/compare/v0.8.9...v0.8.10) (2020-08-27)

### Bug Fixes

- **workbench:** misleading loading message ([485f7a8](https://github.com/dendronhq/dendron/commit/485f7a8a573bdfed1b782d58b2208f50bb3d1d82))

### Reverts

- Revert "enhance(workbench): loading indicator when workbench is first starting" ([d174cf4](https://github.com/dendronhq/dendron/commit/d174cf44872c6128eef42073ad37bb74c0b5d566))

## [0.8.9](https://github.com/dendronhq/dendron/compare/v0.8.9-alpha.3...v0.8.9) (2020-08-27)

### Enhancements

- **workbench:** update default theme ([0197495](https://github.com/dendronhq/dendron/commit/0197495a53cdf35c89a40711a2f131c08dbe902b))

We now use `Github Light Theme` by default

![](https://foundation-prod-assetspublic53c57cce-8cpvgjldwysl.s3-us-west-2.amazonaws.com/assets/images/graph-intro.gif)

- **workbench:** loading indicator when workbench is first starting ([0330dbe](https://github.com/dendronhq/dendron/commit/0330dbe35bcbb708ead1890351d971621ac9dc38))

- **workbench:** init first workbench with walkthrough ([3821e02](https://github.com/dendronhq/dendron/commit/3821e02f4818c3ab330763f8ca9f0b404e60c16d))

- **workbench:** show create new option in schema lookup ([4d61d85](https://github.com/dendronhq/dendron/commit/4d61d8562db4f72105818c70cbde83bedecacd83))
- **workbench:** better first workbench experience ([6d2413c](https://github.com/dendronhq/dendron/commit/6d2413c75587c755305a0e13fb4a64cf7a118d6f))
- **workbench:** bundle md preview with dendron ([5395301](https://github.com/dendronhq/dendron/commit/53953018e27903174708e08b70aea07638f399d7))
- **workbench:** new welcome screen on initial startup ([929c256](https://github.com/dendronhq/dendron/commit/929c2564b592a0094bc18fcae996cfea6c303236))

## [0.8.7](https://github.com/dendronhq/dendron/compare/v0.8.7-alpha.0...v0.8.7) (2020-08-26)

### Enhancements

- **workbench:** better lookup when at root ([b65ae46](https://github.com/dendronhq/dendron/commit/b65ae46fdb8299ddafd6ef9ebf5f96c0d7b04d77))

## [0.8.6](https://github.com/dendronhq/dendron/compare/v0.8.5...v0.8.6) (2020-08-26)

### Features

- **workbench:** lookup is MUCH FASTER!!! 🚀🚀🚀 ([38a3661](https://github.com/dendronhq/dendron/commit/38a366146ef7ce1b47fe06a4be46f7c0e5b41144))

## [0.8.5](https://github.com/dendronhq/dendron/compare/v0.8.5-alpha.1...v0.8.5) (2020-08-25)

### Bug Fixes

- **windows:** commands not working

## [0.8.4](https://github.com/dendronhq/dendron/compare/v0.8.2...v0.8.4) (2020-08-25)

### Bug Fixes

- **markdown:** preview command disabled ([0c7effb](https://github.com/dendronhq/dendron/commit/0c7effbfa7f67310cf3ca613bb15357af91ede79))

### [0.8.3](https://github.com/dendronhq/dendron/compare/v0.8.2...v0.8.3) (2020-08-25)

### Bug Fixes

- **markdown:** preview command disabled ([0c7effb](https://github.com/dendronhq/dendron/commit/0c7effbfa7f67310cf3ca613bb15357af91ede79))

## [0.8.1](https://github.com/dendronhq/dendron/compare/v0.8.0...v0.8.1) (2020-08-25)

### Features

- **hierarchies:** Add Go Up Hierarchy command ([7b225b9](https://github.com/dendronhq/dendron/commit/7b225b94d2e2ac1d13e0d21f7b8b5bc6604508a9))([docs](https://www.dendron.so/notes/eea2b078-1acc-4071-a14e-18299fc28f47.html#go-up-hierarchy))

### Enhancements

- **pods:** throw error on badly formed links ([c0a383d](https://github.com/dendronhq/dendron/commit/c0a383d31eb3ef85eb19d7919c95411cc440040a))

* update contributing docs ([6097c8d](https://github.com/dendronhq/dendron/commit/6097c8daaebafcf264f15fbfe5d02cac3d0a9529))

# [0.8.0](https://github.com/dendronhq/dendron/compare/v0.7.13...v0.8.0) (2020-08-24)

## [0.7.13](https://github.com/dendronhq/dendron/compare/v0.7.12...v0.7.13) (2020-08-24)

### Features

- **notes:** create daily journal note command ([532cc16](https://github.com/dendronhq/dendron/commit/532cc1662445efb840d5e3a1211ea1e312e2bd9c))

### Enhancements

- **schema:** default title to id ([080f6bb](https://github.com/dendronhq/dendron/commit/080f6bbda51774f23dd248bbd38f8b894ee24842))

## [0.7.12](https://github.com/dendronhq/dendron/compare/v0.7.11...v0.7.12) (2020-08-23)

### Bug Fixes

- **schema:** autocomplete with imported schemas ([5b6a347](https://github.com/dendronhq/dendron/commit/5b6a3472d2ee895bd64ac365d6ab6f49cb768a4f))

### Enhancements

- **schema:** better error message on bad schema ([a86b35d](https://github.com/dendronhq/dendron/commit/a86b35d606da9cdce16dbbafb944bc460f6d7ff4))

### Features

- **schemas:** support match by pattern ([ba4f687](https://github.com/dendronhq/dendron/commit/ba4f687f5f837ce244e7f58f2746f06372d85a99))
- **schemas:** support schema import ([7a38f1c](https://github.com/dendronhq/dendron/commit/7a38f1c869f5a20bf81c77682877995dd7bfce87))([docs](http://dendron.so/notes/c5e5adde-5459-409b-b34d-a0d75cbb1052.html#imports-optional-str))([docs](http://dendron.so/notes/c5e5adde-5459-409b-b34d-a0d75cbb1052.html#pattern))

## [0.7.11](https://github.com/dendronhq/dendron/compare/v0.7.11-alpha.0...v0.7.11) (2020-08-22)

### Work In Progress

- **pods**: import custom pods

### Enhancements

- **pods**: auto apply new site config to existing vaults

### Bug Fixes

- **pods**: use regular copy if rsync not installed

## [0.7.10](https://github.com/dendronhq/dendron/compare/v0.7.10-alpha.1...v0.7.10) (2020-08-21)

### Enhancements

- **pods:** always read config when publishing ([7d1d93a](https://github.com/dendronhq/dendron/commit/7d1d93ad06c4174b227b7669b6074e0df207fdba))

### Dendron Markdown Links Updates (0.6.7)

#### Features

- Add `Dendron:ShowSchema` Command ([docs](http://dendron.so/notes/587e6d62-3c5b-49b0-aedc-02f62f0448e6.html#dendron-show-schema-graph))

![](https://foundation-prod-assetspublic53c57cce-8cpvgjldwysl.s3-us-west-2.amazonaws.com/assets/images/graphs.show-schema.gif)

#### Enhancements

- `Dendron: Reload Graphs` will now reload all open `Schema` and `Note` Graphs

![](https://foundation-prod-assetspublic53c57cce-8cpvgjldwysl.s3-us-west-2.amazonaws.com/assets/images/graphs.reload.gif)

- Nicer visuals

#### Breaking

- Renamed `Markdown Links: Show Graph` to `Dendron: Show Note Graph`
- Renamed `Markdown Links: Reload Graph` to `Dendron: Reload Graphs`

## [0.7.9](https://github.com/dendronhq/dendron/compare/v0.7.9-alpha.1...v0.7.9) (2020-08-20)

### Enhancements

- **pods:** new website config syntax ([fd11f48](https://github.com/dendronhq/dendron/commit/fd11f483de62ddba91fd67abb298b2a49b4becba))([docs](https://www.dendron.so/notes/73d395c9-5041-4d0d-9db7-080d9586136e.html#properties))

## [0.7.6](https://github.com/dendronhq/dendron/compare/v0.7.6-alpha.2...v0.7.6) (2020-08-19)

### Bug Fixes

- links not being converted to ids ([7106681](https://github.com/dendronhq/dendron/commit/7106681734804ec39990abfdfe9643ba9c006aa5))

### Features

- **pods:** support per hierarchy configuration when publishing ([e68edfa](https://github.com/dendronhq/dendron/commit/e68edfa4cac21230ff77a24b65efa2031eb292dc))([docs](https://www.dendron.so/notes/73d395c9-5041-4d0d-9db7-080d9586136e.html#config))

### Work in Progress

- **pods:** enable image prefix when building site ([ab86573](https://github.com/dendronhq/dendron/commit/ab865730b0c2da461e2b9fe6851b8784f690be8a))

## [0.7.4](https://github.com/dendronhq/dendron/compare/v0.7.3...v0.7.4) (2020-08-19)

### Enhancements

- better markdown parsing ([cc712f0](https://github.com/dendronhq/dendron/commit/cc712f07b88d6e274b49f38cdedb4bd8981cd9c2))

## [0.7.3](https://github.com/dendronhq/dendron/compare/v0.7.2...v0.7.3) (2020-08-17)

**Note:** Version bump only for package root

## [0.7.2](https://github.com/dendronhq/dendron/compare/v0.7.1...v0.7.2) (2020-08-17)

### Bug Fixes

- posix path break windows ([5e25db0](https://github.com/dendronhq/dendron/commit/5e25db034fed1db7b65fa85ab30f15ca85344aaf))

## [0.7.1](https://github.com/dendronhq/dendron/compare/v0.7.0...v0.7.1) (2020-08-17)

**Note:** Version bump only for package root

# [0.7.0](https://github.com/dendronhq/dendron/compare/v0.6.12...v0.7.0) (2020-08-17)

**Note:** Version bump only for package root

## [0.6.12](https://github.com/dendronhq/dendron/compare/v0.6.11...v0.6.12) (2020-08-16)

### Bug Fixes

- **pods:** properly set path of multi-domain site ([18dda68](https://github.com/dendronhq/dendron/commit/18dda68d90ef727399e0336e034f875972a5bdc8))

## [0.6.11](https://github.com/dendronhq/dendron/compare/v0.6.10...v0.6.11) (2020-08-16)

### Bug Fixes

- add nav_order to multi-root publication ([04c06f1](https://github.com/dendronhq/dendron/commit/04c06f13fc323931c7959461df8cfdf307caa7c7))

## [0.6.10](https://github.com/dendronhq/dendron/compare/v0.6.9...v0.6.10) (2020-08-16)

### Features

- **pods:** publish multiple roots ([827b2f5](https://github.com/dendronhq/dendron/commit/827b2f52c35fa650b109dc5d929554a3d5db0cf5))

## [0.6.9](https://github.com/dendronhq/dendron/compare/v0.6.8...v0.6.9) (2020-08-16)

### Bug Fixes

- **pods:** bad title for naked wiki links ([64c04ff](https://github.com/dendronhq/dendron/commit/64c04ff3adbcc44aa7b540cbb7a9c34d6c4c19ae))
- **pods:** building sites without assets directory throws error ([5f711c9](https://github.com/dendronhq/dendron/commit/5f711c973a629a52b5ca66d647f9bbebd3f867fa))
- issue with schemas that have same ids ([3f93b31](https://github.com/dendronhq/dendron/commit/3f93b31bffdaa6092a7c03c48db46edf0d89f65a))

### Features

- **pods:** ability to not publish select lines ([e90514b](https://github.com/dendronhq/dendron/commit/e90514bc85179598ad9de9612ee6684e8195a7aa))

## [0.6.8](https://github.com/dendronhq/dendron/compare/v0.6.5...v0.6.8) (2020-08-15)

### Features

- **commands:** add show preview command ([f62dcf8](https://github.com/dendronhq/dendron/commit/f62dcf8ad97f95a2784397606233aaf20f8df4cc))
- do block ref ([8fdc331](https://github.com/dendronhq/dendron/commit/8fdc33198eb1ada6e0f1a8511065315cbba75530))
- replaceRefWithMPEImport ([eb3f627](https://github.com/dendronhq/dendron/commit/eb3f627a435f62a788899adb34f1d3de256232f7))

## [0.6.5](https://github.com/dendronhq/dendron/compare/v0.6.4...v0.6.5) (2020-08-14)

### Features

- **commands:** add copy ref command ([5bbbbf6](https://github.com/dendronhq/dendron/commit/5bbbbf69c88c851aafca16003689e03745527390))
- **markdown:** embed note refs into other notes ([57d5c6a](https://github.com/dendronhq/dendron/commit/57d5c6a08f5b8c6c25edb49ea3136e46f11aa664))
  - NOTE: this only works with the regular markdown link, and not `Dendron Markdown Preview Enhanced`.

![](https://foundation-prod-assetspublic53c57cce-8cpvgjldwysl.s3-us-west-2.amazonaws.com/assets/images/ref-note.gif)

### Enhancements

- **commands:** rename note will open new note and close moved note ([98e5b36](https://github.com/dendronhq/dendron/commit/98e5b36f6c02b44e24aa4969b9913156f2947a24))
- **markdown:** update markdown css for note refs ([7976392](https://github.com/dendronhq/dendron/commit/79763924b8454687fe2c4fa668de7ff8f0eb2353))

---

## [0.6.4](https://github.com/dendronhq/dendron/compare/v0.6.3...v0.6.4) (2020-08-13)

### Bug Fixes

- **commands:** allow empty replacements in refactor command ([6d101aa](https://github.com/dendronhq/dendron/commit/6d101aa7df72c7639051e59e9b734399e068c9cc))
- **commands:** issue where refactor would miss some links ([1734778](https://github.com/dendronhq/dendron/commit/173477849f6dd21f9f52a1d8c6733faf472fcea3))
- **plugin:** issue where new note won't be created if its a stub when using Lookup ([e5604a9](https://github.com/dendronhq/dendron/commit/e5604a9be02455a75084b4cf20f749ce7c4c6866))
- quickinput exit early on certain inputs ([b1e47bd](https://github.com/dendronhq/dendron/commit/b1e47bd5b4c81a1d69ae76b82869c04739557ab8))

### Work in Progress

- better md preview ([f5f2467](https://github.com/dendronhq/dendron/commit/f5f24674e5cf2e41e725d9187808c22ecb7433ab))
  - There's been a few persistent issues with Dendron's current markdown preview:
    - page can get stuck
    - doesn't integrate with native markdown preview in VSCode
    - results in two markdown icons in the menu bar
    - etc
  - In order to provide a better user experience and also pave the way for more advanced functionality like embeddable pages and blocks (eg. roam), Dendron is working on its own markdown preview
  - You can preview it today by using the regular markdown preview with the 0.6.4 release
  - Currently, it supports rendering and navigating via wiki-links and is not at feature parity with `Markdown Preview Enhanced`
  - See tracking issue [here](https://github.com/dendronhq/dendron/issues/93)

### Enhancements

- **commands:** refactor hierarchy will warn you when overwriting files ([40af29c](https://github.com/dendronhq/dendron/commit/40af29c3d59eb0c00ac3e97810012ea1cd1ba3ea))

### Docs

- new use case video: [PARA with Dendron](https://www.youtube.com/watch?v=vrhBNGMJQwE)

## [0.6.3](https://github.com/dendronhq/dendron/compare/v0.6.2...v0.6.3) (2020-08-12)

### Enhancements

- **workbench:** initialize empty workbench ([5406f52](https://github.com/dendronhq/dendron/commit/5406f52f5c1994fe81f3f9b33db039dd29b989ae))

## [0.6.2](https://github.com/dendronhq/dendron/compare/v0.6.1...v0.6.2) (2020-08-11)

### Bug Fixes

- issue with rename notes ([e16e0e9](https://github.com/dendronhq/dendron/commit/e16e0e971234c054ccc81ad7091400ccaad09b48))
- remove obsolete info messages ([564e4c1](https://github.com/dendronhq/dendron/commit/564e4c16d4966f5cd36019b84f44ba6570bb3614))

## [0.6.1](https://github.com/dendronhq/dendron/compare/v0.6.0...v0.6.1) (2020-08-11)

### Features

- **commands:** Add Archive Hierarchy Command ([62ec3ac](https://github.com/dendronhq/dendron/commit/62ec3aca2861e65a645cd13412dbf319b05bc403))
- **commands:** Add Refactor Hierarchy Command ([4fcaf40](https://github.com/dendronhq/dendron/commit/4fcaf40a7fd7b98b658703e726dd8ccf6c14e4c4))

# [0.6.0](https://github.com/dendronhq/dendron/compare/v0.5.15...v0.6.0) (2020-08-09)

Dendron 0.6 has sprouted :seedling:

The much asked for Rename Note command is here, as well as a bunch of enhancements to notes and schemas. Read the full release notes [here](https://www.dendron.so/notes/075e9806-0367-40a2-8154-2e84d5a020e2.html)

## [0.5.15](https://github.com/dendronhq/dendron/compare/v0.5.14...v0.5.15) (2020-08-09)

### Bug Fixes

- index notes created through rename ([40f8fb6](https://github.com/dendronhq/dendron/commit/40f8fb6dd6c810a5ead9de2dedaffd4b55c321e9))

### Features

- add copy note link command ([5ca2434](https://github.com/dendronhq/dendron/commit/5ca2434de3f19eaa94ef7bc876ad9b8067cdf90a)) ([docs](https://www.dendron.so/notes/eea2b078-1acc-4071-a14e-18299fc28f47.html#copy-link))

![](https://foundation-prod-assetspublic53c57cce-8cpvgjldwysl.s3-us-west-2.amazonaws.com/assets/images/command.copy-link.gif)

- standalone rename note command ([72809a4](https://github.com/dendronhq/dendron/commit/72809a487d8ac57c96046395ea872d78e8efc1ad)) ([docs](https://www.dendron.so/notes/eea2b078-1acc-4071-a14e-18299fc28f47.html#rename-note))

![](https://foundation-prod-assetspublic53c57cce-8cpvgjldwysl.s3-us-west-2.amazonaws.com/assets/images/command-rename.gif)

## [0.5.14](https://github.com/dendronhq/dendron/compare/v0.5.13...v0.5.14) (2020-08-08)

### Bug Fixes

- issue with buildpod ([239c63c](https://github.com/dendronhq/dendron/commit/239c63cfae0ee0d65629a2085b7a8ba3a40f7fae))

## [0.5.13](https://github.com/dendronhq/dendron/compare/v0.5.12...v0.5.13) (2020-08-08)

### Bug Fixes

- scratch note title set to fname ([416a515](https://github.com/dendronhq/dendron/commit/416a51573406d2a87f8b2d3d90e9fea143f6d4a2))

### Features

- initial implementation of `Dendron: Rename` command ([4a869cf](https://github.com/dendronhq/dendron/commit/4a869cfc521aeaba5ec61275e4f55e0dfcf87d6d)) ([docs](https://dendron.so/notes/eea2b078-1acc-4071-a14e-18299fc28f47.html#renamenote-))

![](https://foundation-prod-assetspublic53c57cce-8cpvgjldwysl.s3-us-west-2.amazonaws.com/assets/images/command-rename.gif)

## [0.5.12](https://github.com/dendronhq/dendron/compare/v0.5.11...v0.5.12) (2020-08-07)

### Bug Fixes

- doctor reload index before doing backfill ([1b261ab](https://github.com/dendronhq/dendron/commit/1b261ab6bbc08b6ac9869e1c54ba7095a0b13573))

## [0.5.11](https://github.com/dendronhq/dendron/compare/v0.5.10...v0.5.11) (2020-08-06)

### Features

- better scratch note command ([277d240](https://github.com/dendronhq/dendron/commit/277d2405b1d055e13beb555def2a53c7e9e2937e))
- flexible configuration for journal notes and scratch notes ([f26fb61](https://github.com/dendronhq/dendron/commit/f26fb61a8774482dde7a129a1efa459a59086763))([docs](https://dendron.so/notes/5c213aa6-e4ba-49e8-85c5-1bdcb33ce202.html#configuration))

### Docs

- over the last few weeks, we've been getting lots of great questions about dendron, why its different from everything else and how to best use it. we've compiled our answers in an updated FAQ which you can find [here](https://www.dendron.so/notes/683740e3-70ce-4a47-a1f4-1f140e80b558.html)

## [0.5.10](https://github.com/dendronhq/dendron/compare/v0.5.9...v0.5.10) (2020-08-06)

### Features

- [dendron-jekyll](https://github.com/dendronhq/dendron-jekyll): custom jekyll theme for dendron
  - dendron-jekyll is now published as a gem - this means you can publish dendron sites on any platform that supports static hosting
  - dendron-jekyll exposes a subset of [helper utilities](https://mmistakes.github.io/minimal-mistakes/docs/helpers/#figure) that are compatible with github's remote-theme builds
  - dendron-jekyll now has a custom [blogging layout](https://www.dendron.so/notes/4c0ef322-3006-405c-9a66-3134dd9649a5.html#blogging)
    ![](https://foundation-prod-assetspublic53c57cce-8cpvgjldwysl.s3-us-west-2.amazonaws.com/assets/images/jekyll-kevinslin.gif)

## [0.5.9](https://github.com/dendronhq/dendron/compare/v0.5.8...v0.5.9) (2020-08-05)

### Bug Fixes

- apply schema descriptions ([e4f7238](https://github.com/dendronhq/dendron/commit/e4f723872db080a3205f305060ebae3c20cb34fb))

## [0.5.8](https://github.com/dendronhq/dendron/compare/v0.5.7...v0.5.8) (2020-08-05)

### Features

- apply schema description to new notes ([c4b9f15](https://github.com/dendronhq/dendron/commit/c4b9f158daeab5d159e5f4e690ad0c4ad1e3f549))

![](https://foundation-prod-assetspublic53c57cce-8cpvgjldwysl.s3-us-west-2.amazonaws.com/assets/images/schema-desc.gif)

## [0.5.7](https://github.com/dendronhq/dendron/compare/v0.5.6...v0.5.7) (2020-08-04)

### Bug Fixes

- not all notes indexed in sparse vaults ([383b6e3](https://github.com/dendronhq/dendron/commit/383b6e3f54e46616e1becf28eccd903b372897e5))

## [0.5.6](https://github.com/dendronhq/dendron/compare/v0.5.5...v0.5.6) (2020-08-04)

### Features

- add built in snippets ([b639998](https://github.com/dendronhq/dendron/commit/b639998a8e955a88bec350d687c0f84c497f79fc))

![](https://foundation-prod-assetspublic53c57cce-8cpvgjldwysl.s3-us-west-2.amazonaws.com/assets/images/tab-autocomplete.gif)

- make journal timestamp format configurable ([228384a](https://github.com/dendronhq/dendron/commit/228384a86720f56f2fce752d4c0cc8904326e651))

<a href="https://www.loom.com/share/27b9efa48cbe4fcb9535be9b60840d57">
<img style="" src="https://cdn.loom.com/sessions/thumbnails/27b9efa48cbe4fcb9535be9b60840d57-with-play.gif">
</a>

## [0.5.5](https://github.com/dendronhq/dendron/compare/v0.5.4...v0.5.5) (2020-08-04)

**Note:** Version bump only for package root

### open-vsx

- Dendron and all of its extensions are now published on the [open-vsx](https://open-vsx.org/) registry. This means that you can now use Dendron inside any VS Code Compatible Editor (eg. [Theia](https://github.com/eclipse-theia/theia) and [VSCodium](https://vscodium.com/))

## [0.5.4](https://github.com/dendronhq/dendron/compare/v0.5.3...v0.5.4) (2020-08-04)

### Bug Fixes

- notes created via wiki-links not being indexed properly ([5c1b495](https://github.com/dendronhq/dendron/commit/5c1b4950026bf83580a095532a48320ad66f256f))

### Features

- deploy to ovsx ([d2410cb](https://github.com/dendronhq/dendron/commit/d2410cb19515670b4b9d5f589c365d8a647934dc))
- update index when notes are deleted outside of dendron ([93ad260](https://github.com/dendronhq/dendron/commit/93ad26059009f55e4ff1c9a75cfe39c7cff0b376))

## [0.5.3](https://github.com/dendronhq/dendron/compare/v0.5.2...v0.5.3) (2020-08-03)

### Dendron Markdown Notes (0.0.16)

- Creating a new markdown note by going to a wiki-link will create a note with the same frontmatter as regular lookup

## [0.5.2](https://github.com/dendronhq/dendron/compare/v0.5.1...v0.5.2) (2020-08-03)

**Note:** Version bump only for package root

## [0.5.1](https://github.com/dendronhq/dendron/compare/v0.5.0...v0.5.1) (2020-08-03)

**Note:** Version bump only for package root

# [0.5.0](https://github.com/dendronhq/dendron/compare/v0.4.8...v0.5.0) (2020-08-02)

### Release Notes

<a href="https://marketplace.visualstudio.com/items?itemName=dendron.dendron">Version 0.5.0</a> has planted 🌱
Read about the new features and fixes in our <a href="https://www.dendron.so/notes/e32aa1e2-9780-4183-927e-2f46372050aa.html">release notes</a></div>

With this release, we are also conducting our first dendron user survey. It's a short survey that should take no more than 3 minutes to fill out and will help inform me on the future growth of Dendron. Your participation is immensely appreciated 🙏

https://forms.gle/PPqe2axvwEmpXj4v5

## [0.4.8](https://github.com/dendronhq/dendron/compare/v0.4.7...v0.4.8) (2020-08-02)

### Features

- add ShowHelp command ([ecf3c68](https://github.com/dendronhq/dendron/commit/ecf3c6822848834d9a00e373d1c59b6628e7f4df))([docs](https://www.dendron.so/notes/eea2b078-1acc-4071-a14e-18299fc28f47.html#show-help))

## [0.4.7](https://github.com/dendronhq/dendron/compare/v0.4.6...v0.4.7) (2020-08-01)

## Summary

We overhauled the [home page](https://www.dendron.so) to be less preachy and more user friendly. Also fixed a bunch of link issues - most notably, an issue with linking from the home page of a generated site when using wiki-links.

### Bug Fixes

- issue with urls in published site ([0ac8e75](https://github.com/dendronhq/dendron/commit/0ac8e75c95a9c4760e12bb301fc5b66b011ef0fb))

## [0.4.6](https://github.com/dendronhq/dendron/compare/v0.4.5...v0.4.6) (2020-08-01)

### Summary

Schemas now support templates. That means you can add the name of another note that you want to serve as a template to a schema. Every time a note that matches the schema is created, it will have the template applied automatically.

We are launching with support for creating templates from other notes. We will also be launching the ability to create templates from snippets in the coming week.

<img style="max-width:300px;" src="https://cdn.loom.com/sessions/thumbnails/481b7ab051394c1caa383383bd265755-with-play.gif">

### Features

- support schema templates ([0205d66](https://github.com/dendronhq/dendron/commit/0205d66fc4538361322ffeabb3e532f0d541b775)) ([docs](https://www.dendron.so/notes/c5e5adde-5459-409b-b34d-a0d75cbb1052.html#schema-templates))

## [0.4.5](https://github.com/dendronhq/dendron/compare/v0.4.4...v0.4.5) (2020-08-01)

### Summary

Schema syntax has been simplified. Before we had an extra `data` field to namespace the `namespace` field. We flattened all schema attributes to make the syntax more elegant. Note that the old styled `data` syntax is still supported but we recommend moving to the new syntax as `data` will be deprecated in a few releases.

### Enhancements

- simpler schema syntax ([d53ddb](https://github.com/dendronhq/dendron/commit/d53ddb73bfacc3f769db88cfd4f482a706dcb6dd))

### Bug Fixes

- update quickstart doc ([aec0fe0](https://github.com/dendronhq/dendron/commit/aec0fe0939239d84f5b7ebd9ebae57a09bcdae43))

## [0.4.4](https://github.com/dendronhq/dendron/compare/v0.4.3...v0.4.4) (2020-08-01)

### Summary

You can now work with schemas as easily as you do with regular notes. Have no fear, lookup for schemas is here!

### Features

- use lookups to view and create schemas ([19b4677](https://github.com/dendronhq/dendron/commit/19b46770fe6a842831692563de96ff4a823df871)) ([docs](https://www.dendron.so/notes/a7c3a810-28c8-4b47-96a6-8156b1524af3.html#schemas))
  - it's now possible to perform lookup on schemas in addition to notes
- support deleting schemas ([7e6730a](https://github.com/dendronhq/dendron/commit/7e6730a9c3f804d7c039cf74495493839c910fed)) ([docs](https://www.dendron.so/notes/a7c3a810-28c8-4b47-96a6-8156b1524af3.html#schemas))
  - what you create you can also take away

## [0.4.3](https://github.com/dendronhq/dendron/compare/v0.4.2...v0.4.3) (2020-07-30)

### Bug Fixes

- issue with journal names on windows ([d0bfe7f](https://github.com/dendronhq/dendron/commit/d0bfe7fb0288e8610fc4b177ee85697a8ebc3efe))
- logging bad nodes ([c013e00](https://github.com/dendronhq/dendron/commit/c013e00faff9d7a9cce7743020cb97507f826943))

### Features

- CI/CD testing ([d6ce68c](https://github.com/dendronhq/dendron/commit/d6ce68c720d7e8c96d7f4bb6ab390c1bd52c5218))
  - Dendron now has continuous integration tests for all pushes. ![](https://travis-ci.com/dendronhq/dendron.svg?branch=master)
  - Tests run on mac, linux and windows which means moving forward, there should be fewer OS related issues
- Publish local images when publishing site ([f60360d](https://github.com/dendronhq/dendron/commit/f60360d94b8149404032fc77cfa7556801768105))
  - any images you have added using [paste images](https://www.dendron.so/notes/a91fd8da-6895-49fe-8164-a17acd8d9a17.html) will now automatically be included when you run `Build Pod`

## [0.4.2](https://github.com/dendronhq/dendron/compare/v0.4.1...v0.4.2) (2020-07-30)

### Bug Fixes

- issue with backfill ([65f93e8](https://github.com/dendronhq/dendron/commit/65f93e8e81929ca2277b83a608d15a10d35cc5b3))
- root should have no parent ([bab72fd](https://github.com/dendronhq/dendron/commit/bab72fd438c541673c128caf96174d43b8eaa43a))
- stub nodes should keep parents when deleted ([f32f291](https://github.com/dendronhq/dendron/commit/f32f291bc7a1ddd6c542483730e2db74b400dafa))

### Features

- add doctor command ([d4fa71c](https://github.com/dendronhq/dendron/commit/d4fa71cd839782587d47a3ba1b0f7e89742e7ffe)) ([docs](https://www.dendron.so/notes/eea2b078-1acc-4071-a14e-18299fc28f47.html#doctor))
- backfill command ([91b2193](https://github.com/dendronhq/dendron/commit/91b21932aec72b111e1e9d458a8c7c3817c68bbe))
- backfill ids when running doctor ([3705234](https://github.com/dendronhq/dendron/commit/37052342de88107f928b16595587492e601c9831))
- publishing vaults to github ([e063732](https://github.com/dendronhq/dendron/commit/e063732d1ff082dd8520a479926e7ceb1b0893ab)) ([docs](https://www.dendron.so/notes/73d395c9-5041-4d0d-9db7-080d9586136e.html))
- convert wiki-links to markdown links while building site ([f451be4](https://github.com/dendronhq/dendron/commit/f451be4db437a9cd6c290019fd5d24fe4fd9e907))
- overwrite fields in backfill ([af504f4](https://github.com/dendronhq/dendron/commit/af504f44d73910e8687367bc203b613d774a039c))
- setup initial workbench to be ready for publishing ([e1242b4](https://github.com/dendronhq/dendron/commit/e1242b494cc91b3284053b54dccecc4e4686ab7d))
- support custom root when publishing a site ([41e3d72](https://github.com/dendronhq/dendron/commit/41e3d7283bf5719a62f8f7f6f612dc9ad07370f7))

### Performance Improvements

- add timing data ([ffef382](https://github.com/dendronhq/dendron/commit/ffef38294cd04fac6d6784865c43c7fa8af62abd))

## [0.4.1](https://github.com/dendronhq/dendron/compare/v0.4.0...v0.4.1) (2020-07-26)

**Note:** Version bump only for package root

# 0.4.0 (2020-07-26)

### Release Notes

<a href="https://marketplace.visualstudio.com/items?itemName=dendron.dendron">Version 0.4.0</a> is out 🎉 Read about the new features and fixes in our <a href="https://www.dendron.so/release.2020-07-25">release notes</a></div>

## [0.3.47](https://github.com/dendronhq/dendron/compare/v0.3.46...v0.3.47) (2020-07-26)

### Features

- initialize new vault with git ([7278b6f](https://github.com/dendronhq/dendron/commit/7278b6fbbf4e175815a0a069c449ad7ef479a77e))

## [0.3.46](https://github.com/dendronhq/dendron/compare/v0.3.45...v0.3.46) (2020-07-25)

### Features

- keyboard shortcuts for scratch and journal notes ([076fa18](https://github.com/dendronhq/dendron/commit/076fa18ceb0836736e123d7439af31da00cc2ec2))

## [0.3.45](https://github.com/dendronhq/dendron/compare/v0.3.44...v0.3.45) (2020-07-24)

### Features

- better scratch notes, [docs](https://github.com/dendronhq/dendron-template/blob/master/vault/pro.dendron.topic.special-notes.md#scratch-note) ([f1d0f94](https://github.com/dendronhq/dendron/commit/f1d0f94e871984428d442c8b54d130fff53b2b91))
- creating journals copies path to clipboard ([a34fc81](https://github.com/dendronhq/dendron/commit/a34fc815454e0e86112d5a507dd0013ec37a0edb))

## [0.3.44](https://github.com/dendronhq/dendron/compare/v0.3.43...v0.3.44) (2020-07-24)

**Note:** Version bump only for package root

## [0.3.43](https://github.com/dendronhq/dendron/compare/v0.3.42...v0.3.43) (2020-07-23)

### Features

- new getting started experience ([dd4f50e](https://github.com/dendronhq/dendron/commit/dd4f50eb169e7f9686c4e3fbabca3b2a6c1e1bb7))

## [0.3.42](https://github.com/dendronhq/dendron/compare/v0.3.41...v0.3.42) (2020-07-23)

### Features

- change workbenchs accepts '~' path ([d6c4f64](https://github.com/dendronhq/dendron/commit/d6c4f64cdfbb9e6b5c44a04320a84756fefcb924))

## [0.3.41](https://github.com/dendronhq/dendron/compare/v0.3.40...v0.3.41) (2020-07-23)

### Bug Fixes

- dendron complain about engine not being initialized ([d461109](https://github.com/dendronhq/dendron/commit/d461109019609cb272fa24c6dca1fd65f82528c9))
- don't create journal entry if user cancels ([e763178](https://github.com/dendronhq/dendron/commit/e763178cae6f0c763bc432617a0e8b15f2dff532))

## [0.3.40](https://github.com/dendronhq/dendron/compare/v0.3.39...v0.3.40) (2020-07-23)

**Note:** Version bump only for package root

## [0.3.39](https://github.com/dendronhq/dendron/compare/v0.3.38...v0.3.39) (2020-07-23)

**Note:** Version bump only for package root

## [0.3.38](https://github.com/dendronhq/dendron/compare/v0.3.37...v0.3.38) (2020-07-23)

**Note:** Version bump only for package root

## [0.3.37](https://github.com/dendronhq/dendron/compare/v0.3.36...v0.3.37) (2020-07-22)

**Note:** Version bump only for package root

## [0.3.36](https://github.com/dendronhq/dendron/compare/v0.3.35...v0.3.36) (2020-07-22)

### Bug Fixes

- issue with new journal notes not initializing ([63e3e63](https://github.com/dendronhq/dendron/commit/63e3e63bd246ae7fd1587e6ea95c66ebf943bc36))

## [0.3.35](https://github.com/dendronhq/dendron/compare/v0.3.33...v0.3.35) (2020-07-22)

### Features

- add a openLogs command to help debug issues ([4f223fc](https://github.com/dendronhq/dendron/commit/4f223fc318fe033471252611c8f41d505dca1055))

## [0.3.34](https://github.com/dendronhq/dendron/compare/v0.3.33...v0.3.34) (2020-07-22)

### Features

- add a openLogs command to help debug issues ([4f223fc](https://github.com/dendronhq/dendron/commit/4f223fc318fe033471252611c8f41d505dca1055))

## [0.3.33](https://github.com/dendronhq/dendron/compare/v0.3.32...v0.3.33) (2020-07-22)

### Bug Fixes

- bad extension identifier ([a234b23](https://github.com/dendronhq/dendron/commit/a234b23b27b6e72ec5683b4c90db29149bb3a167))
- dispose of file watchers on extension deactivate ([3ef52e1](https://github.com/dendronhq/dendron/commit/3ef52e18ec26bd5b50e24f7ada69c05e0b569383))

## [0.3.31](https://github.com/dendronhq/dendron/compare/v0.3.30...v0.3.31) (2020-07-22)

### Manual Changes

🚨NOTE: if you are upgrading from version 0.3.30 or lower, manual action is needed!🚨

We've forked a bunch of the core vscode extensions to make them work better with Dendron. You will need to uninstall the previous extension and install the Dendron version of these extensions.

Changes you will need to make

Remove the following extensions and replace them with their `Dendron *` counterparts. VSCode should automatically recommend that you install them but if not, you can find the extensions by adding `Dendron` in front of the extension name (eg. Markdown Links -> Dendron Markdown Links)

- Markdown Links:
  - why: support showing graphs based on dendron's hierarchy
- Markdown Preview Enhanced:
  - why: Fix some link bugs and upcoming integration with how Dendron handles frontmatter
- Markdown Shortcuts:
  - why: Remove some default keybindings that were interferring with Dendron bindings on Linux and Windows
- Markdown Notes:
  - why: required for integrating new note creation via link with Dendron and other upcoming features

After you've made the above changes, you can run `Developer: Reload Window` for the changes to take effect.

### Features

- add reload index command ([236b2ac](https://github.com/dendronhq/dendron/commit/236b2ac70812c4df525ff27479802b6e49e0587f))
- initialize default workbench with relative paths so that its portable btw devices ([790ef50](https://github.com/dendronhq/dendron/commit/790ef503225e5b18a78e3e62e847ba8b2adfd8d0))
- upgrade settings command ([c043090](https://github.com/dendronhq/dendron/commit/c0430905d314c6ee870f9bdd45434f53e93a7098))

## [0.3.30](https://github.com/dendronhq/dendron/compare/v0.3.29...v0.3.30) (2020-07-21)

### Features

- custom front matter support [docs](https://github.com/dendronhq/dendron-template/blob/master/vault/pro.dendron.topic.frontmatter.md) ([dadd3fd](https://github.com/dendronhq/dendron/commit/dadd3fd16e2814e378b7af3c097b556c92981de3))
- remove un-used frontmatter ([e059346](https://github.com/dendronhq/dendron/commit/e0593467fca94a4d29dc9463721a99e67881cfb3))

## [0.3.23](https://github.com/dendronhq/dendron/compare/v0.3.22...v0.3.23) (2020-07-20)

### Bug Fixes

- markdown preview will now open local links ([10a3418](https://github.com/dendronhq/dendron/commit/10a3418f7a633fa9b5294794e1a912cb4ea6c066))

### Features

- basic windows support ([a789ec5](https://github.com/dendronhq/dendron/commit/a789ec5792301103d302739f00b595509128d367))

## [0.3.21](https://github.com/dendronhq/dendron/compare/v0.3.20...v0.3.21) (2020-07-19)

### Features

- add graph view [docs](https://github.com/dendronhq/dendron-template/blob/master/vault/dendron.topic.graph-view.md) ([129bf4e](https://github.com/dendronhq/dendron/commit/129bf4e4e480dfbff66530725c6db8d2321adc28))

## [0.3.20](https://github.com/dendronhq/dendron/compare/v0.3.19...v0.3.20) (2020-07-18)

### Bug Fixes

- handle special characters in file names when importing using LocalFilePod ([03e42b1](https://github.com/dendronhq/dendron/commit/03e42b167ac9f073cd56f10c4e31b5cecf66dabf))

## [0.3.19](https://github.com/dendronhq/dendron/compare/v0.3.18...v0.3.19) (2020-07-18)

### Features

- show busy ui when engine is searching ([4fc7256](https://github.com/dendronhq/dendron/commit/4fc72565c139177bd725a5599c8954c2cceed8ab))

## [0.3.18](https://github.com/dendronhq/dendron/compare/v0.3.17...v0.3.18) (2020-07-18)

### Bug Fixes

- github banner occluding text on mobile devices ([972a51d](https://github.com/dendronhq/dendron/commit/972a51df165d10b87cc8770a5264201e7239ad82))
- surface errors to user if bad frontmatter ([03107f4](https://github.com/dendronhq/dendron/commit/03107f413626362c8efde99328d9b0712e286441))

### Features

- ability to import notes from local file system [docs](https://github.com/dendronhq/dendron-template/blob/master/vault/dendron.topic.pod.md) ([e44fd11](https://github.com/dendronhq/dendron/commit/e44fd1133bec10f22831f059c8d98cf4076dcdcc))

## [0.3.17](https://github.com/dendronhq/dendron/compare/v0.3.16...v0.3.17) (2020-07-17)

### Features

- more flexible file names for [journal notes](https://github.com/dendronhq/dendron-template/blob/master/vault/dendron.special-notes.md) ([9d9f10b](https://github.com/dendronhq/dendron/commit/9d9f10bd0873c201361c4625fc49c9f62ee82991))
- open non-markdown files using native apps. [docs](https://github.com/dendronhq/dendron-template/blob/master/vault/dendron.feature.links.md) ([7f630d1](https://github.com/dendronhq/dendron/commit/7f630d1fb95d5c0d28fc5a83f4cee27bc17d452c))

## [0.3.16](https://github.com/dendronhq/dendron/compare/v0.3.15...v0.3.16) (2020-07-16)

### Features

- implement journal notes. see details here: https://github.com/dendronhq/dendron-template/blob/master/vault/dendron.feature.journals.md ([5e1236f](https://github.com/dendronhq/dendron/commit/5e1236fddbf1e0fddf4c27d1a40e9841cc99974f))
- set relative rootDir ([65bbd77](https://github.com/dendronhq/dendron/commit/65bbd77e1bc49f45776904232953dba6b4c2cca9))

## [0.3.15](https://github.com/dendronhq/dendron/compare/v0.3.14...v0.3.15) (2020-07-14)

### Bug Fixes

- don't show duplicates when surfacing schema suggestions ([d1716cc](https://github.com/dendronhq/dendron/commit/d1716ccfc3e03ffaddc8e52a3be301af926be029))
- schema suggestions not always showing ([658c9e3](https://github.com/dendronhq/dendron/commit/658c9e3215cccf1875138928a3c9a8486052b63a))

### Features

- scratch note command ([71d8433](https://github.com/dendronhq/dendron/commit/71d8433fbd10651ec7fcd13a5f7ee41199a43632))
- show note title if differ from file name ([c0e428d](https://github.com/dendronhq/dendron/commit/c0e428d259ef116d66cbe1107d7760cbb84f8d20))

## [0.3.14](https://github.com/dendronhq/dendron/compare/v0.3.13...v0.3.14) (2020-07-14)

### Performance Improvements

- add webpack to optimize bundle ([4502e49](https://github.com/dendronhq/dendron/commit/4502e49f79d490bb639d2daaf93f841e5b18449d))

## [0.3.13](https://github.com/dendronhq/dendron/compare/v0.3.12...v0.3.13) (2020-07-14)

### Features

- ability to re-use existing workbench ([7de80b1](https://github.com/dendronhq/dendron/commit/7de80b17cac4123336afb3d0dc902f22f1a0e488))

## [0.3.11](https://github.com/dendronhq/dendron/compare/v0.3.10...v0.3.11) (2020-07-13)

### Bug Fixes

- issue creating stubs ([5647a33](https://github.com/dendronhq/dendron/commit/5647a3307d4b1e42be49842db8de0a1da3d2127f))

## [0.3.10](https://github.com/dendronhq/dendron/compare/v0.1.6...v0.3.10) (2020-07-13)

### Bug Fixes

- add bond ([6e57f0c](https://github.com/dendronhq/dendron/commit/6e57f0cc03683106fef26ebebdad4408bb469342))
- issue with create new note not updating ([480d294](https://github.com/dendronhq/dendron/commit/480d29451e7db5370c6e693144d37039199396c7))
- no flickering when surfacing "create new" suggestion ([102b997](https://github.com/dendronhq/dendron/commit/102b997a3064db646743d5a1256f48614fe92964))
- remove test file ([734803f](https://github.com/dendronhq/dendron/commit/734803ffc8fcfe84433a50c0f411ea87ba8aa695))
- update lerna ([d422e5c](https://github.com/dendronhq/dendron/commit/d422e5c9266d2d7c5c7e697d062b4e2fbc718358))

### Features

- add delete note shortcut ([8b5a58b](https://github.com/dendronhq/dendron/commit/8b5a58bb41cceb5cdc59e826150aa3d3508cffb9))
- add material theme ([3973fbf](https://github.com/dendronhq/dendron/commit/3973fbf70ee776c9bb527cc218d801bca4ea2f99))
- auto add nodes when deleted or created outside of dendron ([8c311bd](https://github.com/dendronhq/dendron/commit/8c311bda948a1d54088c49fd70eb65d24af5d68f))
- better initial welcome page ([f8767c6](https://github.com/dendronhq/dendron/commit/f8767c694bd5a5516a1a052f66bce0dff74fc7db))
- better schema suggestions ([03656bc](https://github.com/dendronhq/dendron/commit/03656bc007810457cb6846f0d6adacab4a7fbd3a))
- delete, abort or work inside existing folder when creating new workbench ([1da29ec](https://github.com/dendronhq/dendron/commit/1da29ec158ec416b9ee3002faf5bb2c4b84e12ed))
- initialize workbench with autosave ([cd63346](https://github.com/dendronhq/dendron/commit/cd633462ea9ee050ad27de3de1633fa49a9ff453))
- limit initial query to just domains ([1b611e5](https://github.com/dendronhq/dendron/commit/1b611e5e55dd8e81123895a40814aa2c8f4f7eaa))
- match namespace schemas ([7a67b8b](https://github.com/dendronhq/dendron/commit/7a67b8b2fb7caa1b97ee6d492d2801782abecdf6))
- os specific keybindings ([6a016ee](https://github.com/dendronhq/dendron/commit/6a016ee34bc6e2213f46ea9aa738068b14313899))
- set default folder for all platforms ([64649d8](https://github.com/dendronhq/dendron/commit/64649d82bce35bae5db09cc83af1f398b760008a))
- show basename of node after deletion ([4c8b72e](https://github.com/dendronhq/dendron/commit/4c8b72ee8a321eb17b68b2571cddf37e57249ca7))
- show node descriptions ([aca86f2](https://github.com/dendronhq/dendron/commit/aca86f2a5fd6ee481f93553693a098db0e322890))
- show schema recommendations when no suggestions are available ([00e8b7c](https://github.com/dendronhq/dendron/commit/00e8b7c88f572487fd59fe64854a352e6c549563))
- show schema suggestion at same level as query ([830c50d](https://github.com/dendronhq/dendron/commit/830c50da3a5cddfceeec48e8c0ec2ae68af51e77))
- show schema suggestions ([1313e79](https://github.com/dendronhq/dendron/commit/1313e799874c5f706eb32342bbe86429e6ba0998))
- show schema with results ([188fdeb](https://github.com/dendronhq/dendron/commit/188fdeb760010cd6767fb47e46cdfa757371a70b))
- support automatic config updates ([637682c](https://github.com/dendronhq/dendron/commit/637682cd2c639102c0ea72a390bc781ffe6ac307))
- surface unknown schemas ([d014965](https://github.com/dendronhq/dendron/commit/d0149652c985c69a4b2607984d578902820077f1))
- update first time onboarding ([1edadf2](https://github.com/dendronhq/dendron/commit/1edadf2ff05ffb5b5fae1ca7e20513d327983043))
- update logo ([920251d](https://github.com/dendronhq/dendron/commit/920251d1c85fa5ec5094b2d0b0aa400f39f8808b))
- updated icons for schemas ([21804eb](https://github.com/dendronhq/dendron/commit/21804eba61c8dd49e499edd5d548d9d601224e8e))

## [0.3.9](https://github.com/kevinslin/dendronv2/compare/v0.3.8...v0.3.9) (2020-07-09)

### Features

- better initial welcome page ([59b8a31](https://github.com/kevinslin/dendronv2/commit/59b8a3140b1f207aad81ab17fcc4e89570961845))
- set default folder for all platforms ([b16def5](https://github.com/kevinslin/dendronv2/commit/b16def56e78da165e4b3af8f27b288add98ace3f))
- show basename of node after deletion ([fe43708](https://github.com/kevinslin/dendronv2/commit/fe4370828d775a6b418a92dfb9c724828d856664))
- updated icons for schemas ([b7a2d8a](https://github.com/kevinslin/dendronv2/commit/b7a2d8aa517cf88d7a93d07cd2ef19305e48d069))

## [0.3.7](https://github.com/kevinslin/dendronv2/compare/v0.3.6...v0.3.7) (2020-07-08)

### Features

- better schema suggestions ([ad74bc0](https://github.com/kevinslin/dendronv2/commit/ad74bc009e1544319a49689394ab8d6b684f6578))
- limit initial query to just domains ([7ca010b](https://github.com/kevinslin/dendronv2/commit/7ca010bcfb1217b8ef3facbb47d69315207aff3a))
- show node descriptions ([e08fce9](https://github.com/kevinslin/dendronv2/commit/e08fce994153e28fe504b85e6d9bc1f5fdd93e20))
- show schema recommendations when no suggestions are available ([98aa467](https://github.com/kevinslin/dendronv2/commit/98aa4672297a754b695a3c965d8af9603e8a3724))
- show schema suggestion at same level as query ([14e73fd](https://github.com/kevinslin/dendronv2/commit/14e73fd8c35a0ec01818ab5f8e20835351716dc2))

## [0.3.6](https://github.com/kevinslin/dendronv2/compare/v0.3.5...v0.3.6) (2020-07-07)

### Features

- auto add nodes when deleted or created outside of dendron ([a7e1ac9](https://github.com/kevinslin/dendronv2/commit/a7e1ac9b8a4f7f0592ab1b9f86a7a40182693a73))
- os specific keybindings ([0b49cb9](https://github.com/kevinslin/dendronv2/commit/0b49cb99e27148e88747876e4cbebd8d0ac7bba6))
- support automatic config updates ([82ea9a2](https://github.com/kevinslin/dendronv2/commit/82ea9a2abe03c7ec98990f596c05402b7cebb5af))

## [0.3.5](https://github.com/kevinslin/dendronv2/compare/v0.3.4...v0.3.5) (2020-07-07)

### Features

- update logo ([8eeb6a3](https://github.com/kevinslin/dendronv2/commit/8eeb6a3b6f5a54d558ee8ebaa635139fbbbc3631))

## [0.3.2](https://github.com/kevinslin/dendronv2/compare/v0.3.1...v0.3.2) (2020-07-07)

### Features

- add delete note shortcut ([0ba99a7](https://github.com/kevinslin/dendronv2/commit/0ba99a7d2d73fcddae3633703312fc0ad14e179d))
- delete, abort or work inside existing folder when creating new workbench ([06d2dbe](https://github.com/kevinslin/dendronv2/commit/06d2dbe55ee99c5e2c8c60a152c6294d05fa5c91))
- update first time onboarding ([d0958c0](https://github.com/kevinslin/dendronv2/commit/d0958c02d4f356f6eacc7e37d2f24c485a9af8fc))

## [0.3.1](https://github.com/kevinslin/dendronv2/compare/v0.3.0...v0.3.1) (2020-07-05)

### Features

- add material theme ([c9f8082](https://github.com/kevinslin/dendronv2/commit/c9f808288470015070d585146e593b55a80c4f82))

# [0.3.0](https://github.com/kevinslin/dendronv2/compare/v0.2.20...v0.3.0) (2020-07-05)

### Bug Fixes

- issue with create new note not updating ([502b5e6](https://github.com/kevinslin/dendronv2/commit/502b5e62ed51a50ef3dccde95806c3a83a026628))
- no flickering when surfacing "create new" suggestion ([5b765bf](https://github.com/kevinslin/dendronv2/commit/5b765bf2d33893484784be25851c324900829e6a))

### Features

- initialize workbench with autosave ([34eb272](https://github.com/kevinslin/dendronv2/commit/34eb2723d8f32adba2daf1fee7c687df7bfdd592))
- match namespace schemas ([1a960bf](https://github.com/kevinslin/dendronv2/commit/1a960bf26f8984e541b3eb118f60bdc09d8250fe))
- show schema suggestions ([5680a74](https://github.com/kevinslin/dendronv2/commit/5680a7426f35b0c43680d8b3b0011dfc0eb0d6f1))
- show schema with results ([5d7294d](https://github.com/kevinslin/dendronv2/commit/5d7294dfab1b5e4c177dd1c95d504ffcaafd09d0))
- surface unknown schemas ([9bf4d0e](https://github.com/kevinslin/dendronv2/commit/9bf4d0e61cce2f76bddae1f686f29474201466cb))

## [0.2.20](https://github.com/kevinslin/dendronv2/compare/v0.2.19...v0.2.20) (2020-07-04)

**Note:** Version bump only for package root
