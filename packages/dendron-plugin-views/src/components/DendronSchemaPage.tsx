import { DendronProps } from "../types";
import { TreeSelect, Input } from "antd";
import { useCallback, useEffect, useState } from "react";
import {
  SchemaModuleDict,
  SchemaModuleProps,
  SchemaProps,
  SchemaPropsDict,
  SchemaUtils,
} from "@dendronhq/common-all";
import { DefaultOptionType } from "rc-tree-select/lib/TreeSelect";

function traverseSchemaNode(
  node: SchemaProps,
  schemas: SchemaPropsDict,
  prefix: string,
  module: string
): DefaultOptionType {
  const title = (prefix === "" ? "" : prefix + ".") + node.id;
  return {
    title,
    value: `${module}.${node.id}`,
    children: node.children.map((child) =>
      traverseSchemaNode(schemas[child], schemas, title, module)
    ),
  };
}

function treeDataFromSchema(modules: SchemaModuleDict): DefaultOptionType[] {
  return Object.entries(modules).map(([domain, module]) =>
    traverseSchemaNode(module.root, module.schemas, "", domain)
  );
}

type valueToSchemaModule = {
  [value: string]: { schema: string; module: string };
};
function mapValuesToSchemas(schemas: SchemaModuleDict): valueToSchemaModule {
  const valueMap: valueToSchemaModule = {};
  Object.entries(schemas).forEach(([domain, module]) => {
    Object.values(module.schemas).forEach((schema) => {
      valueMap[`${domain}.${schema.id}`] = {
        schema: schema.id,
        module: domain,
      };
    });
  });
  return valueMap;
}

export default function DendronSchemaPage({ engine }: DendronProps) {
  const [selectedSchemaId, setSelectedSchemaId] = useState<string | null>(null);
  const [matchState, setMatchState] = useState<string>("");
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
    if (selectedSchemaId === null && schemaKeys.length > 0) {
      setSelectedSchemaId(schemaKeys[0]);
    }
  }, [engine.schemas, selectedSchemaId]);
  const onNoteHierarchyChange = useCallback(
    (e) => {
      const { value } = e.target;
      setNoteHierarchy(value);
      if (selectedSchemaId !== null) {
        // should this be memoized somehow?
        const schemaMap = mapValuesToSchemas(engine.schemas);
        const schemaValue = schemaMap[selectedSchemaId];
        const schemaModule = engine.schemas[schemaValue.module];
        const selectedSchema = schemaModule.schemas[schemaValue.schema];
        const match = SchemaUtils.matchPath({
          notePath: value,
          schemaModDict: engine.schemas,
        });
        if (match) {
          const matchedModule = match.schemaModule;
          const matchedSchema = match.schema;
          if (match.partial) {
            setMatchState(`partially matched to ${match.schema.id}`);
          } else if (matchedSchema.id === selectedSchema.id) {
            setMatchState(`matched with ${match.schema.id}`);
          } else {
            setMatchState(`matched to another schema ${matchedSchema.id}`);
          }
        } else {
          setMatchState("no match");
        }
        // match less than schema
        // match more than schema?
      }
    },
    [selectedSchemaId, engine.schemas]
  );
  return (
    <div>
      <h1>Schemas</h1>
      <div style={{ padding: "1em" }}>
        <TreeSelect
          treeData={treeDataFromSchema(engine.schemas)}
          value={selectedSchemaId}
          onChange={setSelectedSchemaId}
          style={{ width: "100%" }}
          showSearch={true}
        />
      </div>
      <div style={{ padding: "1em" }}>
        <Input
          placeholder="type a note hierarchy"
          value={noteHierarchy}
          onChange={onNoteHierarchyChange}
        />
      </div>
      <div>{matchState}</div>
    </div>
  );
}
