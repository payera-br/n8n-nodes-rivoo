module.exports = {
	root: true,
	env: { es6: true, node: true },
	// Test files are outside the build tsconfig and carry none of the node
	// conventions these rules check.
	ignorePatterns: ['.eslintrc.js', '**/*.js', '**/*.test.ts', '**/node_modules/**', '**/dist/**'],
	overrides: [
		{
			files: ['package.json'],
			parser: 'jsonc-eslint-parser',
			plugins: ['eslint-plugin-n8n-nodes-base'],
			extends: ['plugin:n8n-nodes-base/community'],
			rules: {
				'n8n-nodes-base/community-package-json-name-still-default': 'off',
			},
		},
		{
			files: ['./credentials/**/*.ts'],
			parser: '@typescript-eslint/parser',
			parserOptions: { project: ['./tsconfig.json'], sourceType: 'module' },
			plugins: ['eslint-plugin-n8n-nodes-base'],
			extends: ['plugin:n8n-nodes-base/credentials'],
			rules: {
				// Community packages link to their own docs; the camelCase form of this
				// field only applies to credentials living in the main n8n repository.
				'n8n-nodes-base/cred-class-field-documentation-url-miscased': 'off',
			},
		},
		{
			files: ['./nodes/**/*.ts'],
			parser: '@typescript-eslint/parser',
			parserOptions: { project: ['./tsconfig.json'], sourceType: 'module' },
			plugins: ['eslint-plugin-n8n-nodes-base'],
			extends: ['plugin:n8n-nodes-base/nodes'],
		},
	],
};
