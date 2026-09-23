"use client";

// This MUST be a Client Component — useActionState needs to run in the
// browser to re-render the form in place on a validation error instead of
// navigating to a fresh page. That's the whole point: createJob used to
// redirect() back to /jobs/post-job with an ?error= param on failure,
// which is a real GET request that tears down the entire form and wipes
// out every field the user had typed (Next.js issue reported directly by
// a user testing this — see the RLS error screenshot this replaces).
// useActionState instead re-renders this same component with the new
// state, so the DOM (and every uncontrolled input in it, including the
// RichTextEditor's internal state and any already-selected file) survives
// untouched — only the error message and the pending state change.

import { useActionState } from "react";
import { createJob, uploadJobDescriptionImage } from "../jobs/actions";
import { EMPLOYMENT_TYPES, WORK_MODES, EXPERIENCE_LEVELS } from "../data/jobOptions";
import { PK_CITIES } from "../data/directoryCities";
import SubmitButton from "./SubmitButton";
import ImageUploadField from "./ImageUploadField";
import SmartTextarea from "./SmartTextarea";
import RichTextEditor from "./RichTextEditorClientOnly";
import JobCategoryFields from "./JobCategoryFields";
import WhatsAppUrlField from "./WhatsAppUrlField";

const INITIAL_STATE = { error: null };

