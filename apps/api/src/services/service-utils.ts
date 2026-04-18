import type {
  ActivityLog,
  Announcement,
  AnnouncementView,
  Club,
  JoinRequest,
  SessionUser,
  User,
} from "@clubflow/shared";

import { AppError } from "../lib/errors.js";
import type { PlatformRepository, StoredUser } from "../repositories/contracts.js";

export const findUserById = (
  repository: PlatformRepository,
  userId: string,
): StoredUser => {
  const user = repository.getUsers().find((currentUser) => currentUser.id === userId);

  if (!user) {
    throw new AppError(404, "사용자를 찾을 수 없습니다.");
  }

  return user;
};

export const findClubById = (
  repository: PlatformRepository,
  clubId: string,
): Club => {
  const club = repository.getClubs().find((currentClub) => currentClub.id === clubId);

  if (!club) {
    throw new AppError(404, "동아리를 찾을 수 없습니다.");
  }

  return club;
};

export const findJoinRequestById = (
  repository: PlatformRepository,
  requestId: string,
): JoinRequest => {
  const joinRequest = repository
    .getJoinRequests()
    .find((currentRequest) => currentRequest.id === requestId);

  if (!joinRequest) {
    throw new AppError(404, "가입 요청을 찾을 수 없습니다.");
  }

  return joinRequest;
};

export const findLatestJoinRequestByUserId = (
  repository: PlatformRepository,
  userId: string,
): JoinRequest => {
  const joinRequest = repository
    .getJoinRequests()
    .filter((currentRequest) => currentRequest.userId === userId)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))[0];

  if (!joinRequest) {
    throw new AppError(404, "가입 요청 내역을 찾을 수 없습니다.");
  }

  return joinRequest;
};

export const buildSessionUser = (
  repository: PlatformRepository,
  userId: string,
): SessionUser => {
  const user = findUserById(repository, userId);

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    studentId: user.studentId,
    bio: user.bio,
    role: user.role,
    approvalStatus: user.approvalStatus,
    club: user.clubId
      ? repository.getClubs().find((club) => club.id === user.clubId)
      : undefined,
  };
};

export const toAnnouncementView = (
  repository: PlatformRepository,
  announcement: Announcement,
): AnnouncementView => ({
  id: announcement.id,
  title: announcement.title,
  body: announcement.body,
  createdAt: announcement.createdAt,
  createdByName:
    repository.getUsers().find((user) => user.id === announcement.createdBy)?.name ??
    "운영진",
  pinned: announcement.pinned,
  audienceLabel:
    announcement.audience === "global"
      ? "전체 공지"
      : repository.getClubs().find((club) => club.id === announcement.clubId)?.name ??
        "동아리 공지",
});

export const getAnnouncementsForClub = (
  repository: PlatformRepository,
  clubId: string,
): AnnouncementView[] =>
  repository
    .getAnnouncements()
    .filter(
      (announcement) =>
        announcement.audience === "global" || announcement.clubId === clubId,
    )
    .sort(sortAnnouncements)
    .map((announcement) => toAnnouncementView(repository, announcement));

export const getClubLeaderName = (
  repository: PlatformRepository,
  clubId: string,
): string =>
  repository.getUsers().find((user) => user.clubId === clubId && user.role === "leader")
    ?.name ?? "미배정";

export const getClubMembers = (
  repository: PlatformRepository,
  clubId: string,
): User[] =>
  repository
    .getUsers()
    .filter(
      (user) => user.clubId === clubId && user.approvalStatus === "approved",
    )
    .sort((left, right) => left.name.localeCompare(right.name));

export const getActivityForClub = (
  repository: PlatformRepository,
  clubId: string,
): ActivityLog[] =>
  repository
    .getActivityLogs()
    .filter((activityLog) => activityLog.clubId === clubId)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));

export const getActivityForUser = (
  repository: PlatformRepository,
  userId: string,
): ActivityLog[] =>
  repository
    .getActivityLogs()
    .filter(
      (activityLog) =>
        activityLog.actorId === userId || activityLog.targetUserId === userId,
    )
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));

export const sanitizeUser = (user: StoredUser) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  studentId: user.studentId,
  role: user.role,
  approvalStatus: user.approvalStatus,
  clubId: user.clubId,
  approvedAt: user.approvedAt,
});

const sortAnnouncements = (left: Announcement, right: Announcement) => {
  if (left.pinned !== right.pinned) {
    return left.pinned ? -1 : 1;
  }

  return right.createdAt.localeCompare(left.createdAt);
};
