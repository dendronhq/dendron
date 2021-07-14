import { APIUtils, AssetGetThemeRequest } from "@dendronhq/common-all";
import {
  DendronConfig,
  DMessageSource,
  NoteViewMessageType,
  ThemeTarget,
  ThemeType,
} from "@dendronhq/common-all";
import {
  createLogger,
  engineHooks,
  engineSlice,
  postVSCodeMessage,
  querystring,
} from "@dendronhq/common-frontend";
import { Col, Layout, Row } from "antd";
import _ from "lodash";
import Head from "next/head";
import * as React from "react";
import { useThemeSwitcher } from "react-css-theme-switcher";
import { getWsAndPort } from "../../lib/env";
import { DendronProps } from "../../lib/types";
import { getThemeType } from "../../styles/theme";

const logger = createLogger("notePreview");

function isHTMLAnchorElement(element: Element): element is HTMLAnchorElement {
  return element.nodeName === "A";
}

type MermaidInitialzeParams = {
  startOnLoad: boolean;
  cloneCssStyles: boolean;
  theme: string;
};

type Mermaid = {
  init: () => undefined;
  initialize: (opts: Partial<MermaidInitialzeParams>) => {};
  startOnLoad?: boolean;
};

function getMermaid(window: Window): Mermaid | undefined {
  // NOTE: a mermaid h3 header will result in window.mermaid being defined
  // @ts-ignore
  if (window.mermaid && window.mermaid.initialize) {
    // @ts-ignore
    return window.mermaid as Mermaid;
  }
}

function genThemeString(opts: {themeTarget: ThemeTarget, themeType: ThemeType, port: number, ws: string}) {
  const themeRequest = {
    ...opts
  } as AssetGetThemeRequest
  const qs = querystring.stringify(themeRequest)
  const base = `${APIUtils.getLocalEndpoint(opts.port)}/api/assets/theme?${qs}`
  return base;
}

function AntLayout(props: React.PropsWithChildren<any>) {
  return (
    <Layout>
      <br />
      <br />
      <Layout id="main-content-wrap" className="main-content-wrap">
        <Row gutter={16}>
          <Col className="gutter-row" span={2}></Col>
          <Col className="gutter-row" span={20}>
            <Layout.Content id="main-content" className="main-content" role="main">{props.children}</Layout.Content>
          </Col>
          <Col className="gutter-row" span={2}></Col>
        </Row>
      </Layout>
    </Layout>
  );
}

function mermaidReady(fn: () => any) {
  // see if DOM is already available
  if (getMermaid(window)) {
    // call on next available tick
    setTimeout(fn, 1);
  } else {
    setTimeout(() => {
      mermaidReady(fn);
    }, 1000);
  }
}

/**
 * Initialize mermaid if it is enabled
 */
const useMermaid = ({ config, themeType }: { config?: DendronConfig, themeType: ThemeType }) => {
  React.useEffect(() => {
    if (config?.mermaid) {
      mermaidReady(() => {
        const mermaid = getMermaid(window);
        mermaid!.initialize({
          startOnLoad: false,
          cloneCssStyles: false,
          theme: themeType === ThemeType.LIGHT ? "default" : "dark",
        });
      });
    }
  }, [config]);
};

function Note({ engine, ide, ws, port }: DendronProps) {
  const ctx = "Note";
  logger.info(
    JSON.stringify({
      msg: "enter",
      noteActive: ide.noteActive,
    })
  );

  // apply initial hooks
  const dispatch = engineHooks.useEngineAppDispatch();
  const { currentTheme } = useThemeSwitcher();
  const themeType = getThemeType(currentTheme);
  logger.info({ctx, currentTheme, themeType})
  useMermaid({ config: engine.config, themeType });

  const { noteActive } = ide;
  const { id: noteId = "9eae08fb-5e3f-4a7e-a989-3f206825d490", contentHash } =
    noteActive || {};
  let noteContent = engine.notesRendered[noteId || ""];

  // remember note contentHash from last "render to markdown"
  const renderedNoteContentHash = React.useRef<string>();

  // hook: update note render
  React.useEffect(() => {
    if (!noteId) {
      logger.info(JSON.stringify({ msg: "no noteId" }));
      return;
    }
    // if no "render to markdown" has happended or the note body changed
    if (!noteContent || contentHash !== renderedNoteContentHash.current) {
      renderedNoteContentHash.current = contentHash;
      dispatch(engineSlice.renderNote({ ...getWsAndPort(), id: noteId }));
    }
  }, [noteId, contentHash]);

  const onClickHandler = React.useCallback(
    (event: Event) => {
      const target = event.target as Element;
      if (isHTMLAnchorElement(target)) {
        logger.info(
          JSON.stringify({
            ctx: `onClickHandler#${target.nodeName}`,
            event,
            target,
          })
        );
        event.preventDefault();
        event.stopPropagation();
        postVSCodeMessage({
          type: NoteViewMessageType.onClick,
          data: {
            href: target.href,
            id: noteId,
          },
          source: DMessageSource.webClient,
        });
      }
    },
    [noteId]
  );

  // hook: update click listener
  React.useEffect(() => {
    window.addEventListener("click", onClickHandler);
    return () => {
      window.removeEventListener("click", onClickHandler);
    };
  }, [onClickHandler]);

  // hook: apply mermaid
  React.useEffect(() => {
    if (engine?.config?.mermaid) {
      mermaidReady(() => {
        const mermaid = getMermaid(window);
        mermaid!.init();
      });
    }
  }, [noteContent, engine.config]);

  if (!noteId) {
    return <></>;
  }
  if (!noteContent) {
    return <></>;
  }
  const prismThemeUrl = genThemeString({themeTarget: ThemeTarget.PRISM, themeType: currentTheme as ThemeType, ws, port});
  return (
    <AntLayout>
    <Head>
      <link
        key="prism"
        rel="stylesheet"
        href={prismThemeUrl}
      />
    </Head>
      <div dangerouslySetInnerHTML={{ __html: noteContent }} />
    </AntLayout>
  );
}

export default Note;
