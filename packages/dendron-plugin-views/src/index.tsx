const VIEW_NAME = process.env["REACT_APP_VIEW_NAME"] || "";
const VALID_NAMES = [
  "DendronNotePageView",
  "SampleView",
  "DendronTreeExplorerPanelView",
  "DendronLookupPanelView",
];

if (VALID_NAMES.includes(VIEW_NAME)) {
  console.log("NAME VALID: ", VIEW_NAME);
  const View = require(`./views/${VIEW_NAME}`);
  console.log(View);
} else {
  console.log(
    `invalid or empty name. please use one of the following: ${VALID_NAMES.join(
      " "
    )}`
  );
}

// avoid --isolatedModules error
export {};
