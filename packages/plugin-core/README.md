<style>
  img[src*="#center"] {
      display: block;
      margin: 0 auto;
  }
  img[src*="#right"] {
    float: right;
    display: block;
}
</style>

> "We are overwhelmed with information and we don't have the tools to properly index and filter through it. [The development of these tools, which] will give society access to and command over the inherited knowledge of the ages [should] be the first objective of our scientist" - Vannevar Bush, 1945

# Dendron

![](https://foundation-prod-assetspublic53c57cce-8cpvgjldwysl.s3-us-west-2.amazonaws.com/assets/logo-256.png)

Dendron is a **hierarchal** note taking tool that **grows** as you do. 

Think of it as a **second brain** to help you make sense of all the information you care about. 

At its core, Dendron is a tool to help you **store and find notes** within **hierarchies**.  Dendron stores notes as plain [markdown](TODO) files with [frontmatter](). 

Dendron is still early and maybe 1% of where it could be. That being said, it is actively being used by the author on a daily (hourly) basis to manage a knowledge base of over 20 thousand notes. 

The **audacious long term goal** is for Dendron to become the **best way to create, understand, and share knowledge**. Please join me in this **journey** and, together, lets **make sense** of this world that we inhabit.

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

# Setup 
Dendron can be installed as a [vscode plugin](TODO) or as using the [standalone Dendron app](TODO) (coming soon). 

## Plugin

To get started with Dendron, create a new **workspace** by following the instructions below. A workspace is where all your notes live. 

1. Launch *Quick Open*:
  - <img src="https://www.kernel.org/theme/images/logos/favicon.png" width=16 height=16/> <a href="https://code.visualstudio.com/shortcuts/keyboard-shortcuts-linux.pdf">Linux</a> `Ctrl+P`
  - <img src="https://developer.apple.com/favicon.ico" width=16 height=16/> <a href="https://code.visualstudio.com/shortcuts/keyboard-shortcuts-macos.pdf">macOS</a> `⌘P`
  - <img src="https://www.microsoft.com/favicon.ico" width=16 height=16/> <a href="https://code.visualstudio.com/shortcuts/keyboard-shortcuts-windows.pdf">Windows</a> `Ctrl+P`

2. Paste the following command and press `Enter`:

```sh
> Dendron: Initialize Workspace
```

![Initialize workspace](https://foundation-prod-assetspublic53c57cce-8cpvgjldwysl.s3-us-west-2.amazonaws.com/assets/dendron-init.gif)

You will find further instructions when you open the workspace. 

<!-- TODO: LINK TO QUICKSTART -->

## Dendron Editor 

COMING SOON