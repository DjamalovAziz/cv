import { type NextRequest, NextResponse } from "next/server";
import { db } from "~/server/db";
import { setCode, getPendingReg, setPendingReg, isRedisAvailable } from "~/server/redis";

function generateCode(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

export async function POST(request: NextRequest) {
  try {
    const update = await request.json();

    if (update.message) {
      const chatId = update.message.chat.id;
      const text = update.message.text;
      const telegramId = String(update.message.from?.id);
      const telegramUsername = update.message.from?.username;

      if (text?.startsWith("/start")) {
        const params = text.split(" ")[1];

        if (params?.startsWith("reg_")) {
          const userId = params.replace("reg_", "");

          const pendingData = await getPendingReg(userId);

          if (pendingData) {
            const code = generateCode();
            await setCode(userId, code);

            await setPendingReg(userId, {
              ...pendingData,
              telegramChatId: telegramId,
            });

            return NextResponse.json({
              message: {
                chat_id: chatId,
                text: `🔐 Your verification code: ${code}\n\nEnter this code on the website to complete registration.\n\nThis code expires in 5 minutes.`,
              },
            });
          }

          return NextResponse.json({
            message: {
              chat_id: chatId,
              text: "❌ Registration session expired. Please start again on the website.",
            },
          });
        }

        if (params?.startsWith("reset_")) {
          const userId = params.replace("reset_", "");

          const user = await db.user.findUnique({
            where: { id: userId },
          });

          if (!user) {
            return NextResponse.json({
              message: {
                chat_id: chatId,
                text: "❌ User not found.",
              },
            });
          }

          const code = generateCode();
          await setCode(`reset:${userId}`, code);

          return NextResponse.json({
            message: {
              chat_id: chatId,
              text: `🔑 Your password reset code: ${code}\n\nEnter this code on the website to reset your password.\n\nThis code expires in 5 minutes.`,
            },
          });
        }

        return NextResponse.json({
          message: {
            chat_id: chatId,
            text: "👋 Welcome to CV Bot! Use the website to register or reset your password.",
          },
        });
      }

      if (text === "/code") {
        const user = await db.user.findUnique({
          where: { telegramId },
        });

        if (user) {
          return NextResponse.json({
            message: {
              chat_id: chatId,
              text: `📝 Your linked account: ${user.username}`,
            },
          });
        }

        return NextResponse.json({
          message: {
            chat_id: chatId,
            text: "No account linked to this chat.",
          },
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Telegram webhook error:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: "Telegram bot webhook" });
}