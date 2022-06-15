const _ = module.require("lodash");
const luxon = module.require("luxon");

module.exports = {
  OnWillCreate: {
    setNameModifier(props) {
      return {
        name: props.clipboard,
        promptUserForModification: true,
      };
    },
  },
  OnCreate: {
    setTitle() {
      return _.add(1, 1);
    },
    setTemplate: () => {
      const date = luxon.DateTime.fromFormat("2022-01-01", "yyyy-MM-dd");
      return date.toString();
    },
  },
};
