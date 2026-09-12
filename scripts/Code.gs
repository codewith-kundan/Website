/**
 * UDAAN Email Backend (Google Apps Script)
 * 
 * DEPLOYMENT INSTRUCTIONS:
 * 1. Create a new Google Apps Script project (or open existing).
 * 2. Copy this code into Code.gs.
 * 3. Go to Project Settings > Script Properties and verify:
 *    Property: EMAIL_API_TOKEN
 *    Value: <your-secure-random-token> (Matches VITE_EMAIL_API_TOKEN in frontend .env)
 * 4. Deploy as Web App:
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 5. Copy the Web App URL and set as VITE_EMAIL_API_URL in frontend .env.
 * 
 * QUOTA CHECK:
 * Run checkEmailQuota() from the Apps Script editor to see remaining daily emails.
 */

/**
 * Check remaining email quota for today
 */
function checkEmailQuota() {
  const remaining = MailApp.getRemainingDailyQuota();
  Logger.log('======================================');
  Logger.log('UDAAN Email Quota Status');
  Logger.log('======================================');
  Logger.log('Remaining emails today: ' + remaining);
  Logger.log('======================================');
  
  return {
    remaining: remaining,
    timestamp: new Date().toISOString()
  };
}

// --- CONFIGURATION ---
const SCRIPT_PROPS = PropertiesService.getScriptProperties();
const FALLBACK_TOKEN = 'udaan-email-2026-secure'; 
const BASE_URL = 'https://udaannitr.in';
const LOGO_URL = 'https://udaannitr.in/logos/udaan-logo-white.png';

function doPost(e) {
  try {
    // 1. Strict Validation
    if (!e || !e.postData || !e.postData.contents) {
      return createResponse({ status: 'error', message: 'Invalid request shape' });
    }

    const data = JSON.parse(e.postData.contents);
    
    // 2. Security Check
    const serverToken = SCRIPT_PROPS.getProperty('EMAIL_API_TOKEN') || FALLBACK_TOKEN;
    if (!data.token || data.token !== serverToken) {
      return createResponse({ status: 'error', message: 'Unauthorized: Invalid Token' });
    }

    // 3. Type Validation & Dispatch
    const { type, recipient, payload } = data;

    if (!recipient) {
      return createResponse({ status: 'error', message: 'Missing recipient' });
    }

    let subject = '';
    let htmlBody = '';

    switch (type) {
      case 'OTP_VERIFICATION':
        validatePayload(payload, ['name', 'code']);
        subject = 'UDAAN Verification Code';
        htmlBody = getVerificationEmailHtml(payload.name, payload.code, payload.expiryText || '15 minutes');
        break;

      case 'INDUCTION_CREDENTIALS':
        validatePayload(payload, ['name', 'memberId', 'temporaryPassword']);
        subject = 'UDAAN Induction Credentials';
        htmlBody = getCredentialsEmailHtml(payload.name, payload.memberId, payload.temporaryPassword);
        break;

      case 'ID_CHANGE':
        validatePayload(payload, ['name', 'oldId', 'newId', 'timestamp']);
        subject = 'UDAAN Member ID Change Notification';
        htmlBody = getIdChangeEmailHtml(payload.name, payload.oldId, payload.newId, payload.timestamp);
        break;

      case 'INDUCTION_SUCCESS':
        validatePayload(payload, ['name', 'memberId']);
        subject = 'Welcome to UDAAN Aeromodelling Club';
        htmlBody = getInductionSuccessEmailHtml(payload.name, payload.memberId);
        break;
        
      case 'NOTIFICATION_ALERT':
        validatePayload(payload, ['name', 'title', 'message']);
        subject = `[UDAAN] ${payload.title}`;
        htmlBody = getNotificationAlertEmailHtml(
          payload.name,
          payload.senderName || 'Flight Command',
          payload.title,
          payload.message,
          payload.category || 'Notification',
          payload.actionUrl || (BASE_URL + '/team-login')
        );
        break;

      case 'ANNOUNCEMENT':
      case 'TASK_ASSIGNED':
        validatePayload(payload, ['name', 'title', 'message']);
        subject = `[UDAAN] ${payload.title}`;
        htmlBody = getNotificationAlertEmailHtml(
          payload.name,
          payload.senderName || 'Flight Command',
          payload.title,
          payload.message,
          type === 'TASK_ASSIGNED' ? 'Task Assignment' : 'Announcement',
          payload.actionUrl || (BASE_URL + '/team-login')
        );
        break;

      default:
        return createResponse({ status: 'error', message: `Unknown email type: ${type}` });
    }

    // 4. Send Email
    MailApp.sendEmail({
      to: recipient,
      subject: subject,
      htmlBody: htmlBody,
      name: 'UDAAN Aeromodelling Club',
      replyTo: 'nitrudaan07@gmail.com'
    });

    return createResponse({ status: 'success' });

  } catch (err) {
    Logger.log('Error: ' + err.toString());
    return createResponse({ status: 'error', message: 'Internal Server Error: ' + err.toString() });
  }
}

