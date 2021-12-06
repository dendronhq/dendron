import {
  DendronError,
  DEngineClient,
  DLink,
  DVault,
  genUUID,
  NoteChangeEntry,
  NoteProps,
  NoteUtils,
  VaultUtils,
} from "@dendronhq/common-all";
import { createLogger } from "@dendronhq/common-server";
import _ from "lodash";
import { LinkUtils, RemarkUtils } from "../markdown/remark/utils";
import { DendronASTDest } from "../markdown/types";
import { MDUtilsV4 } from "../markdown/utils";
import throttle from "@jcoreio/async-throttle";

export enum DoctorActions {
  FIX_FRONTMATTER = "fixFrontmatter",
  H1_TO_TITLE = "h1ToTitle",
  HI_TO_H2 = "h1ToH2",
  REMOVE_STUBS = "removeStubs",
  OLD_NOTE_REF_TO_NEW = "oldNoteRefToNew",
  CREATE_MISSING_LINKED_NOTES = "createMissingLinkedNotes",
  REGENERATE_NOTE_ID = "regenerateNoteId",
  FIND_BROKEN_LINKS = "findBrokenLinks",
}

export type DoctorServiceOpts = {
  action: DoctorActions;
  query?: string;
  candidates?: NoteProps[];
  limit?: number;
  dryRun?: boolean;
  exit?: boolean;
  engine: DEngineClient;
};
export class DoctorService {
  public L: ReturnType<typeof createLogger>;

  constructor() {
    this.L = createLogger("DoctorService");
  }

  findWildLinks(note: NoteProps, notes: NoteProps[], engine: DEngineClient) {
    const { wsRoot, vaults } = engine;
    const links = note.links;
    if (_.isEmpty(links)) {
      return [];
    }

    const out = _.filter(links, (link) => {
      if (link.type !== "wiki") {
        return false;
      }

      const hasVaultPrefix = LinkUtils.hasVaultPrefix(link);
      let vaultPrefix: DVault | undefined;
      if (hasVaultPrefix) {
        vaultPrefix = VaultUtils.getVaultByName({
          vaults,
          vname: link.to!.vaultName!,
        });
        if (!vaultPrefix) return false;
      }
      const isMultiVault = vaults.length > 1;
      const noteExists = NoteUtils.getNoteByFnameV5({
        fname: link.to!.fname as string,
        vault: hasVaultPrefix ? vaultPrefix! : note.vault,
        notes,
        wsRoot,
      });
      if (hasVaultPrefix) {
        // true: link w/ vault prefix that points to nothing. (candidate for sure)
        // false: link w/ vault prefix that points to a note. (valid link)
        return !noteExists;
      }

      if (!noteExists) {
        // true: no vault prefix and single vault. (candidate for sure)
        // false: no vault prefix and multi vault. (ambiguous)
        return !isMultiVault;
      }

      // (valid link)
      return false;
    });
    return out;
  }

  getWildLinkDestinations(notes: NoteProps[], engine: DEngineClient) {
    const { vaults } = engine;
    let wildWikiLinks: DLink[] = [];
    _.forEach(notes, (note) => {
      const links = note.links;
      if (_.isEmpty(links)) {
        return;
      }
      const wildLinks = this.findWildLinks(note, notes, engine);
      wildWikiLinks = wildWikiLinks.concat(wildLinks);

      return true;
    });
    const uniqueCandidates: NoteProps[] = _.map(
      _.uniqBy(wildWikiLinks, "to.fname"),
      (link) => {
        const destVault = link.to?.vaultName
          ? VaultUtils.getVaultByName({ vaults, vname: link.to.vaultName })!
          : VaultUtils.getVaultByName({ vaults, vname: link.from.vaultName! })!;
        return NoteUtils.create({
          fname: link.to!.fname!,
          vault: destVault!,
        });
      }
    );
    return uniqueCandidates;
  }

