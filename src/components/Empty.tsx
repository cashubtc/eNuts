import { ThemeContext } from '@src/context/Theme'
import { useContext } from 'react'
import { Image, StyleSheet } from 'react-native'

import Txt from './Txt'

export default function Empty() {
	const { color } = useContext(ThemeContext)
	return (
		<>
			<Image
				style={styles.img}
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
				source={require('../../assets/mixed_forest.png')}
			/>
			<Txt
				txt='No transactions yet...'
				styles={[styles.emptyTxt, { color: color.TEXT_SECONDARY }]}
			/>
		</>
	)
}

const styles = StyleSheet.create({
	img: {
		width: '100%',
		height: 350,
		resizeMode: 'contain',
		opacity: .4,
	},
	emptyTxt: {
		fontSize: 20,
		fontWeight: '500',
		textAlign: 'center',
		marginTop: 20,
		opacity: .8,
	}
})
