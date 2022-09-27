# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# 0.114.0 (2022-09-27)


### Bug Fixes

* **workspace:** engine init with note candidates enabled ([8b6fe7f](https://github.com/dendronhq/dendron/commit/8b6fe7fb8367ca972d56ffde32676373bafad079))





## 0.113.1 (2022-09-20)


### Bug Fixes

* **workspace:** wikilinks appear broken + pod fixes ([#3532](https://github.com/dendronhq/dendron/issues/3532)) ([fe07e60](https://github.com/dendronhq/dendron/commit/fe07e60fc44432d95184c0a6d0cf2ea6a2e22c6d))





# 0.113.0 (2022-09-20)


### Bug Fixes

* **sync:** next js export pod error ([#3539](https://github.com/dendronhq/dendron/issues/3539)) ([7a2aafc](https://github.com/dendronhq/dendron/commit/7a2aafce71000c636285f456f7d8f315a3aeb02f))





## [0.112.1](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.112.1) (2022-09-15)


### Bug Fixes

* **views:** fix mermaid diagrams ([#3503](https://github.com/dendronhq/dendron/issues/3503)) ([f5715f9](https://github.com/dendronhq/dendron/commit/f5715f92dff084f59ca8ae67bcf167e7f15e28e0))
* giscuss integration ([#3474](https://github.com/dendronhq/dendron/issues/3474)) ([b9cffec](https://github.com/dendronhq/dendron/commit/b9cffecd6fa4ce423b0f415fb20f0a8d1111bdd4))


### Features Dendron

* **publish:** adds configuration for sidebar ([#3448](https://github.com/dendronhq/dendron/issues/3448)) ([b67eb4a](https://github.com/dendronhq/dendron/commit/b67eb4a5da8c0167723eb725e6ef9351f7f3c845))
* **workspace:** code workspaces support ([#3343](https://github.com/dendronhq/dendron/issues/3343)) ([ac62ab7](https://github.com/dendronhq/dendron/commit/ac62ab71be81b61bcb14281b0c24c222c22f7232))
* **workspace:** preview for web extension ([#3462](https://github.com/dendronhq/dendron/issues/3462)) ([88f38ed](https://github.com/dendronhq/dendron/commit/88f38ed9b4f28f949ee8b30384b6bdf62352d4cd))



# 0.106.0 (2022-08-02)


### Features Dendron

* **view:** add "Toggle PreviewLock"  command ([#3293](https://github.com/dendronhq/dendron/issues/3293)) ([368c938](https://github.com/dendronhq/dendron/commit/368c9389b23d5200b84928121a7157fe764df9b6)), closes [#2437](https://github.com/dendronhq/dendron/issues/2437)



## 0.105.2 (2022-07-28)


### Bug Fixes

* **publish:** renders consitent layout on mobile and non-mobile ([#3272](https://github.com/dendronhq/dendron/issues/3272)) ([eeeef9e](https://github.com/dendronhq/dendron/commit/eeeef9e0ae645e1191beda2610ca157df21f8c9f)), closes [#2175](https://github.com/dendronhq/dendron/issues/2175) [Layout#hier-2](https://github.com/Layout/issues/hier-2) [Layout#hier-2](https://github.com/Layout/issues/hier-2) [#2175](https://github.com/dendronhq/dendron/issues/2175)



## 0.104.1 (2022-07-21)



# 0.104.0 (2022-07-19)



# 0.101.0 (2022-06-28)



## 0.100.1 (2022-06-23)



# 0.100.0 (2022-06-21)


### Features Dendron

* **views:** depth for local graph ([494b648](https://github.com/dendronhq/dendron/commit/494b648dee70cc92caf7f490781e2a14bda3c297))



# 0.99.0 (2022-06-14)



# 0.98.0 (2022-06-07)



# 0.96.0 (2022-05-24)



## 0.95.1 (2022-05-18)



# 0.95.0 (2022-05-17)



# 0.94.0 (2022-05-10)



# 0.93.0 (2022-05-03)



## 0.92.1 (2022-04-28)


### Bug Fixes

* **view:** views don't update for new notes with self contained vaults ([#2790](https://github.com/dendronhq/dendron/issues/2790)) ([eac9b53](https://github.com/dendronhq/dendron/commit/eac9b53b5da3c9336b09c317caf56d800aacf4cc))



# 0.91.0 (2022-04-19)



# 0.88.0 (2022-03-29)


### Bug Fixes

* **views:** Pass in a port-forwarded URL to preview for remote workspaces ([#2624](https://github.com/dendronhq/dendron/issues/2624)) ([d2f460b](https://github.com/dendronhq/dendron/commit/d2f460b36d836ed187e9da9a67d9ca2d48102b87)), closes [#2606](https://github.com/dendronhq/dendron/issues/2606)
* ensure note title is always a string to avoid errors ([#2551](https://github.com/dendronhq/dendron/issues/2551)) ([5d93bd1](https://github.com/dendronhq/dendron/commit/5d93bd16b0bdeb9d29323b659f154bdf0b2dfec9)), closes [#2329](https://github.com/dendronhq/dendron/issues/2329)


### Reverts

* Revert "Pass in a port-forwarded URL to preview for remote workspaces" ([64f0cf6](https://github.com/dendronhq/dendron/commit/64f0cf678e0db7ac4e5533e24cfad8a6153ee9bf))



# 0.85.0 (2022-03-08)



# 0.84.0 (2022-03-01)


### Bug Fixes

* **publish:** properly render mermaid and katex when published ([#2480](https://github.com/dendronhq/dendron/issues/2480)) ([2524589](https://github.com/dendronhq/dendron/commit/2524589cbf016dff694bcc308dbf1ec1b7390570))
* faster webviews by reducing engine sync operations ([#2472](https://github.com/dendronhq/dendron/issues/2472)) ([a34a3b0](https://github.com/dendronhq/dendron/commit/a34a3b024411b1c2097b330938ceb9c3fe8c401e))



# 0.82.0 (2022-02-15)


### Bug Fixes

* **views:** engine events; update DendronTreeView reliably ([#2269](https://github.com/dendronhq/dendron/issues/2269)) ([147cce8](https://github.com/dendronhq/dendron/commit/147cce8ba31576cccb2f98c3c355ef2fdb2cb683))



# 0.79.0 (2022-01-25)


### Bug Fixes

* **views:** update tree order when a note changes order ([#2014](https://github.com/dendronhq/dendron/issues/2014)) ([b66032f](https://github.com/dendronhq/dendron/commit/b66032fef1b8cb5f7a6fa522a5e0ad14ac4d8388))


### Features Dendron

* lookup view ([#1977](https://github.com/dendronhq/dendron/issues/1977)) ([dad85f6](https://github.com/dendronhq/dendron/commit/dad85f6e1964b5cf21bc0a1007c229c504e17eb5))



# 0.72.0 (2021-12-07)


### Bug Fixes

* **pods:** invalid configuration error ([398a599](https://github.com/dendronhq/dendron/commit/398a5995fc594566131eb283ff989a877ca9c995))
* **publish:** enable katex on published site ([7189cd8](https://github.com/dendronhq/dendron/commit/7189cd840e12d7aadf6f78b9e3281180bca903af))
* **publish:** make mermaid work consistently on published sites ([2f648e0](https://github.com/dendronhq/dendron/commit/2f648e0a34c95095e86e8535a1fa8ec9ac4de39c))
* **views:** tree view not initializing on load ([5590a3c](https://github.com/dendronhq/dendron/commit/5590a3c0aa7476e8984a1e9193697d9984ab00ee))
* **views:** update web uis on note creation ([55a7ecd](https://github.com/dendronhq/dendron/commit/55a7ecd787461062f969804ef44b287af1cd05f5)), closes [/github.com/dendronhq/dendron-docs/blob/main/vault/pkg.dendron-plugin-views.dev.cook.md#L103](https://github.com//github.com/dendronhq/dendron-docs/blob/main/vault/pkg.dendron-plugin-views.dev.cook.md/issues/L103)
* **viwes:** `nav_order` property not respected in tree view ([fd328a1](https://github.com/dendronhq/dendron/commit/fd328a17478a063c2ea3d51e00fbc26c7e7e1b26))
* **workspace:** checks against fnames with all lowercase ([#1739](https://github.com/dendronhq/dendron/issues/1739)) ([8e3f8ec](https://github.com/dendronhq/dendron/commit/8e3f8ec061e0ce7d249a7e92902bb48e7c520793))


### Features Dendron

* **workspace:** better note previews ([#1666](https://github.com/dendronhq/dendron/issues/1666)) ([5cf7067](https://github.com/dendronhq/dendron/commit/5cf70672a24a62d528440f38b44813bfa627fb88))



## 0.62.3 (2021-10-09)


### Bug Fixes

* tree view order ([#1459](https://github.com/dendronhq/dendron/issues/1459)) ([b7955a2](https://github.com/dendronhq/dendron/commit/b7955a2cc43b383b05f7e39dde504a6b3e05ec2e)), closes [#440](https://github.com/dendronhq/dendron/issues/440)



# 0.61.0 (2021-09-28)


### Bug Fixes

* **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))



## 0.60.2 (2021-09-25)



## 0.60.2-alpha.0 (2021-09-24)



## 0.60.1 (2021-09-24)



# 0.60.0 (2021-09-21)


### Bug Fixes

* **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))


### Features Dendron

* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))



## 0.55.2 (2021-08-21)



## 0.55.1 (2021-08-17)


### Features Dendron

* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Features Dendron

* colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
* **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))





# 0.112.0 (2022-09-13)

**Note:** Version bump only for package @dendronhq/common-frontend





# 0.111.0 (2022-09-06)


### Bug Fixes

* **workspace:** tree view still displays if a note has no title ([#3490](https://github.com/dendronhq/dendron/issues/3490)) ([20d64f7](https://github.com/dendronhq/dendron/commit/20d64f77d8e8b8abafac4a4884cfeec97f6332e4))





## [0.110.1](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.110.1) (2022-08-31)


### Features Dendron

* **workspace:** code workspaces support ([#3343](https://github.com/dendronhq/dendron/issues/3343)) ([ac62ab7](https://github.com/dendronhq/dendron/commit/ac62ab71be81b61bcb14281b0c24c222c22f7232))



# 0.106.0 (2022-08-02)


### Features Dendron

* **view:** add "Toggle PreviewLock"  command ([#3293](https://github.com/dendronhq/dendron/issues/3293)) ([368c938](https://github.com/dendronhq/dendron/commit/368c9389b23d5200b84928121a7157fe764df9b6)), closes [#2437](https://github.com/dendronhq/dendron/issues/2437)



## 0.105.2 (2022-07-28)


### Bug Fixes

* **publish:** renders consitent layout on mobile and non-mobile ([#3272](https://github.com/dendronhq/dendron/issues/3272)) ([eeeef9e](https://github.com/dendronhq/dendron/commit/eeeef9e0ae645e1191beda2610ca157df21f8c9f)), closes [#2175](https://github.com/dendronhq/dendron/issues/2175) [Layout#hier-2](https://github.com/Layout/issues/hier-2) [Layout#hier-2](https://github.com/Layout/issues/hier-2) [#2175](https://github.com/dendronhq/dendron/issues/2175)



## 0.104.1 (2022-07-21)



# 0.104.0 (2022-07-19)



# 0.101.0 (2022-06-28)



## 0.100.1 (2022-06-23)



# 0.100.0 (2022-06-21)


### Features Dendron

* **views:** depth for local graph ([494b648](https://github.com/dendronhq/dendron/commit/494b648dee70cc92caf7f490781e2a14bda3c297))



# 0.99.0 (2022-06-14)



# 0.98.0 (2022-06-07)



# 0.96.0 (2022-05-24)



## 0.95.1 (2022-05-18)



# 0.95.0 (2022-05-17)



# 0.94.0 (2022-05-10)



# 0.93.0 (2022-05-03)



## 0.92.1 (2022-04-28)


### Bug Fixes

* **view:** views don't update for new notes with self contained vaults ([#2790](https://github.com/dendronhq/dendron/issues/2790)) ([eac9b53](https://github.com/dendronhq/dendron/commit/eac9b53b5da3c9336b09c317caf56d800aacf4cc))



# 0.91.0 (2022-04-19)



# 0.88.0 (2022-03-29)


### Bug Fixes

* **views:** Pass in a port-forwarded URL to preview for remote workspaces ([#2624](https://github.com/dendronhq/dendron/issues/2624)) ([d2f460b](https://github.com/dendronhq/dendron/commit/d2f460b36d836ed187e9da9a67d9ca2d48102b87)), closes [#2606](https://github.com/dendronhq/dendron/issues/2606)
* ensure note title is always a string to avoid errors ([#2551](https://github.com/dendronhq/dendron/issues/2551)) ([5d93bd1](https://github.com/dendronhq/dendron/commit/5d93bd16b0bdeb9d29323b659f154bdf0b2dfec9)), closes [#2329](https://github.com/dendronhq/dendron/issues/2329)


### Reverts

* Revert "Pass in a port-forwarded URL to preview for remote workspaces" ([64f0cf6](https://github.com/dendronhq/dendron/commit/64f0cf678e0db7ac4e5533e24cfad8a6153ee9bf))



# 0.85.0 (2022-03-08)



# 0.84.0 (2022-03-01)


### Bug Fixes

* **publish:** properly render mermaid and katex when published ([#2480](https://github.com/dendronhq/dendron/issues/2480)) ([2524589](https://github.com/dendronhq/dendron/commit/2524589cbf016dff694bcc308dbf1ec1b7390570))
* faster webviews by reducing engine sync operations ([#2472](https://github.com/dendronhq/dendron/issues/2472)) ([a34a3b0](https://github.com/dendronhq/dendron/commit/a34a3b024411b1c2097b330938ceb9c3fe8c401e))



# 0.82.0 (2022-02-15)


### Bug Fixes

* **views:** engine events; update DendronTreeView reliably ([#2269](https://github.com/dendronhq/dendron/issues/2269)) ([147cce8](https://github.com/dendronhq/dendron/commit/147cce8ba31576cccb2f98c3c355ef2fdb2cb683))



# 0.79.0 (2022-01-25)


### Bug Fixes

* **views:** update tree order when a note changes order ([#2014](https://github.com/dendronhq/dendron/issues/2014)) ([b66032f](https://github.com/dendronhq/dendron/commit/b66032fef1b8cb5f7a6fa522a5e0ad14ac4d8388))


### Features Dendron

* lookup view ([#1977](https://github.com/dendronhq/dendron/issues/1977)) ([dad85f6](https://github.com/dendronhq/dendron/commit/dad85f6e1964b5cf21bc0a1007c229c504e17eb5))



# 0.72.0 (2021-12-07)


### Bug Fixes

* **pods:** invalid configuration error ([398a599](https://github.com/dendronhq/dendron/commit/398a5995fc594566131eb283ff989a877ca9c995))
* **publish:** enable katex on published site ([7189cd8](https://github.com/dendronhq/dendron/commit/7189cd840e12d7aadf6f78b9e3281180bca903af))
* **publish:** make mermaid work consistently on published sites ([2f648e0](https://github.com/dendronhq/dendron/commit/2f648e0a34c95095e86e8535a1fa8ec9ac4de39c))
* **views:** tree view not initializing on load ([5590a3c](https://github.com/dendronhq/dendron/commit/5590a3c0aa7476e8984a1e9193697d9984ab00ee))
* **views:** update web uis on note creation ([55a7ecd](https://github.com/dendronhq/dendron/commit/55a7ecd787461062f969804ef44b287af1cd05f5)), closes [/github.com/dendronhq/dendron-docs/blob/main/vault/pkg.dendron-plugin-views.dev.cook.md#L103](https://github.com//github.com/dendronhq/dendron-docs/blob/main/vault/pkg.dendron-plugin-views.dev.cook.md/issues/L103)
* **viwes:** `nav_order` property not respected in tree view ([fd328a1](https://github.com/dendronhq/dendron/commit/fd328a17478a063c2ea3d51e00fbc26c7e7e1b26))
* **workspace:** checks against fnames with all lowercase ([#1739](https://github.com/dendronhq/dendron/issues/1739)) ([8e3f8ec](https://github.com/dendronhq/dendron/commit/8e3f8ec061e0ce7d249a7e92902bb48e7c520793))


### Features Dendron

* **workspace:** better note previews ([#1666](https://github.com/dendronhq/dendron/issues/1666)) ([5cf7067](https://github.com/dendronhq/dendron/commit/5cf70672a24a62d528440f38b44813bfa627fb88))



## 0.62.3 (2021-10-09)


### Bug Fixes

* tree view order ([#1459](https://github.com/dendronhq/dendron/issues/1459)) ([b7955a2](https://github.com/dendronhq/dendron/commit/b7955a2cc43b383b05f7e39dde504a6b3e05ec2e)), closes [#440](https://github.com/dendronhq/dendron/issues/440)



# 0.61.0 (2021-09-28)


### Bug Fixes

* **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))



## 0.60.2 (2021-09-25)



## 0.60.2-alpha.0 (2021-09-24)



## 0.60.1 (2021-09-24)



# 0.60.0 (2021-09-21)


### Bug Fixes

* **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))


### Features Dendron

* seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
* support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))



## 0.55.2 (2021-08-21)



## 0.55.1 (2021-08-17)


### Features Dendron

* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)


### Features Dendron

* colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
* **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))





# 0.110.0 (2022-08-30)

**Note:** Version bump only for package @dendronhq/common-frontend





## 0.109.1 (2022-08-25)

**Note:** Version bump only for package @dendronhq/common-frontend





# 0.109.0 (2022-08-23)

**Note:** Version bump only for package @dendronhq/common-frontend





# 0.108.0 (2022-08-16)


### Bug Fixes

* **views:** remove semicolon from preview ([#3383](https://github.com/dendronhq/dendron/issues/3383)) ([cd010cf](https://github.com/dendronhq/dendron/commit/cd010cf506613ec254c49383460be23e252f7842))





# 0.107.0 (2022-08-09)


### Bug Fixes

* **views:** resolve issues with preview lock button ([#3353](https://github.com/dendronhq/dendron/issues/3353)) ([3e270dc](https://github.com/dendronhq/dendron/commit/3e270dcce338cc2c986d86902061d8a162d3f80e))





# 0.106.0 (2022-08-02)

**Note:** Version bump only for package @dendronhq/common-frontend





## 0.105.2 (2022-07-28)

**Note:** Version bump only for package @dendronhq/common-frontend





## 0.105.1 (2022-07-27)

**Note:** Version bump only for package @dendronhq/common-frontend





# 0.105.0 (2022-07-26)

**Note:** Version bump only for package @dendronhq/common-frontend

## 0.104.1 (2022-07-21)

**Note:** Version bump only for package @dendronhq/common-frontend

# 0.104.0 (2022-07-19)

**Note:** Version bump only for package @dendronhq/common-frontend

# 0.103.0 (2022-07-12)

**Note:** Version bump only for package @dendronhq/common-frontend

## [0.102.1](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.102.1) (2022-07-05)

# 0.102.0 (2022-07-05)

# 0.101.0 (2022-06-28)

## 0.100.1 (2022-06-23)

# 0.100.0 (2022-06-21)

### Features Dendron

- **views:** depth for local graph ([494b648](https://github.com/dendronhq/dendron/commit/494b648dee70cc92caf7f490781e2a14bda3c297))

# 0.99.0 (2022-06-14)

# 0.98.0 (2022-06-07)

# 0.96.0 (2022-05-24)

## 0.95.1 (2022-05-18)

# 0.95.0 (2022-05-17)

# 0.94.0 (2022-05-10)

# 0.93.0 (2022-05-03)

## 0.92.1 (2022-04-28)

### Bug Fixes

- **view:** views don't update for new notes with self contained vaults ([#2790](https://github.com/dendronhq/dendron/issues/2790)) ([eac9b53](https://github.com/dendronhq/dendron/commit/eac9b53b5da3c9336b09c317caf56d800aacf4cc))

# 0.91.0 (2022-04-19)

# 0.88.0 (2022-03-29)

### Bug Fixes

- **views:** Pass in a port-forwarded URL to preview for remote workspaces ([#2624](https://github.com/dendronhq/dendron/issues/2624)) ([d2f460b](https://github.com/dendronhq/dendron/commit/d2f460b36d836ed187e9da9a67d9ca2d48102b87)), closes [#2606](https://github.com/dendronhq/dendron/issues/2606)
- ensure note title is always a string to avoid errors ([#2551](https://github.com/dendronhq/dendron/issues/2551)) ([5d93bd1](https://github.com/dendronhq/dendron/commit/5d93bd16b0bdeb9d29323b659f154bdf0b2dfec9)), closes [#2329](https://github.com/dendronhq/dendron/issues/2329)

### Reverts

- Revert "Pass in a port-forwarded URL to preview for remote workspaces" ([64f0cf6](https://github.com/dendronhq/dendron/commit/64f0cf678e0db7ac4e5533e24cfad8a6153ee9bf))

# 0.85.0 (2022-03-08)

# 0.84.0 (2022-03-01)

### Bug Fixes

- **publish:** properly render mermaid and katex when published ([#2480](https://github.com/dendronhq/dendron/issues/2480)) ([2524589](https://github.com/dendronhq/dendron/commit/2524589cbf016dff694bcc308dbf1ec1b7390570))
- faster webviews by reducing engine sync operations ([#2472](https://github.com/dendronhq/dendron/issues/2472)) ([a34a3b0](https://github.com/dendronhq/dendron/commit/a34a3b024411b1c2097b330938ceb9c3fe8c401e))

# 0.82.0 (2022-02-15)

### Bug Fixes

- **views:** engine events; update DendronTreeView reliably ([#2269](https://github.com/dendronhq/dendron/issues/2269)) ([147cce8](https://github.com/dendronhq/dendron/commit/147cce8ba31576cccb2f98c3c355ef2fdb2cb683))

# 0.79.0 (2022-01-25)

### Bug Fixes

- **views:** update tree order when a note changes order ([#2014](https://github.com/dendronhq/dendron/issues/2014)) ([b66032f](https://github.com/dendronhq/dendron/commit/b66032fef1b8cb5f7a6fa522a5e0ad14ac4d8388))

### Features Dendron

- lookup view ([#1977](https://github.com/dendronhq/dendron/issues/1977)) ([dad85f6](https://github.com/dendronhq/dendron/commit/dad85f6e1964b5cf21bc0a1007c229c504e17eb5))

# 0.72.0 (2021-12-07)

### Bug Fixes

- **pods:** invalid configuration error ([398a599](https://github.com/dendronhq/dendron/commit/398a5995fc594566131eb283ff989a877ca9c995))
- **publish:** enable katex on published site ([7189cd8](https://github.com/dendronhq/dendron/commit/7189cd840e12d7aadf6f78b9e3281180bca903af))
- **publish:** make mermaid work consistently on published sites ([2f648e0](https://github.com/dendronhq/dendron/commit/2f648e0a34c95095e86e8535a1fa8ec9ac4de39c))
- **views:** tree view not initializing on load ([5590a3c](https://github.com/dendronhq/dendron/commit/5590a3c0aa7476e8984a1e9193697d9984ab00ee))
- **views:** update web uis on note creation ([55a7ecd](https://github.com/dendronhq/dendron/commit/55a7ecd787461062f969804ef44b287af1cd05f5)), closes [/github.com/dendronhq/dendron-docs/blob/main/vault/pkg.dendron-plugin-views.dev.cook.md#L103](https://github.com//github.com/dendronhq/dendron-docs/blob/main/vault/pkg.dendron-plugin-views.dev.cook.md/issues/L103)
- **viwes:** `nav_order` property not respected in tree view ([fd328a1](https://github.com/dendronhq/dendron/commit/fd328a17478a063c2ea3d51e00fbc26c7e7e1b26))
- **workspace:** checks against fnames with all lowercase ([#1739](https://github.com/dendronhq/dendron/issues/1739)) ([8e3f8ec](https://github.com/dendronhq/dendron/commit/8e3f8ec061e0ce7d249a7e92902bb48e7c520793))

### Features Dendron

- **workspace:** better note previews ([#1666](https://github.com/dendronhq/dendron/issues/1666)) ([5cf7067](https://github.com/dendronhq/dendron/commit/5cf70672a24a62d528440f38b44813bfa627fb88))

## 0.62.3 (2021-10-09)

### Bug Fixes

- tree view order ([#1459](https://github.com/dendronhq/dendron/issues/1459)) ([b7955a2](https://github.com/dendronhq/dendron/commit/b7955a2cc43b383b05f7e39dde504a6b3e05ec2e)), closes [#440](https://github.com/dendronhq/dendron/issues/440)

# 0.61.0 (2021-09-28)

### Bug Fixes

- **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))

## 0.60.2 (2021-09-25)

## 0.60.2-alpha.0 (2021-09-24)

## 0.60.1 (2021-09-24)

# 0.60.0 (2021-09-21)

### Bug Fixes

- **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))

### Features Dendron

- seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
- support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))

## 0.55.2 (2021-08-21)

## 0.55.1 (2021-08-17)

### Features Dendron

- **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))

## 0.54.1 (2021-08-13)

### Features Dendron

- colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
- **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))

# 0.102.0 (2022-07-05)

**Note:** Version bump only for package @dendronhq/common-frontend

# 0.101.0 (2022-06-28)

### Bug Fixes

- **structure:** hot reload in note traits + no template by default ([3904655](https://github.com/dendronhq/dendron/commit/390465552a6744495387aea6f49fa5392fb69b03))

## 0.100.1 (2022-06-23)

**Note:** Version bump only for package @dendronhq/common-frontend

# 0.100.0 (2022-06-21)

### Bug Fixes

- **edit:** autocomplete issues with tags and mentions ([#3107](https://github.com/dendronhq/dendron/issues/3107)) ([01be85f](https://github.com/dendronhq/dendron/commit/01be85f84ae6cdf182f2d43b9561decac44369e6))

# 0.99.0 (2022-06-14)

**Note:** Version bump only for package @dendronhq/common-frontend

# 0.98.0 (2022-06-07)

**Note:** Version bump only for package @dendronhq/common-frontend

# 0.97.0 (2022-05-31)

**Note:** Version bump only for package @dendronhq/common-frontend

# 0.96.0 (2022-05-24)

**Note:** Version bump only for package @dendronhq/common-frontend

## 0.95.1 (2022-05-18)

**Note:** Version bump only for package @dendronhq/common-frontend

# 0.95.0 (2022-05-17)

**Note:** Version bump only for package @dendronhq/common-frontend

# 0.94.0 (2022-05-10)

**Note:** Version bump only for package @dendronhq/common-frontend

# 0.93.0 (2022-05-03)

### Features Dendron

- **views:** Dendron Side Panel ([#2832](https://github.com/dendronhq/dendron/issues/2832)) ([158ed1d](https://github.com/dendronhq/dendron/commit/158ed1d748448c611146900915c6299a0730bbf9))

## 0.92.1 (2022-04-28)

**Note:** Version bump only for package @dendronhq/common-frontend

# 0.92.0 (2022-04-26)

**Note:** Version bump only for package @dendronhq/common-frontend

# 0.91.0 (2022-04-19)

### Features Dendron

- **workspace:** Meeting Notes ([#2727](https://github.com/dendronhq/dendron/issues/2727)) ([8ea1d1b](https://github.com/dendronhq/dendron/commit/8ea1d1b8e6247fec3e636c26da3f98e047026a6b))

# 0.90.0 (2022-04-12)

### Bug Fixes

- malformed \_trackCommon arguments ([7e4bfa0](https://github.com/dendronhq/dendron/commit/7e4bfa0ea805ee74380052f560af21eee2c28169))

# 0.89.0 (2022-04-05)

**Note:** Version bump only for package @dendronhq/common-frontend

# 0.88.0 (2022-03-29)

**Note:** Version bump only for package @dendronhq/common-frontend

# 0.87.0 (2022-03-22)

### Bug Fixes

- Prevent fatal errors in Open Backup Command and Run Migration Command in native workspaces ([#2607](https://github.com/dendronhq/dendron/issues/2607)) ([dce17fe](https://github.com/dendronhq/dendron/commit/dce17fe293cf73016797257fd18e5f85c625a6a2))

## [0.86.1](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.86.1) (2022-03-15)

# 0.86.0 (2022-03-15)

# 0.85.0 (2022-03-08)

# 0.84.0 (2022-03-01)

### Bug Fixes

- **publish:** properly render mermaid and katex when published ([#2480](https://github.com/dendronhq/dendron/issues/2480)) ([2524589](https://github.com/dendronhq/dendron/commit/2524589cbf016dff694bcc308dbf1ec1b7390570))
- faster webviews by reducing engine sync operations ([#2472](https://github.com/dendronhq/dendron/issues/2472)) ([a34a3b0](https://github.com/dendronhq/dendron/commit/a34a3b024411b1c2097b330938ceb9c3fe8c401e))

# 0.82.0 (2022-02-15)

### Bug Fixes

- **views:** engine events; update DendronTreeView reliably ([#2269](https://github.com/dendronhq/dendron/issues/2269)) ([147cce8](https://github.com/dendronhq/dendron/commit/147cce8ba31576cccb2f98c3c355ef2fdb2cb683))

# 0.79.0 (2022-01-25)

### Bug Fixes

- **views:** update tree order when a note changes order ([#2014](https://github.com/dendronhq/dendron/issues/2014)) ([b66032f](https://github.com/dendronhq/dendron/commit/b66032fef1b8cb5f7a6fa522a5e0ad14ac4d8388))

### Features Dendron

- lookup view ([#1977](https://github.com/dendronhq/dendron/issues/1977)) ([dad85f6](https://github.com/dendronhq/dendron/commit/dad85f6e1964b5cf21bc0a1007c229c504e17eb5))

# 0.72.0 (2021-12-07)

### Bug Fixes

- **pods:** invalid configuration error ([398a599](https://github.com/dendronhq/dendron/commit/398a5995fc594566131eb283ff989a877ca9c995))
- **publish:** enable katex on published site ([7189cd8](https://github.com/dendronhq/dendron/commit/7189cd840e12d7aadf6f78b9e3281180bca903af))
- **publish:** make mermaid work consistently on published sites ([2f648e0](https://github.com/dendronhq/dendron/commit/2f648e0a34c95095e86e8535a1fa8ec9ac4de39c))
- **views:** tree view not initializing on load ([5590a3c](https://github.com/dendronhq/dendron/commit/5590a3c0aa7476e8984a1e9193697d9984ab00ee))
- **views:** update web uis on note creation ([55a7ecd](https://github.com/dendronhq/dendron/commit/55a7ecd787461062f969804ef44b287af1cd05f5)), closes [/github.com/dendronhq/dendron-docs/blob/main/vault/pkg.dendron-plugin-views.dev.cook.md#L103](https://github.com//github.com/dendronhq/dendron-docs/blob/main/vault/pkg.dendron-plugin-views.dev.cook.md/issues/L103)
- **viwes:** `nav_order` property not respected in tree view ([fd328a1](https://github.com/dendronhq/dendron/commit/fd328a17478a063c2ea3d51e00fbc26c7e7e1b26))
- **workspace:** checks against fnames with all lowercase ([#1739](https://github.com/dendronhq/dendron/issues/1739)) ([8e3f8ec](https://github.com/dendronhq/dendron/commit/8e3f8ec061e0ce7d249a7e92902bb48e7c520793))

### Features Dendron

- **workspace:** better note previews ([#1666](https://github.com/dendronhq/dendron/issues/1666)) ([5cf7067](https://github.com/dendronhq/dendron/commit/5cf70672a24a62d528440f38b44813bfa627fb88))

## 0.62.3 (2021-10-09)

### Bug Fixes

- tree view order ([#1459](https://github.com/dendronhq/dendron/issues/1459)) ([b7955a2](https://github.com/dendronhq/dendron/commit/b7955a2cc43b383b05f7e39dde504a6b3e05ec2e)), closes [#440](https://github.com/dendronhq/dendron/issues/440)

# 0.61.0 (2021-09-28)

### Bug Fixes

- **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))

## 0.60.2 (2021-09-25)

## 0.60.2-alpha.0 (2021-09-24)

## 0.60.1 (2021-09-24)

# 0.60.0 (2021-09-21)

### Bug Fixes

- **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))

### Features Dendron

- seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
- support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))

## 0.55.2 (2021-08-21)

## 0.55.1 (2021-08-17)

### Features Dendron

- **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))

## 0.54.1 (2021-08-13)

### Features Dendron

- colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
- **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))

# 0.86.0 (2022-03-15)

**Note:** Version bump only for package @dendronhq/common-frontend

# 0.85.0 (2022-03-08)

**Note:** Version bump only for package @dendronhq/common-frontend

# 0.84.0 (2022-03-01)

**Note:** Version bump only for package @dendronhq/common-frontend

# [0.83.0](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.83.0) (2022-02-22)

# 0.82.0 (2022-02-15)

### Bug Fixes

- **views:** engine events; update DendronTreeView reliably ([#2269](https://github.com/dendronhq/dendron/issues/2269)) ([147cce8](https://github.com/dendronhq/dendron/commit/147cce8ba31576cccb2f98c3c355ef2fdb2cb683))

# 0.79.0 (2022-01-25)

### Bug Fixes

- **views:** update tree order when a note changes order ([#2014](https://github.com/dendronhq/dendron/issues/2014)) ([b66032f](https://github.com/dendronhq/dendron/commit/b66032fef1b8cb5f7a6fa522a5e0ad14ac4d8388))

### Features Dendron

- lookup view ([#1977](https://github.com/dendronhq/dendron/issues/1977)) ([dad85f6](https://github.com/dendronhq/dendron/commit/dad85f6e1964b5cf21bc0a1007c229c504e17eb5))

# 0.72.0 (2021-12-07)

### Bug Fixes

- **pods:** invalid configuration error ([398a599](https://github.com/dendronhq/dendron/commit/398a5995fc594566131eb283ff989a877ca9c995))
- **publish:** enable katex on published site ([7189cd8](https://github.com/dendronhq/dendron/commit/7189cd840e12d7aadf6f78b9e3281180bca903af))
- **publish:** make mermaid work consistently on published sites ([2f648e0](https://github.com/dendronhq/dendron/commit/2f648e0a34c95095e86e8535a1fa8ec9ac4de39c))
- **views:** tree view not initializing on load ([5590a3c](https://github.com/dendronhq/dendron/commit/5590a3c0aa7476e8984a1e9193697d9984ab00ee))
- **views:** update web uis on note creation ([55a7ecd](https://github.com/dendronhq/dendron/commit/55a7ecd787461062f969804ef44b287af1cd05f5)), closes [/github.com/dendronhq/dendron-docs/blob/main/vault/pkg.dendron-plugin-views.dev.cook.md#L103](https://github.com//github.com/dendronhq/dendron-docs/blob/main/vault/pkg.dendron-plugin-views.dev.cook.md/issues/L103)
- **viwes:** `nav_order` property not respected in tree view ([fd328a1](https://github.com/dendronhq/dendron/commit/fd328a17478a063c2ea3d51e00fbc26c7e7e1b26))
- **workspace:** checks against fnames with all lowercase ([#1739](https://github.com/dendronhq/dendron/issues/1739)) ([8e3f8ec](https://github.com/dendronhq/dendron/commit/8e3f8ec061e0ce7d249a7e92902bb48e7c520793))

### Features Dendron

- **workspace:** better note previews ([#1666](https://github.com/dendronhq/dendron/issues/1666)) ([5cf7067](https://github.com/dendronhq/dendron/commit/5cf70672a24a62d528440f38b44813bfa627fb88))

## 0.62.3 (2021-10-09)

### Bug Fixes

- tree view order ([#1459](https://github.com/dendronhq/dendron/issues/1459)) ([b7955a2](https://github.com/dendronhq/dendron/commit/b7955a2cc43b383b05f7e39dde504a6b3e05ec2e)), closes [#440](https://github.com/dendronhq/dendron/issues/440)

# 0.61.0 (2021-09-28)

### Bug Fixes

- **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))

## 0.60.2 (2021-09-25)

## 0.60.2-alpha.0 (2021-09-24)

## 0.60.1 (2021-09-24)

# 0.60.0 (2021-09-21)

### Bug Fixes

- **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))

### Features Dendron

- seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
- support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))

## 0.55.2 (2021-08-21)

## 0.55.1 (2021-08-17)

### Features Dendron

- **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))

## 0.54.1 (2021-08-13)

### Features Dendron

- colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
- **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))

# 0.82.0 (2022-02-15)

**Note:** Version bump only for package @dendronhq/common-frontend

# 0.81.0 (2022-02-08)

### Bug Fixes

- **pod:** markdown import to update asset references ([#2350](https://github.com/dendronhq/dendron/issues/2350)) ([c22a322](https://github.com/dendronhq/dendron/commit/c22a322ce904da4157260e06cc14ffd07728042d))

# 0.80.0 (2022-02-01)

**Note:** Version bump only for package @dendronhq/common-frontend

# 0.79.0 (2022-01-25)

### Reverts

- Revert "fix(views): hover preview containing local images on Windows (#2047)" ([7890c01](https://github.com/dendronhq/dendron/commit/7890c0108253eee34cef84af0437a11856da7fc8)), closes [#2047](https://github.com/dendronhq/dendron/issues/2047)

## [0.78.4](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.78.4) (2022-01-20)

### Bug Fixes

- **views:** update tree order when a note changes order ([#2014](https://github.com/dendronhq/dendron/issues/2014)) ([b66032f](https://github.com/dendronhq/dendron/commit/b66032fef1b8cb5f7a6fa522a5e0ad14ac4d8388))

### Features Dendron

- lookup view ([#1977](https://github.com/dendronhq/dendron/issues/1977)) ([dad85f6](https://github.com/dendronhq/dendron/commit/dad85f6e1964b5cf21bc0a1007c229c504e17eb5))

# 0.72.0 (2021-12-07)

### Bug Fixes

- **pods:** invalid configuration error ([398a599](https://github.com/dendronhq/dendron/commit/398a5995fc594566131eb283ff989a877ca9c995))
- **publish:** enable katex on published site ([7189cd8](https://github.com/dendronhq/dendron/commit/7189cd840e12d7aadf6f78b9e3281180bca903af))
- **publish:** make mermaid work consistently on published sites ([2f648e0](https://github.com/dendronhq/dendron/commit/2f648e0a34c95095e86e8535a1fa8ec9ac4de39c))
- **views:** tree view not initializing on load ([5590a3c](https://github.com/dendronhq/dendron/commit/5590a3c0aa7476e8984a1e9193697d9984ab00ee))
- **views:** update web uis on note creation ([55a7ecd](https://github.com/dendronhq/dendron/commit/55a7ecd787461062f969804ef44b287af1cd05f5)), closes [/github.com/dendronhq/dendron-docs/blob/main/vault/pkg.dendron-plugin-views.dev.cook.md#L103](https://github.com//github.com/dendronhq/dendron-docs/blob/main/vault/pkg.dendron-plugin-views.dev.cook.md/issues/L103)
- **viwes:** `nav_order` property not respected in tree view ([fd328a1](https://github.com/dendronhq/dendron/commit/fd328a17478a063c2ea3d51e00fbc26c7e7e1b26))
- **workspace:** checks against fnames with all lowercase ([#1739](https://github.com/dendronhq/dendron/issues/1739)) ([8e3f8ec](https://github.com/dendronhq/dendron/commit/8e3f8ec061e0ce7d249a7e92902bb48e7c520793))

### Features Dendron

- **workspace:** better note previews ([#1666](https://github.com/dendronhq/dendron/issues/1666)) ([5cf7067](https://github.com/dendronhq/dendron/commit/5cf70672a24a62d528440f38b44813bfa627fb88))

## 0.62.3 (2021-10-09)

### Bug Fixes

- tree view order ([#1459](https://github.com/dendronhq/dendron/issues/1459)) ([b7955a2](https://github.com/dendronhq/dendron/commit/b7955a2cc43b383b05f7e39dde504a6b3e05ec2e)), closes [#440](https://github.com/dendronhq/dendron/issues/440)

# 0.61.0 (2021-09-28)

### Bug Fixes

- **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))

## 0.60.2 (2021-09-25)

## 0.60.2-alpha.0 (2021-09-24)

## 0.60.1 (2021-09-24)

# 0.60.0 (2021-09-21)

### Bug Fixes

- **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))

### Features Dendron

- seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
- support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))

## 0.55.2 (2021-08-21)

## 0.55.1 (2021-08-17)

### Features Dendron

- **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))

## 0.54.1 (2021-08-13)

### Features Dendron

- colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
- **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))

## [0.78.3](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.78.3) (2022-01-20)

### Bug Fixes

- **views:** update tree order when a note changes order ([#2014](https://github.com/dendronhq/dendron/issues/2014)) ([b66032f](https://github.com/dendronhq/dendron/commit/b66032fef1b8cb5f7a6fa522a5e0ad14ac4d8388))

### Features Dendron

- lookup view ([#1977](https://github.com/dendronhq/dendron/issues/1977)) ([dad85f6](https://github.com/dendronhq/dendron/commit/dad85f6e1964b5cf21bc0a1007c229c504e17eb5))

# 0.72.0 (2021-12-07)

### Bug Fixes

- **pods:** invalid configuration error ([398a599](https://github.com/dendronhq/dendron/commit/398a5995fc594566131eb283ff989a877ca9c995))
- **publish:** enable katex on published site ([7189cd8](https://github.com/dendronhq/dendron/commit/7189cd840e12d7aadf6f78b9e3281180bca903af))
- **publish:** make mermaid work consistently on published sites ([2f648e0](https://github.com/dendronhq/dendron/commit/2f648e0a34c95095e86e8535a1fa8ec9ac4de39c))
- **views:** tree view not initializing on load ([5590a3c](https://github.com/dendronhq/dendron/commit/5590a3c0aa7476e8984a1e9193697d9984ab00ee))
- **views:** update web uis on note creation ([55a7ecd](https://github.com/dendronhq/dendron/commit/55a7ecd787461062f969804ef44b287af1cd05f5)), closes [/github.com/dendronhq/dendron-docs/blob/main/vault/pkg.dendron-plugin-views.dev.cook.md#L103](https://github.com//github.com/dendronhq/dendron-docs/blob/main/vault/pkg.dendron-plugin-views.dev.cook.md/issues/L103)
- **viwes:** `nav_order` property not respected in tree view ([fd328a1](https://github.com/dendronhq/dendron/commit/fd328a17478a063c2ea3d51e00fbc26c7e7e1b26))
- **workspace:** checks against fnames with all lowercase ([#1739](https://github.com/dendronhq/dendron/issues/1739)) ([8e3f8ec](https://github.com/dendronhq/dendron/commit/8e3f8ec061e0ce7d249a7e92902bb48e7c520793))

### Features Dendron

- **workspace:** better note previews ([#1666](https://github.com/dendronhq/dendron/issues/1666)) ([5cf7067](https://github.com/dendronhq/dendron/commit/5cf70672a24a62d528440f38b44813bfa627fb88))

## 0.62.3 (2021-10-09)

### Bug Fixes

- tree view order ([#1459](https://github.com/dendronhq/dendron/issues/1459)) ([b7955a2](https://github.com/dendronhq/dendron/commit/b7955a2cc43b383b05f7e39dde504a6b3e05ec2e)), closes [#440](https://github.com/dendronhq/dendron/issues/440)

# 0.61.0 (2021-09-28)

### Bug Fixes

- **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))

## 0.60.2 (2021-09-25)

## 0.60.2-alpha.0 (2021-09-24)

## 0.60.1 (2021-09-24)

# 0.60.0 (2021-09-21)

### Bug Fixes

- **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))

### Features Dendron

- seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
- support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))

## 0.55.2 (2021-08-21)

## 0.55.1 (2021-08-17)

### Features Dendron

- **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))

## 0.54.1 (2021-08-13)

### Features Dendron

- colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
- **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))

## [0.78.2](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.78.2) (2022-01-20)

### Bug Fixes

- **views:** update tree order when a note changes order ([#2014](https://github.com/dendronhq/dendron/issues/2014)) ([b66032f](https://github.com/dendronhq/dendron/commit/b66032fef1b8cb5f7a6fa522a5e0ad14ac4d8388))

### Features Dendron

- lookup view ([#1977](https://github.com/dendronhq/dendron/issues/1977)) ([dad85f6](https://github.com/dendronhq/dendron/commit/dad85f6e1964b5cf21bc0a1007c229c504e17eb5))

# 0.72.0 (2021-12-07)

### Bug Fixes

- **pods:** invalid configuration error ([398a599](https://github.com/dendronhq/dendron/commit/398a5995fc594566131eb283ff989a877ca9c995))
- **publish:** enable katex on published site ([7189cd8](https://github.com/dendronhq/dendron/commit/7189cd840e12d7aadf6f78b9e3281180bca903af))
- **publish:** make mermaid work consistently on published sites ([2f648e0](https://github.com/dendronhq/dendron/commit/2f648e0a34c95095e86e8535a1fa8ec9ac4de39c))
- **views:** tree view not initializing on load ([5590a3c](https://github.com/dendronhq/dendron/commit/5590a3c0aa7476e8984a1e9193697d9984ab00ee))
- **views:** update web uis on note creation ([55a7ecd](https://github.com/dendronhq/dendron/commit/55a7ecd787461062f969804ef44b287af1cd05f5)), closes [/github.com/dendronhq/dendron-docs/blob/main/vault/pkg.dendron-plugin-views.dev.cook.md#L103](https://github.com//github.com/dendronhq/dendron-docs/blob/main/vault/pkg.dendron-plugin-views.dev.cook.md/issues/L103)
- **viwes:** `nav_order` property not respected in tree view ([fd328a1](https://github.com/dendronhq/dendron/commit/fd328a17478a063c2ea3d51e00fbc26c7e7e1b26))
- **workspace:** checks against fnames with all lowercase ([#1739](https://github.com/dendronhq/dendron/issues/1739)) ([8e3f8ec](https://github.com/dendronhq/dendron/commit/8e3f8ec061e0ce7d249a7e92902bb48e7c520793))

### Features Dendron

- **workspace:** better note previews ([#1666](https://github.com/dendronhq/dendron/issues/1666)) ([5cf7067](https://github.com/dendronhq/dendron/commit/5cf70672a24a62d528440f38b44813bfa627fb88))

## 0.62.3 (2021-10-09)

### Bug Fixes

- tree view order ([#1459](https://github.com/dendronhq/dendron/issues/1459)) ([b7955a2](https://github.com/dendronhq/dendron/commit/b7955a2cc43b383b05f7e39dde504a6b3e05ec2e)), closes [#440](https://github.com/dendronhq/dendron/issues/440)

# 0.61.0 (2021-09-28)

### Bug Fixes

- **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))

## 0.60.2 (2021-09-25)

## 0.60.2-alpha.0 (2021-09-24)

## 0.60.1 (2021-09-24)

# 0.60.0 (2021-09-21)

### Bug Fixes

- **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))

### Features Dendron

- seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
- support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))

## 0.55.2 (2021-08-21)

## 0.55.1 (2021-08-17)

### Features Dendron

- **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))

## 0.54.1 (2021-08-13)

### Features Dendron

- colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
- **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))

## [0.78.1](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.78.1) (2022-01-19)

### Bug Fixes

- **views:** update tree order when a note changes order ([#2014](https://github.com/dendronhq/dendron/issues/2014)) ([b66032f](https://github.com/dendronhq/dendron/commit/b66032fef1b8cb5f7a6fa522a5e0ad14ac4d8388))

### Features Dendron

- lookup view ([#1977](https://github.com/dendronhq/dendron/issues/1977)) ([dad85f6](https://github.com/dendronhq/dendron/commit/dad85f6e1964b5cf21bc0a1007c229c504e17eb5))

# 0.72.0 (2021-12-07)

### Bug Fixes

- **pods:** invalid configuration error ([398a599](https://github.com/dendronhq/dendron/commit/398a5995fc594566131eb283ff989a877ca9c995))
- **publish:** enable katex on published site ([7189cd8](https://github.com/dendronhq/dendron/commit/7189cd840e12d7aadf6f78b9e3281180bca903af))
- **publish:** make mermaid work consistently on published sites ([2f648e0](https://github.com/dendronhq/dendron/commit/2f648e0a34c95095e86e8535a1fa8ec9ac4de39c))
- **views:** tree view not initializing on load ([5590a3c](https://github.com/dendronhq/dendron/commit/5590a3c0aa7476e8984a1e9193697d9984ab00ee))
- **views:** update web uis on note creation ([55a7ecd](https://github.com/dendronhq/dendron/commit/55a7ecd787461062f969804ef44b287af1cd05f5)), closes [/github.com/dendronhq/dendron-docs/blob/main/vault/pkg.dendron-plugin-views.dev.cook.md#L103](https://github.com//github.com/dendronhq/dendron-docs/blob/main/vault/pkg.dendron-plugin-views.dev.cook.md/issues/L103)
- **viwes:** `nav_order` property not respected in tree view ([fd328a1](https://github.com/dendronhq/dendron/commit/fd328a17478a063c2ea3d51e00fbc26c7e7e1b26))
- **workspace:** checks against fnames with all lowercase ([#1739](https://github.com/dendronhq/dendron/issues/1739)) ([8e3f8ec](https://github.com/dendronhq/dendron/commit/8e3f8ec061e0ce7d249a7e92902bb48e7c520793))

### Features Dendron

- **workspace:** better note previews ([#1666](https://github.com/dendronhq/dendron/issues/1666)) ([5cf7067](https://github.com/dendronhq/dendron/commit/5cf70672a24a62d528440f38b44813bfa627fb88))

## 0.62.3 (2021-10-09)

### Bug Fixes

- tree view order ([#1459](https://github.com/dendronhq/dendron/issues/1459)) ([b7955a2](https://github.com/dendronhq/dendron/commit/b7955a2cc43b383b05f7e39dde504a6b3e05ec2e)), closes [#440](https://github.com/dendronhq/dendron/issues/440)

# 0.61.0 (2021-09-28)

### Bug Fixes

- **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))

## 0.60.2 (2021-09-25)

## 0.60.2-alpha.0 (2021-09-24)

## 0.60.1 (2021-09-24)

# 0.60.0 (2021-09-21)

### Bug Fixes

- **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))

### Features Dendron

- seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
- support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))

## 0.55.2 (2021-08-21)

## 0.55.1 (2021-08-17)

### Features Dendron

- **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))

## 0.54.1 (2021-08-13)

### Features Dendron

- colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
- **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))

# 0.78.0 (2022-01-18)

**Note:** Version bump only for package @dendronhq/common-frontend

## [0.77.1](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.77.1) (2022-01-12)

### Bug Fixes

- **views:** update tree order when a note changes order ([#2014](https://github.com/dendronhq/dendron/issues/2014)) ([b66032f](https://github.com/dendronhq/dendron/commit/b66032fef1b8cb5f7a6fa522a5e0ad14ac4d8388))

### Features Dendron

- lookup view ([#1977](https://github.com/dendronhq/dendron/issues/1977)) ([dad85f6](https://github.com/dendronhq/dendron/commit/dad85f6e1964b5cf21bc0a1007c229c504e17eb5))

# 0.72.0 (2021-12-07)

### Bug Fixes

- **pods:** invalid configuration error ([398a599](https://github.com/dendronhq/dendron/commit/398a5995fc594566131eb283ff989a877ca9c995))
- **publish:** enable katex on published site ([7189cd8](https://github.com/dendronhq/dendron/commit/7189cd840e12d7aadf6f78b9e3281180bca903af))
- **publish:** make mermaid work consistently on published sites ([2f648e0](https://github.com/dendronhq/dendron/commit/2f648e0a34c95095e86e8535a1fa8ec9ac4de39c))
- **views:** tree view not initializing on load ([5590a3c](https://github.com/dendronhq/dendron/commit/5590a3c0aa7476e8984a1e9193697d9984ab00ee))
- **views:** update web uis on note creation ([55a7ecd](https://github.com/dendronhq/dendron/commit/55a7ecd787461062f969804ef44b287af1cd05f5)), closes [/github.com/dendronhq/dendron-docs/blob/main/vault/pkg.dendron-plugin-views.dev.cook.md#L103](https://github.com//github.com/dendronhq/dendron-docs/blob/main/vault/pkg.dendron-plugin-views.dev.cook.md/issues/L103)
- **viwes:** `nav_order` property not respected in tree view ([fd328a1](https://github.com/dendronhq/dendron/commit/fd328a17478a063c2ea3d51e00fbc26c7e7e1b26))
- **workspace:** checks against fnames with all lowercase ([#1739](https://github.com/dendronhq/dendron/issues/1739)) ([8e3f8ec](https://github.com/dendronhq/dendron/commit/8e3f8ec061e0ce7d249a7e92902bb48e7c520793))

### Features Dendron

- **workspace:** better note previews ([#1666](https://github.com/dendronhq/dendron/issues/1666)) ([5cf7067](https://github.com/dendronhq/dendron/commit/5cf70672a24a62d528440f38b44813bfa627fb88))

## 0.62.3 (2021-10-09)

### Bug Fixes

- tree view order ([#1459](https://github.com/dendronhq/dendron/issues/1459)) ([b7955a2](https://github.com/dendronhq/dendron/commit/b7955a2cc43b383b05f7e39dde504a6b3e05ec2e)), closes [#440](https://github.com/dendronhq/dendron/issues/440)

# 0.61.0 (2021-09-28)

### Bug Fixes

- **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))

## 0.60.2 (2021-09-25)

## 0.60.2-alpha.0 (2021-09-24)

## 0.60.1 (2021-09-24)

# 0.60.0 (2021-09-21)

### Bug Fixes

- **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))

### Features Dendron

- seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
- support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))

## 0.55.2 (2021-08-21)

## 0.55.1 (2021-08-17)

### Features Dendron

- **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))

## 0.54.1 (2021-08-13)

### Features Dendron

- colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
- **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))

# [0.77.0](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.77.0) (2022-01-11)

### Bug Fixes

- **views:** update tree order when a note changes order ([#2014](https://github.com/dendronhq/dendron/issues/2014)) ([b66032f](https://github.com/dendronhq/dendron/commit/b66032fef1b8cb5f7a6fa522a5e0ad14ac4d8388))

### Features Dendron

- lookup view ([#1977](https://github.com/dendronhq/dendron/issues/1977)) ([dad85f6](https://github.com/dendronhq/dendron/commit/dad85f6e1964b5cf21bc0a1007c229c504e17eb5))

# 0.72.0 (2021-12-07)

### Bug Fixes

- **pods:** invalid configuration error ([398a599](https://github.com/dendronhq/dendron/commit/398a5995fc594566131eb283ff989a877ca9c995))
- **publish:** enable katex on published site ([7189cd8](https://github.com/dendronhq/dendron/commit/7189cd840e12d7aadf6f78b9e3281180bca903af))
- **publish:** make mermaid work consistently on published sites ([2f648e0](https://github.com/dendronhq/dendron/commit/2f648e0a34c95095e86e8535a1fa8ec9ac4de39c))
- **views:** tree view not initializing on load ([5590a3c](https://github.com/dendronhq/dendron/commit/5590a3c0aa7476e8984a1e9193697d9984ab00ee))
- **views:** update web uis on note creation ([55a7ecd](https://github.com/dendronhq/dendron/commit/55a7ecd787461062f969804ef44b287af1cd05f5)), closes [/github.com/dendronhq/dendron-docs/blob/main/vault/pkg.dendron-plugin-views.dev.cook.md#L103](https://github.com//github.com/dendronhq/dendron-docs/blob/main/vault/pkg.dendron-plugin-views.dev.cook.md/issues/L103)
- **viwes:** `nav_order` property not respected in tree view ([fd328a1](https://github.com/dendronhq/dendron/commit/fd328a17478a063c2ea3d51e00fbc26c7e7e1b26))
- **workspace:** checks against fnames with all lowercase ([#1739](https://github.com/dendronhq/dendron/issues/1739)) ([8e3f8ec](https://github.com/dendronhq/dendron/commit/8e3f8ec061e0ce7d249a7e92902bb48e7c520793))

### Features Dendron

- **workspace:** better note previews ([#1666](https://github.com/dendronhq/dendron/issues/1666)) ([5cf7067](https://github.com/dendronhq/dendron/commit/5cf70672a24a62d528440f38b44813bfa627fb88))

## 0.62.3 (2021-10-09)

### Bug Fixes

- tree view order ([#1459](https://github.com/dendronhq/dendron/issues/1459)) ([b7955a2](https://github.com/dendronhq/dendron/commit/b7955a2cc43b383b05f7e39dde504a6b3e05ec2e)), closes [#440](https://github.com/dendronhq/dendron/issues/440)

# 0.61.0 (2021-09-28)

### Bug Fixes

- **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))

## 0.60.2 (2021-09-25)

## 0.60.2-alpha.0 (2021-09-24)

## 0.60.1 (2021-09-24)

# 0.60.0 (2021-09-21)

### Bug Fixes

- **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))

### Features Dendron

- seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
- support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))

## 0.55.2 (2021-08-21)

## 0.55.1 (2021-08-17)

### Features Dendron

- **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))

## 0.54.1 (2021-08-13)

### Features Dendron

- colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
- **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))

# 0.76.0 (2022-01-04)

**Note:** Version bump only for package @dendronhq/common-frontend

# [0.75.0](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.75.0) (2021-12-28)

# 0.72.0 (2021-12-07)

### Bug Fixes

- **pods:** invalid configuration error ([398a599](https://github.com/dendronhq/dendron/commit/398a5995fc594566131eb283ff989a877ca9c995))
- **publish:** enable katex on published site ([7189cd8](https://github.com/dendronhq/dendron/commit/7189cd840e12d7aadf6f78b9e3281180bca903af))
- **publish:** make mermaid work consistently on published sites ([2f648e0](https://github.com/dendronhq/dendron/commit/2f648e0a34c95095e86e8535a1fa8ec9ac4de39c))
- **views:** tree view not initializing on load ([5590a3c](https://github.com/dendronhq/dendron/commit/5590a3c0aa7476e8984a1e9193697d9984ab00ee))
- **views:** update web uis on note creation ([55a7ecd](https://github.com/dendronhq/dendron/commit/55a7ecd787461062f969804ef44b287af1cd05f5)), closes [/github.com/dendronhq/dendron-docs/blob/main/vault/pkg.dendron-plugin-views.dev.cook.md#L103](https://github.com//github.com/dendronhq/dendron-docs/blob/main/vault/pkg.dendron-plugin-views.dev.cook.md/issues/L103)
- **viwes:** `nav_order` property not respected in tree view ([fd328a1](https://github.com/dendronhq/dendron/commit/fd328a17478a063c2ea3d51e00fbc26c7e7e1b26))
- **workspace:** checks against fnames with all lowercase ([#1739](https://github.com/dendronhq/dendron/issues/1739)) ([8e3f8ec](https://github.com/dendronhq/dendron/commit/8e3f8ec061e0ce7d249a7e92902bb48e7c520793))

### Features Dendron

- **workspace:** better note previews ([#1666](https://github.com/dendronhq/dendron/issues/1666)) ([5cf7067](https://github.com/dendronhq/dendron/commit/5cf70672a24a62d528440f38b44813bfa627fb88))

## 0.62.3 (2021-10-09)

### Bug Fixes

- tree view order ([#1459](https://github.com/dendronhq/dendron/issues/1459)) ([b7955a2](https://github.com/dendronhq/dendron/commit/b7955a2cc43b383b05f7e39dde504a6b3e05ec2e)), closes [#440](https://github.com/dendronhq/dendron/issues/440)

# 0.61.0 (2021-09-28)

### Bug Fixes

- **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))

## 0.60.2 (2021-09-25)

## 0.60.2-alpha.0 (2021-09-24)

## 0.60.1 (2021-09-24)

# 0.60.0 (2021-09-21)

### Bug Fixes

- **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))

### Features Dendron

- seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
- support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))

## 0.55.2 (2021-08-21)

## 0.55.1 (2021-08-17)

### Features Dendron

- **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))

## 0.54.1 (2021-08-13)

### Features Dendron

- colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
- **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))

# [0.74.0](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.74.0) (2021-12-21)

# 0.72.0 (2021-12-07)

### Bug Fixes

- **pods:** invalid configuration error ([398a599](https://github.com/dendronhq/dendron/commit/398a5995fc594566131eb283ff989a877ca9c995))
- **publish:** enable katex on published site ([7189cd8](https://github.com/dendronhq/dendron/commit/7189cd840e12d7aadf6f78b9e3281180bca903af))
- **publish:** make mermaid work consistently on published sites ([2f648e0](https://github.com/dendronhq/dendron/commit/2f648e0a34c95095e86e8535a1fa8ec9ac4de39c))
- **views:** tree view not initializing on load ([5590a3c](https://github.com/dendronhq/dendron/commit/5590a3c0aa7476e8984a1e9193697d9984ab00ee))
- **views:** update web uis on note creation ([55a7ecd](https://github.com/dendronhq/dendron/commit/55a7ecd787461062f969804ef44b287af1cd05f5)), closes [/github.com/dendronhq/dendron-docs/blob/main/vault/pkg.dendron-plugin-views.dev.cook.md#L103](https://github.com//github.com/dendronhq/dendron-docs/blob/main/vault/pkg.dendron-plugin-views.dev.cook.md/issues/L103)
- **viwes:** `nav_order` property not respected in tree view ([fd328a1](https://github.com/dendronhq/dendron/commit/fd328a17478a063c2ea3d51e00fbc26c7e7e1b26))
- **workspace:** checks against fnames with all lowercase ([#1739](https://github.com/dendronhq/dendron/issues/1739)) ([8e3f8ec](https://github.com/dendronhq/dendron/commit/8e3f8ec061e0ce7d249a7e92902bb48e7c520793))

### Features Dendron

- **workspace:** better note previews ([#1666](https://github.com/dendronhq/dendron/issues/1666)) ([5cf7067](https://github.com/dendronhq/dendron/commit/5cf70672a24a62d528440f38b44813bfa627fb88))

## 0.62.3 (2021-10-09)

### Bug Fixes

- tree view order ([#1459](https://github.com/dendronhq/dendron/issues/1459)) ([b7955a2](https://github.com/dendronhq/dendron/commit/b7955a2cc43b383b05f7e39dde504a6b3e05ec2e)), closes [#440](https://github.com/dendronhq/dendron/issues/440)

# 0.61.0 (2021-09-28)

### Bug Fixes

- **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))

## 0.60.2 (2021-09-25)

## 0.60.2-alpha.0 (2021-09-24)

## 0.60.1 (2021-09-24)

# 0.60.0 (2021-09-21)

### Bug Fixes

- **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))

### Features Dendron

- seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
- support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))

## 0.55.2 (2021-08-21)

## 0.55.1 (2021-08-17)

### Features Dendron

- **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))

## 0.54.1 (2021-08-13)

### Features Dendron

- colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
- **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))

## [0.73.1](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.73.1) (2021-12-15)

# 0.72.0 (2021-12-07)

### Bug Fixes

- **pods:** invalid configuration error ([398a599](https://github.com/dendronhq/dendron/commit/398a5995fc594566131eb283ff989a877ca9c995))
- **publish:** enable katex on published site ([7189cd8](https://github.com/dendronhq/dendron/commit/7189cd840e12d7aadf6f78b9e3281180bca903af))
- **publish:** make mermaid work consistently on published sites ([2f648e0](https://github.com/dendronhq/dendron/commit/2f648e0a34c95095e86e8535a1fa8ec9ac4de39c))
- **views:** tree view not initializing on load ([5590a3c](https://github.com/dendronhq/dendron/commit/5590a3c0aa7476e8984a1e9193697d9984ab00ee))
- **views:** update web uis on note creation ([55a7ecd](https://github.com/dendronhq/dendron/commit/55a7ecd787461062f969804ef44b287af1cd05f5)), closes [/github.com/dendronhq/dendron-docs/blob/main/vault/pkg.dendron-plugin-views.dev.cook.md#L103](https://github.com//github.com/dendronhq/dendron-docs/blob/main/vault/pkg.dendron-plugin-views.dev.cook.md/issues/L103)
- **viwes:** `nav_order` property not respected in tree view ([fd328a1](https://github.com/dendronhq/dendron/commit/fd328a17478a063c2ea3d51e00fbc26c7e7e1b26))
- **workspace:** checks against fnames with all lowercase ([#1739](https://github.com/dendronhq/dendron/issues/1739)) ([8e3f8ec](https://github.com/dendronhq/dendron/commit/8e3f8ec061e0ce7d249a7e92902bb48e7c520793))

### Features Dendron

- **workspace:** better note previews ([#1666](https://github.com/dendronhq/dendron/issues/1666)) ([5cf7067](https://github.com/dendronhq/dendron/commit/5cf70672a24a62d528440f38b44813bfa627fb88))

## 0.62.3 (2021-10-09)

### Bug Fixes

- tree view order ([#1459](https://github.com/dendronhq/dendron/issues/1459)) ([b7955a2](https://github.com/dendronhq/dendron/commit/b7955a2cc43b383b05f7e39dde504a6b3e05ec2e)), closes [#440](https://github.com/dendronhq/dendron/issues/440)

# 0.61.0 (2021-09-28)

### Bug Fixes

- **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))

## 0.60.2 (2021-09-25)

## 0.60.2-alpha.0 (2021-09-24)

## 0.60.1 (2021-09-24)

# 0.60.0 (2021-09-21)

### Bug Fixes

- **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))

### Features Dendron

- seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
- support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))

## 0.55.2 (2021-08-21)

## 0.55.1 (2021-08-17)

### Features Dendron

- **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))

## 0.54.1 (2021-08-13)

### Features Dendron

- colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
- **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))

# [0.73.0](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.73.0) (2021-12-14)

# 0.72.0 (2021-12-07)

### Bug Fixes

- **pods:** invalid configuration error ([398a599](https://github.com/dendronhq/dendron/commit/398a5995fc594566131eb283ff989a877ca9c995))
- **publish:** enable katex on published site ([7189cd8](https://github.com/dendronhq/dendron/commit/7189cd840e12d7aadf6f78b9e3281180bca903af))
- **publish:** make mermaid work consistently on published sites ([2f648e0](https://github.com/dendronhq/dendron/commit/2f648e0a34c95095e86e8535a1fa8ec9ac4de39c))
- **views:** tree view not initializing on load ([5590a3c](https://github.com/dendronhq/dendron/commit/5590a3c0aa7476e8984a1e9193697d9984ab00ee))
- **views:** update web uis on note creation ([55a7ecd](https://github.com/dendronhq/dendron/commit/55a7ecd787461062f969804ef44b287af1cd05f5)), closes [/github.com/dendronhq/dendron-docs/blob/main/vault/pkg.dendron-plugin-views.dev.cook.md#L103](https://github.com//github.com/dendronhq/dendron-docs/blob/main/vault/pkg.dendron-plugin-views.dev.cook.md/issues/L103)
- **viwes:** `nav_order` property not respected in tree view ([fd328a1](https://github.com/dendronhq/dendron/commit/fd328a17478a063c2ea3d51e00fbc26c7e7e1b26))
- **workspace:** checks against fnames with all lowercase ([#1739](https://github.com/dendronhq/dendron/issues/1739)) ([8e3f8ec](https://github.com/dendronhq/dendron/commit/8e3f8ec061e0ce7d249a7e92902bb48e7c520793))

### Features Dendron

- **workspace:** better note previews ([#1666](https://github.com/dendronhq/dendron/issues/1666)) ([5cf7067](https://github.com/dendronhq/dendron/commit/5cf70672a24a62d528440f38b44813bfa627fb88))

## 0.62.3 (2021-10-09)

### Bug Fixes

- tree view order ([#1459](https://github.com/dendronhq/dendron/issues/1459)) ([b7955a2](https://github.com/dendronhq/dendron/commit/b7955a2cc43b383b05f7e39dde504a6b3e05ec2e)), closes [#440](https://github.com/dendronhq/dendron/issues/440)

# 0.61.0 (2021-09-28)

### Bug Fixes

- **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))

## 0.60.2 (2021-09-25)

## 0.60.2-alpha.0 (2021-09-24)

## 0.60.1 (2021-09-24)

# 0.60.0 (2021-09-21)

### Bug Fixes

- **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))

### Features Dendron

- seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
- support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))

## 0.55.2 (2021-08-21)

## 0.55.1 (2021-08-17)

### Features Dendron

- **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))

## 0.54.1 (2021-08-13)

### Features Dendron

- colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
- **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))

# 0.72.0 (2021-12-07)

### Bug Fixes

- **views:** update webview title name ([16d1f0c](https://github.com/dendronhq/dendron/commit/16d1f0c2454e4056d56d988aa909c2ea70cf18b1))

## [0.71.3](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.71.3) (2021-11-30)

### Bug Fixes

- **pods:** invalid configuration error ([398a599](https://github.com/dendronhq/dendron/commit/398a5995fc594566131eb283ff989a877ca9c995))
- **publish:** enable katex on published site ([7189cd8](https://github.com/dendronhq/dendron/commit/7189cd840e12d7aadf6f78b9e3281180bca903af))
- **publish:** make mermaid work consistently on published sites ([2f648e0](https://github.com/dendronhq/dendron/commit/2f648e0a34c95095e86e8535a1fa8ec9ac4de39c))
- **viwes:** `nav_order` property not respected in tree view ([fd328a1](https://github.com/dendronhq/dendron/commit/fd328a17478a063c2ea3d51e00fbc26c7e7e1b26))
- **workspace:** checks against fnames with all lowercase ([#1739](https://github.com/dendronhq/dendron/issues/1739)) ([8e3f8ec](https://github.com/dendronhq/dendron/commit/8e3f8ec061e0ce7d249a7e92902bb48e7c520793))

### Features Dendron

- **workspace:** better note previews ([#1666](https://github.com/dendronhq/dendron/issues/1666)) ([5cf7067](https://github.com/dendronhq/dendron/commit/5cf70672a24a62d528440f38b44813bfa627fb88))

## 0.62.3 (2021-10-09)

### Bug Fixes

- tree view order ([#1459](https://github.com/dendronhq/dendron/issues/1459)) ([b7955a2](https://github.com/dendronhq/dendron/commit/b7955a2cc43b383b05f7e39dde504a6b3e05ec2e)), closes [#440](https://github.com/dendronhq/dendron/issues/440)

# 0.61.0 (2021-09-28)

### Bug Fixes

- **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))

## 0.60.2 (2021-09-25)

## 0.60.2-alpha.0 (2021-09-24)

## 0.60.1 (2021-09-24)

# 0.60.0 (2021-09-21)

### Bug Fixes

- **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))

### Features Dendron

- seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
- support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))

## 0.55.2 (2021-08-21)

## 0.55.1 (2021-08-17)

### Features Dendron

- **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))

## 0.54.1 (2021-08-13)

### Features Dendron

- colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
- **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))

## [0.71.2](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.71.2) (2021-11-30)

### Bug Fixes

- **pods:** invalid configuration error ([398a599](https://github.com/dendronhq/dendron/commit/398a5995fc594566131eb283ff989a877ca9c995))
- **publish:** enable katex on published site ([7189cd8](https://github.com/dendronhq/dendron/commit/7189cd840e12d7aadf6f78b9e3281180bca903af))
- **publish:** make mermaid work consistently on published sites ([2f648e0](https://github.com/dendronhq/dendron/commit/2f648e0a34c95095e86e8535a1fa8ec9ac4de39c))
- **viwes:** `nav_order` property not respected in tree view ([fd328a1](https://github.com/dendronhq/dendron/commit/fd328a17478a063c2ea3d51e00fbc26c7e7e1b26))
- **workspace:** checks against fnames with all lowercase ([#1739](https://github.com/dendronhq/dendron/issues/1739)) ([8e3f8ec](https://github.com/dendronhq/dendron/commit/8e3f8ec061e0ce7d249a7e92902bb48e7c520793))

### Features Dendron

- **workspace:** better note previews ([#1666](https://github.com/dendronhq/dendron/issues/1666)) ([5cf7067](https://github.com/dendronhq/dendron/commit/5cf70672a24a62d528440f38b44813bfa627fb88))

## 0.62.3 (2021-10-09)

### Bug Fixes

- tree view order ([#1459](https://github.com/dendronhq/dendron/issues/1459)) ([b7955a2](https://github.com/dendronhq/dendron/commit/b7955a2cc43b383b05f7e39dde504a6b3e05ec2e)), closes [#440](https://github.com/dendronhq/dendron/issues/440)

# 0.61.0 (2021-09-28)

### Bug Fixes

- **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))

## 0.60.2 (2021-09-25)

## 0.60.2-alpha.0 (2021-09-24)

## 0.60.1 (2021-09-24)

# 0.60.0 (2021-09-21)

### Bug Fixes

- **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))

### Features Dendron

- seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
- support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))

## 0.55.2 (2021-08-21)

## 0.55.1 (2021-08-17)

### Features Dendron

- **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))

## 0.54.1 (2021-08-13)

### Features Dendron

- colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
- **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))

## [0.71.1](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.71.1) (2021-11-30)

### Bug Fixes

- **pods:** invalid configuration error ([398a599](https://github.com/dendronhq/dendron/commit/398a5995fc594566131eb283ff989a877ca9c995))
- **publish:** enable katex on published site ([7189cd8](https://github.com/dendronhq/dendron/commit/7189cd840e12d7aadf6f78b9e3281180bca903af))
- **publish:** make mermaid work consistently on published sites ([2f648e0](https://github.com/dendronhq/dendron/commit/2f648e0a34c95095e86e8535a1fa8ec9ac4de39c))
- **viwes:** `nav_order` property not respected in tree view ([fd328a1](https://github.com/dendronhq/dendron/commit/fd328a17478a063c2ea3d51e00fbc26c7e7e1b26))
- **workspace:** checks against fnames with all lowercase ([#1739](https://github.com/dendronhq/dendron/issues/1739)) ([8e3f8ec](https://github.com/dendronhq/dendron/commit/8e3f8ec061e0ce7d249a7e92902bb48e7c520793))

### Features Dendron

- **workspace:** better note previews ([#1666](https://github.com/dendronhq/dendron/issues/1666)) ([5cf7067](https://github.com/dendronhq/dendron/commit/5cf70672a24a62d528440f38b44813bfa627fb88))

## 0.62.3 (2021-10-09)

### Bug Fixes

- tree view order ([#1459](https://github.com/dendronhq/dendron/issues/1459)) ([b7955a2](https://github.com/dendronhq/dendron/commit/b7955a2cc43b383b05f7e39dde504a6b3e05ec2e)), closes [#440](https://github.com/dendronhq/dendron/issues/440)

# 0.61.0 (2021-09-28)

### Bug Fixes

- **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))

## 0.60.2 (2021-09-25)

## 0.60.2-alpha.0 (2021-09-24)

## 0.60.1 (2021-09-24)

# 0.60.0 (2021-09-21)

### Bug Fixes

- **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))

### Features Dendron

- seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
- support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))

## 0.55.2 (2021-08-21)

## 0.55.1 (2021-08-17)

### Features Dendron

- **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))

## 0.54.1 (2021-08-13)

### Features Dendron

- colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
- **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))

# 0.71.0 (2021-11-30)

**Note:** Version bump only for package @dendronhq/common-frontend

## [0.70.1](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.70.1) (2021-11-26)

### Bug Fixes

- **pods:** invalid configuration error ([398a599](https://github.com/dendronhq/dendron/commit/398a5995fc594566131eb283ff989a877ca9c995))
- **publish:** enable katex on published site ([7189cd8](https://github.com/dendronhq/dendron/commit/7189cd840e12d7aadf6f78b9e3281180bca903af))
- **publish:** make mermaid work consistently on published sites ([2f648e0](https://github.com/dendronhq/dendron/commit/2f648e0a34c95095e86e8535a1fa8ec9ac4de39c))
- **viwes:** `nav_order` property not respected in tree view ([fd328a1](https://github.com/dendronhq/dendron/commit/fd328a17478a063c2ea3d51e00fbc26c7e7e1b26))
- **workspace:** checks against fnames with all lowercase ([#1739](https://github.com/dendronhq/dendron/issues/1739)) ([8e3f8ec](https://github.com/dendronhq/dendron/commit/8e3f8ec061e0ce7d249a7e92902bb48e7c520793))

### Features Dendron

- **workspace:** better note previews ([#1666](https://github.com/dendronhq/dendron/issues/1666)) ([5cf7067](https://github.com/dendronhq/dendron/commit/5cf70672a24a62d528440f38b44813bfa627fb88))

## 0.62.3 (2021-10-09)

### Bug Fixes

- tree view order ([#1459](https://github.com/dendronhq/dendron/issues/1459)) ([b7955a2](https://github.com/dendronhq/dendron/commit/b7955a2cc43b383b05f7e39dde504a6b3e05ec2e)), closes [#440](https://github.com/dendronhq/dendron/issues/440)

# 0.61.0 (2021-09-28)

### Bug Fixes

- **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))

## 0.60.2 (2021-09-25)

## 0.60.2-alpha.0 (2021-09-24)

## 0.60.1 (2021-09-24)

# 0.60.0 (2021-09-21)

### Bug Fixes

- **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))

### Features Dendron

- seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
- support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))

## 0.55.2 (2021-08-21)

## 0.55.1 (2021-08-17)

### Features Dendron

- **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))

## 0.54.1 (2021-08-13)

### Features Dendron

- colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
- **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))

# [0.70.0](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.70.0) (2021-11-23)

### Bug Fixes

- **pods:** invalid configuration error ([398a599](https://github.com/dendronhq/dendron/commit/398a5995fc594566131eb283ff989a877ca9c995))
- **publish:** enable katex on published site ([7189cd8](https://github.com/dendronhq/dendron/commit/7189cd840e12d7aadf6f78b9e3281180bca903af))
- **publish:** make mermaid work consistently on published sites ([2f648e0](https://github.com/dendronhq/dendron/commit/2f648e0a34c95095e86e8535a1fa8ec9ac4de39c))
- **viwes:** `nav_order` property not respected in tree view ([fd328a1](https://github.com/dendronhq/dendron/commit/fd328a17478a063c2ea3d51e00fbc26c7e7e1b26))
- **workspace:** checks against fnames with all lowercase ([#1739](https://github.com/dendronhq/dendron/issues/1739)) ([8e3f8ec](https://github.com/dendronhq/dendron/commit/8e3f8ec061e0ce7d249a7e92902bb48e7c520793))

### Features Dendron

- **workspace:** better note previews ([#1666](https://github.com/dendronhq/dendron/issues/1666)) ([5cf7067](https://github.com/dendronhq/dendron/commit/5cf70672a24a62d528440f38b44813bfa627fb88))

## 0.62.3 (2021-10-09)

### Bug Fixes

- tree view order ([#1459](https://github.com/dendronhq/dendron/issues/1459)) ([b7955a2](https://github.com/dendronhq/dendron/commit/b7955a2cc43b383b05f7e39dde504a6b3e05ec2e)), closes [#440](https://github.com/dendronhq/dendron/issues/440)

# 0.61.0 (2021-09-28)

### Bug Fixes

- **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))

## 0.60.2 (2021-09-25)

## 0.60.2-alpha.0 (2021-09-24)

## 0.60.1 (2021-09-24)

# 0.60.0 (2021-09-21)

### Bug Fixes

- **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))

### Features Dendron

- seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
- support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))

## 0.55.2 (2021-08-21)

## 0.55.1 (2021-08-17)

### Features Dendron

- **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))

## 0.54.1 (2021-08-13)

### Features Dendron

- colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
- **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))

## [0.69.3-alpha.0](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.69.3-alpha.0) (2021-11-22)

### Bug Fixes

- **pods:** invalid configuration error ([398a599](https://github.com/dendronhq/dendron/commit/398a5995fc594566131eb283ff989a877ca9c995))
- **publish:** enable katex on published site ([7189cd8](https://github.com/dendronhq/dendron/commit/7189cd840e12d7aadf6f78b9e3281180bca903af))
- **publish:** make mermaid work consistently on published sites ([2f648e0](https://github.com/dendronhq/dendron/commit/2f648e0a34c95095e86e8535a1fa8ec9ac4de39c))
- **viwes:** `nav_order` property not respected in tree view ([fd328a1](https://github.com/dendronhq/dendron/commit/fd328a17478a063c2ea3d51e00fbc26c7e7e1b26))
- **workspace:** checks against fnames with all lowercase ([#1739](https://github.com/dendronhq/dendron/issues/1739)) ([8e3f8ec](https://github.com/dendronhq/dendron/commit/8e3f8ec061e0ce7d249a7e92902bb48e7c520793))

### Features Dendron

- **workspace:** better note previews ([#1666](https://github.com/dendronhq/dendron/issues/1666)) ([5cf7067](https://github.com/dendronhq/dendron/commit/5cf70672a24a62d528440f38b44813bfa627fb88))

## 0.62.3 (2021-10-09)

### Bug Fixes

- tree view order ([#1459](https://github.com/dendronhq/dendron/issues/1459)) ([b7955a2](https://github.com/dendronhq/dendron/commit/b7955a2cc43b383b05f7e39dde504a6b3e05ec2e)), closes [#440](https://github.com/dendronhq/dendron/issues/440)

# 0.61.0 (2021-09-28)

### Bug Fixes

- **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))

## 0.60.2 (2021-09-25)

## 0.60.2-alpha.0 (2021-09-24)

## 0.60.1 (2021-09-24)

# 0.60.0 (2021-09-21)

### Bug Fixes

- **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))

### Features Dendron

- seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
- support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))

## 0.55.2 (2021-08-21)

## 0.55.1 (2021-08-17)

### Features Dendron

- **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))

## 0.54.1 (2021-08-13)

### Features Dendron

- colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
- **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))

## [0.69.2](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.69.2) (2021-11-19)

### Bug Fixes

- **pods:** invalid configuration error ([398a599](https://github.com/dendronhq/dendron/commit/398a5995fc594566131eb283ff989a877ca9c995))
- **viwes:** `nav_order` property not respected in tree view ([fd328a1](https://github.com/dendronhq/dendron/commit/fd328a17478a063c2ea3d51e00fbc26c7e7e1b26))

### Features Dendron

- **workspace:** better note previews ([#1666](https://github.com/dendronhq/dendron/issues/1666)) ([5cf7067](https://github.com/dendronhq/dendron/commit/5cf70672a24a62d528440f38b44813bfa627fb88))

## 0.62.3 (2021-10-09)

### Bug Fixes

- tree view order ([#1459](https://github.com/dendronhq/dendron/issues/1459)) ([b7955a2](https://github.com/dendronhq/dendron/commit/b7955a2cc43b383b05f7e39dde504a6b3e05ec2e)), closes [#440](https://github.com/dendronhq/dendron/issues/440)

# 0.61.0 (2021-09-28)

### Bug Fixes

- **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))

## 0.60.2 (2021-09-25)

## 0.60.2-alpha.0 (2021-09-24)

## 0.60.1 (2021-09-24)

# 0.60.0 (2021-09-21)

### Bug Fixes

- **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))

### Features Dendron

- seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
- support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))

## 0.55.2 (2021-08-21)

## 0.55.1 (2021-08-17)

### Features Dendron

- **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))

## 0.54.1 (2021-08-13)

### Features Dendron

- colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
- **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))

## [0.69.2-alpha.0](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.69.2-alpha.0) (2021-11-19)

### Bug Fixes

- **pods:** invalid configuration error ([398a599](https://github.com/dendronhq/dendron/commit/398a5995fc594566131eb283ff989a877ca9c995))
- **viwes:** `nav_order` property not respected in tree view ([fd328a1](https://github.com/dendronhq/dendron/commit/fd328a17478a063c2ea3d51e00fbc26c7e7e1b26))

### Features Dendron

- **workspace:** better note previews ([#1666](https://github.com/dendronhq/dendron/issues/1666)) ([5cf7067](https://github.com/dendronhq/dendron/commit/5cf70672a24a62d528440f38b44813bfa627fb88))

## 0.62.3 (2021-10-09)

### Bug Fixes

- tree view order ([#1459](https://github.com/dendronhq/dendron/issues/1459)) ([b7955a2](https://github.com/dendronhq/dendron/commit/b7955a2cc43b383b05f7e39dde504a6b3e05ec2e)), closes [#440](https://github.com/dendronhq/dendron/issues/440)

# 0.61.0 (2021-09-28)

### Bug Fixes

- **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))

## 0.60.2 (2021-09-25)

## 0.60.2-alpha.0 (2021-09-24)

## 0.60.1 (2021-09-24)

# 0.60.0 (2021-09-21)

### Bug Fixes

- **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))

### Features Dendron

- seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
- support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))

## 0.55.2 (2021-08-21)

## 0.55.1 (2021-08-17)

### Features Dendron

- **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))

## 0.54.1 (2021-08-13)

### Features Dendron

- colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
- **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))

## [0.69.1](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.69.1) (2021-11-16)

### Bug Fixes

- **viwes:** `nav_order` property not respected in tree view ([fd328a1](https://github.com/dendronhq/dendron/commit/fd328a17478a063c2ea3d51e00fbc26c7e7e1b26))

### Features Dendron

- **workspace:** better note previews ([#1666](https://github.com/dendronhq/dendron/issues/1666)) ([5cf7067](https://github.com/dendronhq/dendron/commit/5cf70672a24a62d528440f38b44813bfa627fb88))

## 0.62.3 (2021-10-09)

### Bug Fixes

- tree view order ([#1459](https://github.com/dendronhq/dendron/issues/1459)) ([b7955a2](https://github.com/dendronhq/dendron/commit/b7955a2cc43b383b05f7e39dde504a6b3e05ec2e)), closes [#440](https://github.com/dendronhq/dendron/issues/440)

# 0.61.0 (2021-09-28)

### Bug Fixes

- **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))

## 0.60.2 (2021-09-25)

## 0.60.2-alpha.0 (2021-09-24)

## 0.60.1 (2021-09-24)

# 0.60.0 (2021-09-21)

### Bug Fixes

- **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))

### Features Dendron

- seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
- support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))

## 0.55.2 (2021-08-21)

## 0.55.1 (2021-08-17)

### Features Dendron

- **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))

## 0.54.1 (2021-08-13)

### Features Dendron

- colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
- **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))

# [0.69.0](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.69.0) (2021-11-16)

### Bug Fixes

- **viwes:** `nav_order` property not respected in tree view ([fd328a1](https://github.com/dendronhq/dendron/commit/fd328a17478a063c2ea3d51e00fbc26c7e7e1b26))

### Features Dendron

- **workspace:** better note previews ([#1666](https://github.com/dendronhq/dendron/issues/1666)) ([5cf7067](https://github.com/dendronhq/dendron/commit/5cf70672a24a62d528440f38b44813bfa627fb88))

## 0.62.3 (2021-10-09)

### Bug Fixes

- tree view order ([#1459](https://github.com/dendronhq/dendron/issues/1459)) ([b7955a2](https://github.com/dendronhq/dendron/commit/b7955a2cc43b383b05f7e39dde504a6b3e05ec2e)), closes [#440](https://github.com/dendronhq/dendron/issues/440)

# 0.61.0 (2021-09-28)

### Bug Fixes

- **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))

## 0.60.2 (2021-09-25)

## 0.60.2-alpha.0 (2021-09-24)

## 0.60.1 (2021-09-24)

# 0.60.0 (2021-09-21)

### Bug Fixes

- **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))

### Features Dendron

- seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
- support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))

## 0.55.2 (2021-08-21)

## 0.55.1 (2021-08-17)

### Features Dendron

- **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))

## 0.54.1 (2021-08-13)

### Features Dendron

- colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
- **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))

## [0.68.2](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.68.2) (2021-11-12)

### Bug Fixes

- **viwes:** `nav_order` property not respected in tree view ([fd328a1](https://github.com/dendronhq/dendron/commit/fd328a17478a063c2ea3d51e00fbc26c7e7e1b26))

### Features Dendron

- **workspace:** better note previews ([#1666](https://github.com/dendronhq/dendron/issues/1666)) ([5cf7067](https://github.com/dendronhq/dendron/commit/5cf70672a24a62d528440f38b44813bfa627fb88))

## 0.62.3 (2021-10-09)

### Bug Fixes

- tree view order ([#1459](https://github.com/dendronhq/dendron/issues/1459)) ([b7955a2](https://github.com/dendronhq/dendron/commit/b7955a2cc43b383b05f7e39dde504a6b3e05ec2e)), closes [#440](https://github.com/dendronhq/dendron/issues/440)

# 0.61.0 (2021-09-28)

### Bug Fixes

- **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))

## 0.60.2 (2021-09-25)

## 0.60.2-alpha.0 (2021-09-24)

## 0.60.1 (2021-09-24)

# 0.60.0 (2021-09-21)

### Bug Fixes

- **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))

### Features Dendron

- seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
- support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))

## 0.55.2 (2021-08-21)

## 0.55.1 (2021-08-17)

### Features Dendron

- **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))

## 0.54.1 (2021-08-13)

### Features Dendron

- colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
- **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))

## [0.68.1](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.68.1) (2021-11-10)

### Bug Fixes

- **viwes:** `nav_order` property not respected in tree view ([fd328a1](https://github.com/dendronhq/dendron/commit/fd328a17478a063c2ea3d51e00fbc26c7e7e1b26))

### Features Dendron

- **workspace:** better note previews ([#1666](https://github.com/dendronhq/dendron/issues/1666)) ([5cf7067](https://github.com/dendronhq/dendron/commit/5cf70672a24a62d528440f38b44813bfa627fb88))

## 0.62.3 (2021-10-09)

### Bug Fixes

- tree view order ([#1459](https://github.com/dendronhq/dendron/issues/1459)) ([b7955a2](https://github.com/dendronhq/dendron/commit/b7955a2cc43b383b05f7e39dde504a6b3e05ec2e)), closes [#440](https://github.com/dendronhq/dendron/issues/440)

# 0.61.0 (2021-09-28)

### Bug Fixes

- **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))

## 0.60.2 (2021-09-25)

## 0.60.2-alpha.0 (2021-09-24)

## 0.60.1 (2021-09-24)

# 0.60.0 (2021-09-21)

### Bug Fixes

- **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))

### Features Dendron

- seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
- support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))

## 0.55.2 (2021-08-21)

## 0.55.1 (2021-08-17)

### Features Dendron

- **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))

## 0.54.1 (2021-08-13)

### Features Dendron

- colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
- **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))

# [0.68.0](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.68.0) (2021-11-09)

### Features Dendron

- **workspace:** better note previews ([#1666](https://github.com/dendronhq/dendron/issues/1666)) ([5cf7067](https://github.com/dendronhq/dendron/commit/5cf70672a24a62d528440f38b44813bfa627fb88))

## 0.62.3 (2021-10-09)

### Bug Fixes

- tree view order ([#1459](https://github.com/dendronhq/dendron/issues/1459)) ([b7955a2](https://github.com/dendronhq/dendron/commit/b7955a2cc43b383b05f7e39dde504a6b3e05ec2e)), closes [#440](https://github.com/dendronhq/dendron/issues/440)

# 0.61.0 (2021-09-28)

### Bug Fixes

- **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))

## 0.60.2 (2021-09-25)

## 0.60.2-alpha.0 (2021-09-24)

## 0.60.1 (2021-09-24)

# 0.60.0 (2021-09-21)

### Bug Fixes

- **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))

### Features Dendron

- seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
- support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))

## 0.55.2 (2021-08-21)

## 0.55.1 (2021-08-17)

### Features Dendron

- **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))

## 0.54.1 (2021-08-13)

### Features Dendron

- colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
- **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))

## [0.67.3-alpha.3](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.67.3-alpha.3) (2021-11-09)

## 0.62.3 (2021-10-09)

### Bug Fixes

- tree view order ([#1459](https://github.com/dendronhq/dendron/issues/1459)) ([b7955a2](https://github.com/dendronhq/dendron/commit/b7955a2cc43b383b05f7e39dde504a6b3e05ec2e)), closes [#440](https://github.com/dendronhq/dendron/issues/440)

# 0.61.0 (2021-09-28)

### Bug Fixes

- **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))

## 0.60.2 (2021-09-25)

## 0.60.2-alpha.0 (2021-09-24)

## 0.60.1 (2021-09-24)

# 0.60.0 (2021-09-21)

### Bug Fixes

- **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))

### Features Dendron

- seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
- support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))

## 0.55.2 (2021-08-21)

## 0.55.1 (2021-08-17)

### Features Dendron

- **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))

## 0.54.1 (2021-08-13)

### Features Dendron

- colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
- **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))

## [0.67.3-alpha.2](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.67.3-alpha.2) (2021-11-08)

## 0.62.3 (2021-10-09)

### Bug Fixes

- tree view order ([#1459](https://github.com/dendronhq/dendron/issues/1459)) ([b7955a2](https://github.com/dendronhq/dendron/commit/b7955a2cc43b383b05f7e39dde504a6b3e05ec2e)), closes [#440](https://github.com/dendronhq/dendron/issues/440)

# 0.61.0 (2021-09-28)

### Bug Fixes

- **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))

## 0.60.2 (2021-09-25)

## 0.60.2-alpha.0 (2021-09-24)

## 0.60.1 (2021-09-24)

# 0.60.0 (2021-09-21)

### Bug Fixes

- **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))

### Features Dendron

- seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
- support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))

## 0.55.2 (2021-08-21)

## 0.55.1 (2021-08-17)

### Features Dendron

- **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))

## 0.54.1 (2021-08-13)

### Features Dendron

- colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
- **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))

## [0.67.3-alpha.1](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.67.3-alpha.1) (2021-11-07)

## 0.62.3 (2021-10-09)

### Bug Fixes

- tree view order ([#1459](https://github.com/dendronhq/dendron/issues/1459)) ([b7955a2](https://github.com/dendronhq/dendron/commit/b7955a2cc43b383b05f7e39dde504a6b3e05ec2e)), closes [#440](https://github.com/dendronhq/dendron/issues/440)

# 0.61.0 (2021-09-28)

### Bug Fixes

- **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))

## 0.60.2 (2021-09-25)

## 0.60.2-alpha.0 (2021-09-24)

## 0.60.1 (2021-09-24)

# 0.60.0 (2021-09-21)

### Bug Fixes

- **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))

### Features Dendron

- seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
- support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))

## 0.55.2 (2021-08-21)

## 0.55.1 (2021-08-17)

### Features Dendron

- **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))

## 0.54.1 (2021-08-13)

### Features Dendron

- colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
- **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))

## [0.67.3-alpha.0](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.67.3-alpha.0) (2021-11-07)

## 0.62.3 (2021-10-09)

### Bug Fixes

- tree view order ([#1459](https://github.com/dendronhq/dendron/issues/1459)) ([b7955a2](https://github.com/dendronhq/dendron/commit/b7955a2cc43b383b05f7e39dde504a6b3e05ec2e)), closes [#440](https://github.com/dendronhq/dendron/issues/440)

# 0.61.0 (2021-09-28)

### Bug Fixes

- **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))

## 0.60.2 (2021-09-25)

## 0.60.2-alpha.0 (2021-09-24)

## 0.60.1 (2021-09-24)

# 0.60.0 (2021-09-21)

### Bug Fixes

- **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))

### Features Dendron

- seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
- support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))

## 0.55.2 (2021-08-21)

## 0.55.1 (2021-08-17)

### Features Dendron

- **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))

## 0.54.1 (2021-08-13)

### Features Dendron

- colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
- **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))

## [0.67.2](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.67.2) (2021-11-05)

## 0.62.3 (2021-10-09)

### Bug Fixes

- tree view order ([#1459](https://github.com/dendronhq/dendron/issues/1459)) ([b7955a2](https://github.com/dendronhq/dendron/commit/b7955a2cc43b383b05f7e39dde504a6b3e05ec2e)), closes [#440](https://github.com/dendronhq/dendron/issues/440)

# 0.61.0 (2021-09-28)

### Bug Fixes

- **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))

## 0.60.2 (2021-09-25)

## 0.60.2-alpha.0 (2021-09-24)

## 0.60.1 (2021-09-24)

# 0.60.0 (2021-09-21)

### Bug Fixes

- **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))

### Features Dendron

- seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
- support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))

## 0.55.2 (2021-08-21)

## 0.55.1 (2021-08-17)

### Features Dendron

- **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))

## 0.54.1 (2021-08-13)

### Features Dendron

- colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
- **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))

## [0.67.1](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.67.1) (2021-11-05)

## 0.62.3 (2021-10-09)

### Bug Fixes

- tree view order ([#1459](https://github.com/dendronhq/dendron/issues/1459)) ([b7955a2](https://github.com/dendronhq/dendron/commit/b7955a2cc43b383b05f7e39dde504a6b3e05ec2e)), closes [#440](https://github.com/dendronhq/dendron/issues/440)

# 0.61.0 (2021-09-28)

### Bug Fixes

- **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))

## 0.60.2 (2021-09-25)

## 0.60.2-alpha.0 (2021-09-24)

## 0.60.1 (2021-09-24)

# 0.60.0 (2021-09-21)

### Bug Fixes

- **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))

### Features Dendron

- seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
- support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))

## 0.55.2 (2021-08-21)

## 0.55.1 (2021-08-17)

### Features Dendron

- **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))

## 0.54.1 (2021-08-13)

### Features Dendron

- colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
- **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))

# [0.67.0](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.67.0) (2021-11-05)

## 0.62.3 (2021-10-09)

### Bug Fixes

- tree view order ([#1459](https://github.com/dendronhq/dendron/issues/1459)) ([b7955a2](https://github.com/dendronhq/dendron/commit/b7955a2cc43b383b05f7e39dde504a6b3e05ec2e)), closes [#440](https://github.com/dendronhq/dendron/issues/440)

# 0.61.0 (2021-09-28)

### Bug Fixes

- **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))

## 0.60.2 (2021-09-25)

## 0.60.2-alpha.0 (2021-09-24)

## 0.60.1 (2021-09-24)

# 0.60.0 (2021-09-21)

### Bug Fixes

- **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))

### Features Dendron

- seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
- support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))

## 0.55.2 (2021-08-21)

## 0.55.1 (2021-08-17)

### Features Dendron

- **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))

## 0.54.1 (2021-08-13)

### Features Dendron

- colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
- **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))

## [0.66.2](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.66.2) (2021-11-05)

## 0.62.3 (2021-10-09)

### Bug Fixes

- tree view order ([#1459](https://github.com/dendronhq/dendron/issues/1459)) ([b7955a2](https://github.com/dendronhq/dendron/commit/b7955a2cc43b383b05f7e39dde504a6b3e05ec2e)), closes [#440](https://github.com/dendronhq/dendron/issues/440)

# 0.61.0 (2021-09-28)

### Bug Fixes

- **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))

## 0.60.2 (2021-09-25)

## 0.60.2-alpha.0 (2021-09-24)

## 0.60.1 (2021-09-24)

# 0.60.0 (2021-09-21)

### Bug Fixes

- **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))

### Features Dendron

- seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
- support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))

## 0.55.2 (2021-08-21)

## 0.55.1 (2021-08-17)

### Features Dendron

- **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))

## 0.54.1 (2021-08-13)

### Features Dendron

- colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
- **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))

## [0.66.1](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.66.1) (2021-11-03)

## 0.62.3 (2021-10-09)

### Bug Fixes

- tree view order ([#1459](https://github.com/dendronhq/dendron/issues/1459)) ([b7955a2](https://github.com/dendronhq/dendron/commit/b7955a2cc43b383b05f7e39dde504a6b3e05ec2e)), closes [#440](https://github.com/dendronhq/dendron/issues/440)

# 0.61.0 (2021-09-28)

### Bug Fixes

- **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))

## 0.60.2 (2021-09-25)

## 0.60.2-alpha.0 (2021-09-24)

## 0.60.1 (2021-09-24)

# 0.60.0 (2021-09-21)

### Bug Fixes

- **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))

### Features Dendron

- seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
- support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))

## 0.55.2 (2021-08-21)

## 0.55.1 (2021-08-17)

### Features Dendron

- **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))

## 0.54.1 (2021-08-13)

### Features Dendron

- colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
- **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))

# [0.66.0](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.66.0) (2021-11-03)

## 0.62.3 (2021-10-09)

### Bug Fixes

- tree view order ([#1459](https://github.com/dendronhq/dendron/issues/1459)) ([b7955a2](https://github.com/dendronhq/dendron/commit/b7955a2cc43b383b05f7e39dde504a6b3e05ec2e)), closes [#440](https://github.com/dendronhq/dendron/issues/440)

# 0.61.0 (2021-09-28)

### Bug Fixes

- **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))

## 0.60.2 (2021-09-25)

## 0.60.2-alpha.0 (2021-09-24)

## 0.60.1 (2021-09-24)

# 0.60.0 (2021-09-21)

### Bug Fixes

- **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))

### Features Dendron

- seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
- support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))

## 0.55.2 (2021-08-21)

## 0.55.1 (2021-08-17)

### Features Dendron

- **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))

## 0.54.1 (2021-08-13)

### Features Dendron

- colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
- **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))

## [0.65.1](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.65.1) (2021-10-29)

## 0.62.3 (2021-10-09)

### Bug Fixes

- tree view order ([#1459](https://github.com/dendronhq/dendron/issues/1459)) ([b7955a2](https://github.com/dendronhq/dendron/commit/b7955a2cc43b383b05f7e39dde504a6b3e05ec2e)), closes [#440](https://github.com/dendronhq/dendron/issues/440)

# 0.61.0 (2021-09-28)

### Bug Fixes

- **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))

## 0.60.2 (2021-09-25)

## 0.60.2-alpha.0 (2021-09-24)

## 0.60.1 (2021-09-24)

# 0.60.0 (2021-09-21)

### Bug Fixes

- **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))

### Features Dendron

- seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
- support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))

## 0.55.2 (2021-08-21)

## 0.55.1 (2021-08-17)

### Features Dendron

- **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))

## 0.54.1 (2021-08-13)

### Features Dendron

- colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
- **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))

# [0.65.0](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.65.0) (2021-10-26)

## 0.62.3 (2021-10-09)

### Bug Fixes

- tree view order ([#1459](https://github.com/dendronhq/dendron/issues/1459)) ([b7955a2](https://github.com/dendronhq/dendron/commit/b7955a2cc43b383b05f7e39dde504a6b3e05ec2e)), closes [#440](https://github.com/dendronhq/dendron/issues/440)

# 0.61.0 (2021-09-28)

### Bug Fixes

- **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))

## 0.60.2 (2021-09-25)

## 0.60.2-alpha.0 (2021-09-24)

## 0.60.1 (2021-09-24)

# 0.60.0 (2021-09-21)

### Bug Fixes

- **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))

### Features Dendron

- seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
- support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))

## 0.55.2 (2021-08-21)

## 0.55.1 (2021-08-17)

### Features Dendron

- **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))

## 0.54.1 (2021-08-13)

### Features Dendron

- colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
- **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))

## [0.64.2](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.64.2) (2021-10-23)

## 0.62.3 (2021-10-09)

### Bug Fixes

- tree view order ([#1459](https://github.com/dendronhq/dendron/issues/1459)) ([b7955a2](https://github.com/dendronhq/dendron/commit/b7955a2cc43b383b05f7e39dde504a6b3e05ec2e)), closes [#440](https://github.com/dendronhq/dendron/issues/440)

# 0.61.0 (2021-09-28)

### Bug Fixes

- **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))

## 0.60.2 (2021-09-25)

## 0.60.2-alpha.0 (2021-09-24)

## 0.60.1 (2021-09-24)

# 0.60.0 (2021-09-21)

### Bug Fixes

- **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))

### Features Dendron

- seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
- support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))

## 0.55.2 (2021-08-21)

## 0.55.1 (2021-08-17)

### Features Dendron

- **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))

## 0.54.1 (2021-08-13)

### Features Dendron

- colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
- **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))

## [0.64.1](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.64.1) (2021-10-22)

## 0.62.3 (2021-10-09)

### Bug Fixes

- tree view order ([#1459](https://github.com/dendronhq/dendron/issues/1459)) ([b7955a2](https://github.com/dendronhq/dendron/commit/b7955a2cc43b383b05f7e39dde504a6b3e05ec2e)), closes [#440](https://github.com/dendronhq/dendron/issues/440)

# 0.61.0 (2021-09-28)

### Bug Fixes

- **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))

## 0.60.2 (2021-09-25)

## 0.60.2-alpha.0 (2021-09-24)

## 0.60.1 (2021-09-24)

# 0.60.0 (2021-09-21)

### Bug Fixes

- **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))

### Features Dendron

- seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
- support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))

## 0.55.2 (2021-08-21)

## 0.55.1 (2021-08-17)

### Features Dendron

- **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))

## 0.54.1 (2021-08-13)

### Features Dendron

- colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
- **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))

# [0.64.0](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.64.0) (2021-10-19)

## 0.62.3 (2021-10-09)

### Bug Fixes

- tree view order ([#1459](https://github.com/dendronhq/dendron/issues/1459)) ([b7955a2](https://github.com/dendronhq/dendron/commit/b7955a2cc43b383b05f7e39dde504a6b3e05ec2e)), closes [#440](https://github.com/dendronhq/dendron/issues/440)

# 0.61.0 (2021-09-28)

### Bug Fixes

- **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))

## 0.60.2 (2021-09-25)

## 0.60.2-alpha.0 (2021-09-24)

## 0.60.1 (2021-09-24)

# 0.60.0 (2021-09-21)

### Bug Fixes

- **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))

### Features Dendron

- seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
- support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))

## 0.55.2 (2021-08-21)

## 0.55.1 (2021-08-17)

### Features Dendron

- **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))

## 0.54.1 (2021-08-13)

### Features Dendron

- colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
- **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))

## [0.63.4-alpha.0](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.63.4-alpha.0) (2021-10-17)

## 0.62.3 (2021-10-09)

### Bug Fixes

- tree view order ([#1459](https://github.com/dendronhq/dendron/issues/1459)) ([b7955a2](https://github.com/dendronhq/dendron/commit/b7955a2cc43b383b05f7e39dde504a6b3e05ec2e)), closes [#440](https://github.com/dendronhq/dendron/issues/440)

# 0.61.0 (2021-09-28)

### Bug Fixes

- **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))

## 0.60.2 (2021-09-25)

## 0.60.2-alpha.0 (2021-09-24)

## 0.60.1 (2021-09-24)

# 0.60.0 (2021-09-21)

### Bug Fixes

- **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))

### Features Dendron

- seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
- support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))

## 0.55.2 (2021-08-21)

## 0.55.1 (2021-08-17)

### Features Dendron

- **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))

## 0.54.1 (2021-08-13)

### Features Dendron

- colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
- **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))

## [0.63.3](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.63.3) (2021-10-17)

## 0.62.3 (2021-10-09)

### Bug Fixes

- tree view order ([#1459](https://github.com/dendronhq/dendron/issues/1459)) ([b7955a2](https://github.com/dendronhq/dendron/commit/b7955a2cc43b383b05f7e39dde504a6b3e05ec2e)), closes [#440](https://github.com/dendronhq/dendron/issues/440)

# 0.61.0 (2021-09-28)

### Bug Fixes

- **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))

## 0.60.2 (2021-09-25)

## 0.60.2-alpha.0 (2021-09-24)

## 0.60.1 (2021-09-24)

# 0.60.0 (2021-09-21)

### Bug Fixes

- **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))

### Features Dendron

- seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
- support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))

## 0.55.2 (2021-08-21)

## 0.55.1 (2021-08-17)

### Features Dendron

- **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))

## 0.54.1 (2021-08-13)

### Features Dendron

- colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
- **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))

## [0.63.2](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.63.2) (2021-10-17)

## 0.62.3 (2021-10-09)

### Bug Fixes

- tree view order ([#1459](https://github.com/dendronhq/dendron/issues/1459)) ([b7955a2](https://github.com/dendronhq/dendron/commit/b7955a2cc43b383b05f7e39dde504a6b3e05ec2e)), closes [#440](https://github.com/dendronhq/dendron/issues/440)

# 0.61.0 (2021-09-28)

### Bug Fixes

- **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))

## 0.60.2 (2021-09-25)

## 0.60.2-alpha.0 (2021-09-24)

## 0.60.1 (2021-09-24)

# 0.60.0 (2021-09-21)

### Bug Fixes

- **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))

### Features Dendron

- seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
- support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))

## 0.55.2 (2021-08-21)

## 0.55.1 (2021-08-17)

### Features Dendron

- **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))

## 0.54.1 (2021-08-13)

### Features Dendron

- colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
- **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))

## [0.63.1](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.63.1) (2021-10-15)

## 0.62.3 (2021-10-09)

### Bug Fixes

- tree view order ([#1459](https://github.com/dendronhq/dendron/issues/1459)) ([b7955a2](https://github.com/dendronhq/dendron/commit/b7955a2cc43b383b05f7e39dde504a6b3e05ec2e)), closes [#440](https://github.com/dendronhq/dendron/issues/440)

# 0.61.0 (2021-09-28)

### Bug Fixes

- **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))

## 0.60.2 (2021-09-25)

## 0.60.2-alpha.0 (2021-09-24)

## 0.60.1 (2021-09-24)

# 0.60.0 (2021-09-21)

### Bug Fixes

- **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))

### Features Dendron

- seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
- support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))

## 0.55.2 (2021-08-21)

## 0.55.1 (2021-08-17)

### Features Dendron

- **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))

## 0.54.1 (2021-08-13)

### Features Dendron

- colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
- **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))

# [0.63.0](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.63.0) (2021-10-12)

## 0.62.3 (2021-10-09)

### Bug Fixes

- tree view order ([#1459](https://github.com/dendronhq/dendron/issues/1459)) ([b7955a2](https://github.com/dendronhq/dendron/commit/b7955a2cc43b383b05f7e39dde504a6b3e05ec2e)), closes [#440](https://github.com/dendronhq/dendron/issues/440)

# 0.61.0 (2021-09-28)

### Bug Fixes

- **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))

## 0.60.2 (2021-09-25)

## 0.60.2-alpha.0 (2021-09-24)

## 0.60.1 (2021-09-24)

# 0.60.0 (2021-09-21)

### Bug Fixes

- **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))

### Features Dendron

- seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
- support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))

## 0.55.2 (2021-08-21)

## 0.55.1 (2021-08-17)

### Features Dendron

- **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))

## 0.54.1 (2021-08-13)

### Features Dendron

- colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
- **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))

## [0.62.3](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.62.3) (2021-10-09)

### Bug Fixes

- tree view order ([#1459](https://github.com/dendronhq/dendron/issues/1459)) ([b7955a2](https://github.com/dendronhq/dendron/commit/b7955a2cc43b383b05f7e39dde504a6b3e05ec2e)), closes [#440](https://github.com/dendronhq/dendron/issues/440)

# 0.61.0 (2021-09-28)

### Bug Fixes

- **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))

## 0.60.2 (2021-09-25)

## 0.60.2-alpha.0 (2021-09-24)

## 0.60.1 (2021-09-24)

# 0.60.0 (2021-09-21)

### Bug Fixes

- **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))

### Features Dendron

- seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
- support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))

## 0.55.2 (2021-08-21)

## 0.55.1 (2021-08-17)

### Features Dendron

- **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))

## 0.54.1 (2021-08-13)

### Features Dendron

- colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
- **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))

## [0.62.2](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.62.2) (2021-10-08)

### Bug Fixes

- tree view order ([#1459](https://github.com/dendronhq/dendron/issues/1459)) ([b7955a2](https://github.com/dendronhq/dendron/commit/b7955a2cc43b383b05f7e39dde504a6b3e05ec2e)), closes [#440](https://github.com/dendronhq/dendron/issues/440)

# 0.61.0 (2021-09-28)

### Bug Fixes

- **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))

## 0.60.2 (2021-09-25)

## 0.60.2-alpha.0 (2021-09-24)

## 0.60.1 (2021-09-24)

# 0.60.0 (2021-09-21)

### Bug Fixes

- **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))

### Features Dendron

- seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
- support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))

## 0.55.2 (2021-08-21)

## 0.55.1 (2021-08-17)

### Features Dendron

- **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))

## 0.54.1 (2021-08-13)

### Features Dendron

- colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
- **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))

## [0.62.1](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.62.1) (2021-10-08)

### Bug Fixes

- tree view order ([#1459](https://github.com/dendronhq/dendron/issues/1459)) ([b7955a2](https://github.com/dendronhq/dendron/commit/b7955a2cc43b383b05f7e39dde504a6b3e05ec2e)), closes [#440](https://github.com/dendronhq/dendron/issues/440)

# 0.61.0 (2021-09-28)

### Bug Fixes

- **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))

## 0.60.2 (2021-09-25)

## 0.60.2-alpha.0 (2021-09-24)

## 0.60.1 (2021-09-24)

# 0.60.0 (2021-09-21)

### Bug Fixes

- **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))

### Features Dendron

- seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
- support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))

## 0.55.2 (2021-08-21)

## 0.55.1 (2021-08-17)

### Features Dendron

- **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))

## 0.54.1 (2021-08-13)

### Features Dendron

- colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
- **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))

# [0.62.0](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.62.0) (2021-10-05)

# 0.61.0 (2021-09-28)

### Bug Fixes

- **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))

## 0.60.2 (2021-09-25)

## 0.60.2-alpha.0 (2021-09-24)

## 0.60.1 (2021-09-24)

# 0.60.0 (2021-09-21)

### Bug Fixes

- **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))

### Features Dendron

- seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
- support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))

## 0.55.2 (2021-08-21)

## 0.55.1 (2021-08-17)

### Features Dendron

- **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))

## 0.54.1 (2021-08-13)

### Features Dendron

- colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
- **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))

## [0.61.2](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.61.2) (2021-10-02)

# 0.61.0 (2021-09-28)

### Bug Fixes

- **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))

## 0.60.2 (2021-09-25)

## 0.60.2-alpha.0 (2021-09-24)

## 0.60.1 (2021-09-24)

# 0.60.0 (2021-09-21)

### Bug Fixes

- **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))

### Features Dendron

- seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
- support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))

## 0.55.2 (2021-08-21)

## 0.55.1 (2021-08-17)

### Features Dendron

- **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))

## 0.54.1 (2021-08-13)

### Features Dendron

- colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
- **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))

## [0.61.1](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.61.1) (2021-10-01)

# 0.61.0 (2021-09-28)

### Bug Fixes

- **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))

## 0.60.2 (2021-09-25)

## 0.60.2-alpha.0 (2021-09-24)

## 0.60.1 (2021-09-24)

# 0.60.0 (2021-09-21)

### Bug Fixes

- **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))

### Features Dendron

- seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
- support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))

## 0.55.2 (2021-08-21)

## 0.55.1 (2021-08-17)

### Features Dendron

- **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))

## 0.54.1 (2021-08-13)

### Features Dendron

- colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
- **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))

## [0.61.1-alpha.0](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.61.1-alpha.0) (2021-09-29)

# 0.61.0 (2021-09-28)

### Bug Fixes

- **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))

## 0.60.2 (2021-09-25)

## 0.60.2-alpha.0 (2021-09-24)

## 0.60.1 (2021-09-24)

# 0.60.0 (2021-09-21)

### Bug Fixes

- **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))

### Features Dendron

- seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
- support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))

## 0.55.2 (2021-08-21)

## 0.55.1 (2021-08-17)

### Features Dendron

- **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))

## 0.54.1 (2021-08-13)

### Features Dendron

- colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
- **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))

# [0.61.0](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.61.0) (2021-09-28)

### Bug Fixes

- **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))

## 0.60.2 (2021-09-25)

## 0.60.2-alpha.0 (2021-09-24)

## 0.60.1 (2021-09-24)

# 0.60.0 (2021-09-21)

### Bug Fixes

- **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))

### Features Dendron

- seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
- support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))

## 0.55.2 (2021-08-21)

## 0.55.1 (2021-08-17)

### Features Dendron

- **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))

## 0.54.1 (2021-08-13)

### Features Dendron

- colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
- **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))

## [0.60.3-alpha.0](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.60.3-alpha.0) (2021-09-28)

## 0.60.2 (2021-09-25)

## 0.60.2-alpha.0 (2021-09-24)

## 0.60.1 (2021-09-24)

# 0.60.0 (2021-09-21)

### Bug Fixes

- **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))

### Features Dendron

- seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
- support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))

## 0.55.2 (2021-08-21)

## 0.55.1 (2021-08-17)

### Features Dendron

- **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))

## 0.54.1 (2021-08-13)

### Features Dendron

- colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
- **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))

## [0.60.2](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.60.2) (2021-09-25)

## 0.60.2-alpha.0 (2021-09-24)

## 0.60.1 (2021-09-24)

# 0.60.0 (2021-09-21)

### Bug Fixes

- **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))

### Features Dendron

- seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
- support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))

## 0.55.2 (2021-08-21)

## 0.55.1 (2021-08-17)

### Features Dendron

- **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))

## 0.54.1 (2021-08-13)

### Features Dendron

- colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
- **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))

## [0.60.2-alpha.0](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.60.2-alpha.0) (2021-09-24)

## 0.60.1 (2021-09-24)

# 0.60.0 (2021-09-21)

### Bug Fixes

- **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))

### Features Dendron

- seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
- support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))

## 0.55.2 (2021-08-21)

## 0.55.1 (2021-08-17)

### Features Dendron

- **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))

## 0.54.1 (2021-08-13)

### Features Dendron

- colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
- **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))

## [0.60.1](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.60.1) (2021-09-24)

### Bug Fixes

- **workspace:** corrupted keybindings ([f63bf5a](https://github.com/dendronhq/dendron/commit/f63bf5afb622f332811047fe48db8e2fd53fc167)), closes [#1290](https://github.com/dendronhq/dendron/issues/1290) [#1392](https://github.com/dendronhq/dendron/issues/1392) [#1371](https://github.com/dendronhq/dendron/issues/1371) [#1389](https://github.com/dendronhq/dendron/issues/1389) [#1388](https://github.com/dendronhq/dendron/issues/1388) [#1369](https://github.com/dendronhq/dendron/issues/1369) [#1387](https://github.com/dendronhq/dendron/issues/1387) [#1386](https://github.com/dendronhq/dendron/issues/1386) [#1384](https://github.com/dendronhq/dendron/issues/1384) [#1383](https://github.com/dendronhq/dendron/issues/1383) [#1370](https://github.com/dendronhq/dendron/issues/1370) [#1352](https://github.com/dendronhq/dendron/issues/1352) [#1382](https://github.com/dendronhq/dendron/issues/1382) [#1332](https://github.com/dendronhq/dendron/issues/1332)

# 0.60.0 (2021-09-21)

### Bug Fixes

- **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))

### Features Dendron

- seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
- support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))

## 0.55.2 (2021-08-21)

## 0.55.1 (2021-08-17)

### Features Dendron

- **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))

## 0.54.1 (2021-08-13)

### Features Dendron

- colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
- **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))

## [0.60.1-alpha.3](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.60.1-alpha.3) (2021-09-23)

# 0.60.0 (2021-09-21)

### Bug Fixes

- **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))

