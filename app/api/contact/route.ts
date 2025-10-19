// app/api/contact/route.ts
import { NextResponse } from "next/server";
import { Resend } from "resend";
import ContactRequestEmail from "../../../emails/ContactRequestEmail";
import { contactSchema } from "../../../lib/validation/contact";

export const runtime = "nodejs"; // Resend works great on Node runtime

const resend = new Resend(process.env.RESEND_API_KEY);

// Configure who receives admin notifications and who it's "from"
const CONTACT_TO = process.env.CONTACT_TO ?? "you@example.com";
const CONTACT_FROM = process.env.CONTACT_FROM ?? "Mwein Medical <no-reply@mweinmedical.com>";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    // Honeypot: if filled, silently accept (pretend success)
    if (typeof body?.honeypot === "string" && body.honeypot.trim().length > 0) {
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    const parsed = contactSchema.safeParse(body);
    if (!parsed.success) {
      const issues = parsed.error.format();
      return NextResponse.json({ ok: false, errors: issues }, { status: 400 });
    }

    const data = parsed.data;

    // (Optional) basic abuse guard: drop absurdly long payloads
    if (data.reason.length > 2000) {
      return NextResponse.json({ ok: false, error: "Reason too long" }, { status: 413 });
    }

    // Send email via Resend
    const { error } = await resend.emails.send({
      from: CONTACT_FROM,
      to: [CONTACT_TO],
      subject: `New appointment request: ${data.name} (${data.preferredDate} ${data.preferredTime})`,
      react: ContactRequestEmail({
        name: data.name,
        phone: data.phone,
        preferredDate: data.preferredDate,
        preferredTime: data.preferredTime,
        reason: data.reason,
      }),
      // You can also set reply_to to the clinic address if you want quick replies
      // reply_to: "mweinmedical@gmail.com",
    });

    if (error) {
      // Bubble a safe message to the client
      return NextResponse.json({ ok: false, error: "Failed to send email" }, { status: 502 });
    }

    // TODO: optionally persist to your DB (Prisma/Drizzle) here

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
