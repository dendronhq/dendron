import { ImportPod, ImportPodConfig, ImportPodPlantOpts } from "../basev3";
import { JSONSchemaType } from "ajv";
import { ConflictHandler, PodUtils } from "../utils";
import {
  asyncLoopOneAtATime,
  cleanName,
  Conflict,
  DendronError,
  DEngineClient,
  DVault,
  ERROR_SEVERITY,
  MergeConflictOptions,
  NoteProps,
  NoteUtils,
  PodConflictResolveOpts,
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
  email: string;
};

type UpdateNotesOpts = {
  note: NoteProps;
  engine: DEngineClient;
  social: Partial<MembersOpts>;
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
    opts: OrbitImportPodCustomOpts & { link: string }
  ): Promise<any> => {
    const { token, workspaceSlug } = opts;
    let { link } = opts;
    link =
      link.length > 0
        ? link
        : `https://app.orbit.love/api/v1/${workspaceSlug}/members?items=100`;
    const headers = {
      Authorization: `Bearer ${token}`,
    };
    const members: MembersOpts[] = [];
    let next = null;
    try {
      const response = await axios.get(link, { headers });
      response.data.data.forEach((member: any) => {
        const attributes = member.attributes;
        const {
          id,
          name,
          github,
          discord,
          linkedin,
          twitter,
          hn,
          website,
          email,
        } = attributes;
        members.push({
          name,
          github,
          discord,
          linkedin,
          twitter,
          hn,
          website,
          orbitId: id,
          email,
        });
        next = response.data.links.next;
      });
    } catch (error: any) {
      throw new DendronError({
        message: stringifyError(error),
        severity: ERROR_SEVERITY.MINOR,
      });
    }
    return { members, next };
  };

  /**
   * method to parse members as notes.
   * - creates new noteprops if note is not already there in the vault
   * - writes in a temporary hierarchy if the note is conflicted
   * - updates previously imported notes if there are no conflicts
   */
  async membersToNotes(opts: {
    members: MembersOpts[];
    vault: DVault;
    engine: DEngineClient;
    wsRoot: string;
    config: ImportPodConfig;
  }) {
    const { vault, members, engine, config } = opts;
    const conflicts: Conflict[] = [];
    const create: NoteProps[] = [];
    const notesToUpdate: UpdateNotesOpts[] = [];
    await asyncLoopOneAtATime(members, async (member) => {
      const { github, discord, twitter } = member;
      const { name, email, orbitId, ...social } = member;

      if (
        _.values({ ...social, email }).every(
          (val) => _.isNull(val) || _.isUndefined(val)
        )
      ) {
        this.L.error({ ctx: "memberToNotes", member });
      } else {
        let noteName =
          name || github || discord || twitter || this.getNameFromEmail(email);
        noteName = cleanName(noteName);
        this.L.debug({ ctx: "membersToNotes", msg: "enter", member });
        let fname;
        const note = (
          await engine.findNotes({ fname: `people.${noteName}`, vault })
        )[0];

        if (!_.isUndefined(note)) {
          const conflictData = this.getConflictedData({ note, social });
          if (conflictData.length > 0) {
            fname = `people.orbit.duplicate.${Time.now().toFormat(
              "y.MM.dd"
            )}.${noteName}`;
            conflicts.push({
              conflictNote: note,
              conflictEntry: NoteUtils.create({
                fname,
                vault,
                custom: { ...config.frontmatter, orbitId, social },
              }),
              conflictData,
            });
          } else {
            notesToUpdate.push({ note, social, engine });
          }
        } else {
          fname = `people.${noteName}`;
          create.push(
            NoteUtils.create({
              fname,
              vault,
              custom: {
                ...config.frontmatter,
                orbitId,
                social,
              },
            })
          );
        }
      }
    });
    await Promise.all(
      notesToUpdate.map(({ note, social, engine }) => {
        return this.updateNoteData({ note, social, engine });
      })
    );

    return { create, conflicts };
  }

  getNameFromEmail(email: string): string {
    return email.split("@")[0];
  }

  /**
   * returns all the conflicted entries in custom.social FM field of note
   */
  getConflictedData = (opts: {
    note: NoteProps;
    social: Partial<MembersOpts>;
  }) => {
    const { note, social } = opts;
    const customKeys = Object.keys(social);
    return customKeys.filter((key) => {
      return (
        note.custom.social[key] !== null &&
        social[key as keyof MembersOpts] !== note.custom.social[key]
      );
    });
  };

  /**
   * updates the social fields of a note's FM
   */
  updateNoteData = async (opts: {
    note: NoteProps;
    social: Partial<MembersOpts>;
    engine: DEngineClient;
  }) => {
    const { note, social, engine } = opts;
    const customKeys = Object.keys(social);
    let shouldUpdate = false;
    customKeys.forEach((key) => {
      if (
        note.custom?.social[key] === null &&
        social[key as keyof MembersOpts] !== null
      ) {
        note.custom.social[key] = social[key as keyof MembersOpts];
        shouldUpdate = true;
      }
    });
    if (shouldUpdate) {
      await engine.writeNote(note);
    }
  };

  async onConflict(opts: {
    conflicts: Conflict[];
    index: number;
    handleConflict: (
      conflict: Conflict,
      conflictResolveOpts: PodConflictResolveOpts
    ) => Promise<string | undefined>;
    engine: DEngineClient;
    conflictResolvedNotes: NoteProps[];
    conflictResolveOpts: PodConflictResolveOpts;
  }): Promise<any> {
    const {
      conflicts,
      handleConflict,
      engine,
      conflictResolvedNotes,
      conflictResolveOpts,
    } = opts;
    let { index } = opts;
    const conflict = conflicts[index];
    const resp = await handleConflict(conflict, conflictResolveOpts);
    switch (resp) {
      case MergeConflictOptions.OVERWRITE_LOCAL: {
        conflict.conflictEntry.fname = conflict.conflictNote.fname;
        await engine.writeNote(conflict.conflictEntry);
        break;
      }
      case MergeConflictOptions.SKIP:
        break;
      case MergeConflictOptions.SKIP_ALL:
        index = conflicts.length;
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
        conflictResolveOpts,
      });
    } else {
      return conflictResolvedNotes;
    }
  }

  validateMergeConflictResponse(choice: number, options: string[]) {
    if (options[choice]) {
      return true;
    } else {
      return "Invalid Choice! Choose 0/1";
    }
  }

  getMergeConflictOptions() {
    return [
      MergeConflictOptions.OVERWRITE_LOCAL,
      MergeConflictOptions.SKIP,
      MergeConflictOptions.SKIP_ALL,
    ];
  }

  getMergeConflictText(conflict: Conflict) {
    let conflictentries = "";
    conflict.conflictData.forEach((key) => {
      conflictentries = conflictentries.concat(
        `\n${key}: \nremote: ${conflict.conflictEntry.custom.social[key]}\nlocal: ${conflict.conflictNote.custom.social[key]}\n`
      );
    });
    return `\nWe noticed different fields for user ${conflict.conflictNote.title} in the note: ${conflict.conflictNote.fname}. ${conflictentries}\n`;
  }

  async plant(opts: OrbitImportPodPlantOpts) {
    const ctx = "OrbitImportPod";
    this.L.info({ ctx, msg: "enter" });
    const { vault, config, engine, wsRoot, utilityMethods } = opts;
    const { token, workspaceSlug } = config as OrbitImportPodConfig;
    let next = "";
    let members: MembersOpts[] = [];
    while (next !== null) {
      const result = await this.getMembersFromOrbit({
        token,
        workspaceSlug,
        link: next,
      });
      members = [...members, ...result.members];
      next = result.next;
    }
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
    this.L.debug({
      ctx: "createdAndConflictedNotes",
      created: create.length,
      conflicted: conflicts.length,
    });
    await engine.bulkWriteNotes({ notes: create, skipMetadata: true });
    const { handleConflict } = utilityMethods as ConflictHandler;
    const conflictResolveOpts: PodConflictResolveOpts = {
      options: this.getMergeConflictOptions,
      message: this.getMergeConflictText,
      validate: this.validateMergeConflictResponse,
    };
    const conflictResolvedNotes =
      conflicts.length > 0
        ? await this.onConflict({
            conflicts,
            handleConflict,
            engine,
            index: 0,
            conflictResolvedNotes: conflictNoteArray,
            conflictResolveOpts,
          })
        : [];
    return { importedNotes: [...create, ...conflictResolvedNotes] };
  }
}
