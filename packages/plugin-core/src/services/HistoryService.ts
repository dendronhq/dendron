import { Uri } from "vscode"
import _ from "lodash";

export type Event = {
    source: DendronEvent
    uri: Uri
    action: DendronAction
}

type DendronEvent = "engine"|"src"
type DendronAction = "delete"|"create"

interface IHistoryService {
    readonly events: Event[];
    //instance: () =>IHistoryService;
    add(event: Event): void;
    lookBack(num?: number): Event[];
}

let _HISTORY_SERVICE: undefined|HistoryService = undefined;

export class HistoryService implements IHistoryService {
    public readonly events: Event[];

    static instance(): HistoryService {
        if (_.isUndefined(_HISTORY_SERVICE)) {
            _HISTORY_SERVICE = new HistoryService();
        }
        return _HISTORY_SERVICE;
    }

    constructor() {
        this.events = [];
    }

    add(event: Event) {
        this.events.unshift(event);
    }

    lookBack(num: number = 3): Event[] {
        return this.events.slice(0, num);
    }
}