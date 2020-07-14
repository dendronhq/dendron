### What if I have existing notes?

You can use Dendron with existing repositories of markdown notes. 

Open the `Command Bar` in vscode and use the `Dendron: Change Workspace` command. It will ask you for a folder path as input.

Dendron will create a `dendron.code-workspace` file in specified directory and then open the workspace (if a workspace file already exists, it will use that). It will also create a `root.md` file in that directory if it doesn't exist (currently this is part of the internal working of dendron). 

Dendron **does not** delete or overwrite any files during the **Change Workspace** operation. 