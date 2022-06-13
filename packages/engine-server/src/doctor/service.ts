import {
  assertInvalidState,
  asyncLoopOneAtATime,
  ConfigUtils,
  DendronError,
  DEngineClient,
  Disposable,
  DLink,
  DVault,
  genUUID,
  isNotUndefined,
  NoteChangeEntry,
  NoteDicts,
  NoteDictsUtils,
  NoteFnameDictUtils,
  NoteProps,
  NoteUtils,
  VaultUtils,
} from "@dendronhq/common-all";
import {
  createDisposableLogger,
  isSelfContainedVaultFolder,
  pathForVaultRoot,
} from "@dendronhq/common-server";
import throttle from "@jcoreio/async-throttle";
import _ from "lodash";
import path from "path";
import { DEPRECATED_PATHS, Git, WorkspaceService } from "..";
import { LinkUtils, RemarkUtils } from "../markdown/remark/utils";
import { DendronASTDest } from "../markdown/types";
import { MDUtilsV4 } from "../markdown/utils";
import fs from "fs-extra";
import { DConfig } from "../config";

export enum DoctorActionsEnum {
  FIX_FRONTMATTER = "fixFrontmatter",
  H1_TO_TITLE = "h1ToTitle",
  HI_TO_H2 = "h1ToH2",
  REMOVE_STUBS = "removeStubs",
  CREATE_MISSING_LINKED_NOTES = "createMissingLinkedNotes",
  REGENERATE_NOTE_ID = "regenerateNoteId",
  FIND_BROKEN_LINKS = "findBrokenLinks",
  FIX_REMOTE_VAULTS = "fixRemoteVaults",
  FIX_AIRTABLE_METADATA = "fixAirtableMetadata",
  ADD_MISSING_DEFAULT_CONFIGS = "addMissingDefaultConfigs",
  REMOVE_DEPRECATED_CONFIGS = "removeDeprecatedConfigs",
  FIX_SELF_CONTAINED_VAULT_CONFIG = "fixSelfContainedVaultsInConfig",
}

export type DoctorServiceOpts = {
  action: DoctorActionsEnum;
  query?: string;
  candidates?: NoteProps[];
  limit?: number;
  dryRun?: boolean;
  exit?: boolean;
  quiet?: boolean;
  engine: DEngineClient;
  podId?: string;
  hierarchy?: string;
  vault?: DVault | string;
};

/** DoctorService is a disposable, you **must** dispose instances you create
 * otherwise you risk leaking file descriptors which may lead to crashes. */
export class DoctorService implements Disposable {
  public L: ReturnType<typeof createDisposableLogger>["logger"];
  private loggerDispose: ReturnType<typeof createDisposableLogger>["dispose"];

  constructor() {
    const { logger, dispose } = createDisposableLogger("DoctorService");
    this.L = logger;
    this.loggerDispose = dispose;
  }

  dispose() {
    this.loggerDispose();
  }

