# 2020-07-25 Release Notes (version 0.4)

Its been an active week of Dendron development. These weekly release notes are to keep you up to date on some of the things we're working on.

These release notes are summary of the more notable changes, for the full list, please look at our [CHANGELOG](https://github.com/dendronhq/dendron/blob/master/CHANGELOG.md)

## Legend

- 🚧 experimental

## Features

### New Getting Started Experience ([dd4f50e](https://github.com/dendronhq/dendron/commit/dd4f50eb169e7f9686c4e3fbabca3b2a6c1e1bb7))

![](https://foundation-prod-assetspublic53c57cce-8cpvgjldwysl.s3-us-west-2.amazonaws.com/assets/images/dendron-quickstart.gif)

Dendron has a completely re-done getting started. you can see it by running `> Dendron: Initialize Workspace` in a new workspace and then navigating to `dendron.quickstart`

### 🚧 Graph View for Hierarchies ([129bf4e](https://github.com/dendronhq/dendron/commit/129bf4e4e480dfbff66530725c6db8d2321adc28))

- [docs](https://github.com/dendronhq/dendron-template/blob/master/vault/dendron.topic.graph-view.md)

Note that Dendron's graph view lays out your notes according to their hierarchy (vs backlinks).

![](https://foundation-prod-assetspublic53c57cce-8cpvgjldwysl.s3-us-west-2.amazonaws.com/assets/images/graph-intro.gif)

### 🚧 Windows Support ([a789ec5](https://github.com/dendronhq/dendron/commit/a789ec5792301103d302739f00b595509128d367))

Dendron is now compatible with windows

### Upgrade Settings Command ([c043090](https://github.com/dendronhq/dendron/commit/c0430905d314c6ee870f9bdd45434f53e93a7098))

- [docs](https://github.com/dendronhq/dendron-template/blob/master/vault/dendron.topic.commands.md#upgrade-settings)

Dendron will automatically update your workspace settings during version upgrades to make sure they stay up to date with new features and bundled extensions. If you've modified the settings or want to restore your settings back to their default, you can run this command.

### Reload Index Command ([236b2ac](https://github.com/dendronhq/dendron/commit/236b2ac70812c4df525ff27479802b6e49e0587f))

- [docs](https://github.com/dendronhq/dendron-template/blob/master/vault/dendron.topic.commands.md#reload-index)

Dendron will re-initialize the index. This is currently necessary if you add new entries to a [schema](https://github.com/dendronhq/dendron-template/blob/master/vault/dendron.topic.schema.md). Otherwise, Dendron will re-index schemas the next time you reload/open your workspace.

### Open Logs Command ([4f223fc](https://github.com/dendronhq/dendron/commit/4f223fc318fe033471252611c8f41d505dca1055))

- [docs](https://github.com/dendronhq/dendron-template/blob/master/vault/dendron.topic.commands.md#open-logs)

A bunch of you have been submitting issues to our issue tracker. To make the process easier, we now have a command to automatically fetch get the logs for when you submit your next issue.

### Open Link Command ([7f630d1](https://github.com/dendronhq/dendron/commit/7f630d1fb95d5c0d28fc5a83f4cee27bc17d452c))

- [docs](https://github.com/dendronhq/dendron-template/blob/master/vault/dendron.topic.links.md)

Be able to open non-markdown files using native apps (eg. use preview to open pdfs on mac).

### Journal Notes ([5e1236f](https://github.com/dendronhq/dendron/commit/5e1236fddbf1e0fddf4c27d1a40e9841cc99974f))

- [docs](https://github.com/dendronhq/dendron-template/blob/master/vault/dendron.topic.special-notes.md#journal-note)

A journal note is a self contained note that is meant to track something over time. Examples of journals include recording workout sessions, making meeting notes, and keeping a mood journal.

### Scratch Notes scratch ([71d8433](https://github.com/dendronhq/dendron/commit/71d8433fbd10651ec7fcd13a5f7ee41199a43632))

- [docs](https://github.com/dendronhq/dendron-template/blob/master/vault/dendron.topic.special-notes.md#scratch-note)

A scratch note is a self contained note that is meant to be used as scratchpad. Use it for thoughts or when you want to expand on a bullet point. Scratch notes are created in the `scratch` domain and have the following format: `{domain}.journal.{Y-MM-DD-HH-HHmmss}`.

## Fixes

### Markdown Preview will now Open Local Links ([9a3418](https://github.com/dendronhq/dendron/commit/10a3418f7a633fa9b5294794e1a912cb4ea6c066))

Issue were the newest VSCode broken links. This fixes that.

## Enhancements

### Reduce Startup Speed ([4502e49](https://github.com/dendronhq/dendron/commit/4502e49f79d490bb639d2daaf93f841e5b18449d))

Use webpack to reduce bundle size and reduce startup speed by factor of 10

### Remove Extra Frontmatter ([e059346](https://github.com/dendronhq/dendron/commit/e0593467fca94a4d29dc9463721a99e67881cfb3))

- [docs](https://github.com/dendronhq/dendron-template/blob/master/vault/dendron.topic.frontmatter.md)

Dendron keeps track of metadata to your notes using frontmatter. There were many fields that we wrote out that didn't need to be written out because Dendron gathers that information during its index phase. Those fields are now no longer written out!

### Initialize Default Workspace with Relative Paths ([790ef50](https://github.com/dendronhq/dendron/commit/790ef503225e5b18a78e3e62e847ba8b2adfd8d0))

By not hardcoding the workspace path, it makes it easy to use Dendron between different devices.

- change workspaces accepts '~' path ([d6c4f64](https://github.com/dendronhq/dendron/commit/d6c4f64cdfbb9e6b5c44a04320a84756fefcb924))
- creating journals copies path to clipboard ([a34fc81](https://github.com/dendronhq/dendron/commit/a34fc815454e0e86112d5a507dd0013ec37a0edb))
- automatic setting upgrades ([ae74675](https://github.com/dendronhq/dendron/commit/ae74675ab05f8b4ff579311850817c434e23ec94))
- keyboard shortcuts for scratch and journal notes ([076fa18](https://github.com/dendronhq/dendron/commit/076fa18ceb0836736e123d7439af31da00cc2ec2))

### Initialize New Vault With git ([7278b6f](https://github.com/dendronhq/dendron/commit/7278b6fbbf4e175815a0a069c449ad7ef479a77e))

Dendron will now initialize a git repository when you run `Initialize Workspace`

## Next

Some notable items we are working on for the next release. You can see the full roadmap [here](https://github.com/orgs/dendronhq/projects/1). You can join the discussion on upcoming roadmap items in our [#roadmap discord channel](https://discord.gg/HzkFcs).

### Refactor Hierarchies

- [issue](https://github.com/dendronhq/dendron/issues/39)

Be able to refactor hierarchies and have all file names and links automatically update.

### Publish to Github Pages

- [issue](https://github.com/dendronhq/dendron/issues/60)

Be able to publish a vault as a github page

## Thank You

Last and most of all, a big **thanks** to all these people that contributed issues and suggestions during this release.

- [Alexis Argyris](https://github.com/alexisargyris)
- [Jay A. Patel](https://github.com/jayp)
- [Kiran Pathakota](https://github.com/kpathakota)
