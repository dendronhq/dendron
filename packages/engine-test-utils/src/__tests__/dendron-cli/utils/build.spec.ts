import { BuildUtils } from "@dendronhq/dendron-cli";
import fs from "fs-extra";
import path from "path";
import sinon, { stub } from "sinon";
import {tmpDir} from "@dendronhq/common-server";
import {DendronError} from "@dendronhq/common-all";

describe("getLernaRoot", () => {
	beforeEach(()=> {
	});
	afterEach(()=> {
		sinon.restore();
	});

  test("ok: cwd = root ", async () => {
		const root = tmpDir().name;
		fs.ensureFileSync(path.join(root, "lerna.json"))
		stub(process, "cwd").returns(root);
		expect(BuildUtils.getLernaRoot()).toEqual(root);
  });

  test("ok: cwd below root ", async () => {
		const root = tmpDir().name;
		const twoDirsBelow = path.join(root, "one", "two");
		fs.ensureDirSync(path.join(twoDirsBelow));
		fs.ensureFileSync(path.join(root, "lerna.json"))
		stub(process, "cwd").returns(twoDirsBelow);
		expect(BuildUtils.getLernaRoot()).toEqual(root);
  });

  test("error: missing", async () => {
		const root = tmpDir().name;
		const twoDirsBelow = path.join(root, "one", "two");
		fs.ensureDirSync(path.join(twoDirsBelow));
		stub(process, "cwd").returns(twoDirsBelow);
		expect(BuildUtils.getLernaRoot).toThrow(DendronError);
  });
});