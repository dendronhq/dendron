import { useEffect } from "react";

const usePropegateKeystrokes = () => {
  useEffect(() => {
    if (window.parent === window) return;

    const listener = (e: KeyboardEvent) =>
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
      );

    if (!window.hasOwnProperty("keyhookInstalled")) {
      (window as any).keyhookInstalled = true;
      window.addEventListener("keydown", listener);
    }

    return () => {
      // Cleanup event listener if it exists
      if (window.hasOwnProperty("keyhookInstalled")) {
        window.removeEventListener("keydown", listener);
      }
    };
  }, []);
};

export default usePropegateKeystrokes;
