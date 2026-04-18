import type {
  LeaderAnnouncementsData,
  LeaderDashboardData,
  LeaderMembersData,
} from "@clubflow/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";

import {
  Badge,
  DataTable,
  EmptyState,
  InputField,
  PageIntro,
  Panel,
  StatCard,
  TextAreaField,
  formatDateTime,
} from "../components/ui";
import { ApiError, apiGet, apiPost } from "../lib/api";

export const LeaderDashboardPage = () => {
  const dashboardQuery = useQuery({
    queryKey: ["leader", "dashboard"],
    queryFn: () => apiGet<LeaderDashboardData>("/api/leader/dashboard"),
  });

  const dashboard = dashboardQuery.data;

  if (!dashboard) {
    return <div className="loading-card">리더 대시보드를 불러오는 중입니다.</div>;
  }

  return (
    <div className="page-stack">
      <PageIntro
        title="리더 대시보드"
        description="멤버 수, 대기중인 가입 요청, 공지 현황만 중심으로 보이게 단순화했습니다."
      />

      <section className="stats-grid">
        <StatCard label="멤버 수" value={`${dashboard.summary.memberCount}명`} tone="green" />
        <StatCard
          label="동아리 공지"
          value={`${dashboard.summary.announcementCount}건`}
          tone="navy"
        />
        <StatCard
          label="희망 가입 요청"
          value={`${dashboard.summary.pendingClubRequests}건`}
          tone="amber"
        />
        <StatCard
          label="전체 공지"
          value={`${dashboard.summary.globalAnnouncements}건`}
          tone="slate"
        />
      </section>

      <section className="content-grid">
        <Panel title="동아리 운영 메모" subtitle="리더가 가장 자주 확인하는 요약입니다.">
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
              <strong>운영 메모</strong>
              <p>{dashboard.club.recruitingNote}</p>
            </div>
          </div>
        </Panel>

        <Panel title="최근 공지" subtitle="고정 공지가 위에 올라옵니다.">
          <div className="stack-list">
            {dashboard.announcements.map((announcement) => (
              <article className="stack-item" key={announcement.id}>
                <div className="stack-item__title">
                  <strong>{announcement.title}</strong>
                  {announcement.pinned ? <Badge label="PIN" tone="amber" /> : null}
                </div>
                <p>{announcement.body}</p>
                <small>
                  {announcement.audienceLabel} · {formatDateTime(announcement.createdAt)}
                </small>
              </article>
            ))}
          </div>
        </Panel>
      </section>

      <section className="content-grid">
        <Panel title="최근 승인 멤버" subtitle="신규 합류 멤버를 빠르게 확인합니다.">
          <div className="stack-list">
            {dashboard.membersPreview.length === 0 ? (
              <EmptyState title="아직 멤버가 없습니다." description="운영진 승인 후 여기에 표시됩니다." />
            ) : (
              dashboard.membersPreview.map((member) => (
                <article className="stack-item" key={member.id}>
                  <div className="stack-item__title">
                    <strong>{member.name}</strong>
                    <Badge
                      label={member.role === "leader" ? "리더" : "멤버"}
                      tone={member.role === "leader" ? "amber" : "green"}
                    />
                  </div>
                  <small>{formatDateTime(member.approvedAt)}</small>
                </article>
              ))
            )}
          </div>
        </Panel>

        <Panel title="운영 로그" subtitle="동아리 관련 처리 이력만 모읍니다.">
          <div className="stack-list">
            {dashboard.recentActivity.map((activity) => (
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
      </section>
    </div>
  );
};

export const LeaderMembersPage = () => {
  const membersQuery = useQuery({
    queryKey: ["leader", "members"],
    queryFn: () => apiGet<LeaderMembersData>("/api/leader/members"),
  });

  const membersData = membersQuery.data;

  if (!membersData) {
    return <div className="loading-card">멤버 목록을 불러오는 중입니다.</div>;
  }

  return (
    <div className="page-stack">
      <PageIntro
        title="멤버 관리"
        description="리더 화면에서는 멤버 정보만 분리해서 보이게 했습니다. 승인 자체는 관리자 전용입니다."
      />

      <Panel title={membersData.club.name} subtitle={membersData.club.summary}>
        <DataTable
          columns={[
            { header: "이름", render: (row) => row.name },
            { header: "이메일", render: (row) => row.email },
            { header: "연락처", render: (row) => row.phone },
            { header: "학번", render: (row) => row.studentId },
            {
              header: "역할",
              render: (row) => (
                <Badge
                  label={row.role === "leader" ? "리더" : "멤버"}
                  tone={row.role === "leader" ? "amber" : "green"}
                />
              ),
            },
            { header: "승인 시각", render: (row) => formatDateTime(row.approvedAt) },
          ]}
          rows={membersData.members}
          getRowKey={(row) => row.id}
        />
      </Panel>
    </div>
  );
};

export const LeaderAnnouncementsPage = () => {
  const queryClient = useQueryClient();
  const announcementsQuery = useQuery({
    queryKey: ["leader", "announcements"],
    queryFn: () => apiGet<LeaderAnnouncementsData>("/api/leader/announcements"),
  });

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [pinned, setPinned] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const createAnnouncementMutation = useMutation({
    mutationFn: () =>
      apiPost("/api/leader/announcements", {
        title,
        body,
        pinned,
      }),
    onSuccess: async () => {
      setTitle("");
      setBody("");
      setPinned(false);
      setErrorMessage(null);
      await queryClient.invalidateQueries({ queryKey: ["leader"] });
    },
    onError: (error) => {
      setErrorMessage(
        error instanceof ApiError ? error.message : "공지 등록에 실패했습니다.",
      );
    },
  });

  const announcementsData = announcementsQuery.data;

  if (!announcementsData) {
    return <div className="loading-card">공지 목록을 불러오는 중입니다.</div>;
  }

  return (
    <div className="page-stack">
      <PageIntro
        title="공지 관리"
        description="복잡한 화면 대신 공지 작성과 공지 목록만 분리했습니다."
      />

      <section className="content-grid">
        <Panel title="새 공지 작성" subtitle={`${announcementsData.club.name} 전용 공지를 등록합니다.`}>
          <form
            className="form-grid"
            onSubmit={(event: FormEvent<HTMLFormElement>) => {
              event.preventDefault();
              void createAnnouncementMutation.mutateAsync();
            }}
          >
            <InputField label="공지 제목" value={title} onChange={setTitle} />
            <TextAreaField
              label="공지 내용"
              value={body}
              onChange={setBody}
              rows={6}
              placeholder="운영 공지, 일정, 준비물을 분명하게 적어 주세요."
            />

            <label className="checkbox-field">
              <input
                checked={pinned}
                onChange={(event) => setPinned(event.target.checked)}
                type="checkbox"
              />
              <span>상단 고정 공지로 올리기</span>
            </label>

            {errorMessage ? <p className="form-error">{errorMessage}</p> : null}

            <button
              className="primary-button"
              disabled={createAnnouncementMutation.isPending}
              type="submit"
            >
              {createAnnouncementMutation.isPending ? "등록 중..." : "공지 등록"}
            </button>
          </form>
        </Panel>

        <Panel title="등록된 공지" subtitle="전체 공지와 동아리 공지를 함께 봅니다.">
          <div className="stack-list">
            {announcementsData.announcements.map((announcement) => (
              <article className="stack-item" key={announcement.id}>
                <div className="stack-item__title">
                  <strong>{announcement.title}</strong>
                  <div className="inline-badges">
                    <Badge label={announcement.audienceLabel} tone="navy" />
                    {announcement.pinned ? <Badge label="PIN" tone="amber" /> : null}
                  </div>
                </div>
                <p>{announcement.body}</p>
                <small>
                  {announcement.createdByName} · {formatDateTime(announcement.createdAt)}
                </small>
              </article>
            ))}
          </div>
        </Panel>
      </section>
    </div>
  );
};
