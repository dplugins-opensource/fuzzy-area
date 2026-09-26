import { describe, expect, it, vi } from "vitest";
import {
    clamp,
    findIndexOfCurrentWord,
    replaceCurrentWord,
} from "../../partials/utilities.js";
import { prefixes as defaultPrefixes } from "../../prefixes.js";

// Minimal textarea stand-in: the helpers only touch value, selection and focus.
const fakeTextarea = (value, cursor = value.length) => ({
    value,
    selectionStart: cursor,
    selectionEnd: cursor,
    focus: vi.fn(),
});

describe("clamp", () => {
    it("clamps below, inside and above the range", () => {
        expect(clamp(0, -1, 3)).toBe(0);
        expect(clamp(0, 2, 3)).toBe(2);
        expect(clamp(0, 5, 3)).toBe(3);
    });
});

describe("findIndexOfCurrentWord", () => {
    it("returns the index of the whitespace before the current word", () => {
        expect(findIndexOfCurrentWord(fakeTextarea("hello wo"))).toBe(5);
    });

    it("returns -1 when the word starts the value", () => {
        expect(findIndexOfCurrentWord(fakeTextarea("hello"))).toBe(-1);
        expect(findIndexOfCurrentWord(fakeTextarea("", 0))).toBe(-1);
    });

    it("treats newlines and tabs as word separators", () => {
        expect(findIndexOfCurrentWord(fakeTextarea("a\nbl"))).toBe(1);
        expect(findIndexOfCurrentWord(fakeTextarea("a\tbl"))).toBe(1);
    });

    it("uses the cursor, not the end of the value", () => {
        expect(findIndexOfCurrentWord(fakeTextarea("one two three", 6))).toBe(3);
    });
});

describe("replaceCurrentWord", () => {
    it("replaces the current word and adds a trailing space", () => {
        const textarea = fakeTextarea("hello bl");
        replaceCurrentWord(textarea, "blue", defaultPrefixes);
        expect(textarea.value).toBe("hello blue ");
        expect(textarea.selectionStart).toBe(11);
        expect(textarea.selectionEnd).toBe(11);
        expect(textarea.focus).toHaveBeenCalledTimes(1);
    });

    it("keeps a typed prefix in front of the picked value", () => {
        const textarea = fakeTextarea("hello sm:bl");
        replaceCurrentWord(textarea, "blue", defaultPrefixes);
        expect(textarea.value).toBe("hello sm:blue ");
        expect(textarea.selectionStart).toBe(14);
    });

    it("inserts a picked prefix without a trailing space", () => {
        const textarea = fakeTextarea("text @m");
        replaceCurrentWord(textarea, "md:", defaultPrefixes);
        expect(textarea.value).toBe("text md:");
        expect(textarea.selectionStart).toBe(8);
    });

    it("keeps text after the cursor", () => {
        const textarea = fakeTextarea("one bl two", 6);
        replaceCurrentWord(textarea, "blue", defaultPrefixes);
        expect(textarea.value).toBe("one blue two");
        expect(textarea.selectionStart).toBe(9);
    });

    it("replaces the whole word when the cursor is mid-word", () => {
        const textarea = fakeTextarea("hi blxx", 5);
        replaceCurrentWord(textarea, "blue", defaultPrefixes);
        expect(textarea.value).toBe("hi blue ");
        expect(textarea.selectionStart).toBe(8);
    });

    it("works after a newline", () => {
        const textarea = fakeTextarea("a\nbl");
        replaceCurrentWord(textarea, "blue", defaultPrefixes);
        expect(textarea.value).toBe("a\nblue ");
        expect(textarea.selectionStart).toBe(7);
    });

    it("defaults to no prefixes", () => {
        const textarea = fakeTextarea("sm:bl");
        replaceCurrentWord(textarea, "blue");
        expect(textarea.value).toBe("blue ");
        expect(textarea.selectionStart).toBe(5);
    });
});
