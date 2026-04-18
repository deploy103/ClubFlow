import type { AuthSessionResponse } from "@clubflow/shared";

import { AppError, invariant } from "../lib/errors.js";
import {
  createId,
  createSessionToken,
  hashPassword,
  verifyPassword,
} from "../lib/security.js";
import type { PlatformRepository, SessionRecord, StoredUser } from "../repositories/contracts.js";
import {
  buildSessionUser,
  findClubById,
  findUserById,
} from "./service-utils.js";

export interface AuthenticatedSession {
  token: string;
  csrfToken: string;
  userId: string;
}

export class AuthService {
  constructor(
    private readonly repository: PlatformRepository,
    private readonly sessionTtlMinutes: number,
  ) {}

  login(
    email: string,
    password: string,
  ): {
    sessionToken: string;
    response: AuthSessionResponse;
  } {
    const user = this.repository
      .getUsers()
      .find((currentUser) => currentUser.email.toLowerCase() === email.toLowerCase());

    if (!user || !verifyPassword(password, user.passwordHash)) {
      throw new AppError(401, "이메일 또는 비밀번호가 올바르지 않습니다.");
    }

    return this.createSessionResponse(user.id);
  }

  signup(payload: {
    name: string;
    email: string;
    password: string;
    phone: string;
    studentId: string;
    desiredClubId: string;
    bio: string;
    message: string;
  }) {
    invariant(
      !this.repository
        .getUsers()
        .some(
          (user) => user.email.toLowerCase() === payload.email.trim().toLowerCase(),
        ),
      "이미 가입된 이메일입니다.",
      409,
    );

    const desiredClub = findClubById(this.repository, payload.desiredClubId);
    const now = new Date().toISOString();
    const userId = createId("user");

    this.repository.createUser({
      id: userId,
      email: payload.email.trim().toLowerCase(),
      name: payload.name.trim(),
      phone: payload.phone.trim(),
      studentId: payload.studentId.trim(),
      bio: payload.bio.trim(),
      avatarLabel: payload.name.trim().slice(0, 1),
      role: "pending",
      approvalStatus: "pending",
      createdAt: now,
      passwordHash: hashPassword(payload.password),
    });

    this.repository.createJoinRequest({
      id: createId("request"),
      userId,
      desiredClubId: desiredClub.id,
      message: payload.message.trim(),
      status: "pending",
      createdAt: now,
    });

    this.repository.createActivityLog({
      id: createId("activity"),
      actorId: userId,
      actorName: payload.name.trim(),
      action: "가입 요청",
      context: `${desiredClub.name} 가입 요청서를 제출했습니다.`,
      createdAt: now,
      clubId: desiredClub.id,
      targetUserId: userId,
    });

    return this.createSessionResponse(userId);
  }

  getAuthenticatedSession(sessionToken: string): AuthenticatedSession {
    this.purgeExpiredSessions();

    const session = this.repository
      .getSessions()
      .find((currentSession) => currentSession.token === sessionToken);

    if (!session) {
      throw new AppError(401, "인증 세션이 유효하지 않습니다.");
    }

    return {
      token: session.token,
      csrfToken: session.csrfToken,
      userId: session.userId,
    };
  }

  getSessionResponse(sessionToken: string): AuthSessionResponse {
    const session = this.getAuthenticatedSession(sessionToken);

    return {
      user: buildSessionUser(this.repository, session.userId),
      csrfToken: session.csrfToken,
    };
  }

  logout(sessionToken: string) {
    this.repository.deleteSession(sessionToken);
  }

  assertCsrf(sessionToken: string, csrfToken: string | undefined) {
    const session = this.getAuthenticatedSession(sessionToken);

    if (!csrfToken || csrfToken !== session.csrfToken) {
      throw new AppError(403, "CSRF 검증에 실패했습니다.");
    }
  }

  getCurrentUser(sessionToken: string) {
    const session = this.getAuthenticatedSession(sessionToken);
    return findUserById(this.repository, session.userId);
  }

  private createSessionResponse(userId: string) {
    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + this.sessionTtlMinutes * 60_000);
    const sessionToken = createSessionToken();
    const session: SessionRecord = {
      token: sessionToken,
      csrfToken: createSessionToken(),
      userId,
      createdAt: createdAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
    };

    this.repository.createSession(session);

    return {
      sessionToken,
      response: {
        user: buildSessionUser(this.repository, userId),
        csrfToken: session.csrfToken,
      },
    };
  }

  private purgeExpiredSessions() {
    const now = Date.now();

    for (const session of this.repository.getSessions()) {
      if (new Date(session.expiresAt).getTime() <= now) {
        this.repository.deleteSession(session.token);
      }
    }
  }
}
