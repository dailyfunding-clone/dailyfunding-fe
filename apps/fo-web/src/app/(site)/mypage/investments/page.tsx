"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { AuthGate } from "@/features/auth";
import { api, fmtWon } from "@/shared/api";
import { useDocumentTitle } from "@/shared/lib";

import { INVESTMENT_STATUS_LABELS, PRODUCT_TYPE_LABELS } from "../_components";
import { fmtDate } from "../_components";

import "../mypage.css";


type InvestmentItem = {
  id: number;
  product_id: number;
  product_no: string;
  product_name: string;
  type: string;
  amount: number;
  points_used: number;
  expected_net_return: number;
  status: string;
  created_at: string;
};

type InvestmentList = {
  results: InvestmentItem[];
  total: number;
  page: number;
};

type ScheduleRow = {
  seq: number;
  pay_date: string;
  principal: number;
  repay_principal: number;
  interest_gross: number;
  tax: number;
  platform_fee: number;
  interest_net: number;
};

type InvestmentDetail = {
  investment_id: number;
  amount: number;
  points_used: number;
  expected_net_return: number;
  status: string;
  schedule: ScheduleRow[];
  paid_net: number;
};

const STATUS_CHIPS = [
  { key: "", label: "전체" },
  { key: "active", label: "진행중" },
  { key: "repaid", label: "상환완료" },
  { key: "overdue", label: "연체" },
  { key: "loss", label: "손실" },
];

const TYPE_CHIPS = [
  { key: "", label: "전체" },
  { key: "mortgage", label: "부동산담보" },
  { key: "scf", label: "매출채권" },
  { key: "stock_loan", label: "주식담보" },
  { key: "personal_credit", label: "개인신용" },
];

const InvestmentsPage = () => {
  useDocumentTitle("투자내역");
  return (
  <AuthGate>
    <Investments />
  </AuthGate>
);
};

const Investments = () => {
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [openId, setOpenId] = useState<number | null>(null);

  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (type) params.set("type", type);

  const { data } = useQuery<InvestmentList>({
    queryKey: ["me-investments", status, type],
    queryFn: () =>
      api.request<InvestmentList>(
        "get",
        `/api/me/investments?${params.toString()}`,
      ),
  });

  return (
    <div className="container">
      <h1 className="page-title">투자내역</h1>

      <div className="filter-block">
        <div className="chips">
          {STATUS_CHIPS.map((c) => (
            <button
              key={c.key}
              type="button"
              className={`chip${status === c.key ? " is-active" : ""}`}
              onClick={() => setStatus(c.key)}
            >
              {c.label}
            </button>
          ))}
        </div>
        <div className="chips">
          {TYPE_CHIPS.map((c) => (
            <button
              key={c.key}
              type="button"
              className={`chip${type === c.key ? " is-active" : ""}`}
              onClick={() => setType(c.key)}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {!data ? (
        <div className="empty">불러오는 중…</div>
      ) : data.results.length === 0 ? (
        <div className="empty">투자 내역이 없어요</div>
      ) : (
        <>
          <p className="muted">총 {data.total}건</p>
          <div className="card-list mt-12">
            {data.results.map((inv) => (
              <InvestmentCard
                key={inv.id}
                inv={inv}
                open={openId === inv.id}
                onToggle={() =>
                  setOpenId(openId === inv.id ? null : inv.id)
                }
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const InvestmentCard = ({
  inv,
  open,
  onToggle,
}: {
  inv: InvestmentItem;
  open: boolean;
  onToggle: () => void;
}) => (
  <div className="card inv-card">
    <button type="button" className="inv-card-head" onClick={onToggle}>
      <div className="row-between">
        <span className="inv-name">{inv.product_name}</span>
        <span
          className={`badge${
            inv.status === "overdue" || inv.status === "loss"
              ? " badge-danger"
              : inv.status === "repaid"
                ? " badge-success"
                : ""
          }`}
        >
          {INVESTMENT_STATUS_LABELS[inv.status] ?? inv.status}
        </span>
      </div>
      <div className="row-between">
        <span className="muted">
          {inv.product_no} · {PRODUCT_TYPE_LABELS[inv.type] ?? inv.type} ·{" "}
          {fmtDate(inv.created_at)}
        </span>
      </div>
      <div className="row-between">
        <span className="muted">
          투자 {fmtWon(inv.amount)}
          {inv.points_used > 0 && ` (포인트 ${fmtWon(inv.points_used)})`}
        </span>
        <span>예상 수익 {fmtWon(inv.expected_net_return)}</span>
      </div>
    </button>
    {open && <InvestmentDetailView id={inv.id} />}
  </div>
);

const InvestmentDetailView = ({ id }: { id: number }) => {
  const { data } = useQuery<InvestmentDetail>({
    queryKey: ["investment", id],
    queryFn: () =>
      api.request<InvestmentDetail>("get", `/api/investments/${id}`),
  });

  if (!data) return <div className="inv-detail muted">불러오는 중…</div>;

  return (
    <div className="inv-detail">
      <div className="row-between mb-12">
        <span className="muted">받은 수익 (세후)</span>
        <strong>{fmtWon(data.paid_net)}</strong>
      </div>
      <table className="table">
        <thead>
          <tr>
            <th>회차</th>
            <th>지급일</th>
            <th>상환원금</th>
            <th>수익(세후)</th>
          </tr>
        </thead>
        <tbody>
          {data.schedule.map((s) => (
            <tr key={s.seq}>
              <td>{s.seq}</td>
              <td>{fmtDate(s.pay_date)}</td>
              <td>{fmtWon(s.repay_principal)}</td>
              <td>{fmtWon(s.interest_net)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default InvestmentsPage;
