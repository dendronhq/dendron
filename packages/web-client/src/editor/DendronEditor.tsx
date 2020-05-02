import { Editor } from "slate-react";
import { MarkdownPlugin } from "slate-md-editor";
import React from "react";
import { Value } from "slate";

const plugins = [MarkdownPlugin()];

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

export class DendronEditor extends React.Component {
  // Set the initial value when the app is first constructed.
  state = {
    value: initialValue,
  };

  // On change, update the app's React state with the new editor value.
  onChange = ({ value }: { value: Value }) => {
    this.setState({ value });
  };

  // Render the editor.
  render() {
    return (
      <Editor
        value={this.state.value}
        onChange={this.onChange}
        plugins={plugins}
      />
    );
  }
}
