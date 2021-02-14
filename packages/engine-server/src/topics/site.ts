import {
  assert,
  DendronConfig,
  DendronError,
  DendronSiteConfig,
  DendronSiteFM,
  DNodeUtilsV2,
  DuplicateNoteBehavior,
  DVault,
  DVaultVisibility,
  HierarchyConfig,
  NotePropsDictV2,
  NotePropsV2,
  NoteUtilsV2,
  VaultUtils,
} from "@dendronhq/common-all";
import {
  createLogger,
  resolvePath,
  vault2Path,
} from "@dendronhq/common-server";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import { DConfig } from "../config";
import { DEngineClientV2 } from "../types";
import { stripLocalOnlyTags } from "../utils";
const logger = createLogger();

export class SiteUtils {
  static canPublish(opts: {
    note: NotePropsV2;
    config: DendronSiteConfig;
    vaults: DVault[];
    wsRoot: string;
  }) {
    const { note, config, vaults, wsRoot } = opts;
    // check if note is in index
    const domain = DNodeUtilsV2.domainName(note.fname);
    if (
      config.siteHierarchies[0] !== "root" &&
      config.siteHierarchies.indexOf(domain) < 0
    ) {
      return false;
    }
    // check if note is note blocked
    const hconfig = this.getConfigForHierarchy({ config, noteOrName: note });
    return this.canPublishFiltered({ note, hconfig, vaults, wsRoot });
  }

  static canPublishFiltered(opts: {
    note: NotePropsV2;
    hconfig: HierarchyConfig;
    vaults: DVault[];
    wsRoot: string;
  }) {
    const { note, hconfig, vaults, wsRoot } = opts;
    const noteVault = VaultUtils.matchVault({
      vault: note.vault,
      vaults,
      wsRoot,
    });
    assert(noteVault !== false, "noteVault should exist");
    const cNoteVault = noteVault as DVault;

    let publishByDefault = undefined;
    if (hconfig?.publishByDefault) {
      publishByDefault = _.isBoolean(hconfig.publishByDefault)
        ? hconfig.publishByDefault
        : hconfig.publishByDefault[VaultUtils.getName(cNoteVault)];
    }

    return !_.some([
      // not from private vault
      (noteVault as DVault).visibility &&
        (noteVault as DVault).visibility === DVaultVisibility.PRIVATE,
      // not blacklisted
      note?.custom?.published === false,
      // not whitelisted
      !publishByDefault ? !note.custom?.published : false,
    ]);
  }

  static async copyAssets(opts: {
    wsRoot: string;
    vault: DVault;
    siteAssetsDir: string;
    /**
     * Delete existing siteAssets
     */
    deleteSiteAssetsDir?: boolean;
  }) {
    const { wsRoot, vault, siteAssetsDir, deleteSiteAssetsDir } = opts;
    const vaultAssetsDir = path.join(vault2Path({ wsRoot, vault }), "assets");
    if (fs.existsSync(siteAssetsDir) && deleteSiteAssetsDir) {
      console.log("removing existing assets");
      fs.removeSync(siteAssetsDir);
    }
    if (fs.existsSync(vaultAssetsDir)) {
      // TODO: be smarter about this
      return fs.copy(path.join(vaultAssetsDir), siteAssetsDir, {
        overwrite: true,
        errorOnExist: false,
      });
    }
    return;
  }

  static addSiteOnlyNotes(opts: { engine: DEngineClientV2 }) {
    const { engine } = opts;
    const vaults = engine.vaultsv3;
    const note = NoteUtilsV2.create({
      vault: vaults[0],
      fname: "403",
      id: "403",
      title: "This page has not yet sprouted",
      body: [
        "[Dendron](https://dendron.so/) (the tool used to generate this site) lets authors selective publish content. You will see this page whenever you click on a link to an unpublished page",
        "",
        "![](https://foundation-prod-assetspublic53c57cce-8cpvgjldwysl.s3-us-west-2.amazonaws.com/assets/images/not-sprouted.png)",
      ].join("\n"),
    });
    return [note];
  }

  static async filterByConfig(opts: {
    engine: DEngineClientV2;
    config: DendronConfig;
  }): Promise<{ notes: NotePropsDictV2; domains: NotePropsV2[] }> {
    const { engine, config } = opts;
    const notes = _.clone(engine.notes);
    config.site = DConfig.cleanSiteConfig(config.site);
    const sconfig = config.site;
    const { siteHierarchies } = sconfig;
    logger.info({ ctx: "filterByConfig", config });
    let domains: NotePropsV2[] = [];
    // TODO: return domains from here
    const hiearchiesToPublish = await Promise.all(
      siteHierarchies.map(async (domain, idx) => {
        const out = await SiteUtils.filterByHiearchy({
          domain,
          config,
          engine,
          navOrder: idx,
        });
        if (_.isUndefined(out)) {
          return {};
        }
        domains.push(out.domain);
        return out.notes;
      })
    );
    // if single hiearchy, domain includes all immediate children
    if (siteHierarchies.length === 1 && domains.length === 1) {
      const rootDomain = domains[0];
      domains = domains.concat(rootDomain.children.map((id) => notes[id]));
    }
    logger.info({
      ctx: "filterByConfig",
      domains: domains.map((ent) => ent.fname),
    });

    return {
      notes: _.reduce(
        hiearchiesToPublish,
        (ent, acc) => {
          return _.merge(acc, ent);
        },
        {}
      ),
      domains,
    };
  }

