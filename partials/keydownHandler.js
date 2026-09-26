// keydownHandler.js
import {
    SUGGESTION_CLASS,
    FOCUSED_CLASS,
    hideSuggestions,
    isSuggestionsVisible,
} from "./suggestionsList.js";

export function attachKeydownHandler(
    textarea,
    suggestionsEle,
    _prefixes,
    replaceCurrentWord,
    clamp
) {
    textarea.addEventListener("keydown", (e) => {
        if (
            !["ArrowDown", "ArrowUp", "Enter", "Escape", "Tab"].includes(e.key)
        ) {
            return;
        }
        if (!isSuggestionsVisible(suggestionsEle)) {
            return;
        }

        const options = [
            ...suggestionsEle.querySelectorAll(`.${SUGGESTION_CLASS}`),
        ];
        // Focus lives in the DOM, so any re-render or hide resets it.
        const focusedIndex = options.findIndex((option) =>
            option.classList.contains(FOCUSED_CLASS)
        );

        switch (e.key) {
            case "ArrowDown":
            case "ArrowUp": {
                e.preventDefault();
                const nextIndex = clamp(
                    0,
                    focusedIndex + (e.key === "ArrowDown" ? 1 : -1),
                    options.length - 1
                );
                if (focusedIndex >= 0) {
                    options[focusedIndex].classList.remove(FOCUSED_CLASS);
                }
                options[nextIndex].classList.add(FOCUSED_CLASS);
                options[nextIndex].scrollIntoView?.({ block: "nearest" });
                break;
            }
            case "Enter":
            case "Tab":
                // Nothing focused: let Enter add a new line / Tab move focus.
                if (focusedIndex < 0) {
                    return;
                }
                e.preventDefault();
                replaceCurrentWord(
                    textarea,
                    options[focusedIndex].dataset.value,
                    _prefixes
                );
                hideSuggestions(suggestionsEle);
                break;
            case "Escape":
                e.preventDefault();
                hideSuggestions(suggestionsEle);
                break;
        }
    });
}
