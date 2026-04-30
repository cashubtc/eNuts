import Button, { TxtButton } from "@comps/Button";
import Loading from "@comps/Loading";
import Screen from "@comps/Screen";
import Txt from "@comps/Txt";
import TxtInput from "@comps/TxtInput";
import { KeyIcon, PlusIcon, RefreshIcon, TrashbinIcon } from "@comps/Icons";
import type { TNpcSettingsPageProps } from "@src/nav/navTypes";
import { useBalanceContext } from "@src/context/Balance";
import { useCurrencyContext } from "@src/context/Currency";
import { useNpcContext, type INpcAccount } from "@src/context/Npc";
import { usePromptContext } from "@src/context/Prompt";
import { useThemeContext } from "@src/context/Theme";
import { NS } from "@src/i18n";
import { isErr } from "@util";
import { globals, highlight as hi, mainColors } from "@styles";
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import * as Clipboard from "expo-clipboard";
import { useRef, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { s, ScaledSheet } from "react-native-size-matters";

interface INpcAccountCardProps {
  account: INpcAccount;
  busy: boolean;
  onCopy: (value: string) => void;
  onRemove: (accountId: string) => void;
  onSaveUsername: (accountId: string, username: string) => void;
  onSync: (accountId: string) => void;
}

function NpcAccountCard({
  account,
  busy,
  onCopy,
  onRemove,
  onSaveUsername,
  onSync,
}: INpcAccountCardProps) {
  const { t } = useTranslation([NS.common]);
  const { color, highlight } = useThemeContext();
  const [username, setUsername] = useState(account.username || "");

  useEffect(() => {
    setUsername(account.username || "");
  }, [account.username]);

  const hasUsernameInput = username.trim().length > 0;

  return (
    <View style={[globals(color).wrapContainer, styles.accountCard]}>
      <View style={styles.accountHeader}>
        <View style={styles.accountTitleWrap}>
          <Txt txt={account.label} bold />
          {account.isDefault && (
            <View style={[styles.badge, { backgroundColor: hi[highlight] }]}>
              <Txt
                txt={t("npcDefaultAccount", { defaultValue: "Default" })}
                styles={[styles.badgeText, { color: color.BACKGROUND }]}
              />
            </View>
          )}
        </View>
        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => onSync(account.id)}
          disabled={busy}
          style={[styles.iconButton, { borderColor: color.BORDER }]}
        >
          {busy ? <Loading size={s(16)} /> : <RefreshIcon width={s(18)} color={hi[highlight]} />}
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        accessibilityRole="button"
        onPress={() => onCopy(account.address)}
        style={[styles.addressBox, { borderColor: color.BORDER }]}
      >
        <Txt txt={account.address} styles={[styles.addressText]} />
        <Txt
          txt={account.username ? account.npub : t("npcTapToCopy", { defaultValue: "Tap to copy" })}
          styles={[styles.mutedText, { color: color.TEXT_SECONDARY }]}
        />
      </TouchableOpacity>

      <View style={styles.fieldBlock}>
        <Txt
          txt={t("npcUsernameLabel", { defaultValue: "Custom username" })}
          styles={[styles.label, { color: color.TEXT_SECONDARY }]}
        />
        <TxtInput
          placeholder={t("npcUsernamePlaceholder", { defaultValue: "optional username" })}
          value={username}
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={setUsername}
        />
      </View>

      <View style={styles.actions}>
        <View style={styles.primaryAction}>
          <Button
            txt={t("npcPurchaseUsername", { defaultValue: "Save username" })}
            onPress={() => onSaveUsername(account.id, username)}
            disabled={!hasUsernameInput || busy}
            loading={busy && hasUsernameInput}
            size="small"
          />
        </View>
        {!account.isDefault && (
          <TxtButton
            txt={t("remove", { defaultValue: "Remove" })}
            onPress={() => onRemove(account.id)}
            disabled={busy}
            txtColor={mainColors.ERROR}
            icon={<TrashbinIcon width={s(18)} color={mainColors.ERROR} />}
          />
        )}
      </View>
    </View>
  );
}

