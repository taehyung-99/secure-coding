export type UserRole = "USER" | "ADMIN";

export type UserStatus = "ACTIVE" | "SUSPENDED" | "DORMANT" | "DELETED";

export type AuthUser = {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  status: UserStatus;
};