### Features Dendron

- seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
- support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))

## 0.55.2 (2021-08-21)

## 0.55.1 (2021-08-17)

### Features Dendron

- **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))

## 0.54.1 (2021-08-13)

### Features Dendron

- colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
- **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))

## [0.60.1-alpha.2](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.60.1-alpha.2) (2021-09-22)

# 0.60.0 (2021-09-21)

### Bug Fixes

- **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))

### Features Dendron

- seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
- support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))

## 0.55.2 (2021-08-21)

## 0.55.1 (2021-08-17)

### Features Dendron

- **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))

## 0.54.1 (2021-08-13)

### Features Dendron

- colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
- **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))

## [0.60.1-alpha.1](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.60.1-alpha.1) (2021-09-21)

### Bug Fixes

- **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))

### Features Dendron

- seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
- support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))

## 0.55.2 (2021-08-21)

## 0.55.1 (2021-08-17)

### Features Dendron

- **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))

## 0.54.1 (2021-08-13)

### Features Dendron

- colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
- **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))

## [0.60.1-alpha.0](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.60.1-alpha.0) (2021-09-20)

### Bug Fixes

- **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))

### Features Dendron

- seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
- support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))

## 0.55.2 (2021-08-21)

## 0.55.1 (2021-08-17)

### Features Dendron

