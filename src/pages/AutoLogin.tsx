import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginV2 } from "@/services/authApi";
import { setStoredToken, setStoredUsername, clearWalletFromUrl, getWalletFromUrl } from "@/lib/session";

// Detect if this page is running inside an iframe
const isInIframe = (): boolean => {
  try {
    return window.self !== window.top;
  } catch {
    // Cross-origin parent blocks access — confirms we're in an iframe
    return true;
  }
};

type Status = "initializing" | "logging_in" | "success" | "error" | "no_wallet";

const STATUS_LABEL: Record<Status, string> = {
  initializing: "⏳ Initializing…",
  logging_in:   "🔐 Logging in…",
  success:      "✅ Logged in",
  error:        "❌ Login failed — redirecting",
  no_wallet:    "⚠️ No wallet — redirecting",
};

export default function AutoLogin() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<Status>("initializing");
  const [debugInfo, setDebugInfo] = useState<{
    loginType?: string;
    walletAddress?: string;
    timestamp?: string;
    referrer?: string;
  }>({});

  useEffect(() => {
    const walletAddress = getWalletFromUrl();
    const inIframe = isInIframe();
    const now = new Date().toISOString();

    const info = {
      loginType: inIframe ? "iframe" : "direct",
      walletAddress: walletAddress
        ? `${walletAddress.slice(0, 6)}…${walletAddress.slice(-4)}`
        : undefined,
      timestamp: now,
      referrer: document.referrer || "none",
    };
    setDebugInfo(info);

    // Tag session so any component can read how the user logged in
    localStorage.setItem("loginType", inIframe ? "iframe" : "direct");
    localStorage.setItem("loginTimestamp", now);

    if (!walletAddress) {
      setStatus("no_wallet");
      navigate("/", { replace: true });
      return;
    }

    setStatus("logging_in");
    clearWalletFromUrl();

    loginV2({ walletAddress, source: inIframe ? "iframe" : "direct" })
      .then((res) => {
        if (res?.data?.token) {
          setStoredToken(res.data.token);
          if (res.data.username) setStoredUsername(res.data.username);
          setStatus("success");
        } else {
          console.warn("[AutoLogin] login returned no token:", res);
          setStatus("error");
        }
      })
      .catch((err) => {
        console.error("[AutoLogin] login failed:", err);
        setStatus("error");
      })
      .finally(() => {
        navigate("/", { replace: true });
      });
  }, [navigate]);

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {/* Login-type badge */}
        <div style={styles.badge}>
          {debugInfo.loginType === "iframe" ? "🖼 iframe" : "🌐 direct"}
        </div>

        <p style={styles.statusText}>{STATUS_LABEL[status]}</p>

        {debugInfo.walletAddress && (
          <p style={styles.meta}>wallet: {debugInfo.walletAddress}</p>
        )}
        <p style={styles.meta}>referrer: {debugInfo.referrer}</p>
        <p style={styles.meta}>at: {debugInfo.timestamp}</p>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    width: "100vw",
    height: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#0a0a0a",
    fontFamily: "monospace",
  },
  card: {
    border: "1px solid #333",
    borderRadius: 8,
    padding: "24px 32px",
    display: "flex",
    flexDirection: "column",
    gap: 8,
    minWidth: 280,
    background: "#111",
  },
  badge: {
    display: "inline-block",
    padding: "2px 10px",
    borderRadius: 4,
    background: "#1e3a5f",
    color: "#7ec8ff",
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 1,
    marginBottom: 4,
    alignSelf: "flex-start",
  },
  statusText: {
    color: "#e0e0e0",
    fontSize: 15,
    margin: 0,
  },
  meta: {
    color: "#555",
    fontSize: 11,
    margin: 0,
  },
};
