import type { NavigationProp } from "@react-navigation/native";
import { addMint, getMintsBalances, getMintsUrls } from "@db";
import { l } from "@log";
import type { RootStackParamList } from "@model/nav";
import { usePromptContext } from "@src/context/Prompt";
import {
  useQRScannerContext,
  type QRScanOptions,
  type QRScanResult,
} from "@src/context/QRScanner";
import { NS } from "@src/i18n";
import { getLnurlData } from "@src/util/lnurl";
import { getDefaultMint, getCustomMintNames } from "@store/mintStore";
import { checkFees, claimToken } from "@wallet";
import { useTranslation } from "react-i18next";
import {
  decodeLnInvoice,
  extractStrFromURL,
  hasTrustedMint,
  isCashuToken,
  isStr,
} from "@util";
import { decodeUrlOrAddress, isLnurlOrAddress, isUrl } from "@util/lnurl";
import { getTokenInfo } from "@wallet/proofs";
import type { Token } from "@cashu/cashu-ts";

type TrustMintAction = "trust" | "cancel" | "swap";
type ShowTrustMintModalFn = (token: Token) => Promise<TrustMintAction>;

interface QRScanHandler {
  openQRScanner: (options?: QRScanOptions) => void;
}

type PromptFunction = (props: { msg: string }) => void;
type TranslationFunction = (key: string, options?: any) => string;

export const useQRScanHandler = (
  navigation: NavigationProp<RootStackParamList>,
  showTrustMintModal?: ShowTrustMintModalFn
): QRScanHandler => {
  const { openScanner } = useQRScannerContext();
  const { openPromptAutoClose } = usePromptContext();
  const { t } = useTranslation([NS.common, NS.mints, NS.wallet, NS.error]);

  const handleScanCallback = async (
    result: QRScanResult,
    options?: QRScanOptions
  ) => {
    try {
      if (!result.success || !result.data) {
        if (result.error) {
          openPromptAutoClose({ msg: result.error });
        }
        return;
      }

      // Process the raw scanned data
      await processScannedData(
        result.data,
        options,
        navigation,
        openPromptAutoClose,
        showTrustMintModal,
        t
      );
    } catch (error) {
      l("[QR Scanner] Error processing scan result:", error);
      openPromptAutoClose({
        msg: t("scanError", { ns: NS.error }) || "Scan error occurred",
      });
    }
  };

  const openQRScanner = (options?: QRScanOptions): void => {
    openScanner((result) => {
      void handleScanCallback(result, options);
    }, options);
  };

  return { openQRScanner };
};

// Process raw scanned QR data and handle different types
const processScannedData = async (
  data: string,
  options: QRScanOptions | undefined,
  navigation: NavigationProp<RootStackParamList>,
  openPromptAutoClose: PromptFunction,
  showTrustMintModal: any,
  t: TranslationFunction
) => {
  // Handle Cashu token claim
  const cashuToken = isCashuToken(data);
  if (cashuToken) {
    await handleCashuToken(
      cashuToken,
      navigation,
      openPromptAutoClose,
      showTrustMintModal,
      t
    );
    return;
  }

  // Handle mint URLs
  if (isUrl(data) && new URL(data).protocol === "https:") {
    navigation.navigate("mint confirm", { mintUrl: data });
    return;
  }

  // Handle LNURL
  if (isLnurlOrAddress(data)) {
    const decoded = decodeUrlOrAddress(data);
    if (!decoded) {
      openPromptAutoClose({
        msg: t("unknownType") + ` - decoded LNURL: "${decoded}"`,
      });
      return;
    }

    try {
      const lnurlData = await getLnurlData(decoded);
      if (!lnurlData) {
        navigation.navigate("processingError", {
          errorMsg: "Could not fetch data from lnurl",
          scan: true,
        });
        return;
      }

      if (lnurlData.tag !== "payRequest") {
        navigation.navigate("processingError", {
          errorMsg: "Only LNURL pay requests are currently supported",
          scan: true,
        });
        return;
      }

      await handleLnurlPayRequest(
        lnurlData,
        data,
        decoded,
        options,
        navigation,
        openPromptAutoClose,
        t
      );
    } catch (e) {
      navigation.navigate("processingError", {
        errorMsg: "Could not fetch data from lnurl",
        scan: true,
      });
    }
    return;
  }

  // Handle Lightning invoice
  try {
    const invoice = extractStrFromURL(data) || data;
    const { amount, timeLeft } = decodeLnInvoice(invoice);
    if (timeLeft <= 0) {
      openPromptAutoClose({ msg: t("invoiceExpired") });
      return;
    }

    await handleLightningInvoice(
      invoice,
      amount,
      options,
      navigation,
      openPromptAutoClose,
      t
    );
    return;
  } catch {
    openPromptAutoClose({
      msg: t("unknownType") + ` "${data}"`,
    });
  }
};

