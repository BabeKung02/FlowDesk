import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// ── Approval Email ────────────────────────────────────
export const sendApprovalEmail = async ({ to, requesterName, title, status, note }) => {
  const isApproved = status === 'APPROVED';
  const subject = isApproved ? '✅ คำขอของคุณได้รับอนุมัติแล้ว' : '❌ คำขอของคุณถูกปฏิเสธ';
  const color = isApproved ? '#2e7d32' : '#c62828';
  const statusText = isApproved ? 'อนุมัติ' : 'ปฏิเสธ';

  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: ${color};">FlowDesk — ผลการดำเนินการ</h2>
          <p>เรียน คุณ ${requesterName},</p>
          <p>คำขอ <strong>"${title}"</strong> ของคุณได้รับการดำเนินการแล้ว</p>
          <div style="
            display: inline-block; padding: 8px 20px;
            background: ${color}; color: white;
            border-radius: 6px; font-weight: bold; font-size: 16px;
          ">${statusText}</div>
          ${note ? `<p style="margin-top:16px;"><strong>หมายเหตุ:</strong> ${note}</p>` : ''}
          <p style="color: #666; margin-top: 16px; font-size: 13px;">หากมีคำถาม กรุณาติดต่อผู้ดูแลระบบ</p>
        </div>
      `,
    });
    console.log(`✅ Approval email (${status}) sent to ${to}`);
  } catch (error) {
    // ไม่ throw error เพราะไม่อยากให้ approve/reject ล้มเพราะส่งเมลไม่สำเร็จ
    console.error('⚠️ Failed to send approval email:', error?.message || error);
  }
};

// ── OTP ───────────────────────────────────────────────
// ── Announcement Email ─────────────────────────
export const sendAnnouncementEmail = async ({ to, title, message }) => {
  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to,
      subject: `📢 ${title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
          <div style="background: #6d28d9; color: white; padding: 16px 20px; border-radius: 8px 8px 0 0;">
            <span style="font-size: 13px; opacity: 0.85;">ประกาศจากบริษัท</span>
            <h2 style="margin: 8px 0 0;">${title}</h2>
          </div>
          <div style="border: 1px solid #eee; border-top: none; padding: 20px; border-radius: 0 0 8px 8px;">
            <p style="white-space: pre-line; line-height: 1.6;">${message}</p>
          </div>
          <p style="color: #666; margin-top: 16px; font-size: 13px;">FlowDesk — ระบบจัดการคำขอและการอนุมัติ</p>
        </div>
      `,
    });
    console.log(`✅ Announcement email sent to ${to}`);
  } catch (error) {
    console.error('⚠️ Failed to send announcement email:', error?.message || error);
    throw error;
  }
};

export const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

export const sendOTPEmail = async (to, otp, purpose) => {
  const subjects = {
    VERIFY_EMAIL:    'ยืนยันอีเมลของคุณ',
    FORGOT_PASSWORD: 'รีเซ็ตรหัสผ่านของคุณ',
  };

  const titles = {
    VERIFY_EMAIL:    'ยืนยันอีเมล',
    FORGOT_PASSWORD: 'รีเซ็ตรหัสผ่าน',
  };

  try {
    const result = await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to,
      subject: subjects[purpose],
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #1976d2;">${titles[purpose]}</h2>
          <p>รหัส OTP ของคุณคือ:</p>
          <div style="
            font-size: 36px; font-weight: bold; letter-spacing: 8px;
            background: #f5f5f5; padding: 20px; text-align: center;
            border-radius: 8px; color: #1976d2;
          ">
            ${otp}
          </div>
          <p style="color: #666; margin-top: 16px;">
            รหัสนี้จะหมดอายุใน <strong>10 นาที</strong>
          </p>
        </div>
      `,
    });

    console.log(`✅ OTP sent to ${to} | id: ${result?.data?.id ?? 'unknown'}`);

  } catch (error) {
    console.error('Unable to send OTP email:', error?.message || error);
    throw error;
  }
};
