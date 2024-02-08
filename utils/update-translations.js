/* eslint-disable no-console */
const fs = require('fs')
const path = require('path')

/***************************************************************************/
/*************** Remove unused keys from translation files *****************/
/***************************************************************************/

const tlPath = '../assets/translations'

const loadJSON = (filename) => {
	const filePath = path.resolve(__dirname, tlPath, filename)
	const content = fs.readFileSync(filePath, 'utf-8')
	return JSON.parse(content)
}

// paste unused keys from the jest test output here
const unusedKeys = ['createBackup']

const updateTranslationFiles = (unusedKeys) => {
	const translationDir = path.resolve(__dirname, tlPath)
	fs.readdirSync(translationDir).forEach((file) => {
		const filePath = path.join(translationDir, file)
		const translationData = loadJSON(filePath)
		for (const namespaceKey of Object.keys(translationData)) {
			const keysToRemove = unusedKeys
			if (translationData[namespaceKey]) {
				for (const key of keysToRemove) {
					delete translationData[namespaceKey][key]
				}
			}
		}
		fs.writeFileSync(filePath, JSON.stringify(translationData, null, 4), 'utf-8')
	})
	console.log('Translation files updated successfully.')
}

updateTranslationFiles(unusedKeys)
