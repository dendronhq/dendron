import * as v from "@badrap/valita";
import { DendronError } from "./error";
import { RespV3 } from "./types";

export const parse = <T extends v.Type>(
  schema: T,
  raw: unknown,
  msg?: string
): RespV3<v.Infer<T>> => {
  const parsed = schema.try(raw);
  if (parsed.ok) {
    return { data: parsed.value };
  } else {
    return {
      error: new DendronError({
        message: [
          [
            "Schema Parse Error",
            ...(schema.name ? [`: ${schema.name}`] : []),
          ].join(""),
          ...(msg ? [msg] : []),
          JSON.stringify(parsed.issues, null, 2),
        ].join("\n"),
      }),
    };
  }
};
