import Fastify from "fastify";
import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import type { Role, User } from "@clubflow/shared";
import { z } from "zod";

import type { AppEnv } from "./config/env.js";
import { AppError } from "./lib/errors.js";
import { InMemoryPlatformRepository } from "./repositories/in-memory.js";
import { AdminService } from "./services/admin-service.js";
import { AuthService } from "./services/auth-service.js";
import { LeaderService } from "./services/leader-service.js";
import { MemberService } from "./services/member-service.js";
import { PendingService } from "./services/pending-service.js";

declare module "fastify" {
  interface FastifyRequest {
    sessionToken?: string;
    currentUser?: User;
  }
}

const SESSION_COOKIE_NAME = "clubflow_session";

const loginSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(128),
});

const signupSchema = z.object({
  name: z.string().min(2).max(40),
  email: z.string().email().max(255),
  password: z.string().min(8).max(128),
  phone: z.string().min(10).max(20),
  studentId: z.string().min(4).max(30),
  desiredClubId: z.string().min(3).max(128),
  bio: z.string().min(4).max(240),
  message: z.string().min(10).max(600),
});

const announcementSchema = z.object({
  title: z.string().min(3).max(80),
  body: z.string().min(10).max(1200),
  pinned: z.boolean().default(false),
});

const approveSchema = z.object({
  clubId: z.string().min(3).max(128),
  role: z.enum(["member", "leader"]),
  note: z.string().max(240).optional(),
});

const rejectSchema = z.object({
  note: z.string().min(4).max(240),
});

const clubCreateSchema = z.object({
  name: z.string().min(2).max(60),
  category: z.string().min(2).max(40),
  summary: z.string().min(10).max(300),
  recruitingNote: z.string().min(6).max(240),
});

