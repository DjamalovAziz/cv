import { type NextRequest, NextResponse } from "next/server";
import { db } from "~/server/db";

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

      if (text?.startsWith("/start")) {
        const params = text.split(" ")[1];

        if (params?.startsWith("reg_")) {
          const tempId = params.replace("reg_", "");

          const pendingUser = await db.user.findFirst({
            where: {
              id: tempId,
              verificationStatus: "PENDING",
            },
          });

          if (pendingUser) {
            const code = generateCode();

            await db.user.update({
              where: { id: pendingUser.id },
              data: {
                verificationToken: code,
                telegramChatId: telegramId,
              },
            });

            return NextResponse.json({
              message: {
                chat_id: chatId,
                text: `🔐 Your verification code: ${code}\n\nEnter this code on the website to complete registration.\n\nThis code expires in 15 minutes.`,
              },
            });
          }

          return NextResponse.json({
            message: {
              chat_id: chatId,
              text: "❌ Registration session expired or not found. Please register again on the website.",
            },
          });
        }

        if (params?.startsWith("reset_")) {
          const tempId = params.replace("reset_", "");

          const pendingUser = await db.user.findFirst({
            where: {
              id: tempId,
              verificationStatus: "PENDING",
            },
          });

          if (pendingUser) {
            const code = generateCode();

            await db.user.update({
              where: { id: pendingUser.id },
              data: {
                verificationToken: code,
                telegramChatId: telegramId,
              },
            });

            return NextResponse.json({
              message: {
                chat_id: chatId,
                text: `🔑 Your password reset code: ${code}\n\nEnter this code on the website to reset your password.\n\nThis code expires in 15 minutes.`,
              },
            });
          }

          return NextResponse.json({
            message: {
              chat_id: chatId,
              text: "❌ Reset session expired. Please try again.",
            },
          });
        }

        return NextResponse.json({
          message: {
            chat_id: chatId,
            text: "👋 Welcome to CV Bot!\n\nUse /start on the website to get your verification code.\n\nCommands:\n/code - View your linked account",
          },
        });
      }

      if (text === "/code") {
        const user = await db.user.findFirst({
          where: { telegramChatId: telegramId },
        });

        if (user) {
          return NextResponse.json({
            message: {
              chat_id: chatId,
              text: `📝 Your linked account: @${user.username}`,
            },
          });
        }

        return NextResponse.json({
          message: {
            chat_id: chatId,
            text: "No account linked to this chat. Register on the website first.",
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