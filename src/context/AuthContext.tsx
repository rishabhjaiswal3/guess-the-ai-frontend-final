import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { usePrivy, useLogin, type User } from "@privy-io/react-auth";
import { loginV2, type LoginRequest, type ProfilePayload, getProfile, updateUsername } from "@/services/authApi";
import {
  clearJwtFromUrl,
  clearStoredSession,
  getJwtFromUrl,
  getStoredToken,
  getStoredUsername,
  onTokenChange,
  onUsernameChange,
  setStoredToken,
  setStoredUsername,
} from "@/lib/session";

const AuthContext = createContext<{
  token: string;
  username: string;
  profile: ProfilePayload | null;
  loading: boolean;
  error: string | null;
  isPrivyReady: boolean;
  isPrivyAuthenticated: boolean;
  openLogin: () => void;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  updateProfileUsername: (name: string) => Promise<boolean>;
}>({
  token: "",
  username: "",
  profile: null,
  loading: false,
  error: null,
  isPrivyReady: false,
  isPrivyAuthenticated: false,
  openLogin: () => {},
  logout: () => {},
  refreshProfile: async () => {},
  updateProfileUsername: async () => false,
});

const getWalletAddress = (user?: User | null) => {
  if (!user) return "";
  if (user.wallet?.address) return user.wallet.address;
  const linkedWallet = (user.linkedAccounts as Array<{ type?: string; address?: string }>)?.find(
    (account) => account.type === "wallet" && account.address
  );
  return linkedWallet?.address ?? "";
};

const getLinkedAccountType = (linked: Array<{ type?: string }> = []) => {
  if (linked.some((account) => account.type === "discord_oauth")) return "discord";
  if (linked.some((account) => account.type === "google_oauth")) return "google";
  if (linked.some((account) => account.type === "email")) return "email";
  if (linked.some((account) => account.type === "sms")) return "sms";
  return "";
};

const getPrivyAccountType = (user?: User | null) => {
  if (!user) return "";
  const linked = (user.linkedAccounts ?? []) as Array<{ type?: string }>;
  const linkedType = getLinkedAccountType(linked);
  const walletClientType = String((user.wallet as any)?.walletClientType || "").trim().toLowerCase();
  const connectorType = String((user.wallet as any)?.connectorType || "").trim().toLowerCase();
  const isEmbedded = connectorType === "embedded";
  if (!isEmbedded) {
    if (walletClientType) return walletClientType;
    if (connectorType) return connectorType;
  }
  if (linkedType) return linkedType;
  if (walletClientType) return walletClientType;
  if (connectorType) return connectorType;
  if (linked.some((account) => account.type === "wallet")) return "wallet";
  return "";
};

