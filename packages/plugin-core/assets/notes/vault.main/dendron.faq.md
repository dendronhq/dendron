# FAQ

### How do I save?
- Dendron automatically saves when you change focus (switch tabs or applications). You can also manually save using `CMD+S` or `CTRL+S` depending on your operating system

### Extra files being created
- Dendron currently creates a `root.md` file and a `root.schema.yml` file where you initialize your vault. these files will be used in the future to automatically generate an index of everything in your vault. you may safely ignore them for now

### What is the extra text that is created at the beginning of each note?
- currently, you might see the following text added to the top of your note. This is additional metadata that Dendron uses to manage your files. 

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