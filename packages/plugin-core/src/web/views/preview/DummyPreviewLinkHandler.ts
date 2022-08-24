import {
  IPreviewLinkHandler,
  LinkType,
} from "../../../components/views/IPreviewLinkHandler";

export class DummyPreviewLinkHandler implements IPreviewLinkHandler {
  onLinkClicked(): Promise<LinkType> {
    throw new Error("Method not implemented.");
  }
}
