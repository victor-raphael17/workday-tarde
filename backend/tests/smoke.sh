#!/usr/bin/env bash
#
# End-to-end smoke test for the CA Pharmacy API.
#
# Exercises the business rules that live in the service layer against a running
# instance (default http://localhost:8080): a sale draws stock down and a void
# restores it, overselling is rejected, receiving a purchase order adds stock,
# and dispensing a prescription draws stock down.
#
# Usage:  API=http://localhost:8080 ./backend/tests/smoke.sh
set -euo pipefail

API="${API:-http://localhost:8080}"
PASS=0
FAIL=0
TOKEN=""

green() { printf '\033[32m%s\033[0m\n' "$1"; }
red()   { printf '\033[31m%s\033[0m\n' "$1"; }

assert_eq() {
  local label="$1" expected="$2" actual="$3"
  if [[ "$expected" == "$actual" ]]; then
    green "  PASS  $label (= $actual)"
    PASS=$((PASS + 1))
  else
    red   "  FAIL  $label (expected $expected, got $actual)"
    FAIL=$((FAIL + 1))
  fi
}

# GET helpers ---------------------------------------------------------------
json_get() {
  php -r '
    $data = json_decode(stream_get_contents(STDIN), true);
    foreach (explode(".", $argv[1]) as $part) {
        if ($part === "") {
            continue;
        }
        $data = is_array($data) && array_key_exists($part, $data) ? $data[$part] : null;
    }
    if (is_bool($data)) {
        echo $data ? "true" : "false";
        exit;
    }
    echo $data ?? "";
  ' "$1"
}
first_medication_id() {
  php -r '
    $payload = json_decode(stream_get_contents(STDIN), true);
    foreach (($payload["data"] ?? []) as $medication) {
        if (($medication["controlled"] ?? null) === false
            && ($medication["recalled"] ?? null) === false
            && (int) ($medication["on_hand"] ?? 0) > 10
            && ($medication["status"] ?? "") !== "expired") {
            echo $medication["id"];
            exit;
        }
    }
  '
}
sum_money() {
  php -r 'echo round(((float) $argv[1] + (float) $argv[2]) * 100) / 100;' "$1" "$2"
}
round_money() {
  php -r 'echo round(((float) $argv[1]) * 100) / 100;' "$1"
}
on_hand() { curl -s -H "Authorization: Bearer $TOKEN" "$API/api/medications/$1" | json_get 'data.on_hand'; }
status_code() {
  # status_code METHOD PATH [BODY]
  local method="$1" path="$2" body="${3:-}"
  local auth=()
  if [[ -n "$TOKEN" ]]; then
    auth=(-H "Authorization: Bearer $TOKEN")
  fi
  if [[ -n "$body" ]]; then
    curl -s -o /dev/null -w '%{http_code}' -X "$method" "${auth[@]}" "$API$path" \
      -H 'Content-Type: application/json' -d "$body"
  else
    curl -s -o /dev/null -w '%{http_code}' -X "$method" "${auth[@]}" "$API$path"
  fi
}

echo "== Health =="
assert_eq "GET /health is healthy" "healthy" "$(curl -s "$API/health" | json_get 'status')"

echo "== Authentication: login, me, logout =="
# Wrong password is rejected (401).
assert_eq "bad credentials return 401" "401" \
  "$(status_code POST /api/auth/login '{"email":"jade@capharmacy.com","password":"nope"}')"
# Rate limiting blocks the sixth failed login attempt for the same email.
RATE_LIMIT_EMAIL="rate-limit-smoke-$(date +%s)-$$@capharmacy.test"
RATE_LIMIT_BODY="{\"email\":\"$RATE_LIMIT_EMAIL\",\"password\":\"nope\"}"
for attempt in 1 2 3 4 5; do
  assert_eq "failed login attempt $attempt before rate limit returns 401" "401" \
    "$(status_code POST /api/auth/login "$RATE_LIMIT_BODY")"
done
assert_eq "sixth failed login attempt returns 429" "429" \
  "$(status_code POST /api/auth/login "$RATE_LIMIT_BODY")"
# Valid sign-in issues a bearer token.
TOKEN=$(curl -s -X POST "$API/api/auth/login" -H 'Content-Type: application/json' \
  -d '{"email":"jade@capharmacy.com","password":"password123"}' | json_get 'data.token')
assert_eq "login issues a token" "true" "$([[ -n "$TOKEN" && "$TOKEN" != "null" ]] && echo true || echo false)"
# The token identifies the current user.
assert_eq "GET /me returns the user" "jade@capharmacy.com" \
  "$(curl -s "$API/api/auth/me" -H "Authorization: Bearer $TOKEN" | json_get 'data.email')"
