"use client";

import axios from "axios";
import DeviceDetector from "device-detector-js";
import { useState } from "react";

// Define the DeviceType if not already provided by the library
type DeviceType = "mobile" | "tablet" | "desktop" | "smarttv" | "unknown";

interface User {
	telegramId: string;
	firstName: string;
	lastName?: string | null;
	username?: string | null;
}

export const Auth = () => {
	const [authCode, setAuthCode] = useState("");
	const [userData, setUserData] = useState<User | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	// Функция для входа через Telegram
	const handleLogin = () => {
		window.location.href = `https://t.me/${process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME}?start=auth`;
	};

	// Функция для отправки кода на бэкенд
	const handleSubmit = async () => {
		setLoading(true);
		setError("");

		try {
			const response = await axios.post(
				"http://localhost:3000/api/telegram/verify",
				{
					authCode,
				}
			);

			if (response.data.success) {
				const user = response.data.user;

				// Создаем экземпляр DeviceDetector
				const deviceDetector = new DeviceDetector();
				const userAgent = navigator.userAgent;

				// Анализируем userAgent
				const deviceInfo = deviceDetector.parse(userAgent);

				// Определяем тип устройства
				let deviceType = "Неизвестно";
				const deviceTypeValue = deviceInfo.device?.type as
					| DeviceType
					| undefined; // Explicitly type deviceTypeValue

				if (deviceTypeValue === "mobile") {
					deviceType = "Мобильное устройство";
				} else if (deviceTypeValue === "tablet") {
					deviceType = "Планшет";
				} else if (deviceTypeValue === "desktop") {
					deviceType = "Десктоп";
				}

				// Формируем полную информацию об устройстве
				const fullDeviceInfo = {
					deviceType,
					browser: deviceInfo.client?.name || "Неизвестно",
					os: deviceInfo.os?.name || "Неизвестно",
					userAgent: userAgent,
				};

				// Отправляем данные об устройстве на бэкенд
				await axios.post("http://localhost:3000/api/telegram/notify-login", {
					telegramId: user.telegramId,
					deviceInfo: fullDeviceInfo,
				});

				setUserData(user);
			} else {
				setError(response.data.message || "Неверный код авторизации");
			}
		} catch (err: any) {
			console.error(
				"Ошибка при запросе к бэкенду:",
				err?.response?.data || err.message
			);
			setError("Произошла ошибка при проверке кода");
		} finally {
			setLoading(false);
		}
	};

	const handleLogout = () => {
		// Очищаем данные пользователя
		setUserData(null);
		setAuthCode("");
		setError("");
	};

	return (
		<div>
			<h1>Авторизация через Telegram</h1>

			{!userData ? (
				<>
					<button onClick={handleLogin}>Авторизация через Telegram</button>

					<div>
						<input
							type='text'
							placeholder='Введите код из Telegram'
							value={authCode}
							onChange={e => setAuthCode(e.target.value)}
						/>
						<button onClick={handleSubmit} disabled={loading}>
							{loading ? "Загрузка..." : "Войти"}
						</button>
					</div>

					{error && <p style={{ color: "red" }}>{error}</p>}
				</>
			) : (
				<div>
					<h2>Добро пожаловать, {userData.firstName}!</h2>
					<p>ID: {userData.telegramId}</p>
					<p>Фамилия: {userData.lastName || "Не указана"}</p>
					<p>Username: {userData.username || "Не указан"}</p>

					<button onClick={handleLogout}>Выйти</button>
				</div>
			)}
		</div>
	);
};
