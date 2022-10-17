// @ts-check
const { z } = require("@dendronhq/common-all");
const path = require("path");
const { FRONTEND_CONSTANTS } = require("@dendronhq/common-frontend");

/**
 * Here we specify server-side environment variables
 * This way you can ensure the app isn't built with invalid env vars.
 */
const serverSchema = z
  .object({
    DATA_DIR: z
      .string()
      .default(path.join(__dirname, "..", FRONTEND_CONSTANTS.DEFAULT_DATA_DIR)),
    PUBLIC_DIR: z.string().default(path.join(__dirname, "..", "public")),
    NODE_ENV: z.enum(["development", "test", "production"]),
  })
  .superRefine((value, ctx) => {
    /**
     * Validate that server-side environment variables are not exposed to the client.
     */
    Object.keys(value).forEach((key) => {
      if (key.startsWith("NEXT_PUBLIC_")) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `❌ You are exposing a server-side env-variable: ${key}`,
        });
      }
    });
  });

/**
 * Here we specify client-side environment variables.
 * This way you can ensure the app isn't built with invalid env vars.
 * To expose them to the client, prefix them with `NEXT_PUBLIC_`.
 */
const clientSchema = z
  .object({
    NEXT_PUBLIC_ASSET_PREFIX: z.string().optional(),
  })
  .superRefine((value, ctx) => {
    /**
     * Validate that client-side environment variables are exposed to the client.
     */
    Object.keys(value).forEach((key) => {
      if (!key.startsWith("NEXT_PUBLIC_")) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `❌ Invalid public environment variable name: ${key}. It must begin with 'NEXT_PUBLIC_'`,
        });
      }
    });
  });

/**
 * You can't destruct `process.env` as a regular object, so you have to do
 * it manually here. This is because Next.js evaluates this at build time,
 * and only used environment variables are included in the build.
 */
const clientEnv = {
  NEXT_PUBLIC_ASSET_PREFIX: process.env.NEXT_PUBLIC_ASSET_PREFIX,
};

module.exports = {
  serverSchema,
  clientSchema,
  clientEnv,
};
