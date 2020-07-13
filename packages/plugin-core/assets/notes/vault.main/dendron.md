# Welcome to Dendron

![](https://foundation-prod-assetspublic53c57cce-8cpvgjldwysl.s3-us-west-2.amazonaws.com/assets/logo-256.png)

If you haven't already, you can get a general sense of what dendron is with this video.

- TODO


## Dendron Concepts

Below are some concepts that make up the core of Dendron. Note that features with 🚧 are still under active development and might not be fully implemented.

### Workspace
In Dendron, your **workspace** is the root of where all your files are located. It's definde by the `dendron.rootDir` property and created when you first run `Dendron: Initialize Workspace`

### Vaults 🚧
Your workspace is made up of **vaults**. You can think of a vault like  a git repository. By default, Dendron creates a *vault.main* folder when you first initialize a **workspace**. All your notes are stored on a per vault basis.

```
.
└── workspace
    ├── vault.main
    │   ├── foo.md
    │   ├── foo.one.md
    │   └── foo.two.md
    └── vault.secret (hypothetical)
        ├── secret.one.md
        └── secret.two.md
```

By default, when you look for notes in dendron, it will search over all vaults.

### Hierarchies

Within a vault, your notes are stored **hierarchically** as `.` delimited markdown files. This is similar to a file tree (see picture below).

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

The advantage of representing hierarchies in this format is that unlike a folder, a dendron note can represent both a `File` (something that **has data**) and a `Folder` (something that **contains other files**) **simultaneously**. 

### Schema 🚧 

As you end up creating more notes, it can be hard to keep track of it all. This is why Dendron has **schemas** to help you manage your notes at scale. Think of schemas as an **optional type system** for your notes. They describe the hierarchy of your data and are themselves, represented as a hierarchy. 

### Command Bar

The command bar is native to `vscode`. You can use it to run dendron commands, which will all be prefixed with `Dendron:`. You can use the following shortcut to open the command bar. 

- <img src="https://www.kernel.org/theme/images/logos/favicon.png" width=16 height=16/> <a href="https://code.visualstudio.com/shortcuts/keyboard-shortcuts-linux.pdf">Linux</a> `Ctrl+SHIFT+P`
- <img src="https://developer.apple.com/favicon.ico" width=16 height=16/> <a href="https://code.visualstudio.com/shortcuts/keyboard-shortcuts-macos.pdf">macOS</a> `⌘+SHIFT+P`
- <img src="https://www.microsoft.com/favicon.ico" width=16 height=16/> <a href="https://code.visualstudio.com/shortcuts/keyboard-shortcuts-windows.pdf">Windows</a> `Ctrl+SHIFT+P`


### Lookup Bar

The lookup bar is how you interact with notes inside of Dendron. Use it to create, find, and delete notes. You can type `> Dendron: Lookup` in the `Command Bar` or use the `CTRL+L` shortcut. 

- <img src="https://www.kernel.org/theme/images/logos/favicon.png" width=16 height=16/> <a href="https://code.visualstudio.com/shortcuts/keyboard-shortcuts-linux.pdf">Linux</a> `CTRL+L`
- <img src="https://developer.apple.com/favicon.ico" width=16 height=16/> <a href="https://code.visualstudio.com/shortcuts/keyboard-shortcuts-macos.pdf">macOS</a> `CMD+L`
- <img src="https://www.microsoft.com/favicon.ico" width=16 height=16/> <a href="https://code.visualstudio.com/shortcuts/keyboard-shortcuts-windows.pdf">Windows</a> `CTRL+L`

![](assets/2020-07-07-20-14-57.png)

## Next

Now that we've covered the major concepts inside Dendron, go to [[dendron.lookup]] to continue the tutorial. You can navigate there by either clicking the link in the `preview pane` or putting your cursor over `[[dendron.lookup]]` and using the `Go To Definition` command.


