import {
  GitPunchCardExportPod,
  JSONExportPod,
  JSONImportPod,
  JSONPublishPod,
} from "./builtin";
import { GraphvizExportPod } from "./builtin/GraphvizPod";
import { AirtableExportPod } from "./builtin/AirtablePod";
import { HTMLPublishPod } from "./builtin/HTMLPod";
import {
  MarkdownImportPod,
  MarkdownPublishPod,
  MarkdownExportPod,
} from "./builtin/MarkdownPod";
import { PodClassEntryV4 } from "./types";
export * from "./basev3";
export * from "./builtin";
export * from "./types";
export * from "./utils";
export function getAllExportPods(): PodClassEntryV4[] {
  return [
    JSONExportPod,
    GitPunchCardExportPod,
    MarkdownExportPod,
    GraphvizExportPod,
    AirtableExportPod,
  ];
}
export function getAllPublishPods(): PodClassEntryV4[] {
  return [JSONPublishPod, MarkdownPublishPod, HTMLPublishPod];
}
export function getAllImportPods(): PodClassEntryV4[] {
  return [JSONImportPod, MarkdownImportPod];
}
