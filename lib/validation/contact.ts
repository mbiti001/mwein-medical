// lib/validation/contact.ts
import { z } from "zod";

// Normalize 07.../01... to +254..., accept +2547/ +2541
export const phoneSchema = z
  .string()
  .trim()
  .transform(v => v.replace(/\s+/g, ""))
  .refine(v => /^(\+254(1|7)\d{8}|0(1|7)\d{8})$/.test(v), "Valid Kenyan phone required")
  .transform(v => (v.startsWith("+254") ? v : `+254${v.slice(1)}`));

/** Nairobi is UTC+3; for a date-only string we just compare yyyy-mm-dd */
const isTodayOrFuture = (d: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return false;
  const today = new Date();
  // normalize to yyyy-mm-dd (local server time is fine for date-only comparison)
  const todayStr = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    .toISOString()
    .slice(0, 10);
  return d >= todayStr;
};

export const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: phoneSchema,
  preferredDate: z.string().refine(isTodayOrFuture, "Pick today or a future date"),
  preferredTime: z.string().min(1, "Pick a time"),
  reason: z.string().min(10, "Please describe your needs"),
  honeypot: z.string().optional(),
});

export type ContactFormData = z.infer<typeof contactSchema>;