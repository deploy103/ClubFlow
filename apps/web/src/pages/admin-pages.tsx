import type {
  AdminApplicationsData,
  AdminClubsData,
  AdminDashboardData,
  AdminUsersData,
} from "@clubflow/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState, type FormEvent } from "react";

import {
  Badge,
  DataTable,
  EmptyState,
  InputField,
  PageIntro,
  Panel,
  SelectField,
  StatCard,
  TextAreaField,
  formatDateTime,
} from "../components/ui";
import { ApiError, apiGet, apiPost } from "../lib/api";

type RequestActionState = Record<
  string,
  {
    clubId: string;
    role: "member" | "leader";
    note: string;
  }
>;

const requestStatusTone = {
  pending: "amber",
  approved: "green",
  rejected: "red",
} as const;

const roleTone = {
  pending: "slate",
  member: "green",
  leader: "amber",
  admin: "navy",
} as const;

export const AdminDashboardPage = () => {
  const dashboardQuery = useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: () => apiGet<AdminDashboardData>("/api/admin/dashboard"),
  });

  const dashboard = dashboardQuery.data;

  if (!dashboard) {
    return <div className="loading-card">관리자 대시보드를 불러오는 중입니다.</div>;
  }

  return (
    <div className="page-stack">
      <PageIntro
        title="관리자 대시보드"
        description="가입 요청, 승인된 사용자, 동아리 상태를 페이지별로 나눠서 확인할 수 있게 정리했습니다."
      />

      <section className="stats-grid">
        <StatCard label="대기 요청" value={`${dashboard.summary.pendingRequests}건`} tone="amber" />
        <StatCard label="승인 멤버" value={`${dashboard.summary.approvedMembers}명`} tone="green" />
        <StatCard label="리더" value={`${dashboard.summary.leaders}명`} tone="navy" />
        <StatCard label="동아리" value={`${dashboard.summary.clubs}개`} tone="slate" />
      </section>

      <section className="content-grid">
        <Panel title="대기중인 요청" subtitle="승인 페이지에서 바로 처리할 요청입니다.">
          <div className="stack-list">
            {dashboard.pendingRequests.length === 0 ? (
              <EmptyState title="대기 요청이 없습니다." description="새 가입 요청이 들어오면 여기에 표시됩니다." />
            ) : (
              dashboard.pendingRequests.map((request) => (
                <article className="stack-item" key={request.id}>
                  <div className="stack-item__title">
                    <strong>{request.applicantName}</strong>
                    <Badge label={request.desiredClubName} tone="navy" />
                  </div>
                  <p>{request.message}</p>
                  <small>{formatDateTime(request.createdAt)}</small>
                </article>
              ))
            )}
          </div>
        </Panel>

        <Panel title="최근 승인 사용자" subtitle="최근 승인된 계정과 배정 상태입니다.">
          <div className="stack-list">
            {dashboard.recentUsers.map((user) => (
              <article className="stack-item" key={user.id}>
                <div className="stack-item__title">
                  <strong>{user.name}</strong>
                  <Badge label={user.role} tone={roleTone[user.role]} />
                </div>
                <p>{user.clubName ?? "전역 운영"}</p>
                <small>{formatDateTime(user.approvedAt)}</small>
              </article>
            ))}
          </div>
        </Panel>
      </section>

      <section className="content-grid">
        <Panel title="최근 활동" subtitle="승인과 운영 이력을 간단히 추적합니다.">
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

        <Panel title="동아리 현황" subtitle="동아리별 현재 인원과 리더입니다.">
          <DataTable
            columns={[
              { header: "동아리", render: (row) => row.name },
              { header: "카테고리", render: (row) => row.category },
              { header: "리더", render: (row) => row.leaderName ?? "미배정" },
              { header: "인원", render: (row) => `${row.memberCount}명` },
            ]}
            rows={dashboard.clubs}
            getRowKey={(row) => row.id}
          />
        </Panel>
      </section>
    </div>
  );
};