export default function JobPostForm({ categoryTree, business }) {
  const [state, formAction] = useActionState(createJob, INITIAL_STATE);

  return (
    <div className="article-form-layout">
      <form action={formAction} className="article-form-main" encType="multipart/form-data">
        {state?.error && <p className="form-error">{state.error}</p>}

        <div className="account-card">
          <h2>1. Job Information</h2>

          <div className="form-field">
            <label htmlFor="title">Job Title *</label>
            <input id="title" name="title" type="text" placeholder="e.g. Senior Frontend Developer" required />
          </div>

          <div className="form-field">
            <label htmlFor="companyName">Company / Organization *</label>
            <input
              id="companyName"
              name="companyName"
              type="text"
              defaultValue={business?.name ?? ""}
              required
            />
          </div>

          {business && (
            <label className="job-filter-checkbox">
              <input type="checkbox" name="linkBusiness" value="yes" defaultChecked />
              Link this job to my Green Pages business profile ({business.name})
            </label>
          )}

          <JobCategoryFields categoryTree={categoryTree} />

          <div className="form-row">
            <div className="form-field">
              <label htmlFor="employmentType">Employment Type *</label>
              <select id="employmentType" name="employmentType" defaultValue="" required>
                <option value="" disabled>
                  Select type
                </option>
                {EMPLOYMENT_TYPES.map((t) => (
                  <option value={t.value} key={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label htmlFor="workMode">Work Mode *</label>
              <select id="workMode" name="workMode" defaultValue="" required>
                <option value="" disabled>
                  Select mode
                </option>
                {WORK_MODES.map((m) => (
                  <option value={m.value} key={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-field">
              <label htmlFor="experienceLevel">Experience Level *</label>
              <select id="experienceLevel" name="experienceLevel" defaultValue="" required>
                <option value="" disabled>
                  Select level
                </option>
                {EXPERIENCE_LEVELS.map((e) => (
                  <option value={e.value} key={e.value}>
                    {e.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label htmlFor="education">Education</label>
              <input id="education" name="education" type="text" placeholder="e.g. Bachelor's in Computer Science" />
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="description">Job Description *</label>
            <RichTextEditor name="description" uploadAction={uploadJobDescriptionImage} />
          </div>

          <div className="form-field">
            <label htmlFor="responsibilities">Responsibilities</label>
            <SmartTextarea id="responsibilities" name="responsibilities" rows={4} placeholder="Key day-to-day responsibilities, one per line." />
          </div>

          <div className="form-field">
            <label htmlFor="requirements">Requirements</label>
            <SmartTextarea id="requirements" name="requirements" rows={4} placeholder="Must-have qualifications and experience." />
          </div>

          <div className="form-field">
            <label htmlFor="skills">Skills</label>
            <input id="skills" name="skills" type="text" placeholder="e.g. React, Node.js, SQL (comma-separated)" />
          </div>

          <div className="form-field">
            <span className="form-field-label-standalone">Company Logo</span>
            <div className="image-upload-box">
              <span className="image-upload-icon" aria-hidden="true">
                🖼️
              </span>
              <ImageUploadField name="companyLogo" label="Click to upload logo" hint="JPG, PNG (Max 5MB)" />
            </div>
          </div>
        </div>

        <div className="account-card">
          <h2>2. Location</h2>

          <div className="form-row">
            <div className="form-field">
              <label htmlFor="city">City</label>
              <input
                id="city"
                name="city"
                type="text"
                list="pk-cities-suggestions"
                placeholder="e.g. Karachi, Peshawar, Multan… (leave blank if fully remote)"
              />
              {/* Free text, not limited to this list — the datalist
                  is just an autocomplete convenience so a job can
                  still be listed from any Pakistani city. */}
              <datalist id="pk-cities-suggestions">
                {PK_CITIES.map((c) => (
                  <option value={c.name} key={c.slug} />
                ))}
              </datalist>
            </div>
            <div className="form-field">
              <label htmlFor="area">Area / Neighborhood</label>
              <input id="area" name="area" type="text" placeholder="e.g. Gulberg, DHA Phase 5" />
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="address">Address</label>
            <input id="address" name="address" type="text" placeholder="Office address (optional)" />
          </div>
        </div>

        <div className="account-card salary-visibility-group">
          <h2>3. Compensation &amp; Deadline</h2>

          <div className="form-field">
            <span className="form-field-label-standalone">Salary</span>
            <div className="salary-visibility-options">
              <label>
                <input type="radio" name="salaryVisibility" value="range" defaultChecked />
                Show a salary range
              </label>
              <label>
                <input type="radio" name="salaryVisibility" value="negotiable" />
                Negotiable
              </label>
            </div>
          </div>

          <div className="form-row salary-range-fields">
            <div className="form-field">
              <label htmlFor="salaryMin">Minimum Salary (PKR)</label>
              <input id="salaryMin" name="salaryMin" type="number" min="0" placeholder="e.g. 60000" />
            </div>
            <div className="form-field">
              <label htmlFor="salaryMax">Maximum Salary (PKR)</label>
              <input id="salaryMax" name="salaryMax" type="number" min="0" placeholder="e.g. 100000" />
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="applicationDeadline">Application Deadline</label>
            <input id="applicationDeadline" name="applicationDeadline" type="date" />
          </div>
        </div>

        <div className="account-card">
          <h2>4. How Candidates Apply</h2>
          <p className="editor-hint">Choose at least one way for candidates to reach you.</p>

          <label className="job-filter-checkbox">
            <input type="checkbox" name="applyOnGreenpages" value="yes" defaultChecked />
            Accept applications through Green Pages (internal form + inbox)
          </label>

          <div className="form-field">
            <label htmlFor="whatsappUrl">WhatsApp</label>
            <WhatsAppUrlField />
          </div>

          <div className="form-row">
            <div className="form-field">
              <label htmlFor="applyEmail">Application Email</label>
              <input id="applyEmail" name="applyEmail" type="email" placeholder="jobs@yourcompany.com" />
            </div>
            <div className="form-field">
              <label htmlFor="applyWebsiteUrl">Application Website URL</label>
              <input id="applyWebsiteUrl" name="applyWebsiteUrl" type="url" placeholder="https://yourcompany.com/careers" />
            </div>
          </div>
        </div>

        <SubmitButton className="btn btn-primary article-submit-btn" pendingLabel="Publishing…">
          Publish Job
        </SubmitButton>
      </form>

      <aside className="article-form-sidebar">
        <div className="wizard-sidebar-card">
          <h3>
            <span aria-hidden="true">📋</span> Posting Guidelines
          </h3>
          <p>
            Your job goes live immediately — no waiting on approval. Our
            admin team can still remove a listing that breaks these
            guidelines.
          </p>
        </div>

        <div className="wizard-sidebar-card">
          <h3>
            <span aria-hidden="true">💡</span> Quick Tips
          </h3>
          <ul className="wizard-tip-list">
            <li>Use a clear, specific job title</li>
            <li>List concrete responsibilities and requirements</li>
            <li>Add a realistic salary range where possible</li>
            <li>Choose the most accurate category and subcategory</li>
            <li>Give candidates at least one way to apply</li>
          </ul>
        </div>

        <div className="wizard-sidebar-card">
          <h3>
            <span aria-hidden="true">🚫</span> What We Don&apos;t Accept
          </h3>
          <ul className="wizard-tip-list">
            <li>Pyramid schemes or pay-to-work offers</li>
            <li>Vague &ldquo;work from home, earn thousands&rdquo; listings</li>
            <li>Discriminatory requirements</li>
            <li>Illegal products or services</li>
            <li>Duplicate postings for the same role</li>
          </ul>
        </div>
      </aside>
    </div>
  );
}
