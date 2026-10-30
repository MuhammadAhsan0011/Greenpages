"use client";

// Client Component: it needs a live banner preview (the chosen file, shown at
// the chosen size) and a custom-size toggle. Text fields are controlled so a
// validation error from the server action doesn't wipe what was typed - only
// the file input has to be picked again, which the browser never lets us keep.

import { useActionState, useEffect, useState } from "react";
import SubmitButton from "../../components/SubmitButton";
import { AD_SIZES, AD_SIZE_OPTIONS, AD_TYPES, ALLOWED_AD_IMAGE_TYPES, MAX_AD_IMAGE_BYTES } from "@/lib/ads";

const INITIAL_STATE = { error: null };

export default function AdForm({ action, slots, ad, today }) {
  const [state, formAction] = useActionState(action, INITIAL_STATE);
  const isEdit = Boolean(ad);

  const [values, setValues] = useState({
    name: ad?.name ?? "",
    advertiser: ad?.advertiser ?? "",
    targetUrl: ad?.target_url ?? "",
    adType: ad?.ad_type ?? "affiliate",
    sizeKey: ad?.size_key ?? "leaderboard",
    customWidth: ad?.size_key === "custom" ? String(ad.width) : "",
    customHeight: ad?.size_key === "custom" ? String(ad.height) : "",
    slotKey: ad?.slot_key ?? slots[0]?.key ?? "",
    startDate: ad?.start_date ?? today,
    endDate: ad?.end_date ?? "",
    priority: String(ad?.priority ?? 5),
    status: ad?.status ?? "active",
    openInNewTab: ad ? (ad.open_in_new_tab ? "yes" : "no") : "yes",
  });
  const set = (field) => (event) => setValues((previous) => ({ ...previous, [field]: event.target.value }));

  const [previewUrl, setPreviewUrl] = useState(null);
  const [natural, setNatural] = useState(null);

  useEffect(() => () => previewUrl && URL.revokeObjectURL(previewUrl), [previewUrl]);

  function onFileChange(event) {
    const file = event.target.files?.[0];
    setNatural(null);
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    setPreviewUrl(URL.createObjectURL(file));
  }

  const slot = slots.find((option) => option.key === values.slotKey);
  const preset = AD_SIZES[values.sizeKey];
  const shownWidth = preset
    ? preset.width
    : values.sizeKey === "custom"
      ? Number.parseInt(values.customWidth, 10) || null
      : (natural?.width ?? ad?.width ?? null);
  const shownHeight = preset
    ? preset.height
    : values.sizeKey === "custom"
      ? Number.parseInt(values.customHeight, 10) || null
      : (natural?.height ?? ad?.height ?? null);
  const imageSrc = previewUrl ?? ad?.image_url ?? null;

  return (
    <form action={formAction} className="article-form-main" encType="multipart/form-data">
      {state?.error && <p className="form-error">{state.error}</p>}

      <div className="account-card">
        <h2>Advertisement Details</h2>

        <div className="form-row">
          <div className="form-field">
            <label htmlFor="ad-name">Advertisement Name *</label>
            <input id="ad-name" name="name" type="text" maxLength={120} required value={values.name} onChange={set("name")} placeholder="e.g. Samsung Galaxy - Eid sale" />
          </div>
          <div className="form-field">
            <label htmlFor="ad-advertiser">Advertiser / Brand Name *</label>
            <input id="ad-advertiser" name="advertiser" type="text" maxLength={120} required value={values.advertiser} onChange={set("advertiser")} placeholder="e.g. Daraz" />
          </div>
        </div>

        <div className="form-field">
          <label htmlFor="ad-url">Affiliate URL / Target URL *</label>
          <input id="ad-url" name="targetUrl" type="url" required value={values.targetUrl} onChange={set("targetUrl")} placeholder="https://…?aff_id=…" />
          <p className="editor-hint">Saved exactly as pasted, tracking parameters included. Visitors are sent here when they click the banner.</p>
        </div>

        <div className="form-row">
          <div className="form-field">
            <label htmlFor="ad-type">Advertisement Type *</label>
            <select id="ad-type" name="adType" value={values.adType} onChange={set("adType")}>
              {AD_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="ad-new-tab">Open Link in New Tab</label>
            <select id="ad-new-tab" name="openInNewTab" value={values.openInNewTab} onChange={set("openInNewTab")}>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>
        </div>
      </div>

      <div className="account-card">
        <h2>Banner Image &amp; Size</h2>

        <div className="form-row">
          <div className="form-field">
            <label htmlFor="ad-size">Banner Size *</label>
            <select id="ad-size" name="sizeKey" value={values.sizeKey} onChange={set("sizeKey")}>
              {AD_SIZE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="ad-slot">Placement Location *</label>
            <select id="ad-slot" name="slotKey" value={values.slotKey} onChange={set("slotKey")}>
              {slots.map((option) => (
                <option key={option.key} value={option.key}>
                  {option.label}
                  {option.enabled ? "" : " (disabled)"}
                </option>
              ))}
            </select>
          </div>
        </div>

        {values.sizeKey === "custom" && (
          <div className="form-row">
            <div className="form-field">
              <label htmlFor="ad-custom-width">Width (px) *</label>
              <input id="ad-custom-width" name="customWidth" type="number" min="20" max="2000" required value={values.customWidth} onChange={set("customWidth")} />
            </div>
            <div className="form-field">
              <label htmlFor="ad-custom-height">Height (px) *</label>
              <input id="ad-custom-height" name="customHeight" type="number" min="20" max="2000" required value={values.customHeight} onChange={set("customHeight")} />
            </div>
          </div>
        )}

        {slot && (
          <p className="editor-hint">
            {slot.description} Accepts:{" "}
            {slot.allowed_sizes?.length
              ? slot.allowed_sizes.map((key) => AD_SIZES[key]?.label ?? key).join(", ")
              : "any size"}
            .
          </p>
        )}

        <div className="form-field">
          <label htmlFor="ad-image">Banner Image {isEdit ? "(leave empty to keep the current one)" : "*"}</label>
          <input
            id="ad-image"
            name="image"
            type="file"
            accept={ALLOWED_AD_IMAGE_TYPES.join(",")}
            required={!isEdit}
            onChange={onFileChange}
          />
          <p className="editor-hint">
            JPG, JPEG, PNG or WebP, up to {MAX_AD_IMAGE_BYTES / (1024 * 1024)}MB. It must match the size you chose
            {shownWidth && shownHeight ? ` (${shownWidth} × ${shownHeight} px)` : ""} - larger images in the same
            proportions (like 2× for sharper screens) are fine.
          </p>
        </div>

        <div className="ad-form-preview">
          <p className="editor-hint">Preview{natural ? ` - uploaded image is ${natural.width} × ${natural.height} px` : ""}</p>
          {imageSrc ? (
            <div
              className="ad-form-preview-box"
              style={shownWidth && shownHeight ? { maxWidth: shownWidth, aspectRatio: `${shownWidth} / ${shownHeight}` } : undefined}
            >
              <span className="ad-slot-label">Sponsored</span>
              {/* eslint-disable-next-line @next/next/no-img-element -- blob/preview of an upload */}
              <img
                src={imageSrc}
                alt="Banner preview"
                onLoad={(event) => setNatural({ width: event.target.naturalWidth, height: event.target.naturalHeight })}
              />
            </div>
          ) : (
            <p className="editor-hint">Choose an image to see how the banner will look.</p>
          )}
        </div>
      </div>

      <div className="account-card">
        <h2>Schedule &amp; Priority</h2>

        <div className="form-row">
          <div className="form-field">
            <label htmlFor="ad-start">Start Date</label>
            <input id="ad-start" name="startDate" type="date" value={values.startDate} onChange={set("startDate")} />
          </div>
          <div className="form-field">
            <label htmlFor="ad-end">Expiry Date (optional)</label>
            <input id="ad-end" name="endDate" type="date" min={values.startDate} value={values.endDate} onChange={set("endDate")} />
          </div>
        </div>

        <div className="form-row">
          <div className="form-field">
            <label htmlFor="ad-priority">Display Priority (1 – 10)</label>
            <input id="ad-priority" name="priority" type="number" min="1" max="10" value={values.priority} onChange={set("priority")} />
            <p className="editor-hint">Higher shows first, or more often when ads rotate.</p>
          </div>
          <div className="form-field">
            <label htmlFor="ad-status">Status</label>
            <select id="ad-status" name="status" value={values.status} onChange={set("status")}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      <SubmitButton className="btn btn-primary article-submit-btn" pendingLabel={isEdit ? "Saving…" : "Publishing…"}>
        {isEdit ? "Save Changes" : "Publish Advertisement"}
      </SubmitButton>
    </form>
  );
}
