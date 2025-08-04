import Button, { TxtButton } from "@comps/Button";
import {
    AboutIcon,
    BackupIcon,
    GithubIcon,
    HistoryIcon,
    LanguageIcon,
    LockIcon,
    MintBoardIcon,
    PaletteIcon,
    SettingsIcon,
} from "@comps/Icons";
import { BottomModal } from "@modal/Question";
import { ZapModal } from "@modal/Zap";
import type { TSettingsPageProps } from "@model/nav";
import BottomNav from "@nav/BottomNav";
import Screen from "@comps/Screen";
import Txt from "@comps/Txt";
import { usePromptContext } from "@src/context/Prompt";
import { useThemeContext } from "@src/context/Theme";
import { NS } from "@src/i18n";
import { dropAllData } from "@src/storage/dev";
import { appVersion } from "@src/consts/env";
import { secureStore, store } from "@store";
import { SECURESTORE_KEY, STORE_KEYS } from "@store/consts";
import { globals } from "@styles";
import { Image } from "expo-image";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, Text, View } from "react-native";
import { s, vs } from "react-native-size-matters";

import MenuItem from "./MenuItem";

export default function Settings({ navigation, route }: TSettingsPageProps) {
    const { t } = useTranslation([NS.common]);
    const { color, highlight } = useThemeContext();
    const { openPromptAutoClose } = usePromptContext();
    const [zapModal, setZapModal] = useState(false);
    const [confirmReset, setConfirmReset] = useState(false);
    const [pin, setPin] = useState<string | null>(null);
    const [hasSeed, setHasSeed] = useState(false);
    const init = async () => {
        const pinHash = await secureStore.get(SECURESTORE_KEY);
        const seed = await store.get(STORE_KEYS.hasSeed);
        setPin(pinHash === null ? "" : pinHash);
        setHasSeed(!!seed);
    };

    useEffect(() => {
        void init();
    }, []);

    const handleReset = async () => {
        try {
            await dropAllData();
        } catch {
            /* ignore */
        }
        setConfirmReset(false);
    };

    return (
        <Screen screenName={t("settings", { ns: NS.topNav })} noIcons>
            <ScrollView alwaysBounceVertical={false}>
                {/* MINT */}
                <View
                    style={[
                        globals(color).wrapContainer,
                        { marginBottom: vs(20) },
                    ]}
                >
                    <MenuItem
                        header={t("mint")}
                        txt={t("mintSettings", { ns: NS.topNav })}
                        icon={<MintBoardIcon color={color.TEXT} />}
                        onPress={() => navigation.navigate("mints")}
                    />
                </View>
                {/* WALLET */}
                <View
                    style={[
                        globals(color).wrapContainer,
                        { marginBottom: vs(20) },
                    ]}
                >
                    <MenuItem
                        header={t("wallet")}
                        txt={t("history", { ns: NS.topNav })}
                        icon={<HistoryIcon color={color.TEXT} />}
                        onPress={() => navigation.navigate("history")}
                    />
                </View>
                {/* PREFERENCES */}
                <View
                    style={[
                        globals(color).wrapContainer,
                        { marginBottom: vs(20) },
                    ]}
                >
                    <MenuItem
                        header={t("preferences")}
                        txt={t("Display")}
                        icon={<PaletteIcon color={color.TEXT} />}
                        onPress={() => navigation.navigate("Display settings")}
                    />
                    <MenuItem
                        txt={t("Language")}
                        icon={<LanguageIcon color={color.TEXT} />}
                        onPress={() => navigation.navigate("Language settings")}
                    />
                    <MenuItem
                        txt={t("Advanced")}
                        icon={<SettingsIcon color={color.TEXT} />}
                        onPress={() => navigation.navigate("Advanced settings")}
                    />
                </View>
                {/* SECURITY */}
                <View
                    style={[
                        globals(color).wrapContainer,
                        { marginBottom: vs(20) },
                    ]}
                >
                    <MenuItem
                        header={t("security")}
                        txt={t("authPin")}
                        icon={<LockIcon color={color.TEXT} />}
                        onPress={() =>
                            navigation.navigate("auth", {
                                pinHash: pin || "",
                                shouldEdit: true,
                            })
                        }
                    />
                    {hasSeed && (
                        <MenuItem
                            txt={t("backupSeed")}
                            icon={<BackupIcon color={color.TEXT} />}
                            onPress={() =>
                                navigation.navigate("Seed", { hasSeed })
                            }
                        />
                    )}
                </View>
                {/* ABOUT */}
                <View
                    style={[
                        globals(color).wrapContainer,
                        { marginBottom: vs(20) },
                    ]}
                >
                    <MenuItem
                        header={t("about")}
                        txt={t("Github")}
                        icon={<GithubIcon color={color.TEXT} />}
                        onPress={() => {
                            setZapModal(true);
                        }}
                    />
                </View>
                {/* DEV */}
                {__DEV__ && (
                    <View
                        style={[
                            globals(color).wrapContainer,
                            { marginBottom: vs(20) },
                        ]}
                    >
                        <MenuItem
                            header="DEV"
                            txt={t("factoryReset")}
                            icon={<Text>💥💥💥</Text>}
                            onPress={() => setConfirmReset(true)}
                        />
                        <MenuItem
                            txt="QR Scanner Test"
                            icon={<Text>📱</Text>}
                            onPress={() =>
                                navigation.navigate("QR Scanner Test")
                            }
                        />
                        <MenuItem
                            txt="Proofs Debug"
                            icon={<Text>🐛</Text>}
                            onPress={() => navigation.navigate("Proofs Debug")}
                        />
                    </View>
                )}
                <Txt txt={appVersion} bold center />
                <Txt
                    txt={
                        "No geese were harmed in the making of this software 🪿"
                    }
                    center
                    styles={[{ marginBottom: s(100), fontSize: s(12) }]}
                />
            </ScrollView>
            <BottomNav navigation={navigation} route={route} />
            <ZapModal visible={zapModal} close={() => setZapModal(false)} />
            {/* confirm factory reset */}
            <BottomModal
                header={t("resetQ")}
                txt={t("delHistoryTxt")}
                visible={confirmReset}
                confirmTxt={t("yes")}
                confirmFn={() => void handleReset()}
                cancelTxt={t("no")}
                cancelFn={() => setConfirmReset(false)}
            />
        </Screen>
    );
}
