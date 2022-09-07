import * as v from "@badrap/valita";
import { ok, err } from "neverthrow";
import { DendronError } from "./error";
import type { DendronResult } from "./error";

export const parse = <T extends v.Type>(
  schema: T,
  raw: unknown,
  msg?: string
): DendronResult<v.Infer<T>> => {
  const parsed = schema.try(raw);
  if (parsed.ok) {
    return ok(parsed.value);
  } else {
    return err(
      new DendronError({
        message: [
          [
            "Schema Parse Error",
            ...(schema.name ? [`: ${schema.name}`] : []),
          ].join(""),
          ...(msg ? [msg] : []),
          JSON.stringify(parsed.issues, null, 2),
        ].join("\n"),
      })
    );
  }
};
