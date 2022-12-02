import {
  ConfigUtils,
  CONSTANTS,
  createSerializedFuseNoteIndex,
  DendronError,
  DendronPublishingConfig,
  DEngineClient,
  ERROR_SEVERITY,
  getStage,
  DendronConfig,
  isWebUri,
  NoteProps,
  NotePropsByIdDict,
  NoteUtils,
  PublishUtils,
  RespV3,
  Theme,
  TreeUtils,
  processSidebar,
  parseSidebarConfig,
  DisabledSidebar,
  DefaultSidebar,
  NoteDicts,
  NoteDictsUtils,
  ConfigService,
} from "@dendronhq/common-all";
import { simpleGit, SimpleGitResetMode } from "@dendronhq/common-server";
import { execa, SiteUtils } from "@dendronhq/engine-server";
import {
  getParsingDependencyDicts,
  getRefId,
  MDUtilsV5,
  ProcFlavor,
} from "@dendronhq/unified";
import { JSONSchemaType } from "ajv";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import { URI } from "vscode-uri";
import { ExportPod, ExportPodConfig, ExportPodPlantOpts } from "../basev3";
import { PodUtils } from "../utils";

const ID = "dendron.nextjs";

const TEMPLATE_REMOTE = "origin";
const TEMPLATE_REMOTE_URL = "https://github.com/dendronhq/nextjs-template.git";
const TEMPLATE_BRANCH = "main";

const $$ = execa.command;

type NextjsExportPodCustomOpts = {
  overrides?: Partial<DendronPublishingConfig>;
};

export type BuildOverrides = Pick<DendronPublishingConfig, "siteUrl">;

export enum PublishTarget {
  GITHUB = "github",
}

export const mapObject = (
  obj: { [k: string]: any },
  fn: (k: string, v: any) => any
) => Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, fn(k, v)]));

export const removeBodyFromNote = ({ body, ...note }: Record<string, any>) =>
  note;

export const removeBodyFromNotesDict = (notes: NotePropsByIdDict) =>
  mapObject(notes, (_k, note: NotePropsByIdDict) => removeBodyFromNote(note));

function getSiteConfig({
  config,
  overrides,
}: {
  config: DendronConfig;
  overrides?: Partial<DendronPublishingConfig>;
}): DendronPublishingConfig {
  const publishingConfig = ConfigUtils.getPublishing(
    config
  ) as DendronPublishingConfig;
  return {
    ...publishingConfig,
    ...overrides,
    enablePrettyLinks: true,
  } as DendronPublishingConfig;
}

async function validateSiteConfig({
  config,
  wsRoot,
}: {
  config: DendronPublishingConfig;
  wsRoot: string;
}): Promise<RespV3<undefined>> {
  if (ConfigUtils.isDendronPublishingConfig(config)) {
    if (config.theme === Theme.CUSTOM) {
      if (
        !(await fs.pathExists(path.join(wsRoot, CONSTANTS.CUSTOM_THEME_CSS)))
      ) {
        return {
          error: new DendronError({
            message: `A custom theme is set in the publishing config, but ${CONSTANTS.CUSTOM_THEME_CSS} does not exist in ${wsRoot}`,
            severity: ERROR_SEVERITY.FATAL,
          }),
        };
      }
    }
  }
  return { data: undefined };
}

export type NextjsExportConfig = ExportPodConfig & NextjsExportPodCustomOpts;

type NextjsExportPlantOpts = ExportPodPlantOpts<NextjsExportConfig>;

export class NextjsExportPodUtils {
  static async buildSiteMap(opts: { nextPath: string }) {
    const { nextPath } = opts;
    const cmdDev = "npm run build:sitemap";
    const out = $$(cmdDev, { cwd: nextPath });
    out.stdout?.pipe(process.stdout);
    return out.pid;
  }

  static getDendronConfigPath = (dest: URI) => {
    const podDstDir = path.join(dest.fsPath, "data");
    const podConfigDstPath = path.join(podDstDir, "dendron.json");
    return podConfigDstPath;
  };

  static getNextRoot = (wsRoot: string) => {
    return path.join(wsRoot, ".next");
  };

  static async nextPathExists(opts: { nextPath: string }) {
    const { nextPath } = opts;
    const exists = await fs.pathExists(nextPath);
    return exists;
  }

  static async removeNextPath(opts: { nextPath: string }) {
    const { nextPath } = opts;
    await fs.rm(nextPath, { recursive: true });
  }

