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
import { dims } from "../config";
import React from "react";
import { SchemaTree } from "../common/node";
import Tree from "react-d3-tree";
import { connect } from "react-redux";
import styled from "styled-components";
var TREE_TRANSITION_DURATION = 400;
var STreeDiv = styled.div(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n  ", "\n"], ["\n  ", "\n"])), dims("Tree", "global", { forStyledComp: true }));
var mapStateToProps = function (state) { return ({
    schemaDict: state.nodeReducer.schemaDict,
    treeOrientation: state.nodeReducer.treeOrientation,
}); };
var TreeView = /** @class */ (function (_super) {
    __extends(TreeView, _super);
    function TreeView(props) {
        var _this = _super.call(this, props) || this;
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        _this.onNodeClick = function () { };
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        _this.onMouseOver = function () { };
        var treeDims = dims("Tree", "global");
        var width = treeDims.width, height = treeDims.height;
        var genTranslateForOrientation = function (orientation, width, height) {
            if (orientation === "vertical") {
                return {
                    x: width / 2,
                    y: height / 3,
                };
            }
            else {
                return {
                    x: width / 5,
                    y: height / 2,
                };
            }
        };
        var translate = genTranslateForOrientation(props.treeOrientation, width, height);
        _this.state = {
            translate: translate,
        };
        return _this;
    }
    TreeView.prototype.render = function () {
        var _a = this.props, schemaDict = _a.schemaDict, treeOrientation = _a.treeOrientation;
        var tree = new SchemaTree("root", schemaDict.root, schemaDict);
        var data = tree.toD3Tree();
        return (React.createElement(STreeDiv, null,
            "TreeView",
            React.createElement(Tree, { data: data, orientation: treeOrientation, separation: { siblings: 0.3, nonSiblings: 1 }, translate: this.state.translate, onClick: this.onNodeClick, onMouseOver: this.onMouseOver, transitionDuration: TREE_TRANSITION_DURATION })));
    };
    return TreeView;
}(React.PureComponent));
export var CTreeView = connect(mapStateToProps, null, null, {
    forwardRef: true,
})(TreeView);
var templateObject_1;
//# sourceMappingURL=TreeView.js.map