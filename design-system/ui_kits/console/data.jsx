/* CA Pharmacy — sample data for the Console UI kit (fake, for demo) */
window.CADATA = (function () {
  const meds = [
    { sku: "CA-AMX-500", name: "Amoxicillin", strength: "500 mg", form: "Capsule", cat: "Antibiotics", onHand: 24, reorder: 10, price: 12.40, expiry: "12 Aug 2026", controlled: false },
    { sku: "CA-IBU-200", name: "Ibuprofen", strength: "200 mg", form: "Tablet", cat: "Analgesics", onHand: 8, reorder: 20, price: 5.10, expiry: "03 Mar 2027", controlled: false },
    { sku: "CA-MET-850", name: "Metformin", strength: "850 mg", form: "Tablet", cat: "Diabetes", onHand: 61, reorder: 25, price: 9.75, expiry: "21 Nov 2026", controlled: false },
    { sku: "CA-OXY-05", name: "Oxycodone", strength: "5 mg", form: "Tablet", cat: "Opioids", onHand: 14, reorder: 10, price: 28.90, expiry: "09 Jun 2026", controlled: true },
    { sku: "CA-LIS-10", name: "Lisinopril", strength: "10 mg", form: "Tablet", cat: "Cardiovascular", onHand: 0, reorder: 15, price: 7.30, expiry: "30 Jan 2027", controlled: false },
    { sku: "CA-SAL-100", name: "Salbutamol", strength: "100 mcg", form: "Inhaler", cat: "Respiratory", onHand: 5, reorder: 12, price: 14.20, expiry: "18 Jul 2026", controlled: false },
    { sku: "CA-ATO-20", name: "Atorvastatin", strength: "20 mg", form: "Tablet", cat: "Cardiovascular", onHand: 88, reorder: 30, price: 11.05, expiry: "14 Sep 2027", controlled: false },
    { sku: "CA-DIA-05", name: "Diazepam", strength: "5 mg", form: "Tablet", cat: "Anxiolytics", onHand: 9, reorder: 8, price: 19.60, expiry: "02 May 2026", controlled: true },
    { sku: "CA-PAR-500", name: "Paracetamol", strength: "500 mg", form: "Tablet", cat: "Analgesics", onHand: 142, reorder: 40, price: 3.80, expiry: "27 Dec 2027", controlled: false },
    { sku: "CA-OME-20", name: "Omeprazole", strength: "20 mg", form: "Capsule", cat: "Gastro", onHand: 33, reorder: 20, price: 8.45, expiry: "05 Apr 2026", controlled: false },
    { sku: "CA-CET-10", name: "Cetirizine", strength: "10 mg", form: "Tablet", cat: "Antihistamine", onHand: 56, reorder: 25, price: 4.60, expiry: "11 Oct 2027", controlled: false },
    { sku: "CA-AML-5", name: "Amlodipine", strength: "5 mg", form: "Tablet", cat: "Cardiovascular", onHand: 18, reorder: 20, price: 6.90, expiry: "22 Feb 2026", controlled: false },
  ];

  // derive status from stock + expiry
  function statusOf(m) {
    if (m.recalled) return "recalled";
    if (m.onHand === 0) return "out";
    // expiring soon if before Sep 2026 (demo)
    const soon = ["May 2026", "Jun 2026", "Jul 2026", "Apr 2026", "Feb 2026", "Mar 2026"];
    const exp = soon.some(s => m.expiry.includes(s));
    if (m.onHand <= m.reorder) return "low";
    if (exp) return "expiring";
    return "in";
  }
  meds.forEach(m => { m.status = statusOf(m); });

  const prescriptions = [
    { id: "RX-10293", patient: "Amara Okafor", med: "Amoxicillin 500 mg", qty: "21 caps", prescriber: "Dr. L. Hahn", state: "new", flag: null, time: "2 min ago" },
    { id: "RX-10294", patient: "James Whitlock", med: "Oxycodone 5 mg", qty: "14 tabs", prescriber: "Dr. P. Adeyemi", state: "verifying", flag: "controlled", time: "9 min ago" },
    { id: "RX-10295", patient: "Sofia Marchetti", med: "Lisinopril 10 mg", qty: "30 tabs", prescriber: "Dr. R. Singh", state: "verifying", flag: "interaction", time: "14 min ago" },
    { id: "RX-10296", patient: "Daniel Kim", med: "Salbutamol 100 mcg", qty: "1 inhaler", prescriber: "Dr. L. Hahn", state: "ready", flag: null, time: "26 min ago" },
    { id: "RX-10297", patient: "Grace Mensah", med: "Metformin 850 mg", qty: "56 tabs", prescriber: "Dr. R. Singh", state: "ready", flag: null, time: "41 min ago" },
    { id: "RX-10298", patient: "Tomás Rivera", med: "Diazepam 5 mg", qty: "10 tabs", prescriber: "Dr. P. Adeyemi", state: "dispensed", flag: "controlled", time: "1 hr ago" },
  ];

  const salesWeek = [
    { d: "Mon", v: 2840 }, { d: "Tue", v: 3120 }, { d: "Wed", v: 2610 },
    { d: "Thu", v: 3480 }, { d: "Fri", v: 4020 }, { d: "Sat", v: 3760 }, { d: "Sun", v: 1980 },
  ];

  const patients = [
    { id: "PT-4821", name: "Amara Okafor", dob: "14 Mar 1989", phone: "(555) 0142", plan: "MedAid Plus", active: 2, lastVisit: "5 Jun 2026", allergies: ["Penicillin"], meds: ["Metformin 850 mg", "Atorvastatin 20 mg"] },
    { id: "PT-4822", name: "James Whitlock", dob: "02 Sep 1972", phone: "(555) 0188", plan: "StateCare", active: 1, lastVisit: "5 Jun 2026", allergies: [], meds: ["Oxycodone 5 mg"] },
    { id: "PT-4823", name: "Sofia Marchetti", dob: "27 Jan 1995", phone: "(555) 0211", plan: "MedAid Plus", active: 1, lastVisit: "5 Jun 2026", allergies: ["Sulfa drugs", "Aspirin"], meds: ["Lisinopril 10 mg"] },
    { id: "PT-4824", name: "Daniel Kim", dob: "19 Nov 1980", phone: "(555) 0267", plan: "Self-pay", active: 1, lastVisit: "5 Jun 2026", allergies: [], meds: ["Salbutamol 100 mcg"] },
    { id: "PT-4825", name: "Grace Mensah", dob: "08 Jul 1968", phone: "(555) 0319", plan: "StateCare", active: 3, lastVisit: "4 Jun 2026", allergies: ["Codeine"], meds: ["Metformin 850 mg", "Amlodipine 5 mg", "Omeprazole 20 mg"] },
    { id: "PT-4826", name: "Tomás Rivera", dob: "30 Apr 1991", phone: "(555) 0344", plan: "MedAid Plus", active: 0, lastVisit: "3 Jun 2026", allergies: [], meds: ["Diazepam 5 mg"] },
    { id: "PT-4827", name: "Priya Nair", dob: "11 Dec 1985", phone: "(555) 0390", plan: "Self-pay", active: 2, lastVisit: "2 Jun 2026", allergies: ["Latex"], meds: ["Cetirizine 10 mg", "Paracetamol 500 mg"] },
    { id: "PT-4828", name: "Wei Chen", dob: "23 Feb 1958", phone: "(555) 0421", plan: "StateCare", active: 4, lastVisit: "1 Jun 2026", allergies: ["Penicillin", "NSAIDs"], meds: ["Atorvastatin 20 mg", "Amlodipine 5 mg", "Metformin 850 mg", "Omeprazole 20 mg"] },
  ];

  const orders = [
    { id: "PO-2061", supplier: "MedSource Distribution", items: 6, units: 320, total: 4180.50, expected: "07 Jun 2026", state: "transit" },
    { id: "PO-2060", supplier: "Caldwell Wholesale", items: 3, units: 90, total: 1245.00, expected: "06 Jun 2026", state: "submitted" },
    { id: "PO-2059", supplier: "MedSource Distribution", items: 9, units: 540, total: 7320.75, expected: "05 Jun 2026", state: "received" },
    { id: "PO-2058", supplier: "Apex Pharma Supply", items: 2, units: 48, total: 612.40, expected: "04 Jun 2026", state: "received" },
    { id: "PO-2057", supplier: "Caldwell Wholesale", items: 4, units: 160, total: 2090.00, expected: "—", state: "draft" },
  ];

  // reorder suggestions = items at/under reorder point
  const reorderSuggestions = meds.filter(m => m.onHand <= m.reorder);

  return { meds, prescriptions, salesWeek, patients, orders, reorderSuggestions };
})();
