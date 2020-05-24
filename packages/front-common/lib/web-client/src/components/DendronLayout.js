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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import Lookup from "./Lookup";
import { CSider } from "../nav/Sider";
import { DIVIDER_COLOR } from "../config";
import { Layout } from "antd";
import { Logger } from "@aws-amplify/core";
import React from "react";
import { TopBarComponent } from "../nav/TopBar";
import keydown from "react-keydown";
import styled from "styled-components";
var logger = new Logger("DendronLayout");
var Content = Layout.Content, Sider = Layout.Sider, Footer = Layout.Footer;
var SSider = styled(Sider)(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n  border-right: 3px solid ", ";\n"], ["\n  border-right: 3px solid ", ";\n"])), DIVIDER_COLOR);
var SContent = styled(Content)(templateObject_2 || (templateObject_2 = __makeTemplateObject(["\n  background-color: white;\n"], ["\n  background-color: white;\n"])));
// === Init Start {
var DendronLayout = /** @class */ (function (_super) {
    __extends(DendronLayout, _super);
    function DendronLayout() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.storeLookup = function (comp) {
            if (!_this.lookup) {
                _this.lookup = comp;
            }
        };
        return _this;
    }
    DendronLayout.prototype.goToSearch = function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        if (this.lookup) {
            this.lookup.focus();
            // TODO
            console.log("bond");
        }
        else {
            console.log("non-bond");
        }
    };
    DendronLayout.prototype.render = function () {
        logger.debug({ ctx: "render" });
        // needed because withRouter types is a cluster
        var TLookup = Lookup;
        return (React.createElement(Layout, null,
            React.createElement(Layout, null,
                React.createElement(TopBarComponent, null,
                    React.createElement(TLookup, { wrappedComponentRef: this.storeLookup })),
                React.createElement(Layout, null,
                    React.createElement(SSider, { theme: "light" },
                        React.createElement(CSider, null)),
                    React.createElement(SContent, null, this.props.children))),
            React.createElement(Footer, null, "Footer")));
    };
    __decorate([
        keydown(["/", "meta+k"])
    ], DendronLayout.prototype, "goToSearch", null);
    return DendronLayout;
}(React.PureComponent));
export default DendronLayout;
var templateObject_1, templateObject_2;
//# sourceMappingURL=DendronLayout.js.map