  static async installDependencies(opts: { nextPath: string }) {
    const { nextPath } = opts;
    await $$("npm install", { cwd: nextPath });
  }

  static async cloneTemplate(opts: { nextPath: string }) {
    const { nextPath } = opts;

    await fs.ensureDir(nextPath);
    const git = simpleGit({ baseDir: nextPath });
    await git.clone(TEMPLATE_REMOTE_URL, nextPath);

    return { error: null };
  }

  static async updateTemplate(opts: { nextPath: string }) {
    const { nextPath } = opts;
    const git = simpleGit({ baseDir: nextPath });

    const remotes = await git.getRemotes(true);
    if (
      remotes.length !== 1 ||
      remotes[0].name !== TEMPLATE_REMOTE ||
      remotes[0].refs.fetch !== TEMPLATE_REMOTE_URL ||
      remotes[0].refs.push !== TEMPLATE_REMOTE_URL
    ) {
      throw new Error("remotes not set up correctly");
    }

    let status = await git.status();
    if (status.current !== TEMPLATE_BRANCH) {
      await git.checkout(TEMPLATE_REMOTE_URL);
      status = await git.status();
    }
    const remoteBranch = `${TEMPLATE_REMOTE}/${TEMPLATE_BRANCH}`;
    if (status.tracking !== remoteBranch) {
      throw new Error(`${status.tracking} is not expected remote branch`);
    }

    await git.fetch();
    await git.reset(SimpleGitResetMode.HARD, [remoteBranch]);
  }

  static async isInitialized(opts: { wsRoot: string }) {
    const { wsRoot } = opts;
    const nextPath = path.join(wsRoot, ".next");

    const nextPathExists = await NextjsExportPodUtils.nextPathExists({
      ...opts,
      nextPath,
    });

    if (nextPathExists) {
      const pkgJsonExists = await fs.pathExists(
        path.join(nextPath, "package.json")
      );
      if (pkgJsonExists) {
        return true;
      }
    }
    return false;
  }

  static async startNextExport(opts: { nextPath: string; quiet?: boolean }) {
    const { nextPath, quiet } = opts;
    const cmd = quiet ? "npm run --silent export" : "npm run export";
    let out;
    if (quiet) {
      out = await $$(cmd, { cwd: nextPath });
    } else {
      out = $$(cmd, { cwd: nextPath });
      out.stdout?.pipe(process.stdout);
    }
    return out;
  }

  static async startNextDev(opts: {
    nextPath: string;
    quiet?: boolean;
    windowsHide?: boolean;
  }) {
    const { nextPath, quiet, windowsHide } = opts;
    const cmdDev = quiet ? "npm run --silent dev" : "npm run dev";
    const out = $$(cmdDev, { cwd: nextPath, windowsHide });
    out.stdout?.pipe(process.stdout);
    return out.pid;
  }

  static async loadSidebarsFile(
    sidebarFilePath: string | false | undefined | null
  ): Promise<unknown> {
    if (sidebarFilePath === false) {
      return DisabledSidebar;
    }

    if (_.isNil(sidebarFilePath)) {
      return DefaultSidebar;
    }

    // Non-existent sidebars file: no sidebars
    if (!(await fs.pathExists(sidebarFilePath))) {
      throw new Error(`no sidebar file found at ${sidebarFilePath}`);
    }

    /* eslint-disable-next-line import/no-dynamic-require, global-require */
    return require(path.resolve(sidebarFilePath));
  }
}

export class NextjsExportPod extends ExportPod<NextjsExportConfig> {
  static id: string = ID;
  static description: string = "export notes to Nextjs";

  get config(): JSONSchemaType<NextjsExportConfig> {
    return PodUtils.createExportConfig({
      required: [],
      properties: {
        overrides: {
          type: "object",
          description: "options from site config you want to override",
        },
      },
    }) as JSONSchemaType<NextjsExportConfig>;
  }

  async _renderNote({
    engine,
    note,
    engineConfig,
    noteCacheForRenderDict,
  }: {
    engine: DEngineClient;
    note: NoteProps;
    engineConfig: DendronConfig;
    noteCacheForRenderDict: NoteDicts;
  }) {
    const proc = MDUtilsV5.procRehypeFull(
      {
        noteToRender: note,
        noteCacheForRenderDict,
        fname: note.fname,
        vault: note.vault,
        config: engineConfig,
        vaults: engine.vaults,
        wsRoot: engine.wsRoot,
      },
      { flavor: ProcFlavor.PUBLISHING }
    );
    const payload = await proc.process(NoteUtils.serialize(note));
    return payload.toString();
  }

