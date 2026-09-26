import { initializeFuzzyArea } from "fuzzy-area";
import "fuzzy-area/style.css";

// Initialize with default ID (#fuzzyarea)
initializeFuzzyArea();

// suggestions/prefixes overrides can also be passed as options, instead of
// (or in addition to) the window.suggestions/window.prefixes globals set in
// variablesAndPrefixes.js:
// initializeFuzzyArea({
//     suggestions: ["blue", "red", "green"],
//     prefixes: ["sm:", "md:"],
// });
