import type {
  MemberClubData,
  MemberDashboardData,
  MemberProfileData,
} from "@clubflow/shared";
import { useQuery } from "@tanstack/react-query";

import {
  Badge,
  DataTable,
  EmptyState,
  PageIntro,
  Panel,
  StatCard,
  formatDateTime,
} from "../components/ui";
import { apiGet } from "../lib/api";

export const MemberDashboardPage = () => {
  const dashboardQuery = useQuery({
    queryKey: ["member", "dashboard"],
    queryFn: () => apiGet<MemberDashboardData>("/api/member/dashboard"),
  });

  const dashboard = dashboardQuery.data;

  if (!dashboard) {
    return <div className="loading-card">멤버 대시보드를 불러오는 중입니다.</div>;
  }

  return (
    <div className="page-stack">
      <PageIntro
        title="멤버 대시보드"
        description="내가 승인된 상태인지, 어느 동아리에 배정됐는지, 최근 공지가 무엇인지 바로 보이게 정리했습니다."
      />

      <section className="stats-grid">
        <StatCard label="승인 상태" value="승인 완료" tone="green" />
        <StatCard label="소속 동아리" value={dashboard.summary.clubName} tone="navy" />
        <StatCard label="동아리 인원" value={`${dashboard.summary.clubMembers}명`} tone="slate" />
        <StatCard
          label="고정 공지"
          value={`${dashboard.summary.pinnedAnnouncements}건`}
          tone="amber"
        />
      </section>

      <section className="content-grid">
        <Panel title="내 동아리" subtitle="운영 설명과 리더 정보를 한 번에 봅니다.">
          <div className="detail-list">
            <div>
              <strong>{dashboard.club.name}</strong>
              <p>{dashboard.club.summary}</p>
            </div>
            <div>
              <strong>카테고리</strong>
              <p>{dashboard.club.category}</p>
            </div>
            <div>
              <strong>리더</strong>
              <p>{dashboard.club.leaderName}</p>
            </div>
            <div>
              <strong>운영 메모</strong>
              <p>{dashboard.club.recruitingNote}</p>
            </div>
          </div>
        </Panel>

        <Panel title="최근 공지" subtitle="중요한 공지를 위로 끌어올렸습니다.">
          <div className="stack-list">
            {dashboard.announcements.length === 0 ? (
              <EmptyState title="등록된 공지가 없습니다." description="새 공지가 올라오면 여기에 표시됩니다." />
            ) : (
              dashboard.announcements.map((announcement) => (
                <article className="stack-item" key={announcement.id}>
                  <div className="stack-item__title">
                    <strong>{announcement.title}</strong>
                    {announcement.pinned ? <Badge label="PIN" tone="amber" /> : null}
                  </div>
                  <p>{announcement.body}</p>
                  <small>
                    {announcement.audienceLabel} · {announcement.createdByName} ·{" "}
                    {formatDateTime(announcement.createdAt)}
                  </small>
                </article>
              ))
            )}
          </div>
        </Panel>
      </section>

      <Panel title="내 활동" subtitle="가입 승인과 운영 관련 기록만 남깁니다.">
        <div className="stack-list">
          {dashboard.activity.length === 0 ? (
            <EmptyState title="활동 기록이 없습니다." description="승인이나 공지 관련 이력이 생기면 표시됩니다." />
          ) : (
            dashboard.activity.map((activity) => (
              <article className="stack-item" key={activity.id}>
                <div className="stack-item__title">
                  <strong>{activity.action}</strong>
                  <small>{formatDateTime(activity.createdAt)}</small>
                </div>
                <p>{activity.context}</p>
              </article>
            ))
          )}
        </div>
      </Panel>
    </div>
  );
};

