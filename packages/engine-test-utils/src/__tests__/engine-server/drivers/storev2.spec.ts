import { FileStorage } from "@dendronhq/engine-server";

describe(`FileStorage tests:`, () => {
  describe(`createMalformedSchemaError tests`, () => {
    it(`WHEN given payload with error info THEN create message from the payload`, () => {
      const input = JSON.parse(`
 {
  "data": [],
  "error": {
    "name": "DendronError",
    "status": "unknown",
    "payload": "[{\\"name\\":\\"DendronError\\",\\"status\\":\\"unknown\\",\\"payload\\":\\"{\\\\\\"fpath\\\\\\":\\\\\\"dvd.schema.yml\\\\\\",\\\\\\"message\\\\\\":\\\\\\"Schema id is missing from top level schema. Schema at fault: '{\\\\\\\\\\\\\\"id2\\\\\\\\\\\\\\":\\\\\\\\\\\\\\"dvd\\\\\\\\\\\\\\",\\\\\\\\\\\\\\"children\\\\\\\\\\\\\\":[{\\\\\\\\\\\\\\"pattern\\\\\\\\\\\\\\":\\\\\\\\\\\\\\"hi\\\\\\\\\\\\\\"}],\\\\\\\\\\\\\\"title\\\\\\\\\\\\\\":\\\\\\\\\\\\\\"dvd\\\\\\\\\\\\\\",\\\\\\\\\\\\\\"parent\\\\\\\\\\\\\\":\\\\\\\\\\\\\\"root\\\\\\\\\\\\\\"}'\\\\\\"}\\"}]"
  }
}
      `);

      const response = FileStorage.createMalformedSchemaError(input);
      expect(response.message).toEqual(
        `Schema 'dvd.schema.yml' is malformed. Reason: Schema id is missing from top level schema. Schema at fault: '{"id2":"dvd","children":[{"pattern":"hi"}],"title":"dvd","parent":"root"}'`
      );
    });
  });
});
