export const AuthProviderType = {
  LOCAL: "LOCAL",
  GOOGLE: "GOOGLE",
  GITHUB: "GITHUB",
} as const;

export type AuthProviderType =
  (typeof AuthProviderType)[keyof typeof AuthProviderType];

export type UserResponse = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl: string;
  /** Nur noch "wie wurde der Account ursprünglich erstellt" (#236) - welche Login-Methoden funktionieren, sagt hasPassword. */
  provider: AuthProviderType;
  hasPassword: boolean;
};

/** Über welchen Button der OAuth-Flow gestartet wurde (#236). */
export type OAuth2Mode = "login" | "register";

export type OAuth2LinkInfo = {
  email: string;
  provider: AuthProviderType;
  passwordRequired: boolean;
};

export type SetPasswordRequest = {
  password: string;
};

export type AuthResponse = {
  user: UserResponse;
};

export type MessageResponse = {
  message: string;
};

export type RegisterRequest = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type ResendVerificationRequest = {
  email: string;
};

export type ForgotPasswordRequest = {
  email: string;
};

export type ResetPasswordRequest = {
  token: string;
  newPassword: string;
};
