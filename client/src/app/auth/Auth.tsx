"use client";

import axios from "axios";
import { useState } from "react";
import { deviceDetect } from "react-device-detect";

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

				// Получаем данные об устройстве
				const deviceInfo = deviceDetect(navigator.userAgent);

				// Добавляем дополнительные данные
				const fullDeviceInfo = {
					browser: deviceInfo.browserName,
					browserVersion: deviceInfo.browserVersion,
					deviceType: deviceInfo.deviceType,
					os: deviceInfo.osName,
					isMobile: deviceInfo.isMobile,
					userAgent: navigator.userAgent,
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
		} catch (err) {
			setError("Произошла ошибка при проверке кода");
		} finally {
			setLoading(false);
		}
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
				</div>
			)}
		</div>
	);
};
