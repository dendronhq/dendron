---
id: vth69
name: Creating a Command
file_version: 1.0.2
app_version: 0.9.8-3
file_blobs:
  packages/plugin-core/src/features/HelpFeedbackTreeview.ts: 6ba3bee8ad7813f49e1fad82dd473f59e0e9dbcf
  packages/plugin-core/src/commands/InstrumentedWrapperCommand.ts: 7eafca5202214b14d06d4c85506d3d7db2a11f66
  packages/plugin-core/src/commands/index.ts: bfe6d627874b22654568df6c3eabb0bf518e55eb
  packages/plugin-core/src/_extension.ts: 42017d257576d540c7d8b8f2fd142ba589ad38ca
  packages/plugin-core/src/features/codeActionProvider.ts: c8e12daa82ea42f92a985ea83f0e05168b1239b9
  packages/common-all/data/dendron-yml.validator.json: 21d0d52619fead975d31a40c3d7ed0186c4fcb59
  packages/plugin-core/src/commands/Goto.ts: 4e7a9af71c28d0f4ae71006f68442e02742adccd
  packages/plugin-core/src/commands/TaskComplete.ts: cdfc7b55da1d91a1ff43a96def39c1f45624b643
  packages/plugin-core/src/commands/base.ts: a30b3c46ccb03f6a067166c26a8f85aed061ca31
  packages/plugin-core/src/commands/NoteLookupCommand.ts: 45fe91086e269e0df97546bffd025a712ea079fe
  packages/plugin-core/src/commands/Doctor.ts: 0045e7a123e107ecd062d4f26a2cf9625ecaa59e
  packages/plugin-core/src/commands/GotoNote.ts: c8cfc899a7c69419cfdf0a89d66b5bd631cef646
  packages/plugin-core/src/commands/MoveHeader.ts: 70260f7dcd75858ee38e95aeac729e6d588ee500
---

This document describes what a Command is and how to create a new one.

A Command is {Explain what a Command is and its role in the system}

