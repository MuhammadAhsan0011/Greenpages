"use client";

// This MUST be a Client Component — the "apply to all days" button needs an
// onClick handler that reaches into the other days' inputs. Every input
// below keeps the same name={`hours_${day}_...`} contract the server action
// (app/account/actions.js) already parses, so this is a drop-in swap: fields
// stay uncontrolled (defaultValue/defaultChecked) and submit with the
// surrounding <form> exactly as before. Copying just sets each field's
// starting value — every day stays independently editable afterward.

import { useRef } from "react";

const DAYS = [
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" },
];

export default function BusinessHoursFields({ savedHours }) {
  const fieldRefs = useRef({});

  function setRef(day, field, el) {
    if (!fieldRefs.current[day]) fieldRefs.current[day] = {};
    fieldRefs.current[day][field] = el;
  }

  function applyMondayToAllDays() {
    const monday = fieldRefs.current.monday;
    if (!monday?.open || !monday?.close || !monday?.closed) return;

    DAYS.forEach((day) => {
      if (day.key === "monday" || day.key === "sunday") return;
      const fields = fieldRefs.current[day.key];
      if (!fields) return;
      fields.open.value = monday.open.value;
      fields.close.value = monday.close.value;
      fields.closed.checked = monday.closed.checked;
    });
  }

  return (
    <div className="hours-input-list">
      {DAYS.map((day) => {
        const saved = savedHours?.[day.key];
        return (
          <div key={day.key}>
            <div className="hours-input-row">
              <span className="hours-day-label">{day.label}</span>
              <input
                ref={(el) => setRef(day.key, "open", el)}
                type="time"
                name={`hours_${day.key}_open`}
                defaultValue={saved?.open ?? ""}
                aria-label={`${day.label} opening time`}
              />
              <span aria-hidden="true">to</span>
              <input
                ref={(el) => setRef(day.key, "close", el)}
                type="time"
                name={`hours_${day.key}_close`}
                defaultValue={saved?.close ?? ""}
                aria-label={`${day.label} closing time`}
              />
              <label className="hours-closed-checkbox">
                <input
                  ref={(el) => setRef(day.key, "closed", el)}
                  type="checkbox"
                  name={`hours_${day.key}_closed`}
                  value="yes"
                  defaultChecked={saved?.closed ?? false}
                />
                Closed
              </label>
            </div>
            {day.key === "monday" && (
              <div className="hours-copy-row">
                <button type="button" className="btn btn-secondary btn-sm" onClick={applyMondayToAllDays}>
                  Apply Monday&rsquo;s hours to all days (except Sunday)
                </button>
                <p className="editor-hint">Fills Tue–Sat with these hours — you can still edit any day after.</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
