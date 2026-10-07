type FilterRowProps = {
  label: string;
  children: React.ReactNode;
};

const FilterRow = ({ label, children }: FilterRowProps) => (
  <div className="filter-row">
    <span className="filter-label">{label}</span>
    {children}
  </div>
);

export default FilterRow;
