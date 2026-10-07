import { redirect } from "next/navigation";

import type { Metadata } from "next";
export const metadata: Metadata = { title: "고객센터" };


const CsPage = () => redirect("/cs/notice");

export default CsPage;
