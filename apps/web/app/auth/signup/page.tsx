"use client";

export default function SignUpPage() {
  return (
    <div className="auth-page">
      <header className="auth-header">
        <h1>회원가입</h1>
      </header>
      <ol className="auth-steps">
        <li className="is-active">계정 정보</li>
        <li>본인인증</li>
        <li>간편비밀번호</li>
      </ol>
      <form className="auth-form" onSubmit={(e) => e.preventDefault()}>
        <label className="field">
          <span className="field-label">이메일</span>
          <input
            className="input"
            type="email"
            name="email"
            placeholder="이메일 주소"
            autoComplete="email"
          />
        </label>
        <label className="field">
          <span className="field-label">비밀번호</span>
          <input
            className="input"
            type="password"
            name="password"
            placeholder="영문+숫자+특수문자 8~15자"
            autoComplete="new-password"
          />
        </label>
        <label className="field">
          <span className="field-label">비밀번호 확인</span>
          <input
            className="input"
            type="password"
            name="passwordConfirm"
            placeholder="비밀번호 재입력"
            autoComplete="new-password"
          />
        </label>
        <label className="field">
          <span className="field-label">추천인 이메일 (선택)</span>
          <input className="input" type="email" name="referrer" placeholder="추천인 이메일" />
        </label>
        <fieldset className="auth-terms">
          <legend>약관 동의</legend>
          <label className="terms-all">
            <input type="checkbox" name="terms_all" /> 전체 동의
          </label>
          <label>
            <input type="checkbox" name="term_service" /> [필수] 서비스 이용약관
          </label>
          <label>
            <input type="checkbox" name="term_investment" /> [필수] 온라인연계투자약관
          </label>
          <label>
            <input type="checkbox" name="term_efinance" /> [필수] 전자금융거래약관
          </label>
          <label>
            <input type="checkbox" name="term_privacy" /> [필수] 개인정보 처리방침
          </label>
          <label>
            <input type="checkbox" name="term_credit" /> [필수] 신용정보 활용체제
          </label>
          <label>
            <input type="checkbox" name="term_marketing" /> [선택] 마케팅 수신 동의
          </label>
        </fieldset>
        <button className="btn btn-primary" type="submit">
          다음
        </button>
      </form>
    </div>
  );
}
