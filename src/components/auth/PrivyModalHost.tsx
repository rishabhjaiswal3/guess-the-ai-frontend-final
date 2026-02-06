import { PrivyModal, useModalStatus } from "@privy-io/react-auth";

const PrivyModalHost = () => {
  const { isOpen } = useModalStatus();
  if (isOpen) {
    console.log("[Privy] modal open");
  }
  return <PrivyModal open={isOpen} />;
};

export default PrivyModalHost;
