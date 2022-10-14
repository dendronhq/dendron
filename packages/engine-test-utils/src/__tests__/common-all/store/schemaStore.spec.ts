import {
  ERROR_STATUS,
  SchemaMetadataStore,
  SchemaStore,
  URI,
} from "@dendronhq/common-all";
import { vault2Path } from "@dendronhq/common-server";
import { NoteTestUtilsV4 } from "@dendronhq/common-test-utils";
import { NodeJSFileStore } from "@dendronhq/engine-server";
import _ from "lodash";
import { runEngineTestV5 } from "../../../engine";
import fs from "fs-extra";

describe("GIVEN SchemaStore", () => {
  test("WHEN writing a schema, THEN getMetadata should retrieve same schema", async () => {
    await runEngineTestV5(
      async ({ vaults, wsRoot }) => {
        const vault = vaults[0];
        const schemaStore = new SchemaStore(
          new NodeJSFileStore(),
          new SchemaMetadataStore(),
          URI.parse(wsRoot)
        );
        const newSchema = await NoteTestUtilsV4.createSchema({
          fname: "fname1",
          vault,
          wsRoot,
          noWrite: true,
        });

        let schema = await schemaStore.getMetadata(newSchema.root.id);
        expect(schema.data).toBeFalsy();
        await schemaStore.write({ key: newSchema.root.id, schema: newSchema });

        // Make sure schema is written to filesystem
        const vpath = vault2Path({ vault, wsRoot });
        expect(
          _.includes(fs.readdirSync(vpath), "fname1.schema.yml")
        ).toBeTruthy();

        // Test SchemaStore.getMetadata
        schema = await schemaStore.getMetadata(newSchema.root.id);
        expect(schema.data!.fname).toEqual(newSchema.fname);
        expect(schema.data!.root.id).toEqual(newSchema.root.id);
      },
      {
        expect,
      }
    );
  });

  test("WHEN writing and deleting a schema, THEN getMetadata should return CONTENT_NOT_FOUND", async () => {
    await runEngineTestV5(
      async ({ vaults, wsRoot }) => {
        const vault = vaults[0];
        const schemaStore = new SchemaStore(
          new NodeJSFileStore(),
          new SchemaMetadataStore(),
          URI.parse(wsRoot)
        );
        const newSchema = await NoteTestUtilsV4.createSchema({
          fname: "fname1",
          vault,
          wsRoot,
          noWrite: true,
        });

        await schemaStore.write({ key: newSchema.root.id, schema: newSchema });

        // Test SchemaStore.getMetadata
        const schema = await schemaStore.getMetadata(newSchema.root.id);
        expect(schema.data!.fname).toEqual(newSchema.fname);

        // Test SchemaStore.delete
        const deleteResp = await schemaStore.delete(newSchema.root.id);
        expect(deleteResp.data).toBeTruthy();

        const schema2 = await schemaStore.getMetadata(newSchema.root.id);
        expect(schema2.error?.status).toEqual(ERROR_STATUS.CONTENT_NOT_FOUND);
      },
      {
        expect,
      }
    );
  });

  test("WHEN writing a schema with a mismatched key, THEN error should be returned", async () => {
    await runEngineTestV5(
      async ({ vaults, wsRoot }) => {
        const vault = vaults[0];
        const schemaStore = new SchemaStore(
          new NodeJSFileStore(),
          new SchemaMetadataStore(),
          URI.parse(wsRoot)
        );
        const newSchema = await NoteTestUtilsV4.createSchema({
          fname: "fname1",
          vault,
          wsRoot,
          noWrite: true,
        });

        const writeResp = await schemaStore.write({
          key: "bar",
          schema: newSchema,
        });
        expect(writeResp.data).toBeFalsy();
        expect(writeResp.error?.status).toEqual(ERROR_STATUS.WRITE_FAILED);
      },
      {
        expect,
      }
    );
  });

  test("WHEN bulk writing metadata, THEN all metadata should be retrievable", async () => {
    await runEngineTestV5(
      async ({ vaults, wsRoot }) => {
        const vault = vaults[0];
        const schemaStore = new SchemaStore(
          new NodeJSFileStore(),
          new SchemaMetadataStore(),
          URI.parse(wsRoot)
        );
        const newSchema = await NoteTestUtilsV4.createSchema({
          fname: "fname1",
          vault,
          wsRoot,
          noWrite: true,
        });
        const anotherSchema = await NoteTestUtilsV4.createSchema({
          fname: "bazSchema",
          vault,
          wsRoot,
          noWrite: true,
        });

        const writeResp = await schemaStore.bulkWriteMetadata([
          {
            key: newSchema.root.id,
            schema: newSchema,
          },
          {
            key: anotherSchema.root.id,
            schema: anotherSchema,
          },
        ]);
        expect(writeResp.length).toEqual(2);

        // Read back metadata
        const metadata = await schemaStore.getMetadata(newSchema.root.id);
        expect(metadata.data!.fname).toEqual(newSchema.fname);

        const anotherMetadata = await schemaStore.getMetadata(
          anotherSchema.root.id
        );
        expect(anotherMetadata.data!.fname).toEqual(anotherSchema.fname);
      },
      {
        expect,
      }
    );
  });

  test("WHEN deleting a root schema, THEN error should return and be CANT_DELETE_ROOT", async () => {
    await runEngineTestV5(
      async ({ wsRoot, engine }) => {
        const schemaStore = new SchemaStore(
          new NodeJSFileStore(),
          new SchemaMetadataStore(),
          URI.parse(wsRoot)
        );

        _.values((await engine.querySchema("*")).data).forEach(
          async (schema) => {
            await schemaStore.writeMetadata({ key: schema.root.id, schema });
          }
        );

        // Test SchemaStore.getMetadata
        const resp = await schemaStore.getMetadata("root");

        // Test SchemaStore.delete
        const deleteResp = await schemaStore.delete(resp.data!.root.id);
        expect(deleteResp.data).toBeUndefined();
        expect(deleteResp.error?.status).toEqual(ERROR_STATUS.CANT_DELETE_ROOT);
      },
      {
        expect,
      }
    );
  });
});
