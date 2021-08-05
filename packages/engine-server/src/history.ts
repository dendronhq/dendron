import _ from "lodash";
import { URI } from "vscode-uri";

export type HistoryEvent = {
  action: HistoryEventAction;
  source: HistoryEventSource;
  /**
   * Used to further narrow down the source.
   * This is used in {@link LookupProviderV3} as this can be embedded in multiple commands (eg. NoteLookup vs RenameNote)
   * For example, for [RenameNote](https://github.com/dendronhq/dendron/blob/6c98d466536632530399bd45f1220ae725ff3e2f/packages/plugin-core/src/commands/RenameNoteV2a.ts#L52-L52),
   * the id is "rename" whereas for NoteLookup, the id is "lookup"
   */
  id?: string;
  /**
   * Sometimes events have uris attached to them (eg. {@link HistoryEventAction.create})
   */
  uri?: URI;
  /**
   * Arbitrary data that can be passed to the event
   */
  data?: any;
};

/**
 * Where did the event come from
 */
export type HistoryEventSource =
  | "engine"
  | "src"
  | "extension"
  | "lspServer"
  | "apiServer"
  | "lookupProvider"
  | "watcher";

/**
 * What action was performed
 */
export type HistoryEventAction =
  | "delete"
  | "create"
  | "activate"
  | "initialized"
  | "not_initialized"
  | "rename"
  | "upgraded"
  | APIServerEvent
  | "done"
  | "error";

export type APIServerEvent = "changedPort";

type HistoryEventListenerFunc = (event: HistoryEvent) => void;
type HistoryEventListenerFuncEntry = {
  id: string;
  listener: (event: HistoryEvent) => void;
};

interface IHistoryService {
  readonly events: HistoryEvent[];
  //instance: () =>IHistoryService;
  add(event: HistoryEvent): void;
  lookBack(num?: number): HistoryEvent[];
}

let _HISTORY_SERVICE: undefined | HistoryService = undefined;

/**
 * Keeps of lifecycle evnts in Dendron.
 * You can find more details about it [here](https://wiki.dendron.so/notes/Rp1yFBOH6BletGam.html#summary)
 */
export class HistoryService implements IHistoryService {
  public readonly events: HistoryEvent[];
  /**
   @deprecated
   */
  public subscribers: { [k in HistoryEventSource]: HistoryEventListenerFunc[] };
  public subscribersv2: {
    [k in HistoryEventSource]: HistoryEventListenerFuncEntry[];
  };
  public pause: boolean;

  static instance(): HistoryService {
    if (_.isUndefined(_HISTORY_SERVICE)) {
      _HISTORY_SERVICE = new HistoryService();
    }
    return _HISTORY_SERVICE;
  }

  constructor() {
    this.events = [];
    this.subscribers = {
      engine: [],
      src: [],
      extension: [],
      lspServer: [],
      apiServer: [],
      watcher: [],
      lookupProvider: [],
    };
    this.subscribersv2 = {
      engine: [],
      src: [],
      extension: [],
      lspServer: [],
      apiServer: [],
      watcher: [],
      lookupProvider: [],
    };
    this.pause = false;
  }

  add(event: HistoryEvent) {
    if (!this.pause) {
      this.events.unshift(event);
      this.subscribers[event.source].forEach((f) => f(event));
      this.subscribersv2[event.source].forEach(({ listener, id }) => {
        if (!event.id || event.id === id) {
          listener(event);
        }
      });
    }
  }

  remove(id: string, source: HistoryEventSource) {
    const idx = _.findIndex(
      this.subscribersv2[source],
      ({ id: subId }) => subId === id
    );
    if (idx >= 0) {
      this.subscribersv2[source].splice(idx, 1);
    }
  }

  clearSubscriptions() {
    this.subscribers = {
      engine: [],
      src: [],
      extension: [],
      lspServer: [],
      apiServer: [],
      watcher: [],
      lookupProvider: [],
    };
    this.subscribersv2 = {
      engine: [],
      src: [],
      extension: [],
      lspServer: [],
      apiServer: [],
      watcher: [],
      lookupProvider: [],
    };
  }

  lookBack(num: number = 3): HistoryEvent[] {
    return this.events.slice(0, num);
  }

  subscribe(source: HistoryEventSource, func: HistoryEventListenerFunc) {
    this.subscribers[source].push(func);
  }

  subscribev2(source: HistoryEventSource, ent: HistoryEventListenerFuncEntry) {
    this.subscribersv2[source].push(ent);
  }
}
