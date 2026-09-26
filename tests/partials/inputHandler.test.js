import { describe, expect, it } from "vitest";
import { getMatches } from "../../partials/inputHandler.js";
import { prefixes as defaultPrefixes } from "../../prefixes.js";

const SUGGESTIONS = ["able", "sky-blue", "black", "blue", "red"];
const values = (matches) => matches.map(({ value }) => value);
const run = (word, { prefixes = defaultPrefixes, suggestions = SUGGESTIONS, max = 10, mention = ["@"] } = {}) =>
    getMatches(word, prefixes, suggestions, max, mention);

describe("getMatches", () => {
    it("returns nothing for an empty word", () => {
        expect(run("")).toEqual([]);
    });

    it("lists all prefixes, unhighlighted, for a bare mention", () => {
        expect(run("@")).toEqual(
            defaultPrefixes.map((value) => ({ value, indices: [] }))
        );
    });

    it("ranks prefixes after a mention", () => {
        // "md:" is a prefix match, "sm:" only a subsequence match.
        expect(values(run("@m"))).toEqual(["md:", "sm:"]);
    });

    it("supports custom mention characters", () => {
        expect(values(run("#s", { mention: ["@", "#"] }))).toEqual(["sm:"]);
        expect(values(run("#s"))).toEqual([]);
    });

    it("ranks suggestions for a plain word", () => {
        expect(values(run("bl"))).toEqual(["blue", "black", "sky-blue", "able"]);
    });

    it("ranks against the part after the prefix", () => {
        expect(values(run("sm:bl"))).toEqual(["blue", "black", "sky-blue", "able"]);
        expect(run("sm:bl")[0].indices).toEqual([0, 1]);
    });

    it("lists all suggestions up to the max for a bare prefix", () => {
        expect(values(run("sm:"))).toEqual(SUGGESTIONS);
        expect(values(run("sm:", { max: 2 }))).toEqual(["able", "sky-blue"]);
        expect(run("sm:", { max: 0 })).toEqual([]);
    });

    it("caps ranked results at maxSuggestions", () => {
        expect(values(run("bl", { max: 2 }))).toEqual(["blue", "black"]);
        expect(values(run("@", { max: 1 }))).toEqual([defaultPrefixes[0]]);
    });

    it("drops non-matching suggestions", () => {
        expect(run("zzz")).toEqual([]);
        expect(run("@zzz")).toEqual([]);
    });
});