  async executeDoctorActions(opts: DoctorServiceOpts) {
    const { action, engine, query, candidates, limit, dryRun, exit } =
      _.defaults(opts, {
        limit: 99999,
        exit: true,
      });

    let notes: NoteProps[];
    if (_.isUndefined(candidates)) {
      notes = query
        ? engine.queryNotesSync({ qs: query }).data
        : _.values(engine.notes);
    } else {
      notes = candidates;
    }
    notes = notes.filter((n) => !n.stub);
    // this.L.info({ msg: "prep doctor", numResults: notes.length });
    let numChanges = 0;
    let resp: any;
    const engineWrite = dryRun
      ? () => {}
      : throttle(_.bind(engine.writeNote, engine), 300, {
          // @ts-ignore
          leading: true,
        });
    const engineDelete = dryRun
      ? () => {}
      : throttle(_.bind(engine.deleteNote, engine), 300, {
          // @ts-ignore
          leading: true,
        });
    const engineGetNoteByPath = dryRun
      ? () => {}
      : throttle(_.bind(engine.getNoteByPath, engine), 300, {
          // @ts-ignore
          leading: true,
        });

    let doctorAction: (note: NoteProps) => Promise<any>;
    switch (action) {
      case DoctorActions.FIX_FRONTMATTER: {
        console.log(
          "the CLI currently doesn't support this action. please run this using the plugin"
        );
        return { exit };
      }
      // eslint-disable-next-line no-fallthrough
      case DoctorActions.H1_TO_TITLE: {
        doctorAction = async (note: NoteProps) => {
          const changes: NoteChangeEntry[] = [];
          const proc = MDUtilsV4.procFull({
            dest: DendronASTDest.MD_DENDRON,
            engine,
            fname: note.fname,
            vault: note.vault,
          });
          const newBody = await proc()
            .use(RemarkUtils.h1ToTitle(note, changes))
            .process(note.body);
          note.body = newBody.toString();
          if (!_.isEmpty(changes)) {
            await engineWrite(note, { updateExisting: true });
            this.L.info({ msg: `changes ${note.fname}`, changes });
            numChanges += 1;
            return;
          } else {
            return;
          }
        };
        break;
      }
      case DoctorActions.HI_TO_H2: {
        doctorAction = async (note: NoteProps) => {
          const changes: NoteChangeEntry[] = [];
          const proc = MDUtilsV4.procFull({
            dest: DendronASTDest.MD_DENDRON,
            engine,
            fname: note.fname,
            vault: note.vault,
          });
          const newBody = await proc()
            .use(RemarkUtils.h1ToH2(note, changes))
            .process(note.body);
          note.body = newBody.toString();
          if (!_.isEmpty(changes)) {
            await engineWrite(note, { updateExisting: true });
            this.L.info({ msg: `changes ${note.fname}`, changes });
            numChanges += 1;
            return;
          } else {
            return;
          }
        };
        break;
      }
      case DoctorActions.REMOVE_STUBS: {
        doctorAction = async (note: NoteProps) => {
          const changes: NoteChangeEntry[] = [];
          if (_.trim(note.body) === "") {
            changes.push({
              status: "delete",
              note,
            });
          }
          if (!_.isEmpty(changes)) {
            await engineDelete(note);
            const vname = VaultUtils.getName(note.vault);
            this.L.info(
              `doctor ${DoctorActions.REMOVE_STUBS} ${note.fname} ${vname}`
            );
            numChanges += 1;
            return;
          } else {
            return;
          }
        };
        break;
      }
      case DoctorActions.OLD_NOTE_REF_TO_NEW: {
        doctorAction = async (note: NoteProps) => {
          const changes: NoteChangeEntry[] = [];
          const proc = MDUtilsV4.procFull({
            dest: DendronASTDest.MD_DENDRON,
            engine,
            fname: note.fname,
            vault: note.vault,
          });
          const newBody = await proc()
            .use(RemarkUtils.oldNoteRef2NewNoteRef(note, changes))
            .process(note.body);
          note.body = newBody.toString();
          if (!_.isEmpty(changes)) {
            await engineWrite(note, { updateExisting: true });
            this.L.info({ msg: `changes ${note.fname}`, changes });
            numChanges += 1;
            return;
          } else {
            return;
          }
        };
        break;
      }
      case DoctorActions.CREATE_MISSING_LINKED_NOTES: {
        notes = this.getWildLinkDestinations(notes, engine);
        doctorAction = async (note: NoteProps) => {
          await engineGetNoteByPath({
            npath: note.fname,
            createIfNew: true,
            vault: note.vault,
          });
          numChanges += 1;
        };
        break;
      }
      case DoctorActions.REGENERATE_NOTE_ID: {
        doctorAction = async (note: NoteProps) => {
          if (note.id === "root") return; // Root notes are special, preserve them
          note.id = genUUID();
          await engine.writeNote(note, {
            runHooks: false,
            updateExisting: true,
          });
          numChanges += 1;
        };
        break;
      }
      case DoctorActions.FIND_BROKEN_LINKS: {
        resp = [];
        doctorAction = async (note: NoteProps) => {
          const wildLinks = this.findWildLinks(note, notes, engine);
          if (wildLinks.length > 0) {
            resp.push({
              file: note.fname,
              vault: VaultUtils.getName(note.vault),
              links: wildLinks.map((link) => {
                return {
                  value: link.value,
                  line: link.position?.start.line,
                  column: link.position?.start.column,
                };
              }),
            });
            return wildLinks;
          } else {
            return;
          }
        };
        break;
      }
      default:
        throw new DendronError({
          message:
            "Unexpected Doctor action. If this is something Dendron should support, please create an issue on our Github repository.",
        });
    }
    await _.reduce<any, Promise<any>>(
      notes,
      async (accInner, note) => {
        await accInner;
        if (numChanges >= limit) {
          return;
        }
        this.L.debug({ msg: `processing ${note.fname}` });
        return doctorAction(note);
      },
      Promise.resolve()
    );
    this.L.info({ msg: "doctor done", numChanges });
    if (action === DoctorActions.FIND_BROKEN_LINKS) {
      console.log(JSON.stringify({ brokenLinks: resp }, null, "  "));
    }
    return { exit, resp };
  }
}
