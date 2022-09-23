import {
  ImportPod,
  ImportPodConfig,
  ImportPodPlantOpts,
  PublishPod,
  PublishPodConfig,
  PublishPodPlantOpts,
} from "../basev3";
import { JSONSchemaType } from "ajv";
import { GithubIssueUtilMethods, PodUtils, ShowMessageTypes } from "../utils";
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
  asyncLoopOneAtATime,
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
          // can be null if user deleted their github account
          author: d.node.author?.url,
        },
        tags,
      };
    });
  };

  /**
   * method to get notes that are not already present in the vault
   */
  async getNewNotes(notes: NoteProps[], engine: DEngineClient, vault: DVault) {
    const engineNotes = await Promise.all(
      notes.map(async (note) => {
        return (await engine.findNotesMeta({ fname: note.fname, vault }))[0];
      })
    );
    const engineSet = new Set(engineNotes);
    return notes.filter((note) => !engineSet.has(note));
  }

  /**
   * method to update the notes whose status has changed
   */
  private async getUpdatedNotes(
    notes: NoteProps[],
    engine: DEngineClient,
    vault: DVault
  ) {
    let updatedNotes: NoteProps[] = [];

    asyncLoopOneAtATime(notes, async (note) => {
      const n = (await engine.findNotes({ fname: note.fname, vault }))[0];
      if (
        !_.isUndefined(n) &&
        (n.custom.issueID === undefined ||
          n.custom.status !== note.custom.status)
      ) {
        n.custom.status = note.custom.status;
        n.custom.issueID = note.custom.issueID;
        updatedNotes = [...updatedNotes, n];
        await engine.writeNote(n);
      }
    });
    return updatedNotes;
  }

  async plant(opts: GithubIssueImportPodPlantOpts) {
    const ctx = "GithubIssuePod";
    const { wsRoot, engine, vault, config } = opts;
    this.L.info({ ctx, msg: "enter", wsRoot });
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
      // eslint-disable-next-line no-await-in-loop
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
    const newNotes = await this.getNewNotes(notes, engine, vault);
    const updatedNotes = await this.getUpdatedNotes(notes, engine, vault);

    await engine.bulkWriteNotes({ notes: newNotes, skipMetadata: true });

    return { importedNotes: [...newNotes, ...updatedNotes] };
  }
}

export enum GITHUBMESSAGE {
  INVALID_TAG = "Github: The labels in the tag does not belong to selected repository",
  INVALID_CATEGORY = "Github: Invalid category",
  INVALID_MILESTONE = "Github: Invalid milestone",
  ISSUE_CREATED = "Github: Issue Created",
  ISSUE_UPDATED = "Github: Issue Updated",
  DISCUSSION_CREATED = "Github: Discussion Created",
  INVALID_ASSIGNEE = "Github: Invalid assignee username",
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
  /**
   * if set to false, starts a discussion without the contents of note body
   */
  includeNoteBodyInDiscussion?: boolean;
  /**
   * aliasMapping for frontmatter
   */
  aliasMapping?: AliasMapping;
};

type AliasMapping = {
  assignees: AliasMappingLvl2;
  status: AliasMappingLvl2;
};
type AliasMappingLvl2 = {
  value?: { [key: string]: string };
  alias?: string;
};

