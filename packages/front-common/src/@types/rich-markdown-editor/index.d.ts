// // import { Editor } from "slate";
// import { Value, Schema, Node } from "slate";

declare module "rich-markdown-editor" {
  import React from "react";
  declare class OutlineEditor extends React.PureComponent<
    OutlineEditorNS.Props,
    OutlineEditorNS.State
  > {}
  export = OutlineEditor;
}

declare namespace OutlineEditorNS {
  export type Props = {
    id?: string;
    defaultValue: string;
    placeholder?: string;
    pretitle?: string;
    plugins?: Plugin[];
    autoFocus?: boolean;
    readOnly?: boolean;
    headingsOffset?: number;
    toc?: boolean;
    dark?: boolean;
    schema?: Schema;
    serializer?: Serializer;
    theme?: any;
    uploadImage?: (file: File) => Promise<string>;
    onSave?: ({ done }: { done?: boolean }) => void;
    onCancel?: () => void;
    onChange: ({ value }: { value: Value }) => void;
    //(value: string) => void;
    //(value: () => string) => void;
    onImageUploadStart?: () => void;
    onImageUploadStop?: () => void;
    onSearchLink?: (term: string) => Promise<SearchResult[]>;
    onClickLink?: (href: string) => void;
    onClickHashtag?: (tag: string) => void;
    onShowToast?: (message: string) => void;
    getLinkComponent?: (node: Node) => React.ComponentType<any>;
    className?: string;
    style?: any;
  };

  type State = {
    editorValue: Value;
  };
}

// // declare namespace "rich-markdown-editor" {
// // }