  /**
   * Filter notes to be published using hiearchy
   */
  static async filterByHiearchy(opts: {
    domain: string;
    config: DendronConfig;
    engine: DEngineClientV2;
    navOrder: number;
  }): Promise<{ notes: NotePropsDictV2; domain: NotePropsV2 } | undefined> {
    const { domain, engine, navOrder, config } = opts;
    logger.info({ ctx: "filterByHiearchy", domain, config });
    const sconfig = config.site;
    let hConfig = this.getConfigForHierarchy({
      config: sconfig,
      noteOrName: domain,
    });
    const notesForHiearchy = _.clone(engine.notes);

    // get the domain note
    let notes = NoteUtilsV2.getNotesByFname({
      fname: domain,
      notes: notesForHiearchy,
    });
    logger.info({
      ctx: "filterByHiearchy:candidates",
      domain,
      notes: notes.map((ent) => ent.id),
    });

    // if multiple domain notes, figure out which one is good
    notes = notes.filter((note) =>
      SiteUtils.canPublishFiltered({
        note,
        hconfig: hConfig,
        vaults: config.vaults,
        wsRoot: engine.wsRoot,
      })
    );
    logger.info({
      ctx: "filterByHiearchy",
      msg: "post-filter",
      hConfig,
      filteredNotes: notes.map((ent) => ent.fname),
    });

    let domainNote: NotePropsV2 | undefined;
    if (notes.length > 1) {
      domainNote = SiteUtils.handleDup({
        dupBehavior: sconfig.duplicateNoteBehavior,
        engine,
        fname: domain,
        noteCandidates: notes,
        noteDict: notesForHiearchy,
      });
    } else if (notes.length < 1) {
      logger.error({ ctx: "filterByHiearchy", msg: "note not found", domain });
      // TODO: add warning
      return;
    } else {
      domainNote = { ...notes[0] };
    }
    if (_.isUndefined(domainNote)) {
      return;
    }

    if (!domainNote.custom) {
      domainNote.custom = {};
    }
    // set domain note settings
    domainNote.custom.nav_order = navOrder;
    domainNote.parent = null;
    if (domainNote.fname === sconfig.siteIndex) {
      domainNote.custom.permalink = "/";
    }

    logger.info({
      ctx: "filterByHiearchy",
      fname: domainNote.fname,
      domainNote: NoteUtilsV2.toLogObj(domainNote),
    });

    const out: NotePropsDictV2 = {};
    const processQ = [domainNote];
    while (!_.isEmpty(processQ)) {
      const note = processQ.pop() as NotePropsV2;

      logger.debug({
        ctx: "filterByHiearchy",
        fname: note.fname,
        note: NoteUtilsV2.toLogObj(note),
      });

      const maybeNote = SiteUtils.filterByNote({ note, hConfig });
      if (maybeNote) {
        if (sconfig.writeStubs && maybeNote.stub) {
          maybeNote.stub = false;
          await engine.writeNote(note);
        }
        const siteFM = maybeNote.custom || ({} as DendronSiteFM);
        let children = maybeNote.children
          .map((id) => notesForHiearchy[id])
          .filter((ent) => !_.isUndefined(ent));

        // if skip levels, accumulate the grandchildren
        if (siteFM.skipLevels) {
          debugger;
          let acc = 0;
          while (acc !== siteFM.skipLevels) {
            children = children.flatMap((ent) =>
              ent.children.map((id) => notesForHiearchy[id])
            );
            acc += 1;
          }
          maybeNote.children = children.map((ent) => ent.id);
          children.forEach((ent) => (ent.parent = maybeNote.id));
        }

        // remove any children that shouldn't be published
        children = _.filter(children, (note: NotePropsV2) =>
          SiteUtils.canPublishFiltered({
            note,
            hconfig: hConfig,
            vaults: config.vaults,
            wsRoot: engine.wsRoot,
          })
        );
        logger.debug({
          ctx: "filterByHiearchy:post-filter-children",
          note: note.fname,
          children: children.map((ent) => ent.id),
        });
        // TODO: handle dups

        // add children to Q
        children.forEach((n: NotePropsV2) => processQ.push(n));

        // updated children
        out[maybeNote.id] = {
          ...maybeNote,
          children: children.map((ent) => ent.id),
        };
      }
    }
    return { notes: out, domain: domainNote };
  }

