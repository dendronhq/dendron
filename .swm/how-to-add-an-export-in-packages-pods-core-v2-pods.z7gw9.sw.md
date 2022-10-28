---
id: z7gw9
name: How to Add an Export in Packages Pods Core V2 Pods
file_version: 1.0.2
app_version: 0.9.8-3
file_blobs:
  packages/pods-core/src/v2/pods/export/GoogleDocsExportPodV2.ts: c4c2f0ae4dd45e46f4b5956317605e86d458ca04
  packages/dendron-cli/src/commands/exportPodV2.ts: 6ba2d502bd70f1a4a63b7616e3853058ae3cfd4f
  packages/pods-core/src/v2/ConfigFileUtils.ts: dc72a4d3218f28df73e1744583ccbff5f226450d
  packages/pods-core/src/v2/index.ts: 854e4336a8730578dd8bdf239c59171cffed9ff8
---

This document covers how to create a new Export.

Some examples of `📄 packages/pods-core/src/v2/pods/export`s are `📄 packages/pods-core/src/v2/pods/export/AirtableExportPodV2.ts`, `📄 packages/pods-core/src/v2/pods/export/GoogleDocsExportPodV2.ts`, and `📄 packages/pods-core/src/v2/pods/export/MarkdownExportPodV2.ts`.

<br/>

## TL;DR - How to add `📄 packages/pods-core/src/v2/pods/export`s

1. Create a new file under `📄 packages/pods-core/src/v2/pods/export`&nbsp;
   - e.g. `📄 packages/pods-core/src/v2/pods/export/GoogleDocsExportPodV2.ts`
