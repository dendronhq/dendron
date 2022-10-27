import {
  CheckCircleOutlined,
  DisconnectOutlined,
  DownloadOutlined,
  GlobalOutlined,
} from "@ant-design/icons";
import {
  DMessageSource,
  SeedBrowserMessage,
  SeedBrowserMessageType,
} from "@dendronhq/common-all";
import { Tooltip } from "antd";
import { postVSCodeMessage } from "../utils/vscode";

/**
 * Component for the GoToSite button on a seed browser card
 * @param url - URL to open
 * @param inVscode - set if within vs code webview, do not set for browser.
 * @returns
 */
export function GoToSiteButton({
  url,
  inVscode,
}: {
  url: string | undefined;
  inVscode: boolean;
}) {
  const onClick = () => {
    if (url) {
      // If we're in VSCode, the webview does not allow popups, so send a
      // message back to the plugin and open the link from within the plugin
      if (inVscode) {
        postVSCodeMessage({
          type: SeedBrowserMessageType.onOpenUrl,
          data: { data: url },
          source: DMessageSource.webClient,
        } as SeedBrowserMessage);
      } else {
        window.open(url);
      }
    }
  };

  if (url) {
    return (
      <Tooltip placement="top" title="Go to Site">
        <GlobalOutlined key="website" onClick={onClick} />
      </Tooltip>
    );
  } else {
    return (
      <Tooltip placement="top" title="Site Unavailable">
        <DisconnectOutlined key="website" onClick={onClick} />
      </Tooltip>
    );
  }
}

/**
 * Component for Button to Add Seed to Workspace on a seed browser card
 * @param existsInWorkspace - does the seed already exist in the users workspace?
 * @param seedId - seed unique ID
 * @returns
 */
export function AddToWorkspaceButton({
  existsInWorkspace,
  seedId,
}: {
  existsInWorkspace: boolean;
  seedId: string;
}) {
  const onClick = () => {
    postVSCodeMessage({
      type: SeedBrowserMessageType.onSeedAdd,
      data: { data: seedId },
      source: DMessageSource.webClient,
    } as SeedBrowserMessage);
  };

  if (!existsInWorkspace) {
    return (
      <Tooltip placement="top" title="Add to Workspace">
        <DownloadOutlined key="download" onClick={onClick} />
      </Tooltip>
    );
  }
  return (
    <Tooltip placement="top" title="Already in Workspace">
      <CheckCircleOutlined key="installed" disabled />
    </Tooltip>
  );
}
