import { ImportPod, ImportPodConfig, ImportPodPlantOpts } from "../basev3";
import { JSONSchemaType } from "ajv";
import { PodUtils } from "../utils";
import { graphql } from "@octokit/graphql";
import _ from "lodash";
import {
  DendronError,
  DVault,
  NoteProps,
  NoteUtils,
  stringifyError,
  Time,
  DEngineClient,
} from "@dendronhq/common-all";

const ID = "dendron.github";

type GithubImportPodCustomOpts = {
  /**
   * owner of the repository
   */
  owner: string;

  /**
   * github repository to import from
   */
  repository: string;

  /**
   * import issues created before this date
   */
  endDate?: string;

  /**
   * import issues created after this date
   */
  startDate?: string;

  /**
   * status of issue open/closed
   */
  status: string;

  /**
   * github personal access token
   */
  token: string;

  /**
   * name of hierarchy to import into
   */
  fname: string;
};

type GithubAPIOpts = GithubImportPodCustomOpts & {
  created?: string;
  afterCursor?: string;
};

type GithubImportPodConfig = ImportPodConfig & GithubImportPodCustomOpts;

export type GithubImportPodPlantOpts = ImportPodPlantOpts;

export class GithubImportPod extends ImportPod<GithubImportPodConfig> {
  static id: string = ID;
  static description: string = "import github issues";

  get config(): JSONSchemaType<GithubImportPodConfig> {
    return PodUtils.createImportConfig({
      required: ["repository", "owner", "status", "token", "fname"],
      properties: {
        owner: {
          type: "string",
          description: "owner of the repository",
        },
        repository: {
          description: "github repository to import from",
          type: "string",
        },
        status: {
          type: "string",
          description: "status of issue open/closed",
          enum: ["open", "closed"],
        },
        endDate: {
          type: "string",
          description: "import issues created before this date: YYYY-MM-DD",
          format: "date",
          default: Time.now().toISODate(),
          nullable: true,
        },
        startDate: {
          type: "string",
          description: "import issues created after this date: YYYY-MM-DD",
          format: "date",
          nullable: true,
        },
        token: {
          type: "string",
          description: "github personal access token",
        },
        fname: {
          type: "string",
          description: "name of hierarchy to import into",
        },
      },
    }) as JSONSchemaType<GithubImportPodConfig>;
  }

  /*
   * method to fetch issues from github graphql api
   */
  getDataFromGithub = async (opts: Partial<GithubAPIOpts>) => {
    let result;
    const { owner, repository, status, created, afterCursor, token } = opts;
    const queryVal = `repo:${owner}/${repository} is:issue is:${status} ${created}`;

    const query = `query search($val: String!, $after: String)
    {search(type: ISSUE, first: 100, query: $val, after: $after) {
      pageInfo {
        hasNextPage
        endCursor
      }
        edges {
          node {
            ... on Issue {
              title
              url
              number
              state
              labels(first:5) {
                edges {
                  node {
                    name
                  }
                }
              }
              body
            }
          }
        }
      }
    }`;
    try {
      result = await graphql(query, {
        headers: { authorization: `token ${token}` },
        val: queryVal,
        after: afterCursor,
      });
    } catch (error) {
      this.L.error({
        msg: "failed to import all the issues",
        payload: stringifyError(error),
      });
      throw new DendronError({ message: stringifyError(error) });
    }
    return result;
  };

  async _issues2Notes(
    entries: any,
    opts: Pick<ImportPodConfig, "concatenate" | "destName" | "fnameAsId"> & {
      vault: DVault;
    }
  ): Promise<NoteProps[]> {
    const { vault } = opts;
    const notes = _.map(entries, (ent) => {
      if (!ent.node.fname) {
        throw Error("fname not defined");
      }
      let fname = ent.node.fname;
      if (opts.fnameAsId) {
        ent.node.id = ent.node.fname;
      }
      return NoteUtils.create({ ...ent.node, fname, vault });
    });
    if (opts.concatenate) {
      if (!opts.destName) {
        throw Error(
          "destname needs to be specified if concatenate is set to true"
        );
      }
      const acc: string[] = [""];
      _.forEach(notes, (n) => {
        acc.push(`# [[${n.fname}]]`);
        acc.push(n.body);
        acc.push("---");
      });
      return [
        NoteUtils.create({
          fname: opts.destName,
          body: acc.join("\n"),
          vault,
        }),
      ];
    } else {
      return notes;
    }
  }

