---
id: buo9daDN3yseexaRQENtf
title: Rename Provider
desc: ''
updated: 1639395825475
created: 1639395535702
tags: test1
---

Rename Provider (F2) lets you rename a symbol.
Rename provider support renaming symbols that are the following:
    - wikilink
    - note reference
    - hashtag
    - user tag
    - frontmatter tag

Try pressing F2 while the cursor is over one of the above.
Rename input box will remove the fluff around references (alias, anchors, vault prefixes) and only suggest a placeholder with the hierarchy name.

#test1
@customer.Foo
[[dendron.apples]]
[[links|dendron.links.heading-anchors#links]]
[[links|dendron://vault/dendron.links.heading-anchors#links]]
![[dendron.cat]]
