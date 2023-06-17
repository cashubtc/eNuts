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
	navTxt: {
		fontSize: 20,
		fontWeight: '500',
		color: color.TEXT
	},
	input: {
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
	wrapContainer: {
		borderWidth: 1,
		borderRadius: 20,
		borderColor: color.BORDER,
		backgroundColor: color.INPUT_BG,
		paddingHorizontal: 20,
	},
	modalTxt: {
		fontSize: 16,
		textAlign: 'center',
		color: color.TEXT,
		marginRight: 20,
		marginLeft: 20,
		marginBottom: 40,
	},
	radioBtn: {
		borderWidth: 1,
		borderRadius: 50,
		padding: 10,
		borderColor: color.BORDER
	}
})