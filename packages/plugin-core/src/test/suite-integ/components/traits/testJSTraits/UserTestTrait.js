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
    setTitle(props) {
      return props.currentNoteName;
    },
    setTemplate: () => {
      return "foo";
    },
  },
};
