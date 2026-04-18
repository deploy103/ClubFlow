import type { PendingOverviewData } from "@clubflow/shared";
import { useQuery } from "@tanstack/react-query";

import { Badge, EmptyState, formatDateTime, Panel } from "../components/ui";
import { apiGet } from "../lib/api";

const statusTone: Record<PendingOverviewData["status"], "amber" | "green" | "red"> = {
  pending: "amber",
  approved: "green",
  rejected: "red",
};

const statusLabel: Record<PendingOverviewData["status"], string> = {
  pending: "검토 대기",
  approved: "승인 완료",
  rejected: "반려",
};

export const PendingPage = () => {
  const overviewQuery = useQuery({
    queryKey: ["pending", "overview"],
    queryFn: () => apiGet<PendingOverviewData>("/api/pending/overview"),
  });

  const overview = overviewQuery.data;

  if (!overview) {
    return <div className="loading-card">가입 요청 상태를 불러오는 중입니다.</div>;
  }

  return (
    <div className="review-layout">
      <section className="review-card">
        <div className="panel__header">
          <div>
            <span className="eyebrow">Approval Queue</span>
            <h1>가입 요청을 확인 중입니다.</h1>
            <p>
              운영진이 요청을 검토하고 동아리와 역할을 배정하면 자동으로 접근 권한이
              열립니다.
            </p>
          </div>
          <Badge label={statusLabel[overview.status]} tone={statusTone[overview.status]} />
        </div>

        <div className="review-grid">
          <Panel title="요청 정보" subtitle="현재 운영진이 확인하는 기준입니다.">
            <div className="detail-list">
              <div>
                <strong>희망 동아리</strong>
                <p>{overview.requestedClubName}</p>
              </div>
              <div>
                <strong>제출 시각</strong>
                <p>{formatDateTime(overview.submittedAt)}</p>
              </div>
            </div>
          </Panel>

          <Panel title="운영진 메모" subtitle="검토가 끝나면 여기에 메모가 표시됩니다.">
            {overview.reviewNote ? (
              <div className="highlight-box">{overview.reviewNote}</div>
            ) : (
              <EmptyState
                title="아직 메모가 없습니다."
                description="운영진이 검토를 끝내면 승인 또는 반려 사유가 표시됩니다."
              />
            )}
          </Panel>
        </div>

        <Panel title="다음 단계" subtitle="상태에 따라 해야 할 일을 정리했습니다.">
          <div className="stack-list">
            {overview.nextSteps.map((step) => (
              <article className="stack-item" key={step}>
                <p>{step}</p>
              </article>
            ))}
          </div>
        </Panel>
      </section>
    </div>
  );
};
