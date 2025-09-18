import js from "@eslint/js";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import prettierConfig from "eslint-config-prettier";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default [
	// Base config for all files
	{
		languageOptions: {
			ecmaVersion: "latest",
			sourceType: "module",
			globals: {
				console: "readonly",
				process: "readonly",
				Buffer: "readonly",
				__dirname: "readonly",
				__filename: "readonly",
				module: "readonly",
				require: "readonly",
				exports: "readonly",
				global: "readonly",
				// Bun globals
				Bun: "readonly",
			},
		},
	},

	// JavaScript files (no TypeScript parsing)
	{
		files: ["**/*.js", "**/*.mjs", "**/*.cjs"],
		...js.configs.recommended,
		rules: {
			// String formatting
			quotes: [
				"error",
				"double",
				{
					avoidEscape: true,
					allowTemplateLiterals: true,
				},
			],

			// Semicolons
			semi: ["error", "always"],

			// Indentation - tabs
			indent: [
				"error",
				"tab",
				{
					SwitchCase: 1,
					VariableDeclarator: 1,
					outerIIFEBody: 1,
					MemberExpression: 1,
					FunctionDeclaration: { parameters: 1, body: 1 },
					FunctionExpression: { parameters: 1, body: 1 },
					CallExpression: { arguments: 1 },
					ArrayExpression: 1,
					ObjectExpression: 1,
					ImportDeclaration: 1,
				},
			],

			// Spacing and formatting
			"comma-dangle": ["error", "es5"],
			"object-curly-spacing": ["error", "always"],
			"array-bracket-spacing": ["error", "never"],
			"space-in-parens": ["error", "never"],
			"space-before-blocks": ["error", "always"],

			// Code quality
			"no-console": "warn",
			"no-debugger": "error",
			"prefer-const": "error",
			"no-var": "error",
		},
	},

	// TypeScript files - WITHOUT type-aware rules (to avoid parsing errors)
	{
		files: ["**/*.ts", "**/*.tsx"],
		languageOptions: {
			parser: tsParser,
			// Remove parserOptions.project to avoid tsconfig issues
			parserOptions: {
				ecmaVersion: "latest",
				sourceType: "module",
			},
		},
		plugins: {
			"@typescript-eslint": tsPlugin,
		},
		rules: {
			// Use non-type-aware recommended rules
			...tsPlugin.configs["eslint-recommended"].rules,
			...tsPlugin.configs.recommended.rules,

			// String formatting
			quotes: "off",
			"@typescript-eslint/quotes": [
				"error",
				"double",
				{
					avoidEscape: true,
					allowTemplateLiterals: true,
				},
			],

			// Semicolons
			semi: "off",
			"@typescript-eslint/semi": ["error", "always"],

			// Indentation
			indent: "off",
			"@typescript-eslint/indent": ["error", "tab"],

			// Spacing and formatting
			"comma-dangle": ["error", "es5"],
			"object-curly-spacing": ["error", "always"],
			"array-bracket-spacing": ["error", "never"],
			"space-in-parens": ["error", "never"],
			"space-before-blocks": ["error", "always"],

			// TypeScript specific (non-type-aware)
			"@typescript-eslint/no-unused-vars": [
				"error",
				{
					argsIgnorePattern: "^_",
					varsIgnorePattern: "^_",
				},
			],
			"@typescript-eslint/no-explicit-any": "warn",
			"@typescript-eslint/explicit-function-return-type": "off",
			"@typescript-eslint/explicit-module-boundary-types": "off",
			"@typescript-eslint/ban-ts-comment": "warn",
			"@typescript-eslint/no-inferrable-types": "off",

			// Code quality
			"no-console": "warn",
			"no-debugger": "error",
			"prefer-const": "error",
			"no-var": "error",
		},
	},

	// Test files - more relaxed rules
	{
		files: [
			"**/*.test.ts",
			"**/*.spec.ts",
			"**/tests/**/*",
			"**/__tests__/**/*",
		],
		rules: {
			"@typescript-eslint/no-explicit-any": "off",
			"no-console": "off",
		},
	},

	// Config files
	{
		files: [
			"*.config.js",
			"*.config.ts",
			"eslint.config.js",
			".eslintrc.js",
		],
		languageOptions: {
			globals: {
				module: "readonly",
				require: "readonly",
				__dirname: "readonly",
				process: "readonly",
			},
		},
		rules: {
			"@typescript-eslint/no-var-requires": "off",
			"@typescript-eslint/no-require-imports": "off",
		},
	},

	// Prettier integration (must be last)
	prettierConfig,

	// Global ignores
	{
		ignores: [
			"**/dist/**",
			"**/build/**",
			"**/coverage/**",
			"**/node_modules/**",
			"*.generated.*",
			"*.min.js",
			".husky/",
			"bun.lockb",
		],
	},
];
