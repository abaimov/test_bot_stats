import { Bot } from "grammy";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const bot = new Bot(process.env.TOKEN);

// Получаем текущую директорию
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Файл для хранения пользователей
const filePath = path.join(__dirname, 'users.json');
const writeInterval = 60000; // Время между записями в файл (60 секунд)

// Буфер для временного хранения данных пользователей
let userBuffer = {
    users: [],
    botInfo: {
        id: null,
        name: null
    }
};

// Функция для преобразования языка в 'ru' или 'не ru'
function getLanguageLabel(languageCode) {
    return languageCode === 'ru' ? 'ru' : 'не ru';
}

// Функция для добавления данных в буфер
function addUserToBuffer(user) {
    userBuffer.users.push(user);
}

// Асинхронная функция для периодической записи данных в файл
async function flushBufferToFile() {
    try {
        const dataToWrite = JSON.stringify(userBuffer, null, 2); // форматируем с отступами
        await fs.promises.writeFile(filePath, dataToWrite);
        console.log("Буфер записан в файл.");
    } catch (err) {
        console.error("Ошибка записи в файл:", err);
    }
}

// Периодически записываем данные из буфера в файл
setInterval(flushBufferToFile, writeInterval);

bot.command("start", async (ctx) => {
    console.log("Команда /start получена");

    const user = {
        telegramId: ctx.from.id,
        languageCode: ctx.from.language_code || "",
        username: ctx.from.username || "",
        time: new Date(ctx.message.date * 1000).toLocaleString('ru-RU', {
            timeZone: 'Europe/Moscow',
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            second: 'numeric'
        }),
        firstName: ctx.from.first_name || "",
        lastName: ctx.from.last_name || "",
    };

    // Добавляем данные пользователя в буфер
    addUserToBuffer(user);

    try {
        await ctx.reply("Привет");
    } catch (e) {
        console.log(`Не удалось отправить сообщение`, e);
    }
});

bot.command("count", async (ctx) => {
    console.log("Команда /count получена");

    try {
        const botInfo = await bot.api.getMe();
        const message = `ID бота: ${botInfo.id}\nИмя бота: ${botInfo.first_name}\n\n` +
            `Количество пользователей с языком 'ru': ${userBuffer.users.filter(user => user.languageCode === 'ru').length}\n` +
            `Количество пользователей с другим языком: ${userBuffer.users.filter(user => user.languageCode !== 'ru').length}\n` +
            `Общее количество пользователей: ${userBuffer.users.length}`;

        await ctx.reply(message);
    } catch (e) {
        console.log(`Не удалось отправить сообщение`, e);
    }
});

bot.command("clear", async (ctx) => {
    console.log("Команда /clear получена");

    // Очищаем буфер
    userBuffer = {
        users: [],
        botInfo: userBuffer.botInfo // Сохраняем информацию о боте
    };

    // Сразу записываем очищенный буфер в файл
    await flushBufferToFile();

    try {
        await ctx.reply("Статистика успешно очищена.");
    } catch (e) {
        console.log(`Не удалось отправить сообщение`, e);
    }
});

// Убедитесь, что бот правильно обрабатывает завершение работы
process.on('SIGINT', async () => {
    console.log("Завершение работы...");
    await flushBufferToFile(); // Записываем буфер в файл перед завершением работы
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log("Завершение работы...");
    await flushBufferToFile(); // Записываем буфер в файл перед завершением работы
    process.exit(0);
});

// Получаем и сохраняем информацию о боте
(async () => {
    try {
        const botInfo = await bot.api.getMe();
        userBuffer.botInfo = {
            id: botInfo.id,
            name: botInfo.first_name
        };
    } catch (e) {
        console.error('Не удалось получить информацию о боте:', e);
    }
})();

bot.start();
