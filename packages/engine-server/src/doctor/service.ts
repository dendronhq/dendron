import {
  assertInvalidState,
  asyncLoopOneAtATime,
  ConfigService,
  ConfigUtils,
  DendronError,
  DEngineClient,
  Disposable,
  DLink,
  DVault,
  extractNoteChangeEntryCounts,
  genUUID,
  InvalidFilenameReason,
  isNotUndefined,
  NoteChangeEntry,
  NoteDicts,
  NoteDictsUtils,
  NoteProps,
  NoteUtils,
  ProcFlavor,
  URI,
  ValidateFnameResp,
  VaultUtils,
} from "@dendronhq/common-all";
import {
  createDisposableLogger,
  DConfig,
  isSelfContainedVaultFolder,
  pathForVaultRoot,
} from "@dendronhq/common-server";
import throttle from "@jcoreio/async-throttle";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import { DEPRECATED_PATHS, Git, WorkspaceService } from "..";
import {
  ProcMode,
  MDUtilsV5,
  LinkUtils,
  RemarkUtils,
  DendronASTDest,
} from "@dendronhq/unified";

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
  FIX_INVALID_FILENAMES = "fixInvalidFileNames",
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
  private print: Function;

  constructor(opts?: { printFunc?: Function }) {
    const { logger, dispose } = createDisposableLogger("DoctorService");
    this.L = logger;
    this.loggerDispose = dispose;
    // if given a print function, use that.
    // otherwise, no-op
    this.print = opts?.printFunc ? opts.printFunc : () => {};
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
      const noteExists: NoteProps | undefined = NoteDictsUtils.findByFname({
        fname: link.to!.fname as string,
        noteDicts,
        vault: hasVaultPrefix ? vault! : note.vault,
      })[0];
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
    const noteDicts = NoteDictsUtils.createNoteDicts(notes);
    _.forEach(notes, (note) => {
      const links = note.links;
      if (_.isEmpty(links)) {
        return;
      }
      const brokenLinks = this.findBrokenLinks(note, noteDicts, engine);
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
      notes =
        (query
          ? await engine.queryNotes({ qs: query, originalQS: query })
          : await engine.findNotes({ excludeStub: true })) ?? [];
    } else {
      notes = candidates;
    }
    if (notes) {
      notes = notes.filter((n) => !n.stub);
    }

    const noteDicts = NoteDictsUtils.createNoteDicts(notes);
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
        const { wsRoot } = engine;
        const configReadRawResult = await ConfigService.instance().readRaw(
          URI.file(wsRoot)
        );
        if (configReadRawResult.isErr()) {
          throw configReadRawResult.error;
        }
        const rawConfig = configReadRawResult.value;
        const configReadResult = await ConfigService.instance().readConfig(
          URI.file(wsRoot)
        );
        if (configReadResult.isErr()) {
          throw configReadResult.error;
        }
        const config = configReadResult.value;
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

          const configWriteResult = await ConfigService.instance().writeConfig(
            URI.file(wsRoot),
            configDeepCopy
          );
          if (configWriteResult.isErr()) {
            throw configWriteResult.error;
          }

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
        const configReadRawResult = await ConfigService.instance().readRaw(
          URI.file(wsRoot)
        );
        if (configReadRawResult.isErr()) {
          throw configReadRawResult.error;
        }
        const rawConfig = configReadRawResult.value;

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
            const configWriteResult =
              await ConfigService.instance().writeConfig(
                URI.file(wsRoot),
                backfilledConfig
              );
            if (configWriteResult.isErr()) {
              throw configWriteResult.error;
            }
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
        this.print(
          "the CLI currently doesn't support this action. please run this using the plugin"
        );
        return { exit };
      }
      // eslint-disable-next-line no-fallthrough
      case DoctorActionsEnum.H1_TO_TITLE: {
        doctorAction = async (note: NoteProps) => {
          const changes: NoteChangeEntry[] = [];
          const configReadResult = await ConfigService.instance().readConfig(
            URI.file(engine.wsRoot)
          );
          if (configReadResult.isErr()) {
            throw configReadResult.error;
          }
          const config = configReadResult.value;
          const proc = MDUtilsV5._procRemark(
            {
              mode: ProcMode.IMPORT,
              flavor: ProcFlavor.REGULAR,
            },
            {
              dest: DendronASTDest.MD_DENDRON,
              noteToRender: note,
              fname: note.fname,
              vault: note.vault,
              config,
            }
          );
          const newBody = await proc()
            .use(RemarkUtils.h1ToTitle(note, changes))
            .process(note.body);
          note.body = newBody.toString();
          if (!_.isEmpty(changes)) {
            await engineWrite(note);
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
          const configReadResult = await ConfigService.instance().readConfig(
            URI.file(engine.wsRoot)
          );
          if (configReadResult.isErr()) {
            throw configReadResult.error;
          }
          const config = configReadResult.value;
          const proc = MDUtilsV5._procRemark(
            {
              mode: ProcMode.IMPORT,
              flavor: ProcFlavor.REGULAR,
            },
            {
              dest: DendronASTDest.MD_DENDRON,
              noteToRender: note,
              fname: note.fname,
              vault: note.vault,
              config,
            }
          );
          const newBody = await proc()
            .use(RemarkUtils.h1ToH2(note, changes))
            .process(note.body);
          note.body = newBody.toString();
          if (!_.isEmpty(changes)) {
            await engineWrite(note);
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
            overrideExisting: true,
          });
          numChanges += 1;
        };
        break;
      }
      case DoctorActionsEnum.FIND_BROKEN_LINKS: {
        resp = [];
        doctorAction = async (note: NoteProps) => {
          const brokenLinks = this.findBrokenLinks(note, noteDicts, engine);
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
            const config = await workspaceService.config;
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
        notes = notes.filter(
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
          await engine.writeNote(updatedNote);
        };
        break;
      }
      case DoctorActionsEnum.FIX_INVALID_FILENAMES: {
        const { canRename, cantRename, stats } = this.findInvalidFileNames({
          notes,
          noteDicts,
        });
        resp = stats;

        if (canRename.length > 0) {
          this.print("Found invalid filename in notes:\n");
          canRename.forEach((item) => {
            const { note, resp, cleanedFname } = item;
            const { fname, vault } = note;
            const vaultName = VaultUtils.getName(vault);
            this.print(
              `Note "${fname}" in ${vaultName} (reason: ${resp.reason})`
            );
            this.print(`  Can be automatically fixed to "${cleanedFname}"`);
          });
        }
        let changes: NoteChangeEntry[] = [];
        if (!dryRun) {
          changes = await this.fixInvalidFileNames({
            canRename,
            engine,
          });
        }

        if (cantRename.length > 0) {
          this.print(
            "These notes' filenames cannot be automatically fixed because it will result in duplicate notes:"
          );
          cantRename.forEach((item) => {
            const { note, resp, cleanedFname } = item;
            const { fname, vault } = note;
            const vaultName = VaultUtils.getName(vault);
            this.print(
              `Note "${fname}" in ${vaultName} (reason: ${resp.reason})`
            );
            this.print(`  Note "${cleanedFname}" already exists.`);
          });
        }

        const changeCounts = extractNoteChangeEntryCounts(changes);
        resp = {
          ...resp,
          ...changeCounts,
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
    if (action === DoctorActionsEnum.FIND_BROKEN_LINKS) {
      this.print(JSON.stringify({ brokenLinks: resp }, null, "  "));
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

  findInvalidFileNames(opts: { notes: NoteProps[]; noteDicts: NoteDicts }) {
    const { notes, noteDicts } = opts;
    const validationResps = notes
      // stubs will be automatically handled when their children are renamed
      .filter((note: NoteProps) => {
        return !note.stub;
      })
      .map((note: NoteProps) => {
        const { fname } = note;
        const resp = NoteUtils.validateFname(fname);
        return {
          note,
          resp,
        };
      });
    const invalidResps = validationResps.filter(
      (validationResp) => !validationResp.resp.isValid
    );
    const stats = {
      numEmptyHierarchy: invalidResps.filter(
        (item) => item.resp.reason === InvalidFilenameReason.EMPTY_HIERARCHY
      ).length,
      numIllegalCharacter: invalidResps.filter(
        (item) => item.resp.reason === InvalidFilenameReason.ILLEGAL_CHARACTER
      ).length,
      numLeadingOrTrailingWhitespace: invalidResps.filter(
        (item) =>
          item.resp.reason ===
          InvalidFilenameReason.LEADING_OR_TRAILING_WHITESPACE
      ).length,
    };

    const [canRename, cantRename] = _.partition(
      invalidResps.map((item) => {
        const { note } = item;
        const { fname } = note;
        const cleanedFname = NoteUtils.cleanFname({
          fname,
        });
        const canRename =
          NoteDictsUtils.findByFname({
            fname: cleanedFname,
            noteDicts,
            vault: note.vault,
          }).length === 0;
        return {
          ...item,
          cleanedFname,
          canRename,
        };
      }),
      (item) => item.canRename
    );

    return {
      canRename,
      cantRename,
      stats,
    };
  }

  async fixInvalidFileNames(opts: {
    canRename: {
      cleanedFname: string;
      canRename: boolean;
      note: NoteProps;
      resp: ValidateFnameResp;
    }[];
    engine: DEngineClient;
  }) {
    const { canRename, engine } = opts;
    let changes: NoteChangeEntry[] = [];
    if (canRename.length > 0) {
      await asyncLoopOneAtATime(canRename, async (item) => {
        const { note, cleanedFname } = item;
        const { fname, vault } = note;
        const vaultName = VaultUtils.getName(vault);
        const out = await engine.renameNote({
          oldLoc: {
            fname,
            vaultName,
          },
          newLoc: {
            fname: cleanedFname,
            vaultName,
          },
        });
        if (out.data) {
          changes = changes.concat(out.data);
          this.print(
            `Note "${fname}" in ${vaultName} renamed to "${cleanedFname}"`
          );
        }
        if (out.error) {
          this.print(
            `Error encountered while renaming "${fname}" in vault ${vaultName}. The filename of this note is still invalid. Please manually rename this note.`
          );
        }
      });
      this.print("\n");
    }
    return changes;
  }
}
