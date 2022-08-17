import {
  IPreviewLinkHandler,
  LinkType,
} from "../../../components/views/IPreviewLinkHandler";

export class DummyPreviewLinkHandler implements IPreviewLinkHandler {
  onLinkClicked({
    data,
  }: {
    data: { id?: string | undefined; href?: string | undefined };
  }): Promise<LinkType> {
    throw new Error("Method not implemented.");
  }
}
