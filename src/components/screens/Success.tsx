import Success from '@comps/Success'
import type { TSuccessPageProps } from '@model/nav'
import { ThemeContext } from '@src/context/Theme'
import { highlight as hi } from '@styles'
import { useContext } from 'react'
import { StyleSheet, View } from 'react-native'

export default function SuccessPage({ navigation, route }: TSuccessPageProps) {
	const { highlight } = useContext(ThemeContext)
	return (
		<View style={[styles.container, { backgroundColor: hi[highlight] }]}>
			<Success
				amount={route.params.amount || 0}
				memo={route.params.memo}
				fee={route.params.fee}
				mints={route.params.mints}
				nav={navigation}
			/>
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'space-between',
		padding: 15,
	},
})
