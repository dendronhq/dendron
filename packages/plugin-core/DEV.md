# Cook

### Add a new command

- see [this commit](https://github.com/dendronhq/dendron/commit/71d8433fbd10651ec7fcd13a5f7ee41199a43632) for reference

- [ ] add cmd as constant to `src/constants.ts`
- [ ] add cmd to `package.json`
- [ ] add cmd implementation to `src/workspace.ts`

# QA

### General

- after making your changes, make sure to run `./scripts/testAll.sh` from the mono-repo root

### Workspace

When changing workspace behavior, use this template to test for changes. These tests will eventually be automated.

- workspace actions
  - [ ] initialize workspace
    - [ ] files copied over
  - [ ] change workspace
    - [ ] if no ws file, ws file is created
    - [ ] if ws file, use it
    - [ ] no files are modified
  - [ ] reload workspace
- workspace state
  - [ ] 1st time install
    - [ ] see welcome msg
  - [ ] 1st workspace
    - [ ] see welcome msg
  - [ ] upgrade version
    - [ ] new config is updated
    - [ ] existing config left alone
    - [ ] no notes affected

const defaultNameConfig = "Y-MM-DD-HHmmss"
const noteName = moment().format(defaultNameConfig)
const filename = NoteWorkspace.noteFileNameFromTitle(noteName);
const scratchPath = join(workspaceUri, scratchFolder);
const filepath = join(workspaceUri, scratchFolder, filename);
if (!fs.existsSync(scratchPath)) {
fs.mkdirSync(scratchPath)
}

const fileAlreadyExists = existsSync(filepath);
// create the file if it does not exists
if (!fileAlreadyExists) {
const contents = `# ${noteName}\n\n`;
writeFileSync(filepath, contents);
}
