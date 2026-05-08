import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HistoryPage from "@screens/History";
import HistoryEntryDetails from "@screens/History/Details";
import type { HistoryStackParamList } from "@src/nav/navTypes";
import { useAppThemeTokens } from "@styles";

const HistoryStack = createNativeStackNavigator<HistoryStackParamList>();

const animationDuration = 250;

export default function HistoryNavigator() {
  const theme = useAppThemeTokens();

  return (
    <HistoryStack.Navigator
      screenOptions={{
        headerShown: false,
        animation: "fade",
        animationDuration,
        navigationBarColor: theme.background,
      }}
    >
      <HistoryStack.Screen name="HistoryMain" component={HistoryPage} />
      <HistoryStack.Screen name="HistoryEntryDetails" component={HistoryEntryDetails} />
    </HistoryStack.Navigator>
  );
}
