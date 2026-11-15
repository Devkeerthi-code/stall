export default function Loading() {
  return (
    <section className="panel" aria-busy="true" aria-label="Loading">
      <div className="skeleton" style={{ height: 14, width: 120, marginBottom: 12 }} />
      <div className="skeleton" style={{ height: 36, width: "min(360px, 80%)", marginBottom: 32 }} />
      {Array.from({ length: 5 }, (_, i) => <div className="sk" key={i}><i /><i /><i /><i /><i /></div>)}
    </section>
  );
}
