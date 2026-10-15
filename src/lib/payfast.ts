/**
 * PayFast hosted checkout: the API returns { checkout_url, fields } and the browser
 * must POST those fields as a form to PayFast.
 *
 * PayFast verifies the signature against the fields IN THE ORDER THEY ARE POSTED,
 * and the API signs them in this documented order (see integrations/payfast and
 * modules/payments: `checkout`). The API currently returns the fields in a HashMap,
 * so JSON key order is not guaranteed. We therefore re-order them here.
 * Remove this re-ordering once the API returns an ordered array of pairs.
 */
export const PAYFAST_FIELD_ORDER = [
  'merchant_id',
  'merchant_key',
  'return_url',
  'cancel_url',
  'notify_url',
  'name_first',
  'name_last',
  'email_address',
  'm_payment_id',
  'amount',
  'item_name',
  'email_confirmation',
  'signature',
] as const;

export function orderPayfastFields(fields: Record<string, string>): Array<[string, string]> {
  const known = PAYFAST_FIELD_ORDER.filter((k) => k in fields).map((k) => [k, fields[k]] as [string, string]);
  const extras = Object.keys(fields)
    .filter((k) => !(PAYFAST_FIELD_ORDER as readonly string[]).includes(k))
    .map((k) => [k, fields[k]] as [string, string]);
  return [...known, ...extras];
}

/** Builds a hidden form and submits it, navigating the browser to PayFast. */
export function postToPayFast(checkoutUrl: string, fields: Record<string, string>): void {
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = checkoutUrl;
  form.style.display = 'none';

  for (const [name, value] of orderPayfastFields(fields)) {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = name;
    input.value = value;
    form.appendChild(input);
  }

  document.body.appendChild(form);
  form.submit();
}
