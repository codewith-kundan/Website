/**
 * UDAAN Email Service
 * Uses Google Apps Script as a backend to send emails via Gmail API.
 * Supports automatic failover to backup endpoint when primary fails/quota exceeded.
 */

const EMAIL_API_URL = import.meta.env.VITE_EMAIL_API_URL || '';
const EMAIL_API_URL_BACKUP = import.meta.env.VITE_EMAIL_API_URL_BACKUP || '';
const EMAIL_API_TOKEN = import.meta.env.VITE_EMAIL_API_TOKEN || '';

enum EmailType {
  OTP_VERIFICATION = 'OTP_VERIFICATION',
  INDUCTION_CREDENTIALS = 'INDUCTION_CREDENTIALS',
  ID_CHANGE = 'ID_CHANGE',
  INDUCTION_SUCCESS = 'INDUCTION_SUCCESS',
  NOTIFICATION_ALERT = 'NOTIFICATION_ALERT',
}

interface EmailPayload {
  name?: string;
  code?: string;
  expiryText?: string;
  memberId?: string;
  temporaryPassword?: string;
  oldId?: string;
  newId?: string;
  timestamp?: string;
  title?: string;
  message?: string;
  category?: string;
  senderName?: string;
  actionUrl?: string;
}

/**
 * Attempts to send email to a single endpoint.
 * Google Apps Script deployed as web app supports CORS, so we use normal fetch.
 */
async function trySendToEndpoint(url: string, body: string): Promise<boolean> {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body,
      redirect: 'follow'
    });
    
    // Google Apps Script returns JSON response
    const text = await response.text();
    
    try {
      const result = JSON.parse(text);
      return result.status === 'success';
    } catch {
      // If response isn't JSON, check if fetch succeeded
      return response.ok;
    }
  } catch {
    return false;
  }
}

/**
 * Core email sending function with automatic failover.
 * Tries primary endpoint first, then backup if primary fails.
 * Email is non-blocking: failures return false but do not throw.
 */
async function sendEmail(
  type: EmailType,
  recipient: string,
  payload: EmailPayload
): Promise<boolean> {
  // Validate configuration
  if (!EMAIL_API_URL || !EMAIL_API_TOKEN) {
    return false;
  }

  const requestBody = JSON.stringify({
    type,
    recipient,
    payload,
    token: EMAIL_API_TOKEN
  });

  // Try primary endpoint first
  const primarySuccess = await trySendToEndpoint(EMAIL_API_URL, requestBody);
  if (primarySuccess) {
    return true;
  }

  // Primary failed - try backup if available
  if (EMAIL_API_URL_BACKUP) {
    const backupSuccess = await trySendToEndpoint(EMAIL_API_URL_BACKUP, requestBody);
    return backupSuccess;
  }

  return false;
}

export async function sendVerificationEmail(
  email: string,
  name: string,
  verificationCode: string
): Promise<boolean> {
  return sendEmail(EmailType.OTP_VERIFICATION, email, {
    name,
    code: verificationCode,
    expiryText: '15 minutes'
  });
}

export async function sendCredentialsEmail(
  email: string,
  name: string,
  memberId: string,
  temporaryPassword: string
): Promise<boolean> {
  return sendEmail(EmailType.INDUCTION_CREDENTIALS, email, {
    name,
    memberId,
    temporaryPassword
  });
}

export async function sendIdChangeNotificationEmail(
  memberName: string,
  oldId: string,
  newId: string,
  verifiedEmail: string
): Promise<boolean> {
  const timestamp = new Date().toLocaleString('en-IN', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: 'Asia/Kolkata'
  });
  return sendEmail(EmailType.ID_CHANGE, verifiedEmail, {
    name: memberName,
    oldId,
    newId,
    timestamp
  });
}

export async function sendInductionSuccessEmail(
  email: string,
  name: string,
  memberId: string
): Promise<boolean> {
  return sendEmail(EmailType.INDUCTION_SUCCESS, email, {
    name,
    memberId
  });
}

/**
 * Helper to ensure actionUrl is always an absolute URL pointing to udaannitr.in
 */
function normalizeActionUrl(url?: string): string {
  const defaultUrl = 'https://udaannitr.in/team-login';
  if (!url) return defaultUrl;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `https://udaannitr.in${url.startsWith('/') ? '' : '/'}${url}`;
}

/**
 * Dispatches a flight deck notification alert to a single member's registered email
 */
export async function sendNotificationEmail(
  email: string,
  name: string,
  title: string,
  message: string,
  category: string = 'Notification',
  senderName: string = 'Flight Command',
  actionUrl: string = 'https://udaannitr.in/team-login'
): Promise<boolean> {
  const normalizedUrl = normalizeActionUrl(actionUrl);

  return sendEmail(EmailType.NOTIFICATION_ALERT, email, {
    name,
    title,
    message,
    category,
    senderName,
    actionUrl: normalizedUrl
  });
}

/**
 * Dispatches notification alert emails to multiple members with rate-limiting protection.
 * Runs in parallel batches of 5 to avoid overloading the Google Apps Script endpoint.
 */
export async function sendBulkNotificationEmails(
  recipients: Array<{ email: string; name: string }>,
  title: string,
  message: string,
  category: string = 'Notification',
  senderName: string = 'Flight Command',
  actionUrl: string = 'https://udaannitr.in/team-login'
): Promise<{ total: number; sent: number }> {
  let sentCount = 0;
  const batchSize = 5;
  const normalizedUrl = normalizeActionUrl(actionUrl);

  for (let i = 0; i < recipients.length; i += batchSize) {
    const batch = recipients.slice(i, i + batchSize);
    const results = await Promise.allSettled(
      batch.map(r =>
        sendNotificationEmail(
          r.email,
          r.name,
          title,
          message,
          category,
          senderName,
          normalizedUrl
        )
      )
    );

    results.forEach(res => {
      if (res.status === 'fulfilled' && res.value) {
        sentCount++;
      }
    });

    // Brief delay between batches to respect rate limits
    if (i + batchSize < recipients.length) {
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }

  return { total: recipients.length, sent: sentCount };
}