- **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))

## 0.54.1 (2021-08-13)

### Features Dendron

- colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
- **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))

# [0.60.0](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.60.0) (2021-09-20)

### Bug Fixes

- **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))

### Features Dendron

- seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
- support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))

## 0.55.2 (2021-08-21)

## 0.55.1 (2021-08-17)

### Features Dendron

- **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))

## 0.54.1 (2021-08-13)

### Features Dendron

- colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
- **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))

## [0.59.3-alpha.1](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.59.3-alpha.1) (2021-09-20)

### Features Dendron

- seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
- support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))

## 0.55.2 (2021-08-21)

## 0.55.1 (2021-08-17)

### Features Dendron

- **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))

## 0.54.1 (2021-08-13)

### Features Dendron

- colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
- **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))

## [0.59.3-alpha.0](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.59.3-alpha.0) (2021-09-19)

### Features Dendron

- seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
- support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))

## 0.55.2 (2021-08-21)

## 0.55.1 (2021-08-17)

### Features Dendron

- **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))

## 0.54.1 (2021-08-13)

### Features Dendron

- colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
- **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))

## [0.59.2](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.59.2) (2021-09-17)

### Features Dendron

- seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
- support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))

## 0.55.2 (2021-08-21)

## 0.55.1 (2021-08-17)

