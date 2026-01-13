import { defineConfig } from "tsup";

export default defineConfig({
	entry: ["./src/index.ts"],
	format: "esm",
	splitting: false,
	sourcemap: true,
	clean: true,
	bundle: true, // Bundle all imports into a single file
	platform: "node",
	dts: true,
});
