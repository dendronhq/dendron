import {
  DendronError,
  ERROR_SEVERITY,
  RespV2,
  Time,
} from "@dendronhq/common-all";
import { readYAML, writeYAML } from "@dendronhq/common-server";
import axios from "axios";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import { MemoryStore } from "../store/memoryStore";

export interface TokenMethods {
  getToken: (opts: GetTokenOpts) => Promise<RespV2<any> | GetTokenPayload>;
  refreshToken: (opts: RefreshTokenOpts) => Promise<RespV2<string>>;
}

type GetTokenPayload = string | undefined;

/**
 * clientId and secret is added as optional parameters
 */
type GetTokenOpts = {
  code: string;
  connectionId: string;
};

type RefreshTokenOpts = {
  refreshToken: string;
  connectionId: string;
};

export class GoogleAuthController implements TokenMethods {
  clientId: string;
  clientSecret: string;

  constructor(clientId: string, clientSecret: string) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
  }
  async getToken(opts: GetTokenOpts): Promise<RespV2<any> | GetTokenPayload> {
    const { code, connectionId } = opts;
    const engine = MemoryStore.instance().getEngine();
    const { wsRoot } = engine;
    // getToken reads url from browser and filters the req query params,
    // It receives string value `undefined` from req.query when the connectionId is set as undefined
    const configPath = !_.isEqual(connectionId, "undefined")
      ? path.join(
          wsRoot,
          "pods",
          "service-connections",
          `svcconfig.${connectionId}.yml`
        )
      : path.join(wsRoot, "pods", "dendron.gdoc", "config.import.yml");
    const port = await fs.readFile(path.join(wsRoot, ".dendron.port"), {
      encoding: "utf8",
    });
    let resp;
    const { data } = await axios({
      url: `https://oauth2.googleapis.com/token`,
      method: "post",
      data: {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: `http://localhost:${port}/api/oauth/getToken?service=google&connectionId=${connectionId}`,
        grant_type: "authorization_code",
        code,
      },
    });
    if (!_.isEmpty(data)) {
      const opts = {
        path: configPath,
        tokens: {
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
          expirationTime: Time.now().toSeconds() + data.expires_in - 300,
        },
      };
      this.addAccessTokensToPodConfig(opts);
      resp =
        "Authorization completed. Please return to your workspace and then run the pod again. Please specify vaultName in config.import.yml if you are running the import pod. You can now close this window.";
    } else {
      throw new DendronError({
        message:
          "Failed to get a token response from Google Authentication Service",
        severity: ERROR_SEVERITY.MINOR,
      });
    }

    return resp;
  }

  async refreshToken(opts: RefreshTokenOpts): Promise<RespV2<string>> {
    const { refreshToken, connectionId } = opts;
    const engine = MemoryStore.instance().getEngine();
    const { wsRoot } = engine;
    const port = await fs.readFile(path.join(wsRoot, ".dendron.port"), {
      encoding: "utf8",
    });
    let resp;

    const { data } = await axios({
      url: `https://oauth2.googleapis.com/token`,
      method: "post",
      data: {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: `http://localhost:${port}/api/oauth/getToken?service=google&connectionId=${connectionId}`,
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      },
    });
    if (!_.isEmpty(data)) {
      const opts = {
        path: !_.isUndefined(connectionId)
          ? path.join(
              wsRoot,
              "pods",
              "service-connections",
              `svcconfig.${connectionId}.yml`
            )
          : path.join(wsRoot, "pods", "dendron.gdoc", "config.import.yml"),
        tokens: {
          accessToken: data.access_token,
          // expiration time of token is set to 55mins from now.
          expirationTime: Time.now().toSeconds() + data.expires_in - 300,
        },
      };
      this.addAccessTokensToPodConfig(opts);
      resp = data.access_token;
    }
    return resp;
  }

  private async addAccessTokensToPodConfig(opts: {
    path: string;
    tokens: {
      accessToken: string;
      expirationTime: number;
      refreshToken?: string;
    };
  }) {
    const { path, tokens } = opts;
    const { accessToken, refreshToken, expirationTime } = tokens;

    let podConfig = readYAML(path);

    podConfig = {
      ...podConfig,
      accessToken,
      expirationTime,
    };
    if (!_.isUndefined(refreshToken)) {
      podConfig = {
        ...podConfig,
        refreshToken,
      };
    }
    writeYAML(path, podConfig);
  }
}
