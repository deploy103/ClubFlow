import type {
  AdminApplicationsData,
  AdminClubView,
  AdminClubsData,
  AdminDashboardData,
  AdminJoinRequestView,
  AdminUserView,
  AdminUsersData,
  Club,
  User,
} from "@clubflow/shared";

import { AppError, invariant } from "../lib/errors.js";
import { createId } from "../lib/security.js";
import type { PlatformRepository } from "../repositories/contracts.js";
import {
  findClubById,
  findJoinRequestById,
  findUserById,
  getClubLeaderName,
} from "./service-utils.js";

export class AdminService {
  constructor(private readonly repository: PlatformRepository) {}

  getDashboard(userId: string): AdminDashboardData {
    this.requireAdmin(userId);

    return {
      summary: {
        pendingRequests: this.repository
          .getJoinRequests()
          .filter((request) => request.status === "pending").length,
        approvedMembers: this.repository
          .getUsers()
          .filter((user) => user.approvalStatus === "approved" && user.role !== "admin")
          .length,
        leaders: this.repository.getUsers().filter((user) => user.role === "leader").length,
        clubs: this.repository.getClubs().length,
      },
      pendingRequests: this.getApplicationViews()
        .filter((request) => request.status === "pending")
        .slice(0, 4),
      recentUsers: this.getUserViews()
        .filter((user) => user.approvalStatus === "approved")
        .sort((left, right) => (right.approvedAt ?? "").localeCompare(left.approvedAt ?? ""))
        .slice(0, 6),
      recentActivity: this.repository
        .getActivityLogs()
        .slice()
        .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
        .slice(0, 8),
      clubs: this.getClubViews().slice(0, 6),
    };
  }

  getApplications(userId: string): AdminApplicationsData {
    this.requireAdmin(userId);

    return {
      requests: this.getApplicationViews(),
      clubs: this.repository.getClubs(),
    };
  }

  getClubs(userId: string): AdminClubsData {
    this.requireAdmin(userId);
    return { clubs: this.getClubViews() };
  }

  getUsers(userId: string): AdminUsersData {
    this.requireAdmin(userId);
    return { users: this.getUserViews() };
  }

  approveRequest(
    userId: string,
    payload: {
      requestId: string;
      clubId: string;
      role: "member" | "leader";
      note?: string;
    },
  ) {
    const admin = this.requireAdmin(userId);
    const joinRequest = findJoinRequestById(this.repository, payload.requestId);
    const applicant = findUserById(this.repository, joinRequest.userId);
    const club = findClubById(this.repository, payload.clubId);

    invariant(joinRequest.status === "pending", "처리 대기중인 요청만 승인할 수 있습니다.");

    const now = new Date().toISOString();
    const reviewNote = payload.note?.trim() || `${club.name} ${payload.role}로 승인했습니다.`;

    this.repository.updateJoinRequest({
      ...joinRequest,
      status: "approved",
      reviewedAt: now,
      reviewedBy: admin.id,
      reviewNote,
      assignedClubId: club.id,
      assignedRole: payload.role,
    });

    this.repository.updateUser({
      ...applicant,
      role: payload.role,
      approvalStatus: "approved",
      clubId: club.id,
      approvedAt: now,
    });

    this.repository.createActivityLog({
      id: createId("activity"),
      actorId: admin.id,
      actorName: admin.name,
      action: "가입 승인",
      context: `${applicant.name} 님을 ${club.name} ${payload.role === "leader" ? "리더" : "멤버"}로 승인했습니다.`,
      createdAt: now,
      clubId: club.id,
      targetUserId: applicant.id,
    });
  }

