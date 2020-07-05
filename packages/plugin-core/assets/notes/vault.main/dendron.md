<style>
  img[src*="#center"] {
#  display: block;
#  margin: 0 auto;
  }
  img[src*="#right"] {
#float: right;
#display: block;
}
</style>

> "We are overwhelmed with information and we don't have the tools to properly index and filter through it. [The development of these tools, which] will give society access to and command over the inherited knowledge of the ages [should] be the first objective of our scientist" - Vannevar Bush, 1945

![](assets/logo-banner.png#center)

Dendron is a **hierarchal** note taking tool that **grows** as you do. 

Think of it as a **second brain** to help you make sense of all the information you care about. 

At its core, Dendron is a tool to help you **store and find notes** within **hierarchies**.  Dendron stores notes as plain [markdown](TODO) files with [frontmatter](). 

# Principles

1. Keep it simple: Dendron should be a frictionless way to store, connect, and share knowledge.
2. Keep it fast: Dendron should be the fastest way to work with information.
3. Keep it extensible: Dendron should be built with interoperability at its core. 

# Features

To read more about the ideas that inspired Dendron, you can read [this blog post](https://kevinslin.com/organizing/its_not_you_its_your_knowledge_base/).

## Core
- hierarchical search: find nodes by tree traversal
- schemas: optional type system for your notes
- modeless operation: no difference between searching for a file and creating one

## Bundled (enabled with recommended extensions)

- [live markdown preview](https://marketplace.visualstudio.com/items?itemName=shd101wyy.markdown-preview-enhanced)
- [math](https://shd101wyy.github.io/markdown-preview-enhanced/#/math) (KaTeX or MathJax)
- [sequence diagrams](https://shd101wyy.github.io/markdown-preview-enhanced/#/diagrams?id=mermaid) (mermaid)
- [pandoc support](https://shd101wyy.github.io/markdown-preview-enhanced/#/pandoc)
- [code chunks](https://shd101wyy.github.io/markdown-preview-enhanced/#/code-chunk)
- [presentations](https://rawgit.com/shd101wyy/markdown-preview-enhanced/master/docs/presentation-intro.html)
- [wiki links](https://marketplace.visualstudio.com/items?itemName=kortina.vscode-markdown-notes)
- [tags](https://marketplace.visualstudio.com/items?itemName=kortina.vscode-markdown-notes)
- [backlinks](https://marketplace.visualstudio.com/items?itemName=kortina.vscode-markdown-notes)
- [workspace/file/line history](https://marketplace.visualstudio.com/items?itemName=eamodio.gitlens#current-line-blame-)


# Legend
- 🚧 these features are still under development


# Quickstart

## Create a new workspace

Launch *Quick Open*:
  - <img src="https://www.kernel.org/theme/images/logos/favicon.png" width=16 height=16/> <a href="https://code.visualstudio.com/shortcuts/keyboard-shortcuts-linux.pdf">Linux</a> `Ctrl+P`
  - <img src="https://developer.apple.com/favicon.ico" width=16 height=16/> <a href="https://code.visualstudio.com/shortcuts/keyboard-shortcuts-macos.pdf">macOS</a> `⌘P`
  - <img src="https://www.microsoft.com/favicon.ico" width=16 height=16/> <a href="https://code.visualstudio.com/shortcuts/keyboard-shortcuts-windows.pdf">Windows</a> `Ctrl+P`

Paste the following command and press `Enter`:

```sh
> Dendron: Initialize Workspace
```

![Initialize workspace](assets/dendron-init.gif)

## Welcome

Congratulations, you have just set up your first workspace! 🎉🎉🎉

Before we continue, a little terminology. In Dendron, your **workspace** is a folder that contains all your notes. Depending on your operating system, Dendron has a different default location for the **workspace**.

Your workspace is made up of **vaults**. You can think of a vault as a git repository. By default, Dendron creates the *vault.main* folder to store all yoru notes. Dividing your notes by vaults has some of the following benefits:
- you can separate private notes that you want to keep local (`vault.secret`) from notes you want to sync
- 🚧 you can import vaults from third parties
- 🚧 you can publish and collaborate with just the notes in a specific vault

Within a vault, your notes are stored **hierarchily** as `.` delimited markdown files. This is similar to how domain names are stored. 

![](assets/2020-07-05-11-35-11.png)

TODO: make a dendron example

Your file system is hierarichal. The below is an example of how you might organize files for a project.

```
├── project1/
├── project1/designs/
├── project1/designs/promotion.png
├── project1/paperwork/
├── project1/paperwork/legal.md
├── project1/tasks/
├── project1/tasks/task1.md
└── project1/tasks/task2.md
```


In Dendron, the above hiearchy would look like the following

```
├── project1.
├── project1.designs.
├── project1.designs.promotion
├── project1.paperwork.
├── project1.paperwork.legal
├── project1.tasks.
├── project1.tasks.task1
└── project1.tasks.task2
```

## Hierarichal Search

To work with notes, Dendron uses **hierarichal search**. This is best explained by example. 

First, use `CTRl-P` to bring up the search search bar. You should see the current note (`dendron`) highlighted. 

- TODO: pciture

Dendron is the **root** of its hierarchy. We call dendron a **domain**.

You can see other notes further down the hierarchy via the dropdown. 

- TODO:dropdown image

To navigate deeper into the hiearchy, enter the following query and hit `Enter`
```
dendron.hello
```

Follow the instructions in `dendron.hello` before continuing.


## Lookup

Creating a note is as simple as looking it up - if it doesn't exist, Dendron will create it. To perform a lookup, use the `CTRL-P` shortcut or the `> Dendron: Lookup` command.

![Open or create note](assets/dendron-open-create.gif)

Notes are stored and indexed hierarchically. Hierarchies can be as deep or shallow as you need them to be. 

## Lookup

Below is a simple two level hierarchy of CLI commands.

```
- cli.tar
- cli.curl
- cli.zip
```
![Lookup Notes Simple](assets/dendron-lookup-simple.gif)

Here is a more involve hierarchy involving programming languages (don't mind the `l.` prefix, that will be explained later).

```sh
- l.python
  - l.python.d.bool
  - l.python.d.array
  - l.python.d.string
  - l.python.flow
  - l.python.package
  - l.python.io
  - l.python.modules
  - l.python.oo
```

![Lookup Notes Advanced](assets/dendron-lookup-advanced.gif)

## Schemas 
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
#- data
#- io
#- flow
#- oo
- id: data
  alias: d
  desc: data structures
  children:
#- bool
#- array
#- string
- id: io
  desc: input/output
- id: flow
  desc: control flow
```

Schemas are matched to hierarchies via the `data.pattern` attribute in the root of the schema hierarchy. The regex looks for dot delimited prefixes so a search for `^l` would match `l.python` but not `large.cats`.

> NOTE: The functionality in this section is under active development and will be released shortly. 

- TODO

With schemas, you get to see if you are missing entries

- TODO

You also get to see if you accidentally made new additions

- TODO

Note that schemas are entirely optional and usually something that you develop over time. To that end, Dendron has many capabilities to help you develop and evolve your schemas over time and the ability to automatically refactor your notes to match your schemas. 

# Install

Dendron can be installed as a [vscode plugin](TODO) or as using the [standalone Dendron app](TODO) (coming soon). 

Dendron is still early and maybe 1% of where it could be. That being said, it is actively being used by the author on a daily (hourly) basis to manage a knowledge base of over 20 thousand notes. 

The **audacious long term goal** is for Dendron to become the **best way to create, understand, and share knowledge**. Please join me in this **journey** and, together, lets **make sense** of this world that we inhabit.

# Configuration

TODO

# Changelog
- to see the latest updates, see the [changelog](https://github.com/dendronhq/dendron/blob/master/CHANGELOG.md)