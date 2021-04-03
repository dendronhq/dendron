import '@fontsource/montserrat';
import '@fontsource/roboto';

import { ChakraProvider } from '@chakra-ui/react';
import { StoryContext } from '@storybook/react';
import { withPerformance } from 'storybook-addon-performance';
import { theme } from '../src/theme';
// https://storybook.js.org/docs/react/writing-stories/parameters#global-parameters
export const parameters = {
  // https://storybook.js.org/docs/react/essentials/actions#automatically-matching-args
  actions: { argTypesRegex: '^on.*' },
};

const withChakra = (StoryFn: Function, context: StoryContext) => {
  return (
    <ChakraProvider theme={theme}>
      <div id="story-wrapper" style={{ minHeight: '100vh' }}>
        <StoryFn />
      </div>
    </ChakraProvider>
  );
};

export const decorators = [withChakra, withPerformance];
