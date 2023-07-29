import Txt from '@comps/Txt'
import { StyleSheet } from 'react-native'

interface IUsernameProps {
	displayName?: string,
	username?: string,
	fontSize?: number
}

export default function Username({ displayName, username, fontSize }: IUsernameProps) {
	if (displayName?.length && !username?.length) {
		return <Txt txt={displayName} styles={[styles.username, { fontSize: fontSize || 18 }]} />
	}
	if (!displayName?.length && username?.length) {
		return <Txt txt={username} styles={[styles.username, { fontSize: fontSize || 18 }]} />
	}
	return <Txt txt='Nostrich' styles={[styles.username, { fontSize: fontSize || 18 }]} />
}

const styles = StyleSheet.create({
	username: {
		fontWeight: '500'
	}
})