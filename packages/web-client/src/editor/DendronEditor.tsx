import OutlineEditor from "rich-markdown-editor";
// import { MarkdownPlugin } from "slate-md-editor";
import React from "react";
import { Value } from "slate";

const initialValue = Value.fromJSON({
  document: {
    nodes: [
      {
        object: "block",
        type: "paragraph",
        nodes: [
          {
            object: "text",
            text: "A line of text in a paragraph.",
          },
        ],
      },
    ],
  },
});

const exampleText = `
# Welcome

This is example content. It is persisted between reloads in localStorage.
`;
const savedText = localStorage.getItem("saved");
const defaultValue = savedText || exampleText;

export class DendronEditor extends React.Component {
  // Set the initial value when the app is first constructed.
  state = {
    value: initialValue,
    readOnly: false,
    dark: localStorage.getItem("dark") === "enabled",
  };

  // On change, update the app's React state with the new editor value.
  onChange = ({ value }: { value: Value }) => {
    this.setState({ value });
  };

  // Render the editor.
  render() {
    return (
      <OutlineEditor
        id="example"
        readOnly={this.state.readOnly}
        defaultValue={defaultValue}
        onSave={(options: any) => console.log("Save triggered", options)}
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
