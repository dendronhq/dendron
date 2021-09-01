import { DendronError, RespV2, Time } from "@dendronhq/common-all";
import { MemoryStore } from "../store/memoryStore";
import axios from "axios";
import path from "path";
import fs from "fs-extra";
import _ from "lodash";

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
};

type RefreshTokenOpts = {
  refreshToken: string;
};

export class GoogleAuthController implements TokenMethods {
  clientId: string;
  clientSecret: string;

  constructor(clientId: string, clientSecret: string) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
  }
  async getToken(opts: GetTokenOpts): Promise<RespV2<any> | GetTokenPayload> {
    const { code } = opts;
    const engine = MemoryStore.instance().getEngine();
    const { wsRoot } = engine;
    const configPath = path.join(
      wsRoot,
      "pods",
      "dendron.gdoc",
      "config.import.yml"
    );
    const port = await fs.readFile(path.join(wsRoot, ".dendron.port"), {
      encoding: "utf8",
    });
    let resp;
    try {
      const { data } = await axios({
        url: `https://oauth2.googleapis.com/token`,
        method: "post",
        data: {
          client_id: this.clientId,
          client_secret: this.clientSecret,
          redirect_uri: `http://localhost:${port}/api/oauth/getToken?service=google`,
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
        engine.addAccessTokensToPodConfig(opts);
        resp =
          "Authorization completed. Please return to your workspace and specify vaultName in config.import.yml and then run the import pod again. You can now close this window.";
      }

      return resp;
    } catch (err) {
      fs.unlink(configPath);
      return {
        error: new DendronError({
          message: `Authorization Failed. ${JSON.stringify(err)}`,
        }),
        data: undefined,
      };
    }
  }

  async refreshToken(opts: RefreshTokenOpts): Promise<RespV2<string>> {
    const { refreshToken } = opts;
    const engine = MemoryStore.instance().getEngine();
    const { wsRoot } = engine;
    const port = await fs.readFile(path.join(wsRoot, ".dendron.port"), {
      encoding: "utf8",
    });
    let resp;
    try {
      const { data } = await axios({
        url: `https://oauth2.googleapis.com/token`,
        method: "post",
        data: {
          client_id: this.clientId,
          client_secret: this.clientSecret,
          redirect_uri: `http://localhost:${port}/api/oauth/getToken?service=google`,
          grant_type: "refresh_token",
          refresh_token: refreshToken,
        },
      });
      if (!_.isEmpty(data)) {
        const opts = {
          path: path.join(wsRoot, "pods", "dendron.gdoc", "config.import.yml"),
          tokens: {
            accessToken: data.access_token,
            // expiration time of token is set to 55mins from now.
            expirationTime: Time.now().toSeconds() + data.expires_in - 300,
          },
        };
        engine.addAccessTokensToPodConfig(opts);
        resp = data.access_token;
      }
      return resp;
    } catch (err) {
      return {
        error: new DendronError({ message: JSON.stringify(err) }),
        data: undefined,
      };
    }
  }
}