type HashMap = {
  [key: string]: string;
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
        includeNoteBodyInDiscussion: {
          type: "boolean",
          description:
            "if set to false, starts a discussion without the contents of note body",
          default: true,
        },
        aliasMapping: {
          type: "object",
          nullable: true,
          description: "mapping of issue FM fields with the task note",
        },
      },
    }) as JSONSchemaType<GithubIssuePublishPodConfig>;
  }

  /**
   * method to get data of a repository from github.
   *
   */
  getDataFromGithub = async (opts: Partial<GithubIssuePublishPodConfig>) => {
    const { owner, repository, token } = opts;
    let labelsHashMap: HashMap = {};
    let assigneesHashMap: HashMap = {};
    let discussionCategoriesHashMap: HashMap = {};
    let milestonesHashMap: HashMap = {};
    let githubDataHashMap: any;

    const query = `query repository($name: String!, $owner: String!)
    {
      repository(owner: $owner , name: $name) { 
        id
        labels(last: 100) {
          edges{
            node {
              id
              name
            }
          }
        }
        assignableUsers(first: 100){
          edges {
            node {
              id,
              login
            }
          }
        }
        discussionCategories(last:10){
          edges{
            node {
              id
              name
            }
          }
        }
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
      const repositoryId = result.repository.id;
      const allLabels = result.repository.labels.edges;
      allLabels.forEach((label: any) => {
        labelsHashMap = {
          ...labelsHashMap,
          [label.node.name]: label.node.id,
        };
      });

      const assignees = result.repository.assignableUsers.edges;
      assignees.forEach((assignee: any) => {
        assigneesHashMap = {
          ...assigneesHashMap,
          [assignee.node.login]: assignee.node.id,
        };
      });

      const allCategories = result.repository.discussionCategories.edges;
      allCategories.forEach((category: any) => {
        discussionCategoriesHashMap = {
          ...discussionCategoriesHashMap,
          [category.node.name]: category.node.id,
        };
      });

      const allMilestones = result.repository.milestones.edges;
      allMilestones.forEach((milestone: any) => {
        milestonesHashMap = {
          ...milestonesHashMap,
          [milestone.node.title]: milestone.node.id,
        };
      });

      githubDataHashMap = {
        repositoryId,
        labelsHashMap,
        assigneesHashMap,
        discussionCategoriesHashMap,
        milestonesHashMap,
      };
    } catch (error: any) {
      throw new DendronError({ message: stringifyError(error) });
    }
    return githubDataHashMap;
  };

  /**
   * method to update the milestone and assignee of issue in github
   */
  updateMilestoneAndAssignee = async (opts: {
    issueID: string;
    token: string;
    milestoneId: string;
    assigneeIds: string[];
  }) => {
    const { issueID, token, milestoneId, assigneeIds } = opts;
    const assigneesSize = assigneeIds.length;

    const mutation = `mutation updateIssue($id: ID!, ${
      milestoneId ? `$milestoneId: ID` : ""
    }, ${assigneesSize > 0 ? `$assigneeIds: [ID!]` : ""}){
      updateIssue(input: {id : $id , ${
        milestoneId ? `milestoneId: $milestoneId` : ""
      }, ${assigneesSize > 0 ? `assigneeIds: $assigneeIds` : ""}}){
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
        assigneeIds,
      });
    } catch (error: any) {
      throw new DendronError({ message: stringifyError(error) });
    }
  };

  /**
   * method to update the issue in github
   * Only users with push access can set labels, assignees and milestone for issues. Otherwise dropped silently.
   */
  updateIssue = async (opts: {
    issueID: string;
    token: string;
    status: string;
    labelIDs: string[];
    milestoneId: string;
    showMessage: ShowMessageTypes;
    assigneeIds: string[];
  }) => {
    const {
      issueID,
      token,
      status,
      labelIDs,
      milestoneId,
      showMessage,
      assigneeIds,
    } = opts;
    if (milestoneId || assigneeIds.length > 0) {
      /**
       * While regression it was observed that milestone and assignee is not updated if the issue
       * state remains same, hence creating a new method to update
       */
      this.updateMilestoneAndAssignee({
        issueID,
        token,
        milestoneId,
        assigneeIds,
      });
    }
    let resp: string = "";
    const mutation = `mutation updateIssue($id: ID!, $state: IssueState, $labelIDs: [ID!]){
          updateIssue(input: {id : $id , state: $state, labelIds: $labelIDs}){
            issue {
                  id
                  url
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
        showMessage.info(GITHUBMESSAGE.ISSUE_UPDATED);
        resp = result.updateIssue.issue.url;
      }
    } catch (error: any) {
      resp = stringifyError(error);
      throw new DendronError({ message: stringifyError(error) });
    }

    return resp;
  };

  /**
   * method to create an issue in github
   * Only users with push access can set labels, milestone and assignees for new issues. Labels, Assignees and Milestone are not dropped silently in Graphql createIssue.
   */
  createIssue = async (opts: {
    token: string;
    labelIDs: string[];
    note: NoteProps;
    engine: DEngineClient;
    milestoneId: string;
    showMessage: ShowMessageTypes;
    assigneeIds: string[];
    repositoryId: string;
  }) => {
    const {
      token,
      labelIDs,
      note,
      engine,
      milestoneId,
      showMessage,
      assigneeIds,
      repositoryId,
    } = opts;
    const { title, body } = note;
    let resp: string = "";
    const labelSize = labelIDs.length;
    const assigneesSize = assigneeIds.length;

    const mutation = `mutation createIssue($repositoryId: ID!, $title: String!, $body: String, ${
      labelSize > 0 ? `$labelIDs: [ID!]` : ""
    }, ${milestoneId ? `$milestoneId: ID` : ""}, ${
      assigneesSize > 0 ? `$assigneeIds: [ID!]` : ""
    } ){
      createIssue(input: {repositoryId : $repositoryId , title: $title, body: $body, ${
        labelSize > 0 ? `labelIds: $labelIDs` : ""
      }, ${milestoneId ? `milestoneId: $milestoneId` : ""}, ${
      assigneesSize > 0 ? `assigneeIds: $assigneeIds` : ""
    }}){
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
        assigneeIds,
      });
      const issue = result.createIssue.issue;
      if (!_.isUndefined(result.createIssue.issue.id)) {
        note.custom.issueID = issue.id;
        note.custom.url = issue.url;
        note.custom.status = issue.state;
        await engine.writeNote(note);
        showMessage.info(GITHUBMESSAGE.ISSUE_CREATED);
        resp = issue.url;
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
    note: NoteProps;
    engine: DEngineClient;
    categoryId: string;
    includeNoteBodyInDiscussion: boolean;
    showMessage: ShowMessageTypes;
    repositoryId: string;
  }) => {
    const {
      token,
      note,
      engine,
      categoryId,
      includeNoteBodyInDiscussion,
      showMessage,
      repositoryId,
    } = opts;
    const { title } = note;
    let { body } = note;
    if (!includeNoteBodyInDiscussion || !body.trim()) {
      body = `Discussion for ${title}`;
    }
    let resp: string = "";
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
        await engine.writeNote(note);
        showMessage.info(GITHUBMESSAGE.DISCUSSION_CREATED);
        resp = discussion.url;
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
    const { config, engine, utilityMethods } = opts;
    const {
      owner,
      repository,
      token,
      includeNoteBodyInDiscussion = true,
      aliasMapping,
    } = config as GithubIssuePublishPodConfig;
    const { showMessage } = utilityMethods as GithubIssueUtilMethods;

    let milestoneId;
    const note = opts.note;
    const tags = opts.note.tags;
    if (_.isUndefined(note.custom)) {
      note.custom = {};
    }
    const { issueID, milestone, category } = note.custom;
    let { assignees, status } = note.custom;

    //if assignees field not present in FM, check for its alias
    assignees =
      assignees ?? _.get(note.custom, `${aliasMapping?.assignees?.alias}`);
    const assigneesVal = aliasMapping?.assignees.value;

    // checks for aliasMapping of values if username in github and task note is different
    if (assigneesVal && assigneesVal[assignees]) {
      assignees = assigneesVal[assignees];
    }

    const statusValue = aliasMapping?.status.value;
    if (status && statusValue && statusValue[status]) {
      status = statusValue[status];
    }

    const githubDataHashMap = await this.getDataFromGithub({
      owner,
      repository,
      token,
    });

    const {
      repositoryId,
      discussionCategoriesHashMap,
      labelsHashMap,
      milestonesHashMap,
      assigneesHashMap,
    } = githubDataHashMap;

    if (!_.isUndefined(category)) {
      const categoryId = discussionCategoriesHashMap[category];
      if (_.isUndefined(categoryId)) {
        showMessage.warning(GITHUBMESSAGE.INVALID_CATEGORY);
        return "";
      }
      const resp = await this.createDiscussion({
        token,
        note,
        engine,
        categoryId,
        includeNoteBodyInDiscussion,
        showMessage,
        repositoryId,
      });
      return resp;
    }

    if (!_.isUndefined(milestone)) {
      milestoneId = milestonesHashMap[milestone];
      if (_.isUndefined(milestoneId)) {
        showMessage.warning(GITHUBMESSAGE.INVALID_MILESTONE);
        return "";
      }
    }

    const assigneeIds: string[] = [];
    if (!_.isUndefined(assignees)) {
      if (_.isString(assignees)) {
        if (assigneesHashMap[assignees])
          assigneeIds.push(assigneesHashMap[assignees]);
      } else {
        assignees?.forEach((assignee: string) => {
          const id = assigneesHashMap[assignee];
          if (id) assigneeIds.push(id);
        });
      }
    }
    if (!_.isUndefined(assignees) && assigneeIds.length === 0) {
      showMessage.warning(GITHUBMESSAGE.INVALID_ASSIGNEE);
      return "";
    }

    const labelIDs: string[] = [];
    if (!_.isUndefined(tags)) {
      if (_.isString(tags)) {
        if (labelsHashMap[tags]) labelIDs.push(labelsHashMap[tags]);
      } else {
        tags?.forEach((tag: string) => {
          if (labelsHashMap[tag]) labelIDs.push(labelsHashMap[tag]);
        });
      }
    }

    if (!_.isUndefined(tags) && labelIDs.length === 0) {
      showMessage.warning(GITHUBMESSAGE.INVALID_TAG);
      return "";
    }
    const resp =
      _.isUndefined(issueID) && _.isUndefined(status)
        ? await this.createIssue({
            token,
            labelIDs,
            note,
            engine,
            milestoneId,
            showMessage,
            assigneeIds,
            repositoryId,
          })
        : await this.updateIssue({
            issueID,
            token,
            status: status.toUpperCase(),
            labelIDs,
            milestoneId,
            showMessage,
            assigneeIds,
          });

    return resp;
  }
}
