import { useEffect, useState, useRef } from "react";
import {
  useLogin,
  useLoginWithEmail,
  useLoginWithOAuth,
  useModalStatus,
} from "@privy-io/react-auth";
import { useAuth } from "@/context/AuthContext";

import { motion } from "framer-motion";
import { Mail, KeyRound, Wallet, ShieldCheck, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import GlowingBorder from "@/components/effects/GlowingBorder";
import { loginV2 } from "@/services/authApi";
import { setStoredToken, setStoredUsername, getStoredToken } from "@/lib/session";
import networkConfig from "@/lib/networkConfig";
import {
  connectGateWallet,
  getGateWalletCurrentNetwork,
  getGateWalletProvider,
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

import KultLogo from "@/assets/kult-0G-logo.png";

function getErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === "object" && "message" in err) {
    const msg = (err as { message?: unknown }).message;
    if (typeof msg === "string" && msg.trim()) return msg;
  }
  return fallback;
}

const NewLoginScreen = () => {
  const { user, ready, authenticated, loginWithSiwe } = useAuth();
  const walletFallbackInFlightRef = useRef(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [privyOpening, setPrivyOpening] = useState(false);
  const [pendingAddress, setPendingAddress] = useState<string | null>(null);
  const [pendingProvider, setPendingProvider] = useState<any | null>(null);
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

  const handleVerifyOtp = async () => {
    console.log("[Auth] verify OTP clicked", { email, code: otp });
    setError("");
    if (!otp.trim()) {
      setError("OTP is required.");
      return;
    }
    try {
      await loginWithCode({ code: otp.trim() });
    } catch (err) {
      setError(getErrorMessage(err, "Failed to verify OTP"));
    }
  };


  const handleWalletSelect = async (type: 'injected' | 'gate' | 'privy') => {
    console.log("[Auth] Wallet selected", { type });
    setError("");

    if (type === 'privy') {
      if (!ready) {
        setError("Authentication system is still loading...");
        return;
      }
      setPrivyOpening(true);
      try {
        openPrivyLogin({ loginMethods: ["wallet"] });
      } catch (err) {
        setError(getWalletErrorMessage(err, "Failed to open wallet modal."));
      } finally {
        if (!isOpen) setPrivyOpening(false);
      }
      return;
    }

    setLoading(true);
    try {
      let address = "";
      let provider = null;

      if (type === 'gate') {
        const available = isGateWalletAvailable();
        if (!available) throw new Error("Gate Wallet not detected. Please install or enable it.");
        const info = await connectGateWallet();
        address = getPrimaryGateWalletAddress(info) || "";
        provider = getGateWalletProvider();
      } else {
        await ensureInjectedChain();
        address = await connectInjectedWalletDirectly();
        provider = (window as any).ethereum;
      }

      if (!address) throw new Error("Wallet did not return an address.");

      // Automatic Step 2: Signature Request
      console.log("[Auth] Connection successful, requesting signature...", { address });
      const success = await loginWithSiwe(address, provider);
      if (success) {
        localStorage.setItem("sessionWallet", "VERIFIED");
      }
    } catch (err: any) {
      console.error(`[Auth] ${type} login failed`, err);
      setError(getWalletErrorMessage(err, `Failed to connect ${type === 'gate' ? 'Gate Wallet' : 'wallet'}.`));
    } finally {
      setLoading(false);
    }
  };

  const isSendingCode = emailState?.status === "sending-code";
  const isSubmittingCode = emailState?.status === "submitting-code" || loading;

  return (
    <div className="px-4 pb-12 flex items-center justify-center">
      <div className="max-w-6xl mx-auto">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr] items-stretch">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ scale: 1.005 }}
            className="glass-3d glass-3d-hover rounded-3xl p-8 border border-secondary/25 h-full relative overflow-hidden"
          >
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-4">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl glass glow-magenta">
                  <ShieldCheck className="w-7 h-7 text-secondary" />
                </div>
                <img src={KultLogo} alt="Kult 0G" className="h-10 w-auto object-contain brightness-110" />
              </div>
              <h1 className="text-4xl font-black gradient-text mb-3 leading-tight">Welcome to <br />Guess the AI</h1>
              <p className="text-base text-foreground/80 mb-6 leading-relaxed font-medium">
                The ultimate battle of intuition. <br />Connect your wallet to prove you can spot the machine.
              </p>

              <div className="rounded-2xl border border-secondary/30 bg-secondary/5 p-5 backdrop-blur-md">
                <p className="font-black text-base text-secondary mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                  0G Network Required
                </p>
                <p className="mb-3 leading-relaxed text-xs text-foreground/70">
                  Join the decentralized proving ground on 0G Mainnet. Configure your wallet with the details below.
                </p>
                <div className="grid grid-cols-2 gap-y-3 gap-x-4 font-mono text-[9px] text-foreground/60">
                  <div className="space-y-1">
                    <p className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold">Network Name</p>
                    <p className="font-bold text-foreground">0G Mainnet</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold">Chain ID</p>
                    <p className="font-bold text-foreground">16661</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold">Token Symbol</p>
                    <p className="font-bold text-foreground">0G</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold">RPC URL</p>
                    <p className="font-bold text-foreground truncate">https://evmrpc.0g.ai</p>
                  </div>
                  <div className="space-y-1 col-span-2">
                    <p className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold">Storage Indexer</p>
                    <p className="font-bold text-foreground truncate">https://indexer-storage-turbo.0g.ai</p>
                  </div>
                  <div className="space-y-1 col-span-2">
                    <p className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold">Block Explorer</p>
                    <p className="font-bold text-foreground truncate">https://chainscan.0g.ai</p>
                  </div>
                </div>
              </div>
            </div>
            {/* Ambient light effects inside the card */}
            <div className="absolute -top-20 -left-20 w-40 h-40 bg-primary/10 rounded-full blur-[80px]" />
            <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-secondary/10 rounded-full blur-[80px]" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ scale: 1.005 }}
            className="glass-3d glass-3d-hover rounded-3xl p-8 h-full relative overflow-hidden border border-magenta/40 shadow-[0_0_20px_rgba(139,93,255,0.15)]"
          >
            <div className="text-center mb-4">
              <h2 className="text-2xl font-black gradient-text mb-1">Sign In</h2>
              <p className="text-sm text-foreground/80">
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
                        className="pl-10 h-14 text-lg"
                      />
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-14 text-lg font-bold border-secondary/30 hover:bg-secondary/10"
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
                      <span className="relative z-10 flex items-center justify-center">
                        {isSubmittingCode ? "Verifying..." : "Verify OTP"}
                      </span>
                    </Button>
                  </div>
                </>
              )}
            </div>

            <div className="mt-6 space-y-3">
              {/* 
              <Button
                type="button"
                variant="outline"
                className="w-full h-14 text-lg font-bold border-secondary/40 text-secondary hover:bg-secondary/10"
                onClick={() => handleWalletSelect('gate')}
                disabled={loading}
              >
                <span className="relative z-10 flex items-center justify-center">
                  <Bot className="w-5 h-5 mr-2" />
                  {loading ? "Connecting Gate..." : "Connect Gate Wallet"}
                </span>
              </Button>
              */}

              <Button
                type="button"
                className="w-full h-14 text-lg font-bold btn-gradient text-primary-foreground shadow-[0_0_20px_rgba(139,93,255,0.2)]"
                onClick={() => handleWalletSelect('privy')}
                disabled={loading || privyOpening}
              >
                <span className="relative z-10 flex items-center justify-center">
                  <Wallet className="w-5 h-5 mr-2" />
                  Connect Wallet
                </span>
              </Button>
            </div>

            <div className="mt-6">
              <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                <span className="flex-1 h-px bg-border" />
                Or continue with
                <span className="flex-1 h-px bg-border" />
              </div>
              <div className="grid gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-14 text-lg font-semibold border-border/40 hover:bg-background/10"
                  onClick={() => initOAuth({ provider: "google" })}
                  disabled={oauthLoading}
                >
                  Google
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-14 text-lg font-semibold border-border/40 hover:bg-background/10"
                  onClick={() => initOAuth({ provider: "discord" })}
                  disabled={oauthLoading}
                >
                  Discord
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};


export default NewLoginScreen;
