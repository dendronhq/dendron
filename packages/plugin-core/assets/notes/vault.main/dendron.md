# Welcome to Dendron

![](assets/logo-256.png#center)

Dendron is a **hierarchal** knowledge management tool that **grows** as you do. 

Think of it as a **second brain** to help you make sense of all the information you care about. 

Dendron does this by helping you **store and find notes** via **flexible hierarchies**. Notes are stored as plain [markdown](https://daringfireball.net/projects/markdown/syntax) files with [frontmatter](https://jekyllrb.com/docs/front-matter/). To read more about the ideas that inspired Dendron, you can read [this blog post](https://kevinslin.com/organizing/its_not_you_its_your_knowledge_base/).

## Dendron Concepts

### Legend

- 🚧 these features are still under development

### Workspace
In Dendron, your **workspace** is a folder that contains all your notes. 

### Vaults 🚧
Your workspace is made up of **vaults**. You can think of a vault like you would a git repository. By default, Dendron creates a *vault.main* folder when you first initialize a **workspace**. Dividing your notes by vaults has some of the following benefits:
- you can separate private notes that you want to keep local (`vault.secret`) from notes you want to sync
- you can import vaults from third parties
- you can publish and collaborate with just the notes in a specific vault

### Hierarchies

Within a vault, your notes are stored **hierarchically** as `.` delimited markdown files. 

Below is an example of a hierarchal organization scheme within a file system. 

```
.
└── project1/
    ├── project1/designs/
    │   └── project1/designs/promotion.png
    ├── project1/paperwork/
    │   └── project1/paperwork/legal.md
    └── project1/tasks/
        ├── project1/tasks/task1.md
        └── project1/tasks/task2.md
```


In Dendron, the above hierarchy would look like the following

```
.
├── project1.md
├── project1.designs.md
├── project1.designs.promotion.md
├── project1.paperwork.md
├── project1.paperwork.legal.md
├── project1.tasks.md
├── project1.tasks.task1.md
└── project1.tasks.task2.md
```

### Schema 🚧 

As you end up creating more notes, it can be hard to keep track of it all. This is why Dendron has **schemas** to help you manage your notes at scale. Think of schemas as an **optional type system** for your notes. They describe the hierarchy of your data and are themselves, represented as a hierarchy. 

### Command Bar

The command bar is native to `vscode`. You can use it to run dendron commands, which will all be prefixed with `Dendron:`. You can use the following shortcut to open the command bar. 

- <img src="https://www.kernel.org/theme/images/logos/favicon.png" width=16 height=16/> <a href="https://code.visualstudio.com/shortcuts/keyboard-shortcuts-linux.pdf">Linux</a> `Ctrl+SHIFT+P`
- <img src="https://developer.apple.com/favicon.ico" width=16 height=16/> <a href="https://code.visualstudio.com/shortcuts/keyboard-shortcuts-macos.pdf">macOS</a> `⌘+SHIFT+P`
- <img src="https://www.microsoft.com/favicon.ico" width=16 height=16/> <a href="https://code.visualstudio.com/shortcuts/keyboard-shortcuts-windows.pdf">Windows</a> `Ctrl+SHIFT+P`


### Lookup Bar

The lookup bar is how you interact with notes inside of Dendron. Use it to create, find, and delete notes. You can type `> Dendron: Lookup` in the `Command Bar` or use the following shortcut to open the lookup bar.

- <img src="https://www.kernel.org/theme/images/logos/favicon.png" width=16 height=16/> <a href="https://code.visualstudio.com/shortcuts/keyboard-shortcuts-linux.pdf">Linux</a> `META+P`
- <img src="https://developer.apple.com/favicon.ico" width=16 height=16/> <a href="https://code.visualstudio.com/shortcuts/keyboard-shortcuts-macos.pdf">macOS</a> `CTRL+P`
- <img src="https://www.microsoft.com/favicon.ico" width=16 height=16/> <a href="https://code.visualstudio.com/shortcuts/keyboard-shortcuts-windows.pdf">Windows</a> `WIN+P`

![](assets/2020-07-07-20-14-57.png)

## Next

Now that we've covered the major concepts inside Dendron, go to [[dendron.lookup]] to continue the tutorial. You can navigate there by either clicking the link or bringing up the lookup bar using `CTRL-P`, typing `dendron.lookup`, and the hitting `Enter`

![](./assets/dendron-lookup.gif)

