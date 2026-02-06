import { ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import NewLoginScreen from "@/components/auth/NewLoginScreen";

const AuthGate = ({ children }: { children: ReactNode }) => {
  const { token } = useAuth();

  if (!token) {
    return <NewLoginScreen />;
  }

  return <>{children}</>;
};

export default AuthGate;
