export type Role = "pending" | "member" | "leader" | "admin";
export type ApprovedRole = Exclude<Role, "pending">;
export type ApprovalStatus = "pending" | "approved" | "rejected";
export type RequestStatus = "pending" | "approved" | "rejected";
export type AnnouncementAudience = "global" | "club";

export interface Club {
  id: string;
  name: string;
  category: string;
  summary: string;
  recruitingNote: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  studentId: string;
  bio: string;
  avatarLabel: string;
  role: Role;
  approvalStatus: ApprovalStatus;
  clubId?: string;
  createdAt: string;
  approvedAt?: string;
}

export interface JoinRequest {
  id: string;
  userId: string;
  desiredClubId: string;
  message: string;
  status: RequestStatus;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewNote?: string;
  assignedClubId?: string;
  assignedRole?: Exclude<Role, "pending" | "admin">;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  audience: AnnouncementAudience;
  clubId?: string;
  createdAt: string;
  createdBy: string;
  pinned: boolean;
}

export interface ActivityLog {
  id: string;
  actorId: string;
  actorName: string;
  action: string;
  context: string;
  createdAt: string;
  clubId?: string;
  targetUserId?: string;
}

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  phone: string;
  studentId: string;
  bio: string;
  role: Role;
  approvalStatus: ApprovalStatus;
  club?: Club;
}

export interface AuthSessionResponse {
  user: SessionUser;
  csrfToken: string;
}

export interface AnnouncementView {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  createdByName: string;
  pinned: boolean;
  audienceLabel: string;
}

export interface PendingOverviewData {
  status: RequestStatus;
  requestedClubName: string;
  submittedAt: string;
  reviewNote?: string;
  nextSteps: string[];
}

export interface MemberClubSummary {
  name: string;
  category: string;
  summary: string;
  recruitingNote: string;
  leaderName: string;
  memberCount: number;
}

export interface MemberDashboardData {
  summary: {
    approvalStatus: ApprovalStatus;
    clubName: string;
    clubMembers: number;
    pinnedAnnouncements: number;
  };
  club: MemberClubSummary;
  announcements: AnnouncementView[];
  activity: ActivityLog[];
}

export interface MemberClubData {
  club: MemberClubSummary;
  members: Array<{
    id: string;
    name: string;
    role: ApprovedRole;
    badge: string;
  }>;
  announcements: AnnouncementView[];
}

export interface MemberProfileData {
  profile: {
    name: string;
    email: string;
    phone: string;
    studentId: string;
    role: ApprovedRole;
    approvalStatus: ApprovalStatus;
    clubName: string;
    bio: string;
    approvedAt?: string;
  };
  request: {
    status: RequestStatus;
    desiredClubName: string;
    message: string;
    createdAt: string;
    reviewedAt?: string;
    reviewNote?: string;
  };
  activity: ActivityLog[];
}

export interface LeaderDashboardData {
  summary: {
    memberCount: number;
    announcementCount: number;
    pendingClubRequests: number;
    globalAnnouncements: number;
  };
  club: Omit<MemberClubSummary, "leaderName" | "memberCount">;
  membersPreview: Array<{
    id: string;
    name: string;
    role: ApprovedRole;
    approvedAt?: string;
  }>;
  announcements: AnnouncementView[];
  recentActivity: ActivityLog[];
}

export interface LeaderMembersData {
  club: Omit<MemberClubSummary, "leaderName" | "memberCount">;
  members: Array<{
    id: string;
    name: string;
    email: string;
    phone: string;
    studentId: string;
    role: ApprovedRole;
    approvedAt?: string;
  }>;
}

export interface LeaderAnnouncementsData {
  club: {
    id: string;
    name: string;
  };
  announcements: AnnouncementView[];
}

export interface AdminJoinRequestView {
  id: string;
  userId: string;
  applicantName: string;
  email: string;
  phone: string;
  studentId: string;
  desiredClubName: string;
  message: string;
  status: RequestStatus;
  createdAt: string;
  reviewedAt?: string;
  reviewNote?: string;
  assignedClubName?: string;
  assignedRole?: Exclude<Role, "pending" | "admin">;
}

export interface AdminClubView extends Club {
  memberCount: number;
  leaderName?: string;
}

export interface AdminUserView {
  id: string;
  name: string;
  email: string;
  phone: string;
  studentId: string;
  role: Role;
  approvalStatus: ApprovalStatus;
  clubName?: string;
  approvedAt?: string;
}

export interface AdminDashboardData {
  summary: {
    pendingRequests: number;
    approvedMembers: number;
    leaders: number;
    clubs: number;
  };
  pendingRequests: AdminJoinRequestView[];
  recentUsers: AdminUserView[];
  recentActivity: ActivityLog[];
  clubs: AdminClubView[];
}

export interface AdminApplicationsData {
  requests: AdminJoinRequestView[];
  clubs: Club[];
}

export interface AdminClubsData {
  clubs: AdminClubView[];
}

export interface AdminUsersData {
  users: AdminUserView[];
}
