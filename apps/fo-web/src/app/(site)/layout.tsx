import { SiteHeader } from "@/apps/ui";
import { SiteFooter } from "@/apps/ui";

const SiteLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="site-shell">
    <SiteHeader />
    <div className="site-main">{children}</div>
    <SiteFooter />
  </div>
);

export default SiteLayout;
