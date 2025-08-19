import { l } from "@src/logger";
import { ConsoleLogger, KYMHandler } from "cashu-kym";
import { useEffect, useState } from "react";

type SearchResult = Awaited<ReturnType<KYMHandler["discover"]>>;

const useMintRecommendations = () => {
  const [result, setResult] = useState<SearchResult>();
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    const handler = new KYMHandler({
      relays: ["wss://relay.damus.io", "wss://relay.primals.io"],
      timeout: 2000,
      auditorBaseUrl: "https://api.audit.8333.space",
      logger: new ConsoleLogger({ logLevel: "debug" }),
    });
    handler
      .discover()
      .then((res) => {
        setResult(res);
        console.log(res.results);
      })
      .catch((e) => {
        l("useMintRecommendations", e);
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
