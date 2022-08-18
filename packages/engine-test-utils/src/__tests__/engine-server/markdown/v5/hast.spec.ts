/**
 * Test HTML specific transformations
 */
import { DendronASTDest, ProcFlavor } from "@dendronhq/engine-server";
import { ENGINE_HOOKS } from "../../../../presets";
import { createProcCompileTests } from "../utils";
import { getOpts, runTestCases } from "./utils";

describe("GIVEN remark", () => {
	describe("WHEN table is present", () => {
		runTestCases(
			createProcCompileTests({
				name: "table is present",
				setup: async (opts) => {
					const { proc } = getOpts(opts);
					const txt = `
| Software Name | Comparison w/ Dendron                        | Flexible Hierarchy | Open source | Local-first | Fast and performant | Bi-directional links | Outlining |
| ------------- | -------------------------------------------- | ------------------ | ----------- | ----------- | ------------------- | -------------------- | --------- |
| Dendron       | How?                                         | ✅                 | ✅          | ✅          | ✅                  | ✅                   | ❌        |`
					const resp = await proc.process(txt);
					return { resp, proc };
				},
				verify: {
					[DendronASTDest.HTML]: {
						[ProcFlavor.REGULAR]: async ({ extra }) => {
							const { resp } = extra;
							expect(resp).toMatchSnapshot();
							// await checkString(resp.contents, "No note with name alpha found");
						},
						[ProcFlavor.PREVIEW]: ProcFlavor.REGULAR,
						[ProcFlavor.PUBLISHING]: ProcFlavor.REGULAR,
					},
				},
				preSetupHook: async (opts) => {
					await ENGINE_HOOKS.setupBasic({ ...opts, extra: { idv2: true } });
				},
			})
		);
	});
});
