import type { EventArg } from "@react-navigation/core";
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
import { Proof, Token } from "@cashu/cashu-ts";

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
    auth: {
        pinHash: string;
        shouldEdit?: boolean;
        shouldRemove?: boolean;
        sawSeedUpdate?: boolean;
    };
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
    meltInputfield: {
        mint: IMintUrl;
        balance: number;
    };
    selectMintToSwapTo: {
        mint: IMintUrl;
        balance: number;
        remainingMints?: IMintUrl[];
    };
    selectAmount: {
        mint: IMintUrl;
        isMelt?: boolean;
        isSendEcash?: boolean;
        isSwap?: boolean;
        balance: number;
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
    };
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
    "qr processing": {
        tokenInfo?: ITokenInfo;
        token?: string;
        scanned?: boolean;
        ln?: {
            invoice: string;
            mint?: IMintUrl;
            balance?: number;
            amount: number;
        };
        lnurl?: {
            mint?: IMintUrl;
            balance?: number;
            url: string;
            data: string;
        };
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
        amount: number;
        hash: string;
        expiry: number;
        paymentRequest: string;
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
    "qr scan": {
        mint?: IMintUrl;
        balance?: number;
        isPayment?: boolean;
    };
    "history entry details": {
        entry: IHistoryEntry;
    };
    Seed:
        | {
              comingFromOnboarding?: boolean;
              sawSeedUpdate?: boolean;
              hasSeed?: boolean;
          }
        | undefined;
    "Select recovery mint": {
        comingFromOnboarding?: boolean;
    };
    Recover: {
        mintUrl: string;
        comingFromOnboarding?: boolean;
    };
    Mnemonic: {
        comingFromOnboarding?: boolean;
    };
    "Confirm Mnemonic": {
        mnemonic: string[];
        comingFromOnboarding?: boolean;
    };
    Deriving: {
        mnemonic: string[];
        comingFromOnboarding?: boolean;
    };
    Recovering: {
        mintUrl: string;
        mnemonic: string;
        comingFromOnboarding?: boolean;
    };
    "Restore warning": {
        comingFromOnboarding?: boolean;
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
export type TMeltInputfieldPageProps = NativeStackScreenProps<
    RootStackParamList,
    "meltInputfield",
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
export type TQRProcessingPageProps = NativeStackScreenProps<
    RootStackParamList,
    "qr processing",
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
export type TMintsPageProps = NativeStackScreenProps<
    RootStackParamList,
    "mints",
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
export type TQRScanPageProps = NativeStackScreenProps<
    RootStackParamList,
    "qr scan",
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
export type ISeedPageProps = NativeStackScreenProps<RootStackParamList, "Seed">;
export type IRecoverPageProps = NativeStackScreenProps<
    RootStackParamList,
    "Recover"
>;
export type IMnemonicPageProps = NativeStackScreenProps<
    RootStackParamList,
    "Mnemonic"
>;
export type IConfirmMnemonicPageProps = NativeStackScreenProps<
    RootStackParamList,
    "Confirm Mnemonic"
>;
export type IDerivingPageProps = NativeStackScreenProps<
    RootStackParamList,
    "Deriving"
>;
export type IRecoveringPageProps = NativeStackScreenProps<
    RootStackParamList,
    "Recovering"
>;
export type ISelectRecoveryMintPageProps = NativeStackScreenProps<
    RootStackParamList,
    "Select recovery mint"
>;
export type IRestoreWarningPageProps = NativeStackScreenProps<
    RootStackParamList,
    "Restore warning"
>;
export type TBottomNavProps =
    | TDashboardPageProps
    | TMintsPageProps
    | TMintManagementPageProps
    | THistoryPageProps
    | THistoryEntryPageProps
    | TMintProofsPageProps
    | TSettingsPageProps
    | TDisplaySettingsPageProps;
export interface INavigatorProps {
    pinHash: string;
    // shouldSetup?: boolean
    bgAuth?: boolean;
    shouldOnboard?: boolean;
    setBgAuth?: (val: boolean) => void;
    hasSeed?: boolean;
    sawSeedUpdate?: boolean;
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
