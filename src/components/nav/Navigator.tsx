import type { INavigatorProps, RootStackParamList } from "@model/nav";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Dashboard from "@screens/Dashboard";
import MintNavigator from "@src/nav/MintNavigator";
import OnboardingScreen from "@screens/Onboarding";
import ProcessingScreen from "@screens/Payment/Processing";
import ProcessingErrorScreen from "@screens/Payment/ProcessingError";
import InvoiceScreen from "@screens/Payment/Receive/Invoice";
import CoinSelectionScreen from "@screens/Payment/Send/CoinSelection";
import EncodedTokenPage from "@screens/Payment/Send/EncodedToken";
import SelectMintToSwapToScreen from "@screens/Payment/Send/SelectMintToSwapTo";
import SuccessPage from "@screens/Payment/Success";
import QrScannerScreen from "@screens/QRScan/QrScannerScreen";
import RestoreNavigator from "@src/nav/RestoreNavigator";
import SettingsNavigator from "@src/nav/SettingsNavigator";
import { useThemeContext } from "@src/context/Theme";
import { View } from "react-native";
import SendSelectAmountScreen from "@screens/Payment/SendSelectAmount";
import MintSelectAmountScreen from "@screens/Payment/MintSelectAmount";
import MeltInputScreen from "@screens/Payment/MeltInput";
import MeltConfirmationScreen from "@screens/Payment/MeltConfirmation";
import HistoryNavigator from "@src/nav/HistoryNavigator";
import MeltLnAddressScreen from "@screens/Payment/MeltLnAddress";

const Stack = createNativeStackNavigator<RootStackParamList>();

const animationDuration = 250;

export default function Navigator({ shouldOnboard }: INavigatorProps) {
  const { color } = useThemeContext();

  return (
    <View
      style={{
        position: "absolute",
        height: "100%",
        width: "100%",
        backgroundColor: color.BACKGROUND,
      }}
    >
      <Stack.Navigator
        initialRouteName={shouldOnboard ? "onboarding" : "dashboard"}
        screenOptions={{
          headerShown: false,
          animation: "fade",
          animationDuration,
          navigationBarColor: color.BACKGROUND,
        }}
      >
        <Stack.Screen
          name="onboarding"
          component={OnboardingScreen}
          options={{
            animation: "default",
            animationDuration,
          }}
        />
        <Stack.Screen
          name="dashboard"
          component={Dashboard}
          options={{
            gestureEnabled: false,
          }}
        />
        <Stack.Screen name="Settings" component={SettingsNavigator} />
        <Stack.Screen
          name="selectMintToSwapTo"
          component={SelectMintToSwapToScreen}
        />
        <Stack.Screen name="MeltInput" component={MeltInputScreen} />
        <Stack.Screen name="MeltLnAddress" component={MeltLnAddressScreen} />
        <Stack.Screen
          name="MeltConfirmation"
          component={MeltConfirmationScreen}
        />
        <Stack.Screen
          name="SendSelectAmount"
          component={SendSelectAmountScreen}
        />
        <Stack.Screen
          name="MintSelectAmount"
          component={MintSelectAmountScreen}
        />
        <Stack.Screen name="coinSelection" component={CoinSelectionScreen} />
        <Stack.Screen
          name="processing"
          component={ProcessingScreen}
          options={{ gestureEnabled: false }}
        />
        <Stack.Screen name="QRScanner" component={QrScannerScreen} />
        <Stack.Screen
          name="processingError"
          component={ProcessingErrorScreen}
        />
        <Stack.Screen name="mintInvoice" component={InvoiceScreen} />
        {/* sendable token created page */}
        <Stack.Screen
          name="encodedToken"
          component={EncodedTokenPage}
          options={{
            animation: "slide_from_bottom",
            animationDuration,
            gestureEnabled: false,
          }}
        />
        <Stack.Screen
          name="success"
          component={SuccessPage}
          options={{ gestureEnabled: false }}
        />
        <Stack.Screen name="Mint" component={MintNavigator} />
        <Stack.Screen name="Restore" component={RestoreNavigator} />
        <Stack.Screen name="History" component={HistoryNavigator} />
      </Stack.Navigator>
    </View>
  );
}
