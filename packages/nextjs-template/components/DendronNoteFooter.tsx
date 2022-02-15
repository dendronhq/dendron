/* eslint-disable */
import {
  ConfigUtils,
  DVault,
  IntermediateDendronConfig,
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
    config: IntermediateDendronConfig;
    note: NoteProps;
  }) => {
    const { config, note } = opts;
    if (
      _.isBoolean((note.custom || {})[RESERVED_KEYS.GIT_NO_LINK]) &&
      note.custom[RESERVED_KEYS.GIT_NO_LINK]
    ) {
      return false;
    }
    const githubConfig = ConfigUtils.getGithubConfig(config);
    return _.every([
      githubConfig.enableEditLink,
      githubConfig.editLinkText,
      githubConfig.editRepository,
      githubConfig.editBranch,
      githubConfig.editViewMode,
    ]);
  };

  static githubUrl = (opts: {
    note: NoteProps;
    config: IntermediateDendronConfig;
  }) => {
    const url = GitUtils.getGithubEditUrl(opts);
    return url;
  };

  static getGithubEditUrl(opts: {
    note: NoteProps;
    config: IntermediateDendronConfig;
  }) {
    const { note, config } = opts;
    const vault = note.vault;
    const vaults = ConfigUtils.getVaults(config);
    const mvault = VaultUtils.matchVaultV2({ vault, vaults });
    const vaultUrl = _.get(mvault, "remote.url", false);
    const githubConfig = ConfigUtils.getGithubConfig(config);
    const gitRepoUrl = githubConfig.editRepository;
    // if we have a vault, we don't need to include the vault name as an offset
    if (mvault && vaultUrl) {
      return _.join(
        [
          this.git2Github(vaultUrl),
          githubConfig.editViewMode,
          githubConfig.editBranch,
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
        githubConfig.editViewMode,
        githubConfig.editBranch,
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

  const siteLastModified = ConfigUtils.getSiteLastModified(config);
  const githubConfig = ConfigUtils.getGithubConfig(config);

  const lastUpdated = ms2ShortDate(noteActive.updated);
  return (
    <Row>
      <Row>
        <Col sm={24} md={14}>
          {siteLastModified && (
            <Text type="secondary">
              Page last modified: {lastUpdated} {"   "}
            </Text>
          )}
        </Col>
        <Col sm={24} md={12}>
          {GitUtils.canShowGitLink({ config, note: noteActive }) && (
            <Link
              href={GitUtils.githubUrl({ note: noteActive, config })}
              target="_blank"
            >
              {githubConfig.editLinkText}
            </Link>
          )}
        </Col>
      </Row>
      <Col sm={24} md={12} style={{ textAlign: "right" }}>
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
