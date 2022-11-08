import { Point, Position, VSPosition, VSRange } from "../types";

export type PointOffset = { line?: number; column?: number };

/** Convert a `Point` from a parsed remark node to a `vscode.Poisition`
 *
 * @param point The point to convert.
 * @param offset When converting the point, shift it by this much.
 * @returns The converted Position, shifted by `offset` if provided.
 */
export function point2VSCodePosition(
  point: Point,
  offset?: PointOffset
): VSPosition {
  return {
    // remark Point's are 0 indexed
    line: point.line - 1 + (offset?.line || 0),
    character: point.column - 1 + (offset?.column || 0),
  };
}

/** Convert a `Position` from a parsed remark node to a `vscode.Range`
 *
 * @param position The position to convert.
 * @returns The converted Range.
 */
export function position2VSCodeRange(
  position: Position,
  offset?: PointOffset
): VSRange {
  return {
    // remark Point's are 0 indexed
    start: point2VSCodePosition(position.start, offset),
    end: point2VSCodePosition(position.end, offset),
  };
}

/** Similar to VSCode's `Document.getRange`, except that it works with strings. */
export function getTextRange(text: string, range: VSRange): string {
  const { start, end } = range;
  const lines = text.split("\n").splice(start.line, end.line - start.line + 1);
  if (lines.length === 0) return "";
  // Do the end first in case there is just one line, otherwise the end of the string would shift
  lines[lines.length - 1] = lines[lines.length - 1].substring(0, end.character);
  lines[0] = lines[0].substring(start.character);
  return lines.join("\n");
}

/**
 * Similar to doing a `delete` on an `editor.edit()`, except it works with strings.
 */
export function deleteTextRange(text: string, range: VSRange): string {
  const { start, end } = range;
  const lines = text.split("\n");
  const processed = lines
    .map((line, index) => {
      if (index === start.line) {
        return line.substring(0, start.character);
      } else if (index > start.line && index < end.line) {
        return undefined;
      } else if (index === end.line) {
        return line.substring(end.character);
      } else {
        return line;
      }
    })
    .filter((maybeLine): maybeLine is string => {
      return maybeLine !== undefined;
    });
  return processed.join("\n");
}

export function newRange(
  startLine: number,
  startCharacter: number,
  endLine: number,
  endCharacter: number
): VSRange {
  return {
    start: {
      line: startLine,
      character: startCharacter,
    },
    end: {
      line: endLine,
      character: endCharacter,
    },
  };
}

export function offsetRange(range: VSRange, offset: PointOffset): VSRange {
  const { line, column } = { line: 0, column: 0, ...offset };
  return newRange(
    range.start.line + line,
    range.start.character + column,
    range.end.line + line,
    range.end.character + column
  );
}
