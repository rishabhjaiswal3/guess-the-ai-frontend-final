import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { loginV2 } from "@/services/authApi";
import {
  clearJwtFromUrl,
  clearWalletFromUrl,
  getJwtFromUrl,
  getWalletFromUrl,
  setStoredToken,
  setIsIframe, 
  setStoredUsername,
} from "@/lib/session";

export default function AutoLogin() {
  const navigate = useNavigate();

  useEffect(() => {
    const walletAddress = getWalletFromUrl();
    const jwt = getJwtFromUrl();
    const inIframe = (() => {
      try {
        return window.self !== window.top;
      } catch {
        return true;
      }
    })();

    const complete = async () => {
      if (jwt) {
        try {
          const response = await loginV2({ jwt, source: "browser" });
          const token = response?.data?.token ?? "";
          if (!token) navigate("/",{replace:true});
          setStoredToken(token);
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

    complete();
  }, [navigate]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
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
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
