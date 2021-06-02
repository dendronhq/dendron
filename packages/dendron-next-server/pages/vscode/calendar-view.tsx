import {
  createLogger,
  engineSlice,
  ideHooks,
  postVSCodeMessage,
} from "@dendronhq/common-frontend";
import { DMessageSource } from "@dendronhq/common-all";
import _ from "lodash";
import { DendronProps } from "../../lib/types";

function CalendarView({ engine }: DendronProps) {
  const notes = engine.notes;
  const logger = createLogger("CalendarView");

  return (
    <ul>
      {_.values(notes).map((note) => (
        <li>
          <a
            id={note.id}
            href="#"
            key={note.id}
            onClick={() => {
              postVSCodeMessage({
                type: "onClick",
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
