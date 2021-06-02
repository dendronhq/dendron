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
    <div>
      Notes:{" "}
      {_.values(notes)
        .map((n) => n.fname)
        .join(", ")}
    </div>
  );
}

export default CalendarView;
