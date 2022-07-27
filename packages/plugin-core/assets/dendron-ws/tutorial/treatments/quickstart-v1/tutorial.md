---
id: c1bs7wsjfbhb0zipaywqv1
title: Tutorial
desc: ""
updated: 1658931733078
created: 1654223767390
currentStep: 0
totalSteps: 0
---

Welcome to Dendron! Dendron is a developer-focused knowledge base that helps you manage information using **flexible hierarchies**!

You are currently in the tutorial vault (a vault is the folder where your notes are stored). Feel free to edit this note and create new files as you go through the quickstart!

## Create a Note

1. Use `Ctrl+L` / `Cmd+L` to bring up the lookup prompt
1. Type `dendron` and select `Create New`

- > NOTE: After you press enter, Dendron will create and open the `dendron` note. Use `<CTRL>-<TAB>` to come back to this note

You just created your first note!

- > NOTE: Notes in Dendron are just plain text markdown with some [frontmatter](https://wiki.dendron.so/notes/ffec2853-c0e0-4165-a368-339db12c8e4b) on the top. You can edit them in Dendron or using ~~vim~~ your favourite text editor.

## Find a Note

1. Use `Ctrl+L` / `Cmd+L` to bring up the lookup prompt again
1. Type `dendron` and press `<ENTER>`

- > TIP: you don't have to type out the entire query, press `<TAB>` to autocomplete

You just `looked up` a note!

- > NOTE: in Dendron, you can find or create notes using the lookup prompt

## Organize your Notes

1. Bring up the lookup prompt again
1. Type `tutorial.one`

You just created your first hierarchy!

- > NOTE: hierarchies in Dendron are just `.` delimited files. This makes each note both a file and a folder and makes it easy to keep your notes organized

- > TIP: You can use the [Dendron Tree View](https://wiki.dendron.so/notes/hur7r6gr3kqa56s2vme986j) to view your hierarchy. If it's not currently in focus, you can use `CTRL+SHIFT+P`/`CMD+SHIFT+P` to open the command prompt and type in `Dendron: focus on tree view` to make it appear

## Create a link

1. In the current note, type `[[` - this should trigger the autocomplete. You can type `one` to narrow it down to the note you just created and hit enter
<!-- Enter '[[' below-->

<!-- End space-->

You just created your first link!

- > NOTE: the links with the `[[` are called wikilinks (because they were first popularized by Wikipedia)
- > TIP: If you hover your mouse over the link, you can get a preview of the contents inside the note!

## Navigate a link

1. Move your text cursor over the link you just created. Hold down `<CTRL>+<ENTER>`/`<CMD>+<ENTER>`

- > TIP: You can also use `CTRL+CLICK` or `CMD+CLICK` to navigate links via mouse

You just navigated the link!

## Refactor a Note

1. Open [[tutorial.one]], bring up the command prompt (`CTRL+SHIFT+P`/`CMD+SHIFT+P`) and type `Dendron: Rename Note`
1. Replace `tutorial` with `my-note` and then press `<ENTER>`
1. You just refactored the note!

- > NOTE: when you rename a note, Dendron updates all links and references of the original note being renamed. Try switching back to [[tutorial]] to see the updated link!
- > TIP: in addition to renaming one note at a time, dendron has [an entire collection](https://wiki.dendron.so/notes/srajljj10V2dl19nCSFiC) of refactoring commands that let you change headers, move around sections, and refactor entire hierarchies!

## Conclusion

Congrats, you finished the Dendron tutorial!

Was there anything **unclear or buggy** about this tutorial? Please [**report it**](https://github.com/dendronhq/dendron/discussions/3266) so we can **make it better**!

## Next Steps

Depending on your needs, here are some common next steps:

- I want to **start writing**: [Create a daily journal note](command:dendron.createDailyJournalNote) ([docs](https://wiki.dendron.so/notes/ogIUqY5VDCJP28G3cAJhd))

- I want to **use templates**: Use the [Appy Template](https://wiki.dendron.so/notes/ftohqknticu6bw4cfmzskq6) command to apply [templates](https://wiki.dendron.so/notes/861cbdf8-102e-4633-9933-1f3d74df53d2) to existing notes

- I want to do a **longer tutorial**: Check out our [5min tutorial to explore more of Dendron's functionality](https://wiki.dendron.so/notes/678c77d9-ef2c-4537-97b5-64556d6337f1/)

- I want to **implement a particular workflow** (bullet journal, zettelkasten, etc): Check out community [workflow guides](https://wiki.dendron.so/notes/9313b845-d9bf-42c9-aad1-0da34794ce26)

- I want to use Dendron for **tasks and todos**: See the [Getting Things Done (GTD), Bullet Journaling, and Other Task Management Workflows](https://wiki.dendron.so/notes/ordz7r99w1v099v14hrwgnp) for how the founder of Dendron uses it to manage his work.

- I want to explore **advanced features**: See [next steps](https://wiki.dendron.so/notes/TflY5kn29HOLpp1pWT9tP) for longer walkthroughs and advanced functionality!

- I want to start clean with a **new vault at a custom location**: Run [Dendron: Initialize Workspace](command:dendron.initWS) from the command prompt (or click this link) to start from a clean slate

- I want to use Dendron as a **knowledge base for my team**: Read the [Dendron team setup](https://wiki.dendron.so/notes/98f6d928-3f61-49fb-9c9e-70c27d25f838) to get started

> Coming from Obsidian? Click [here](command:dendron.importObsidianPod) to import your Obsidian notes (or any markdown notes) into Dendron to see how they look.

## Community

Dendron is more that just a tool - we are also a community of individuals that are passionate about knowledge management. If you need help or want to connect with the community, join us in the [Discords](https://link.dendron.so/discord).

You can also:

- Star us on [GitHub](https://github.com/dendronhq/dendron)
- Follow us on [Twitter](https://twitter.com/dendronhq)
- Subscribe to the [Dendron Newsletter](https://link.dendron.so/newsletter)
