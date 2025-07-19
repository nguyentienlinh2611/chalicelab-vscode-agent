const esbuild = require("esbuild");
const path = require("path");
const fs = require("fs");

const production = process.argv.includes('--production');
const watch = process.argv.includes('--watch');

/**
 * Plugin to copy static files
 */
const copyPlugin = {
    name: 'copy',
    setup(build) {
        build.onEnd(() => {
            // Ensure dist directory exists
            if (!fs.existsSync('dist')) {
                fs.mkdirSync('dist', { recursive: true });
            }
            
            // Copy HTML files to dist
            const htmlFiles = [
                'src/webview/index.html',
                'src/components/chat/chat.html',
                'src/components/sidebar/sidebar.html',
                'src/components/ingest/ingest.html',
                'src/components/settings/settings.html',
                'src/components/modals/modals.html'
            ];
            
            htmlFiles.forEach(file => {
                if (fs.existsSync(file)) {
                    const fileName = path.basename(file);
                    fs.copyFileSync(file, `dist/${fileName}`);
                    console.log(`Copied ${file} -> dist/${fileName}`);
                }
            });
        });
    },
};

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
                if (location) {
                    console.error(`    ${location.file}:${location.line}:${location.column}:`);
                }
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
    plugins: [esbuildProblemMatcherPlugin, copyPlugin],
};

const webviewConfig = {
    entryPoints: [
        'src/webview/main.ts',
        'src/webview/main.css'
    ],
    bundle: true,
    outdir: 'dist',
    format: 'iife',
    platform: 'browser',
    sourcemap: !production,
    minify: production,
    plugins: [esbuildProblemMatcherPlugin],
};

// --- Logic build ---
async function main() {
    if (watch) {
        console.log('[watch] starting...');
        const extensionCtx = await esbuild.context(extensionConfig);
        const webviewCtx = await esbuild.context(webviewConfig);
        await Promise.all([extensionCtx.watch(), webviewCtx.watch()]);
    } else {
        console.log('[build] starting...');
        await Promise.all([
            esbuild.build(extensionConfig),
            esbuild.build(webviewConfig)
        ]);
        console.log('[build] finished');
    }
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});