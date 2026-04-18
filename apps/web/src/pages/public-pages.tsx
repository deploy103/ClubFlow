import type { Club } from "@clubflow/shared";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

import { InputField, SelectField, TextAreaField } from "../components/ui";
import { apiGet, ApiError } from "../lib/api";
import { getHomePath, useAuth } from "../lib/auth";

const demoAccounts = [
  {
    label: "관리자",
    email: "admin@clubflow.local",
    password: "ClubFlow!Admin2026",
  },
  {
    label: "리더",
    email: "leader@clubflow.local",
    password: "ClubFlow!Leader2026",
  },
  {
    label: "멤버",
    email: "member@clubflow.local",
    password: "ClubFlow!Member2026",
  },
];

interface ClubsResponse {
  clubs: Club[];
}

export const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);

    try {
      const user = await login(email, password);
      navigate(getHomePath(user), { replace: true });
    } catch (error) {
      setErrorMessage(
        error instanceof ApiError ? error.message : "로그인 처리에 실패했습니다.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-layout">
      <section className="auth-hero">
        <span className="eyebrow">ClubFlow</span>
        <h1>가입 요청, 승인, 동아리 배정을 한 흐름으로 정리했습니다.</h1>
        <p>
          회원가입 후 운영진이 요청을 확인하고 동아리와 역할을 배정합니다.
          승인되면 역할별 페이지로 바로 이동합니다.
        </p>

        <div className="hero-checklist">
          <article>
            <strong>1. 회원가입</strong>
            <p>기본 정보와 원하는 동아리, 지원 메시지를 남깁니다.</p>
          </article>
          <article>
            <strong>2. 운영진 승인</strong>
            <p>관리자가 요청을 보고 동아리와 역할을 직접 배정합니다.</p>
          </article>
          <article>
            <strong>3. 역할별 진입</strong>
            <p>멤버, 리더, 관리자 화면이 서로 섞이지 않게 분리됩니다.</p>
          </article>
        </div>
      </section>

      <section className="auth-card">
        <div className="panel__header">
          <div>
            <h2>로그인</h2>
            <p>불필요한 설명 없이 바로 들어갈 수 있게 정리했습니다.</p>
          </div>
          <Link className="text-link" to="/signup">
            회원가입
          </Link>
        </div>

        <form className="form-grid" onSubmit={handleSubmit}>
          <InputField label="이메일" type="email" value={email} onChange={setEmail} />
          <InputField
            label="비밀번호"
            type="password"
            value={password}
            onChange={setPassword}
          />

          {errorMessage ? <p className="form-error">{errorMessage}</p> : null}

          <button className="primary-button" disabled={submitting} type="submit">
            {submitting ? "로그인 중..." : "로그인"}
          </button>
        </form>

        <div className="mini-card">
          <div className="mini-card__header">
            <strong>테스트 계정</strong>
            <p>버튼을 누르면 입력칸만 채워집니다.</p>
          </div>
          <div className="pill-row">
            {demoAccounts.map((account) => (
              <button
                key={account.email}
                className="pill-button"
                onClick={() => {
                  setEmail(account.email);
                  setPassword(account.password);
                }}
                type="button"
              >
                {account.label}
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export const SignupPage = () => {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const clubsQuery = useQuery({
    queryKey: ["public", "clubs"],
    queryFn: () => apiGet<ClubsResponse>("/api/public/clubs"),
  });

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [studentId, setStudentId] = useState("");
  const [desiredClubId, setDesiredClubId] = useState("");
  const [bio, setBio] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!desiredClubId && clubsQuery.data?.clubs[0]) {
      setDesiredClubId(clubsQuery.data.clubs[0].id);
    }
  }, [desiredClubId, clubsQuery.data?.clubs]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);

    try {
      const user = await signup({
        name,
        email,
        password,
        phone,
        studentId,
        desiredClubId,
        bio,
        message,
      });
      navigate(getHomePath(user), { replace: true });
    } catch (error) {
      setErrorMessage(
        error instanceof ApiError ? error.message : "회원가입 처리에 실패했습니다.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-layout auth-layout--signup">
      <section className="auth-hero">
        <span className="eyebrow">Join ClubFlow</span>
        <h1>가입 요청을 보내면 운영진이 승인하고 동아리를 배정합니다.</h1>
        <p>
          학생 정보, 원하는 동아리, 간단한 소개를 남기면 관리자가 요청을 보고
          역할과 소속을 결정합니다.
        </p>

        <div className="hero-checklist">
          <article>
            <strong>필수 정보</strong>
            <p>이름, 학번, 연락처, 이메일을 입력합니다.</p>
          </article>
          <article>
            <strong>희망 동아리</strong>
            <p>관리자가 승인할 때 참고할 동아리를 선택합니다.</p>
          </article>
          <article>
            <strong>지원 메시지</strong>
            <p>왜 들어오고 싶은지 한 줄 요약이 아니라 제대로 적습니다.</p>
          </article>
        </div>
      </section>

      <section className="auth-card auth-card--wide">
        <div className="panel__header">
          <div>
            <h2>회원가입</h2>
            <p>가입 후 바로 승인 대기 화면으로 이동합니다.</p>
          </div>
          <Link className="text-link" to="/login">
            로그인으로
          </Link>
        </div>

        <form className="form-grid" onSubmit={handleSubmit}>
          <div className="field-grid">
            <InputField label="이름" value={name} onChange={setName} />
            <InputField label="학번" value={studentId} onChange={setStudentId} />
            <InputField label="이메일" type="email" value={email} onChange={setEmail} />
            <InputField label="연락처" type="tel" value={phone} onChange={setPhone} />
          </div>

          <InputField
            label="비밀번호"
            type="password"
            value={password}
            onChange={setPassword}
          />

          <SelectField
            label="희망 동아리"
            value={desiredClubId}
            onChange={setDesiredClubId}
            placeholder="동아리를 선택하세요"
            options={(clubsQuery.data?.clubs ?? []).map((club) => ({
              value: club.id,
              label: `${club.name} · ${club.category}`,
            }))}
          />

          <TextAreaField
            label="자기 소개"
            value={bio}
            onChange={setBio}
            rows={3}
            placeholder="현재 관심 분야와 참여하고 싶은 방향을 적어 주세요."
          />

          <TextAreaField
            label="지원 메시지"
            value={message}
            onChange={setMessage}
            rows={5}
            placeholder="어떤 역할로 기여하고 싶은지 구체적으로 적어 주세요."
          />

          {errorMessage ? <p className="form-error">{errorMessage}</p> : null}

          <button className="primary-button" disabled={submitting} type="submit">
            {submitting ? "가입 요청 전송 중..." : "가입 요청 보내기"}
          </button>
        </form>
      </section>
    </div>
  );
};
