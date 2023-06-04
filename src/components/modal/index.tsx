import { ThemeContext } from '@src/context/Theme'
import { highlight as hi,TPref } from '@styles/colors'
import { useContext } from 'react'
import { Modal, StyleSheet, View } from 'react-native'

interface IMyModalProps {
	type: 'bottom' | 'question' | 'success' | 'error' | 'invoiceAmount'
	animation?: 'slide' | 'fade' | 'none'
	visible: boolean
	success?: boolean
	children: React.ReactNode
}

export default function MyModal({ type, animation, visible, success, children }: IMyModalProps) {

	const { color, highlight } = useContext(ThemeContext)

	const getCorrectStyle = () => {
		if (type === 'bottom') { return styles(color, highlight).bottomView }
		if (type === 'question' || type === 'success' || type === 'error' || type === 'invoiceAmount') {
			return styles(color, highlight).centeredView
		}
	}

	const getViewStyle = () => {
		if (type === 'bottom') { return { ...styles(color, highlight).common, ...styles(color, highlight).modalView } }
		if (type === 'question') { return { ...styles(color, highlight).common, ...styles(color, highlight).centeredModalView } }
		if (type === 'success') { return { ...styles(color, highlight).common, ...styles(color, highlight).successModalView } }
		if (type === 'error') { return { ...styles(color, highlight).common, ...styles(color, highlight).promptModalView } }
		if (type === 'invoiceAmount') { return { ...styles(color, highlight).common, ...styles(color, highlight).invoiceAmountModalView } }
	}

	return (
		visible ?
			<View style={styles(color, highlight).modalParent}>
				<Modal
					animationType={animation}
					transparent={true}
					visible={visible}
				>
					<View style={getCorrectStyle()}>
						<View style={[getViewStyle(), success ? { backgroundColor: hi[highlight] } : {}]}>
							{children}
						</View>
					</View>
				</Modal>
			</View>
			: null
	)
}

const styles = (pref: TPref, h: string) => StyleSheet.create({
	modalParent: {
		position: 'absolute',
		top: 0,
		right: 0,
		bottom: 0,
		left: 0,
		backgroundColor: 'rgba(0, 0, 0, .5)',
	},
	common: {
		backgroundColor: pref.BACKGROUND,
		alignItems: 'center',
		shadowColor: '#000',
		shadowOffset: {
			width: 0,
			height: 2,
		},
		shadowOpacity: 0.25,
		shadowRadius: 4,
		elevation: 5,
	},
	// Bottom Modal
	bottomView: {
		flex: 1,
		justifyContent: 'flex-end',
		alignItems: 'center',
	},
	modalView: {
		width: '100%',
		borderTopLeftRadius: 20,
		borderTopRightRadius: 20,
		paddingTop: 50,
		paddingBottom: 50,
		paddingRight: 20,
		paddingLeft: 20,
	},
	// Centered Modal
	centeredView: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	centeredModalView: {
		width: '90%',
		borderRadius: 20,
		borderWidth: 3,
		borderColor: hi[h],
		paddingTop: 50,
		paddingBottom: 50,
		paddingRight: 20,
		paddingLeft: 20,
	},
	// Success Modal
	successModalView: {
		width: '90%',
		borderRadius: 20,
	},
	promptModalView: {
		width: '90%',
		borderRadius: 20,
		borderWidth: 3,
		borderColor: hi[h],
		padding: 20,
	},
	invoiceAmountModalView: {
		width: '100%',
		height: '100%',
		padding: 20,
		justifyContent: 'space-between',
	},
})