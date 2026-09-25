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
    completeOAuthLogin: () => Promise<void>;
    logout: () => void;
    updateUser: (user: UserResponse) => void;
};


const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<UserResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        // Der Access-Token liegt in einem HttpOnly-Cookie (#160) und ist per JS
        // nicht lesbar - ob eine Session besteht, kann nur der Server sagen.
        async function bootstrap() {
            try {
                const currentUser = await getCurrentUser();
                if (!cancelled) setUser(currentUser);
            } catch {
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
            setUser(response.user);
        } catch (err) {
            const message = err instanceof Error ? err.message : "Login failed";
            setError(message);
            throw err;
        }
    }, []);

    // E-Mail-Verifizierung ist temporär umgangen (#128) - Registrierung
    // startet direkt eine Session wie vor #110 (siehe AuthService#register
    // im Backend).
    const register = useCallback(async (request: RegisterRequest) => {
        setError(null);
        try {
            const response = await registerService(request);
            setUser(response.user);
        } catch (err) {
            const message = err instanceof Error ? err.message : "Registration failed";
            setError(message);
            throw err;
        }
    }, []);

    // Access-Token wurde bereits von exchangeOAuth2Token als HttpOnly-Cookie
    // gesetzt (#160) - hier nur noch den User nachladen.
    const completeOAuthLogin = useCallback(async () => {
        setError(null);
        try {
            const currentUser = await getCurrentUser();
            setUser(currentUser);
        } catch (err) {
            const message = err instanceof Error ? err.message : "Google-Login fehlgeschlagen";
            setError(message);
            throw err;
        }
    }, []);

    // Kein setUser(null) hier: logoutService() macht sofort einen harten
    // window.location.href-Reload zu /logout, der den gesamten React-Baum
    // (inkl. dieses States) ohnehin neu aufbaut. Ein lokales setUser(null)
    // würde stattdessen nur einen Render auf der AKTUELLEN Seite auslösen,
    // bevor die Navigation greift - isAuthenticated kippt kurz auf false,
    // ProtectedRoute zeigt dadurch kurz seinen eigenen Spinner, bevor /logout
    // überhaupt geladen ist: sichtbar als zwei verschiedene Spinner
    // hintereinander statt nur dem von /logout.
    const logout = useCallback(() => {
        logoutService();
    }, []);

    const updateUser = useCallback((updated: UserResponse) => {
        setUser(updated);
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
        updateUser,
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