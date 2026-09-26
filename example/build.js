const esbuild = require("esbuild");

async function build() {
    try {
        await esbuild.build({
            entryPoints: ["index.js"],
            bundle: true,
            // minify: true,
            // Importing "fuzzy-area/style.css" in index.js makes esbuild
            // emit dist/main.min.css alongside dist/main.min.js.
            outfile: "dist/main.min.js",
        });
        console.log("Build successful");
    } catch (error) {
        console.error("Error during build:", error);
    }
}

build();

