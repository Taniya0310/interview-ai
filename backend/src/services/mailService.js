const {
  ClientSecretCredential
} = require("@azure/identity");

const {
  Client
} = require("@microsoft/microsoft-graph-client");

const {
  tenantId,
  clientId,
  clientSecret,
  mailbox
} = require("../config/env");

function createGraphClient() {
  const credential =
    new ClientSecretCredential(
      tenantId,
      clientId,
      clientSecret
    );

  return Client.initWithMiddleware({
    authProvider: {
      getAccessToken: async () => {
        const token =
          await credential.getToken(
            "https://graph.microsoft.com/.default"
          );

        return token.token;
      }
    }
  });
}

function createOtpEmailHtml(otp) {
  return `
    <!DOCTYPE html>
    <html>
      <body style="
        margin: 0;
        padding: 0;
        background-color: #f4f7fb;
        font-family: Arial, sans-serif;
        color: #1f2937;
      ">
        <div style="
          max-width: 600px;
          margin: 40px auto;
          padding: 20px;
        ">
          <div style="
            background-color: #ffffff;
            border-radius: 16px;
            padding: 40px 32px;
            text-align: center;
            box-shadow: 0 4px 18px rgba(0,0,0,0.08);
          ">
            <h1 style="
              margin: 0 0 12px;
              color: #2563eb;
              font-size: 28px;
            ">
              SkillzageAI
            </h1>

            <p style="
              margin: 0 0 28px;
              color: #6b7280;
              font-size: 15px;
            ">
              Verify your email address
            </p>

            <p style="
              font-size: 16px;
              line-height: 1.6;
              margin-bottom: 24px;
            ">
              Use the verification code below to continue:
            </p>

            <div style="
              display: inline-block;
              padding: 18px 32px;
              background-color: #eff6ff;
              border: 1px solid #bfdbfe;
              border-radius: 12px;
              color: #1d4ed8;
              font-size: 32px;
              font-weight: bold;
              letter-spacing: 8px;
            ">
              ${otp}
            </div>

            <p style="
              margin: 26px 0 8px;
              color: #4b5563;
              font-size: 14px;
            ">
              This code will expire in
              <strong>10 minutes</strong>.
            </p>

            <p style="
              margin: 0;
              color: #9ca3af;
              font-size: 13px;
              line-height: 1.5;
            ">
              If you did not request this code, you can safely
              ignore this email.
            </p>
          </div>

          <p style="
            margin-top: 20px;
            text-align: center;
            color: #9ca3af;
            font-size: 12px;
          ">
            © ${new Date().getFullYear()} SkillzageAI.
            All rights reserved.
          </p>
        </div>
      </body>
    </html>
  `;
}

async function sendOtpEmail(
  recipientEmail,
  otp
) {
  if (
    !tenantId ||
    !clientId ||
    !clientSecret ||
    !mailbox
  ) {
    throw new Error(
      "Microsoft Graph mail configuration is missing"
    );
  }

  const graphClient =
    createGraphClient();

  await graphClient
    .api(`/users/${mailbox}/sendMail`)
    .post({
      message: {
        subject:
          "Your SkillzageAI verification code",
        body: {
          contentType: "HTML",
          content: createOtpEmailHtml(otp)
        },
        toRecipients: [
          {
            emailAddress: {
              address: recipientEmail
            }
          }
        ]
      },
      saveToSentItems: true
    });
}

module.exports = {
  sendOtpEmail
};