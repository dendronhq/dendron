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
  /** Add a "TODO: <note title>" entry to the frontmatter of task notes. This helps with integration with various Todo extensions like Todo Tree. */
  todoIntegration: boolean;
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
      a: "assigned",
      w: "work in progress",
      n: "moved to next day",
      x: "done",
      d: "dropped",
      ".": "made progress",
      y: "pending deployment/verification",
      b: "blocked",
      m: "moved",
      l: "delegated",
    },
    prioritySymbols: {
      H: "high",
      M: "medium",
      L: "low",
    },
    todoIntegration: false,
  };
}

/** Used to recognize if something is a task note. If any of these are included in the frontmatter, the note will be considered a task note. */
const TASK_NOTE_PROP_KEYS: string[] = ["status", "due", "owner", "priority"];

export type TaskNoteProps = {
  custom: {
    status?: string;
    due?: string;
    owner?: string;
    priority?: string;
    TODO?: string;
    DONE?: string;
  };
};

export class TaskNoteUtils {
  static isTaskNote(note: NoteProps): note is NoteProps & TaskNoteProps {
    for (const prop of TASK_NOTE_PROP_KEYS) {
      if (note.custom[prop] !== undefined) return true;
    }
    return false;
  }

  static genDefaultTaskNoteProps(
    note: NoteProps,
    config: TaskConfig
  ): TaskNoteProps {
    const props: TaskNoteProps = {
      custom: {
        status: "",
        due: "",
        priority: "",
        owner: "",
      },
    };
    if (config.todoIntegration) props.custom["TODO"] = note.title;
    return props;
  }

  static getStatusSymbol({
    note,
    taskConfig,
  }: {
    note: TaskNoteProps;
    taskConfig: TaskConfig;
  }) {
    const { status } = note.custom;
    if (status === undefined) return undefined;
    // If the symbol is not mapped to anything, use the symbol prop directly
    if (!taskConfig.statusSymbols) return status;
    const symbol: string | undefined = taskConfig.statusSymbols[status];
    if (symbol === undefined) return status;
    // If it does map to something, then use that
    return symbol;
  }

  static getPrioritySymbol({
    note,
    taskConfig,
  }: {
    note: TaskNoteProps;
    taskConfig: TaskConfig;
  }) {
    const { priority } = note.custom;
    if (priority === undefined) return undefined;
    // If the symbol is not mapped to anything, use the symbol prop directly
    if (!taskConfig.prioritySymbols) return priority;
    const symbol: string | undefined = taskConfig.prioritySymbols[priority];
    if (symbol === undefined) return priority;
    // If it does map to something, then use that
    return symbol;
  }
}
