import { describe, expect, it } from "vitest";
import {
    TIER_EXACT,
    TIER_PREFIX,
    TIER_SUBSEQUENCE,
    TIER_WORD_START,
    fuzzyMatch,
    highlightSegments,
    isWordBoundary,
    rankSuggestions,
} from "../../partials/fuzzy.js";

const values = (ranked) => ranked.map(({ value }) => value);

describe("isWordBoundary", () => {
    it("treats the string start as a boundary", () => {
        expect(isWordBoundary("blue", 0)).toBe(true);
    });

    it.each([
        ["sky-blue", 4],
        ["sm:blue", 3],
        ["dark_blue", 5],
        ["dark blue", 5],
        ["a/b", 2],
        ["a.b", 2],
    ])("treats the character after a separator as a boundary (%s @ %i)", (text, index) => {
        expect(isWordBoundary(text, index)).toBe(true);
    });

    it("treats a camelCase hump as a boundary", () => {
        expect(isWordBoundary("darkBlue", 4)).toBe(true);
    });

    it("does not treat a mid-word character as a boundary", () => {
        expect(isWordBoundary("blue", 2)).toBe(false);
        expect(isWordBoundary("ABC", 1)).toBe(false);
        expect(isWordBoundary("Blue", 1)).toBe(false);
    });
});

describe("fuzzyMatch", () => {
    it("returns an exact match", () => {
        expect(fuzzyMatch("blue", "blue")).toEqual({
            tier: TIER_EXACT,
            runs: 1,
            start: 0,
            indices: [0, 1, 2, 3],
        });
    });

    it("returns a prefix match", () => {
        expect(fuzzyMatch("bl", "black")).toEqual({
            tier: TIER_PREFIX,
            runs: 1,
            start: 0,
            indices: [0, 1],
        });
    });

    it("is case-insensitive in both directions", () => {
        expect(fuzzyMatch("BL", "blue")).toMatchObject({ tier: TIER_PREFIX, indices: [0, 1] });
        expect(fuzzyMatch("bl", "Blue")).toMatchObject({ tier: TIER_PREFIX, indices: [0, 1] });
        expect(fuzzyMatch("BLUE", "blue")).toMatchObject({ tier: TIER_EXACT });
    });

    it("returns a word-start match after a separator", () => {
        expect(fuzzyMatch("bl", "sky-blue")).toEqual({
            tier: TIER_WORD_START,
            runs: 1,
            start: 4,
            indices: [4, 5],
        });
    });

    it("returns a word-start match on a camelCase hump", () => {
        expect(fuzzyMatch("bl", "darkBlue")).toMatchObject({
            tier: TIER_WORD_START,
            indices: [4, 5],
        });
    });

    it("returns a subsequence match with gaps", () => {
        expect(fuzzyMatch("ae", "able")).toEqual({
            tier: TIER_WORD_START,
            runs: 2,
            start: 0,
            indices: [0, 3],
        });
        expect(fuzzyMatch("be", "able")).toEqual({
            tier: TIER_SUBSEQUENCE,
            runs: 2,
            start: 1,
            indices: [1, 3],
        });
    });

    it("prefers a word-start alignment over an earlier mid-word one", () => {
        // "re" appears contiguously mid-word in "grey" and at the start of "red".
        expect(fuzzyMatch("re", "grey-red")).toEqual({
            tier: TIER_WORD_START,
            runs: 1,
            start: 5,
            indices: [5, 6],
        });
    });

    it("prefers fewer runs over an earlier start", () => {
        // "ab" with a gap at index 1..3, or contiguous at 5..6.
        expect(fuzzyMatch("ab", "xaxxbab")).toMatchObject({
            tier: TIER_SUBSEQUENCE,
            runs: 1,
            indices: [5, 6],
        });
    });

    it("returns null for non-matches", () => {
        expect(fuzzyMatch("xyz", "blue")).toBeNull();
        expect(fuzzyMatch("eb", "blue")).toBeNull();
    });

    it("returns null for an empty query or a query longer than the candidate", () => {
        expect(fuzzyMatch("", "blue")).toBeNull();
        expect(fuzzyMatch("bluest", "blue")).toBeNull();
    });
});

describe("rankSuggestions", () => {
    it("orders exact > prefix > word-start > subsequence", () => {
        const list = ["able", "sky-blue", "blues", "bl"];
        expect(values(rankSuggestions("bl", list))).toEqual([
            "bl",
            "blues",
            "sky-blue",
            "able",
        ]);
    });

    it("ranks an exact match above a longer prefix match", () => {
        expect(values(rankSuggestions("blue", ["blueberry", "blue"]))).toEqual([
            "blue",
            "blueberry",
        ]);
    });

    it("prefers fewer runs within a tier", () => {
        expect(values(rankSuggestions("ab", ["xaxb", "xxab"]))).toEqual([
            "xxab",
            "xaxb",
        ]);
    });

    it("prefers an earlier start before a shorter length", () => {
        expect(values(rankSuggestions("ab", ["xxab", "xabzzzz"]))).toEqual([
            "xabzzzz",
            "xxab",
        ]);
    });

    it("prefers shorter candidates when tier, runs and start tie", () => {
        expect(values(rankSuggestions("bl", ["black", "blue"]))).toEqual([
            "blue",
            "black",
        ]);
    });

    it("keeps source order for full ties", () => {
        expect(values(rankSuggestions("r", ["red", "rad"]))).toEqual(["red", "rad"]);
        expect(values(rankSuggestions("r", ["rad", "red"]))).toEqual(["rad", "red"]);
    });

    it("drops non-matches", () => {
        expect(values(rankSuggestions("bl", ["red", "blue", "green"]))).toEqual([
            "blue",
        ]);
        expect(rankSuggestions("zzz", ["red", "blue"])).toEqual([]);
    });

    it("respects the limit", () => {
        const list = ["black", "blue", "blush", "blond"];
        expect(rankSuggestions("bl", list, 2)).toHaveLength(2);
        expect(rankSuggestions("bl", list, 0)).toEqual([]);
    });

    it("returns nothing for an empty query", () => {
        expect(rankSuggestions("", ["blue"])).toEqual([]);
    });

    it("returns value and matched indices", () => {
        expect(rankSuggestions("bu", ["sky-blue"])).toEqual([
            { value: "sky-blue", indices: [4, 6] },
        ]);
    });

    it("defaults to an empty list", () => {
        expect(rankSuggestions("bl")).toEqual([]);
    });
});

describe("highlightSegments", () => {
    it("splits a prefix match into highlighted and plain segments", () => {
        expect(highlightSegments("blue", [0, 1])).toEqual([
            { text: "bl", highlight: true },
            { text: "ue", highlight: false },
        ]);
    });

    it("merges adjacent characters and alternates around gaps", () => {
        expect(highlightSegments("sky-blue", [4, 6])).toEqual([
            { text: "sky-", highlight: false },
            { text: "b", highlight: true },
            { text: "l", highlight: false },
            { text: "u", highlight: true },
            { text: "e", highlight: false },
        ]);
    });

    it("returns one plain segment without indices", () => {
        expect(highlightSegments("blue")).toEqual([{ text: "blue", highlight: false }]);
    });

    it("returns one highlighted segment for a full match", () => {
        expect(highlightSegments("red", [0, 1, 2])).toEqual([
            { text: "red", highlight: true },
        ]);
    });

    it("returns no segments for an empty value", () => {
        expect(highlightSegments("", [])).toEqual([]);
    });
});