// Handle Cashu token processing
const handleCashuToken = async (
  data: string,
  navigation: NavigationProp<RootStackParamList>,
  openPromptAutoClose: PromptFunction,
  showTrustMintModal: any,
  t: TranslationFunction
) => {
  const info = getTokenInfo(data);
  if (!info) {
    openPromptAutoClose({ msg: t("invalidOrSpent") });
    return;
  }

  // Check if user wants to trust the token mint
  const defaultM = await getDefaultMint();
  const userMints = await getMintsUrls();
  if (
    !hasTrustedMint(userMints, info.mints) ||
    (isStr(defaultM) && !info.mints.includes(defaultM))
  ) {
    try {
      const action = await showTrustMintModal(info.decoded);
      if (action === "trust") {
        // Add mint to trusted mints
        for (const mint of info.mints) {
          await addMint({
            mintUrl: mint,
            id: "",
            active: true,
            fee: 0,
          } as any);
        }
      } else if (action !== "swap") {
        return; // User cancelled
      }
    } catch (e) {
      openPromptAutoClose({ msg: t("invalidOrSpent") });
      return;
    }
  }

  // Claim the token
  const success = await claimToken(data).catch(l);
  if (!success) {
    navigation.navigate("processingError", {
      errorMsg: t("invalidOrSpent", { ns: NS.common }),
    });
    return;
  }

  // Navigate to success
  navigation.navigate("success", {
    amount: info.value,
    memo: info.decoded?.memo,
    isClaim: true,
    isScanned: true,
  });
};

const handleLnurlPayRequest = async (
  lnurlData: any,
  originalData: string,
  decodedUrl: string,
  options: QRScanOptions | undefined,
  navigation: NavigationProp<RootStackParamList>,
  openPromptAutoClose: PromptFunction,
  t: TranslationFunction
) => {
  // If mint and balance are already provided (from payment flow)
  if (options?.mint && options?.balance) {
    return navigation.navigate("selectAmount", {
      mint: options.mint,
      balance: options.balance,
      isMelt: true,
      scanned: true,
      lnurl: {
        userInput: originalData,
        url: decodedUrl,
        data: lnurlData,
      },
    });
  }

  // Get available mints
  const mintsWithBal = await getMintsBalances();
  const mints = await getCustomMintNames(
    mintsWithBal.map((m) => ({ mintUrl: m.mintUrl }))
  );
  const nonEmptyMint = mintsWithBal.filter((m) => m.amount > 0);

  // No funds available
  if (!nonEmptyMint.length) {
    return navigation.navigate("selectMint", {
      mints,
      mintsWithBal,
      isMelt: true,
      allMintsEmpty: true,
      scanned: true,
      lnurl: {
        userInput: originalData,
        url: decodedUrl,
        data: lnurlData,
      },
    });
  }

  // Check minimum sendable amount
  if (
    nonEmptyMint.length === 1 &&
    nonEmptyMint[0].amount * 1000 < lnurlData.minSendable
  ) {
    return navigation.navigate("processingError", {
      errorMsg: "No enough funds for the minimum sendable amount",
      scan: true,
    });
  }

  // Single mint with enough funds
  if (nonEmptyMint.length === 1) {
    return navigation.navigate("selectAmount", {
      mint: nonEmptyMint[0],
      balance: nonEmptyMint[0].amount,
      isMelt: true,
      scanned: true,
      lnurl: {
        userInput: originalData,
        url: decodedUrl,
        data: lnurlData,
      },
    });
  }

  // Multiple mints available
  if (mintsWithBal.some((m) => m.amount * 1000 > lnurlData.minSendable)) {
    navigation.navigate("selectMint", {
      mints,
      mintsWithBal,
      allMintsEmpty: !nonEmptyMint.length,
      isMelt: true,
      scanned: true,
      lnurl: {
        userInput: originalData,
        url: decodedUrl,
        data: lnurlData,
      },
    });
  } else {
    navigation.navigate("processingError", {
      errorMsg: t("noFunds", { ns: NS.common }),
      scan: true,
    });
  }
};

