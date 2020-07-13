# Dendron

![](https://foundation-prod-assetspublic53c57cce-8cpvgjldwysl.s3-us-west-2.amazonaws.com/assets/logo-256.png)


A personal knowledge management tool that **grows** as you do.

Dendron is a local-first, markdown based, hierarchical note-taking application built on top of [VSCode](https://code.visualstudio.com/) and [friends](./ACKNOWLEDGEMENTS.md).

Think of it as a [second brain](https://www.buildingasecondbrain.com/) to help you **make sense** of all the information you care about. 

# Motivation 

> "We are overwhelmed with information and we don't have the tools to properly index and filter through it. [The development of these tools, which] will give society access to and command over the inherited knowledge of the ages [should] be the first objective of our scientist" - Vannevar Bush, 1945

Every knowledge management tool today suffers from the problem of **information overload** - the more information you put in, the harder it becomes, **as a human**, to get any of it back out again.

The burning need for a tool that would not only overcome this problem but actually work better in the presence of more information was the basis of this project.

# (Hiearichal) Solution

## Hierarchies 

Dendron proposes **hierarchies** as the **human solution** to information overload. This is because there are few things as effective as a multi-level hiearchy for quickly filtering an overwhelming amount of information to something humans can work with. You can read [this blog post](https://kevinslin.com/organizing/its_not_you_its_your_knowledge_base/) for the extended rationale behind this.

In Dendron, you can quickly **lookup** related notes by their hierarchy. Hierarchies are simply `.` delimited filenames, similar to the hierarchies made by domain names (eg. `github.com`). 

The following are a few notes that have this hierarchical naming format. 

```
- cli.tar.md
- cli.tar.env.md
- cli.curl.md
- cli.dig.md
```

## Lookup

**Lookup** is the process of finding a note by traversing its hierarchy. 

![](https://foundation-prod-assetspublic53c57cce-8cpvgjldwysl.s3-us-west-2.amazonaws.com/assets/images/lookup-cli.gif)
> Lookups are **quick**


What's nice about using the `.` delimited format is that a note **can be** both **a file** (something that contains data) and **a folder** (something that contains other files) **at the same time**. 

![](https://foundation-prod-assetspublic53c57cce-8cpvgjldwysl.s3-us-west-2.amazonaws.com/assets/images/lookup-folder_and_file.gif)
> You **can** be a file and have your folder **too**

Dendron uses fuzzy matching on paths so you don't have to type out the whole path. 

![](https://foundation-prod-assetspublic53c57cce-8cpvgjldwysl.s3-us-west-2.amazonaws.com/assets/images/lookup-fuzzy.gif)
> Lazyness is the key to success


You can use **lookup** to figure out what is true!

![](https://foundation-prod-assetspublic53c57cce-8cpvgjldwysl.s3-us-west-2.amazonaws.com/assets/images/lookup-bool.gif)

## Schemas

If you're paying close attention, you might have noticed some icons popup during lookup.

![](https://foundation-prod-assetspublic53c57cce-8cpvgjldwysl.s3-us-west-2.amazonaws.com/assets/images/schema-closeup.jpg)

These icons indicate the **schema** associated with the note. Think of schemas as an **optional type system** for your information. They describe the hierarchy of your notes and are themselves, represented as a hierarchy. 

You can create a schema by adding a YAML file with the following naming scheme `{name}.schema.yml` to your workspace. 

Below is an example of a three-level hierarchy describing cli commands. You don't need to concern yourself with the details of the schema syntax just yet, just know that this schema will match the following [glob patterns](https://facelessuser.github.io/wcmatch/glob/): `cli.*`, `cli.*.cmd`, `cli.*.cmd.*`, `cli.*.env`

```yml
- id: cli
  desc: command line interface reference
  parent: root
  data: 
    namespace: true
  children:
    - cmd
    - env
- id: env
  desc: variables relevant for command
- id: cmd
  desc: subcommands 
  data: 
    namespace: true
```

Schemas help you organize your notes by letting you know what comes next.

![](https://foundation-prod-assetspublic53c57cce-8cpvgjldwysl.s3-us-west-2.amazonaws.com/assets/images/schema-suggest.gif)

The `+` sign next to the suggestion indicates that the note does not exist but is part of the schema.

![](https://foundation-prod-assetspublic53c57cce-8cpvgjldwysl.s3-us-west-2.amazonaws.com/assets/images/schema-plus.jpg)

**Schema suggestions**  don't show you an endless lineup of tags or folders - they only show you suggestions scoped to your specific level of the hierarchy that you are looking at.

The nice thing about these suggestions is that you can also ignore them.

![](https://foundation-prod-assetspublic53c57cce-8cpvgjldwysl.s3-us-west-2.amazonaws.com/assets/images/schema-ignore.gif)

> Sometimes ~~rules~~ schemas are meant to be broken

Dendron will show you a `?` next to the result in future results but otherwise will assume that you know best. 

![](https://foundation-prod-assetspublic53c57cce-8cpvgjldwysl.s3-us-west-2.amazonaws.com/assets/images/schema-question.jpg)

## VS Code

Dendron is built on top of VSCode, the open-source IDE from Microsoft. 

![](https://foundation-prod-assetspublic53c57cce-8cpvgjldwysl.s3-us-west-2.amazonaws.com/assets/images/code-banner.jpg)

Dendron runs as a plugin inside VSCode. If you use VSCode today, it means that all your current knowledge, settings and extensions will carry over into Dendron. If you don't, no sweat, because Dendron will create an optimal workspace with recommended settings and extensions when you first launch it. 

## Recommended Extensions

Since Dendron runs on top of VSCode, it means that you also have access to thousands of extensions to customize Dendron exactly how you like it. 

By default, Dendron will initialize your first workspace with the following extensions and features.

- [Markdown Notes](https://marketplace.visualstudio.com/items?itemName=kortina.vscode-markdown-notes)
    - [wiki links](https://marketplace.visualstudio.com/items?itemName=kortina.vscode-markdown-notes)
    - [tags](https://marketplace.visualstudio.com/items?itemName=kortina.vscode-markdown-notes)
    - [backlinks](https://marketplace.visualstudio.com/items?itemName=kortina.vscode-markdown-notes) (think Roam)
- [Markdown Shortcuts](https://marketplace.visualstudio.com/items?itemName=mdickin.markdown-shortcuts)
    - Quickly toggle bullet points
    - Easily generate URLs
    - Convert tabular data to tables
- [Markdown Preview Enhanced](https://marketplace.visualstudio.com/items?itemName=shd101wyy.markdown-preview-enhanced) 
    - [live markdown preview](https://marketplace.visualstudio.com/items?itemName=shd101wyy.markdown-preview-enhanced)
    - [math](https://shd101wyy.github.io/markdown-preview-enhanced/#/math) (KaTeX or MathJax)
    - [sequence diagrams](https://shd101wyy.github.io/markdown-preview-enhanced/#/diagrams?id=mermaid) (mermaid)
    - [pandoc support](https://shd101wyy.github.io/markdown-preview-enhanced/#/pandoc)
    - [code chunks](https://shd101wyy.github.io/markdown-preview-enhanced/#/code-chunk)
    - [presentations](https://rawgit.com/shd101wyy/markdown-preview-enhanced/master/docs/presentation-intro.html)
- [Material Theme](https://marketplace.visualstudio.com/items?itemName=equinusocio.vsc-material-theme) 
  - beautiful colors built using the [Material design system](https://material.io/) 
- [Paste Image](https://marketplace.visualstudio.com/items?itemName=mushan.vscode-paste-image)
  - easily add images from your clipboard to your markdown files
- [Spell Right](https://marketplace.visualstudio.com/items?itemName=ban.spellright)
    - Spell Check

## Additional Features

The following extensions also work well with Dendron but are not bundled by default. You can download them separately to unlock additional functionality.

- [Gitlens](https://marketplace.visualstudio.com/items?itemName=eamodio.gitlens) 🔍
    - Repository/File/Line history and annotations of all your files
- [Vim](https://marketplace.visualstudio.com/items?itemName=vscodevim.vim)
    - VIM key bindings 😍
- [Bookmarks](https://marketplace.visualstudio.com/items?itemName=alefragnani.Bookmarks)
    - Bookmark lines within files

# Et cetera

Hopefully, this has been enough to give you a sense of what you can do with Dendron. This project is about 1% complete, both in the sense that it is in **preview** but also that there's so much more to build. The north star of this project is to achieve *Vannevar Bush's* original vision - to build a tool of thought that can give humanity *"**access to** and **command over** the inherited **knowledge of the ages**"*. 

If you are reading this, you too, are now part of the journey. Let's take back control of our information and use it to build something better, together!

# Getting Started

Dendron can be installed as a [vscode plugin](https://marketplace.visualstudio.com/items?itemName=dendron.dendron). If you don't already have VSCode, you can download it [here](https://code.visualstudio.com/).

After you have downloaded the plugin, following the instructions to create your first **workspace**. 

1. Launch the *command bar*:
  - <a href="https://code.visualstudio.com/shortcuts/keyboard-shortcuts-linux.pdf">Linux</a> `Ctrl+SHIFT+P`
  - <a href="https://code.visualstudio.com/shortcuts/keyboard-shortcuts-macos.pdf">macOS</a> `CMD+SHIFT+P`
  - <a href="https://code.visualstudio.com/shortcuts/keyboard-shortcuts-windows.pdf">Windows</a> `Ctrl+SHIFT+P`

2. Paste the following command and press `Enter`:

```sh
> Dendron: Initialize Workspace
```

![Initialize workspace](https://foundation-prod-assetspublic53c57cce-8cpvgjldwysl.s3-us-west-2.amazonaws.com/assets/dendron-init.gif)

When the workspace opens, it will show dialogue to install the recommended extensions. Though not required, these extensions add all the **non-core** features of Dendron like wiki links and tagging support.


# Contributing

We welcome community contributions and pull requests. See [[CONTRIBUTING]] for information on how to set up a development environment and submit code.

# License

Dendron is distributed under the GNU AFFERO GENERAL PUBLIC LICENSE Version 3.

See [[LICENSE]] and [[NOTICE]] for more information.