export default function NpcSettings({ navigation }: TNpcSettingsPageProps) {
  const { t } = useTranslation([NS.common]);
  const { color, highlight } = useThemeContext();
  const insets = useSafeAreaInsets();
  const { openPromptAutoClose } = usePromptContext();
  const { balances } = useBalanceContext();
  const { formatAmount } = useCurrencyContext();
  const addAccountSheetRef = useRef<TrueSheet>(null);
  const [privateKeyInput, setPrivateKeyInput] = useState("");
  const {
    accounts,
    busyAccountId,
    deriveAccount,
    importPrivateKeyAccount,
    isLoading,
    removeAccount,
    saveUsername,
    syncAccount,
    syncAll,
  } = useNpcContext();

  const balance = useMemo(
    () => formatAmount(balances.total.total),
    [balances.total.total, formatAmount],
  );

  const runAction = (action: () => Promise<void>, success?: string) => {
    void action()
      .then(() => {
        if (success) {
          openPromptAutoClose({ msg: success });
        }
      })
      .catch((err: unknown) => {
        openPromptAutoClose({
          msg: isErr(err) ? err.message : t("tryLater"),
        });
      });
  };

  const handleCopy = (value: string) => {
    void Clipboard.setStringAsync(value).then(() =>
      openPromptAutoClose({
        msg: t("copied"),
      }),
    );
  };

  const handleOpenAddAccountSheet = () => {
    setPrivateKeyInput("");
    void addAccountSheetRef.current?.present();
  };

  const handleDeriveAccount = () => {
    void addAccountSheetRef.current?.dismiss();
    runAction(
      deriveAccount,
      t("npcAccountAdded", {
        defaultValue: "NPC account added",
      }),
    );
  };

  const handleImportPrivateKey = () => {
    const input = privateKeyInput.trim();
    if (!input) {
      openPromptAutoClose({
        msg: t("npcPrivateKeyRequired", {
          defaultValue: "Enter an nsec or hex private key.",
        }),
      });
      return;
    }

    setPrivateKeyInput("");
    void addAccountSheetRef.current?.dismiss();
    runAction(
      () => importPrivateKeyAccount(input),
      t("npcAccountAdded", {
        defaultValue: "NPC account added",
      }),
    );
  };

  return (
    <Screen
      screenName={t("npcSettingsTitle", {
        ns: NS.topNav,
        defaultValue: "Lightning address",
      })}
      withBackBtn
      handlePress={() => navigation.goBack()}
      rightAction={
        <TouchableOpacity
          accessibilityRole="button"
          onPress={handleOpenAddAccountSheet}
          disabled={busyAccountId !== null}
          style={[
            styles.headerButton,
            {
              backgroundColor: hi[highlight],
              opacity: busyAccountId !== null ? 0.5 : 1,
            },
          ]}
        >
          <PlusIcon width={s(20)} color={color.BACKGROUND} />
        </TouchableOpacity>
      }
    >
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <Loading />
        </View>
      ) : (
        <ScrollView alwaysBounceVertical={false}>
          <View style={[globals(color).wrapContainer, styles.summaryCard]}>
            <View style={styles.summaryHeader}>
              <View style={styles.summaryText}>
                <Txt
                  txt={t("npcReceiveTitle", { defaultValue: "NPC Lightning addresses" })}
                  bold
                  styles={[styles.summaryTitle]}
                />
                <Txt
                  txt={t("npcReceiveHint", {
                    defaultValue: "Receive Lightning payments into your local Cashu wallet.",
                  })}
                  styles={[styles.mutedText, { color: color.TEXT_SECONDARY }]}
                />
              </View>
              <View style={[styles.balancePill, { borderColor: hi[highlight] }]}>
                <Txt
                  txt={`${balance.formatted} ${balance.symbol}`}
                  styles={[styles.balanceText, { color: hi[highlight] }]}
                />
              </View>
            </View>
            <View style={styles.summaryActions}>
              <View style={styles.summaryAction}>
                <Button
                  txt={t("npcSyncAll", { defaultValue: "Sync all" })}
                  onPress={() =>
                    runAction(syncAll, t("npcSynced", { defaultValue: "NPC accounts synced" }))
                  }
                  loading={busyAccountId === "all"}
                  disabled={busyAccountId !== null && busyAccountId !== "all"}
                  size="small"
                  outlined
                />
              </View>
            </View>
          </View>

          {accounts.map((account) => (
            <NpcAccountCard
              key={account.id}
              account={account}
              busy={busyAccountId === account.id}
              onCopy={handleCopy}
              onRemove={(accountId) =>
                runAction(
                  () => removeAccount(accountId),
                  t("npcAccountRemoved", { defaultValue: "NPC account removed" }),
                )
              }
              onSaveUsername={(accountId, username) =>
                runAction(
                  () => saveUsername(accountId, username),
                  t("npcUsernameSaved", { defaultValue: "Username saved" }),
                )
              }
              onSync={(accountId) =>
                runAction(
                  () => syncAccount(accountId),
                  t("npcSynced", { defaultValue: "NPC account synced" }),
                )
              }
            />
          ))}
        </ScrollView>
      )}
      <TrueSheet
        ref={addAccountSheetRef}
        detents={["auto"]}
        backgroundColor={color.BACKGROUND}
        cornerRadius={s(26)}
        grabberOptions={{ color: color.TEXT_SECONDARY }}
        onDidDismiss={() => setPrivateKeyInput("")}
      >
        <ScrollView
          style={{ backgroundColor: color.BACKGROUND }}
          contentContainerStyle={[
            styles.sheetContainer,
            { paddingBottom: Math.max(insets.bottom, s(22)) },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.sheetHeader}>
            <View style={[styles.sheetIcon, { backgroundColor: hi[highlight] }]}>
              <KeyIcon width={s(22)} color={color.BACKGROUND} />
            </View>
            <View style={styles.sheetTitleBlock}>
              <Txt
                txt={t("npcAddAccountTitle", { defaultValue: "Add NPC account" })}
                bold
                styles={[styles.sheetTitle]}
              />
              <Txt
                txt={t("npcAddAccountHint", {
                  defaultValue: "Import an existing Nostr key or derive a new key from your seed.",
                })}
                styles={[styles.mutedText, { color: color.TEXT_SECONDARY }]}
              />
            </View>
          </View>

          <View style={styles.fieldBlock}>
            <Txt
              txt={t("npcPrivateKeyLabel", { defaultValue: "Private key" })}
              styles={[styles.label, { color: color.TEXT_SECONDARY }]}
            />
            <TxtInput
              placeholder={t("npcPrivateKeyPlaceholder", { defaultValue: "nsec or hex" })}
              value={privateKeyInput}
              autoCapitalize="none"
              autoCorrect={false}
              onChangeText={setPrivateKeyInput}
            />
            <Txt
              txt={t("npcPrivateKeyHint", {
                defaultValue: "Imported keys are stored in secure storage on this device.",
              })}
              styles={[styles.mutedText, { color: color.TEXT_SECONDARY }]}
            />
          </View>

          <View style={styles.sheetActions}>
            <Button
              txt={t("npcImportPrivateKey", { defaultValue: "Import private key" })}
              onPress={handleImportPrivateKey}
              disabled={busyAccountId !== null}
              size="small"
            />
            <Button
              txt={t("npcDeriveAccount", { defaultValue: "Derive new key" })}
              onPress={handleDeriveAccount}
              disabled={busyAccountId !== null}
              size="small"
              outlined
            />
          </View>
        </ScrollView>
      </TrueSheet>
    </Screen>
  );
}

