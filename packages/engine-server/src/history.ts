import _ from "lodash";
import { URI } from "vscode-uri";

export type HistoryEvent = {
  action: HistoryEventAction;
  source: HistoryEventSource;
  uri?: URI;
  data?: any;
};

export type HistoryEventSource =
  | "engine"
  | "src"
  | "extension"
  | "lspServer"
  | "apiServer"
  | "lookupProvider"
  | "watcher";
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
      this.subscribersv2[event.source].forEach(({ listener }) =>
        listener(event)
      );
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