  private async _writeEnvFile({
    siteConfig,
    dest,
  }: {
    siteConfig: DendronPublishingConfig;
    dest: URI;
  }) {
    // add .env.production, next will use this to replace `process.env` vars when building
    const vars: string[] = [];
    if (siteConfig.assetsPrefix) {
      vars.push(`NEXT_PUBLIC_ASSET_PREFIX=${siteConfig.assetsPrefix}`);
    }
    vars.push(`NEXT_PUBLIC_STAGE=${getStage()}`);

    const envFile = path.join(dest.fsPath, ".env.production");
    this.L.debug(`Added env variables to export: ${vars}`);
    await fs.writeFile(envFile, vars.join("\n"));
  }

  async copyAssets({
    wsRoot,
    config,
    dest,
  }: {
    wsRoot: string;
    config: DendronConfig;
    dest: string;
  }) {
    const ctx = "copyAssets";
    const vaults = ConfigUtils.getVaults(config);
    const destPublicPath = path.join(dest, "public");
    fs.ensureDirSync(destPublicPath);
    const siteAssetsDir = path.join(destPublicPath, "assets");
    const publishingConfig = ConfigUtils.getPublishing(config);

    // if copyAssets not set, skip it
    if (!publishingConfig.copyAssets) {
      this.L.info({ ctx, msg: "skip copying" });
      return;
    }

    // if we are copying assets, delete existing assets folder if it exists
    if (fs.existsSync(siteAssetsDir)) {
      fs.removeSync(siteAssetsDir);
    }

    this.L.info({ ctx, msg: "copying", vaults });
    await vaults.reduce(async (resp, vault) => {
      await resp;
      if (vault.visibility === "private") {
        // eslint-disable-next-line no-console
        console.log(`skipping copy assets from private vault ${vault.fsPath}`);
        return Promise.resolve({});
      }
      // copy assets from each vauulut to assets folder of destination
      await SiteUtils.copyAssets({
        wsRoot,
        vault,
        siteAssetsDir,
        deleteSiteAssetsDir: false,
      });
      return Promise.resolve({});
    }, Promise.resolve({}));

    this.L.info({ ctx, msg: "finish copying assets" });

    // custom headers
    const customHeaderPath = publishingConfig.customHeaderPath;
    if (customHeaderPath) {
      const headerPath = path.join(wsRoot, customHeaderPath);
      if (fs.existsSync(headerPath)) {
        fs.copySync(headerPath, path.join(destPublicPath, "header.html"));
      }
    }

    // custom components
    if (PublishUtils.hasCustomSiteBanner(config)) {
      const bannerPath =
        PublishUtils.getCustomSiteBannerPathFromWorkspace(wsRoot);
      if (!fs.existsSync(bannerPath)) {
        throw Error(`no banner found at ${bannerPath}`);
      }
      fs.copySync(
        bannerPath,
        PublishUtils.getCustomSiteBannerPathToPublish(dest)
      );
    }

    // get favicon
    const siteFaviconPath = publishingConfig.siteFaviconPath;
    if (siteFaviconPath) {
      const faviconPath = path.join(wsRoot, siteFaviconPath);
      if (fs.existsSync(faviconPath)) {
        fs.copySync(faviconPath, path.join(destPublicPath, "favicon.ico"));
      }
    }
    // get logo
    const logo = ConfigUtils.getLogo(config);
    if (logo && !isWebUri(logo)) {
      const logoPath = path.join(wsRoot, logo);
      try {
        const targetPath = path.join(siteAssetsDir, path.basename(logoPath));
        await fs.copy(logoPath, targetPath);
      } catch (err: any) {
        // If the logo file was missing, that shouldn't crash the
        // initialization. Warn the user and move on.
        if (err?.code === "ENOENT") {
          this.L.error({
            ctx,
            msg: "Failed to copy the logo",
            logoPath,
            siteAssetsDir,
            err,
          });
        } else {
          throw err;
        }
      }
    }
    // get cname
    const githubConfig = ConfigUtils.getGithubConfig(config);
    const githubCname = githubConfig?.cname;
    if (githubCname) {
      fs.writeFileSync(path.join(destPublicPath, "CNAME"), githubCname, {
        encoding: "utf8",
      });
    }

    // copy over the custom theme if it exists
    const customThemePath = path.join(wsRoot, CONSTANTS.CUSTOM_THEME_CSS);
    if (await fs.pathExists(customThemePath)) {
      const publishedThemeRoot = path.join(destPublicPath, "themes");
      fs.ensureDirSync(publishedThemeRoot);
      fs.copySync(
        customThemePath,
        path.join(publishedThemeRoot, CONSTANTS.CUSTOM_THEME_CSS)
      );
    }
  }

