// https://github.com/giscus/giscus-component/blob/main/react/src/lib/types.ts

// non-trivial / const related type definitions are breaking JSON schema generation
// TODO: fix schema generation
type GiscusBooleanString = "0" | "1";

type GiscusInputPosition = "top" | "bottom";

// type GiscusGenericString = string & Record<never, never>; TODO: fix schema genereation

type GiscusMapping =
  | "url"
  | "title"
  | "og:title"
  | "specific"
  | "number"
  | "pathname";

type GiscusTheme =
  | "light"
  | "light_high_contrast"
  | "light_protanopia"
  | "light_tritanopia"
  | "dark"
  | "dark_high_contrast"
  | "dark_protanopia"
  | "dark_tritanopia"
  | "dark_dimmed"
  | "transparent_dark"
  | "preferred_color_scheme";
// | `https://${string}` // TODO: fix schema generation
// | GiscusGenericString;

type GiscusAvailableLanguage =
  | "de"
  | "gsw"
  | "en"
  | "es"
  | "fr"
  | "id"
  | "it"
  | "ja"
  | "ko"
  | "nl"
  | "pl"
  | "pt"
  | "ro"
  | "ru"
  | "tr"
  | "vi"
  | "zh-CN"
  | "zh-TW";
// | GiscusGenericString; TODO: fix schema generation

type GiscusLoading = "lazy" | "eager";

// type GiscusRepo = `${string}/${string}` | string;

// Data attributes for the per-note enabled Giscus (https://giscus.app/) widgets.
export type GiscusConfig = {
  id?: string;
  host?: string;
  // repo: GiscusRepo; TODO: fix
  repo: string;
  repoId: string;
  category?: string;
  categoryId?: string;
  mapping: GiscusMapping;
  term?: string;
  theme?: GiscusTheme;
  strict?: GiscusBooleanString;
  reactionsEnabled?: GiscusBooleanString;
  emitMetadata?: GiscusBooleanString;
  inputPosition?: GiscusInputPosition;
  lang?: GiscusAvailableLanguage;
  loading?: GiscusLoading;
};