### Features Dendron

- **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))

## 0.54.1 (2021-08-13)

### Features Dendron

- colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
- **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))

## [0.59.1](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.59.1) (2021-09-16)

### Features Dendron

- seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
- support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))

## 0.55.2 (2021-08-21)

## 0.55.1 (2021-08-17)

### Features Dendron

- **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))

## 0.54.1 (2021-08-13)

### Features Dendron

- colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
- **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))

## [0.59.2-alpha.5](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.59.2-alpha.5) (2021-09-15)

### Features Dendron

- seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
- support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))

## 0.55.2 (2021-08-21)

## 0.55.1 (2021-08-17)

### Features Dendron

- **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))

## 0.54.1 (2021-08-13)

### Features Dendron

- colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
- **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))

## [0.59.2-alpha.4](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.59.2-alpha.4) (2021-09-15)

### Features Dendron

- seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
- support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))

## 0.55.2 (2021-08-21)

## 0.55.1 (2021-08-17)

### Features Dendron

- **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))

## 0.54.1 (2021-08-13)

### Features Dendron

- colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
- **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))

## [0.59.2-alpha.3](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.59.2-alpha.3) (2021-09-15)

### Features Dendron

- seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
- support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))

## 0.55.2 (2021-08-21)

## 0.55.1 (2021-08-17)

