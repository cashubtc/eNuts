import * as Application from 'expo-application'
import { Platform } from 'react-native'

export const headers = { 'x-v': `${Application.applicationName}-${Application.nativeBuildVersion}-${Platform.OS}` }