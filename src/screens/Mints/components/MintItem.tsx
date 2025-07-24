import { ChevronRightIcon, ZapIcon } from "@comps/Icons";
import Separator from "@comps/Separator";
import Txt from "@comps/Txt";
import { formatMintUrl, formatSatStr } from "@util";
import { Text, TouchableOpacity, View } from "react-native";
import { s } from "react-native-size-matters";
import { globals, highlight as hi } from "@styles";
import type { NavigationProp } from "@react-navigation/native";
import type { TRootStackParamList } from "@model/nav";

interface MintItemProps {
    mint: {
        mintUrl: string;
        name?: string;
        balance: number;
    };
    navigation: NavigationProp<TRootStackParamList>;
    isLast: boolean;
    color: any;
    highlight: string;
    hidden: { balance: boolean };
    t: (key: string) => string;
}

const styles = {
    mintNameWrap: {
        flexDirection: "column" as const,
        alignItems: "flex-start" as const,
    },
    mintBal: {
        flexDirection: "row" as const,
        alignItems: "center" as const,
        marginTop: 10,
    },
};

export default function MintItem({
    mint,
    navigation,
    isLast,
    color,
    highlight,
    hidden,
    t,
}: MintItemProps) {
    return (
        <View key={mint.mintUrl}>
            <TouchableOpacity
                style={[globals().wrapRow, { paddingBottom: s(15) }]}
                onPress={() => {
                    navigation.navigate("mintmanagement", {
                        mint: {
                            mintUrl: mint.mintUrl,
                            customName: mint.name,
                        },
                        amount: mint.balance,
                        remainingMints: [],
                    });
                }}
            >
                <View style={styles.mintNameWrap}>
                    <View
                        style={{
                            flexDirection: "row",
                            alignItems: "center",
                        }}
                    >
                        <Txt
                            txt={mint.name || formatMintUrl(mint.mintUrl)}
                            bold
                        />
                    </View>
                    <View style={styles.mintBal}>
                        {mint.balance > 0 && <ZapIcon color={hi[highlight]} />}
                        <Text
                            style={{
                                color:
                                    mint.balance > 0
                                        ? color.TEXT
                                        : color.TEXT_SECONDARY,
                                marginLeft: mint.balance > 0 ? 5 : 0,
                                marginBottom: 5,
                            }}
                        >
                            {hidden.balance
                                ? "****"
                                : mint.balance > 0
                                ? formatSatStr(mint.balance, "compact")
                                : t("emptyMint")}
                        </Text>
                    </View>
                </View>
                <ChevronRightIcon color={color.TEXT} />
            </TouchableOpacity>
            {!isLast && <Separator style={[{ marginBottom: s(15) }]} />}
        </View>
    );
}
