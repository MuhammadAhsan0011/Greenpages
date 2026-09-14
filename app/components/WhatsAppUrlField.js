"use client";

// This MUST be a Client Component — auto-filling the wa.me prefix on focus
// needs an onFocus handler. Still a plain <input type="url" name="whatsappUrl">
// that submits with the surrounding <form>, no fetch/JS needed for that part.

import { useRef } from "react";

const WHATSAPP_PREFIX = "https://wa.me/";

export default function WhatsAppUrlField({ defaultValue }) {
  const inputRef = useRef(null);

  function handleFocus() {
    const input = inputRef.current;
    if (!input || input.value) return;
    input.value = WHATSAPP_PREFIX;
    const end = input.value.length;
    input.setSelectionRange(end, end);
  }

  function handleBlur() {
    const input = inputRef.current;
    if (input && input.value === WHATSAPP_PREFIX) {
      input.value = "";
    }
  }

  return (
    <input
      ref={inputRef}
      id="whatsappUrl"
      name="whatsappUrl"
      type="url"
      placeholder="https://wa.me/923XXXXXXXXX"
      defaultValue={defaultValue ?? ""}
      onFocus={handleFocus}
      onBlur={handleBlur}
    />
  );
}
