import {
  ImportPod,
  ImportPodConfig,
  ImportPodPlantOpts,
  PublishPod,
  PublishPodConfig,
  PublishPodPlantOpts,
} from "../basev3";
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
  ERROR_SEVERITY,
  getSlugger,
} from "@dendronhq/common-all";

const ID = "dendron.githubissue";

type GithubIssueImportPodCustomOpts = {
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

type GithubAPIOpts = GithubIssueImportPodCustomOpts & {
  created?: string;
  afterCursor?: string;
};

type GithubIssueImportPodConfig = ImportPodConfig &
  GithubIssueImportPodCustomOpts;

export type GithubIssueImportPodPlantOpts = ImportPodPlantOpts;

export class GithubIssueImportPod extends ImportPod<GithubIssueImportPodConfig> {
  static id: string = ID;
  static description: string = "import github issues";

  get config(): JSONSchemaType<GithubIssueImportPodConfig> {
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
    }) as JSONSchemaType<GithubIssueImportPodConfig>;
  }

  /**
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
              id
              title
              url
              number
              state
              author {
                url
              }
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
    } catch (error: any) {
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
      const fname = ent.node.fname;

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

  /**
   * method to add fromtmatter to notes: url, status and tags
   */
  addFrontMatterToData = (
    data: any,
    fname: string,
    config: ImportPodConfig
  ) => {
    const slugger = getSlugger();
    return data.map((d: any) => {
      const labels = d.node.labels.edges;
      let tags: any;
      if (labels.length > 0) {
        tags = labels.map((label: any) => label.node.name);
      }
      d.node.title = slugger.slug(
        d.node.title.replace(
          /[`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi, // eslint-disable-line
          ""
        )
      );
      d.node = {
        body: d.node.body,
        fname: `${fname}.${d.node.number}-${d.node.title}`,
        custom: {
          ...config.frontmatter,
          url: d.node.url,
          status: d.node.state,
          issueID: d.node.id,
          author: d.node.author.url,
        },
        tags,
      };
    });
  };

  /**
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

  /**
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
      if (
        !_.isUndefined(n) &&
        (n.custom.issueID === undefined ||
          n.custom.status !== note.custom.status)
      ) {
        n.custom.status = note.custom.status;
        n.custom.issueID = note.custom.issueID;
        updatedNotes = [...updatedNotes, n];
        await engine.writeNote(n, { newNode: true });
      }
    });
    return updatedNotes;
  }

  async plant(opts: GithubIssueImportPodPlantOpts) {
    const ctx = "GithubIssuePod";
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
    } = config as GithubIssueImportPodConfig;
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
      const result: any = await this.getDataFromGithub({
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

    const notes = await this._issues2Notes(data, {
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

type GithubIssuePublishPodCustomOpts = {
  /**
   * owner of the repository
   */
  owner: string;

  /**
   * github repository to import from
   */
  repository: string;

  /**
   * github personal access token
   */
  token: string;
};

type GithubIssuePublishPodConfig = PublishPodConfig &
  GithubIssuePublishPodCustomOpts;
export class GithubIssuePublishPod extends PublishPod<GithubIssuePublishPodConfig> {
  static id: string = ID;
  static description: string = "publish github issues";

  get config(): JSONSchemaType<GithubIssuePublishPodConfig> {
    return PodUtils.createPublishConfig({
      required: ["token", "owner", "repository"],
      properties: {
        owner: {
          type: "string",
          description: "owner of the repository",
        },
        repository: {
          description: "github repository to import from",
          type: "string",
        },
        token: {
          type: "string",
          description: "github personal access token",
        },
      },
    }) as JSONSchemaType<GithubIssuePublishPodConfig>;
  }

  /**
   * method to get all the discussion categories of a repository in a key value pair
   */
  getDiscussionCategories = async (
    opts: Partial<GithubIssuePublishPodConfig>
  ) => {
    const { owner, repository, token } = opts;
    let discussionCategoriesHashMap: any;
    const query = `query repository($name: String!, $owner: String!)
      {
        repository(owner: $owner , name: $name) { 
          discussionCategories(last:10){
            edges{
              node {
                id
                name
              }
            }
          }
        }
      }`;
    try {
      const result: any = await graphql(query, {
        headers: { authorization: `token ${token}` },
        owner,
        name: repository,
      });
      const allCategories = result.repository.discussionCategories.edges;
      allCategories.forEach((category: any) => {
        discussionCategoriesHashMap = {
          ...discussionCategoriesHashMap,
          [category.node.name]: category.node.id,
        };
      });
    } catch (error: any) {
      throw new DendronError({ message: stringifyError(error) });
    }
    return discussionCategoriesHashMap;
  };

  /**
   * method to get all the milestones of a repository in key value pair
   */
  getMilestonesFromGithub = async (
    opts: Partial<GithubIssuePublishPodConfig>
  ) => {
    const { owner, repository, token } = opts;
    let milestonesHashMap: any;
    const query = `query repository($name: String!, $owner: String!)
      {
        repository(owner: $owner , name: $name) { 
          milestones(first: 100,
            orderBy: {field: CREATED_AT, direction: DESC},
            ){
             edges {
               node {
                 id,
                 title
                }
              }
            }
        }
      }`;
    try {
      const result: any = await graphql(query, {
        headers: { authorization: `token ${token}` },
        owner,
        name: repository,
      });
      const allMilestones = result.repository.milestones.edges;
      allMilestones.forEach((milestone: any) => {
        milestonesHashMap = {
          ...milestonesHashMap,
          [milestone.node.title]: milestone.node.id,
        };
      });
    } catch (error: any) {
      throw new DendronError({ message: stringifyError(error) });
    }
    return milestonesHashMap;
  };

  /**
   * method to get all the labels of a repository in key value pair
   *
   */
  getLabelsFromGithub = async (opts: Partial<GithubIssuePublishPodConfig>) => {
    const { owner, repository, token } = opts;
    let labelsHashMap: any;
    const query = `query repository($name: String!, $owner: String!)
    {
      repository(owner: $owner , name: $name) { 
        labels(last: 100) {
          edges{
            node {
              id
              name
            }
          }
        }
    }
    }`;
    try {
      const result: any = await graphql(query, {
        headers: { authorization: `token ${token}` },
        owner,
        name: repository,
      });
      const allLabels = result.repository.labels.edges;
      allLabels.forEach((label: any) => {
        labelsHashMap = {
          ...labelsHashMap,
          [label.node.name]: label.node.id,
        };
      });
    } catch (error: any) {
      throw new DendronError({ message: stringifyError(error) });
    }
    return labelsHashMap;
  };

  /**
   * method to update the milestone of issue in github
   */
  updateMilestone = async (opts: {
    issueID: string;
    token: string;
    milestoneId: string;
  }) => {
    const { issueID, token, milestoneId } = opts;
    const mutation = `mutation updateIssue($id: ID!, $milestoneId: ID){
      updateIssue(input: {id : $id , milestoneId: $milestoneId}){
        issue {
              id
            }
        }
      }`;
    try {
      await graphql(mutation, {
        headers: { authorization: `token ${token}` },
        id: issueID,
        milestoneId,
      });
    } catch (error: any) {
      throw new DendronError({ message: stringifyError(error) });
    }
  };

  /**
   * method to update the issue in github
   * Only users with push access can set labels, milestone for issues. Labels and Milestone are dropped otherwise.
   */
  updateIssue = async (opts: {
    issueID: string;
    token: string;
    status: string;
    labelIDs: string[];
    milestoneId: string;
  }) => {
    const { issueID, token, status, labelIDs, milestoneId } = opts;
    if (milestoneId) {
      /**
       * While regression it was observed that milestone is not updated if the issue
       * state remains same, hence creating a new method to update milestone
       */
      this.updateMilestone({ issueID, token, milestoneId });
    }
    let resp: string = "";
    const mutation = `mutation updateIssue($id: ID!, $state: IssueState, $labelIDs: [ID!]){
          updateIssue(input: {id : $id , state: $state, labelIds: $labelIDs}){
            issue {
                  id
                }
            }
          }`;
    try {
      const result: any = await graphql(mutation, {
        headers: { authorization: `token ${token}` },
        id: issueID,
        state: status,
        labelIDs,
      });
      if (!_.isUndefined(result.updateIssue.issue.id)) {
        resp = "Issue Updated";
      }
    } catch (error: any) {
      resp = stringifyError(error);
      throw new DendronError({ message: stringifyError(error) });
    }

    return resp;
  };

  /**
   * method to get the repository id
   */
  getRepositoryId = async (opts: Partial<GithubIssuePublishPodConfig>) => {
    let repositoryId: string;
    const { owner, repository, token } = opts;
    const query = `query repository($name: String!, $owner: String!)
    {
      repository(owner: $owner , name: $name) { 
      id
    }
    }`;
    try {
      const result: any = await graphql(query, {
        headers: { authorization: `token ${token}` },
        owner,
        name: repository,
      });
      repositoryId = result.repository.id;
    } catch (error: any) {
      throw new DendronError({
        message: stringifyError(error),
        severity: ERROR_SEVERITY.MINOR,
      });
    }
    return repositoryId;
  };

  /**
   * method to create an issue in github
   * Only users with push access can set labels, milestone for new issues. Labels and Milestone are not dropped silently in Graphql createIssue.
   */
  createIssue = async (opts: {
    token: string;
    labelIDs: string[];
    owner: string;
    repository: string;
    note: NoteProps;
    engine: DEngineClient;
    milestoneId: string;
  }) => {
    const { token, labelIDs, owner, repository, note, engine, milestoneId } =
      opts;
    const { title, body } = note;
    let resp: string = "";
    const length = labelIDs.length;
    const repositoryId = await this.getRepositoryId({
      token,
      owner,
      repository,
    });

    const mutation = `mutation createIssue($repositoryId: ID!, $title: String!, $body: String, ${
      length > 0 ? `$labelIDs: [ID!]` : ""
    }, ${milestoneId ? `$milestoneId: ID` : ""} ){
      createIssue(input: {repositoryId : $repositoryId , title: $title, body: $body, ${
        length > 0 ? `labelIds: $labelIDs` : ""
      }, ${milestoneId ? `milestoneId: $milestoneId` : ""}}){
                issue {
                      id
                      url
                      state
                    }
                }
              }`;
    try {
      const result: any = await graphql(mutation, {
        headers: { authorization: `token ${token}` },
        repositoryId,
        title,
        body,
        labelIDs,
        milestoneId,
      });
      const issue = result.createIssue.issue;
      if (!_.isUndefined(result.createIssue.issue.id)) {
        note.custom.issueID = issue.id;
        note.custom.url = issue.url;
        note.custom.status = issue.state;
        await engine.writeNote(note, { updateExisting: true });
        resp = "Issue Created";
      }
    } catch (error: any) {
      resp = stringifyError(error);
      throw new DendronError({
        message: stringifyError(error),
        severity: ERROR_SEVERITY.MINOR,
      });
    }
    return resp;
  };

  /**
   * method to create a discussion in github
   */
  createDiscussion = async (opts: {
    token: string;
    owner: string;
    repository: string;
    note: NoteProps;
    engine: DEngineClient;
    categoryId: string;
  }) => {
    const { token, owner, repository, note, engine, categoryId } = opts;
    const { title } = note;
    let { body } = note;
    if (!body.trim()) {
      body = `Discussion for ${title}`;
    }
    let resp: string = "";
    const repositoryId = await this.getRepositoryId({
      token,
      owner,
      repository,
    });
    const mutation = `mutation createDiscussion($repositoryId: ID!, $title: String!, $body: String, $categoryId: ID! ){
        createDiscussion(input: {repositoryId : $repositoryId , title: $title, body: $body, categoryId: $categoryId})
		      {
            discussion 
              {
                id
                url
                author 
                  {
                    url
                  }
		         }
            }
          }`;
    try {
      const result: any = await graphql(mutation, {
        headers: { authorization: `token ${token}` },
        repositoryId,
        title,
        body,
        categoryId,
      });
      const discussion = result.createDiscussion.discussion;
      if (!_.isUndefined(discussion.url)) {
        note.custom.discussionID = discussion.id;
        note.custom.url = discussion.url;
        note.custom.author = discussion.author.url;
        await engine.writeNote(note, { updateExisting: true });
        resp = "Discussion Created";
      }
    } catch (error: any) {
      resp = stringifyError(error);
      throw new DendronError({
        message: stringifyError(error),
        severity: ERROR_SEVERITY.MINOR,
      });
    }
    return resp;
  };

  async plant(opts: PublishPodPlantOpts) {
    const { config, engine } = opts;
    const { owner, repository, token } = config as GithubIssuePublishPodConfig;
    const labelsHashMap = await this.getLabelsFromGithub({
      owner,
      repository,
      token,
    });
    let milestoneId;
    const note = opts.note;
    const tags = opts.note.tags;
    const { issueID, status, milestone, category } = note.custom;

    if (!_.isUndefined(category)) {
      const discussionCategoriesHashMap = await this.getDiscussionCategories({
        owner,
        repository,
        token,
      });
      const categoryId = discussionCategoriesHashMap[category];
      if (_.isUndefined(categoryId)) {
        return "Github: Invalid category";
      }
      const resp = await this.createDiscussion({
        token,
        owner,
        repository,
        note,
        engine,
        categoryId,
      });
      return "Github: ".concat(resp);
    }

    if (!_.isUndefined(milestone)) {
      const milestonesHashMap = await this.getMilestonesFromGithub({
        owner,
        repository,
        token,
      });
      milestoneId = milestonesHashMap[milestone];
      if (_.isUndefined(milestoneId)) {
        return "Github: Invalid milestone";
      }
    }
    const labelIDs: string[] = [];
    if (_.isString(tags)) {
      if (labelsHashMap[tags]) labelIDs.push(labelsHashMap[tags]);
    } else {
      tags?.forEach((tag: string) => {
        if (labelsHashMap[tag]) labelIDs.push(labelsHashMap[tag]);
      });
    }

    if (!_.isUndefined(tags) && labelIDs.length === 0) {
      return "Github: The labels in the tag does not belong to selected repository";
    }
    const resp =
      _.isUndefined(issueID) && _.isUndefined(status)
        ? await this.createIssue({
            token,
            owner,
            repository,
            labelIDs,
            note,
            engine,
            milestoneId,
          })
        : await this.updateIssue({
            issueID,
            token,
            status: status.toUpperCase(),
            labelIDs,
            milestoneId,
          });

    return "Github: ".concat(resp);
  }
}
