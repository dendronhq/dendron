import { DendronProps } from "../types";
import { Select, AutoComplete } from "antd";
import { useEffect, useState } from "react";
import {
  SchemaModuleProps,
  SchemaProps,
  SchemaUtils,
} from "@dendronhq/common-all";

function generatePath(module: SchemaModuleProps, schema: SchemaProps): string {
  const partString = schema.data.pattern
    ? `${schema.data.pattern}`
    : schema.data.namespace
    ? `${schema.id}.*`
    : schema.id;
  if (schema.parent && schema.parent !== "root") {
    return (
      generatePath(module, module.schemas[schema.parent]) + "." + partString
    );
  }
  return partString;
}

function getCompletions(
  schemaModule: SchemaModuleProps,
  schema: SchemaProps
): { label: string; value: string }[] {
  const path = generatePath(schemaModule, schema);
  return [
    { label: path, value: path },
    ...schema.children
      .map((child) => getCompletions(schemaModule, schemaModule.schemas[child]))
      .flat(),
  ];
}

function SchemaBox({
  schema,
  schemaModule,
  currentMatch,
  partialMatch,
}: {
  schema: SchemaProps;
  schemaModule: SchemaModuleProps;
  currentMatch: string | null;
  partialMatch: boolean;
}) {
  const match = currentMatch === schema.id;
  return (
    <div
      style={{
        backgroundColor:
          match && !partialMatch
            ? "#b1ffb6"
            : match && partialMatch
            ? "#e4ffb1"
            : "#FFFFFF",
        borderRadius: "15px",
        border: "1px solid #a9a9a9",
        padding: "1em",
        margin: "1em",
      }}
    >
      <h2>
        {schema.title}{" "}
        <span style={{ color: "#a9a9a9" }}>
          {match && (partialMatch ? "(partial match)" : "(match)")}
        </span>
      </h2>
      <h3>({generatePath(schemaModule, schema)})</h3>
      <div style={{ paddingLeft: "1em" }}>
        {schema.children.map((childID) => (
          <SchemaBox
            key={childID}
            partialMatch={partialMatch}
            schema={schemaModule.schemas[childID]}
            schemaModule={schemaModule}
            currentMatch={currentMatch}
          />
        ))}
      </div>
    </div>
  );
}

export default function DendronSchemaValidator({ engine }: DendronProps) {
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [inputtedHierarchy, setInputtedHierarchy] = useState<string>("");
  useEffect(() => {
    window.postMessage({
      type: "onDidChangeActiveTextEditor",
      data: { note: { id: "" }, sync: true },
      source: "vscode",
    });
  }, []);
  useEffect(() => {
    if (selectedDomain !== null) {
      setInputtedHierarchy(selectedDomain);
    }
  }, [selectedDomain]);
  useEffect(() => {
    const schemas = Object.keys(engine.schemas);
    if (selectedDomain === null && schemas.length > 0) {
      setSelectedDomain(schemas[0]);
      setInputtedHierarchy(schemas[0]);
    }
  }, [engine.schemas, selectedDomain]);
  const schemaModule =
    selectedDomain !== null ? engine.schemas[selectedDomain] : null;
  const match =
    schemaModule !== null
      ? SchemaUtils.matchPathWithSchema({
          notePath: inputtedHierarchy,
          matched: "",
          schemaCandidates: [schemaModule.schemas[schemaModule.root.id]],
          schemaModule,
        })
      : undefined;
  const schemaValues = Object.entries(engine.schemas).map(([id, schema]) => ({
    value: id,
    label: schema.root.fname,
  }));
  return (
    <div>
      <h1>Schemas</h1>
      <div>select a schema file</div>
      <div style={{ padding: "1em" }}>
        <Select
          value={selectedDomain}
          options={schemaValues}
          onChange={setSelectedDomain}
          style={{ width: "100%" }}
          showSearch={true}
        />
      </div>
      {schemaModule !== null && (
        <div style={{ padding: "1em" }}>
          <div>enter a schema path</div>
          <div>
            <AutoComplete
              placeholder={`type a schema hierarchy starting with ${selectedDomain}`}
              size="large"
              style={{ width: "100%" }}
              value={inputtedHierarchy}
              onChange={setInputtedHierarchy}
              options={
                match !== undefined
                  ? getCompletions(schemaModule, match.schema)
                  : []
              }
            />
          </div>
          <div style={{ padding: "1em" }}>
            <SchemaBox
              schema={schemaModule.schemas[schemaModule.root.id]}
              schemaModule={schemaModule}
              currentMatch={match !== undefined ? match.schema.id : null}
              partialMatch={match !== undefined ? match.partial : false}
            />
          </div>
        </div>
      )}
    </div>
  );
}
