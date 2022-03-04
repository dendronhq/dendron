import { DendronProps } from "../types";
import { TreeSelect, Input } from "antd";
import { useCallback, useEffect, useState } from "react";
import {
  SchemaModuleDict,
  SchemaProps,
  SchemaPropsDict,
  SchemaUtils,
} from "@dendronhq/common-all";
import { DefaultOptionType } from "rc-tree-select/lib/TreeSelect";

function traverseSchemaNode(
  node: SchemaProps,
  schemas: SchemaPropsDict,
  prefix: string
): DefaultOptionType {
  const title = (prefix === "" ? "" : prefix + ".") + node.id;
  return {
    title,
    value: node.id,
    children: node.children.map((child) =>
      traverseSchemaNode(schemas[child], schemas, title)
    ),
  };
}

function treeDataFromSchema(schemas: SchemaModuleDict): DefaultOptionType[] {
  return Object.entries(schemas).map(([key, schema]) =>
    traverseSchemaNode(schema.root, schema.schemas, "")
  );
}

// antd forms
// formik
// antd to formik
export default function DendronSchemaPage({ engine }: DendronProps) {
  const [selectedSchema, setSelectedSchema] = useState<string | null>(null);
  const [matchState, setMatchState] = useState<boolean>(false);
  const [noteHierarchy, setNoteHierarchy] = useState("");
  useEffect(() => {
    window.postMessage({
      type: "onDidChangeActiveTextEditor",
      data: { note: { id: "" }, sync: true },
      source: "vscode",
    });
  }, []);
  useEffect(() => {
    const schemaKeys = Object.keys(engine.schemas);
    if (selectedSchema === null && schemaKeys.length > 0) {
      setSelectedSchema(schemaKeys[0]);
    }
  }, [engine.schemas, selectedSchema]);
  const onNoteHierarchyChange = useCallback(
    (e) => {
      const { value } = e.target;
      setNoteHierarchy(value);
      if (selectedSchema !== null) {
        const matches = SchemaUtils.matchPath({
          notePath: value,
          schemaModDict: engine.schemas,
        });
        setMatchState(matches !== undefined);
      }
    },
    [selectedSchema, engine.schemas]
  );
  return (
    <div>
      <h1>Schemas</h1>
      <div style={{ padding: "1em" }}>
        <TreeSelect
          treeData={treeDataFromSchema(engine.schemas)}
          value={selectedSchema}
          onChange={setSelectedSchema}
          style={{ width: "100%" }}
        />
      </div>
      <div style={{ padding: "1em" }}>
        <Input
          placeholder="type a note hierarchy"
          value={noteHierarchy}
          onChange={onNoteHierarchyChange}
        />
      </div>
      <div>{matchState ? "matched!" : "no match"}</div>
    </div>
  );
}
