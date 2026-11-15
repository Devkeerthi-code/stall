export function PanelHead({ n, label, title, emphasis, children }: { n: string; label: string; title: string; emphasis: string; children?: React.ReactNode }) {
  return (
    <div className="panel__head">
      <div>
        <div className="panel__idx"><span className="n">{n}</span><span className="label">{label}</span></div>
        <h1 className="panel-title">{title} <b>{emphasis}</b></h1>
      </div>
      {children}
    </div>
  );
}
