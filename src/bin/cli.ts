import {out} from '@snickbit/out'
import conventionalVersion, {Options} from '../'
import cli from '@snickbit/node-cli'

cli()
	.name('conventional-version')
	.options({
		cwd: {
			alias: 'c',
			describe: 'The directory of the repo to get the version from',
			type: 'string'
		},
		range: {
			alias: 'r',
			describe: 'The range of commits to get the version from',
			type: 'string'
		},
		merges: {
			alias: 'm',
			describe: 'Whether to include merge commits',
			type: 'boolean'
		},
		file: {
			alias: 'f',
			describe: 'The file to write the version to',
			type: 'string'
		},
		tag: {
			alias: 't',
			describe: 'The tag name or template to use',
			type: 'string'
		}
	})
	.run(async (argv: Omit<Options, 'tagName' | 'versionFile'> & {file?: string; tag?: string}) => {
		argv.cwd ||= process.cwd()

		const version = await conventionalVersion({
			...argv,
			versionFile: argv.file || 'package.json',
			tagName: argv.tag,
			asString: true
		})

		out.done(`Suggested Version: ${version}`)
	})
