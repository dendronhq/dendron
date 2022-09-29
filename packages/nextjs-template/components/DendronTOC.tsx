import React from "react";
import { NoteProps } from "@dendronhq/common-all";
import { Anchor } from "antd";
import _ from "lodash";
import type { ComponentProps } from "react";

const Link = Anchor.Link;

const unslug = (slugs: string) => {
  slugs = slugs.replace(/_/g, "-");
  slugs = slugs.replace(/--/g, "-");
  const list: string[] = [];
  slugs.split("-").forEach((slug) => {
    list.push(slug.substr(0, 1).toUpperCase() + slug.substr(1));
  });
  return list.join(" ");
};

export const DendronTOC = ({
  note,
  ...rest
}: {
  note: NoteProps;
} & ComponentProps<typeof Anchor>) => {
  return (
    <Anchor style={{ zIndex: 1 }} className="dendron-toc" {...rest}>
      {Object.entries(note?.anchors).map(([key, entry]) => (
        <React.Fragment key={key}>
          {entry?.type === "header" ? (
            <Link
              href={`#${key}`}
              // `anchor.text` contains clean, user displayable text for
              // headings. It should always exist for exported notes, but we
              // have this fallback just in case.
              title={entry?.text ?? unslug(entry?.value)}
            />
          ) : null}
        </React.Fragment>
      ))}
    </Anchor>
  );
};

export default DendronTOC;
