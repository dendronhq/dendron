import { z } from "zod";
import { DendronError } from "./error";
import { RespV3 } from "./types";

export const parse = <T extends z.ZodTypeAny>(
  schema: T,
  raw: unknown,
  msg?: string
): RespV3<z.infer<T>> => {
  const parsed = schema.safeParse(raw);
  if (parsed.success) {
    return { data: parsed.data };
  } else {
    return {
      error: new DendronError({
        message: [
          [
            "Schema Parse Error",
            ...(schema.description ? [`: ${schema.description}`] : []),
          ].join(""),
          ...(msg ? [msg] : []),
          JSON.stringify(parsed.error.format(), null, 2),
        ].join("\n"),
      }),
    };
  }
};
