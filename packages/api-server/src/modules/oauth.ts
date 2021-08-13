import { DendronError } from "@dendronhq/common-all";
import { MemoryStore } from "../store/memoryStore";
import axios from "axios";
import path from "path";
import fs from "fs-extra";
import _ from "lodash";

export class AuthController {
  static singleton?: AuthController;

  static instance() {
    if (!AuthController.singleton) {
      AuthController.singleton = new AuthController();
    }
    return AuthController.singleton;
  }

  async getToken(code: string): Promise<any> {
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
          client_secret: "WVoSohnyXH1_isszg6RFpPtz",
          redirect_uri: `http://localhost:${port}/api/oauth/getToken`,
          grant_type: "authorization_code",
          code,
        },
      });
      if (!_.isEmpty(data)) {
        const opts = {
          path: path.join(wsRoot, "pods", "dendron.gdoc", "config.import.yml"),
          tokens: {
            token: data.access_token,
            refreshToken: data.refresh_token,
          },
        };
        engine.writePodsConfig(opts);
        resp =
          "Authorization completed. Please return to your workspace to modify any additional import options and run import pod again";
      }

      return resp;
    } catch (err) {
      console.log("error", err);
      return {
        error: new DendronError({
          message: `Authorization Failed. ${JSON.stringify(err)}`,
        }),
        data: undefined,
      };
    }
  }

  async refreshToken(refreshToken: string): Promise<any> {
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
          client_secret: "WVoSohnyXH1_isszg6RFpPtz",
          redirect_uri: `http://localhost:${port}/api/oauth/getToken`,
          grant_type: "refresh_token",
          refresh_token: refreshToken,
        },
      });
      if (!_.isEmpty(data)) {
        const opts = {
          path: path.join(wsRoot,"pods","dendron.gdoc", "config.import.yml"),
          tokens: {
            token: data.access_token,
          }
        }
        engine.writePodsConfig(opts)
        resp = data.access_token;
      }
      return resp;
    } catch (err) {
      console.log("error", err);

      return {
        error: new DendronError({ message: JSON.stringify(err) }),
        data: undefined,
      };
    }
  }
}
