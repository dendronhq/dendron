---
id: kzry3qcy2y4ey1jcf1llajg
title: Rich Formatting
desc: "Text Formatting, Images, Formulas, and Diagrams"
updated: 1652280413439
created: 1652278089118
---

Dendron supports an extended Markdown syntax, which provides a lot of options for rich formatting. Take a look at some examples in this note to see what's possible. Have the preview pane opened (`Dendron: Show Preview`) to see how these will get rendered.

#### Markdown Formatting Options

| Formatting    |     Example     |
| :------------ | :-------------: |
| Bold          | **Hello World** |
| Italics       |  _Hello World_  |
| Strikethrough | ~~Hello World~~ |

#### Images

> 🌱 Copy any image onto your clipboard, and then use the `Paste Image` command while focused in your editor pane. This will automatically create a link for you and copy the file contents into the assets directory in your workspace.
> Sample Image Link:
> ![Dendron Logo](/assets/images/logo_small.png)

#### Equations

Math typesetting can be written through [Katex](https://wiki.dendron.so/notes/b1919663-cc48-4054-b0cf-4b26fe444907.html)

$$
\int_{-\infty}^\infty f(x)dx
$$

#### Diagrams

Various types of diagrams are supported with the [mermaid](https://mermaid-js.github.io/mermaid/#/) visualization syntax.

##### Flow Charts

```mermaid
graph TD;
    A-->B;
    A-->C;
```

##### Sequence Diagrams

```mermaid
sequenceDiagram
    participant Alice
    participant Bob
    Alice->>John: Hello John, how are you?
    John-->>Alice: Great!
    John->>Bob: How about you?
    Bob-->>John: Jolly good!
```

### Note References

You can link to a specific section of a different note and have the content in-lined into the current note.

![[tutorial#welcome-to-dendron:#*]]

[References Docs](https://wiki.dendron.so/notes/f1af56bb-db27-47ae-8406-61a98de6c78c.html#note-reference)

### Next Steps

- [[Conclude the Tutorial|tutorial.conclusion]]

---

[[Tutorial Home Page|tutorial]]
