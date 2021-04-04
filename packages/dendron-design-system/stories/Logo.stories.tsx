import React from 'react';
import { Meta, Story } from '@storybook/react';
import { Logo } from '../src/components';
import { ImgProps } from '@chakra-ui/image';

const meta: Meta = {
  title: 'Logo',
  component: Logo,
  argTypes: {
    boxSize: {
      control: { type: 'range', min: 8, max: 400, step: 8 },
    },
  },
  parameters: {
    controls: { expanded: true },
  },
};

export default meta;

const Template: Story<ImgProps> = (args) => <Logo {...args} />;

export const Default = Template.bind({});

Default.args = { boxSize: 20 };
