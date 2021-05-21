import { DMessage, VSCodeMessage } from "@dendronhq/common-all";
import { useEffect } from "react";

/**
 * Listen to vscode messages
 * @param setMsgHook
 */
export const useVSCodeMessage = (setMsgHook: (msg: VSCodeMessage) => void) => {
  const listener = (msg: DMessage) => {
    const payload = msg.data || {}; // The JSON data our extension sent
    if (payload.source === "vscode") {
      setMsgHook(payload);
    }
  };
  useEffect(() => {
    // @ts-ignore
    window.addEventListener("message", listener);
    return () => {
      // @ts-ignore
      window.removeEventListener("message", listener);
    };
  }, []);
};

export const postVSCodeMessage = (msg: DMessage) => {
  // @ts-ignore
  if (window) {
    // @ts-ignore
    window.parent.postMessage(msg, "*");
  }
};
