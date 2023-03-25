import {defineConfig} from 'tsup'

export default defineConfig({
	// bundle: false,
	entry: ['src/bin/*.ts', 'src/index.ts'],
	clean: true,
	format: ['esm'],
	outDir: './dist',
	esbuildOptions(options) {
		// the directory structure will be the same as the source
		options.outbase = './src'
	}
})
