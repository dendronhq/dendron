---
id: apr1d
name: Packages Engine Server Overview
file_version: 1.0.2
app_version: 0.9.8-3
file_blobs:
  packages/common-all/src/types/typesv2.ts: f8e7c4b6640307b7180051549b4c384763f479a9
  packages/common-server/src/DConfig.ts: 45390cdf374d630d1b4a3ad3d527330908fbd24c
  packages/common-all/src/logger.ts: 37b129fe14886c2c737526743722b8e91359af51
  packages/engine-server/src/DendronEngineV3.ts: 371a8fd111f08df72f6329cb31d42c3bda816bf9
  packages/common-all/src/utils/index.ts: 602f372de2b6d09153ac32edee570dafa267955b
  packages/common-all/src/noteDictsUtils.ts: f66be2725b6a06042e6fbda21b4381c3111550ef
  packages/engine-server/src/utils/engineUtils.ts: 79e569482d4db97516d720e10cad5c350eaa508c
---

This document describes Packages Engine Server, which is a major component in our system.

{Describe Packages Engine Server in a short paragraph.}

<br/>

It is located under `📄 packages/engine-server/src`

<br/>

# Folder Structure
We have a few important subfolders to note under `📄 packages/engine-server/src`, namely:

- `📄 packages/engine-server/src/metadata`: {Explain what this subdirectory contains}
- `📄 packages/engine-server/src/workspace`: {Explain what this subdirectory contains}
- `📄 packages/engine-server/src/drivers`: {Explain what this subdirectory contains}
  - `📄 packages/engine-server/src/drivers/file`: {Explain what this subdirectory contains}

<br/>

# Main Types

<br/>

