export const ProfileVisibility = {
    VISIBLE: "VISIBLE",
    HIDDEN: "HIDDEN",
} as const;

export type ProfileVisibility = (typeof ProfileVisibility)[keyof typeof ProfileVisibility];

export type PrivacySettings = {
    profileVisibility: ProfileVisibility;
    analyticsOptIn: boolean;
};
