// fuzzy.js
// Small, dependency-free fuzzy matcher and ranker.

// Match tiers, higher is better.
export const TIER_EXACT = 3;
export const TIER_PREFIX = 2;
export const TIER_WORD_START = 1;
export const TIER_SUBSEQUENCE = 0;

const isAlphanumeric = (char) => /[a-z0-9]/i.test(char);

// True when `index` starts a word in `text`: string start, after a
// separator (space, "-", ":", "_", "/", ".", ...) or a camelCase hump.
export const isWordBoundary = (text, index) => {
    if (index <= 0) {
        return true;
    }
    const prev = text[index - 1];
    const current = text[index];
    if (!isAlphanumeric(prev)) {
        return true;
    }
    return (
        prev === prev.toLowerCase() &&
        prev !== prev.toUpperCase() &&
        current === current.toUpperCase() &&
        current !== current.toLowerCase()
    );
};

// Alignment cost, lower is better: word-boundary start, fewer runs, earlier start.
const compareCost = (a, b) =>
    a.noBoundary - b.noBoundary || a.runs - b.runs || a.start - b.start;

const range = (start, length) => Array.from({ length }, (_, i) => start + i);

// Case-insensitive subsequence match of `query` in `candidate`.
// Returns null when there is no match, otherwise
// { tier, runs, start, indices } where `indices` are the matched character
// positions in `candidate` (ascending).
export const fuzzyMatch = (query, candidate) => {
    const q = String(query).toLowerCase();
    const text = String(candidate);
    const c = text.toLowerCase();
    const m = q.length;
    const n = c.length;

    if (m === 0 || m > n) {
        return null;
    }

    if (c === q) {
        return { tier: TIER_EXACT, runs: 1, start: 0, indices: range(0, m) };
    }
    if (c.startsWith(q)) {
        return { tier: TIER_PREFIX, runs: 1, start: 0, indices: range(0, m) };
    }

    // Cheap subsequence check before the alignment pass.
    for (let i = 0, j = 0; i < m; i++, j++) {
        j = c.indexOf(q[i], j);
        if (j === -1) {
            return null;
        }
    }

    // best[i][j]: best alignment of q[0..i] with q[i] matched at c[j].
    // Each entry: { noBoundary, runs, start, prev } (prev = j of q[i - 1]).
    const best = [];
    for (let i = 0; i < m; i++) {
        const row = new Array(n).fill(null);
        // Best entry of the previous row over k < j - 1 (a gap before j).
        let gapBest = null;
        let gapBestIndex = -1;

        for (let j = i; j < n; j++) {
            if (i > 0 && j >= 2) {
                const candidateEntry = best[i - 1][j - 2];
                if (
                    candidateEntry &&
                    (!gapBest || compareCost(candidateEntry, gapBest) < 0)
                ) {
                    gapBest = candidateEntry;
                    gapBestIndex = j - 2;
                }
            }

            if (c[j] !== q[i]) {
                continue;
            }

            if (i === 0) {
                row[j] = {
                    noBoundary: isWordBoundary(text, j) ? 0 : 1,
                    runs: 1,
                    start: j,
                    prev: -1,
                };
                continue;
            }

            let entry = null;
            const adjacent = j >= 1 ? best[i - 1][j - 1] : null;
            if (adjacent) {
                entry = { ...adjacent, prev: j - 1 };
            }
            if (gapBest) {
                const gapped = {
                    ...gapBest,
                    runs: gapBest.runs + 1,
                    prev: gapBestIndex,
                };
                if (!entry || compareCost(gapped, entry) < 0) {
                    entry = gapped;
                }
            }
            row[j] = entry;
        }
        best.push(row);
    }

    let endIndex = -1;
    const lastRow = best[m - 1];
    for (let j = 0; j < n; j++) {
        if (
            lastRow[j] &&
            (endIndex === -1 || compareCost(lastRow[j], lastRow[endIndex]) < 0)
        ) {
            endIndex = j;
        }
    }
    if (endIndex === -1) {
        return null;
    }

    const indices = new Array(m);
    for (let i = m - 1, j = endIndex; i >= 0; i--) {
        indices[i] = j;
        j = best[i][j].prev;
    }

    const { noBoundary, runs, start } = lastRow[endIndex];
    return {
        tier: noBoundary ? TIER_SUBSEQUENCE : TIER_WORD_START,
        runs,
        start,
        indices,
    };
};

// Rank `list` against `query`. Non-matches are dropped; ties keep source order.
// Returns at most `limit` entries of { value, indices }.
// An empty query returns no suggestions.
export const rankSuggestions = (query, list = [], limit = Infinity) => {
    if (!query || limit <= 0) {
        return [];
    }

    const matches = [];
    list.forEach((value, order) => {
        const match = fuzzyMatch(query, value);
        if (match) {
            matches.push({ value, order, length: String(value).length, match });
        }
    });

    matches.sort(
        (a, b) =>
            b.match.tier - a.match.tier ||
            a.match.runs - b.match.runs ||
            a.match.start - b.match.start ||
            a.length - b.length ||
            a.order - b.order
    );

    return matches
        .slice(0, limit)
        .map(({ value, match }) => ({ value, indices: match.indices }));
};

// Split `value` into [{ text, highlight }] segments from matched `indices`.
export const highlightSegments = (value, indices = []) => {
    const text = String(value);
    const matched = new Set(indices);
    const segments = [];

    for (let i = 0; i < text.length; i++) {
        const highlight = matched.has(i);
        const last = segments[segments.length - 1];
        if (last && last.highlight === highlight) {
            last.text += text[i];
        } else {
            segments.push({ text: text[i], highlight });
        }
    }

    return segments;
};
