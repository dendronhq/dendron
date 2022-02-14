import {
  IntermediateDendronConfig,
  DendronSiteConfig,
  DEngineClient,
  NoteProps,
  NotePropsDict,
  NoteUtils,
  createSerializedFuseNoteIndex,
  ConfigUtils,
  isWebUri,
  getStage,
  configIsV4,
  DendronPublishingConfig,
} from "@dendronhq/common-all";
import { simpleGit, SimpleGitResetMode } from "@dendronhq/common-server";
import {
  MDUtilsV5,
  ProcFlavor,
  SiteUtils,
  execa,
} from "@dendronhq/engine-server";
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
  overrides?: Partial<DendronSiteConfig>;
};

export type BuildOverrides = Pick<DendronSiteConfig, "siteUrl">;

export enum PublishTarget {
  GITHUB = "github",
}

export const mapObject = (
  obj: { [k: string]: any },
  fn: (k: string, v: any) => any
) => Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, fn(k, v)]));

export const removeBodyFromNote = ({ body, ...note }: Record<string, any>) =>
  note;

export const removeBodyFromNotesDict = (notes: NotePropsDict) =>
  mapObject(notes, (_k, note: NotePropsDict) => removeBodyFromNote(note));

function getSiteConfig({
  config,
  overrides,
}: {
  config: IntermediateDendronConfig;
  overrides?: Partial<DendronSiteConfig> | Partial<DendronPublishingConfig>;
}): DendronSiteConfig | DendronPublishingConfig {
  if (configIsV4(config)) {
    const siteConfig = ConfigUtils.getSite(config) as DendronSiteConfig;
    return {
      ...siteConfig,
      ...overrides,
      usePrettyLinks: true,
    } as DendronSiteConfig;
  } else {
    const publishingConfig = ConfigUtils.getPublishing(
      config
    ) as DendronPublishingConfig;
    return {
      ...publishingConfig,
      ...overrides,
      enablePrettyLinks: true,
    } as DendronPublishingConfig;
  }
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
    notes,
    engineConfig,
  }: {
    engine: DEngineClient;
    note: NoteProps;
    notes: NotePropsDict;
    engineConfig: IntermediateDendronConfig;
  }) {
    const proc = MDUtilsV5.procRehypeFull(
      {
        engine,
        fname: note.fname,
        vault: note.vault,
        config: engineConfig,
        notes,
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
    siteConfig: DendronSiteConfig | DendronPublishingConfig;
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
    config: IntermediateDendronConfig;
    dest: string;
  }) {
    const ctx = "copyAssets";
    const vaults = ConfigUtils.getVaults(config);
    const destPublicPath = path.join(dest, "public");
    fs.ensureDirSync(destPublicPath);
    const siteAssetsDir = path.join(destPublicPath, "assets");
    const publishingConfig = ConfigUtils.getPublishingConfig(config);

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
      fs.copySync(logoPath, path.join(siteAssetsDir, path.basename(logoPath)));
    }
    // /get cname
    const githubConfig = ConfigUtils.getGithubConfig(config);
    const githubCname = githubConfig.cname;
    if (githubCname) {
      fs.writeFileSync(path.join(destPublicPath, "CNAME"), githubCname, {
        encoding: "utf8",
      });
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
    notes,
    engineConfig,
  }: Parameters<NextjsExportPod["_renderNote"]>[0] & {
    notesDir: string;
    engineConfig: IntermediateDendronConfig;
  }) {
    const ctx = `${ID}:renderBodyToHTML`;
    this.L.debug({ ctx, msg: "renderNote:pre", note: note.id });
    const out = await this._renderNote({ engine, note, notes, engineConfig });
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
    const ctx = `${ID}:plant`;
    const { dest, engine, wsRoot, config: podConfig } = opts;

    const podDstDir = path.join(dest.fsPath, "data");
    fs.ensureDirSync(podDstDir);

    const siteConfig = getSiteConfig({
      config: engine.config,
      overrides: podConfig.overrides,
    });

    await this.copyAssets({ wsRoot, config: engine.config, dest: dest.fsPath });

    this.L.info({ ctx, msg: "filtering notes..." });
    const engineConfig: IntermediateDendronConfig =
      ConfigUtils.overridePublishingConfig(engine.config, siteConfig);

    const { notes: publishedNotes, domains } = await SiteUtils.filterByConfig({
      engine,
      config: engineConfig,
      noExpandSingleDomain: true,
    });
    const siteNotes = SiteUtils.addSiteOnlyNotes({
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

    // render notes
    const notesBodyDir = path.join(podDstDir, "notes");
    const notesMetaDir = path.join(podDstDir, "meta");
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
            notes: publishedNotes,
            engineConfig,
          }),
          this.renderMetaToJSON({ note, notesDir: notesMetaDir }),
          this.renderBodyAsMD({ note, notesDir: notesBodyDir }),
        ]);
      })
    );

    const podDstPath = path.join(podDstDir, "notes.json");
    const podConfigDstPath = path.join(podDstDir, "dendron.json");
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
      fs.writeJSON(podConfigDstPath, engineConfig, {
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
