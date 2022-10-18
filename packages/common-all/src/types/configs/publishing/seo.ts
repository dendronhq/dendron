import { z, schemaForType } from "../../../parse";

/**
 * Namespace for SEO related site configurations.
 */
export type SEOConfig = {
  title?: string;
  description?: string;
  author?: string;
  twitter?: string;
  image?: SEOImage;
};

export type SEOImage = {
  url: string;
  alt: string;
};

/**
 * Generate default {@link SEOConfig}
 * @returns SEOConfig
 */
export function genDefaultSEOConfig(): SEOConfig {
  return {
    title: "Dendron",
    description: "Personal Knowledge Space",
  };
}

/**
 * `zod` schema to be used with `parse.ts` for validation.
 */
export const seoSchema = schemaForType<SEOConfig>()(
  z.object({
    title: z.string().optional().default("Dendron"),
    description: z.string().optional().default("Personal Knowledge Space"),
    author: z.string().optional(),
    twitter: z.string().optional(),
    image: z
      .object({
        url: z.string(),
        alt: z.string(),
      })
      .optional(),
  })
);
