---
id: hAB2tQHsi0CGuhxz5HkTI
title: Links and Graphs
desc: ''
updated: 1624455055929
created: 1624333278136
---

### Links

Dendron supports links between your notes, which can help you organically link your thoughts and build up a powerful knowledge graph.

> 🌱 To create a link, just start typing [[ and Dendron will show you a list of notes in your workspace that you can link to. Try it in the editor pane now.

Example: [[tutorial]]

#### Navigating links

To navigate to the note in the link, you can just click on the link in the preview pane. In the editor pane, you can move the cursor into the link and hit `Ctrl+Enter`.

You can switch back to the previous note by pressing `Ctrl+Tab`

#### Backlinks

Take a look at the backlinks panel on the bottom left section of your sidebar. The backlinks panel shows you all notes with links that point to the current note. This is useful for helping to establish context.

#### Additional Link Features

 - Create a note directly from a link - place your cursor inside this link `[[examples.note-doesn't-exist-yet]]`, hit `CTRL + ENTER`.
 - Add an alias to a link to change how it shows in the preview. Example: [[My Alias|tutorial]]
 - Relative Links - Link to a specific section of a page with a `#` suffix. Example: [[Additional Link Features|tutorial.3-links-and-graphs#additional-link-features]]
 - Note References - Add a section from another note with its content inlined into the current note. [Docs Here](https://wiki.dendron.so/notes/f1af56bb-db27-47ae-8406-61a98de6c78c.html#note-reference)

### Explore Your Knowledge Graph

> 🌱 To get a visual representation of your notes, use the `Dendron: Show Note Graph` command.

You can explore the hierarchical organization of your notes and how your knowledge is linked together. We're continually working to improve this feature so keep on the lookout for new capabilities in the graph view in the future!

[[todo]] should we deprecate the old graph view yet?

### Next Steps

- Learn about [[Images and Diagrams|tutorial.4-images-and-diagrams]]
[[]]