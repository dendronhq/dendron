---
id: bNkYI2WWK6Jhm2eeVwqrh
title: Note Lookup
desc: ''
updated: 1634725877431
created: 1633501913732
---

## Note look up existing notes
Note look up `cmd+l`:

### Look up note
* exact match: `dendron.welcome`
* by tokens (space works as AND): `dendron welcome`
* by tokens (| is OR): `bar | foo`

### Hierarchy with omitted path match
* `dendron.multi` should match among others:
    * `dendron.ref.frontmatter-tags.multi-array`
    
### Direct child look up:
1. Turn on direct child look up 
![](assets/images/Screen_Shot_2021-10-14_at_9.05.21_PM.png)

2. Look up `dendron.blog.` Make sure only its children are shown. 

### Go Down command
1. Navigate to `dendron.blog` 
2. Activate `Go Down` command
3. Make sure only the children of `dendron.blog` are shown.

### Just activated lookup
1. Navigate to `dendron.blog.one`
1. Activate `Note lookup`
1. Make sure to be able to see siblings of `dendron.blog.one` such as ``dendron.blog.two`.

### Look up with wiki links
* [[with description with header with vault|dendron://vault/dendron.welcome#header1]]
* [[with description with header|dendron.welcome#header1]]
* [[with description|dendron.welcome]]
* [[dendron.welcome]]

## Create notes look up related
![[dendron.note-create#simple-case,1:#*]]

![[dendron.note-create#with-matching-simple-schema,1]]

