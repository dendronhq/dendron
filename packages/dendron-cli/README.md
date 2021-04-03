[![Build Status](https://travis-ci.org/{{github-user-name}}/{{github-app-name}}.svg?branch=master)](https://travis-ci.org/{{github-user-name}}/{{github-app-name}}.svg?branch=master)
[![Coverage Status](https://coveralls.io/repos/github/{{github-user-name}}/{{github-app-name}}/badge.svg?branch=master)](https://coveralls.io/github/{{github-user-name}}/{{github-app-name}}?branch=master)
[![MIT license](http://img.shields.io/badge/license-MIT-brightgreen.svg)](http://opensource.org/licenses/MIT)

# Using this module in other modules

Here is a quick example of how this module can be used in other modules. The [TypeScript Module Resolution Logic](https://www.typescriptlang.org/docs/handbook/module-resolution.html) makes it quite easy. The file `src/index.ts` is a [barrel](https://basarat.gitbooks.io/typescript/content/docs/tips/barrel.html) that re-exports selected exports from other files. The _package.json_ file contains `main` attribute that points to the generated `lib/index.js` file and `typings` attribute that points to the generated `lib/index.d.ts` file.

> If you are planning to have code in multiple files (which is quite natural for a NodeJS module) that users can import, make sure you update `src/index.ts` file appropriately.

Now assuming you have published this amazing module to _npm_ with the name `my-amazing-lib`, and installed it in the module in which you need it -

- To use the `Greeter` class in a TypeScript file -

```ts
import { Greeter } from "my-amazing-lib";

const greeter = new Greeter("World!");
greeter.greet();
```

- To use the `Greeter` class in a JavaScript file -

```js
const Greeter = require("my-amazing-lib").Greeter;

const greeter = new Greeter("World!");
greeter.greet();
```

## Setting travis and coveralls badges

1. Sign in to [travis](https://travis-ci.org/) and activate the build for your project.
2. Sign in to [coveralls](https://coveralls.io/) and activate the build for your project.
3. Replace {{github-user-name}}/{{github-app-name}} with your repo details like: "ospatil/generator-node-typescript".

## Fonts

As `Montserrat` was already in use on the current dendron.so website, I have included it as the header font, along with a recommended pairing from Google Fonts called `Roboto` for the body font.

Technical Details:
Went with the 1st recommendation on including this font in the design system from Chakra-UI. [Using Fonts](https://chakra-ui.com/guides/using-fonts#option-2-using-font-face) using the `Fontsource` library.
[fontsource/fontsource](https://github.com/fontsource/fontsource)

The fonts will be bundled in the design system and then all that would need to be done on the host projects is to include the following imports

```
import '@fontsource/montserrat';
import '@fontsource/roboto';
```

at the lowest app level. ie. for next.js `_app.tsx`.
This is already done in this project in the `preview.tsx` file.
