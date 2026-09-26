# Custom multiple autocomplete

Built by [DPlugins](https://dplugins.com), makers of Winden and FanCoolo.

## Install

```
npm i fuzzy-area
```

## Updated to get extra features:

1. Autocomplete prefix
2. To trigger autocomplete apply with Enter or Tab
3. Fuzzy search

## Styles

As of 2.0.0, `fuzzy-area.js` no longer imports any CSS or Sass for you.
Import the stylesheet yourself:

```js
import "fuzzy-area/style.css";
// or, if you compile Sass yourself:
import "fuzzy-area/style.scss";
```

Without a bundler, link the compiled file directly:

```html
<link rel="stylesheet" href="node_modules/fuzzy-area/fuzzy-area.css">
```

> **Upgrading from 1.x:** previously, importing `fuzzy-area` pulled in the styles automatically.
> Since 2.0.0 you must import the stylesheet yourself as shown above, otherwise the suggestions list renders unstyled.
> The package is now ESM-only (`"type": "module"`) with an `exports` map, so deep imports such as `fuzzy-area/partials/...` are no longer supported.

## Change triggers

Update prefixes.js

```js
export const prefixes = [" ", "sm:", "md:"];
```

You can also pass a `prefixes` option to `initializeFuzzyArea()` instead of editing this file — see [Options](#props) below.

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

You can also pass a `suggestions` option to `initializeFuzzyArea()` instead of editing this file — see [Options](#props) below.

## Basic markup

```html
<div class="container" id="fuzzyarea">
    <textarea class="container__textarea"></textarea>
</div>
```

```js
// index.js

import { initializeFuzzyArea } from 'fuzzy-area';
import 'fuzzy-area/style.css';

// Initialize with default ID (#fuzzyarea)
initializeFuzzyArea();

// Initialize options
initializeFuzzyArea({
    containerId: 'myCustomContainerId', // Custom container id
    textareaId: 'myTextareaId',         // Custom textarea id, must be inside the container
    waitForElement: true,               // Wait for the container/textarea to appear in the DOM
    maxSuggestions: 20,                 // Number of maximum suggestions
    resize: true,                       // Resize height of text area as text grows
    prefixMention: ["@", "#", ":"],     // Trigger prefix suggestions
    // suggestions: ["blue", "red", "green"], // Suggestions list, overrides window.suggestions and the built-in default
    // prefixes: ["sm:", "md:"],              // Prefixes list, overrides window.prefixes and the built-in default
});

```

## Options

`suggestions` and `prefixes` can be provided three ways, in order of precedence:

1. The `suggestions` / `prefixes` option passed to `initializeFuzzyArea()`.
2. The `window.suggestions` / `window.prefixes` globals, if defined before initialization.
3. The built-in default lists shipped with the package.

The `window.suggestions` and `window.prefixes` globals remain fully supported, so existing setups keep working unchanged.

## Matching

Suggestions are ranked with a small built-in fuzzy matcher (no runtime dependencies).
The query is matched case-insensitively as a subsequence of characters against each candidate, then ranked in this order:

1. Exact match.
2. Prefix match — the candidate starts with the query.
3. Word-start match — the query starts at a word boundary inside the candidate, i.e. after a separator such as `-`, `:`, `_`, `/`, `.`, a space, or a camelCase hump.
4. Subsequence match — the query characters appear anywhere else, in order.

Within the same tier, matches with fewer gaps between matched characters rank higher, then matches that start earlier, then shorter candidates.
Ties keep the original order of the `suggestions` / `prefixes` list.
Candidates that do not match are dropped from the list.

Matched characters are wrapped in `<span class="fuzzyarea__highlight">` so they can be styled (bold and orange by default).

## Keyboard

- `ArrowUp` / `ArrowDown` — move the highlighted suggestion.
- `Enter` / `Tab` — insert the currently highlighted suggestion.
- `Enter` with no suggestion highlighted — inserts a new line, same as a normal textarea.
- `Tab` with no suggestion highlighted — behaves like a normal tab (moves focus).
- `Escape`, or blurring the textarea — closes the suggestions list.

## Props
| Property         | Type              | Default      | Description                                                                                      |
|------------------|-------------------|--------------|----------------------------------------------------------------------------------------------------|
| containerId    | string            | 'fuzzyarea'  | ID of the container in which the textarea exists, which is to be made autocomplete.       |
| textareaId     | string            | null         | ID of the textarea, which is to be made autocomplete. Must be inside the container. If not provided then uses the first textarea found in the container. |
| waitForElement | boolean           | false        | Should it wait for the element to exist in the DOM, useful for dynamically added textareas. Uses a `MutationObserver`, no polling. |
| maxSuggestions | number            | 10           | Change number of maximum suggestions. |
| resize | boolean                    | false        | Resize height of text area as you type |
| prefixMention | string or array    | ["@"]        | A string, or array of characters, used to trigger suggestions for prefixes |
| suggestions | array                | null         | List of suggestions. Takes precedence over `window.suggestions` and the built-in default list. |
| prefixes | array                   | null         | List of prefixes. Takes precedence over `window.prefixes` and the built-in default list. |

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

2.0.0

Breaking:
- CSS is no longer imported by the JS; import `fuzzy-area/style.css` (or `style.scss`) yourself — see [Styles](#styles)
- ESM-only package with an `exports` map; deep imports like `fuzzy-area/partials/...` are no longer available
- Enter/Tab with no highlighted suggestion now insert a new line / move focus as normal instead of being swallowed

Other changes:
- Real fuzzy ranking (exact, prefix, word-start, subsequence) with matched characters highlighted via `.fuzzyarea__highlight`
- New `suggestions` and `prefixes` options (precedence: option > `window` global > built-in default)
- Fixed `resize` growing the container instead of the textarea
- Textarea lookup is now scoped to the container, so multiple instances on one page no longer interfere with each other
- Fixed `waitForElement` logging console errors while it waits; it now uses a `MutationObserver`
- Relative imports use explicit file extensions (native ESM)
- Higher-contrast highlight and focused colours (WCAG AA); suggestions list no longer overflows its container by the border width
- Picking a suggestion no longer adds a double space when a space already follows
- Removed the hidden mirror element and caret span (never rendered, unused)
- Package now ships only runtime files (`fuzzy-area.js`, `partials/`, `prefixes.js`, `fuzzy-area.css`, `style.scss`) — no `example/`, tests, or CI config
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
- Removed autocomplete on right arrow →

1.0.15
- Fixed keeping prefix after update suggestion

1.0.14
- Fixed suggestion replacement. It was deleting word only up till where the cursor is

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
