import { View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { s, ScaledSheet } from 'react-native-size-matters'

import Button from './Button'

interface IActionBtnsProps {
	topBtnTxt: string
	topBtnAction: () => void
	bottomBtnTxt: string
	bottomBtnAction: () => void
	ontopOfNav?: boolean
	absolutePos?: boolean
	loading?: boolean
	topIcon?: React.ReactNode
	bottomIcon?: React.ReactNode
}

export default function ActionButtons({
	topBtnTxt,
	topBtnAction,
	bottomBtnTxt,
	bottomBtnAction,
	ontopOfNav,
	absolutePos,
	loading,
	topIcon,
	bottomIcon
}: IActionBtnsProps) {
	const insets = useSafeAreaInsets()
	return (
		<View
			style={[
				styles.actionWrap,
				ontopOfNav ? styles.ontopOfNav : {},
				absolutePos ? { position: 'absolute', right: 0, left: 0, padding: s(20), bottom: insets.bottom } : {},
			]}
		>
			<Button
				loading={loading}
				txt={topBtnTxt}
				onPress={topBtnAction}
				icon={topIcon}
			/>
			<View style={{ marginVertical: s(10) }} />
			<Button
				txt={bottomBtnTxt}
				outlined
				onPress={bottomBtnAction}
				icon={bottomIcon}
			/>
		</View>
	)
}

const styles = ScaledSheet.create({
	actionWrap: {
		width: '100%',
		alignItems: 'center'
	},
	ontopOfNav: {
		paddingLeft: '20@s',
		paddingRight: '20@s',
		marginBottom: '60@s',
	},
})