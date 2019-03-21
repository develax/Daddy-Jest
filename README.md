# 🕵 **Daddy-Jest**

## Visual Studio Code extension for debugging Jest tests

Daddy-Jest is an extension for Visual Studio Code for debugging Jest tests. It allows you to run individual tests in the debugger. To do this the Jest configuration must be placed in `'package.json'` or in a separate config file.

## Features

This is the first version so it has only basic features that I couldn't find in other extensions.

* Daddy-Jest, unlike other extensions, allows you to specify several test suites with different configuration files - the correct configuration is determined automatically at the time the test is run.
* Starts debugging a test from the context menu command. The cursor should be within the test at this point:
\!\[Context-menu command example\]\(images/context-menu-command.png\)

At the moment it doesn't seem to be possible to show the context menu option dynamically that's why Jest debug command is always present even if you call the menu outside the context of the test.

## Requirements

The extension has been built and tested in VSCode 1.32.3, Node.js: 10.2.0, Windows_NT x64. When encounter bugs please post them in GitHub repository issues.

## Extension Settings

The Daddy-Jest extension contributes the following settings:

* `"daddy-jest.jestPath"`: It's Jest library directory path. Practically you don't need to specify it explicitly here, except when it is installed in a non-standard directory.
* `"daddy-jest.jestConfigPath"`: It's a path to Jest config file, most often it's a part of the 'package.json' file and you don't need to specify it here, but in some cases you may want to keep it separatly and therefore you'll need to fill in this parameter.
* `"daddy-jest.jestConfigPaths"`: In very rare cases you need to have multiple test suites with different configuration files and one `jestConfigPath` field wouldn't be enough for that. If so this parameter will help you to deal with multiple Jest config paths which should be specified as an array of strings. For example:
```JSON
"daddy-jest.jestConfigPaths": [
  "test/jest-e2e.json",
  "src/unit-test.json"
]
```

_Remark:_ even having multiple configs you can still keep one of the in the `"package.json"` and you don't need to add a path to it.

The first two options can filled in via Settings graphical interface whereas `jestConfigPaths` can be only defined via JSON format in the `"settings.json"` file. To open Daddy-Jest settings go to `File` -> `Preferences` -> `Settings` then in the left navigation column expand the `"Extensions"` item and there will be the `"Daddy-Jest"` item, click on it and you will see all its options available.

\!\[Context-menu command example\]\(images/daddy-jest-settings.png\)

## Known Issues

No.


---

**Enjoy!**
