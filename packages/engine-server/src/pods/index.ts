import { FilePod } from "./filePod";
import { PodClass } from "./base";
export * from "./filePod";
export * from "./base";

export function getBuiltInPods(): PodClass[] {
  const builtin = [FilePod];
  // @ts-ignore
  return builtin;
}
