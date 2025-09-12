import { CompositeScreenProps } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "@src/model/nav";

// Mint Screens

export type MintStackParamList = {
  MintHome: undefined;
  MintAdd: undefined;
  MintSettings: { mintUrl: string };
};

type MintStackScreenProps<T extends keyof MintStackParamList> =
  NativeStackScreenProps<MintStackParamList, T>;

export type MintHomeScreenProps = CompositeScreenProps<
  MintStackScreenProps<"MintHome">,
  NativeStackScreenProps<RootStackParamList>
>;

export type MintAddScreenProps = CompositeScreenProps<
  MintStackScreenProps<"MintAdd">,
  NativeStackScreenProps<RootStackParamList>
>;

export type MintSettingsScreenProps = CompositeScreenProps<
  MintStackScreenProps<"MintSettings">,
  NativeStackScreenProps<RootStackParamList>
>;

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
  Recovering: undefined;
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

export type MeltConfirmationProps = NativeStackScreenProps<
  RootStackParamList,
  "MeltConfirmation"
>;

export type RestoreScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "Restore"
>;
