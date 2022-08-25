import * as v from "@badrap/valita";
import { ok, err } from "neverthrow";
import type { Result } from "neverthrow";
import { DendronError } from "./error";

// type Result<T, E = GspenstError> = Ok<T, E> | Err<T, E>

// export const formatErrors = (
//   errors: z.ZodFormattedError<Map<string,string>,string>
// ) =>
//   Object.entries(errors)
//     .map(([name, value]) => {
//       if (value && "_errors" in value)
//         return `${name}: ${value._errors.join(", ")}\n`;
//     })
//     .filter(Boolean);

export const parse = <T extends v.Type>(
  schema: T,
  raw: unknown,
  msg?: string
): Result<v.Infer<T>, DendronError> => {
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
