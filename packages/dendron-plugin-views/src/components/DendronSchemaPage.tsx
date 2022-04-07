import { DendronProps } from "../types";
import { Select, Input, Card, Badge, Tag } from "antd";
import { useCallback, useEffect, useReducer, useState } from "react";
import {
  SchemaModuleDict,
  SchemaModuleProps,
  SchemaProps,
  SchemaPropsDict,
  SchemaUtils,
} from "@dendronhq/common-all";
import Ribbon from "antd/lib/badge/Ribbon";

const SchemaBox = ({
  schema,
  childSchemas,
  partial,
  inner,
}: {
  schema: SchemaProps;
  childSchemas: SchemaProps[];
  partial: boolean;
  inner: boolean;
}) => {
  const { namespace } = schema.data;
  const card = (
    <Card
      title={schema.title}
      color={schema.color}
      type={inner ? "inner" : undefined}
    >
      {schema.data.template && <div>template: {schema.data.template.id}</div>}
      {schema.data.pattern && <div>pattern: {schema.data.pattern}</div>}
      {schema.desc !== "" && <div>description: {schema.desc}</div>}
      {childSchemas.length > 0 && (
        <div>
          <h3>Children</h3>
          {childSchemas.map((child) => (
            <SchemaBox
              key={child.id}
              schema={child}
              childSchemas={[]}
              inner={true}
              partial={false}
            />
          ))}
        </div>
      )}
    </Card>
  );
  if (inner) {
    return card;
  }
  return (
    <Ribbon
      color={partial ? "gold" : namespace ? "gray" : "green"}
      text={
        partial
          ? "partial match"
          : namespace
          ? "namespace match"
          : "exact match"
      }
    >
      {card}
    </Ribbon>
  );
};

export default function DendronSchemaPage({ engine }: DendronProps) {
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
    const schemas = Object.keys(engine.schemas);
    if (selectedDomain === null && schemas.length > 0) {
      setSelectedDomain(schemas[0]);
    }
  }, [engine.schemas, selectedDomain]);
  // next schemas at the level - show possibilities
  // show the pattern field or id - literal pattern - namespace = * for child
  // custom title; id; pattern
  // autocomplete
  const schemaModule =
    selectedDomain !== null ? engine.schemas[selectedDomain] : null;
  const match =
    schemaModule !== null
      ? SchemaUtils.matchPathWithSchema({
          notePath: `${selectedDomain}.${inputtedHierarchy}`,
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
          <h2>{schemaModule.schemas[schemaModule.root.id].title}</h2>
          <div style={{ margin: "1em" }}>
            <Input
              placeholder={`type a schema hierarchy under ${selectedDomain}`}
              size="large"
              value={inputtedHierarchy}
              onChange={(e) => setInputtedHierarchy(e.target.value)}
              addonBefore={`${selectedDomain}.`}
            />
          </div>
          {match !== undefined ? (
            <SchemaBox
              schema={match.schema}
              childSchemas={match.schema.children.map(
                (childId) => schemaModule.schemas[childId]
              )}
              partial={match.partial}
              inner={false}
            />
          ) : (
            <div>
              no matches found for {selectedDomain}.{inputtedHierarchy}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
