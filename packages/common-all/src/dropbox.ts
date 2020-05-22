import { Dropbox } from "dropbox";
require("isomorphic-fetch");

// TODO: don't hardcode
const dbx = new Dropbox({
  accessToken:
    "AxthRhvjDPAAAAAAAACiPVhX_A4isFrjeyDXsV8H1yqARcM9fCInltiA0eZukImA"
});
dbx
  .filesListFolder({ path: "" })
  .then(function(response) {
    console.log(response);
  })
  .catch(function(error) {
    console.log(error);
  });
