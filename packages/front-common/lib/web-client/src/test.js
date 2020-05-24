import { DropboxStorage } from "@dendron/common-all";
import React from "react";
export default function Foo() {
    var dx = new DropboxStorage();
    dx.get({ username: "kevins8" }, "root", {
        webClient: true,
    }).then(function (resp) {
        console.log({ resp: resp });
    });
    return React.createElement("div", null, "Foo");
}
//# sourceMappingURL=test.js.map