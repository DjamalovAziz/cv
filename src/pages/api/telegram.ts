import { type NextRequest, NextResponse } from "next/server";
import { Bot, Keyboard } from "grammy";
import { db } from "~/server/db";
import { randomBytes } from "crypto";

const bot = process.env.TELEGRAM_BOT_TOKEN
  ? new Bot(process.env.TELEGRAM_BOT_TOKEN)
  : null;

async function handleStartCommand(ctx: any) {
  const params = ctx.match;
  const telegramId = String(ctx.from?.id);
  const username = ctx.from?.username;

  if (params && params.startsWith("verify:")) {
    const token = params.replace("verify:", "");
    const user = await db.user.findFirst({
      where: { verificationToken: token },
    });

    if (user) {
      await db.user.update({
        where: { id: user.id },
        data: {
          telegramId,
          telegramChatId: String(ctx.from?.id),
          verificationStatus: "VERIFIED",
          verificationToken: null,
        },
      });

      await ctx.reply(
        "✅ Верификация успешна! Теперь вы можете войти в систему."
      );
    } else {
      await ctx.reply("❌ Неверный токен верификации.");
    }
    return;
  }

  const user = await db.user.findUnique({
    where: { telegramId },
  });

  if (user?.verificationStatus === "VERIFIED") {
    await ctx.reply("⚠️ Вы уже верифицированы!");
    return;
  }

  const newToken = randomBytes(32).toString("hex");

  if (user) {
    await db.user.update({
      where: { id: user.id },
      data: {
        verificationToken: newToken,
        telegramChatId: String(ctx.from?.id),
        verificationStatus: "PENDING",
      },
    });
  } else {
    await ctx.reply(
      "❌ Аккаунт не найден. Пожалуйста, сначала создайте аккаунт на сайте."
    );
    return;
  }

  const keyboard = new Keyboard().requestContact("Отправить контакт").oneTime();
  const verificationUrl = `${process.env.NEXTAUTH_URL}/api/auth/verify?token=${newToken}`;

  await ctx.reply(
    `🔐 Для верификации нажмите кнопку ниже:\n\nИли перейдите по ссылке: ${verificationUrl}`,
    { reply_markup: keyboard as any }
  );
}

async function handleContact(ctx: any) {
  const telegramId = String(ctx.from?.id);

  const user = await db.user.findFirst({
    where: {
      telegramId,
      verificationStatus: "PENDING",
    },
  });

  if (!user) {
    await ctx.reply("⚠️ Запрос не найден. Используйте /start.");
    return;
  }

  await db.user.update({
    where: { id: user.id },
    data: {
      verificationStatus: "VERIFIED",
      verificationToken: null,
    },
  });

  await ctx.reply("✅ Верификация по контакту успешна!");
}

export async function POST(request: NextRequest) {
  try {
    const update = await request.json();

    if (update.message) {
      const chatId = update.message.chat.id;
      const text = update.message.text;

      if (text?.startsWith("/start")) {
        const params = text.split(" ")[1];
        const ctx = {
          from: { id: chatId, username: update.message.chat.username },
          match: params,
          reply: async (text: string, opts?: any) => {
            console.log("Reply:", text, opts);
          },
        };
        await handleStartCommand(ctx);
      }

      if (update.message.contact) {
        const ctx = {
          from: { id: chatId },
          message: update.message,
          reply: async (text: string) => {
            console.log("Reply:", text);
          },
        };
        await handleContact(ctx);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Telegram webhook error:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: "Telegram bot webhook endpoint" });
}