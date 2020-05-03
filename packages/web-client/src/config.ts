import _ from "lodash";

// === Types Start {
export type ViewPortSize = "small" | "large" | "global";
// type CSSUnit = "px";
type CSSDims = {
  width?: number;
  height?: number;
  paddingRight?: number;
};
export type DComponentName = "TopBar" | "Logo" | "Tree";
export type DComponentProps = Partial<CSSDims>;
// } Types End

// === Component Start {
const TopBar = {
  height: 64,
};
const Logo = {
  height: 50,
};

const Tree = {
  height: 1000,
  width: 1000,
};

const ALL_COMPONENTS: { [key in DComponentName]: DComponentProps } = {
  TopBar,
  Logo,
  Tree,
};
// } Component End

export function dims(
  comp: DComponentName,
  // @ts-ignore
  viewport: ViewPortSize,
  opts?: {
    forStyledComp?: boolean;
    addUnits?: boolean;
  }
): string | DComponentProps {
  opts = _.defaults(opts, { forStyledComp: false, addUnits: true });
  //   const out: Partial<typeof ALL_COMPONENTS> = {};
  const _comp: DComponentProps = ALL_COMPONENTS[comp];
  const unit = "px";
  if (opts.forStyledComp) {
    return _.map(_comp, (v, k) => {
      return `${k}: ${v}${unit};`;
    }).join("\n");
  }
  return _comp;
}
