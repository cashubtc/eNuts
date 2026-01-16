import { useThemeContext } from "@src/context/Theme";
import { NS } from "@src/i18n";
import { mainColors } from "@src/styles";
import { useTranslation } from "react-i18next";
import { TouchableOpacity, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { s, ScaledSheet } from "react-native-size-matters";

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
  const { color } = useThemeContext();
  const { copied, copy } = useCopy();
  const chunk = useAnimatedQr(value, { animate });
  return (
    <TouchableOpacity onPress={() => void copy(value)}>
      <View style={styles.qrWrap}>
        <QRCode
          size={size}
          value={chunk}
          testID="qr-code"
          logoBorderRadius={10}
          logoBackgroundColor={mainColors.WHITE}
          logoMargin={s(6)}
          onError={onError}
        />
      </View>
      <View
        style={[
          styles.txtContainer,
          {
            borderColor: color.BORDER,
            backgroundColor: color.INPUT_BG,
          },
        ]}
      >
        <View style={styles.iconCon}>
          {copied ? <CheckmarkIcon color={mainColors.VALID} /> : <CopyIcon color={color.TEXT} />}
        </View>
        <Txt
          txt={copied ? t("copied") : truncateStr(value, truncateNum ?? 20)}
          styles={[{ color: copied ? mainColors.VALID : color.TEXT }]}
        />
      </View>
    </TouchableOpacity>
  );
}

const styles = ScaledSheet.create({
  qrWrap: {
    borderWidth: "10@s",
    borderColor: mainColors.WHITE,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  txtContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: "15@s",
    borderWidth: 1,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  iconCon: {
    minWidth: "30@s",
  },
});
