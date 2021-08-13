import { verifyEngineSliceState } from "@dendronhq/common-frontend";
import { Layout } from "antd";
import React from "react";
import {
  DendronConfig,
  NoteProps,
  RESERVED_KEYS,
  Time,
  VaultUtils,
} from "@dendronhq/common-all";
import { useEngineAppSelector } from "../features/engine/hooks";
import { useDendronRouter } from "../utils/hooks";
import _ from "lodash";
import path from "path";

const { Footer } = Layout;

const ms2ShortDate = (ts: number) => {
  const dt = Time.DateTime.fromMillis(ts);
  return dt.toLocaleString(Time.DateTime.DATE_SHORT);
};

const formatString = (opts: { txt: string; note: NoteProps }) => {
  const { txt, note } = opts;
  _.templateSettings.interpolate = /{{([\s\S]+?)}}/g;
  const noteHiearchy = note.fname.replace(/\./g, "/");
  return _.template(txt)({ noteHiearchy });
};

class GitUtils {
  static canShowGitLink = (opts: {
    config: DendronConfig;
    note: NoteProps;
  }) => {
    const { config, note } = opts;
    if (
      _.isBoolean((note.custom || {})[RESERVED_KEYS.GIT_NO_LINK]) &&
      note.custom[RESERVED_KEYS.GIT_NO_LINK]
    ) {
      return false;
    }
    return _.every([
      config.site.gh_edit_link,
      config.site.gh_edit_link_text,
      config.site.gh_edit_repository,
      config.site.gh_edit_branch,
      config.site.gh_edit_view_mode,
    ]);
  };

  static githubUrl = (opts: { note: NoteProps; config: DendronConfig }) => {
    const url = GitUtils.getGithubEditUrl(opts);
    return url;
  };

  static getGithubEditUrl(opts: { note: NoteProps; config: DendronConfig }) {
    const { note, config } = opts;
    const vault = note.vault;
    const vaults = config.vaults;
    const mvault = VaultUtils.matchVaultV2({ vault, vaults });
    const vaultUrl = _.get(mvault, "remote.url", false);
    const gitRepoUrl = config.site.gh_edit_repository;
    // if we have a vault, we don't need to include the vault name as an offset
    if (mvault && vaultUrl) {
      return _.join(
        [
          this.git2Github(vaultUrl),
          config.site.gh_edit_view_mode,
          config.site.gh_edit_branch,
          note.fname + ".md",
        ],
        "/"
      );
    }

    let gitNotePath = _.join(
      [path.basename(vault.fsPath), note.fname + ".md"],
      "/"
    );
    if (_.has(note?.custom, RESERVED_KEYS.GIT_NOTE_PATH)) {
      gitNotePath = formatString({
        txt: note.custom[RESERVED_KEYS.GIT_NOTE_PATH],
        note,
      });
    }
    // this assumes we have a workspace url
    return _.join(
      [
        gitRepoUrl,
        config.site.gh_edit_view_mode,
        config.site.gh_edit_branch,
        gitNotePath,
      ],
      "/"
    );
  }

  static git2Github(gitUrl: string) {
    // 'git@github.com:kevinslin/dendron-vault.git'
    // @ts-ignore
    const [_, userAndRepo] = gitUrl.split(":");
    const [user, repo] = userAndRepo.split("/");
    return `https://github.com/${user}/${path.basename(repo, ".git")}`;
  }
}
export function DendronNoteFooter() {
  const dendronRouter = useDendronRouter();
  const engine = useEngineAppSelector((state) => state.engine);
  if (!verifyEngineSliceState(engine)) {
    return null;
  }
  const { config, notes } = engine;
  const maybeActiveNote = dendronRouter.getActiveNote({ notes });
  if (!maybeActiveNote) {
    return null;
  }
  return (
    <Footer>
      <FooterText config={config} activeNote={maybeActiveNote} />
    </Footer>
  );
}

function FooterText({
  config,
  activeNote,
}: {
  config: DendronConfig;
  activeNote: NoteProps;
}) {
  const { siteLastModified, gh_edit_link_text } = config.site;
  const lastUpdated = ms2ShortDate(activeNote.updated);
  return (
    <div className="">
      {siteLastModified && (
        <span className="text-small text-grey-dk-000 mb-0 mr-2">
          Page last modified:{" "}
          <span className="d-inline-block">{lastUpdated}</span>.{" "}{" "}
        </span>
      )}
      {GitUtils.canShowGitLink({ config, note: activeNote }) && (
        <span className="text-small text-grey-dk-000 mb-0">
          <a
            href={GitUtils.githubUrl({ note: activeNote, config })}
            id="edit-this-page"
          >
            {gh_edit_link_text}
          </a>
        </span>
      )}
    </div>
  );
}

//   <footer>
// 	{% if site.back_to_top %}
// 		<p><a href="#top" id="back-to-top">{{ site.back_to_top_text }}</a></p>
// 	{% endif %}
// 	{% if site.footer_content != nil %}
// 		<p class="text-small text-grey-dk-000 mb-0">{{ site.footer_content }}</p>
// 	{% endif %}

// 	{% if site.siteLastModified  %}
// 		<div class="d-flex mt-2">
// 		<p class="text-small text-grey-dk-000 mb-0 mr-2">
// 			Page last modified: <span class="d-inline-block">{{ nodeCurrent.updated | ms2ShortDate }}</span>.
// 		</p>
// 	{% endif %}
// 			{% if canShowGit %}
// 				<p class="text-small text-grey-dk-000 mb-0">
// 					<a href="{% githubUrl nodeCurrent %}" id="edit-this-page">{{ dendronConfig.site.gh_edit_link_text }}</a>
// 				</p>
// 			{% endif %}
// 		</div>
// </footer>
