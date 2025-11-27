import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Settings from "@screens/Settings";
import DisplaySettings from "@screens/Settings/Display";
import LanguageSettings from "@screens/Settings/Language";
import CurrencySettings from "@screens/Settings/Currency";
import NfcSettings from "@screens/Settings/NfcSettings";
import ViewMnemonic from "@screens/Settings/ViewMnemonic";
import { useThemeContext } from "@src/context/Theme";
import { SettingsStackParamList } from "./navTypes";

const SettingsStack = createNativeStackNavigator<SettingsStackParamList>();

const animationDuration = 250;

export default function SettingsNavigator() {
  const { color } = useThemeContext();

  return (
    <SettingsStack.Navigator
      screenOptions={{
        headerShown: false,
        animation: "fade",
        animationDuration,
        navigationBarColor: color.BACKGROUND,
      }}
    >
      <SettingsStack.Screen name="SettingsMain" component={Settings} />
      <SettingsStack.Screen
        name="Display settings"
        component={DisplaySettings}
      />
      <SettingsStack.Screen
        name="Language settings"
        component={LanguageSettings}
      />
      <SettingsStack.Screen
        name="Currency settings"
        component={CurrencySettings}
      />
      <SettingsStack.Screen name="NFC settings" component={NfcSettings} />
      <SettingsStack.Screen name="View mnemonic" component={ViewMnemonic} />
    </SettingsStack.Navigator>
  );
}
