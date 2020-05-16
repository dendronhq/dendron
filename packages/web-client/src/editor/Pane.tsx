import { DNode, DNodeDict } from "../common/types";
import { nodeActions, nodeEffects } from "../redux/reducers/nodeReducer";

import OutlineEditor from "rich-markdown-editor";
import React from "react";
import { ReduxState } from "../redux/reducers";
import { RouteComponentProps } from "react-router-dom";
import { Value } from "slate";
import { connect } from "react-redux";
import { engine } from "../proto/engine";
import { getOrThrow } from "../common/env";
import { loadingActions } from "../redux/reducers/loadingReducer";

const mapStateToProps = (state: ReduxState) => ({
  nodeState: state.nodeReducer,
  loadingState: state.loadingReducer,
});

const { setActiveNodeId } = nodeActions;
const { setLoadingState } = loadingActions;
const { fetchNode, getNode } = nodeEffects;
// const exampleText = `
// # Welcome

// This is example content. It is persisted between reloads in localStorage.
// `;
// const savedText = localStorage.getItem("saved");
// const defaultValue = savedText || exampleText;

interface PaneRouterProps {
  id: string;
}

type PaneProps = ReturnType<typeof mapStateToProps> & {
  dispatch: any;
} & RouteComponentProps<PaneRouterProps>;
type PaneState = { readOnly: boolean; dark: boolean };

export class PaneComp extends React.Component<PaneProps, PaneState> {
  public editor?: OutlineEditor;
  constructor(props: PaneProps) {
    super(props);

    // get root from query or "root"
    const queryInit = "root";
    const nodeId = this.props.match.params.id;
    console.log({ bond: 0, props: props, nodeId });
    props.dispatch(getNode(nodeId)).then((nodeInit: DNode) => {
      props.dispatch(setActiveNodeId({ id: nodeInit.id }));
      props.dispatch(setLoadingState({ key: "FETCHING_INIT", value: false }));
    });
    // props.dispatch(fetchNode(queryInit)).then((nodeInit: DNode) => {
    //   console.log({ nodeInit });
    //   props.dispatch(setActiveNodeId({ id: nodeInit.id }));
    //   props.dispatch(setLoadingState({ key: "FETCHING_INIT", value: false }));
    // });
  }

  state = {
    readOnly: false,
    dark: localStorage.getItem("dark") === "enabled",
  };
  // Set the initial value when the app is first constructed.

  //getEditorText: () => string = () => this.props.document.text;

  // On change, update the app's React state with the new editor value.
  onChange = ({ value }: { value: Value }) => {
    // this.setState({ value });
  };

  setEditorRef = (ref: OutlineEditor) => {
    this.editor = ref;
  };

  // Render the editor.
  render() {
    const { nodeState, loadingState } = this.props;
    if (loadingState.FETCHING_INIT) {
      return "Loading...";
    }
    const node = getOrThrow<DNodeDict>(engine().nodes, nodeState.activeNodeId);
    const defaultValue = node.renderBody();
    this.editor?.setState({ editorValue: defaultValue });
    console.log({ ctx: "Pane/render", defaultValue });
    return (
      <OutlineEditor
        id="example"
        readOnly={this.state.readOnly}
        defaultValue={defaultValue}
        onSave={(options: any) => {
          console.log("Save triggered", options);
          console.log({ state: this.state });
        }}
        onCancel={() => console.log("Cancel triggered")}
        onChange={this.onChange}
        onClickLink={(href: any) => console.log("Clicked link: ", href)}
        onClickHashtag={(tag: any) => console.log("Clicked hashtag: ", tag)}
        onShowToast={(message: string) => window.alert(message)}
        onSearchLink={async (term: string) => {
          console.log("Searched link: ", term);
          return [
            {
              title: term,
              url: "localhost",
            },
          ];
        }}
        uploadImage={(file: any) => {
          console.log("File upload triggered: ", file);
          return new Promise(() => {
            return;
          });
          // Delay to simulate time taken to upload
          //   return new Promise((resolve) => {
          //     setTimeout(() => resolve("http://lorempixel.com/400/200/"), 1500);
          //   });
        }}
        getLinkComponent={() => {
          console.log("get link component");
          const AComp = () => {
            return <div>StubLink</div>;
          };
          return AComp;
        }}
        dark={this.state.dark}
        autoFocus
        toc
      />
    );
  }
}

export const CPane = connect(mapStateToProps, null, null, {
  forwardRef: true,
})(PaneComp);
