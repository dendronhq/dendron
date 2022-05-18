---
id: rjnqumna1ye82u9u76ni42k
title: Linking Notes
desc: Linking Notes
updated: 1652280770996
created: 1625563999532
nav_order: 2
---

## Links

Dendron helps you create links between notes. These links help you organically discover relationships and build out your knowledge graph.

> 🌱 **ACTION:** To create a link, start typing `[[` and Dendron will show you a list of notes in your workspace that you can link to. Let's go with `[[recipes.vegetarian]]`. Try it in the editor view, now.

- Example (remember to remove the surrounding backticks): `[[recipes.vegetarian]]`

To navigate to the note in the link, click the link in the preview view. In the editor pane, move the cursor into the link and hit `Ctrl+Enter`. You might wonder what will happen if the note doesn't exist: it will create the note!

You can switch back to the previous note with the tab switching shortcut: `Ctrl+Tab` on most systems.

> 💡 **TIP:** When you create a wikilink, Dendron automatically registers the link as a **backlink** for the destination note. These appear in the [Backlinks Pane](https://wiki.dendron.so/notes/gHdxXlNMr1w4xqee0n-Mb) when the destination note is open. For more information on backlinks:
>
> - [Links: Backlinks](https://wiki.dendron.so/notes/3472226a-ff3c-432d-bf5d-10926f39f6c2)
> - [Workbench: Backlinks Panel](https://wiki.dendron.so/notes/f7ebd4aa-8ba7-4bc5-bd00-a1efc5315f07)

### Link to headers

> 🌱 **ACTION:** You need headers to link to for this, so add an `## Ingredients` section to `[[recipes.italian.desserts.tiramisu]]`. Try it in the editor view. Then:
>
> - Create `[[recipes.ingredients.shopping-list]]` if it doesn't already exist
> - Add `[[Tiramisu Ingredients|recipes.italian.desserts.tiramisu#ingredients]]` to `[[recipes.ingredients.shopping-list]]`

The `#ingredients` at the end will link directly to the header `## Ingredients`. A shortcut to grabbing the link is to place the cursor in the `## Ingredients` header, then run the command `Dendron: Copy Note Link` (`Ctrl+Shift+C` / `Cmd+Shift+C`). That will copy the link to the clipboard, allowing you to paste in other notes.

> 💡 **TIP:** Notice how these links use custom link titles, like **Tiramisu Ingredients**. This is called a **labelled wikilink**: `[[label|your.note.to.link]]`. If a label isn't used, either the `title` attribute from the frontmatter, or the title of the header you are linking to, is used.

## Explore Your Knowledge Graph

> 🌱 **ACTION:** To get a visual representation of your notes, use the `Dendron: Show Note Graph` command.

This is the **[graph view](https://wiki.dendron.so/notes/587e6d62-3c5b-49b0-aedc-02f62f0448e6)**. You can explore the hierarchical organization of your notes and how they are linked together. We're continually working to improve this feature so keep on the lookout for new capabilities in the note graph view in the future!

#### Local Note Graph

Shows a graph of your current note and immediate neighbors. This is the default view when you run [Show Note Graph](https://wiki.dendron.so/notes/587e6d62-3c5b-49b0-aedc-02f62f0448e6).

![Local Note Graph Dark](https://org-dendron-public-assets.s3.amazonaws.com/images/graph-view-local-dark.png)

#### Full Note Graph

Show graph of all your notes. You can activate this by using the [Show Note Graph Command](https://wiki.dendron.so/notes/587e6d62-3c5b-49b0-aedc-02f62f0448e6) command and toggling the [Show Note Graph](https://wiki.dendron.so/notes/587e6d62-3c5b-49b0-aedc-02f62f0448e6) option.

![Full Note Graph Dark](https://org-dendron-public-assets.s3.amazonaws.com/images/graph-view-full-dark.png)

## Next Steps

- Tutorial Step 4: [[Rich Formatting|tutorial.rich-formatting]]
