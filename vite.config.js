import {defineConfig} from 'vite'
import {$, nothrow} from "zx";

/**
 *
 * @type {import('vite').Plugin}
 */
const declPlugin = {
    name: 'x-diagram-plugin',
    apply: 'build',
    buildStart() {
        return Promise.all([
            $`rm -rf ./themes`,
            $`rm -rf ./plugins`,
            $`rm -rf ./components`,
            $`rm -rf ./renderers`,
            nothrow($`rm index.d.ts`),
        ])
    },
    closeBundle() {
        return Promise
            .resolve()
            .then(() => $`npm run decl`)
            .then(() => Promise.all([$`mkdir themes`, $`mkdir plugins`, $`mkdir components`, $`mkdir renderers`]))
            .then(() => Promise.all([
                $`echo "export * from './dist/types/modules/core'" >> ./index.d.ts`,
                $`echo "export * from '../dist/types/modules/themes'" >> ./themes/index.d.ts`,
                $`echo "export * from '../dist/types/modules/plugins'" >> ./plugins/index.d.ts`,
                $`echo "export * from '../dist/types/modules/components'" >> ./components/index.d.ts`,
                $`echo "export * from '../dist/types/modules/renderers'" >> ./renderers/index.d.ts`,
            ]));
    }
}
export default defineConfig({
    build: {
        minify: true,
        sourcemap: true,
        rollupOptions: {
            preserveEntrySignatures: true,
            input: {
                "core": "src/modules/core.ts",
                "themes": "src/modules/themes.ts",
                "plugins": "src/modules/plugins.ts",
                "components": "src/modules/components.ts",
                "renderers": "src/modules/renderers.ts",
            },
            output: [
                {
                    format: 'es',
                    entryFileNames: () => `x-[name]-[format].js`
                },
                {
                    format: 'cjs',
                    entryFileNames: () => `x-[name]-[format].js`
                }
            ]
        }
    },
    plugins: [
        declPlugin
    ],
})
