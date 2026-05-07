export type UserRole = "LOW" | "HIGH";

export type AppUser = {
  id: string;
  accountName: string;
  displayName: string | null;
  personalCode: string;
  role: UserRole;
};

export type AuthResponse = {
  token: string;
  user: AppUser;
};

export type PostItem = {
  id: string;
  contentText?: string | null;
  imageUrl?: string | null;
  createdAt: string;
  anonymousName?: string;
  user?: {
    id: string;
    displayName: string | null;
    personalCode: string;
  };
};
