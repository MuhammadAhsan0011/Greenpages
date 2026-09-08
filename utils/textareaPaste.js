// When pasting into a plain <textarea>, the browser can only insert the
// clipboard's plain-text flavor — and some sources (notably AI chat
// interfaces, where each paragraph is a separate <p> with no literal "\n"
// between them) produce plain text with paragraph breaks missing entirely,
// so pasted sentences run together with no space at all ("nationwide.Here
// are..."). The clipboard's HTML flavor still has the real paragraph
// boundaries even when the plain-text one doesn't, so this reconstructs
// proper line breaks from that instead of trusting the plain-text flavor.

function getBlockAwarePastedText(clipboardData) {
  const html = clipboardData?.getData("text/html");
  if (!html) return null;

  const withBreaks = html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6]|tr|blockquote)>/gi, "\n");

  const container = document.createElement("div");
  container.innerHTML = withBreaks;

  const raw = container.textContent || "";
  const lines = raw.split("\n").map((line) => line.trim());

  const cleaned = [];
  for (const line of lines) {
    if (line === "" && cleaned[cleaned.length - 1] === "") continue;
    cleaned.push(line);
  }
  return cleaned.join("\n").replace(/^\n+|\n+$/g, "");
}

// Attach as onPaste on any <textarea>. Falls back to the browser's own
// paste behavior whenever the clipboard has no HTML flavor to recover
// structure from (e.g. copying from Notepad), since there's nothing to fix
// in that case.
export function handleBlockAwarePaste(event) {
  const text = getBlockAwarePastedText(event.clipboardData);
  if (text === null) return;

  event.preventDefault();
  const el = event.target;
  const start = el.selectionStart;
  const end = el.selectionEnd;
  let nextValue = el.value.slice(0, start) + text + el.value.slice(end);

  if (el.maxLength >= 0 && nextValue.length > el.maxLength) {
    nextValue = nextValue.slice(0, el.maxLength);
  }

  // Setting .value directly wouldn't notify React's onChange — going
  // through the native setter + a real "input" event mirrors what an
  // actual keystroke/paste does, so controlled and uncontrolled textareas
  // both pick it up correctly.
  const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
  nativeSetter.call(el, nextValue);
  const cursorPos = Math.min(start + text.length, nextValue.length);
  el.setSelectionRange(cursorPos, cursorPos);
  el.dispatchEvent(new Event("input", { bubbles: true }));
}
