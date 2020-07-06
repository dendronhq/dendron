# Hierarchal Lookup

Hierarchal lookup is a better way of finding information when you have a lot of notes. It makes use of the hierarchical nature of your notes to quickly filter down to the specific note that you need.

Lookup is actually a bit of a misnomer because you can do more than just find notes - you can also create them if they don't exist.

Use `CTRl-P` to bring up the lookup bar. Type `dendron.f.lookup.hello` and hit `Enter`.

TODO: picture

Even though the note didn't exist, Dendron created it through the act of you looking it up. 

Dendron is all about reducing the friction between you and the information you care about. Therefore, there is no difference between entering and looking for information.

After you've created the note, you can click the 'x' next to the tab to come back to this screen.

## Simple Example

Below is a simple two level hierarchy of CLI commands.

```
- cli.tar
- cli.curl
- cli.dig
```
![Lookup Notes Simple](assets/dendron-lookup-simple.gif)

## Advanced Example

Here is a more involve hierarchy involving programming languages 

```sh
- lang.python
  - lan
  - lang.python.d.array
  - lang.python.d.string
  - lang.python.flow
  - lang.python.package
  - lang.python.io
  - lang.python.modules
  - lang.python.oo
```

![Lookup Notes Advanced](assets/dendron-lookup-advanced.gif)

Now that you've seen some of the things you can lookup, it's time to dive into the other major part of Dendron - [[dendron.f.schema]]