  rejectRequest(
    userId: string,
    payload: {
      requestId: string;
      note: string;
    },
  ) {
    const admin = this.requireAdmin(userId);
    const joinRequest = findJoinRequestById(this.repository, payload.requestId);
    const applicant = findUserById(this.repository, joinRequest.userId);

    invariant(joinRequest.status === "pending", "처리 대기중인 요청만 반려할 수 있습니다.");
    invariant(payload.note.trim().length >= 4, "반려 메모는 4자 이상이어야 합니다.");

    const now = new Date().toISOString();

    this.repository.updateJoinRequest({
      ...joinRequest,
      status: "rejected",
      reviewedAt: now,
      reviewedBy: admin.id,
      reviewNote: payload.note.trim(),
    });

    this.repository.updateUser({
      ...applicant,
      role: "pending",
      approvalStatus: "rejected",
      approvedAt: undefined,
      clubId: undefined,
    });

    this.repository.createActivityLog({
      id: createId("activity"),
      actorId: admin.id,
      actorName: admin.name,
      action: "가입 반려",
      context: `${applicant.name} 님의 가입 요청을 반려했습니다.`,
      createdAt: now,
      targetUserId: applicant.id,
    });
  }

  createClub(
    userId: string,
    payload: {
      name: string;
      category: string;
      summary: string;
      recruitingNote: string;
    },
  ) {
    const admin = this.requireAdmin(userId);

    invariant(
      !this.repository
        .getClubs()
        .some((club) => club.name.toLowerCase() === payload.name.trim().toLowerCase()),
      "이미 존재하는 동아리 이름입니다.",
      409,
    );

    const club: Club = {
      id: createId("club"),
      name: payload.name.trim(),
      category: payload.category.trim(),
      summary: payload.summary.trim(),
      recruitingNote: payload.recruitingNote.trim(),
    };

    this.repository.createClub(club);
    this.repository.createActivityLog({
      id: createId("activity"),
      actorId: admin.id,
      actorName: admin.name,
      action: "동아리 추가",
      context: `${club.name} 동아리를 새로 등록했습니다.`,
      createdAt: new Date().toISOString(),
      clubId: club.id,
    });
  }

  private requireAdmin(userId: string): User {
    const user = findUserById(this.repository, userId);

    if (user.role !== "admin" || user.approvalStatus !== "approved") {
      throw new AppError(403, "관리자 전용 기능입니다.");
    }

    return user;
  }

  private getApplicationViews(): AdminJoinRequestView[] {
    return this.repository
      .getJoinRequests()
      .slice()
      .sort((left, right) => {
        if (left.status !== right.status) {
          return left.status === "pending" ? -1 : 1;
        }

        return right.createdAt.localeCompare(left.createdAt);
      })
      .map((joinRequest) => {
        const applicant = findUserById(this.repository, joinRequest.userId);

        return {
          id: joinRequest.id,
          userId: applicant.id,
          applicantName: applicant.name,
          email: applicant.email,
          phone: applicant.phone,
          studentId: applicant.studentId,
          desiredClubName: findClubById(this.repository, joinRequest.desiredClubId).name,
          message: joinRequest.message,
          status: joinRequest.status,
          createdAt: joinRequest.createdAt,
          reviewedAt: joinRequest.reviewedAt,
          reviewNote: joinRequest.reviewNote,
          assignedClubName: joinRequest.assignedClubId
            ? findClubById(this.repository, joinRequest.assignedClubId).name
            : undefined,
          assignedRole: joinRequest.assignedRole,
        };
      });
  }

  private getClubViews(): AdminClubView[] {
    return this.repository
      .getClubs()
      .slice()
      .sort((left, right) => left.name.localeCompare(right.name))
      .map((club) => ({
        ...club,
        memberCount: this.repository
          .getUsers()
          .filter((user) => user.clubId === club.id && user.approvalStatus === "approved")
          .length,
        leaderName: getClubLeaderName(this.repository, club.id),
      }));
  }

  private getUserViews(): AdminUserView[] {
    return this.repository
      .getUsers()
      .slice()
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      .map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        studentId: user.studentId,
        role: user.role,
        approvalStatus: user.approvalStatus,
        clubName: user.clubId
          ? findClubById(this.repository, user.clubId).name
          : undefined,
        approvedAt: user.approvedAt,
      }));
  }
}
