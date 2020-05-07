import { NodeDict } from "../common/types";
import { NodeWrapper } from "../common/node";
import OutlineEditor from "rich-markdown-editor";
// import { MarkdownPlugin } from "slate-md-editor";
import React from "react";
import { ReduxState } from "../redux/reducers";
import { Value } from "slate";
import { connect } from "react-redux";
import { getOrThrow } from "../common/env";

const mapStateToProps = (state: ReduxState) => ({
  activeNodeId: state.nodeReducer.activeNodeId,
  nodeDict: state.nodeReducer.nodeDict,
});

// const exampleText = `
// # Welcome

// This is example content. It is persisted between reloads in localStorage.
// `;
// const savedText = localStorage.getItem("saved");
// const defaultValue = savedText || exampleText;

type PaneProps = ReturnType<typeof mapStateToProps>;

export class PaneComp extends React.Component<PaneProps> {
  public editor?: OutlineEditor;
  // Set the initial value when the app is first constructed.
  state = {
    readOnly: false,
    dark: localStorage.getItem("dark") === "enabled",
  };

  //getEditorText: () => string = () => this.props.document.text;

  // On change, update the app's React state with the new editor value.
  onChange = ({ value }: { value: Value }) => {
    this.setState({ value });
  };
  setEditorRef = (ref: OutlineEditor) => {
    this.editor = ref;
  };

  // Render the editor.
  render() {
    const { activeNodeId, nodeDict } = this.props;
    const node = getOrThrow<NodeDict>(nodeDict, activeNodeId);
    const defaultValue = NodeWrapper.renderBody(node);
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