function createResponse(body) {
  return ContentService.createTextOutput(JSON.stringify(body))
    .setMimeType(ContentService.MimeType.JSON);
}

function validatePayload(payload, requiredKeys) {
  if (!payload) throw new Error('Missing payload');
  for (const key of requiredKeys) {
    if (payload[key] === undefined || payload[key] === null) {
      throw new Error(`Missing required payload field: ${key}`);
    }
  }
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (s) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[s] || s);
}

/**
 * Normalizes any link so it is GUARANTEED to be a valid absolute URL.
 * Prevents Gmail "Redirect Notice: invalid URL (http:///...)" errors.
 */
function sanitizeUrl(url) {
  if (!url || typeof url !== 'string') {
    return BASE_URL + '/team-login';
  }
  const trimmed = url.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  return BASE_URL + (trimmed.startsWith('/') ? '' : '/') + trimmed;
}

// --- EMAIL DESIGN SYSTEM TOKENS ---
const EMAIL_BODY_STYLE = "margin: 0; padding: 0; background-color: #030712; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #f1f5f9; line-height: 1.6; width: 100%;";
const CONTAINER_STYLE = "max-width: 600px; margin: 24px auto; background-color: #090e1a; border: 1px solid #1e293b; border-radius: 8px; overflow: hidden; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.7);";
const ACCENT_COLOR = '#38bdf8';

/**
 * Reusable Official Header with UDAAN Logo
 */
function getHeaderHtml(subtitle) {
  return `
    <div style="background-color: #040814; padding: 28px 20px 22px; text-align: center; border-bottom: 1px solid #1e293b; background: linear-gradient(180deg, #0b1329 0%, #040814 100%);">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto;">
        <tr>
          <td align="center">
            <a href="${BASE_URL}" target="_blank" style="text-decoration: none; display: inline-block;">
              <img src="${LOGO_URL}" alt="UDAAN Emblem" width="56" height="56" style="display: block; margin: 0 auto 12px; border: 0; outline: none;" />
            </a>
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 20px; font-weight: 800; letter-spacing: 3.5px; color: #ffffff; text-transform: uppercase;">
              UDAAN
            </div>
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 10px; font-weight: 600; letter-spacing: 1.8px; color: #38bdf8; text-transform: uppercase; margin-top: 4px;">
              ${subtitle || 'Official Aeromodelling Club &bull; NIT Rourkela'}
            </div>
          </td>
        </tr>
      </table>
    </div>
  `;
}

/**
 * Reusable Official Footer
 */
function getFooterHtml(today) {
  return `
    <div style="text-align: center; background-color: #030712; padding: 24px 20px; border-top: 1px solid #1e293b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; color: #64748b; line-height: 1.6;">
      <p style="margin: 0; color: #94a3b8; font-weight: 600; font-size: 13px;">UDAAN Aeromodelling Club</p>
      <p style="margin: 3px 0 0; color: #64748b; font-size: 11px;">Student Activity Centre (SAC) &bull; National Institute of Technology, Rourkela</p>
      <p style="margin: 14px 0 0; color: #475569; font-size: 10px;">This operational email was dispatched to your verified registered address. Please do not reply directly to this automated transmission.</p>
      <p style="margin: 4px 0 0; color: #334155; font-size: 10px;">&copy; ${today} UDAAN NIT Rourkela. All rights reserved.</p>
    </div>
  `;
}

/**
 * Official Notification Alert Template
 */
