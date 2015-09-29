***This module has not been completely tested and should be considered a beta. It's intended to modify your source files, so use with caution. Bug reports and pull request are welcome.***

### Features ###
Before publishing, `npm-text-auto` converts text files to Unix style line endings (\n). After publishing, it converts them back to the default line ending for your OS (ie. \r\n for Windows).

This acts like having `* text=auto` in your .gitattributes file, only for npm publish.

### Usage ###
`npm-text-auto` can be used as a global module, a local module, or run from the command line.
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
3. Publish

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
3. Publish

#### Command Line ####
1. Install as a global module

	```shell
	npm install npm-text-auto -g
	```

2. Run the hook manually:
	```shell
	npm-text-auto prepublish
	npm-text-auto postpublish
	```

### Details ###
* On systems where the default EOL is \n, `npm-text-auto` does not modify any files.
* The binary file detection method as the same as GIT. It checks the first 8000 bytes for the presence of a null byte.
* File modified timestamp is preserved.
* Files with mixed EOL styles are convert to the correct EOL.
* The `.npmignore` (or `.gitignore`) file are processed using the same module as npm. Excluded files will not have their EOL modified.
* `package.json` , files in `node_modules`, and files in version control directories files ( `.git` `.hg` `.svn` `CVS`) are never modified.
* `.gitattributes` is not supported. If enough people need this, I may add it.
