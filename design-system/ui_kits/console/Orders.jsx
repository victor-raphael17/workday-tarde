/* Orders screen — purchase orders + reorder suggestions */
const ORDER_STATE = {
  draft:     { label: "Draft",      cls: "neutral", icon: "file-pen" },
  submitted: { label: "Submitted",  cls: "ordered", icon: "send" },
  transit:   { label: "In transit", cls: "low",     icon: "truck" },
  received:  { label: "Received",   cls: "in",      icon: "package-check" },
};

function Orders({ notify }) {
  const { orders, reorderSuggestions } = window.CADATA;
  const [selected, setSelected] = useState(null);
  const open = orders.filter(o => o.state !== "received");

  return (
    <div>
      <PageHeader
        title="Orders"
        subtitle={`${open.length} open purchase orders`}
        actions={<>
          <Button variant="secondary" icon="truck">Receive stock</Button>
          <Button variant="primary" icon="plus">Create order</Button>
        </>}
      />

      {/* Reorder suggestions */}
      <Card style={{ marginBottom: 20, borderColor: "var(--warning-bd)", background: "var(--warning-bg)", padding: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px" }}>
          <span className="vr-avatar" style={{ width: 40, height: 40, background: "var(--warning)", color: "#fff" }}><Icon name="alert-triangle" size={19} /></span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, color: "var(--warning)", fontSize: 14.5 }}>{reorderSuggestions.length} items at or below reorder point</div>
            <div style={{ fontSize: 12.5, color: "var(--warning)", marginTop: 2 }} className="mono">
              {reorderSuggestions.slice(0, 4).map(m => m.name).join(" · ")}{reorderSuggestions.length > 4 ? " …" : ""}
            </div>
          </div>
          <Button variant="primary" icon="clipboard-check" onClick={() => notify(`Draft order created from ${reorderSuggestions.length} suggestions`)}>
            Create reorder
          </Button>
        </div>
      </Card>

      <Card pad={false} style={{ overflow: "hidden" }}>
        <div className="vr-card-head"><span className="vr-card-title">Purchase orders</span></div>
        <table className="vr-table">
          <thead>
            <tr>
              <th>Order</th><th>Supplier</th>
              <th className="right">Items</th><th className="right">Units</th>
              <th>Expected</th><th>Status</th><th className="right">Total</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(o => {
              const s = ORDER_STATE[o.state];
              return (
                <tr key={o.id} className={selected && selected.id === o.id ? "selected" : ""} onClick={() => setSelected(o)}>
                  <td className="mono med-name">{o.id}</td>
                  <td>{o.supplier}</td>
                  <td className="right mono">{o.items}</td>
                  <td className="right mono">{o.units}</td>
                  <td className="mono" style={{ color: "var(--fg-muted)" }}>{o.expected}</td>
                  <td><span className={`vr-badge vr-badge-${s.cls}`}><Icon name={s.icon} size={12} />{s.label}</span></td>
                  <td className="right mono" style={{ fontWeight: 600 }}>{money(o.total)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      {selected && <OrderDrawer order={selected} onClose={() => setSelected(null)} notify={notify} />}
    </div>
  );
}

function OrderDrawer({ order, onClose, notify }) {
  const s = ORDER_STATE[order.state];
  const sample = window.CADATA.meds.slice(0, Math.min(order.items, 6));
  return (
    <>
      <div className="vr-scrim" onClick={onClose}></div>
      <div className="vr-drawer">
        <div className="vr-drawer-head">
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "var(--fg-strong)" }} className="mono">{order.id}</h2>
            <div style={{ color: "var(--fg-subtle)", fontSize: 13, marginTop: 4 }}>{order.supplier}</div>
          </div>
          <div className="vr-icon-btn" onClick={onClose}><Icon name="x" size={18} /></div>
        </div>
        <div className="vr-drawer-body">
          <div className="vr-row" style={{ gap: 10, marginBottom: 18 }}>
            <span className={`vr-badge vr-badge-${s.cls}`}><Icon name={s.icon} size={12} />{s.label}</span>
            <span className="mono" style={{ fontSize: 13, color: "var(--fg-muted)" }}>Expected {order.expected}</span>
          </div>

          <div className="t-eyebrow" style={{ marginBottom: 8 }}>Line items</div>
          {sample.map((m, i) => (
            <div className="vr-row" key={m.sku} style={{ justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--divider)" }}>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--fg-strong)" }}>{m.name} {m.strength}</div>
                <div className="mono" style={{ fontSize: 12, color: "var(--fg-subtle)" }}>{m.sku}</div>
              </div>
              <div className="mono" style={{ fontSize: 13, color: "var(--fg-muted)" }}>{(i + 2) * 8} packs</div>
            </div>
          ))}

          <div style={{ marginTop: 16 }}>
            <div className="vr-kv"><span className="k">Total units</span><span className="v mono">{order.units}</span></div>
            <div className="vr-kv"><span className="k">Order total</span><span className="v mono" style={{ fontWeight: 700 }}>{money(order.total)}</span></div>
          </div>
        </div>
        <div className="vr-drawer-foot">
          {order.state === "draft" && <Button variant="primary" icon="send" style={{ flex: 1, justifyContent: "center" }} onClick={() => { notify(`${order.id} submitted to ${order.supplier}`); onClose(); }}>Submit order</Button>}
          {order.state === "transit" && <Button variant="primary" icon="package-check" style={{ flex: 1, justifyContent: "center" }} onClick={() => { notify(`${order.id} received into stock`); onClose(); }}>Receive into stock</Button>}
          {(order.state === "submitted") && <Button variant="secondary" icon="truck" style={{ flex: 1, justifyContent: "center" }} onClick={onClose}>Track shipment</Button>}
          {order.state === "received" && <Button variant="secondary" icon="file-text" style={{ flex: 1, justifyContent: "center" }} onClick={onClose}>View receipt</Button>}
        </div>
      </div>
    </>
  );
}
window.Orders = Orders;
