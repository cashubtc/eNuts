import { StyleSheet } from 'react-native'

import { highlight as hi,type TPref } from './colors'

export const globals = (color: TPref, h?: string) => StyleSheet.create({
	header: {
		fontSize: 32,
		color: color.TEXT,
		marginBottom: 15,
	},
	txt: {
		fontSize: 16,
		color: color.TEXT
	},
	pressTxt: {
		fontSize: 16,
		fontWeight: '500',
		textAlign: 'center',
		color: hi[h || '']
	},
	input: {
		marginBottom: 15,
		borderWidth: 1,
		color: color.TEXT,
		borderColor: color.BORDER,
		backgroundColor: color.INPUT_BG,
		padding: 18,
		borderRadius: 50,
		fontSize: 16,
		width: '100%',
	},
	modalHeader: {
		fontSize: 24,
		fontWeight: '500',
		marginBottom: 30,
		textAlign: 'center',
		color: color.TEXT,
	},
	modalTxt: {
		fontSize: 16,
		textAlign: 'center',
		color: color.TEXT,
		marginRight: 20,
		marginLeft: 20,
		marginBottom: 40,
	}
})