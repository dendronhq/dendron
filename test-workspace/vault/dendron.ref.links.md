---
id: 73eb67ea-0291-45e7-8f2f-193fd6f00643
title: Links
desc: ""
updated: 1634799440754
created: 1608518909864
---

- This is a link to a [[not published note|bar]]

## Wiki Link

- [[dendron.ref.figure]]

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

***

## Note Refs

### Basic

`![[dendron]]`

### Header

![[dendron.welcome#header1]]

### With Special Characters

![[dendron.welcome#header-special-chars]]

***

## Block References

![[dendron.ref.links.target#^123]]

## [[a header that's entirely a link|dendron.apples]]

## Targeting a single list item without its children


## testing with ordered list

1. first ^nPm286FpKzGj
   1. first-a  ^0NFOQ4Hi4frn
      1. first-a-1
1. second
   1.  second-a ^AKRCeAVwwIX2

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

### Confuses hashtag/usertags

[@dendronhq](https://twitter.com/dendronhq)

[#dendron](https://twitter.com/hashtag/dendron)


@user
#hash
