// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { initializeFuzzyArea } from "../fuzzy-area.js";

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

const mount = (id = "fuzzyarea", textareaAttrs = "") => {
    const container = document.createElement("div");
    container.id = id;
    container.innerHTML = `<textarea ${textareaAttrs}></textarea>`;
    document.body.appendChild(container);
    return { container, textarea: container.querySelector("textarea") };
};

const listOf = (container) => container.querySelector(".fuzzyarea__suggestions");
const optionsOf = (container) => [...container.querySelectorAll(".fuzzyarea__suggestion")];
const optionValues = (container) => optionsOf(container).map((o) => o.dataset.value);
const focusedValue = (container) =>
    container.querySelector(".fuzzyarea__suggestion--focused")?.dataset.value;
const isOpen = (container) => listOf(container).style.display === "block";

const type = (textarea, value, cursor = value.length) => {
    textarea.value = value;
    textarea.setSelectionRange(cursor, cursor);
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
};

const press = (textarea, key) => {
    const event = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true });
    textarea.dispatchEvent(event);
    return event;
};

const mousedown = (target, button = 0) => {
    const event = new MouseEvent("mousedown", { bubbles: true, cancelable: true, button });
    target.dispatchEvent(event);
    return event;
};

beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
    document.body.replaceChildren();
    delete window.suggestions;
    delete window.prefixes;
});

