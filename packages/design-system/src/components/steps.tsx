type Props = {
  items: string[];
  current: number;
};

export const Steps = ({ items, current }: Props) => (
  <ol className="auth-steps">
    {items.map((label, i) => (
      <li key={label} className={i === current ? "is-active" : undefined}>
        {label}
      </li>
    ))}
  </ol>
);