const handleLightningInvoice = async (
  invoice: string,
  amount: number,
  options: QRScanOptions | undefined,
  navigation: NavigationProp<RootStackParamList>,
  openPromptAutoClose: PromptFunction,
  t: TranslationFunction
) => {
  // If payment context with mint and balance
  if (options?.isPayment && options?.mint && options?.balance) {
    const estFee = await checkFees(options.mint.mintUrl, invoice);
    if (amount + estFee > options.balance) {
      return navigation.navigate("processingError", {
        errorMsg: t("noFundsForFee", { ns: NS.common, fee: estFee }),
        scan: true,
      });
    }
    return navigation.navigate("coinSelection", {
      mint: options.mint,
      balance: options.balance,
      amount,
      estFee,
      recipient: invoice,
      isMelt: true,
      scanned: true,
    });
  }

  // If mint and balance are provided (but not payment context)
  if (options?.mint && options?.balance) {
    const estFee = await checkFees(options.mint.mintUrl, invoice);
    if (amount + estFee > options.balance) {
      return navigation.navigate("processingError", {
        errorMsg: t("noFundsForFee", { ns: NS.common, fee: estFee }),
        scan: true,
      });
    }
    return navigation.navigate("coinSelection", {
      mint: options.mint,
      balance: options.balance,
      amount,
      estFee,
      recipient: invoice,
      isMelt: true,
      scanned: true,
    });
  }

  // General invoice handling - need to select mint
  const mintsWithBal = await getMintsBalances();
  const mints = await getCustomMintNames(
    mintsWithBal.map((m) => ({ mintUrl: m.mintUrl }))
  );
  const nonEmptyMint = mintsWithBal.filter((m) => m.amount > 0);

  // No funds
  if (!nonEmptyMint.length) {
    return navigation.navigate("selectMint", {
      mints,
      mintsWithBal,
      isMelt: true,
      invoice,
      invoiceAmount: amount,
      allMintsEmpty: true,
      scanned: true,
    });
  }

  // Single mint
  if (nonEmptyMint.length === 1) {
    const mintUsing = mints.find(
      (m) => m.mintUrl === nonEmptyMint[0].mintUrl
    ) || { mintUrl: "N/A", customName: "N/A" };
    const estFee = await checkFees(mintUsing.mintUrl, invoice);

    if (amount + estFee > nonEmptyMint[0].amount) {
      return navigation.navigate("processingError", {
        errorMsg: t("noFundsForFee", { ns: NS.common, fee: estFee }),
        scan: true,
      });
    }

    return navigation.navigate("coinSelection", {
      mint: mintUsing,
      balance: nonEmptyMint[0].amount,
      amount,
      estFee,
      recipient: invoice,
      isMelt: true,
      scanned: true,
    });
  }

  // Multiple mints - let user choose
  const mintUsing = mints.find(
    (m) => m.mintUrl === nonEmptyMint[0].mintUrl
  ) || { mintUrl: "N/A", customName: "N/A" };
  const estFee = await checkFees(mintUsing.mintUrl, invoice);

  if (mintsWithBal.some((m) => m.amount >= amount + estFee)) {
    navigation.navigate("selectMint", {
      mints,
      mintsWithBal,
      allMintsEmpty: !nonEmptyMint.length,
      invoiceAmount: amount,
      estFee,
      invoice,
      isMelt: true,
      scanned: true,
    });
  } else {
    navigation.navigate("processingError", {
      errorMsg: t("noFunds", { ns: NS.common }),
      scan: true,
    });
  }
};
