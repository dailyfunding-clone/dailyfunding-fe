import "../content.scss";

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

const fmt = (v: unknown): string => (typeof v === "number" ? v.toLocaleString("ko-KR") : String(v));

const MatrixTable = ({ rows }: { rows: Record<string, unknown>[] }) => {
  const cols = [...new Set(rows.flatMap((r) => Object.keys(r)))];
  return (
    <table className="table">
      <thead>
        <tr>
          {cols.map((c) => (
            <th key={c}>{c}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i}>
            {cols.map((c) => (
              <td key={c}>{r[c] === undefined || r[c] === null ? "-" : fmt(r[c])}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

const Block = ({ data }: { data: unknown }) => {
  if (Array.isArray(data)) {
    if (!data.length) return null;
    if (data.every(isRecord)) return <MatrixTable rows={data} />;
    return (
      <ul className="json-list">
        {data.map((v, i) => (
          <li key={i}>{isRecord(v) || Array.isArray(v) ? <Block data={v} /> : fmt(v)}</li>
        ))}
      </ul>
    );
  }
  if (isRecord(data)) {
    const entries = Object.entries(data);
    const scalars = entries.filter(([, v]) => !isRecord(v) && !Array.isArray(v));
    const nested = entries.filter(([, v]) => isRecord(v) || Array.isArray(v));
    return (
      <>
        {scalars.length > 0 && (
          <table className="table">
            <tbody>
              {scalars.map(([k, v]) => (
                <tr key={k}>
                  <th>{k}</th>
                  <td>{v === null || v === undefined ? "-" : fmt(v)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {nested.map(([k, v]) => (
          <section className="json-section" key={k}>
            <h3>{k}</h3>
            <Block data={v} />
          </section>
        ))}
      </>
    );
  }
  return <p>{fmt(data)}</p>;
};

const JsonBlock = ({ data }: { data: unknown }) => {
  const empty =
    data === null ||
    data === undefined ||
    (isRecord(data) && Object.keys(data).length === 0) ||
    (Array.isArray(data) && data.length === 0);
  if (empty) return <div className="empty">등록된 정보가 없어요</div>;
  return <Block data={data} />;
};

export default JsonBlock;
