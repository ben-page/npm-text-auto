### Description ###
`npm-text-auto` automatically convert to unix style line ending to when publishing your module.

*This module is mostly untested and should be considered in beta. It's designed to modify your files, so use with extreme caution.*

### Overview ###
Before publishing, `npm-text-auto` converts text file line ending to '\n'. After publishing, it converts them back to the default line ending for your OS (ie. '\r\n' for Windows).

`npm-text-auto` uses the same binary file detection method as GIT.

`npm-text-auto` does not modify files excluded by your .npmignore (or .gitignore) file.

### Usage ###
`npm-text-auto` can be used a global module or a local module.
#### Global Module ####
1. Install as a global module

	```shell
	npm install npm-text-auto -g
	```

2. Add hook scripts to `package.json`
	```json
	"scripts": {
	  "prepublish": "npm-text-auto",
	  "postpublish": "npm-text-auto"
	}
	```
3. Publish as normal

#### Local Module ####
1. Install as a development dependency

	```shell
	npm install npm-text-auto --save-dev
	```

2. Add hook scripts to `package.json`
	```json
	"scripts": {
	  "prepublish": "node node_modules/npm-text-auto",
	  "postpublish": "node node_modules/npm-text-auto"
	}
	```
3. Publish as normal
