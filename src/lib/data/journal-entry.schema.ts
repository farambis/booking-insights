import { z } from "zod";

export const journalEntryLineSchema = z.object({
  company_code: z.string(),
  posting_date: z.string(),
  document_id: z.string(),
  line_id: z.number(),
  gl_account: z.string(),
  cost_center: z.string().nullable(),
  amount: z.number(),
  currency: z.string(),
  debit_credit: z.enum(["S", "H"]),
  booking_text: z.string(),
  vendor_id: z.string().nullable(),
  customer_id: z.string().nullable(),
  tax_code: z.string().nullable(),
  document_type: z.string(),
});
