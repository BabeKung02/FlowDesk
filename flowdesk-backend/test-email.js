import { Resend } from 'resend';

const resend = new Resend('re_V2ZyL8gK_bULSYdpZFmh75ozV1sEfBn6s');
const result = await resend.emails.send({
  from: 'onboarding@resend.dev',
  to: 'ntpbabe@gmail.com',
  subject: 'Test',
  html: '<p>Test email</p>',
});

console.log(JSON.stringify(result, null, 2));