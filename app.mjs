import {Bot} from "grammy";
import fs from "fs";
import dotenv from 'dotenv';

dotenv.config();

const bot = new Bot(process.env.TOKEN_SECOND);

// Функция для преобразования времени в локальное московское время
function getMoscowTime(unixTimestamp) {
    const date = new Date(unixTimestamp * 1000);
    const options = {
        timeZone: 'Europe/Moscow',
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric'
    };
    return date.toLocaleString('ru-RU', options);
}

bot.command("start", async (ctx) => {
    console.log("Команда /start получена");

    const user = {
        telegramId: ctx.from.id,
        languageCode: ctx.from.language_code || "",
        username: ctx.from.username || "",
        time: getMoscowTime(ctx.message.date) || "",
        firstName: ctx.from.first_name || "",
        lastName: ctx.from.last_name || "",
    };

    // Проверяем, чтобы не записывать дублирующиеся данные
    const userStream = fs.createWriteStream('users.json', {flags: 'a'});
    userStream.write(JSON.stringify(user) + "," + '\n', () => {
        userStream.end();
    });

    try {
        await ctx.reply("Привет");
        // await ctx.api.deleteMessage(ctx.chat.id, ctx.message.message_id);
    } catch (e) {
        console.log(`Не удалось отправить сообщение`, e);
    }
});

// Убедитесь, что бот правильно обрабатывает завершение работы
process.on('SIGINT', () => {
    console.log("Завершение работы...");
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log("Завершение работы...");
    process.exit(0);
});

bot.start();
