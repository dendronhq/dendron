import { ImgProps } from '@chakra-ui/image';
import { chakra } from '@chakra-ui/system';
import * as React from 'react';

export const Logo: React.FC<ImgProps> = ({ boxSize, ...rest }) => (
  <chakra.img
    src="https://uploads-ssl.webflow.com/603b08fa990eb31d7e66a8dc/60472ad03bb4cf4f58d61802_Dendron%202D.png"
    boxSize={boxSize}
    {...rest}
  />
);
