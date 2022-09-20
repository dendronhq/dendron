import { TreeViewItemLabelTypeEnum } from "@dendronhq/common-all";
import assert from "assert";
import { container } from "tsyringe";
import { DendronEngineV3Web } from "../../../../engine/DendronEngineV3Web";
import { EngineNoteProvider } from "../../../../../views/common/treeview/EngineNoteProvider";
import { setupTestEngineContainer } from "../../../helpers/setupTestEngineContainer";

async function initializeEngineNoteProviderTest() {
  await setupTestEngineContainer();

  const engine = container.resolve(DendronEngineV3Web);

  await engine.init();
}

suite("GIVEN an EngineNoteProvider", () => {
  test("WHEN the tree is revealed as part of initialization THEN the right nodes structure is returned", async () => {
    await initializeEngineNoteProviderTest();
    const noteProvider = container.resolve(EngineNoteProvider);

    // An argument-less getChildren() call is always necessary to first
    // initialize the tree (this mirrors what vscode internals will do)
    const root = await noteProvider.getChildren();
    assert.strictEqual(root?.length, 1);
    assert.strictEqual(root[0], "root");

    const rootChildren = await noteProvider.getChildren("root");
    assert.strictEqual(rootChildren?.length, 3);

    const fooChildren = await noteProvider.getChildren("foo");
    assert.strictEqual(fooChildren?.length, 2);
    const fooCh1Children = await noteProvider.getChildren("foo.ch1");
    assert.strictEqual(fooCh1Children?.length, 2);
    const fooCh2Children = await noteProvider.getChildren("foo.ch2");
    assert.strictEqual(fooCh2Children?.length, 0);
  });

  test("WHEN an unresolved node is prepped for reveal() THEN the ancestor chain is valid", async () => {
    await initializeEngineNoteProviderTest();
    const noteProvider = container.resolve(EngineNoteProvider);

    const root = await noteProvider.getChildren();
    assert.strictEqual(root?.length, 1);
    assert.strictEqual(root[0], "root");

    await noteProvider.prepNodeForReveal("bar.ch1.gch1.ggch1");
    assert.strictEqual(
      await noteProvider.getParent("bar.ch1.gch1.ggch1"),
      "bar.ch1.gch1"
    );
    assert.strictEqual("bar.ch1", await noteProvider.getParent("bar.ch1.gch1"));
    assert.strictEqual("bar", await noteProvider.getParent("bar.ch1"));
    assert.strictEqual("root", await noteProvider.getParent("bar"));
  });

  test("WHEN TreeItems are retrieved THEN correctly labeled items are returned", async () => {
    await initializeEngineNoteProviderTest();
    const noteProvider = container.resolve(EngineNoteProvider);

    // Add nodes to provider cache:
    await noteProvider.getChildren();
    await noteProvider.getChildren("foo");

    const rootTreeItem = await noteProvider.getTreeItem("root");
    assert.strictEqual(rootTreeItem.id, "root");
    assert.strictEqual(rootTreeItem.label, "root (vault1)");

    const fooTreeItem = await noteProvider.getTreeItem("foo");
    assert.strictEqual(fooTreeItem.id, "foo");
    assert.strictEqual(fooTreeItem.label, "foo");
  });

  test("WHEN label types are changed THEN item labels get updated", async () => {
    await initializeEngineNoteProviderTest();
    const noteProvider = container.resolve(EngineNoteProvider);

    // Add nodes to provider cache:
    await noteProvider.getChildren();
    await noteProvider.getChildren("foo");

    const fooTreeItem = await noteProvider.getTreeItem("foo");

    assert.strictEqual(fooTreeItem.label, "foo");

    await noteProvider.updateLabelType({
      labelType: TreeViewItemLabelTypeEnum.title,
    });

    const updatedFooTreeItem = await noteProvider.getTreeItem("foo");
    assert.strictEqual(updatedFooTreeItem.label, "Foo"); // The Title is capitalized
  });
});
