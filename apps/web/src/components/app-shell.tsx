import type { SessionUser } from "@clubflow/shared";
import { LogOut, PanelLeftClose } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import type { PropsWithChildren } from "react";

import { navigationByRole, roleLabel } from "../data/navigation";
import { useAuth } from "../lib/auth";
import { Badge } from "./ui";

export const AppShell = ({
  user,
  children,
}: PropsWithChildren<{ user: SessionUser }>) => {
  const navigation = navigationByRole[user.role === "pending" ? "member" : user.role];
  const location = useLocation();
  const { logout } = useAuth();

  const scopeLabel =
    user.role === "admin"
      ? "가입 승인과 운영 설정"
      : user.club?.name ?? "소속 동아리 미정";

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar__head">
          <div className="brand">
            <span className="brand__mark">CF</span>
            <div>
              <strong>ClubFlow</strong>
              <p>Club management workspace</p>
            </div>
          </div>
        </div>

        <nav className="sidebar__nav">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                className={`nav-link${isActive ? " nav-link--active" : ""}`}
                to={item.path}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="sidebar__footer">
          <div className="profile-card">
            <div className="profile-card__avatar">{user.name.slice(0, 1)}</div>
            <div>
              <strong>{user.name}</strong>
              <p>{user.studentId}</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="shell-main">
        <header className="topbar">
          <div className="topbar__scope">
            <Badge label={roleLabel[user.role]} tone="green" />
            <div>
              <strong>{scopeLabel}</strong>
              <p>{user.email}</p>
            </div>
          </div>

          <div className="topbar__actions">
            <div className="topbar__indicator">
              <PanelLeftClose size={16} />
              <span>페이지를 나눠서 관리 흐름을 단순화했습니다.</span>
            </div>
            <button className="ghost-button" onClick={() => void logout()} type="button">
              <LogOut size={16} />
              <span>로그아웃</span>
            </button>
          </div>
        </header>

        <main className="page-content">{children}</main>
      </div>
    </div>
  );
};