  findBrokenLinks(
    note: NoteProps,
    noteDicts: NoteDicts,
    engine: DEngineClient
  ) {
    const { vaults } = engine;
    const links = note.links;
    if (_.isEmpty(links)) {
      return [];
    }

    const out = _.filter(links, (link) => {
      if (link.type !== "wiki") {
        return false;
      }

      const hasVaultPrefix = LinkUtils.hasVaultPrefix(link);
      let vault: DVault | undefined;
      if (hasVaultPrefix) {
        vault = VaultUtils.getVaultByName({
          vaults,
          vname: link.to!.vaultName!,
        });
        if (!vault) return false;
      }
      const isMultiVault = vaults.length > 1;
      const noteExists: NoteProps | undefined = NoteDictsUtils.findByFname(
        link.to!.fname as string,
        noteDicts,
        hasVaultPrefix ? vault! : note.vault
      )[0];
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

  getBrokenLinkDestinations(notes: NoteProps[], engine: DEngineClient) {
    const { vaults } = engine;
    let brokenWikiLinks: DLink[] = [];
    const notesById = NoteDictsUtils.createNotePropsByIdDict(notes);
    const notesByFname =
      NoteFnameDictUtils.createNotePropsByFnameDict(notesById);
    _.forEach(notes, (note) => {
      const links = note.links;
      if (_.isEmpty(links)) {
        return;
      }
      const brokenLinks = this.findBrokenLinks(
        note,
        { notesById, notesByFname },
        engine
      );
      brokenWikiLinks = brokenWikiLinks.concat(brokenLinks);

      return true;
    });
    const uniqueCandidates: NoteProps[] = _.map(
      _.uniqBy(brokenWikiLinks, "to.fname"),
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

  async findMisconfiguredSelfContainedVaults(wsRoot: string, vaults: DVault[]) {
    return (
      await Promise.all(
        vaults.map(async (vault) => {
          if (vault.selfContained || vault.workspace || vault.seed) return;
          if (
            await isSelfContainedVaultFolder(path.join(wsRoot, vault.fsPath))
          ) {
            return vault;
          }
          return;
        })
      )
    ).filter(isNotUndefined);
  }

  async executeDoctorActions(opts: DoctorServiceOpts) {
    const {
      action,
      engine,
      query,
      candidates,
      limit,
      dryRun,
      exit,
      podId,
      hierarchy,
      vault,
    } = _.defaults(opts, {
      limit: 99999,
      exit: true,
    });

    let notes: NoteProps[];
    if (_.isUndefined(candidates)) {
      notes = query
        ? engine.queryNotesSync({ qs: query, originalQS: query }).data
        : _.values(engine.notes);
    } else {
      notes = candidates;
    }
    notes = notes.filter((n) => !n.stub);
    const notesById = NoteDictsUtils.createNotePropsByIdDict(notes);
    const notesByFname =
      NoteFnameDictUtils.createNotePropsByFnameDict(notesById);
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

    let doctorAction: ((note: NoteProps) => Promise<any>) | undefined;
    switch (action) {
      case DoctorActionsEnum.REMOVE_DEPRECATED_CONFIGS: {
        const { wsRoot, config } = engine;
        const rawConfig = DConfig.getRaw(wsRoot);
        const pathsToDelete = ConfigUtils.detectDeprecatedConfigs({
          config: rawConfig,
          deprecatedPaths: DEPRECATED_PATHS,
        });
        if (pathsToDelete.length > 0) {
          const backupPath = await this.createBackup(
            wsRoot,
            DoctorActionsEnum.REMOVE_DEPRECATED_CONFIGS
          );
          if (backupPath instanceof DendronError) {
            return {
              exit: true,
              error: backupPath,
            };
          }

          const configDeepCopy = _.cloneDeep(config);
          pathsToDelete.forEach((path) => {
            _.unset(configDeepCopy, path);
          });

          await DConfig.writeConfig({ wsRoot, config: configDeepCopy });

          return {
            exit: true,
            resp: {
              backupPath,
            },
          };
        }

        return { exit: true };
      }
      case DoctorActionsEnum.ADD_MISSING_DEFAULT_CONFIGS: {
        const { wsRoot } = engine;
        const rawConfig = DConfig.getRaw(wsRoot);
        const detectOut = ConfigUtils.detectMissingDefaults({
          config: rawConfig,
        });
        if (detectOut) {
          const { needsBackfill, backfilledConfig } = detectOut;
          if (needsBackfill) {
            // back up dendron.yml first
            const backupPath = await this.createBackup(
              wsRoot,
              DoctorActionsEnum.ADD_MISSING_DEFAULT_CONFIGS
            );
            if (backupPath instanceof DendronError) {
              return {
                exit: true,
                error: backupPath,
              };
            }

            // write config
            await DConfig.writeConfig({ wsRoot, config: backfilledConfig });
            return {
              exit: true,
              resp: {
                backupPath,
              },
            };
          }
        }
        return { exit: true };
      }
      case DoctorActionsEnum.FIX_FRONTMATTER: {
        // eslint-disable-next-line no-console
        console.log(
          "the CLI currently doesn't support this action. please run this using the plugin"
        );
        return { exit };
      }
      // eslint-disable-next-line no-fallthrough
      case DoctorActionsEnum.H1_TO_TITLE: {
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
      case DoctorActionsEnum.HI_TO_H2: {
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
      case DoctorActionsEnum.REMOVE_STUBS: {
        doctorAction = async (note: NoteProps) => {
          const changes: NoteChangeEntry[] = [];
          if (_.trim(note.body) === "") {
            changes.push({
              status: "delete",
              note,
            });
          }
          if (!_.isEmpty(changes)) {
            await engineDelete(note.id);
            const vname = VaultUtils.getName(note.vault);
            this.L.info(
              `doctor ${DoctorActionsEnum.REMOVE_STUBS} ${note.fname} ${vname}`
            );
            numChanges += 1;
            return;
          } else {
            return;
          }
        };
        break;
      }
      case DoctorActionsEnum.CREATE_MISSING_LINKED_NOTES: {
        notes = this.getBrokenLinkDestinations(notes, engine);
        doctorAction = async (note: NoteProps) => {
          await engineWrite(note);
          numChanges += 1;
        };
        break;
      }
      case DoctorActionsEnum.REGENERATE_NOTE_ID: {
        doctorAction = async (note: NoteProps) => {
          if (note.id === "root") return; // Root notes are special, preserve them
          note.id = genUUID();
          await engine.writeNote(note, {
            runHooks: false,
            // Old note needs to be removed
            updateExisting: false,
          });
          numChanges += 1;
        };
        break;
      }
      case DoctorActionsEnum.FIND_BROKEN_LINKS: {
        resp = [];
        doctorAction = async (note: NoteProps) => {
          const brokenLinks = this.findBrokenLinks(
            note,
            { notesById, notesByFname },
            engine
          );
          if (brokenLinks.length > 0) {
            resp.push({
              file: note.fname,
              vault: VaultUtils.getName(note.vault),
              links: brokenLinks.map((link) => {
                return {
                  value: link.value,
                  line: link.position?.start.line,
                  column: link.position?.start.column,
                };
              }),
            });
            return brokenLinks;
          } else {
            return;
          }
        };
        break;
      }
      case DoctorActionsEnum.FIX_REMOTE_VAULTS: {
        /** Convert a local vault to a remote vault if it is in a git repository and has a remote set. */
        // This action deliberately doesn't set `doctorAction` since it doesn't run per note
        const { wsRoot, vaults } = engine;
        const ctx = "ReloadIndex.convertToRemoteVaultIfPossible";

        const vaultsToFix = (
          await Promise.all(
            vaults.map(async (vault) => {
              const vaultDir = pathForVaultRoot({ wsRoot, vault });
              const gitPath = path.join(vaultDir, ".git");
              // Already a remote vault
              if (vault.remote !== undefined) return;
              // Not a git repository, nothing to convert
              if (!(await fs.pathExists(gitPath))) return;

              const git = new Git({ localUrl: vaultDir });
              const remoteUrl = await git.getRemoteUrl();
              // We can't convert if there is no remote
              if (!remoteUrl) return;

              return { vault, remoteUrl };
            })
          )
        ).filter(isNotUndefined);

        if (vaultsToFix.length > 0) {
          const out = await this.createBackup(
            wsRoot,
            DoctorActionsEnum.FIX_SELF_CONTAINED_VAULT_CONFIG
          );
          if (out instanceof DendronError) {
            return {
              exit: true,
              error: out,
            };
          }

          const workspaceService = new WorkspaceService({ wsRoot });
          await asyncLoopOneAtATime(
            vaultsToFix,
            async ({ vault, remoteUrl }) => {
              const vaultDir = pathForVaultRoot({ wsRoot, vault });
              this.L.info({
                ctx,
                vaultDir,
                remoteUrl,
                msg: "converting local vault to a remote vault",
              });
              await workspaceService.markVaultAsRemoteInConfig(
                vault,
                remoteUrl
              );
            }
          );
        }
        return { exit: true };
      }
      case DoctorActionsEnum.FIX_SELF_CONTAINED_VAULT_CONFIG: {
        /** If a self contained vault was not marked as self contained in the settings, mark it as such. */
        // This action deliberately doesn't set `doctorAction` since it doesn't run per note
        const { wsRoot, vaults } = engine;
        const ctx = "DoctorService.fixSelfContainedVaultConfig";
        const workspaceService = new WorkspaceService({ wsRoot });
        const vaultsToFix = await this.findMisconfiguredSelfContainedVaults(
          wsRoot,
          vaults
        );
        this.L.info({
          ctx,
          msg: `Found ${vaultsToFix.length} vaults to fix`,
          numVaultsToFix: vaultsToFix.length,
        });

        if (vaultsToFix.length > 0) {
          // We'll be modifying the config so take a backup first
          const out = await this.createBackup(
            wsRoot,
            DoctorActionsEnum.FIX_SELF_CONTAINED_VAULT_CONFIG
          );
          if (out instanceof DendronError) {
            return {
              exit: true,
              error: out,
            };
          }

          await asyncLoopOneAtATime(vaultsToFix, async (vault) => {
            const config = workspaceService.config;
            this.L.info({
              ctx,
              vaultName: VaultUtils.getName(vault),
              msg: "marking vault as self contained vault",
            });
            ConfigUtils.updateVault(config, vault, (vault) => {
              vault.selfContained = true;
              return vault;
            });
            await workspaceService.setConfig(config);
          });
        }
        workspaceService.dispose();
        return { exit: true };
      }
      case DoctorActionsEnum.FIX_AIRTABLE_METADATA: {
        // Converts the airtable id in note frontmatter from a single scalar value to a hashmap
        if (!podId) {
          assertInvalidState(
            "Please provide the pod Id that was used to export the note(s)."
          );
        }
        // we get vault name(string) as parameter from cli and vault(DVault) from plugin
        const selectedVault = _.isString(vault)
          ? VaultUtils.getVaultByName({ vaults: engine.vaults, vname: vault })
          : vault;
        const selectedHierarchy = _.isUndefined(query) ? hierarchy : query;
        // Plugin already checks for selected hierarchy. This check is useful when fixAirtableMetadata action is ran from cli
        if (!selectedHierarchy || !selectedVault) {
          assertInvalidState(
            "Please provide the hierarchy(with --query arg) and vault(--vault) of notes you would like to update with new Airtable Metadata"
          );
        }
        //finding candidate notes
        notes = Object.values(notes).filter(
          (value) =>
            value.fname.startsWith(selectedHierarchy) &&
            value.stub !== true &&
            VaultUtils.isEqualV2(value.vault, selectedVault) &&
            value.custom.airtableId
        );
        this.L.info({
          msg: `${DoctorActionsEnum.FIX_FRONTMATTER} ${notes.length} Notes will be Affected`,
        });

        doctorAction = async (note: NoteProps) => {
          //get airtable id from note
          const airtableId = _.get(note.custom, "airtableId") as string;
          const pods = {
            airtable: {
              [podId]: airtableId,
            },
          };
          delete note.custom["airtableId"];
          const updatedNote = {
            ...note,
            custom: { ...note.custom, pods },
          };
          // update note
          await engine.writeNote(updatedNote, { updateExisting: true });
        };
        break;
      }
      default:
        throw new DendronError({
          message:
            "Unexpected Doctor action. If this is something Dendron should support, please create an issue on our Github repository.",
        });
    }
    if (doctorAction !== undefined) {
      for (const note of notes) {
        if (numChanges >= limit) break;
        this.L.debug({ msg: `processing ${note.fname}` });
        // eslint-disable-next-line no-await-in-loop
        await doctorAction(note);
      }
    }
    this.L.info({ msg: "doctor done", numChanges });
    if (action === DoctorActionsEnum.FIND_BROKEN_LINKS && !opts.quiet) {
      // eslint-disable-next-line no-console
      console.log(JSON.stringify({ brokenLinks: resp }, null, "  "));
    }
    return { exit, resp };
  }

  /** Returns the path for the backup if it was able to create one, or a DendronError if one occurred during backup. */
  async createBackup(
    wsRoot: string,
    backupInfix: string
  ): Promise<string | DendronError> {
    try {
      const path = await DConfig.createBackup(wsRoot, backupInfix);
      return path;
    } catch (error) {
      return new DendronError({
        message: `Backup ${backupInfix} failed. Aborting the Doctor action.`,
        payload: error,
      });
    }
  }
}
