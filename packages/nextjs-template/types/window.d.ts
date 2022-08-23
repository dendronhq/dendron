import { Mermaid } from "mermaid";

// make it a module
export {};

declare global {
  interface Window {
    currentTheme: "light" | "dark";
    mermaid?: Mermaid;
    updateIFrameHeights: () => void;
  }
}
