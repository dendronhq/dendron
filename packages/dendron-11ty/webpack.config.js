module.exports = {
	// Example setup for your project:
	// The entry module that requires or imports the rest of your project.
	// Must start with `./`!
    mode: "development",
	entry: './libs/auth.js',
    devServer: {
        contentBase: './dist',
      },
	output: {
		path: __dirname + '/dist',
		filename: 'auth.js',
	},
};