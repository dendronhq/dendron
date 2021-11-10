---
id: WhVbhkBCANk5K2M6PPMVz
title: Create Schema from Hierarchy
desc: ''
updated: 1636390303597
created: 1636388496504
---

## Test happy case:
1. Navigate to [[languages.python.data.integer]]
2. Activate `Dendron: Create Schema From Note Hierarchy` command.
   (if there is an error saying languages already exists someone probably forgot to delete languages.schema.yml after running this test.)
3. Select `languages.*.data.integer` hierarchy level.
4. Play around with selection of patterns:
4a. Unselect `languages.*.machine-learning`, make sure that all descendents of `languages.*.machine-learning` are automatically unselected.
4b. Select `languages.*.machine-learning.pandas`, make sure that `languages.*.machine-learning` is automatically selected again. 
4c. Make sure that the following are selected and press Enter.
* languages.*.data.integer
* languages.*.data.bool
* languages.*.data.string
5. Accept the default `languages` schema name press enter.
6. Now you should be taken to `languages.schema.yml` file with the following content.

```
version: 1
imports: []
schemas:
  - id: languages
    title: languages
    parent: root
    children:
      - pattern: '*'
        children:
          - pattern: data
            children:
              - pattern: bool
              - pattern: integer
              - pattern: string

```

AFTER: Delete languages.schema.yml

