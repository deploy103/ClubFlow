import type { AuthSessionResponse, SessionUser } from "@clubflow/shared";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from "react";
import { useQueryClient } from "@tanstack/react-query";

import { ApiError, apiGet, apiPost, setCsrfToken } from "./api";

interface SignupPayload {
  name: string;
  email: string;
  password: string;
  phone: string;
  studentId: string;
  desiredClubId: string;
  bio: string;
  message: string;
}

interface AuthContextValue {
  user: SessionUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<SessionUser>;
  signup: (payload: SignupPayload) => Promise<SessionUser>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const getHomePath = (user: SessionUser) => {
  if (user.approvalStatus !== "approved" || user.role === "pending") {
    return "/access";
  }

  if (user.role === "member") {
    return "/member/dashboard";
  }

  if (user.role === "leader") {
    return "/leader/dashboard";
  }

  return "/admin/dashboard";
};

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  const hydrateSession = async () => {
    try {
      const session = await apiGet<AuthSessionResponse>("/api/auth/me");
      setCsrfToken(session.csrfToken);
      setUser(session.user);
    } catch (error) {
      if (!(error instanceof ApiError) || error.statusCode !== 401) {
        throw error;
      }

      setCsrfToken(undefined);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void hydrateSession();
  }, []);

  const consumeSession = async (session: AuthSessionResponse) => {
    setCsrfToken(session.csrfToken);
    setUser(session.user);
    await queryClient.invalidateQueries();
    return session.user;
  };

  const value: AuthContextValue = {
    user,
    loading,
    login: async (email, password) =>
      consumeSession(
        await apiPost<AuthSessionResponse>("/api/auth/login", {
          email,
          password,
        }),
      ),
    signup: async (payload) =>
      consumeSession(await apiPost<AuthSessionResponse>("/api/auth/signup", payload)),
    logout: async () => {
      try {
        await apiPost("/api/auth/logout", {});
      } finally {
        setCsrfToken(undefined);
        setUser(null);
        queryClient.clear();
      }
    },
    refreshSession: async () => {
      const session = await apiGet<AuthSessionResponse>("/api/auth/me");
      setCsrfToken(session.csrfToken);
      setUser(session.user);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
};
