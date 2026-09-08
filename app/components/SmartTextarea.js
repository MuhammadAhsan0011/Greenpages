"use client";

// This MUST be a Client Component — it needs an onPaste handler, which a
// plain <textarea> rendered from a Server Component can't attach. A drop-in
// replacement for a native <textarea> wherever one sits inside a Server
// Component form (it still submits normally as part of the surrounding
// <form>); see utils/textareaPaste.js for why the paste handling matters.

import { handleBlockAwarePaste } from "@/utils/textareaPaste";

export default function SmartTextarea({
  id,
  name,
  rows,
  required = false,
  placeholder,
  defaultValue,
  maxLength,
  className,
}) {
  return (
    <textarea
      id={id}
      name={name}
      rows={rows}
      required={required}
      placeholder={placeholder}
      defaultValue={defaultValue}
      maxLength={maxLength}
      className={className}
      onPaste={handleBlockAwarePaste}
    />
  );
}