const styles = ScaledSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryCard: {
    paddingBottom: "20@vs",
  },
  summaryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: "12@s",
  },
  summaryText: {
    flex: 1,
  },
  summaryTitle: {
    marginBottom: "6@vs",
  },
  summaryActions: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: "18@vs",
    gap: "12@s",
  },
  summaryAction: {
    flex: 1,
  },
  headerButton: {
    width: "44@s",
    height: "44@s",
    borderRadius: "22@s",
    alignItems: "center",
    justifyContent: "center",
  },
  balancePill: {
    borderWidth: 1,
    borderRadius: "16@s",
    paddingHorizontal: "10@s",
    paddingVertical: "7@vs",
    alignSelf: "flex-start",
  },
  balanceText: {
    fontSize: "12@vs",
    fontWeight: "600",
  },
  accountCard: {
    paddingBottom: "20@vs",
  },
  accountHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "14@vs",
  },
  accountTitleWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: "8@s",
  },
  badge: {
    borderRadius: "12@s",
    paddingHorizontal: "8@s",
    paddingVertical: "3@vs",
  },
  badgeText: {
    fontSize: "10@vs",
    fontWeight: "600",
  },
  iconButton: {
    width: "36@s",
    height: "36@s",
    borderRadius: "18@s",
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  addressBox: {
    borderWidth: 1,
    borderRadius: "16@s",
    paddingHorizontal: "14@s",
    paddingVertical: "12@vs",
    marginBottom: "16@vs",
  },
  addressText: {
    fontSize: "14@vs",
    fontWeight: "600",
  },
  mutedText: {
    fontSize: "12@vs",
    marginTop: "4@vs",
  },
  fieldBlock: {
    marginBottom: "14@vs",
  },
  label: {
    fontSize: "12@vs",
    marginBottom: "7@vs",
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12@s",
  },
  primaryAction: {
    flex: 1,
  },
  sheetContainer: {
    paddingHorizontal: "20@s",
    paddingTop: "26@vs",
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: "12@s",
    marginBottom: "22@vs",
  },
  sheetIcon: {
    width: "44@s",
    height: "44@s",
    borderRadius: "22@s",
    alignItems: "center",
    justifyContent: "center",
  },
  sheetTitleBlock: {
    flex: 1,
  },
  sheetTitle: {
    fontSize: "17@vs",
    marginBottom: "4@vs",
  },
  sheetActions: {
    gap: "10@vs",
  },
});