## `DEngineClient`[<sup id="Z1PfFAm">↓</sup>](#f-Z1PfFAm)
A `DEngineClient`[<sup id="Z1PfFAm">↓</sup>](#f-Z1PfFAm) is {Explain this type and what it represents}
<!-- NOTE-swimm-snippet: the lines below link your snippet to Swimm -->
### 📄 packages/common-all/src/types/typesv2.ts
```typescript
⬜ 529     * Implements the engine interface but has no backend store
⬜ 530     *  ^sdxp5tjokad9
⬜ 531     */
🟩 532    export type DEngineClient = Omit<DEngine, "store">;
⬜ 533    
⬜ 534    export type DStore = DCommonProps &
⬜ 535      DCommonMethods & {
```

<br/>

## `DConfig`[<sup id="ZOqsWD">↓</sup>](#f-ZOqsWD)
A `DConfig`[<sup id="ZOqsWD">↓</sup>](#f-ZOqsWD) is {Explain this type and what it represents}
<!-- NOTE-swimm-snippet: the lines below link your snippet to Swimm -->
### 📄 packages/common-server/src/DConfig.ts
```typescript
⬜ 31     
⬜ 32     let _dendronConfig: DendronConfig | undefined;
⬜ 33     
🟩 34     export class DConfig {
⬜ 35       static createSync({
⬜ 36         wsRoot,
⬜ 37         defaults,
```

<br/>

## `DLogger`[<sup id="209hCp">↓</sup>](#f-209hCp)
A `DLogger`[<sup id="209hCp">↓</sup>](#f-209hCp) is {Explain this type and what it represents}
<!-- NOTE-swimm-snippet: the lines below link your snippet to Swimm -->
### 📄 packages/common-all/src/logger.ts
```typescript
🟩 1      export type DLogger = {
⬜ 2        name?: string;
⬜ 3        level: any;
⬜ 4        debug: (msg: any) => void;
```

<br/>

## `DEngine`[<sup id="vzbtc">↓</sup>](#f-vzbtc)
A `DEngine`[<sup id="vzbtc">↓</sup>](#f-vzbtc) is {Explain this type and what it represents}
<!-- NOTE-swimm-snippet: the lines below link your snippet to Swimm -->
### 📄 packages/common-all/src/types/typesv2.ts
```typescript
⬜ 464      unwantedRecommendations: string[];
⬜ 465    };
⬜ 466    
🟩 467    export type DEngine = DCommonProps &
⬜ 468      DCommonMethods & {
⬜ 469        vaults: DVault[];
⬜ 470        hooks: DHookDict;
```

<br/>

## `RenderNoteOpts`[<sup id="SidR6">↓</sup>](#f-SidR6)
A `RenderNoteOpts`[<sup id="SidR6">↓</sup>](#f-SidR6) is {Explain this type and what it represents}
<!-- NOTE-swimm-snippet: the lines below link your snippet to Swimm -->
### 📄 packages/common-all/src/types/typesv2.ts
```typescript
⬜ 280      metaOnly?: boolean;
⬜ 281    };
⬜ 282    
🟩 283    export type RenderNoteOpts = {
⬜ 284      id: string;
⬜ 285      /** Optionally, an entire note can be provided to be rendered. If provided, the engine won't look up the note by id and will instead render this note. */
⬜ 286      note?: NoteProps;
```

<br/>

## `WriteNoteResp`[<sup id="Zibi7V">↓</sup>](#f-Zibi7V)
A `WriteNoteResp`[<sup id="Zibi7V">↓</sup>](#f-Zibi7V) is {Explain this type and what it represents}
<!-- NOTE-swimm-snippet: the lines below link your snippet to Swimm -->
### 📄 packages/common-all/src/types/typesv2.ts
```typescript
⬜ 377     * - notes that were created (eg. note being created had no existing parents)
⬜ 378     * - notes that have had their links re-written
⬜ 379     */
🟩 380    export type WriteNoteResp = RespV3<NoteChangeEntry[]>;
⬜ 381    export type BulkWriteNotesResp = RespWithOptError<NoteChangeEntry[]>;
⬜ 382    export type UpdateNoteResp = RespV2<NoteChangeEntry[]>; // TODO: remove
⬜ 383    export type DeleteNoteResp = RespV3<NoteChangeEntry[]>;
```

<br/>

## `RenameNoteResp`[<sup id="2n4zaB">↓</sup>](#f-2n4zaB)
A `RenameNoteResp`[<sup id="2n4zaB">↓</sup>](#f-2n4zaB) is {Explain this type and what it represents}
<!-- NOTE-swimm-snippet: the lines below link your snippet to Swimm -->
### 📄 packages/common-all/src/types/typesv2.ts
```typescript
⬜ 382    export type UpdateNoteResp = RespV2<NoteChangeEntry[]>; // TODO: remove
⬜ 383    export type DeleteNoteResp = RespV3<NoteChangeEntry[]>;
⬜ 384    export type QueryNotesResp = NoteProps[];
🟩 385    export type RenameNoteResp = RespV3<NoteChangeEntry[]>;
⬜ 386    export type EngineInfoResp = RespV3<{
⬜ 387      version: string;
⬜ 388    }>;
```

<br/>

# Useful utilities
Here are a few utility types we use in Packages Engine Server

<br/>

# `ConfigUtils`[<sup id="Z1Q8Cft">↓</sup>](#f-Z1Q8Cft)
Used for {Describe what this utility class is useful for}
<!-- NOTE-swimm-snippet: the lines below link your snippet to Swimm -->
### 📄 packages/engine-server/src/DendronEngineV3.ts
```typescript
⬜ 127      constructor(props: DendronEngineOptsV3) {
⬜ 128        super(props);
⬜ 129        this.wsRoot = props.wsRoot;
🟩 130        const hooks: DHookDict = ConfigUtils.getWorkspace(props.config).hooks || {
⬜ 131          onCreate: [],
⬜ 132        };
⬜ 133        this.hooks = hooks;
```

<br/>

# `NoteDictsUtils`[<sup id="2ogSLD">↓</sup>](#f-2ogSLD)
Used for {Describe what this utility class is useful for}
<!-- NOTE-swimm-snippet: the lines below link your snippet to Swimm -->
### 📄 packages/engine-server/src/DendronEngineV3.ts
```typescript
⬜ 1175           noteFrom.links.forEach((link) => {
⬜ 1176             const maybeBacklink = BacklinkUtils.createFromDLink(link);
⬜ 1177             if (maybeBacklink) {
🟩 1178               const notes = NoteDictsUtils.findByFname({
⬜ 1179                 fname: link.to!.fname!,
⬜ 1180                 noteDicts,
⬜ 1181                 skipCloneDeep: true,
```

<br/>

# `EngineUtils`[<sup id="ZmGe6O">↓</sup>](#f-ZmGe6O)
Used for {Describe what this utility class is useful for}
<!-- NOTE-swimm-snippet: the lines below link your snippet to Swimm -->
### 📄 packages/engine-server/src/DendronEngineV3.ts
```typescript
⬜ 311    
⬜ 312        const config = DConfig.readConfigSync(this.wsRoot);
⬜ 313        // Update links/anchors based on note body
🟩 314        await EngineUtils.refreshNoteLinksAndAnchors({
⬜ 315          note,
⬜ 316          engine: this,
⬜ 317          config,
```

<br/>

<!-- THIS IS AN AUTOGENERATED SECTION. DO NOT EDIT THIS SECTION DIRECTLY -->
### Swimm Note

<span id="f-Z1Q8Cft">ConfigUtils</span>[^](#Z1Q8Cft) - "packages/common-all/src/utils/index.ts" L482
```typescript
export class ConfigUtils {
```

<span id="f-ZOqsWD">DConfig</span>[^](#ZOqsWD) - "packages/common-server/src/DConfig.ts" L34
```typescript
export class DConfig {
```

<span id="f-vzbtc">DEngine</span>[^](#vzbtc) - "packages/common-all/src/types/typesv2.ts" L467
```typescript
export type DEngine = DCommonProps &
```

<span id="f-Z1PfFAm">DEngineClient</span>[^](#Z1PfFAm) - "packages/common-all/src/types/typesv2.ts" L532
```typescript
export type DEngineClient = Omit<DEngine, "store">;
```

<span id="f-209hCp">DLogger</span>[^](#209hCp) - "packages/common-all/src/logger.ts" L1
```typescript
export type DLogger = {
```

<span id="f-ZmGe6O">EngineUtils</span>[^](#ZmGe6O) - "packages/engine-server/src/utils/engineUtils.ts" L23
```typescript
export class EngineUtils {
```

<span id="f-2ogSLD">NoteDictsUtils</span>[^](#2ogSLD) - "packages/common-all/src/noteDictsUtils.ts" L17
```typescript
export class NoteDictsUtils {
```

<span id="f-2n4zaB">RenameNoteResp</span>[^](#2n4zaB) - "packages/common-all/src/types/typesv2.ts" L385
```typescript
export type RenameNoteResp = RespV3<NoteChangeEntry[]>;
```

<span id="f-SidR6">RenderNoteOpts</span>[^](#SidR6) - "packages/common-all/src/types/typesv2.ts" L283
```typescript
export type RenderNoteOpts = {
```

<span id="f-Zibi7V">WriteNoteResp</span>[^](#Zibi7V) - "packages/common-all/src/types/typesv2.ts" L380
```typescript
export type WriteNoteResp = RespV3<NoteChangeEntry[]>;
```

<br/>

This file was generated by Swimm. [Click here to view it in the app](https://app.swimm.io/repos/Z2l0aHViJTNBJTNBZGVuZHJvbiUzQSUzQWRlbmRyb25ocQ==/docs/apr1d).