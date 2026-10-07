import { AppLink } from "@/shared/ui";
import "../content.css";

type Props = {
  total: number;
  page: number;
  pageSize?: number;
  buildHref: (page: number) => string;
};

const Pagination = ({ total, page, pageSize = 20, buildHref }: Props) => {
  const pages = Math.ceil(total / pageSize);
  if (pages <= 1) return null;
  const start = Math.max(1, Math.min(page - 4, pages - 9));
  const end = Math.min(pages, start + 9);
  const nums = Array.from({ length: end - start + 1 }, (_, i) => start + i);
  return (
    <nav className="pagination" aria-label="페이지 이동">
      {page > 1 && <AppLink href={buildHref(page - 1)}>이전</AppLink>}
      {nums.map((p) => (
        <AppLink
          key={p}
          href={buildHref(p)}
          className={p === page ? "is-active" : undefined}
          aria-current={p === page ? "page" : undefined}
        >
          {p}
        </AppLink>
      ))}
      {page < pages && <AppLink href={buildHref(page + 1)}>다음</AppLink>}
    </nav>
  );
};

export default Pagination;
