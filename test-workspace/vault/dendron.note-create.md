---
id: 1Aq9iO0apYmnUORkmX87e
title: Note Create
desc: ''
updated: 1634726107138
created: 1634725641716
---

## Simple case
* Type in `delete.me.some.note`
* Press `Create new`
* Validate note is created with the given name
* Delete the note.

## With matching simple schema
```md
In Note look up Type `book.book1.characters`
    EXPECTED `book.book1.characters` schema matched shows up as top result
    THEN click on `book.book1.characters` 
        EXPECTED `book.book1.characters` note is created 
            AND it used template `templates.book.characters`
```
AFTER: delete `book.book1.characters`

## With matching inline schema
```md
Navigate to `daily` note
    1. Press cmd+shift+j (to activate create journal)
    2. Create suggested journal note
    3. Validate that created note matches the template `templates.daily`
```
AFTER: delete the created note.