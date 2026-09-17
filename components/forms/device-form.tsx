"use client";
import { useActionState, useRef, useState } from "react";
import { DEVICE_TYPES } from "@/lib/constants";
import {
  createDeviceAction,
  updateDeviceAction,
  type DeviceActionState,
} from "@/features/devices/device.actions";
import Link from "next/link";
import { humanize } from "@/lib/presentation";

type Defaults = {
  id: string;
  type: string;
  brand: string;
  model: string;
  serialNumber?: string;
  operatingSystem?: string;
  processor?: string;
  ram?: string;
  storage?: string;
  colour?: string;
  notes?: string;
};

export function DeviceForm({ device }: { device?: Defaults }) {
  const action = device
    ? updateDeviceAction.bind(null, device.id)
    : createDeviceAction;
  const [state, formAction, pending] = useActionState(
    action,
    {} as DeviceActionState,
  );
  const [step, setStep] = useState(0),
    formRef = useRef<HTMLFormElement>(null),
    steps = ["Device identity", "Specifications", "Notes & save"];
  function next() {
    const fields = formRef.current?.querySelectorAll<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >(
      `[data-step="${step}"] input,[data-step="${step}"] select,[data-step="${step}"] textarea`,
    );
    for (const field of fields || []) if (!field.reportValidity()) return;
    setStep((current) => Math.min(current + 1, steps.length - 1));
  }
  return (
    <form ref={formRef} action={formAction} className="device-form panel">
      <header className="device-form-header">
        <span className="device-form-icon" aria-hidden="true">
          ▱
        </span>
        <div>
          <h2>{device ? "Update device details" : "Device information"}</h2>
          <p>
            Complete the three short steps to {device ? "update" : "register"}{" "}
            this device.{" "}
            <span className="required-key">
              <b aria-hidden="true">*</b> Required fields
            </span>
          </p>
        </div>
        <span className="device-step-count">
          Step {step + 1} of {steps.length}
        </span>
      </header>
      <nav className="device-form-progress" aria-label="Device form progress">
        <ol>
          {steps.map((label, index) => (
            <li
              key={label}
              className={
                index === step ? "current" : index < step ? "done" : ""
              }
              aria-current={index === step ? "step" : undefined}
            >
              <span aria-hidden="true">{index < step ? "✓" : index + 1}</span>
              <strong>{label}</strong>
            </li>
          ))}
        </ol>
        <div>
          <span style={{ width: `${((step + 1) / steps.length) * 100}%` }} />
        </div>
      </nav>
      <fieldset data-step="0" hidden={step !== 0}>
        <legend>Basic information</legend>
        <p>
          Start with the information printed on the device or its packaging.
        </p>
        <div className="device-form-grid">
          <label>
            Device type{" "}
            <span className="required-marker" aria-hidden="true">
              *
            </span>
            <span className="sr-only"> required</span>
            <select name="type" required defaultValue={device?.type}>
              {DEVICE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {humanize(type)}
                </option>
              ))}
            </select>
          </label>
          <label>
            Brand{" "}
            <span className="required-marker" aria-hidden="true">
              *
            </span>
            <span className="sr-only"> required</span>
            <input
              name="brand"
              required
              minLength={2}
              maxLength={80}
              defaultValue={device?.brand}
              placeholder="For example, Dell"
              autoComplete="organization"
            />
          </label>
          <label>
            Model{" "}
            <span className="required-marker" aria-hidden="true">
              *
            </span>
            <span className="sr-only"> required</span>
            <input
              name="model"
              required
              maxLength={100}
              defaultValue={device?.model}
              placeholder="For example, Latitude 5420"
            />
          </label>
          <label>
            Serial number <small>Must be unique when supplied</small>
            <input
              name="serialNumber"
              maxLength={100}
              defaultValue={device?.serialNumber}
              placeholder="Found on the device label"
            />
          </label>
          <label>
            Colour
            <input
              name="colour"
              maxLength={40}
              defaultValue={device?.colour}
              placeholder="For example, silver"
            />
          </label>
        </div>
      </fieldset>
      <fieldset data-step="1" hidden={step !== 1}>
        <legend>Technical specifications</legend>
        <p>
          Add what you know. You can leave any specification you are unsure
          about blank.
        </p>
        <div className="device-form-grid">
          <label>
            Operating system
            <input
              name="operatingSystem"
              maxLength={100}
              defaultValue={device?.operatingSystem}
              placeholder="For example, Windows 11"
            />
          </label>
          <label>
            Processor
            <input
              name="processor"
              maxLength={100}
              defaultValue={device?.processor}
              placeholder="For example, Intel Core i5"
            />
          </label>
          <label>
            RAM
            <input
              name="ram"
              maxLength={40}
              defaultValue={device?.ram}
              placeholder="For example, 16 GB"
            />
          </label>
          <label>
            Storage
            <input
              name="storage"
              maxLength={40}
              defaultValue={device?.storage}
              placeholder="For example, 512 GB SSD"
            />
          </label>
        </div>
        <div className="step-tip">
          <strong>Why add specifications?</strong>
          <span>
            They help technicians prepare suitable tools and replacement parts
            before diagnosis.
          </span>
        </div>
      </fieldset>
      <fieldset data-step="2" hidden={step !== 2}>
        <legend>Additional notes</legend>
        <p>
          Add any final identifying information, then save the device to your
          account.
        </p>
        <label>
          Device notes <small>Maximum 1,000 characters</small>
          <textarea
            name="notes"
            maxLength={1000}
            rows={6}
            defaultValue={device?.notes}
            placeholder="Accessories included, visible damage, or anything the repair team should know."
          />
        </label>
        <div className="device-ready">
          <span aria-hidden="true">✓</span>
          <div>
            <strong>Ready to {device ? "update" : "add"} this device</strong>
            <p>
              You can edit these details later and use the device for multiple
              repair bookings.
            </p>
          </div>
        </div>
      </fieldset>
      {state.error && (
        <p className="form-message error" role="alert">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="form-message success" role="status">
          {state.success}
        </p>
      )}
      <footer className="device-form-actions">
        <div>
          {step === 0 ? (
            <Link
              className="btn secondary"
              href={
                device
                  ? `/dashboard/devices/${device.id}`
                  : "/dashboard/devices"
              }
            >
              Cancel
            </Link>
          ) : (
            <button
              type="button"
              className="btn secondary"
              onClick={() => setStep((current) => current - 1)}
            >
              ← Back
            </button>
          )}
        </div>
        {step < steps.length - 1 ? (
          <button
            key="device-next"
            type="button"
            className="btn"
            onClick={next}
          >
            Next →
          </button>
        ) : (
          <button
            key="device-submit"
            type="submit"
            className="btn"
            disabled={pending}
          >
            {pending
              ? "Saving device…"
              : device
                ? "Save changes"
                : "Save device"}
          </button>
        )}
      </footer>
    </form>
  );
}
