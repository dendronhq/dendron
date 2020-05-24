import { createBrowserHistory as createHistory } from "history";
var HISTORY = null;
export function getOrCreateHistory() {
    if (!HISTORY) {
        HISTORY = createHistory();
    }
    return HISTORY;
}
//# sourceMappingURL=history.js.map