var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import { Link } from "react-router-dom";
import React from "react";
import styled from "styled-components";
var NodeLink = styled(Link)(templateObject_1 || (templateObject_1 = __makeTemplateObject([""], [""])));
var NodePreview = /** @class */ (function (_super) {
    __extends(NodePreview, _super);
    function NodePreview() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    NodePreview.prototype.render = function () {
        var _a = this.props, node = _a.node, rest = __rest(_a, ["node"]);
        return (React.createElement(NodeLink, __assign({ to: {
                pathname: node.url,
            } }, rest),
            React.createElement("div", null, node.path)));
    };
    return NodePreview;
}(React.PureComponent));
export { NodePreview };
var templateObject_1;
//# sourceMappingURL=NodePreview.js.map