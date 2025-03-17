[![StandWithUkraine](https://raw.githubusercontent.com/vshymanskyy/StandWithUkraine/main/badges/StandWithUkraine.svg)](https://github.com/vshymanskyy/StandWithUkraine/blob/main/docs/README.md)

[![dendronhq on Twitter](https://img.shields.io/twitter/follow/dendronhq?style=social)](https://link.dendron.so/twitter)
[![Dendron on YouTube](https://img.shields.io/youtube/channel/subscribers/UC8GQLj4KZhN8WcJPiKXtcRQ?style=social)](https://link.dendron.so/youtube)
[![Discord](https://img.shields.io/discord/717965437182410783?color=blueviolet&label=Discord&style=flat-square)](https://link.dendron.so/discord)
[![VS Code Installs of Dendron](https://img.shields.io/visual-studio-marketplace/i/dendron.dendron?label=VS%20Code%20Installs%20of%20Dendron&color=blue&style=flat-square)](https://link.dendron.so/vscode)

<!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->
[![All Contributors](https://img.shields.io/badge/all_contributors-244-orange.svg?style=flat-square)](#contributors-)
<!-- ALL-CONTRIBUTORS-BADGE:END -->

# Dendron

[Dendron is currently in maintenace only, active development has ceased.](https://github.com/dendronhq/dendron/discussions/3890)

![Dendron Logo](https://foundation-prod-assetspublic53c57cce-8cpvgjldwysl.s3-us-west-2.amazonaws.com/assets/logo-256.png)

Dendron is an **open-source, local-first, markdown-based, note-taking tool**. It's a personal knowledge management solution (PKM) built specifically for developers and integrates natively with IDEs like [VS Code](https://code.visualstudio.com/) and [VSCodium](https://vscodium.com/).

## Motivation

> "We are overwhelmed with information and we don't have the tools to properly index and filter through it. [The development of these tools, which] will give society access to and command over the inherited knowledge of the ages [should] be the first objective of our scientist" - Vannevar Bush, 1945

## Why


Most PKM tools help you create notes but slam into a wall retrieving them once your knowledge base reaches a certain size threshold. That threshold varies with the tool, but virtually everything stops working past 10k notes unless the user was extremely diligent about organizing their knowledge. Past this threshold, entropy wins and every query becomes a keyword search and scrolling through pages of results.


> Dendron's mission is to help **humans organize, find, and work with any amount of knowledge**.

It not only helps you create notes but also retrieve them - retrieval works as well with ten notes as it does with ten thousand.

## How

Dendron builds on top of the past five decades of programming languages and developer tooling. We apply the key lessons from software to the management of general knowledge.
We make managing general knowledge like managing code and your PKM like an IDE.

## Design Principles

### Developer Centric

Dendron aims to create a world class developer experience for managing knowledge.

Our goal is to provide a tool with the efficiency of Vim, the extensibility of Emacs, and the approachability of VS Code.

What this means:

- dendron features are text centric and composables
- dendron provides the lowest friction interface for working with your knowledge base
- dendron optimizes for efficiency, speed, and keyboard focused ux
- dendron comes with sane defaults and the ability to customize to your liking
- dendron can be extended along any dimension

### Gradual Structure

Dendron extends markdown with structural primitives to make it easier to manage at scale and tooling on top to work with this structure.

Different knowledge bases require different levels of structure - a PKM used for keeping daily journals is different than a company wide knowledge base used by thousands of developers.

Dendron works with any level of structure, meaning you can take free form notes when starting out and gradually layer on more structure as your knowledge base grows more.

### Flexible and Consistent

Dendron is both flexible and consistent. It provides a consistent structure for all your notes and gives you the flexibility to change that structure.

In Dendron, you can refactor notes and Dendron will make sure that your PKM is consistent throughout. This means that you have the best of both worlds: a basic structure for the organization but the flexibility to change it.

## Features

Dendron has hundreds of features. The following is a list of highlights.

### It's just Plaintext

- manage using git
- use git blame to see individual edits
- edit in anything that works on text files (eg. Vim)

<a href="https://www.loom.com/share/67b90027de974702a78753158822e96b">
    <img style="" src="https://org-dendron-public-assets.s3.amazonaws.com/images/67b90027de974702a78753158822e96b.gif">
</a>

### Markdown and More

- create diagrams using mermaid
- write math using katex
- embed notes (and parts of notes) in multiple places using note references

<a href="https://www.loom.com/share/f7e710a3c3454e75a2938d2cbed359d9">
    <img style="" src="https://org-dendron-public-assets.s3.amazonaws.com/images/f7e710a3c3454e75a2938d2cbed359d9.gif">
</a>

### Lookup

- one unified way to find and create notes
- quickly traverse and create new hierarchies

<a href="https://www.loom.com/share/29ec0fe0964648feae08387a7bb8c45f">
    <img style="" src="https://org-dendron-public-assets.s3.amazonaws.com/images/29ec0fe0964648feae08387a7bb8c45f.gif">
</a>

### Schema

- ensure consistency for your knowledge base
- get autocomplete hints when creating new notes
- automatically apply common templates to notes on creation

<a href="https://www.loom.com/share/faee68959647441e86b9c4c183384ce5">
    <img style="" src="https://org-dendron-public-assets.s3.amazonaws.com/images/faee68959647441e86b9c4c183384ce5.gif">
</a>

### Navigation

- explore relationships using backlinks
- navigate to notes, headers and arbitrary blocks
- visualize your knowledge base using the graph view

<a href="https://www.loom.com/share/2d365d965c104af2a1501d789aa2d2b1">
    <img style="" src="https://org-dendron-public-assets.s3.amazonaws.com/images/2d365d965c104af2a1501d789aa2d2b1.gif">
  </a>

### Refactor

- restructure your knowledge base without breaking links
- rename a single note or refactor using arbitrary regex
- rename and move individual sections within notes

<a href="https://www.loom.com/share/b1a84decc53f4639b5bc60c885c56543">
    <img style="" src="https://org-dendron-public-assets.s3.amazonaws.com/images/b1a84decc53f4639b5bc60c885c56543.gif">
</a>

### Vaults

- mix and match knowledge using vaults, a git backed folder for your notes
- use vaults to separate concerns, like personal notes and work notes
- publish vaults on git to collaborate and share knowledge with others

<a href="https://www.loom.com/share/c51e457ac2b0415ca91a8929411add64">
    <img style="" src="https://org-dendron-public-assets.s3.amazonaws.com/images/c51e457ac2b0415ca91a8929411add64.gif">
  </a>

### Publish

- export your knowledge base as a static (nextjs) site
- lookup locally and share globally with generated links
- manage what you publish using fine grained permissions on a per vault, per hierarchy and per note basis

<a href="https://www.loom.com/share/727537e0fd49481cac2accc2b3362fa3">
    <img style="" src="https://org-dendron-public-assets.s3.amazonaws.com/images/727537e0fd49481cac2accc2b3362fa3.gif">
  </a>

## Use Cases

- personal knowledge management (PKM)
- documentation
- meeting notes
- tasks and todos
- blogging
- customer relationship management

## Getting Started

Interested in trying out Dendron? Jump right in with the [Getting Started Guide](https://wiki.dendron.so/notes/678c77d9-ef2c-4537-97b5-64556d6337f1/)!

## Join Us

Dendron wouldn't be what it is today without our wonderful set of members and supporters.

### Community Calendar

We have a bunch of community events that we host throughout the week. You can stay up to date on whats happening by taking a look at our community calendar!

- View and register for upcoming [Dendron Community Events on Luma](https://link.dendron.so/luma)

### Dendron Newsletter

- [Subscribe to the Dendron Newsletter](https://link.dendron.so/newsletter)

Dendron sends out a weekly newsletter highlighting:

- Latest release features
- Latest [Dendron blog](https://blog.dendron.so) posts
- Insights from the [Dendron Discord](https://link.dendron.so/discord) community
- RFC updates and [GitHub discussions](https://link.dendron.so/6WvK)
- and more!

### Join other Dendrologists

There are a variety of ways to connect with Dendron devs, contributors, and other members of the Dendron community:

- Join the [Dendron on Discord](https://link.dendron.so/discord)
- Follow [Dendron on Twitter (`@dendronhq`)](https://link.dendron.so/twitter)
- Checkout [Dendron on GitHub](https://link.dendron.so/github)
- Read the [Dendron Blog](https://blog.dendron.so/)
- Subscribe to the [Dendron Newsletter](https://link.dendron.so/newsletter)

## Contributors ✨

Dendron wouldn't be what it is today without help from the wonderful gardeners 👨‍🌾👩‍🌾

If you would like to contribute (docs, code, finance, or advocacy), you can find instructions to do so [here](https://wiki.dendron.so/notes/125c990b-6fe7-4ada-a65f-44cbde8b33f0.html). For setup of local development environment run `./setup.sh` which automates the setup.

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tbody>
    <tr>
      <td align="center"><a href="https://github.com/lsernau"><img src="https://avatars.githubusercontent.com/u/4541943?v=4?s=100" width="100px;" alt="lsernau"/><br /><sub><b>lsernau</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3Alsernau" title="Bug reports">🐛</a> <a href="#financial-lsernau" title="Financial">💵</a></td>
      <td align="center"><a href="http://kaangenc.me/"><img src="https://avatars.githubusercontent.com/u/1008124?v=4?s=100" width="100px;" alt="Kaan Genç"/><br /><sub><b>Kaan Genç</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/commits?author=SeriousBug" title="Documentation">📖</a> <a href="https://github.com/dendronhq/dendron/commits?author=SeriousBug" title="Code">💻</a></td>
      <td align="center"><a href="https://mandarvaze.bitbucket.io/"><img src="https://avatars.githubusercontent.com/u/46438?v=4?s=100" width="100px;" alt="Mandar Vaze"/><br /><sub><b>Mandar Vaze</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/commits?author=mandarvaze" title="Documentation">📖</a></td>
      <td align="center"><a href="https://www.henryfellerhoff.com/"><img src="https://avatars.githubusercontent.com/u/48483883?v=4?s=100" width="100px;" alt="hfellerhoff"/><br /><sub><b>hfellerhoff</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/commits?author=hfellerhoff" title="Documentation">📖</a></td>
      <td align="center"><a href="https://d3vr.me/"><img src="https://avatars.githubusercontent.com/u/1549990?v=4?s=100" width="100px;" alt="Fayçal"/><br /><sub><b>Fayçal</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/commits?author=d3vr" title="Documentation">📖</a> <a href="https://github.com/dendronhq/dendron/issues?q=author%3Ad3vr" title="Bug reports">🐛</a></td>
      <td align="center"><a href="https://github.com/BASSMAN"><img src="https://avatars.githubusercontent.com/u/363783?v=4?s=100" width="100px;" alt="Ronald"/><br /><sub><b>Ronald</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3ABASSMAN" title="Bug reports">🐛</a> <a href="#financial-BASSMAN" title="Financial">💵</a></td>
      <td align="center"><a href="https://github.com/Simon-Claudius"><img src="https://avatars.githubusercontent.com/u/45047368?v=4?s=100" width="100px;" alt="Simon-Claudius"/><br /><sub><b>Simon-Claudius</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3ASimon-Claudius" title="Bug reports">🐛</a></td>
    </tr>
    <tr>
      <td align="center"><a href="https://scottspence.com/"><img src="https://avatars.githubusercontent.com/u/234708?v=4?s=100" width="100px;" alt="Scott Spence"/><br /><sub><b>Scott Spence</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3Aspences10" title="Bug reports">🐛</a></td>
      <td align="center"><a href="https://github.com/zhanghanduo"><img src="https://avatars.githubusercontent.com/u/8006682?v=4?s=100" width="100px;" alt="Zhang Handuo"/><br /><sub><b>Zhang Handuo</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3Azhanghanduo" title="Bug reports">🐛</a></td>
      <td align="center"><a href="https://serendipidata.com/"><img src="https://avatars.githubusercontent.com/u/9020979?v=4?s=100" width="100px;" alt="Cameron Yick"/><br /><sub><b>Cameron Yick</b></sub></a><br /><a href="#blog-hydrosquall" title="Blogposts">📝</a> <a href="https://github.com/dendronhq/dendron/commits?author=hydrosquall" title="Documentation">📖</a> <a href="https://github.com/dendronhq/dendron/commits?author=hydrosquall" title="Code">💻</a></td>
      <td align="center"><a href="https://github.com/tallguyjenks"><img src="https://avatars.githubusercontent.com/u/29872822?v=4?s=100" width="100px;" alt="Bryan Jenks"/><br /><sub><b>Bryan Jenks</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/commits?author=tallguyjenks" title="Documentation">📖</a> <a href="https://github.com/dendronhq/dendron/issues?q=author%3Atallguyjenks" title="Bug reports">🐛</a></td>
      <td align="center"><a href="https://wind13.gitee.io/"><img src="https://avatars.githubusercontent.com/u/1387020?v=4?s=100" width="100px;" alt="Simon J S Liu"/><br /><sub><b>Simon J S Liu</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3Awind13" title="Bug reports">🐛</a></td>
      <td align="center"><a href="https://github.com/b0xian"><img src="https://avatars.githubusercontent.com/u/53197915?v=4?s=100" width="100px;" alt="b0xian"/><br /><sub><b>b0xian</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3Ab0xian" title="Bug reports">🐛</a></td>
      <td align="center"><a href="http://orcomp.github.io/Blog"><img src="https://avatars.githubusercontent.com/u/2459973?v=4?s=100" width="100px;" alt="Orcomp"/><br /><sub><b>Orcomp</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3AOrcomp" title="Bug reports">🐛</a> <a href="https://github.com/dendronhq/dendron/commits?author=Orcomp" title="Documentation">📖</a></td>
    </tr>
    <tr>
      <td align="center"><a href="https://github.com/neupsh"><img src="https://avatars.githubusercontent.com/u/5186871?v=4?s=100" width="100px;" alt="Shekhar Neupane"/><br /><sub><b>Shekhar Neupane</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/commits?author=neupsh" title="Documentation">📖</a></td>
      <td align="center"><a href="https://github.com/af4jm"><img src="https://avatars.githubusercontent.com/u/849948?v=4?s=100" width="100px;" alt="John Meyer"/><br /><sub><b>John Meyer</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3Aaf4jm" title="Bug reports">🐛</a></td>
      <td align="center"><a href="https://github.com/iterating"><img src="https://avatars.githubusercontent.com/u/6834401?v=4?s=100" width="100px;" alt="John Young"/><br /><sub><b>John Young</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3Aiterating" title="Bug reports">🐛</a></td>
      <td align="center"><a href="http://a9.io/"><img src="https://avatars.githubusercontent.com/u/2660634?v=4?s=100" width="100px;" alt="Max Krieger"/><br /><sub><b>Max Krieger</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/commits?author=maxkrieger" title="Documentation">📖</a> <a href="#blog-maxkrieger" title="Blogposts">📝</a> <a href="https://github.com/dendronhq/dendron/issues?q=author%3Amaxkrieger" title="Bug reports">🐛</a></td>
      <td align="center"><a href="http://alanionita.github.io/"><img src="https://avatars.githubusercontent.com/u/8453106?v=4?s=100" width="100px;" alt="Alan Ionita"/><br /><sub><b>Alan Ionita</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/commits?author=alanionita" title="Documentation">📖</a></td>
      <td align="center"><a href="https://www.xypnox.com/"><img src="https://avatars.githubusercontent.com/u/25076171?v=4?s=100" width="100px;" alt=" Aditya"/><br /><sub><b> Aditya</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3Axypnox" title="Bug reports">🐛</a></td>
      <td align="center"><a href="https://github.com/gjroelofs"><img src="https://avatars.githubusercontent.com/u/398630?v=4?s=100" width="100px;" alt="Gijs-Jan Roelofs"/><br /><sub><b>Gijs-Jan Roelofs</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3Agjroelofs" title="Bug reports">🐛</a></td>
    </tr>
    <tr>
      <td align="center"><a href="https://github.com/vivkr"><img src="https://avatars.githubusercontent.com/u/41533822?v=4?s=100" width="100px;" alt="Vivek Raja"/><br /><sub><b>Vivek Raja</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3Avivkr" title="Bug reports">🐛</a></td>
      <td align="center"><a href="http://www.codefriar.com/"><img src="https://avatars.githubusercontent.com/u/642589?v=4?s=100" width="100px;" alt="Kevin Poorman"/><br /><sub><b>Kevin Poorman</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3Acodefriar" title="Bug reports">🐛</a></td>
      <td align="center"><a href="https://boa.nu/"><img src="https://avatars.githubusercontent.com/u/682676?v=4?s=100" width="100px;" alt="Lars Solberg"/><br /><sub><b>Lars Solberg</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3Axeor" title="Bug reports">🐛</a></td>
      <td align="center"><a href="https://github.com/8brandon"><img src="https://avatars.githubusercontent.com/u/34548660?v=4?s=100" width="100px;" alt="8brandon"/><br /><sub><b>8brandon</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/commits?author=8brandon" title="Code">💻</a></td>
      <td align="center"><a href="https://github.com/aleksey-rowan"><img src="https://avatars.githubusercontent.com/u/79934725?v=4?s=100" width="100px;" alt="Aleksey Rowan"/><br /><sub><b>Aleksey Rowan</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/commits?author=aleksey-rowan" title="Code">💻</a> <a href="https://github.com/dendronhq/dendron/commits?author=aleksey-rowan" title="Documentation">📖</a> <a href="https://github.com/dendronhq/dendron/issues?q=author%3Aaleksey-rowan" title="Bug reports">🐛</a></td>
      <td align="center"><a href="https://github.com/pwright"><img src="https://avatars.githubusercontent.com/u/5154224?v=4?s=100" width="100px;" alt="Paul Wright"/><br /><sub><b>Paul Wright</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/commits?author=pwright" title="Documentation">📖</a></td>
      <td align="center"><a href="https://github.com/jeffbarr"><img src="https://avatars.githubusercontent.com/u/78832?v=4?s=100" width="100px;" alt="Jeff Barr"/><br /><sub><b>Jeff Barr</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/commits?author=jeffbarr" title="Documentation">📖</a></td>
    </tr>
    <tr>
      <td align="center"><a href="https://skrider.dendron.wiki/"><img src="https://avatars.githubusercontent.com/u/72541272?v=4?s=100" width="100px;" alt="Stephen Krider"/><br /><sub><b>Stephen Krider</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/commits?author=skrider" title="Documentation">📖</a></td>
      <td align="center"><a href="https://nikitavoloboev.xyz/"><img src="https://avatars.githubusercontent.com/u/6391776?v=4?s=100" width="100px;" alt="Nikita Voloboev"/><br /><sub><b>Nikita Voloboev</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/commits?author=nikitavoloboev" title="Code">💻</a></td>
      <td align="center"><a href="https://github.com/jasonsjones"><img src="https://avatars.githubusercontent.com/u/515798?v=4?s=100" width="100px;" alt="Jason Jones"/><br /><sub><b>Jason Jones</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/commits?author=jasonsjones" title="Documentation">📖</a></td>
      <td align="center"><a href="https://github.com/hikchoi"><img src="https://avatars.githubusercontent.com/u/1219789?v=4?s=100" width="100px;" alt="Mark Hyunik Choi"/><br /><sub><b>Mark Hyunik Choi</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/commits?author=hikchoi" title="Code">💻</a> <a href="https://github.com/dendronhq/dendron/issues?q=author%3Ahikchoi" title="Bug reports">🐛</a> <a href="#mentoring-hikchoi" title="Mentoring">🧑‍🏫</a> <a href="https://github.com/dendronhq/dendron/commits?author=hikchoi" title="Documentation">📖</a> <a href="#blog-hikchoi" title="Blogposts">📝</a></td>
      <td align="center"><a href="http://de.linkedin.com/in/spex66/"><img src="https://avatars.githubusercontent.com/u/1098323?v=4?s=100" width="100px;" alt="Peter Arwanitis"/><br /><sub><b>Peter Arwanitis</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3Aspex66" title="Bug reports">🐛</a></td>
      <td align="center"><a href="https://github.com/flammehawk"><img src="https://avatars.githubusercontent.com/u/57394581?v=4?s=100" width="100px;" alt="flammehawk"/><br /><sub><b>flammehawk</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/commits?author=flammehawk" title="Documentation">📖</a> <a href="#financial-flammehawk" title="Financial">💵</a> <a href="https://github.com/dendronhq/dendron/commits?author=flammehawk" title="Code">💻</a></td>
      <td align="center"><a href="https://thence.io/"><img src="https://avatars.githubusercontent.com/u/409321?v=4?s=100" width="100px;" alt="Kevin Lin"/><br /><sub><b>Kevin Lin</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/commits?author=kevinslin" title="Code">💻</a> <a href="#mentoring-kevinslin" title="Mentoring">🧑‍🏫</a> <a href="https://github.com/dendronhq/dendron/commits?author=kevinslin" title="Documentation">📖</a> <a href="#blog-kevinslin" title="Blogposts">📝</a> <a href="https://github.com/dendronhq/dendron/issues?q=author%3Akevinslin" title="Bug reports">🐛</a></td>
    </tr>
    <tr>
      <td align="center"><a href="https://github.com/kpathakota"><img src="https://avatars.githubusercontent.com/u/1484475?v=4?s=100" width="100px;" alt="Kiran Pathakota"/><br /><sub><b>Kiran Pathakota</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/commits?author=kpathakota" title="Code">💻</a> <a href="#mentoring-kpathakota" title="Mentoring">🧑‍🏫</a> <a href="https://github.com/dendronhq/dendron/commits?author=kpathakota" title="Documentation">📖</a> <a href="#blog-kpathakota" title="Blogposts">📝</a> <a href="https://github.com/dendronhq/dendron/issues?q=author%3Akpathakota" title="Bug reports">🐛</a></td>
      <td align="center"><a href="https://github.com/jn64"><img src="https://avatars.githubusercontent.com/u/23169302?v=4?s=100" width="100px;" alt="jn64"/><br /><sub><b>jn64</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3Ajn64" title="Bug reports">🐛</a></td>
      <td align="center"><a href="https://github.com/RafaelCotrim"><img src="https://avatars.githubusercontent.com/u/46679150?v=4?s=100" width="100px;" alt="Thelusion"/><br /><sub><b>Thelusion</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3ARafaelCotrim" title="Bug reports">🐛</a></td>
      <td align="center"><a href="https://github.com/vicrdguez"><img src="https://avatars.githubusercontent.com/u/52254255?v=4?s=100" width="100px;" alt="Víctor Reyes Rodríguez"/><br /><sub><b>Víctor Reyes Rodríguez</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3Avicrdguez" title="Bug reports">🐛</a></td>
      <td align="center"><a href="https://github.com/funnym0nk3y"><img src="https://avatars.githubusercontent.com/u/41870754?v=4?s=100" width="100px;" alt="funnym0nk3y"/><br /><sub><b>funnym0nk3y</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3Afunnym0nk3y" title="Bug reports">🐛</a></td>
      <td align="center"><a href="https://github.com/sidwellr"><img src="https://avatars.githubusercontent.com/u/28679642?v=4?s=100" width="100px;" alt="sidwellr"/><br /><sub><b>sidwellr</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3Asidwellr" title="Bug reports">🐛</a></td>
      <td align="center"><a href="https://github.com/ddbrierton"><img src="https://avatars.githubusercontent.com/u/7255543?v=4?s=100" width="100px;" alt="Darren Brierton"/><br /><sub><b>Darren Brierton</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3Addbrierton" title="Bug reports">🐛</a></td>
    </tr>
    <tr>
      <td align="center"><a href="https://github.com/timDeHof"><img src="https://avatars.githubusercontent.com/u/2568193?v=4?s=100" width="100px;" alt="timDeHof"/><br /><sub><b>timDeHof</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3AtimDeHof" title="Bug reports">🐛</a></td>
      <td align="center"><a href="https://github.com/singlebunglemrbungle"><img src="https://avatars.githubusercontent.com/u/84944869?v=4?s=100" width="100px;" alt="singlebungle"/><br /><sub><b>singlebungle</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3Asinglebunglemrbungle" title="Bug reports">🐛</a></td>
      <td align="center"><a href="https://github.com/ElliotPsyIT"><img src="https://avatars.githubusercontent.com/u/1060159?v=4?s=100" width="100px;" alt="elliotfielstein"/><br /><sub><b>elliotfielstein</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3AElliotPsyIT" title="Bug reports">🐛</a></td>
      <td align="center"><a href="https://github.com/jonathanyeung"><img src="https://avatars.githubusercontent.com/u/3203268?v=4?s=100" width="100px;" alt="jonathanyeung"/><br /><sub><b>jonathanyeung</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/commits?author=jonathanyeung" title="Code">💻</a></td>
      <td align="center"><a href="https://github.com/SR--"><img src="https://avatars.githubusercontent.com/u/1008059?v=4?s=100" width="100px;" alt="SR--"/><br /><sub><b>SR--</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/commits?author=SR--" title="Documentation">📖</a> <a href="https://github.com/dendronhq/dendron/issues?q=author%3ASR--" title="Bug reports">🐛</a> <a href="https://github.com/dendronhq/dendron/commits?author=SR--" title="Code">💻</a></td>
      <td align="center"><a href="https://github.com/gamtiq"><img src="https://avatars.githubusercontent.com/u/1177323?v=4?s=100" width="100px;" alt="Denis Sikuler"/><br /><sub><b>Denis Sikuler</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/commits?author=gamtiq" title="Documentation">📖</a></td>
      <td align="center"><a href="https://github.com/matchavez"><img src="https://avatars.githubusercontent.com/u/1787040?v=4?s=100" width="100px;" alt="Mat Chavez"/><br /><sub><b>Mat Chavez</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3Amatchavez" title="Bug reports">🐛</a></td>
    </tr>
    <tr>
      <td align="center"><a href="https://github.com/micharris42"><img src="https://avatars.githubusercontent.com/u/76890677?v=4?s=100" width="100px;" alt="micharris42"/><br /><sub><b>micharris42</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3Amicharris42" title="Bug reports">🐛</a> <a href="https://github.com/dendronhq/dendron/commits?author=micharris42" title="Documentation">📖</a></td>
      <td align="center"><a href="https://github.com/teauxfu"><img src="https://avatars.githubusercontent.com/u/1144380?v=4?s=100" width="100px;" alt="teauxfu"/><br /><sub><b>teauxfu</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/commits?author=teauxfu" title="Documentation">📖</a></td>
      <td align="center"><a href="https://github.com/andrey-jef"><img src="https://avatars.githubusercontent.com/u/81280428?v=4?s=100" width="100px;" alt="andrey-jef"/><br /><sub><b>andrey-jef</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/commits?author=andrey-jef" title="Documentation">📖</a> <a href="https://github.com/dendronhq/dendron/issues?q=author%3Aandrey-jef" title="Bug reports">🐛</a></td>
      <td align="center"><a href="https://github.com/namjul"><img src="https://avatars.githubusercontent.com/u/328836?v=4?s=100" width="100px;" alt="Samuel Hobl"/><br /><sub><b>Samuel Hobl</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/commits?author=namjul" title="Code">💻</a> <a href="https://github.com/dendronhq/dendron/commits?author=namjul" title="Documentation">📖</a> <a href="#tool-namjul" title="Tools">🔧</a></td>
      <td align="center"><a href="https://github.com/apastuszak"><img src="https://avatars.githubusercontent.com/u/3401054?v=4?s=100" width="100px;" alt="apastuszak"/><br /><sub><b>apastuszak</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3Aapastuszak" title="Bug reports">🐛</a> <a href="https://github.com/dendronhq/dendron/commits?author=apastuszak" title="Documentation">📖</a></td>
      <td align="center"><a href="https://github.com/felipewhitaker"><img src="https://avatars.githubusercontent.com/u/36129486?v=4?s=100" width="100px;" alt="Felipe Whitaker"/><br /><sub><b>Felipe Whitaker</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/commits?author=felipewhitaker" title="Documentation">📖</a></td>
      <td align="center"><a href="https://github.com/unamusedmon"><img src="https://avatars.githubusercontent.com/u/65274123?v=4?s=100" width="100px;" alt="unamusedmon"/><br /><sub><b>unamusedmon</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3Aunamusedmon" title="Bug reports">🐛</a></td>
    </tr>
    <tr>
      <td align="center"><a href="https://github.com/kimds91"><img src="https://avatars.githubusercontent.com/u/11445901?v=4?s=100" width="100px;" alt="Do Soon Kim"/><br /><sub><b>Do Soon Kim</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3Akimds91" title="Bug reports">🐛</a></td>
      <td align="center"><a href="https://github.com/gereleth"><img src="https://avatars.githubusercontent.com/u/6080076?v=4?s=100" width="100px;" alt="Daria Vasyukova"/><br /><sub><b>Daria Vasyukova</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3Agereleth" title="Bug reports">🐛</a></td>
      <td align="center"><a href="https://github.com/djradon"><img src="https://avatars.githubusercontent.com/u/5224156?v=4?s=100" width="100px;" alt="Dave Richardson"/><br /><sub><b>Dave Richardson</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3Adjradon" title="Bug reports">🐛</a> <a href="https://github.com/dendronhq/dendron/commits?author=djradon" title="Documentation">📖</a></td>
      <td align="center"><a href="http://me-ding-fan.vercel.app"><img src="https://avatars.githubusercontent.com/u/26438549?v=4?s=100" width="100px;" alt="Ding"/><br /><sub><b>Ding</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/commits?author=Ding-Fan" title="Documentation">📖</a> <a href="https://github.com/dendronhq/dendron/issues?q=author%3ADing-Fan" title="Bug reports">🐛</a></td>
      <td align="center"><a href="https://github.com/nz-john"><img src="https://avatars.githubusercontent.com/u/89765379?v=4?s=100" width="100px;" alt="John"/><br /><sub><b>John</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3Anz-john" title="Bug reports">🐛</a></td>
      <td align="center"><a href="http://hoppertech.net"><img src="https://avatars.githubusercontent.com/u/35973180?v=4?s=100" width="100px;" alt="Jeff Hopper"/><br /><sub><b>Jeff Hopper</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3AHopperTech" title="Bug reports">🐛</a></td>
      <td align="center"><a href="http://www.ryanpatrickrandall.com"><img src="https://avatars.githubusercontent.com/u/850915?v=4?s=100" width="100px;" alt="Ryan Randall"/><br /><sub><b>Ryan Randall</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3Aryan-p-randall" title="Bug reports">🐛</a> <a href="https://github.com/dendronhq/dendron/commits?author=ryan-p-randall" title="Documentation">📖</a></td>
    </tr>
    <tr>
      <td align="center"><a href="https://github.com/CyberFoxar"><img src="https://avatars.githubusercontent.com/u/1347036?v=4?s=100" width="100px;" alt="CyberFoxar"/><br /><sub><b>CyberFoxar</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3ACyberFoxar" title="Bug reports">🐛</a></td>
      <td align="center"><a href="https://bri.tt"><img src="https://avatars.githubusercontent.com/u/68?v=4?s=100" width="100px;" alt="Britt Selvitelle"/><br /><sub><b>Britt Selvitelle</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3Abs" title="Bug reports">🐛</a> <a href="#financial-bs" title="Financial">💵</a> <a href="https://github.com/dendronhq/dendron/commits?author=bs" title="Documentation">📖</a> <a href="https://github.com/dendronhq/dendron/commits?author=bs" title="Code">💻</a></td>
      <td align="center"><a href="https://github.com/lenamio"><img src="https://avatars.githubusercontent.com/u/20296489?v=4?s=100" width="100px;" alt="lenamio"/><br /><sub><b>lenamio</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/commits?author=lenamio" title="Documentation">📖</a></td>
      <td align="center"><a href="https://github.com/santosh898"><img src="https://avatars.githubusercontent.com/u/25878108?v=4?s=100" width="100px;" alt="Sai Santosh"/><br /><sub><b>Sai Santosh</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/commits?author=santosh898" title="Code">💻</a></td>
      <td align="center"><a href="https://github.com/viztor"><img src="https://avatars.githubusercontent.com/u/3511050?v=4?s=100" width="100px;" alt="viz"/><br /><sub><b>viz</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/commits?author=viztor" title="Code">💻</a> <a href="https://github.com/dendronhq/dendron/commits?author=viztor" title="Documentation">📖</a></td>
      <td align="center"><a href="http://jay-ding.pages.dev"><img src="https://avatars.githubusercontent.com/u/69938575?v=4?s=100" width="100px;" alt="Jminding"/><br /><sub><b>Jminding</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/commits?author=Jminding" title="Documentation">📖</a></td>
      <td align="center"><a href="http://orsvarn.com"><img src="https://avatars.githubusercontent.com/u/1719884?v=4?s=100" width="100px;" alt="Lukas Orsvärn"/><br /><sub><b>Lukas Orsvärn</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3Alukors" title="Bug reports">🐛</a></td>
    </tr>
    <tr>
      <td align="center"><a href="https://github.com/sotn3m"><img src="https://avatars.githubusercontent.com/u/11821473?v=4?s=100" width="100px;" alt="sotn3m"/><br /><sub><b>sotn3m</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3Asotn3m" title="Bug reports">🐛</a></td>
      <td align="center"><a href="https://github.com/codeluggage"><img src="https://avatars.githubusercontent.com/u/1154150?v=4?s=100" width="100px;" alt="Matias Forbord"/><br /><sub><b>Matias Forbord</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/commits?author=codeluggage" title="Documentation">📖</a></td>
      <td align="center"><a href="https://github.com/Tycholiz"><img src="https://avatars.githubusercontent.com/u/39745457?v=4?s=100" width="100px;" alt="Kyle Tycholiz"/><br /><sub><b>Kyle Tycholiz</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3ATycholiz" title="Bug reports">🐛</a> <a href="https://github.com/dendronhq/dendron/commits?author=Tycholiz" title="Documentation">📖</a></td>
      <td align="center"><a href="https://github.com/Stedag"><img src="https://avatars.githubusercontent.com/u/5147273?v=4?s=100" width="100px;" alt="Stedag"/><br /><sub><b>Stedag</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/commits?author=Stedag" title="Code">💻</a></td>
      <td align="center"><a href="https://github.com/doctorboyMP"><img src="https://avatars.githubusercontent.com/u/24513363?v=4?s=100" width="100px;" alt="Miguel Pereira"/><br /><sub><b>Miguel Pereira</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/commits?author=doctorboyMP" title="Documentation">📖</a> <a href="https://github.com/dendronhq/dendron/issues?q=author%3AdoctorboyMP" title="Bug reports">🐛</a></td>
      <td align="center"><a href="https://blog.dend.ro/"><img src="https://avatars.githubusercontent.com/u/308347?v=4?s=100" width="100px;" alt="Laurențiu Nicola"/><br /><sub><b>Laurențiu Nicola</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3Alnicola" title="Bug reports">🐛</a> <a href="https://github.com/dendronhq/dendron/commits?author=lnicola" title="Documentation">📖</a></td>
      <td align="center"><a href="http://www.ericmarthinsen.com"><img src="https://avatars.githubusercontent.com/u/135033?v=4?s=100" width="100px;" alt="Eric Marthinsen"/><br /><sub><b>Eric Marthinsen</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3Aemarthinsen" title="Bug reports">🐛</a></td>
    </tr>
    <tr>
      <td align="center"><a href="https://dorety.dev"><img src="https://avatars.githubusercontent.com/u/36145101?v=4?s=100" width="100px;" alt="Jonathan Dorety"/><br /><sub><b>Jonathan Dorety</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/commits?author=jdorety" title="Documentation">📖</a></td>
      <td align="center"><a href="http://bcdef.org"><img src="https://avatars.githubusercontent.com/u/142472?v=4?s=100" width="100px;" alt="Buck DeFore"/><br /><sub><b>Buck DeFore</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/commits?author=bdefore" title="Documentation">📖</a></td>
      <td align="center"><a href="https://bandism.net/"><img src="https://avatars.githubusercontent.com/u/22633385?v=4?s=100" width="100px;" alt="Ikko Ashimine"/><br /><sub><b>Ikko Ashimine</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/commits?author=eltociear" title="Documentation">📖</a> <a href="https://github.com/dendronhq/dendron/commits?author=eltociear" title="Tests">⚠️</a></td>
      <td align="center"><a href="https://github.com/simkimsia"><img src="https://avatars.githubusercontent.com/u/245021?v=4?s=100" width="100px;" alt="simkimsia"/><br /><sub><b>simkimsia</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3Asimkimsia" title="Bug reports">🐛</a> <a href="#financial-simkimsia" title="Financial">💵</a> <a href="#tutorial-simkimsia" title="Tutorials">✅</a> <a href="https://github.com/dendronhq/dendron/commits?author=simkimsia" title="Documentation">📖</a> <a href="#example-simkimsia" title="Examples">💡</a></td>
      <td align="center"><a href="https://github.com/demorganslaw"><img src="https://avatars.githubusercontent.com/u/88507322?v=4?s=100" width="100px;" alt="demorganslaw"/><br /><sub><b>demorganslaw</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3Ademorganslaw" title="Bug reports">🐛</a></td>
      <td align="center"><a href="https://github.com/guilhermesfc"><img src="https://avatars.githubusercontent.com/u/10503773?v=4?s=100" width="100px;" alt="guilhermesfc"/><br /><sub><b>guilhermesfc</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3Aguilhermesfc" title="Bug reports">🐛</a></td>
      <td align="center"><a href="http://gazit.me"><img src="https://avatars.githubusercontent.com/u/22723?v=4?s=100" width="100px;" alt="Idan Gazit"/><br /><sub><b>Idan Gazit</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3Aidan" title="Bug reports">🐛</a></td>
    </tr>
    <tr>
      <td align="center"><a href="https://github.com/ragamroll"><img src="https://avatars.githubusercontent.com/u/3618625?v=4?s=100" width="100px;" alt="ragamroll"/><br /><sub><b>ragamroll</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3Aragamroll" title="Bug reports">🐛</a></td>
      <td align="center"><a href="https://github.com/voothi"><img src="https://avatars.githubusercontent.com/u/9587340?v=4?s=100" width="100px;" alt="Denis Novikov"/><br /><sub><b>Denis Novikov</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3Avoothi" title="Bug reports">🐛</a> <a href="#content-voothi" title="Content">🖋</a></td>
      <td align="center"><a href="https://github.com/mhijazi1"><img src="https://avatars.githubusercontent.com/u/5711555?v=4?s=100" width="100px;" alt="Mo"/><br /><sub><b>Mo</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3Amhijazi1" title="Bug reports">🐛</a></td>
      <td align="center"><a href="https://github.com/cconrad"><img src="https://avatars.githubusercontent.com/u/584491?v=4?s=100" width="100px;" alt="Claus Conrad"/><br /><sub><b>Claus Conrad</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3Acconrad" title="Bug reports">🐛</a> <a href="https://github.com/dendronhq/dendron/commits?author=cconrad" title="Documentation">📖</a> <a href="#financial-cconrad" title="Financial">💵</a></td>
      <td align="center"><a href="https://github.com/johndendron"><img src="https://avatars.githubusercontent.com/u/89761127?v=4?s=100" width="100px;" alt="johndendron"/><br /><sub><b>johndendron</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3Ajohndendron" title="Bug reports">🐛</a></td>
      <td align="center"><a href="http://aaronmeese.com"><img src="https://avatars.githubusercontent.com/u/17814535?v=4?s=100" width="100px;" alt="Aaron Meese"/><br /><sub><b>Aaron Meese</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/commits?author=ajmeese7" title="Documentation">📖</a></td>
      <td align="center"><a href="https://github.com/JeffTeter"><img src="https://avatars.githubusercontent.com/u/13050714?v=4?s=100" width="100px;" alt="Jeff Teter"/><br /><sub><b>Jeff Teter</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3AJeffTeter" title="Bug reports">🐛</a></td>
    </tr>
    <tr>
      <td align="center"><a href="https://github.com/mrajaram"><img src="https://avatars.githubusercontent.com/u/615159?v=4?s=100" width="100px;" alt="Mari Rajaram"/><br /><sub><b>Mari Rajaram</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/commits?author=mrajaram" title="Documentation">📖</a></td>
      <td align="center"><a href="https://github.com/l2dy"><img src="https://avatars.githubusercontent.com/u/14329097?v=4?s=100" width="100px;" alt="Zero King"/><br /><sub><b>Zero King</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/commits?author=l2dy" title="Code">💻</a> <a href="https://github.com/dendronhq/dendron/issues?q=author%3Al2dy" title="Bug reports">🐛</a></td>
      <td align="center"><a href="https://github.com/benhsm"><img src="https://avatars.githubusercontent.com/u/93843523?v=4?s=100" width="100px;" alt="benhsm"/><br /><sub><b>benhsm</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/commits?author=benhsm" title="Documentation">📖</a> <a href="https://github.com/dendronhq/dendron/commits?author=benhsm" title="Code">💻</a></td>
      <td align="center"><a href="https://github.com/icedwater"><img src="https://avatars.githubusercontent.com/u/144799?v=4?s=100" width="100px;" alt="icedwater"/><br /><sub><b>icedwater</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3Aicedwater" title="Bug reports">🐛</a> <a href="https://github.com/dendronhq/dendron/commits?author=icedwater" title="Code">💻</a></td>
      <td align="center"><a href="http://mstempl.netlify.app"><img src="https://avatars.githubusercontent.com/u/3171330?v=4?s=100" width="100px;" alt="Bassmann"/><br /><sub><b>Bassmann</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3ABassmann" title="Bug reports">🐛</a></td>
      <td align="center"><a href="https://quanta.money"><img src="https://avatars.githubusercontent.com/u/81030?v=4?s=100" width="100px;" alt="Im"/><br /><sub><b>Im</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3Aimmartian" title="Bug reports">🐛</a></td>
      <td align="center"><a href="http://www.okam.ca"><img src="https://avatars.githubusercontent.com/u/30426?v=4?s=100" width="100px;" alt="David Paquet Pitts"/><br /><sub><b>David Paquet Pitts</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3Adavidpp" title="Bug reports">🐛</a></td>
    </tr>
    <tr>
      <td align="center"><a href="http://www.greatworx.com"><img src="https://avatars.githubusercontent.com/u/3717?v=4?s=100" width="100px;" alt="John Wells"/><br /><sub><b>John Wells</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/commits?author=d1rewolf" title="Documentation">📖</a></td>
      <td align="center"><a href="https://luke.carrier.im/"><img src="https://avatars.githubusercontent.com/u/597015?v=4?s=100" width="100px;" alt="Luke Carrier"/><br /><sub><b>Luke Carrier</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3ALukeCarrier" title="Bug reports">🐛</a> <a href="https://github.com/dendronhq/dendron/commits?author=LukeCarrier" title="Documentation">📖</a> <a href="https://github.com/dendronhq/dendron/commits?author=LukeCarrier" title="Code">💻</a></td>
      <td align="center"><a href="https://github.com/maximilianigl"><img src="https://avatars.githubusercontent.com/u/4333579?v=4?s=100" width="100px;" alt="maximilianigl"/><br /><sub><b>maximilianigl</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3Amaximilianigl" title="Bug reports">🐛</a></td>
      <td align="center"><a href="http://byroni.us"><img src="https://avatars.githubusercontent.com/u/495404?v=4?s=100" width="100px;" alt="byron wall"/><br /><sub><b>byron wall</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/commits?author=byronwall" title="Documentation">📖</a></td>
      <td align="center"><a href="http://carloscamara.es/en"><img src="https://avatars.githubusercontent.com/u/706549?v=4?s=100" width="100px;" alt="Carlos Cámara"/><br /><sub><b>Carlos Cámara</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/commits?author=ccamara" title="Documentation">📖</a> <a href="https://github.com/dendronhq/dendron/issues?q=author%3Accamara" title="Bug reports">🐛</a></td>
      <td align="center"><a href="https://github.com/garranplum"><img src="https://avatars.githubusercontent.com/u/9744747?v=4?s=100" width="100px;" alt="Garran Plum"/><br /><sub><b>Garran Plum</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3Agarranplum" title="Bug reports">🐛</a> <a href="https://github.com/dendronhq/dendron/commits?author=garranplum" title="Code">💻</a></td>
      <td align="center"><a href="https://github.com/tma66"><img src="https://avatars.githubusercontent.com/u/1160589?v=4?s=100" width="100px;" alt="tma66"/><br /><sub><b>tma66</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/commits?author=tma66" title="Code">💻</a></td>
    </tr>
    <tr>
      <td align="center"><a href="https://github.com/not-so-smart"><img src="https://avatars.githubusercontent.com/u/43360094?v=4?s=100" width="100px;" alt="not-so-smart"/><br /><sub><b>not-so-smart</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/commits?author=not-so-smart" title="Documentation">📖</a></td>
      <td align="center"><a href="https://github.com/jsamr"><img src="https://avatars.githubusercontent.com/u/3646758?v=4?s=100" width="100px;" alt="Jules Sam. Randolph"/><br /><sub><b>Jules Sam. Randolph</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3Ajsamr" title="Bug reports">🐛</a></td>
      <td align="center"><a href="https://github.com/blu3r4y"><img src="https://avatars.githubusercontent.com/u/10400532?v=4?s=100" width="100px;" alt="Mario Kahlhofer"/><br /><sub><b>Mario Kahlhofer</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3Ablu3r4y" title="Bug reports">🐛</a></td>
      <td align="center"><a href="https://github.com/tolikkostin"><img src="https://avatars.githubusercontent.com/u/26538478?v=4?s=100" width="100px;" alt="Anatoliy Kostin"/><br /><sub><b>Anatoliy Kostin</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3Atolikkostin" title="Bug reports">🐛</a></td>
      <td align="center"><a href="https://github.com/r-good"><img src="https://avatars.githubusercontent.com/u/95871742?v=4?s=100" width="100px;" alt="r-good"/><br /><sub><b>r-good</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3Ar-good" title="Bug reports">🐛</a></td>
      <td align="center"><a href="http://sagar.se"><img src="https://avatars.githubusercontent.com/u/1622959?v=4?s=100" width="100px;" alt="Sagar Behere"/><br /><sub><b>Sagar Behere</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3Asagarbehere" title="Bug reports">🐛</a></td>
      <td align="center"><a href="http://nicklas.gummesson.net"><img src="https://avatars.githubusercontent.com/u/978461?v=4?s=100" width="100px;" alt="Nicklas Gummesson"/><br /><sub><b>Nicklas Gummesson</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3Aviddo" title="Bug reports">🐛</a> <a href="https://github.com/dendronhq/dendron/commits?author=viddo" title="Code">💻</a></td>
    </tr>
    <tr>
      <td align="center"><a href="https://github.com/jquesada2016"><img src="https://avatars.githubusercontent.com/u/54370171?v=4?s=100" width="100px;" alt="jquesada2016"/><br /><sub><b>jquesada2016</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3Ajquesada2016" title="Bug reports">🐛</a> <a href="https://github.com/dendronhq/dendron/commits?author=jquesada2016" title="Documentation">📖</a></td>
      <td align="center"><a href="https://github.com/phanirithvij"><img src="https://avatars.githubusercontent.com/u/29627898?v=4?s=100" width="100px;" alt="Phani Rithvij"/><br /><sub><b>Phani Rithvij</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3Aphanirithvij" title="Bug reports">🐛</a></td>
      <td align="center"><a href="https://github.com/kzilla-git"><img src="https://avatars.githubusercontent.com/u/12721315?v=4?s=100" width="100px;" alt="Kumudan"/><br /><sub><b>Kumudan</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3Akzilla-git" title="Bug reports">🐛</a></td>
      <td align="center"><a href="https://github.com/zersiax"><img src="https://avatars.githubusercontent.com/u/5076383?v=4?s=100" width="100px;" alt="Florian Beijers"/><br /><sub><b>Florian Beijers</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3Azersiax" title="Bug reports">🐛</a> <a href="#a11y-zersiax" title="Accessibility">️️️️♿️</a></td>
      <td align="center"><a href="https://github.com/rlh1994"><img src="https://avatars.githubusercontent.com/u/8260415?v=4?s=100" width="100px;" alt="Ryan Hill"/><br /><sub><b>Ryan Hill</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/commits?author=rlh1994" title="Documentation">📖</a> <a href="https://github.com/dendronhq/dendron/issues?q=author%3Arlh1994" title="Bug reports">🐛</a> <a href="https://github.com/dendronhq/dendron/commits?author=rlh1994" title="Code">💻</a></td>
      <td align="center"><a href="https://WikiEducator.org/User:JimTittsler"><img src="https://avatars.githubusercontent.com/u/180326?v=4?s=100" width="100px;" alt="Jim Tittsler"/><br /><sub><b>Jim Tittsler</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/commits?author=jimt" title="Documentation">📖</a></td>
      <td align="center"><a href="http://aphorica.com"><img src="https://avatars.githubusercontent.com/u/161474?v=4?s=100" width="100px;" alt="Rick Berger"/><br /><sub><b>Rick Berger</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3Arickbsgu" title="Bug reports">🐛</a></td>
    </tr>
    <tr>
      <td align="center"><a href="https://github.com/ThibaultNocchi"><img src="https://avatars.githubusercontent.com/u/1619359?v=4?s=100" width="100px;" alt="Thibault"/><br /><sub><b>Thibault</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3AThibaultNocchi" title="Bug reports">🐛</a></td>
      <td align="center"><a href="https://github.com/redsolver"><img src="https://avatars.githubusercontent.com/u/30355444?v=4?s=100" width="100px;" alt="redsolver"/><br /><sub><b>redsolver</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3Aredsolver" title="Bug reports">🐛</a></td>
      <td align="center"><a href="https://github.com/NahomBefekadu"><img src="https://avatars.githubusercontent.com/u/58083518?v=4?s=100" width="100px;" alt="NahomBefekadu"/><br /><sub><b>NahomBefekadu</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3ANahomBefekadu" title="Bug reports">🐛</a></td>
      <td align="center"><a href="https://github.com/jaroslavknotek"><img src="https://avatars.githubusercontent.com/u/46137238?v=4?s=100" width="100px;" alt="jaroslavknotek"/><br /><sub><b>jaroslavknotek</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3Ajaroslavknotek" title="Bug reports">🐛</a></td>
      <td align="center"><a href="https://github.com/foldsters"><img src="https://avatars.githubusercontent.com/u/37962412?v=4?s=100" width="100px;" alt="Matthew Giallourakis"/><br /><sub><b>Matthew Giallourakis</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3Afoldsters" title="Bug reports">🐛</a></td>
      <td align="center"><a href="https://github.com/themurtazanazir"><img src="https://avatars.githubusercontent.com/u/34167018?v=4?s=100" width="100px;" alt="Murtaza Nazir"/><br /><sub><b>Murtaza Nazir</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3Athemurtazanazir" title="Bug reports">🐛</a></td>
      <td align="center"><a href="https://github.com/emmjayvee"><img src="https://avatars.githubusercontent.com/u/38247440?v=4?s=100" width="100px;" alt="emmjayvee"/><br /><sub><b>emmjayvee</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/commits?author=emmjayvee" title="Documentation">📖</a></td>
    </tr>
    <tr>
      <td align="center"><a href="https://github.com/dagilleland"><img src="https://avatars.githubusercontent.com/u/2947017?v=4?s=100" width="100px;" alt="Dan Gilleland"/><br /><sub><b>Dan Gilleland</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/commits?author=dagilleland" title="Documentation">📖</a></td>
      <td align="center"><a href="https://www.hrmnjt.dev"><img src="https://avatars.githubusercontent.com/u/10371494?v=4?s=100" width="100px;" alt="Harman"/><br /><sub><b>Harman</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/commits?author=hrmnjt" title="Documentation">📖</a></td>
      <td align="center"><a href="https://github.com/aglucky"><img src="https://avatars.githubusercontent.com/u/37425558?v=4?s=100" width="100px;" alt="Adam G"/><br /><sub><b>Adam G</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3Aaglucky" title="Bug reports">🐛</a> <a href="https://github.com/dendronhq/dendron/commits?author=aglucky" title="Documentation">📖</a></td>
      <td align="center"><a href="https://github.com/Chisomo-Chiweza"><img src="https://avatars.githubusercontent.com/u/64413744?v=4?s=100" width="100px;" alt="Chisomo Chiweza"/><br /><sub><b>Chisomo Chiweza</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3AChisomo-Chiweza" title="Bug reports">🐛</a></td>
      <td align="center"><a href="https://github.com/rzd-test"><img src="https://avatars.githubusercontent.com/u/97254261?v=4?s=100" width="100px;" alt="rzd-test"/><br /><sub><b>rzd-test</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3Arzd-test" title="Bug reports">🐛</a></td>
      <td align="center"><a href="http://www.carmenbianca.eu"><img src="https://avatars.githubusercontent.com/u/12065945?v=4?s=100" width="100px;" alt="Carmen Bianca Bakker"/><br /><sub><b>Carmen Bianca Bakker</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/commits?author=carmenbianca" title="Documentation">📖</a> <a href="#example-carmenbianca" title="Examples">💡</a></td>
      <td align="center"><a href="https://github.com/KamQb"><img src="https://avatars.githubusercontent.com/u/76776123?v=4?s=100" width="100px;" alt="KamQb"/><br /><sub><b>KamQb</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/commits?author=KamQb" title="Code">💻</a></td>
    </tr>
    <tr>
      <td align="center"><a href="https://github.com/sahil48"><img src="https://avatars.githubusercontent.com/u/6100774?v=4?s=100" width="100px;" alt="sahil48"/><br /><sub><b>sahil48</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3Asahil48" title="Bug reports">🐛</a></td>
      <td align="center"><a href="https://invak.id/"><img src="https://avatars.githubusercontent.com/u/38114607?v=4?s=100" width="100px;" alt="Tsvetomir Bonev"/><br /><sub><b>Tsvetomir Bonev</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3Ainvakid404" title="Bug reports">🐛</a> <a href="https://github.com/dendronhq/dendron/commits?author=invakid404" title="Code">💻</a> <a href="#tool-invakid404" title="Tools">🔧</a></td>
      <td align="center"><a href="https://github.com/imalightbulb"><img src="https://avatars.githubusercontent.com/u/66677431?v=4?s=100" width="100px;" alt="I'm a lightbulb"/><br /><sub><b>I'm a lightbulb</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3Aimalightbulb" title="Bug reports">🐛</a></td>
      <td align="center"><a href="https://github.com/henry-js"><img src="https://avatars.githubusercontent.com/u/79054685?v=4?s=100" width="100px;" alt="James"/><br /><sub><b>James</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3Ahenry-js" title="Bug reports">🐛</a> <a href="https://github.com/dendronhq/dendron/commits?author=henry-js" title="Documentation">📖</a></td>
      <td align="center"><a href="http://www.callum-macdonald.com/"><img src="https://avatars.githubusercontent.com/u/690997?v=4?s=100" width="100px;" alt="Callum Macdonald"/><br /><sub><b>Callum Macdonald</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/commits?author=chmac" title="Code">💻</a> <a href="https://github.com/dendronhq/dendron/issues?q=author%3Achmac" title="Bug reports">🐛</a> <a href="https://github.com/dendronhq/dendron/commits?author=chmac" title="Documentation">📖</a></td>
      <td align="center"><a href="https://github.com/skfile"><img src="https://avatars.githubusercontent.com/u/60110907?v=4?s=100" width="100px;" alt="Vik"/><br /><sub><b>Vik</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/commits?author=skfile" title="Code">💻</a></td>
      <td align="center"><a href="https://davidsec.blog"><img src="https://avatars.githubusercontent.com/u/10091092?v=4?s=100" width="100px;" alt="David Gomes"/><br /><sub><b>David Gomes</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3ALegendL3n" title="Bug reports">🐛</a></td>
    </tr>
    <tr>
      <td align="center"><a href="https://github.com/Binly42"><img src="https://avatars.githubusercontent.com/u/15514941?v=4?s=100" width="100px;" alt="Binly42"/><br /><sub><b>Binly42</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3ABinly42" title="Bug reports">🐛</a></td>
      <td align="center"><a href="https://github.com/eleweek"><img src="https://avatars.githubusercontent.com/u/1133550?v=4?s=100" width="100px;" alt="Alexander Putilin"/><br /><sub><b>Alexander Putilin</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/commits?author=eleweek" title="Code">💻</a></td>
      <td align="center"><a href="https://github.com/pvorona"><img src="https://avatars.githubusercontent.com/u/11915087?v=4?s=100" width="100px;" alt="Pavel Vorona"/><br /><sub><b>Pavel Vorona</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/commits?author=pvorona" title="Code">💻</a></td>
      <td align="center"><a href="https://github.com/dweisiger"><img src="https://avatars.githubusercontent.com/u/13951458?v=4?s=100" width="100px;" alt="d1onysus"/><br /><sub><b>d1onysus</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/commits?author=dweisiger" title="Documentation">📖</a> <a href="https://github.com/dendronhq/dendron/issues?q=author%3Adweisiger" title="Bug reports">🐛</a></td>
      <td align="center"><a href="https://billmoriarty.com"><img src="https://avatars.githubusercontent.com/u/463054?v=4?s=100" width="100px;" alt="Bill Moriarty"/><br /><sub><b>Bill Moriarty</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3ABillMoriarty" title="Bug reports">🐛</a></td>
      <td align="center"><a href="https://ScriptOps.com"><img src="https://avatars.githubusercontent.com/u/362756?v=4?s=100" width="100px;" alt="Jamie Bilinski"/><br /><sub><b>Jamie Bilinski</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/commits?author=jbilinski" title="Documentation">📖</a></td>
      <td align="center"><a href="https://thanoslefteris.com"><img src="https://avatars.githubusercontent.com/u/64284?v=4?s=100" width="100px;" alt="Thanos Lefteris"/><br /><sub><b>Thanos Lefteris</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3Aalefteris" title="Bug reports">🐛</a> <a href="https://github.com/dendronhq/dendron/commits?author=alefteris" title="Code">💻</a></td>
    </tr>
    <tr>
      <td align="center"><a href="http://hotsixredbull.blogspot.kr/"><img src="https://avatars.githubusercontent.com/u/7041617?v=4?s=100" width="100px;" alt="Yi Seunggi"/><br /><sub><b>Yi Seunggi</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3AhotSixRedBull" title="Bug reports">🐛</a></td>
      <td align="center"><a href="https://github.com/joshuajeschek"><img src="https://avatars.githubusercontent.com/u/64850647?v=4?s=100" width="100px;" alt="Joshua Jeschek"/><br /><sub><b>Joshua Jeschek</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3Ajoshuajeschek" title="Bug reports">🐛</a></td>
      <td align="center"><a href="https://ko-fi.com/skepticmystic"><img src="https://avatars.githubusercontent.com/u/70717676?v=4?s=100" width="100px;" alt="SkepticMystic"/><br /><sub><b>SkepticMystic</b></sub></a><br /><a href="#tool-SkepticMystic" title="Tools">🔧</a></td>
      <td align="center"><a href="https://github.com/raeyulca"><img src="https://avatars.githubusercontent.com/u/56777335?v=4?s=100" width="100px;" alt="raeyulca"/><br /><sub><b>raeyulca</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3Araeyulca" title="Bug reports">🐛</a></td>
      <td align="center"><a href="https://github.com/Kyleskiller"><img src="https://avatars.githubusercontent.com/u/66365977?v=4?s=100" width="100px;" alt="Sam Wagner"/><br /><sub><b>Sam Wagner</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3AKyleskiller" title="Bug reports">🐛</a></td>
      <td align="center"><a href="https://github.com/fatman-"><img src="https://avatars.githubusercontent.com/u/1256084?v=4?s=100" width="100px;" alt="Sai Kishore Komanduri"/><br /><sub><b>Sai Kishore Komanduri</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/commits?author=fatman-" title="Documentation">📖</a></td>
      <td align="center"><a href="http://sheinlinphyo.com"><img src="https://avatars.githubusercontent.com/u/13214144?v=4?s=100" width="100px;" alt="Shein Lin Phyo"/><br /><sub><b>Shein Lin Phyo</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/commits?author=Penguinlay" title="Documentation">📖</a></td>
    </tr>
    <tr>
      <td align="center"><a href="http://www.patrickyates.me/"><img src="https://avatars.githubusercontent.com/u/2180488?v=4?s=100" width="100px;" alt="Patrick Yates"/><br /><sub><b>Patrick Yates</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/commits?author=opcon" title="Documentation">📖</a> <a href="https://github.com/dendronhq/dendron/commits?author=opcon" title="Code">💻</a></td>
      <td align="center"><a href="https://trevorsullivan.net"><img src="https://avatars.githubusercontent.com/u/466713?v=4?s=100" width="100px;" alt="Trevor Sullivan"/><br /><sub><b>Trevor Sullivan</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3Apcgeek86" title="Bug reports">🐛</a></td>
      <td align="center"><a href="https://github.com/13013SwagR"><img src="https://avatars.githubusercontent.com/u/32471663?v=4?s=100" width="100px;" alt="Vincent Dansereau"/><br /><sub><b>Vincent Dansereau</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/commits?author=13013SwagR" title="Documentation">📖</a></td>
      <td align="center"><a href="https://github.com/novelhawk"><img src="https://avatars.githubusercontent.com/u/10281615?v=4?s=100" width="100px;" alt="Raffaello Fraboni"/><br /><sub><b>Raffaello Fraboni</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3Anovelhawk" title="Bug reports">🐛</a></td>
      <td align="center"><a href="https://github.com/Xanaxus"><img src="https://avatars.githubusercontent.com/u/53279068?v=4?s=100" width="100px;" alt="Xanaxus"/><br /><sub><b>Xanaxus</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3AXanaxus" title="Bug reports">🐛</a></td>
      <td align="center"><a href="https://github.com/Gander7"><img src="https://avatars.githubusercontent.com/u/4229134?v=4?s=100" width="100px;" alt="Gander7"/><br /><sub><b>Gander7</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3AGander7" title="Bug reports">🐛</a></td>
      <td align="center"><a href="https://github.com/jgmpjgmp"><img src="https://avatars.githubusercontent.com/u/100956804?v=4?s=100" width="100px;" alt="jgmpjgmp"/><br /><sub><b>jgmpjgmp</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3Ajgmpjgmp" title="Bug reports">🐛</a></td>
    </tr>
    <tr>
      <td align="center"><a href="https://jirawut.com"><img src="https://avatars.githubusercontent.com/u/45286033?v=4?s=100" width="100px;" alt="Non-J"/><br /><sub><b>Non-J</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3ANon-J" title="Bug reports">🐛</a></td>
      <td align="center"><a href="https://github.com/fnurl"><img src="https://avatars.githubusercontent.com/u/106794?v=4?s=100" width="100px;" alt="Jody Foo"/><br /><sub><b>Jody Foo</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3Afnurl" title="Bug reports">🐛</a> <a href="https://github.com/dendronhq/dendron/commits?author=fnurl" title="Documentation">📖</a> <a href="#example-fnurl" title="Examples">💡</a></td>
      <td align="center"><a href="https://gitlab.com/dagriefaa"><img src="https://avatars.githubusercontent.com/u/39538526?v=4?s=100" width="100px;" alt="Raymond K"/><br /><sub><b>Raymond K</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3Adagriefaa" title="Bug reports">🐛</a></td>
      <td align="center"><a href="https://github.com/jhoan2"><img src="https://avatars.githubusercontent.com/u/67968051?v=4?s=100" width="100px;" alt="John Hoang"/><br /><sub><b>John Hoang</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3Ajhoan2" title="Bug reports">🐛</a></td>
      <td align="center"><a href="https://github.com/nickolay-kondratyev"><img src="https://avatars.githubusercontent.com/u/4050134?v=4?s=100" width="100px;" alt="Nickolay Kondratyev"/><br /><sub><b>Nickolay Kondratyev</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3Anickolay-kondratyev" title="Bug reports">🐛</a></td>
      <td align="center"><a href="https://github.com/mysoonyu"><img src="https://avatars.githubusercontent.com/u/64881900?v=4?s=100" width="100px;" alt="mysoonyu"/><br /><sub><b>mysoonyu</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3Amysoonyu" title="Bug reports">🐛</a></td>
      <td align="center"><a href="https://github.com/gbieging"><img src="https://avatars.githubusercontent.com/u/14062649?v=4?s=100" width="100px;" alt="gbieging"/><br /><sub><b>gbieging</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3Agbieging" title="Bug reports">🐛</a></td>
    </tr>
    <tr>
      <td align="center"><a href="https://github.com/oolonek"><img src="https://avatars.githubusercontent.com/u/2760049?v=4?s=100" width="100px;" alt="oolonek"/><br /><sub><b>oolonek</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3Aoolonek" title="Bug reports">🐛</a></td>
      <td align="center"><a href="https://github.com/Mettcon"><img src="https://avatars.githubusercontent.com/u/14955363?v=4?s=100" width="100px;" alt="Mettcon"/><br /><sub><b>Mettcon</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3AMettcon" title="Bug reports">🐛</a></td>
      <td align="center"><a href="https://github.com/LamentConfiguration"><img src="https://avatars.githubusercontent.com/u/15186074?v=4?s=100" width="100px;" alt="LamentConfiguration"/><br /><sub><b>LamentConfiguration</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3ALamentConfiguration" title="Bug reports">🐛</a></td>
      <td align="center"><a href="https://github.com/irishandyb"><img src="https://avatars.githubusercontent.com/u/23081516?v=4?s=100" width="100px;" alt="irishandyb"/><br /><sub><b>irishandyb</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3Airishandyb" title="Bug reports">🐛</a></td>
      <td align="center"><a href="https://github.com/PabloLION"><img src="https://avatars.githubusercontent.com/u/36828324?v=4?s=100" width="100px;" alt="PabloLION"/><br /><sub><b>PabloLION</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/commits?author=PabloLION" title="Code">💻</a></td>
      <td align="center"><a href="http://dmytro-shapovalov"><img src="https://avatars.githubusercontent.com/u/35997118?v=4?s=100" width="100px;" alt="Dmytro Shapovalov"/><br /><sub><b>Dmytro Shapovalov</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/commits?author=dmytro-shapovalov" title="Documentation">📖</a> <a href="#example-dmytro-shapovalov" title="Examples">💡</a></td>
      <td align="center"><a href="https://github.com/lexthanthree"><img src="https://avatars.githubusercontent.com/u/43601654?v=4?s=100" width="100px;" alt="lexthanthree"/><br /><sub><b>lexthanthree</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/commits?author=lexthanthree" title="Documentation">📖</a> <a href="https://github.com/dendronhq/dendron/issues?q=author%3Alexthanthree" title="Bug reports">🐛</a></td>
    </tr>
    <tr>
      <td align="center"><a href="https://glitchbyte.iuo"><img src="https://avatars.githubusercontent.com/u/49317853?v=4?s=100" width="100px;" alt="GlitchByte"/><br /><sub><b>GlitchByte</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3AMrGlitchByte" title="Bug reports">🐛</a></td>
      <td align="center"><a href="https://github.com/stevefan"><img src="https://avatars.githubusercontent.com/u/5408965?v=4?s=100" width="100px;" alt="Steven Fan"/><br /><sub><b>Steven Fan</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3Astevefan" title="Bug reports">🐛</a></td>
      <td align="center"><a href="https://github.com/KucharczykL"><img src="https://avatars.githubusercontent.com/u/31072879?v=4?s=100" width="100px;" alt="Lukáš Kucharczyk"/><br /><sub><b>Lukáš Kucharczyk</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3AKucharczykL" title="Bug reports">🐛</a></td>
      <td align="center"><a href="https://github.com/danbburg"><img src="https://avatars.githubusercontent.com/u/6763573?v=4?s=100" width="100px;" alt="Daniel Brandenburg"/><br /><sub><b>Daniel Brandenburg</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3Adanbburg" title="Bug reports">🐛</a> <a href="https://github.com/dendronhq/dendron/commits?author=danbburg" title="Code">💻</a></td>
      <td align="center"><a href="https://github.com/paolodina"><img src="https://avatars.githubusercontent.com/u/1157401?v=4?s=100" width="100px;" alt="Paolo Dina"/><br /><sub><b>Paolo Dina</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/commits?author=paolodina" title="Documentation">📖</a></td>
      <td align="center"><a href="https://github.com/agichim"><img src="https://avatars.githubusercontent.com/u/51931067?v=4?s=100" width="100px;" alt="Alexandru Ichim"/><br /><sub><b>Alexandru Ichim</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/commits?author=agichim" title="Documentation">📖</a></td>
      <td align="center"><a href="http://icanteven.io"><img src="https://avatars.githubusercontent.com/u/5951023?v=4?s=100" width="100px;" alt="Derek Ardolf"/><br /><sub><b>Derek Ardolf</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/commits?author=ScriptAutomate" title="Documentation">📖</a></td>
    </tr>
    <tr>
      <td align="center"><a href="https://github.com/huland"><img src="https://avatars.githubusercontent.com/u/4936652?v=4?s=100" width="100px;" alt="huland"/><br /><sub><b>huland</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/commits?author=huland" title="Code">💻</a></td>
      <td align="center"><a href="https://vmasrani.github.io/"><img src="https://avatars.githubusercontent.com/u/3288149?v=4?s=100" width="100px;" alt="Vaden Masrani"/><br /><sub><b>Vaden Masrani</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3Avmasrani" title="Bug reports">🐛</a> <a href="#data-vmasrani" title="Data">🔣</a></td>
      <td align="center"><a href="https://github.com/ShanePerry"><img src="https://avatars.githubusercontent.com/u/2213561?v=4?s=100" width="100px;" alt="Shane Perry"/><br /><sub><b>Shane Perry</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/commits?author=ShanePerry" title="Documentation">📖</a></td>
      <td align="center"><a href="https://github.com/Aodhagan"><img src="https://avatars.githubusercontent.com/u/59316063?v=4?s=100" width="100px;" alt="aodhagan"/><br /><sub><b>aodhagan</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3Aaodhagan" title="Bug reports">🐛</a></td>
      <td align="center"><a href="https://github.com/harrijer"><img src="https://avatars.githubusercontent.com/u/87612241?v=4?s=100" width="100px;" alt="harrijer"/><br /><sub><b>harrijer</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3Aharrijer" title="Bug reports">🐛</a></td>
      <td align="center"><a href="https://pinchlime.com"><img src="https://avatars.githubusercontent.com/u/103130905?v=4?s=100" width="100px;" alt="P.J. Wu 吳秉儒"/><br /><sub><b>P.J. Wu 吳秉儒</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3Awupingju" title="Bug reports">🐛</a></td>
      <td align="center"><a href="https://github.com/AshSimmonds"><img src="https://avatars.githubusercontent.com/u/9034041?v=4?s=100" width="100px;" alt="AshSimmonds"/><br /><sub><b>AshSimmonds</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3AAshSimmonds" title="Bug reports">🐛</a> <a href="#content-AshSimmonds" title="Content">🖋</a></td>
    </tr>
    <tr>
      <td align="center"><a href="https://github.com/kulukimak"><img src="https://avatars.githubusercontent.com/u/6049780?v=4?s=100" width="100px;" alt="ManuelSpari"/><br /><sub><b>ManuelSpari</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3Akulukimak" title="Bug reports">🐛</a> <a href="https://github.com/dendronhq/dendron/commits?author=kulukimak" title="Code">💻</a></td>
      <td align="center"><a href="https://williamfaunce.dev/"><img src="https://avatars.githubusercontent.com/u/16312436?v=4?s=100" width="100px;" alt="William Faunce"/><br /><sub><b>William Faunce</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3AEngineerFaunce" title="Bug reports">🐛</a></td>
      <td align="center"><a href="https://github.com/ebromberg"><img src="https://avatars.githubusercontent.com/u/48656450?v=4?s=100" width="100px;" alt="ebromberg"/><br /><sub><b>ebromberg</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3Aebromberg" title="Bug reports">🐛</a></td>
      <td align="center"><a href="http://www.mshiltonj.com/"><img src="https://avatars.githubusercontent.com/u/25542?v=4?s=100" width="100px;" alt="Steven Hilton"/><br /><sub><b>Steven Hilton</b></sub></a><br /><a href="#tool-mshiltonj" title="Tools">🔧</a></td>
      <td align="center"><a href="https://github.com/taranlu-houzz"><img src="https://avatars.githubusercontent.com/u/52425255?v=4?s=100" width="100px;" alt="Taran Lu"/><br /><sub><b>Taran Lu</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3Ataranlu-houzz" title="Bug reports">🐛</a></td>
      <td align="center"><a href="http://klamann-it-beratung.de"><img src="https://avatars.githubusercontent.com/u/1001597?v=4?s=100" width="100px;" alt="Norbert Klamann"/><br /><sub><b>Norbert Klamann</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/commits?author=nklamann" title="Documentation">📖</a></td>
      <td align="center"><a href="https://github.com/Maarrk"><img src="https://avatars.githubusercontent.com/u/25253395?v=4?s=100" width="100px;" alt="Marek S. Łukasiewicz"/><br /><sub><b>Marek S. Łukasiewicz</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/commits?author=Maarrk" title="Documentation">📖</a> <a href="https://github.com/dendronhq/dendron/commits?author=Maarrk" title="Code">💻</a> <a href="#tool-Maarrk" title="Tools">🔧</a></td>
    </tr>
    <tr>
      <td align="center"><a href="https://github.com/abunavas"><img src="https://avatars.githubusercontent.com/u/11981078?v=4?s=100" width="100px;" alt="abunavas"/><br /><sub><b>abunavas</b></sub></a><br /><a href="#ideas-abunavas" title="Ideas, Planning, & Feedback">🤔</a></td>
      <td align="center"><a href="http://mihaiconstantin.com"><img src="https://avatars.githubusercontent.com/u/20051042?v=4?s=100" width="100px;" alt="Mihai Constantin"/><br /><sub><b>Mihai Constantin</b></sub></a><br /><a href="#tool-mihaiconstantin" title="Tools">🔧</a></td>
      <td align="center"><a href="https://github.com/rioka"><img src="https://avatars.githubusercontent.com/u/383147?v=4?s=100" width="100px;" alt="riccardo dozzo"/><br /><sub><b>riccardo dozzo</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3Arioka" title="Bug reports">🐛</a></td>
      <td align="center"><a href="https://github.com/bugfixd"><img src="https://avatars.githubusercontent.com/u/48696524?v=4?s=100" width="100px;" alt="bugfixd"/><br /><sub><b>bugfixd</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3Abugfixd" title="Bug reports">🐛</a></td>
      <td align="center"><a href="https://github.com/kfischer-okarin"><img src="https://avatars.githubusercontent.com/u/6623784?v=4?s=100" width="100px;" alt="Kevin Fischer"/><br /><sub><b>Kevin Fischer</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/commits?author=kfischer-okarin" title="Documentation">📖</a> <a href="#content-kfischer-okarin" title="Content">🖋</a></td>
      <td align="center"><a href="https://nikhiljha.com/"><img src="https://avatars.githubusercontent.com/u/2773700?v=4?s=100" width="100px;" alt="Nikhil Jha"/><br /><sub><b>Nikhil Jha</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3Anikhiljha" title="Bug reports">🐛</a></td>
      <td align="center"><a href="http://avhb.github.io"><img src="https://avatars.githubusercontent.com/u/66175168?v=4?s=100" width="100px;" alt="avhb"/><br /><sub><b>avhb</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/commits?author=avhb" title="Code">💻</a></td>
    </tr>
    <tr>
      <td align="center"><a href="https://github.com/cquick01"><img src="https://avatars.githubusercontent.com/u/72400253?v=4?s=100" width="100px;" alt="cquick01"/><br /><sub><b>cquick01</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3Acquick01" title="Bug reports">🐛</a> <a href="https://github.com/dendronhq/dendron/commits?author=cquick01" title="Code">💻</a></td>
      <td align="center"><a href="https://github.com/woodwm"><img src="https://avatars.githubusercontent.com/u/13971199?v=4?s=100" width="100px;" alt="Weiming"/><br /><sub><b>Weiming</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/commits?author=woodwm" title="Documentation">📖</a> <a href="#tutorial-woodwm" title="Tutorials">✅</a></td>
      <td align="center"><a href="http://in construction"><img src="https://avatars.githubusercontent.com/u/1572402?v=4?s=100" width="100px;" alt="José Longo"/><br /><sub><b>José Longo</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3Ajlongo" title="Bug reports">🐛</a></td>
      <td align="center"><a href="https://github.com/hateyouinfinity"><img src="https://avatars.githubusercontent.com/u/39856083?v=4?s=100" width="100px;" alt="ං"/><br /><sub><b>ං</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3Ahateyouinfinity" title="Bug reports">🐛</a></td>
      <td align="center"><a href="https://github.com/Phoebian"><img src="https://avatars.githubusercontent.com/u/11403336?v=4?s=100" width="100px;" alt="Phoebian"/><br /><sub><b>Phoebian</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/commits?author=Phoebian" title="Documentation">📖</a></td>
      <td align="center"><a href="https://soltorgsgymnasiet.se"><img src="https://avatars.githubusercontent.com/u/625655?v=4?s=100" width="100px;" alt="Patrik Grip-Jansson"/><br /><sub><b>Patrik Grip-Jansson</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/commits?author=kap42" title="Documentation">📖</a> <a href="https://github.com/dendronhq/dendron/issues?q=author%3Akap42" title="Bug reports">🐛</a></td>
      <td align="center"><a href="https://github.com/Sjiep"><img src="https://avatars.githubusercontent.com/u/5003111?v=4?s=100" width="100px;" alt="Robert van Kints"/><br /><sub><b>Robert van Kints</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3ASjiep" title="Bug reports">🐛</a></td>
    </tr>
    <tr>
      <td align="center"><a href="https://github.com/patchworquill"><img src="https://avatars.githubusercontent.com/u/6552507?v=4?s=100" width="100px;" alt="Patrick Wilkie"/><br /><sub><b>Patrick Wilkie</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3Apatchworquill" title="Bug reports">🐛</a></td>
      <td align="center"><a href="https://www.linkedin.com/in/michael-greene-8260004a/"><img src="https://avatars.githubusercontent.com/u/4068550?v=4?s=100" width="100px;" alt="Michael Greene"/><br /><sub><b>Michael Greene</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3AVoltCruelerz" title="Bug reports">🐛</a></td>
      <td align="center"><a href="https://liby.github.io/notes"><img src="https://avatars.githubusercontent.com/u/38807139?v=4?s=100" width="100px;" alt="Bryan Lee"/><br /><sub><b>Bryan Lee</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/commits?author=liby" title="Documentation">📖</a></td>
      <td align="center"><a href="https://github.com/Lodrus"><img src="https://avatars.githubusercontent.com/u/28769785?v=4?s=100" width="100px;" alt="Lodrus"/><br /><sub><b>Lodrus</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3ALodrus" title="Bug reports">🐛</a></td>
      <td align="center"><a href="https://github.com/rogue2971"><img src="https://avatars.githubusercontent.com/u/67639784?v=4?s=100" width="100px;" alt="rogue2971"/><br /><sub><b>rogue2971</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3Arogue2971" title="Bug reports">🐛</a> <a href="#content-rogue2971" title="Content">🖋</a></td>
      <td align="center"><a href="https://github.com/doylejg"><img src="https://avatars.githubusercontent.com/u/6617453?v=4?s=100" width="100px;" alt="doylejg"/><br /><sub><b>doylejg</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3Adoylejg" title="Bug reports">🐛</a></td>
      <td align="center"><a href="https://github.com/eshoberg"><img src="https://avatars.githubusercontent.com/u/20173856?v=4?s=100" width="100px;" alt="Virile"/><br /><sub><b>Virile</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3Aeshoberg" title="Bug reports">🐛</a></td>
    </tr>
    <tr>
      <td align="center"><a href="https://github.com/cbenz"><img src="https://avatars.githubusercontent.com/u/12686?v=4?s=100" width="100px;" alt="Christophe Benz"/><br /><sub><b>Christophe Benz</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/commits?author=cbenz" title="Documentation">📖</a></td>
      <td align="center"><a href="https://github.com/samuelxyz"><img src="https://avatars.githubusercontent.com/u/41557313?v=4?s=100" width="100px;" alt="Tanamr"/><br /><sub><b>Tanamr</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3Asamuelxyz" title="Bug reports">🐛</a></td>
      <td align="center"><a href="https://github.com/cwtowns"><img src="https://avatars.githubusercontent.com/u/24421652?v=4?s=100" width="100px;" alt="cwtowns"/><br /><sub><b>cwtowns</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3Acwtowns" title="Bug reports">🐛</a></td>
      <td align="center"><a href="https://github.com/HenryC-3"><img src="https://avatars.githubusercontent.com/u/41246463?v=4?s=100" width="100px;" alt="Henry"/><br /><sub><b>Henry</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3AHenryC-3" title="Bug reports">🐛</a></td>
      <td align="center"><a href="https://github.com/bj0"><img src="https://avatars.githubusercontent.com/u/1139347?v=4?s=100" width="100px;" alt="Brian Parma"/><br /><sub><b>Brian Parma</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3Abj0" title="Bug reports">🐛</a></td>
      <td align="center"><a href="https://github.com/vladsanchez"><img src="https://avatars.githubusercontent.com/u/702225?v=4?s=100" width="100px;" alt="Vladimir Sanchez"/><br /><sub><b>Vladimir Sanchez</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/commits?author=vladsanchez" title="Documentation">📖</a></td>
      <td align="center"><a href="https://github.com/wbpayne22902"><img src="https://avatars.githubusercontent.com/u/107161609?v=4?s=100" width="100px;" alt="Wilhelm Payne"/><br /><sub><b>Wilhelm Payne</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3Awbpayne22902" title="Bug reports">🐛</a></td>
    </tr>
    <tr>
      <td align="center"><a href="https://github.com/Alecton4"><img src="https://avatars.githubusercontent.com/u/43232804?v=4?s=100" width="100px;" alt="Yttrium ZHAO"/><br /><sub><b>Yttrium ZHAO</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3AAlecton4" title="Bug reports">🐛</a></td>
      <td align="center"><a href="https://github.com/saifahn"><img src="https://avatars.githubusercontent.com/u/9913851?v=4?s=100" width="100px;" alt="Sean Li"/><br /><sub><b>Sean Li</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/commits?author=saifahn" title="Code">💻</a></td>
      <td align="center"><a href="https://github.com/bigheadghost"><img src="https://avatars.githubusercontent.com/u/1214531?v=4?s=100" width="100px;" alt="bigheadghost"/><br /><sub><b>bigheadghost</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3Abigheadghost" title="Bug reports">🐛</a></td>
      <td align="center"><a href="https://github.com/swithun-liu"><img src="https://avatars.githubusercontent.com/u/42160297?v=4?s=100" width="100px;" alt="Swithun"/><br /><sub><b>Swithun</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3Aswithun-liu" title="Bug reports">🐛</a></td>
      <td align="center"><a href="https://github.com/NuclearPowerNerd"><img src="https://avatars.githubusercontent.com/u/58567518?v=4?s=100" width="100px;" alt="NuclearPowerNerd"/><br /><sub><b>NuclearPowerNerd</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3ANuclearPowerNerd" title="Bug reports">🐛</a></td>
      <td align="center"><a href="https://ghanvik.github.io/"><img src="https://avatars.githubusercontent.com/u/38922566?v=4?s=100" width="100px;" alt="Vikram G"/><br /><sub><b>Vikram G</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/commits?author=ghanvik" title="Code">💻</a></td>
      <td align="center"><a href="https://github.com/ericthomas1"><img src="https://avatars.githubusercontent.com/u/42788729?v=4?s=100" width="100px;" alt="ericthomas1"/><br /><sub><b>ericthomas1</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3Aericthomas1" title="Bug reports">🐛</a></td>
    </tr>
    <tr>
      <td align="center"><a href="https://github.com/jeep"><img src="https://avatars.githubusercontent.com/u/89500?v=4?s=100" width="100px;" alt="jeep"/><br /><sub><b>jeep</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3Ajeep" title="Bug reports">🐛</a></td>
      <td align="center"><a href="https://www.linkedin.com/in/vianneystroebel/"><img src="https://avatars.githubusercontent.com/u/628818?v=4?s=100" width="100px;" alt="Vianney Stroebel"/><br /><sub><b>Vianney Stroebel</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3Avibl" title="Bug reports">🐛</a></td>
      <td align="center"><a href="https://mivanit.github.io"><img src="https://avatars.githubusercontent.com/u/19347900?v=4?s=100" width="100px;" alt="mivanit"/><br /><sub><b>mivanit</b></sub></a><br /><a href="#tool-mivanit" title="Tools">🔧</a></td>
      <td align="center"><a href="https://github.com/tjr357"><img src="https://avatars.githubusercontent.com/u/97111937?v=4?s=100" width="100px;" alt="tjr357"/><br /><sub><b>tjr357</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3Atjr357" title="Bug reports">🐛</a></td>
      <td align="center"><a href="https://github.com/pedrolimasi"><img src="https://avatars.githubusercontent.com/u/44039025?v=4?s=100" width="100px;" alt="Pedro"/><br /><sub><b>Pedro</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3Apedrolimasi" title="Bug reports">🐛</a></td>
      <td align="center"><a href="https://github.com/JM-Laurel"><img src="https://avatars.githubusercontent.com/u/43501511?v=4?s=100" width="100px;" alt="JM-Laurel"/><br /><sub><b>JM-Laurel</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3AJM-Laurel" title="Bug reports">🐛</a></td>
      <td align="center"><a href="http://twitter.com/roblourens"><img src="https://avatars.githubusercontent.com/u/323878?v=4?s=100" width="100px;" alt="Rob Lourens"/><br /><sub><b>Rob Lourens</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3Aroblourens" title="Bug reports">🐛</a></td>
    </tr>
    <tr>
      <td align="center"><a href="http://forivall.com"><img src="https://avatars.githubusercontent.com/u/760204?v=4?s=100" width="100px;" alt="Emily Marigold Klassen"/><br /><sub><b>Emily Marigold Klassen</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3Aforivall" title="Bug reports">🐛</a></td>
      <td align="center"><a href="https://github.com/Harshita-mindfire"><img src="https://avatars.githubusercontent.com/u/84971366?v=4?s=100" width="100px;" alt="Harshita Joshi"/><br /><sub><b>Harshita Joshi</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3AHarshita-mindfire" title="Bug reports">🐛</a></td>
      <td align="center"><a href="http://leskinen.ru"><img src="https://avatars.githubusercontent.com/u/9257451?v=4?s=100" width="100px;" alt="KitLeskinen"/><br /><sub><b>KitLeskinen</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3AKitLeskinen" title="Bug reports">🐛</a></td>
      <td align="center"><a href="https://github.com/Braweria"><img src="https://avatars.githubusercontent.com/u/62669899?v=4?s=100" width="100px;" alt="Wiktoria Mielcarek"/><br /><sub><b>Wiktoria Mielcarek</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3ABraweria" title="Bug reports">🐛</a></td>
      <td align="center"><a href="http://www.allison-bellows.com"><img src="https://avatars.githubusercontent.com/u/25647843?v=4?s=100" width="100px;" alt="Allison Bellows"/><br /><sub><b>Allison Bellows</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3Aallibell" title="Bug reports">🐛</a></td>
      <td align="center"><a href="http://gresch.io"><img src="https://avatars.githubusercontent.com/u/7924413?v=4?s=100" width="100px;" alt="Karsten Gresch"/><br /><sub><b>Karsten Gresch</b></sub></a><br /><a href="https://github.com/dendronhq/dendron/issues?q=author%3Akarstengresch" title="Bug reports">🐛</a></td>
    </tr>
  </tbody>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

([emoji key](https://allcontributors.org/docs/en/emoji-key)):

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. We welcome community contributions and pull requests. See the [Dendron development guide](https://docs.dendron.so/notes/3489b652-cd0e-4ac8-a734-08094dc043eb/) for information on how to set up a development environment and submit code.



## License

Dendron is distributed under the Apache License, Version 2.0.

See [LICENSE](https://github.com/dendronhq/dendron/blob/master/LICENSE.md) and [NOTICE](https://github.com/dendronhq/dendron/blob/master/NOTICE.md) for more information.
