import { KYMHandler } from "cashu-kym";
import { useEffect, useState } from "react";

type SearchResult = Awaited<ReturnType<KYMHandler["discover"]>>;

const useMintRecommendations = () => {
  const [result, setResult] = useState<SearchResult>();
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    const handler = new KYMHandler({
      relays: ["wss://relay.damus.io"],
      timeout: 3000,
      auditorBaseUrl: "https://https://api.audit.8333.space",
    });
    handler
      .discover()
      .then((res) => setResult(res))
      .catch((e) => {
        setIsError(true);
        if (e instanceof Error) {
          setError(e.message);
        } else {
          setError("Something went wrong");
        }
      })
      .finally(() => setIsLoading(false));
  }, []);

  return { isLoading, isError, error, result };
};

export default useMintRecommendations;
