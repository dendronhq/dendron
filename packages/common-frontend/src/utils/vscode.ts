import { DMessage, VSCodeMessage } from "@dendronhq/common-all";
import { useEffect } from "react";

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

export class VSCodeUtils {
  static postMessage(msg: DMessage) {
    // @ts-ignore
    if (window) {
      // @ts-ignore
      window.parent.postMessage(msg, "*");
    }
  }
}
