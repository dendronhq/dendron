import {
  IntermediateDendronConfig,
  DendronSiteConfig,
  DEngineClient,
  NoteProps,
  NotePropsDict,
  NoteUtils,
  createSerializedFuseNoteIndex,
  ConfigUtils,
} from "@dendronhq/common-all";
import { simpleGit } from "@dendronhq/common-server";
import {
  MDUtilsV5,
  ProcFlavor,
  SiteUtils,
  execa,
} from "@dendronhq/engine-server";
import { JSONSchemaType } from "ajv";
import fs from "fs-extra";
import { accesscontextmanager } from "googleapis/build/src/apis/accesscontextmanager";
import _ from "lodash";
import path from "path";
import { URI } from "vscode-uri";
import { ExportPod, ExportPodConfig, ExportPodPlantOpts } from "../basev3";
import { PodUtils } from "../utils";

const ID = "dendron.nextjs";

const $$ = (cmd: string, opts?: any) => {
  return execa.command(cmd, { ...opts });
};

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

export const filterNav = ({
  id,
  title,
  children,
  custom,
  parent,
  schema,
  fname,
  stub,
}: Record<string, any>):
  | Pick<
      NoteProps,
      | "id"
      | "title"
      | "children"
      | "custom"
      | "parent"
      | "schema"
      | "fname"
      | "stub"
    >
  | undefined => {
  return { id, title, children, custom, parent, schema, fname, stub };
};

export const filterNavItemsFromNotes = (
  notes: NotePropsDict,
  domainsProps: NoteProps[]
) => {
  const notesObj = (
    obj: Pick<
      NoteProps,
      | "id"
      | "title"
      | "children"
      | "custom"
      | "parent"
      | "schema"
      | "fname"
      | "stub"
    >[]
  ) =>
    obj.reduce((acc, curr) => {
      const { id, title, children, custom, parent, schema, fname, stub } = curr;
      acc[id] = { id, title, children, custom, parent, schema, fname, stub };

      return acc;
    }, {} as { [key: string]: Partial<NoteProps> });

  const domains = mapObject(notesObj(domainsProps), (_k, note: NotePropsDict) =>
    filterNav(note)
  );

  const notesResult = mapObject(notes, (_k, note: NotePropsDict) =>
    filterNav(note)
  );
  return { domains, notes: notesResult };
};

function getSiteConfig({
  siteConfig,
  overrides,
}: {
  siteConfig: DendronSiteConfig;
  overrides?: Partial<DendronSiteConfig>;
}): DendronSiteConfig {
  return {
    ...siteConfig,
    ...overrides,
    usePrettyLinks: true,
  };
}

export type NextjsExportConfig = ExportPodConfig & NextjsExportPodCustomOpts;

type NextjsExportPlantOpts = ExportPodPlantOpts<NextjsExportConfig>;

export class NextjsExportPodUtils {
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

    const url = "https://github.com/dendronhq/nextjs-template.git";
    await fs.ensureDir(nextPath);
    const git = simpleGit({ baseDir: nextPath });
    await git.clone(url, nextPath);

    return { error: null };
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

  static async startNextDev(opts: { nextPath: string; quiet?: boolean }) {
    const { nextPath, quiet } = opts;
    const cmdDev = quiet ? "npm run --silent dev" : "npm run dev";
    const out = $$(cmdDev, { cwd: nextPath });
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

  _writeEnvFile({
    siteConfig,
    dest,
  }: {
    siteConfig: DendronSiteConfig;
    dest: URI;
  }) {
    // add .env.production if necessary
    // TODO: don't overwrite if somethign exists
    if (siteConfig.assetsPrefix) {
      fs.writeFileSync(
        path.join(dest.fsPath, ".env.production"),
        `NEXT_PUBLIC_ASSET_PREFIX=${siteConfig.assetsPrefix}`
      );
    }
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
    const siteConfig = config.site;
    this.L;
    // copy site assets
    if (!config.site.copyAssets) {
      this.L.info({ ctx, msg: "skip copying" });
      return;
    }
    this.L.info({ ctx, msg: "copying", vaults });
    let deleteSiteAssetsDir = true;
    await vaults.reduce(async (resp, vault) => {
      await resp;
      if (vault.visibility === "private") {
        console.log(`skipping copy assets from private vault ${vault.fsPath}`);
        return Promise.resolve({});
      }
      await SiteUtils.copyAssets({
        wsRoot,
        vault,
        siteAssetsDir,
        deleteSiteAssetsDir,
      });
      deleteSiteAssetsDir = false;
      return Promise.resolve({});
    }, Promise.resolve({}));

    this.L.info({ ctx, msg: "finish copying assets" });

    // custom headers
    if (siteConfig.customHeaderPath) {
      const headerPath = path.join(wsRoot, siteConfig.customHeaderPath);
      if (fs.existsSync(headerPath)) {
        fs.copySync(headerPath, path.join(destPublicPath, "header.html"));
      }
    }
    // get favicon
    if (siteConfig.siteFaviconPath) {
      const faviconPath = path.join(wsRoot, siteConfig.siteFaviconPath);
      if (fs.existsSync(faviconPath)) {
        fs.copySync(faviconPath, path.join(destPublicPath, "favicon.ico"));
      }
    }
    // get logo
    if (siteConfig.logo) {
      const logoPath = path.join(wsRoot, siteConfig.logo);
      fs.copySync(logoPath, path.join(siteAssetsDir, path.basename(logoPath)));
    }
    // /get cname
    if (siteConfig.githubCname) {
      fs.writeFileSync(
        path.join(destPublicPath, "CNAME"),
        siteConfig.githubCname,
        { encoding: "utf8" }
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
    console.log("planting ======>");
    const { dest, engine, wsRoot, config: podConfig } = opts;

    const podDstDir = path.join(dest.fsPath, "data");
    fs.ensureDirSync(podDstDir);
    const siteConfig = getSiteConfig({
      siteConfig: engine.config.site,
      overrides: podConfig.overrides,
    });

    await this.copyAssets({ wsRoot, config: engine.config, dest: dest.fsPath });

    this.L.info({ ctx, msg: "filtering notes..." });
    const engineConfig: IntermediateDendronConfig = {
      ...engine.config,
      site: siteConfig,
    };

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

    // console.log(
    //   "published notes => ",
    //   filterNavItemsFromNotes(publishedNotes, domains)
    // );

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
    const sectionsDstPath = path.join(podDstDir, "sections.json");

    fs.writeJSONSync(
      podDstPath,
      {
        ...payload,
        notes: removeBodyFromNotesDict(payload.notes),
      },
      { encoding: "utf8", spaces: 2 }
    );

    fs.writeJSONSync(podConfigDstPath, engineConfig, {
      encoding: "utf8",
      spaces: 2,
    });

    fs.writeJSONSync(
      sectionsDstPath,
      {
        ...filterNavItemsFromNotes(payload.notes, payload.domains),
      },
      { encoding: "utf-8", spaces: 2 }
    );

    // Generate full text search data
    const fuseDstPath = path.join(podDstDir, "fuse.json");
    const fuseIndex = createSerializedFuseNoteIndex(publishedNotes);
    fs.writeJsonSync(fuseDstPath, fuseIndex);

    this._writeEnvFile({ siteConfig, dest });

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
