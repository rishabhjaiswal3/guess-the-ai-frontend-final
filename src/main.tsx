import { createRoot } from "react-dom/client";
import { PrivyProvider } from "@privy-io/react-auth";
import App from "./App.tsx";
import "./index.css";
import { privyAppId, privyConfig } from "@/lib/privyConfig";
import { AuthProvider } from "@/context/AuthContext";
import PrivyModalHost from "@/components/auth/PrivyModalHost";

if (!privyAppId) {
  throw new Error("Missing VITE_PRIVY_APP_ID environment variable");
}

createRoot(document.getElementById("root")!).render(
  <PrivyProvider appId={privyAppId} config={privyConfig}>
    <AuthProvider>
      <PrivyModalHost />
      <App />
    </AuthProvider>
  </PrivyProvider>
);
