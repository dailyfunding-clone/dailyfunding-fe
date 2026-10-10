import { CartListPanel } from "../investment/_components";

import "../investment/investment.scss";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "장바구니" };

const CartPage = () => (
  <main className="container" style={{ maxWidth: 720 }}>
    <h1 className="page-title">장바구니</h1>
    <CartListPanel />
  </main>
);

export default CartPage;
