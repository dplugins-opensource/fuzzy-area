import "./style.scss"; // Import your SCSS file here

import { prefixes } from "./prefixes";
import { suggestions } from "./suggestions";
import {
    parseValue,
    clamp,
    findIndexOfCurrentWord,
    replaceCurrentWord,
} from "./utilities.js";

document.addEventListener("DOMContentLoaded", () => {
  
    const _prefixes = window?.prefixes?.length ? window.prefixes : prefixes;
    const _suggestions = window?.suggestions?.length ? window.suggestions : suggestions;
  
    const containerEle = document.getElementById("container");
    const textarea = document.getElementById("textarea");

    const mirroredEle = document.createElement("div");
    mirroredEle.textContent = textarea.value;
    mirroredEle.classList.add("container__mirror");
    containerEle.prepend(mirroredEle);

    const suggestionsEle = document.createElement("div");
    suggestionsEle.classList.add("container__suggestions");
    containerEle.appendChild(suggestionsEle);

    const textareaStyles = window.getComputedStyle(textarea);
    [
        "border",
        "boxSizing",
        "fontFamily",
        "fontSize",
        "fontWeight",
        "letterSpacing",
        "lineHeight",
        "padding",
        "textDecoration",
        "textIndent",
        "textTransform",
        "whiteSpace",
        "wordSpacing",
        "wordWrap",
    ].forEach((property) => {
        mirroredEle.style[property] = textareaStyles[property];
    });
    mirroredEle.style.borderColor = "transparent";

    const borderWidth = parseValue(textareaStyles.borderWidth);

    const ro = new ResizeObserver(() => {
        mirroredEle.style.width = `${textarea.clientWidth + 2 * borderWidth}px`;
        mirroredEle.style.height = `${
            textarea.clientHeight + 2 * borderWidth
        }px`;
    });
    ro.observe(textarea);

    textarea.addEventListener("scroll", () => {
        mirroredEle.scrollTop = textarea.scrollTop;
    });

    textarea.addEventListener("input", () => {
        const currentValue = textarea.value;
        const cursorPos = textarea.selectionStart;
        const startIndex = findIndexOfCurrentWord(textarea);

        const currentWord = currentValue.substring(startIndex + 1, cursorPos);
        if (currentWord === "") {
            suggestionsEle.style.display = "none";
            return;
        }

        let prefixMatched = false;
        _prefixes.forEach((prefix) => {
            if (currentWord.toLowerCase().startsWith(prefix.toLowerCase())) {
                prefixMatched = true;
            }
        });
        
        let matches = [];
        if (prefixMatched) {
            matches = _suggestions;
        } else {
            matches = _suggestions.filter(
                (suggestion) => suggestion.toLowerCase().indexOf(currentWord.toLowerCase()) > -1
            );
        }

        if (matches.length === 0) {
            suggestionsEle.style.display = "none";
            return;
        }

        const textBeforeCursor = currentValue.substring(0, cursorPos);
        const textAfterCursor = currentValue.substring(cursorPos);

        const pre = document.createTextNode(textBeforeCursor);
        const post = document.createTextNode(textAfterCursor);
        const caretEle = document.createElement("span");
        caretEle.innerHTML = "&nbsp;";

        mirroredEle.innerHTML = "";
        mirroredEle.append(pre, caretEle, post);

        const rect = caretEle.getBoundingClientRect();
        suggestionsEle.style.top = `${rect.top + rect.height}px`;
        suggestionsEle.style.left = `${rect.left}px`;

        suggestionsEle.innerHTML = "";
        matches.forEach((match) => {
            const option = document.createElement("div");
            option.classList.add("container__suggestion");

            // Identify the part of the suggestion that matches the current word
            const matchIndex = match
                .toLowerCase()
                .indexOf(currentWord.toLowerCase());
            if (matchIndex >= 0) {
                // Part before the match
                const beforeMatch = match.substring(0, matchIndex);
                option.appendChild(document.createTextNode(beforeMatch));

                // Highlighted match
                const matchedText = match.substring(
                    matchIndex,
                    matchIndex + currentWord.length
                );
                const highlightSpan = document.createElement("span");
                highlightSpan.classList.add("highlight");
                highlightSpan.textContent = matchedText;
                option.appendChild(highlightSpan);

                // Part after the match
                const afterMatch = match.substring(
                    matchIndex + currentWord.length
                );
                option.appendChild(document.createTextNode(afterMatch));
            } else {
                // If no match found, display the suggestion as is
                option.textContent = match;
            }

            option.addEventListener("click", function () {
                replaceCurrentWord(textarea, match, _prefixes);
                suggestionsEle.style.display = "none";
            });

            suggestionsEle.appendChild(option);
        });
        suggestionsEle.style.display = "block";
    });

    let currentSuggestionIndex = -1;
    textarea.addEventListener("keydown", (e) => {
        if (
            ![
                "ArrowDown",
                "ArrowUp",
                "Enter",
                "Escape",
                "Tab",
                "ArrowRight",
            ].includes(e.key)
        ) {
            return;
        }

        const suggestionsElements = suggestionsEle.querySelectorAll(
            ".container__suggestion"
        );
        const numSuggestions = suggestionsElements.length;
        if (numSuggestions === 0 || suggestionsEle.style.display === "none") {
            return;
        }
        e.preventDefault();

        switch (e.key) {
            case "ArrowDown":
                suggestionsElements[
                    clamp(0, currentSuggestionIndex, numSuggestions - 1)
                ].classList.remove("container__suggestion--focused");
                currentSuggestionIndex = clamp(
                    0,
                    currentSuggestionIndex + 1,
                    numSuggestions - 1
                );
                suggestionsElements[currentSuggestionIndex].classList.add(
                    "container__suggestion--focused"
                );
                break;
            case "ArrowUp":
                suggestionsElements[
                    clamp(0, currentSuggestionIndex, numSuggestions - 1)
                ].classList.remove("container__suggestion--focused");
                currentSuggestionIndex = clamp(
                    0,
                    currentSuggestionIndex - 1,
                    numSuggestions - 1
                );
                suggestionsElements[currentSuggestionIndex].classList.add(
                    "container__suggestion--focused"
                );
                break;
            case "Enter":
            case "Tab":
            case "ArrowRight":
                if (
                    currentSuggestionIndex >= 0 &&
                    currentSuggestionIndex < numSuggestions
                ) {
                    replaceCurrentWord(
                        textarea,
                        suggestionsElements[currentSuggestionIndex].innerText,
                        _prefixes
                    );
                    suggestionsEle.style.display = "none";
                    if (e.key !== "Enter") {
                        textarea.focus();
                    }
                }
                break;
            case "Escape":
                suggestionsEle.style.display = "none";
                break;
        }
    });
});