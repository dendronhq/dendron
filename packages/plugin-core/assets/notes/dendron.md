---
id: ef43aff2-d8ba-4551-b311-d85cc171f0e4
---

<style>
  img[src*="#center"] {
      display: block;
      margin: 0 auto;
  }
  img[src*="#right"] {
    float: right;
}
</style>

![](assets/2020-06-30-21-30-51.png#right)

# Dendron

Dendron is a **hierarchal** note taking tool that **grows** as you do. 

Think of it as a **second brain** to help you make sense of all the information you care about. 

It's like **Redis for you brain**. An **IDE for your notes**. **Photoshop for your thoughts**. 

At its core, Dendron is a tool to help you **store and find notes** within **hierarchies**.  Dendron stores notes as plain [markdown](TODO) files with [frontmatter](). 

# Quickstart
Creating a note is as simple as looking it up - if it doesn't exist, Dendron will create it. 

![ ]()

Notes are stored and indexed hierarchically. Hierarchies can be as deep or shallow as you need them to be. 

Below is a simple two level hierarchy of CLI commands.

```
- cli.tar
- cli.curl
- cli.zip
```
![ ]()

Here is a more involve hierarchy involving programming languages (don't mind the `l.` prefix, that will be explained later).

```sh
- l.python
  - l.python.d.bool
  - l.python.d.array
  - l.python.d.string
  - l.python.flow
  - l.python.io
  - l.python.modules
  - l.python.oo
- l.node
  - ...
```

![ ]()

As you end up creating more notes, it can be hard to keep track of it all. This is why Dendron has **schemas** to help you manage your notes at scale. Think of schemas as an **optional type system** for your notes. They describe the hierarchy of your data and are themselves, represented as a hierarchy.

Below is the schema for the cli hierarchy.

```yml
  # an id identifies a particular node in the schema
- id: cli 
  # human readable description of hierarchy
  desc: reference to cli programs
  # the root of the hiearchy has a parent of root
  parent: root
  # regex that is used to match nodes of the schema
  data.pattern: "^l"
  # when a schema is a namespace, it can have arbitrary children
  namespace: true
```

Here is schema for the programming language hierarchy

```yml
- id: programming_language
  # an alias is the shorthand representation of a hiearchy
  alias: l
  parent: root
  namespace: true
  data.pattern: "^l"
  children:
    - data
    - io
    - flow
    - oo
- id: data
  alias: d
  desc: data structures
  children:
    - bool
    - array
    - string
- id: io
  desc: input/output
- id: flow
  desc: control flow
```

Schemas are matched to hierarchies via the `data.pattern` attribute in the root of the schema hierarchy. The regex looks for dot delimited prefixes so a search for `^l` would match `l.python` but not `large.cats`


![TODO]()

With schemas, you get to see if you are missing entries

![TODO]()

You also get to see if you accidentally made new additions

![TODO]()

Note that schemas are entirely optional and usually something that you develop over time. To that end, Dendron has many capabilities to help you develop and evolve your schemas over time and the ability to automatically refactor your notes to match your schemas. 

Dendron can be installed as a [vscode plugin](TODO) or as using the [standalone Dendron app](TODO) (coming soon). 

Dendron is still early and maybe 1% of where it could be. That being said, it is actively being used by the author on a daily (hourly) basis to manage a knowledge base of over 20 thousand notes. 

The **audacious long term goal** is for Dendron to become the **best way to create, understand, and share knowledge**. Please join me in this **journey** and, together, lets **make sense** of this world that we inhabit.

# Features
- core
  - hierarchical search: find nodes by tree traversal
  - schemas: optional type system for your notes
  - modeless operation: no difference between searching for a file and creating one
- bundled (enabled with bundled extensions)
  - [live markdown preview](https://marketplace.visualstudio.com/items?itemName=yzhang.markdown-all-in-one)
  - [github flavored markdown](https://marketplace.visualstudio.com/items?itemName=yzhang.markdown-all-in-one#github-flavored-markdown)
  - [math](https://marketplace.visualstudio.com/items?itemName=yzhang.markdown-all-in-one#math)
  - [keyboard shortcuts](https://marketplace.visualstudio.com/items?itemName=yzhang.markdown-all-in-one#keyboard-shortcuts)
  - [table of contents](https://marketplace.visualstudio.com/items?itemName=yzhang.markdown-all-in-one#table-of-contents)
  - [wiki links](https://marketplace.visualstudio.com/items?itemName=kortina.vscode-markdown-notes)
  - [tags](https://marketplace.visualstudio.com/items?itemName=kortina.vscode-markdown-notes)
  - [backlinks](https://marketplace.visualstudio.com/items?itemName=kortina.vscode-markdown-notes)
  - [workspace/file/line history](https://marketplace.visualstudio.com/items?itemName=eamodio.gitlens#current-line-blame-)


