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
import SuccessPage from "@screens/Payment/Success";
import SuccessScreen from "@screens/Payment/SuccessScreen";
import QrScannerScreen from "@screens/QRScan/QrScannerScreen";
import RestoreNavigator from "@src/nav/RestoreNavigator";
import SettingsNavigator from "@src/nav/SettingsNavigator";
import { Stack, useAppThemeTokens } from "@styles";
import SendSelectAmountScreen from "@screens/Payment/SendSelectAmount";
import MintSelectAmountScreen from "@screens/Payment/MintSelectAmount";
import MeltInputScreen from "@screens/Payment/MeltInput";
import HistoryNavigator from "@src/nav/HistoryNavigator";

const NativeStack = createNativeStackNavigator<RootStackParamList>();

const animationDuration = 250;

export default function Navigator({ shouldOnboard }: INavigatorProps) {
  const theme = useAppThemeTokens();

  return (
    <Stack
      style={{
        position: "absolute",
        height: "100%",
        width: "100%",
        backgroundColor: theme.background,
      }}
    >
      <NativeStack.Navigator
        initialRouteName={shouldOnboard ? "onboarding" : "dashboard"}
        screenOptions={{
          headerShown: false,
          animation: "fade",
          animationDuration,
          navigationBarColor: theme.background,
        }}
      >
        <NativeStack.Screen
          name="onboarding"
          component={OnboardingScreen}
          options={{
            animation: "default",
            animationDuration,
          }}
        />
        <NativeStack.Screen
          name="dashboard"
          component={Dashboard}
          options={{
            gestureEnabled: false,
          }}
        />
        <NativeStack.Screen name="Settings" component={SettingsNavigator} />
        <NativeStack.Screen name="MeltInput" component={MeltInputScreen} />
        <NativeStack.Screen name="SendSelectAmount" component={SendSelectAmountScreen} />
        <NativeStack.Screen name="MintSelectAmount" component={MintSelectAmountScreen} />
        <NativeStack.Screen name="coinSelection" component={CoinSelectionScreen} />
        <NativeStack.Screen
          name="processing"
          component={ProcessingScreen}
          options={{ gestureEnabled: false }}
        />
        <NativeStack.Screen name="QRScanner" component={QrScannerScreen} />
        <NativeStack.Screen name="processingError" component={ProcessingErrorScreen} />
        <NativeStack.Screen name="mintInvoice" component={InvoiceScreen} />
        {/* sendable token created page */}
        <NativeStack.Screen
          name="encodedToken"
          component={EncodedTokenPage}
          options={{
            animation: "slide_from_bottom",
            animationDuration,
            gestureEnabled: false,
          }}
        />
        <NativeStack.Screen
          name="success"
          component={SuccessPage}
          options={{ gestureEnabled: false }}
        />
        <NativeStack.Screen
          name="successScreen"
          component={SuccessScreen}
          options={{ gestureEnabled: false }}
        />
        <NativeStack.Screen name="Mint" component={MintNavigator} />
        <NativeStack.Screen name="Restore" component={RestoreNavigator} />
        <NativeStack.Screen name="History" component={HistoryNavigator} />
      </NativeStack.Navigator>
    </Stack>
  );
}
