import type { EventArg, NavigatorScreenParams } from "@react-navigation/core";
import type { CompositeScreenProps } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import type {
  IHistoryEntry,
  ILnUrlPayRequest,
  IMintUrl,
  IMintWithBalance,
  IProofSelection,
  ITokenInfo,
} from ".";
import { EnutsProof } from "@src/storage/db/repo/ProofRepository";
import {
  MintQuoteResponse,
  Proof,
  Token,
  MeltQuoteResponse,
} from "@cashu/cashu-ts";
import { MintStackParamList, RestoreStackParamList } from "@src/nav/navTypes";

interface ILnurlNavData {
  userInput: string;
  url?: string;
  data?: ILnUrlPayRequest;
}
/**
 * Stack Navigator
 */
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type RootStackParamList = {
  onboarding: undefined;
  dashboard: undefined;
  disclaimer: undefined;
  history: undefined;
  mints: undefined;
  Settings: undefined;
  "Display settings": undefined;
  "Language settings": undefined;
  "Advanced settings": undefined;
  "View mnemonic": undefined;
  auth: {
    mode: "unlock" | "setup" | "edit" | "remove";
    sawSeedUpdate?: boolean;
  };
  Restore: NavigatorScreenParams<RestoreStackParamList>;
  selectMint: {
    mints: IMintUrl[];
    mintsWithBal: IMintWithBalance[];
    isMelt?: boolean;
    isSendEcash?: boolean;
    balance?: number;
    allMintsEmpty?: boolean;
    invoice?: string;
    invoiceAmount?: number;
    estFee?: number;
    lnurl?: ILnurlNavData;
    scanned?: boolean;
  };
  selectTarget: {
    mint: IMintUrl;
    balance: number;
    isMelt?: boolean;
    isSendEcash?: boolean;
    remainingMints?: IMintUrl[];
  };
  selectMintToSwapTo: {
    mint: IMintUrl;
    balance: number;
    remainingMints?: IMintUrl[];
  };
  SendSelectAmount: undefined;
  MintSelectAmount: undefined;
  MeltInput: undefined;
  MeltConfirmation: {
    quote: MeltQuoteResponse;
    mintUrl: string;
  };
  selectAmount: {
    isMelt?: boolean;
    isSendEcash?: boolean;
    isSwap?: boolean;
    lnurl?: ILnurlNavData;
    targetMint?: IMintUrl;
    scanned?: boolean;
  };
  coinSelection: {
    mint: IMintUrl;
    balance: number;
    amount: number;
    estFee: number;
    isMelt?: boolean;
    isSendEcash?: boolean;
    isSwap?: boolean;
    isZap?: boolean;
    targetMint?: IMintUrl;
    recipient?: string;
    memo?: string;
    scanned?: boolean;
    aiPathfindingEnabled?: boolean;
  };
  QRScanner: undefined;
  processing: {
    mint: IMintUrl;
    tokenInfo?: ITokenInfo;
    amount: number;
    estFee?: number;
    isMelt?: boolean;
    isSendEcash?: boolean;
    isSwap?: boolean;
    isAutoSwap?: boolean;
    isZap?: boolean;
    payZap?: boolean;
    targetMint?: IMintUrl;
    proofs?: IProofSelection[];
    recipient?: string;
    memo?: string;
  };
  "mint confirm": {
    mintUrl: string;
  };
  "scan success": {
    mintUrl?: string;
    edited?: boolean;
  };
  processingError: {
    mint?: IMintUrl;
    amount?: number;
    scan?: boolean;
    comingFromOnboarding?: boolean;
    errorMsg: string;
  };
  mintInvoice: {
    mintUrl: string;
    quote: MintQuoteResponse;
  };
  encodedToken: {
    token: Token;
  };
  success: {
    amount?: number;
    fee?: number;
    mint?: string;
    memo?: string;
    isClaim?: boolean;
    isMelt?: boolean;
    isAutoSwap?: boolean;
    isZap?: boolean;
    isScanned?: boolean;
    isRestored?: boolean;
    change?: number;
    comingFromOnboarding?: boolean;
  };
  Mint: NavigatorScreenParams<MintStackParamList>;
  mintmanagement: {
    mint: IMintUrl;
    amount: number;
    remainingMints: IMintUrl[];
  };
  "mint info": {
    mintUrl: string;
  };
  "mint proofs": {
    mintUrl: string;
  };
  "history entry details": {
    entry: IHistoryEntry;
  };
};

export type TRouteString = "dashboard" | "mints" | "Settings";
export type TOnboardingPageProps = NativeStackScreenProps<
  RootStackParamList,
  "onboarding",
  "MyStack"
>;
export type TSelectMintPageProps = NativeStackScreenProps<
  RootStackParamList,
  "selectMint",
  "MyStack"
>;
export type TSelectTargetPageProps = NativeStackScreenProps<
  RootStackParamList,
  "selectTarget",
  "MyStack"
