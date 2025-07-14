const esbuild = require("esbuild");
const fs = require("fs");
const path = require("path");

const production = process.argv.includes('--production');
const watch = process.argv.includes('--watch');

/**
 * @type {import('esbuild').Plugin}
 */
const esbuildProblemMatcherPlugin = {
	name: 'esbuild-problem-matcher',

	setup(build) {
		build.onStart(() => {
			console.log('[watch] build started');
		});
		build.onEnd((result) => {
			result.errors.forEach(({ text, location }) => {
				console.error(`✘ [ERROR] ${text}`);
				console.error(`    ${location.file}:${location.line}:${location.column}:`);
			});
			console.log('[watch] build finished');
		});
	},
};

/**
 * Plugin to bundle CSS and HTML files
 * @type {import('esbuild').Plugin}
 */
const bundleAssetsPlugin = {
	name: 'bundle-assets',
	setup(build) {
		// Handle .css files
		build.onLoad({ filter: /\.css$/ }, async (args) => {
			const text = await fs.promises.readFile(args.path, 'utf8');
			return {
				contents: `export default ${JSON.stringify(text)};`,
				loader: 'js',
			};
		});

		// Handle .html files
		build.onLoad({ filter: /\.html$/ }, async (args) => {
			const text = await fs.promises.readFile(args.path, 'utf8');
			return {
				contents: `export default ${JSON.stringify(text)};`,
				loader: 'js',
			};
		});
	},
};

async function main() {
	const ctx = await esbuild.context({
		entryPoints: [
			'src/extension.ts'
		],
		bundle: true,
		format: 'cjs',
		minify: production,
		sourcemap: !production,
		sourcesContent: false,
		platform: 'node',
		outfile: 'dist/extension.js',
		external: ['vscode'],
		logLevel: 'silent',
		plugins: [
			bundleAssetsPlugin,
			/* add to the end of plugins array */
			esbuildProblemMatcherPlugin,
		],
	});
	if (watch) {
		await ctx.watch();
	} else {
		await ctx.rebuild();
		await ctx.dispose();
	}
}

main().catch(e => {
	console.error(e);
	process.exit(1);
});
