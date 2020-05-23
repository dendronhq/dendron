import { DropboxStorage } from "@dendron/common-all";
import React from "react";

export default function Foo() {
  const dx = new DropboxStorage();
  dx.get({ username: "kevins8" }, "root", {
    hints: { webClient: true },
  }).then((resp) => {
    console.log({ resp });
  });
  return <div>Foo</div>;
}
