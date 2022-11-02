/* eslint-disable */
import { ConfigUtils, Time, GitUtils } from "@dendronhq/common-all";
import { Row, Col, Typography } from "antd";
import _ from "lodash";
import React from "react";
import { useEngineAppSelector } from "../features/engine/hooks";
import { useDendronRouter, useNoteActive } from "../utils/hooks";

const { Text, Link } = Typography;

const ms2ShortDate = (ts: number) => {
  const dt = Time.DateTime.fromMillis(ts);
  return dt.toLocaleString(Time.DateTime.DATE_SHORT);
};

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
              {githubConfig?.editLinkText}
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
