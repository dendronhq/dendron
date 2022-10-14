import { z } from "zod";
import type { ZodType } from "zod";

export { z };

/**
 * util for defining zod schemas with external/custom types.
 * Origin: https://github.com/colinhacks/zod/issues/372#issuecomment-826380330
 * @returns a function to be called with a zod schema
 */
export const schemaForType =
  <T>() =>
  <S extends ZodType<T, any, any>>(arg: S) => {
    return arg;
  };
