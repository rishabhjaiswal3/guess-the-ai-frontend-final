import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { loginV2 } from "@/services/authApi";
import {
  clearJwtFromUrl,
  clearWalletFromUrl,
  getJwtFromUrl,
  getSourceFromUrl,
  getWalletFromUrl,
  setStoredToken,
  setIsIframe, 
  setStoredSource,
  setStoredUsername,
} from "@/lib/session";

const DEPLOY_MARKER = "AUTO_LOGIN_DEPLOY_CHECK_V1";

export default function AutoLogin() {
  const navigate = useNavigate();

  const goBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/", { replace: true });
    }
  };

  useEffect(() => {
    console.log("HELLO auto login page");
    const walletAddress = getWalletFromUrl();
    const jwt = getJwtFromUrl();
    const source = getSourceFromUrl();
    const inIframe = (() => {
      try {
        return window.self !== window.top;
      } catch {
        return true;
      }
    })();

    console.log("[AutoLogin] page mounted", {
      marker: DEPLOY_MARKER,
      href: window.location.href,
      walletAddress,
      hasJwt: Boolean(jwt),
      source,
      inIframe,
      timestamp: new Date().toISOString(),
    });

    const timeoutId = window.setTimeout(() => {
      console.warn("[AutoLogin] fallback timeout reached, going back");
      goBack();
    }, 7000);

    const complete = async () => {
      if (!jwt && !walletAddress) {
        console.warn("[AutoLogin] no auth params found, returning to previous page");
        goBack();
        return;
      }

      if (jwt) {
        try {
          console.log("[AutoLogin] jwt login start", { marker: DEPLOY_MARKER });
          const requestSource = source || "browser";
          const response = await loginV2({ jwt, source: requestSource });
          const token = response?.data?.token ?? "";
          if (!token) navigate("/",{replace:true});
          setStoredToken(token);
          setStoredSource(requestSource);
          if (response?.data?.username) setStoredUsername(response.data.username);
          clearJwtFromUrl();
          navigate("/", { replace: true });
          return;
        } catch {
          return;
        }
      }

      if (walletAddress) {
        try {
          console.log("[AutoLogin] wallet login start", {
            marker: DEPLOY_MARKER,
            walletAddress,
          });
          const response = await loginV2({
            walletAddress,
            source: "browser"
          });
          const token = response?.data?.token ?? "";
          if (!token) navigate("/",{replace:true});
          setStoredToken(token);
          setIsIframe(inIframe);
          if (response?.data?.username) setStoredUsername(response.data.username);
          clearWalletFromUrl();
          navigate("/", { replace: true });
          return;
        } catch(error) {
          console.log("Auto-login with wallet failed", error);
          navigate("/", { replace: true });
          return;
        }
      }
    };

    complete().finally(() => window.clearTimeout(timeoutId));
    return () => window.clearTimeout(timeoutId);
  }, [navigate]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        background: "#0a0a0a",
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          border: "3px solid rgba(255,255,255,0.18)",
          borderTopColor: "#7ec8ff",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }}
      />
      <div
        style={{
          color: "#7ec8ff",
          fontFamily: "monospace",
          fontSize: 12,
        }}
      >
        Logging you in...
      </div>
      <button
        onClick={goBack}
        style={{
          marginTop: 16,
          padding: "10px 16px",
          borderRadius: 999,
          border: "1px solid rgba(126, 200, 255, 0.5)",
          background: "transparent",
          color: "#7ec8ff",
          fontFamily: "monospace",
          fontSize: 12,
          cursor: "pointer",
        }}
      >
        Go Back
      </button>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
