import {
  createLogger,
  engineSlice,
  ideHooks,
  postVSCodeMessage,
} from "@dendronhq/common-frontend";
import { DMessageSource, CalendarViewMessageType } from "@dendronhq/common-all";
import _ from "lodash";
import { DendronProps } from "../../lib/types";

function CalendarView({ engine }: DendronProps) {
  const notes = engine.notes;
  const logger = createLogger("CalendarView");

  const dailyNotes = _.values(notes).filter(
    (note) => note.fname.startsWith("daily.") && note.children.length === 0
  );

  return (
    <ul>
      {dailyNotes.map((note) => (
        <li>
          <a
            id={note.id}
            href="#"
            key={note.id}
            onClick={() => {
              postVSCodeMessage({
                type: CalendarViewMessageType.onSelect,
                data: { id: note.id },
                source: DMessageSource.webClient,
              });
            }}
          >
            {note.fname}
          </a>
        </li>
      ))}
    </ul>
  );
}

export default CalendarView;
