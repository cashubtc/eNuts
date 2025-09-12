import { Token } from "@cashu/cashu-ts";
import { useEffect, useRef, useState } from "react";

export const useCheckSpent = (token: Token) => {
  const [spent, setSpent] = useState(false);
  const isMarkedAsSpent = useRef(false);

  useEffect(() => {
    let unsub: (() => void) | undefined;
    let isCancelled = false;

    const checkProofsSpent = async () => {
      //TODO: Add check spent
    };

    void checkProofsSpent();

    return () => {
      isCancelled = true;
      if (unsub) {
        unsub();
      }
    };
  }, [token]);

  return spent;
};
