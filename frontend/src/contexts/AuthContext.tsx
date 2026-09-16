import {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    type ReactNode,
} from "react";
import {
    register as registerService,
    login as loginService,
    getCurrentUser,
    setToken,
    clearToken,
    isLoggedIn,
    logout as logoutService,
} from "../services/authService";
import type { UserResponse, RegisterRequest, LoginRequest } from "../types/auth";

type AuthContextValue = {
    user: UserResponse | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    login: (request: LoginRequest) => Promise<void>;
    register: (request: RegisterRequest) => Promise<void>;
    completeOAuthLogin: (token: string) => Promise<void>;
    logout: () => void;
};


const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<UserResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        async function bootstrap() {
            if (!isLoggedIn()) {
                setIsLoading(false);
                return;
            }
            try {
                const currentUser = await getCurrentUser();
                if (!cancelled) setUser(currentUser);
            } catch {
                clearToken();
                if (!cancelled) setUser(null);
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        }

        bootstrap();
        return () => {
            cancelled = true;
        };
    }, []);

    const login = useCallback(async (request: LoginRequest) => {
        setError(null);
        try {
            const response = await loginService(request);
            setToken(response.token);
            setUser(response.user);
        } catch (err) {
            const message = err instanceof Error ? err.message : "Login failed";
            setError(message);
            throw err;
        }
    }, []);

    // Registrierung startet keine Session mehr - das Konto muss erst per
    // E-Mail-Link bestätigt werden, bevor ein Login möglich ist (siehe
    // AuthService#register im Backend).
    const register = useCallback(async (request: RegisterRequest) => {
        setError(null);
        try {
            await registerService(request);
        } catch (err) {
            const message = err instanceof Error ? err.message : "Registration failed";
            setError(message);
            throw err;
        }
    }, []);

    const completeOAuthLogin = useCallback(async (token: string) => {
        setError(null);
        try {
            setToken(token);
            const currentUser = await getCurrentUser();
            setUser(currentUser);
        } catch (err) {
            clearToken();
            const message = err instanceof Error ? err.message : "Google-Login fehlgeschlagen";
            setError(message);
            throw err;
        }
    }, []);

    const logout = useCallback(() => {
        setUser(null);
        logoutService();
    }, []);

    const value: AuthContextValue = {
        user,
        isAuthenticated: !!user,
        isLoading,
        error,
        login,
        register,
        completeOAuthLogin,
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}