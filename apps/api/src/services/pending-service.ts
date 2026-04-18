import type { PendingOverviewData, User } from "@clubflow/shared";

import { AppError } from "../lib/errors.js";
import type { PlatformRepository } from "../repositories/contracts.js";
import {
  findClubById,
  findLatestJoinRequestByUserId,
  findUserById,
} from "./service-utils.js";

export class PendingService {
  constructor(private readonly repository: PlatformRepository) {}

  getOverview(userId: string): PendingOverviewData {
    const user = this.requirePendingUser(userId);
    const joinRequest = findLatestJoinRequestByUserId(this.repository, user.id);
    const requestedClub = findClubById(this.repository, joinRequest.desiredClubId);

    return {
      status: joinRequest.status,
      requestedClubName: requestedClub.name,
      submittedAt: joinRequest.createdAt,
      reviewNote: joinRequest.reviewNote,
      nextSteps:
        joinRequest.status === "rejected"
          ? [
              "운영진 메모를 확인한 뒤 다시 문의하거나 새 계정으로 재신청하세요.",
              "동아리 소개와 모집 기준을 다시 확인한 뒤 지원 내용을 보완하세요.",
            ]
          : [
              "운영진이 요청을 확인하면 동아리와 역할을 직접 배정합니다.",
              "승인 전까지는 대기 화면만 열람할 수 있습니다.",
            ],
    };
  }

  private requirePendingUser(userId: string): User {
    const user = findUserById(this.repository, userId);

    if (user.approvalStatus === "approved" && user.role !== "pending") {
      throw new AppError(403, "이미 승인된 계정입니다.");
    }

    return user;
  }
}
