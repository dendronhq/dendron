import React from 'react';
import * as ReactDOM from 'react-dom';
import { Default as Logo } from '../stories/Logo.stories';

describe('Logo', () => {
  it('renders without crashing', () => {
    const div = document.createElement('div');
    ReactDOM.render(<Logo />, div);
    ReactDOM.unmountComponentAtNode(div);
  });
});
