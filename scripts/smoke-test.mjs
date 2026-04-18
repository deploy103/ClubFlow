const baseUrl = process.env.CLUBFLOW_BASE_URL ?? "http://127.0.0.1:4000";

const log = (message) => {
  process.stdout.write(`${message}\n`);
};

const assert = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }
};

const request = async (path, init = {}) => {
  const response = await fetch(`${baseUrl}${path}`, init);
  const contentType = response.headers.get("content-type") ?? "";
  const body = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  return {
    ok: response.ok,
    status: response.status,
    headers: response.headers,
    body,
  };
};

const login = async (email, password) => {
  const response = await request("/api/auth/login", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  assert(response.ok, `로그인 실패: ${email}`);

  const cookieHeader = response.headers.get("set-cookie");
  assert(cookieHeader, `세션 쿠키 누락: ${email}`);

  const cookie = cookieHeader.split(";")[0];
  const csrfToken = response.body?.csrfToken;
  assert(typeof csrfToken === "string" && csrfToken.length > 10, `CSRF 토큰 누락: ${email}`);

  return {
    cookie,
    csrfToken,
    user: response.body.user,
  };
};

const signup = async (payload) => {
  const response = await request("/api/auth/signup", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  assert(response.status === 201, `회원가입 실패: ${payload.email}`);

  const cookieHeader = response.headers.get("set-cookie");
  assert(cookieHeader, `회원가입 세션 쿠키 누락: ${payload.email}`);

  const cookie = cookieHeader.split(";")[0];
  const csrfToken = response.body?.csrfToken;
  assert(typeof csrfToken === "string" && csrfToken.length > 10, "회원가입 CSRF 토큰 누락");

  return {
    cookie,
    csrfToken,
    user: response.body.user,
  };
};

const authenticatedRequest = async (session, path, init = {}) => {
  const headers = new Headers(init.headers ?? {});
  headers.set("cookie", session.cookie);

  if ((init.method ?? "GET").toUpperCase() !== "GET") {
    headers.set("x-csrf-token", session.csrfToken);
  }

  if (init.body !== undefined && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  return request(path, {
    ...init,
    headers,
  });
};

const run = async () => {
  log(`Smoke test start: ${baseUrl}`);

  const health = await request("/api/health");
  assert(health.ok && health.body.status === "ok", "헬스체크 실패");
  log("1. health ok");

  const anonymousSession = await request("/api/auth/me");
  assert(anonymousSession.status === 401, "비인증 접근 차단 실패");
  log("2. anonymous guard ok");

  const clubsResponse = await request("/api/public/clubs");
  assert(clubsResponse.ok, "공개 동아리 목록 조회 실패");
  const firstClub = clubsResponse.body.clubs?.[0];
  assert(firstClub?.id, "기본 동아리 시드가 없습니다.");
  log("3. public clubs ok");

  const admin = await login("admin@clubflow.local", "ClubFlow!Admin2026");
  const leader = await login("leader@clubflow.local", "ClubFlow!Leader2026");
  log("4. admin/leader login ok");

  const uniqueSuffix = Date.now();
  const applicant = await signup({
    name: `스모크신입${uniqueSuffix}`,
    email: `smoke-${uniqueSuffix}@clubflow.local`,
    password: "ClubFlow!Smoke2026",
    phone: "010-9999-9999",
    studentId: `SM${uniqueSuffix}`,
    desiredClubId: firstClub.id,
    bio: "가입 승인 흐름을 확인하기 위한 스모크 테스트 계정입니다.",
    message: "운영 흐름과 역할 분리 검증을 위해 가입 요청을 보냅니다.",
  });
  assert(applicant.user.approvalStatus === "pending", "회원가입 직후 상태가 pending 이 아닙니다.");
  log("5. signup ok");

  const pendingOverview = await authenticatedRequest(applicant, "/api/pending/overview");
  assert(pendingOverview.ok, "승인 대기 화면 데이터 조회 실패");
  assert(pendingOverview.body.status === "pending", "대기 상태 응답이 올바르지 않습니다.");
  log("6. pending overview ok");

  const applications = await authenticatedRequest(admin, "/api/admin/applications");
  assert(applications.ok, "관리자 가입 요청 조회 실패");
  const targetRequest = applications.body.requests.find(
    (requestItem) => requestItem.userId === applicant.user.id,
  );
  assert(targetRequest?.id, "관리자가 새 가입 요청을 찾지 못했습니다.");

  const approve = await authenticatedRequest(
    admin,
    `/api/admin/applications/${targetRequest.id}/approve`,
    {
      method: "POST",
      body: JSON.stringify({
        clubId: firstClub.id,
        role: "member",
        note: "스모크 테스트 승인",
      }),
    },
  );
  assert(approve.ok, "관리자 승인 실패");
  log("7. admin approve ok");

  const refreshedSession = await authenticatedRequest(applicant, "/api/auth/me");
  assert(refreshedSession.ok, "승인 후 세션 조회 실패");
  assert(refreshedSession.body.user.role === "member", "승인 후 역할이 member 로 반영되지 않았습니다.");
  log("8. session refresh ok");

  const memberDashboard = await authenticatedRequest(applicant, "/api/member/dashboard");
  const memberClub = await authenticatedRequest(applicant, "/api/member/club");
  assert(memberDashboard.ok, "멤버 대시보드 조회 실패");
  assert(memberClub.ok, "멤버 동아리 조회 실패");
  log("9. member routes ok");

  const leaderDashboard = await authenticatedRequest(leader, "/api/leader/dashboard");
  assert(leaderDashboard.ok, "리더 대시보드 조회 실패");

  const announce = await authenticatedRequest(leader, "/api/leader/announcements", {
    method: "POST",
    body: JSON.stringify({
      title: `Smoke Notice ${uniqueSuffix}`,
      body: "리더 공지 작성 흐름이 정상 동작하는지 확인하기 위한 테스트 공지입니다.",
      pinned: false,
    }),
  });
  assert(announce.ok, "리더 공지 작성 실패");
  log("10. leader routes ok");

  const roleViolation = await authenticatedRequest(applicant, "/api/admin/dashboard");
  assert(roleViolation.status === 403, "역할 기반 접근 제어가 동작하지 않습니다.");
  log("11. role guard ok");

  const csrfFailure = await request(`/api/admin/applications/${targetRequest.id}/reject`, {
    method: "POST",
    headers: {
      cookie: admin.cookie,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      note: "CSRF 실패 확인",
    }),
  });
  assert(csrfFailure.status === 403, "CSRF 보호가 기대한 대로 동작하지 않습니다.");
  log("12. csrf guard ok");

  const logout = await authenticatedRequest(applicant, "/api/auth/logout", {
    method: "POST",
    body: JSON.stringify({}),
  });
  assert(logout.status === 204, "로그아웃 실패");
  log("13. logout ok");

  log("Smoke test completed successfully.");
};

run().catch((error) => {
  process.stderr.write(`Smoke test failed: ${error.message}\n`);
  process.exitCode = 1;
});
