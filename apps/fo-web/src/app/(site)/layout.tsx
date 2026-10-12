import { SiteHeader } from "@/apps/ui";
import { SiteFooter } from "@/apps/ui";

const SiteLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="site-shell">
    <a href="#main-content" className="skip-link">
      본문으로 건너뛰기
    </a>
    <SiteHeader />
    <div className="site-main" id="main-content">
      {children}
    </div>
    <SiteFooter />
  </div>
);

export default SiteLayout;
