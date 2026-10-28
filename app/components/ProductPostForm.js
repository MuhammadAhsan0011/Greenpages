"use client";

// This MUST be a Client Component for the same reason JobPostForm.js is:
// useActionState re-renders this form in place when createProduct returns a
// validation error, so the seller keeps everything they typed and every
// image they picked instead of the page reloading to a blank form.

import { useActionState } from "react";
import { createProduct, updateProduct } from "../products/actions";
import {
  PRODUCT_CATEGORIES,
  PRODUCT_AVAILABILITY,
  PRODUCT_CONDITIONS,
  MAX_PRODUCT_IMAGES,
  MAX_PRODUCT_IMAGE_BYTES,
  MAX_PRODUCT_DESCRIPTION_CHARS,
  PRODUCT_IMAGE_TYPES,
} from "../data/productOptions";
import { PK_CITIES } from "../data/directoryCities";
import SubmitButton from "./SubmitButton";
import PhotoDropzone from "./PhotoDropzone";
import CharCountTextarea from "./CharCountTextarea";
import WhatsAppUrlField from "./WhatsAppUrlField";

const INITIAL_STATE = { error: null };

// `product` set = edit mode: same form, prefilled, saved via updateProduct, with
// an extra Live/Sold status field. Otherwise it is the create form.
export default function ProductPostForm({ business, product }) {
  const isEdit = Boolean(product);
  const [state, formAction] = useActionState(isEdit ? updateProduct.bind(null, product.id) : createProduct, INITIAL_STATE);

  return (
    <form action={formAction} className="article-form-main" encType="multipart/form-data">
      {state?.error && <p className="form-error">{state.error}</p>}

      <div className="account-card">
        <h2>Product Details</h2>

        <div className="form-field">
          <label htmlFor="title">Product Name *</label>
          <input id="title" name="title" type="text" maxLength={150} defaultValue={product?.title ?? ""} placeholder="Enter product name" required />
        </div>

        <div className="form-row">
          <div className="form-field">
            <label htmlFor="companyName">Company / Seller *</label>
            <input
              id="companyName"
              name="companyName"
              type="text"
              maxLength={150}
              defaultValue={product?.company_name ?? business?.name ?? ""}
              placeholder="Enter company or seller name"
              required
            />
          </div>
          <div className="form-field">
            <label htmlFor="price">Price (Rs) *</label>
            <input id="price" name="price" type="number" min="0" step="1" defaultValue={product?.price ?? ""} placeholder="e.g. 1500" required />
          </div>
        </div>

        <div className="form-row">
          <div className="form-field">
            <label htmlFor="availability">Availability *</label>
            <select id="availability" name="availability" defaultValue={product?.availability ?? "in_stock"} required>
              {PRODUCT_AVAILABILITY.map((a) => (
                <option value={a.value} key={a.value}>
                  {a.label}
                </option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="condition">Condition *</label>
            <select id="condition" name="condition" defaultValue={product?.condition ?? "new"} required>
              {PRODUCT_CONDITIONS.map((c) => (
                <option value={c.value} key={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {isEdit && (
          <div className="form-field">
            <label htmlFor="status">Listing Status *</label>
            <select id="status" name="status" defaultValue={product.status === "sold" ? "sold" : "published"} required>
              <option value="published">Live — shown in the Products feed</option>
              <option value="sold">Sold — removed from the feed, page shows &ldquo;Sold&rdquo;</option>
            </select>
            <p className="editor-hint">
              Not sold, just unavailable for now? Keep it Live and set Availability to &ldquo;Out of Stock&rdquo;.
            </p>
          </div>
        )}

        <div className="form-field">
          <label htmlFor="category">Category *</label>
          <select id="category" name="category" defaultValue={product?.category ?? ""} required>
            <option value="" disabled>
              Select category
            </option>
            {PRODUCT_CATEGORIES.map((c) => (
              <option value={c.value} key={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-field">
          <label htmlFor="productLink">Product Link</label>
          <input id="productLink" name="productLink" type="url" defaultValue={product?.product_link ?? ""} placeholder="https://example.com/your-product" />
          <p className="editor-hint">Optional — a page with more details, if you have one.</p>
        </div>

        <div className="form-field">
          <label htmlFor="tags">Tags</label>
          <input id="tags" name="tags" type="text" maxLength={300} defaultValue={product?.tags ?? ""} placeholder="e.g. popular, best seller, new" />
          <p className="editor-hint">Comma-separated keywords that help buyers find this product.</p>
        </div>
      </div>

      <div className="account-card">
        <h2>Product Location</h2>
        <div className="form-row">
          <div className="form-field">
            <label htmlFor="city">City</label>
            <input
              id="city"
              name="city"
              type="text"
              list="product-city-suggestions"
              defaultValue={product?.city ?? ""}
              placeholder="e.g. Karachi, Peshawar, Multan…"
            />
            <datalist id="product-city-suggestions">
              {PK_CITIES.map((c) => (
                <option value={c.name} key={c.slug} />
              ))}
            </datalist>
          </div>
          <div className="form-field">
            <label htmlFor="address">Area / Address</label>
            <input id="address" name="address" type="text" maxLength={200} defaultValue={product?.address ?? ""} placeholder="e.g. Gulberg, DHA Phase 5" />
          </div>
        </div>
      </div>

      <div className="account-card">
        <h2>Product Description *</h2>
        <CharCountTextarea
          id="description"
          name="description"
          rows={7}
          maxLength={MAX_PRODUCT_DESCRIPTION_CHARS}
          defaultValue={product?.description ?? ""}
          required
          placeholder="Write a detailed description about your product…"
        />
      </div>

      <div className="account-card">
        <h2>Product Images *</h2>
        <PhotoDropzone
          name="images"
          existingFieldName="existingImages"
          existingPhotos={product?.image_urls ?? []}
          max={MAX_PRODUCT_IMAGES}
          maxSizeBytes={MAX_PRODUCT_IMAGE_BYTES}
          allowedTypes={PRODUCT_IMAGE_TYPES}
          minWidth={300}
          minHeight={300}
          minAspectRatio={0}
          autoCompress
          hint={`JPG, PNG or WebP — up to ${MAX_PRODUCT_IMAGES} images, 1MB each. Larger photos are shrunk automatically.`}
        />
      </div>

      <div className="account-card">
        <h2>How Buyers Reach You *</h2>
        <p className="editor-hint">Add at least one: WhatsApp, phone number, or the product link above.</p>
        <div className="form-row">
          <div className="form-field">
            <label htmlFor="whatsappUrl">WhatsApp</label>
            <WhatsAppUrlField defaultValue={product?.contact_whatsapp} />
          </div>
          <div className="form-field">
            <label htmlFor="phone">Phone</label>
            <input id="phone" name="phone" type="tel" defaultValue={product?.contact_phone ?? ""} placeholder="03XX XXXXXXX" />
          </div>
        </div>
      </div>

      <SubmitButton className="btn btn-primary article-submit-btn" pendingLabel={isEdit ? "Saving…" : "Publishing…"}>
        {isEdit ? "Save Changes" : "Submit Product"}
      </SubmitButton>
    </form>
  );
}
