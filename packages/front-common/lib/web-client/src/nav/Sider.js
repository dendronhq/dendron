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
import React from "react";
// import { SchemaTree } from "../common/node";
import { Tree } from "antd";
import { connect } from "react-redux";
import styled from "styled-components";
var DirectoryTree = Tree.DirectoryTree;
var mapStateToProps = function (state) { return ({
    schemaDict: {},
}); };
var StyledSiderDiv = styled.div(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n  min-height: ", ";\n"], ["\n  min-height: ", ";\n"])), function (props) { return (props.isMobile ? "auto" : "100vh"); });
var SiderComp = /** @class */ (function (_super) {
    __extends(SiderComp, _super);
    function SiderComp() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    SiderComp.prototype.render = function () {
        var schemaDict = this.props.schemaDict;
        // const tree = new SchemaTree("root", schemaDict.root, schemaDict);
        // const treeData = [tree.toAntDTree()];
        var onSelect = function () {
            console.log("Trigger Select");
        };
        var onExpand = function () {
            console.log("Trigger Expand");
        };
        var isMobile = false;
        return (React.createElement(StyledSiderDiv, { isMobile: isMobile }));
    };
    return SiderComp;
}(React.PureComponent));
export var CSider = connect(mapStateToProps, null, null, {
    forwardRef: true,
})(SiderComp);
var templateObject_1;
//# sourceMappingURL=Sider.js.map