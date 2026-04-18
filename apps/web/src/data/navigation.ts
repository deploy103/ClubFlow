import type { ApprovedRole, Role } from "@clubflow/shared";
import type { LucideIcon } from "lucide-react";
import {
  BadgeCheck,
  Building2,
  ClipboardCheck,
  LayoutDashboard,
  Megaphone,
  UserCircle2,
  Users,
} from "lucide-react";

export interface NavigationItem {
  label: string;
  path: string;
  icon: LucideIcon;
}

export const navigationByRole: Record<ApprovedRole, NavigationItem[]> = {
  member: [
    { label: "대시보드", path: "/member/dashboard", icon: LayoutDashboard },
    { label: "내 동아리", path: "/member/club", icon: Building2 },
    { label: "내 정보", path: "/member/profile", icon: UserCircle2 },
  ],
  leader: [
    { label: "대시보드", path: "/leader/dashboard", icon: LayoutDashboard },
    { label: "멤버 관리", path: "/leader/members", icon: Users },
    { label: "공지 관리", path: "/leader/announcements", icon: Megaphone },
  ],
  admin: [
    { label: "대시보드", path: "/admin/dashboard", icon: LayoutDashboard },
    { label: "가입 승인", path: "/admin/applications", icon: ClipboardCheck },
    { label: "동아리", path: "/admin/clubs", icon: Building2 },
    { label: "사용자", path: "/admin/users", icon: BadgeCheck },
  ],
};

export const roleLabel: Record<Role, string> = {
  pending: "승인 대기",
  member: "멤버",
  leader: "리더",
  admin: "관리자",
};
