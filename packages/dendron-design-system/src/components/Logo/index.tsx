import { ImgProps } from '@chakra-ui/image';
import { chakra } from '@chakra-ui/system';
import * as React from 'react';

export const Logo: React.FC<ImgProps> = ({ boxSize, ...rest }) => (
  <chakra.img src={'/dendron-vector.svg'} boxSize={boxSize} {...rest} />
);
