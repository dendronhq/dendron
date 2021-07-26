export const window = {
  showInformationMessage: jest.fn(),
};
export const vscode = {
  // mock the vscode API which you use in your project. Jest will tell you which keys are missing.
  window
};