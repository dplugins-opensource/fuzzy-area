// suggestionsList.js
import { highlightSegments } from "./fuzzy.js";

export const SUGGESTION_CLASS = "fuzzyarea__suggestion";
export const FOCUSED_CLASS = "fuzzyarea__suggestion--focused";
export const HIGHLIGHT_CLASS = "fuzzyarea__highlight";

// Append `value` to `parent` with matched characters wrapped in
// <span class="fuzzyarea__highlight">. Text nodes only, never innerHTML.
export function appendHighlightedText(parent, value, indices = []) {
    highlightSegments(value, indices).forEach(({ text, highlight }) => {
        if (highlight) {
            const span = document.createElement("span");
            span.classList.add(HIGHLIGHT_CLASS);
            span.textContent = text;
            parent.appendChild(span);
        } else {
            parent.appendChild(document.createTextNode(text));
        }
    });
}

// Render [{ value, indices }] into the list and show it; hides when empty.
// Re-rendering always resets the focused suggestion.
export function renderSuggestions(suggestionsEle, matches) {
    if (!matches.length) {
        hideSuggestions(suggestionsEle);
        return;
    }

    const options = matches.map(({ value, indices }) => {
        const option = document.createElement("div");
        option.classList.add(SUGGESTION_CLASS);
        option.dataset.value = value;
        appendHighlightedText(option, value, indices);
        return option;
    });

    suggestionsEle.replaceChildren(...options);
    suggestionsEle.style.display = "block";
}

// Hide the list and drop its options (which also resets the focus).
export function hideSuggestions(suggestionsEle) {
    suggestionsEle.style.display = "none";
    suggestionsEle.replaceChildren();
}

export function isSuggestionsVisible(suggestionsEle) {
    return (
        suggestionsEle.style.display !== "none" &&
        suggestionsEle.querySelector(`.${SUGGESTION_CLASS}`) !== null
    );
}
