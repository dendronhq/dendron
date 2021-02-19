import { JSONExportPod, JSONImportPod, JSONPublishPod } from "./builtin";
import { HTMLPublishPod } from "./builtin/HTMLPod";
import { MarkdownImportPod, MarkdownPublishPod } from "./builtin/MarkdownPod";
import { PodClassEntryV4 } from "./types";
export * from "./builtin";
export * from "./types";
export * from "./utils";

export function getAllExportPods(): PodClassEntryV4[] {
  return [JSONExportPod];
}
export function getAllPublishPods(): PodClassEntryV4[] {
  return [JSONPublishPod, MarkdownPublishPod, HTMLPublishPod];
}
export function getAllImportPods(): PodClassEntryV4[] {
  return [JSONImportPod, MarkdownImportPod];
}
