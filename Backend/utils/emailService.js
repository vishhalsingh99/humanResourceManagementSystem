import '../config/env.js';
import nodemailer from 'nodemailer';

const smtpHost = process.env.SMTP_HOST;
const smtpPort = Number(process.env.SMTP_PORT || 587);
const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER;
const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_PASS;
const smtpFrom = process.env.SMTP_FROM || `HRMS Support <${smtpUser}>`;
const isEmailConfigured = Boolean(smtpHost && smtpUser && smtpPass);

if (!isEmailConfigured) {
  console.warn('SMTP email is not fully configured. OTP codes will be logged to the console for local testing.');
}

const transporter = isEmailConfigured
  ? nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  })
  : null;

if (transporter) {
  transporter.verify((error) => {
    if (error) {
      console.error('Email transporter verification failed:', error.message);
    } else {
      console.log('Email transporter is ready to send messages');
    }
  });
}

const escapeHtml = (value = '') => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
};

const detailTable = (rows = []) => `
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:20px 0;border-collapse:collapse;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
    ${rows.map(([label, value]) => `
      <tr>
        <td style="width:38%;padding:12px 14px;background:#f8fafc;border-bottom:1px solid #e2e8f0;color:#475569;font-size:13px;font-weight:700;">${escapeHtml(label)}</td>
        <td style="padding:12px 14px;border-bottom:1px solid #e2e8f0;color:#0f172a;font-size:13px;">${escapeHtml(value)}</td>
      </tr>
    `).join('')}
  </table>
`;

const notificationShell = ({ title, preheader, body, accentColor = '#2563eb' }) => `
  <div style="margin:0;padding:0;background:#f3f6fb;font-family:Arial,Helvetica,sans-serif;color:#172033;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(preheader)}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f6fb;padding:28px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#ffffff;border:1px solid #dbe4f0;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="background:#0f172a;padding:24px 28px;">
                <div style="font-size:13px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#93c5fd;">HRMS</div>
                <h1 style="margin:10px 0 0;font-size:24px;line-height:1.25;color:#ffffff;">${escapeHtml(title)}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;">
                <div style="border-left:4px solid ${accentColor};padding-left:18px;">
                  ${body}
                </div>
              </td>
            </tr>
            <tr>
              <td style="border-top:1px solid #e5edf6;padding:18px 28px;background:#f8fafc;color:#64748b;font-size:12px;line-height:1.6;">
                This is an automated HRMS notification. Please do not reply to this email.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>
`;

// Centralized sender used by reusable notification emails.
const sendEmail = async ({ to, subject, html, text }) => {
  try {
    if (!to || !subject || !html) {
      return { success: false, message: 'Email recipient, subject and HTML body are required' };
    }

    if (!transporter) {
      console.warn(`SMTP email is not configured. Skipping email "${subject}" to ${to}.`);
      return { success: false, message: 'SMTP email is not configured' };
    }

    await transporter.sendMail({
      from: smtpFrom,
      to,
      subject,
      html,
      text,
    });

    return { success: true, message: 'Email sent successfully' };
  } catch (error) {
    console.error('Email notification sending error:', {
      to,
      subject,
      message: error.message,
    });
    return { success: false, message: 'Email could not be sent' };
  }
};

// Employee lifecycle notifications.
const sendWelcomeEmployeeEmail = async ({
  email,
  employeeName,
  companyName,
  loginId,
  temporaryPassword,
}) => {
  const html = notificationShell({
    title: 'Welcome to HRMS',
    preheader: 'Your employee account has been created.',
    body: `
      <p style="margin:0 0 14px;color:#334155;font-size:15px;line-height:1.7;">Hello ${escapeHtml(employeeName || 'Employee')},</p>
      <p style="margin:0;color:#334155;font-size:15px;line-height:1.7;">
        Welcome to ${escapeHtml(companyName || 'your organization')}. Your HRMS employee account is ready to use.
      </p>
      ${detailTable([
      ['Employee Name', employeeName || '-'],
      ['Company Name', companyName || '-'],
      ['Username / Login ID', loginId || email || '-'],
      ['Temporary Password', temporaryPassword || '-'],
    ])}
      <p style="margin:0;color:#334155;font-size:15px;line-height:1.7;">
        For your security, please change this temporary password immediately after your first login.
      </p>
    `,
  });

  return sendEmail({ to: email, subject: `Welcome to ${companyName || 'HRMS'}`, html });
};

const sendPasswordResetEmail = async ({
  email,
  employeeName,
  temporaryPassword,
}) => {
  const html = notificationShell({
    title: 'Employee Password Reset',
    preheader: 'Your HRMS password has been reset.',
    body: `
      <p style="margin:0 0 14px;color:#334155;font-size:15px;line-height:1.7;">Hello ${escapeHtml(employeeName || 'Employee')},</p>
      <p style="margin:0;color:#334155;font-size:15px;line-height:1.7;">HR/Admin has reset your HRMS login password.</p>
      ${detailTable([
      ['Employee Name', employeeName || '-'],
      ['Temporary Password', temporaryPassword || '-'],
    ])}
      <p style="margin:0;color:#334155;font-size:15px;line-height:1.7;">
        Please sign in with this temporary password and change it right away from your Profile Security section.
      </p>
    `,
    accentColor: '#7c3aed',
  });

  return sendEmail({ to: email, subject: 'Your HRMS password has been reset', html });
};

