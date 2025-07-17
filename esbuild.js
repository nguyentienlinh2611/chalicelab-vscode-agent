const esbuild = require("esbuild");
const path = require("path");

const production = process.argv.includes('--production');
const watch = process.argv.includes('--watch');

/**
 * @type {import('esbuild').Plugin}
 * Plugin để hiển thị log và lỗi trong quá trình build (tùy chọn, có thể giữ lại)
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
            console.log(`[watch] build finished${result.errors.length ? " with errors" : ""}`);
        });
    },
};

// --- Cấu hình build cho Extension (Node.js) ---
const extensionConfig = {
    entryPoints: ['src/extension.ts'],
    bundle: true,
    outfile: 'dist/extension.js',
    external: ['vscode'],
    format: 'cjs',
    platform: 'node',
    sourcemap: !production,
    minify: production,
    plugins: [esbuildProblemMatcherPlugin],
};

// --- Cấu hình build cho Webview (Browser) ---
const webviewConfig = {
    entryPoints: [
        'src/webview/main.ts',
        'src/webview/main.css'
    ],
    bundle: true,
    outdir: 'dist', // Dùng outdir vì có nhiều file output
    format: 'iife',
    platform: 'browser',
    sourcemap: !production,
    minify: production,
    plugins: [esbuildProblemMatcherPlugin],
};

async function main() {
    if (watch) {
        console.log('[watch] starting...');
        // Sử dụng context để theo dõi thay đổi cho cả hai
        const extensionCtx = await esbuild.context(extensionConfig);
        const webviewCtx = await esbuild.context(webviewConfig);
        await Promise.all([extensionCtx.watch(), webviewCtx.watch()]);
    } else {
        console.log('[build] starting...');
        // Build một lần cho cả hai
        await Promise.all([esbuild.build(extensionConfig), esbuild.build(webviewConfig)]);
        console.log('[build] finished');
    }
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});