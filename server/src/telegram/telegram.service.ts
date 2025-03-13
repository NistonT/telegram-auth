import { Injectable } from '@nestjs/common';
import { Bot } from 'grammy';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class TelegramService {
  private bot;

  constructor(private readonly prisma: PrismaService) {
    this.bot = new Bot(process.env.TELEGRAM_BOT_TOKEN);
    this.setupBot();
  }

  setupBot() {
    // Команда /start
    this.bot.command('start', async (ctx) => {
      const user = ctx.from;

      if (!user) {
        await ctx.reply('Не удалось получить данные вашего аккаунта.');
        return;
      }

      // Генерация случайного числового кода
      const authCode = Math.floor(1000 + Math.random() * 9000).toString();

      // Установка времени истечения срока действия кода (1 минута)
      const authCodeExpiresAt = new Date(Date.now() + 60 * 1000); // 1 минута

      // Сохранение или обновление пользователя с кодом и временем истечения
      const existingUser = await this.prisma.user.findUnique({
        where: { telegramId: user.id.toString() },
      });

      if (!existingUser) {
        // Регистрация нового пользователя
        await this.prisma.user.create({
          data: {
            telegramId: user.id.toString(),
            firstName: user.first_name,
            lastName: user.last_name || null,
            username: user.username || null,
            authCode,
            authCodeExpiresAt,
          },
        });
      } else {
        // Обновление существующего пользователя
        await this.prisma.user.update({
          where: { telegramId: user.id.toString() },
          data: { authCode, authCodeExpiresAt },
        });
      }

      // Отправка кода пользователю
      await ctx.reply(`Ваш код для авторизации: ${authCode}`);
    });

    this.bot.start();
  }

  getBotInstance() {
    return this.bot;
  }

  async getUserByAuthCode(authCode: string) {
    return await this.prisma.user.findFirst({
      where: { authCode, authCodeExpiresAt: { gte: new Date() } }, // Проверяем, что код не истёк
    });
  }

  async clearAuthCode(telegramId: string) {
    await this.prisma.user.update({
      where: { telegramId },
      data: { authCode: null, authCodeExpiresAt: null },
    });
  }

  async getUserByTelegramId(telegramId: string) {
    return await this.prisma.user.findUnique({
      where: { telegramId },
    });
  }

  async notifyUserLogin(telegramId: string, message: string) {
    const user = await this.prisma.user.findUnique({
      where: { telegramId },
    });

    if (!user) {
      throw new Error('Пользователь не найден');
    }

    // Отправляем сообщение в Telegram
    await this.bot.api.sendMessage(user.telegramId, message);
  }
}
