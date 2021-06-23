---
id: vXh-HmSTsmgGA9j9IzcZh
title: Navigation Basics
desc: ''
updated: 1624446320758
created: 1624332288808
---

Let's do a brief overview on how to navigate the Dendron UI.

_Quick note on running commands in VS Code:_

>If you're unfamiliar with VS Code, the command palette is used to quickly run commands, including the commands for Dendron. To bring up the command palette, use `Ctrl+Shift+P` (windows/linux) or `Cmd+Shift+P` (mac) and start typing the command. Throughout the tutorial, if you see instructions telling you to run a command, remember to bring up the command palette and then type the command name to run it.

![Basic UI](/assets/images/layout.png)
[[todo]] Re-take Screen Shot; Make Elements Bigger; Clean up the view; add 1/2/3/4/5 labels on the screen shot

#### 1. Editor Pane

This is where you can write and edit your notes. Notes in Dendron are Markdown files.

#### 2. Preview Pane

This shows the rendered Markdown of what your currently opened note looks like. If you close this pane, you can always bring it back by bringing up the command pallete (`Ctrl+Shift+P / Cmd+Shift+P`) and running the `Dendron: Show Preview` command. You can assign a [keybinding shortcut](https://code.visualstudio.com/docs/getstarted/keybindings) to this command in VS Code (or any other command for that matter).

The preview pane is currently read-only and cannot be used to edit notes. All editing must be done in the editor pane.

#### 3. Dendron Workspace

Dendron stores your markdown notes in a flat folder on your filesystem called a vault, which you can see on the left. You can view the note markdown files as they exist in your vault here. This is the workspace view that is built into VS Code.

#### 4. Tree View

This shows a tree view of your notes, similar to how a folder hierarchy would look in your filesystem. You can also click in the tree view to navigate around your notes.

[[todo]] - update screen shot to Treeview V2?

#### 5. Backlinks

This shows a list of other notes that have links to the current note. More on links in Section 3 of the tutorial.

VS Code lets you reposition any of these windows as you'd like, so feel free to rearrange the windows into the view that works best for you!

### Next Steps

- You've completed navigation basics! You can go back to the [[tutorial]] page and check off the Navigation Basics checkbox to mark your progress.
- Next is to learn about [[tutorial.2-taking-notes]]