To create a new Command, we create a class that inherits from `BaseCommand`[<sup id="Z1gxuqA">↓</sup>](#f-Z1gxuqA).

Some examples of `BaseCommand`[<sup id="Z1gxuqA">↓</sup>](#f-Z1gxuqA)s are `NoteLookupCommand`[<sup id="1T3TsJ">↓</sup>](#f-1T3TsJ), `GotoNoteCommand`[<sup id="1gxJrt">↓</sup>](#f-1gxJrt), `DoctorCommand`[<sup id="Z1hLVqQ">↓</sup>](#f-Z1hLVqQ), and `MoveHeaderCommand`[<sup id="Z1LNIhC">↓</sup>](#f-Z1LNIhC).
Note: some of these examples inherit indirectly from `BaseCommand`[<sup id="Z1gxuqA">↓</sup>](#f-Z1gxuqA).

<br/>

> **NOTE: Inherit from `BasicCommand`[<sup id="Z2mPk9Q">↓</sup>](#f-Z2mPk9Q)**
>
> Most `BaseCommand`[<sup id="Z1gxuqA">↓</sup>](#f-Z1gxuqA)s inherit directly from `BasicCommand`[<sup id="Z2mPk9Q">↓</sup>](#f-Z2mPk9Q) and almost none inherit directly from `BaseCommand`[<sup id="Z1gxuqA">↓</sup>](#f-Z1gxuqA).
> In this document we demonstrate inheriting from `BasicCommand`[<sup id="Z2mPk9Q">↓</sup>](#f-Z2mPk9Q).

<br/>

## TL;DR - How to Add a `BasicCommand`[<sup id="Z2mPk9Q">↓</sup>](#f-Z2mPk9Q)

1. Create a new class inheriting from `BasicCommand`[<sup id="Z2mPk9Q">↓</sup>](#f-Z2mPk9Q)&nbsp;
   - Place the file in one of the directories under `📄 packages/plugin-core/src/commands`,
     e.g. `InstrumentedWrapperCommand`[<sup id="28loN0">↓</sup>](#f-28loN0) is defined in `📄 packages/plugin-core/src/commands/InstrumentedWrapperCommand.ts`.
2. Define `key`[<sup id="Z2rxwuB">↓</sup>](#f-Z2rxwuB).
2. Implement `execute`[<sup id="Z3LqMK">↓</sup>](#f-Z3LqMK).
3. Update `📄 packages/plugin-core/src/commands/index.ts`.
4. **Profit** 💰

<br/>

## Example Walkthrough - `InstrumentedWrapperCommand`[<sup id="28loN0">↓</sup>](#f-28loN0)
We'll follow the implementation of `InstrumentedWrapperCommand`[<sup id="28loN0">↓</sup>](#f-28loN0) for this example.

An `InstrumentedWrapperCommand`[<sup id="28loN0">↓</sup>](#f-28loN0) is {Explain what InstrumentedWrapperCommand is and how it works with the Command interface}

<br/>

### `InstrumentedWrapperCommand`[<sup id="28loN0">↓</sup>](#f-28loN0) Usage Example
For example, this is how `InstrumentedWrapperCommand`[<sup id="28loN0">↓</sup>](#f-28loN0) can be used:
<!-- NOTE-swimm-snippet: the lines below link your snippet to Swimm -->
### 📄 packages/plugin-core/src/features/HelpFeedbackTreeview.ts
```typescript
⬜ 75             assertUnreachable(element);
⬜ 76         }
⬜ 77     
🟩 78         const command = InstrumentedWrapperCommand.createVSCodeCommand({
⬜ 79           command: {
⬜ 80             title: "Help and Feedback",
⬜ 81             command: "vscode.open",
```

<br/>

## Steps to Adding a new `BasicCommand`[<sup id="Z2mPk9Q">↓</sup>](#f-Z2mPk9Q)

<br/>

### 1\. Inherit from `BasicCommand`[<sup id="Z2mPk9Q">↓</sup>](#f-Z2mPk9Q).
All `BasicCommand`[<sup id="Z2mPk9Q">↓</sup>](#f-Z2mPk9Q)s are defined under `📄 packages/plugin-core/src/commands`.

<br/>

We first need to define our class in the relevant file, and inherit from `BasicCommand`[<sup id="Z2mPk9Q">↓</sup>](#f-Z2mPk9Q):
<!-- NOTE-swimm-snippet: the lines below link your snippet to Swimm -->
### 📄 packages/plugin-core/src/commands/InstrumentedWrapperCommand.ts
```typescript
⬜ 27      * URI, such as within webviews or in TreeView items, but where we still want a
⬜ 28      * telemetry event to get reported.
⬜ 29      */
🟩 30     export class InstrumentedWrapperCommand extends BasicCommand<
⬜ 31       InstrumentedWrapperCommandArgs,
⬜ 32       void
⬜ 33     > {
```

<br/>

### 2\. Define `key`[<sup id="Z2rxwuB">↓</sup>](#f-Z2rxwuB)
`BaseCommand`[<sup id="Z1gxuqA">↓</sup>](#f-Z1gxuqA)s should define this property:
- `key`[<sup id="Z2rxwuB">↓</sup>](#f-Z2rxwuB)

<br/>


<!-- NOTE-swimm-snippet: the lines below link your snippet to Swimm -->
### 📄 packages/plugin-core/src/commands/InstrumentedWrapperCommand.ts
```typescript
⬜ 31       InstrumentedWrapperCommandArgs,
⬜ 32       void
⬜ 33     > {
🟩 34       key = DENDRON_COMMANDS.INSTRUMENTED_WRAPPER_COMMAND.key;
⬜ 35     
⬜ 36       /**
⬜ 37        * Helper method to create a vscode.Command instance that utilizes this wrapper
```

<br/>

### 3\. Implement `execute`[<sup id="Z3LqMK">↓</sup>](#f-Z3LqMK)

Here is how we do it for `InstrumentedWrapperCommand`[<sup id="28loN0">↓</sup>](#f-28loN0):

<br/>


<!-- NOTE-swimm-snippet: the lines below link your snippet to Swimm -->
### 📄 packages/plugin-core/src/commands/InstrumentedWrapperCommand.ts
```typescript
⬜ 48         };
⬜ 49       }
⬜ 50     
🟩 51       async execute(opts: InstrumentedWrapperCommandArgs): Promise<void> {
⬜ 52         const args = opts.command.arguments ?? [];
⬜ 53         await vscode.commands.executeCommand(opts.command.command, ...args);
⬜ 54     
```

<br/>

## Update `📄 packages/plugin-core/src/commands/index.ts`
Every time we add new `BasicCommand`[<sup id="Z2mPk9Q">↓</sup>](#f-Z2mPk9Q)s, we reference them in `📄 packages/plugin-core/src/commands/index.ts`.

We will still look at `InstrumentedWrapperCommand`[<sup id="28loN0">↓</sup>](#f-28loN0) as our example.

<br/>


<!-- NOTE-swimm-snippet: the lines below link your snippet to Swimm -->
### 📄 packages/plugin-core/src/commands/index.ts
```typescript
⬜ 179      ConfigureNoteTraitsCommand,
⬜ 180      CreateNoteWithUserDefinedTrait,
⬜ 181      OpenBackupCommand,
🟩 182      InstrumentedWrapperCommand,
⬜ 183      ValidateEngineCommand,
⬜ 184      MergeNoteCommand,
⬜ 185      CreateNoteCommand,
```

<br/>

## Optionally, these snippets may be helpful

<br/>

Update `📄 packages/plugin-core/src/_extension.ts`
<!-- NOTE-swimm-snippet: the lines below link your snippet to Swimm -->
### 📄 packages/plugin-core/src/_extension.ts
```typescript
⬜ 723              sentryReportingCallback(async (id: string) => {
⬜ 724                const resp = await ext.getEngine().getNoteMeta(id);
⬜ 725                const { data } = resp;
🟩 726                await new GotoNoteCommand(ext).run({
⬜ 727                  qs: data?.fname,
⬜ 728                  vault: data?.vault,
⬜ 729                });
```

<br/>

Update `📄 packages/plugin-core/src/features/codeActionProvider.ts`
<!-- NOTE-swimm-snippet: the lines below link your snippet to Swimm -->
### 📄 packages/plugin-core/src/features/codeActionProvider.ts
```typescript
⬜ 127            isPreferred: true,
⬜ 128            kind: CodeActionKind.RefactorExtract,
⬜ 129            command: {
🟩 130              command: new GotoNoteCommand(ExtensionProvider.getExtension()).key,
⬜ 131              title: "Add missing note for wikilink declaration",
⬜ 132              arguments: [{ source: ContextualUIEvents.ContextualUICodeAction }],
⬜ 133            },
```

<br/>

Update `📄 packages/common-all/data/dendron-yml.validator.json`
<!-- NOTE-swimm-snippet: the lines below link your snippet to Swimm -->
### 📄 packages/common-all/data/dendron-yml.validator.json
```json
⬜ 569          },
⬜ 570          "required": ["aliasMode", "enableMultiSelect"],
⬜ 571          "additionalProperties": false,
🟩 572          "description": "Namespace for configuring  {@link  InsertNoteLinkCommand }"
⬜ 573        },
⬜ 574        "InsertNoteLinkAliasModeEnum": {
⬜ 575          "type": "string",
```

<br/>

Update `📄 packages/plugin-core/src/commands/Goto.ts`
<!-- NOTE-swimm-snippet: the lines below link your snippet to Swimm -->
### 📄 packages/plugin-core/src/commands/Goto.ts
```typescript
⬜ 171      }
⬜ 172    
⬜ 173      private openLink(uri: string) {
🟩 174        return new OpenLinkCommand().execute({ uri });
⬜ 175      }
⬜ 176    }
⬜ 177    
```

<br/>

Update `📄 packages/plugin-core/src/commands/TaskComplete.ts`
<!-- NOTE-swimm-snippet: the lines below link your snippet to Swimm -->
### 📄 packages/plugin-core/src/commands/TaskComplete.ts
```typescript
⬜ 38             { title }
⬜ 39           ).then((pressed) => {
⬜ 40             if (pressed?.title === title) {
🟩 41               const openConfig = new ConfigureCommand(this._ext);
⬜ 42               openConfig.run();
⬜ 43             }
⬜ 44           });
```

<br/>

<!-- THIS IS AN AUTOGENERATED SECTION. DO NOT EDIT THIS SECTION DIRECTLY -->
### Swimm Note

<span id="f-Z1gxuqA">BaseCommand</span>[^](#Z1gxuqA) - "packages/plugin-core/src/commands/base.ts" L37
```typescript
export abstract class BaseCommand<
```

<span id="f-Z2mPk9Q">BasicCommand</span>[^](#Z2mPk9Q) - "packages/plugin-core/src/commands/base.ts" L166
```typescript
export abstract class BasicCommand<
```

<span id="f-Z1hLVqQ">DoctorCommand</span>[^](#Z1hLVqQ) - "packages/plugin-core/src/commands/Doctor.ts" L127
```typescript
export class DoctorCommand extends BasicCommand<CommandOpts, CommandOutput> {
```

<span id="f-Z3LqMK">execute</span>[^](#Z3LqMK) - "packages/plugin-core/src/commands/InstrumentedWrapperCommand.ts" L51
```typescript
  async execute(opts: InstrumentedWrapperCommandArgs): Promise<void> {
```

<span id="f-1gxJrt">GotoNoteCommand</span>[^](#1gxJrt) - "packages/plugin-core/src/commands/GotoNote.ts" L72
```typescript
export class GotoNoteCommand extends BasicCommand<
```

<span id="f-28loN0">InstrumentedWrapperCommand</span>[^](#28loN0) - "packages/plugin-core/src/commands/InstrumentedWrapperCommand.ts" L30
```typescript
export class InstrumentedWrapperCommand extends BasicCommand<
```

<span id="f-Z2rxwuB">key</span>[^](#Z2rxwuB) - "packages/plugin-core/src/commands/InstrumentedWrapperCommand.ts" L34
```typescript
  key = DENDRON_COMMANDS.INSTRUMENTED_WRAPPER_COMMAND.key;
```

<span id="f-Z1LNIhC">MoveHeaderCommand</span>[^](#Z1LNIhC) - "packages/plugin-core/src/commands/MoveHeader.ts" L75
```typescript
export class MoveHeaderCommand extends BasicCommand<
```

<span id="f-1T3TsJ">NoteLookupCommand</span>[^](#1T3TsJ) - "packages/plugin-core/src/commands/NoteLookupCommand.ts" L129
```typescript
export class NoteLookupCommand extends BaseCommand<
```

<br/>

This file was generated by Swimm. [Click here to view it in the app](https://app.swimm.io/repos/Z2l0aHViJTNBJTNBZGVuZHJvbiUzQSUzQWRlbmRyb25ocQ==/docs/vth69).