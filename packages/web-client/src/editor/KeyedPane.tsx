import DataLoader from "./DataLoader";
import { PaneRouteProps } from "./types";
import React from "react";

class KeyedPane extends React.Component<PaneRouteProps> {
  render() {
    const { id } = this.props.match.params;

    // the urlId portion of the url does not include the slugified title
    // we only want to force a re-mount of the document component when the
    // document changes, not when the title does so only this portion is used
    // for the key.
    // const urlParts = documentSlug ? documentSlug.split("-") : [];
    // const urlId = urlParts.length ? urlParts[urlParts.length - 1] : undefined;
    // const urlId = id
    return <DataLoader key={[id].join("/")} {...this.props} />;
  }
}

export default KeyedPane;
