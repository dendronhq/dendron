import { Stage } from "@dendronhq/common-all";

/**
 * Extrapolates the stage from the 'name' property in the package.json manifest.
 * For node environments, getStage() is sufficient, but in environments that
 * aren't node based (where process.env is unavailable), this method suffices.
 * NOTE: This method does not return 'test'
 */
export function getStageFromPkgJson(packageJSON: any): Stage {
  // TODO: make 'nightly' return as dev. Temporarily set it as 'prod' so we can
  // test telemetry flows in web ext in nightly.
  if (packageJSON.name === "dendron" || packageJSON.name === "nightly") {
    return "prod";
  }

  return "dev";
}
