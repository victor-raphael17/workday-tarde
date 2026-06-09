/* CA Pharmacy Console — app root */
function PlaceholderScreen({ title, icon }) {
  return (
    <div>
      <PageHeader title={title} />
      <Card style={{ padding: 0 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, padding: "70px 20px", textAlign: "center" }}>
          <span className="vr-avatar vr-avatar-slate" style={{ width: 52, height: 52, background: "var(--slate-100)", color: "var(--slate-500)" }}>
            <Icon name={icon} size={24} />
          </span>
          <div style={{ fontWeight: 600, color: "var(--fg)", fontSize: 16 }}>{title}</div>
          <div style={{ color: "var(--fg-subtle)", fontSize: 13, maxWidth: 320 }}>
            This surface isn't built out in the UI kit. It follows the same shell, type, and component patterns shown in the four core screens.
          </div>
        </div>
      </Card>
    </div>
  );
}

function App() {
  const [screen, setScreen] = useState("dashboard");
  const [toast, setToast] = useState("");
  const notify = (m) => setToast(m);

  let body;
  if (screen === "dashboard") body = <Dashboard onNav={setScreen} />;
  else if (screen === "inventory") body = <Inventory notify={notify} />;
  else if (screen === "pos") body = <PointOfSale notify={notify} />;
  else if (screen === "rx") body = <Prescriptions notify={notify} />;
  else if (screen === "patients") body = <Patients notify={notify} />;
  else if (screen === "orders") body = <Orders notify={notify} />;
  else {
    const map = {
      reports: ["Reports", "bar-chart-3"], controlled: ["Controlled register", "shield-alert"],
    };
    body = <PlaceholderScreen title={map[screen][0]} icon={map[screen][1]} />;
  }

  return (
    <div className="vr-app">
      <Sidebar current={screen} onNav={setScreen} />
      <div className="vr-main">
        <Topbar />
        <main className="vr-content">{body}</main>
      </div>
      <Toast msg={toast} onDone={() => setToast("")} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
