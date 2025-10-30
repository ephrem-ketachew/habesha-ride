import { JSDOM } from 'jsdom';
import DOMPurify from 'dompurify';

const window = new JSDOM('').window as any;

const sanitizer = DOMPurify(window);

export const sanitizeInput = (dirty: string): string => {
  return sanitizer.sanitize(dirty, { ALLOWED_TAGS: [] });
};
