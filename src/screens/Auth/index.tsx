import { useShakeAnimation } from "@comps/animation/Shake";
import { TxtButton } from "@comps/Button";
import { UnlockIcon } from "@comps/Icons";
import Txt from "@comps/Txt";
import { MinuteInS } from "@consts/time";
import type { TAuthPageProps } from "@model/nav";
import { usePinAuth } from "@src/modules/pin/PinProvider";
import { usePinEntry, type AuthMode } from "./hooks/usePinEntry";
import { useThemeContext } from "@src/context/Theme";
import { NS } from "@src/i18n";
import { store } from "@store";
import { STORE_KEYS } from "@store/consts";
import { highlight as hi, mainColors } from "@styles";
import { getColor } from "@styles/colors";
import { formatSeconds, vib } from "@util";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Animated, SafeAreaView, Text, View } from "react-native";
import { s, ScaledSheet } from "react-native-size-matters";

import PinHint from "./Hint";
import PinDots from "./PinDots";
import PinPad from "./PinPad";
import { UnlockView } from "./views/UnlockView";
import { SetupView } from "./views/SetupView";

// TODO redirect to seed update screen
export default function AuthPage({ navigation, route }: TAuthPageProps) {
  const params = route.params;
  const mode: AuthMode = params.mode;

  const { t } = useTranslation([NS.common]);
  const { anim } = useShakeAnimation();
  const { color, highlight } = useThemeContext();
  const entry = usePinEntry(mode, (res) => {
    if (res.type === "pin_removed") {
      return navigation.navigate("Settings");
    }
    if (res.type === "pin_set") {
      return navigation.navigate(mode === "edit" ? "Settings" : "dashboard");
    }
    if (res.type === "unlocked") {
      return navigation.navigate("dashboard");
    }
    // skipped
    return navigation.navigate(mode === "edit" ? "Settings" : "dashboard");
  });

  const bg = entry.isLocked ? mainColors.ERROR : hi[highlight];

  return (
    <SafeAreaView
      style={[
        styles.container,
        {
          backgroundColor: bg,
          justifyContent:
            entry.phase === "success" ? "center" : "space-between",
        },
      ]}
    >
      {entry.phase === "unlock" && (
        <UnlockView
          anim={anim}
          mismatch={entry.mismatch}
          isLocked={entry.isLocked}
          remainingLockSec={entry.remainingLockSec}
          pinInput={entry.pinInput}
          enterDigit={entry.enterDigit}
        />
      )}
      {(entry.phase === "setup" || entry.phase === "confirm") && (
        <SetupView
          anim={anim}
          mismatch={entry.mismatch}
          pinInput={entry.pinInput}
          confirmInput={entry.confirmInput}
          isConfirm={entry.phase === "confirm"}
          enterDigit={entry.enterDigit}
          skip={() => entry.skip()}
          back={() => entry.backspace()}
        />
      )}
      {entry.phase === "success" && (
        <UnlockIcon
          width={s(40)}
          height={s(40)}
          color={getColor(highlight, color)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = ScaledSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
  },
  // view-level styles moved to subviews
});
