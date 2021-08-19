import { DendronError, Time } from "@dendronhq/common-all";
import { MemoryStore } from "../store/memoryStore";
import axios from "axios";
import path from "path";
import fs from "fs-extra";
import _ from "lodash";

interface TokenMethods {
  getToken: (opts: GetTokenOpts) => Promise<any>;
  refreshToken: (opts: RefreshTokenOpts) => any;
}

type GetTokenOpts = {
  code: string;
};

type RefreshTokenOpts = {
  refreshToken: string;
};

export class GoogleAuthController implements TokenMethods {
  static instance() {
    const googleAuthController = new GoogleAuthController();
    return googleAuthController;
  }

  async getToken(opts: GetTokenOpts): Promise<any> {
    const { code } = opts;
    const engine = MemoryStore.instance().getEngine();
    const { wsRoot } = engine;
    const port = fs.readFileSync(path.join(wsRoot, ".dendron.port"), {
      encoding: "utf8",
    });
    let resp;
    try {
      const { data } = await axios({
        url: `https://oauth2.googleapis.com/token`,
        method: "post",
        data: {
          client_id:
            "587163973906-od2u5uaop9b2u6ero5ltl342hh38frth.apps.googleusercontent.com",
          client_secret: "scXCYiq0boH7bk_c43mZbvBZ",
          redirect_uri: `http://localhost:${port}/api/oauth/getToken?service=google`,
          grant_type: "authorization_code",
          code,
        },
      });
      if (!_.isEmpty(data)) {
        const opts = {
          path: path.join(wsRoot, "pods", "dendron.gdoc", "config.import.yml"),
          tokens: {
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            expiresIn: Time.now().toSeconds() + data.expires_in - 300,
          },
        };
        engine.addAccessTokensToPodConfig(opts);
        resp =
          "Authorization completed. Please return to your workspace to modify any additional import options and run import pod again";
      }

      return resp;
    } catch (err) {
      return {
        error: new DendronError({
          message: `Authorization Failed. ${JSON.stringify(err)}`,
        }),
        data: undefined,
      };
    }
  }

  async refreshToken(opts: RefreshTokenOpts): Promise<any> {
    const { refreshToken } = opts;
    const engine = MemoryStore.instance().getEngine();
    const { wsRoot } = engine;
    const port = fs.readFileSync(path.join(wsRoot, ".dendron.port"), {
      encoding: "utf8",
    });
    let resp;
    try {
      const { data } = await axios({
        url: `https://oauth2.googleapis.com/token`,
        method: "post",
        data: {
          client_id:
            "587163973906-od2u5uaop9b2u6ero5ltl342hh38frth.apps.googleusercontent.com",
          client_secret: "scXCYiq0boH7bk_c43mZbvBZ",
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
            // expiration time of token is 55mins from now.
            expiresIn: Time.now().toSeconds() + data.expires_in - 300,
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
