// emails/ContactRequestEmail.tsx
import * as React from "react";

type Props = {
  name: string;
  phone: string;
  preferredDate: string;
  preferredTime: string;
  reason: string;
};

export default function ContactRequestEmail({
  name, phone, preferredDate, preferredTime, reason,
}: Props) {
  return (
    <div style={{ fontFamily: "Inter, Arial, sans-serif", lineHeight: 1.6 }}>
      <h2 style={{ margin: 0 }}>New Appointment Request</h2>
      <p><strong>Name:</strong> {name}</p>
      <p><strong>Phone:</strong> {phone}</p>
      <p><strong>Preferred:</strong> {preferredDate} at {preferredTime}</p>
      <p><strong>Reason:</strong></p>
      <p>{reason}</p>
      <hr />
      <small>Sent from mweinmedical.com</small>
    </div>
  );
}