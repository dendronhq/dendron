---
id: 1Aq9iO0apYmnUORkmX87e
title: Note Create
desc: ''
updated: 1637139491037
created: 1634725641716
---

## Main test cases:
### Simple case
* Type in `delete.me.some.note`
* Press `Create new`
* Validate note is created with the given name
* Delete the note.

### With matching simple schema
```md
In Note look up Type `book.book1.characters`
    EXPECTED `book.book1.characters` schema matched shows up as top result
    THEN click on `book.book1.characters` 
        EXPECTED `book.book1.characters` note is created 
            AND it used template `templates.book.characters`

AFTER: delete `book.book1.characters`
```

### With matching inline schema
```md
Navigate to `daily` note
    1. Press cmd+shift+j (to activate create journal)
    2. Create suggested journal note
    3. Validate that created note matches the template `templates.daily`

AFTER: delete the created note.
```

### With matching expanded schema:
1. Activate look up `cmd+l`
2. Create new note `book.b1.characters.public_persona`
3. Make sure that value from [[template.person]] was added into above note.

AFTER: Delete `book.b1.characters.public_persona`

## Further test cases 
Refer to [[Main test cases|#main-test-cases]] for primary test cases to run regarding note creation. 

### With untyped template schema.
```md
1. Create a new note `untyped_template.one` 
2. Validate that value in created note matches `templates.untyped.md`

AFTER: delete `untyped_template.one` note. 
```
