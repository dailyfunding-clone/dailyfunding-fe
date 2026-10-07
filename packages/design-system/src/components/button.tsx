import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "outline";
};

export const Button = ({ variant = "primary", className, ...props }: Props) => (
  <button
    className={["btn", `btn-${variant}`, className].filter(Boolean).join(" ")}
    {...props}
  />
);
