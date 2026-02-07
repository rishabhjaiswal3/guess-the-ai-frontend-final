import { useModalStatus } from "@privy-io/react-auth";
import { useEffect } from "react";

const PrivyModalHost = () => {
  const { isOpen } = useModalStatus();

  useEffect(() => {
    if (isOpen) {
      console.log("[Privy] modal open");
    }
  }, [isOpen]);

  // Privy SDK v3+ handles modal rendering internally via PrivyProvider
  // No need to render PrivyModal component manually
  return null;
};

export default PrivyModalHost;