export const AdminApplicationsPage = () => {
  const queryClient = useQueryClient();
  const applicationsQuery = useQuery({
    queryKey: ["admin", "applications"],
    queryFn: () => apiGet<AdminApplicationsData>("/api/admin/applications"),
  });

  const [requestState, setRequestState] = useState<RequestActionState>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const pendingRequests = useMemo(
    () =>
      (applicationsQuery.data?.requests ?? []).filter(
        (request) => request.status === "pending",
      ),
    [applicationsQuery.data?.requests],
  );

  useEffect(() => {
    if (!applicationsQuery.data) {
      return;
    }

    setRequestState((current) => {
      const next = { ...current };

      for (const request of applicationsQuery.data.requests) {
        if (!next[request.id]) {
          next[request.id] = {
            clubId:
              applicationsQuery.data?.clubs.find(
                (club) => club.name === request.desiredClubName,
              )?.id ?? applicationsQuery.data.clubs[0]?.id ?? "",
            role: "member",
            note: "",
          };
        }
      }

      return next;
    });
  }, [applicationsQuery.data]);

  const approveMutation = useMutation({
    mutationFn: (requestId: string) =>
      apiPost(`/api/admin/applications/${requestId}/approve`, {
        clubId: requestState[requestId]?.clubId,
        role: requestState[requestId]?.role,
        note: requestState[requestId]?.note,
      }),
    onSuccess: async () => {
      setErrorMessage(null);
      await queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (error) => {
      setErrorMessage(
        error instanceof ApiError ? error.message : "승인 처리에 실패했습니다.",
      );
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (requestId: string) =>
      apiPost(`/api/admin/applications/${requestId}/reject`, {
        note: requestState[requestId]?.note || "추가 확인이 필요해 반려했습니다.",
      }),
    onSuccess: async () => {
      setErrorMessage(null);
      await queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (error) => {
      setErrorMessage(
        error instanceof ApiError ? error.message : "반려 처리에 실패했습니다.",
      );
    },
  });

  return (
    <div className="page-stack">
      <PageIntro
        title="가입 승인"
        description="요청을 보고 바로 동아리와 역할을 지정해 승인하거나, 메모를 남기고 반려할 수 있게 분리했습니다."
      />

      {errorMessage ? <p className="form-error">{errorMessage}</p> : null}

      <Panel title="처리 대기 요청" subtitle="관리자가 직접 동아리와 역할을 배정합니다.">
        <div className="request-grid">
          {pendingRequests.length === 0 ? (
            <EmptyState title="대기 요청이 없습니다." description="새 요청이 들어오면 여기에서 승인 처리합니다." />
          ) : (
            pendingRequests.map((request) => (
              <article className="request-card" key={request.id}>
                <div className="stack-item__title">
                  <strong>{request.applicantName}</strong>
                  <Badge label={request.desiredClubName} tone="navy" />
                </div>
                <p>{request.message}</p>
                <small>
                  {request.email} · {request.phone} · {request.studentId}
                </small>

                <div className="request-card__controls">
                  <SelectField
                    label="배정 동아리"
                    value={requestState[request.id]?.clubId ?? ""}
                    onChange={(clubId) =>
                      setRequestState((current) => ({
                        ...current,
                        [request.id]: {
                          ...(current[request.id] ?? { role: "member", note: "" }),
                          clubId,
                        },
                      }))
                    }
                    options={(applicationsQuery.data?.clubs ?? []).map((club) => ({
                      value: club.id,
                      label: club.name,
                    }))}
                  />
                  <SelectField
                    label="배정 역할"
                    value={requestState[request.id]?.role ?? "member"}
                    onChange={(role) =>
                      setRequestState((current) => ({
                        ...current,
                        [request.id]: {
                          ...(current[request.id] ?? { clubId: "", note: "" }),
                          role: role as "member" | "leader",
                        },
                      }))
                    }
                    options={[
                      { value: "member", label: "멤버" },
                      { value: "leader", label: "리더" },
                    ]}
                  />
                  <TextAreaField
                    label="운영 메모"
                    value={requestState[request.id]?.note ?? ""}
                    onChange={(note) =>
                      setRequestState((current) => ({
                        ...current,
                        [request.id]: {
                          ...(current[request.id] ?? { clubId: "", role: "member" }),
                          note,
                        },
                      }))
                    }
                    rows={3}
                    placeholder="승인 또는 반려 시 남길 메모"
                  />
                </div>

                <div className="button-row">
                  <button
                    className="primary-button"
                    disabled={approveMutation.isPending}
                    onClick={() => void approveMutation.mutateAsync(request.id)}
                    type="button"
                  >
                    승인
                  </button>
                  <button
                    className="destructive-button"
                    disabled={rejectMutation.isPending}
                    onClick={() => void rejectMutation.mutateAsync(request.id)}
                    type="button"
                  >
                    반려
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </Panel>

      <Panel title="처리 완료 기록" subtitle="승인 또는 반려 이력을 아래에서 확인합니다.">
        <DataTable
          columns={[
            { header: "이름", render: (row) => row.applicantName },
            {
              header: "상태",
              render: (row) => (
                <Badge
                  label={row.status}
                  tone={requestStatusTone[row.status]}
                />
              ),
            },
            { header: "희망 동아리", render: (row) => row.desiredClubName },
            { header: "배정 결과", render: (row) => row.assignedClubName ?? "-" },
            { header: "메모", render: (row) => row.reviewNote ?? "-" },
            { header: "처리 시각", render: (row) => formatDateTime(row.reviewedAt) },
          ]}
          rows={(applicationsQuery.data?.requests ?? []).filter(
            (request) => request.status !== "pending",
          )}
          getRowKey={(row) => row.id}
          emptyMessage="처리 완료된 기록이 아직 없습니다."
        />
      </Panel>
    </div>
  );
};

export const AdminClubsPage = () => {
  const queryClient = useQueryClient();
  const clubsQuery = useQuery({
    queryKey: ["admin", "clubs"],
    queryFn: () => apiGet<AdminClubsData>("/api/admin/clubs"),
  });

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [summary, setSummary] = useState("");
  const [recruitingNote, setRecruitingNote] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const createClubMutation = useMutation({
    mutationFn: () =>
      apiPost("/api/admin/clubs", {
        name,
        category,
        summary,
        recruitingNote,
      }),
    onSuccess: async () => {
      setName("");
      setCategory("");
      setSummary("");
      setRecruitingNote("");
      setErrorMessage(null);
      await queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (error) => {
      setErrorMessage(
        error instanceof ApiError ? error.message : "동아리 추가에 실패했습니다.",
      );
    },
  });

  return (
    <div className="page-stack">
      <PageIntro
        title="동아리 관리"
        description="추가가 안 되던 문제를 없애고, 관리자 화면에서 바로 동아리를 등록할 수 있게 바꿨습니다."
      />

      <section className="content-grid">
        <Panel title="새 동아리 추가" subtitle="이름, 카테고리, 소개, 모집 메모를 입력합니다.">
          <form
            className="form-grid"
            onSubmit={(event: FormEvent<HTMLFormElement>) => {
              event.preventDefault();
              void createClubMutation.mutateAsync();
            }}
          >
            <InputField label="동아리 이름" value={name} onChange={setName} />
            <InputField label="카테고리" value={category} onChange={setCategory} />
            <TextAreaField
              label="소개"
              value={summary}
              onChange={setSummary}
              rows={4}
              placeholder="동아리 목적과 분위기를 적어 주세요."
            />
            <TextAreaField
              label="모집 메모"
              value={recruitingNote}
              onChange={setRecruitingNote}
              rows={3}
              placeholder="신규 멤버에게 보여 줄 안내 문구입니다."
            />
            {errorMessage ? <p className="form-error">{errorMessage}</p> : null}
            <button className="primary-button" disabled={createClubMutation.isPending} type="submit">
              {createClubMutation.isPending ? "추가 중..." : "동아리 추가"}
            </button>
          </form>
        </Panel>

        <Panel title="등록된 동아리" subtitle="현재 인원과 리더를 함께 봅니다.">
          <DataTable
            columns={[
              { header: "동아리", render: (row) => row.name },
              { header: "카테고리", render: (row) => row.category },
              { header: "리더", render: (row) => row.leaderName ?? "미배정" },
              { header: "인원", render: (row) => `${row.memberCount}명` },
            ]}
            rows={clubsQuery.data?.clubs ?? []}
            getRowKey={(row) => row.id}
          />
        </Panel>
      </section>
    </div>
  );
};

export const AdminUsersPage = () => {
  const usersQuery = useQuery({
    queryKey: ["admin", "users"],
    queryFn: () => apiGet<AdminUsersData>("/api/admin/users"),
  });

  return (
    <div className="page-stack">
      <PageIntro
        title="사용자 관리"
        description="가입 상태, 역할, 소속 동아리를 한 표로 분리했습니다."
      />

      <Panel title="전체 사용자" subtitle="승인 상태와 현재 역할을 명확하게 보여줍니다.">
        <DataTable
          columns={[
            { header: "이름", render: (row) => row.name },
            { header: "이메일", render: (row) => row.email },
            { header: "연락처", render: (row) => row.phone },
            {
              header: "역할",
              render: (row) => <Badge label={row.role} tone={roleTone[row.role]} />,
            },
            {
              header: "상태",
              render: (row) => (
                <Badge
                  label={row.approvalStatus}
                  tone={
                    row.approvalStatus === "approved"
                      ? "green"
                      : row.approvalStatus === "pending"
                        ? "amber"
                        : "red"
                  }
                />
              ),
            },
            { header: "소속 동아리", render: (row) => row.clubName ?? "-" },
            { header: "승인 시각", render: (row) => formatDateTime(row.approvedAt) },
          ]}
          rows={usersQuery.data?.users ?? []}
          getRowKey={(row) => row.id}
        />
      </Panel>
    </div>
  );
};
