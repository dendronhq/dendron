import { NoteProps } from "@dendronhq/common-all";
import { Anchor } from "antd";
import _ from "lodash";
import { ComponentProps } from "react";

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
    <>
      <Anchor style={{ zIndex: 1 }} {...rest}>
        {Object.entries(note?.anchors).map(([key, entry]) =>
          entry?.type === "header" ? (
            <Link
              href={`#${key}`}
              title={unslug(entry?.text ?? entry?.value)}
            />
          ) : (
            <></>
          )
        )}
        {note?.links?.length > 0 &&
        note?.links.some((link) => link.type === "backlink") ? (
          <Link href="#backlinks" title="Backlinks" />
        ) : (
          <></>
        )}
        {note?.children?.length > 0 ? (
          <Link href="#children" title="Children" />
        ) : (
          <></>
        )}
      </Anchor>
    </>
  );
};

export default DendronTOC;
