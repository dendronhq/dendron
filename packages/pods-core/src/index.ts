import {
  GitPunchCardExportPod,
  JSONExportPod,
  JSONImportPod,
  JSONPublishPod,
} from "./builtin";
import { AirtableExportPod, AirtablePublishPod } from "./builtin/AirtablePod";
import { GDocImportPod } from "./builtin/GDocPod";
import {
  GithubIssueImportPod,
  GithubIssuePublishPod,
} from "./builtin/GithubIssuePod";
import { GraphvizExportPod } from "./builtin/GraphvizPod";
import { HTMLPublishPod } from "./builtin/HTMLPod";
import {
  MarkdownExportPod,
  MarkdownImportPod,
  MarkdownPublishPod,
} from "./builtin/MarkdownPod";
import { NextjsExportPod } from "./builtin/NextjsExportPod";
import { PodClassEntryV4 } from "./types";
import { NotionExportPod } from "./builtin/NotionPod";
import { JSONSchemaType } from "ajv";

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
    NextjsExportPod,
    NotionExportPod,
  ];
}
export function getAllPublishPods(): PodClassEntryV4[] {
  return [
    JSONPublishPod,
    MarkdownPublishPod,
    HTMLPublishPod,
    GithubIssuePublishPod,
    AirtablePublishPod,
  ];
}
export function getAllImportPods(): PodClassEntryV4[] {
  return [
    JSONImportPod,
    MarkdownImportPod,
    GithubIssueImportPod,
    GDocImportPod,
  ];
}

export { JSONSchemaType };
