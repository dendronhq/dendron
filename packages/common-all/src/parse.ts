import { z } from "zod";
import { ok, err } from "./utils";
import type { Result } from "neverthrow";
import { DendronError } from "./error";

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
): Result<z.infer<T>, DendronError> => {
  const parsed = schema.safeParse(raw);
  if (parsed.success) {
    return ok(parsed.data);
  } else {
    return err(
      new DendronError({
        message: [
          ...(msg ? [msg] : []),
          JSON.stringify(formatErrors(parsed.error.format()), null, 2),
          ...(schema.description ? [`Schema:${schema.description}`] : []),
        ].join("\n"),
      })
    );
  }
};
