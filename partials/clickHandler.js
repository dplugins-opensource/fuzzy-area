// clickHandler.js
import { SUGGESTION_CLASS, hideSuggestions } from "./suggestionsList.js";

// One delegated listener for the whole list. `mousedown` + preventDefault
// keeps focus in the textarea, so its blur handler does not close the list first.
export function attachClickHandler(
    textarea,
    suggestionsEle,
    _prefixes,
    replaceCurrentWord
) {
    suggestionsEle.addEventListener("mousedown", (e) => {
        e.preventDefault();
        if (e.button !== 0) {
            return;
        }

        const option = e.target.closest(`.${SUGGESTION_CLASS}`);
        if (!option || !suggestionsEle.contains(option)) {
            return;
        }

        replaceCurrentWord(textarea, option.dataset.value, _prefixes);
        hideSuggestions(suggestionsEle);
    });
}
