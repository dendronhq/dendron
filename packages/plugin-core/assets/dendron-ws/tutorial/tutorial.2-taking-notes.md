---
id: DO_RXSlAbwNwbz-ILKoQa
title: Taking Notes
desc: ''
updated: 1624445853580
created: 1624333266168
---

_You can also find this guide on our [wiki](https://wiki.dendron.so/notes/784b8d5e-58eb-4e3e-98b0-8ed1690abc74.html)._

### Create a Note

To create a note, use `Ctrl+L` or `Cmd+L` to bring up Dendron's lookup. This is a shortcut for the `Dendron: Lookup` command.

While we call it the Lookup Bar, you can also use it to create notes that don't exist. When you do a lookup on a note that hasn't been created, Dendron will create it for you.

> 🌱 Try it yourself - bring up the lookup bar with Ctrl+L. Type recipes and hit Enter.

This should have created a note named `recipes.md`. Notes in Dendron are just plaintext markdown. They live in your file system and are portable across any platform.

The --- section at the top of each note is frontmatter. Frontmatter are custom attributes at the top of each markdown file. Dendron uses it to store metadata about each note and is used for features like publishing. Don't modify the id attribute on the front matter [[todo]] - is that accurate?

### Creating a hierarchy

Dendron uses flexible hierarchies to help you organize your notes. It's how people are able to manage tens of thousands of notes inside Dendron.

> 🌱 To create a hierarchy, bring up lookup again. Type `recipes.vegetarian`, and then press enter.

You have now created your first hierarchy. Unlike folders in your file system, hierarchies in Dendron are specified with a `.` delimiter in the file name. Take a look at the tree view in the side panel to see that the `world` note exists under the `recipes` hierarchy. You can also see in the Workspace panel that the note file is stored as `recipes.vegetarian.md`.

You can create a hierarchy at any level:

> 🌱 Type the following into lookup and hit enter: `lets.go.deep`

You'll notice in the tree view that there is now a `+` sign next to `lets` and `go`. The plus sign indicates that this note is a stub. A stub is a placeholder for a note that hasn't actually been created. Dendron uses stubs to avoid cluttering your file system with empty notes when creating hierarchies.


_**NOTE**: Don't create children from `root`. This is not currently supported._

### Finding Notes

To find notes, we use the same lookup interface that we used to create them.

> 🌱 Open Lookup, and type 'reve'. This will find your `recipes.vegetarian` note, hit `Enter` to open that note.

The lookup uses fuzzy search which means you can type out partial results and still see the results. In practice, you'll only need to type a couple of characters to find any note stored inside Dendron. Searching with * wildcards is also supported.

When combined with hierarchies, this fast lookup system enables you to find your notes very quickly, even if you have thousands of notes.

If you want to search for content within the notes, you can use VS Code's built-in search tools with `Ctrl+Shift+F` \ `Cmd+Shift+F`. You can also take advantage of the `.` delimited naming scheme for hierarchies in the include/exclude patterns of VS Code's search to find content in a sub-tree of your notes.

### Next Steps

- Learn about [[Links and Graphs|tutorial.3-links-and-graphs]]
