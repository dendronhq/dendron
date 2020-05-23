import { DropboxStorage } from "@dendron/common-all";
import React from "react";

export default function Foo() {
  const dx = new DropboxStorage();
  dx.get({ username: "kevins8" }, "N7-u2BiFCYcAAAAAAEi0Ew").then((resp) => {
    console.log({ resp });
  });
  return <div>Foo</div>;
}
