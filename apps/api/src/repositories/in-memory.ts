import type {
  ActivityLog,
  Announcement,
  Club,
  JoinRequest,
} from "@clubflow/shared";

import { createSeedData } from "../data/seed.js";
import type {
  PlatformRepository,
  SeedDatabase,
  SessionRecord,
  StoredUser,
} from "./contracts.js";

export class InMemoryPlatformRepository implements PlatformRepository {
  private readonly database: SeedDatabase;

  private readonly sessions: SessionRecord[] = [];

  constructor(seedDatabase: SeedDatabase = createSeedData()) {
    this.database = structuredClone(seedDatabase);
  }

  getClubs() {
    return this.database.clubs;
  }

  getUsers() {
    return this.database.users;
  }

  getJoinRequests() {
    return this.database.joinRequests;
  }

  getAnnouncements() {
    return this.database.announcements;
  }

  getActivityLogs() {
    return this.database.activityLogs;
  }

  getSessions() {
    return this.sessions;
  }

  createSession(session: SessionRecord) {
    this.sessions.push(session);
  }

  deleteSession(token: string) {
    const nextSessions = this.sessions.filter((session) => session.token !== token);
    this.sessions.length = 0;
    this.sessions.push(...nextSessions);
  }

  createUser(user: StoredUser) {
    this.database.users.unshift(user);
  }

  updateUser(user: StoredUser) {
    const currentIndex = this.database.users.findIndex(
      (currentUser) => currentUser.id === user.id,
    );

    if (currentIndex >= 0) {
      this.database.users[currentIndex] = user;
      return;
    }

    this.database.users.unshift(user);
  }

  createJoinRequest(joinRequest: JoinRequest) {
    this.database.joinRequests.unshift(joinRequest);
  }

  updateJoinRequest(joinRequest: JoinRequest) {
    const currentIndex = this.database.joinRequests.findIndex(
      (currentRequest) => currentRequest.id === joinRequest.id,
    );

    if (currentIndex >= 0) {
      this.database.joinRequests[currentIndex] = joinRequest;
      return;
    }

    this.database.joinRequests.unshift(joinRequest);
  }

  createAnnouncement(announcement: Announcement) {
    this.database.announcements.unshift(announcement);
  }

  createActivityLog(activityLog: ActivityLog) {
    this.database.activityLogs.unshift(activityLog);
  }

  createClub(club: Club) {
    this.database.clubs.push(club);
  }
}
