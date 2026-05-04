import Button from "@comps/Button";
import Loading from "@comps/Loading";
import Screen from "@comps/Screen";
import { CopyIcon, KeyIcon, PlusIcon, RefreshIcon, TrashbinIcon } from "@comps/Icons";
import type { TNpcSettingsPageProps } from "@src/nav/navTypes";
import { useBalanceContext } from "@src/context/Balance";
import { useCurrencyContext } from "@src/context/Currency";
import { useNpcContext, type INpcAccount, type TNpcUsernameAccountRequest } from "@src/context/Npc";
import { usePromptContext } from "@src/context/Prompt";
import { NS } from "@src/i18n";
import { isErr } from "@util";
import {
  AppText,
  verticalScale,
  fontScale,
  globals,
  InputFrame,
  PressableSurface,
  useAppThemeTokens,
  Stack,
} from "@styles";
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import * as Clipboard from "expo-clipboard";
import { useRef, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet } from "react-native";
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
  const theme = useAppThemeTokens();
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
    <Stack style={[globals().wrapContainer, { backgroundColor: theme.drawer }, styles.accountCard]}>
      <Stack style={styles.accountHeader}>
        <Stack style={styles.accountTitleWrap}>
          <AppText style={[styles.accountTitle]} weight="medium" testID={`${account.label}-txt`}>
            {account.label}
          </AppText>
          <Stack style={styles.badgeRow}>
            <Stack style={[styles.sourceBadge, { borderColor: theme.border }]}>
              <AppText
                style={[styles.sourceBadgeText, { color: theme.textSecondary }]}
                testID={`${accountSourceLabel}-txt`}
              >
                {accountSourceLabel}
              </AppText>
            </Stack>
            {account.isDefault && (
              <Stack style={[styles.badge, { backgroundColor: theme.accent }]}>
                <AppText
                  style={[styles.badgeText, { color: theme.background }]}
                  testID={`${t("npcDefaultAccount", { defaultValue: "Default" })}-txt`}
                >
                  {t("npcDefaultAccount", { defaultValue: "Default" })}
                </AppText>
              </Stack>
            )}
          </Stack>
        </Stack>
        <PressableSurface
          accessibilityRole="button"
          onPress={() => onSync(account.id)}
          disabled={busy}
          style={[styles.iconButton, { borderColor: theme.border, opacity: busy ? 0.7 : 1 }]}
        >
          {busy ? <Loading size={16} /> : <RefreshIcon width={18} color={theme.accent} />}
        </PressableSurface>
      </Stack>

      <Stack style={styles.statusRow}>
        <Stack
          style={[
            styles.statusDot,
            { backgroundColor: account.isRunning ? theme.accent : theme.textSecondary },
          ]}
        />
        <AppText
          style={[styles.statusText, { color: theme.textSecondary }]}
          testID={`${statusLabel}-txt`}
        >
          {statusLabel}
        </AppText>
      </Stack>

      <PressableSurface
        accessibilityRole="button"
        onPress={() => onCopy(account.address)}
        style={[
          styles.addressBox,
          { borderColor: theme.darkBorder, backgroundColor: theme.background },
        ]}
      >
        <Stack style={styles.addressHeader}>
          <AppText
            style={[styles.addressLabel, { color: theme.textSecondary }]}
            testID={`${t("npcReceiveAddress", { defaultValue: "Receive address" })}-txt`}
          >
            {t("npcReceiveAddress", { defaultValue: "Receive address" })}
          </AppText>
          <Stack style={styles.copyHint}>
            <AppText
              style={[styles.copyText, { color: theme.accent }]}
              testID={`${t("copy", { defaultValue: "Copy" })}-txt`}
            >
              {t("copy", { defaultValue: "Copy" })}
            </AppText>
            <CopyIcon width={16} color={theme.accent} />
          </Stack>
        </Stack>
        <AppText
          style={[styles.addressText, { color: theme.accent }]}
          weight="medium"
          testID={`${account.address}-txt`}
        >
          {account.address}
        </AppText>
        <AppText
          style={[styles.mutedText, { color: theme.textSecondary }]}
          testID={`${
            account.username
              ? account.npub
              : t("npcNpubFallback", { defaultValue: "Using your npub until a username is saved" })
          }-txt`}
        >
          {account.username
            ? account.npub
            : t("npcNpubFallback", { defaultValue: "Using your npub until a username is saved" })}
        </AppText>
      </PressableSurface>

      <Stack style={styles.actions}>
        <Stack style={styles.primaryAction}>
          <Button
            txt={t("npcSetUsername", { defaultValue: "Set Username" })}
            onPress={() => onSetUsername(account)}
            disabled={busy}
            loading={busy}
            size="small"
          />
        </Stack>
        {!account.isDefault && (
          <PressableSurface
            accessibilityRole="button"
            onPress={() => onRemove(account.id)}
            disabled={busy}
            style={[styles.removeButton, { borderColor: theme.error, opacity: busy ? 0.5 : 1 }]}
          >
            <TrashbinIcon width={16} color={theme.error} />
            <AppText
              style={[styles.removeText, { color: theme.error }]}
              testID={`${t("remove", { defaultValue: "Remove" })}-txt`}
            >
              {t("remove", { defaultValue: "Remove" })}
            </AppText>
          </PressableSurface>
        )}
      </Stack>
    </Stack>
  );
}
export default function NpcSettings({ navigation }: TNpcSettingsPageProps) {
  const { t } = useTranslation([NS.common]);
  const theme = useAppThemeTokens();
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
        <PressableSurface
          accessibilityRole="button"
          onPress={handleOpenAddAccountSheet}
          disabled={busyAccountId !== null}
          style={[styles.headerAddAction, { opacity: busyAccountId !== null ? 0.5 : 1 }]}
        >
          <PlusIcon width={30} height={30} color={theme.accent} />
        </PressableSurface>
      }
    >
      {isLoading ? (
        <Stack style={styles.loadingContainer}>
          <Loading />
        </Stack>
      ) : (
        <ScrollView
          alwaysBounceVertical={false}
          contentContainerStyle={{
            paddingHorizontal: 8,
            paddingTop: 8,
            paddingBottom: Math.max(insets.bottom, 18),
          }}
        >
          <Stack
            style={[globals().wrapContainer, { backgroundColor: theme.drawer }, styles.summaryCard]}
          >
            <Stack style={styles.summaryHeader}>
              <Stack style={styles.summaryText}>
                <AppText
                  style={[styles.summaryTitle]}
                  weight="medium"
                  testID={`${t("npcReceiveTitle", { defaultValue: "NPC Lightning addresses" })}-txt`}
                >
                  {t("npcReceiveTitle", { defaultValue: "NPC Lightning addresses" })}
                </AppText>
                <AppText
                  style={[styles.mutedText, { color: theme.textSecondary }]}
                  testID={`${t("npcReceiveHint", {
                    defaultValue: "Receive Lightning payments into your local Cashu wallet.",
                  })}-txt`}
                >
                  {t("npcReceiveHint", {
                    defaultValue: "Receive Lightning payments into your local Cashu wallet.",
                  })}
                </AppText>
              </Stack>
            </Stack>
            <Stack
              style={[
                styles.summaryStats,
                { borderTopColor: theme.darkBorder, borderBottomColor: theme.darkBorder },
              ]}
            >
              <Stack style={styles.summaryStat}>
                <AppText
                  style={[styles.statLabel, { color: theme.textSecondary }]}
                  testID={`${t("npcAccountsLabel", { defaultValue: "Accounts" })}-txt`}
                >
                  {t("npcAccountsLabel", { defaultValue: "Accounts" })}
                </AppText>
                <AppText style={[styles.statValue]} weight="medium" testID={`${accountCount}-txt`}>
                  {accountCount}
                </AppText>
              </Stack>
              <Stack style={[styles.statDivider, { backgroundColor: theme.darkBorder }]} />
              <Stack style={styles.summaryStat}>
                <AppText
                  style={[styles.statLabel, { color: theme.textSecondary }]}
                  testID={`${t("npcLocalBalance", { defaultValue: "Local balance" })}-txt`}
                >
                  {t("npcLocalBalance", { defaultValue: "Local balance" })}
                </AppText>
                <AppText
                  style={[styles.statValue, { color: theme.accent }]}
                  weight="medium"
                  testID={`${`${balance.formatted} ${balance.symbol}`}-txt`}
                >{`${balance.formatted} ${balance.symbol}`}</AppText>
              </Stack>
            </Stack>
            <Stack style={styles.summaryActions}>
              <Stack style={styles.summaryAction}>
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
              </Stack>
            </Stack>
          </Stack>

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
        backgroundColor={theme.background}
        cornerRadius={26}
        grabberOptions={{ color: theme.textSecondary }}
        onDidDismiss={() => setPrivateKeyInput("")}
      >
        <ScrollView
          style={{ backgroundColor: theme.background }}
          contentContainerStyle={[
            styles.sheetContainer,
            { paddingBottom: Math.max(insets.bottom, 22) },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Stack style={styles.sheetHeader}>
            <Stack style={[styles.sheetIcon, { backgroundColor: theme.accent }]}>
              <KeyIcon width={22} color={theme.background} />
            </Stack>
            <Stack style={styles.sheetTitleBlock}>
              <AppText
                style={[styles.sheetTitle]}
                weight="medium"
                testID={`${t("npcAddAccountTitle", { defaultValue: "Add NPC account" })}-txt`}
              >
                {t("npcAddAccountTitle", { defaultValue: "Add NPC account" })}
              </AppText>
              <AppText
                style={[styles.mutedText, { color: theme.textSecondary }]}
                testID={`${t("npcAddAccountHint", {
                  defaultValue: "Import an existing Nostr key or derive a new key from your seed.",
                })}-txt`}
              >
                {t("npcAddAccountHint", {
                  defaultValue: "Import an existing Nostr key or derive a new key from your seed.",
                })}
              </AppText>
            </Stack>
          </Stack>

          <Stack style={styles.fieldBlock}>
            <AppText
              style={[styles.label, { color: theme.textSecondary }]}
              testID={`${t("npcPrivateKeyLabel", { defaultValue: "Private key" })}-txt`}
            >
              {t("npcPrivateKeyLabel", { defaultValue: "Private key" })}
            </AppText>
            <InputFrame
              placeholder={t("npcPrivateKeyPlaceholder", { defaultValue: "nsec or hex" })}
              placeholderTextColor={theme.placeholder as never}
              selectionColor={theme.accent}
              cursorColor={theme.accent}
              value={privateKeyInput}
              autoCapitalize="none"
              autoCorrect={false}
              onChangeText={setPrivateKeyInput}
              testID={`${t("npcPrivateKeyPlaceholder", { defaultValue: "nsec or hex" })}-input`}
            />
            <AppText
              style={[styles.mutedText, { color: theme.textSecondary }]}
              testID={`${t("npcPrivateKeyHint", {
                defaultValue: "Imported keys are stored in secure storage on this device.",
              })}-txt`}
            >
              {t("npcPrivateKeyHint", {
                defaultValue: "Imported keys are stored in secure storage on this device.",
              })}
            </AppText>
          </Stack>

          <Stack style={styles.sheetActions}>
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
          </Stack>
        </ScrollView>
      </TrueSheet>
      <TrueSheet
        ref={usernameSheetRef}
        detents={["auto"]}
        backgroundColor={theme.background}
        cornerRadius={26}
        dismissible={!usernameBusy}
        draggable={!usernameBusy}
        grabberOptions={{ color: theme.textSecondary }}
        onDidDismiss={() => {
          setSelectedUsernameAccount(null);
          setUsernameInput("");
          setUsernameRequest(null);
          setUsernameBusy(false);
        }}
      >
        <ScrollView
          style={{ backgroundColor: theme.background }}
          contentContainerStyle={[
            styles.sheetContainer,
            { paddingBottom: Math.max(insets.bottom, 22) },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Stack style={styles.sheetHeader}>
            <Stack style={[styles.sheetIcon, { backgroundColor: theme.accent }]}>
              <KeyIcon width={22} color={theme.background} />
            </Stack>
            <Stack style={styles.sheetTitleBlock}>
              <AppText
                style={[styles.sheetTitle]}
                weight="medium"
                testID={`${t("npcSetUsername", { defaultValue: "Set Username" })}-txt`}
              >
                {t("npcSetUsername", { defaultValue: "Set Username" })}
              </AppText>
              <AppText
                style={[styles.mutedText, { color: theme.textSecondary }]}
                testID={`${selectedUsernameAccount?.address || ""}-txt`}
              >
                {selectedUsernameAccount?.address || ""}
              </AppText>
            </Stack>
          </Stack>

          {usernameRequest?.type === "payment" ? (
            <Stack>
              <Stack
                style={[
                  styles.usernamePreview,
                  { backgroundColor: theme.inputBackground, borderColor: theme.darkBorder },
                ]}
              >
                <AppText
                  style={[styles.usernamePreviewText, { color: theme.accent }]}
                  weight="medium"
                  align="center"
                  testID={`${usernameRequest.username}-txt`}
                >
                  {usernameRequest.username}
                </AppText>
              </Stack>
              <AppText
                style={[styles.usernamePrompt, { color: theme.textSecondary }]}
                align="center"
                testID={`${t("npcUsernameFeePrompt", {
                  defaultValue: "Do you want to set this username for a fee of {{amount}} sats?",
                  amount: usernameRequest.amount.toLocaleString(),
                })}-txt`}
              >
                {t("npcUsernameFeePrompt", {
                  defaultValue: "Do you want to set this username for a fee of {{amount}} sats?",
                  amount: usernameRequest.amount.toLocaleString(),
                })}
              </AppText>
              <Stack style={styles.sheetActions}>
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
              </Stack>
            </Stack>
          ) : (
            <Stack>
              <Stack style={styles.fieldBlock}>
                <AppText
                  style={[styles.label, { color: theme.textSecondary }]}
                  testID={`${t("npcUsernameLabel", { defaultValue: "Custom username" })}-txt`}
                >
                  {t("npcUsernameLabel", { defaultValue: "Custom username" })}
                </AppText>
                <InputFrame
                  placeholder={t("npcUsernamePlaceholder", { defaultValue: "optional username" })}
                  placeholderTextColor={theme.placeholder as never}
                  selectionColor={theme.accent}
                  cursorColor={theme.accent}
                  value={usernameInput}
                  autoCapitalize="none"
                  autoCorrect={false}
                  onChangeText={setUsernameInput}
                  testID={`${t("npcUsernamePlaceholder", { defaultValue: "optional username" })}-input`}
                />
              </Stack>
              <Stack style={styles.sheetActions}>
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
              </Stack>
            </Stack>
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
    fontSize: fontScale(11),
    marginBottom: 5,
  },
  statValue: {
    fontSize: fontScale(16),
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
    fontSize: fontScale(16),
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
    fontSize: fontScale(10),
    fontWeight: "600",
  },
  sourceBadge: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  sourceBadgeText: {
    fontSize: fontScale(10),
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
    fontSize: fontScale(12),
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
    fontSize: fontScale(12),
    fontWeight: "600",
  },
  addressText: {
    fontSize: fontScale(14),
    fontWeight: "600",
  },
  mutedText: {
    fontSize: fontScale(12),
    marginTop: 4,
  },
  fieldBlock: {
    marginBottom: 14,
  },
  label: {
    fontSize: fontScale(12),
    marginBottom: 7,
  },
  addressLabel: {
    fontSize: fontScale(12),
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
    fontSize: fontScale(13),
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
    fontSize: fontScale(20),
  },
  usernamePrompt: {
    fontSize: fontScale(14),
    lineHeight: verticalScale(20),
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
    fontSize: fontScale(17),
    marginBottom: 4,
  },
  sheetActions: {
    gap: 10,
  },
});
