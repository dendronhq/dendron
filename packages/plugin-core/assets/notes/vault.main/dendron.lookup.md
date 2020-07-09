# Lookup

To work with notes, Dendron uses  **lookups**. Lookups help you navigate a hierarchal corpus of notes.

## Simple Example

Below is an example of a simple two level hierarchy with notes on various [command line interface](https://en.wikipedia.org/wiki/Command-line_interface) commands. Use `CMD+L` (we are going to use mac keybindings for this tutorial) to bring up the lookup and try some of the following queries.

```
- cli.tar
- cli.curl
- cli.dig
```
![Lookup Notes Simple](assets/dendron-lookup-simple.gif)

## Creating Notes

While we call it the `Lookup Bar`, you can also use it to create notes that don't exist. When you lookup for a note that hasn't been created, Dendron will create it for you. 

To try it yourself, bring up the lookup bar. Type `dendron.lookup.hello` and hit `Enter`.

![Create Note](assets/dendron-create.gif)

Even though the note didn't exist, Dendron created it through the act of you looking it up. 

Dendron is all about reducing the friction between you and the information you care about. Therefore, there is no difference between entering and looking for information.

After you've created the note, you can click the 'x' next to the tab to come back to this screen.


## Deleting Notes

To delete [[dendron.lookup.hello]], use the `CMD-SHIFT-D` shortcut on the note that you want to delete. Alternatively, you can also launch the `Command Bar` and type `Dendron: Delete Node` 

![Delete Note](assets/dendron-delete.gif)

After a note has been deleted, we automatically surface the parent note (in this case, [[dendron.lookup]]). 


## Other Capabilities
Now that you've seen some of the things you can lookup, its time we talk about [[schemas | dendron.schema]]. Click the link or type `dendron.schema` to continue.

go through the other capabilities you have with Dendron. Continue the tutorial by clicking [[dendron.capabilities]] or typing `dendron.capabilities` inside the lookup.
