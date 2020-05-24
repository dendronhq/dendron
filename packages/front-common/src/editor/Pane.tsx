import { AppDispatch } from "../App";
import { DNode } from "@dendron/common-all";
import { Logger } from "@aws-amplify/core";
import OutlineEditor from "rich-markdown-editor";
import React from "react";
import { ReduxState } from "../redux/reducers";
import { Value } from "slate";
import { connect } from "react-redux";

const logger = new Logger("Pane");

const mapStateToProps = (state: ReduxState) => ({
  nodeState: state.nodeReducer,
  loadingState: state.loadingReducer,
});

// const { setActiveNodeId } = nodeActions;
// const { setLoadingState } = loadingActions;
// const exampleText = `
// # Welcome

// This is example content. It is persisted between reloads in localStorage.
// `;
// const savedText = localStorage.getItem("saved");
// const defaultValue = savedText || exampleText;

type PaneProps = ReturnType<typeof mapStateToProps> & {
  dispatch: AppDispatch;
  node: DNode;
};
type PaneState = { readOnly: boolean; dark: boolean };

export class PaneComp extends React.Component<PaneProps, PaneState> {
  public editor?: OutlineEditor;
  constructor(props: PaneProps) {
    super(props);

    logger.info({
      ctx: "constructor:enter",
      props,
    });
  }

  state = {
    readOnly: false,
    dark: localStorage.getItem("dark") === "enabled",
  };

  // On change, update the app's React state with the new editor value.
  onChange = ({ value }: { value: Value }) => {
    console.log("TODO" + value);
  };

  setEditorRef = (ref: OutlineEditor) => {
    this.editor = ref;
  };

  // Render the editor.
  render() {
    const { loadingState, node } = this.props;
    if (loadingState.FETCHING_INIT) {
      return "Loading...";
    }
    const defaultValue = node.renderBody();
    this.editor?.setState({ editorValue: defaultValue });
    console.log({ ctx: "Pane/render", defaultValue });
    return (
      <OutlineEditor
        id={node.id}
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
        autoFocus={false}
        toc
      />
    );
  }
}

export default connect(mapStateToProps, null, null, {
  forwardRef: true,
})(PaneComp);
