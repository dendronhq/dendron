import {
  assert,
  DendronConfig,
  DendronError,
  DendronSiteConfig,
  DendronSiteFM,
  DNodeUtils,
  DuplicateNoteAction,
  DuplicateNoteBehavior,
  DVault,
  DVaultVisibility,
  HierarchyConfig,
  NotePropsDict,
  NoteProps,
  NoteUtils,
  UseVaultBehavior,
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
import { HierarchyUtils, stripLocalOnlyTags } from "../utils";
const logger = createLogger();

export class SiteUtils {
  static canPublish(opts: {
    note: NoteProps;
    config: DendronConfig;
    engine: DEngineClientV2;
  }) {
    const { note, config, engine } = opts;
    const { wsRoot, vaultsv3: vaults } = engine;

    // not private note
    if (note.custom?.published === false) {
      return false;
    }
    // check if note is note blocked
    const hconfig = this.getConfigForHierarchy({
      config: config.site,
      noteOrName: note,
    });
    const noteVault = VaultUtils.matchVault({
      vault: note.vault,
      vaults,
      wsRoot,
    });
    assert(noteVault !== false, `noteVault ${note.vault.fsPath} should exist`);
    const cNoteVault = noteVault as DVault;
    // not from private vault
    if (
      (noteVault as DVault).visibility &&
      (noteVault as DVault).visibility === DVaultVisibility.PRIVATE
    ) {
      return false;
    }

    // check if allowed in hconfig
    let publishByDefault = undefined;
    if (!_.isUndefined(hconfig?.publishByDefault)) {
      // handle property being a boolean or an object
      publishByDefault = _.isBoolean(hconfig.publishByDefault)
        ? hconfig.publishByDefault
        : hconfig.publishByDefault[VaultUtils.getName(cNoteVault)];
    }
    if (!publishByDefault && !(note.custom?.published === true)) {
      return false;
    }

    return true;
  }

  static isPublished(opts: {
    note: NoteProps;
    config: DendronConfig;
    engine: DEngineClientV2;
  }) {
    const { note, config } = opts;
    // check if note is in index
    const domain = DNodeUtils.domainName(note.fname);
    if (
      config.site.siteHierarchies[0] !== "root" &&
      config.site.siteHierarchies.indexOf(domain) < 0
    ) {
      return false;
    }
    return this.canPublish(opts);
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
    const note = NoteUtils.create({
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
    const changelog = NoteUtils.create({
      vault: vaults[0],
      fname: "root.changelog",
      id: "changelog",
      title: "Changelog",
      body: [].join("\n"),
    });
    return [note, changelog];
  }

  static async filterByConfig(opts: {
    engine: DEngineClientV2;
    config: DendronConfig;
  }): Promise<{ notes: NotePropsDict; domains: NoteProps[] }> {
    const { engine, config } = opts;
    const notes = _.clone(engine.notes);
    config.site = DConfig.cleanSiteConfig(config.site);
    const sconfig = config.site;
    const { siteHierarchies } = sconfig;
    logger.info({ ctx: "filterByConfig", config });
    let domains: NoteProps[] = [];
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
      // special case, check if any of these children were supposed to be hidden
      domains = domains
        .concat(rootDomain.children.map((id) => notes[id]))
        .filter((note) => this.canPublish({ note, config, engine }));
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
  }): Promise<{ notes: NotePropsDict; domain: NoteProps } | undefined> {
    const { domain, engine, navOrder, config } = opts;
    logger.info({ ctx: "filterByHiearchy", domain, config });
    const sconfig = config.site;
    let hConfig = this.getConfigForHierarchy({
      config: sconfig,
      noteOrName: domain,
    });
    const notesForHiearchy = _.clone(engine.notes);

    // get the domain note
    let notes = NoteUtils.getNotesByFname({
      fname: domain,
      notes: notesForHiearchy,
    });
    logger.info({
      ctx: "filterByHiearchy:candidates",
      domain,
      hConfig,
      notes: notes.map((ent) => ent.id),
    });

    let domainNote: NoteProps | undefined;
    if (notes.length > 1) {
      domainNote = SiteUtils.handleDup({
        allowStubs: false,
        dupBehavior: sconfig.duplicateNoteBehavior,
        engine,
        config,
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
    if (
      _.isUndefined(domainNote) ||
      !this.canPublish({ note: domainNote, config, engine })
    ) {
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
      domainNote: NoteUtils.toLogObj(domainNote),
    });

    const out: NotePropsDict = {};
    const processQ = [domainNote];
    while (!_.isEmpty(processQ)) {
      const note = processQ.pop() as NoteProps;

      logger.debug({
        ctx: "filterByHiearchy",
        fname: note.fname,
        note: NoteUtils.toLogObj(note),
      });

      // check if we can publish this note
      const maybeNote = SiteUtils.filterByNote({ note, hConfig });
      if (maybeNote) {
        if (sconfig.writeStubs && maybeNote.stub) {
          maybeNote.stub = false;
          await engine.writeNote(note);
        }
        const siteFM = maybeNote.custom || ({} as DendronSiteFM);

        // if we skip, wire new children to current note
        let children = HierarchyUtils.getChildren({
          skipLevels: siteFM.skipLevels || 0,
          note: maybeNote,
          notes: notesForHiearchy,
        });
        if (siteFM.skipLevels && siteFM.skipLevels > 0) {
          maybeNote.children = children.map((ent) => ent.id);
          children.forEach((ent) => (ent.parent = maybeNote.id));
        }

        // remove any children that shouldn't be published
        children = _.filter(children, (note: NoteProps) =>
          SiteUtils.canPublish({
            note,
            config,
            engine,
          })
        );
        logger.debug({
          ctx: "filterByHiearchy:post-filter-children",
          note: note.fname,
          children: children.map((ent) => ent.id),
        });
        // TODO: handle dups

        // add children to Q
        children.forEach((n: NoteProps) => {
          // update parent to be current note
          // dup merging at the top could cause children from multiple vaults
          // to be present
          n.parent = maybeNote.id;
          processQ.push(n);
        });

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
    note: NoteProps;
    hConfig: HierarchyConfig;
  }): NoteProps | undefined {
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
    noteOrName: NoteProps | string;
  }) {
    const { config, noteOrName } = opts;
    const fname = _.isString(noteOrName) ? noteOrName : noteOrName.fname;
    const domain = DNodeUtils.domainName(fname);
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
    notes: NotePropsDict;
    config: DendronSiteConfig;
  }): NoteProps[] {
    const { notes, config } = opts;
    if (config.siteHierarchies.length === 1) {
      const fname = config.siteHierarchies[0];
      const rootNotes = NoteUtils.getNotesByFname({ fname, notes });
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
    allowStubs?: boolean;
    engine: DEngineClientV2;
    fname: string;
    config: DendronConfig;
    noteCandidates: NoteProps[];
    noteDict: NotePropsDict;
  }) {
    const {
      engine,
      fname,
      noteCandidates,
      noteDict,
      config,
      dupBehavior,
      allowStubs,
    } = _.defaults(opts, {
      dupBehavior: {
        action: DuplicateNoteAction.USE_VAULT,
        payload: [],
      } as UseVaultBehavior,
      allowStubs: true,
    });
    const ctx = "handleDup";
    let domainNote: NoteProps | undefined;

    if (_.isArray(dupBehavior.payload)) {
      const vaultNames = dupBehavior.payload;
      _.forEach(vaultNames, (vname) => {
        if (domainNote) {
          return;
        }
        const vault = VaultUtils.getVaultByNameOrThrow({
          vname,
          vaults: engine.vaultsv3,
        });
        const maybeNote = NoteUtils.getNoteByFnameV5({
          fname,
          notes: noteDict,
          vault,
          wsRoot: engine.wsRoot,
        });
        if (maybeNote && maybeNote.stub && !allowStubs) {
          return;
        }
        if (
          maybeNote &&
          this.canPublish({
            config,
            note: maybeNote,
            engine,
          })
        ) {
          domainNote = maybeNote;
          logger.info({
            ctx,
            status: "found",
            note: NoteUtils.toLogObj(domainNote),
          });
        }
      });
      if (!domainNote) {
        throw new DendronError({
          message: `no notes found for ${fname} in vaults ${vaultNames}`,
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
          message: `no notes found for ${fname} in vault ${vault.fsPath}`,
        });
      }
      if (
        !this.canPublish({
          config,
          note: maybeDomainNotes[0],
          engine,
        })
      ) {
        return;
      }
      domainNote = maybeDomainNotes[0];
    }
    let domainId = domainNote.id;
    // merge children
    domainNote.children = getUniqueChildrenIds(noteCandidates);
    // update parents
    domainNote.children.map((id) => {
      const maybeNote = noteDict[id];
      maybeNote.parent = domainId;
    });
    logger.info({
      ctx: "filterByHiearchy",
      msg: "dup-resolution: resolving dup",
      parent: domainNote.id,
      children: domainNote.children,
    });
    return domainNote;
  }
}

function getUniqueChildrenIds(notes: NoteProps[]): string[] {
  return _.uniq(notes.flatMap((ent) => ent.children));
}
