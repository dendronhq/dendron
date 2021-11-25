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

export * from "./v2/external-services/ExternalConnectionManager";
export * from "./v2/external-services/AirtableConnection";
export * from "./v2/PodConfigManager";
export * from "./v2/podConfig/AirtablePodConfig";
export * from "./v2/podConfig/PodV2Types";
export * from "./v2/ExportPodBase";
export * from "./v2/ConfigFileUtils";
export * from "./v2/podConfig/MarkdownPodConfig";

export * from "./v2/pods/export/AirtableExportPodV2";
export * from "./v2/pods/export/MarkdownExportPodV2";

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
