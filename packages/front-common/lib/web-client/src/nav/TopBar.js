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
import { Col, Layout, Row } from "antd";
import { DIVIDER_COLOR, dims } from "../config";
import React, { PureComponent } from "react";
import { Link } from "react-router-dom";
import { Logger } from "@aws-amplify/core";
import logo from "./../logo.svg";
import styled from "styled-components";
var logger = new Logger("TopBar");
var Header = Layout.Header;
var StyledLogoImg = styled.img(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n  float: left;\n  margin-top: 4px;\n  ", "\n"], ["\n  float: left;\n  margin-top: 4px;\n  ", "\n"])), dims("Logo", "global", { forStyledComp: true }));
function Logo(_a) {
    var logoImg = _a.logoImg;
    return (React.createElement(Link, { to: { pathname: "/home" } },
        React.createElement(StyledLogoImg, { src: logoImg })));
}
var SHeader = styled(Header)(templateObject_2 || (templateObject_2 = __makeTemplateObject(["\n  background: white;\n  border-bottom: 3px solid ", ";\n"], ["\n  background: white;\n  border-bottom: 3px solid ", ";\n"])), DIVIDER_COLOR);
var TopBarComponent = /** @class */ (function (_super) {
    __extends(TopBarComponent, _super);
    function TopBarComponent(props) {
        return _super.call(this, props) || this;
    }
    TopBarComponent.prototype.render = function () {
        logger.debug({ ctx: "render" });
        return (React.createElement(SHeader, { theme: "light" },
            React.createElement(Row, null,
                React.createElement(Col, { span: 4 },
                    React.createElement(Logo, { logoImg: logo })),
                React.createElement(Col, { span: 18 }, this.props.children),
                React.createElement(Col, { span: 2 }, "Menu"))));
    };
    return TopBarComponent;
}(PureComponent));
export { TopBarComponent };
var templateObject_1, templateObject_2;
//# sourceMappingURL=TopBar.js.map