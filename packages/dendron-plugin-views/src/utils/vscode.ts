import {
  DMessage,
  DMessageSource,
  DMessageType,
  VSCodeMessage,
} from "@dendronhq/common-all";
import React from "react";


/**
 * Post message to VSCode process
 * @param msg 
 */
export const postVSCodeMessage = (msg: DMessage) => {
  // @ts-ignore
    window.vscode.postMessage(msg, "*");
};

export const useVSCodeMessage = (setMsgHook: (msg: VSCodeMessage) => void) => {
  const listener = (msg: MessageEvent<DMessage>) => {
    const payload = msg.data || {}; // The JSON data our extension sent
    if (payload.source === "vscode") {
      setMsgHook(payload);
    }
  };
  React.useEffect(() => {
    // set listener for all messages
    window.addEventListener("message", listener);

    postVSCodeMessage({
      type: DMessageType.MESSAGE_DISPATCHER_READY,
      data: {},
      source: DMessageSource.webClient,
    });

    return () => {
      window.removeEventListener("message", listener);
    };
  }, []);
};