### Features Dendron

- **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))

## 0.54.1 (2021-08-13)

### Features Dendron

- colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
- **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))

## [0.59.2-alpha.2](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.59.2-alpha.2) (2021-09-15)

### Features Dendron

- seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
- support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))

## 0.55.2 (2021-08-21)

## 0.55.1 (2021-08-17)

### Features Dendron

- **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))

## 0.54.1 (2021-08-13)

### Features Dendron

- colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
- **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))

## [0.59.2-alpha.1](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.59.2-alpha.1) (2021-09-15)

### Features Dendron

- seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
- support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))

## 0.55.2 (2021-08-21)

## 0.55.1 (2021-08-17)

### Features Dendron

- **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))

## 0.54.1 (2021-08-13)

### Features Dendron

- colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
- **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))

## [0.59.2-alpha.0](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.59.2-alpha.0) (2021-09-15)

### Features Dendron

- seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
- support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))

## 0.55.2 (2021-08-21)

## 0.55.1 (2021-08-17)

### Features Dendron

- **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))

## 0.54.1 (2021-08-13)

### Features Dendron

- colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
- **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))

## [0.59.1](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.59.1) (2021-09-14)

### Features Dendron

- seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
- support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))

## 0.55.2 (2021-08-21)

## 0.55.1 (2021-08-17)

