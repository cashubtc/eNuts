import { ScaledSheet } from 'react-native-size-matters'

import { highlight, type HighlightKey, mainColors, type Theme } from './colors'

export const globalStyles = (color?: Theme, h?: HighlightKey) => ScaledSheet.create({
	container: {
		flex: 1,
		paddingTop: '100@vs',
		backgroundColor: color?.BACKGROUND
	},
	txt: {
		fontSize: '14@vs',
		color: color?.TEXT
	},
	txtBold: {
		fontSize: '14@vs',
		fontWeight: '500',
		color: color?.TEXT
	},
	pressTxt: {
		fontSize: '14@vs',
		fontWeight: '500',
		textAlign: 'center',
		color: h ? highlight[h] : mainColors.BLACK
	},
	navTxt: {
		fontSize: '18@vs',
		fontWeight: '500',
		color: color?.TEXT
	},
	input: {
		color: color?.TEXT,
		backgroundColor: color?.INPUT_BG,
		paddingHorizontal: '18@s',
		paddingVertical: '18@vs',
		borderRadius: 50,
		fontSize: '14@vs',
		width: '100%',
	},
	modalHeader: {
		fontSize: '22@vs',
		fontWeight: '500',
		marginBottom: '30@vs',
		marginTop: '10@vs',
		textAlign: 'center',
		color: color?.TEXT,
	},
	modalTxt: {
		fontSize: '14@vs',
		textAlign: 'center',
		color: color?.TEXT,
		marginHorizontal: 20,
		marginTop: -15,
		marginBottom: '30@vs',
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
		paddingHorizontal: '20@s',
		paddingVertical: '20@vs',
	},
	wrapContainer: {
		borderRadius: 20,
		backgroundColor: color?.DRAWER,
		paddingHorizontal: '20@s',
		paddingTop: '20@vs',
		paddingBottom: 0,
		marginBottom: '25@vs',
	},
	wrapRow: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingBottom: '20@vs',
		// backgroundColor: '#fff'
	},
	radioBtn: {
		borderWidth: 1,
		borderRadius: 50,
		paddingHorizontal: '10@s',
		paddingVertical: '10@vs',
		borderColor: color?.BORDER
	},
	bold: {
		fontWeight: '500'
	},
	selectAmount: {
		width: '100%',
		fontSize: '48@vs',
		marginBottom: '5@vs',
		fontWeight: '600',
		padding: 0,
		textAlign: 'center',
	}
})