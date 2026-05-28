import { Resend } from "resend";
import { config } from "../env.js";

const resend = new Resend(config.resendApiKey);

export async function sendMagicLinkEmail(params: {
  to: string;
  url: string;
}): Promise<void> {
  if (config.isDevelopment) {
    console.log(`[DEV] Magic link for ${params.to}: ${params.url}`);
  }

  await resend.emails.send({
    from: `SnippetVault <${config.fromEmail}>`,
    to: config.isDevelopment ? "delivered@resend.dev" : params.to,
    subject: "Sign in to SnippetVault",
    html: `<p>Click <a href="${params.url}">here</a> to sign in to SnippetVault.</p>
<p>This link expires in 15 minutes.</p>`,
  });
}
