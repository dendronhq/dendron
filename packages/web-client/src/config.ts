import { Component } from "react";
import _ from "lodash";

// === Types Start {
export type ViewPortSize = "small" | "large" | "global";
type CSSUnit = "px";
type CSSDims = {
  width?: number;
  height?: number;
  paddingRight?: number;
};
type ComponentName = "TopBar" | "Logo";
type ComponentProps = Partial<CSSDims>;
// } Types End

// === Component Start {
const TopBar = {
  height: 75,
};
const Logo = {
  height: 50,
};

const ALL_COMPONENTS: { [key in ComponentName]: ComponentProps } = {
  TopBar,
  Logo,
};
// } Component End

export function dims(
  comp: ComponentName,
  viewport: ViewPortSize,
  opts?: {
    forStyledComp?: boolean;
    addUnits?: boolean;
  }
) {
  opts = _.defaults(opts, { forStyledComp: false, addUnits: true });
  //   const out: Partial<typeof ALL_COMPONENTS> = {};
  const _comp: ComponentProps = ALL_COMPONENTS[comp];
  const unit = "px";
  if (opts.forStyledComp) {
    return _.map(_comp, (v, k) => {
      return `${k}: ${v}${unit};`;
    }).join("\n");
  }
  return _comp;
}