# A missing token is unauthorized.
assert_eq "GET /me without token is 401" "401" \
  "$(curl -s -o /dev/null -w '%{http_code}' "$API/api/auth/me")"
# Logout revokes the token.
curl -s -o /dev/null -X POST "$API/api/auth/logout" -H "Authorization: Bearer $TOKEN"
assert_eq "token is revoked after logout" "401" \
  "$(curl -s -o /dev/null -w '%{http_code}' "$API/api/auth/me" -H "Authorization: Bearer $TOKEN")"
TOKEN=$(curl -s -X POST "$API/api/auth/login" -H 'Content-Type: application/json' \
  -d '{"email":"jade@capharmacy.com","password":"password123"}' | json_get 'data.token')

# Pick a stocked, non-controlled medication from the current seed data.
MED_ID=$(curl -s -H "Authorization: Bearer $TOKEN" "$API/api/medications" \
  | first_medication_id)
echo "== Using medication id=$MED_ID =="

echo "== Sale draws stock down, void restores it =="
BEFORE=$(on_hand "$MED_ID")
SALE=$(curl -s -X POST "$API/api/sales" -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d "{\"payment_method\":\"card\",\"items\":[{\"medication_id\":$MED_ID,\"quantity\":3}]}")
SALE_ID=$(echo "$SALE" | json_get 'data.id')
AFTER=$(on_hand "$MED_ID")
assert_eq "stock decremented by 3" "$((BEFORE - 3))" "$AFTER"

SUBTOTAL=$(echo "$SALE" | json_get 'data.subtotal')
TAX=$(echo "$SALE" | json_get 'data.tax')
TOTAL=$(echo "$SALE" | json_get 'data.total')
assert_eq "total = subtotal + tax" \
  "$(sum_money "$SUBTOTAL" "$TAX")" \
  "$(round_money "$TOTAL")"

curl -s -X POST "$API/api/sales/$SALE_ID/void" -H "Authorization: Bearer $TOKEN" >/dev/null
assert_eq "void restores stock" "$BEFORE" "$(on_hand "$MED_ID")"

echo "== Overselling is rejected (422) and leaves stock untouched =="
BEFORE=$(on_hand "$MED_ID")
CODE=$(status_code POST /api/sales \
  "{\"items\":[{\"medication_id\":$MED_ID,\"quantity\":999999}]}")
assert_eq "oversell returns 422" "422" "$CODE"
assert_eq "stock unchanged after rejected sale" "$BEFORE" "$(on_hand "$MED_ID")"

echo "== Receiving a purchase order adds stock =="
SUPPLIER_ID=$(curl -s -H "Authorization: Bearer $TOKEN" "$API/api/suppliers" | json_get 'data.0.id')
BEFORE=$(on_hand "$MED_ID")
PO=$(curl -s -X POST "$API/api/purchase-orders" -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d "{\"supplier_id\":$SUPPLIER_ID,\"items\":[{\"medication_id\":$MED_ID,\"units\":25,\"unit_cost\":4.5}]}")
PO_ID=$(echo "$PO" | json_get 'data.id')
# A new PO starts in 'draft'; advance it through the lifecycle before receiving.
for state in submitted transit received; do
  curl -s -X PATCH "$API/api/purchase-orders/$PO_ID/state" \
    -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d "{\"state\":\"$state\"}" >/dev/null
done
assert_eq "receiving adds 25 units" "$((BEFORE + 25))" "$(on_hand "$MED_ID")"

echo "== Receiving the same PO twice is guarded =="
CODE=$(status_code PATCH "/api/purchase-orders/$PO_ID/state" '{"state":"received"}')
assert_eq "double-receive rejected (422)" "422" "$CODE"

echo "== Dispensing a prescription draws stock down =="
PATIENT_ID=$(curl -s -H "Authorization: Bearer $TOKEN" "$API/api/patients" | json_get 'data.0.id')
BEFORE=$(on_hand "$MED_ID")
RX=$(curl -s -X POST "$API/api/prescriptions" -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d "{\"patient_id\":$PATIENT_ID,\"medication_id\":$MED_ID,\"quantity\":4,\"unit\":\"tabs\",\"prescriber\":\"Dr. Smoke\"}")
RX_ID=$(echo "$RX" | json_get 'data.id')
for state in verifying ready dispensed; do
  curl -s -X PATCH "$API/api/prescriptions/$RX_ID/state" \
    -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d "{\"state\":\"$state\"}" >/dev/null
done
assert_eq "dispensing decrements 4 units" "$((BEFORE - 4))" "$(on_hand "$MED_ID")"

echo
echo "================ $PASS passed, $FAIL failed ================"
[[ "$FAIL" -eq 0 ]]
