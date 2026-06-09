/* Inventory screen with filter tabs + detail drawer */
function Inventory({ notify }) {
  const { meds } = window.CADATA;
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);

  const counts = {
    all: meds.length,
    low: meds.filter(m => m.status === "low" || m.status === "out").length,
    expiring: meds.filter(m => m.status === "expiring").length,
    controlled: meds.filter(m => m.controlled).length,
  };

  let rows = meds;
  if (filter === "low") rows = meds.filter(m => m.status === "low" || m.status === "out");
  else if (filter === "expiring") rows = meds.filter(m => m.status === "expiring");
  else if (filter === "controlled") rows = meds.filter(m => m.controlled);
  if (query) rows = rows.filter(m => (m.name + m.sku + m.cat).toLowerCase().includes(query.toLowerCase()));

  const tabs = [
    { id: "all", label: "All items", c: counts.all },
    { id: "low", label: "Low / out", c: counts.low },
    { id: "expiring", label: "Expiring", c: counts.expiring },
    { id: "controlled", label: "Controlled", c: counts.controlled },
  ];

  return (
    <div>
      <PageHeader
        title="Inventory"
        subtitle={`${meds.length} medications tracked · last sync 4 min ago`}
        actions={<>
          <Button variant="secondary" icon="upload">Export</Button>
          <Button variant="secondary" icon="truck">Receive stock</Button>
          <Button variant="primary" icon="plus">Add medication</Button>
        </>}
      />

      <div className="vr-row" style={{ justifyContent: "space-between", marginBottom: 16 }}>
        <div className="vr-tabs">
          {tabs.map(t => (
            <div key={t.id} className={"vr-tab" + (filter === t.id ? " active" : "")} onClick={() => setFilter(t.id)}>
              {t.label} <span className="tcount">{t.c}</span>
            </div>
          ))}
        </div>
        <div className="vr-search" style={{ width: 280 }}>
          <Icon name="search" size={16} />
          <input placeholder="Search name or SKU…" value={query} onChange={e => setQuery(e.target.value)} />
        </div>
      </div>

      <Card pad={false} style={{ overflow: "hidden" }}>
        <table className="vr-table">
          <thead>
            <tr>
              <th>Medication</th><th>SKU</th><th>Category</th>
              <th className="right">On hand</th><th className="right">Reorder</th>
              <th>Expiry</th><th>Status</th><th className="right">Price</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(m => (
              <tr key={m.sku} className={selected && selected.sku === m.sku ? "selected" : ""} onClick={() => setSelected(m)}>
                <td>
                  <div className="med-name vr-row" style={{ gap: 8 }}>
                    {m.controlled && <Icon name="shield-alert" size={14} style={{ color: "var(--controlled)" }} />}
                    {m.name}
                  </div>
                  <div className="med-sub">{m.strength} · {m.form}</div>
                </td>
                <td className="mono" style={{ color: "var(--fg-muted)" }}>{m.sku}</td>
                <td>{m.cat}</td>
                <td className="right mono" style={{ fontWeight: 600 }}>{m.onHand}</td>
                <td className="right mono" style={{ color: "var(--fg-subtle)" }}>{m.reorder}</td>
                <td className="mono" style={{ color: m.status === "expiring" ? "var(--warning)" : "var(--fg-muted)" }}>{m.expiry}</td>
                <td>{m.controlled ? <span className="vr-badge vr-badge-controlled"><Icon name="lock" size={11} />Controlled</span> : <StatusBadge status={m.status} />}</td>
                <td className="right mono" style={{ fontWeight: 600 }}>{money(m.price)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {selected && <InventoryDrawer med={selected} onClose={() => setSelected(null)} notify={notify} />}
    </div>
  );
}

function InventoryDrawer({ med, onClose, notify }) {
  const status = med.controlled ? "controlled" : med.status;
  return (
    <>
      <div className="vr-scrim" onClick={onClose}></div>
      <div className="vr-drawer">
        <div className="vr-drawer-head">
          <div>
            <div className="vr-row" style={{ gap: 8 }}>
              {med.controlled && <Icon name="shield-alert" size={18} style={{ color: "var(--controlled)" }} />}
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "var(--fg-strong)" }}>{med.name}</h2>
            </div>
            <div style={{ color: "var(--fg-subtle)", fontSize: 13, marginTop: 4 }}>{med.strength} · {med.form} · {med.cat}</div>
          </div>
          <div className="vr-icon-btn" onClick={onClose}><Icon name="x" size={18} /></div>
        </div>
        <div className="vr-drawer-body">
          <div className="vr-row" style={{ gap: 10, marginBottom: 18 }}>
            <StatusBadge status={status} />
            <span className="mono" style={{ fontSize: 13, color: "var(--fg-muted)" }}>{med.sku}</span>
          </div>

          <div style={{ marginBottom: 18 }}>
            <div className="t-eyebrow" style={{ marginBottom: 8 }}>Stock</div>
            <div className="vr-kv"><span className="k">On hand</span><span className="v mono">{med.onHand} packs</span></div>
            <div className="vr-kv"><span className="k">Reorder point</span><span className="v mono">{med.reorder} packs</span></div>
            <div className="vr-kv"><span className="k">Unit price</span><span className="v mono">{money(med.price)}</span></div>
            <div className="vr-kv"><span className="k">Stock value</span><span className="v mono">{money(med.price * med.onHand)}</span></div>
          </div>

          <div style={{ marginBottom: 18 }}>
            <div className="t-eyebrow" style={{ marginBottom: 8 }}>Active batch</div>
            <div className="vr-kv"><span className="k">Lot number</span><span className="v mono">L24-{med.sku.slice(-3)}1</span></div>
            <div className="vr-kv"><span className="k">Expiry</span><span className="v mono" style={{ color: med.status === "expiring" ? "var(--warning)" : "inherit" }}>{med.expiry}</span></div>
            <div className="vr-kv"><span className="k">Supplier</span><span className="v">MedSource Distribution</span></div>
            <div className="vr-kv"><span className="k">Last received</span><span className="v mono">22 May 2026</span></div>
          </div>
        </div>
        <div className="vr-drawer-foot">
          <Button variant="secondary" icon="pencil" style={{ flex: 1, justifyContent: "center" }}>Edit</Button>
          <Button variant="primary" icon="truck" style={{ flex: 1, justifyContent: "center" }}
            onClick={() => { notify(`Reorder placed — ${med.name} ${med.strength}`); onClose(); }}>Reorder</Button>
        </div>
      </div>
    </>
  );
}
window.Inventory = Inventory;