export const createApp = (env: AppEnv) => {
  const app = Fastify({
    logger: true,
    trustProxy: true,
  });

  const repository = new InMemoryPlatformRepository();
  const authService = new AuthService(repository, env.SESSION_TTL_MINUTES);
  const pendingService = new PendingService(repository);
  const memberService = new MemberService(repository);
  const leaderService = new LeaderService(repository);
  const adminService = new AdminService(repository);

  void app.register(cookie, {
    secret: env.COOKIE_SECRET,
  });
  void app.register(cors, {
    origin: env.WEB_ORIGIN,
    credentials: true,
  });
  void app.register(helmet, {
    contentSecurityPolicy: false,
  });
  void app.register(rateLimit, {
    global: true,
    max: 120,
    timeWindow: "1 minute",
  });

  const getSessionToken = (request: any) => {
    const rawCookie = request.cookies[SESSION_COOKIE_NAME];

    if (!rawCookie) {
      return undefined;
    }

    const { valid, value } = request.unsignCookie(rawCookie);

    if (!valid) {
      return undefined;
    }

    return value;
  };

  const getCsrfHeader = (request: any) => {
    const headerValue = request.headers["x-csrf-token"];

    if (typeof headerValue === "string") {
      return headerValue;
    }

    return undefined;
  };

  const setSessionCookie = (reply: any, sessionToken: string) => {
    reply.setCookie(SESSION_COOKIE_NAME, sessionToken, {
      path: "/",
      httpOnly: true,
      sameSite: "strict",
      secure: env.COOKIE_SECURE,
      signed: true,
      maxAge: env.SESSION_TTL_MINUTES * 60,
    });
  };

  const clearSessionCookie = (reply: any) => {
    reply.clearCookie(SESSION_COOKIE_NAME, {
      path: "/",
      httpOnly: true,
      sameSite: "strict",
      secure: env.COOKIE_SECURE,
      signed: true,
    });
  };

  const authenticate =
    (roles?: Role | Role[]) =>
    async (request: any) => {
      const sessionToken = getSessionToken(request);

      if (!sessionToken) {
        throw new AppError(401, "로그인이 필요합니다.");
      }

      const user = authService.getCurrentUser(sessionToken);

      if (roles) {
        const acceptedRoles = Array.isArray(roles) ? roles : [roles];

        if (!acceptedRoles.includes(user.role)) {
          throw new AppError(403, "접근 권한이 없습니다.");
        }
      }

      request.sessionToken = sessionToken;
      request.currentUser = user;
    };

  const requireCsrf = (request: any) => {
    if (!request.sessionToken) {
      throw new AppError(401, "로그인이 필요합니다.");
    }

    authService.assertCsrf(request.sessionToken, getCsrfHeader(request));
  };

  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof AppError) {
      void reply.status(error.statusCode).send({
        message: error.message,
      });
      return;
    }

    if (error instanceof z.ZodError) {
      void reply.status(400).send({
        message: "입력값 검증에 실패했습니다.",
        issues: error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      });
      return;
    }

    app.log.error(error);
    void reply.status(500).send({
      message: "서버 내부 오류가 발생했습니다.",
    });
  });

  app.get("/api/health", async () => ({
    status: "ok",
    now: new Date().toISOString(),
  }));

  app.get("/api/public/clubs", async () => ({
    clubs: repository.getClubs(),
  }));

  app.post(
    "/api/auth/signup",
    {
      config: {
        rateLimit: {
          max: 8,
          timeWindow: "1 minute",
        },
      },
    },
    async (request, reply) => {
      const body = signupSchema.parse(request.body);
      const result = authService.signup(body);

      setSessionCookie(reply, result.sessionToken);
      return reply.status(201).send(result.response);
    },
  );

  app.post(
    "/api/auth/login",
    {
      config: {
        rateLimit: {
          max: 10,
          timeWindow: "1 minute",
        },
      },
    },
    async (request, reply) => {
      const body = loginSchema.parse(request.body);
      const result = authService.login(body.email, body.password);

      setSessionCookie(reply, result.sessionToken);
      return reply.status(200).send(result.response);
    },
  );

  app.post("/api/auth/logout", { preHandler: authenticate() }, async (request, reply) => {
    requireCsrf(request);
    authService.logout(request.sessionToken!);
    clearSessionCookie(reply);
    return reply.status(204).send();
  });

  app.get("/api/auth/me", { preHandler: authenticate() }, async (request) =>
    authService.getSessionResponse(request.sessionToken!),
  );

  app.get(
    "/api/pending/overview",
    { preHandler: authenticate() },
    async (request) => pendingService.getOverview(request.currentUser!.id),
  );

  app.get(
    "/api/member/dashboard",
    { preHandler: authenticate("member") },
    async (request) => memberService.getDashboard(request.currentUser!.id),
  );
  app.get(
    "/api/member/club",
    { preHandler: authenticate("member") },
    async (request) => memberService.getClub(request.currentUser!.id),
  );
  app.get(
    "/api/member/profile",
    { preHandler: authenticate("member") },
    async (request) => memberService.getProfile(request.currentUser!.id),
  );

  app.get(
    "/api/leader/dashboard",
    { preHandler: authenticate("leader") },
    async (request) => leaderService.getDashboard(request.currentUser!.id),
  );
  app.get(
    "/api/leader/members",
    { preHandler: authenticate("leader") },
    async (request) => leaderService.getMembers(request.currentUser!.id),
  );
  app.get(
    "/api/leader/announcements",
    { preHandler: authenticate("leader") },
    async (request) => leaderService.getAnnouncements(request.currentUser!.id),
  );
  app.post(
    "/api/leader/announcements",
    { preHandler: authenticate("leader") },
    async (request, reply) => {
      requireCsrf(request);
      const body = announcementSchema.parse(request.body);

      leaderService.createAnnouncement(request.currentUser!.id, body);
      return reply.status(201).send({ success: true });
    },
  );

  app.get(
    "/api/admin/dashboard",
    { preHandler: authenticate("admin") },
    async (request) => adminService.getDashboard(request.currentUser!.id),
  );
  app.get(
    "/api/admin/applications",
    { preHandler: authenticate("admin") },
    async (request) => adminService.getApplications(request.currentUser!.id),
  );
  app.get(
    "/api/admin/clubs",
    { preHandler: authenticate("admin") },
    async (request) => adminService.getClubs(request.currentUser!.id),
  );
  app.get(
    "/api/admin/users",
    { preHandler: authenticate("admin") },
    async (request) => adminService.getUsers(request.currentUser!.id),
  );
  app.post(
    "/api/admin/applications/:requestId/approve",
    { preHandler: authenticate("admin") },
    async (request, reply) => {
      requireCsrf(request);
      const params = z.object({ requestId: z.string().min(3).max(128) }).parse(
        request.params,
      );
      const body = approveSchema.parse(request.body);

      adminService.approveRequest(request.currentUser!.id, {
        requestId: params.requestId,
        ...body,
      });

      return reply.status(201).send({ success: true });
    },
  );
  app.post(
    "/api/admin/applications/:requestId/reject",
    { preHandler: authenticate("admin") },
    async (request, reply) => {
      requireCsrf(request);
      const params = z.object({ requestId: z.string().min(3).max(128) }).parse(
        request.params,
      );
      const body = rejectSchema.parse(request.body);

      adminService.rejectRequest(request.currentUser!.id, {
        requestId: params.requestId,
        ...body,
      });

      return reply.status(201).send({ success: true });
    },
  );
  app.post(
    "/api/admin/clubs",
    { preHandler: authenticate("admin") },
    async (request, reply) => {
      requireCsrf(request);
      const body = clubCreateSchema.parse(request.body);

      adminService.createClub(request.currentUser!.id, body);
      return reply.status(201).send({ success: true });
    },
  );

  return app;
};
