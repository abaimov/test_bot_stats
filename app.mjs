import { Bot } from "grammy";
import fs from "fs";
import path from "path";
import dotenv from 'dotenv';

dotenv.config();

const bot = new Bot(process.env.TOKEN);

// Файл для хранения пользователей
const filePath = path.join(__dirname, 'users.json');
const writeInterval = 60000; // Время между записями в файл (60 секунд)

// Буфер для временного хранения данных пользователей
const userBuffer = {
    ru: 0,
    notRu: 0,
    total: 0
};

// Функция для преобразования языка в 'ru' или 'не ru'
function getLanguageLabel(languageCode) {
    return languageCode === 'ru' ? 'ru' : 'не ru';
}

// Функция для добавления данных в буфер
function addUserToBuffer(languageLabel) {
    if (languageLabel === 'ru') {
        userBuffer.ru += 1;
    } else {
        userBuffer.notRu += 1;
    }
    userBuffer.total += 1;
}

// Асинхронная функция для периодической записи данных в файл
async function flushBufferToFile() {
    const dataToWrite = JSON.stringify(userBuffer) + '\n';
    fs.appendFile(filePath, dataToWrite, (err) => {
        if (err) {
            console.error("Ошибка записи в файл:", err);
        } else {
            console.log("Буфер записан в файл.");
            // Очищаем буфер после записи
            userBuffer.ru = 0;
            userBuffer.notRu = 0;
            userBuffer.total = 0;
        }
    });
}

// Периодически записываем данные из буфера в файл
setInterval(flushBufferToFile, writeInterval);

bot.command("start", async (ctx) => {
    console.log("Команда /start получена");

    const languageLabel = getLanguageLabel(ctx.from.language_code);

    // Добавляем данные пользователя в буфер
    addUserToBuffer(languageLabel);

    try {
        await ctx.reply("Привет");
    } catch (e) {
        console.log(`Не удалось отправить сообщение`, e);
    }
});

bot.command("count", async (ctx) => {
    console.log("Команда /count получена");

    const message = `Пользователи с языком 'ru': ${userBuffer.ru}\nПользователи с другим языком: ${userBuffer.notRu}\nОбщее количество пользователей: ${userBuffer.total}`;

    try {
        await ctx.reply(message);
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

bot.start();
