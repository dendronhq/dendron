# Lookup

To work with notes, Dendron uses what we call **lookups**. Lookups help you navigate a hierarchal corpus of notes.

Hierarchal lookup is a better way of finding information when you have a lot of notes. It makes use of the hierarchical nature of your notes to quickly filter down to the specific note that you need.

## Simple Example

Below is an example of a simple two level hierarchy with notes on various [command line interface](TODO) commands.
Try some of the following lookups to get a feel for it.  

```
- cli.tar
- cli.curl
- cli.dig
```
![Lookup Notes Simple](assets/dendron-lookup-simple.gif)

## Creating Notes

While we call it the `Lookup Bar`, `Lookup` is actually a misnomer because you can also use it to create notes. Whenever you're looking for a note that doesn't exist, Dendron will create it.

Use `CTRl-P` to bring up the lookup bar. Type `dendron.lookup.hello` and hit `Enter`.

![Create Note](assets/dendron-open-create.gif)

Even though the note didn't exist, Dendron created it through the act of you looking it up. 

Dendron is all about reducing the friction between you and the information you care about. Therefore, there is no difference between entering and looking for information.

After you've created the note, you can click the 'x' next to the tab to come back to this screen.


## Deleting Notes

To delete a note, you can use the `CTRL-SHIFT-D` shortcut on the note that you want to delete. Alternatively, you can also launch the `Command Bar` and type `Dendron: Delete Node` 

To delete [[dendron.lookup.hello]], open the note and then use `CTRL-SHIFT-D` to delete.

![Delete Note](assets/dendron-delete.gif)


## Other Capabilities
Now that you've seen some of the things you can lookup, its time to go through the other capabilities you have with Dendron. Continue the tutorial by clicking [[dendron.capabilities]] or typing `dendron.capabilities` inside the lookup.
