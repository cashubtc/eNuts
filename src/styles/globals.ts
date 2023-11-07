import { isIOS } from '@consts'
import { StyleSheet } from 'react-native'

import { highlight, type HighlightKey, mainColors, type Theme } from './colors'

export const globalStyles = (color?: Theme, h?: HighlightKey) => StyleSheet.create({
	container: {
		flex: 1,
		paddingTop: 110,
		backgroundColor: color?.BACKGROUND
	},
	txt: {
		fontSize: 16,
		color: color?.TEXT
	},
	txtBold: {
		fontSize: 16,
		fontWeight: '500',
		color: color?.TEXT
	},
	pressTxt: {
		fontSize: 16,
		fontWeight: '500',
		textAlign: 'center',
		color: h ? highlight[h] : mainColors.BLACK
	},
	navTxt: {
		fontSize: 20,
		fontWeight: '500',
		color: color?.TEXT
	},
	input: {
		color: color?.TEXT,
		backgroundColor: color?.INPUT_BG,
		padding: 20,
		borderRadius: 50,
		fontSize: 16,
		width: '100%',
	},
	modalHeader: {
		fontSize: 24,
		fontWeight: '500',
		marginBottom: 30,
		marginTop: 10,
		textAlign: 'center',
		color: color?.TEXT,
	},
	modalTxt: {
		fontSize: 16,
		textAlign: 'center',
		color: color?.TEXT,
		marginHorizontal: 20,
		marginTop: -15,
		marginBottom: 30,
	},
	scrollContainer: {
		flex: 1,
		borderRadius: 20,
		backgroundColor: color?.DRAWER,
		padding: 0,
	},
	scrollRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		padding: 20,
	},
	wrapContainer: {
		borderRadius: 20,
		backgroundColor: color?.DRAWER,
		paddingHorizontal: 20,
		paddingTop: 20,
		paddingBottom: 0,
		marginBottom: isIOS ? 50 : 20,
	},
	wrapRow: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingBottom: 20,
		// backgroundColor: '#fff'
	},
	radioBtn: {
		borderWidth: 1,
		borderRadius: 50,
		padding: 10,
		borderColor: color?.BORDER
	},
	bold: {
		fontWeight: '500'
	},
	selectAmount: {
		width: '100%',
		fontSize: 52,
		marginBottom: 5,
		fontWeight: '600',
		padding: 0,
		textAlign: 'center',
	}
})