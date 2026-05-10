import { ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import LandingPage from "@/pages/LandingPage";

const AuthGate = ({ children }: { children: ReactNode }) => {
  const { token } = useAuth();

  if (!token) {
    return <LandingPage />;
  }

  return <>{children}</>;
};

export default AuthGate;
