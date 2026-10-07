import { AppLink } from "@/shared/ui";

const TERMS = [
  { id: "investment", label: "온라인연계투자약관" },
  { id: "loan", label: "온라인연계대출약관" },
  { id: "electronic_finance", label: "전자금융거래약관" },
  { id: "service", label: "서비스 이용약관" },
  { id: "privacy", label: "개인정보 처리방침" },
  { id: "credit_info", label: "신용정보 활용체제" },
];

const SiteFooter = () => (
  <footer className="site-footer">
    <div className="site-footer-inner">
      <div className="site-footer-terms">
        {TERMS.map((t) => (
          <AppLink key={t.id} href={`/terms/${t.id}`}>
            {t.label}
          </AppLink>
        ))}
      </div>
      <p className="site-footer-info">
        데일리펀딩 · 고객센터 02-562-9666 (평일 09:30~17:00) · 온투업 등록번호
        2022-56
      </p>
      <p className="site-footer-notice">
        데일리펀딩은 원금과 수익을 보장하지 않으며, 투자 손실의 책임은 투자자
        본인에게 있습니다.
      </p>
    </div>
  </footer>
);

export default SiteFooter;
