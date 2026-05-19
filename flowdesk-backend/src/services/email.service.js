import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

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

    console.log(`✅ OTP sent to ${to} | id: ${result.data.id}`);

  } catch (error) {
    console.error('Unable to send OTP email:', error?.message || error);
    throw error;
  }
};