/* Prescriptions screen — kanban queue, click a card to advance its state */
function Prescriptions({ notify }) {
  const [rx, setRx] = useState(() => window.CADATA.prescriptions.map(p => ({ ...p })));
  const order = ["new", "verifying", "ready", "dispensed"];
  const cols = [
    { id: "new", title: "New", icon: "inbox", next: "Verify" },
    { id: "verifying", title: "Verifying", icon: "search-check", next: "Mark ready" },
    { id: "ready", title: "Ready for pickup", icon: "package-check", next: "Dispense" },
    { id: "dispensed", title: "Dispensed", icon: "check-circle-2", next: null },
  ];

  function advance(id) {
    setRx(list => list.map(p => {
      if (p.id !== id) return p;
      const i = order.indexOf(p.state);
      if (i >= order.length - 1) return p;
      const ns = order[i + 1];
      if (ns === "dispensed") notify(`${p.id} dispensed to ${p.patient}`);
      return { ...p, state: ns };
    }));
  }

  return (
    <div>
      <PageHeader
        title="Prescriptions"
        subtitle={`${rx.filter(p => p.state !== "dispensed").length} active in queue`}
        actions={<>
          <Button variant="secondary" icon="scan-line">Scan script</Button>
          <Button variant="primary" icon="plus">New prescription</Button>
        </>}
      />

      <div className="vr-rxgrid">
        {cols.map(col => {
          const items = rx.filter(p => p.state === col.id);
          return (
            <div key={col.id}>
              <div className="vr-rxcol-head">
                <span className="vr-rxcol-title"><Icon name={col.icon} size={16} style={{ color: "var(--fg-subtle)" }} />{col.title}</span>
                <span className="vr-rxcol-count">{items.length}</span>
              </div>
              <div className="vr-rxcol">
                {items.map(p => (
                  <div className="vr-rxcard" key={p.id} onClick={() => advance(p.id)}>
                    <div className="vr-row" style={{ justifyContent: "space-between" }}>
                      <span className="rx-id">{p.id}</span>
                      <span className="rx-time">{p.time}</span>
                    </div>
                    <div className="rx-patient">{p.patient}</div>
                    <div className="rx-med">{p.med} · <span className="mono">{p.qty}</span></div>
                    <div className="rx-foot">
                      <span style={{ fontSize: 12, color: "var(--fg-subtle)" }}>{p.prescriber}</span>
                      {p.flag === "controlled" && <span className="vr-flag controlled"><Icon name="lock" size={12} />Controlled</span>}
                      {p.flag === "interaction" && <span className="vr-flag interaction"><Icon name="alert-triangle" size={12} />Interaction</span>}
                    </div>
                    {col.next && (
                      <Button variant={col.id === "ready" ? "primary" : "secondary"} size="sm"
                        style={{ width: "100%", justifyContent: "center", marginTop: 11 }}
                        onClick={(e) => { e.stopPropagation(); advance(p.id); }}>
                        {col.next}
                      </Button>
                    )}
                  </div>
                ))}
                {items.length === 0 && (
                  <div style={{ border: "1px dashed var(--border-strong)", borderRadius: 10, padding: 20, textAlign: "center", color: "var(--fg-disabled)", fontSize: 12.5 }}>
                    Nothing here
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
window.Prescriptions = Prescriptions;
