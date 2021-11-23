---
id: NnglQKPmmVU766HgYcfAi
title: Schema
desc: ''
updated: 1637139370218
created: 1635325317566
---

## Create new schema
```md
1. Run `cmd+shift+l` 
2. Enter `dvd` (which should not exist)
3. Create the following schema within dvd.schema.yml:
`
version: 1
imports: []
schemas:
  - id: dvd
    children: 
      - pattern: h1
    title: dvd
    parent: root
`
4. Look up note (`cmd+l`) `dvd.` 
EXPECTED: should see a schema completion `dvd.h1`.

AFTER: delete schema file `dvd.schema.yml`
```

## Tests related to templates being picked up:
![[dendron.note-create#with-matching-simple-schema,1:#*]]
![[dendron.note-create#with-matching-inline-schema,1]]
