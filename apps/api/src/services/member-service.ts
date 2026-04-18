import type {
  MemberClubData,
  MemberClubSummary,
  MemberDashboardData,
  MemberProfileData,
  User,
} from "@clubflow/shared";

import { AppError, invariant } from "../lib/errors.js";
import type { PlatformRepository } from "../repositories/contracts.js";
import {
  findLatestJoinRequestByUserId,
  findUserById,
  getActivityForClub,
  getActivityForUser,
  getAnnouncementsForClub,
  getClubLeaderName,
  getClubMembers,
} from "./service-utils.js";

export class MemberService {
  constructor(private readonly repository: PlatformRepository) {}

  getDashboard(userId: string): MemberDashboardData {
    const member = this.requireMember(userId);
    const club = this.getClubSummary(member.clubId!);
    const announcements = getAnnouncementsForClub(this.repository, member.clubId!).slice(0, 5);

    return {
      summary: {
        approvalStatus: member.approvalStatus,
        clubName: club.name,
        clubMembers: club.memberCount,
        pinnedAnnouncements: announcements.filter((announcement) => announcement.pinned).length,
      },
      club,
      announcements,
      activity: getActivityForUser(this.repository, member.id).slice(0, 6),
    };
  }

  getClub(userId: string): MemberClubData {
    const member = this.requireMember(userId);

    return {
      club: this.getClubSummary(member.clubId!),
      members: getClubMembers(this.repository, member.clubId!).map((clubMember) => ({
        id: clubMember.id,
        name: clubMember.name,
        role: clubMember.role as "member" | "leader" | "admin",
        badge:
          clubMember.role === "leader"
            ? "리더"
            : clubMember.role === "admin"
              ? "관리자"
              : "멤버",
      })),
      announcements: getAnnouncementsForClub(this.repository, member.clubId!),
    };
  }

  getProfile(userId: string): MemberProfileData {
    const member = this.requireMember(userId);
    const joinRequest = findLatestJoinRequestByUserId(this.repository, member.id);

    return {
      profile: {
        name: member.name,
        email: member.email,
        phone: member.phone,
        studentId: member.studentId,
        role: member.role as "member" | "leader" | "admin",
        approvalStatus: member.approvalStatus,
        clubName: this.getClubSummary(member.clubId!).name,
        bio: member.bio,
        approvedAt: member.approvedAt,
      },
      request: {
        status: joinRequest.status,
        desiredClubName: this.getClubSummary(joinRequest.assignedClubId ?? joinRequest.desiredClubId)
          .name,
        message: joinRequest.message,
        createdAt: joinRequest.createdAt,
        reviewedAt: joinRequest.reviewedAt,
        reviewNote: joinRequest.reviewNote,
      },
      activity: [
        ...getActivityForUser(this.repository, member.id),
        ...getActivityForClub(this.repository, member.clubId!).filter(
          (activityLog) => activityLog.targetUserId === member.id,
        ),
      ]
        .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
        .slice(0, 8),
    };
  }

  private requireMember(userId: string): User {
    const user = findUserById(this.repository, userId);

    if (user.role !== "member" || user.approvalStatus !== "approved") {
      throw new AppError(403, "멤버 전용 기능입니다.");
    }

    invariant(user.clubId, "배정된 동아리가 없습니다.", 400);

    return user;
  }

  private getClubSummary(clubId: string): MemberClubSummary {
    const club = this.repository.getClubs().find((currentClub) => currentClub.id === clubId);

    if (!club) {
      throw new AppError(404, "동아리를 찾을 수 없습니다.");
    }

    return {
      name: club.name,
      category: club.category,
      summary: club.summary,
      recruitingNote: club.recruitingNote,
      leaderName: getClubLeaderName(this.repository, club.id),
      memberCount: getClubMembers(this.repository, club.id).length,
    };
  }
}
