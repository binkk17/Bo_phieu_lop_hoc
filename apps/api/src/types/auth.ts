import { UserRole } from "./role.js";

export type AuthPayload = {
  userId: string;
  role: UserRole;
  sessionId: string;
};
