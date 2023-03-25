import {simpleGit} from 'simple-git'
import {LogResult, TagResult} from 'simple-git/dist/typings/response'

export async function gitLog(cwd: string, tag?: string): Promise<LogResult> {
	const params = ['--no-merges']

	if (tag) {
		params.push(`${tag}..HEAD`)
	}

	params.push('--', '.')

	return simpleGit({baseDir: cwd}).log(params)
}

export async function gitTags(cwd: string, tag: string): Promise<TagResult> {
	return simpleGit({baseDir: cwd}).tags(['--sort=-creatordate'])
}
