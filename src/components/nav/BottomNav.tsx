import { SettingsIcon, WalletIcon } from "@comps/Icons";
import Txt from "@comps/Txt";
import { isIOS } from "@consts";
import type { TBottomNavProps, TRouteString } from "@model/nav";
import { useThemeContext } from "@src/context/Theme";
import { NS } from "@src/i18n";
import { highlight as hi } from "@styles";
import { useTranslation } from "react-i18next";
import { TouchableOpacity, View } from "react-native";
import { s, ScaledSheet } from "react-native-size-matters";

export default function BottomNav({ navigation, route }: TBottomNavProps) {
    const { t } = useTranslation([NS.topNav]);
    const { color, highlight } = useThemeContext();

    const handleNav = async (routeStr: TRouteString) => {
        navigation.navigate(routeStr);
    };

    const isWalletRelatedScreen = route.name === "dashboard";

    const isSettingsRelatedScreen =
        route.name === "Settings" || route.name === "Display settings";

    return (
        <View
            style={[
                styles.bottomNav,
                {
                    paddingBottom: isIOS ? s(25) : s(5),
                    backgroundColor: color.BACKGROUND,
                },
            ]}
        >
            <TouchableOpacity
                style={styles.navIcon}
                onPress={() => void handleNav("dashboard")}
                disabled={isWalletRelatedScreen}
            >
                <WalletIcon
                    width={s(23)}
                    height={s(23)}
                    color={isWalletRelatedScreen ? hi[highlight] : color.TEXT}
                    active={isWalletRelatedScreen}
                />
                <Txt
                    txt={t("wallet", { ns: NS.bottomNav })}
                    styles={[
                        styles.iconTxt,
                        {
                            color: isWalletRelatedScreen
                                ? hi[highlight]
                                : color.TEXT,
                            fontWeight: isWalletRelatedScreen ? "500" : "400",
                        },
                    ]}
                />
            </TouchableOpacity>
            <TouchableOpacity
                style={styles.navIcon}
                onPress={() => void handleNav("Settings")}
                disabled={isSettingsRelatedScreen}
            >
                <SettingsIcon
                    width={s(22)}
                    height={s(22)}
                    color={isSettingsRelatedScreen ? hi[highlight] : color.TEXT}
                    active={isSettingsRelatedScreen}
                />
                <Txt
                    txt={t("settings")}
                    styles={[
                        styles.iconTxt,
                        {
                            color: isSettingsRelatedScreen
                                ? hi[highlight]
                                : color.TEXT,
                            fontWeight: isSettingsRelatedScreen ? "500" : "400",
                        },
                    ]}
                />
            </TouchableOpacity>
        </View>
    );
}

const styles = ScaledSheet.create({
    bottomNav: {
        position: "absolute",
        left: 0,
        bottom: 0,
        right: 0,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-around",
        paddingTop: "5@s",
    },
    navIcon: {
        minWidth: "100@s",
        alignItems: "center",
        // marginTop: '10@s',
    },
    iconTxt: {
        fontSize: "10@s",
        marginTop: "3@s",
    },
});
