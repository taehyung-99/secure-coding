export type SessionUser = {
  id: string;
  username: string;
  email: string;
  role: "USER" | "ADMIN";
  status: "ACTIVE" | "SUSPENDED" | "DORMANT" | "DELETED";
};

export function isAdmin(user: SessionUser | null): user is SessionUser {
  return user?.role === "ADMIN";
}

export function isActiveUser(user: SessionUser | null): user is SessionUser {
  return user?.status === "ACTIVE";
}
