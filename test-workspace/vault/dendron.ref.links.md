---
id: 73eb67ea-0291-45e7-8f2f-193fd6f00643
title: Links
desc: ""
updated: 1644356058109
created: 1608518909864
---

- This is a link to a [[not published note|bar]]

## Wiki Link

- [[dendron.ref.figure]]
- [[same note link to anchor|#unpublished-page]]
- [[diff note link to anchor|dendron.ref.figure#block]]

## Link in different vault without vault specified

Should get a quick pick prompt to choose a note to navigate to when clicking on following link in preview. Upon choosing the the note in quick Dendron opens the note. If quick pick is cancelled NO errors should be shown.

- [[dendron.ref.links.target-different-vault]]

## XVault Link

- vault1 bar: [[dendron://vault/bar]]
- vault2 bar: [[dendron://vault2/bar]]

## URL

[[https://wiki.dendron.so/#getting-started]]

## XVault Note Ref

Vault1
![[dendron://vault/bar]]

Vault2
![[dendron://vault2/bar]]

## Unpublished page

- [[bar]]

---

## Note Refs

### Basic

`![[dendron]]`

### Header

![[dendron.welcome#header1]]

### With Special Characters

![[dendron.welcome#header-special-chars]]

---

## Block References

![[dendron.ref.links.target#^123]]

## [[a header that's entirely a link|dendron.apples]]

## Targeting a single list item without its children

## testing with ordered list

1. first ^nPm286FpKzGj
   1. first-a ^0NFOQ4Hi4frn
      1. first-a-1
1. second
   1. second-a ^AKRCeAVwwIX2

![[#^0NFOQ4Hi4frn:#^0NFOQ4Hi4frn]]

## note reference error messages

### no file

![[void]]
![[dendron://vault/void]]

### wildcard no match

![[void.*]]

### ambiguous

![[bar]]

## Recursive refs

![[dendron.ref.links.recursive-lvl-1]]

## Multiple refs in a row without list delineation

### Refs on each line

![[dendron.ref.links.target-1]]
![[dendron.ref.links.target-2]]
![[dendron.ref.links.target-3]]

### Back to back refs

![[dendron.ref.links.target-1]]![[dendron.ref.links.target-2]] ![[dendron.ref.links.target-3]]

## Link to a Website

- https://dendron.so

## Link to PDF

- [Think](./assets/think.pdf)

## Confuses hashtag/usertags

[@dendronhq](https://twitter.com/dendronhq)

[#dendron](https://twitter.com/hashtag/dendron)

@user
#hash

## Broken Links

`dendron doctor findBrokenLinks` and `dendron doctor createMissingLinkedNotes` does not work if no vault prefix is specified

These can be fixed using `Dendron: Convert Link` in various ways.

[[dendron://vault/broken.link.with.vault.prefix]]
[[broken.link.without.vault.prefix]]
[[this is broken|broken.link]]
@broken.usertag
#broken.hashtag

## Inside a code block

The following link won't be highlighted since it's inside the code block, but Goto Note will still work.

```js
const x = 1;
// see more here:[[dendron.ref.links.target-1]]
```

## Link to a non-note file

[[/vault/root.schema.yml]]

And a link to line 6 in that file: [[/vault/root.schema.yml#L6]]

## Link to a file outside any vault

To a file: [[other-files/config.ts]]

To a line in that file: [[other-files/config.ts#L6]]

To block anchors: [[other-files/config.ts#^getRaw]]
[[other-files/config.ts#^backup-file]]

## Link to a file containing images

We should be able to see these images in preview and when hovering over the link.

![[dendron.ref.image]]
