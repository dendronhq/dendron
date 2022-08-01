// make it a module
export {};

declare global {
  interface Window {
    currentTheme: "light" | "dark";
  }
}
