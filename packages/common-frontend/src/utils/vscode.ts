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
    if (window.parent !== window) {
      // If using TypeScript, next line should be:
      // let listener = (e: KeyboardEvent) =>
      let keyListener = (e: any) => {
        console.log("sending key event");
        window.parent.postMessage(
          JSON.stringify({
            altKey: e.altKey,
            code: e.code,
            ctrlKey: e.ctrlKey,
            isComposing: e.isComposing,
            key: e.key,
            location: e.location,
            metaKey: e.metaKey,
            repeat: e.repeat,
            shiftKey: e.shiftKey,
          }),
          "*"
        )};
    
      if (!window.hasOwnProperty("keyhookInstalled")) {
        (window as any).keyhookInstalled = true;
        window.addEventListener("keydown", keyListener);
      }
    }
    return () => {
      // @ts-ignore
      window.removeEventListener("message", listener);
      delete (window as any)["keyhookInstalled"]
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