const buildLoginPayloadFromPrivy = (user?: User | null): LoginRequest | null => {
  if (!user) return null;
  const address = getWalletAddress(user);
  const linked = (user.linkedAccounts ?? []) as Array<Record<string, any>>;
  const discordAccount = linked.find((account) => account.type === "discord_oauth");
  const googleAccount = linked.find((account) => account.type === "google_oauth");
  const emailAccount = linked.find((account) => account.type === "email");
  const walletAccount = linked.find((account) => account.type === "wallet");

  const discordUsername = discordAccount?.username || discordAccount?.email || discordAccount?.subject;
  const discordUserId = discordAccount?.subject || discordAccount?.id;
  const googleEmail = googleAccount?.email || googleAccount?.address;
  const googleSubject = googleAccount?.subject;
  const resolvedEmail = user.email?.address || googleEmail || emailAccount?.address;
  const chainId =
    (user.wallet as any)?.chainId ||
    (walletAccount as any)?.chainId ||
    (walletAccount as any)?.wallet?.chainId ||
    (user.wallet as any)?.walletClientType?.chainId;
  const providerName =
    walletAccount?.providerName ||
    walletAccount?.provider ||
    linked.find((a) => a.providerName)?.providerName ||
    linked.find((a) => a.provider)?.provider;

  const payload: LoginRequest = {};
  if (user.id) payload.privyUserId = user.id;
  if (address) payload.walletAddress = address;
  if (resolvedEmail) payload.email = resolvedEmail;
  if (discordUsername) payload.discord = discordUsername;
  if (discordUserId) payload.discordUserId = discordUserId;
  if (!resolvedEmail && googleSubject) payload.otherId = googleSubject;

  const accountType = getPrivyAccountType(user);
  if (accountType) {
    payload.privyMetaData = {
      ...(payload.privyMetaData ?? {}),
      type: accountType,
      address,
      walletAddress: address,
      email: resolvedEmail,
      discord: discordUsername,
      discordUserId,
      privyUserId: user.id,
      chainId,
      providerName,
    };
  }

  return payload;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { ready, authenticated, logout: privyLogout, user } = usePrivy();
  const { login: privyLogin } = useLogin({
    onError: (error) => {
      // Ignore user-initiated exit (closing the modal)
      if (error === "exited_auth_flow" || String(error).includes("exited_auth_flow")) {
        console.log("[Privy] user exited auth flow");
        return;
      }
      console.error("[Privy] login error", error);
    },
  });
  const [token, setToken] = useState(() => getStoredToken());
  const [username, setUsername] = useState(() => getStoredUsername());
  const [profile, setProfile] = useState<ProfilePayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loginAttemptedRef = useRef(false);
  const jwtAttemptedRef = useRef(false);
  const loggingOutRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const offToken = onTokenChange(setToken);
    const offUsername = onUsernameChange(setUsername);
    const onStorage = (event: StorageEvent) => {
      if (event.key === "token") setToken(event.newValue ?? "");
      if (event.key === "username") setUsername(event.newValue ?? "");
    };
    window.addEventListener("storage", onStorage);
    return () => {
      offToken();
      offUsername();
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!token) {
      setProfile(null);
      return;
    }
    try {
      const response = await getProfile();
      setProfile(response.data ?? null);
    } catch {
      setProfile(null);
    }
  }, [token]);

  useEffect(() => {
    console.log("[Auth] token/user sync", {
      tokenPresent: Boolean(token),
      username,
      privyReady: ready,
      privyAuthenticated: authenticated,
      hasPrivyUser: Boolean(user),
    });
    if (!token) {
      setProfile(null);
      return;
    }
    refreshProfile();
  }, [token, refreshProfile]);

  const handleLoginResponse = useCallback((response: { data?: { token?: string; username?: string } } | null) => {
    const newToken = response?.data?.token ?? "";
    if (!newToken) {
      setError("Login failed. Please try again.");
      return false;
    }
    setStoredToken(newToken);
    if (response?.data?.username) {
      setStoredUsername(response.data.username);
    }
    setError(null);
    return true;
  }, []);

  const loginWithJwt = useCallback(async (jwt: string) => {
    if (!jwt) return;
    setLoading(true);
    try {
      const response = await loginV2({ jwt, source: "browser" });
      handleLoginResponse(response);
    } catch {
      setError("Unable to complete login. Please try again.");
    } finally {
      setLoading(false);
      clearJwtFromUrl();
    }
  }, [handleLoginResponse]);

  const loginWithPrivy = useCallback(async () => {
    if (!authenticated) return;
    const payload = buildLoginPayloadFromPrivy(user);
    if (!payload) return;
    setLoading(true);
    try {
      const response = await loginV2(payload);
      const success = handleLoginResponse(response);
      if (!success && response?.code === "wallet_address_pending") {
        loginAttemptedRef.current = false;
      }
    } catch {
      setError("Unable to complete login. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [authenticated, user, handleLoginResponse]);

  useEffect(() => {
    if (jwtAttemptedRef.current || token) return;
    const jwt = getJwtFromUrl();
    if (jwt) {
      jwtAttemptedRef.current = true;
      loginWithJwt(jwt);
    }
  }, [loginWithJwt, token]);

  useEffect(() => {
    if (!ready || token || !authenticated) return;
    if (loginAttemptedRef.current) return;
    if (loggingOutRef.current) return; // Don't auto-login during logout
    loginAttemptedRef.current = true;
    loginWithPrivy();
  }, [ready, authenticated, token, loginWithPrivy]);

  const logout = useCallback(async () => {
    loggingOutRef.current = true;
    loginAttemptedRef.current = false; // Reset so user can login again later
    clearStoredSession();
    setProfile(null);
    setError(null);
    try {
      await privyLogout();
    } catch (err) {
      // Privy logout can fail (e.g., "Error destroying session") but we still
      // want to clear local state. Log the error but don't block logout.
      console.warn("[Privy] logout error (ignored):", err);
    }
    // Keep loggingOutRef true for a bit longer to prevent race conditions
    // with auto-login effects that may still see authenticated=true briefly
    setTimeout(() => {
      loggingOutRef.current = false;
    }, 500);
  }, [privyLogout]);

  const updateProfileUsername = useCallback(async (name: string) => {
    if (!name.trim()) return false;
    try {
      const result = await updateUsername(name.trim());
      if (result?.success) {
        setStoredUsername(name.trim());
        await refreshProfile();
        return true;
      }
      setError(result?.message ?? "Unable to update username.");
      return false;
    } catch {
      setError("Unable to update username.");
      return false;
    }
  }, [refreshProfile]);

  const value = useMemo(() => ({
    token,
    username,
    profile,
    loading,
    error,
    isPrivyReady: ready,
    isPrivyAuthenticated: authenticated,
    openLogin: () => {
      console.log("[Privy] openLogin called", {
        ready,
        authenticated,
        hasUser: Boolean(user),
      });
      privyLogin();
    },
    logout,
    refreshProfile,
    updateProfileUsername,
  }), [token, username, profile, loading, error, ready, authenticated, privyLogin, logout, refreshProfile, updateProfileUsername]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
