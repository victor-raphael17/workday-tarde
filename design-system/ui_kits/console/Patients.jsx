/* Patients screen — searchable directory + detail drawer */
function Patients({ notify }) {
  const { patients } = window.CADATA;
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);

  let rows = patients;
  if (query) rows = rows.filter(p => (p.name + p.id + p.plan).toLowerCase().includes(query.toLowerCase()));

  return (
    <div>
      <PageHeader
        title="Patients"
        subtitle={`${patients.length} patients on file`}
        actions={<>
          <Button variant="secondary" icon="upload">Export</Button>
          <Button variant="primary" icon="user-plus">Add patient</Button>
        </>}
      />

      <div className="vr-row" style={{ justifyContent: "flex-end", marginBottom: 16 }}>
        <div className="vr-search" style={{ width: 300 }}>
          <Icon name="search" size={16} />
          <input placeholder="Search name, ID or plan…" value={query} onChange={e => setQuery(e.target.value)} />
        </div>
      </div>

      <Card pad={false} style={{ overflow: "hidden" }}>
        <table className="vr-table">
          <thead>
            <tr>
              <th>Patient</th><th>ID</th><th>Date of birth</th>
              <th>Insurance plan</th><th className="right">Active rx</th>
              <th>Allergies</th><th>Last visit</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(p => (
              <tr key={p.id} className={selected && selected.id === p.id ? "selected" : ""} onClick={() => setSelected(p)}>
                <td>
                  <div className="vr-row" style={{ gap: 10 }}>
                    <Avatar name={p.name} size={30} tone="slate" />
                    <span className="med-name">{p.name}</span>
                  </div>
                </td>
                <td className="mono" style={{ color: "var(--fg-muted)" }}>{p.id}</td>
                <td className="mono" style={{ color: "var(--fg-muted)" }}>{p.dob}</td>
                <td>{p.plan}</td>
                <td className="right mono" style={{ fontWeight: 600 }}>{p.active}</td>
                <td>
                  {p.allergies.length === 0
                    ? <span style={{ color: "var(--fg-disabled)", fontSize: 12.5 }}>None recorded</span>
                    : <span className="vr-flag interaction"><Icon name="alert-triangle" size={12} />{p.allergies.length} allerg{p.allergies.length > 1 ? "ies" : "y"}</span>}
                </td>
                <td className="mono" style={{ color: "var(--fg-muted)" }}>{p.lastVisit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {selected && <PatientDrawer patient={selected} onClose={() => setSelected(null)} notify={notify} />}
    </div>
  );
}

function PatientDrawer({ patient, onClose, notify }) {
  return (
    <>
      <div className="vr-scrim" onClick={onClose}></div>
      <div className="vr-drawer">
        <div className="vr-drawer-head">
          <div className="vr-row" style={{ gap: 12 }}>
            <Avatar name={patient.name} size={44} tone="slate" />
            <div>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "var(--fg-strong)" }}>{patient.name}</h2>
              <div style={{ color: "var(--fg-subtle)", fontSize: 13, marginTop: 3 }} className="mono">{patient.id} · DOB {patient.dob}</div>
            </div>
          </div>
          <div className="vr-icon-btn" onClick={onClose}><Icon name="x" size={18} /></div>
        </div>
        <div className="vr-drawer-body">
          {patient.allergies.length > 0 && (
            <div style={{ background: "var(--danger-bg)", border: "1px solid var(--danger-bd)", borderRadius: 10, padding: "11px 13px", marginBottom: 18 }}>
              <div className="vr-row" style={{ gap: 7, color: "var(--danger)", fontWeight: 700, fontSize: 12.5, marginBottom: 8 }}>
                <Icon name="alert-triangle" size={15} />Allergies &amp; alerts
              </div>
              <div className="vr-row" style={{ flexWrap: "wrap", gap: 6 }}>
                {patient.allergies.map(a => (
                  <span key={a} className="vr-flag interaction">{a}</span>
                ))}
              </div>
            </div>
          )}

          <div style={{ marginBottom: 18 }}>
            <div className="t-eyebrow" style={{ marginBottom: 8 }}>Profile</div>
            <div className="vr-kv"><span className="k">Phone</span><span className="v mono">{patient.phone}</span></div>
            <div className="vr-kv"><span className="k">Insurance plan</span><span className="v">{patient.plan}</span></div>
            <div className="vr-kv"><span className="k">Active prescriptions</span><span className="v mono">{patient.active}</span></div>
            <div className="vr-kv"><span className="k">Last visit</span><span className="v mono">{patient.lastVisit}</span></div>
          </div>

          <div>
            <div className="t-eyebrow" style={{ marginBottom: 8 }}>Current medications</div>
            {patient.meds.length === 0
              ? <div style={{ color: "var(--fg-disabled)", fontSize: 13 }}>None on record.</div>
              : patient.meds.map(m => (
                <div className="vr-row" key={m} style={{ gap: 10, padding: "9px 0", borderBottom: "1px solid var(--divider)" }}>
                  <span className="vr-avatar vr-avatar-slate" style={{ width: 28, height: 28, background: "var(--slate-100)", color: "var(--slate-500)" }}><Icon name="pill" size={14} /></span>
                  <span style={{ fontSize: 13.5, fontWeight: 500 }}>{m}</span>
                </div>
              ))}
          </div>
        </div>
        <div className="vr-drawer-foot">
          <Button variant="secondary" icon="file-text" style={{ flex: 1, justifyContent: "center" }}>History</Button>
          <Button variant="primary" icon="clipboard-list" style={{ flex: 1, justifyContent: "center" }}
            onClick={() => { notify(`New prescription started for ${patient.name}`); onClose(); }}>New prescription</Button>
        </div>
      </div>
    </>
  );
}
window.Patients = Patients;
