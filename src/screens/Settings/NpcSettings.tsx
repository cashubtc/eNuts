import Button from "@comps/Button";
import Loading from "@comps/Loading";
import Screen from "@comps/Screen";
import Txt from "@comps/Txt";
import TxtInput from "@comps/TxtInput";
import { CopyIcon, KeyIcon, PlusIcon, RefreshIcon, TrashbinIcon } from "@comps/Icons";
import type { TNpcSettingsPageProps } from "@src/nav/navTypes";
import { useBalanceContext } from "@src/context/Balance";
import { useCurrencyContext } from "@src/context/Currency";
import { useNpcContext, type INpcAccount, type TNpcUsernameAccountRequest } from "@src/context/Npc";
import { usePromptContext } from "@src/context/Prompt";
import { useThemeContext } from "@src/context/Theme";
import { NS } from "@src/i18n";
import { isErr } from "@util";
import { globals, highlight as hi, mainColors } from "@styles";
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import * as Clipboard from "expo-clipboard";
import { useRef, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, TouchableOpacity, View, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface INpcAccountCardProps {
  account: INpcAccount;
  busy: boolean;
  onCopy: (value: string) => void;
  onRemove: (accountId: string) => void;
  onSetUsername: (account: INpcAccount) => void;
  onSync: (accountId: string) => void;
}

function NpcAccountCard({
  account,
  busy,
  onCopy,
  onRemove,
  onSetUsername,
  onSync,
}: INpcAccountCardProps) {
  const { t } = useTranslation([NS.common]);
  const { color, highlight } = useThemeContext();

  const accountSourceLabel =
    account.source === "privateKey"
      ? t("npcImportedKey", { defaultValue: "Imported key" })
      : t("npcSeedKey", { defaultValue: "Seed key" });
  const statusLabel = account.isSyncing
    ? t("npcSyncing", { defaultValue: "Syncing" })
    : account.isRunning
      ? t("npcActive", { defaultValue: "Active" })
      : t("npcPaused", { defaultValue: "Paused" });

  return (
    <View style={[globals(color).wrapContainer, styles.accountCard]}>
      <View style={styles.accountHeader}>
        <View style={styles.accountTitleWrap}>
          <Txt txt={account.label} bold styles={[styles.accountTitle]} />
          <View style={styles.badgeRow}>
            <View style={[styles.sourceBadge, { borderColor: color.BORDER }]}>
              <Txt
                txt={accountSourceLabel}
                styles={[styles.sourceBadgeText, { color: color.TEXT_SECONDARY }]}
              />
            </View>
            {account.isDefault && (
              <View style={[styles.badge, { backgroundColor: hi[highlight] }]}>
                <Txt
                  txt={t("npcDefaultAccount", { defaultValue: "Default" })}
                  styles={[styles.badgeText, { color: color.BACKGROUND }]}
                />
              </View>
            )}
          </View>
        </View>
        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => onSync(account.id)}
          disabled={busy}
          style={[styles.iconButton, { borderColor: color.BORDER, opacity: busy ? 0.7 : 1 }]}
        >
          {busy ? <Loading size={16} /> : <RefreshIcon width={18} color={hi[highlight]} />}
        </TouchableOpacity>
      </View>

      <View style={styles.statusRow}>
        <View
          style={[
            styles.statusDot,
            { backgroundColor: account.isRunning ? hi[highlight] : color.TEXT_SECONDARY },
          ]}
        />
        <Txt txt={statusLabel} styles={[styles.statusText, { color: color.TEXT_SECONDARY }]} />
      </View>

      <TouchableOpacity
        accessibilityRole="button"
        onPress={() => onCopy(account.address)}
        style={[
          styles.addressBox,
          { borderColor: color.DARK_BORDER, backgroundColor: color.BACKGROUND },
        ]}
      >
        <View style={styles.addressHeader}>
          <Txt
            txt={t("npcReceiveAddress", { defaultValue: "Receive address" })}
            styles={[styles.addressLabel, { color: color.TEXT_SECONDARY }]}
          />
          <View style={styles.copyHint}>
            <Txt
              txt={t("copy", { defaultValue: "Copy" })}
              styles={[styles.copyText, { color: hi[highlight] }]}
            />
            <CopyIcon width={16} color={hi[highlight]} />
          </View>
        </View>
        <Txt txt={account.address} bold styles={[styles.addressText, { color: hi[highlight] }]} />
        <Txt
          txt={
            account.username
              ? account.npub
              : t("npcNpubFallback", { defaultValue: "Using your npub until a username is saved" })
          }
          styles={[styles.mutedText, { color: color.TEXT_SECONDARY }]}
        />
      </TouchableOpacity>

      <View style={styles.actions}>
        <View style={styles.primaryAction}>
          <Button
            txt={t("npcSetUsername", { defaultValue: "Set Username" })}
            onPress={() => onSetUsername(account)}
            disabled={busy}
            loading={busy}
            size="small"
          />
        </View>
        {!account.isDefault && (
          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => onRemove(account.id)}
            disabled={busy}
            style={[
              styles.removeButton,
              { borderColor: mainColors.ERROR, opacity: busy ? 0.5 : 1 },
            ]}
          >
            <TrashbinIcon width={16} color={mainColors.ERROR} />
            <Txt
              txt={t("remove", { defaultValue: "Remove" })}
              styles={[styles.removeText, { color: mainColors.ERROR }]}
            />
          </TouchableOpacity>
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
  const usernameSheetRef = useRef<TrueSheet>(null);
  const [privateKeyInput, setPrivateKeyInput] = useState("");
  const [selectedUsernameAccount, setSelectedUsernameAccount] = useState<INpcAccount | null>(null);
  const [usernameInput, setUsernameInput] = useState("");
  const [usernameRequest, setUsernameRequest] = useState<TNpcUsernameAccountRequest | null>(null);
  const [usernameBusy, setUsernameBusy] = useState(false);
  const {
    accounts,
    busyAccountId,
    confirmUsername,
    deriveAccount,
    importPrivateKeyAccount,
    isLoading,
    removeAccount,
    requestUsername,
    syncAccount,
    syncAll,
  } = useNpcContext();

  const balance = useMemo(
    () => formatAmount(balances.total.total),
    [balances.total.total, formatAmount],
  );
  const accountCount = accounts.length.toString();

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

  const handleOpenUsernameSheet = (account: INpcAccount) => {
    setSelectedUsernameAccount(account);
    setUsernameInput(account.username || "");
    setUsernameRequest(null);
    void usernameSheetRef.current?.present();
  };

  const handleCloseUsernameSheet = () => {
    void usernameSheetRef.current?.dismiss();
  };

  const handleRequestUsername = () => {
    const account = selectedUsernameAccount;
    const username = usernameInput.trim();
    if (!account) {
      return;
    }

    setUsernameBusy(true);
    void requestUsername(account.id, username)
      .then((request) => {
        if (request.type === "free") {
          void usernameSheetRef.current?.dismiss();
          openPromptAutoClose({
            msg: t("npcUsernameSaved", { defaultValue: "Username saved" }),
          });
          return;
        }

        setUsernameRequest(request);
      })
      .catch((err: unknown) => {
        openPromptAutoClose({
          msg: isErr(err) ? err.message : t("tryLater"),
        });
      })
      .finally(() => {
        setUsernameBusy(false);
      });
  };

  const handleConfirmUsername = () => {
    if (!usernameRequest) {
      return;
    }

    setUsernameBusy(true);
    void confirmUsername(usernameRequest)
      .then(() => {
        void usernameSheetRef.current?.dismiss();
        openPromptAutoClose({
          msg: t("npcUsernameSaved", { defaultValue: "Username saved" }),
        });
      })
      .catch((err: unknown) => {
        openPromptAutoClose({
          msg: isErr(err) ? err.message : t("tryLater"),
        });
      })
      .finally(() => {
        setUsernameBusy(false);
      });
  };

  return (
    <Screen
      screenName={t("npcSettingsTitle", {
        ns: NS.topNav,
        defaultValue: "Lightning address",
      })}
      withBackBtn
      withPadding={false}
      withBottomInset={false}
      handlePress={() => navigation.goBack()}
      rightAction={
        <TouchableOpacity
          accessibilityRole="button"
          onPress={handleOpenAddAccountSheet}
          disabled={busyAccountId !== null}
          style={[styles.headerAddAction, { opacity: busyAccountId !== null ? 0.5 : 1 }]}
        >
          <PlusIcon width={30} height={30} color={hi[highlight]} />
        </TouchableOpacity>
      }
    >
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <Loading />
        </View>
      ) : (
        <ScrollView
          alwaysBounceVertical={false}
          contentContainerStyle={{
            paddingHorizontal: 8,
            paddingTop: 8,
            paddingBottom: Math.max(insets.bottom, 18),
          }}
        >
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
            </View>
            <View
              style={[
                styles.summaryStats,
                { borderTopColor: color.DARK_BORDER, borderBottomColor: color.DARK_BORDER },
              ]}
            >
              <View style={styles.summaryStat}>
                <Txt
                  txt={t("npcAccountsLabel", { defaultValue: "Accounts" })}
                  styles={[styles.statLabel, { color: color.TEXT_SECONDARY }]}
                />
                <Txt txt={accountCount} bold styles={[styles.statValue]} />
              </View>
              <View style={[styles.statDivider, { backgroundColor: color.DARK_BORDER }]} />
              <View style={styles.summaryStat}>
                <Txt
                  txt={t("npcLocalBalance", { defaultValue: "Local balance" })}
                  styles={[styles.statLabel, { color: color.TEXT_SECONDARY }]}
                />
                <Txt
                  txt={`${balance.formatted} ${balance.symbol}`}
                  bold
                  styles={[styles.statValue, { color: hi[highlight] }]}
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
              onSetUsername={handleOpenUsernameSheet}
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
        cornerRadius={26}
        grabberOptions={{ color: color.TEXT_SECONDARY }}
        onDidDismiss={() => setPrivateKeyInput("")}
      >
        <ScrollView
          style={{ backgroundColor: color.BACKGROUND }}
          contentContainerStyle={[
            styles.sheetContainer,
            { paddingBottom: Math.max(insets.bottom, 22) },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.sheetHeader}>
            <View style={[styles.sheetIcon, { backgroundColor: hi[highlight] }]}>
              <KeyIcon width={22} color={color.BACKGROUND} />
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
      <TrueSheet
        ref={usernameSheetRef}
        detents={["auto"]}
        backgroundColor={color.BACKGROUND}
        cornerRadius={26}
        dismissible={!usernameBusy}
        draggable={!usernameBusy}
        grabberOptions={{ color: color.TEXT_SECONDARY }}
        onDidDismiss={() => {
          setSelectedUsernameAccount(null);
          setUsernameInput("");
          setUsernameRequest(null);
          setUsernameBusy(false);
        }}
      >
        <ScrollView
          style={{ backgroundColor: color.BACKGROUND }}
          contentContainerStyle={[
            styles.sheetContainer,
            { paddingBottom: Math.max(insets.bottom, 22) },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.sheetHeader}>
            <View style={[styles.sheetIcon, { backgroundColor: hi[highlight] }]}>
              <KeyIcon width={22} color={color.BACKGROUND} />
            </View>
            <View style={styles.sheetTitleBlock}>
              <Txt
                txt={t("npcSetUsername", { defaultValue: "Set Username" })}
                bold
                styles={[styles.sheetTitle]}
              />
              <Txt
                txt={selectedUsernameAccount?.address || ""}
                styles={[styles.mutedText, { color: color.TEXT_SECONDARY }]}
              />
            </View>
          </View>

          {usernameRequest?.type === "payment" ? (
            <View>
              <View
                style={[
                  styles.usernamePreview,
                  { backgroundColor: color.INPUT_BG, borderColor: color.DARK_BORDER },
                ]}
              >
                <Txt
                  txt={usernameRequest.username}
                  bold
                  center
                  styles={[styles.usernamePreviewText, { color: hi[highlight] }]}
                />
              </View>
              <Txt
                txt={t("npcUsernameFeePrompt", {
                  defaultValue: "Do you want to set this username for a fee of {{amount}} sats?",
                  amount: usernameRequest.amount.toLocaleString(),
                })}
                center
                styles={[styles.usernamePrompt, { color: color.TEXT_SECONDARY }]}
              />
              <View style={styles.sheetActions}>
                <Button
                  txt={t("confirm", { defaultValue: "Confirm" })}
                  onPress={handleConfirmUsername}
                  loading={usernameBusy}
                  disabled={usernameBusy}
                  size="small"
                />
                <Button
                  txt={t("cancel", { defaultValue: "Cancel" })}
                  onPress={handleCloseUsernameSheet}
                  disabled={usernameBusy}
                  size="small"
                  outlined
                />
              </View>
            </View>
          ) : (
            <View>
              <View style={styles.fieldBlock}>
                <Txt
                  txt={t("npcUsernameLabel", { defaultValue: "Custom username" })}
                  styles={[styles.label, { color: color.TEXT_SECONDARY }]}
                />
                <TxtInput
                  placeholder={t("npcUsernamePlaceholder", { defaultValue: "optional username" })}
                  value={usernameInput}
                  autoCapitalize="none"
                  autoCorrect={false}
                  onChangeText={setUsernameInput}
                />
              </View>
              <View style={styles.sheetActions}>
                <Button
                  txt={t("npcRequestUsername", { defaultValue: "Request username" })}
                  onPress={handleRequestUsername}
                  loading={usernameBusy}
                  disabled={usernameBusy}
                  size="small"
                />
                <Button
                  txt={t("cancel", { defaultValue: "Cancel" })}
                  onPress={handleCloseUsernameSheet}
                  disabled={usernameBusy}
                  size="small"
                  outlined
                />
              </View>
            </View>
          )}
        </ScrollView>
      </TrueSheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryCard: {
    paddingBottom: 20,
  },
  summaryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  summaryText: {
    flex: 1,
  },
  summaryTitle: {
    marginBottom: 6,
  },
  summaryStats: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    marginTop: 18,
    paddingVertical: 14,
  },
  summaryStat: {
    flex: 1,
    paddingHorizontal: 14,
  },
  statDivider: {
    width: 1,
    height: 34,
  },
  statLabel: {
    fontSize: 11,
    marginBottom: 5,
  },
  statValue: {
    fontSize: 16,
  },
  summaryActions: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 18,
    gap: 12,
  },
  summaryAction: {
    flex: 1,
  },
  headerAddAction: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  accountCard: {
    paddingBottom: 20,
  },
  accountHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  accountTitleWrap: {
    flex: 1,
    paddingRight: 12,
  },
  accountTitle: {
    fontSize: 16,
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  badge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "600",
  },
  sourceBadge: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  sourceBadgeText: {
    fontSize: 10,
    fontWeight: "600",
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 7,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
  },
  addressBox: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
  },
  addressHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
    gap: 12,
  },
  copyHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  copyText: {
    fontSize: 12,
    fontWeight: "600",
  },
  addressText: {
    fontSize: 14,
    fontWeight: "600",
  },
  mutedText: {
    fontSize: 12,
    marginTop: 4,
  },
  fieldBlock: {
    marginBottom: 14,
  },
  label: {
    fontSize: 12,
    marginBottom: 7,
  },
  addressLabel: {
    fontSize: 12,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  primaryAction: {
    flex: 1,
  },
  removeButton: {
    minHeight: 42,
    borderWidth: 1,
    borderRadius: 22,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  removeText: {
    fontSize: 13,
    fontWeight: "600",
  },
  usernamePreview: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 18,
    marginBottom: 14,
  },
  usernamePreviewText: {
    fontSize: 20,
  },
  usernamePrompt: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 18,
  },
  sheetContainer: {
    paddingHorizontal: 20,
    paddingTop: 26,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 22,
  },
  sheetIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetTitleBlock: {
    flex: 1,
  },
  sheetTitle: {
    fontSize: 17,
    marginBottom: 4,
  },
  sheetActions: {
    gap: 10,
  },
});
