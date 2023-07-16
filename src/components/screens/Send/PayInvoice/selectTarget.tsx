import { ChevronRightIcon } from '@comps/Icons'
import Separator from '@comps/Separator'
import Txt from '@comps/Txt'
import type { TSelectTargetPageProps } from '@model/nav'
import TopNav from '@nav/TopNav'
import { ThemeContext } from '@src/context/Theme'
import { globals } from '@styles'
import { useContext } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, TouchableOpacity, View } from 'react-native'

export default function SelectTargetScreen({ route }: TSelectTargetPageProps) {
	const { t } = useTranslation(['mints'])
	const { color } = useContext(ThemeContext)
	return (
		<View style={[styles.container, { backgroundColor: color.BACKGROUND }]}>
			<TopNav screenName={t('cashOut', { ns: 'common' })} withBackBtn />
			<Txt styles={[styles.hint]} txt={t('chooseTarget')} />
			<View style={[globals(color).wrapContainer, styles.targets]}>
				<Target
					txt={t('addressBook', { ns: 'topNav' })}
					hint={t('meltAddressbookHint')}
					onPress={() => {
						//
					}}
					hasSeparator
				/>
				<Target
					txt={t('inputField')}
					hint={t('meltInputHint')}
					onPress={() => {
						//
					}}
					hasSeparator
				/>
				<Target
					txt={t('scanQR')}
					hint={t('meltScanQRHint')}
					onPress={() => {
						//
					}}
					hasSeparator
				/>
				<Target
					txt={t('intermintSwap')}
					hint={t('meltSwapHint')}
					onPress={() => {
						//
					}}
				/>
			</View>
		</View>
	)
}

interface ITargetProps {
	txt: string
	hint: string
	onPress: () => void
	hasSeparator?: boolean
}

function Target({ txt, hint, onPress, hasSeparator }: ITargetProps) {
	const { color } = useContext(ThemeContext)
	return (
		<>
			<TouchableOpacity style={styles.target} onPress={onPress}>
				<View>
					<Txt styles={[{ fontWeight: '500' }]} txt={txt} />
					<Txt styles={[styles.targetHint, { color: color.TEXT_SECONDARY }]} txt={hint} />
				</View>
				<ChevronRightIcon color={color.TEXT} />
			</TouchableOpacity>
			{hasSeparator && <Separator style={[styles.separator]} />}
		</>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		paddingTop: 110,
	},
	hint: {
		paddingHorizontal: 20,
		marginBottom: 20,
	},
	targets: {
		paddingVertical: 20,
	},
	target: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	targetHint: {
		fontSize: 12,
		maxWidth: '95%'
	},
	separator: {
		marginVertical: 10,
	},
})