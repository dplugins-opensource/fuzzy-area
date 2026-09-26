// fuzzy-area.js
// Styles ship separately: import "fuzzy-area/style.css" (or style.scss) yourself.

import { prefixes as defaultPrefixes } from "./prefixes.js";
import { suggestions as defaultSuggestions } from "./partials/suggestions.js";
import {
    clamp,
    findIndexOfCurrentWord,
    replaceCurrentWord,
} from "./partials/utilities.js";
import { hideSuggestions } from "./partials/suggestionsList.js";

// Event listeners
import { attachInputHandler } from "./partials/inputHandler.js";
import { attachKeydownHandler } from "./partials/keydownHandler.js";
import { attachClickHandler } from "./partials/clickHandler.js";

// Precedence: option > window global > built-in default.
const resolveList = (option, globalValue, fallback) => {
    if (Array.isArray(option)) {
        return option;
    }
    if (Array.isArray(globalValue) && globalValue.length) {
        return globalValue;
    }
    return fallback;
};

export function initializeFuzzyArea({
    containerId = "fuzzyarea",
    textareaId = null,
    waitForElement = false,
    maxSuggestions = 10,
    resize = false,
    prefixMention = ["@"],
    suggestions = null,
    prefixes = null,
} = {}) {
    const _containerId = containerId || "fuzzyarea";
    const _prefixMention = [].concat(prefixMention);

    const fuzzyareaHandler = (containerEle, textarea) => {
        // Read globals at init time, so they can be defined after this script.
        const _prefixes = resolveList(
            prefixes,
            window.prefixes,
            defaultPrefixes
        );
        const _suggestions = resolveList(
            suggestions,
            window.suggestions,
            defaultSuggestions
        );

        containerEle.style.position = "relative";

        const suggestionsEle = document.createElement("div");
        suggestionsEle.classList.add("fuzzyarea__suggestions");
        suggestionsEle.style.display = "none";
        textarea.insertAdjacentElement("afterend", suggestionsEle);

        const adjustHeight = () => {
            textarea.style.height = "auto";
            textarea.style.height = `${textarea.scrollHeight}px`;
        };

        // Picking a suggestion changes the value without an input event.
        const replaceWord = (...args) => {
            replaceCurrentWord(...args);
            if (resize) {
                adjustHeight();
            }
        };

        if (resize) {
            textarea.addEventListener("input", adjustHeight);
            adjustHeight();
        }

        attachInputHandler(
            textarea,
            suggestionsEle,
            _prefixes,
            _suggestions,
            maxSuggestions,
            findIndexOfCurrentWord,
            _prefixMention
        );

        attachKeydownHandler(
            textarea,
            suggestionsEle,
            _prefixes,
            replaceWord,
            clamp
        );

        attachClickHandler(textarea, suggestionsEle, _prefixes, replaceWord);

        textarea.addEventListener("blur", () => hideSuggestions(suggestionsEle));
    };

    // Returns { containerEle, textareaEle }; either may be null.
    const findElements = () => {
        const containerEle = document.getElementById(_containerId);
        if (!containerEle) {
            return { containerEle: null, textareaEle: null };
        }

        let textareaEle = null;
        if (textareaId) {
            const candidate = document.getElementById(textareaId);
            textareaEle =
                candidate && containerEle.contains(candidate)
                    ? candidate
                    : null;
        } else {
            textareaEle = containerEle.querySelector("textarea");
        }
        return { containerEle, textareaEle };
    };

    const __init = () => {
        const { containerEle, textareaEle } = findElements();
        if (containerEle && textareaEle) {
            fuzzyareaHandler(containerEle, textareaEle);
            return;
        }

        if (!waitForElement) {
            console.error(
                containerEle
                    ? `fuzzy-area: textarea '${
                          textareaId ? `#${textareaId}` : "textarea"
                      }' not found inside '#${_containerId}'.`
                    : `fuzzy-area: element '#${_containerId}' not found.`
            );
            return;
        }

        const observer = new MutationObserver(() => {
            const found = findElements();
            if (found.containerEle && found.textareaEle) {
                observer.disconnect();
                fuzzyareaHandler(found.containerEle, found.textareaEle);
            }
        });
        observer.observe(document.documentElement, {
            childList: true,
            subtree: true,
        });
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", __init);
    } else {
        __init();
    }
}