### Features Dendron

- **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))

## 0.54.1 (2021-08-13)

### Features Dendron

- colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
- **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))

# [0.59.0](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.59.0) (2021-09-14)

### Features Dendron

- seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
- support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))

## 0.55.2 (2021-08-21)

## 0.55.1 (2021-08-17)

### Features Dendron

- **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))

## 0.54.1 (2021-08-13)

### Features Dendron

- colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
- **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))

## [0.58.4](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.58.4) (2021-09-12)

### Features Dendron

- seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
- support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))

## 0.55.2 (2021-08-21)

## 0.55.1 (2021-08-17)

### Features Dendron

- **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))

## 0.54.1 (2021-08-13)

### Features Dendron

- colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
- **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))

## [0.58.4-alpha.1](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.58.4-alpha.1) (2021-09-10)

### Features Dendron

- seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
- support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))

## 0.55.2 (2021-08-21)

## 0.55.1 (2021-08-17)

### Features Dendron

- **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))

## 0.54.1 (2021-08-13)

### Features Dendron

- colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
- **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))

## [0.58.4-alpha.0](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.58.4-alpha.0) (2021-09-09)

### Features Dendron

- seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
- support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))

## 0.55.2 (2021-08-21)

## 0.55.1 (2021-08-17)

### Features Dendron

