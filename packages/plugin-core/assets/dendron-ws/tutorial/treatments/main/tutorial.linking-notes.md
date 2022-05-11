---
id: khv6u4514vnvvy4njhctfru
title: Linking Notes
desc: Linking Notes
updated: 1652280901513
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

## Refactoring in Dendron

You may wonder what happens to your links if you want to change the name of a note or header. Dendron keeps this in mind and provides commands to update your notes. All the while, Dendron updates any and all wikilinks in your notes.

### Rename Note

The [Rename Note](https://wiki.dendron.so/notes/srajljj10V2dl19nCSFiC) command is used to change the name of, and all links to, a single note.

> 🌱 **ACTION:** Use the lookup to navigate to `[[recipes.italian.desserts.tiramisu]]`. Then:
>
> - Run the command `Dendron: Rename Note` to change the title to `[[recipes.italian.desserts.gelato]]`.
> - Use the lookup to navigate to `[[recipes.ingredients.shopping-list]]`. You should see the wikilink there has updated from `[[recipes.italian.desserts.tiramisu#ingredients]]` to `[[recipes.italian.desserts.gelato#ingredients]]`, ensuring links are updated!

### Rename Header

The [Rename Header](https://wiki.dendron.so/notes/srajljj10V2dl19nCSFiC) command is used to change the name of, and all links to, a single header.

> 🌱 **ACTION:** Use the lookup to navigate to `[[recipes.italian.desserts.gelato]]`. Then:
>
> - Place the cursor in `## Ingredients`, and run the command `Dendron: Rename Header`
> - Rename the header to `## Best Ingredients`
> - Use the lookup to navigate to `[[recipes.ingredients.shopping-list]]`. You should see the wikilink there has updated from `[[recipes.italian.desserts.gelato#ingredients]]` to `[[recipes.italian.desserts.gelato#best-ingredients]]`, ensuring links are updated!

If you want to migrate a section beneath a certain header to a different note entirely, [Move Header](https://wiki.dendron.so/notes/srajljj10V2dl19nCSFiC) will do the job and ensure links are updated.

### Refactor Hierarchy

The [Refactor Hierarchy](https://wiki.dendron.so/notes/srajljj10V2dl19nCSFiC) command is used to change the name of, and all links to, a collection of notes.

> 🌱 **ACTION:** This section will be all about creating and refactoring notes, in order to get an idea for how it all works.

- Create the following notes by placing the cursor inside each, and pressing `Ctrl+Enter`:
  - `[[recipes.vegetarian.tikka-masala]]`
  - `[[recipes.vegetarian.aloo-paratha]]`
  - `[[recipes.vegetarian.dosa]]`
- Each of these are Indian food! Let's move them into the `indian` hierarchy.
  - Run the command `Dendron: Refactor Hierarchy`
  - At the first prompt, enter `recipes.vegetarian` (note hierarchy you are targeting)
  - At the second prompt, enter `recipes.indian` (renaming the targeted hierarchy)

A refactor preview should be provided, before making the change, to confirm the changes you are about to make.

![Refactor Hierarchy Preview prompt](https://org-dendron-public-assets.s3.amazonaws.com/images/refactor-hierarchy-preview-prompt.png)

This will change all of the targeted notes:

```
recipes.vegetarian.md               -->	recipes.indian.md
recipes.vegetarian.tikka-masala.md  -->	recipes.indian.tikka-masala.md
recipes.vegetarian.aloo-paratha.md  -->	recipes.indian.aloo-paratha.md
recipes.vegetarian.dosa.md          -->	recipes.indian.dosa.md
```

Selecting `Proceed` renames all the notes! There's no need to worry about any broken links throughout your notes, as those are updated by `Refactor Hierarchy`, too.

> 💡 **TIP:** We could have chosen to move them all to `[[recipes.indian.vegetarian]]`, too, if wanting to add `vegetarian` to recipe hierarchies. Doing this would make it easy to do a lookup against all vegetarian recipes with `recipes. vegetarian`. Another alternative is to take a look at using [Tags](https://wiki.dendron.so/notes/8bc9b3f1-8508-4d3a-a2de-be9f12ef1821).

## Next Steps

- Tutorial Step 4: [[Rich Formatting|tutorial.rich-formatting]]
