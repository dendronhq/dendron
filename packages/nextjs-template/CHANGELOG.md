# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [0.70.1](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.70.1) (2021-11-26)


### Bug Fixes

* **markdown:** footnote rendering in note references ([#1520](https://github.com/dendronhq/dendron/issues/1520)) ([c4056f5](https://github.com/dendronhq/dendron/commit/c4056f5c4fc4c02dbc14cd4564032caa3619eae5))
* **pods:** invalid configuration error ([398a599](https://github.com/dendronhq/dendron/commit/398a5995fc594566131eb283ff989a877ca9c995))
* **publish:** enable mermaid support ([fc84c74](https://github.com/dendronhq/dendron/commit/fc84c74c35ce09fe9acde8cc21204d4191a8f80a))
* **publish:** issue with cypress dependency ([9a18336](https://github.com/dendronhq/dendron/commit/9a18336131711d3115568a4e7a40732e37e0e89d)), closes [#19102](https://github.com/dendronhq/dendron/issues/19102)
* **publish:** make mermaid work consistently on published sites ([2f648e0](https://github.com/dendronhq/dendron/commit/2f648e0a34c95095e86e8535a1fa8ec9ac4de39c))
* **publish:** optimize nextjs publishing search ([#1519](https://github.com/dendronhq/dendron/issues/1519)) ([d06dd25](https://github.com/dendronhq/dendron/commit/d06dd25e292532a4ea66d1aa469a27c00b424ad6))
* **publish:** syntax highlighting for code blocks ([8ece4e2](https://github.com/dendronhq/dendron/commit/8ece4e28ae0c60d314498f6ed11a7974086f8f80))
* **publish:** table of contents layout ([#1649](https://github.com/dendronhq/dendron/issues/1649)) ([dbae739](https://github.com/dendronhq/dendron/commit/dbae739ad0650c75a72dd51821b3a5d4ab556839))
* **publish:** Title parts duplicated in Next publishing search ([#1573](https://github.com/dendronhq/dendron/issues/1573)) ([59de1a4](https://github.com/dendronhq/dendron/commit/59de1a486be980c1e6b16753478c62b03c38e018))
* **publish:** unslugify titles in toc ([292a46b](https://github.com/dendronhq/dendron/commit/292a46b14287f2e649a7929516ed97144e9fd2d6))
* **viwes:** `nav_order` property not respected in tree view ([fd328a1](https://github.com/dendronhq/dendron/commit/fd328a17478a063c2ea3d51e00fbc26c7e7e1b26))


### Features Dendron

* **workspace:** better note previews ([#1666](https://github.com/dendronhq/dendron/issues/1666)) ([5cf7067](https://github.com/dendronhq/dendron/commit/5cf70672a24a62d528440f38b44813bfa627fb88))



## 0.62.3 (2021-10-09)


### Bug Fixes

* **publish:** nextjs search note snippets ([#1433](https://github.com/dendronhq/dendron/issues/1433)) ([0cb8f38](https://github.com/dendronhq/dendron/commit/0cb8f38fc9cb5e45af682fc5524ff5eb7ba44ce7))


### Features Dendron

* **publish:** add table of contents ([#1428](https://github.com/dendronhq/dendron/issues/1428)) ([df4b05b](https://github.com/dendronhq/dendron/commit/df4b05ba8526dc32362d6a59543d880f253f02fc))



# 0.61.0 (2021-09-28)


### Bug Fixes

* **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))



## 0.60.2 (2021-09-25)


### Bug Fixes

* **publish:** footer show on first load ([#1413](https://github.com/dendronhq/dendron/issues/1413)) ([00d32cc](https://github.com/dendronhq/dendron/commit/00d32cc830ca6da3160a9cee86386e50b3a35fd6))


### Features Dendron

* **publish:** add popover for long title in menu ([#1408](https://github.com/dendronhq/dendron/issues/1408)) ([b94b223](https://github.com/dendronhq/dendron/commit/b94b2235f337b2e54bcbf8658e5f4f371804c5f9))
* **publish:** mobile navigation ([#1407](https://github.com/dendronhq/dendron/issues/1407)) ([3487213](https://github.com/dendronhq/dendron/commit/34872138131f030f460dc4cd8e81c65fe7654524))



## 0.60.2-alpha.0 (2021-09-24)



## 0.60.1 (2021-09-24)



# 0.60.0 (2021-09-21)


### Bug Fixes

* **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))
* handle single domain hierarchies gracefully ([10dc5ec](https://github.com/dendronhq/dendron/commit/10dc5ec2ab3ebf767ae7e913cb90ba48e9651447))
* links at top/bottom of reference aren't clickable ([#1282](https://github.com/dendronhq/dendron/issues/1282)) ([b2a00cc](https://github.com/dendronhq/dendron/commit/b2a00cc564299cdb17ae6060154b7616c04e630c))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))


### Features Dendron

* **publish:** notice for dev mode ([#1354](https://github.com/dendronhq/dendron/issues/1354)) ([e3f9fc9](https://github.com/dendronhq/dendron/commit/e3f9fc9d81dc51fbaec5f4bbccb2f6c1dffb1afb))
* additional styling for nextjs ([f8e7972](https://github.com/dendronhq/dendron/commit/f8e797231b586c20ac4d2e1fa1813982cc282375))
* nextjs publishing fulltext search ([#1334](https://github.com/dendronhq/dendron/issues/1334)) ([68f8473](https://github.com/dendronhq/dendron/commit/68f8473badf22494c8d0758f8195e377235321f6))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))



## 0.55.2 (2021-08-21)


### Features Dendron

* make breadcrumbs clickable ([#1164](https://github.com/dendronhq/dendron/issues/1164)) ([a386fc3](https://github.com/dendronhq/dendron/commit/a386fc3dd42769207f58259f292216be51f0a15b))



## 0.55.1 (2021-08-17)


### Features Dendron

* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)





# [0.70.0](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.70.0) (2021-11-23)


### Bug Fixes

* **markdown:** footnote rendering in note references ([#1520](https://github.com/dendronhq/dendron/issues/1520)) ([c4056f5](https://github.com/dendronhq/dendron/commit/c4056f5c4fc4c02dbc14cd4564032caa3619eae5))
* **pods:** invalid configuration error ([398a599](https://github.com/dendronhq/dendron/commit/398a5995fc594566131eb283ff989a877ca9c995))
* **publish:** enable mermaid support ([fc84c74](https://github.com/dendronhq/dendron/commit/fc84c74c35ce09fe9acde8cc21204d4191a8f80a))
* **publish:** make mermaid work consistently on published sites ([2f648e0](https://github.com/dendronhq/dendron/commit/2f648e0a34c95095e86e8535a1fa8ec9ac4de39c))
* **publish:** optimize nextjs publishing search ([#1519](https://github.com/dendronhq/dendron/issues/1519)) ([d06dd25](https://github.com/dendronhq/dendron/commit/d06dd25e292532a4ea66d1aa469a27c00b424ad6))
* **publish:** syntax highlighting for code blocks ([8ece4e2](https://github.com/dendronhq/dendron/commit/8ece4e28ae0c60d314498f6ed11a7974086f8f80))
* **publish:** table of contents layout ([#1649](https://github.com/dendronhq/dendron/issues/1649)) ([dbae739](https://github.com/dendronhq/dendron/commit/dbae739ad0650c75a72dd51821b3a5d4ab556839))
* **publish:** Title parts duplicated in Next publishing search ([#1573](https://github.com/dendronhq/dendron/issues/1573)) ([59de1a4](https://github.com/dendronhq/dendron/commit/59de1a486be980c1e6b16753478c62b03c38e018))
* **publish:** unslugify titles in toc ([292a46b](https://github.com/dendronhq/dendron/commit/292a46b14287f2e649a7929516ed97144e9fd2d6))
* **viwes:** `nav_order` property not respected in tree view ([fd328a1](https://github.com/dendronhq/dendron/commit/fd328a17478a063c2ea3d51e00fbc26c7e7e1b26))


### Features Dendron

* **workspace:** better note previews ([#1666](https://github.com/dendronhq/dendron/issues/1666)) ([5cf7067](https://github.com/dendronhq/dendron/commit/5cf70672a24a62d528440f38b44813bfa627fb88))



## 0.62.3 (2021-10-09)


### Bug Fixes

* **publish:** nextjs search note snippets ([#1433](https://github.com/dendronhq/dendron/issues/1433)) ([0cb8f38](https://github.com/dendronhq/dendron/commit/0cb8f38fc9cb5e45af682fc5524ff5eb7ba44ce7))


### Features Dendron

* **publish:** add table of contents ([#1428](https://github.com/dendronhq/dendron/issues/1428)) ([df4b05b](https://github.com/dendronhq/dendron/commit/df4b05ba8526dc32362d6a59543d880f253f02fc))



# 0.61.0 (2021-09-28)


### Bug Fixes

* **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))



## 0.60.2 (2021-09-25)


### Bug Fixes

* **publish:** footer show on first load ([#1413](https://github.com/dendronhq/dendron/issues/1413)) ([00d32cc](https://github.com/dendronhq/dendron/commit/00d32cc830ca6da3160a9cee86386e50b3a35fd6))


### Features Dendron

* **publish:** add popover for long title in menu ([#1408](https://github.com/dendronhq/dendron/issues/1408)) ([b94b223](https://github.com/dendronhq/dendron/commit/b94b2235f337b2e54bcbf8658e5f4f371804c5f9))
* **publish:** mobile navigation ([#1407](https://github.com/dendronhq/dendron/issues/1407)) ([3487213](https://github.com/dendronhq/dendron/commit/34872138131f030f460dc4cd8e81c65fe7654524))



## 0.60.2-alpha.0 (2021-09-24)



## 0.60.1 (2021-09-24)



# 0.60.0 (2021-09-21)


### Bug Fixes

* **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))
* handle single domain hierarchies gracefully ([10dc5ec](https://github.com/dendronhq/dendron/commit/10dc5ec2ab3ebf767ae7e913cb90ba48e9651447))
* links at top/bottom of reference aren't clickable ([#1282](https://github.com/dendronhq/dendron/issues/1282)) ([b2a00cc](https://github.com/dendronhq/dendron/commit/b2a00cc564299cdb17ae6060154b7616c04e630c))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))


### Features Dendron

* **publish:** notice for dev mode ([#1354](https://github.com/dendronhq/dendron/issues/1354)) ([e3f9fc9](https://github.com/dendronhq/dendron/commit/e3f9fc9d81dc51fbaec5f4bbccb2f6c1dffb1afb))
* additional styling for nextjs ([f8e7972](https://github.com/dendronhq/dendron/commit/f8e797231b586c20ac4d2e1fa1813982cc282375))
* nextjs publishing fulltext search ([#1334](https://github.com/dendronhq/dendron/issues/1334)) ([68f8473](https://github.com/dendronhq/dendron/commit/68f8473badf22494c8d0758f8195e377235321f6))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))



## 0.55.2 (2021-08-21)


### Features Dendron

* make breadcrumbs clickable ([#1164](https://github.com/dendronhq/dendron/issues/1164)) ([a386fc3](https://github.com/dendronhq/dendron/commit/a386fc3dd42769207f58259f292216be51f0a15b))



## 0.55.1 (2021-08-17)


### Features Dendron

* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)





## [0.69.3-alpha.0](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.69.3-alpha.0) (2021-11-22)


### Bug Fixes

* **markdown:** footnote rendering in note references ([#1520](https://github.com/dendronhq/dendron/issues/1520)) ([c4056f5](https://github.com/dendronhq/dendron/commit/c4056f5c4fc4c02dbc14cd4564032caa3619eae5))
* **pods:** invalid configuration error ([398a599](https://github.com/dendronhq/dendron/commit/398a5995fc594566131eb283ff989a877ca9c995))
* **publish:** enable mermaid support ([fc84c74](https://github.com/dendronhq/dendron/commit/fc84c74c35ce09fe9acde8cc21204d4191a8f80a))
* **publish:** make mermaid work consistently on published sites ([2f648e0](https://github.com/dendronhq/dendron/commit/2f648e0a34c95095e86e8535a1fa8ec9ac4de39c))
* **publish:** optimize nextjs publishing search ([#1519](https://github.com/dendronhq/dendron/issues/1519)) ([d06dd25](https://github.com/dendronhq/dendron/commit/d06dd25e292532a4ea66d1aa469a27c00b424ad6))
* **publish:** syntax highlighting for code blocks ([8ece4e2](https://github.com/dendronhq/dendron/commit/8ece4e28ae0c60d314498f6ed11a7974086f8f80))
* **publish:** table of contents layout ([#1649](https://github.com/dendronhq/dendron/issues/1649)) ([dbae739](https://github.com/dendronhq/dendron/commit/dbae739ad0650c75a72dd51821b3a5d4ab556839))
* **publish:** Title parts duplicated in Next publishing search ([#1573](https://github.com/dendronhq/dendron/issues/1573)) ([59de1a4](https://github.com/dendronhq/dendron/commit/59de1a486be980c1e6b16753478c62b03c38e018))
* **publish:** unslugify titles in toc ([292a46b](https://github.com/dendronhq/dendron/commit/292a46b14287f2e649a7929516ed97144e9fd2d6))
* **viwes:** `nav_order` property not respected in tree view ([fd328a1](https://github.com/dendronhq/dendron/commit/fd328a17478a063c2ea3d51e00fbc26c7e7e1b26))


### Features Dendron

* **workspace:** better note previews ([#1666](https://github.com/dendronhq/dendron/issues/1666)) ([5cf7067](https://github.com/dendronhq/dendron/commit/5cf70672a24a62d528440f38b44813bfa627fb88))



## 0.62.3 (2021-10-09)


### Bug Fixes

* **publish:** nextjs search note snippets ([#1433](https://github.com/dendronhq/dendron/issues/1433)) ([0cb8f38](https://github.com/dendronhq/dendron/commit/0cb8f38fc9cb5e45af682fc5524ff5eb7ba44ce7))


### Features Dendron

* **publish:** add table of contents ([#1428](https://github.com/dendronhq/dendron/issues/1428)) ([df4b05b](https://github.com/dendronhq/dendron/commit/df4b05ba8526dc32362d6a59543d880f253f02fc))



# 0.61.0 (2021-09-28)


### Bug Fixes

* **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))



## 0.60.2 (2021-09-25)


### Bug Fixes

* **publish:** footer show on first load ([#1413](https://github.com/dendronhq/dendron/issues/1413)) ([00d32cc](https://github.com/dendronhq/dendron/commit/00d32cc830ca6da3160a9cee86386e50b3a35fd6))


### Features Dendron

* **publish:** add popover for long title in menu ([#1408](https://github.com/dendronhq/dendron/issues/1408)) ([b94b223](https://github.com/dendronhq/dendron/commit/b94b2235f337b2e54bcbf8658e5f4f371804c5f9))
* **publish:** mobile navigation ([#1407](https://github.com/dendronhq/dendron/issues/1407)) ([3487213](https://github.com/dendronhq/dendron/commit/34872138131f030f460dc4cd8e81c65fe7654524))



## 0.60.2-alpha.0 (2021-09-24)



## 0.60.1 (2021-09-24)



# 0.60.0 (2021-09-21)


### Bug Fixes

* **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))
* handle single domain hierarchies gracefully ([10dc5ec](https://github.com/dendronhq/dendron/commit/10dc5ec2ab3ebf767ae7e913cb90ba48e9651447))
* links at top/bottom of reference aren't clickable ([#1282](https://github.com/dendronhq/dendron/issues/1282)) ([b2a00cc](https://github.com/dendronhq/dendron/commit/b2a00cc564299cdb17ae6060154b7616c04e630c))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))


### Features Dendron

* **publish:** notice for dev mode ([#1354](https://github.com/dendronhq/dendron/issues/1354)) ([e3f9fc9](https://github.com/dendronhq/dendron/commit/e3f9fc9d81dc51fbaec5f4bbccb2f6c1dffb1afb))
* additional styling for nextjs ([f8e7972](https://github.com/dendronhq/dendron/commit/f8e797231b586c20ac4d2e1fa1813982cc282375))
* nextjs publishing fulltext search ([#1334](https://github.com/dendronhq/dendron/issues/1334)) ([68f8473](https://github.com/dendronhq/dendron/commit/68f8473badf22494c8d0758f8195e377235321f6))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))



## 0.55.2 (2021-08-21)


### Features Dendron

* make breadcrumbs clickable ([#1164](https://github.com/dendronhq/dendron/issues/1164)) ([a386fc3](https://github.com/dendronhq/dendron/commit/a386fc3dd42769207f58259f292216be51f0a15b))



## 0.55.1 (2021-08-17)


### Features Dendron

* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)





## [0.69.2](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.69.2) (2021-11-19)


### Bug Fixes

* **markdown:** footnote rendering in note references ([#1520](https://github.com/dendronhq/dendron/issues/1520)) ([c4056f5](https://github.com/dendronhq/dendron/commit/c4056f5c4fc4c02dbc14cd4564032caa3619eae5))
* **pods:** invalid configuration error ([398a599](https://github.com/dendronhq/dendron/commit/398a5995fc594566131eb283ff989a877ca9c995))
* **publish:** enable mermaid support ([fc84c74](https://github.com/dendronhq/dendron/commit/fc84c74c35ce09fe9acde8cc21204d4191a8f80a))
* **publish:** optimize nextjs publishing search ([#1519](https://github.com/dendronhq/dendron/issues/1519)) ([d06dd25](https://github.com/dendronhq/dendron/commit/d06dd25e292532a4ea66d1aa469a27c00b424ad6))
* **publish:** syntax highlighting for code blocks ([8ece4e2](https://github.com/dendronhq/dendron/commit/8ece4e28ae0c60d314498f6ed11a7974086f8f80))
* **publish:** table of contents layout ([#1649](https://github.com/dendronhq/dendron/issues/1649)) ([dbae739](https://github.com/dendronhq/dendron/commit/dbae739ad0650c75a72dd51821b3a5d4ab556839))
* **publish:** Title parts duplicated in Next publishing search ([#1573](https://github.com/dendronhq/dendron/issues/1573)) ([59de1a4](https://github.com/dendronhq/dendron/commit/59de1a486be980c1e6b16753478c62b03c38e018))
* **publish:** unslugify titles in toc ([292a46b](https://github.com/dendronhq/dendron/commit/292a46b14287f2e649a7929516ed97144e9fd2d6))
* **viwes:** `nav_order` property not respected in tree view ([fd328a1](https://github.com/dendronhq/dendron/commit/fd328a17478a063c2ea3d51e00fbc26c7e7e1b26))


### Features Dendron

* **workspace:** better note previews ([#1666](https://github.com/dendronhq/dendron/issues/1666)) ([5cf7067](https://github.com/dendronhq/dendron/commit/5cf70672a24a62d528440f38b44813bfa627fb88))



## 0.62.3 (2021-10-09)


### Bug Fixes

* **publish:** nextjs search note snippets ([#1433](https://github.com/dendronhq/dendron/issues/1433)) ([0cb8f38](https://github.com/dendronhq/dendron/commit/0cb8f38fc9cb5e45af682fc5524ff5eb7ba44ce7))


### Features Dendron

* **publish:** add table of contents ([#1428](https://github.com/dendronhq/dendron/issues/1428)) ([df4b05b](https://github.com/dendronhq/dendron/commit/df4b05ba8526dc32362d6a59543d880f253f02fc))



# 0.61.0 (2021-09-28)


### Bug Fixes

* **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))



## 0.60.2 (2021-09-25)


### Bug Fixes

* **publish:** footer show on first load ([#1413](https://github.com/dendronhq/dendron/issues/1413)) ([00d32cc](https://github.com/dendronhq/dendron/commit/00d32cc830ca6da3160a9cee86386e50b3a35fd6))


### Features Dendron

* **publish:** add popover for long title in menu ([#1408](https://github.com/dendronhq/dendron/issues/1408)) ([b94b223](https://github.com/dendronhq/dendron/commit/b94b2235f337b2e54bcbf8658e5f4f371804c5f9))
* **publish:** mobile navigation ([#1407](https://github.com/dendronhq/dendron/issues/1407)) ([3487213](https://github.com/dendronhq/dendron/commit/34872138131f030f460dc4cd8e81c65fe7654524))



## 0.60.2-alpha.0 (2021-09-24)



## 0.60.1 (2021-09-24)



# 0.60.0 (2021-09-21)


### Bug Fixes

* **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))
* handle single domain hierarchies gracefully ([10dc5ec](https://github.com/dendronhq/dendron/commit/10dc5ec2ab3ebf767ae7e913cb90ba48e9651447))
* links at top/bottom of reference aren't clickable ([#1282](https://github.com/dendronhq/dendron/issues/1282)) ([b2a00cc](https://github.com/dendronhq/dendron/commit/b2a00cc564299cdb17ae6060154b7616c04e630c))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))


### Features Dendron

* **publish:** notice for dev mode ([#1354](https://github.com/dendronhq/dendron/issues/1354)) ([e3f9fc9](https://github.com/dendronhq/dendron/commit/e3f9fc9d81dc51fbaec5f4bbccb2f6c1dffb1afb))
* additional styling for nextjs ([f8e7972](https://github.com/dendronhq/dendron/commit/f8e797231b586c20ac4d2e1fa1813982cc282375))
* nextjs publishing fulltext search ([#1334](https://github.com/dendronhq/dendron/issues/1334)) ([68f8473](https://github.com/dendronhq/dendron/commit/68f8473badf22494c8d0758f8195e377235321f6))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))



## 0.55.2 (2021-08-21)


### Features Dendron

* make breadcrumbs clickable ([#1164](https://github.com/dendronhq/dendron/issues/1164)) ([a386fc3](https://github.com/dendronhq/dendron/commit/a386fc3dd42769207f58259f292216be51f0a15b))



## 0.55.1 (2021-08-17)


### Features Dendron

* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)





## [0.69.2-alpha.0](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.69.2-alpha.0) (2021-11-19)


### Bug Fixes

* **markdown:** footnote rendering in note references ([#1520](https://github.com/dendronhq/dendron/issues/1520)) ([c4056f5](https://github.com/dendronhq/dendron/commit/c4056f5c4fc4c02dbc14cd4564032caa3619eae5))
* **pods:** invalid configuration error ([398a599](https://github.com/dendronhq/dendron/commit/398a5995fc594566131eb283ff989a877ca9c995))
* **publish:** enable mermaid support ([fc84c74](https://github.com/dendronhq/dendron/commit/fc84c74c35ce09fe9acde8cc21204d4191a8f80a))
* **publish:** optimize nextjs publishing search ([#1519](https://github.com/dendronhq/dendron/issues/1519)) ([d06dd25](https://github.com/dendronhq/dendron/commit/d06dd25e292532a4ea66d1aa469a27c00b424ad6))
* **publish:** syntax highlighting for code blocks ([8ece4e2](https://github.com/dendronhq/dendron/commit/8ece4e28ae0c60d314498f6ed11a7974086f8f80))
* **publish:** table of contents layout ([#1649](https://github.com/dendronhq/dendron/issues/1649)) ([dbae739](https://github.com/dendronhq/dendron/commit/dbae739ad0650c75a72dd51821b3a5d4ab556839))
* **publish:** Title parts duplicated in Next publishing search ([#1573](https://github.com/dendronhq/dendron/issues/1573)) ([59de1a4](https://github.com/dendronhq/dendron/commit/59de1a486be980c1e6b16753478c62b03c38e018))
* **publish:** unslugify titles in toc ([292a46b](https://github.com/dendronhq/dendron/commit/292a46b14287f2e649a7929516ed97144e9fd2d6))
* **viwes:** `nav_order` property not respected in tree view ([fd328a1](https://github.com/dendronhq/dendron/commit/fd328a17478a063c2ea3d51e00fbc26c7e7e1b26))


### Features Dendron

* **workspace:** better note previews ([#1666](https://github.com/dendronhq/dendron/issues/1666)) ([5cf7067](https://github.com/dendronhq/dendron/commit/5cf70672a24a62d528440f38b44813bfa627fb88))



## 0.62.3 (2021-10-09)


### Bug Fixes

* **publish:** nextjs search note snippets ([#1433](https://github.com/dendronhq/dendron/issues/1433)) ([0cb8f38](https://github.com/dendronhq/dendron/commit/0cb8f38fc9cb5e45af682fc5524ff5eb7ba44ce7))


### Features Dendron

* **publish:** add table of contents ([#1428](https://github.com/dendronhq/dendron/issues/1428)) ([df4b05b](https://github.com/dendronhq/dendron/commit/df4b05ba8526dc32362d6a59543d880f253f02fc))



# 0.61.0 (2021-09-28)


### Bug Fixes

* **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))



## 0.60.2 (2021-09-25)


### Bug Fixes

* **publish:** footer show on first load ([#1413](https://github.com/dendronhq/dendron/issues/1413)) ([00d32cc](https://github.com/dendronhq/dendron/commit/00d32cc830ca6da3160a9cee86386e50b3a35fd6))


### Features Dendron

* **publish:** add popover for long title in menu ([#1408](https://github.com/dendronhq/dendron/issues/1408)) ([b94b223](https://github.com/dendronhq/dendron/commit/b94b2235f337b2e54bcbf8658e5f4f371804c5f9))
* **publish:** mobile navigation ([#1407](https://github.com/dendronhq/dendron/issues/1407)) ([3487213](https://github.com/dendronhq/dendron/commit/34872138131f030f460dc4cd8e81c65fe7654524))



## 0.60.2-alpha.0 (2021-09-24)



## 0.60.1 (2021-09-24)



# 0.60.0 (2021-09-21)


### Bug Fixes

* **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))
* handle single domain hierarchies gracefully ([10dc5ec](https://github.com/dendronhq/dendron/commit/10dc5ec2ab3ebf767ae7e913cb90ba48e9651447))
* links at top/bottom of reference aren't clickable ([#1282](https://github.com/dendronhq/dendron/issues/1282)) ([b2a00cc](https://github.com/dendronhq/dendron/commit/b2a00cc564299cdb17ae6060154b7616c04e630c))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))


### Features Dendron

* **publish:** notice for dev mode ([#1354](https://github.com/dendronhq/dendron/issues/1354)) ([e3f9fc9](https://github.com/dendronhq/dendron/commit/e3f9fc9d81dc51fbaec5f4bbccb2f6c1dffb1afb))
* additional styling for nextjs ([f8e7972](https://github.com/dendronhq/dendron/commit/f8e797231b586c20ac4d2e1fa1813982cc282375))
* nextjs publishing fulltext search ([#1334](https://github.com/dendronhq/dendron/issues/1334)) ([68f8473](https://github.com/dendronhq/dendron/commit/68f8473badf22494c8d0758f8195e377235321f6))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))



## 0.55.2 (2021-08-21)


### Features Dendron

* make breadcrumbs clickable ([#1164](https://github.com/dendronhq/dendron/issues/1164)) ([a386fc3](https://github.com/dendronhq/dendron/commit/a386fc3dd42769207f58259f292216be51f0a15b))



## 0.55.1 (2021-08-17)


### Features Dendron

* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)





## [0.69.1](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.69.1) (2021-11-16)


### Bug Fixes

* **markdown:** footnote rendering in note references ([#1520](https://github.com/dendronhq/dendron/issues/1520)) ([c4056f5](https://github.com/dendronhq/dendron/commit/c4056f5c4fc4c02dbc14cd4564032caa3619eae5))
* **publish:** enable mermaid support ([fc84c74](https://github.com/dendronhq/dendron/commit/fc84c74c35ce09fe9acde8cc21204d4191a8f80a))
* **publish:** optimize nextjs publishing search ([#1519](https://github.com/dendronhq/dendron/issues/1519)) ([d06dd25](https://github.com/dendronhq/dendron/commit/d06dd25e292532a4ea66d1aa469a27c00b424ad6))
* **publish:** table of contents layout ([#1649](https://github.com/dendronhq/dendron/issues/1649)) ([dbae739](https://github.com/dendronhq/dendron/commit/dbae739ad0650c75a72dd51821b3a5d4ab556839))
* **publish:** Title parts duplicated in Next publishing search ([#1573](https://github.com/dendronhq/dendron/issues/1573)) ([59de1a4](https://github.com/dendronhq/dendron/commit/59de1a486be980c1e6b16753478c62b03c38e018))
* **publish:** unslugify titles in toc ([292a46b](https://github.com/dendronhq/dendron/commit/292a46b14287f2e649a7929516ed97144e9fd2d6))
* **viwes:** `nav_order` property not respected in tree view ([fd328a1](https://github.com/dendronhq/dendron/commit/fd328a17478a063c2ea3d51e00fbc26c7e7e1b26))


### Features Dendron

* **workspace:** better note previews ([#1666](https://github.com/dendronhq/dendron/issues/1666)) ([5cf7067](https://github.com/dendronhq/dendron/commit/5cf70672a24a62d528440f38b44813bfa627fb88))



## 0.62.3 (2021-10-09)


### Bug Fixes

* **publish:** nextjs search note snippets ([#1433](https://github.com/dendronhq/dendron/issues/1433)) ([0cb8f38](https://github.com/dendronhq/dendron/commit/0cb8f38fc9cb5e45af682fc5524ff5eb7ba44ce7))


### Features Dendron

* **publish:** add table of contents ([#1428](https://github.com/dendronhq/dendron/issues/1428)) ([df4b05b](https://github.com/dendronhq/dendron/commit/df4b05ba8526dc32362d6a59543d880f253f02fc))



# 0.61.0 (2021-09-28)


### Bug Fixes

* **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))



## 0.60.2 (2021-09-25)


### Bug Fixes

* **publish:** footer show on first load ([#1413](https://github.com/dendronhq/dendron/issues/1413)) ([00d32cc](https://github.com/dendronhq/dendron/commit/00d32cc830ca6da3160a9cee86386e50b3a35fd6))


### Features Dendron

* **publish:** add popover for long title in menu ([#1408](https://github.com/dendronhq/dendron/issues/1408)) ([b94b223](https://github.com/dendronhq/dendron/commit/b94b2235f337b2e54bcbf8658e5f4f371804c5f9))
* **publish:** mobile navigation ([#1407](https://github.com/dendronhq/dendron/issues/1407)) ([3487213](https://github.com/dendronhq/dendron/commit/34872138131f030f460dc4cd8e81c65fe7654524))



## 0.60.2-alpha.0 (2021-09-24)



## 0.60.1 (2021-09-24)



# 0.60.0 (2021-09-21)


### Bug Fixes

* **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))
* handle single domain hierarchies gracefully ([10dc5ec](https://github.com/dendronhq/dendron/commit/10dc5ec2ab3ebf767ae7e913cb90ba48e9651447))
* links at top/bottom of reference aren't clickable ([#1282](https://github.com/dendronhq/dendron/issues/1282)) ([b2a00cc](https://github.com/dendronhq/dendron/commit/b2a00cc564299cdb17ae6060154b7616c04e630c))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))


### Features Dendron

* **publish:** notice for dev mode ([#1354](https://github.com/dendronhq/dendron/issues/1354)) ([e3f9fc9](https://github.com/dendronhq/dendron/commit/e3f9fc9d81dc51fbaec5f4bbccb2f6c1dffb1afb))
* additional styling for nextjs ([f8e7972](https://github.com/dendronhq/dendron/commit/f8e797231b586c20ac4d2e1fa1813982cc282375))
* nextjs publishing fulltext search ([#1334](https://github.com/dendronhq/dendron/issues/1334)) ([68f8473](https://github.com/dendronhq/dendron/commit/68f8473badf22494c8d0758f8195e377235321f6))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))



## 0.55.2 (2021-08-21)


### Features Dendron

* make breadcrumbs clickable ([#1164](https://github.com/dendronhq/dendron/issues/1164)) ([a386fc3](https://github.com/dendronhq/dendron/commit/a386fc3dd42769207f58259f292216be51f0a15b))



## 0.55.1 (2021-08-17)


### Features Dendron

* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)





# [0.69.0](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.69.0) (2021-11-16)


### Bug Fixes

* **markdown:** footnote rendering in note references ([#1520](https://github.com/dendronhq/dendron/issues/1520)) ([c4056f5](https://github.com/dendronhq/dendron/commit/c4056f5c4fc4c02dbc14cd4564032caa3619eae5))
* **publish:** enable mermaid support ([fc84c74](https://github.com/dendronhq/dendron/commit/fc84c74c35ce09fe9acde8cc21204d4191a8f80a))
* **publish:** optimize nextjs publishing search ([#1519](https://github.com/dendronhq/dendron/issues/1519)) ([d06dd25](https://github.com/dendronhq/dendron/commit/d06dd25e292532a4ea66d1aa469a27c00b424ad6))
* **publish:** table of contents layout ([#1649](https://github.com/dendronhq/dendron/issues/1649)) ([dbae739](https://github.com/dendronhq/dendron/commit/dbae739ad0650c75a72dd51821b3a5d4ab556839))
* **publish:** Title parts duplicated in Next publishing search ([#1573](https://github.com/dendronhq/dendron/issues/1573)) ([59de1a4](https://github.com/dendronhq/dendron/commit/59de1a486be980c1e6b16753478c62b03c38e018))
* **publish:** unslugify titles in toc ([292a46b](https://github.com/dendronhq/dendron/commit/292a46b14287f2e649a7929516ed97144e9fd2d6))
* **viwes:** `nav_order` property not respected in tree view ([fd328a1](https://github.com/dendronhq/dendron/commit/fd328a17478a063c2ea3d51e00fbc26c7e7e1b26))


### Features Dendron

* **workspace:** better note previews ([#1666](https://github.com/dendronhq/dendron/issues/1666)) ([5cf7067](https://github.com/dendronhq/dendron/commit/5cf70672a24a62d528440f38b44813bfa627fb88))



## 0.62.3 (2021-10-09)


### Bug Fixes

* **publish:** nextjs search note snippets ([#1433](https://github.com/dendronhq/dendron/issues/1433)) ([0cb8f38](https://github.com/dendronhq/dendron/commit/0cb8f38fc9cb5e45af682fc5524ff5eb7ba44ce7))


### Features Dendron

* **publish:** add table of contents ([#1428](https://github.com/dendronhq/dendron/issues/1428)) ([df4b05b](https://github.com/dendronhq/dendron/commit/df4b05ba8526dc32362d6a59543d880f253f02fc))



# 0.61.0 (2021-09-28)


### Bug Fixes

* **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))



## 0.60.2 (2021-09-25)


### Bug Fixes

* **publish:** footer show on first load ([#1413](https://github.com/dendronhq/dendron/issues/1413)) ([00d32cc](https://github.com/dendronhq/dendron/commit/00d32cc830ca6da3160a9cee86386e50b3a35fd6))


### Features Dendron

* **publish:** add popover for long title in menu ([#1408](https://github.com/dendronhq/dendron/issues/1408)) ([b94b223](https://github.com/dendronhq/dendron/commit/b94b2235f337b2e54bcbf8658e5f4f371804c5f9))
* **publish:** mobile navigation ([#1407](https://github.com/dendronhq/dendron/issues/1407)) ([3487213](https://github.com/dendronhq/dendron/commit/34872138131f030f460dc4cd8e81c65fe7654524))



## 0.60.2-alpha.0 (2021-09-24)



## 0.60.1 (2021-09-24)



# 0.60.0 (2021-09-21)


### Bug Fixes

* **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))
* handle single domain hierarchies gracefully ([10dc5ec](https://github.com/dendronhq/dendron/commit/10dc5ec2ab3ebf767ae7e913cb90ba48e9651447))
* links at top/bottom of reference aren't clickable ([#1282](https://github.com/dendronhq/dendron/issues/1282)) ([b2a00cc](https://github.com/dendronhq/dendron/commit/b2a00cc564299cdb17ae6060154b7616c04e630c))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))


### Features Dendron

* **publish:** notice for dev mode ([#1354](https://github.com/dendronhq/dendron/issues/1354)) ([e3f9fc9](https://github.com/dendronhq/dendron/commit/e3f9fc9d81dc51fbaec5f4bbccb2f6c1dffb1afb))
* additional styling for nextjs ([f8e7972](https://github.com/dendronhq/dendron/commit/f8e797231b586c20ac4d2e1fa1813982cc282375))
* nextjs publishing fulltext search ([#1334](https://github.com/dendronhq/dendron/issues/1334)) ([68f8473](https://github.com/dendronhq/dendron/commit/68f8473badf22494c8d0758f8195e377235321f6))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))



## 0.55.2 (2021-08-21)


### Features Dendron

* make breadcrumbs clickable ([#1164](https://github.com/dendronhq/dendron/issues/1164)) ([a386fc3](https://github.com/dendronhq/dendron/commit/a386fc3dd42769207f58259f292216be51f0a15b))



## 0.55.1 (2021-08-17)


### Features Dendron

* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)





## [0.68.2](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.68.2) (2021-11-12)


### Bug Fixes

* **markdown:** footnote rendering in note references ([#1520](https://github.com/dendronhq/dendron/issues/1520)) ([c4056f5](https://github.com/dendronhq/dendron/commit/c4056f5c4fc4c02dbc14cd4564032caa3619eae5))
* **publish:** enable mermaid support ([fc84c74](https://github.com/dendronhq/dendron/commit/fc84c74c35ce09fe9acde8cc21204d4191a8f80a))
* **publish:** optimize nextjs publishing search ([#1519](https://github.com/dendronhq/dendron/issues/1519)) ([d06dd25](https://github.com/dendronhq/dendron/commit/d06dd25e292532a4ea66d1aa469a27c00b424ad6))
* **publish:** table of contents layout ([#1649](https://github.com/dendronhq/dendron/issues/1649)) ([dbae739](https://github.com/dendronhq/dendron/commit/dbae739ad0650c75a72dd51821b3a5d4ab556839))
* **publish:** Title parts duplicated in Next publishing search ([#1573](https://github.com/dendronhq/dendron/issues/1573)) ([59de1a4](https://github.com/dendronhq/dendron/commit/59de1a486be980c1e6b16753478c62b03c38e018))
* **publish:** unslugify titles in toc ([292a46b](https://github.com/dendronhq/dendron/commit/292a46b14287f2e649a7929516ed97144e9fd2d6))
* **viwes:** `nav_order` property not respected in tree view ([fd328a1](https://github.com/dendronhq/dendron/commit/fd328a17478a063c2ea3d51e00fbc26c7e7e1b26))


### Features Dendron

* **workspace:** better note previews ([#1666](https://github.com/dendronhq/dendron/issues/1666)) ([5cf7067](https://github.com/dendronhq/dendron/commit/5cf70672a24a62d528440f38b44813bfa627fb88))



## 0.62.3 (2021-10-09)


### Bug Fixes

* **publish:** nextjs search note snippets ([#1433](https://github.com/dendronhq/dendron/issues/1433)) ([0cb8f38](https://github.com/dendronhq/dendron/commit/0cb8f38fc9cb5e45af682fc5524ff5eb7ba44ce7))


### Features Dendron

* **publish:** add table of contents ([#1428](https://github.com/dendronhq/dendron/issues/1428)) ([df4b05b](https://github.com/dendronhq/dendron/commit/df4b05ba8526dc32362d6a59543d880f253f02fc))



# 0.61.0 (2021-09-28)


### Bug Fixes

* **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))



## 0.60.2 (2021-09-25)


### Bug Fixes

* **publish:** footer show on first load ([#1413](https://github.com/dendronhq/dendron/issues/1413)) ([00d32cc](https://github.com/dendronhq/dendron/commit/00d32cc830ca6da3160a9cee86386e50b3a35fd6))


### Features Dendron

* **publish:** add popover for long title in menu ([#1408](https://github.com/dendronhq/dendron/issues/1408)) ([b94b223](https://github.com/dendronhq/dendron/commit/b94b2235f337b2e54bcbf8658e5f4f371804c5f9))
* **publish:** mobile navigation ([#1407](https://github.com/dendronhq/dendron/issues/1407)) ([3487213](https://github.com/dendronhq/dendron/commit/34872138131f030f460dc4cd8e81c65fe7654524))



## 0.60.2-alpha.0 (2021-09-24)



## 0.60.1 (2021-09-24)



# 0.60.0 (2021-09-21)


### Bug Fixes

* **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))
* handle single domain hierarchies gracefully ([10dc5ec](https://github.com/dendronhq/dendron/commit/10dc5ec2ab3ebf767ae7e913cb90ba48e9651447))
* links at top/bottom of reference aren't clickable ([#1282](https://github.com/dendronhq/dendron/issues/1282)) ([b2a00cc](https://github.com/dendronhq/dendron/commit/b2a00cc564299cdb17ae6060154b7616c04e630c))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))


### Features Dendron

* **publish:** notice for dev mode ([#1354](https://github.com/dendronhq/dendron/issues/1354)) ([e3f9fc9](https://github.com/dendronhq/dendron/commit/e3f9fc9d81dc51fbaec5f4bbccb2f6c1dffb1afb))
* additional styling for nextjs ([f8e7972](https://github.com/dendronhq/dendron/commit/f8e797231b586c20ac4d2e1fa1813982cc282375))
* nextjs publishing fulltext search ([#1334](https://github.com/dendronhq/dendron/issues/1334)) ([68f8473](https://github.com/dendronhq/dendron/commit/68f8473badf22494c8d0758f8195e377235321f6))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))



## 0.55.2 (2021-08-21)


### Features Dendron

* make breadcrumbs clickable ([#1164](https://github.com/dendronhq/dendron/issues/1164)) ([a386fc3](https://github.com/dendronhq/dendron/commit/a386fc3dd42769207f58259f292216be51f0a15b))



## 0.55.1 (2021-08-17)


### Features Dendron

* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)





## [0.68.1](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.68.1) (2021-11-10)


### Bug Fixes

* **markdown:** footnote rendering in note references ([#1520](https://github.com/dendronhq/dendron/issues/1520)) ([c4056f5](https://github.com/dendronhq/dendron/commit/c4056f5c4fc4c02dbc14cd4564032caa3619eae5))
* **publish:** enable mermaid support ([fc84c74](https://github.com/dendronhq/dendron/commit/fc84c74c35ce09fe9acde8cc21204d4191a8f80a))
* **publish:** optimize nextjs publishing search ([#1519](https://github.com/dendronhq/dendron/issues/1519)) ([d06dd25](https://github.com/dendronhq/dendron/commit/d06dd25e292532a4ea66d1aa469a27c00b424ad6))
* **publish:** table of contents layout ([#1649](https://github.com/dendronhq/dendron/issues/1649)) ([dbae739](https://github.com/dendronhq/dendron/commit/dbae739ad0650c75a72dd51821b3a5d4ab556839))
* **publish:** Title parts duplicated in Next publishing search ([#1573](https://github.com/dendronhq/dendron/issues/1573)) ([59de1a4](https://github.com/dendronhq/dendron/commit/59de1a486be980c1e6b16753478c62b03c38e018))
* **publish:** unslugify titles in toc ([292a46b](https://github.com/dendronhq/dendron/commit/292a46b14287f2e649a7929516ed97144e9fd2d6))
* **viwes:** `nav_order` property not respected in tree view ([fd328a1](https://github.com/dendronhq/dendron/commit/fd328a17478a063c2ea3d51e00fbc26c7e7e1b26))


### Features Dendron

* **workspace:** better note previews ([#1666](https://github.com/dendronhq/dendron/issues/1666)) ([5cf7067](https://github.com/dendronhq/dendron/commit/5cf70672a24a62d528440f38b44813bfa627fb88))



## 0.62.3 (2021-10-09)


### Bug Fixes

* **publish:** nextjs search note snippets ([#1433](https://github.com/dendronhq/dendron/issues/1433)) ([0cb8f38](https://github.com/dendronhq/dendron/commit/0cb8f38fc9cb5e45af682fc5524ff5eb7ba44ce7))


### Features Dendron

* **publish:** add table of contents ([#1428](https://github.com/dendronhq/dendron/issues/1428)) ([df4b05b](https://github.com/dendronhq/dendron/commit/df4b05ba8526dc32362d6a59543d880f253f02fc))



# 0.61.0 (2021-09-28)


### Bug Fixes

* **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))



## 0.60.2 (2021-09-25)


### Bug Fixes

* **publish:** footer show on first load ([#1413](https://github.com/dendronhq/dendron/issues/1413)) ([00d32cc](https://github.com/dendronhq/dendron/commit/00d32cc830ca6da3160a9cee86386e50b3a35fd6))


### Features Dendron

* **publish:** add popover for long title in menu ([#1408](https://github.com/dendronhq/dendron/issues/1408)) ([b94b223](https://github.com/dendronhq/dendron/commit/b94b2235f337b2e54bcbf8658e5f4f371804c5f9))
* **publish:** mobile navigation ([#1407](https://github.com/dendronhq/dendron/issues/1407)) ([3487213](https://github.com/dendronhq/dendron/commit/34872138131f030f460dc4cd8e81c65fe7654524))



## 0.60.2-alpha.0 (2021-09-24)



## 0.60.1 (2021-09-24)



# 0.60.0 (2021-09-21)


### Bug Fixes

* **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))
* handle single domain hierarchies gracefully ([10dc5ec](https://github.com/dendronhq/dendron/commit/10dc5ec2ab3ebf767ae7e913cb90ba48e9651447))
* links at top/bottom of reference aren't clickable ([#1282](https://github.com/dendronhq/dendron/issues/1282)) ([b2a00cc](https://github.com/dendronhq/dendron/commit/b2a00cc564299cdb17ae6060154b7616c04e630c))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))


### Features Dendron

* **publish:** notice for dev mode ([#1354](https://github.com/dendronhq/dendron/issues/1354)) ([e3f9fc9](https://github.com/dendronhq/dendron/commit/e3f9fc9d81dc51fbaec5f4bbccb2f6c1dffb1afb))
* additional styling for nextjs ([f8e7972](https://github.com/dendronhq/dendron/commit/f8e797231b586c20ac4d2e1fa1813982cc282375))
* nextjs publishing fulltext search ([#1334](https://github.com/dendronhq/dendron/issues/1334)) ([68f8473](https://github.com/dendronhq/dendron/commit/68f8473badf22494c8d0758f8195e377235321f6))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))



## 0.55.2 (2021-08-21)


### Features Dendron

* make breadcrumbs clickable ([#1164](https://github.com/dendronhq/dendron/issues/1164)) ([a386fc3](https://github.com/dendronhq/dendron/commit/a386fc3dd42769207f58259f292216be51f0a15b))



## 0.55.1 (2021-08-17)


### Features Dendron

* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)





# [0.68.0](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.68.0) (2021-11-09)


### Bug Fixes

* **markdown:** footnote rendering in note references ([#1520](https://github.com/dendronhq/dendron/issues/1520)) ([c4056f5](https://github.com/dendronhq/dendron/commit/c4056f5c4fc4c02dbc14cd4564032caa3619eae5))
* **publish:** enable mermaid support ([fc84c74](https://github.com/dendronhq/dendron/commit/fc84c74c35ce09fe9acde8cc21204d4191a8f80a))
* **publish:** optimize nextjs publishing search ([#1519](https://github.com/dendronhq/dendron/issues/1519)) ([d06dd25](https://github.com/dendronhq/dendron/commit/d06dd25e292532a4ea66d1aa469a27c00b424ad6))
* **publish:** table of contents layout ([#1649](https://github.com/dendronhq/dendron/issues/1649)) ([dbae739](https://github.com/dendronhq/dendron/commit/dbae739ad0650c75a72dd51821b3a5d4ab556839))
* **publish:** Title parts duplicated in Next publishing search ([#1573](https://github.com/dendronhq/dendron/issues/1573)) ([59de1a4](https://github.com/dendronhq/dendron/commit/59de1a486be980c1e6b16753478c62b03c38e018))
* **publish:** unslugify titles in toc ([292a46b](https://github.com/dendronhq/dendron/commit/292a46b14287f2e649a7929516ed97144e9fd2d6))


### Features Dendron

* **workspace:** better note previews ([#1666](https://github.com/dendronhq/dendron/issues/1666)) ([5cf7067](https://github.com/dendronhq/dendron/commit/5cf70672a24a62d528440f38b44813bfa627fb88))



## 0.62.3 (2021-10-09)


### Bug Fixes

* **publish:** nextjs search note snippets ([#1433](https://github.com/dendronhq/dendron/issues/1433)) ([0cb8f38](https://github.com/dendronhq/dendron/commit/0cb8f38fc9cb5e45af682fc5524ff5eb7ba44ce7))


### Features Dendron

* **publish:** add table of contents ([#1428](https://github.com/dendronhq/dendron/issues/1428)) ([df4b05b](https://github.com/dendronhq/dendron/commit/df4b05ba8526dc32362d6a59543d880f253f02fc))



# 0.61.0 (2021-09-28)


### Bug Fixes

* **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))



## 0.60.2 (2021-09-25)


### Bug Fixes

* **publish:** footer show on first load ([#1413](https://github.com/dendronhq/dendron/issues/1413)) ([00d32cc](https://github.com/dendronhq/dendron/commit/00d32cc830ca6da3160a9cee86386e50b3a35fd6))


### Features Dendron

* **publish:** add popover for long title in menu ([#1408](https://github.com/dendronhq/dendron/issues/1408)) ([b94b223](https://github.com/dendronhq/dendron/commit/b94b2235f337b2e54bcbf8658e5f4f371804c5f9))
* **publish:** mobile navigation ([#1407](https://github.com/dendronhq/dendron/issues/1407)) ([3487213](https://github.com/dendronhq/dendron/commit/34872138131f030f460dc4cd8e81c65fe7654524))



## 0.60.2-alpha.0 (2021-09-24)



## 0.60.1 (2021-09-24)



# 0.60.0 (2021-09-21)


### Bug Fixes

* **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))
* handle single domain hierarchies gracefully ([10dc5ec](https://github.com/dendronhq/dendron/commit/10dc5ec2ab3ebf767ae7e913cb90ba48e9651447))
* links at top/bottom of reference aren't clickable ([#1282](https://github.com/dendronhq/dendron/issues/1282)) ([b2a00cc](https://github.com/dendronhq/dendron/commit/b2a00cc564299cdb17ae6060154b7616c04e630c))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))


### Features Dendron

* **publish:** notice for dev mode ([#1354](https://github.com/dendronhq/dendron/issues/1354)) ([e3f9fc9](https://github.com/dendronhq/dendron/commit/e3f9fc9d81dc51fbaec5f4bbccb2f6c1dffb1afb))
* additional styling for nextjs ([f8e7972](https://github.com/dendronhq/dendron/commit/f8e797231b586c20ac4d2e1fa1813982cc282375))
* nextjs publishing fulltext search ([#1334](https://github.com/dendronhq/dendron/issues/1334)) ([68f8473](https://github.com/dendronhq/dendron/commit/68f8473badf22494c8d0758f8195e377235321f6))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))



## 0.55.2 (2021-08-21)


### Features Dendron

* make breadcrumbs clickable ([#1164](https://github.com/dendronhq/dendron/issues/1164)) ([a386fc3](https://github.com/dendronhq/dendron/commit/a386fc3dd42769207f58259f292216be51f0a15b))



## 0.55.1 (2021-08-17)


### Features Dendron

* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)





## [0.67.3-alpha.3](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.67.3-alpha.3) (2021-11-09)


### Bug Fixes

* **markdown:** footnote rendering in note references ([#1520](https://github.com/dendronhq/dendron/issues/1520)) ([c4056f5](https://github.com/dendronhq/dendron/commit/c4056f5c4fc4c02dbc14cd4564032caa3619eae5))
* **publish:** enable mermaid support ([fc84c74](https://github.com/dendronhq/dendron/commit/fc84c74c35ce09fe9acde8cc21204d4191a8f80a))
* **publish:** optimize nextjs publishing search ([#1519](https://github.com/dendronhq/dendron/issues/1519)) ([d06dd25](https://github.com/dendronhq/dendron/commit/d06dd25e292532a4ea66d1aa469a27c00b424ad6))
* **publish:** table of contents layout ([#1649](https://github.com/dendronhq/dendron/issues/1649)) ([dbae739](https://github.com/dendronhq/dendron/commit/dbae739ad0650c75a72dd51821b3a5d4ab556839))
* **publish:** Title parts duplicated in Next publishing search ([#1573](https://github.com/dendronhq/dendron/issues/1573)) ([59de1a4](https://github.com/dendronhq/dendron/commit/59de1a486be980c1e6b16753478c62b03c38e018))
* **publish:** unslugify titles in toc ([292a46b](https://github.com/dendronhq/dendron/commit/292a46b14287f2e649a7929516ed97144e9fd2d6))



## 0.62.3 (2021-10-09)


### Bug Fixes

* **publish:** nextjs search note snippets ([#1433](https://github.com/dendronhq/dendron/issues/1433)) ([0cb8f38](https://github.com/dendronhq/dendron/commit/0cb8f38fc9cb5e45af682fc5524ff5eb7ba44ce7))


### Features Dendron

* **publish:** add table of contents ([#1428](https://github.com/dendronhq/dendron/issues/1428)) ([df4b05b](https://github.com/dendronhq/dendron/commit/df4b05ba8526dc32362d6a59543d880f253f02fc))



# 0.61.0 (2021-09-28)


### Bug Fixes

* **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))



## 0.60.2 (2021-09-25)


### Bug Fixes

* **publish:** footer show on first load ([#1413](https://github.com/dendronhq/dendron/issues/1413)) ([00d32cc](https://github.com/dendronhq/dendron/commit/00d32cc830ca6da3160a9cee86386e50b3a35fd6))


### Features Dendron

* **publish:** add popover for long title in menu ([#1408](https://github.com/dendronhq/dendron/issues/1408)) ([b94b223](https://github.com/dendronhq/dendron/commit/b94b2235f337b2e54bcbf8658e5f4f371804c5f9))
* **publish:** mobile navigation ([#1407](https://github.com/dendronhq/dendron/issues/1407)) ([3487213](https://github.com/dendronhq/dendron/commit/34872138131f030f460dc4cd8e81c65fe7654524))



## 0.60.2-alpha.0 (2021-09-24)



## 0.60.1 (2021-09-24)



# 0.60.0 (2021-09-21)


### Bug Fixes

* **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))
* handle single domain hierarchies gracefully ([10dc5ec](https://github.com/dendronhq/dendron/commit/10dc5ec2ab3ebf767ae7e913cb90ba48e9651447))
* links at top/bottom of reference aren't clickable ([#1282](https://github.com/dendronhq/dendron/issues/1282)) ([b2a00cc](https://github.com/dendronhq/dendron/commit/b2a00cc564299cdb17ae6060154b7616c04e630c))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))


### Features Dendron

* **publish:** notice for dev mode ([#1354](https://github.com/dendronhq/dendron/issues/1354)) ([e3f9fc9](https://github.com/dendronhq/dendron/commit/e3f9fc9d81dc51fbaec5f4bbccb2f6c1dffb1afb))
* additional styling for nextjs ([f8e7972](https://github.com/dendronhq/dendron/commit/f8e797231b586c20ac4d2e1fa1813982cc282375))
* nextjs publishing fulltext search ([#1334](https://github.com/dendronhq/dendron/issues/1334)) ([68f8473](https://github.com/dendronhq/dendron/commit/68f8473badf22494c8d0758f8195e377235321f6))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))



## 0.55.2 (2021-08-21)


### Features Dendron

* make breadcrumbs clickable ([#1164](https://github.com/dendronhq/dendron/issues/1164)) ([a386fc3](https://github.com/dendronhq/dendron/commit/a386fc3dd42769207f58259f292216be51f0a15b))



## 0.55.1 (2021-08-17)


### Features Dendron

* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)





## [0.67.3-alpha.2](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.67.3-alpha.2) (2021-11-08)


### Bug Fixes

* **markdown:** footnote rendering in note references ([#1520](https://github.com/dendronhq/dendron/issues/1520)) ([c4056f5](https://github.com/dendronhq/dendron/commit/c4056f5c4fc4c02dbc14cd4564032caa3619eae5))
* **publish:** enable mermaid support ([fc84c74](https://github.com/dendronhq/dendron/commit/fc84c74c35ce09fe9acde8cc21204d4191a8f80a))
* **publish:** optimize nextjs publishing search ([#1519](https://github.com/dendronhq/dendron/issues/1519)) ([d06dd25](https://github.com/dendronhq/dendron/commit/d06dd25e292532a4ea66d1aa469a27c00b424ad6))
* **publish:** table of contents layout ([#1649](https://github.com/dendronhq/dendron/issues/1649)) ([dbae739](https://github.com/dendronhq/dendron/commit/dbae739ad0650c75a72dd51821b3a5d4ab556839))
* **publish:** Title parts duplicated in Next publishing search ([#1573](https://github.com/dendronhq/dendron/issues/1573)) ([59de1a4](https://github.com/dendronhq/dendron/commit/59de1a486be980c1e6b16753478c62b03c38e018))
* **publish:** unslugify titles in toc ([292a46b](https://github.com/dendronhq/dendron/commit/292a46b14287f2e649a7929516ed97144e9fd2d6))



## 0.62.3 (2021-10-09)


### Bug Fixes

* **publish:** nextjs search note snippets ([#1433](https://github.com/dendronhq/dendron/issues/1433)) ([0cb8f38](https://github.com/dendronhq/dendron/commit/0cb8f38fc9cb5e45af682fc5524ff5eb7ba44ce7))


### Features Dendron

* **publish:** add table of contents ([#1428](https://github.com/dendronhq/dendron/issues/1428)) ([df4b05b](https://github.com/dendronhq/dendron/commit/df4b05ba8526dc32362d6a59543d880f253f02fc))



# 0.61.0 (2021-09-28)


### Bug Fixes

* **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))



## 0.60.2 (2021-09-25)


### Bug Fixes

* **publish:** footer show on first load ([#1413](https://github.com/dendronhq/dendron/issues/1413)) ([00d32cc](https://github.com/dendronhq/dendron/commit/00d32cc830ca6da3160a9cee86386e50b3a35fd6))


### Features Dendron

* **publish:** add popover for long title in menu ([#1408](https://github.com/dendronhq/dendron/issues/1408)) ([b94b223](https://github.com/dendronhq/dendron/commit/b94b2235f337b2e54bcbf8658e5f4f371804c5f9))
* **publish:** mobile navigation ([#1407](https://github.com/dendronhq/dendron/issues/1407)) ([3487213](https://github.com/dendronhq/dendron/commit/34872138131f030f460dc4cd8e81c65fe7654524))



## 0.60.2-alpha.0 (2021-09-24)



## 0.60.1 (2021-09-24)



# 0.60.0 (2021-09-21)


### Bug Fixes

* **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))
* handle single domain hierarchies gracefully ([10dc5ec](https://github.com/dendronhq/dendron/commit/10dc5ec2ab3ebf767ae7e913cb90ba48e9651447))
* links at top/bottom of reference aren't clickable ([#1282](https://github.com/dendronhq/dendron/issues/1282)) ([b2a00cc](https://github.com/dendronhq/dendron/commit/b2a00cc564299cdb17ae6060154b7616c04e630c))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))


### Features Dendron

* **publish:** notice for dev mode ([#1354](https://github.com/dendronhq/dendron/issues/1354)) ([e3f9fc9](https://github.com/dendronhq/dendron/commit/e3f9fc9d81dc51fbaec5f4bbccb2f6c1dffb1afb))
* additional styling for nextjs ([f8e7972](https://github.com/dendronhq/dendron/commit/f8e797231b586c20ac4d2e1fa1813982cc282375))
* nextjs publishing fulltext search ([#1334](https://github.com/dendronhq/dendron/issues/1334)) ([68f8473](https://github.com/dendronhq/dendron/commit/68f8473badf22494c8d0758f8195e377235321f6))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))



## 0.55.2 (2021-08-21)


### Features Dendron

* make breadcrumbs clickable ([#1164](https://github.com/dendronhq/dendron/issues/1164)) ([a386fc3](https://github.com/dendronhq/dendron/commit/a386fc3dd42769207f58259f292216be51f0a15b))



## 0.55.1 (2021-08-17)


### Features Dendron

* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)





## [0.67.3-alpha.1](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.67.3-alpha.1) (2021-11-07)


### Bug Fixes

* **markdown:** footnote rendering in note references ([#1520](https://github.com/dendronhq/dendron/issues/1520)) ([c4056f5](https://github.com/dendronhq/dendron/commit/c4056f5c4fc4c02dbc14cd4564032caa3619eae5))
* **publish:** enable mermaid support ([fc84c74](https://github.com/dendronhq/dendron/commit/fc84c74c35ce09fe9acde8cc21204d4191a8f80a))
* **publish:** optimize nextjs publishing search ([#1519](https://github.com/dendronhq/dendron/issues/1519)) ([d06dd25](https://github.com/dendronhq/dendron/commit/d06dd25e292532a4ea66d1aa469a27c00b424ad6))
* **publish:** table of contents layout ([#1649](https://github.com/dendronhq/dendron/issues/1649)) ([dbae739](https://github.com/dendronhq/dendron/commit/dbae739ad0650c75a72dd51821b3a5d4ab556839))
* **publish:** Title parts duplicated in Next publishing search ([#1573](https://github.com/dendronhq/dendron/issues/1573)) ([59de1a4](https://github.com/dendronhq/dendron/commit/59de1a486be980c1e6b16753478c62b03c38e018))
* **publish:** unslugify titles in toc ([292a46b](https://github.com/dendronhq/dendron/commit/292a46b14287f2e649a7929516ed97144e9fd2d6))



## 0.62.3 (2021-10-09)


### Bug Fixes

* **publish:** nextjs search note snippets ([#1433](https://github.com/dendronhq/dendron/issues/1433)) ([0cb8f38](https://github.com/dendronhq/dendron/commit/0cb8f38fc9cb5e45af682fc5524ff5eb7ba44ce7))


### Features Dendron

* **publish:** add table of contents ([#1428](https://github.com/dendronhq/dendron/issues/1428)) ([df4b05b](https://github.com/dendronhq/dendron/commit/df4b05ba8526dc32362d6a59543d880f253f02fc))



# 0.61.0 (2021-09-28)


### Bug Fixes

* **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))



## 0.60.2 (2021-09-25)


### Bug Fixes

* **publish:** footer show on first load ([#1413](https://github.com/dendronhq/dendron/issues/1413)) ([00d32cc](https://github.com/dendronhq/dendron/commit/00d32cc830ca6da3160a9cee86386e50b3a35fd6))


### Features Dendron

* **publish:** add popover for long title in menu ([#1408](https://github.com/dendronhq/dendron/issues/1408)) ([b94b223](https://github.com/dendronhq/dendron/commit/b94b2235f337b2e54bcbf8658e5f4f371804c5f9))
* **publish:** mobile navigation ([#1407](https://github.com/dendronhq/dendron/issues/1407)) ([3487213](https://github.com/dendronhq/dendron/commit/34872138131f030f460dc4cd8e81c65fe7654524))



## 0.60.2-alpha.0 (2021-09-24)



## 0.60.1 (2021-09-24)



# 0.60.0 (2021-09-21)


### Bug Fixes

* **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))
* handle single domain hierarchies gracefully ([10dc5ec](https://github.com/dendronhq/dendron/commit/10dc5ec2ab3ebf767ae7e913cb90ba48e9651447))
* links at top/bottom of reference aren't clickable ([#1282](https://github.com/dendronhq/dendron/issues/1282)) ([b2a00cc](https://github.com/dendronhq/dendron/commit/b2a00cc564299cdb17ae6060154b7616c04e630c))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))


### Features Dendron

* **publish:** notice for dev mode ([#1354](https://github.com/dendronhq/dendron/issues/1354)) ([e3f9fc9](https://github.com/dendronhq/dendron/commit/e3f9fc9d81dc51fbaec5f4bbccb2f6c1dffb1afb))
* additional styling for nextjs ([f8e7972](https://github.com/dendronhq/dendron/commit/f8e797231b586c20ac4d2e1fa1813982cc282375))
* nextjs publishing fulltext search ([#1334](https://github.com/dendronhq/dendron/issues/1334)) ([68f8473](https://github.com/dendronhq/dendron/commit/68f8473badf22494c8d0758f8195e377235321f6))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))



## 0.55.2 (2021-08-21)


### Features Dendron

* make breadcrumbs clickable ([#1164](https://github.com/dendronhq/dendron/issues/1164)) ([a386fc3](https://github.com/dendronhq/dendron/commit/a386fc3dd42769207f58259f292216be51f0a15b))



## 0.55.1 (2021-08-17)


### Features Dendron

* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)





## [0.67.3-alpha.0](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.67.3-alpha.0) (2021-11-07)


### Bug Fixes

* **markdown:** footnote rendering in note references ([#1520](https://github.com/dendronhq/dendron/issues/1520)) ([c4056f5](https://github.com/dendronhq/dendron/commit/c4056f5c4fc4c02dbc14cd4564032caa3619eae5))
* **publish:** enable mermaid support ([fc84c74](https://github.com/dendronhq/dendron/commit/fc84c74c35ce09fe9acde8cc21204d4191a8f80a))
* **publish:** optimize nextjs publishing search ([#1519](https://github.com/dendronhq/dendron/issues/1519)) ([d06dd25](https://github.com/dendronhq/dendron/commit/d06dd25e292532a4ea66d1aa469a27c00b424ad6))
* **publish:** table of contents layout ([#1649](https://github.com/dendronhq/dendron/issues/1649)) ([dbae739](https://github.com/dendronhq/dendron/commit/dbae739ad0650c75a72dd51821b3a5d4ab556839))
* **publish:** Title parts duplicated in Next publishing search ([#1573](https://github.com/dendronhq/dendron/issues/1573)) ([59de1a4](https://github.com/dendronhq/dendron/commit/59de1a486be980c1e6b16753478c62b03c38e018))
* **publish:** unslugify titles in toc ([292a46b](https://github.com/dendronhq/dendron/commit/292a46b14287f2e649a7929516ed97144e9fd2d6))



## 0.62.3 (2021-10-09)


### Bug Fixes

* **publish:** nextjs search note snippets ([#1433](https://github.com/dendronhq/dendron/issues/1433)) ([0cb8f38](https://github.com/dendronhq/dendron/commit/0cb8f38fc9cb5e45af682fc5524ff5eb7ba44ce7))


### Features Dendron

* **publish:** add table of contents ([#1428](https://github.com/dendronhq/dendron/issues/1428)) ([df4b05b](https://github.com/dendronhq/dendron/commit/df4b05ba8526dc32362d6a59543d880f253f02fc))



# 0.61.0 (2021-09-28)


### Bug Fixes

* **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))



## 0.60.2 (2021-09-25)


### Bug Fixes

* **publish:** footer show on first load ([#1413](https://github.com/dendronhq/dendron/issues/1413)) ([00d32cc](https://github.com/dendronhq/dendron/commit/00d32cc830ca6da3160a9cee86386e50b3a35fd6))


### Features Dendron

* **publish:** add popover for long title in menu ([#1408](https://github.com/dendronhq/dendron/issues/1408)) ([b94b223](https://github.com/dendronhq/dendron/commit/b94b2235f337b2e54bcbf8658e5f4f371804c5f9))
* **publish:** mobile navigation ([#1407](https://github.com/dendronhq/dendron/issues/1407)) ([3487213](https://github.com/dendronhq/dendron/commit/34872138131f030f460dc4cd8e81c65fe7654524))



## 0.60.2-alpha.0 (2021-09-24)



## 0.60.1 (2021-09-24)



# 0.60.0 (2021-09-21)


### Bug Fixes

* **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))
* handle single domain hierarchies gracefully ([10dc5ec](https://github.com/dendronhq/dendron/commit/10dc5ec2ab3ebf767ae7e913cb90ba48e9651447))
* links at top/bottom of reference aren't clickable ([#1282](https://github.com/dendronhq/dendron/issues/1282)) ([b2a00cc](https://github.com/dendronhq/dendron/commit/b2a00cc564299cdb17ae6060154b7616c04e630c))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))


### Features Dendron

* **publish:** notice for dev mode ([#1354](https://github.com/dendronhq/dendron/issues/1354)) ([e3f9fc9](https://github.com/dendronhq/dendron/commit/e3f9fc9d81dc51fbaec5f4bbccb2f6c1dffb1afb))
* additional styling for nextjs ([f8e7972](https://github.com/dendronhq/dendron/commit/f8e797231b586c20ac4d2e1fa1813982cc282375))
* nextjs publishing fulltext search ([#1334](https://github.com/dendronhq/dendron/issues/1334)) ([68f8473](https://github.com/dendronhq/dendron/commit/68f8473badf22494c8d0758f8195e377235321f6))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))



## 0.55.2 (2021-08-21)


### Features Dendron

* make breadcrumbs clickable ([#1164](https://github.com/dendronhq/dendron/issues/1164)) ([a386fc3](https://github.com/dendronhq/dendron/commit/a386fc3dd42769207f58259f292216be51f0a15b))



## 0.55.1 (2021-08-17)


### Features Dendron

* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)





## [0.67.2](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.67.2) (2021-11-05)


### Bug Fixes

* **markdown:** footnote rendering in note references ([#1520](https://github.com/dendronhq/dendron/issues/1520)) ([c4056f5](https://github.com/dendronhq/dendron/commit/c4056f5c4fc4c02dbc14cd4564032caa3619eae5))
* **publish:** enable mermaid support ([fc84c74](https://github.com/dendronhq/dendron/commit/fc84c74c35ce09fe9acde8cc21204d4191a8f80a))
* **publish:** optimize nextjs publishing search ([#1519](https://github.com/dendronhq/dendron/issues/1519)) ([d06dd25](https://github.com/dendronhq/dendron/commit/d06dd25e292532a4ea66d1aa469a27c00b424ad6))
* **publish:** table of contents layout ([#1649](https://github.com/dendronhq/dendron/issues/1649)) ([dbae739](https://github.com/dendronhq/dendron/commit/dbae739ad0650c75a72dd51821b3a5d4ab556839))
* **publish:** Title parts duplicated in Next publishing search ([#1573](https://github.com/dendronhq/dendron/issues/1573)) ([59de1a4](https://github.com/dendronhq/dendron/commit/59de1a486be980c1e6b16753478c62b03c38e018))
* **publish:** unslugify titles in toc ([292a46b](https://github.com/dendronhq/dendron/commit/292a46b14287f2e649a7929516ed97144e9fd2d6))



## 0.62.3 (2021-10-09)


### Bug Fixes

* **publish:** nextjs search note snippets ([#1433](https://github.com/dendronhq/dendron/issues/1433)) ([0cb8f38](https://github.com/dendronhq/dendron/commit/0cb8f38fc9cb5e45af682fc5524ff5eb7ba44ce7))


### Features Dendron

* **publish:** add table of contents ([#1428](https://github.com/dendronhq/dendron/issues/1428)) ([df4b05b](https://github.com/dendronhq/dendron/commit/df4b05ba8526dc32362d6a59543d880f253f02fc))



# 0.61.0 (2021-09-28)


### Bug Fixes

* **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))



## 0.60.2 (2021-09-25)


### Bug Fixes

* **publish:** footer show on first load ([#1413](https://github.com/dendronhq/dendron/issues/1413)) ([00d32cc](https://github.com/dendronhq/dendron/commit/00d32cc830ca6da3160a9cee86386e50b3a35fd6))


### Features Dendron

* **publish:** add popover for long title in menu ([#1408](https://github.com/dendronhq/dendron/issues/1408)) ([b94b223](https://github.com/dendronhq/dendron/commit/b94b2235f337b2e54bcbf8658e5f4f371804c5f9))
* **publish:** mobile navigation ([#1407](https://github.com/dendronhq/dendron/issues/1407)) ([3487213](https://github.com/dendronhq/dendron/commit/34872138131f030f460dc4cd8e81c65fe7654524))



## 0.60.2-alpha.0 (2021-09-24)



## 0.60.1 (2021-09-24)



# 0.60.0 (2021-09-21)


### Bug Fixes

* **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))
* handle single domain hierarchies gracefully ([10dc5ec](https://github.com/dendronhq/dendron/commit/10dc5ec2ab3ebf767ae7e913cb90ba48e9651447))
* links at top/bottom of reference aren't clickable ([#1282](https://github.com/dendronhq/dendron/issues/1282)) ([b2a00cc](https://github.com/dendronhq/dendron/commit/b2a00cc564299cdb17ae6060154b7616c04e630c))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))


### Features Dendron

* **publish:** notice for dev mode ([#1354](https://github.com/dendronhq/dendron/issues/1354)) ([e3f9fc9](https://github.com/dendronhq/dendron/commit/e3f9fc9d81dc51fbaec5f4bbccb2f6c1dffb1afb))
* additional styling for nextjs ([f8e7972](https://github.com/dendronhq/dendron/commit/f8e797231b586c20ac4d2e1fa1813982cc282375))
* nextjs publishing fulltext search ([#1334](https://github.com/dendronhq/dendron/issues/1334)) ([68f8473](https://github.com/dendronhq/dendron/commit/68f8473badf22494c8d0758f8195e377235321f6))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))



## 0.55.2 (2021-08-21)


### Features Dendron

* make breadcrumbs clickable ([#1164](https://github.com/dendronhq/dendron/issues/1164)) ([a386fc3](https://github.com/dendronhq/dendron/commit/a386fc3dd42769207f58259f292216be51f0a15b))



## 0.55.1 (2021-08-17)


### Features Dendron

* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)





## [0.67.1](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.67.1) (2021-11-05)


### Bug Fixes

* **markdown:** footnote rendering in note references ([#1520](https://github.com/dendronhq/dendron/issues/1520)) ([c4056f5](https://github.com/dendronhq/dendron/commit/c4056f5c4fc4c02dbc14cd4564032caa3619eae5))
* **publish:** enable mermaid support ([fc84c74](https://github.com/dendronhq/dendron/commit/fc84c74c35ce09fe9acde8cc21204d4191a8f80a))
* **publish:** optimize nextjs publishing search ([#1519](https://github.com/dendronhq/dendron/issues/1519)) ([d06dd25](https://github.com/dendronhq/dendron/commit/d06dd25e292532a4ea66d1aa469a27c00b424ad6))
* **publish:** table of contents layout ([#1649](https://github.com/dendronhq/dendron/issues/1649)) ([dbae739](https://github.com/dendronhq/dendron/commit/dbae739ad0650c75a72dd51821b3a5d4ab556839))
* **publish:** Title parts duplicated in Next publishing search ([#1573](https://github.com/dendronhq/dendron/issues/1573)) ([59de1a4](https://github.com/dendronhq/dendron/commit/59de1a486be980c1e6b16753478c62b03c38e018))
* **publish:** unslugify titles in toc ([292a46b](https://github.com/dendronhq/dendron/commit/292a46b14287f2e649a7929516ed97144e9fd2d6))



## 0.62.3 (2021-10-09)


### Bug Fixes

* **publish:** nextjs search note snippets ([#1433](https://github.com/dendronhq/dendron/issues/1433)) ([0cb8f38](https://github.com/dendronhq/dendron/commit/0cb8f38fc9cb5e45af682fc5524ff5eb7ba44ce7))


### Features Dendron

* **publish:** add table of contents ([#1428](https://github.com/dendronhq/dendron/issues/1428)) ([df4b05b](https://github.com/dendronhq/dendron/commit/df4b05ba8526dc32362d6a59543d880f253f02fc))



# 0.61.0 (2021-09-28)


### Bug Fixes

* **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))



## 0.60.2 (2021-09-25)


### Bug Fixes

* **publish:** footer show on first load ([#1413](https://github.com/dendronhq/dendron/issues/1413)) ([00d32cc](https://github.com/dendronhq/dendron/commit/00d32cc830ca6da3160a9cee86386e50b3a35fd6))


### Features Dendron

* **publish:** add popover for long title in menu ([#1408](https://github.com/dendronhq/dendron/issues/1408)) ([b94b223](https://github.com/dendronhq/dendron/commit/b94b2235f337b2e54bcbf8658e5f4f371804c5f9))
* **publish:** mobile navigation ([#1407](https://github.com/dendronhq/dendron/issues/1407)) ([3487213](https://github.com/dendronhq/dendron/commit/34872138131f030f460dc4cd8e81c65fe7654524))



## 0.60.2-alpha.0 (2021-09-24)



## 0.60.1 (2021-09-24)



# 0.60.0 (2021-09-21)


### Bug Fixes

* **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))
* handle single domain hierarchies gracefully ([10dc5ec](https://github.com/dendronhq/dendron/commit/10dc5ec2ab3ebf767ae7e913cb90ba48e9651447))
* links at top/bottom of reference aren't clickable ([#1282](https://github.com/dendronhq/dendron/issues/1282)) ([b2a00cc](https://github.com/dendronhq/dendron/commit/b2a00cc564299cdb17ae6060154b7616c04e630c))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))


### Features Dendron

* **publish:** notice for dev mode ([#1354](https://github.com/dendronhq/dendron/issues/1354)) ([e3f9fc9](https://github.com/dendronhq/dendron/commit/e3f9fc9d81dc51fbaec5f4bbccb2f6c1dffb1afb))
* additional styling for nextjs ([f8e7972](https://github.com/dendronhq/dendron/commit/f8e797231b586c20ac4d2e1fa1813982cc282375))
* nextjs publishing fulltext search ([#1334](https://github.com/dendronhq/dendron/issues/1334)) ([68f8473](https://github.com/dendronhq/dendron/commit/68f8473badf22494c8d0758f8195e377235321f6))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))



## 0.55.2 (2021-08-21)


### Features Dendron

* make breadcrumbs clickable ([#1164](https://github.com/dendronhq/dendron/issues/1164)) ([a386fc3](https://github.com/dendronhq/dendron/commit/a386fc3dd42769207f58259f292216be51f0a15b))



## 0.55.1 (2021-08-17)


### Features Dendron

* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)





# [0.67.0](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.67.0) (2021-11-05)


### Bug Fixes

* **markdown:** footnote rendering in note references ([#1520](https://github.com/dendronhq/dendron/issues/1520)) ([c4056f5](https://github.com/dendronhq/dendron/commit/c4056f5c4fc4c02dbc14cd4564032caa3619eae5))
* **publish:** enable mermaid support ([fc84c74](https://github.com/dendronhq/dendron/commit/fc84c74c35ce09fe9acde8cc21204d4191a8f80a))
* **publish:** optimize nextjs publishing search ([#1519](https://github.com/dendronhq/dendron/issues/1519)) ([d06dd25](https://github.com/dendronhq/dendron/commit/d06dd25e292532a4ea66d1aa469a27c00b424ad6))
* **publish:** table of contents layout ([#1649](https://github.com/dendronhq/dendron/issues/1649)) ([dbae739](https://github.com/dendronhq/dendron/commit/dbae739ad0650c75a72dd51821b3a5d4ab556839))
* **publish:** Title parts duplicated in Next publishing search ([#1573](https://github.com/dendronhq/dendron/issues/1573)) ([59de1a4](https://github.com/dendronhq/dendron/commit/59de1a486be980c1e6b16753478c62b03c38e018))
* **publish:** unslugify titles in toc ([292a46b](https://github.com/dendronhq/dendron/commit/292a46b14287f2e649a7929516ed97144e9fd2d6))



## 0.62.3 (2021-10-09)


### Bug Fixes

* **publish:** nextjs search note snippets ([#1433](https://github.com/dendronhq/dendron/issues/1433)) ([0cb8f38](https://github.com/dendronhq/dendron/commit/0cb8f38fc9cb5e45af682fc5524ff5eb7ba44ce7))


### Features Dendron

* **publish:** add table of contents ([#1428](https://github.com/dendronhq/dendron/issues/1428)) ([df4b05b](https://github.com/dendronhq/dendron/commit/df4b05ba8526dc32362d6a59543d880f253f02fc))



# 0.61.0 (2021-09-28)


### Bug Fixes

* **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))



## 0.60.2 (2021-09-25)


### Bug Fixes

* **publish:** footer show on first load ([#1413](https://github.com/dendronhq/dendron/issues/1413)) ([00d32cc](https://github.com/dendronhq/dendron/commit/00d32cc830ca6da3160a9cee86386e50b3a35fd6))


### Features Dendron

* **publish:** add popover for long title in menu ([#1408](https://github.com/dendronhq/dendron/issues/1408)) ([b94b223](https://github.com/dendronhq/dendron/commit/b94b2235f337b2e54bcbf8658e5f4f371804c5f9))
* **publish:** mobile navigation ([#1407](https://github.com/dendronhq/dendron/issues/1407)) ([3487213](https://github.com/dendronhq/dendron/commit/34872138131f030f460dc4cd8e81c65fe7654524))



## 0.60.2-alpha.0 (2021-09-24)



## 0.60.1 (2021-09-24)



# 0.60.0 (2021-09-21)


### Bug Fixes

* **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))
* handle single domain hierarchies gracefully ([10dc5ec](https://github.com/dendronhq/dendron/commit/10dc5ec2ab3ebf767ae7e913cb90ba48e9651447))
* links at top/bottom of reference aren't clickable ([#1282](https://github.com/dendronhq/dendron/issues/1282)) ([b2a00cc](https://github.com/dendronhq/dendron/commit/b2a00cc564299cdb17ae6060154b7616c04e630c))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))


### Features Dendron

* **publish:** notice for dev mode ([#1354](https://github.com/dendronhq/dendron/issues/1354)) ([e3f9fc9](https://github.com/dendronhq/dendron/commit/e3f9fc9d81dc51fbaec5f4bbccb2f6c1dffb1afb))
* additional styling for nextjs ([f8e7972](https://github.com/dendronhq/dendron/commit/f8e797231b586c20ac4d2e1fa1813982cc282375))
* nextjs publishing fulltext search ([#1334](https://github.com/dendronhq/dendron/issues/1334)) ([68f8473](https://github.com/dendronhq/dendron/commit/68f8473badf22494c8d0758f8195e377235321f6))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))



## 0.55.2 (2021-08-21)


### Features Dendron

* make breadcrumbs clickable ([#1164](https://github.com/dendronhq/dendron/issues/1164)) ([a386fc3](https://github.com/dendronhq/dendron/commit/a386fc3dd42769207f58259f292216be51f0a15b))



## 0.55.1 (2021-08-17)


### Features Dendron

* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)





## [0.66.2](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.66.2) (2021-11-05)


### Bug Fixes

* **markdown:** footnote rendering in note references ([#1520](https://github.com/dendronhq/dendron/issues/1520)) ([c4056f5](https://github.com/dendronhq/dendron/commit/c4056f5c4fc4c02dbc14cd4564032caa3619eae5))
* **publish:** enable mermaid support ([fc84c74](https://github.com/dendronhq/dendron/commit/fc84c74c35ce09fe9acde8cc21204d4191a8f80a))
* **publish:** optimize nextjs publishing search ([#1519](https://github.com/dendronhq/dendron/issues/1519)) ([d06dd25](https://github.com/dendronhq/dendron/commit/d06dd25e292532a4ea66d1aa469a27c00b424ad6))
* **publish:** table of contents layout ([#1649](https://github.com/dendronhq/dendron/issues/1649)) ([dbae739](https://github.com/dendronhq/dendron/commit/dbae739ad0650c75a72dd51821b3a5d4ab556839))
* **publish:** Title parts duplicated in Next publishing search ([#1573](https://github.com/dendronhq/dendron/issues/1573)) ([59de1a4](https://github.com/dendronhq/dendron/commit/59de1a486be980c1e6b16753478c62b03c38e018))
* **publish:** unslugify titles in toc ([292a46b](https://github.com/dendronhq/dendron/commit/292a46b14287f2e649a7929516ed97144e9fd2d6))



## 0.62.3 (2021-10-09)


### Bug Fixes

* **publish:** nextjs search note snippets ([#1433](https://github.com/dendronhq/dendron/issues/1433)) ([0cb8f38](https://github.com/dendronhq/dendron/commit/0cb8f38fc9cb5e45af682fc5524ff5eb7ba44ce7))


### Features Dendron

* **publish:** add table of contents ([#1428](https://github.com/dendronhq/dendron/issues/1428)) ([df4b05b](https://github.com/dendronhq/dendron/commit/df4b05ba8526dc32362d6a59543d880f253f02fc))



# 0.61.0 (2021-09-28)


### Bug Fixes

* **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))



## 0.60.2 (2021-09-25)


### Bug Fixes

* **publish:** footer show on first load ([#1413](https://github.com/dendronhq/dendron/issues/1413)) ([00d32cc](https://github.com/dendronhq/dendron/commit/00d32cc830ca6da3160a9cee86386e50b3a35fd6))


### Features Dendron

* **publish:** add popover for long title in menu ([#1408](https://github.com/dendronhq/dendron/issues/1408)) ([b94b223](https://github.com/dendronhq/dendron/commit/b94b2235f337b2e54bcbf8658e5f4f371804c5f9))
* **publish:** mobile navigation ([#1407](https://github.com/dendronhq/dendron/issues/1407)) ([3487213](https://github.com/dendronhq/dendron/commit/34872138131f030f460dc4cd8e81c65fe7654524))



## 0.60.2-alpha.0 (2021-09-24)



## 0.60.1 (2021-09-24)



# 0.60.0 (2021-09-21)


### Bug Fixes

* **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))
* handle single domain hierarchies gracefully ([10dc5ec](https://github.com/dendronhq/dendron/commit/10dc5ec2ab3ebf767ae7e913cb90ba48e9651447))
* links at top/bottom of reference aren't clickable ([#1282](https://github.com/dendronhq/dendron/issues/1282)) ([b2a00cc](https://github.com/dendronhq/dendron/commit/b2a00cc564299cdb17ae6060154b7616c04e630c))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))


### Features Dendron

* **publish:** notice for dev mode ([#1354](https://github.com/dendronhq/dendron/issues/1354)) ([e3f9fc9](https://github.com/dendronhq/dendron/commit/e3f9fc9d81dc51fbaec5f4bbccb2f6c1dffb1afb))
* additional styling for nextjs ([f8e7972](https://github.com/dendronhq/dendron/commit/f8e797231b586c20ac4d2e1fa1813982cc282375))
* nextjs publishing fulltext search ([#1334](https://github.com/dendronhq/dendron/issues/1334)) ([68f8473](https://github.com/dendronhq/dendron/commit/68f8473badf22494c8d0758f8195e377235321f6))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))



## 0.55.2 (2021-08-21)


### Features Dendron

* make breadcrumbs clickable ([#1164](https://github.com/dendronhq/dendron/issues/1164)) ([a386fc3](https://github.com/dendronhq/dendron/commit/a386fc3dd42769207f58259f292216be51f0a15b))



## 0.55.1 (2021-08-17)


### Features Dendron

* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)





## [0.66.1](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.66.1) (2021-11-03)


### Bug Fixes

* **markdown:** footnote rendering in note references ([#1520](https://github.com/dendronhq/dendron/issues/1520)) ([c4056f5](https://github.com/dendronhq/dendron/commit/c4056f5c4fc4c02dbc14cd4564032caa3619eae5))
* **publish:** enable mermaid support ([fc84c74](https://github.com/dendronhq/dendron/commit/fc84c74c35ce09fe9acde8cc21204d4191a8f80a))
* **publish:** optimize nextjs publishing search ([#1519](https://github.com/dendronhq/dendron/issues/1519)) ([d06dd25](https://github.com/dendronhq/dendron/commit/d06dd25e292532a4ea66d1aa469a27c00b424ad6))
* **publish:** Title parts duplicated in Next publishing search ([#1573](https://github.com/dendronhq/dendron/issues/1573)) ([59de1a4](https://github.com/dendronhq/dendron/commit/59de1a486be980c1e6b16753478c62b03c38e018))
* **publish:** unslugify titles in toc ([292a46b](https://github.com/dendronhq/dendron/commit/292a46b14287f2e649a7929516ed97144e9fd2d6))



## 0.62.3 (2021-10-09)


### Bug Fixes

* **publish:** nextjs search note snippets ([#1433](https://github.com/dendronhq/dendron/issues/1433)) ([0cb8f38](https://github.com/dendronhq/dendron/commit/0cb8f38fc9cb5e45af682fc5524ff5eb7ba44ce7))


### Features Dendron

* **publish:** add table of contents ([#1428](https://github.com/dendronhq/dendron/issues/1428)) ([df4b05b](https://github.com/dendronhq/dendron/commit/df4b05ba8526dc32362d6a59543d880f253f02fc))



# 0.61.0 (2021-09-28)


### Bug Fixes

* **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))



## 0.60.2 (2021-09-25)


### Bug Fixes

* **publish:** footer show on first load ([#1413](https://github.com/dendronhq/dendron/issues/1413)) ([00d32cc](https://github.com/dendronhq/dendron/commit/00d32cc830ca6da3160a9cee86386e50b3a35fd6))


### Features Dendron

* **publish:** add popover for long title in menu ([#1408](https://github.com/dendronhq/dendron/issues/1408)) ([b94b223](https://github.com/dendronhq/dendron/commit/b94b2235f337b2e54bcbf8658e5f4f371804c5f9))
* **publish:** mobile navigation ([#1407](https://github.com/dendronhq/dendron/issues/1407)) ([3487213](https://github.com/dendronhq/dendron/commit/34872138131f030f460dc4cd8e81c65fe7654524))



## 0.60.2-alpha.0 (2021-09-24)



## 0.60.1 (2021-09-24)



# 0.60.0 (2021-09-21)


### Bug Fixes

* **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))
* handle single domain hierarchies gracefully ([10dc5ec](https://github.com/dendronhq/dendron/commit/10dc5ec2ab3ebf767ae7e913cb90ba48e9651447))
* links at top/bottom of reference aren't clickable ([#1282](https://github.com/dendronhq/dendron/issues/1282)) ([b2a00cc](https://github.com/dendronhq/dendron/commit/b2a00cc564299cdb17ae6060154b7616c04e630c))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))


### Features Dendron

* **publish:** notice for dev mode ([#1354](https://github.com/dendronhq/dendron/issues/1354)) ([e3f9fc9](https://github.com/dendronhq/dendron/commit/e3f9fc9d81dc51fbaec5f4bbccb2f6c1dffb1afb))
* additional styling for nextjs ([f8e7972](https://github.com/dendronhq/dendron/commit/f8e797231b586c20ac4d2e1fa1813982cc282375))
* nextjs publishing fulltext search ([#1334](https://github.com/dendronhq/dendron/issues/1334)) ([68f8473](https://github.com/dendronhq/dendron/commit/68f8473badf22494c8d0758f8195e377235321f6))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))



## 0.55.2 (2021-08-21)


### Features Dendron

* make breadcrumbs clickable ([#1164](https://github.com/dendronhq/dendron/issues/1164)) ([a386fc3](https://github.com/dendronhq/dendron/commit/a386fc3dd42769207f58259f292216be51f0a15b))



## 0.55.1 (2021-08-17)


### Features Dendron

* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)





# [0.66.0](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.66.0) (2021-11-03)


### Bug Fixes

* **markdown:** footnote rendering in note references ([#1520](https://github.com/dendronhq/dendron/issues/1520)) ([c4056f5](https://github.com/dendronhq/dendron/commit/c4056f5c4fc4c02dbc14cd4564032caa3619eae5))
* **publish:** enable mermaid support ([fc84c74](https://github.com/dendronhq/dendron/commit/fc84c74c35ce09fe9acde8cc21204d4191a8f80a))
* **publish:** optimize nextjs publishing search ([#1519](https://github.com/dendronhq/dendron/issues/1519)) ([d06dd25](https://github.com/dendronhq/dendron/commit/d06dd25e292532a4ea66d1aa469a27c00b424ad6))
* **publish:** Title parts duplicated in Next publishing search ([#1573](https://github.com/dendronhq/dendron/issues/1573)) ([59de1a4](https://github.com/dendronhq/dendron/commit/59de1a486be980c1e6b16753478c62b03c38e018))
* **publish:** unslugify titles in toc ([292a46b](https://github.com/dendronhq/dendron/commit/292a46b14287f2e649a7929516ed97144e9fd2d6))



## 0.62.3 (2021-10-09)


### Bug Fixes

* **publish:** nextjs search note snippets ([#1433](https://github.com/dendronhq/dendron/issues/1433)) ([0cb8f38](https://github.com/dendronhq/dendron/commit/0cb8f38fc9cb5e45af682fc5524ff5eb7ba44ce7))


### Features Dendron

* **publish:** add table of contents ([#1428](https://github.com/dendronhq/dendron/issues/1428)) ([df4b05b](https://github.com/dendronhq/dendron/commit/df4b05ba8526dc32362d6a59543d880f253f02fc))



# 0.61.0 (2021-09-28)


### Bug Fixes

* **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))



## 0.60.2 (2021-09-25)


### Bug Fixes

* **publish:** footer show on first load ([#1413](https://github.com/dendronhq/dendron/issues/1413)) ([00d32cc](https://github.com/dendronhq/dendron/commit/00d32cc830ca6da3160a9cee86386e50b3a35fd6))


### Features Dendron

* **publish:** add popover for long title in menu ([#1408](https://github.com/dendronhq/dendron/issues/1408)) ([b94b223](https://github.com/dendronhq/dendron/commit/b94b2235f337b2e54bcbf8658e5f4f371804c5f9))
* **publish:** mobile navigation ([#1407](https://github.com/dendronhq/dendron/issues/1407)) ([3487213](https://github.com/dendronhq/dendron/commit/34872138131f030f460dc4cd8e81c65fe7654524))



## 0.60.2-alpha.0 (2021-09-24)



## 0.60.1 (2021-09-24)



# 0.60.0 (2021-09-21)


### Bug Fixes

* **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))
* handle single domain hierarchies gracefully ([10dc5ec](https://github.com/dendronhq/dendron/commit/10dc5ec2ab3ebf767ae7e913cb90ba48e9651447))
* links at top/bottom of reference aren't clickable ([#1282](https://github.com/dendronhq/dendron/issues/1282)) ([b2a00cc](https://github.com/dendronhq/dendron/commit/b2a00cc564299cdb17ae6060154b7616c04e630c))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))


### Features Dendron

* **publish:** notice for dev mode ([#1354](https://github.com/dendronhq/dendron/issues/1354)) ([e3f9fc9](https://github.com/dendronhq/dendron/commit/e3f9fc9d81dc51fbaec5f4bbccb2f6c1dffb1afb))
* additional styling for nextjs ([f8e7972](https://github.com/dendronhq/dendron/commit/f8e797231b586c20ac4d2e1fa1813982cc282375))
* nextjs publishing fulltext search ([#1334](https://github.com/dendronhq/dendron/issues/1334)) ([68f8473](https://github.com/dendronhq/dendron/commit/68f8473badf22494c8d0758f8195e377235321f6))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))



## 0.55.2 (2021-08-21)


### Features Dendron

* make breadcrumbs clickable ([#1164](https://github.com/dendronhq/dendron/issues/1164)) ([a386fc3](https://github.com/dendronhq/dendron/commit/a386fc3dd42769207f58259f292216be51f0a15b))



## 0.55.1 (2021-08-17)


### Features Dendron

* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)





## [0.65.1](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.65.1) (2021-10-29)


### Bug Fixes

* **markdown:** footnote rendering in note references ([#1520](https://github.com/dendronhq/dendron/issues/1520)) ([c4056f5](https://github.com/dendronhq/dendron/commit/c4056f5c4fc4c02dbc14cd4564032caa3619eae5))
* **publish:** enable mermaid support ([fc84c74](https://github.com/dendronhq/dendron/commit/fc84c74c35ce09fe9acde8cc21204d4191a8f80a))
* **publish:** optimize nextjs publishing search ([#1519](https://github.com/dendronhq/dendron/issues/1519)) ([d06dd25](https://github.com/dendronhq/dendron/commit/d06dd25e292532a4ea66d1aa469a27c00b424ad6))
* **publish:** Title parts duplicated in Next publishing search ([#1573](https://github.com/dendronhq/dendron/issues/1573)) ([59de1a4](https://github.com/dendronhq/dendron/commit/59de1a486be980c1e6b16753478c62b03c38e018))
* **publish:** unslugify titles in toc ([292a46b](https://github.com/dendronhq/dendron/commit/292a46b14287f2e649a7929516ed97144e9fd2d6))



## 0.62.3 (2021-10-09)


### Bug Fixes

* **publish:** nextjs search note snippets ([#1433](https://github.com/dendronhq/dendron/issues/1433)) ([0cb8f38](https://github.com/dendronhq/dendron/commit/0cb8f38fc9cb5e45af682fc5524ff5eb7ba44ce7))


### Features Dendron

* **publish:** add table of contents ([#1428](https://github.com/dendronhq/dendron/issues/1428)) ([df4b05b](https://github.com/dendronhq/dendron/commit/df4b05ba8526dc32362d6a59543d880f253f02fc))



# 0.61.0 (2021-09-28)


### Bug Fixes

* **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))



## 0.60.2 (2021-09-25)


### Bug Fixes

* **publish:** footer show on first load ([#1413](https://github.com/dendronhq/dendron/issues/1413)) ([00d32cc](https://github.com/dendronhq/dendron/commit/00d32cc830ca6da3160a9cee86386e50b3a35fd6))


### Features Dendron

* **publish:** add popover for long title in menu ([#1408](https://github.com/dendronhq/dendron/issues/1408)) ([b94b223](https://github.com/dendronhq/dendron/commit/b94b2235f337b2e54bcbf8658e5f4f371804c5f9))
* **publish:** mobile navigation ([#1407](https://github.com/dendronhq/dendron/issues/1407)) ([3487213](https://github.com/dendronhq/dendron/commit/34872138131f030f460dc4cd8e81c65fe7654524))



## 0.60.2-alpha.0 (2021-09-24)



## 0.60.1 (2021-09-24)



# 0.60.0 (2021-09-21)


### Bug Fixes

* **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))
* handle single domain hierarchies gracefully ([10dc5ec](https://github.com/dendronhq/dendron/commit/10dc5ec2ab3ebf767ae7e913cb90ba48e9651447))
* links at top/bottom of reference aren't clickable ([#1282](https://github.com/dendronhq/dendron/issues/1282)) ([b2a00cc](https://github.com/dendronhq/dendron/commit/b2a00cc564299cdb17ae6060154b7616c04e630c))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))


### Features Dendron

* **publish:** notice for dev mode ([#1354](https://github.com/dendronhq/dendron/issues/1354)) ([e3f9fc9](https://github.com/dendronhq/dendron/commit/e3f9fc9d81dc51fbaec5f4bbccb2f6c1dffb1afb))
* additional styling for nextjs ([f8e7972](https://github.com/dendronhq/dendron/commit/f8e797231b586c20ac4d2e1fa1813982cc282375))
* nextjs publishing fulltext search ([#1334](https://github.com/dendronhq/dendron/issues/1334)) ([68f8473](https://github.com/dendronhq/dendron/commit/68f8473badf22494c8d0758f8195e377235321f6))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))



## 0.55.2 (2021-08-21)


### Features Dendron

* make breadcrumbs clickable ([#1164](https://github.com/dendronhq/dendron/issues/1164)) ([a386fc3](https://github.com/dendronhq/dendron/commit/a386fc3dd42769207f58259f292216be51f0a15b))



## 0.55.1 (2021-08-17)


### Features Dendron

* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)





# [0.65.0](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.65.0) (2021-10-26)


### Bug Fixes

* **markdown:** footnote rendering in note references ([#1520](https://github.com/dendronhq/dendron/issues/1520)) ([c4056f5](https://github.com/dendronhq/dendron/commit/c4056f5c4fc4c02dbc14cd4564032caa3619eae5))
* **publish:** enable mermaid support ([fc84c74](https://github.com/dendronhq/dendron/commit/fc84c74c35ce09fe9acde8cc21204d4191a8f80a))
* **publish:** optimize nextjs publishing search ([#1519](https://github.com/dendronhq/dendron/issues/1519)) ([d06dd25](https://github.com/dendronhq/dendron/commit/d06dd25e292532a4ea66d1aa469a27c00b424ad6))
* **publish:** Title parts duplicated in Next publishing search ([#1573](https://github.com/dendronhq/dendron/issues/1573)) ([59de1a4](https://github.com/dendronhq/dendron/commit/59de1a486be980c1e6b16753478c62b03c38e018))
* **publish:** unslugify titles in toc ([292a46b](https://github.com/dendronhq/dendron/commit/292a46b14287f2e649a7929516ed97144e9fd2d6))



## 0.62.3 (2021-10-09)


### Bug Fixes

* **publish:** nextjs search note snippets ([#1433](https://github.com/dendronhq/dendron/issues/1433)) ([0cb8f38](https://github.com/dendronhq/dendron/commit/0cb8f38fc9cb5e45af682fc5524ff5eb7ba44ce7))


### Features Dendron

* **publish:** add table of contents ([#1428](https://github.com/dendronhq/dendron/issues/1428)) ([df4b05b](https://github.com/dendronhq/dendron/commit/df4b05ba8526dc32362d6a59543d880f253f02fc))



# 0.61.0 (2021-09-28)


### Bug Fixes

* **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))



## 0.60.2 (2021-09-25)


### Bug Fixes

* **publish:** footer show on first load ([#1413](https://github.com/dendronhq/dendron/issues/1413)) ([00d32cc](https://github.com/dendronhq/dendron/commit/00d32cc830ca6da3160a9cee86386e50b3a35fd6))


### Features Dendron

* **publish:** add popover for long title in menu ([#1408](https://github.com/dendronhq/dendron/issues/1408)) ([b94b223](https://github.com/dendronhq/dendron/commit/b94b2235f337b2e54bcbf8658e5f4f371804c5f9))
* **publish:** mobile navigation ([#1407](https://github.com/dendronhq/dendron/issues/1407)) ([3487213](https://github.com/dendronhq/dendron/commit/34872138131f030f460dc4cd8e81c65fe7654524))



## 0.60.2-alpha.0 (2021-09-24)



## 0.60.1 (2021-09-24)



# 0.60.0 (2021-09-21)


### Bug Fixes

* **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))
* handle single domain hierarchies gracefully ([10dc5ec](https://github.com/dendronhq/dendron/commit/10dc5ec2ab3ebf767ae7e913cb90ba48e9651447))
* links at top/bottom of reference aren't clickable ([#1282](https://github.com/dendronhq/dendron/issues/1282)) ([b2a00cc](https://github.com/dendronhq/dendron/commit/b2a00cc564299cdb17ae6060154b7616c04e630c))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))


### Features Dendron

* **publish:** notice for dev mode ([#1354](https://github.com/dendronhq/dendron/issues/1354)) ([e3f9fc9](https://github.com/dendronhq/dendron/commit/e3f9fc9d81dc51fbaec5f4bbccb2f6c1dffb1afb))
* additional styling for nextjs ([f8e7972](https://github.com/dendronhq/dendron/commit/f8e797231b586c20ac4d2e1fa1813982cc282375))
* nextjs publishing fulltext search ([#1334](https://github.com/dendronhq/dendron/issues/1334)) ([68f8473](https://github.com/dendronhq/dendron/commit/68f8473badf22494c8d0758f8195e377235321f6))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))



## 0.55.2 (2021-08-21)


### Features Dendron

* make breadcrumbs clickable ([#1164](https://github.com/dendronhq/dendron/issues/1164)) ([a386fc3](https://github.com/dendronhq/dendron/commit/a386fc3dd42769207f58259f292216be51f0a15b))



## 0.55.1 (2021-08-17)


### Features Dendron

* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)





## [0.64.2](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.64.2) (2021-10-23)


### Bug Fixes

* **markdown:** footnote rendering in note references ([#1520](https://github.com/dendronhq/dendron/issues/1520)) ([c4056f5](https://github.com/dendronhq/dendron/commit/c4056f5c4fc4c02dbc14cd4564032caa3619eae5))
* **publish:** enable mermaid support ([fc84c74](https://github.com/dendronhq/dendron/commit/fc84c74c35ce09fe9acde8cc21204d4191a8f80a))
* **publish:** optimize nextjs publishing search ([#1519](https://github.com/dendronhq/dendron/issues/1519)) ([d06dd25](https://github.com/dendronhq/dendron/commit/d06dd25e292532a4ea66d1aa469a27c00b424ad6))
* **publish:** unslugify titles in toc ([292a46b](https://github.com/dendronhq/dendron/commit/292a46b14287f2e649a7929516ed97144e9fd2d6))



## 0.62.3 (2021-10-09)


### Bug Fixes

* **publish:** nextjs search note snippets ([#1433](https://github.com/dendronhq/dendron/issues/1433)) ([0cb8f38](https://github.com/dendronhq/dendron/commit/0cb8f38fc9cb5e45af682fc5524ff5eb7ba44ce7))


### Features Dendron

* **publish:** add table of contents ([#1428](https://github.com/dendronhq/dendron/issues/1428)) ([df4b05b](https://github.com/dendronhq/dendron/commit/df4b05ba8526dc32362d6a59543d880f253f02fc))



# 0.61.0 (2021-09-28)


### Bug Fixes

* **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))



## 0.60.2 (2021-09-25)


### Bug Fixes

* **publish:** footer show on first load ([#1413](https://github.com/dendronhq/dendron/issues/1413)) ([00d32cc](https://github.com/dendronhq/dendron/commit/00d32cc830ca6da3160a9cee86386e50b3a35fd6))


### Features Dendron

* **publish:** add popover for long title in menu ([#1408](https://github.com/dendronhq/dendron/issues/1408)) ([b94b223](https://github.com/dendronhq/dendron/commit/b94b2235f337b2e54bcbf8658e5f4f371804c5f9))
* **publish:** mobile navigation ([#1407](https://github.com/dendronhq/dendron/issues/1407)) ([3487213](https://github.com/dendronhq/dendron/commit/34872138131f030f460dc4cd8e81c65fe7654524))



## 0.60.2-alpha.0 (2021-09-24)



## 0.60.1 (2021-09-24)



# 0.60.0 (2021-09-21)


### Bug Fixes

* **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))
* handle single domain hierarchies gracefully ([10dc5ec](https://github.com/dendronhq/dendron/commit/10dc5ec2ab3ebf767ae7e913cb90ba48e9651447))
* links at top/bottom of reference aren't clickable ([#1282](https://github.com/dendronhq/dendron/issues/1282)) ([b2a00cc](https://github.com/dendronhq/dendron/commit/b2a00cc564299cdb17ae6060154b7616c04e630c))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))


### Features Dendron

* **publish:** notice for dev mode ([#1354](https://github.com/dendronhq/dendron/issues/1354)) ([e3f9fc9](https://github.com/dendronhq/dendron/commit/e3f9fc9d81dc51fbaec5f4bbccb2f6c1dffb1afb))
* additional styling for nextjs ([f8e7972](https://github.com/dendronhq/dendron/commit/f8e797231b586c20ac4d2e1fa1813982cc282375))
* nextjs publishing fulltext search ([#1334](https://github.com/dendronhq/dendron/issues/1334)) ([68f8473](https://github.com/dendronhq/dendron/commit/68f8473badf22494c8d0758f8195e377235321f6))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))



## 0.55.2 (2021-08-21)


### Features Dendron

* make breadcrumbs clickable ([#1164](https://github.com/dendronhq/dendron/issues/1164)) ([a386fc3](https://github.com/dendronhq/dendron/commit/a386fc3dd42769207f58259f292216be51f0a15b))



## 0.55.1 (2021-08-17)


### Features Dendron

* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)





## [0.64.1](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.64.1) (2021-10-22)


### Bug Fixes

* **markdown:** footnote rendering in note references ([#1520](https://github.com/dendronhq/dendron/issues/1520)) ([c4056f5](https://github.com/dendronhq/dendron/commit/c4056f5c4fc4c02dbc14cd4564032caa3619eae5))
* **publish:** enable mermaid support ([fc84c74](https://github.com/dendronhq/dendron/commit/fc84c74c35ce09fe9acde8cc21204d4191a8f80a))
* **publish:** optimize nextjs publishing search ([#1519](https://github.com/dendronhq/dendron/issues/1519)) ([d06dd25](https://github.com/dendronhq/dendron/commit/d06dd25e292532a4ea66d1aa469a27c00b424ad6))
* **publish:** unslugify titles in toc ([292a46b](https://github.com/dendronhq/dendron/commit/292a46b14287f2e649a7929516ed97144e9fd2d6))



## 0.62.3 (2021-10-09)


### Bug Fixes

* **publish:** nextjs search note snippets ([#1433](https://github.com/dendronhq/dendron/issues/1433)) ([0cb8f38](https://github.com/dendronhq/dendron/commit/0cb8f38fc9cb5e45af682fc5524ff5eb7ba44ce7))


### Features Dendron

* **publish:** add table of contents ([#1428](https://github.com/dendronhq/dendron/issues/1428)) ([df4b05b](https://github.com/dendronhq/dendron/commit/df4b05ba8526dc32362d6a59543d880f253f02fc))



# 0.61.0 (2021-09-28)


### Bug Fixes

* **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))



## 0.60.2 (2021-09-25)


### Bug Fixes

* **publish:** footer show on first load ([#1413](https://github.com/dendronhq/dendron/issues/1413)) ([00d32cc](https://github.com/dendronhq/dendron/commit/00d32cc830ca6da3160a9cee86386e50b3a35fd6))


### Features Dendron

* **publish:** add popover for long title in menu ([#1408](https://github.com/dendronhq/dendron/issues/1408)) ([b94b223](https://github.com/dendronhq/dendron/commit/b94b2235f337b2e54bcbf8658e5f4f371804c5f9))
* **publish:** mobile navigation ([#1407](https://github.com/dendronhq/dendron/issues/1407)) ([3487213](https://github.com/dendronhq/dendron/commit/34872138131f030f460dc4cd8e81c65fe7654524))



## 0.60.2-alpha.0 (2021-09-24)



## 0.60.1 (2021-09-24)



# 0.60.0 (2021-09-21)


### Bug Fixes

* **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))
* handle single domain hierarchies gracefully ([10dc5ec](https://github.com/dendronhq/dendron/commit/10dc5ec2ab3ebf767ae7e913cb90ba48e9651447))
* links at top/bottom of reference aren't clickable ([#1282](https://github.com/dendronhq/dendron/issues/1282)) ([b2a00cc](https://github.com/dendronhq/dendron/commit/b2a00cc564299cdb17ae6060154b7616c04e630c))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))


### Features Dendron

* **publish:** notice for dev mode ([#1354](https://github.com/dendronhq/dendron/issues/1354)) ([e3f9fc9](https://github.com/dendronhq/dendron/commit/e3f9fc9d81dc51fbaec5f4bbccb2f6c1dffb1afb))
* additional styling for nextjs ([f8e7972](https://github.com/dendronhq/dendron/commit/f8e797231b586c20ac4d2e1fa1813982cc282375))
* nextjs publishing fulltext search ([#1334](https://github.com/dendronhq/dendron/issues/1334)) ([68f8473](https://github.com/dendronhq/dendron/commit/68f8473badf22494c8d0758f8195e377235321f6))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))



## 0.55.2 (2021-08-21)


### Features Dendron

* make breadcrumbs clickable ([#1164](https://github.com/dendronhq/dendron/issues/1164)) ([a386fc3](https://github.com/dendronhq/dendron/commit/a386fc3dd42769207f58259f292216be51f0a15b))



## 0.55.1 (2021-08-17)


### Features Dendron

* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)





# [0.64.0](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.64.0) (2021-10-19)


### Bug Fixes

* **markdown:** footnote rendering in note references ([#1520](https://github.com/dendronhq/dendron/issues/1520)) ([c4056f5](https://github.com/dendronhq/dendron/commit/c4056f5c4fc4c02dbc14cd4564032caa3619eae5))
* **publish:** enable mermaid support ([fc84c74](https://github.com/dendronhq/dendron/commit/fc84c74c35ce09fe9acde8cc21204d4191a8f80a))
* **publish:** optimize nextjs publishing search ([#1519](https://github.com/dendronhq/dendron/issues/1519)) ([d06dd25](https://github.com/dendronhq/dendron/commit/d06dd25e292532a4ea66d1aa469a27c00b424ad6))
* **publish:** unslugify titles in toc ([292a46b](https://github.com/dendronhq/dendron/commit/292a46b14287f2e649a7929516ed97144e9fd2d6))



## 0.62.3 (2021-10-09)


### Bug Fixes

* **publish:** nextjs search note snippets ([#1433](https://github.com/dendronhq/dendron/issues/1433)) ([0cb8f38](https://github.com/dendronhq/dendron/commit/0cb8f38fc9cb5e45af682fc5524ff5eb7ba44ce7))


### Features Dendron

* **publish:** add table of contents ([#1428](https://github.com/dendronhq/dendron/issues/1428)) ([df4b05b](https://github.com/dendronhq/dendron/commit/df4b05ba8526dc32362d6a59543d880f253f02fc))



# 0.61.0 (2021-09-28)


### Bug Fixes

* **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))



## 0.60.2 (2021-09-25)


### Bug Fixes

* **publish:** footer show on first load ([#1413](https://github.com/dendronhq/dendron/issues/1413)) ([00d32cc](https://github.com/dendronhq/dendron/commit/00d32cc830ca6da3160a9cee86386e50b3a35fd6))


### Features Dendron

* **publish:** add popover for long title in menu ([#1408](https://github.com/dendronhq/dendron/issues/1408)) ([b94b223](https://github.com/dendronhq/dendron/commit/b94b2235f337b2e54bcbf8658e5f4f371804c5f9))
* **publish:** mobile navigation ([#1407](https://github.com/dendronhq/dendron/issues/1407)) ([3487213](https://github.com/dendronhq/dendron/commit/34872138131f030f460dc4cd8e81c65fe7654524))



## 0.60.2-alpha.0 (2021-09-24)



## 0.60.1 (2021-09-24)



# 0.60.0 (2021-09-21)


### Bug Fixes

* **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))
* handle single domain hierarchies gracefully ([10dc5ec](https://github.com/dendronhq/dendron/commit/10dc5ec2ab3ebf767ae7e913cb90ba48e9651447))
* links at top/bottom of reference aren't clickable ([#1282](https://github.com/dendronhq/dendron/issues/1282)) ([b2a00cc](https://github.com/dendronhq/dendron/commit/b2a00cc564299cdb17ae6060154b7616c04e630c))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))


### Features Dendron

* **publish:** notice for dev mode ([#1354](https://github.com/dendronhq/dendron/issues/1354)) ([e3f9fc9](https://github.com/dendronhq/dendron/commit/e3f9fc9d81dc51fbaec5f4bbccb2f6c1dffb1afb))
* additional styling for nextjs ([f8e7972](https://github.com/dendronhq/dendron/commit/f8e797231b586c20ac4d2e1fa1813982cc282375))
* nextjs publishing fulltext search ([#1334](https://github.com/dendronhq/dendron/issues/1334)) ([68f8473](https://github.com/dendronhq/dendron/commit/68f8473badf22494c8d0758f8195e377235321f6))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))



## 0.55.2 (2021-08-21)


### Features Dendron

* make breadcrumbs clickable ([#1164](https://github.com/dendronhq/dendron/issues/1164)) ([a386fc3](https://github.com/dendronhq/dendron/commit/a386fc3dd42769207f58259f292216be51f0a15b))



## 0.55.1 (2021-08-17)


### Features Dendron

* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)





## [0.63.4-alpha.0](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.63.4-alpha.0) (2021-10-17)


### Bug Fixes

* **markdown:** footnote rendering in note references ([#1520](https://github.com/dendronhq/dendron/issues/1520)) ([c4056f5](https://github.com/dendronhq/dendron/commit/c4056f5c4fc4c02dbc14cd4564032caa3619eae5))
* **publish:** optimize nextjs publishing search ([#1519](https://github.com/dendronhq/dendron/issues/1519)) ([d06dd25](https://github.com/dendronhq/dendron/commit/d06dd25e292532a4ea66d1aa469a27c00b424ad6))
* **publish:** unslugify titles in toc ([292a46b](https://github.com/dendronhq/dendron/commit/292a46b14287f2e649a7929516ed97144e9fd2d6))



## 0.62.3 (2021-10-09)


### Bug Fixes

* **publish:** nextjs search note snippets ([#1433](https://github.com/dendronhq/dendron/issues/1433)) ([0cb8f38](https://github.com/dendronhq/dendron/commit/0cb8f38fc9cb5e45af682fc5524ff5eb7ba44ce7))


### Features Dendron

* **publish:** add table of contents ([#1428](https://github.com/dendronhq/dendron/issues/1428)) ([df4b05b](https://github.com/dendronhq/dendron/commit/df4b05ba8526dc32362d6a59543d880f253f02fc))



# 0.61.0 (2021-09-28)


### Bug Fixes

* **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))



## 0.60.2 (2021-09-25)


### Bug Fixes

* **publish:** footer show on first load ([#1413](https://github.com/dendronhq/dendron/issues/1413)) ([00d32cc](https://github.com/dendronhq/dendron/commit/00d32cc830ca6da3160a9cee86386e50b3a35fd6))


### Features Dendron

* **publish:** add popover for long title in menu ([#1408](https://github.com/dendronhq/dendron/issues/1408)) ([b94b223](https://github.com/dendronhq/dendron/commit/b94b2235f337b2e54bcbf8658e5f4f371804c5f9))
* **publish:** mobile navigation ([#1407](https://github.com/dendronhq/dendron/issues/1407)) ([3487213](https://github.com/dendronhq/dendron/commit/34872138131f030f460dc4cd8e81c65fe7654524))



## 0.60.2-alpha.0 (2021-09-24)



## 0.60.1 (2021-09-24)



# 0.60.0 (2021-09-21)


### Bug Fixes

* **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))
* handle single domain hierarchies gracefully ([10dc5ec](https://github.com/dendronhq/dendron/commit/10dc5ec2ab3ebf767ae7e913cb90ba48e9651447))
* links at top/bottom of reference aren't clickable ([#1282](https://github.com/dendronhq/dendron/issues/1282)) ([b2a00cc](https://github.com/dendronhq/dendron/commit/b2a00cc564299cdb17ae6060154b7616c04e630c))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))


### Features Dendron

* **publish:** notice for dev mode ([#1354](https://github.com/dendronhq/dendron/issues/1354)) ([e3f9fc9](https://github.com/dendronhq/dendron/commit/e3f9fc9d81dc51fbaec5f4bbccb2f6c1dffb1afb))
* additional styling for nextjs ([f8e7972](https://github.com/dendronhq/dendron/commit/f8e797231b586c20ac4d2e1fa1813982cc282375))
* nextjs publishing fulltext search ([#1334](https://github.com/dendronhq/dendron/issues/1334)) ([68f8473](https://github.com/dendronhq/dendron/commit/68f8473badf22494c8d0758f8195e377235321f6))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))



## 0.55.2 (2021-08-21)


### Features Dendron

* make breadcrumbs clickable ([#1164](https://github.com/dendronhq/dendron/issues/1164)) ([a386fc3](https://github.com/dendronhq/dendron/commit/a386fc3dd42769207f58259f292216be51f0a15b))



## 0.55.1 (2021-08-17)


### Features Dendron

* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)





## [0.63.3](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.63.3) (2021-10-17)


### Bug Fixes

* **markdown:** footnote rendering in note references ([#1520](https://github.com/dendronhq/dendron/issues/1520)) ([c4056f5](https://github.com/dendronhq/dendron/commit/c4056f5c4fc4c02dbc14cd4564032caa3619eae5))
* **publish:** optimize nextjs publishing search ([#1519](https://github.com/dendronhq/dendron/issues/1519)) ([d06dd25](https://github.com/dendronhq/dendron/commit/d06dd25e292532a4ea66d1aa469a27c00b424ad6))
* **publish:** unslugify titles in toc ([292a46b](https://github.com/dendronhq/dendron/commit/292a46b14287f2e649a7929516ed97144e9fd2d6))



## 0.62.3 (2021-10-09)


### Bug Fixes

* **publish:** nextjs search note snippets ([#1433](https://github.com/dendronhq/dendron/issues/1433)) ([0cb8f38](https://github.com/dendronhq/dendron/commit/0cb8f38fc9cb5e45af682fc5524ff5eb7ba44ce7))


### Features Dendron

* **publish:** add table of contents ([#1428](https://github.com/dendronhq/dendron/issues/1428)) ([df4b05b](https://github.com/dendronhq/dendron/commit/df4b05ba8526dc32362d6a59543d880f253f02fc))



# 0.61.0 (2021-09-28)


### Bug Fixes

* **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))



## 0.60.2 (2021-09-25)


### Bug Fixes

* **publish:** footer show on first load ([#1413](https://github.com/dendronhq/dendron/issues/1413)) ([00d32cc](https://github.com/dendronhq/dendron/commit/00d32cc830ca6da3160a9cee86386e50b3a35fd6))


### Features Dendron

* **publish:** add popover for long title in menu ([#1408](https://github.com/dendronhq/dendron/issues/1408)) ([b94b223](https://github.com/dendronhq/dendron/commit/b94b2235f337b2e54bcbf8658e5f4f371804c5f9))
* **publish:** mobile navigation ([#1407](https://github.com/dendronhq/dendron/issues/1407)) ([3487213](https://github.com/dendronhq/dendron/commit/34872138131f030f460dc4cd8e81c65fe7654524))



## 0.60.2-alpha.0 (2021-09-24)



## 0.60.1 (2021-09-24)



# 0.60.0 (2021-09-21)


### Bug Fixes

* **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))
* handle single domain hierarchies gracefully ([10dc5ec](https://github.com/dendronhq/dendron/commit/10dc5ec2ab3ebf767ae7e913cb90ba48e9651447))
* links at top/bottom of reference aren't clickable ([#1282](https://github.com/dendronhq/dendron/issues/1282)) ([b2a00cc](https://github.com/dendronhq/dendron/commit/b2a00cc564299cdb17ae6060154b7616c04e630c))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))


### Features Dendron

* **publish:** notice for dev mode ([#1354](https://github.com/dendronhq/dendron/issues/1354)) ([e3f9fc9](https://github.com/dendronhq/dendron/commit/e3f9fc9d81dc51fbaec5f4bbccb2f6c1dffb1afb))
* additional styling for nextjs ([f8e7972](https://github.com/dendronhq/dendron/commit/f8e797231b586c20ac4d2e1fa1813982cc282375))
* nextjs publishing fulltext search ([#1334](https://github.com/dendronhq/dendron/issues/1334)) ([68f8473](https://github.com/dendronhq/dendron/commit/68f8473badf22494c8d0758f8195e377235321f6))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))



## 0.55.2 (2021-08-21)


### Features Dendron

* make breadcrumbs clickable ([#1164](https://github.com/dendronhq/dendron/issues/1164)) ([a386fc3](https://github.com/dendronhq/dendron/commit/a386fc3dd42769207f58259f292216be51f0a15b))



## 0.55.1 (2021-08-17)


### Features Dendron

* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)





## [0.63.2](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.63.2) (2021-10-17)


### Bug Fixes

* **markdown:** footnote rendering in note references ([#1520](https://github.com/dendronhq/dendron/issues/1520)) ([c4056f5](https://github.com/dendronhq/dendron/commit/c4056f5c4fc4c02dbc14cd4564032caa3619eae5))
* **publish:** optimize nextjs publishing search ([#1519](https://github.com/dendronhq/dendron/issues/1519)) ([d06dd25](https://github.com/dendronhq/dendron/commit/d06dd25e292532a4ea66d1aa469a27c00b424ad6))
* **publish:** unslugify titles in toc ([292a46b](https://github.com/dendronhq/dendron/commit/292a46b14287f2e649a7929516ed97144e9fd2d6))



## 0.62.3 (2021-10-09)


### Bug Fixes

* **publish:** nextjs search note snippets ([#1433](https://github.com/dendronhq/dendron/issues/1433)) ([0cb8f38](https://github.com/dendronhq/dendron/commit/0cb8f38fc9cb5e45af682fc5524ff5eb7ba44ce7))


### Features Dendron

* **publish:** add table of contents ([#1428](https://github.com/dendronhq/dendron/issues/1428)) ([df4b05b](https://github.com/dendronhq/dendron/commit/df4b05ba8526dc32362d6a59543d880f253f02fc))



# 0.61.0 (2021-09-28)


### Bug Fixes

* **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))



## 0.60.2 (2021-09-25)


### Bug Fixes

* **publish:** footer show on first load ([#1413](https://github.com/dendronhq/dendron/issues/1413)) ([00d32cc](https://github.com/dendronhq/dendron/commit/00d32cc830ca6da3160a9cee86386e50b3a35fd6))


### Features Dendron

* **publish:** add popover for long title in menu ([#1408](https://github.com/dendronhq/dendron/issues/1408)) ([b94b223](https://github.com/dendronhq/dendron/commit/b94b2235f337b2e54bcbf8658e5f4f371804c5f9))
* **publish:** mobile navigation ([#1407](https://github.com/dendronhq/dendron/issues/1407)) ([3487213](https://github.com/dendronhq/dendron/commit/34872138131f030f460dc4cd8e81c65fe7654524))



## 0.60.2-alpha.0 (2021-09-24)



## 0.60.1 (2021-09-24)



# 0.60.0 (2021-09-21)


### Bug Fixes

* **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))
* handle single domain hierarchies gracefully ([10dc5ec](https://github.com/dendronhq/dendron/commit/10dc5ec2ab3ebf767ae7e913cb90ba48e9651447))
* links at top/bottom of reference aren't clickable ([#1282](https://github.com/dendronhq/dendron/issues/1282)) ([b2a00cc](https://github.com/dendronhq/dendron/commit/b2a00cc564299cdb17ae6060154b7616c04e630c))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))


### Features Dendron

* **publish:** notice for dev mode ([#1354](https://github.com/dendronhq/dendron/issues/1354)) ([e3f9fc9](https://github.com/dendronhq/dendron/commit/e3f9fc9d81dc51fbaec5f4bbccb2f6c1dffb1afb))
* additional styling for nextjs ([f8e7972](https://github.com/dendronhq/dendron/commit/f8e797231b586c20ac4d2e1fa1813982cc282375))
* nextjs publishing fulltext search ([#1334](https://github.com/dendronhq/dendron/issues/1334)) ([68f8473](https://github.com/dendronhq/dendron/commit/68f8473badf22494c8d0758f8195e377235321f6))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))



## 0.55.2 (2021-08-21)


### Features Dendron

* make breadcrumbs clickable ([#1164](https://github.com/dendronhq/dendron/issues/1164)) ([a386fc3](https://github.com/dendronhq/dendron/commit/a386fc3dd42769207f58259f292216be51f0a15b))



## 0.55.1 (2021-08-17)


### Features Dendron

* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)





## [0.63.1](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.63.1) (2021-10-15)


### Bug Fixes

* **publish:** optimize nextjs publishing search ([#1519](https://github.com/dendronhq/dendron/issues/1519)) ([d06dd25](https://github.com/dendronhq/dendron/commit/d06dd25e292532a4ea66d1aa469a27c00b424ad6))
* **publish:** unslugify titles in toc ([292a46b](https://github.com/dendronhq/dendron/commit/292a46b14287f2e649a7929516ed97144e9fd2d6))



## 0.62.3 (2021-10-09)


### Bug Fixes

* **publish:** nextjs search note snippets ([#1433](https://github.com/dendronhq/dendron/issues/1433)) ([0cb8f38](https://github.com/dendronhq/dendron/commit/0cb8f38fc9cb5e45af682fc5524ff5eb7ba44ce7))


### Features Dendron

* **publish:** add table of contents ([#1428](https://github.com/dendronhq/dendron/issues/1428)) ([df4b05b](https://github.com/dendronhq/dendron/commit/df4b05ba8526dc32362d6a59543d880f253f02fc))



# 0.61.0 (2021-09-28)


### Bug Fixes

* **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))



## 0.60.2 (2021-09-25)


### Bug Fixes

* **publish:** footer show on first load ([#1413](https://github.com/dendronhq/dendron/issues/1413)) ([00d32cc](https://github.com/dendronhq/dendron/commit/00d32cc830ca6da3160a9cee86386e50b3a35fd6))


### Features Dendron

* **publish:** add popover for long title in menu ([#1408](https://github.com/dendronhq/dendron/issues/1408)) ([b94b223](https://github.com/dendronhq/dendron/commit/b94b2235f337b2e54bcbf8658e5f4f371804c5f9))
* **publish:** mobile navigation ([#1407](https://github.com/dendronhq/dendron/issues/1407)) ([3487213](https://github.com/dendronhq/dendron/commit/34872138131f030f460dc4cd8e81c65fe7654524))



## 0.60.2-alpha.0 (2021-09-24)



## 0.60.1 (2021-09-24)



# 0.60.0 (2021-09-21)


### Bug Fixes

* **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))
* handle single domain hierarchies gracefully ([10dc5ec](https://github.com/dendronhq/dendron/commit/10dc5ec2ab3ebf767ae7e913cb90ba48e9651447))
* links at top/bottom of reference aren't clickable ([#1282](https://github.com/dendronhq/dendron/issues/1282)) ([b2a00cc](https://github.com/dendronhq/dendron/commit/b2a00cc564299cdb17ae6060154b7616c04e630c))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))


### Features Dendron

* **publish:** notice for dev mode ([#1354](https://github.com/dendronhq/dendron/issues/1354)) ([e3f9fc9](https://github.com/dendronhq/dendron/commit/e3f9fc9d81dc51fbaec5f4bbccb2f6c1dffb1afb))
* additional styling for nextjs ([f8e7972](https://github.com/dendronhq/dendron/commit/f8e797231b586c20ac4d2e1fa1813982cc282375))
* nextjs publishing fulltext search ([#1334](https://github.com/dendronhq/dendron/issues/1334)) ([68f8473](https://github.com/dendronhq/dendron/commit/68f8473badf22494c8d0758f8195e377235321f6))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))



## 0.55.2 (2021-08-21)


### Features Dendron

* make breadcrumbs clickable ([#1164](https://github.com/dendronhq/dendron/issues/1164)) ([a386fc3](https://github.com/dendronhq/dendron/commit/a386fc3dd42769207f58259f292216be51f0a15b))



## 0.55.1 (2021-08-17)


### Features Dendron

* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)





# [0.63.0](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.63.0) (2021-10-12)


### Bug Fixes

* **publish:** unslugify titles in toc ([292a46b](https://github.com/dendronhq/dendron/commit/292a46b14287f2e649a7929516ed97144e9fd2d6))



## 0.62.3 (2021-10-09)


### Bug Fixes

* **publish:** nextjs search note snippets ([#1433](https://github.com/dendronhq/dendron/issues/1433)) ([0cb8f38](https://github.com/dendronhq/dendron/commit/0cb8f38fc9cb5e45af682fc5524ff5eb7ba44ce7))


### Features Dendron

* **publish:** add table of contents ([#1428](https://github.com/dendronhq/dendron/issues/1428)) ([df4b05b](https://github.com/dendronhq/dendron/commit/df4b05ba8526dc32362d6a59543d880f253f02fc))



# 0.61.0 (2021-09-28)


### Bug Fixes

* **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))



## 0.60.2 (2021-09-25)


### Bug Fixes

* **publish:** footer show on first load ([#1413](https://github.com/dendronhq/dendron/issues/1413)) ([00d32cc](https://github.com/dendronhq/dendron/commit/00d32cc830ca6da3160a9cee86386e50b3a35fd6))


### Features Dendron

* **publish:** add popover for long title in menu ([#1408](https://github.com/dendronhq/dendron/issues/1408)) ([b94b223](https://github.com/dendronhq/dendron/commit/b94b2235f337b2e54bcbf8658e5f4f371804c5f9))
* **publish:** mobile navigation ([#1407](https://github.com/dendronhq/dendron/issues/1407)) ([3487213](https://github.com/dendronhq/dendron/commit/34872138131f030f460dc4cd8e81c65fe7654524))



## 0.60.2-alpha.0 (2021-09-24)



## 0.60.1 (2021-09-24)



# 0.60.0 (2021-09-21)


### Bug Fixes

* **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))
* handle single domain hierarchies gracefully ([10dc5ec](https://github.com/dendronhq/dendron/commit/10dc5ec2ab3ebf767ae7e913cb90ba48e9651447))
* links at top/bottom of reference aren't clickable ([#1282](https://github.com/dendronhq/dendron/issues/1282)) ([b2a00cc](https://github.com/dendronhq/dendron/commit/b2a00cc564299cdb17ae6060154b7616c04e630c))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))


### Features Dendron

* **publish:** notice for dev mode ([#1354](https://github.com/dendronhq/dendron/issues/1354)) ([e3f9fc9](https://github.com/dendronhq/dendron/commit/e3f9fc9d81dc51fbaec5f4bbccb2f6c1dffb1afb))
* additional styling for nextjs ([f8e7972](https://github.com/dendronhq/dendron/commit/f8e797231b586c20ac4d2e1fa1813982cc282375))
* nextjs publishing fulltext search ([#1334](https://github.com/dendronhq/dendron/issues/1334)) ([68f8473](https://github.com/dendronhq/dendron/commit/68f8473badf22494c8d0758f8195e377235321f6))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))



## 0.55.2 (2021-08-21)


### Features Dendron

* make breadcrumbs clickable ([#1164](https://github.com/dendronhq/dendron/issues/1164)) ([a386fc3](https://github.com/dendronhq/dendron/commit/a386fc3dd42769207f58259f292216be51f0a15b))



## 0.55.1 (2021-08-17)


### Features Dendron

* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)





## [0.62.3](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.62.3) (2021-10-09)


### Bug Fixes

* **publish:** nextjs search note snippets ([#1433](https://github.com/dendronhq/dendron/issues/1433)) ([0cb8f38](https://github.com/dendronhq/dendron/commit/0cb8f38fc9cb5e45af682fc5524ff5eb7ba44ce7))


### Features Dendron

* **publish:** add table of contents ([#1428](https://github.com/dendronhq/dendron/issues/1428)) ([df4b05b](https://github.com/dendronhq/dendron/commit/df4b05ba8526dc32362d6a59543d880f253f02fc))



# 0.61.0 (2021-09-28)


### Bug Fixes

* **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))



## 0.60.2 (2021-09-25)


### Bug Fixes

* **publish:** footer show on first load ([#1413](https://github.com/dendronhq/dendron/issues/1413)) ([00d32cc](https://github.com/dendronhq/dendron/commit/00d32cc830ca6da3160a9cee86386e50b3a35fd6))


### Features Dendron

* **publish:** add popover for long title in menu ([#1408](https://github.com/dendronhq/dendron/issues/1408)) ([b94b223](https://github.com/dendronhq/dendron/commit/b94b2235f337b2e54bcbf8658e5f4f371804c5f9))
* **publish:** mobile navigation ([#1407](https://github.com/dendronhq/dendron/issues/1407)) ([3487213](https://github.com/dendronhq/dendron/commit/34872138131f030f460dc4cd8e81c65fe7654524))



## 0.60.2-alpha.0 (2021-09-24)



## 0.60.1 (2021-09-24)



# 0.60.0 (2021-09-21)


### Bug Fixes

* **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))
* handle single domain hierarchies gracefully ([10dc5ec](https://github.com/dendronhq/dendron/commit/10dc5ec2ab3ebf767ae7e913cb90ba48e9651447))
* links at top/bottom of reference aren't clickable ([#1282](https://github.com/dendronhq/dendron/issues/1282)) ([b2a00cc](https://github.com/dendronhq/dendron/commit/b2a00cc564299cdb17ae6060154b7616c04e630c))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))


### Features Dendron

* **publish:** notice for dev mode ([#1354](https://github.com/dendronhq/dendron/issues/1354)) ([e3f9fc9](https://github.com/dendronhq/dendron/commit/e3f9fc9d81dc51fbaec5f4bbccb2f6c1dffb1afb))
* additional styling for nextjs ([f8e7972](https://github.com/dendronhq/dendron/commit/f8e797231b586c20ac4d2e1fa1813982cc282375))
* nextjs publishing fulltext search ([#1334](https://github.com/dendronhq/dendron/issues/1334)) ([68f8473](https://github.com/dendronhq/dendron/commit/68f8473badf22494c8d0758f8195e377235321f6))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))



## 0.55.2 (2021-08-21)


### Features Dendron

* make breadcrumbs clickable ([#1164](https://github.com/dendronhq/dendron/issues/1164)) ([a386fc3](https://github.com/dendronhq/dendron/commit/a386fc3dd42769207f58259f292216be51f0a15b))



## 0.55.1 (2021-08-17)


### Features Dendron

* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)





## [0.62.2](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.62.2) (2021-10-08)


### Bug Fixes

* **publish:** nextjs search note snippets ([#1433](https://github.com/dendronhq/dendron/issues/1433)) ([0cb8f38](https://github.com/dendronhq/dendron/commit/0cb8f38fc9cb5e45af682fc5524ff5eb7ba44ce7))


### Features Dendron

* **publish:** add table of contents ([#1428](https://github.com/dendronhq/dendron/issues/1428)) ([df4b05b](https://github.com/dendronhq/dendron/commit/df4b05ba8526dc32362d6a59543d880f253f02fc))



# 0.61.0 (2021-09-28)


### Bug Fixes

* **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))



## 0.60.2 (2021-09-25)


### Bug Fixes

* **publish:** footer show on first load ([#1413](https://github.com/dendronhq/dendron/issues/1413)) ([00d32cc](https://github.com/dendronhq/dendron/commit/00d32cc830ca6da3160a9cee86386e50b3a35fd6))


### Features Dendron

* **publish:** add popover for long title in menu ([#1408](https://github.com/dendronhq/dendron/issues/1408)) ([b94b223](https://github.com/dendronhq/dendron/commit/b94b2235f337b2e54bcbf8658e5f4f371804c5f9))
* **publish:** mobile navigation ([#1407](https://github.com/dendronhq/dendron/issues/1407)) ([3487213](https://github.com/dendronhq/dendron/commit/34872138131f030f460dc4cd8e81c65fe7654524))



## 0.60.2-alpha.0 (2021-09-24)



## 0.60.1 (2021-09-24)



# 0.60.0 (2021-09-21)


### Bug Fixes

* **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))
* handle single domain hierarchies gracefully ([10dc5ec](https://github.com/dendronhq/dendron/commit/10dc5ec2ab3ebf767ae7e913cb90ba48e9651447))
* links at top/bottom of reference aren't clickable ([#1282](https://github.com/dendronhq/dendron/issues/1282)) ([b2a00cc](https://github.com/dendronhq/dendron/commit/b2a00cc564299cdb17ae6060154b7616c04e630c))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))


### Features Dendron

* **publish:** notice for dev mode ([#1354](https://github.com/dendronhq/dendron/issues/1354)) ([e3f9fc9](https://github.com/dendronhq/dendron/commit/e3f9fc9d81dc51fbaec5f4bbccb2f6c1dffb1afb))
* additional styling for nextjs ([f8e7972](https://github.com/dendronhq/dendron/commit/f8e797231b586c20ac4d2e1fa1813982cc282375))
* nextjs publishing fulltext search ([#1334](https://github.com/dendronhq/dendron/issues/1334)) ([68f8473](https://github.com/dendronhq/dendron/commit/68f8473badf22494c8d0758f8195e377235321f6))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))



## 0.55.2 (2021-08-21)


### Features Dendron

* make breadcrumbs clickable ([#1164](https://github.com/dendronhq/dendron/issues/1164)) ([a386fc3](https://github.com/dendronhq/dendron/commit/a386fc3dd42769207f58259f292216be51f0a15b))



## 0.55.1 (2021-08-17)


### Features Dendron

* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)





## [0.62.1](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.62.1) (2021-10-08)


### Bug Fixes

* **publish:** nextjs search note snippets ([#1433](https://github.com/dendronhq/dendron/issues/1433)) ([0cb8f38](https://github.com/dendronhq/dendron/commit/0cb8f38fc9cb5e45af682fc5524ff5eb7ba44ce7))


### Features Dendron

* **publish:** add table of contents ([#1428](https://github.com/dendronhq/dendron/issues/1428)) ([df4b05b](https://github.com/dendronhq/dendron/commit/df4b05ba8526dc32362d6a59543d880f253f02fc))



# 0.61.0 (2021-09-28)


### Bug Fixes

* **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))



## 0.60.2 (2021-09-25)


### Bug Fixes

* **publish:** footer show on first load ([#1413](https://github.com/dendronhq/dendron/issues/1413)) ([00d32cc](https://github.com/dendronhq/dendron/commit/00d32cc830ca6da3160a9cee86386e50b3a35fd6))


### Features Dendron

* **publish:** add popover for long title in menu ([#1408](https://github.com/dendronhq/dendron/issues/1408)) ([b94b223](https://github.com/dendronhq/dendron/commit/b94b2235f337b2e54bcbf8658e5f4f371804c5f9))
* **publish:** mobile navigation ([#1407](https://github.com/dendronhq/dendron/issues/1407)) ([3487213](https://github.com/dendronhq/dendron/commit/34872138131f030f460dc4cd8e81c65fe7654524))



## 0.60.2-alpha.0 (2021-09-24)



## 0.60.1 (2021-09-24)



# 0.60.0 (2021-09-21)


### Bug Fixes

* **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))
* handle single domain hierarchies gracefully ([10dc5ec](https://github.com/dendronhq/dendron/commit/10dc5ec2ab3ebf767ae7e913cb90ba48e9651447))
* links at top/bottom of reference aren't clickable ([#1282](https://github.com/dendronhq/dendron/issues/1282)) ([b2a00cc](https://github.com/dendronhq/dendron/commit/b2a00cc564299cdb17ae6060154b7616c04e630c))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))


### Features Dendron

* **publish:** notice for dev mode ([#1354](https://github.com/dendronhq/dendron/issues/1354)) ([e3f9fc9](https://github.com/dendronhq/dendron/commit/e3f9fc9d81dc51fbaec5f4bbccb2f6c1dffb1afb))
* additional styling for nextjs ([f8e7972](https://github.com/dendronhq/dendron/commit/f8e797231b586c20ac4d2e1fa1813982cc282375))
* nextjs publishing fulltext search ([#1334](https://github.com/dendronhq/dendron/issues/1334)) ([68f8473](https://github.com/dendronhq/dendron/commit/68f8473badf22494c8d0758f8195e377235321f6))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))



## 0.55.2 (2021-08-21)


### Features Dendron

* make breadcrumbs clickable ([#1164](https://github.com/dendronhq/dendron/issues/1164)) ([a386fc3](https://github.com/dendronhq/dendron/commit/a386fc3dd42769207f58259f292216be51f0a15b))



## 0.55.1 (2021-08-17)


### Features Dendron

* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)





# [0.62.0](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.62.0) (2021-10-05)


### Bug Fixes

* **publish:** nextjs search note snippets ([#1433](https://github.com/dendronhq/dendron/issues/1433)) ([0cb8f38](https://github.com/dendronhq/dendron/commit/0cb8f38fc9cb5e45af682fc5524ff5eb7ba44ce7))


### Features Dendron

* **publish:** add table of contents ([#1428](https://github.com/dendronhq/dendron/issues/1428)) ([df4b05b](https://github.com/dendronhq/dendron/commit/df4b05ba8526dc32362d6a59543d880f253f02fc))



# 0.61.0 (2021-09-28)


### Bug Fixes

* **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))



## 0.60.2 (2021-09-25)


### Bug Fixes

* **publish:** footer show on first load ([#1413](https://github.com/dendronhq/dendron/issues/1413)) ([00d32cc](https://github.com/dendronhq/dendron/commit/00d32cc830ca6da3160a9cee86386e50b3a35fd6))


### Features Dendron

* **publish:** add popover for long title in menu ([#1408](https://github.com/dendronhq/dendron/issues/1408)) ([b94b223](https://github.com/dendronhq/dendron/commit/b94b2235f337b2e54bcbf8658e5f4f371804c5f9))
* **publish:** mobile navigation ([#1407](https://github.com/dendronhq/dendron/issues/1407)) ([3487213](https://github.com/dendronhq/dendron/commit/34872138131f030f460dc4cd8e81c65fe7654524))



## 0.60.2-alpha.0 (2021-09-24)



## 0.60.1 (2021-09-24)



# 0.60.0 (2021-09-21)


### Bug Fixes

* **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))
* handle single domain hierarchies gracefully ([10dc5ec](https://github.com/dendronhq/dendron/commit/10dc5ec2ab3ebf767ae7e913cb90ba48e9651447))
* links at top/bottom of reference aren't clickable ([#1282](https://github.com/dendronhq/dendron/issues/1282)) ([b2a00cc](https://github.com/dendronhq/dendron/commit/b2a00cc564299cdb17ae6060154b7616c04e630c))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))


### Features Dendron

* **publish:** notice for dev mode ([#1354](https://github.com/dendronhq/dendron/issues/1354)) ([e3f9fc9](https://github.com/dendronhq/dendron/commit/e3f9fc9d81dc51fbaec5f4bbccb2f6c1dffb1afb))
* additional styling for nextjs ([f8e7972](https://github.com/dendronhq/dendron/commit/f8e797231b586c20ac4d2e1fa1813982cc282375))
* nextjs publishing fulltext search ([#1334](https://github.com/dendronhq/dendron/issues/1334)) ([68f8473](https://github.com/dendronhq/dendron/commit/68f8473badf22494c8d0758f8195e377235321f6))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))



## 0.55.2 (2021-08-21)


### Features Dendron

* make breadcrumbs clickable ([#1164](https://github.com/dendronhq/dendron/issues/1164)) ([a386fc3](https://github.com/dendronhq/dendron/commit/a386fc3dd42769207f58259f292216be51f0a15b))



## 0.55.1 (2021-08-17)


### Features Dendron

* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)





## [0.61.2](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.61.2) (2021-10-02)


### Bug Fixes

* **publish:** nextjs search note snippets ([#1433](https://github.com/dendronhq/dendron/issues/1433)) ([0cb8f38](https://github.com/dendronhq/dendron/commit/0cb8f38fc9cb5e45af682fc5524ff5eb7ba44ce7))


### Features Dendron

* **publish:** add table of contents ([#1428](https://github.com/dendronhq/dendron/issues/1428)) ([df4b05b](https://github.com/dendronhq/dendron/commit/df4b05ba8526dc32362d6a59543d880f253f02fc))



# 0.61.0 (2021-09-28)


### Bug Fixes

* **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))



## 0.60.2 (2021-09-25)


### Bug Fixes

* **publish:** footer show on first load ([#1413](https://github.com/dendronhq/dendron/issues/1413)) ([00d32cc](https://github.com/dendronhq/dendron/commit/00d32cc830ca6da3160a9cee86386e50b3a35fd6))


### Features Dendron

* **publish:** add popover for long title in menu ([#1408](https://github.com/dendronhq/dendron/issues/1408)) ([b94b223](https://github.com/dendronhq/dendron/commit/b94b2235f337b2e54bcbf8658e5f4f371804c5f9))
* **publish:** mobile navigation ([#1407](https://github.com/dendronhq/dendron/issues/1407)) ([3487213](https://github.com/dendronhq/dendron/commit/34872138131f030f460dc4cd8e81c65fe7654524))



## 0.60.2-alpha.0 (2021-09-24)



## 0.60.1 (2021-09-24)



# 0.60.0 (2021-09-21)


### Bug Fixes

* **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))
* handle single domain hierarchies gracefully ([10dc5ec](https://github.com/dendronhq/dendron/commit/10dc5ec2ab3ebf767ae7e913cb90ba48e9651447))
* links at top/bottom of reference aren't clickable ([#1282](https://github.com/dendronhq/dendron/issues/1282)) ([b2a00cc](https://github.com/dendronhq/dendron/commit/b2a00cc564299cdb17ae6060154b7616c04e630c))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))


### Features Dendron

* **publish:** notice for dev mode ([#1354](https://github.com/dendronhq/dendron/issues/1354)) ([e3f9fc9](https://github.com/dendronhq/dendron/commit/e3f9fc9d81dc51fbaec5f4bbccb2f6c1dffb1afb))
* additional styling for nextjs ([f8e7972](https://github.com/dendronhq/dendron/commit/f8e797231b586c20ac4d2e1fa1813982cc282375))
* nextjs publishing fulltext search ([#1334](https://github.com/dendronhq/dendron/issues/1334)) ([68f8473](https://github.com/dendronhq/dendron/commit/68f8473badf22494c8d0758f8195e377235321f6))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))



## 0.55.2 (2021-08-21)


### Features Dendron

* make breadcrumbs clickable ([#1164](https://github.com/dendronhq/dendron/issues/1164)) ([a386fc3](https://github.com/dendronhq/dendron/commit/a386fc3dd42769207f58259f292216be51f0a15b))



## 0.55.1 (2021-08-17)


### Features Dendron

* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)





## [0.61.1](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.61.1) (2021-10-01)


### Bug Fixes

* **publish:** nextjs search note snippets ([#1433](https://github.com/dendronhq/dendron/issues/1433)) ([0cb8f38](https://github.com/dendronhq/dendron/commit/0cb8f38fc9cb5e45af682fc5524ff5eb7ba44ce7))


### Features Dendron

* **publish:** add table of contents ([#1428](https://github.com/dendronhq/dendron/issues/1428)) ([df4b05b](https://github.com/dendronhq/dendron/commit/df4b05ba8526dc32362d6a59543d880f253f02fc))



# 0.61.0 (2021-09-28)


### Bug Fixes

* **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))



## 0.60.2 (2021-09-25)


### Bug Fixes

* **publish:** footer show on first load ([#1413](https://github.com/dendronhq/dendron/issues/1413)) ([00d32cc](https://github.com/dendronhq/dendron/commit/00d32cc830ca6da3160a9cee86386e50b3a35fd6))


### Features Dendron

* **publish:** add popover for long title in menu ([#1408](https://github.com/dendronhq/dendron/issues/1408)) ([b94b223](https://github.com/dendronhq/dendron/commit/b94b2235f337b2e54bcbf8658e5f4f371804c5f9))
* **publish:** mobile navigation ([#1407](https://github.com/dendronhq/dendron/issues/1407)) ([3487213](https://github.com/dendronhq/dendron/commit/34872138131f030f460dc4cd8e81c65fe7654524))



## 0.60.2-alpha.0 (2021-09-24)



## 0.60.1 (2021-09-24)



# 0.60.0 (2021-09-21)


### Bug Fixes

* **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))
* handle single domain hierarchies gracefully ([10dc5ec](https://github.com/dendronhq/dendron/commit/10dc5ec2ab3ebf767ae7e913cb90ba48e9651447))
* links at top/bottom of reference aren't clickable ([#1282](https://github.com/dendronhq/dendron/issues/1282)) ([b2a00cc](https://github.com/dendronhq/dendron/commit/b2a00cc564299cdb17ae6060154b7616c04e630c))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))


### Features Dendron

* **publish:** notice for dev mode ([#1354](https://github.com/dendronhq/dendron/issues/1354)) ([e3f9fc9](https://github.com/dendronhq/dendron/commit/e3f9fc9d81dc51fbaec5f4bbccb2f6c1dffb1afb))
* additional styling for nextjs ([f8e7972](https://github.com/dendronhq/dendron/commit/f8e797231b586c20ac4d2e1fa1813982cc282375))
* nextjs publishing fulltext search ([#1334](https://github.com/dendronhq/dendron/issues/1334)) ([68f8473](https://github.com/dendronhq/dendron/commit/68f8473badf22494c8d0758f8195e377235321f6))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))



## 0.55.2 (2021-08-21)


### Features Dendron

* make breadcrumbs clickable ([#1164](https://github.com/dendronhq/dendron/issues/1164)) ([a386fc3](https://github.com/dendronhq/dendron/commit/a386fc3dd42769207f58259f292216be51f0a15b))



## 0.55.1 (2021-08-17)


### Features Dendron

* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)





## [0.61.1-alpha.0](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.61.1-alpha.0) (2021-09-29)


### Bug Fixes

* **publish:** nextjs search note snippets ([#1433](https://github.com/dendronhq/dendron/issues/1433)) ([0cb8f38](https://github.com/dendronhq/dendron/commit/0cb8f38fc9cb5e45af682fc5524ff5eb7ba44ce7))



# 0.61.0 (2021-09-28)


### Bug Fixes

* **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))



## 0.60.2 (2021-09-25)


### Bug Fixes

* **publish:** footer show on first load ([#1413](https://github.com/dendronhq/dendron/issues/1413)) ([00d32cc](https://github.com/dendronhq/dendron/commit/00d32cc830ca6da3160a9cee86386e50b3a35fd6))


### Features Dendron

* **publish:** add popover for long title in menu ([#1408](https://github.com/dendronhq/dendron/issues/1408)) ([b94b223](https://github.com/dendronhq/dendron/commit/b94b2235f337b2e54bcbf8658e5f4f371804c5f9))
* **publish:** mobile navigation ([#1407](https://github.com/dendronhq/dendron/issues/1407)) ([3487213](https://github.com/dendronhq/dendron/commit/34872138131f030f460dc4cd8e81c65fe7654524))



## 0.60.2-alpha.0 (2021-09-24)



## 0.60.1 (2021-09-24)



# 0.60.0 (2021-09-21)


### Bug Fixes

* **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))
* handle single domain hierarchies gracefully ([10dc5ec](https://github.com/dendronhq/dendron/commit/10dc5ec2ab3ebf767ae7e913cb90ba48e9651447))
* links at top/bottom of reference aren't clickable ([#1282](https://github.com/dendronhq/dendron/issues/1282)) ([b2a00cc](https://github.com/dendronhq/dendron/commit/b2a00cc564299cdb17ae6060154b7616c04e630c))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))


### Features Dendron

* **publish:** notice for dev mode ([#1354](https://github.com/dendronhq/dendron/issues/1354)) ([e3f9fc9](https://github.com/dendronhq/dendron/commit/e3f9fc9d81dc51fbaec5f4bbccb2f6c1dffb1afb))
* additional styling for nextjs ([f8e7972](https://github.com/dendronhq/dendron/commit/f8e797231b586c20ac4d2e1fa1813982cc282375))
* nextjs publishing fulltext search ([#1334](https://github.com/dendronhq/dendron/issues/1334)) ([68f8473](https://github.com/dendronhq/dendron/commit/68f8473badf22494c8d0758f8195e377235321f6))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))



## 0.55.2 (2021-08-21)


### Features Dendron

* make breadcrumbs clickable ([#1164](https://github.com/dendronhq/dendron/issues/1164)) ([a386fc3](https://github.com/dendronhq/dendron/commit/a386fc3dd42769207f58259f292216be51f0a15b))



## 0.55.1 (2021-08-17)


### Features Dendron

* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)





# [0.61.0](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.61.0) (2021-09-28)


### Bug Fixes

* **workspace:** use correct keybinding when using vim+dendron in same workspace ([e1180e6](https://github.com/dendronhq/dendron/commit/e1180e66e8ac29c82f34cf1e6797f1ab473ef510))



## 0.60.2 (2021-09-25)


### Bug Fixes

* **publish:** footer show on first load ([#1413](https://github.com/dendronhq/dendron/issues/1413)) ([00d32cc](https://github.com/dendronhq/dendron/commit/00d32cc830ca6da3160a9cee86386e50b3a35fd6))


### Features Dendron

* **publish:** add popover for long title in menu ([#1408](https://github.com/dendronhq/dendron/issues/1408)) ([b94b223](https://github.com/dendronhq/dendron/commit/b94b2235f337b2e54bcbf8658e5f4f371804c5f9))
* **publish:** mobile navigation ([#1407](https://github.com/dendronhq/dendron/issues/1407)) ([3487213](https://github.com/dendronhq/dendron/commit/34872138131f030f460dc4cd8e81c65fe7654524))



## 0.60.2-alpha.0 (2021-09-24)



## 0.60.1 (2021-09-24)



# 0.60.0 (2021-09-21)


### Bug Fixes

* **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))
* handle single domain hierarchies gracefully ([10dc5ec](https://github.com/dendronhq/dendron/commit/10dc5ec2ab3ebf767ae7e913cb90ba48e9651447))
* links at top/bottom of reference aren't clickable ([#1282](https://github.com/dendronhq/dendron/issues/1282)) ([b2a00cc](https://github.com/dendronhq/dendron/commit/b2a00cc564299cdb17ae6060154b7616c04e630c))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))


### Features Dendron

* **publish:** notice for dev mode ([#1354](https://github.com/dendronhq/dendron/issues/1354)) ([e3f9fc9](https://github.com/dendronhq/dendron/commit/e3f9fc9d81dc51fbaec5f4bbccb2f6c1dffb1afb))
* additional styling for nextjs ([f8e7972](https://github.com/dendronhq/dendron/commit/f8e797231b586c20ac4d2e1fa1813982cc282375))
* nextjs publishing fulltext search ([#1334](https://github.com/dendronhq/dendron/issues/1334)) ([68f8473](https://github.com/dendronhq/dendron/commit/68f8473badf22494c8d0758f8195e377235321f6))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))



## 0.55.2 (2021-08-21)


### Features Dendron

* make breadcrumbs clickable ([#1164](https://github.com/dendronhq/dendron/issues/1164)) ([a386fc3](https://github.com/dendronhq/dendron/commit/a386fc3dd42769207f58259f292216be51f0a15b))



## 0.55.1 (2021-08-17)


### Features Dendron

* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)





## [0.60.3-alpha.0](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.60.3-alpha.0) (2021-09-28)



## 0.60.2 (2021-09-25)


### Bug Fixes

* **publish:** footer show on first load ([#1413](https://github.com/dendronhq/dendron/issues/1413)) ([00d32cc](https://github.com/dendronhq/dendron/commit/00d32cc830ca6da3160a9cee86386e50b3a35fd6))


### Features Dendron

* **publish:** add popover for long title in menu ([#1408](https://github.com/dendronhq/dendron/issues/1408)) ([b94b223](https://github.com/dendronhq/dendron/commit/b94b2235f337b2e54bcbf8658e5f4f371804c5f9))
* **publish:** mobile navigation ([#1407](https://github.com/dendronhq/dendron/issues/1407)) ([3487213](https://github.com/dendronhq/dendron/commit/34872138131f030f460dc4cd8e81c65fe7654524))



## 0.60.2-alpha.0 (2021-09-24)



## 0.60.1 (2021-09-24)



# 0.60.0 (2021-09-21)


### Bug Fixes

* **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))
* handle single domain hierarchies gracefully ([10dc5ec](https://github.com/dendronhq/dendron/commit/10dc5ec2ab3ebf767ae7e913cb90ba48e9651447))
* links at top/bottom of reference aren't clickable ([#1282](https://github.com/dendronhq/dendron/issues/1282)) ([b2a00cc](https://github.com/dendronhq/dendron/commit/b2a00cc564299cdb17ae6060154b7616c04e630c))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))


### Features Dendron

* **publish:** notice for dev mode ([#1354](https://github.com/dendronhq/dendron/issues/1354)) ([e3f9fc9](https://github.com/dendronhq/dendron/commit/e3f9fc9d81dc51fbaec5f4bbccb2f6c1dffb1afb))
* additional styling for nextjs ([f8e7972](https://github.com/dendronhq/dendron/commit/f8e797231b586c20ac4d2e1fa1813982cc282375))
* nextjs publishing fulltext search ([#1334](https://github.com/dendronhq/dendron/issues/1334)) ([68f8473](https://github.com/dendronhq/dendron/commit/68f8473badf22494c8d0758f8195e377235321f6))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))



## 0.55.2 (2021-08-21)


### Features Dendron

* make breadcrumbs clickable ([#1164](https://github.com/dendronhq/dendron/issues/1164)) ([a386fc3](https://github.com/dendronhq/dendron/commit/a386fc3dd42769207f58259f292216be51f0a15b))



## 0.55.1 (2021-08-17)


### Features Dendron

* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)





## [0.60.2](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.60.2) (2021-09-25)


### Bug Fixes

* **publish:** footer show on first load ([#1413](https://github.com/dendronhq/dendron/issues/1413)) ([00d32cc](https://github.com/dendronhq/dendron/commit/00d32cc830ca6da3160a9cee86386e50b3a35fd6))


### Features Dendron

* **publish:** add popover for long title in menu ([#1408](https://github.com/dendronhq/dendron/issues/1408)) ([b94b223](https://github.com/dendronhq/dendron/commit/b94b2235f337b2e54bcbf8658e5f4f371804c5f9))
* **publish:** mobile navigation ([#1407](https://github.com/dendronhq/dendron/issues/1407)) ([3487213](https://github.com/dendronhq/dendron/commit/34872138131f030f460dc4cd8e81c65fe7654524))



## 0.60.2-alpha.0 (2021-09-24)



## 0.60.1 (2021-09-24)



# 0.60.0 (2021-09-21)


### Bug Fixes

* **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))
* handle single domain hierarchies gracefully ([10dc5ec](https://github.com/dendronhq/dendron/commit/10dc5ec2ab3ebf767ae7e913cb90ba48e9651447))
* links at top/bottom of reference aren't clickable ([#1282](https://github.com/dendronhq/dendron/issues/1282)) ([b2a00cc](https://github.com/dendronhq/dendron/commit/b2a00cc564299cdb17ae6060154b7616c04e630c))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))


### Features Dendron

* **publish:** notice for dev mode ([#1354](https://github.com/dendronhq/dendron/issues/1354)) ([e3f9fc9](https://github.com/dendronhq/dendron/commit/e3f9fc9d81dc51fbaec5f4bbccb2f6c1dffb1afb))
* additional styling for nextjs ([f8e7972](https://github.com/dendronhq/dendron/commit/f8e797231b586c20ac4d2e1fa1813982cc282375))
* nextjs publishing fulltext search ([#1334](https://github.com/dendronhq/dendron/issues/1334)) ([68f8473](https://github.com/dendronhq/dendron/commit/68f8473badf22494c8d0758f8195e377235321f6))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))



## 0.55.2 (2021-08-21)


### Features Dendron

* make breadcrumbs clickable ([#1164](https://github.com/dendronhq/dendron/issues/1164)) ([a386fc3](https://github.com/dendronhq/dendron/commit/a386fc3dd42769207f58259f292216be51f0a15b))



## 0.55.1 (2021-08-17)


### Features Dendron

* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)





## [0.60.2-alpha.0](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.60.2-alpha.0) (2021-09-24)



## 0.60.1 (2021-09-24)



# 0.60.0 (2021-09-21)


### Bug Fixes

* **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))
* handle single domain hierarchies gracefully ([10dc5ec](https://github.com/dendronhq/dendron/commit/10dc5ec2ab3ebf767ae7e913cb90ba48e9651447))
* links at top/bottom of reference aren't clickable ([#1282](https://github.com/dendronhq/dendron/issues/1282)) ([b2a00cc](https://github.com/dendronhq/dendron/commit/b2a00cc564299cdb17ae6060154b7616c04e630c))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))


### Features Dendron

* **publish:** notice for dev mode ([#1354](https://github.com/dendronhq/dendron/issues/1354)) ([e3f9fc9](https://github.com/dendronhq/dendron/commit/e3f9fc9d81dc51fbaec5f4bbccb2f6c1dffb1afb))
* additional styling for nextjs ([f8e7972](https://github.com/dendronhq/dendron/commit/f8e797231b586c20ac4d2e1fa1813982cc282375))
* nextjs publishing fulltext search ([#1334](https://github.com/dendronhq/dendron/issues/1334)) ([68f8473](https://github.com/dendronhq/dendron/commit/68f8473badf22494c8d0758f8195e377235321f6))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))



## 0.55.2 (2021-08-21)


### Features Dendron

* make breadcrumbs clickable ([#1164](https://github.com/dendronhq/dendron/issues/1164)) ([a386fc3](https://github.com/dendronhq/dendron/commit/a386fc3dd42769207f58259f292216be51f0a15b))



## 0.55.1 (2021-08-17)


### Features Dendron

* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)





## [0.60.1](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.60.1) (2021-09-24)


### Bug Fixes

* **workspace:** corrupted keybindings ([f63bf5a](https://github.com/dendronhq/dendron/commit/f63bf5afb622f332811047fe48db8e2fd53fc167)), closes [#1290](https://github.com/dendronhq/dendron/issues/1290) [#1392](https://github.com/dendronhq/dendron/issues/1392) [#1371](https://github.com/dendronhq/dendron/issues/1371) [#1389](https://github.com/dendronhq/dendron/issues/1389) [#1388](https://github.com/dendronhq/dendron/issues/1388) [#1369](https://github.com/dendronhq/dendron/issues/1369) [#1387](https://github.com/dendronhq/dendron/issues/1387) [#1386](https://github.com/dendronhq/dendron/issues/1386) [#1384](https://github.com/dendronhq/dendron/issues/1384) [#1383](https://github.com/dendronhq/dendron/issues/1383) [#1370](https://github.com/dendronhq/dendron/issues/1370) [#1352](https://github.com/dendronhq/dendron/issues/1352) [#1382](https://github.com/dendronhq/dendron/issues/1382) [#1332](https://github.com/dendronhq/dendron/issues/1332)



# 0.60.0 (2021-09-21)


### Bug Fixes

* **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))
* handle single domain hierarchies gracefully ([10dc5ec](https://github.com/dendronhq/dendron/commit/10dc5ec2ab3ebf767ae7e913cb90ba48e9651447))
* links at top/bottom of reference aren't clickable ([#1282](https://github.com/dendronhq/dendron/issues/1282)) ([b2a00cc](https://github.com/dendronhq/dendron/commit/b2a00cc564299cdb17ae6060154b7616c04e630c))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))


### Features Dendron

* **publish:** notice for dev mode ([#1354](https://github.com/dendronhq/dendron/issues/1354)) ([e3f9fc9](https://github.com/dendronhq/dendron/commit/e3f9fc9d81dc51fbaec5f4bbccb2f6c1dffb1afb))
* additional styling for nextjs ([f8e7972](https://github.com/dendronhq/dendron/commit/f8e797231b586c20ac4d2e1fa1813982cc282375))
* nextjs publishing fulltext search ([#1334](https://github.com/dendronhq/dendron/issues/1334)) ([68f8473](https://github.com/dendronhq/dendron/commit/68f8473badf22494c8d0758f8195e377235321f6))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))



## 0.55.2 (2021-08-21)


### Features Dendron

* make breadcrumbs clickable ([#1164](https://github.com/dendronhq/dendron/issues/1164)) ([a386fc3](https://github.com/dendronhq/dendron/commit/a386fc3dd42769207f58259f292216be51f0a15b))



## 0.55.1 (2021-08-17)


### Features Dendron

* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)





## [0.60.1-alpha.3](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.60.1-alpha.3) (2021-09-23)



# 0.60.0 (2021-09-21)


### Bug Fixes

* **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))
* handle single domain hierarchies gracefully ([10dc5ec](https://github.com/dendronhq/dendron/commit/10dc5ec2ab3ebf767ae7e913cb90ba48e9651447))
* links at top/bottom of reference aren't clickable ([#1282](https://github.com/dendronhq/dendron/issues/1282)) ([b2a00cc](https://github.com/dendronhq/dendron/commit/b2a00cc564299cdb17ae6060154b7616c04e630c))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))


### Features Dendron

* **publish:** notice for dev mode ([#1354](https://github.com/dendronhq/dendron/issues/1354)) ([e3f9fc9](https://github.com/dendronhq/dendron/commit/e3f9fc9d81dc51fbaec5f4bbccb2f6c1dffb1afb))
* additional styling for nextjs ([f8e7972](https://github.com/dendronhq/dendron/commit/f8e797231b586c20ac4d2e1fa1813982cc282375))
* nextjs publishing fulltext search ([#1334](https://github.com/dendronhq/dendron/issues/1334)) ([68f8473](https://github.com/dendronhq/dendron/commit/68f8473badf22494c8d0758f8195e377235321f6))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))



## 0.55.2 (2021-08-21)


### Features Dendron

* make breadcrumbs clickable ([#1164](https://github.com/dendronhq/dendron/issues/1164)) ([a386fc3](https://github.com/dendronhq/dendron/commit/a386fc3dd42769207f58259f292216be51f0a15b))



## 0.55.1 (2021-08-17)


### Features Dendron

* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)





## [0.60.1-alpha.2](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.60.1-alpha.2) (2021-09-22)



# 0.60.0 (2021-09-21)


### Bug Fixes

* **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))
* handle single domain hierarchies gracefully ([10dc5ec](https://github.com/dendronhq/dendron/commit/10dc5ec2ab3ebf767ae7e913cb90ba48e9651447))
* links at top/bottom of reference aren't clickable ([#1282](https://github.com/dendronhq/dendron/issues/1282)) ([b2a00cc](https://github.com/dendronhq/dendron/commit/b2a00cc564299cdb17ae6060154b7616c04e630c))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))


### Features Dendron

* **publish:** notice for dev mode ([#1354](https://github.com/dendronhq/dendron/issues/1354)) ([e3f9fc9](https://github.com/dendronhq/dendron/commit/e3f9fc9d81dc51fbaec5f4bbccb2f6c1dffb1afb))
* additional styling for nextjs ([f8e7972](https://github.com/dendronhq/dendron/commit/f8e797231b586c20ac4d2e1fa1813982cc282375))
* nextjs publishing fulltext search ([#1334](https://github.com/dendronhq/dendron/issues/1334)) ([68f8473](https://github.com/dendronhq/dendron/commit/68f8473badf22494c8d0758f8195e377235321f6))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))



## 0.55.2 (2021-08-21)


### Features Dendron

* make breadcrumbs clickable ([#1164](https://github.com/dendronhq/dendron/issues/1164)) ([a386fc3](https://github.com/dendronhq/dendron/commit/a386fc3dd42769207f58259f292216be51f0a15b))



## 0.55.1 (2021-08-17)


### Features Dendron

* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)





## [0.60.1-alpha.1](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.60.1-alpha.1) (2021-09-21)


### Bug Fixes

* **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))
* handle single domain hierarchies gracefully ([10dc5ec](https://github.com/dendronhq/dendron/commit/10dc5ec2ab3ebf767ae7e913cb90ba48e9651447))
* links at top/bottom of reference aren't clickable ([#1282](https://github.com/dendronhq/dendron/issues/1282)) ([b2a00cc](https://github.com/dendronhq/dendron/commit/b2a00cc564299cdb17ae6060154b7616c04e630c))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))


### Features Dendron

* **publish:** notice for dev mode ([#1354](https://github.com/dendronhq/dendron/issues/1354)) ([e3f9fc9](https://github.com/dendronhq/dendron/commit/e3f9fc9d81dc51fbaec5f4bbccb2f6c1dffb1afb))
* additional styling for nextjs ([f8e7972](https://github.com/dendronhq/dendron/commit/f8e797231b586c20ac4d2e1fa1813982cc282375))
* nextjs publishing fulltext search ([#1334](https://github.com/dendronhq/dendron/issues/1334)) ([68f8473](https://github.com/dendronhq/dendron/commit/68f8473badf22494c8d0758f8195e377235321f6))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))



## 0.55.2 (2021-08-21)


### Features Dendron

* make breadcrumbs clickable ([#1164](https://github.com/dendronhq/dendron/issues/1164)) ([a386fc3](https://github.com/dendronhq/dendron/commit/a386fc3dd42769207f58259f292216be51f0a15b))



## 0.55.1 (2021-08-17)


### Features Dendron

* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)





## [0.60.1-alpha.0](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.60.1-alpha.0) (2021-09-20)


### Bug Fixes

* **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))
* handle single domain hierarchies gracefully ([10dc5ec](https://github.com/dendronhq/dendron/commit/10dc5ec2ab3ebf767ae7e913cb90ba48e9651447))
* links at top/bottom of reference aren't clickable ([#1282](https://github.com/dendronhq/dendron/issues/1282)) ([b2a00cc](https://github.com/dendronhq/dendron/commit/b2a00cc564299cdb17ae6060154b7616c04e630c))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))


### Features Dendron

* **publish:** notice for dev mode ([#1354](https://github.com/dendronhq/dendron/issues/1354)) ([e3f9fc9](https://github.com/dendronhq/dendron/commit/e3f9fc9d81dc51fbaec5f4bbccb2f6c1dffb1afb))
* additional styling for nextjs ([f8e7972](https://github.com/dendronhq/dendron/commit/f8e797231b586c20ac4d2e1fa1813982cc282375))
* nextjs publishing fulltext search ([#1334](https://github.com/dendronhq/dendron/issues/1334)) ([68f8473](https://github.com/dendronhq/dendron/commit/68f8473badf22494c8d0758f8195e377235321f6))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))



## 0.55.2 (2021-08-21)


### Features Dendron

* make breadcrumbs clickable ([#1164](https://github.com/dendronhq/dendron/issues/1164)) ([a386fc3](https://github.com/dendronhq/dendron/commit/a386fc3dd42769207f58259f292216be51f0a15b))



## 0.55.1 (2021-08-17)


### Features Dendron

* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)





# [0.60.0](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.60.0) (2021-09-20)


### Bug Fixes

* **publish:** versioning issues with next 11 ([76d7042](https://github.com/dendronhq/dendron/commit/76d7042a444dabc98069aaac1e40d692ee18f5a1))
* handle single domain hierarchies gracefully ([10dc5ec](https://github.com/dendronhq/dendron/commit/10dc5ec2ab3ebf767ae7e913cb90ba48e9651447))
* links at top/bottom of reference aren't clickable ([#1282](https://github.com/dendronhq/dendron/issues/1282)) ([b2a00cc](https://github.com/dendronhq/dendron/commit/b2a00cc564299cdb17ae6060154b7616c04e630c))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))


### Features Dendron

* **publish:** notice for dev mode ([#1354](https://github.com/dendronhq/dendron/issues/1354)) ([e3f9fc9](https://github.com/dendronhq/dendron/commit/e3f9fc9d81dc51fbaec5f4bbccb2f6c1dffb1afb))
* additional styling for nextjs ([f8e7972](https://github.com/dendronhq/dendron/commit/f8e797231b586c20ac4d2e1fa1813982cc282375))
* nextjs publishing fulltext search ([#1334](https://github.com/dendronhq/dendron/issues/1334)) ([68f8473](https://github.com/dendronhq/dendron/commit/68f8473badf22494c8d0758f8195e377235321f6))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))



## 0.55.2 (2021-08-21)


### Features Dendron

* make breadcrumbs clickable ([#1164](https://github.com/dendronhq/dendron/issues/1164)) ([a386fc3](https://github.com/dendronhq/dendron/commit/a386fc3dd42769207f58259f292216be51f0a15b))



## 0.55.1 (2021-08-17)


### Features Dendron

* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)





## [0.59.3-alpha.1](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.59.3-alpha.1) (2021-09-20)


### Bug Fixes

* handle single domain hierarchies gracefully ([10dc5ec](https://github.com/dendronhq/dendron/commit/10dc5ec2ab3ebf767ae7e913cb90ba48e9651447))
* links at top/bottom of reference aren't clickable ([#1282](https://github.com/dendronhq/dendron/issues/1282)) ([b2a00cc](https://github.com/dendronhq/dendron/commit/b2a00cc564299cdb17ae6060154b7616c04e630c))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))


### Features Dendron

* **publish:** notice for dev mode ([#1354](https://github.com/dendronhq/dendron/issues/1354)) ([e3f9fc9](https://github.com/dendronhq/dendron/commit/e3f9fc9d81dc51fbaec5f4bbccb2f6c1dffb1afb))
* additional styling for nextjs ([f8e7972](https://github.com/dendronhq/dendron/commit/f8e797231b586c20ac4d2e1fa1813982cc282375))
* nextjs publishing fulltext search ([#1334](https://github.com/dendronhq/dendron/issues/1334)) ([68f8473](https://github.com/dendronhq/dendron/commit/68f8473badf22494c8d0758f8195e377235321f6))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))



## 0.55.2 (2021-08-21)


### Features Dendron

* make breadcrumbs clickable ([#1164](https://github.com/dendronhq/dendron/issues/1164)) ([a386fc3](https://github.com/dendronhq/dendron/commit/a386fc3dd42769207f58259f292216be51f0a15b))



## 0.55.1 (2021-08-17)


### Features Dendron

* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)





## [0.59.3-alpha.0](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.59.3-alpha.0) (2021-09-19)


### Bug Fixes

* handle single domain hierarchies gracefully ([10dc5ec](https://github.com/dendronhq/dendron/commit/10dc5ec2ab3ebf767ae7e913cb90ba48e9651447))
* links at top/bottom of reference aren't clickable ([#1282](https://github.com/dendronhq/dendron/issues/1282)) ([b2a00cc](https://github.com/dendronhq/dendron/commit/b2a00cc564299cdb17ae6060154b7616c04e630c))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))


### Features Dendron

* **publish:** notice for dev mode ([#1354](https://github.com/dendronhq/dendron/issues/1354)) ([e3f9fc9](https://github.com/dendronhq/dendron/commit/e3f9fc9d81dc51fbaec5f4bbccb2f6c1dffb1afb))
* additional styling for nextjs ([f8e7972](https://github.com/dendronhq/dendron/commit/f8e797231b586c20ac4d2e1fa1813982cc282375))
* nextjs publishing fulltext search ([#1334](https://github.com/dendronhq/dendron/issues/1334)) ([68f8473](https://github.com/dendronhq/dendron/commit/68f8473badf22494c8d0758f8195e377235321f6))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))



## 0.55.2 (2021-08-21)


### Features Dendron

* make breadcrumbs clickable ([#1164](https://github.com/dendronhq/dendron/issues/1164)) ([a386fc3](https://github.com/dendronhq/dendron/commit/a386fc3dd42769207f58259f292216be51f0a15b))



## 0.55.1 (2021-08-17)


### Features Dendron

* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)





## [0.59.2](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.59.2) (2021-09-17)


### Bug Fixes

* handle single domain hierarchies gracefully ([10dc5ec](https://github.com/dendronhq/dendron/commit/10dc5ec2ab3ebf767ae7e913cb90ba48e9651447))
* links at top/bottom of reference aren't clickable ([#1282](https://github.com/dendronhq/dendron/issues/1282)) ([b2a00cc](https://github.com/dendronhq/dendron/commit/b2a00cc564299cdb17ae6060154b7616c04e630c))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))


### Features Dendron

* additional styling for nextjs ([f8e7972](https://github.com/dendronhq/dendron/commit/f8e797231b586c20ac4d2e1fa1813982cc282375))
* nextjs publishing fulltext search ([#1334](https://github.com/dendronhq/dendron/issues/1334)) ([68f8473](https://github.com/dendronhq/dendron/commit/68f8473badf22494c8d0758f8195e377235321f6))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))



## 0.55.2 (2021-08-21)


### Features Dendron

* make breadcrumbs clickable ([#1164](https://github.com/dendronhq/dendron/issues/1164)) ([a386fc3](https://github.com/dendronhq/dendron/commit/a386fc3dd42769207f58259f292216be51f0a15b))



## 0.55.1 (2021-08-17)


### Features Dendron

* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)





## [0.59.1](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.59.1) (2021-09-16)


### Bug Fixes

* handle single domain hierarchies gracefully ([10dc5ec](https://github.com/dendronhq/dendron/commit/10dc5ec2ab3ebf767ae7e913cb90ba48e9651447))
* links at top/bottom of reference aren't clickable ([#1282](https://github.com/dendronhq/dendron/issues/1282)) ([b2a00cc](https://github.com/dendronhq/dendron/commit/b2a00cc564299cdb17ae6060154b7616c04e630c))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))


### Features Dendron

* additional styling for nextjs ([f8e7972](https://github.com/dendronhq/dendron/commit/f8e797231b586c20ac4d2e1fa1813982cc282375))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))



## 0.55.2 (2021-08-21)


### Features Dendron

* make breadcrumbs clickable ([#1164](https://github.com/dendronhq/dendron/issues/1164)) ([a386fc3](https://github.com/dendronhq/dendron/commit/a386fc3dd42769207f58259f292216be51f0a15b))



## 0.55.1 (2021-08-17)


### Features Dendron

* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)





## [0.59.2-alpha.5](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.59.2-alpha.5) (2021-09-15)


### Bug Fixes

* handle single domain hierarchies gracefully ([10dc5ec](https://github.com/dendronhq/dendron/commit/10dc5ec2ab3ebf767ae7e913cb90ba48e9651447))
* links at top/bottom of reference aren't clickable ([#1282](https://github.com/dendronhq/dendron/issues/1282)) ([b2a00cc](https://github.com/dendronhq/dendron/commit/b2a00cc564299cdb17ae6060154b7616c04e630c))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))


### Features Dendron

* additional styling for nextjs ([f8e7972](https://github.com/dendronhq/dendron/commit/f8e797231b586c20ac4d2e1fa1813982cc282375))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))



## 0.55.2 (2021-08-21)


### Features Dendron

* make breadcrumbs clickable ([#1164](https://github.com/dendronhq/dendron/issues/1164)) ([a386fc3](https://github.com/dendronhq/dendron/commit/a386fc3dd42769207f58259f292216be51f0a15b))



## 0.55.1 (2021-08-17)


### Features Dendron

* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)





## [0.59.2-alpha.4](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.59.2-alpha.4) (2021-09-15)


### Bug Fixes

* handle single domain hierarchies gracefully ([10dc5ec](https://github.com/dendronhq/dendron/commit/10dc5ec2ab3ebf767ae7e913cb90ba48e9651447))
* links at top/bottom of reference aren't clickable ([#1282](https://github.com/dendronhq/dendron/issues/1282)) ([b2a00cc](https://github.com/dendronhq/dendron/commit/b2a00cc564299cdb17ae6060154b7616c04e630c))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))


### Features Dendron

* additional styling for nextjs ([f8e7972](https://github.com/dendronhq/dendron/commit/f8e797231b586c20ac4d2e1fa1813982cc282375))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))



## 0.55.2 (2021-08-21)


### Features Dendron

* make breadcrumbs clickable ([#1164](https://github.com/dendronhq/dendron/issues/1164)) ([a386fc3](https://github.com/dendronhq/dendron/commit/a386fc3dd42769207f58259f292216be51f0a15b))



## 0.55.1 (2021-08-17)


### Features Dendron

* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)





## [0.59.2-alpha.3](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.59.2-alpha.3) (2021-09-15)


### Bug Fixes

* handle single domain hierarchies gracefully ([10dc5ec](https://github.com/dendronhq/dendron/commit/10dc5ec2ab3ebf767ae7e913cb90ba48e9651447))
* links at top/bottom of reference aren't clickable ([#1282](https://github.com/dendronhq/dendron/issues/1282)) ([b2a00cc](https://github.com/dendronhq/dendron/commit/b2a00cc564299cdb17ae6060154b7616c04e630c))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))


### Features Dendron

* additional styling for nextjs ([f8e7972](https://github.com/dendronhq/dendron/commit/f8e797231b586c20ac4d2e1fa1813982cc282375))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))



## 0.55.2 (2021-08-21)


### Features Dendron

* make breadcrumbs clickable ([#1164](https://github.com/dendronhq/dendron/issues/1164)) ([a386fc3](https://github.com/dendronhq/dendron/commit/a386fc3dd42769207f58259f292216be51f0a15b))



## 0.55.1 (2021-08-17)


### Features Dendron

* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)





## [0.59.2-alpha.2](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.59.2-alpha.2) (2021-09-15)


### Bug Fixes

* handle single domain hierarchies gracefully ([10dc5ec](https://github.com/dendronhq/dendron/commit/10dc5ec2ab3ebf767ae7e913cb90ba48e9651447))
* links at top/bottom of reference aren't clickable ([#1282](https://github.com/dendronhq/dendron/issues/1282)) ([b2a00cc](https://github.com/dendronhq/dendron/commit/b2a00cc564299cdb17ae6060154b7616c04e630c))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))


### Features Dendron

* additional styling for nextjs ([f8e7972](https://github.com/dendronhq/dendron/commit/f8e797231b586c20ac4d2e1fa1813982cc282375))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))



## 0.55.2 (2021-08-21)


### Features Dendron

* make breadcrumbs clickable ([#1164](https://github.com/dendronhq/dendron/issues/1164)) ([a386fc3](https://github.com/dendronhq/dendron/commit/a386fc3dd42769207f58259f292216be51f0a15b))



## 0.55.1 (2021-08-17)


### Features Dendron

* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)





## [0.59.2-alpha.1](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.59.2-alpha.1) (2021-09-15)


### Bug Fixes

* handle single domain hierarchies gracefully ([10dc5ec](https://github.com/dendronhq/dendron/commit/10dc5ec2ab3ebf767ae7e913cb90ba48e9651447))
* links at top/bottom of reference aren't clickable ([#1282](https://github.com/dendronhq/dendron/issues/1282)) ([b2a00cc](https://github.com/dendronhq/dendron/commit/b2a00cc564299cdb17ae6060154b7616c04e630c))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))


### Features Dendron

* additional styling for nextjs ([f8e7972](https://github.com/dendronhq/dendron/commit/f8e797231b586c20ac4d2e1fa1813982cc282375))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))



## 0.55.2 (2021-08-21)


### Features Dendron

* make breadcrumbs clickable ([#1164](https://github.com/dendronhq/dendron/issues/1164)) ([a386fc3](https://github.com/dendronhq/dendron/commit/a386fc3dd42769207f58259f292216be51f0a15b))



## 0.55.1 (2021-08-17)


### Features Dendron

* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)





## [0.59.2-alpha.0](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.59.2-alpha.0) (2021-09-15)


### Bug Fixes

* handle single domain hierarchies gracefully ([10dc5ec](https://github.com/dendronhq/dendron/commit/10dc5ec2ab3ebf767ae7e913cb90ba48e9651447))
* links at top/bottom of reference aren't clickable ([#1282](https://github.com/dendronhq/dendron/issues/1282)) ([b2a00cc](https://github.com/dendronhq/dendron/commit/b2a00cc564299cdb17ae6060154b7616c04e630c))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))


### Features Dendron

* additional styling for nextjs ([f8e7972](https://github.com/dendronhq/dendron/commit/f8e797231b586c20ac4d2e1fa1813982cc282375))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))



## 0.55.2 (2021-08-21)


### Features Dendron

* make breadcrumbs clickable ([#1164](https://github.com/dendronhq/dendron/issues/1164)) ([a386fc3](https://github.com/dendronhq/dendron/commit/a386fc3dd42769207f58259f292216be51f0a15b))



## 0.55.1 (2021-08-17)


### Features Dendron

* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)





## [0.59.1](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.59.1) (2021-09-14)


### Bug Fixes

* handle single domain hierarchies gracefully ([10dc5ec](https://github.com/dendronhq/dendron/commit/10dc5ec2ab3ebf767ae7e913cb90ba48e9651447))
* links at top/bottom of reference aren't clickable ([#1282](https://github.com/dendronhq/dendron/issues/1282)) ([b2a00cc](https://github.com/dendronhq/dendron/commit/b2a00cc564299cdb17ae6060154b7616c04e630c))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))


### Features Dendron

* additional styling for nextjs ([f8e7972](https://github.com/dendronhq/dendron/commit/f8e797231b586c20ac4d2e1fa1813982cc282375))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))



## 0.55.2 (2021-08-21)


### Features Dendron

* make breadcrumbs clickable ([#1164](https://github.com/dendronhq/dendron/issues/1164)) ([a386fc3](https://github.com/dendronhq/dendron/commit/a386fc3dd42769207f58259f292216be51f0a15b))



## 0.55.1 (2021-08-17)


### Features Dendron

* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)





# [0.59.0](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.59.0) (2021-09-14)


### Bug Fixes

* handle single domain hierarchies gracefully ([10dc5ec](https://github.com/dendronhq/dendron/commit/10dc5ec2ab3ebf767ae7e913cb90ba48e9651447))
* links at top/bottom of reference aren't clickable ([#1282](https://github.com/dendronhq/dendron/issues/1282)) ([b2a00cc](https://github.com/dendronhq/dendron/commit/b2a00cc564299cdb17ae6060154b7616c04e630c))
* show all root results and their children on empty query ([#1333](https://github.com/dendronhq/dendron/issues/1333)) ([6ad6fd8](https://github.com/dendronhq/dendron/commit/6ad6fd87d7a8a6fd7791cf7d2166ea59dc3b0982))


### Features Dendron

* additional styling for nextjs ([f8e7972](https://github.com/dendronhq/dendron/commit/f8e797231b586c20ac4d2e1fa1813982cc282375))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))



## 0.55.2 (2021-08-21)


### Features Dendron

* make breadcrumbs clickable ([#1164](https://github.com/dendronhq/dendron/issues/1164)) ([a386fc3](https://github.com/dendronhq/dendron/commit/a386fc3dd42769207f58259f292216be51f0a15b))



## 0.55.1 (2021-08-17)


### Features Dendron

* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)





## [0.58.4](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.58.4) (2021-09-12)


### Bug Fixes

* handle single domain hierarchies gracefully ([10dc5ec](https://github.com/dendronhq/dendron/commit/10dc5ec2ab3ebf767ae7e913cb90ba48e9651447))
* links at top/bottom of reference aren't clickable ([#1282](https://github.com/dendronhq/dendron/issues/1282)) ([b2a00cc](https://github.com/dendronhq/dendron/commit/b2a00cc564299cdb17ae6060154b7616c04e630c))


### Features Dendron

* additional styling for nextjs ([f8e7972](https://github.com/dendronhq/dendron/commit/f8e797231b586c20ac4d2e1fa1813982cc282375))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))



## 0.55.2 (2021-08-21)


### Features Dendron

* make breadcrumbs clickable ([#1164](https://github.com/dendronhq/dendron/issues/1164)) ([a386fc3](https://github.com/dendronhq/dendron/commit/a386fc3dd42769207f58259f292216be51f0a15b))



## 0.55.1 (2021-08-17)


### Features Dendron

* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)





## [0.58.4-alpha.1](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.58.4-alpha.1) (2021-09-10)


### Bug Fixes

* handle single domain hierarchies gracefully ([10dc5ec](https://github.com/dendronhq/dendron/commit/10dc5ec2ab3ebf767ae7e913cb90ba48e9651447))
* links at top/bottom of reference aren't clickable ([#1282](https://github.com/dendronhq/dendron/issues/1282)) ([b2a00cc](https://github.com/dendronhq/dendron/commit/b2a00cc564299cdb17ae6060154b7616c04e630c))
* use assetUrl for hooks ([a0a16d6](https://github.com/dendronhq/dendron/commit/a0a16d698446abe0d485e7b2ceb284c7a3cb628f))


### Features Dendron

* additional styling for nextjs ([f8e7972](https://github.com/dendronhq/dendron/commit/f8e797231b586c20ac4d2e1fa1813982cc282375))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))



## 0.55.2 (2021-08-21)


### Features Dendron

* make breadcrumbs clickable ([#1164](https://github.com/dendronhq/dendron/issues/1164)) ([a386fc3](https://github.com/dendronhq/dendron/commit/a386fc3dd42769207f58259f292216be51f0a15b))



## 0.55.1 (2021-08-17)


### Features Dendron

* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)





## [0.58.4-alpha.0](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.58.4-alpha.0) (2021-09-09)


### Bug Fixes

* handle single domain hierarchies gracefully ([10dc5ec](https://github.com/dendronhq/dendron/commit/10dc5ec2ab3ebf767ae7e913cb90ba48e9651447))
* links at top/bottom of reference aren't clickable ([#1282](https://github.com/dendronhq/dendron/issues/1282)) ([b2a00cc](https://github.com/dendronhq/dendron/commit/b2a00cc564299cdb17ae6060154b7616c04e630c))


### Features Dendron

* additional styling for nextjs ([f8e7972](https://github.com/dendronhq/dendron/commit/f8e797231b586c20ac4d2e1fa1813982cc282375))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))



## 0.55.2 (2021-08-21)


### Features Dendron

* make breadcrumbs clickable ([#1164](https://github.com/dendronhq/dendron/issues/1164)) ([a386fc3](https://github.com/dendronhq/dendron/commit/a386fc3dd42769207f58259f292216be51f0a15b))



## 0.55.1 (2021-08-17)


### Features Dendron

* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)





## [0.58.3-alpha.0](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.58.3-alpha.0) (2021-09-09)


### Bug Fixes

* handle single domain hierarchies gracefully ([10dc5ec](https://github.com/dendronhq/dendron/commit/10dc5ec2ab3ebf767ae7e913cb90ba48e9651447))
* links at top/bottom of reference aren't clickable ([#1282](https://github.com/dendronhq/dendron/issues/1282)) ([b2a00cc](https://github.com/dendronhq/dendron/commit/b2a00cc564299cdb17ae6060154b7616c04e630c))


### Features Dendron

* additional styling for nextjs ([f8e7972](https://github.com/dendronhq/dendron/commit/f8e797231b586c20ac4d2e1fa1813982cc282375))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))



## 0.55.2 (2021-08-21)


### Features Dendron

* make breadcrumbs clickable ([#1164](https://github.com/dendronhq/dendron/issues/1164)) ([a386fc3](https://github.com/dendronhq/dendron/commit/a386fc3dd42769207f58259f292216be51f0a15b))



## 0.55.1 (2021-08-17)


### Features Dendron

* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)





## [0.58.2-alpha.0](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.58.2-alpha.0) (2021-09-09)


### Bug Fixes

* handle single domain hierarchies gracefully ([10dc5ec](https://github.com/dendronhq/dendron/commit/10dc5ec2ab3ebf767ae7e913cb90ba48e9651447))
* links at top/bottom of reference aren't clickable ([#1282](https://github.com/dendronhq/dendron/issues/1282)) ([b2a00cc](https://github.com/dendronhq/dendron/commit/b2a00cc564299cdb17ae6060154b7616c04e630c))


### Features Dendron

* additional styling for nextjs ([f8e7972](https://github.com/dendronhq/dendron/commit/f8e797231b586c20ac4d2e1fa1813982cc282375))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))



## 0.55.2 (2021-08-21)


### Features Dendron

* make breadcrumbs clickable ([#1164](https://github.com/dendronhq/dendron/issues/1164)) ([a386fc3](https://github.com/dendronhq/dendron/commit/a386fc3dd42769207f58259f292216be51f0a15b))



## 0.55.1 (2021-08-17)


### Features Dendron

* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)





## [0.58.1](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.58.1) (2021-09-08)


### Bug Fixes

* handle single domain hierarchies gracefully ([10dc5ec](https://github.com/dendronhq/dendron/commit/10dc5ec2ab3ebf767ae7e913cb90ba48e9651447))
* links at top/bottom of reference aren't clickable ([#1282](https://github.com/dendronhq/dendron/issues/1282)) ([b2a00cc](https://github.com/dendronhq/dendron/commit/b2a00cc564299cdb17ae6060154b7616c04e630c))


### Features Dendron

* additional styling for nextjs ([f8e7972](https://github.com/dendronhq/dendron/commit/f8e797231b586c20ac4d2e1fa1813982cc282375))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))



## 0.55.2 (2021-08-21)


### Features Dendron

* make breadcrumbs clickable ([#1164](https://github.com/dendronhq/dendron/issues/1164)) ([a386fc3](https://github.com/dendronhq/dendron/commit/a386fc3dd42769207f58259f292216be51f0a15b))



## 0.55.1 (2021-08-17)


### Features Dendron

* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)





# [0.58.0](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.58.0) (2021-09-07)


### Bug Fixes

* handle single domain hierarchies gracefully ([10dc5ec](https://github.com/dendronhq/dendron/commit/10dc5ec2ab3ebf767ae7e913cb90ba48e9651447))
* links at top/bottom of reference aren't clickable ([#1282](https://github.com/dendronhq/dendron/issues/1282)) ([b2a00cc](https://github.com/dendronhq/dendron/commit/b2a00cc564299cdb17ae6060154b7616c04e630c))


### Features Dendron

* additional styling for nextjs ([f8e7972](https://github.com/dendronhq/dendron/commit/f8e797231b586c20ac4d2e1fa1813982cc282375))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))



## 0.55.2 (2021-08-21)


### Features Dendron

* make breadcrumbs clickable ([#1164](https://github.com/dendronhq/dendron/issues/1164)) ([a386fc3](https://github.com/dendronhq/dendron/commit/a386fc3dd42769207f58259f292216be51f0a15b))



## 0.55.1 (2021-08-17)


### Features Dendron

* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)





## [0.57.3](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.57.3) (2021-09-06)


### Bug Fixes

* handle single domain hierarchies gracefully ([10dc5ec](https://github.com/dendronhq/dendron/commit/10dc5ec2ab3ebf767ae7e913cb90ba48e9651447))
* links at top/bottom of reference aren't clickable ([#1282](https://github.com/dendronhq/dendron/issues/1282)) ([b2a00cc](https://github.com/dendronhq/dendron/commit/b2a00cc564299cdb17ae6060154b7616c04e630c))


### Features Dendron

* additional styling for nextjs ([f8e7972](https://github.com/dendronhq/dendron/commit/f8e797231b586c20ac4d2e1fa1813982cc282375))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))



## 0.55.2 (2021-08-21)


### Features Dendron

* make breadcrumbs clickable ([#1164](https://github.com/dendronhq/dendron/issues/1164)) ([a386fc3](https://github.com/dendronhq/dendron/commit/a386fc3dd42769207f58259f292216be51f0a15b))



## 0.55.1 (2021-08-17)


### Features Dendron

* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)





## [0.57.2](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.57.2) (2021-09-04)


### Bug Fixes

* add wsConfig back to migrations ([711015a](https://github.com/dendronhq/dendron/commit/711015a65ade01a8aef5a93c80668ff27e7dd41d))
* handle single domain hierarchies gracefully ([10dc5ec](https://github.com/dendronhq/dendron/commit/10dc5ec2ab3ebf767ae7e913cb90ba48e9651447))
* links at top/bottom of reference aren't clickable ([#1282](https://github.com/dendronhq/dendron/issues/1282)) ([b2a00cc](https://github.com/dendronhq/dendron/commit/b2a00cc564299cdb17ae6060154b7616c04e630c))


### Features Dendron

* additional styling for nextjs ([f8e7972](https://github.com/dendronhq/dendron/commit/f8e797231b586c20ac4d2e1fa1813982cc282375))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))



## 0.55.2 (2021-08-21)


### Features Dendron

* make breadcrumbs clickable ([#1164](https://github.com/dendronhq/dendron/issues/1164)) ([a386fc3](https://github.com/dendronhq/dendron/commit/a386fc3dd42769207f58259f292216be51f0a15b))



## 0.55.1 (2021-08-17)


### Features Dendron

* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)





## [0.57.1](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.57.1) (2021-09-04)


### Bug Fixes

* add wsConfig back to migrations ([711015a](https://github.com/dendronhq/dendron/commit/711015a65ade01a8aef5a93c80668ff27e7dd41d))
* handle single domain hierarchies gracefully ([10dc5ec](https://github.com/dendronhq/dendron/commit/10dc5ec2ab3ebf767ae7e913cb90ba48e9651447))
* links at top/bottom of reference aren't clickable ([#1282](https://github.com/dendronhq/dendron/issues/1282)) ([b2a00cc](https://github.com/dendronhq/dendron/commit/b2a00cc564299cdb17ae6060154b7616c04e630c))


### Features Dendron

* additional styling for nextjs ([f8e7972](https://github.com/dendronhq/dendron/commit/f8e797231b586c20ac4d2e1fa1813982cc282375))
* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))
* support collection options in nextjs publishing ([#1277](https://github.com/dendronhq/dendron/issues/1277)) ([ddaedd4](https://github.com/dendronhq/dendron/commit/ddaedd40cfa9490a752d1d45e9680cf55d76c51f))



## 0.55.2 (2021-08-21)


### Features Dendron

* make breadcrumbs clickable ([#1164](https://github.com/dendronhq/dendron/issues/1164)) ([a386fc3](https://github.com/dendronhq/dendron/commit/a386fc3dd42769207f58259f292216be51f0a15b))



## 0.55.1 (2021-08-17)


### Features Dendron

* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)





# [0.57.0](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.57.0) (2021-08-31)


### Features Dendron

* support canonicalBaseURL ([f64e97c](https://github.com/dendronhq/dendron/commit/f64e97ca4afa8b953a410874089630c29152863a))



## 0.55.2 (2021-08-21)


### Features Dendron

* make breadcrumbs clickable ([#1164](https://github.com/dendronhq/dendron/issues/1164)) ([a386fc3](https://github.com/dendronhq/dendron/commit/a386fc3dd42769207f58259f292216be51f0a15b))



## 0.55.1 (2021-08-17)


### Features Dendron

* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)





# [0.56.0](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.56.0) (2021-08-23)



## 0.55.2 (2021-08-21)


### Features Dendron

* make breadcrumbs clickable ([#1164](https://github.com/dendronhq/dendron/issues/1164)) ([a386fc3](https://github.com/dendronhq/dendron/commit/a386fc3dd42769207f58259f292216be51f0a15b))



## 0.55.1 (2021-08-17)


### Features Dendron

* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)





## [0.55.2](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.55.2) (2021-08-19)


### Features Dendron

* make breadcrumbs clickable ([#1164](https://github.com/dendronhq/dendron/issues/1164)) ([a386fc3](https://github.com/dendronhq/dendron/commit/a386fc3dd42769207f58259f292216be51f0a15b))



## 0.55.1 (2021-08-17)


### Features Dendron

* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)





## [0.55.1](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.55.1) (2021-08-17)


### Features Dendron

* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)





# [0.55.0](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.55.0) (2021-08-17)


### Features Dendron

* **pubv3:** add more features to new publishing ([28a8a4f](https://github.com/dendronhq/dendron/commit/28a8a4f0ec8a02e6d6946833dec11c0117a3f783))



## 0.54.1 (2021-08-13)





## [0.54.1](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.54.1) (2021-08-13)

**Note:** Version bump only for package @dendronhq/nextjs-template





# [0.54.0](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.54.0) (2021-08-10)

**Note:** Version bump only for package @dendronhq/nextjs-template





## [0.53.10](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.53.10) (2021-08-10)

**Note:** Version bump only for package @dendronhq/nextjs-template





## [0.53.9](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.53.9) (2021-08-10)

**Note:** Version bump only for package @dendronhq/nextjs-template





## [0.53.8](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.53.8) (2021-08-10)

**Note:** Version bump only for package @dendronhq/nextjs-template





## [0.53.7](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.53.7) (2021-08-10)

**Note:** Version bump only for package @dendronhq/nextjs-template





## [0.53.6](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.53.6) (2021-08-10)

**Note:** Version bump only for package @dendronhq/nextjs-template





## [0.53.5](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.53.5) (2021-08-10)

**Note:** Version bump only for package @dendronhq/nextjs-template





## [0.53.4](https://github.com/dendronhq/dendron/compare/v0.53.0...v0.53.4) (2021-08-10)

**Note:** Version bump only for package @dendronhq/nextjs-template
