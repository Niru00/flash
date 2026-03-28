import SibApiV3Sdk from "sib-api-v3-sdk";

const client = SibApiV3Sdk.ApiClient.instance;
const apiKey = client.authentications["api-key"];

apiKey.apiKey = process.env.BREVO_API_KEY;

const tranEmailApi = new SibApiV3Sdk.TransactionalEmailsApi();

export async function sendMail({ to, subject, html }) {
  try {
    const response = await tranEmailApi.sendTransacEmail({
      sender: {
        email: process.env.BREVO_SENDER,
        name: "Flash AI",
      },
      to: [{ email: to }],
      subject: subject,
      htmlContent: html,
    });

    console.log("Email sent:", response.messageId);
    return response;

  } catch (error) {
    console.error("Failed to send email:", error);
    throw error;
  }
}