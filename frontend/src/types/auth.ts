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
  provider: AuthProviderType;
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
