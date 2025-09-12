import Txt from "@comps/Txt";
import { useThemeContext } from "@src/context/Theme";
import { NS } from "@src/i18n";
import { mainColors } from "@styles";
import { getColor } from "@styles/colors";
import { useTranslation } from "react-i18next";
import { Animated, View } from "react-native";
import { ScaledSheet } from "react-native-size-matters";
import PinHint from "../Hint";
import PinDots from "../PinDots";
import PinPad from "../PinPad";
import { TxtButton } from "@comps/Button";

export function SetupView({
  anim,
  mismatch,
  pinInput,
  confirmInput,
  isConfirm,
  enterDigit,
  skip,
  back,
}: {
  anim: React.MutableRefObject<Animated.Value>;
  mismatch: boolean;
  pinInput: number[];
  confirmInput: number[];
  isConfirm: boolean;
  enterDigit: (n: number) => void;
  skip: () => void;
  back: () => void;
}) {
  const { t } = useTranslation([NS.common]);
  const { color, highlight } = useThemeContext();
  return (
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
        {pinInput.length > 0 || confirmInput.length > 0 ? (
          <Animated.View style={{ transform: [{ translateX: anim.current }] }}>
            <PinDots
              mismatch={mismatch}
              input={isConfirm ? confirmInput : pinInput}
            />
          </Animated.View>
        ) : (
          <PinHint confirm={isConfirm} login={false} />
        )}
      </View>
      <View style={styles.pinpadWrap}>
        <PinPad
          pinInput={pinInput}
          confirmInput={confirmInput}
          isConfirm={isConfirm}
          mismatch={mismatch}
          handleInput={(val) => void enterDigit(val)}
        />
        <TxtButton
          txt={isConfirm ? t("back") : t("skip")}
          onPress={() => (isConfirm ? back() : skip())}
          style={[styles.skip]}
          txtColor={mainColors.WHITE}
        />
      </View>
    </View>
  );
}

const styles = ScaledSheet.create({
  content: {
    width: "100%",
    paddingHorizontal: "20@s",
  },
  mismatch: {
    marginVertical: "10@vs",
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
  skip: {
    paddingTop: "20@vs",
    paddingBottom: "10@vs",
  },
});
