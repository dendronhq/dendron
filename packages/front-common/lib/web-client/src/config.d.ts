export declare const DIVIDER_COLOR = "#EBEBEB";
export declare type ViewPortSize = "small" | "large" | "global";
declare type CSSDims = {
    width?: number;
    height?: number;
    paddingRight?: number;
};
export declare type DComponentName = "TopBar" | "Logo" | "Tree";
export declare type DComponentProps = Partial<CSSDims>;
export declare function dims(comp: DComponentName, viewport: ViewPortSize, opts?: {
    forStyledComp?: boolean;
    addUnits?: boolean;
}): string | DComponentProps;
export {};
