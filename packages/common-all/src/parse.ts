import { z } from "zod";
import { DendronError } from "./error";
import { RespV3 } from "./types";

const formatErrors = (
  errors: z.ZodFormattedError<Map<string, string>, string>
) =>
  Object.entries(errors).flatMap(([name, value]) => {
    if (value && "_errors" in value) {
      return `${name}: ${value._errors.join(", ")}\n`;
    }
    return [];
  });

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
          ...(msg ? [msg] : []),
          JSON.stringify(formatErrors(parsed.error.format()), null, 2),
          ...(schema.description ? [`Schema:${schema.description}`] : []),
        ].join("\n"),
      }),
    };
  }
};
