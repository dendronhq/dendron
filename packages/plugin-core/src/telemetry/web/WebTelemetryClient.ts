import { AppNames } from "@dendronhq/common-all";
import axios, { AxiosRequestConfig } from "axios";
import { inject, injectable, registry } from "tsyringe";
import * as vscode from "vscode";
import { ITelemetryClient } from "../common/ITelemetryClient";
import { getAnonymousId } from "./getAnonymousId";

/**
 * This implementation talks to Segment services via their HTTP API. It's safe
 * to use in both web and node contexts.
 *
 * Note: the Segment Javascript library was not used here because it requires a
 * browser 'window' object, which is not available to web extensions.
 */
@injectable()
/**
 * Use a separate registry for the dependencies of this class. If other places
 * start needing anonymousId or extVersion, then we can pull these out and into
 * the main container. By separating these here, we can simplify the test setup,
 * since tests don't use this ITelemetryClient implementation.
 */
@registry([
  {
    token: "anonymousId",
    useFactory: (container) =>
      getAnonymousId(container.resolve("extensionContext")),
  },
  {
    token: "extVersion",
    useFactory: (container) => {
      const context =
        container.resolve<vscode.ExtensionContext>("extensionContext");
      return context.extension.packageJSON.version ?? "0.0.0";
    },
  },
])
export class WebTelemetryClient implements ITelemetryClient {
  constructor(
    @inject("anonymousId") private anonymousId: string,
    @inject("extVersion") private extVersion: string
  ) {}

  /**
   * This key talks to the 'Dendron-Web-Extension' source in Segment. NOTE: this
   * is different from the 'ide-prod' source.
   */
  private DENDRON_WEB_EXTENSION_SEGMENT_WRITE_KEY =
    "bgfipVUsX5lwQomfZ8uwMQnBLVGRypeJ";

  private requestConfig: AxiosRequestConfig = {
    auth: {
      username: this.DENDRON_WEB_EXTENSION_SEGMENT_WRITE_KEY,
      password: "",
    },
    headers: {
      "Content-Type": "application/json",
    },
  };

  public track(
    event: string,
    customProps?: any,
    _segmentProps?: { timestamp?: Date | undefined } | undefined
  ): Promise<void> {
    const properties = {
      ...customProps,
      appVersion: this.extVersion,
      vscodeSessionId: vscode.env.sessionId,
    };

    const data = {
      anonymousId: this.anonymousId,
      event,
      properties,
      integrations: { Amplitude: { session_id: vscode.env.sessionId } },
    };

    return axios.post(
      "https://api.segment.io/v1/track",
      data,
      this.requestConfig
    );
  }

  public identify(): Promise<void> {
    const {
      appName,
      appHost,
      isNewAppInstall,
      language,
      machineId,
      shell,
      isTelemetryEnabled,
    } = vscode.env;

    const traits = {
      type: AppNames.CODE_WEB,
      ideVersion: vscode.version,
      ideFlavor: appName,
      appHost,
      appVersion: this.extVersion,
      userAgent: appName,
      isNewAppInstall,
      isTelemetryEnabled,
      language,
      machineId,
      shell,
    };

    const data = {
      anonymousId: this.anonymousId,
      traits,
    };

    return axios.post(
      "https://api.segment.io/v1/identify",
      data,
      this.requestConfig
    );
  }
}
