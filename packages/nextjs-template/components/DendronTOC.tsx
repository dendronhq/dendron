import { NoteProps } from "@dendronhq/common-all";
import { Anchor } from "antd";
import _ from "lodash";
import { ComponentProps } from "react";

const Link = Anchor.Link;

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
              title={_.capitalize(entry?.text ?? entry?.value)}
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
