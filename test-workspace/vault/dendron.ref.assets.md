---
id: Hf27I1UR3HvKyd6HRh8C0
title: Assets
desc: ''
updated: 1643206013490
created: 1637568178090
---

## PDF pasted with `Dendron: Paste File` command
 Should open the following assets with default app when clicking the link within preview:
* [dummy-pdf.pdf](assets/dummy-pdf.pdf) 
* [dummy-pdf.pdf](./assets/dummy-pdf.pdf) 
* [dummy-pdf.pdf](/assets/dummy-pdf.pdf)

* [with space encoded](assets/file%20with%20space.pdf)
* [with space encoded](./assets/file%20with%20space.pdf)
* [with space encoded](/assets/file%20with%20space.pdf)

* [with space wrapped](<assets/file with space.pdf>)
* [with space wrapped](<./assets/file with space.pdf>)
* [with space wrapped](</assets/file with space.pdf>)

- These shouldn't be render correctly. (thus unable to open)
    * [with space raw](assets/file with space.pdf)
    * [with space raw](./assets/file with space.pdf)
    * [with space raw](/assets/file with space.pdf)

## Regular navigation should still work
* Quick check navigate to this: [[dendron://assets/note-in-asset-vault]]
* Fuller check go to [[dendron.ref.links]]

## Images:
Refer to [[dendron.ref.image]]
