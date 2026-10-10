import { API_URL, fmtMan } from "@/shared/api";
import { AppLink } from "@/shared/ui";

import type { Metadata } from "next";

export const metadata: Metadata = { title: "데일리펀딩" };

type Product = {
  id: number;
  product_no: string;
  name: string;
  type: string;
  annual_rate: string;
  term_months: number;
  target_amount: number;
  progress_pct: string;
  status: string;
};

const TYPE_LABEL: Record<string, string> = {
  scf: "SCF",
  stock_loan: "주식담보",
  mortgage: "부동산",
  personal_credit: "개인신용",
};

const fetchJson = async <T,>(path: string): Promise<T | null> => {
  try {
    const res = await fetch(`${API_URL}${path}`, { next: { revalidate: 30 } });
    return res.ok ? ((await res.json()) as T) : null;
  } catch {
    return null;
  }
};

const HomePage = async () => {
  const [products, notices] = await Promise.all([
    fetchJson<{ results: Product[] }>("/products?status=recruiting&sort=latest"),
    fetchJson<{ results: { id: number; title: string }[] }>("/notices?page_size=4"),
  ]);
  return (
    <main className="container home">
      <section className="home-hero">
        <h1>
          매일 쌓이는 수익,
          <br />
          데일리펀딩
        </h1>
        <p>온라인투자연계금융으로 시작하는 새로운 투자</p>
        <div className="home-hero-actions">
          <AppLink href="/investment" className="btn btn-primary">
            투자하기
          </AppLink>
          <AppLink href="/loan" className="btn btn-outline">
            대출받기
          </AppLink>
        </div>
      </section>

      <section className="home-section">
        <div className="home-section-head">
          <h2>모집 중인 상품</h2>
          <AppLink href="/investment">전체보기</AppLink>
        </div>
        <div className="card-grid">
          {(products?.results ?? []).slice(0, 6).map((p) => (
            <AppLink key={p.id} href={`/investment/${p.id}`} className="card product-card">
              <div className="product-card-badges">
                <span className="badge">{TYPE_LABEL[p.type] ?? p.type}</span>
                <span className="badge badge-accent">
                  {p.status === "recruiting" ? "모집중" : "모집예정"}
                </span>
              </div>
              <h3>{p.name}</h3>
              <div className="product-card-rate">
                <strong>{p.annual_rate}%</strong>
                <span>{p.term_months}개월</span>
              </div>
              <div className="progress">
                <i style={{ width: `${Math.min(100, Number(p.progress_pct))}%` }} />
              </div>
              <div className="product-card-meta">
                <span>{p.progress_pct}%</span>
                <span>{fmtMan(p.target_amount)}</span>
              </div>
              <small>{p.product_no}</small>
            </AppLink>
          ))}
        </div>
      </section>

      <section className="home-section">
        <div className="home-section-head">
          <h2>공지사항</h2>
          <AppLink href="/cs/notice">더보기</AppLink>
        </div>
        <ul className="list">
          {(notices?.results ?? []).map((n) => (
            <li key={n.id}>
              <AppLink href={`/cs/notice/${n.id}`}>{n.title}</AppLink>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
};

export default HomePage;
