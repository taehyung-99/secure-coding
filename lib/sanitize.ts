const CONTROL_CHARACTERS_EXCEPT_TAB_AND_NEWLINE =
  /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const DANGEROUS_HTML_BRACKETS = /[<>]/g;
const BIDI_CONTROL_CHARACTERS =
  /[\u061C\u200E\u200F\u202A-\u202E\u2066-\u2069]/g;

export function sanitizeUserText(value: string) {
  return value
    .normalize("NFC")
    .replace(CONTROL_CHARACTERS_EXCEPT_TAB_AND_NEWLINE, "")
    .replace(BIDI_CONTROL_CHARACTERS, "")
    .replace(DANGEROUS_HTML_BRACKETS, "")
    .trim();
}