  async renderBodyAsMD({
    note,
    notesDir,
  }: {
    note: NoteProps;
    notesDir: string;
  }) {
    const ctx = `${ID}:renderBodyToHTML`;
    this.L.debug({ ctx, msg: "renderNote:pre", note: note.id });
    const out = note.body;
    const dst = path.join(notesDir, note.id + ".md");
    this.L.debug({ ctx, dst, msg: "writeNote" });
    return fs.writeFile(dst, out);
  }

  async renderBodyToHTML({
    engine,
    note,
    notesDir,
    engineConfig,
    noteCacheForRenderDict,
  }: Parameters<NextjsExportPod["_renderNote"]>[0] & {
    notesDir: string;
    engineConfig: DendronConfig;
  }) {
    const ctx = `${ID}:renderBodyToHTML`;
    this.L.debug({ ctx, msg: "renderNote:pre", note: note.id });
    const out = await this._renderNote({
      engine,
      note,
      engineConfig,
      noteCacheForRenderDict,
    });
    const dst = path.join(notesDir, note.id + ".html");
    this.L.debug({ ctx, dst, msg: "writeNote" });
    return fs.writeFile(dst, out);
  }

  async renderMetaToJSON({
    note,
    notesDir,
  }: {
    notesDir: string;
    note: NoteProps;
  }) {
    const ctx = `${ID}:renderMetaToJSON`;
    this.L.debug({ ctx, msg: "renderNote:pre", note: note.id });
    const out = _.omit(note, "body");
    const dst = path.join(notesDir, note.id + ".json");
    this.L.debug({ ctx, dst, msg: "writeNote" });
    return fs.writeJSON(dst, out);
  }