  /*
   * method to add fromtmatter to notes: url, status and tags
   */
  addFrontMatterToData = (
    data: any,
    fname: string,
    config: ImportPodConfig
  ) => {
    return data.map((d: any) => {
      const labels = d.node.labels.edges;
      let tags: any;
      if (labels.length > 0) {
        tags = labels.map((label: any) => label.node.name);
      }
      d.node.title = d.node.title.replace(
        /[`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi,
        ""
      );
      d.node = {
        body: d.node.body,
        fname: `${fname}.${d.node.number}-${d.node.title}`,
        custom: {
          ...config.frontmatter,
          url: d.node.url,
          status: d.node.state,
          tags,
        },
      };
    });
  };

  /*
   * method to get notes that are not already present in the vault
   */

  getNewNotes(
    notes: NoteProps[],
    engine: DEngineClient,
    wsRoot: string,
    vault: DVault
  ) {
    return notes.filter((note) => {
      const n = NoteUtils.getNoteByFnameV5({
        fname: note.fname,
        notes: engine.notes,
        vault,
        wsRoot,
      });
      return _.isUndefined(n);
    });
  }

  /*
   * method to update the notes whose status has changed
   */
  getUpdatedNotes(
    notes: NoteProps[],
    engine: DEngineClient,
    wsRoot: string,
    vault: DVault
  ) {
    let updatedNotes: NoteProps[] = [];
    notes.forEach(async (note) => {
      const n = NoteUtils.getNoteByFnameV5({
        fname: note.fname,
        notes: engine.notes,
        vault,
        wsRoot,
      });
      if (!_.isUndefined(n) && n.custom.status !== note.custom.status) {
        n.custom.status = note.custom.status;
        updatedNotes = [...updatedNotes, n];
        await engine.writeNote(n, { newNode: true });
      }
    });
    return updatedNotes;
  }

  async plant(opts: GithubImportPodPlantOpts) {
    const ctx = "GithubPod";
    this.L.info({ ctx, opts, msg: "enter" });
    const { wsRoot, engine, vault, config } = opts;
    const {
      owner,
      repository,
      status,
      endDate = Time.now().toISODate(),
      startDate,
      token,
      destName,
      concatenate,
      fname,
      fnameAsId,
    } = config as GithubImportPodConfig;
    let hasNextPage: boolean = true;
    let afterCursor = null;
    let created: string;
    let data: any[] = [];

    if (!_.isUndefined(startDate)) {
      created = `created:${startDate}..${endDate}`;
    } else {
      created = `created:<${endDate}`;
    }

    while (hasNextPage) {
      let result: any = await this.getDataFromGithub({
        owner,
        repository,
        status,
        created,
        afterCursor,
        token,
      });
      data = [...data, ...result.search.edges];
      hasNextPage = result.search.pageInfo.hasNextPage;
      afterCursor = result.search.pageInfo.endCursor;
    }

    if (data.length === 0) {
      throw new DendronError({
        message:
          "No issues present for this filter. Change the config values and try again",
      });
    }

    this.addFrontMatterToData(data, fname, config);

    let notes = await this._issues2Notes(data, {
      vault,
      destName,
      concatenate,
      fnameAsId,
    });
    const newNotes = this.getNewNotes(notes, engine, wsRoot, vault);
    const updatedNotes = this.getUpdatedNotes(notes, engine, wsRoot, vault);

    await engine.bulkAddNotes({ notes: newNotes });

    return { importedNotes: [...newNotes, ...updatedNotes] };
  }
}