>;
export type TSelectMintToSwapToPageProps = NativeStackScreenProps<
  RootStackParamList,
  "selectMintToSwapTo",
  "MyStack"
>;
export type SendSelectAmountProps = NativeStackScreenProps<
  RootStackParamList,
  "selectAmount",
  "MyStack"
>;
export type TSelectAmountPageProps = NativeStackScreenProps<
  RootStackParamList,
  "selectAmount",
  "MyStack"
>;
export type TCoinSelectionPageProps = NativeStackScreenProps<
  RootStackParamList,
  "coinSelection",
  "MyStack"
>;
export type TProcessingPageProps = NativeStackScreenProps<
  RootStackParamList,
  "processing",
  "MyStack"
>;
export type TMintConfirmPageProps = NativeStackScreenProps<
  RootStackParamList,
  "mint confirm",
  "MyStack"
>;
export type TScanSuccessPageProps = NativeStackScreenProps<
  RootStackParamList,
  "scan success",
  "MyStack"
>;
export type TProcessingErrorPageProps = NativeStackScreenProps<
  RootStackParamList,
  "processingError",
  "MyStack"
>;
export type TMintInvoicePageProps = NativeStackScreenProps<
  RootStackParamList,
  "mintInvoice",
  "MyStack"
>;
export type TDashboardPageProps = NativeStackScreenProps<
  RootStackParamList,
  "dashboard",
  "MyStack"
>;
export type TDisclaimerPageProps = NativeStackScreenProps<
  RootStackParamList,
  "disclaimer",
  "MyStack"
>;
export type TAuthPageProps = NativeStackScreenProps<
  RootStackParamList,
  "auth",
  "MyStack"
>;
export type TEncodedTokenPageProps = NativeStackScreenProps<
  RootStackParamList,
  "encodedToken",
  "MyStack"
>;
export type TSuccessPageProps = NativeStackScreenProps<
  RootStackParamList,
  "success",
  "MyStack"
>;
export type TMintManagementPageProps = NativeStackScreenProps<
  RootStackParamList,
  "mintmanagement",
  "MyStack"
>;
export type TMintInfoPageProps = NativeStackScreenProps<
  RootStackParamList,
  "mint info",
  "MyStack"
>;
export type TMintProofsPageProps = NativeStackScreenProps<
  RootStackParamList,
  "mint proofs",
  "MyStack"
>;
export type THistoryPageProps = NativeStackScreenProps<
  RootStackParamList,
  "history",
  "MyStack"
>;
export type THistoryEntryPageProps = NativeStackScreenProps<
  RootStackParamList,
  "history entry details",
  "MyStack"
>;
export type TSettingsPageProps = NativeStackScreenProps<
  RootStackParamList,
  "Settings"
>;
export type TDisplaySettingsPageProps = NativeStackScreenProps<
  RootStackParamList,
  "Display settings"
>;
export type TLanguageSettingsPageProps = NativeStackScreenProps<
  RootStackParamList,
  "Language settings"
>;
export type TAdvancedSettingsPageProps = NativeStackScreenProps<
  RootStackParamList,
  "Advanced settings"
>;
export type TViewMnemonicPageProps = NativeStackScreenProps<
  RootStackParamList,
  "View mnemonic"
>;
type RestoreStackScreenProps<T extends keyof RestoreStackParamList> =
  NativeStackScreenProps<RestoreStackParamList, T>;

export type ISeedPageProps = CompositeScreenProps<
  RestoreStackScreenProps<"Seed">,
  NativeStackScreenProps<RootStackParamList>
>;
export type IRecoverPageProps = CompositeScreenProps<
  RestoreStackScreenProps<"Recover">,
  NativeStackScreenProps<RootStackParamList>
>;
export type IMnemonicPageProps = CompositeScreenProps<
  RestoreStackScreenProps<"Mnemonic">,
  NativeStackScreenProps<RootStackParamList>
>;
export type IRecoveringPageProps = CompositeScreenProps<
  RestoreStackScreenProps<"Recovering">,
  NativeStackScreenProps<RootStackParamList>
>;
export type TProofsDebugPageProps = NativeStackScreenProps<
  RootStackParamList,
  "history"
>;
// Duplicate removed
export type TBottomNavProps =
  | TDashboardPageProps
  | TMintManagementPageProps
  | THistoryPageProps
  | THistoryEntryPageProps
  | TMintProofsPageProps
  | TSettingsPageProps
  | TDisplaySettingsPageProps;
export interface INavigatorProps {
  shouldOnboard?: boolean;
  hasSeed?: boolean;
}
export type TBeforeRemoveEvent = EventArg<
  "beforeRemove",
  true,
  {
    action: Readonly<{
      type: string;
      payload?: object | undefined;
      source?: string | undefined;
      target?: string | undefined;
    }>;
  }
>;
