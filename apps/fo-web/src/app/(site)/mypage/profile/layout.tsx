import type { Metadata } from "next";

export const metadata: Metadata = { title: "내 정보" };

const ProfileLayout = ({ children }: { children: React.ReactNode }) => children;

export default ProfileLayout;
