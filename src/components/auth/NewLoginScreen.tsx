import { useEffect, useState, useRef } from "react";
import {
  useLogin,
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
import { setStoredToken, setStoredUsername, getStoredToken } from "@/lib/session";
import networkConfig from "@/lib/networkConfig";
import {
  connectGateWallet,
  getGateWalletCurrentNetwork,
  getPrimaryGateWalletAddress,
  isGateWalletAvailable,
  switchGateWalletNetwork,
  type NetworkInfo,
} from "@/lib/gateWallet";
import { walletConnectProjectId } from "@/lib/privyConfig";

const allowedChain = {
  decimalChainId: 16661,
  hexChainId: "0x4115",
  chainName: "0G Mainnet",
};

function countInjectedProviders(): number {
  if (typeof window === "undefined") return 0;
  const ethereum = (window as { ethereum?: { providers?: unknown[] } }).ethereum;
  if (!ethereum) return 0;
  if (Array.isArray(ethereum.providers) && ethereum.providers.length > 0) {
    return ethereum.providers.length;
  }
  return 1;
}

async function connectInjectedWalletDirectly(): Promise<string> {
  const ethereum = (window as { ethereum?: any }).ethereum;
  if (!ethereum?.request) {
    throw new Error("No injected wallet provider found.");
  }
  const accounts = await ethereum.request({ method: "eth_requestAccounts" });
  if (!Array.isArray(accounts) || !accounts[0]) {
    throw new Error("Wallet did not return an account.");
  }
  return String(accounts[0]);
}

const buildChainParams = () => ({
  chainId: `0x${networkConfig.id.toString(16)}`,
  chainName: networkConfig.name,
  nativeCurrency: networkConfig.nativeCurrency,
  rpcUrls: networkConfig.rpcUrls.default.http,
  blockExplorerUrls: [networkConfig.blockExplorers.default.url],
});

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

function getWalletErrorMessage(err: unknown, fallback: string): string {
  const raw = String(
    (err as { message?: unknown })?.message ||
      (err as { reason?: unknown })?.reason ||
      (err as { shortMessage?: unknown })?.shortMessage ||
      err ||
      ""
  );
  const lower = raw.toLowerCase();
  const code = (err as { code?: number })?.code;
  const eipCode = (err as { details?: { eipCode?: number } })?.details?.eipCode;

  if (code === -32002 || eipCode === -32002 || lower.includes("already pending")) {
    return "Wallet request already pending. Open your wallet extension/app and complete or reject it first.";
  }
  if (lower.includes("selectextension") || lower.includes("evmask") || lower.includes("unexpected error")) {
    return "Wallet extension selection failed. Disable extra wallet extensions and retry with one unlocked wallet.";
  }
  if (lower.includes("user rejected") || lower.includes("rejected the request") || code === 4001) {
    return "Wallet request was rejected. Please approve it in your wallet to continue.";
  }
  if (lower.includes("wallet not detected") || lower.includes("provider not found")) {
    return "No compatible wallet extension detected. Install MetaMask or Gate Wallet and reload.";
  }
  if (lower.includes("locked")) {
    return "Wallet is locked. Unlock your wallet extension and try again.";
  }
  return raw.trim() || fallback;
}

const isProd = import.meta.env.PROD;
const suppressWalletErrors = true;

const NewLoginScreen = () => {
  const { user, ready, authenticated } = usePrivy();
  const walletFallbackInFlightRef = useRef(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [gateConnecting, setGateConnecting] = useState(false);
  const [privyOpening, setPrivyOpening] = useState(false);
  const missingWalletConnectId = !walletConnectProjectId;
  const hasInjectedWallet =
    typeof window !== "undefined" && Boolean((window as { ethereum?: unknown }).ethereum);
  const injectedProviderCount = countInjectedProviders();

  const ensureInjectedChain = async () => {
    const ethereum = (window as { ethereum?: any }).ethereum;
    if (!ethereum?.request) return true;
    const targetChainId = `0x${networkConfig.id.toString(16)}`;
    try {
      const current = await ethereum.request({ method: "eth_chainId" });
      if (typeof current === "string" && current.toLowerCase() === targetChainId.toLowerCase()) {
        return true;
      }
      await ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: targetChainId }],
      });
      return true;
    } catch (err: any) {
      if (err?.code === 4902) {
        try {
          await ethereum.request({
            method: "wallet_addEthereumChain",
            params: [buildChainParams()],
          });
          return true;
        } catch (addErr) {
          console.error("[Privy] chain add failed", addErr);
          return false;
        }
      }
      console.error("[Privy] chain switch failed", err);
      return false;
    }
  };

  const persistLogin = async (payload: Record<string, unknown>) => {
    console.log("[Auth][persistLogin] request", {
      isProd,
      hasWalletAddress: Boolean(payload.walletAddress),
      walletAddressPreview:
        typeof payload.walletAddress === "string"
          ? `${payload.walletAddress.slice(0, 8)}...${payload.walletAddress.slice(-6)}`
          : undefined,
      privyMetaType: (payload.privyMetaData as { type?: string } | undefined)?.type,
      hasPrivyUserId: Boolean(payload.privyUserId),
      hasEmail: Boolean(payload.email),
    });
    const response = await loginV2(payload);
    console.log("[Auth][persistLogin] response", {
      success: response?.success,
      hasToken: Boolean(response?.data?.token),
      message: response?.message,
      code: response?.code,
    });
    if (!response?.success || !response?.data?.token) {
      throw new Error(response?.message || "Login failed");
    }
    setStoredToken(response.data.token);
    if (response.data.username) setStoredUsername(response.data.username);
  };

  const tryInjectedWalletFallback = async (metaType: string, errorSource?: unknown) => {
    console.log("[Privy][Fallback] start", {
      isProd,
      metaType,
      hasInjectedWallet,
      inFlight: walletFallbackInFlightRef.current,
      errorSource,
    });
    if (!hasInjectedWallet || walletFallbackInFlightRef.current) return false;
    walletFallbackInFlightRef.current = true;
    try {
      const switched = await ensureInjectedChain();
      if (!switched) {
        console.warn("[Privy][Fallback] chain switch failed");
        if (!suppressWalletErrors) {
          setError("Please switch MetaMask to the 0G network and try again.");
        }
        return false;
      }
      const address = await connectInjectedWalletDirectly();
      console.log("[Privy][Fallback] got injected address", {
        addressPreview: `${address.slice(0, 8)}...${address.slice(-6)}`,
      });
      await persistLogin({
        walletAddress: address,
        privyMetaData: { type: metaType },
      });
      console.log("[Privy][Fallback] backend login success", { metaType });
      setError("");
      return true;
    } catch (fallbackErr) {
      console.error("[WalletFallback] direct connect failed", fallbackErr, errorSource);
      if (!suppressWalletErrors) {
        setError(getWalletErrorMessage(fallbackErr, "Failed to connect wallet."));
      }
      return false;
    } finally {
      console.log("[Privy][Fallback] done");
      walletFallbackInFlightRef.current = false;
    }
  };

  const { login: openPrivyLogin } = useLogin({
    onError: async (error) => {
      // Ignore user-initiated exit (closing the modal)
      if (error === "exited_auth_flow" || (error as unknown as { type?: string })?.type === "exited_auth_flow") {
        console.log("[Privy] user exited auth flow");
        return;
      }
      const lower = String(error || "").toLowerCase();
      const err = error as unknown as { code?: number; details?: { eipCode?: number } };
      const errorCode = err?.code;
      const eipCode = err?.details?.eipCode;
      if (errorCode === -32002 || eipCode === -32002) {
        if (!suppressWalletErrors) {
          setError(getWalletErrorMessage(error, "Wallet connection already pending."));
        }
        return;
      }
      if (
        hasInjectedWallet &&
        (lower.includes("selectextension") || lower.includes("evmask") || lower.includes("unexpected error"))
      ) {
        console.warn("[Privy][onError] extension bridge issue detected", {
          isProd,
          lower,
          code: errorCode,
          eipCode,
        });
        const handledByFallback = await tryInjectedWalletFallback("injected_wallet_onerror_fallback", error);
        if (handledByFallback) return;
      }
      if (!suppressWalletErrors) {
        setError(getWalletErrorMessage(error, "Failed to open wallet connection."));
      }
      console.error("[Privy] login modal error", error);
    },
  });
  const { isOpen } = useModalStatus();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");

  const { sendCode, loginWithCode, state: emailState } = useLoginWithEmail({
    onError: (err) => {
      const errStr = String(err);
      if (errStr.includes("exited_auth_flow")) return;
      setError(getErrorMessage(err, "Email login error"));
    },
  });

  useEffect(() => {
    if (missingWalletConnectId) {
      console.warn("[Privy] WalletConnect project ID missing – mobile wallet deep links will fail.");
    }
  }, [missingWalletConnectId]);

  const { initOAuth, loading: oauthLoading } = useLoginWithOAuth({
    onError: (err) => {
      // Ignore user-initiated exit (closing the modal)
      const errStr = String(err);
      if (errStr.includes("exited_auth_flow") || (err as unknown as { type?: string })?.type === "exited_auth_flow") {
        console.log("[Privy] user exited OAuth flow");
        return;
      }
      setError(getErrorMessage(err, "OAuth error"));
    },
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

  useEffect(() => {
    if (!isOpen) {
      setPrivyOpening(false);
    }
  }, [isOpen]);

  // Note: Privy-authenticated login submission is centralized in AuthContext.
  // Avoid calling /v2/login from this screen after Privy state changes.

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
      try {
        if (hasInjectedWallet) {
          const switched = await ensureInjectedChain();
          if (!switched) {
            setError("Please switch MetaMask to the 0G network and try again.");
            return;
          }
          const address = await connectInjectedWalletDirectly();
          await persistLogin({
            walletAddress: address,
            sessionWallet: "VERIFIED",
            privyMetaData: { type: "injected_wallet_gate_fallback" },
          });
          localStorage.setItem("sessionWallet", "VERIFIED");
          setError("");
          return;
        }
      } catch (fallbackErr) {
        console.error("[GateWallet] injected fallback failed", fallbackErr);
      }
      setError(getWalletErrorMessage(err, "Failed to connect Gate Wallet."));
    } finally {
      setGateConnecting(false);
    }
  };

  const isSendingCode = emailState?.status === "sending-code";
  const isSubmittingCode = emailState?.status === "submitting-code" || loading;

  return (
    <div className="min-h-[calc(100vh-140px)] lg:min-h-[calc(100vh-120px)] px-4 pt-24 pb-24 lg:pb-16">
      <div className="max-w-6xl mx-auto">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr] items-stretch">
          <div className="glass-strong rounded-3xl p-10 border border-secondary/25 h-full">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl glass glow-magenta mb-5">
              <ShieldCheck className="w-8 h-8 text-secondary" />
            </div>
            <h1 className="text-4xl font-black gradient-text mb-3">Welcome to Guess the AI</h1>
            <p className="text-base text-foreground/80 mb-8 leading-relaxed">
              Connect your wallet or login with OTP/social to start playing. Use the 0G network for
              best compatibility with signing.
            </p>

            <div className="rounded-2xl border border-secondary/30 bg-secondary/10 p-6 text-sm text-foreground/85">
              <p className="font-semibold text-base text-secondary mb-2">0G Network Required</p>
              <p className="mb-3 leading-relaxed">
                Please make sure your wallet is on the 0G network. If you do not have the 0G network
                added, add it using the details below. Signing may fail if you are on a different
                network.
              </p>
              <div className="space-y-2 font-mono text-xs text-foreground/80">
                <div>Network Name: 0G Mainnet</div>
                <div>Chain ID: 16661</div>
                <div>Token Symbol: 0G</div>
                <div>RPC URL: https://evmrpc.0g.ai</div>
                <div>Storage Indexer: https://indexer-storage-turbo.0g.ai</div>
                <div>Block Explorer: https://chainscan.0g.ai</div>
              </div>
            </div>
          </div>

          <GlowingBorder glowColor="magenta" intensity="high" className="rounded-3xl h-full">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-strong rounded-3xl p-10 h-full"
            >
              <div className="text-center mb-6">
                <h2 className="text-3xl font-black gradient-text mb-2">Sign In</h2>
                <p className="text-base text-foreground/80">
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
                onClick={async () => {
                  console.log("[Privy] wallet connect clicked", {
                    isProd,
                    ready,
                    isOpen,
                    privyOpening,
                    hasInjectedWallet,
                    injectedProviderCount,
                    missingWalletConnectId,
                  });
                  if (!ready) {
                    if (!suppressWalletErrors) {
                      setError("Privy is still loading. Please wait a moment.");
                    }
                    return;
                  }
                  if (missingWalletConnectId && !hasInjectedWallet) {
                    if (!suppressWalletErrors) {
                      setError("WalletConnect Project ID is missing. Add VITE_WALLETCONNECT_PROJECT_ID in .env and reload.");
                    }
                    return;
                  }
                  if (privyOpening) return;
                  setPrivyOpening(true);
                  try {
                    // Always try Privy flow first so Privy session/user state stays consistent.
                    // Direct injected wallet path is only a fallback when Privy fails to open.
                    if (hasInjectedWallet && injectedProviderCount > 1) {
                      console.warn(
                        "[Privy] multiple injected providers detected; letting Privy handle provider selection."
                      );
                    }
                    openPrivyLogin({ loginMethods: ["wallet"] });
                    console.log("[Privy] openPrivyLogin invoked");
                  } catch (err) {
                    console.error("[Privy] open wallet modal failed", err);
                    // Fallback path: connect via injected wallet directly and finish backend login.
                    if (hasInjectedWallet) {
                      const handledByFallback = await tryInjectedWalletFallback("injected_wallet_fallback", err);
                      if (handledByFallback) return;
                    }
                    if (!suppressWalletErrors) {
                      setError(getWalletErrorMessage(err, "Failed to open wallet connection."));
                    }
                  } finally {
                    // If modal opens successfully, useModalStatus effect keeps this in sync.
                    // If it fails before opening, this unblocks retries.
                    if (!isOpen) setPrivyOpening(false);
                  }
                }}
                disabled={privyOpening}
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
