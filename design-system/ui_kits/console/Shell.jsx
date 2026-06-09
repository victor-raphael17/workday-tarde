/* App shell — sidebar + topbar */
function Sidebar({ current, onNav }) {
  const { prescriptions, meds } = window.CADATA;
  const queueCount = prescriptions.filter(p => p.state !== "dispensed").length;
  const lowCount = meds.filter(m => m.status === "low" || m.status === "out").length;

  const items = [
    { id: "dashboard", label: "Dashboard", icon: "layout-dashboard" },
    { id: "pos", label: "Point of sale", icon: "shopping-cart" },
    { id: "inventory", label: "Inventory", icon: "package", count: lowCount },
    { id: "rx", label: "Prescriptions", icon: "clipboard-list", count: queueCount },
  ];
  const more = [
    { id: "patients", label: "Patients", icon: "users" },
    { id: "orders", label: "Orders", icon: "truck" },
    { id: "reports", label: "Reports", icon: "bar-chart-3" },
    { id: "controlled", label: "Controlled register", icon: "shield-alert" },
  ];

  return (
    <aside className="vr-side">
      <div className="vr-side-brand">
        <img src="../../assets/logo-mark.svg" alt="" />
        <span className="wm">CA <span>Pharmacy</span></span>
      </div>

      {items.map(it => (
        <div key={it.id} className={"vr-nav" + (current === it.id ? " active" : "")} onClick={() => onNav(it.id)}>
          <Icon name={it.icon} size={18} />{it.label}
          {it.count > 0 && <span className="count">{it.count}</span>}
        </div>
      ))}

      <div className="vr-side-sec">Manage</div>
      {more.map(it => (
        <div key={it.id} className={"vr-nav" + (current === it.id ? " active" : "")} onClick={() => onNav(it.id)}>
          <Icon name={it.icon} size={18} />{it.label}
        </div>
      ))}

      <div className="vr-side-spacer"></div>
      <div className="vr-side-user">
        <Avatar name="Jade Okafor" size={34} tone="green" />
        <div>
          <div className="u-name">Jade Okafor</div>
          <div className="u-role">Pharmacist · Riverside</div>
        </div>
      </div>
    </aside>
  );
}

function Topbar() {
  return (
    <header className="vr-top">
      <div className="vr-search">
        <Icon name="search" size={16} />
        <input placeholder="Search medications, patients, scripts…" />
        <kbd>/</kbd>
      </div>
      <div className="vr-top-spacer"></div>
      <div className="vr-top-store"><Icon name="store" size={16} />Riverside branch<Icon name="chevron-down" size={15} /></div>
      <div className="vr-icon-btn"><Icon name="bell" size={19} /><span className="pip"></span></div>
      <div className="vr-icon-btn"><Icon name="help-circle" size={19} /></div>
    </header>
  );
}

window.Sidebar = Sidebar;
window.Topbar = Topbar;
