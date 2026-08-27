import nodemailer from 'nodemailer';
import { EmailInterface } from '@gitroom/nestjs-libraries/emails/email.interface';

export const buildSmtpOptions = (env: NodeJS.ProcessEnv) => ({
  host: env.EMAIL_HOST,
  port: Number(env.EMAIL_PORT),
  secure: env.EMAIL_SECURE === 'true',
  ...(env.EMAIL_USER && env.EMAIL_PASS
    ? {
        auth: {
          user: env.EMAIL_USER,
          pass: env.EMAIL_PASS,
        },
      }
    : {}),
});

const transporter = nodemailer.createTransport(buildSmtpOptions(process.env));

export class NodeMailerProvider implements EmailInterface {
  name = 'nodemailer';
  validateEnvKeys = ['EMAIL_HOST', 'EMAIL_PORT', 'EMAIL_SECURE'];
  async sendEmail(
    to: string,
    subject: string,
    html: string,
    emailFromName: string,
    emailFromAddress: string
  ) {
    const sends = await transporter.sendMail({
      from: `${emailFromName} <${emailFromAddress}>`, // sender address
      to: to, // list of receivers
      subject: subject, // Subject line
      text: html, // plain text body
      html: html, // html body
    });

    return sends;
  }
}
