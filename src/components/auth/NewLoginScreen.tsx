import { useEffect, useState } from "react";
import {
  useConnectWallet,
  useLoginWithEmail,
  useLoginWithOAuth,
  useModalStatus,
  usePrivy,
} from "@privy-io/react-auth";
import { motion } from "framer-motion";
import { Mail, KeyRound, Wallet, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import GlowingBorder from "@/components/effects/GlowingBorder";
import { loginV2 } from "@/services/authApi";
import { setStoredToken, setStoredUsername } from "@/lib/session";
import {
  connectGateWallet,
  getGateWalletCurrentNetwork,
  getPrimaryGateWalletAddress,
  isGateWalletAvailable,
  switchGateWalletNetwork,
  type NetworkInfo,
} from "@/lib/gateWallet";

const allowedChain = {
  decimalChainId: 16661,
  hexChainId: "0x4115",
  chainName: "0G Mainnet",
};

function normalizeChainId(chainId?: string) {
  if (!chainId) return undefined;
  if (chainId.startsWith("0x")) {
    const parsed = Number.parseInt(chainId, 16);
    return Number.isFinite(parsed) ? String(parsed) : chainId;
  }
  return chainId;
}

function getNetworkLabel(network: NetworkInfo | null | undefined) {
  if (network === null) return "All Networks";
  if (!network) return "Unknown";
  return network.name || network.chainId;
}

const NewLoginScreen = () => {
  const { user, ready, authenticated } = usePrivy();
  const { login: openPrivyLogin } = useLogin({
    onError: (error) => {
      console.error("[Privy] login modal error", error);
    },
  });
  const { isOpen } = useModalStatus();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [gateConnecting, setGateConnecting] = useState(false);

  const persistLogin = async (payload: Record<string, unknown>) => {
    const response = await loginV2(payload);
    if (!response?.success || !response?.data?.token) {
      throw new Error(response?.message || "Login failed");
    }
    setStoredToken(response.data.token);
    if (response.data.username) setStoredUsername(response.data.username);
  };

  const { connectWallet } = useConnectWallet({
    onSuccess: async (walletData) => {
      console.log("[Privy] connectWallet success", JSON.stringify(walletData, null, 2));

      // The wallet data has nested structure: { wallet: { address, walletClientType, ... } }
      const walletObj = (walletData as { wallet?: Record<string, unknown> })?.wallet;
      const address = walletObj?.address as string | undefined;
      const walletClientType = walletObj?.walletClientType as string | undefined;
      const connectorType = walletObj?.connectorType as string | undefined;

      console.log("[Privy] extracted address:", address);

      if (!address) {
        console.warn("[Privy] Wallet connect succeeded but no address found. Full object:", walletData);
        setError("Connected wallet has no address. Please try again.");
        return;
      }

      try {
        const walletType = walletClientType || connectorType || "wallet";
        const payload: Record<string, unknown> = {
          walletAddress: address,
          privyMetaData: { type: walletType },
        };
        console.log("[Privy] calling persistLogin with:", payload);
        await persistLogin(payload);
      } catch (err) {
        console.error("[Privy] backend login failed from wallet connect", err);
        setError("Wallet login failed. Please try again.");
      }
    },
    onError: (error) => {
      console.error("[Privy] connectWallet error", error);
      setError(getErrorMessage(error, "Failed to connect wallet"));
    },
  });

  const { initOAuth, loading: oauthLoading } = useLoginWithOAuth({
    onError: (err) => setError(getErrorMessage(err, "OAuth error")),
  });

  const { sendCode, loginWithCode, state: emailState } = useLoginWithEmail({
    onError: (err) => setError(getErrorMessage(err, "Email login error")),
  });

  useEffect(() => {
    console.log("[Privy] login screen mount", {
      ready,
      authenticated,
      hasUser: Boolean(user),
      userId: user?.id,
    });
  }, []);

  useEffect(() => {
    console.log("[Privy] state change", {
      ready,
      authenticated,
      hasUser: Boolean(user),
      userId: user?.id,
      modalOpen: isOpen,
      userWallets: user?.linkedAccounts?.filter((a: { type: string }) => a.type === "wallet"),
    });
  }, [ready, authenticated, user, isOpen]);

  // Handle wallet login when user becomes authenticated with a wallet
  const [walletLoginHandled, setWalletLoginHandled] = useState(false);
  useEffect(() => {
    if (!authenticated || !user || walletLoginHandled) return;

    // Find wallet address from linked accounts
    const walletAccount = user.linkedAccounts?.find(
      (account: { type: string; address?: string }) => account.type === "wallet" && account.address
    ) as { type: string; address: string; walletClientType?: string } | undefined;

    if (walletAccount?.address) {
      console.log("[Privy] Found wallet in user linkedAccounts:", walletAccount);
      setWalletLoginHandled(true);

      const payload: Record<string, unknown> = {
        walletAddress: walletAccount.address,
        privyMetaData: { type: walletAccount.walletClientType || "wallet" },
      };

      persistLogin(payload)
        .then(() => {
          console.log("[Privy] Backend login successful via user wallet");
        })
        .catch((err) => {
          console.error("[Privy] Backend login failed via user wallet", err);
          setError("Wallet login failed. Please try again.");
        });
    }
  }, [authenticated, user, walletLoginHandled]);

  useEffect(() => {
    setError("");
  }, [step]);

  const handleSendOtp = async () => {
    console.log("[Auth] send OTP clicked", { email });
    setError("");
    if (!email.trim()) {
      setError("Email is required.");
      return;
    }
    try {
      await sendCode({ email: email.trim() });
      setStep("otp");
    } catch (err) {
      setError(getErrorMessage(err, "Failed to send OTP"));
    }
  };

  const handleVerifyOtp = async () => {
    console.log("[Auth] verify OTP clicked", { email, otpLength: otp.length });
    setError("");
    if (!otp.trim()) {
      setError("OTP is required.");
      return;
    }
    setLoading(true);
    try {
      await loginWithCode({ code: otp.trim() });
      const payload: any = { email: email.trim() };
      if (user?.id) payload.privyUserId = user.id;
      payload.privyMetaData = { ...(payload.privyMetaData ?? {}), type: "email" };
      await persistLogin(payload);
    } catch (err) {
      setError(getErrorMessage(err, "Invalid OTP"));
    } finally {
      setLoading(false);
    }
  };

  const handleGateConnect = async () => {
    console.log("[GateWallet] connect clicked");
    if (gateConnecting) return;
    setError("");
    setGateConnecting(true);

    try {
      const available = isGateWalletAvailable();
      console.log("[GateWallet] available", { available });
      if (!available) {
        throw new Error("Gate Wallet not detected. Please install or enable it.");
      }

      const accountInfo = await connectGateWallet();
      console.log("[GateWallet] account info", accountInfo);
      const address = getPrimaryGateWalletAddress(accountInfo);

      if (!address) {
        throw new Error("Gate Wallet did not return an address.");
      }

      let network = await getGateWalletCurrentNetwork().catch(() => undefined);
      console.log("[GateWallet] current network", network);

      const normalized = normalizeChainId(network?.chainId);
      const allowed = String(allowedChain.decimalChainId);

      if (network === null || (normalized && normalized !== allowed)) {
        try {
          console.log("[GateWallet] switching network", { target: allowedChain.hexChainId });
          await switchGateWalletNetwork(allowedChain.hexChainId);
          network = await getGateWalletCurrentNetwork().catch(() => undefined);
          console.log("[GateWallet] network after switch", network);
        } catch (switchError) {
          console.warn("Failed to auto-switch network:", switchError);
        }
      }

      const finalNormalized = normalizeChainId(network?.chainId);
      if (network === null) {
        throw new Error(
          "Gate Wallet is set to All Networks. Please select 0G Mainnet manually."
        );
      }

      if (!finalNormalized || finalNormalized !== allowed) {
        throw new Error(
          `Gate Wallet is on ${getNetworkLabel(network)}. Please switch to ${allowedChain.chainName}.`
        );
      }

      const payload: any = {
        walletAddress: address,
        sessionWallet: "VERIFIED",
        privyMetaData: { type: "gate_wallet" },
      };

      console.log("[Auth] loginV2 payload (gate)", payload);
      await persistLogin(payload);
      localStorage.setItem("sessionWallet", "VERIFIED");
    } catch (err: any) {
      setError(err?.message || "Failed to connect Gate Wallet.");
    } finally {
      setGateConnecting(false);
    }
  };

  const isSendingCode = emailState?.status === "sending-code";
  const isSubmittingCode = emailState?.status === "submitting-code" || loading;

  return (
    <div className="min-h-[calc(100vh-140px)] lg:min-h-[calc(100vh-120px)] px-4 pt-24 pb-24 lg:pb-16">
      <div className="max-w-lg mx-auto">
        <GlowingBorder glowColor="magenta" intensity="high" className="rounded-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-strong rounded-3xl p-8"
          >
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl glass glow-magenta mb-4">
                <ShieldCheck className="w-8 h-8 text-secondary" />
              </div>
              <h1 className="text-3xl font-black gradient-text mb-2">Sign In</h1>
              <p className="text-sm text-muted-foreground">
                Login with OTP, wallet, or social accounts to start playing.
              </p>
            </div>

            {error && (
              <div className="mb-4 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-4">
              {step === "email" ? (
                <>
                  <div>
                    <label className="text-xs text-muted-foreground">Email</label>
                    <div className="relative mt-2">
                      <Mail className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                      <Input
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="pl-9"
                      />
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={handleSendOtp}
                    disabled={isSendingCode}
                  >
                    {isSendingCode ? "Sending..." : "Send OTP"}
                  </Button>
                </>
              ) : (
                <>
                  <div>
                    <label className="text-xs text-muted-foreground">OTP</label>
                    <div className="relative mt-2">
                      <KeyRound className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                      <Input
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        placeholder="Enter 6-digit OTP"
                        className="pl-9"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => setStep("email")}
                    >
                      Edit Email
                    </Button>
                    <Button
                      type="button"
                      className="flex-1 btn-gradient text-primary-foreground"
                      onClick={handleVerifyOtp}
                      disabled={isSubmittingCode}
                    >
                      {isSubmittingCode ? "Verifying..." : "Verify OTP"}
                    </Button>
                  </div>
                </>
              )}
            </div>

            <div className="mt-6 grid gap-3">
              <Button
                type="button"
                variant="outline"
                className="w-full border-secondary/40 text-secondary hover:bg-secondary/10"
                onClick={handleGateConnect}
                disabled={gateConnecting}
              >
                {gateConnecting ? "Connecting Gate Wallet..." : "Connect Gate Wallet"}
              </Button>
              <Button
                type="button"
                className="w-full btn-gradient text-primary-foreground"
                onClick={() => {
                  console.log("[Privy] connect wallet clicked", { ready, isOpen });
                  if (!ready) {
                    setError("Privy is still loading. Please wait a moment.");
                    return;
                  }
                  connectWallet();
                }}
              >
                <Wallet className="w-4 h-4 mr-2" />
                Connect Wallet
              </Button>
            </div>

            <div className="mt-6">
              <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                <span className="flex-1 h-px bg-border" />
                Or continue with
                <span className="flex-1 h-px bg-border" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => initOAuth({ provider: "google" })}
                  disabled={oauthLoading}
                >
                  Google
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => initOAuth({ provider: "discord" })}
                  disabled={oauthLoading}
                >
                  Discord
                </Button>
              </div>
            </div>
          </motion.div>
        </GlowingBorder>
      </div>
    </div>
  );
};

const getErrorMessage = (err: unknown, fallback: string): string => {
  if (err && typeof err === "object" && "message" in err) {
    const msg = (err as { message?: unknown }).message;
    if (typeof msg === "string" && msg.trim()) return msg;
  }
  return fallback;
};

export default NewLoginScreen;
