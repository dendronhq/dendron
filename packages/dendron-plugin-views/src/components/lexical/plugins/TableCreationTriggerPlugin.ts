import {
  $isElementNode,
  $isParagraphNode,
  ParagraphNode,
  TextNode,
} from "lexical";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";

import {
  $createTableCellNode,
  $createTableNode,
  $createTableRowNode,
  $isTableNode,
  $isTableRowNode,
  TableCellHeaderStates,
  TableCellNode,
  TableNode,
} from "@lexical/table";

import { $isTextNode } from "lexical";

import { useEffect } from "react";

import { $createParagraphNode, $createTextNode } from "lexical";

const TABLE_ROW_REG_EXP = /^(?:\|\s*)+(?:\|\s*)$/;

const createTableCell = (
  textContent: string | null | undefined
): TableCellNode => {
  const cell = $createTableCellNode(TableCellHeaderStates.NO_STATUS);
  const paragraph = $createParagraphNode();

  if (textContent != null) {
    paragraph.append($createTextNode(textContent.trim()));
  }

  cell.append(paragraph);
  return cell;
};

const mapToTableCells = (textContent: string): Array<TableCellNode> | null => {
  // TODO:
  // For now plain text, single node. Can be expanded to more complex content
  // including formatted text
  const match = textContent.match(TABLE_ROW_REG_EXP);

  if (!match || !match[1]) {
    return null;
  }

  return match[1].split("|").map((text) => createTableCell(text));
};

function getTableColumnsSize(table: TableNode) {
  const row = table.getFirstChild();
  return $isTableRowNode(row) ? row.getChildrenSize() : 0;
}

export default function TableCreationTriggerPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const removeTransformListener = editor.registerNodeTransform(
      ParagraphNode,
      (node) => {
        // debugger;
        if (!$isParagraphNode(node) || !node.getPreviousSibling()) {
          return;
        }
        const prevSibling = node.getPreviousSibling()!;
        // debugger;

        if (!$isElementNode(prevSibling)) {
          return;
        }
        // debugger;
        const prevNodeByEditorAppearance = prevSibling.getLastDescendant();
        if (
          !prevNodeByEditorAppearance ||
          !$isTextNode(prevNodeByEditorAppearance)
        ) {
          return;
        }
        // debugger;
        const matches = prevNodeByEditorAppearance
          .getTextContent()
          .match(TABLE_ROW_REG_EXP);
        debugger;
        if (matches && matches.length > 0) {
          console.log(`Found Table match!`);

          const matchCells = matches[0]
            .split("|")
            .map((text) => createTableCell(text));

          // const matchCells = mapToTableCells(matches[0]);

          debugger;
          if (matchCells == null) {
            return;
          }

          // const parentNode = node.getParent()!;

          const rows = [matchCells];
          // let sibling = parentNode.getPreviousSibling();
          let maxCells = matchCells.length;

          // while (sibling) {
          //   if (!$isParagraphNode(sibling)) {
          //     break;
          //   }

          //   if (sibling.getChildrenSize() !== 1) {
          //     break;
          //   }

          //   const firstChild = sibling.getFirstChild();

          //   if (!$isTextNode(firstChild)) {
          //     break;
          //   }

          //   const cells = mapToTableCells(firstChild.getTextContent());

          //   if (cells == null) {
          //     break;
          //   }

          //   maxCells = Math.max(maxCells, cells.length);
          //   rows.unshift(cells);
          //   const previousSibling = sibling.getPreviousSibling();
          //   sibling.remove();
          //   sibling = previousSibling;
          // }

          const table = $createTableNode();

          for (const cells of rows) {
            const tableRow = $createTableRowNode();
            table.append(tableRow);

            for (let i = 0; i < maxCells; i++) {
              tableRow.append(
                i < cells.length ? cells[i] : createTableCell(null)
              );
            }
          }

          debugger;
          prevNodeByEditorAppearance.replace(table);

          // const previousSibling = parentNode.getPreviousSibling();
          // if (
          //   $isTableNode(previousSibling) &&
          //   getTableColumnsSize(previousSibling) === maxCells
          // ) {
          //   previousSibling.append(...table.getChildren());
          //   parentNode.remove();
          // } else {
          //   parentNode.replace(table);
          // }

          table.selectEnd();
        }
      }
    );

    return () => {
      removeTransformListener();
    };
  });

  return null;
}
