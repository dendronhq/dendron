import { TutorialEvents } from "@dendronhq/common-all";
import { AnalyticsUtils } from "../../utils/analytics";
import { LinkType, PreviewLinkHandler } from "./PreviewLinkHandler";

export class TutorialPreviewLinkHandler extends PreviewLinkHandler {
  /**
   *  set of tutorial note ids that we will allow tracking of link clicked events.
   */
  private _allowedIds = new Set<string>(["c1bs7wsjfbhb0zipaywqfbg"]);

  /**
   * Does what {@link PreviewLinkHandler.onLinkClicked} does,
   * and also track preview link click events if it comes from
   * one of the tutorial notes.
   */
  public async onLinkClicked({
    data,
  }: {
    data: { id?: string | undefined; href?: string | undefined };
  }): Promise<LinkType> {
    const linkType = await super.onLinkClicked({ data });
    const { href, id } = data;

    // only try to track if it comes from one of our tutorial ids.
    if (id && this._allowedIds.has(id)) {
      if (href && linkType) {
        // only track command uri and web uri links
        if (linkType === LinkType.COMMAND || linkType === LinkType.WEBSITE) {
          AnalyticsUtils.track(TutorialEvents.TutorialPreviewLinkClicked, {
            linkType,
            href,
          });
        }
      }
    }

    return linkType;
  }
}
