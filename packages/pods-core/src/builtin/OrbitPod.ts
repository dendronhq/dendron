import {
  Conflict,
  ImportPod,
  ImportPodConfig,
  ImportPodPlantOpts,
} from "../basev3";
import { JSONSchemaType } from "ajv";
import { ConflictHandler, PodUtils } from "../utils";
import {
  DendronError,
  DEngineClient,
  DVault,
  ERROR_SEVERITY,
  getSlugger,
  NoteProps,
  NoteUtils,
  stringifyError,
  Time,
} from "@dendronhq/common-all";
import axios from "axios";
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

export enum MergeConflictOptions {
  OVERWRITE = "Overwrite local value with remote value",
  SKIP = "Skip (We will not merge, you'll resolve this manually)",
}

type OrbitImportPodConfig = ImportPodConfig & OrbitImportPodCustomOpts;

type MembersOpts = {
  orbitId: string;
  name: string;
  github: string;
  discord: string;
  linkedin: string;
  twitter: string;
  hn: string;
  website: string;
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
        const { id, name, github, discord, linkedin, twitter, hn, website } =
          attributes;
        const slugger = getSlugger();
        members.push({
          name: slugger.slug(name),
          github,
          discord,
          linkedin,
          twitter,
          hn,
          website,
          orbitId: id,
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
   * method to parse members as notes.
   * - creates new noteprops if note is not already there in the vault
   * - writes in a temporary hierarchy if the note is conflicted
   * - updates previously imported notes if there are no conflicts
   */
  async membersToNotes(opts: {
    members: any;
    vault: DVault;
    engine: DEngineClient;
    wsRoot: string;
    config: ImportPodConfig;
  }) {
    const { vault, members, engine, wsRoot, config } = opts;
    const conflicts: Conflict[] = [];
    const create: NoteProps[] = [];
    members.forEach((member: any) => {
      const { orbitId, name, github, discord, linkedin, twitter, hn, website } =
        member;
      member = {
        custom: {
          ...config.frontmatter,
          orbitId,
          social: {
            linkedin,
            github,
            twitter,
            discord,
            hn,
            website,
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
        if (!_.isUndefined(note.custom.orbitId)) {
          const conflictData = this.getConflictedData({ note, member });
          if (conflictData.length > 0) {
            fname = `people.orbit.duplicate.${Time.now().toFormat(
              "y.MM.dd"
            )}.${noteName}`;
            conflicts.push({
              conflictNote: note,
              conflictEntry: NoteUtils.create({ ...member, fname, vault }),
              conflictData,
            });
          } else {
            this.getUpdatedData({ note, member, engine });
          }
        }
      } else {
        fname = `people.${noteName}`;
        create.push(NoteUtils.create({ ...member, fname, vault }));
      }
    });

    return { create, conflicts };
  }

  /**
   * returns all the conflicted entries in custom.social FM field of note
   */
  getConflictedData = (opts: { note: NoteProps; member: any }) => {
    const { note, member } = opts;
    const customKeys = Object.keys(note.custom?.social);
    return customKeys.filter((key: string) => {
      return (
        note.custom.social[key] !== null &&
        member.custom.social[key] !== note.custom.social[key]
      );
    });
  };

  /**
   * updates the social fields of a note's FM
   */
  getUpdatedData = (opts: {
    note: NoteProps;
    member: any;
    engine: DEngineClient;
  }) => {
    const { note, member, engine } = opts;
    const customKeys = Object.keys(note.custom?.social);
    let shouldUpdate = false;
    customKeys.forEach((key: string) => {
      if (
        note.custom?.social[key] === null &&
        member.custom.social[key] !== null
      ) {
        note.custom.social[key] = member.custom.social[key];
        shouldUpdate = true;
      }
    });
    if (shouldUpdate) {
      engine.writeNote(note, { updateExisting: true });
    }
  };

  async onConflict(opts: {
    conflicts: Conflict[];
    index: number;
    handleConflict: (conflict: Conflict) => Promise<string | undefined>;
    engine: DEngineClient;
    conflictResolvedNotes: NoteProps[];
  }): Promise<any> {
    const { conflicts, index, handleConflict, engine, conflictResolvedNotes } =
      opts;
    const conflict = conflicts[index];
    const resp = await handleConflict(conflict);
    switch (resp) {
      case MergeConflictOptions.OVERWRITE: {
        conflict.conflictEntry.fname = conflict.conflictNote.fname;
        await engine.writeNote(conflict.conflictEntry, {
          updateExisting: true,
        });
        break;
      }
      case MergeConflictOptions.SKIP:
        break;
      default: {
        break;
      }
    }
    if (index < conflicts.length - 1) {
      return this.onConflict({
        conflicts,
        engine,
        index: index + 1,
        handleConflict,
        conflictResolvedNotes,
      });
    } else {
      return conflictResolvedNotes;
    }
  }

  async plant(opts: OrbitImportPodPlantOpts) {
    const ctx = "OrbitImportPod";
    this.L.info({ ctx, opts, msg: "enter" });
    const { vault, config, engine, wsRoot, utilityMethods } = opts;
    const { token, workspaceSlug } = config as OrbitImportPodConfig;
    const members = await this.getMembersFromOrbit({ token, workspaceSlug });
    const { create, conflicts } = await this.membersToNotes({
      members,
      vault,
      engine,
      wsRoot,
      config,
    });
    const conflictNoteArray = conflicts.map(
      (conflict) => conflict.conflictNote
    );

    await engine.bulkAddNotes({ notes: create });
    const { handleConflict } = utilityMethods as ConflictHandler;
    const conflictResolvedNotes =
      conflicts.length > 0
        ? await this.onConflict({
            conflicts,
            handleConflict,
            engine,
            index: 0,
            conflictResolvedNotes: conflictNoteArray,
          })
        : [];
    return { importedNotes: [...create, ...conflictResolvedNotes] };
  }
}
