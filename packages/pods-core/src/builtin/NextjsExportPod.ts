import {
  DendronConfig,
  DendronSiteConfig,
  DEngineClient,
  NoteProps,
  NotePropsDict,
  NoteUtils,
  createSerializedFuseNoteIndex,
} from "@dendronhq/common-all";
import { MDUtilsV5, ProcFlavor, SiteUtils } from "@dendronhq/engine-server";
import { JSONSchemaType } from "ajv";
import {
  writeFile,
  writeFileSync,
  existsSync,
  copySync,
  ensureDirSync,
  writeJSON,
  writeJSONSync,
  removeSync,
  readFileSync,
} from "fs-extra";
import _ from "lodash";
import path from "path";
import { URI } from "vscode-uri";
import { ExportPod, ExportPodConfig, ExportPodPlantOpts } from "../basev3";
import { PodUtils } from "../utils";

const ID = "dendron.nextjs";

type NextjsExportPodCustomOpts = {
  overrides?: Partial<DendronSiteConfig>;
};

export const mapObject = (
  obj: { [k: string]: any },
  fn: (k: string, v: any) => any
) => Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, fn(k, v)]));

export const removeBodyFromNote = ({ body, ...note }: Record<string, any>) =>
  note;

export const removeBodyFromNotesDict = (notes: NotePropsDict) =>
  mapObject(notes, (_k, note: NotePropsDict) => removeBodyFromNote(note));

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

const _determineLogoPath = (
  logoPath: string | undefined,
  fsPath: string,
  assetsPrefix: string | undefined
): string | null => {
  if (logoPath && logoPath.length > 0) {
    // Ensure the logo actually exists at the specified path, starting from `/assets/`
    const siteAssetsDir = assetsPrefix
      ? path.join(fsPath, "public", assetsPrefix, "assets")
      : path.join(fsPath, "public", "assets");
    const originalLogoPath = path.join(siteAssetsDir, logoPath);
    // Also check in the `/images/` subdirectory
    const subDirLogoPath = path.join(siteAssetsDir, "images", logoPath);

    if (existsSync(originalLogoPath)) {
      return originalLogoPath;
    } else if (existsSync(subDirLogoPath)) {
      return subDirLogoPath;
    } else {
      // The logo can't be found
      return null;
    }
  } else {
    return null;
  }
};

// Set "a" flag to append data to the end of any existing file
// which prevents us from overwriting any existing .env.production file
const _writeToEnvFile = (
  filePath: string,
  fsPath: string,
  assetsPrefix: string | undefined,
  logoPath: string | undefined
): void => {
  if (assetsPrefix && _determineLogoPath(logoPath, fsPath, assetsPrefix)) {
    const realLogoPath: string = _determineLogoPath(
      logoPath,
      fsPath,
      assetsPrefix
    ) as string;
    writeFileSync(
      filePath,
      `NEXT_PUBLIC_ASSET_PREFIX=${assetsPrefix}\n
			DENDRON_LOGO_PATH=${realLogoPath}`,
      { flag: "a" }
    );
  } else if (assetsPrefix) {
    writeFileSync(filePath, `NEXT_PUBLIC_ASSET_PREFIX=${assetsPrefix}`, {
      flag: "a",
    });
  } else if (_determineLogoPath(logoPath, fsPath, assetsPrefix)) {
    const realLogoPath: string = _determineLogoPath(
      logoPath,
      fsPath,
      assetsPrefix
    ) as string;
    writeFileSync(filePath, `DENDRON_LOGO_PATH=${realLogoPath}`, { flag: "a" });
  }
};

export type NextjsExportConfig = ExportPodConfig & NextjsExportPodCustomOpts;

type NextjsExportPlantOpts = ExportPodPlantOpts<NextjsExportConfig>;

