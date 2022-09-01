import {
  ConfigUtils,
  IntermediateDendronConfig,
  NoteProps
} from "@dendronhq/common-all";
import Giscus, { GiscusProps, Repo } from "@giscus/react";
import _ from "lodash";

function isRepo(repoString: string): repoString is Repo {
  const match = repoString.match("^[a-zA-Z0-9_-]*[/][a-zA-Z0-9_-]*$");
  return !_.isNull(match);
}

export const DendronNoteGiscusWidget = ({
  note,
  config,
}: {
  note: NoteProps;
  config: IntermediateDendronConfig;
}) => {
  const giscusConfig = ConfigUtils.getGiscusConfig(config);
  const page = note.id;
  if (giscusConfig === undefined) {
    return null;
  }
  if (note.custom?.enableGiscus === undefined) {
    return null;
  }

  // sanity checks
  const repoString = giscusConfig.repo;
  if (isRepo(repoString)) {
    const cleanGiscusConfig: GiscusProps = {
      ...giscusConfig,
      repo: repoString,
      term: page,
    };
    return <Giscus {...cleanGiscusConfig } />;
  } else {
    return null;
  }
};
