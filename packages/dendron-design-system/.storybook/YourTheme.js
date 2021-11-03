import { create } from '@storybook/theming';
import { colors } from '../src/theme/colors';

export default create({
  base: 'light',

  colorPrimary: colors.brand.lightGreen,
  colorSecondary: colors.brand.darkGreen,

  // UI
  appBg: 'white',
  appContentBg: 'white',
  appBorderColor: colors.brand.neutralBlack,
  appBorderRadius: 4,

  // Toolbar default and active colors
  barTextColor: '#fff',
  barSelectedColor: '#fff',

  barBg: colors.brand.lightGreen,

  // Form colors
  inputBg: 'white',
  inputBorder: 'white',
  inputTextColor: 'aqua',
  inputBorderRadius: 4,

  brandTitle: 'Dendron',
  brandUrl: 'https://www.dendron.so/',
  brandImage:
    'https://uploads-ssl.webflow.com/603b08fa990eb31d7e66a8dc/60472ad03bb4cf4f58d61802_Dendron%202D.png',
});
