import _ from "lodash";
import { NoteProps } from "../..";
import { JournalConfig } from "./journal";
import { NoteAddBehaviorEnum } from "./types";

/**
 * Namespace for configuring scratch note behavior
 */
export type TaskConfig = Pick<
  JournalConfig,
  "name" | "dateFormat" | "addBehavior"
  > & {
  /** Maps each status to a symbol, word, or sentence. This will be displayed for the task. */
  statusSymbols: { [status: string]: string };
  /** Maps each priority to a symbol, word, or sentence. This will be displayed for the task. */
  prioritySymbols: { [status: string]: string };
  /** The status where the note is considered complete. */
  completedStatus: string | string[];
  /** Add a "TODO: <note title>" entry to the frontmatter of task notes. This helps with integration with various Todo extensions like Todo Tree. */
  todoIntegration?: boolean;
};

/**
 * Generates default {@link ScratchConfig}
 * @returns ScratchConfig
 */
export function genDefaultTaskConfig(): TaskConfig {
  return {
    name: "task",
    dateFormat: "y.MM.dd.HHmmss",
    addBehavior: NoteAddBehaviorEnum.asOwnDomain,
    statusSymbols: {
      "": "not started",
      "a": "assigned",
      "w": "work in progress",
      "n": "moved to next day",
      "x": "done",
      "d": "dropped",
      ".": "made progress",
      "y": "pending deployment/verification",
      "b": "blocked",
      "m": "moved",
      "l": "delegated",
    },
    prioritySymbols: {
      "H": "high",
      "M": "medium",
      "L": "low",
    },
    completedStatus: ["complete", "completed", "done", "x"],
  };
}

/** Must include all keys of TaskNoteProps. Used to recognize if something is a task note. */
const TASK_NOTE_PROP_KEYS: (keyof TaskNoteProps)[] = [
  "status", "due", "owner", "priority"
];

export type TaskNoteProps = {
  status?: string,
  due?: string,
  owner?: string,
  priority?: string,
  TODO?: string,
  DONE?: string,
};

export function isTaskNote(note: NoteProps): note is NoteProps & TaskNoteProps {
  for (const prop of TASK_NOTE_PROP_KEYS) {
    if (note.custom[prop] !== undefined) return true;
  }
  return false;
}


export function genDefaultTaskNoteProps(note: NoteProps, config: TaskConfig): TaskNoteProps {
  const props: TaskNoteProps = {
    status: "",
    due: "",
    priority: "",
    owner: "",
  };
  if (config.todoIntegration) props["TODO"] = note.title;
  return props;
}