describe("initializeFuzzyArea", () => {
    it("inserts a hidden suggestions list after the textarea", () => {
        const { container, textarea } = mount();
        initializeFuzzyArea();
        expect(textarea.nextElementSibling).toBe(listOf(container));
        expect(isOpen(container)).toBe(false);
        expect(container.style.position).toBe("relative");
        expect(console.error).not.toHaveBeenCalled();
    });

    describe("typing", () => {
        it("renders ranked options with highlighted matches", () => {
            const { container, textarea } = mount();
            initializeFuzzyArea();
            type(textarea, "hello bl");

            expect(isOpen(container)).toBe(true);
            expect(optionValues(container)).toEqual(["blue", "black"]);
            const [first] = optionsOf(container);
            expect(first.textContent).toBe("blue");
            const highlights = first.querySelectorAll(".fuzzyarea__highlight");
            expect([...highlights].map((h) => h.textContent)).toEqual(["bl"]);
        });

        it("hides the list when nothing matches or the word is empty", () => {
            const { container, textarea } = mount();
            initializeFuzzyArea();
            type(textarea, "bl");
            expect(isOpen(container)).toBe(true);
            type(textarea, "zzz");
            expect(isOpen(container)).toBe(false);
            expect(optionsOf(container)).toHaveLength(0);
            type(textarea, "bl ");
            expect(isOpen(container)).toBe(false);
        });

        it("uses the word at the cursor, not at the end", () => {
            const { container, textarea } = mount();
            initializeFuzzyArea();
            type(textarea, "bl red", 2);
            expect(optionValues(container)).toEqual(["blue", "black"]);
        });

        it("lists prefixes for a mention and respects maxSuggestions", () => {
            const { container, textarea } = mount();
            initializeFuzzyArea({ maxSuggestions: 2 });
            type(textarea, "@");
            expect(optionValues(container)).toEqual([" ", "sm:"]);
            type(textarea, "sm:");
            expect(optionValues(container)).toEqual(["white", "yellow"]);
        });

        it("renders HTML-looking values as text", () => {
            const evil = "<img src=x onerror=alert(1)>";
            const { container, textarea } = mount();
            initializeFuzzyArea({ suggestions: [evil], prefixes: ["<b>x</b>"] });

            type(textarea, "<img");
            expect(optionsOf(container)).toHaveLength(1);
            expect(optionsOf(container)[0].textContent).toBe(evil);
            expect(optionsOf(container)[0].dataset.value).toBe(evil);
            expect(listOf(container).querySelector("img")).toBeNull();

            type(textarea, "@");
            expect(optionsOf(container)[0].textContent).toBe("<b>x</b>");
            expect(listOf(container).querySelector("b")).toBeNull();
        });
    });

    describe("keyboard", () => {
        let container;
        let textarea;

        beforeEach(() => {
            ({ container, textarea } = mount());
            initializeFuzzyArea();
            type(textarea, "bl");
        });

        it("moves focus with ArrowDown/ArrowUp and clamps at both ends", () => {
            expect(focusedValue(container)).toBeUndefined();

            expect(press(textarea, "ArrowDown").defaultPrevented).toBe(true);
            expect(focusedValue(container)).toBe("blue");
            press(textarea, "ArrowDown");
            expect(focusedValue(container)).toBe("black");
            press(textarea, "ArrowDown");
            expect(focusedValue(container)).toBe("black");

            expect(press(textarea, "ArrowUp").defaultPrevented).toBe(true);
            expect(focusedValue(container)).toBe("blue");
            press(textarea, "ArrowUp");
            expect(focusedValue(container)).toBe("blue");
            expect(container.querySelectorAll(".fuzzyarea__suggestion--focused")).toHaveLength(1);
        });

        it("ArrowUp with nothing focused focuses the first option", () => {
            press(textarea, "ArrowUp");
            expect(focusedValue(container)).toBe("blue");
        });

        it("Enter picks the focused option", () => {
            press(textarea, "ArrowDown");
            press(textarea, "ArrowDown");
            const event = press(textarea, "Enter");
            expect(event.defaultPrevented).toBe(true);
            expect(textarea.value).toBe("black ");
            expect(textarea.selectionStart).toBe(6);
            expect(isOpen(container)).toBe(false);
        });

        it("Tab picks the focused option", () => {
            press(textarea, "ArrowDown");
            const event = press(textarea, "Tab");
            expect(event.defaultPrevented).toBe(true);
            expect(textarea.value).toBe("blue ");
            expect(isOpen(container)).toBe(false);
        });

        it("Enter and Tab with nothing focused fall through", () => {
            expect(press(textarea, "Enter").defaultPrevented).toBe(false);
            expect(press(textarea, "Tab").defaultPrevented).toBe(false);
            expect(textarea.value).toBe("bl");
            expect(isOpen(container)).toBe(true);
        });

        it("Escape hides the list", () => {
            const event = press(textarea, "Escape");
            expect(event.defaultPrevented).toBe(true);
            expect(isOpen(container)).toBe(false);
            expect(optionsOf(container)).toHaveLength(0);
        });

        it("ignores handled keys while the list is hidden", () => {
            press(textarea, "Escape");
            for (const key of ["ArrowDown", "ArrowUp", "Enter", "Tab", "Escape"]) {
                expect(press(textarea, key).defaultPrevented).toBe(false);
            }
            expect(textarea.value).toBe("bl");
        });

        it("ignores unrelated keys", () => {
            expect(press(textarea, "a").defaultPrevented).toBe(false);
            expect(isOpen(container)).toBe(true);
        });

        it("resets the focused option when the list re-renders", () => {
            press(textarea, "ArrowDown");
            expect(focusedValue(container)).toBe("blue");
            type(textarea, "b");
            expect(focusedValue(container)).toBeUndefined();
            expect(press(textarea, "Enter").defaultPrevented).toBe(false);
        });

        it("keeps a typed prefix when picking", () => {
            type(textarea, "sm:bl");
            press(textarea, "ArrowDown");
            press(textarea, "Enter");
            expect(textarea.value).toBe("sm:blue ");
        });

        it("inserts a picked prefix without a trailing space", () => {
            type(textarea, "@m");
            press(textarea, "ArrowDown");
            press(textarea, "Enter");
            expect(textarea.value).toBe("md:");
        });
    });

    describe("mouse and focus", () => {
        it("mousedown on an option picks it and keeps focus", () => {
            const { container, textarea } = mount();
            initializeFuzzyArea();
            type(textarea, "bl");
            // Target the highlight span inside the option, like a real click would.
            const target = optionsOf(container)[1].querySelector(".fuzzyarea__highlight");
            const event = mousedown(target);
            expect(event.defaultPrevented).toBe(true);
            expect(textarea.value).toBe("black ");
            expect(isOpen(container)).toBe(false);
            expect(document.activeElement).toBe(textarea);
        });

        it("ignores non-primary buttons", () => {
            const { container, textarea } = mount();
            initializeFuzzyArea();
            type(textarea, "bl");
            mousedown(optionsOf(container)[0], 2);
            expect(textarea.value).toBe("bl");
            expect(isOpen(container)).toBe(true);
        });

        it("hides the list on blur", () => {
            const { container, textarea } = mount();
            initializeFuzzyArea();
            textarea.focus();
            type(textarea, "bl");
            textarea.blur();
            expect(isOpen(container)).toBe(false);
        });
    });

    describe("resize", () => {
        const stubScrollHeight = (textarea, height) =>
            Object.defineProperty(textarea, "scrollHeight", {
                configurable: true,
                get: () => height,
            });

        it("grows the textarea, not the container", () => {
            const { container, textarea } = mount();
            stubScrollHeight(textarea, 42);
            initializeFuzzyArea({ resize: true });
            expect(textarea.style.height).toBe("42px");

            stubScrollHeight(textarea, 80);
            type(textarea, "line\nline\nbl");
            expect(textarea.style.height).toBe("80px");

            stubScrollHeight(textarea, 96);
            press(textarea, "ArrowDown");
            press(textarea, "Enter");
            expect(textarea.style.height).toBe("96px");

            expect(container.style.height).toBe("");
        });

        it("leaves the height alone when off", () => {
            const { container, textarea } = mount();
            stubScrollHeight(textarea, 42);
            initializeFuzzyArea();
            type(textarea, "bl");
            expect(textarea.style.height).toBe("");
            expect(container.style.height).toBe("");
        });
    });

    describe("multiple instances", () => {
        it("binds each container to its own textarea", () => {
            const a = mount("a");
            const b = mount("b");
            initializeFuzzyArea({ containerId: "a", suggestions: ["alpha"] });
            initializeFuzzyArea({ containerId: "b", suggestions: ["beta"] });

            expect(a.container.querySelectorAll(".fuzzyarea__suggestions")).toHaveLength(1);
            expect(b.container.querySelectorAll(".fuzzyarea__suggestions")).toHaveLength(1);

            type(a.textarea, "a");
            expect(optionValues(a.container)).toEqual(["alpha"]);
            expect(isOpen(b.container)).toBe(false);

            type(b.textarea, "b");
            expect(optionValues(b.container)).toEqual(["beta"]);

            press(b.textarea, "ArrowDown");
            press(b.textarea, "Enter");
            expect(b.textarea.value).toBe("beta ");
            expect(a.textarea.value).toBe("a");
            expect(isOpen(a.container)).toBe(true);
        });

        it("finds textareaId only inside its container", () => {
            mount("a", 'id="ta"');
            const b = mount("b");
            initializeFuzzyArea({ containerId: "b", textareaId: "ta" });
            expect(b.container.querySelector(".fuzzyarea__suggestions")).toBeNull();
            expect(document.querySelectorAll(".fuzzyarea__suggestions")).toHaveLength(0);
            expect(console.error).toHaveBeenCalledTimes(1);
        });

        it("uses textareaId when given", () => {
            const container = document.createElement("div");
            container.id = "fuzzyarea";
            container.innerHTML = '<textarea id="first"></textarea><textarea id="second"></textarea>';
            document.body.appendChild(container);
            initializeFuzzyArea({ textareaId: "second" });
            expect(document.getElementById("second").nextElementSibling).toBe(listOf(container));
        });
    });

    describe("suggestions and prefixes precedence", () => {
        it("option beats window global", () => {
            window.suggestions = ["global-item"];
            window.prefixes = ["gl:"];
            const { container, textarea } = mount();
            initializeFuzzyArea({ suggestions: ["option-item"], prefixes: ["op:"] });
            type(textarea, "item");
            expect(optionValues(container)).toEqual(["option-item"]);
            type(textarea, "@");
            expect(optionValues(container)).toEqual(["op:"]);
        });

        it("window global beats the built-in default", () => {
            window.suggestions = ["global-blue"];
            window.prefixes = ["gl:"];
            const { container, textarea } = mount();
            initializeFuzzyArea();
            type(textarea, "bl");
            expect(optionValues(container)).toEqual(["global-blue"]);
            type(textarea, "@");
            expect(optionValues(container)).toEqual(["gl:"]);
        });

        it("falls back to the built-in default", () => {
            const { container, textarea } = mount();
            initializeFuzzyArea();
            type(textarea, "bl");
            expect(optionValues(container)).toEqual(["blue", "black"]);
            type(textarea, "@");
            expect(optionValues(container)).toEqual([" ", "sm:", "md:"]);
        });

        it("ignores an empty window global", () => {
            window.suggestions = [];
            const { container, textarea } = mount();
            initializeFuzzyArea();
            type(textarea, "bl");
            expect(optionValues(container)).toEqual(["blue", "black"]);
        });
    });

    describe("missing elements", () => {
        it("logs one error and does not throw for a missing container", () => {
            expect(() => initializeFuzzyArea({ containerId: "nope" })).not.toThrow();
            expect(console.error).toHaveBeenCalledTimes(1);
            expect(console.error.mock.calls[0][0]).toContain("#nope");
        });

        it("logs one error for a container without a textarea", () => {
            const container = document.createElement("div");
            container.id = "fuzzyarea";
            document.body.appendChild(container);
            expect(() => initializeFuzzyArea()).not.toThrow();
            expect(console.error).toHaveBeenCalledTimes(1);
            expect(container.children).toHaveLength(0);
        });
    });

    describe("waitForElement", () => {
        it("initialises once the element is appended later", async () => {
            initializeFuzzyArea({ containerId: "late", waitForElement: true });
            await tick();
            expect(console.error).not.toHaveBeenCalled();

            const { container, textarea } = mount("late");
            await tick();

            expect(container.querySelectorAll(".fuzzyarea__suggestions")).toHaveLength(1);
            type(textarea, "bl");
            expect(optionValues(container)).toEqual(["blue", "black"]);
            expect(console.error).not.toHaveBeenCalled();
        });

        it("waits for the textarea when the container comes first", async () => {
            const container = document.createElement("div");
            container.id = "late";
            document.body.appendChild(container);
            initializeFuzzyArea({ containerId: "late", waitForElement: true });
            await tick();
            expect(listOf(container)).toBeNull();

            container.appendChild(document.createElement("textarea"));
            await tick();
            expect(listOf(container)).not.toBeNull();

            // Further mutations must not initialise a second time.
            container.appendChild(document.createElement("span"));
            await tick();
            expect(container.querySelectorAll(".fuzzyarea__suggestions")).toHaveLength(1);
            expect(console.error).not.toHaveBeenCalled();
        });

        it("initialises immediately when the element already exists", () => {
            const { container } = mount();
            initializeFuzzyArea({ waitForElement: true });
            expect(listOf(container)).not.toBeNull();
        });
    });
});
