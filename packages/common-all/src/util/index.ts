export { URI } from "vscode-uri";
export * from "./cache";
export * from "./compat";
export * from "./dateFormatUtil";
export * from "./orderedMatchter";
export * from "./regex";
export * from "./responseUtil";
export * from "./stringUtil";
export * from "./treeUtil";

/**
 * Defaultdict from Python
 */
export class DefaultMap<K = string, V = any> extends Map<K, V> {
  private defaultMethod: () => V;

  get(key: K): V {
    if (!this.has(key)) {
      this.set(key, this.defaultMethod());
    }
    return super.get(key) as V;
  }
  constructor(defaultMethod: () => V) {
    super();
    this.defaultMethod = defaultMethod;
  }
}