- **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))

## 0.54.1 (2021-08-13)

### Features Dendron

- colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
- **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))

## [0.58.3-alpha.0](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.58.3-alpha.0) (2021-09-09)

### Features Dendron

- seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
- support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))

## 0.55.2 (2021-08-21)

## 0.55.1 (2021-08-17)

### Features Dendron

- **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))

## 0.54.1 (2021-08-13)

### Features Dendron

- colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
- **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))

## [0.58.2-alpha.0](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.58.2-alpha.0) (2021-09-09)

### Features Dendron

- seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
- support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))

## 0.55.2 (2021-08-21)

## 0.55.1 (2021-08-17)

### Features Dendron

- **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))

## 0.54.1 (2021-08-13)

### Features Dendron

- colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
- **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))

## [0.58.1](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.58.1) (2021-09-08)

### Features Dendron

- seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
- support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))

## 0.55.2 (2021-08-21)

## 0.55.1 (2021-08-17)

### Features Dendron

- **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))

## 0.54.1 (2021-08-13)

### Features Dendron

- colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
- **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))

# [0.58.0](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.58.0) (2021-09-07)

### Features Dendron

- seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
- support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))

## 0.55.2 (2021-08-21)

## 0.55.1 (2021-08-17)

### Features Dendron

- **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))

