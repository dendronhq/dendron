import dotenv from "dotenv";
import commandLineArgs from "command-line-args";

// Setup command line options
const options = commandLineArgs([
  {
    name: "env",
    alias: "e",
    defaultValue: "development",
    type: String,
  },
]);

// Set the env file
const result2 = dotenv.config({
  path: `./env/${options.env}.env`,
});

if (result2.error) {
  throw result2.error;
}
