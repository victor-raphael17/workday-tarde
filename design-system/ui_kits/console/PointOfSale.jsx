/* Point of Sale screen */
function PointOfSale({ notify }) {
  const { meds } = window.CADATA;
  const [cart, setCart] = useState([]);
  const [query, setQuery] = useState("");

  const available = meds.filter(m => m.onHand > 0);
  const shown = query ? available.filter(m => (m.name + m.sku).toLowerCase().includes(query.toLowerCase())) : available;

  function add(m) {
    setCart(c => {
      const found = c.find(i => i.sku === m.sku);
      if (found) return c.map(i => i.sku === m.sku ? { ...i, qty: i.qty + 1 } : i);
      return [...c, { sku: m.sku, name: m.name, strength: m.strength, price: m.price, qty: 1, controlled: m.controlled }];
    });
  }
  function setQty(sku, d) {
    setCart(c => c.map(i => i.sku === sku ? { ...i, qty: Math.max(0, i.qty + d) } : i).filter(i => i.qty > 0));
  }

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const tax = subtotal * 0.05;
  const total = subtotal + tax;
  const hasControlled = cart.some(i => i.controlled);

  function checkout() {
    notify(`Sale completed — ${money(total)} · Receipt #${10290 + Math.floor(Math.random() * 99)}`);
    setCart([]);
  }

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <PageHeader title="Point of sale" subtitle="Register 1 · Cashier: J. Okafor" />
      <div className="vr-pos">
        {/* LEFT: scan + products */}
        <div className="vr-pos-left">
          <div className="vr-scan">
            <Icon name="scan-line" size={22} style={{ color: "var(--green-600)" }} />
            <input autoFocus placeholder="Scan barcode or search to add…" value={query} onChange={e => setQuery(e.target.value)} />
            <kbd className="mono" style={{ fontSize: 11, color: "var(--fg-subtle)", border: "1px solid var(--border)", borderRadius: 4, padding: "2px 6px" }}>F2</kbd>
          </div>
          <div className="vr-prod-grid">
            {shown.map(m => (
              <button className="vr-prod" key={m.sku} onClick={() => add(m)}>
                <div className="vr-row" style={{ justifyContent: "space-between" }}>
                  <span className="pn">{m.name}</span>
                  {m.controlled && <Icon name="shield-alert" size={14} style={{ color: "var(--controlled)" }} />}
                </div>
                <div className="ps">{m.strength} · {m.form}</div>
                <div className="vr-row" style={{ justifyContent: "space-between", alignItems: "flex-end" }}>
                  <span className="pp">{money(m.price)}</span>
                  <span className="mono" style={{ fontSize: 11, color: "var(--fg-subtle)" }}>{m.onHand} left</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* RIGHT: cart */}
        <div className="vr-cart">
          <div className="vr-cart-head">
            <span className="vr-card-title">Current sale</span>
            {cart.length > 0 && <Button variant="ghost" size="sm" icon="trash-2" onClick={() => setCart([])}>Clear</Button>}
          </div>

          {cart.length === 0 ? (
            <div className="vr-cart-empty">
              <Icon name="shopping-cart" size={30} style={{ color: "var(--slate-300)" }} />
              <div>No items yet.<br />Scan or tap a product to start.</div>
            </div>
          ) : (
            <div className="vr-cart-items">
              {cart.map(i => (
                <div className="vr-cartrow" key={i.sku}>
                  <div className="grow" style={{ flex: 1 }}>
                    <div className="ci-name">{i.name} {i.strength}</div>
                    <div className="ci-sub">{money(i.price)} each</div>
                  </div>
                  <div className="vr-step">
                    <button onClick={() => setQty(i.sku, -1)}><Icon name="minus" size={14} /></button>
                    <span className="qv">{i.qty}</span>
                    <button onClick={() => setQty(i.sku, +1)}><Icon name="plus" size={14} /></button>
                  </div>
                  <div className="mono" style={{ width: 64, textAlign: "right", fontWeight: 600 }}>{money(i.price * i.qty)}</div>
                </div>
              ))}
            </div>
          )}

          <div className="vr-cart-foot">
            {hasControlled && (
              <div className="vr-row" style={{ gap: 8, background: "var(--controlled-bg)", color: "var(--controlled)", padding: "8px 11px", borderRadius: 8, fontSize: 12.5, fontWeight: 600, marginBottom: 12 }}>
                <Icon name="shield-alert" size={15} />Controlled item — record in register
              </div>
            )}
            <div className="vr-sum"><span>Subtotal</span><span className="mono">{money(subtotal)}</span></div>
            <div className="vr-sum"><span>Tax (5%)</span><span className="mono">{money(tax)}</span></div>
            <div className="vr-sum total"><span>Total</span><span className="mono">{money(total)}</span></div>
            <Button variant="primary" icon="credit-card" disabled={cart.length === 0}
              style={{ width: "100%", justifyContent: "center", marginTop: 14, padding: "12px" }}
              onClick={checkout}>
              Take payment
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
window.PointOfSale = PointOfSale;
