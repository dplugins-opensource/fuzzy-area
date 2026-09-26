// inputHandler.js
import { rankSuggestions } from "./fuzzy.js";
import { renderSuggestions, hideSuggestions } from "./suggestionsList.js";

// Find the suggestions for the word being typed.
// Returns [{ value, indices }].
export function getMatches(
    currentWord,
    _prefixes,
    _suggestions,
    maxSuggestions,
    prefixMention
) {
    if (currentWord === "") {
        return [];
    }

    const mention = prefixMention.find((char) => currentWord.startsWith(char));
    if (mention !== undefined) {
        const query = currentWord.slice(mention.length);
        return query
            ? rankSuggestions(query, _prefixes, maxSuggestions)
            : listAll(_prefixes, maxSuggestions);
    }

    // `sm:bl` ranks against `bl`; a bare `sm:` lists everything.
    const parts = currentWord.split(":");
    const query = parts.length > 1 ? parts[1] : parts[0];
    return query
        ? rankSuggestions(query, _suggestions, maxSuggestions)
        : listAll(_suggestions, maxSuggestions);
}

const listAll = (list, limit) =>
    list.slice(0, Math.max(0, limit)).map((value) => ({ value, indices: [] }));

export function attachInputHandler(
    textarea,
    suggestionsEle,
    _prefixes,
    _suggestions,
    maxSuggestions,
    findIndexOfCurrentWord,
    prefixMention
) {
    textarea.addEventListener("input", () => {
        const cursorPos = textarea.selectionStart;
        const startIndex = findIndexOfCurrentWord(textarea);
        const currentWord = textarea.value.substring(startIndex + 1, cursorPos);

        const matches = getMatches(
            currentWord,
            _prefixes,
            _suggestions,
            maxSuggestions,
            prefixMention
        );

        if (matches.length === 0) {
            hideSuggestions(suggestionsEle);
            return;
        }
        renderSuggestions(suggestionsEle, matches);
    });
}
