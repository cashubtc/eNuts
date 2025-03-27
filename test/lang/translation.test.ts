import { readdirSync, readFileSync } from 'fs'
import { join, resolve } from 'path'

type Translation = Record<string, Record<string, string>>
type TLObjectParam = Record<string, string | Record<string, string>>

const tlPath = '../../assets/translations'

// load a JSON file
const loadJSON = (filename: string) => {
	const filePath = resolve(__dirname, tlPath, filename)
	const content = readFileSync(filePath, 'utf-8')
	try {
		return JSON.parse(content) as Translation
	} catch (error) {
		// eslint-disable-next-line no-console
		console.log('error', error)
		return {}
	}
}

// base language
const baseLang = loadJSON('en.json')

// get supported languages based on available files
function getSupportedLanguages() {
	const translationDir = resolve(__dirname, tlPath)
	const files = readdirSync(translationDir)
	return files.map(file => file.replace('.json', ''))
}

// get all keys from translation object
function getAllKeys(obj: TLObjectParam, prefix: string = ''): string[] {
	const keys: string[] = []
	for (const key in obj) {
		if (!(key in obj)) { continue }
		const newKey = prefix ? `${prefix}.${key}` : key
		keys.push(newKey)
		const tmp = obj[key]
		if (typeof tmp !== 'object') { continue }
		keys.push(...getAllKeys(tmp, newKey))
	}
	return keys
}

function extractStringsFromFiles(directoryPath: string): string[] {
	const strings: string[] = []
	function readFilesRecursively(dir: string) {
		const files = readdirSync(dir, { withFileTypes: true })
		files.forEach(file => {
			const filePath = join(dir, file.name)
			if (file.isDirectory()) { return readFilesRecursively(filePath) }
			const fileContents = readFileSync(filePath, 'utf-8')
			const stringMatches = fileContents.match(/'([^'\\]*(?:\\.[^'\\]*)*)'/g)
			if (!stringMatches) { return }
			// remove quotes
			const extractedStrings = stringMatches.map(match => match.replace(/'/g, ''))
			strings.push(...extractedStrings)
		})
	}
	readFilesRecursively(directoryPath)
	return strings
}

describe('Translation consistency', () => {
	it('should have consistent keys across all languages', () => {
		// get supported languages dynamically
		const baseKeys = getAllKeys(baseLang)
		const supportedLanguages = getSupportedLanguages()
		supportedLanguages.forEach(language => {
			// Log missing keys
			const languageKeys = getAllKeys(loadJSON(`${language}.json`))
			const missingKeys = baseKeys.filter(key => !languageKeys.includes(key))
			if (missingKeys.length > 0) {
				throw new Error(`Missing keys in ${language}.json: ${missingKeys.join(',')}`,)
			}
			// Check if all keys exist in the language file
			baseKeys.forEach(baseKey => {
				expect(languageKeys).toContain(baseKey)
			})
		})
	})
	it('should detect unused translation keys', () => {
		const sourceDir1 = join(__dirname, '../../src/components')
		const sourceDir2 = join(__dirname, '../../src/screens')
		const sourceDir3 = join(__dirname, '../../src/context')
		const extractedStrings = [
			...extractStringsFromFiles(sourceDir1),
			...extractStringsFromFiles(sourceDir2),
			...extractStringsFromFiles(sourceDir3),
		]
		const translationKeys = Object.keys(baseLang)
			.flatMap(namespace => Object.keys(baseLang[namespace]))

		const unusedTranslationKeys = translationKeys.filter(
			key => !extractedStrings.includes(key)
		)

		if (unusedTranslationKeys.length > 0) {
			throw new Error(`unusedTranslationKeys Error: ${unusedTranslationKeys.join(',')}`)
		}
		expect(unusedTranslationKeys).toHaveLength(0)
	})
})
