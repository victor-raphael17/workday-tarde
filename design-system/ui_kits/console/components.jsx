/* CA Pharmacy Console — shared primitives */
const { useState, useEffect, useRef } = React;

/* Icon — renders a Lucide glyph imperatively into a span so React never
   reconciles the swapped-in <svg> (avoids removeChild crashes). */
const _pascal = (n) => n.split("-").map(s => s.charAt(0).toUpperCase() + s.slice(1)).join("");
function Icon({ name, size = 18, className = "", style = {} }) {
  const ref = useRef(null);
  useEffect(() => {
    const L = window.lucide;
    const host = ref.current;
    if (!L || !host) return;
    const node = L[_pascal(name)] || (L.icons && L.icons[_pascal(name)]);
    host.innerHTML = "";
    if (node && L.createElement) {
      const svg = L.createElement(node);
      svg.setAttribute("width", size);
      svg.setAttribute("height", size);
      host.appendChild(svg);
    }
  }, [name, size]);
  return <span ref={ref} className={className} style={{ width: size, height: size, display: "inline-flex", flex: "none", ...style }}></span>;
}

const money = (n) => "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/* Button */
function Button({ children, variant = "primary", size = "md", icon, onClick, type = "button", disabled, style = {} }) {
  const cls = `vr-btn vr-btn-${variant} vr-btn-${size}` + (disabled ? " is-disabled" : "");
  return (
    <button type={type} className={cls} onClick={disabled ? undefined : onClick} style={style} disabled={disabled}>
      {icon && <Icon name={icon} size={size === "sm" ? 15 : 17} />}
      {children}
    </button>
  );
}

/* Status badge — the canonical stock / rx states */
const STATUS = {
  in:        { label: "In stock",     cls: "in" },
  low:       { label: "Low stock",    cls: "low" },
  out:       { label: "Out of stock", cls: "out" },
  expiring:  { label: "Expiring soon",cls: "low" },
  expired:   { label: "Expired",      cls: "out" },
  recalled:  { label: "Recalled",     cls: "recalled" },
  ordered:   { label: "On order",     cls: "ordered" },
  controlled:{ label: "Controlled",   cls: "controlled" },
};
function StatusBadge({ status, label, dot = true }) {
  const s = STATUS[status] || { label: label || status, cls: "in" };
  const solid = s.cls === "recalled";
  return (
    <span className={`vr-badge vr-badge-${s.cls}`}>
      {dot && !solid && <span className="vr-dot"></span>}
      {label || s.label}
    </span>
  );
}

/* Card shell */
function Card({ children, className = "", style = {}, pad = true }) {
  return <div className={`vr-card ${className}`} style={{ padding: pad ? 16 : 0, ...style }}>{children}</div>;
}

/* Page header bar */
function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="vr-pagehead">
      <div>
        <h1 className="vr-pagetitle">{title}</h1>
        {subtitle && <div className="vr-pagesub">{subtitle}</div>}
      </div>
      {actions && <div className="vr-pagehead-actions">{actions}</div>}
    </div>
  );
}

/* Avatar with initials */
function Avatar({ name, size = 30, tone = "slate" }) {
  const initials = name.split(" ").map(w => w[0]).slice(0, 2).join("");
  return (
    <span className={`vr-avatar vr-avatar-${tone}`} style={{ width: size, height: size, fontSize: size * 0.4 }}>
      {initials}
    </span>
  );
}

/* Toast */
function Toast({ msg, onDone }) {
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(onDone, 3200);
    return () => clearTimeout(t);
  }, [msg]);
  if (!msg) return null;
  return (
    <div className="vr-toast">
      <Icon name="check-circle-2" size={18} />
      <span>{msg}</span>
    </div>
  );
}

Object.assign(window, { Icon, money, Button, StatusBadge, STATUS, Card, PageHeader, Avatar, Toast });
