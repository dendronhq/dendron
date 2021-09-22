import { initialize, set, pageview, event, exception } from "react-ga";
import ReactGA from "react-ga4";
import { GAType } from "../components/DendronGATracking";

export const initGA = async (gaTrackingId: string, gaType: GAType) => {
  if (gaType === GAType.UNIVERSAL_ANALYTICS) {
    initialize(gaTrackingId);
  } else {
    ReactGA.initialize(gaTrackingId);
  }
};

export const logPageView = (gaType: GAType) => {
  if (gaType === GAType.UNIVERSAL_ANALYTICS) {
    set({ page: window.location.pathname });
    pageview(window.location.pathname);
  } else {
    ReactGA.send("pageview");
  }
};

export const logEvent = (category = "", action = "") =>
  event({ category, action });

export const logException = (description = "", fatal = false) =>
  exception({ description, fatal });
