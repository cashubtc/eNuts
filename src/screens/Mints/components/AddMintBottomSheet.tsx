import React, { forwardRef, useCallback, useState } from "react";
import BottomSheet, {
  BottomSheetScrollView,
  BottomSheetBackdrop,
  BottomSheetTextInput,
} from "@gorhom/bottom-sheet";
import { TouchableOpacity, Text, View, Keyboard } from "react-native";
import { s, ScaledSheet } from "react-native-size-matters";
import { useTranslation } from "react-i18next";

import Button from "@comps/Button";
import { QRIcon } from "@comps/Icons";
import Txt from "@comps/Txt";
import { useThemeContext } from "@src/context/Theme";
import { usePromptContext } from "@src/context/Prompt";
import { NS } from "@src/i18n";
import { globals, highlight as hi } from "@styles";
import { normalizeMintUrl, isErr } from "@util";
import { mintService } from "@src/services/MintService";
import { useKnownMints } from "@src/context/KnownMints";

interface AddMintBottomSheetProps {
  onMintAdded: (mintUrl: string) => void;
  onOpenQRScanner: () => void;
}

const AddMintBottomSheet = forwardRef<BottomSheet, AddMintBottomSheetProps>(
  ({ onMintAdded, onOpenQRScanner }, ref) => {
    const { t } = useTranslation([NS.common]);
    const { color, highlight } = useThemeContext();
    const { openPromptAutoClose } = usePromptContext();
    const { knownMints } = useKnownMints();

    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);

    // Handle sheet changes to dismiss keyboard when closing
    const handleSheetChanges = useCallback((index: number) => {
      if (index === -1) {
        // Sheet is closing, dismiss keyboard
        Keyboard.dismiss();
      }
    }, []);

    const handleMintInput = useCallback(async () => {
      const submitted = normalizeMintUrl(input);

      if (!submitted?.length) {
        return openPromptAutoClose({
          msg: t("invalidUrl", { ns: NS.mints }),
          ms: 1500,
        });
      }

      if (knownMints.find((m) => m.mintUrl === submitted)) {
        return openPromptAutoClose({
          msg: t("mntAlreadyAdded", { ns: NS.mints }),
          ms: 1500,
        });
      }

      setLoading(true);
      try {
        await mintService.addMint(submitted);
        setInput("");
        onMintAdded(submitted);
        // Keyboard will be dismissed automatically via handleSheetChanges when sheet closes
        (ref as React.RefObject<BottomSheet>)?.current?.close();
      } catch (e) {
        openPromptAutoClose({
          msg: isErr(e) ? e.message : t("mintConnectionFail", { ns: NS.mints }),
          ms: 2000,
        });
      } finally {
        setLoading(false);
      }
    }, [input, knownMints, onMintAdded, openPromptAutoClose, ref, t]);

    const handleQRPress = useCallback(() => {
      // Dismiss keyboard before closing sheet and opening QR scanner
      Keyboard.dismiss();
      (ref as React.RefObject<BottomSheet>)?.current?.close();
      setTimeout(() => onOpenQRScanner(), 200);
    }, [onOpenQRScanner, ref]);

    const handleCancel = useCallback(() => {
      setInput("");
      // Keyboard will be dismissed automatically via handleSheetChanges when sheet closes
      (ref as React.RefObject<BottomSheet>)?.current?.close();
    }, [ref]);

    const renderBackdrop = useCallback(
      (props: any) => (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          opacity={0.5}
        />
      ),
      []
    );

    return (
      <BottomSheet
        ref={ref}
        index={-1}
        enablePanDownToClose={true}
        enableDynamicSizing
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
        backdropComponent={renderBackdrop}
        backgroundStyle={{
          backgroundColor: color.BACKGROUND,
        }}
        handleIndicatorStyle={{
          backgroundColor: color.TEXT_SECONDARY,
        }}
        animateOnMount={true}
        onChange={handleSheetChanges}
      >
        <BottomSheetScrollView
          style={[
            styles.scrollContainer,
            { backgroundColor: color.BACKGROUND },
          ]}
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={[globals(color).modalHeader, styles.title]}>
            {t("addNewMint", { ns: NS.mints })}
          </Text>

          <View style={styles.inputContainer}>
            <BottomSheetTextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: color.INPUT_BG,
                  borderColor: color.BORDER,
                  color: color.TEXT,
                },
              ]}
              placeholder="Mint URL"
              placeholderTextColor={color.INPUT_PH}
              selectionColor={hi[highlight]}
              value={input}
              onChangeText={setInput}
              onSubmitEditing={handleMintInput}
              keyboardType="url"
              autoCapitalize="none"
              autoComplete="off"
              autoCorrect={false}
            />
            <TouchableOpacity style={styles.qrButton} onPress={handleQRPress}>
              <QRIcon color={color.INPUT_PH} />
            </TouchableOpacity>
          </View>

          <Button
            txt={t("addMintBtn", { ns: NS.mints })}
            onPress={handleMintInput}
            disabled={!input.length || loading}
            loading={loading}
          />

          <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
            <Txt
              txt={t("cancel")}
              styles={[globals(color, highlight).pressTxt]}
            />
          </TouchableOpacity>
        </BottomSheetScrollView>
      </BottomSheet>
    );
  }
);

const styles = ScaledSheet.create({
  scrollContainer: {
    flex: 1,
  },
  container: {
    paddingHorizontal: "20@s",
    paddingBottom: "20@vs",
  },
  title: {
    marginBottom: "20@vs",
  },
  inputContainer: {
    position: "relative",
    marginBottom: "16@vs",
  },
  textInput: {
    borderWidth: 1,
    borderRadius: "8@s",
    paddingHorizontal: "16@s",
    paddingVertical: "12@vs",
    paddingRight: "50@s",
    fontSize: "16@s",
    minHeight: "44@vs",
  },
  qrButton: {
    position: "absolute",
    right: "12@s",
    top: "12@vs",
    bottom: "12@vs",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: "8@s",
  },
  cancelButton: {
    alignItems: "center",
    marginTop: "12@vs",
    padding: "12@vs",
  },
});

AddMintBottomSheet.displayName = "AddMintBottomSheet";

export default AddMintBottomSheet;