export class NextjsExportPodUtils {
  static getDendronConfigPath = (dest: URI) => {
    const podDstDir = path.join(dest.fsPath, "data");
    const podConfigDstPath = path.join(podDstDir, "dendron.json");
    return podConfigDstPath;
  };
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
    engineConfig: DendronConfig;
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
    const envPath: string = path.join(dest.fsPath, ".env.production");
    _writeToEnvFile(
      envPath,
      dest.fsPath,
      siteConfig.assetsPrefix,
      siteConfig.logo
    );
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
    const vaults = config.vaults;
    const destPublicPath = path.join(dest, "public");
    ensureDirSync(destPublicPath);
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
      if (existsSync(headerPath)) {
        copySync(headerPath, path.join(destPublicPath, "header.html"));
      }
    }
    // get favicon
    if (siteConfig.siteFaviconPath) {
      const faviconPath = path.join(wsRoot, siteConfig.siteFaviconPath);
      if (existsSync(faviconPath)) {
        copySync(faviconPath, path.join(destPublicPath, "favicon.ico"));
      }
    }
    // get logo
    if (siteConfig.logo) {
      const logoPath = path.join(wsRoot, siteConfig.logo);
      copySync(logoPath, path.join(siteAssetsDir, path.basename(logoPath)));
    }
    // /get cname
    if (siteConfig.githubCname) {
      writeFileSync(
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
    return writeFile(dst, out);
  }

  async renderBodyToHTML({
    engine,
    note,
    notesDir,
    notes,
    engineConfig,
  }: Parameters<NextjsExportPod["_renderNote"]>[0] & {
    notesDir: string;
    engineConfig: DendronConfig;
  }) {
    const ctx = `${ID}:renderBodyToHTML`;
    this.L.debug({ ctx, msg: "renderNote:pre", note: note.id });
    const out = await this._renderNote({ engine, note, notes, engineConfig });
    const dst = path.join(notesDir, note.id + ".html");
    this.L.debug({ ctx, dst, msg: "writeNote" });
    return writeFile(dst, out);
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
    return writeJSON(dst, out);
  }

  async plant(opts: NextjsExportPlantOpts) {
    const ctx = `${ID}:plant`;
    const { dest, engine, wsRoot, config: podConfig } = opts;

    const podDstDir = path.join(dest.fsPath, "data");
    ensureDirSync(podDstDir);
    const siteConfig = getSiteConfig({
      siteConfig: engine.config.site,
      overrides: podConfig.overrides,
    });

    await this.copyAssets({ wsRoot, config: engine.config, dest: dest.fsPath });

    this.L.info({ ctx, msg: "filtering notes..." });
    const engineConfig: DendronConfig = {
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

    // render notes
    const notesBodyDir = path.join(podDstDir, "notes");
    const notesMetaDir = path.join(podDstDir, "meta");
    this.L.info({ ctx, msg: "ensuring notesDir...", notesDir: notesBodyDir });
    ensureDirSync(notesBodyDir);
    ensureDirSync(notesMetaDir);
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
    writeJSONSync(
      podDstPath,
      {
        ...payload,
        notes: removeBodyFromNotesDict(payload.notes),
      },
      { encoding: "utf8", spaces: 2 }
    );
    writeJSONSync(podConfigDstPath, engineConfig, {
      encoding: "utf8",
      spaces: 2,
    });

    // Generate full text search data
    const fuseDstPath = path.join(podDstDir, "fuse.json");
    const fuseIndex = createSerializedFuseNoteIndex(publishedNotes);
    writeJSONSync(fuseDstPath, fuseIndex);

    this._writeEnvFile({ siteConfig, dest });

    const publicPath = path.join(podDstDir, "..", "public");
    const publicDataPath = path.join(publicPath, "data");

    if (existsSync(publicDataPath)) {
      this.L.info("removing existing 'public/data");
      removeSync(publicDataPath);
    }
    this.L.info("moving data");
    copySync(podDstDir, publicDataPath);
    return { notes: _.values(publishedNotes) };
  }
}
