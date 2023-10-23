import { App } from "@slack/bolt";
import dotenv from "dotenv";

dotenv.config();

const questions = [
  "What did you do yesterday?",
  "What are you doing today?",
  "What are your blockers?",
];

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
});

const sendMessage = async (userId: string, message: string) => {
  try {
    const question = await app.client.chat.postMessage({
      channel: userId,
      text: message,
    });
  } catch (error) {
    console.error("[SEND_QUESTION_ERROR]", error);
  }
};

const dailyStandup = async (userId: string) => {
  try {
    const response: string[] = [];

    if (response.length < 4) {
      await sendMessage(userId, "Hello, it's time for your daily standup🤓");
      console.log("Question length", questions.length);
      for (let i = 0; i < questions.length; i++) {
        await sendMessage(userId, questions[i]);
        const answer = await new Promise<string>((resolve) => {
          app.message(/./, async ({ message }) => {
            const { text } = message as { text: string };
            resolve(text);
          });
        });
        response.push(answer);
      }
    }

    if (response.length === 3) {
      await sendMessage(
        userId,
        "Thank you for your time🫡 See you again real soon!"
      );
    }
  } catch (error) {
    console.error("[DAILY_STANDUP_ERROR]", error);
  }
};

app.command("/run-standup", async ({ command, ack, say }) => {
  // Acknowledge command request
  await ack();
  // await say("Initiating sequence to run standup🚀...");
  const channel = await app.client.conversations.members({
    token: process.env.SLACK_BOT_TOKEN,
    channel: command.channel_id,
  });

  const { members } = channel;
  console.log(members, "members");
  members.forEach((member) => {
    if (member === "U062CG408N8") {
      return null;
    }
    dailyStandup(member);
  });
});

app.event("app_mention", async ({ event, context, client, say }) => {
  try {
    const result = await client.chat.postMessage({
      token: context.botToken,
      channel: event.channel,
      text: `Hello <@${event.user}!>`,
    });
    console.log(result);
  } catch (error) {
    console.error(error);
  }
});

app.start(process.env.PORT || 3000).then(() => {
  console.log("⚡️ Bolt app is running!");
});
