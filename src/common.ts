import {Out} from '@snickbit/out'

export const $out = new Out('conventional-version')
export type Version = {
	major: number
	minor: number
	patch: number
}

export interface Config {
	cwd: string
	range?: string
	merges: boolean
	versionFile: string
	tagName?: string
	asString: boolean
	releaseRules: ReleaseRule[]
}

export const defaultConfig: Config = {
	cwd: process.cwd(),
	merges: false,
	versionFile: 'package.json',
	asString: false,
	releaseRules: [
		{type: 'docs', scope: 'README', release: false},
		{type: 'test', release: false},
		{type: 'style', release: false},
		{type: 'refactor', scope: '*', release: 'minor'},
		{type: 'refactor', release: 'patch'},
		{type: 'feat', release: 'minor'},
		{type: 'fix', release: 'patch'},
		{type: 'chore', release: 'patch'},
		{type: 'perf', release: 'patch'},
		{scope: 'breaking', release: 'major'},
		{scope: 'no-release', release: false}
	]
}
export type Options = Partial<Config>
export type StringOptions = Omit<Options, 'asString'> & {asString: true}
export type ObjectOptions = Omit<Options, 'asString'> & {asString: false | undefined}

export function parseSemver(version: string): Version {
	const [major, minor, patch] = version.split('.').map(Number)
	return {major, minor, patch}
}

export const safeStr = (str: string | undefined) => String(str || '').toLowerCase()

export interface ReleaseRule {
	release: boolean | 'major' | 'minor' | 'patch'
	scope?: string
	type?: string
}