1. Implement the export class (e.g. `GoogleDocsExportPodV2`[<sup id="1M0iBC">↓</sup>](#f-1M0iBC))
    1. Define `_config`[<sup id="1TDDAS">↓</sup>](#f-1TDDAS) and `_engine`[<sup id="Z244nas">↓</sup>](#f-Z244nas)
    1. Update `📄 packages/dendron-cli/src/commands/exportPodV2.ts` with the new class
    1. Update `📄 packages/pods-core/src/v2/ConfigFileUtils.ts` with the new class
    1. Update `📄 packages/pods-core/src/v2/index.ts` with the new class
1. Define `data`[<sup id="dfRIa">↓</sup>](#f-dfRIa), `resp`[<sup id="Z1fru4r">↓</sup>](#f-Z1fru4r), `errors`[<sup id="Z27Kb8P">↓</sup>](#f-Z27Kb8P), `limiter`[<sup id="adTAv">↓</sup>](#f-adTAv), and `out`[<sup id="xfSdK">↓</sup>](#f-xfSdK)
1. **Profit** 💰

<br/>

# Full walkthrough
Start by creating a new file under `📄 packages/pods-core/src/v2/pods/export`.
We'll follow `📄 packages/pods-core/src/v2/pods/export/GoogleDocsExportPodV2.ts` as an example.



<br/>

## Implement the export class

Here is how we do it for `📄 packages/pods-core/src/v2/pods/export/GoogleDocsExportPodV2.ts`:

<br/>


<!-- NOTE-swimm-snippet: the lines below link your snippet to Swimm -->
### 📄 packages/pods-core/src/v2/pods/export/GoogleDocsExportPodV2.ts
```typescript
⬜ 57      * exportNote() for now
⬜ 58      */
⬜ 59     export class GoogleDocsExportPodV2
🟩 60       implements ExportPodV2<GoogleDocsExportReturnType>
⬜ 61     {
⬜ 62       private _config: RunnableGoogleDocsV2PodConfig;
⬜ 63       private _engine: DEngineClient;
```

<br/>

### Define `_config`[<sup id="1TDDAS">↓</sup>](#f-1TDDAS) and `_engine`[<sup id="Z244nas">↓</sup>](#f-Z244nas)
`📄 packages/pods-core/src/v2/pods/export`s should define these properties:
- `_config`[<sup id="1TDDAS">↓</sup>](#f-1TDDAS)
- `_engine`[<sup id="Z244nas">↓</sup>](#f-Z244nas)

<br/>


<!-- NOTE-swimm-snippet: the lines below link your snippet to Swimm -->
### 📄 packages/pods-core/src/v2/pods/export/GoogleDocsExportPodV2.ts
```typescript
⬜ 59     export class GoogleDocsExportPodV2
⬜ 60       implements ExportPodV2<GoogleDocsExportReturnType>
⬜ 61     {
🟩 62       private _config: RunnableGoogleDocsV2PodConfig;
🟩 63       private _engine: DEngineClient;
⬜ 64       private _wsRoot: string;
⬜ 65       private _vaults: DVault[];
⬜ 66       private _port: number;
```

<br/>

### Update additional files with the new class
Every time we add new `📄 packages/pods-core/src/v2/pods/export`s, we reference them in a few locations.

We will still look at `📄 packages/pods-core/src/v2/pods/export/GoogleDocsExportPodV2.ts` as our example.

<br/>

Don't forget to add the new class to `📄 packages/dendron-cli/src/commands/exportPodV2.ts`, as seen here:
<!-- NOTE-swimm-snippet: the lines below link your snippet to Swimm -->
### 📄 packages/dendron-cli/src/commands/exportPodV2.ts
```typescript
⬜ 10       AirtableExportPodV2,
⬜ 11       AirtableExportReturnType,
⬜ 12       AirtableUtils,
🟩 13       GoogleDocsExportPodV2,
⬜ 14       GoogleDocsExportReturnType,
⬜ 15       GoogleDocsUtils,
⬜ 16       JSONExportPodV2,
```

<br/>

Still in the same file:
<!-- NOTE-swimm-snippet: the lines below link your snippet to Swimm -->
### 📄 packages/dendron-cli/src/commands/exportPodV2.ts
```typescript
⬜ 103             */
⬜ 104            const port = openPortFile({ fpath });
⬜ 105    
🟩 106            return new GoogleDocsExportPodV2({
⬜ 107              podConfig: config,
⬜ 108              engine,
⬜ 109              port,
```

<br/>

Update `📄 packages/pods-core/src/v2/ConfigFileUtils.ts`, for example:
<!-- NOTE-swimm-snippet: the lines below link your snippet to Swimm -->
### 📄 packages/pods-core/src/v2/ConfigFileUtils.ts
```typescript
⬜ 5      import path from "path";
⬜ 6      import {
⬜ 7        AirtableExportPodV2,
🟩 8        GoogleDocsExportPodV2,
⬜ 9        JSONExportPodV2,
⬜ 10       MarkdownExportPodV2,
⬜ 11       PodV2Types,
```

<br/>

Also notice in the same file:
<!-- NOTE-swimm-snippet: the lines below link your snippet to Swimm -->
### 📄 packages/pods-core/src/v2/ConfigFileUtils.ts
```typescript
⬜ 117          case PodV2Types.AirtableExportV2:
⬜ 118            return AirtableExportPodV2.config();
⬜ 119          case PodV2Types.GoogleDocsExportV2:
🟩 120            return GoogleDocsExportPodV2.config();
⬜ 121          case PodV2Types.MarkdownExportV2:
⬜ 122            return MarkdownExportPodV2.config();
⬜ 123          case PodV2Types.NotionExportV2:
```

<br/>

Add the new class to `📄 packages/pods-core/src/v2/index.ts`, as we do with `📄 packages/pods-core/src/v2/pods/export/GoogleDocsExportPodV2.ts` here:
<!-- NOTE-swimm-snippet: the lines below link your snippet to Swimm -->
### 📄 packages/pods-core/src/v2/index.ts
```typescript
⬜ 3      // TODO: refactor into own index file
⬜ 4      export * from "./pods/export/AirtableExportPodV2";
⬜ 5      export * from "./pods/export/MarkdownExportPodV2";
🟩 6      export * from "./pods/export/GoogleDocsExportPodV2";
⬜ 7      export * from "./pods/export/NotionExportPodV2";
⬜ 8      export * from "./pods/export/JSONExportPodV2";
⬜ 9      
```

<br/>

## Define `data`[<sup id="dfRIa">↓</sup>](#f-dfRIa), `resp`[<sup id="Z1fru4r">↓</sup>](#f-Z1fru4r), `errors`[<sup id="Z27Kb8P">↓</sup>](#f-Z27Kb8P), `limiter`[<sup id="adTAv">↓</sup>](#f-adTAv), and `out`[<sup id="xfSdK">↓</sup>](#f-xfSdK)
`📄 packages/pods-core/src/v2/pods/export`s should define these constants:
- `data`[<sup id="dfRIa">↓</sup>](#f-dfRIa)
- `resp`[<sup id="Z1fru4r">↓</sup>](#f-Z1fru4r)
- `errors`[<sup id="Z27Kb8P">↓</sup>](#f-Z27Kb8P)
- `limiter`[<sup id="adTAv">↓</sup>](#f-adTAv)
- `out`[<sup id="xfSdK">↓</sup>](#f-xfSdK)

<br/>


<!-- NOTE-swimm-snippet: the lines below link your snippet to Swimm -->
### 📄 packages/pods-core/src/v2/pods/export/GoogleDocsExportPodV2.ts
```typescript
⬜ 82       }
⬜ 83     
⬜ 84       async exportNotes(notes: NoteProps[]): Promise<GoogleDocsExportReturnType> {
🟩 85         const resp = await this.getPayloadForNotes(notes);
⬜ 86         let { accessToken } = this._config;
⬜ 87         const { expirationTime, refreshToken, parentFolderId } = this._config;
⬜ 88         try {
```

<br/>


<!-- NOTE-swimm-snippet: the lines below link your snippet to Swimm -->
### 📄 packages/pods-core/src/v2/pods/export/GoogleDocsExportPodV2.ts
```typescript
⬜ 120          limiter,
⬜ 121        });
⬜ 122        const errors = createRequest.errors.concat(updateRequest.errors);
🟩 123        const data = {
⬜ 124          created: createRequest.data,
⬜ 125          updated: updateRequest.data,
⬜ 126        };
```

<br/>


<!-- NOTE-swimm-snippet: the lines below link your snippet to Swimm -->
### 📄 packages/pods-core/src/v2/pods/export/GoogleDocsExportPodV2.ts
```typescript
⬜ 263        accessToken: string;
⬜ 264        limiter: RateLimiter;
⬜ 265      }) {
🟩 266        const { docToUpdate, accessToken, limiter } = opts;
🟩 267        const errors: IDendronError[] = [];
🟩 268        const out: GoogleDocsFields[] = await Promise.all(
⬜ 269          docToUpdate.map(async ({ content, documentId, dendronId }) => {
⬜ 270            if (!documentId) return;
⬜ 271            await limiter.removeTokens(1);
```

<br/>

<!-- THIS IS AN AUTOGENERATED SECTION. DO NOT EDIT THIS SECTION DIRECTLY -->
### Swimm Note

<span id="f-1TDDAS">_config</span>[^](#1TDDAS) - "packages/pods-core/src/v2/pods/export/GoogleDocsExportPodV2.ts" L62
```typescript
  private _config: RunnableGoogleDocsV2PodConfig;
```

<span id="f-Z244nas">_engine</span>[^](#Z244nas) - "packages/pods-core/src/v2/pods/export/GoogleDocsExportPodV2.ts" L63
```typescript
  private _engine: DEngineClient;
```

<span id="f-dfRIa">data</span>[^](#dfRIa) - "packages/pods-core/src/v2/pods/export/GoogleDocsExportPodV2.ts" L123
```typescript
    const data = {
```

<span id="f-Z27Kb8P">errors</span>[^](#Z27Kb8P) - "packages/pods-core/src/v2/pods/export/GoogleDocsExportPodV2.ts" L267
```typescript
    const errors: IDendronError[] = [];
```

<span id="f-1M0iBC">GoogleDocsExportPodV2</span>[^](#1M0iBC) - "packages/pods-core/src/v2/pods/export/GoogleDocsExportPodV2.ts" L60
```typescript
  implements ExportPodV2<GoogleDocsExportReturnType>
```

<span id="f-adTAv">limiter</span>[^](#adTAv) - "packages/pods-core/src/v2/pods/export/GoogleDocsExportPodV2.ts" L266
```typescript
    const { docToUpdate, accessToken, limiter } = opts;
```

<span id="f-xfSdK">out</span>[^](#xfSdK) - "packages/pods-core/src/v2/pods/export/GoogleDocsExportPodV2.ts" L268
```typescript
    const out: GoogleDocsFields[] = await Promise.all(
```

<span id="f-Z1fru4r">resp</span>[^](#Z1fru4r) - "packages/pods-core/src/v2/pods/export/GoogleDocsExportPodV2.ts" L85
```typescript
    const resp = await this.getPayloadForNotes(notes);
```

<br/>

This file was generated by Swimm. [Click here to view it in the app](https://app.swimm.io/repos/Z2l0aHViJTNBJTNBZGVuZHJvbiUzQSUzQWRlbmRyb25ocQ==/docs/z7gw9).