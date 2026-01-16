import { useState, useEffect, useMemo } from "react";
import { appLogger } from "@src/logger";
import { useMints } from "coco-cashu-react";
import { normalizeMintUrl } from "@util";

type MintRecommendation = {
  id: number;
  url: string;
  info: string;
  name: string;
  balance: number;
  sum_donations: number;
  updated_at: string;
  next_update: string;
  state: string;
  n_errors: number;
  n_mints: number;
  n_melts: number;
};

interface UseDiscoverMintsResult {
  recommendations: MintRecommendation[];
  isLoading: boolean;
  isError: boolean;
}

export default function useDiscoverMints(): UseDiscoverMintsResult {
  const [allRecommendations, setAllRecommendations] = useState<MintRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const { mints } = useMints();

  useEffect(() => {
    async function fetchRecommendations() {
      setIsLoading(true);
      try {
        const res = await fetch("https://api.audit.8333.space/mints");
        if (!res.ok) {
          setIsError(true);
          setIsLoading(false);
          return;
        }

        const data: MintRecommendation[] = await res.json();
        setAllRecommendations(data);
        setIsLoading(false);
      } catch (error) {
        appLogger.error("useDiscoverMints:fetchRecommendations", error);
        setIsError(true);
        setIsLoading(false);
      }
    }
    fetchRecommendations();
  }, []);

  // Filter out mints that are already trusted
  const recommendations = useMemo(() => {
    const trustedMintUrls = new Set(
      mints.filter((mint) => mint.trusted).map((mint) => normalizeMintUrl(mint.mintUrl)),
    );

    return allRecommendations.filter((recommendation) => {
      const normalizedUrl = normalizeMintUrl(recommendation.url);
      return !trustedMintUrls.has(normalizedUrl);
    });
  }, [allRecommendations, mints]);

  return {
    recommendations,
    isLoading,
    isError,
  };
}
