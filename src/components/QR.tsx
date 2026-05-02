import { NS } from "@src/i18n";
import { useAppThemeTokens } from "@src/styles";
import { useTranslation } from "react-i18next";
import { TouchableOpacity, View, StyleSheet } from "react-native";
import QRCode from "react-native-qrcode-svg";

import useCopy from "./hooks/Copy";
import { CheckmarkIcon, CopyIcon } from "./Icons";
import Txt from "./Txt";
import { useAnimatedQr } from "./hooks/AnimatedQr";

function truncateStr(str: string, len: number): string {
  if (!str) return "";
  if (str.length <= len) return str;
  return str.slice(0, len) + "...";
}

interface QRProps {
  size: number;
  value: string;
  isInvoice?: boolean;
  animate?: boolean;
  truncateNum?: number;
  onError: () => void;
}

export default function QR({ size, value, animate, truncateNum, onError }: QRProps) {
  const { t } = useTranslation([NS.common]);
  const theme = useAppThemeTokens();
  const { copied, copy } = useCopy();
  const chunk = useAnimatedQr(value, { animate });
  return (
    <TouchableOpacity onPress={() => void copy(value)}>
      <View style={[styles.qrWrap, { borderColor: theme.white }]}>
        <QRCode
          size={size}
          value={chunk}
          testID="qr-code"
          logoBorderRadius={10}
          logoBackgroundColor={theme.white}
          logoMargin={6}
          onError={onError}
        />
      </View>
      <View
        style={[
          styles.txtContainer,
          {
            borderColor: theme.border,
            backgroundColor: theme.inputBackground,
          },
        ]}
      >
        <View style={styles.iconCon}>
          {copied ? <CheckmarkIcon color={theme.valid} /> : <CopyIcon color={theme.text} />}
        </View>
        <Txt
          txt={copied ? t("copied") : truncateStr(value, truncateNum ?? 20)}
          styles={[{ color: copied ? theme.valid : theme.text }]}
        />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  qrWrap: {
    borderWidth: 10,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  txtContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 15,
    borderWidth: 1,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  iconCon: {
    minWidth: 30,
  },
});
