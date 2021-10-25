import { ImportPod, ImportPodConfig, ImportPodPlantOpts } from "../basev3";
import { JSONSchemaType } from "ajv";
import { PodUtils } from "../utils";
import {
  axios,
  DendronError,
  DEngineClient,
  DVault,
  ERROR_SEVERITY,
  getSlugger,
  NoteUtils,
  stringifyError,
  Time,
} from "@dendronhq/common-all";
import _ from "lodash";

const ID = "dendron.orbit";

type OrbitImportPodCustomOpts = {
  /**
   * orbit workspace slug
   */
  workspaceSlug: string;
  /**
   * orbit person access token
   */
  token: string;
};

type OrbitImportPodConfig = ImportPodConfig & OrbitImportPodCustomOpts;

type MembersOpts = {
  name: string;
  github: string;
  discord: string;
  linkedin: string;
  twitter: string;
  email: string;
};

export type OrbitImportPodPlantOpts = ImportPodPlantOpts;

export class OrbitImportPod extends ImportPod<OrbitImportPodConfig> {
  static id: string = ID;
  static description: string = "import orbit workspace members";

  get config(): JSONSchemaType<OrbitImportPodConfig> {
    return PodUtils.createImportConfig({
      required: ["workspaceSlug", "token"],
      properties: {
        token: {
          type: "string",
          description: "orbit personal access token",
        },
        workspaceSlug: {
          type: "string",
          description: "slug of workspace to import from",
        },
      },
    }) as JSONSchemaType<OrbitImportPodConfig>;
  }

  /**
   * method to fetch all the members for an orbit workspace
   * @param opts
   * @returns members
   */
  getMembersFromOrbit = async (
    opts: OrbitImportPodCustomOpts
  ): Promise<MembersOpts[]> => {
    const { token, workspaceSlug } = opts;
    const headers = {
      Authorization: `Bearer ${token}`,
    };
    const members: MembersOpts[] = [];
    try {
      const response = await axios.get(
        `https://app.orbit.love/api/v1/${workspaceSlug}/members`,
        { headers }
      );
      response.data.data.forEach((member: any) => {
        const attributes = member.attributes;
        const { name, github, discord, linkedin, twitter, email } = attributes;
        const slugger = getSlugger();
        members.push({
          name: slugger.slug(name),
          github,
          discord,
          linkedin,
          twitter,
          email,
        });
      });
    } catch (error: any) {
      throw new DendronError({
        message: stringifyError(error),
        severity: ERROR_SEVERITY.MINOR,
      });
    }
    return members;
  };
  /**
   * method to parse members as notes
   */
  async membersToNotes(opts: {
    members: any;
    vault: DVault;
    engine: DEngineClient;
    wsRoot: string;
    config: ImportPodConfig;
  }) {
    const { vault, members, engine, wsRoot, config } = opts;
    const duplicate = new Map<string, string>();
    const notes = _.map(members, (member) => {
      const { name, github, discord, linkedin, twitter, email } = member;
      member = {
        custom: {
          ...config.frontmatter,
          social: {
            linkedin,
            github,
            twitter,
            discord,
          },
          contact: {
            email,
          },
        },
      };
      const noteName = name || github || discord;
      let fname;

      const note = NoteUtils.getNoteByFnameV5({
        fname: `people.${noteName}`,
        notes: engine.notes,
        vault,
        wsRoot,
      });
      if (!_.isUndefined(note)) {
        fname = `people.orbit.duplicate.${Time.now().toFormat(
          "y.MM.dd"
        )}.${noteName}`;
        duplicate.set(fname, `people.${noteName}`);
      } else {
        fname = `people.${noteName}`;
      }
      return NoteUtils.create({ ...member, fname, vault });
    });

    return { notes, duplicate };
  }

  async plant(opts: OrbitImportPodPlantOpts) {
    const ctx = "OrbitImportPod";
    this.L.info({ ctx, opts, msg: "enter" });
    const { vault, config, engine, wsRoot } = opts;
    const { token, workspaceSlug } = config as OrbitImportPodConfig;
    const members = await this.getMembersFromOrbit({ token, workspaceSlug });
    const { notes, duplicate } = await this.membersToNotes({
      members,
      vault,
      engine,
      wsRoot,
      config,
    });
    await engine.bulkAddNotes({ notes });

    return { importedNotes: notes };
  }
}
