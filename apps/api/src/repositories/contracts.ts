import type {
  ActivityLog,
  Announcement,
  Club,
  JoinRequest,
  User,
} from "@clubflow/shared";

export interface StoredUser extends User {
  passwordHash: string;
  demoPassword?: string;
}

export interface SessionRecord {
  token: string;
  csrfToken: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
}

export interface SeedDatabase {
  clubs: Club[];
  users: StoredUser[];
  joinRequests: JoinRequest[];
  announcements: Announcement[];
  activityLogs: ActivityLog[];
}

export interface PlatformRepository {
  getClubs(): Club[];
  getUsers(): StoredUser[];
  getJoinRequests(): JoinRequest[];
  getAnnouncements(): Announcement[];
  getActivityLogs(): ActivityLog[];
  getSessions(): SessionRecord[];
  createSession(session: SessionRecord): void;
  deleteSession(token: string): void;
  createUser(user: StoredUser): void;
  updateUser(user: StoredUser): void;
  createJoinRequest(joinRequest: JoinRequest): void;
  updateJoinRequest(joinRequest: JoinRequest): void;
  createAnnouncement(announcement: Announcement): void;
  createActivityLog(activityLog: ActivityLog): void;
  createClub(club: Club): void;
}