  async plant(opts: NextjsExportPlantOpts) {
    MDUtilsV5.clearRefCache();
    const ctx = `${ID}:plant`;
    const { dest, engine, wsRoot, config: podConfig } = opts;
    const podDstDir = path.join(dest.fsPath, "data");
    fs.ensureDirSync(podDstDir);
    const configReadResult = await ConfigService.instance().readConfig(
      URI.file(wsRoot)
    );
    if (configReadResult.isErr()) {
      throw configReadResult.error;
    }
    const config = configReadResult.value;

    const siteConfig = getSiteConfig({
      config,
      overrides: podConfig.overrides,
    });

    const { error } = await validateSiteConfig({ config: siteConfig, wsRoot });
    if (error) {
      throw error;
    }

    const sidebarPath =
      "sidebarPath" in siteConfig ? siteConfig.sidebarPath : undefined;
    const sidebarConfigInput = await NextjsExportPodUtils.loadSidebarsFile(
      sidebarPath
    );
    const sidebarConfig = parseSidebarConfig(sidebarConfigInput);

    // fail early, before computing `SiteUtils.filterByConfig`.
    if (sidebarConfig.isErr()) {
      throw sidebarConfig.error;
    }

    await this.copyAssets({ wsRoot, config, dest: dest.fsPath });

    this.L.info({ ctx, msg: "filtering notes..." });
    const engineConfig: DendronConfig = ConfigUtils.overridePublishingConfig(
      config,
      siteConfig
    );

    const { notes: publishedNotes, domains } = await SiteUtils.filterByConfig({
      engine,
      config: engineConfig,
      noExpandSingleDomain: true,
    });

    const duplicateNoteBehavior =
      "duplicateNoteBehavior" in siteConfig
        ? siteConfig.duplicateNoteBehavior
        : undefined;

    const sidebarResp = processSidebar(sidebarConfig, {
      notes: publishedNotes,
      duplicateNoteBehavior,
    });

    // fail if sidebar could not be created
    if (sidebarResp.isErr()) {
      throw sidebarResp.error;
    }

    const siteNotes = SiteUtils.createSiteOnlyNotes({
      engine,
    });
    _.forEach(siteNotes, (ent) => {
      publishedNotes[ent.id] = ent;
    });
    const noteIndex = _.find(domains, (ent) => ent.custom.permalink === "/");
    const payload = {
      notes: publishedNotes,
      domains,
      noteIndex,
      vaults: engine.vaults,
    };

    // The reason to use all engine notes instead of just the published notes
    // here is because a published note may link to a private note, in which
    // case we still "need" the private note in the cache to do the rendering,
    // since the title of the note is used in the (Private) placeholder for the
    // link.
    const noteDeps = await engine.findNotes({ excludeStub: true });
    const fullDict = NoteDictsUtils.createNoteDicts(noteDeps);

    // render notes
    const notesBodyDir = path.join(podDstDir, "notes");
    const notesMetaDir = path.join(podDstDir, "meta");
    const notesRefsDir = path.join(podDstDir, "refs");

    this.L.info({ ctx, msg: "ensuring notesDir...", notesDir: notesBodyDir });
    fs.ensureDirSync(notesBodyDir);
    fs.ensureDirSync(notesMetaDir);
    this.L.info({ ctx, msg: "writing notes..." });
    await Promise.all(
      _.map(_.values(publishedNotes), async (note) => {
        return Promise.all([
          this.renderBodyToHTML({
            engine,
            note,
            notesDir: notesBodyDir,
            engineConfig,
            noteCacheForRenderDict: fullDict,
          }),
          this.renderMetaToJSON({ note, notesDir: notesMetaDir }),
          this.renderBodyAsMD({ note, notesDir: notesBodyDir }),
        ]);
      })
    );

    let refIds: string[] = [];
    if (config.dev?.enableExperimentalIFrameNoteRef) {
      const noteRefs = MDUtilsV5.getRefCache();
      refIds = await Promise.all(
        Object.keys(noteRefs).map(async (ent: string) => {
          const { refId, prettyHAST } = noteRefs![ent];
          const noteId = refId.id;
          const noteForRef = (await engine.getNote(noteId)).data;

          // shouldn't happen
          if (!noteForRef) {
            throw Error(`no note found for ${JSON.stringify(refId)}`);
          }

          const noteCacheForRenderDict = await getParsingDependencyDicts(
            noteForRef,
            engine,
            config,
            engine.vaults
          );
          const proc = MDUtilsV5.procRehypeFull(
            {
              // engine,
              noteCacheForRenderDict,
              noteToRender: noteForRef,
              fname: noteForRef.fname,
              vault: noteForRef.vault,
              vaults: engine.vaults,
              wsRoot: engine.wsRoot,
              config,
              insideNoteRef: true,
            },
            { flavor: ProcFlavor.PUBLISHING }
          );

          const out = proc.stringify(proc.runSync(prettyHAST));
          const refIdString = getRefId(refId);
          const dst = path.join(notesRefsDir, refIdString + ".html");
          this.L.debug({ ctx, dst, msg: "writeNote" });
          fs.ensureFileSync(dst);
          fs.writeFileSync(dst, out);
          return refIdString;
        })
      );
    }

    const podDstPath = path.join(podDstDir, "notes.json");
    const podConfigDstPath = path.join(podDstDir, "dendron.json");
    const refDstPath = path.join(podDstDir, "refs.json");

    const treeDstPath = path.join(podDstDir, "tree.json");

    const sidebar = sidebarResp.value;
    const tree = TreeUtils.generateTreeData(payload.notes, sidebar);

    // Generate full text search data
    const fuseDstPath = path.join(podDstDir, "fuse.json");
    const fuseIndex = createSerializedFuseNoteIndex(publishedNotes);
    // Concurrently write out data
    await Promise.all([
      fs.writeJson(
        podDstPath,
        {
          ...payload,
          notes: removeBodyFromNotesDict(payload.notes),
        },
        { encoding: "utf8", spaces: 2 }
      ),
      fs.writeJSONSync(refDstPath, refIds, {
        encoding: "utf8",
        spaces: 2,
      }),
      fs.writeJSON(podConfigDstPath, engineConfig, {
        encoding: "utf8",
        spaces: 2,
      }),
      fs.writeJSON(treeDstPath, tree, {
        encoding: "utf8",
        spaces: 2,
      }),
      fs.writeJson(fuseDstPath, fuseIndex),
      this._writeEnvFile({ siteConfig, dest }),
    ]);

    const publicPath = path.join(podDstDir, "..", "public");
    const publicDataPath = path.join(publicPath, "data");

    if (fs.existsSync(publicDataPath)) {
      this.L.info("removing existing 'public/data");
      fs.removeSync(publicDataPath);
    }
    this.L.info("moving data");
    fs.copySync(podDstDir, publicDataPath);
    return { notes: _.values(publishedNotes) };
  }
}
