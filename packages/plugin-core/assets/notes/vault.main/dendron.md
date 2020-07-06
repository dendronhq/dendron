# Welcome to Dendron

![](assets/logo-256.png#center)

Dendron is a **hierarchal** knowledge management tool that **grows** as you do. 

Think of it as a **second brain** to help you make sense of all the information you care about. 

At its core, Dendron helps you **store and find notes**. Dendron does this through [[hierarchies]], [[schemas]], and [markdown](TODO) with [frontmatter](). To read more about the ideas that inspired Dendron, you can read [this blog post](https://kevinslin.com/organizing/its_not_you_its_your_knowledge_base/).

## Dendron Concepts

### Legend

- 🚧 these features are still under development

### Workspace
In Dendron, your **workspace** is a folder that contains all your notes. Depending on your operating system, Dendron has a different default location for the **workspace**.

### Vaults
Your workspace is made up of **vaults**. You can think of a vault as a git repository. By default, Dendron creates the *vault.main* folder to store all yoru notes. Dividing your notes by vaults has some of the following benefits:
- you can separate private notes that you want to keep local (`vault.secret`) from notes you want to sync
- 🚧 you can import vaults from third parties
- 🚧 you can publish and collaborate with just the notes in a specific vault

### Hierarchies

Within a vault, your notes are stored **hierarchically** as `.` delimited markdown files. This is similar to how domain names work.

Below is an example of a hierarchal organization scheme within a file system. 

```
├── project1/
├── project1/designs/
├── project1/designs/promotion.png
├── project1/paperwork/
├── project1/paperwork/legal.md
├── project1/tasks/
├── project1/tasks/task1.md
└── project1/tasks/task2.md
```


In Dendron, the above hierarchy would look like the following

```
├── project1.
├── project1.designs.
├── project1.designs.promotion
├── project1.paperwork.
├── project1.paperwork.legal
├── project1.tasks.
├── project1.tasks.task1
└── project1.tasks.task2
```

## Hierarchal Lookup

To work with notes, Dendron uses **hierarchal lookup**. This is best explained by example. 

First, use `CTRl-P` to bring up the lookup bar. You should see the current note (`dendron`) highlighted. 

- TODO: screen shot of ctrl-p

Dendron is the **domain** of its hierarchy.  Think of it as a [tld](TODO) for a domain name or a notebook in a traditional note taking app like OneNote

You can see other notes in the *dendron* **domain** via the dropdown.

- TODO: screenshot of drop down

To navigate, type to filter results and `.` to go deeper. Try the following query and then hit `Enter`

```
dendron.f.hello
```

- TODO: screenshot

Follow the instructions in [[dendron.f.lookup]] before continuing below.


## Lookup

Creating a note is as simple as looking it up - if it doesn't exist, Dendron will create it. To perform a lookup, use the `CTRL-P` shortcut or the `> Dendron: Lookup` command.

![Open or create note](assets/dendron-open-create.gif)

Notes are stored and indexed hierarchically. Hierarchies can be as deep or shallow as you need them to be. 


# Install

Dendron can be installed as a [vscode plugin](TODO) or as using the [standalone Dendron app](TODO) (coming soon). 

Dendron is still early and maybe 1% of where it could be. That being said, it is actively being used by the author on a daily (hourly) basis to manage a knowledge base of over 20 thousand notes. 

The **audacious long term goal** is for Dendron to become the **best way to create, understand, and share knowledge**. Please join me in this **journey** and, together, lets **make sense** of this world that we inhabit.

# Configuration

TODO

# Changelog
- to see the latest updates, see the [changelog](https://github.com/dendronhq/dendron/blob/master/CHANGELOG.md)