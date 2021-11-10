import {
  DMessage,
  DMessageEnum,
  DMessageSource,
  VSCodeMessage,
} from "@dendronhq/common-all";
import React from "react";

/**
 * Post message to VSCode process
 * @param msg
 */
export const postVSCodeMessage = (msg: DMessage) => {
  // @ts-ignore
  if (window.vscode) {
    // @ts-ignore
    window.vscode.postMessage(msg, "*");
  }
};

export const useVSCodeMessage = (setMsgHook: (msg: VSCodeMessage) => void) => {
  const listener = React.useCallback((msg: MessageEvent<DMessage>)=> {
      const payload = msg.data || {}; // The JSON data our extension sent
      if (payload.source === "vscode") {
        setMsgHook(payload);
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  React.useEffect(() => {
    // set listener for all messages
    window.addEventListener("message", listener);

    postVSCodeMessage({
      type: DMessageEnum.MESSAGE_DISPATCHER_READY,
      data: {},
      source: DMessageSource.webClient,
    });

    return () => {
      window.removeEventListener("message", listener);
    };
  }, [listener]);
};
