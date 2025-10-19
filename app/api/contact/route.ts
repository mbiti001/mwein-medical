// app/api/contact/route.ts
import { NextRequest } from "next/server";
import { Resend } from "resend";
import ContactRequestEmail from "../../../emails/ContactRequestEmail";
import { contactSchema } from "../../../lib/validation/contact";
import { withApiHandler, withValidation, withRateLimit } from "../../../lib/middleware/apiMiddleware";
import { apiSuccess, apiError } from "../../../lib/apiResponse";
import { logger } from "../../../lib/logger";
import { prisma } from "../../../lib/prisma";

export const runtime = "nodejs"; // Resend works great on Node runtime

const resend = new Resend(process.env.RESEND_API_KEY);

// Configure who receives admin notifications and who it's "from"
const CONTACT_TO = process.env.CONTACT_TO ?? "you@example.com";
const CONTACT_FROM = process.env.CONTACT_FROM ?? "Mwein Medical <no-reply@mweinmedical.com>";

// Rate limited: 5 requests per 5 minutes per IP
export const POST = withRateLimit(5, 5 * 60 * 1000)(
  withValidation(
    contactSchema,
    async (request: NextRequest, context, validatedData) => {
      const { requestId } = context;
      
      // Honeypot: if filled, silently accept (pretend success) 
      if (typeof validatedData.honeypot === "string" && validatedData.honeypot.trim().length > 0) {
        logger.security('Contact form honeypot triggered', {
          requestId,
          ip: request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown',
        });
        return apiSuccess({ message: "Request received" }, requestId);
      }

      // Basic abuse guard: drop absurdly long payloads
      if (validatedData.reason.length > 2000) {
        logger.warn('Contact form abuse attempt - reason too long', {
          requestId,
          reasonLength: validatedData.reason.length,
        });
        return apiError(
          'PAYLOAD_TOO_LARGE',
          'Request description is too long',
          413,
          undefined,
          requestId
        );
      }

      let appointmentId: string | null = null;

      try {
        // Parse consultation date for database storage
        const consultationDate = (() => {
          try {
            const isoString = `${validatedData.preferredDate}T${validatedData.preferredTime}`;
            const candidate = new Date(isoString);
            return Number.isNaN(candidate.getTime()) ? null : candidate;
          } catch {
            return null;
          }
        })();

        // Create appointment request in database
        const appointment = await prisma.appointmentRequest.create({
          data: {
            name: validatedData.name,
            phone: validatedData.phone,
            email: null, // Not collected in new form
            preferredDate: validatedData.preferredDate,
            preferredTime: validatedData.preferredTime,
            reason: validatedData.reason,
            patientAge: null, // Not collected in simplified form
            patientGender: null, // Not collected in simplified form
            consultationType: "IN_PERSON", // Default
            consultationDate,
            status: "NEW",
            identifier: request.headers.get('x-forwarded-for')?.split(',')[0] || null,
          }
        });
        
        appointmentId = appointment.id;
        
        logger.info('Appointment request created', {
          requestId,
          appointmentId,
          customerName: validatedData.name,
          preferredDate: validatedData.preferredDate,
        });

        // Send email notification via Resend
        const emailResult = await resend.emails.send({
          from: CONTACT_FROM,
          to: [CONTACT_TO],
          subject: `New appointment request: ${validatedData.name} (${validatedData.preferredDate} ${validatedData.preferredTime})`,
          react: ContactRequestEmail({
            name: validatedData.name,
            phone: validatedData.phone,
            preferredDate: validatedData.preferredDate,
            preferredTime: validatedData.preferredTime,
            reason: validatedData.reason,
          }),
          replyTo: "appointments@mweinmedical.co.ke",
        });

        if (emailResult.error) {
          // Log email failure but don't fail the request since DB record exists
          logger.error('Failed to send appointment notification email', {
            requestId,
            appointmentId,
            error: emailResult.error,
          });
          
          // Update appointment with delivery failure note
          await prisma.appointmentRequest.update({
            where: { id: appointmentId },
            data: {
              notes: `Email notification failed: ${emailResult.error.message || 'Unknown error'}`,
            },
          });
        } else {
          logger.email('Appointment notification sent successfully', {
            requestId,
            appointmentId,
            messageId: emailResult.data?.id,
            recipient: CONTACT_TO,
          });
        }

        return apiSuccess({
          message: "Appointment request received successfully",
          appointmentId: appointment.id,
          status: appointment.status,
        }, requestId);

      } catch (error) {
        logger.error('Failed to process appointment request', {
          requestId,
          appointmentId,
          customerName: validatedData.name,
        }, error instanceof Error ? error : new Error(String(error)));
        
        // If we created an appointment but failed later, add a note
        if (appointmentId) {
          try {
            await prisma.appointmentRequest.update({
              where: { id: appointmentId },
              data: {
                notes: `Processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
              },
            });
          } catch (updateError) {
            logger.error('Failed to update appointment with error note', {
              requestId,
              appointmentId,
            }, updateError instanceof Error ? updateError : new Error(String(updateError)));
          }
        }
        
        throw error; // Re-throw to be handled by middleware
      }
    }
  )
);