## 0.54.1 (2021-08-13)

### Features Dendron

- colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
- **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))

## [0.57.3](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.57.3) (2021-09-06)

### Features Dendron

- seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
- support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))

## 0.55.2 (2021-08-21)

## 0.55.1 (2021-08-17)

### Features Dendron

- **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))

## 0.54.1 (2021-08-13)

### Features Dendron

- colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
- **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))

## [0.57.2](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.57.2) (2021-09-04)

### Features Dendron

- seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
- support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))

## 0.55.2 (2021-08-21)

## 0.55.1 (2021-08-17)

### Features Dendron

- **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))

## 0.54.1 (2021-08-13)

### Features Dendron

- colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
- **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))

## [0.57.1](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.57.1) (2021-09-04)

### Features Dendron

- seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))
- support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))

## 0.55.2 (2021-08-21)

## 0.55.1 (2021-08-17)

### Features Dendron

- **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))

## 0.54.1 (2021-08-13)

### Features Dendron

- colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
- **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))

# [0.57.0](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.57.0) (2021-08-31)

### Features Dendron

- seed browser initial revision ([#1166](https://github.com/dendronhq/dendron/issues/1166)) ([588fba0](https://github.com/dendronhq/dendron/commit/588fba05bbd9e3dabadd5e02d9fde72d80ed8148))

## 0.55.2 (2021-08-21)

## 0.55.1 (2021-08-17)

### Features Dendron

- **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))

## 0.54.1 (2021-08-13)

### Features Dendron

- colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
- **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))

# [0.56.0](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.56.0) (2021-08-23)

## 0.55.2 (2021-08-21)

## 0.55.1 (2021-08-17)

### Features Dendron

- **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))

## 0.54.1 (2021-08-13)

### Features Dendron

- colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
- **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))

## [0.55.2](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.55.2) (2021-08-19)

## 0.55.1 (2021-08-17)

### Features Dendron

- **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))

## 0.54.1 (2021-08-13)

### Features Dendron

- colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
- **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))

## [0.55.1](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.55.1) (2021-08-17)

### Features Dendron

- **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))

## 0.54.1 (2021-08-13)

### Features Dendron

- colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
- **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))

# [0.55.0](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.55.0) (2021-08-17)

### Features Dendron

- **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))

## 0.54.1 (2021-08-13)

### Features Dendron

- colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
- **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))

## [0.54.1](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.54.1) (2021-08-13)

### Features Dendron

- colored tags in tree view & tags at bottom ([#1119](https://github.com/dendronhq/dendron/issues/1119)) ([2577e01](https://github.com/dendronhq/dendron/commit/2577e0189e3ba0d813823bc4d81a340d91db440d))
- **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))

# [0.54.0](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.54.0) (2021-08-10)

### Features Dendron

- **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))

## [0.53.10](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.53.10) (2021-08-10)

### Features Dendron

- **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))

## [0.53.9](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.53.9) (2021-08-10)

### Features Dendron

- **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))

## [0.53.8](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.53.8) (2021-08-10)

### Features Dendron

- **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))

## [0.53.7](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.53.7) (2021-08-10)

### Features Dendron

- **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))

## [0.53.6](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.53.6) (2021-08-10)

### Features Dendron

- **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))

## [0.53.5](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.53.5) (2021-08-10)

### Features Dendron

- **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))

## [0.53.4](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.53.4) (2021-08-10)

### Features Dendron

- **calendar-view:** allow journal settings deviating from defaults ([#1088](https://github.com/dendronhq/dendron/issues/1088)) ([74ce384](https://github.com/dendronhq/dendron/commit/74ce384f1b833abf68d3b145cbed55fe02fa8e1f))

## [0.53.3](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.53.3) (2021-08-08)

**Note:** Version bump only for package @dendronhq/common-frontend

## [0.53.2](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.53.2) (2021-08-06)

**Note:** Version bump only for package @dendronhq/common-frontend

## [0.53.1](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.53.1) (2021-08-06)

**Note:** Version bump only for package @dendronhq/common-frontend

# [0.53.0](https://github.com/dendronhq/dendron/compare/v0.52.0...v0.53.0) (2021-08-03)

**Note:** Version bump only for package @dendronhq/common-frontend

# [0.52.0](https://github.com/dendronhq/dendron/compare/v0.51.3...v0.52.0) (2021-07-26)

**Note:** Version bump only for package @dendronhq/common-frontend

## [0.51.4](https://github.com/dendronhq/dendron/compare/v0.51.3...v0.51.4) (2021-07-25)

**Note:** Version bump only for package @dendronhq/common-frontend

## [0.51.2](https://github.com/dendronhq/dendron/compare/v0.51.0...v0.51.2) (2021-07-22)

**Note:** Version bump only for package @dendronhq/common-frontend

## [0.51.1](https://github.com/dendronhq/dendron/compare/v0.51.0...v0.51.1) (2021-07-20)

**Note:** Version bump only for package @dendronhq/common-frontend

# [0.51.0](https://github.com/dendronhq/dendron/compare/v0.49.0...v0.51.0) (2021-07-19)

### Features Dendron

- add custom graph styling support ([#981](https://github.com/dendronhq/dendron/issues/981)) ([aa88e3a](https://github.com/dendronhq/dendron/commit/aa88e3a0e81f1ceeffe8058eceab93b32120c93b))
- add local note graph ([#899](https://github.com/dendronhq/dendron/issues/899)) ([6e9ed81](https://github.com/dendronhq/dendron/commit/6e9ed81c14897d95280ce5f881c7467589cb89ad))
- support dynamic theming ([1da7714](https://github.com/dendronhq/dendron/commit/1da7714f50acbba312a7e2e7a497f9e53920c96f))

## [0.50.3](https://github.com/dendronhq/dendron/compare/v0.49.0...v0.50.3) (2021-07-19)

### Features Dendron

- add custom graph styling support ([#981](https://github.com/dendronhq/dendron/issues/981)) ([aa88e3a](https://github.com/dendronhq/dendron/commit/aa88e3a0e81f1ceeffe8058eceab93b32120c93b))
- add local note graph ([#899](https://github.com/dendronhq/dendron/issues/899)) ([6e9ed81](https://github.com/dendronhq/dendron/commit/6e9ed81c14897d95280ce5f881c7467589cb89ad))
- support dynamic theming ([1da7714](https://github.com/dendronhq/dendron/commit/1da7714f50acbba312a7e2e7a497f9e53920c96f))

## [0.50.2](https://github.com/dendronhq/dendron/compare/v0.49.0...v0.50.2) (2021-07-19)

### Features Dendron

- add custom graph styling support ([#981](https://github.com/dendronhq/dendron/issues/981)) ([aa88e3a](https://github.com/dendronhq/dendron/commit/aa88e3a0e81f1ceeffe8058eceab93b32120c93b))
- add local note graph ([#899](https://github.com/dendronhq/dendron/issues/899)) ([6e9ed81](https://github.com/dendronhq/dendron/commit/6e9ed81c14897d95280ce5f881c7467589cb89ad))
- support dynamic theming ([1da7714](https://github.com/dendronhq/dendron/commit/1da7714f50acbba312a7e2e7a497f9e53920c96f))

## [0.50.1](https://github.com/dendronhq/dendron/compare/v0.49.0...v0.50.1) (2021-07-16)

### Features Dendron

- add local note graph ([#899](https://github.com/dendronhq/dendron/issues/899)) ([6e9ed81](https://github.com/dendronhq/dendron/commit/6e9ed81c14897d95280ce5f881c7467589cb89ad))
- support dynamic theming ([1da7714](https://github.com/dendronhq/dendron/commit/1da7714f50acbba312a7e2e7a497f9e53920c96f))

# [0.50.0](https://github.com/dendronhq/dendron/compare/v0.49.0...v0.50.0) (2021-07-12)

### Features Dendron

- add local note graph ([#899](https://github.com/dendronhq/dendron/issues/899)) ([6e9ed81](https://github.com/dendronhq/dendron/commit/6e9ed81c14897d95280ce5f881c7467589cb89ad))

# [0.49.0](https://github.com/dendronhq/dendron/compare/v0.48.3...v0.49.0) (2021-07-05)

**Note:** Version bump only for package @dendronhq/common-frontend

## [0.48.3](https://github.com/dendronhq/dendron/compare/v0.48.2...v0.48.3) (2021-07-02)

**Note:** Version bump only for package @dendronhq/common-frontend

## [0.48.2](https://github.com/dendronhq/dendron/compare/v0.48.1...v0.48.2) (2021-07-01)

**Note:** Version bump only for package @dendronhq/common-frontend

## [0.48.1](https://github.com/dendronhq/dendron/compare/v0.48.0...v0.48.1) (2021-06-30)

**Note:** Version bump only for package @dendronhq/common-frontend

# [0.48.0](https://github.com/dendronhq/dendron/compare/v0.47.0...v0.48.0) (2021-06-28)

**Note:** Version bump only for package @dendronhq/common-frontend

## [0.47.2](https://github.com/dendronhq/dendron/compare/v0.47.0...v0.47.2) (2021-06-24)

**Note:** Version bump only for package @dendronhq/common-frontend

## [0.47.1](https://github.com/dendronhq/dendron/compare/v0.47.0...v0.47.1) (2021-06-23)

**Note:** Version bump only for package @dendronhq/common-frontend

# [0.47.0](https://github.com/dendronhq/dendron/compare/v0.46.1...v0.47.0) (2021-06-21)

**Note:** Version bump only for package @dendronhq/common-frontend

## [0.46.3-alpha.0](https://github.com/dendronhq/dendron/compare/v0.46.1...v0.46.3-alpha.0) (2021-06-19)

**Note:** Version bump only for package @dendronhq/common-frontend

## [0.46.2](https://github.com/dendronhq/dendron/compare/v0.46.1...v0.46.2) (2021-06-19)

**Note:** Version bump only for package @dendronhq/common-frontend

## [0.46.2-alpha.1](https://github.com/dendronhq/dendron/compare/v0.46.1...v0.46.2-alpha.1) (2021-06-16)

**Note:** Version bump only for package @dendronhq/common-frontend

## [0.46.2-alpha.0](https://github.com/dendronhq/dendron/compare/v0.46.1...v0.46.2-alpha.0) (2021-06-16)

**Note:** Version bump only for package @dendronhq/common-frontend

## [0.46.1](https://github.com/dendronhq/dendron/compare/v0.46.0...v0.46.1) (2021-06-14)

**Note:** Version bump only for package @dendronhq/common-frontend

# [0.46.0](https://github.com/dendronhq/dendron/compare/v0.45.2...v0.46.0) (2021-06-14)

**Note:** Version bump only for package @dendronhq/common-frontend

## [0.45.2](https://github.com/dendronhq/dendron/compare/v0.45.1...v0.45.2) (2021-06-12)

**Note:** Version bump only for package @dendronhq/common-frontend

## [0.45.1](https://github.com/dendronhq/dendron/compare/v0.45.0...v0.45.1) (2021-06-09)

### Bug Fixes

- format issue ([232926d](https://github.com/dendronhq/dendron/commit/232926d88c633aaa052711e9380a9da4a1ecc5d7))

# [0.45.0](https://github.com/dendronhq/dendron/compare/v0.44.1...v0.45.0) (2021-06-07)

**Note:** Version bump only for package @dendronhq/common-frontend

## [0.44.2-alpha.1](https://github.com/dendronhq/dendron/compare/v0.44.1...v0.44.2-alpha.1) (2021-06-06)

**Note:** Version bump only for package @dendronhq/common-frontend

## [0.44.2-alpha.0](https://github.com/dendronhq/dendron/compare/v0.44.1...v0.44.2-alpha.0) (2021-06-06)

**Note:** Version bump only for package @dendronhq/common-frontend

## [0.44.1](https://github.com/dendronhq/dendron/compare/v0.44.1-alpha.5...v0.44.1) (2021-06-04)

**Note:** Version bump only for package @dendronhq/common-frontend

## [0.44.1-alpha.7](https://github.com/dendronhq/dendron/compare/v0.44.1-alpha.5...v0.44.1-alpha.7) (2021-06-04)

**Note:** Version bump only for package @dendronhq/common-frontend

## [0.44.1-alpha.6](https://github.com/dendronhq/dendron/compare/v0.44.1-alpha.5...v0.44.1-alpha.6) (2021-06-04)

**Note:** Version bump only for package @dendronhq/common-frontend

## [0.44.1-alpha.5](https://github.com/dendronhq/dendron/compare/v0.42.0...v0.44.1-alpha.5) (2021-06-04)

**Note:** Version bump only for package @dendronhq/common-frontend

## [0.44.1-alpha.4](https://github.com/dendronhq/dendron/compare/v0.42.0...v0.44.1-alpha.4) (2021-06-04)

**Note:** Version bump only for package @dendronhq/common-frontend

## [0.44.1-alpha.3](https://github.com/dendronhq/dendron/compare/v0.42.0...v0.44.1-alpha.3) (2021-06-03)

**Note:** Version bump only for package @dendronhq/common-frontend

## [0.44.1-alpha.2](https://github.com/dendronhq/dendron/compare/v0.42.0...v0.44.1-alpha.2) (2021-06-03)

**Note:** Version bump only for package @dendronhq/common-frontend

## [0.44.1-alpha.1](https://github.com/dendronhq/dendron/compare/v0.42.0...v0.44.1-alpha.1) (2021-06-02)

**Note:** Version bump only for package @dendronhq/common-frontend

## [0.44.1-alpha.0](https://github.com/dendronhq/dendron/compare/v0.42.0...v0.44.1-alpha.0) (2021-06-02)

**Note:** Version bump only for package @dendronhq/common-frontend

# [0.44.0](https://github.com/dendronhq/dendron/compare/v0.42.0...v0.44.0) (2021-05-31)

**Note:** Version bump only for package @dendronhq/common-frontend

## [0.43.5-alpha.2](https://github.com/dendronhq/dendron/compare/v0.42.0...v0.43.5-alpha.2) (2021-05-29)

**Note:** Version bump only for package @dendronhq/common-frontend

## [0.43.5-alpha.1](https://github.com/dendronhq/dendron/compare/v0.42.0...v0.43.5-alpha.1) (2021-05-29)

**Note:** Version bump only for package @dendronhq/common-frontend

## [0.43.5-alpha.0](https://github.com/dendronhq/dendron/compare/v0.42.0...v0.43.5-alpha.0) (2021-05-28)

**Note:** Version bump only for package @dendronhq/common-frontend

## [0.43.4-alpha.0](https://github.com/dendronhq/dendron/compare/v0.42.0...v0.43.4-alpha.0) (2021-05-28)

**Note:** Version bump only for package @dendronhq/common-frontend

## [0.43.3-alpha.0](https://github.com/dendronhq/dendron/compare/v0.42.0...v0.43.3-alpha.0) (2021-05-28)

**Note:** Version bump only for package @dendronhq/common-frontend

## [0.43.2-alpha.0](https://github.com/dendronhq/dendron/compare/v0.42.0...v0.43.2-alpha.0) (2021-05-27)

**Note:** Version bump only for package @dendronhq/common-frontend

## [0.43.1](https://github.com/dendronhq/dendron/compare/v0.42.0...v0.43.1) (2021-05-26)

**Note:** Version bump only for package @dendronhq/common-frontend

## [0.43.3-alpha.0](https://github.com/dendronhq/dendron/compare/v0.42.0...v0.43.3-alpha.0) (2021-05-26)

**Note:** Version bump only for package @dendronhq/common-frontend

## [0.43.2-alpha.0](https://github.com/dendronhq/dendron/compare/v0.42.0...v0.43.2-alpha.0) (2021-05-25)

**Note:** Version bump only for package @dendronhq/common-frontend

## [0.43.1-alpha.0](https://github.com/dendronhq/dendron/compare/v0.42.0...v0.43.1-alpha.0) (2021-05-24)

**Note:** Version bump only for package @dendronhq/common-frontend

# [0.43.0](https://github.com/dendronhq/dendron/compare/v0.42.0...v0.43.0) (2021-05-24)

**Note:** Version bump only for package @dendronhq/common-frontend

## [0.42.6-alpha.0](https://github.com/dendronhq/dendron/compare/v0.42.0...v0.42.6-alpha.0) (2021-05-24)

**Note:** Version bump only for package @dendronhq/common-frontend

## [0.42.5-alpha.0](https://github.com/dendronhq/dendron/compare/v0.42.0...v0.42.5-alpha.0) (2021-05-24)

**Note:** Version bump only for package @dendronhq/common-frontend

## [0.42.4-alpha.0](https://github.com/dendronhq/dendron/compare/v0.42.0...v0.42.4-alpha.0) (2021-05-24)

**Note:** Version bump only for package @dendronhq/common-frontend

## [0.42.3-alpha.0](https://github.com/dendronhq/dendron/compare/v0.42.0...v0.42.3-alpha.0) (2021-05-24)

**Note:** Version bump only for package @dendronhq/common-frontend

## [0.42.2-alpha.0](https://github.com/dendronhq/dendron/compare/v0.42.0...v0.42.2-alpha.0) (2021-05-22)

**Note:** Version bump only for package @dendronhq/common-frontend

## [0.42.1-alpha.0](https://github.com/dendronhq/dendron/compare/v0.42.0...v0.42.1-alpha.0) (2021-05-20)

**Note:** Version bump only for package @dendronhq/common-frontend

# [0.42.0-alpha.0](https://github.com/dendronhq/dendron/compare/v0.41.0...v0.42.0-alpha.0) (2021-05-15)

### Bug Fixes

- bad import ([53658eb](https://github.com/dendronhq/dendron/commit/53658ebc4fe647637225f079fb58b76e02223e4e))

## [0.41.1-alpha.0](https://github.com/dendronhq/dendron/compare/v0.41.0...v0.41.1-alpha.0) (2021-05-10)

### Bug Fixes

- bad import ([2089e28](https://github.com/dendronhq/dendron/commit/2089e28579ed637333115a85756bb056cf4a2ce5))

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
