"use client";
import { useActionState, useMemo, useState } from "react";
import {
  adminQuotationAction,
  technicianQuotationAction,
  type QuotationActionState,
} from "@/features/quotations/quotation.actions";
import { formatCurrency } from "@/lib/presentation";
type Item = {
  description: string;
  type: "LABOUR" | "PART" | "SERVICE" | "OTHER";
  quantity: number;
  unitPrice: number;
};
export function QuotationBuilder({
  bookingId,
  diagnosisId,
  mode,
}: {
  bookingId: string;
  diagnosisId: string;
  mode: "technician" | "admin";
}) {
  const serverAction =
    mode === "admin" ? adminQuotationAction : technicianQuotationAction;
  const [state, action, pending] = useActionState(
    serverAction.bind(null, bookingId),
    {} as QuotationActionState,
  );
  const [items, setItems] = useState<Item[]>([
      { description: "Labour", type: "LABOUR", quantity: 1, unitPrice: 0 },
    ]),
    [discount, setDiscount] = useState(0);
  const subtotal = useMemo(
      () =>
        items.reduce(
          (sum, item) =>
            sum + Math.max(0, item.quantity) * Math.max(0, item.unitPrice),
          0,
        ),
      [items],
    ),
    total = Math.max(0, subtotal - Math.max(0, discount));
  function update(index: number, key: keyof Item, value: string) {
    setItems((current) =>
      current.map((item, i) =>
        i === index
          ? {
              ...item,
              [key]:
                key === "description" || key === "type" ? value : Number(value),
            }
          : item,
      ),
    );
  }
  return (
    <form action={action} className="card">
      <h2>Prepare quotation</h2>
      <input type="hidden" name="diagnosisId" value={diagnosisId} />
      <input type="hidden" name="items" value={JSON.stringify(items)} />
      {items.map((item, index) => (
        <fieldset className="card" key={index}>
          <legend>Item {index + 1}</legend>
          <label>
            Description
            <input
              required
              value={item.description}
              onChange={(event) =>
                update(index, "description", event.target.value)
              }
            />
          </label>
          <label>
            Type
            <select
              value={item.type}
              onChange={(event) => update(index, "type", event.target.value)}
            >
              {["LABOUR", "PART", "SERVICE", "OTHER"].map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
          </label>
          <div className="grid cards">
            <label>
              Quantity
              <input
                type="number"
                min="0"
                step="1"
                value={item.quantity}
                onChange={(event) =>
                  update(index, "quantity", event.target.value)
                }
              />
            </label>
            <label>
              Unit price (₦)
              <input
                type="number"
                min="0"
                step="0.01"
                value={item.unitPrice}
                onChange={(event) =>
                  update(index, "unitPrice", event.target.value)
                }
              />
            </label>
          </div>
          {items.length > 1 && (
            <button
              className="btn secondary"
              type="button"
              onClick={() =>
                setItems((current) => current.filter((_, i) => i !== index))
              }
            >
              Remove item
            </button>
          )}
        </fieldset>
      ))}
      <button
        className="btn secondary"
        type="button"
        onClick={() =>
          setItems((current) => [
            ...current,
            { description: "", type: "PART", quantity: 1, unitPrice: 0 },
          ])
        }
      >
        Add item
      </button>
      <label>
        Discount
        <input
          name="discount"
          type="number"
          min="0"
          max={subtotal}
          step="0.01"
          value={discount}
          onChange={(event) => setDiscount(Number(event.target.value))}
        />
      </label>
      <label>
        Valid until
        <input
          name="validUntil"
          type="date"
          required
          min={new Date().toISOString().slice(0, 10)}
        />
      </label>
      <dl>
        <dt>Subtotal</dt>
        <dd>{formatCurrency(subtotal)}</dd>
        <dt>Discount</dt>
        <dd>{formatCurrency(discount)}</dd>
        <dt>Total estimate</dt>
        <dd>
          <strong>{formatCurrency(total)}</strong>
        </dd>
      </dl>
      <p className="muted">
        The server recalculates every amount and ignores displayed totals.
      </p>
      {state.error && (
        <p className="error" role="alert">
          {state.error}
        </p>
      )}
      {state.success && <p role="status">{state.success}</p>}
      <button className="btn" disabled={pending}>
        {pending ? "Sending…" : "Send quotation"}
      </button>
    </form>
  );
}
