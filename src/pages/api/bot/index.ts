import { type NextRequest, NextResponse } from "next/server";
import { db } from "~/server/db";
import { AuthStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

const BOT_TOKEN = process.env.BOT_TOKEN || "";

async function createBot() {
  const { Bot, InlineKeyboard } = await import("grammy");
  const bot = new Bot(BOT_TOKEN);

  const keyboard = new InlineKeyboard().text("Подтвердить вход", "confirm_auth");

  bot.command("start", async (ctx) => {
    await ctx.reply("Привет! Нажмите кнопку ниже для подтверждения входа:", {
      reply_markup: keyboard,
    });
  });

  bot.callbackQuery("confirm_auth", async (ctx) => {
    const userId = ctx.from?.id.toString();
    if (!userId) return;

    await ctx.answerCallbackQuery();

    const user = await db.user.findUnique({
      where: { telegramId: userId },
      include: { authRequests: { where: { status: AuthStatus.PENDING } } },
    });

    if (!user || user.authRequests.length === 0) {
      await ctx.editMessageText("Нет активных запросов на подтверждение.");
      return;
    }

    const authRequest = user.authRequests[0];
    if (new Date() > authRequest.expiresAt) {
      await db.authRequest.update({
        where: { id: authRequest.id },
        data: { status: AuthStatus.EXPIRED },
      });
      await ctx.editMessageText("Время подтверждения истекло.");
      return;
    }

    await db.authRequest.update({
      where: { id: authRequest.id },
      data: { status: AuthStatus.CONFIRMED },
    });

    await ctx.editMessageText("Вход подтверждён!");
  });

  return bot;
}

export async function GET() {
  return NextResponse.json({ ok: true });
}

export async function POST(request: NextRequest) {
  try {
    const { Bot } = await import("grammy");
    const bot = new Bot(BOT_TOKEN);
    const body = await request.json();
    await bot.handleUpdate(body);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Bot error:", error);
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}

export default function handler() {
  return NextResponse.json({ ok: true });
}