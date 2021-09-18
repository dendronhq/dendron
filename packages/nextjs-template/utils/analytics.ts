import { initialize, set, pageview, event, exception } from "react-ga";

export const initGA = async (gaTrackingId: string) => initialize(gaTrackingId);

export const logPageView = () => {
  set({ page: window.location.pathname });
  pageview(window.location.pathname);
};

export const logEvent = (category = "", action = "") =>
  event({ category, action });

export const logException = (description = "", fatal = false) =>
  exception({ description, fatal });
