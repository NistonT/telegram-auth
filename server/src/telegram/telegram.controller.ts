import { Body, Controller, Post } from '@nestjs/common';
import { TelegramService } from './telegram.service';

@Controller('telegram')
export class TelegramController {
  constructor(private readonly telegramService: TelegramService) {}

  // Маршрут для обработки входящих сообщений от Telegram
  @Post('webhook')
  handleWebhook(@Body() body: any) {
    this.telegramService.getBotInstance().handleUpdate(body);
    return { success: true };
  }

  // Маршрут для проверки кода авторизации
  @Post('verify')
  async verifyAuthCode(@Body() body: { authCode: string }) {
    const { authCode } = body;

    console.log('Получен запрос на проверку кода:', authCode);

    try {
      // Поиск пользователя по коду
      const user = await this.telegramService.getUserByAuthCode(authCode);

      if (!user) {
        console.log('Пользователь с таким кодом не найден или код истек');
        return {
          success: false,
          message: 'Неверный или просроченный код авторизации',
        };
      }

      // Удаление кода после успешной авторизации
      await this.telegramService.clearAuthCode(user.telegramId);

      console.log('Код успешно проверен для пользователя:', user.telegramId);

      return { success: true, user };
    } catch (error) {
      console.error('Ошибка при проверке кода:', error);
      return { success: false, message: 'Ошибка сервера' };
    }
  }

  @Post('notify-login')
  async notifyLogin(@Body() body: { telegramId: string; deviceInfo: any }) {
    const { telegramId, deviceInfo } = body;

    try {
      // Находим пользователя по telegramId
      const user = await this.telegramService.getUserByTelegramId(telegramId);

      if (!user) {
        return { success: false, message: 'Пользователь не найден' };
      }

      // Формируем сообщение с информацией об устройстве
      const message = `
      Пользователь вошёл на сайт:
      - Имя: ${user.firstName}
      - ID: ${user.telegramId}
      - Браузер: ${deviceInfo.browser}
      - Тип устройства: ${deviceInfo.deviceType}
      - Операционная система: ${deviceInfo.os}
      - Мобильное устройство: ${deviceInfo.isMobile ? 'Да' : 'Нет'}
      - User-Agent: ${deviceInfo.userAgent}
    `;

      // Отправляем сообщение в Telegram
      await this.telegramService.notifyUserLogin(user.telegramId, message);

      return { success: true, message: 'Уведомление отправлено' };
    } catch (error) {
      console.error('Ошибка при отправке уведомления:', error);
      return { success: false, message: 'Ошибка сервера' };
    }
  }
}