  static filterByNote(opts: {
    note: NotePropsV2;
    hConfig: HierarchyConfig;
  }): NotePropsV2 | undefined {
    const { note, hConfig } = opts;

    // apply custom frontmatter if exist
    hConfig.customFrontmatter?.forEach((fm) => {
      const { key, value } = fm;
      // @ts-ignore
      meta[key] = value;
    });
    if (hConfig.noindexByDefault && !_.has(note, "custom.noindex")) {
      _.set(note, "custom.noindex", true);
    }

    // remove site-only stuff
    return {
      ...note,
      body: stripLocalOnlyTags(note.body),
    };
  }

  static getConfigForHierarchy(opts: {
    config: DendronSiteConfig;
    noteOrName: NotePropsV2 | string;
  }) {
    const { config, noteOrName } = opts;
    const fname = _.isString(noteOrName) ? noteOrName : noteOrName.fname;
    const domain = DNodeUtilsV2.domainName(fname);
    const siteConfig = config;
    // get config
    let rConfig: HierarchyConfig = _.defaults(
      _.get(siteConfig.config, "root", {
        publishByDefault: true,
        noindexByDefault: false,
        customFrontmatter: [],
      })
    );
    let hConfig: HierarchyConfig = _.defaults(
      _.get(siteConfig.config, domain),
      rConfig
    );
    return hConfig;
  }

  static getDomains(opts: {
    notes: NotePropsDictV2;
    config: DendronSiteConfig;
  }): NotePropsV2[] {
    const { notes, config } = opts;
    if (config.siteHierarchies.length === 1) {
      const fname = config.siteHierarchies[0];
      const rootNotes = NoteUtilsV2.getNotesByFname({ fname, notes });
      return [rootNotes[0]].concat(
        rootNotes[0].children.map((ent) => notes[ent])
      );
    } else {
      return _.filter(_.values(notes), { parent: null });
    }
  }

  static getSiteOutputPath(opts: {
    config: DendronConfig;
    wsRoot: string;
    stage: "dev" | "prod";
  }) {
    const { config, wsRoot, stage } = opts;
    let siteRootPath: string;
    if (stage === "dev") {
      siteRootPath = path.join(wsRoot, "build", "site");
      fs.ensureDirSync(siteRootPath);
    } else {
      siteRootPath = resolvePath(config.site.siteRootDir, wsRoot);
    }
    return siteRootPath;
  }

  static handleDup(opts: {
    dupBehavior?: DuplicateNoteBehavior;
    engine: DEngineClientV2;
    fname: string;
    noteCandidates: NotePropsV2[];
    noteDict: NotePropsDictV2;
  }) {
    const { dupBehavior, engine, fname, noteCandidates, noteDict } = opts;
    const ctx = "handleDup";
    let domainNote: NotePropsV2 | undefined;

    if (dupBehavior) {
      if (_.isArray(dupBehavior.payload)) {
        const vaultNames = dupBehavior.payload;
        _.forEach(vaultNames, (vname) => {
          if (domainNote) {
            return;
          }
          const vault = VaultUtils.getVaultByName({
            vname,
            vaults: engine.vaultsv3,
          });
          if (!vault) {
            throw new DendronError({
              msg: `no vault found for ${fname} in vaults ${vaultNames}`,
            });
          }
          const maybeNote = NoteUtilsV2.getNoteByFnameV5({
            fname,
            notes: noteDict,
            vault,
            wsRoot: engine.wsRoot,
          });
          if (maybeNote) {
            domainNote = maybeNote;
            logger.info({
              ctx,
              status: "found",
              note: NoteUtilsV2.toLogObj(domainNote),
            });
          }
        });
        if (!domainNote) {
          throw new DendronError({
            msg: `no notes found for ${fname} in vaults ${vaultNames}`,
          });
        }
      } else {
        const vault = dupBehavior.payload.vault;
        let maybeDomainNotes = noteCandidates.filter((n) =>
          VaultUtils.isEqual(n.vault, vault, engine.wsRoot)
        );
        if (maybeDomainNotes.length < 1) {
          logger.error({
            ctx: "filterByHiearchy",
            msg: "dup-resolution: no note found",
            vault,
          });
          throw new DendronError({
            msg: `no notes found for ${fname} in vault ${vault.fsPath}`,
          });
        }
        domainNote = maybeDomainNotes[0];
      }
      let domainId = domainNote.id;
      // merge children
      domainNote.children = _.uniq(
        noteCandidates.flatMap((ent) => ent.children)
      );
      // update parents
      domainNote.children.map((id) => (noteDict[id].parent = domainId));
      logger.info({
        ctx: "filterByHiearchy",
        msg: "dup-resolution: resolving dup",
        parent: domainNote.id,
        children: domainNote.children,
      });
      return domainNote;
    } else {
      throw new DendronError({ msg: `mult notes found for ${fname}` });
    }
    return undefined;
  }
}
