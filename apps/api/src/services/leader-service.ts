import type {
  LeaderAnnouncementsData,
  LeaderDashboardData,
  LeaderMembersData,
  User,
} from "@clubflow/shared";

import { AppError, invariant } from "../lib/errors.js";
import { createId } from "../lib/security.js";
import type { PlatformRepository } from "../repositories/contracts.js";
import {
  findClubById,
  findUserById,
  getActivityForClub,
  getAnnouncementsForClub,
  getClubMembers,
} from "./service-utils.js";

export class LeaderService {
  constructor(private readonly repository: PlatformRepository) {}

  getDashboard(userId: string): LeaderDashboardData {
    const leader = this.requireLeader(userId);
    const club = findClubById(this.repository, leader.clubId!);
    const members = getClubMembers(this.repository, club.id);
    const announcements = getAnnouncementsForClub(this.repository, club.id);

    return {
      summary: {
        memberCount: members.length,
        announcementCount: announcements.filter(
          (announcement) => announcement.audienceLabel !== "전체 공지",
        ).length,
        pendingClubRequests: this.repository
          .getJoinRequests()
          .filter(
            (joinRequest) =>
              joinRequest.status === "pending" && joinRequest.desiredClubId === club.id,
          ).length,
        globalAnnouncements: announcements.filter(
          (announcement) => announcement.audienceLabel === "전체 공지",
        ).length,
      },
      club: {
        name: club.name,
        category: club.category,
        summary: club.summary,
        recruitingNote: club.recruitingNote,
      },
      membersPreview: members.slice(0, 5).map((member) => ({
        id: member.id,
        name: member.name,
        role: member.role as "member" | "leader" | "admin",
        approvedAt: member.approvedAt,
      })),
      announcements: announcements.slice(0, 5),
      recentActivity: getActivityForClub(this.repository, club.id).slice(0, 6),
    };
  }

  getMembers(userId: string): LeaderMembersData {
    const leader = this.requireLeader(userId);
    const club = findClubById(this.repository, leader.clubId!);

    return {
      club: {
        name: club.name,
        category: club.category,
        summary: club.summary,
        recruitingNote: club.recruitingNote,
      },
      members: getClubMembers(this.repository, club.id).map((member) => ({
        id: member.id,
        name: member.name,
        email: member.email,
        phone: member.phone,
        studentId: member.studentId,
        role: member.role as "member" | "leader" | "admin",
        approvedAt: member.approvedAt,
      })),
    };
  }

  getAnnouncements(userId: string): LeaderAnnouncementsData {
    const leader = this.requireLeader(userId);
    const club = findClubById(this.repository, leader.clubId!);

    return {
      club: {
        id: club.id,
        name: club.name,
      },
      announcements: getAnnouncementsForClub(this.repository, club.id),
    };
  }

  createAnnouncement(
    userId: string,
    payload: {
      title: string;
      body: string;
      pinned: boolean;
    },
  ) {
    const leader = this.requireLeader(userId);
    const club = findClubById(this.repository, leader.clubId!);

    invariant(payload.title.trim().length >= 3, "공지 제목은 3자 이상이어야 합니다.");
    invariant(payload.body.trim().length >= 10, "공지 내용은 10자 이상이어야 합니다.");

    const now = new Date().toISOString();

    this.repository.createAnnouncement({
      id: createId("announcement"),
      title: payload.title.trim(),
      body: payload.body.trim(),
      audience: "club",
      clubId: club.id,
      createdAt: now,
      createdBy: leader.id,
      pinned: payload.pinned,
    });

    this.repository.createActivityLog({
      id: createId("activity"),
      actorId: leader.id,
      actorName: leader.name,
      action: "공지 작성",
      context: `${club.name} 공지 "${payload.title.trim()}"를 등록했습니다.`,
      createdAt: now,
      clubId: club.id,
    });
  }

  private requireLeader(userId: string): User {
    const user = findUserById(this.repository, userId);

    if (user.role !== "leader" || user.approvalStatus !== "approved") {
      throw new AppError(403, "리더 전용 기능입니다.");
    }

    invariant(user.clubId, "배정된 동아리가 없습니다.", 400);

    return user;
  }
}
