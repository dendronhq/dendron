import {
  Event,
  ProviderResult,
  ThemeIcon,
  TreeDataProvider,
  TreeItem,
  TreeItemCollapsibleState,
} from "vscode";
import * as vscode from "vscode";
import {
  assertUnreachable,
  DendronTreeViewKey,
  VSCodeEvents,
} from "@dendronhq/common-all";
import { AnalyticsUtils } from "../utils/analytics";

enum MenuItem {
  getStarted = "Get Started",
  readDocs = "Read Documentation",
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

    switch (element) {
      case MenuItem.getStarted:
        iconPath = new ThemeIcon("star");
        break;

      case MenuItem.readDocs:
        iconPath = new ThemeIcon("book");
        break;

      case MenuItem.reviewIssues:
        iconPath = new ThemeIcon("issues");
        break;

      case MenuItem.reportIssue:
        iconPath = new ThemeIcon("comment");
        break;

      case MenuItem.joinCommunity:
        iconPath = new ThemeIcon("organization");
        break;

      case MenuItem.followUs:
        iconPath = new ThemeIcon("twitter");
        break;

      default:
        assertUnreachable(element);
    }

    return {
      label: element.toString(),
      collapsibleState: TreeItemCollapsibleState.None,
      iconPath,
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

function openUrl(url: string) {
  vscode.commands.executeCommand("vscode.open", url);
}

/**
 * Creates a tree view for the basic 'Help and Feedback' panel in the Dendron
 * Custom View Container
 * @returns
 */
export default function setupHelpFeedbackTreeView(): vscode.TreeView<MenuItem> {
  const treeView = vscode.window.createTreeView(
    DendronTreeViewKey.HELP_AND_FEEDBACK,
    {
      treeDataProvider: new HelpFeedbackTreeDataProvider(),
    }
  );

  treeView.onDidChangeSelection((e) => {
    const item = e.selection[0];

    AnalyticsUtils.track(VSCodeEvents.HelpAndFeedbackItemClicked, {
      menuItem: item,
    });

    switch (item) {
      case MenuItem.getStarted:
        openUrl(
          "https://wiki.dendron.so/notes/678c77d9-ef2c-4537-97b5-64556d6337f1/"
        );
        break;

      case MenuItem.readDocs:
        openUrl("https://wiki.dendron.so/notes/FWtrGfE4YJc3j0yMNjBn5/");
        break;

      case MenuItem.reviewIssues:
        openUrl("https://github.com/dendronhq/dendron/issues");
        break;

      case MenuItem.reportIssue:
        openUrl("https://github.com/dendronhq/dendron/issues/new/choose");
        break;

      case MenuItem.joinCommunity:
        openUrl("https://discord.com/invite/xrKTUStHNZ");
        break;

      case MenuItem.followUs:
        openUrl("https://twitter.com/dendronhq");
        break;

      default:
        assertUnreachable(item);
    }
  });

  return treeView;
}
