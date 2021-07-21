import { ServerUtils } from "@dendronhq/api-server";
import { APIUtils, DendronAPI } from "@dendronhq/common-all";
import { tmpDir } from "@dendronhq/common-server";
import execa, { ExecaChildProcess } from "execa";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import sinon from "sinon";
import { createServer, runEngineTestV5 } from "../../engine";

describe("workspace", () => {
  test("error, process exit", (done) => {
		const scriptPath = tmpDir.name;
		const subprocess = {
			on: (evt: string, cb: (error: Error) => {}) => {
				if (evt === "error") {
					cb(new Error("error from test"));
				}
			}
		};
		// @ts-ignore
		sinon.stub(execa, "node").returns(subprocess)
		ServerUtils.execServerNode({scriptPath, logPath: path.join("..", "..", "execserver.test.log")}).catch(resp => {
			expect(resp).toMatchSnapshot();
		});
  });
})