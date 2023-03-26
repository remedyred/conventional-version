import {defineConfig} from 'tsup'

export default defineConfig({
	entry: ['src/bin/*.ts', 'src/index.ts'],
	clean: true,
	format: ['esm'],
	outDir: './dist',
	dts: true,
	splitting: false,
	esbuildOptions(options) {
		// the directory structure will be the same as the source
		options.outbase = './src'
	}
})
