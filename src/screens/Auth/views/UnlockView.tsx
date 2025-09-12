import { UnlockIcon } from "@comps/Icons";
import Txt from "@comps/Txt";
import { useThemeContext } from "@src/context/Theme";
import { NS } from "@src/i18n";
import { mainColors } from "@styles";
import { getColor } from "@styles/colors";
import { formatSeconds } from "@util";
import { useTranslation } from "react-i18next";
import { Animated, SafeAreaView, Text, View } from "react-native";
import { s, ScaledSheet } from "react-native-size-matters";
import PinDots from "../PinDots";
import PinPad from "../PinPad";

export function UnlockView({
  anim,
  mismatch,
  isLocked,
  remainingLockSec,
  pinInput,
  enterDigit,
}: {
  anim: React.MutableRefObject<Animated.Value>;
  mismatch: boolean;
  isLocked: boolean;
  remainingLockSec: number;
  pinInput: number[];
  enterDigit: (n: number) => void;
}) {
  const { t } = useTranslation([NS.common]);
  const { color, highlight } = useThemeContext();
  return (
    <>
      {isLocked && <View />}
      <View style={styles.lockWrap}>
        <Txt
          txt={t("walletLocked")}
          bold
          styles={[styles.lockTxt, { color: getColor(highlight, color) }]}
        />
        {isLocked && (
          <Text style={styles.lockedTime}>
            {formatSeconds(remainingLockSec)}
          </Text>
        )}
      </View>
      {isLocked ? (
        <View />
      ) : (
        <View style={styles.content}>
          <View style={styles.pinText}>
            {mismatch && (
              <Txt
                txt={t("pinMismatch", { ns: NS.auth })}
                bold
                error
                styles={[styles.mismatch]}
              />
            )}
            {pinInput.length > 0 ? (
              <Animated.View
                style={{ transform: [{ translateX: anim.current }] }}
              >
                <PinDots mismatch={mismatch} input={pinInput} />
              </Animated.View>
            ) : (
              <UnlockIcon
                width={s(40)}
                height={s(40)}
                color={getColor(highlight, color)}
              />
            )}
          </View>
          <View style={styles.pinpadWrap}>
            <PinPad
              pinInput={pinInput}
              confirmInput={[]}
              isConfirm={false}
              mismatch={mismatch}
              handleInput={(val) => void enterDigit(val)}
            />
          </View>
        </View>
      )}
    </>
  );
}

const styles = ScaledSheet.create({
  lockWrap: {
    alignItems: "center",
    marginTop: "30@vs",
  },
  lockTxt: {
    marginTop: "10@vs",
    marginBottom: "20@vs",
  },
  content: {
    width: "100%",
    paddingHorizontal: "20@s",
  },
  mismatch: {
    marginVertical: "10@vs",
  },
  lockedTime: {
    fontSize: "22@vs",
    color: mainColors.WHITE,
  },
  pinText: {
    justifyContent: "center",
    alignItems: "center",
  },
  pinpadWrap: {
    justifyContent: "center",
    alignItems: "center",
    marginBottom: "20@vs",
  },
});
