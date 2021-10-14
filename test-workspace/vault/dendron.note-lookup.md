---
id: bNkYI2WWK6Jhm2eeVwqrh
title: Note Lookup
desc: ''
updated: 1633502654936
created: 1633501913732
---

## Note look up existing notes
Note look up `cmd+l` the following existing notes:

### Look up note
* exact match: `dendron.welcome`
* by tokens (space is works as AND): `dendron welcome`
* by tokens (| is OR): `bar | foo`

### Look up with wiki links
* [[with description with header with vault|dendron://vault/dendron.welcome#header1]]
* [[with description with header|dendron.welcome#header1]]
* [[with description|dendron.welcome]]
* [[dendron.welcome]]

## Create notes
### With matching schema
```md
In Note look up Type ``
    EXPECTED `book.book1.characters` shows up as result
    THEN click on `book.book1.characters` 
        EXPECTED `book.book1.characters` note is created 
            AND it used template `templates.book.characters`
```
AFTER: delete `book.book1.characters`

