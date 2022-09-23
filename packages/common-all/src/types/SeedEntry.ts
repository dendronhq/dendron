import { SeedSite } from "./seed";

export type SeedEntry = {
  /**
   * Specific branch to pull from
   */
  branch?: string;
  /**
   * When in this seed, what url to use
   */
  site?: SeedSite;
};
