/** Join class names, dropping falsy entries. */
export const cx = (...parts) => parts.filter(Boolean).join(' ');
