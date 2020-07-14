# FAQ

### Can I use Dendron with existing notes?

You can use Dendron with existing repositories of markdown notes. 

Open the `Command Bar` in vscode and use the `Dendron: Change Workspace` command. It will ask you for a folder path as input.

Dendron will create a `dendron.code-workspace` file in specified directory and then open the workspace (if a workspace file already exists, it will use that). It will also create a `root.md` file in that directory if it doesn't exist (currently this is part of the internal working of dendron). 

Dendron **does not** delete or overwrite any files during the **Change Workspace** operation. 

### How do I save?

Dendron automatically saves when you change focus (switch tabs or applications). You can also manually save using `CMD+S` or `CTRL+S` depending on your operating system

### Extra files being created

Dendron currently creates a `root.md` file and a `root.schema.yml` file where you initialize your vault. these files will be used in the future to automatically generate an index of everything in your vault. you may safely ignore them for now

### What is the extra text that is created at the beginning of each note?

Currently, you might see the following text added to the top of new notes. This is additional metadata that Dendron uses to manage your files and can be ignored. 

```yml
---
id: 4407f75d-7334-47a5-9f19-18b458618136
title: dendron.lookup.hello
desc: ''
updated: 1594078624566
created: 1594078624566
data: {}
custom: {}
fname: dendron.lookup.hello
parent: null
children: []
---
```

### Why are there two `book` icons that do markdown preview?

We use an extension to do markdown preview. VSCode comes with its default markdown preview extension and its not currently possible to hide the button. You can re-open and upvote the issue [here](https://github.com/microsoft/vscode/issues/86994) if you want to fix this.
