import {
  TERMS,
} from "@/entities/content";
import { AppLink } from "@/shared/ui";

const SiteFooter = () => (
  <footer className="site-footer">
    <div className="site-footer-inner">
      <div className="site-footer-terms">
        {TERMS.map((t) => (
          <AppLink key={t.key} href={`/terms/${t.key}`}>
            {t.title}
          </AppLink>
        ))}
        <AppLink href="/news">언론보도</AppLink>
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
