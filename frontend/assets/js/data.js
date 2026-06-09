// Static UI chrome. All medication / patient / prescription data now comes from
// the API (see api.js); only the shell's navigation and branch identity live here.

export const branch = {
  name: "Riverside branch",
  shiftLead: "Jade Okafor",
  role: "Pharmacist",
};

export const navigation = [
  { id: "dashboard", label: "Dashboard", href: "dashboard.html", icon: "layout-dashboard" },
  { id: "inventory", label: "Inventory", href: "inventory.html", icon: "package" },
  { id: "pos", label: "Point of sale", href: "pos.html", icon: "shopping-cart" },
  { id: "prescriptions", label: "Prescriptions", href: "prescriptions.html", icon: "clipboard-list" },
  { id: "patients", label: "Patients", href: "patients.html", icon: "users" },
  { id: "orders", label: "Orders", href: "orders.html", icon: "truck" },
];