// Leave workflow notifications.
const sendLeaveApprovedEmail = async ({
  email,
  employeeName,
  leaveType,
  fromDate,
  toDate,
  totalDays,
}) => {
  const html = notificationShell({
    title: 'Leave Request Approved',
    preheader: 'Your leave request has been approved.',
    body: `
      <p style="margin:0 0 14px;color:#334155;font-size:15px;line-height:1.7;">Hello ${escapeHtml(employeeName || 'Employee')},</p>
      <p style="margin:0;color:#334155;font-size:15px;line-height:1.7;">Your leave request has been approved.</p>
      ${detailTable([
      ['Employee Name', employeeName || '-'],
      ['Leave Type', leaveType || '-'],
      ['From Date', formatDate(fromDate)],
      ['To Date', formatDate(toDate)],
      ['Total Days', totalDays || '-'],
    ])}
      <p style="margin:0;color:#334155;font-size:15px;line-height:1.7;">We wish you a restful and well-planned time away.</p>
    `,
    accentColor: '#059669',
  });

  return sendEmail({ to: email, subject: 'Your leave request has been approved', html });
};

const sendLeaveRejectedEmail = async ({
  email,
  employeeName,
  leaveType,
  fromDate,
  toDate,
  rejectionReason,
}) => {
  const html = notificationShell({
    title: 'Leave Request Rejected',
    preheader: 'Your leave request has been rejected.',
    body: `
      <p style="margin:0 0 14px;color:#334155;font-size:15px;line-height:1.7;">Hello ${escapeHtml(employeeName || 'Employee')},</p>
      <p style="margin:0;color:#334155;font-size:15px;line-height:1.7;">Your leave request was not approved.</p>
      ${detailTable([
      ['Employee Name', employeeName || '-'],
      ['Leave Type', leaveType || '-'],
      ['From Date', formatDate(fromDate)],
      ['To Date', formatDate(toDate)],
      ['Rejection Reason', rejectionReason || 'Not specified'],
    ])}
      <p style="margin:0;color:#334155;font-size:15px;line-height:1.7;">Please contact HR if you need more details.</p>
    `,
    accentColor: '#dc2626',
  });

  return sendEmail({ to: email, subject: 'Your leave request has been rejected', html });
};

// Get email template based on verification type
const getEmailTemplate = (otp, verificationType) => {
  const templates = {
    password_reset: {
      subject: 'Signup OTP - HRMS',
      title: 'Signup Request',
      message: 'You have requested to signup for your HRMS account.'
    },
    employee_email: {
      subject: 'Employee Email Verification - HRMS',
      title: 'Email Verification Required',
      message: 'Please verify your email address to complete your employee account setup.'
    },
    company_email: {
      subject: 'Company Email Verification - HRMS',
      title: 'Company Email Verification',
      message: 'Please verify your company email address to complete the onboarding process.'
    },
    email_change: {
      subject: 'Email Change Verification - HRMS',
      title: 'Email Change Verification',
      message: 'Please verify your new email address to update your account.'
    }
  };

  const template = templates[verificationType] || templates.password_reset;

  return {
    subject: template.subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333; text-align: center;">${template.title}</h2>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0 0 15px 0; color: #666;">Hello,</p>
          <p style="margin: 0 0 15px 0; color: #666;">
            ${template.message}
          </p>
          <p style="margin: 0 0 15px 0; color: #666;">
            Your One-Time Password (OTP) is:
          </p>
          <div style="text-align: center; margin: 20px 0;">
            <span style="font-size: 24px; font-weight: bold; color: #007bff; background-color: #e9ecef; padding: 10px 20px; border-radius: 4px; letter-spacing: 2px;">
              ${otp}
            </span>
          </div>
          <p style="margin: 0 0 15px 0; color: #666;">
            This OTP will expire in 10 minutes. Please do not share this code with anyone.
          </p>
          <p style="margin: 0 0 15px 0; color: #666;">
            If you didn't request this action, please ignore this email.
          </p>
        </div>
        <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
          <p>HRMS - Human Resource Management System</p>
        </div>
      </div>
    `
  };
};

// Send OTP email
const sendOTPEmail = async (email, otp, verificationType = 'password_reset') => {
  try {
    if (!transporter) {
      console.warn('SMTP email is not configured. Logging OTP to console for local testing.');
      console.log(`\n========================================`);
      console.log(`OTP for ${email}`);
      console.log(`Verification Type: ${verificationType}`);
      console.log(`OTP Code: ${otp}`);
      console.log(`Expires in: 10 minutes`);
      console.log(`========================================\n`);
      return {
        success: true,
        message: 'OTP generated and logged to console because SMTP email is not configured.',
      };
    }

    const template = getEmailTemplate(otp, verificationType);
    const mailOptions = {
      from: smtpFrom,
      to: email,
      subject: template.subject,
      html: template.html
    };

    await transporter.sendMail(mailOptions);
    return { success: true, message: 'OTP sent successfully' };
  } catch (error) {
    console.error('Email sending error:', error.message);
    // Fallback: Log OTP if email sending fails
    console.warn(`\nFAILED TO SEND EMAIL - LOGGING OTP INSTEAD:`);
    console.log(`========================================`);
    console.log(`OTP for ${email}`);
    console.log(`Verification Type: ${verificationType}`);
    console.log(`OTP Code: ${otp}`);
    console.log(`Expires in: 10 minutes`);
    console.log(`========================================\n`);
    return {
      success: true,
      message: 'OTP generated and logged to console. Email sending failed but you can use the code from console.'
    };
  }
};



// Send email verification OTP (new generic function)
const sendEmailVerificationOTP = async (email, otp, verificationType) => {
  return sendOTPEmail(email, otp, verificationType);
};

export {
  sendEmail,
  sendOTPEmail,
  sendEmailVerificationOTP,
  sendWelcomeEmployeeEmail,
  sendPasswordResetEmail,
  sendLeaveApprovedEmail,
  sendLeaveRejectedEmail,
};