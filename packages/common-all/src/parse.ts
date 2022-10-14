import { z } from "./util/zodUtil";
import { ok, err } from "./utils";
import type { Result } from "neverthrow";
import { DendronError } from "./error";

/**
 * Parse `zod` schema into `Result`
 * @param schema ZodType
 * @param raw unknown
 * @param msg string
 * @returns Result<T>
 */
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
          JSON.stringify(parsed.error.issues, null, 2),
          ...(schema.description ? [`Schema:${schema.description}`] : []),
        ].join("\n"),
      })
    );
  }
};
