# QA

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
