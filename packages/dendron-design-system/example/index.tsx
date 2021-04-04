import 'react-app-polyfill/ie11';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Logo } from '../src/components/Logo';
const App = () => {
  return (
    <div>
      <Logo />
    </div>
  );
};

ReactDOM.render(<App />, document.getElementById('root'));
