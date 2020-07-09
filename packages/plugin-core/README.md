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


Dendron is a **hierarchal** knowledge management tool that **grows** as you do. 

Think of it as a **second brain** to help you make sense of all the information you care about. 

Dendron does this by helping you **store and find notes** via **flexible hierarchies**. Notes are stored as plain [markdown](https://daringfireball.net/projects/markdown/syntax) files with [frontmatter](https://jekyllrb.com/docs/front-matter/). To read more about the ideas that inspired Dendron, you can read [this blog post](https://kevinslin.com/organizing/its_not_you_its_your_knowledge_base/).

# Principles

1. Simple: Dendron should be a frictionless way to store, connect, and share knowledge.
2. Fast: Dendron should be the fastest way to work with the information you care about.
3. Extensible: Dendron should have a small core but limitless functionality through easy integration into existing vscode extensions and dendron specific plugins (coming soon).

# Features

## Core
- hierarchical lookup: find, create and explore notes stored in a hierarchy
- schemas: a (optional) hierarchical type systems to help organize your notes
- vaults: grow, share, and collaborate on an ever expanding store of knowledge (coming soon)

## Additional 

These features are enabled through third party extensions that are installed alongside Dendron when you first use it. 

- [live markdown preview](https://marketplace.visualstudio.com/items?itemName=shd101wyy.markdown-preview-enhanced)
- [math](https://shd101wyy.github.io/markdown-preview-enhanced/#/math) (KaTeX or MathJax)
- [sequence diagrams](https://shd101wyy.github.io/markdown-preview-enhanced/#/diagrams?id=mermaid) (mermaid)
- [pandoc support](https://shd101wyy.github.io/markdown-preview-enhanced/#/pandoc)
- [code chunks](https://shd101wyy.github.io/markdown-preview-enhanced/#/code-chunk)
- [presentations](https://rawgit.com/shd101wyy/markdown-preview-enhanced/master/docs/presentation-intro.html)
- [wiki links](https://marketplace.visualstudio.com/items?itemName=kortina.vscode-markdown-notes)
- [tags](https://marketplace.visualstudio.com/items?itemName=kortina.vscode-markdown-notes)
- [backlinks](https://marketplace.visualstudio.com/items?itemName=kortina.vscode-markdown-notes)

# Setup 
Dendron can be installed as a [vscode plugin](https://marketplace.visualstudio.com/items?itemName=dendron.dendron). If you don't already have vscode, you can download it [here](https://code.visualstudio.com/).

After you have downloaded the plugin, following the instructions to create your first **workspace**. 

1. Launch the *command bar*:
  - <img src="https://www.kernel.org/theme/images/logos/favicon.png" width=16 height=16/> <a href="https://code.visualstudio.com/shortcuts/keyboard-shortcuts-linux.pdf">Linux</a> `Ctrl+SHIFT+P`
  - <img src="https://developer.apple.com/favicon.ico" width=16 height=16/> <a href="https://code.visualstudio.com/shortcuts/keyboard-shortcuts-macos.pdf">macOS</a> `CMD+SHIFT+P`
  - <img src="https://www.microsoft.com/favicon.ico" width=16 height=16/> <a href="https://code.visualstudio.com/shortcuts/keyboard-shortcuts-windows.pdf">Windows</a> `Ctrl+SHIFT+P`

2. Paste the following command and press `Enter`:

```sh
> Dendron: Initialize Workspace
```

![Initialize workspace](https://foundation-prod-assetspublic53c57cce-8cpvgjldwysl.s3-us-west-2.amazonaws.com/assets/dendron-init.gif)

When the workspace opens, it will show a dialogue to install the recommended extensions. Though not required, these extensions add all the **non-core** features of Dendron like wiki links and tagging support.

<!-- TODO: LINK TO QUICKSTART -->