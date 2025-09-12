import { TxtButton } from "@comps/Button";
import { ReceiveIcon } from "@comps/Icons";
import Loading from "@comps/Loading";
import Separator from "@comps/Separator";
import type { ITokenInfo } from "@model";
import { useThemeContext } from "@src/context/Theme";
import { NS } from "@src/i18n";
import { globals, mainColors } from "@styles";
import { formatMintUrl, formatSatStr } from "@util";
import { useTranslation } from "react-i18next";
import { Text, TouchableOpacity, View } from "react-native";
import { s, ScaledSheet, vs } from "react-native-size-matters";

import MyModal from ".";

interface ITrustModalProps {
  loading: boolean;
  tokenInfo?: ITokenInfo;
  handleTrustModal: () => void;
  closeModal: () => void;
}

export default function TrustMintModal({
  loading,
  tokenInfo,
  handleTrustModal,
  closeModal,
}: ITrustModalProps) {
  const { t } = useTranslation([NS.common]);
  const { color, highlight } = useThemeContext();

  return (
    <MyModal type="bottom" animation="slide" visible close={closeModal}>
      <Text
        style={[
          globals(color, highlight).modalHeader,
          { marginBottom: vs(15) },
        ]}
      >
        {t("trustMint")}
      </Text>
      {/* token amount */}
      {tokenInfo && (
        <Text style={[styles.mintPrompt, { color: color.TEXT }]}>
          {formatSatStr(tokenInfo.value)} {t("from")}:
        </Text>
      )}
      {/* Show in which mint(s) the tokens are */}
      <View style={styles.tokenMintsView}>
        {tokenInfo?.mints.map((m) => (
          <Text style={[styles.mintPrompt, { color: color.TEXT }]} key={m}>
            {formatMintUrl(m)}
          </Text>
        ))}
      </View>
      <Separator style={[styles.separator]} />
      <TouchableOpacity style={styles.container} onPress={handleTrustModal}>
        <View style={styles.iconContainer}>
          {loading ? (
            <View>
              <Loading size="small" color={mainColors.VALID} />
            </View>
          ) : (
            <ReceiveIcon
              width={s(26)}
              height={s(26)}
              color={mainColors.VALID}
            />
          )}
        </View>
        <View style={styles.txtWrap}>
          <Text style={[styles.actionText, { color: color.TEXT }]}>
            {loading ? t("claiming", { ns: NS.wallet }) : t("trustMintOpt")}
          </Text>
          <Text
            style={[styles.descriptionText, { color: color.TEXT_SECONDARY }]}
          >
            {t("trustHint")}
          </Text>
        </View>
      </TouchableOpacity>
      <TxtButton
        txt={t("cancel")}
        onPress={closeModal}
        style={[styles.TxtButton]}
      />
    </MyModal>
  );
}

const styles = ScaledSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
  },
  iconContainer: {
    minWidth: "11%",
  },
  txtWrap: {
    width: "90%",
  },
  actionText: {
    fontSize: "14@vs",
    fontWeight: "500",
    marginBottom: "4@vs",
  },
  descriptionText: {
    fontSize: "12@vs",
  },
  mintPrompt: {
    fontSize: "12@vs",
    marginBottom: "5@vs",
  },
  tokenMintsView: {
    marginBottom: "30@vs",
  },
  TxtButton: {
    paddingBottom: vs(15),
    paddingTop: vs(25),
  },
  separator: {
    width: "100%",
    marginTop: "10@vs",
    marginBottom: "10@vs",
  },
});
