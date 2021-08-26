/* eslint-disable */
import {
  DendronConfig,
  NoteProps,
  RESERVED_KEYS,
  Time,
  VaultUtils,
} from "@dendronhq/common-all";
import { Row, Col, Typography } from "antd";
import _ from "lodash";
import path from "path";
import React from "react";
import { useEngineAppSelector } from "../features/engine/hooks";
import { useDendronRouter, useNoteActive } from "../utils/hooks";

const { Text, Link } = Typography;

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

export function FooterText() {
  const dendronRouter = useDendronRouter();
  const engine = useEngineAppSelector((state) => state.engine);
  const { noteActive } = useNoteActive(dendronRouter.getActiveNoteId());
  const { config } = engine;

  // Sanity check
  if (!noteActive || !config) {
    return null;
  }

  const { siteLastModified, gh_edit_link_text } = config.site;
  const lastUpdated = ms2ShortDate(noteActive.updated);
  return (
    <Row style={{}}>
      <Col sm={24} md={7} lg={8} xl={4}>
        {siteLastModified && (
          <Text type="secondary">
            Page last modified: {lastUpdated} {"   "}
          </Text>
        )}
      </Col>
      <Col sm={24} md={9} lg={8} xl={12}>
        {GitUtils.canShowGitLink({ config, note: noteActive }) && (
          <Link
            href={GitUtils.githubUrl({ note: noteActive, config })}
            target="_blank"
          >
            {gh_edit_link_text}
          </Link>
        )}
      </Col>
      <Col sm={24} md={8} style={{ textAlign: "right" }}>
        <Text>
          {" "}
          🌱 with 💕 using{" "}
          <Link href="https://www.dendron.so/" target="_blank">
            Dendron 🌲
          </Link>
        </Text>
      </Col>
    </Row>
  );
}
