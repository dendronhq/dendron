import _ from "lodash";

export const shouldDisplay = (name?: string): boolean => {
  const fields_to_exclude = [
    "version",
    "dendronVersion",
    "useNunjucks",
    "noLegacyNoteRef",
    "feedback",
    "apiEndpoint",
  ];

  return !_.includes(fields_to_exclude, name);
};
