import {
  CompositeScreenProps,
  NavigatorScreenParams,
} from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "@src/model/nav";
import { HistoryEntry } from "coco-cashu-core";

// Settings Stack

export type SettingsStackParamList = {
  SettingsMain: undefined;
  "Display settings": undefined;
  "Language settings": undefined;
  "Currency settings": undefined;
  "NFC settings": undefined;
  "Advanced settings": undefined;
  "View mnemonic": undefined;
};

export type TNfcSettingsPageProps = NativeStackScreenProps<
  SettingsStackParamList,
  "NFC settings"
>;

type SettingsStackScreenProps<T extends keyof SettingsStackParamList> =
  NativeStackScreenProps<SettingsStackParamList, T>;

// Mint Screens

export type MintStackParamList = {
  MintHome: undefined;
  MintAdd: undefined;
  MintSettings: { mintUrl: string };
};

type MintStackScreenProps<T extends keyof MintStackParamList> =
  NativeStackScreenProps<MintStackParamList, T>;

export type HistoryStackParamList = {
  HistoryMain: undefined;
  HistoryEntryDetails: {
    entry: HistoryEntry;
  };
};

// Restore Screens

export type RestoreStackParamList = {
  Seed:
    | {
        comingFromOnboarding?: boolean;
        sawSeedUpdate?: boolean;
        hasSeed?: boolean;
      }
    | undefined;
  RecoverMints: { comingFromOnboarding?: boolean } | undefined;
  Recover: undefined;
  Mnemonic: { comingFromOnboarding?: boolean };
  Recovering: { bip39seed: Uint8Array; mintUrls: string[] };
};

type RestoreStackScreenProps<T extends keyof RestoreStackParamList> =
  NativeStackScreenProps<RestoreStackParamList, T>;

export type RecoverScreenProps = CompositeScreenProps<
  RestoreStackScreenProps<"Recover">,
  NativeStackScreenProps<RootStackParamList>
>;

export type RecoverMintsScreenProps = CompositeScreenProps<
  RestoreStackScreenProps<"RecoverMints">,
  NativeStackScreenProps<RootStackParamList>
>;

export type SendSelectAmountProps = NativeStackScreenProps<
  RootStackParamList,
  "SendSelectAmount"
>;

export type MintSelectAmountProps = NativeStackScreenProps<
  RootStackParamList,
  "MintSelectAmount"
>;

export type MeltInputProps = NativeStackScreenProps<
  RootStackParamList,
  "MeltInput"
>;

export type MeltConfirmationProps = NativeStackScreenProps<
  RootStackParamList,
  "MeltConfirmation"
>;

export type RestoreScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "Restore"
>;

export type QRScannerScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "QRScanner"
>;