function getNotificationAlertEmailHtml(name, senderName, title, message, category, actionUrl) {
  const today = new Date().getFullYear();
  const loginUrl = sanitizeUrl(actionUrl);

  // Category badge colors & icon
  let badgeBg = 'rgba(56, 189, 248, 0.12)';
  let badgeBorder = '#38bdf8';
  let badgeColor = '#38bdf8';
  let categoryIcon = '📢';

  const cat = String(category || '').toLowerCase();
  if (cat.includes('meeting')) {
    badgeBg = 'rgba(59, 130, 246, 0.15)';
    badgeBorder = '#60a5fa';
    badgeColor = '#93c5fd';
    categoryIcon = '📅';
  } else if (cat.includes('important') || cat.includes('directive') || cat.includes('urgent')) {
    badgeBg = 'rgba(239, 68, 68, 0.15)';
    badgeBorder = '#f87171';
    badgeColor = '#fca5a5';
    categoryIcon = '🚨';
  } else if (cat.includes('deadline') || cat.includes('task')) {
    badgeBg = 'rgba(245, 158, 11, 0.15)';
    badgeBorder = '#fbbf24';
    badgeColor = '#fde68a';
    categoryIcon = '⏰';
  } else if (cat.includes('announcement') || cat.includes('mission')) {
    badgeBg = 'rgba(16, 185, 129, 0.15)';
    badgeBorder = '#34d399';
    badgeColor = '#6ee7b7';
    categoryIcon = '🚀';
  }

  const formattedMessage = escapeHtml(message).replace(/\n/g, '<br/>');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
</head>
<body style="${EMAIL_BODY_STYLE}">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr>
      <td align="center" style="padding: 24px 12px; background-color: #030712;">
        
        <div style="${CONTAINER_STYLE}">
          
          ${getHeaderHtml('Flight Deck Operational Notification')}

          <!-- Content Body -->
          <div style="padding: 32px 28px;">
            
            <!-- Category Badge -->
            <div style="display: inline-block; padding: 6px 14px; background-color: ${badgeBg}; border: 1px solid ${badgeBorder}; border-radius: 20px; margin-bottom: 16px;">
              <span style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; font-weight: 700; color: ${badgeColor}; text-transform: uppercase; letter-spacing: 1px;">
                ${categoryIcon} ${escapeHtml(category || 'Notification')}
              </span>
            </div>

            <!-- Subject Title -->
            <h2 style="color: #f8fafc; font-size: 22px; margin: 0 0 14px; font-weight: 700; line-height: 1.35; letter-spacing: 0.2px;">
              ${escapeHtml(title)}
            </h2>

            <!-- Metadata Box -->
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 22px; background-color: #070d1e; border: 1px solid #1e293b; border-radius: 6px; padding: 10px 14px;">
              <tr>
                <td style="font-size: 12px; color: #94a3b8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                  <span style="color: #64748b; text-transform: uppercase; font-size: 10px; letter-spacing: 0.8px; font-weight: 600;">To:</span> <strong style="color: #f1f5f9;">${escapeHtml(name)}</strong>
                </td>
                <td align="right" style="font-size: 12px; color: #94a3b8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                  <span style="color: #64748b; text-transform: uppercase; font-size: 10px; letter-spacing: 0.8px; font-weight: 600;">From:</span> <strong style="color: #38bdf8;">${escapeHtml(senderName)}</strong>
                </td>
              </tr>
            </table>

            <!-- Message Card -->
            <div style="background-color: #070d1e; border: 1px solid #1e293b; border-left: 4px solid #2563eb; padding: 22px; margin: 22px 0; border-radius: 6px;">
              <p style="color: #e2e8f0; font-size: 15px; margin: 0; line-height: 1.75; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                ${formattedMessage}
              </p>
            </div>

            <!-- Bulletproof Button -->
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 32px auto 20px;">
              <tr>
                <td align="center" style="border-radius: 6px; background-color: #2563eb;">
                  <a href="${loginUrl}" target="_blank" style="background-color: #2563eb; border: 1px solid #3b82f6; border-radius: 6px; color: #ffffff; display: inline-block; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; font-weight: 700; padding: 14px 36px; text-decoration: none; letter-spacing: 0.8px; text-transform: uppercase;">
                    Open Flight Deck &rarr;
                  </a>
                </td>
              </tr>
            </table>

            <!-- Fallback URL -->
            <p style="text-align: center; margin: 0 0 16px; font-size: 11px; color: #64748b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; word-break: break-all;">
              Direct link: <a href="${loginUrl}" target="_blank" style="color: #38bdf8; text-decoration: underline;">${loginUrl}</a>
            </p>

          </div>

          ${getFooterHtml(today)}

        </div>

      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Verification Code Email
 */
function getVerificationEmailHtml(name, code, expiryText) {
  const today = new Date().getFullYear();
  return `<!DOCTYPE html>
<html>
<head><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="${EMAIL_BODY_STYLE}">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr>
      <td align="center" style="padding: 24px 12px; background-color: #030712;">
        <div style="${CONTAINER_STYLE}">
          ${getHeaderHtml('Security Verification')}
          <div style="padding: 32px 28px;">
            <div style="border-left: 3px solid ${ACCENT_COLOR}; padding-left: 14px; margin-bottom: 20px;">
              <h2 style="color: #f8fafc; font-size: 20px; margin: 0; font-weight: 700;">Verification Required</h2>
            </div>
            <p style="color: #cbd5e1; font-size: 15px; margin: 0 0 10px;">Hello <strong>${escapeHtml(name)}</strong>,</p>
            <p style="color: #94a3b8; font-size: 14px; margin: 0 0 24px;">Please use the 6-digit verification code below to confirm your email address.</p>
            
            <div style="background-color: #070d1e; border: 1px solid #1e293b; border-radius: 8px; padding: 24px; text-align: center; margin: 24px 0;">
              <span style="font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: 800; letter-spacing: 10px; color: ${ACCENT_COLOR}; display: block;">
                ${escapeHtml(code)}
              </span>
            </div>

            <p style="font-size: 12px; color: #ef4444; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 600; margin: 0 0 20px;">
              ⚠ Code expires in ${escapeHtml(expiryText).toUpperCase()}.
            </p>
            <p style="color: #475569; font-size: 12px; margin-top: 24px; border-top: 1px solid #1e293b; padding-top: 12px;">
              If you did not request this verification, please ignore this email.
            </p>
          </div>
          ${getFooterHtml(today)}
        </div>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Induction Credentials Email
 */
function getCredentialsEmailHtml(name, memberId, temporaryPassword) {
  const loginUrl = BASE_URL + '/induction-login';
  const today = new Date().getFullYear();
  return `<!DOCTYPE html>
<html>
<head><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="${EMAIL_BODY_STYLE}">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr>
      <td align="center" style="padding: 24px 12px; background-color: #030712;">
        <div style="${CONTAINER_STYLE}">
          ${getHeaderHtml('Induction Portal Access')}
          <div style="padding: 32px 28px;">
            <div style="border-left: 3px solid #10b981; padding-left: 14px; margin-bottom: 20px;">
              <h2 style="color: #f8fafc; font-size: 20px; margin: 0; font-weight: 700;">Access Granted &bull; Freshers Induction</h2>
            </div>
            <p style="color: #cbd5e1; font-size: 15px; margin: 0 0 10px;">Candidate <strong>${escapeHtml(name)}</strong>,</p>
            <p style="color: #94a3b8; font-size: 14px; margin: 0 0 24px;">Your clearance credentials for the UDAAN Induction Portal have been generated.</p>
            
            <div style="background-color: #070d1e; border: 1px solid #1e293b; border-left: 3px solid #10b981; border-radius: 6px; padding: 20px; margin: 24px 0;">
              <div style="margin-bottom: 16px;">
                <span style="font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Member ID</span>
                <div style="font-family: 'Courier New', monospace; font-size: 18px; font-weight: 700; color: #f8fafc; margin-top: 4px;">${escapeHtml(memberId)}</div>
              </div>
              <div style="border-top: 1px solid #1e293b; margin: 12px 0;"></div>
              <div>
                <span style="font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Temporary Password</span>
                <div style="font-family: 'Courier New', monospace; font-size: 18px; font-weight: 700; color: #10b981; margin-top: 4px;">${escapeHtml(temporaryPassword)}</div>
              </div>
            </div>

            <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 28px auto;">
              <tr>
                <td align="center" style="border-radius: 6px; background-color: #10b981;">
                  <a href="${loginUrl}" target="_blank" style="background-color: #10b981; border: 1px solid #10b981; border-radius: 6px; color: #020617; display: inline-block; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; font-weight: 700; padding: 12px 30px; text-decoration: none; text-transform: uppercase; letter-spacing: 1px;">
                    Initialize Induction Login &rarr;
                  </a>
                </td>
              </tr>
            </table>

            <p style="color: #475569; font-size: 12px; margin-top: 24px; border-top: 1px solid #1e293b; padding-top: 12px;">
              Please change your password immediately upon your first login.
            </p>
          </div>
          ${getFooterHtml(today)}
        </div>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * ID Change Email
 */
function getIdChangeEmailHtml(name, oldId, newId, timestamp) {
  const today = new Date().getFullYear();
  return `<!DOCTYPE html>
<html>
<head><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="${EMAIL_BODY_STYLE}">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr>
      <td align="center" style="padding: 24px 12px; background-color: #030712;">
        <div style="${CONTAINER_STYLE}">
          ${getHeaderHtml('Member Record Update')}
          <div style="padding: 32px 28px;">
            <div style="border-left: 3px solid #fbbf24; padding-left: 14px; margin-bottom: 20px;">
              <h2 style="color: #f8fafc; font-size: 20px; margin: 0; font-weight: 700;">Member ID Reassigned</h2>
            </div>
            <p style="color: #cbd5e1; font-size: 15px; margin: 0 0 10px;">Hello <strong>${escapeHtml(name)}</strong>,</p>
            <p style="color: #94a3b8; font-size: 14px; margin: 0 0 24px;">Your official club identifier has been updated in the roster.</p>
            
            <div style="display: flex; align-items: center; justify-content: center; margin: 28px 0; background-color: #070d1e; border: 1px solid #1e293b; border-radius: 6px; padding: 20px;">
              <div style="text-align: center; margin-right: 20px;">
                <div style="font-size: 11px; color: #64748b; text-transform: uppercase;">Previous ID</div>
                <div style="font-family: monospace; font-size: 16px; color: #ef4444; text-decoration: line-through;">${escapeHtml(oldId)}</div>
              </div>
              <div style="color: #64748b; font-size: 18px; margin-right: 20px;">&rarr;</div>
              <div style="text-align: center;">
                <div style="font-size: 11px; color: #38bdf8; text-transform: uppercase; font-weight: 600;">New Member ID</div>
                <div style="font-family: monospace; font-size: 18px; color: #38bdf8; font-weight: 700;">${escapeHtml(newId)}</div>
              </div>
            </div>

            <p style="color: #94a3b8; font-size: 13px;">Your password remains unchanged. Please use your new Member ID for all subsequent logins.</p>
            <p style="color: #475569; font-size: 11px; margin-top: 24px; border-top: 1px solid #1e293b; padding-top: 12px;">TIMESTAMP: ${escapeHtml(timestamp)}</p>
          </div>
          ${getFooterHtml(today)}
        </div>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Induction Success Email
 */
function getInductionSuccessEmailHtml(name, memberId) {
  const today = new Date().getFullYear();
  const loginUrl = BASE_URL + '/team-login';
  return `<!DOCTYPE html>
<html>
<head><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="${EMAIL_BODY_STYLE}">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr>
      <td align="center" style="padding: 24px 12px; background-color: #030712;">
        <div style="${CONTAINER_STYLE}">
          ${getHeaderHtml('Induction Completed')}
          <div style="padding: 32px 28px;">
            <div style="border-left: 3px solid #10b981; padding-left: 14px; margin-bottom: 20px;">
              <h2 style="color: #f8fafc; font-size: 20px; margin: 0; font-weight: 700;">Welcome to UDAAN!</h2>
            </div>
            <p style="color: #cbd5e1; font-size: 15px; margin: 0 0 10px;">Congratulations <strong>${escapeHtml(name)}</strong>,</p>
            <p style="color: #94a3b8; font-size: 14px; margin: 0 0 20px;">You have successfully completed the induction process and are now officially inducted into UDAAN Aeromodelling Club.</p>
            
            <div style="background-color: #070d1e; border: 1px solid #1e293b; border-left: 3px solid #10b981; border-radius: 6px; padding: 20px; margin: 20px 0;">
              <span style="font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Official Member ID</span>
              <div style="font-family: 'Courier New', monospace; font-size: 20px; font-weight: 700; color: #f8fafc; margin-top: 4px;">${escapeHtml(memberId)}</div>
            </div>

            <p style="color: #94a3b8; font-size: 14px;">You now have full access to the Team Portal, division task management, and official ID card generator.</p>

            <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 28px auto;">
              <tr>
                <td align="center" style="border-radius: 6px; background-color: #10b981;">
                  <a href="${loginUrl}" target="_blank" style="background-color: #10b981; border: 1px solid #10b981; border-radius: 6px; color: #020617; display: inline-block; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; font-weight: 700; padding: 14px 34px; text-decoration: none; text-transform: uppercase; letter-spacing: 1px;">
                    Enter Team Portal &rarr;
                  </a>
                </td>
              </tr>
            </table>
          </div>
          ${getFooterHtml(today)}
        </div>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
