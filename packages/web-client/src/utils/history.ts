import { createBrowserHistory as createHistory } from "history";

type BrowserHistory = ReturnType<typeof createHistory>;
let HISTORY: ReturnType<typeof createHistory> | null = null;

export function getOrCreateHistory(): BrowserHistory {
  if (!HISTORY) {
    HISTORY = createHistory<{}>();
  }
  return HISTORY;
}
