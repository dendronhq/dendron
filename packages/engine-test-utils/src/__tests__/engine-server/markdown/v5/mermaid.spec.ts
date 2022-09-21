import { NoteProps } from "@dendronhq/common-all";
import { DendronASTDest, ProcFlavor } from "@dendronhq/unified";
import fs from "fs-extra";
import path from "path";
import { ENGINE_HOOKS } from "../../../../presets";
import { checkString } from "../../../../utils";
import { createProcCompileTests } from "../utils";
import { getOpts, modifyFooInVaultOne, runTestCases } from "./utils";

describe("GIVEN mermaid", () => {
  describe("WHEN execute", () => {
    runTestCases(
      createProcCompileTests({
        name: "WITH_MERMAID",
        setup: async (opts) => {
          const { proc } = getOpts(opts);
          const npath = path.join(opts.wsRoot, opts.vaults[0].fsPath, "foo.md");
          const noteRaw = fs.readFileSync(npath, { encoding: "utf8" });
          const resp = await proc.process(noteRaw);
          return { resp, proc };
        },
        verify: {
          [DendronASTDest.HTML]: {
            [ProcFlavor.PUBLISHING]: async ({ extra }) => {
              const { resp } = extra;
              expect(resp).toMatchSnapshot();
              await checkString(
                resp.contents,
                `<h1 id="mermaid-code-block">mermaid code block<a aria-hidden="true" class="anchor-heading icon-link" href="#mermaid-code-block"></a></h1>`
              );
            },
            // [ProcFlavor.PREVIEW]: ProcFlavor.REGULAR,
            // [ProcFlavor.PUBLISHING]: ProcFlavor.REGULAR,
          },
        },
        preSetupHook: async (opts) => {
          await ENGINE_HOOKS.setupBasic({ ...opts, extra: { idv2: true } });
          await modifyFooInVaultOne(opts, (note: NoteProps) => {
            note.body = `
# mermaid code block

\`\`\`mermaid
graph LR
Start --> Stop
\`\`\`
`;
            return note;
          });
        },
      })
    );
  });
});
