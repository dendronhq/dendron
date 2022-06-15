import {
  assertUnreachable,
  DendronTreeViewKey,
  VSCodeEvents,
} from "@dendronhq/common-all";
import * as vscode from "vscode";
import {
  Event,
  ProviderResult,
  ThemeIcon,
  TreeDataProvider,
  TreeItem,
  TreeItemCollapsibleState,
} from "vscode";
import { InstrumentedWrapperCommand } from "../commands/InstrumentedWrapperCommand";

enum MenuItem {
  getStarted = "Get Started",
  readDocs = "Read Documentation",
  seeFaqs = "See FAQ's",
  reviewIssues = "Review Issues",
  reportIssue = "Report Issue",
  joinCommunity = "Join our Community!",
  followUs = "Follow our Progress",
}

class HelpFeedbackTreeDataProvider implements TreeDataProvider<MenuItem> {
  ALL_ITEMS = Object.values(MenuItem) as MenuItem[];

  onDidChangeTreeData?: Event<void | MenuItem | null | undefined> | undefined;

  getTreeItem(element: MenuItem): TreeItem {
    let iconPath: vscode.ThemeIcon;
    let url = "";

    switch (element) {
      case MenuItem.getStarted:
        iconPath = new ThemeIcon("star");
        url =
          "https://wiki.dendron.so/notes/678c77d9-ef2c-4537-97b5-64556d6337f1/";
        break;

      case MenuItem.readDocs:
        iconPath = new ThemeIcon("book");
        url = "https://wiki.dendron.so/notes/FWtrGfE4YJc3j0yMNjBn5/";
        break;

      case MenuItem.seeFaqs:
        iconPath = new ThemeIcon("question");
        url =
          "https://wiki.dendron.so/notes/683740e3-70ce-4a47-a1f4-1f140e80b558/";
        break;

      case MenuItem.reviewIssues:
        iconPath = new ThemeIcon("issues");
        url = "https://github.com/dendronhq/dendron/issues";
        break;

      case MenuItem.reportIssue:
        iconPath = new ThemeIcon("comment");
        url = "https://github.com/dendronhq/dendron/issues/new/choose";
        break;

      case MenuItem.joinCommunity:
        iconPath = new ThemeIcon("organization");
        url = "https://discord.com/invite/xrKTUStHNZ";
        break;

      case MenuItem.followUs:
        iconPath = new ThemeIcon("twitter");
        url = "https://twitter.com/dendronhq";
        break;

      default:
        assertUnreachable(element);
    }

    const command = InstrumentedWrapperCommand.createVSCodeCommand({
      command: {
        title: "Help and Feedback",
        command: "vscode.open",
        arguments: [url],
      },
      event: VSCodeEvents.HelpAndFeedbackItemClicked,
      customProps: {
        menuItem: element,
      },
    });

    return {
      label: element.toString(),
      collapsibleState: TreeItemCollapsibleState.None,
      iconPath,
      command,
    };
  }
  getChildren(element?: MenuItem): ProviderResult<MenuItem[]> {
    switch (element) {
      case undefined:
        return this.ALL_ITEMS;
      default:
        return [];
    }
  }
}

/**
 * Creates a tree view for the basic 'Help and Feedback' panel in the Dendron
 * Custom View Container
 * @returns
 */
export default function setupHelpFeedbackTreeView(): vscode.TreeView<MenuItem> {
  return vscode.window.createTreeView(DendronTreeViewKey.HELP_AND_FEEDBACK, {
    treeDataProvider: new HelpFeedbackTreeDataProvider(),
  });
}