export const MemberClubPage = () => {
  const clubQuery = useQuery({
    queryKey: ["member", "club"],
    queryFn: () => apiGet<MemberClubData>("/api/member/club"),
  });

  const clubData = clubQuery.data;

  if (!clubData) {
    return <div className="loading-card">동아리 정보를 불러오는 중입니다.</div>;
  }

  return (
    <div className="page-stack">
      <PageIntro
        title="내 동아리"
        description="불필요한 위젯을 빼고 동아리 정보, 멤버, 공지만 따로 분리했습니다."
      />

      <section className="content-grid">
        <Panel title="동아리 소개" subtitle="운영 목적과 현재 구조입니다.">
          <div className="detail-list">
            <div>
              <strong>{clubData.club.name}</strong>
              <p>{clubData.club.summary}</p>
            </div>
            <div>
              <strong>카테고리</strong>
              <p>{clubData.club.category}</p>
            </div>
            <div>
              <strong>리더</strong>
              <p>{clubData.club.leaderName}</p>
            </div>
            <div>
              <strong>모집 메모</strong>
              <p>{clubData.club.recruitingNote}</p>
            </div>
          </div>
        </Panel>

        <Panel title="동아리 공지" subtitle="전체 공지와 동아리 공지를 함께 봅니다.">
          <div className="stack-list">
            {clubData.announcements.map((announcement) => (
              <article className="stack-item" key={announcement.id}>
                <div className="stack-item__title">
                  <strong>{announcement.title}</strong>
                  <Badge
                    label={announcement.audienceLabel}
                    tone={announcement.audienceLabel === "전체 공지" ? "navy" : "green"}
                  />
                </div>
                <p>{announcement.body}</p>
                <small>{formatDateTime(announcement.createdAt)}</small>
              </article>
            ))}
          </div>
        </Panel>
      </section>

      <Panel title="멤버 목록" subtitle="누가 어느 역할인지 분리해서 보여줍니다.">
        <DataTable
          columns={[
            { header: "이름", render: (row) => row.name },
            {
              header: "역할",
              render: (row) => (
                <Badge label={row.badge} tone={row.role === "leader" ? "amber" : "green"} />
              ),
            },
          ]}
          rows={clubData.members}
          getRowKey={(row) => row.id}
        />
      </Panel>
    </div>
  );
};

export const MemberProfilePage = () => {
  const profileQuery = useQuery({
    queryKey: ["member", "profile"],
    queryFn: () => apiGet<MemberProfileData>("/api/member/profile"),
  });

  const profile = profileQuery.data;

  if (!profile) {
    return <div className="loading-card">내 정보를 불러오는 중입니다.</div>;
  }

  return (
    <div className="page-stack">
      <PageIntro
        title="내 정보"
        description="가입 요청 내용과 승인 기록, 개인 정보를 따로 분리해 확인할 수 있습니다."
      />

      <section className="content-grid">
        <Panel title="기본 정보" subtitle="운영진이 배정한 현재 상태입니다.">
          <div className="detail-list">
            <div>
              <strong>이름</strong>
              <p>{profile.profile.name}</p>
            </div>
            <div>
              <strong>이메일</strong>
              <p>{profile.profile.email}</p>
            </div>
            <div>
              <strong>연락처</strong>
              <p>{profile.profile.phone}</p>
            </div>
            <div>
              <strong>학번</strong>
              <p>{profile.profile.studentId}</p>
            </div>
            <div>
              <strong>역할</strong>
              <p>{profile.profile.role}</p>
            </div>
            <div>
              <strong>소속 동아리</strong>
              <p>{profile.profile.clubName}</p>
            </div>
            <div>
              <strong>자기 소개</strong>
              <p>{profile.profile.bio}</p>
            </div>
          </div>
        </Panel>

        <Panel title="가입 요청 기록" subtitle="운영진이 확인한 요청 내용입니다.">
          <div className="detail-list">
            <div>
              <strong>희망 동아리</strong>
              <p>{profile.request.desiredClubName}</p>
            </div>
            <div>
              <strong>지원 메시지</strong>
              <p>{profile.request.message}</p>
            </div>
            <div>
              <strong>요청 시각</strong>
              <p>{formatDateTime(profile.request.createdAt)}</p>
            </div>
            <div>
              <strong>검토 메모</strong>
              <p>{profile.request.reviewNote ?? "메모 없음"}</p>
            </div>
          </div>
        </Panel>
      </section>

      <Panel title="개인 관련 이력" subtitle="승인 처리와 개인 대상 운영 이력입니다.">
        <div className="stack-list">
          {profile.activity.map((activity) => (
            <article className="stack-item" key={activity.id}>
              <div className="stack-item__title">
                <strong>{activity.action}</strong>
                <small>{formatDateTime(activity.createdAt)}</small>
              </div>
              <p>{activity.context}</p>
            </article>
          ))}
        </div>
      </Panel>
    </div>
  );
};
