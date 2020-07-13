# Lookup

To work with notes, Dendron uses  **lookups**. Lookups help you navigate a hierarchal corpus of notes.

## Simple Example

Below is an example of a simple two level hierarchy with notes on various [command line interface](https://en.wikipedia.org/wiki/Command-line_interface) commands. Use `CMD+L` (we are going to use mac keybindings for this tutorial) to bring up the lookup and try some of the following queries.

```
- cli.tar
- cli.curl
- cli.dig
```
![](https://foundation-prod-assetspublic53c57cce-8cpvgjldwysl.s3-us-west-2.amazonaws.com/assets/images/lookup-cli.gif)
## Creating Notes

While we call it the `Lookup Bar`, you can also use it to create notes that don't exist. When you lookup for a note that hasn't been created, Dendron will create it for you. 

To try it yourself, bring up the lookup bar. Type `dendron.lookup.hello` and hit `Enter`.

Dendron is all about reducing the friction between you and the information you care about. Therefore, there is no difference between entering and looking for information.

After you've created the note, you can click the 'x' next to the tab to come back to this screen.


## Deleting Notes

To delete [[dendron.lookup.hello]], use the `CMD-SHIFT-D` shortcut on the note that you want to delete. Alternatively, you can also launch the `Command Bar` and type `Dendron: Delete Node` 


After a note has been deleted, we automatically surface the parent note (in this case, [[dendron.lookup]]). 


##  Next
Now that you've seen some of the things you can lookup, its time we talk about [[schemas | dendron.schema]]. Click the link or type `dendron.schema` to continue.

