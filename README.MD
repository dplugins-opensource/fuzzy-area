# Custom multiple autocomplete

Built by [DPlugins](https://dplugins.com), makers of Winden and FanCoolo.

## Updated to get extra features:

1. Autocomplete prefix
2. To trigger autocomplete apply with Enter or Tab
3. Fuzzy search

## Change triggers

Update prefixes.js

```js
export const prefixes = [" ", "sm:", "md:"];
```

## Change autocomplete aka suggestions

```js
export const suggestions = [
    "white",
    "yellow",
    "blue",
    "red",
    "green",
    "black",
    "brown",
    "azure",
    "ivory",
    "teal",
];
```

## Basic markup

```html
<div class="container" id="fuzzyarea">
    <textarea class="container__textarea"></textarea>
</div>
```

```js
// index.js

import { initializeFuzzyArea } from 'fuzzy-area';

// Initialize with default ID (#fuzzyarea)
initializeFuzzyArea();

// Initialize options
initializeFuzzyArea({ 
    containerId: 'myCustomContainerId', // Custom container id
    maxSuggestions: 20,                 // Number of maximum suggestions
    resize: true,                       // Resize height of text area as text grow
    prefixMention: ["@", "#", ":"],     // Trigger prefix suggestions
});

```


## Props
| Property         | Type     | Default      | Description                                                                                      |
|------------------|----------|--------------|--------------------------------------------------------------------------------------------------|
| containerId    | string   | 'fuzzyarea'  | ID of the container in which textarea exists, which is to be made autocomplete.       |
| textareaId     | string   | null         | ID of the textarea, which is to be made autocomplete. If not provided then uses textarea in container. |
| waitForElement | boolean  | false        | Should it wait for the element to exist in the DOM, useful for dynamically added textareas. |
| maxSuggestions | number   | Default is 10   | Change number of maximum suggestions. |
| resize | boolean   | Default false   | Resize heght of text area as you type |
| prefixMention | array   | Default is @   | add away of cherasters to use to get suggestions for prefixes |

## Preview

### Suggestions
<img width="416" alt="preview" src="https://github.com/dplugins-opensource/fuzzy-area/assets/1234350/b5c2ed0a-bf77-42da-bd34-64a467919643">

### Suggestions after prefix
<img width="487" alt="preview-prefix" src="https://github.com/dplugins-opensource/fuzzy-area/assets/1234350/667c7801-5902-4e79-b971-e229d6e7d5a5">

### Prefix autocomplete
<img width="1047" alt="preview-prefix-autocomplete" src="https://github.com/dplugins-opensource/fuzzy-area/assets/1234350/816f3b8e-8fbf-46ef-8070-6941fce7b761">

### Credits:
This is modified solution from [phuoc.ng](https://phuoc.ng/collection/mirror-a-text-area/add-autocomplete-to-your-text-area/)

**Changelog**

1.2.4
- Added DPlugins homepage and author link

1.2.3
- Package JSON fix

1.2.2
- Updated readme and example

1.2.0
- change prefix autocomplete trigger

1.1.1
- Fixed readme file

1.1.0
- Fixed removing extra space when adding prefix
- Allow suggestion after prefix without extra space in between

1.0.17
- Added height resize

1.0.16
- Added autocomplete for prefix on "@"
- Removed autocomplete on right arrrow →

1.0.15
- Fixed keeping prefix after update suggestion

1.0.14
- Fixed suggestion replacment. It was deleting word only up till where the cursor is

1.0.13
- Updated readme

1.0.12
- Add option to change number max of suggestions

1.0.11
- added option to pass custom textarea id

1.0.10 - 1.0.6
- Refactor

1.0.5
- moved suggestions and prefix to the new files

1.0.4 - 1.0.3
- Refactor

1.0.2
- Clean up

1.0.1
- update to read global variables if declared

1.0.1
- release
