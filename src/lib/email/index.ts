import { fileURLToPath } from "url";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { render } from "cpeak";
import keys from "../../config/keys.js";

// Lazily constructed so the server can boot without SES credentials
// (e.g. local dev or CI run with SKIP_EMAIL=true).
let ses: SESClient | null = null;

const TEMPLATES_DIR = fileURLToPath(new URL("./templates", import.meta.url));

type HtmlTemplate = { htmlFile: string; templateData: Record<string, unknown> };

// Sends an HTML email via SES. Pass a raw HTML string or a { htmlFile, templateData }
// object to render a template from './templates' using cpeak's render.string.
const sendEmail = async (
  to: string,
  subject: string,
  html: string | HtmlTemplate,
) => {
  if (process.env.SKIP_EMAIL === "true") return;

  const htmlStr =
    typeof html === "string"
      ? html
      : await render.string(
          `${TEMPLATES_DIR}/${html.htmlFile}.html`,
          html.templateData,
        );

  ses ??= new SESClient({ region: keys.sesRegion });
  await ses.send(
    new SendEmailCommand({
      Source: keys.sesFromEmail,
      Destination: { ToAddresses: [to] },
      Message: {
        Subject: { Data: subject },
        Body: { Html: { Data: htmlStr } },
      },
    }),
  );
};

export default sendEmail;