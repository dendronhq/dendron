import { renderOnDOM } from "./bootstrap";
// const VIEW_NAME = process.env["REACT_APP_VIEW_NAME"] || "";
const VALID_NAMES = [
  "DendronNotePreview",
  "SampleComponent",
  "DendronTreeExplorerPanel",
  "DendronLookupPanel",
  "DendronCalendarPanel",
  "DendronGraphPanel",
  "DendronSchemaGraphPanel",
];

const elem = window.document.getElementById("root")!;
const VIEW_NAME = elem.getAttribute("data-name")!;

if (VALID_NAMES.includes(VIEW_NAME)) {
  console.log("NAME VALID: ", VIEW_NAME);
  const View = require(`./components/${VIEW_NAME}`).default;
  let props = {};
  console.log(View);
  if (VIEW_NAME === "DendronTreeExplorerPanel") {
    props = { padding: "inherit" };
  }
  renderOnDOM(View, props);
} else {
  console.log(
    `${VIEW_NAME} is an invalid or empty name. please use one of the following: ${VALID_NAMES.join(
      " "
    )}`
  );
}

// avoid --isolatedModules error
export {};
