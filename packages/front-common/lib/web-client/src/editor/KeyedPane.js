var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
import DataLoader from "./DataLoader";
import React from "react";
var KeyedPane = /** @class */ (function (_super) {
    __extends(KeyedPane, _super);
    function KeyedPane() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    KeyedPane.prototype.render = function () {
        var id = this.props.match.params.id;
        // the urlId portion of the url does not include the slugified title
        // we only want to force a re-mount of the document component when the
        // document changes, not when the title does so only this portion is used
        // for the key.
        // const urlParts = documentSlug ? documentSlug.split("-") : [];
        // const urlId = urlParts.length ? urlParts[urlParts.length - 1] : undefined;
        // const urlId = id
        return React.createElement(DataLoader, __assign({ key: [id].join("/") }, this.props));
    };
    return KeyedPane;
}(React.Component));
export default KeyedPane;
//# sourceMappingURL=KeyedPane.js.map