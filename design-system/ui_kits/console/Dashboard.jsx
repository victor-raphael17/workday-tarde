/* Dashboard screen */
function Dashboard({ onNav }) {
  const { meds, prescriptions, salesWeek } = window.CADATA;
  const lowItems = meds.filter(m => m.status === "low" || m.status === "out" || m.status === "expiring");
  const queue = prescriptions.filter(p => p.state !== "dispensed");
  const peak = Math.max(...salesWeek.map(s => s.v));

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Friday, 5 June 2026 · Riverside branch"
        actions={<>
          <Button variant="secondary" icon="truck" onClick={() => onNav("inventory")}>Receive stock</Button>
          <Button variant="primary" icon="shopping-cart" onClick={() => onNav("pos")}>New sale</Button>
        </>}
      />

      {/* KPIs */}
      <div className="vr-metrics">
        <Card className="vr-metric">
          <div className="eyebrow"><Icon name="dollar-sign" size={14} />Today's sales</div>
          <div className="val">$3,482</div>
          <div className="delta up"><Icon name="trending-up" size={14} />8.2% vs yesterday</div>
        </Card>
        <Card className="vr-metric">
          <div className="eyebrow"><Icon name="receipt" size={14} />Transactions</div>
          <div className="val">128</div>
          <div className="delta muted">avg $27.20 / sale</div>
        </Card>
        <Card className="vr-metric">
          <div className="eyebrow"><Icon name="clipboard-list" size={14} />Dispensing queue</div>
          <div className="val">{queue.length}</div>
          <div className="delta muted">2 awaiting verification</div>
        </Card>
        <Card className="vr-metric" style={{ borderColor: "var(--warning-bd)", background: "var(--warning-bg)" }}>
          <div className="eyebrow" style={{ color: "var(--warning)" }}><Icon name="alert-triangle" size={14} />Low stock</div>
          <div className="val" style={{ color: "var(--warning)" }}>{lowItems.length}</div>
          <div className="delta" style={{ color: "var(--warning)" }}>below reorder point</div>
        </Card>
      </div>

      <div className="vr-col2">
        {/* Sales chart */}
        <Card pad={false}>
          <div className="vr-card-head">
            <span className="vr-card-title">Sales this week</span>
            <span className="mono" style={{ fontSize: 13, color: "var(--fg-subtle)" }}>$21,810 total</span>
          </div>
          <div style={{ padding: "14px 18px 18px" }}>
            <div className="vr-bars">
              {salesWeek.map(s => (
                <div className="vr-bar-col" key={s.d}>
                  <div className={"vr-bar" + (s.v === peak ? " peak" : "")} style={{ height: (s.v / peak * 100) + "%" }}></div>
                  <div className="vr-bar-lbl">{s.d}</div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Attention needed */}
        <Card pad={false}>
          <div className="vr-card-head">
            <span className="vr-card-title">Attention needed</span>
            <Button variant="ghost" size="sm" onClick={() => onNav("inventory")}>View all</Button>
          </div>
          <div>
            {lowItems.slice(0, 4).map(m => (
              <div className="vr-listrow" key={m.sku}>
                <span className={`vr-avatar vr-avatar-${m.controlled ? "violet" : "slate"}`} style={{ width: 34, height: 34 }}>
                  <Icon name={m.controlled ? "shield-alert" : "pill"} size={16} />
                </span>
                <div className="grow">
                  <div className="ln1">{m.name} {m.strength}</div>
                  <div className="ln2 mono">{m.onHand} on hand · reorder at {m.reorder}</div>
                </div>
                <StatusBadge status={m.status} />
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Dispensing queue */}
      <div className="section-gap" style={{ marginTop: 20 }}>
        <Card pad={false}>
          <div className="vr-card-head">
            <span className="vr-card-title">Dispensing queue</span>
            <Button variant="ghost" size="sm" icon="arrow-right" onClick={() => onNav("rx")}>Go to prescriptions</Button>
          </div>
          <div>
            {queue.slice(0, 4).map(p => (
              <div className="vr-listrow" key={p.id}>
                <Avatar name={p.patient} size={34} tone={p.flag === "controlled" ? "violet" : "blue"} />
                <div className="grow">
                  <div className="ln1">{p.patient}</div>
                  <div className="ln2">{p.med} · <span className="mono">{p.id}</span></div>
                </div>
                {p.flag === "controlled" && <span className="vr-flag controlled"><Icon name="lock" size={12} />Controlled</span>}
                {p.flag === "interaction" && <span className="vr-flag interaction"><Icon name="alert-triangle" size={12} />Interaction</span>}
                <StatusBadge status={p.state === "ready" ? "in" : "ordered"} label={p.state === "ready" ? "Ready" : "Verifying"} />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
window.Dashboard = Dashboard;
