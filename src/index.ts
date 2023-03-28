import {interpolate, isString, objectOverwrite} from '@snickbit/utilities'
import {fileExists, findUp, getFileJSON} from '@snickbit/node-utilities'
import {gitLog, gitTags} from './git'
import {LogResult} from 'simple-git/dist/typings/response'
import {
	$out,
	Config,
	defaultConfig,
	ObjectOptions,
	Options,
	parseSemver,
	safeStr,
	StringOptions,
	Version
} from '@/common'
import path from 'path'

function parseCommitSubject(commitSubject: string): {type: string; scope?: string; message: string} {
	const regex = /^(\w+!?)(\(([^)]+)\))?:\s*(.*)$/
	const match = regex.exec(commitSubject.trim())

	if (!match) {
		throw new Error(`Invalid commit subject: "${commitSubject}"`)
	}

	const [
		, type, , scope,
		message
	] = match

	return {
		type: type.toLowerCase().trim(),
		scope: scope?.toLowerCase().trim(),
		message: message.toLowerCase().trim()
	}
}

export async function conventionalVersion(options: StringOptions): Promise<string>
export async function conventionalVersion(options: ObjectOptions): Promise<Version>
export async function conventionalVersion(options?: Options): Promise<Version | string>
export async function conventionalVersion(options?: Options): Promise<Version | string> {
	const config = objectOverwrite(defaultConfig, {...options})

	config.versionFile = path.isAbsolute(config.versionFile) ? config.versionFile : path.join(config.cwd, config.versionFile)

	const versionFile = config.versionFile && fileExists(config.versionFile)
		? getFileJSON(config.versionFile) : {version: '0.0.1'}

	$out.debug('versionFile', versionFile)

	const version = parseSemver(versionFile.version)

	$out.debug('current version', version)

	const findUpOptions = {
		cwd: config.cwd,
		distance: 3
	}

	const isMonorepo = findUp('lerna.json', findUpOptions) ||
        findUp('pnpm-workspace.yaml', findUpOptions) ||
        (versionFile.workspaces && versionFile.workspaces.length > 0)

	$out.debug('isMonorepo', isMonorepo)

	config.tagName ||= isMonorepo ? '${name}@${version}' : 'v${version}'
	config.range ||= interpolate(config.tagName, versionFile)

	$out.debug('tag range', config.range)

	const tags = await gitTags(config.cwd, config.range)
	let logs: LogResult
	if (tags.all.length > 0 && tags.all.includes(config.range)) {
		try {
			logs = await gitLog(config.cwd, config.range)
		} catch {
			throw new Error('Unable to get commits from git log, invalid range')
		}
	} else {
		logs = await gitLog(config.cwd, tags?.latest)
	}

	$out.debug('git log count', logs.total)

	incrementVersion(logs, version, config)

	if (config.asString) {
		return `${version.major}.${version.minor}.${version.patch}`
	}
	return version
}

function incrementVersion(logs: LogResult, version: Version, config: Config): void {
	const bump = {
		major: false,
		minor: false,
		patch: false
	}
	for (const commit of logs.all) {
		const {type, scope} = parseCommitSubject(commit.message)
		// if we get a major release or breaking change, we don't need to check the rest of the commits
		if (
			bump.major ||
            commit.body.includes('BREAKING CHANGE') ||
            type.startsWith('breaking') ||
            type.endsWith('!')
		) {
			bump.major = true
			$out.debug('breaking change found, skipping rest of commits')
			break
		}

		for (const rule of config.releaseRules) {
			const ruleType = safeStr(rule.type)
			const ruleScope = safeStr(rule.scope)

			if (ruleType === type || (ruleScope === scope || ruleScope === '*' && scope)) {
				if (rule.release === false) {
					break
				}

				$out.debug('found matching release rule', rule, {type, scope})

				if (isString(rule.release)) {
					const releaseRule = safeStr(rule.release)

					if (releaseRule === 'major') {
						bump.major = true
						break
					}
					if (releaseRule === 'minor') {
						bump.minor = true
						break
					}
					if (releaseRule === 'patch') {
						bump.patch = true
						break
					}
				}
			}
		}
	}

	if (bump.major) {
		version.major++
		version.minor = 0
		version.patch = 0
	} else if (bump.minor) {
		version.minor++
		version.patch = 0
	} else {
		version.patch++
	}
}
