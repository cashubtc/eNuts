import { ZapIcon } from '@comps/Icons'
import Txt from '@comps/Txt'
import { useThemeContext } from '@src/context/Theme'
import { highlight as hi } from '@styles'
import { TouchableOpacity, View } from 'react-native'
import { s, ScaledSheet, vs } from 'react-native-size-matters'

export default function Lud({ lud16, lud06, onPress }: { lud16?: string, lud06?: string, onPress: (url: string) => void }) {
	const { highlight } = useThemeContext()
	return (
		<>
			{lud16 || lud06 ?
				<View style={styles.infoWrap}>
					<View style={styles.iconWrap}>
						<ZapIcon width={s(20)} height={s(20)} color={hi[highlight]} />
					</View>
					<TouchableOpacity onPress={() => onPress('lightning://')}>
						<Txt
							txt={(lud16 || lud06)?.substring(0, 50) || ''}
							styles={[{ color: hi[highlight], paddingBottom: vs(3) }]}
						/>
					</TouchableOpacity>
				</View>
				:
				null}
		</>
	)
}

const styles = ScaledSheet.create({
	infoWrap: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	iconWrap: {
		minWidth: '25@s',
		marginTop: '3@vs',
	}
})