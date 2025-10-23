import "dotenv/config";
import moment from "moment-timezone";
import TelegramBot from "node-telegram-bot-api";
import getAccessToken from "./server/plugins/auth";
import getCurrentData from "./server/plugins/current";
import exportData from "./server/plugins/export";

class Handler {
    constructor(private readonly bot: TelegramBot) {
        bot.setMyCommands([
            { command: "/start", description: "Start interacting with the bot" },
            { command: "/help", description: "Get help using the bot" },
            { command: "/status", description: "Get solar panel status" },
            { command: "/export", description: "Export data" },
        ]);

        bot.on("message", (msg) => this.handleMessage(msg));
        bot.on("polling_error", (error) => {
            console.error("[Telegram] Polling error:", error.message || error);
        });
    }

    async handleMessage(msg: TelegramBot.Message) {
        const chatId = msg.chat.id;
        const messageText = msg.text?.trim() || "";

        try {
            switch (messageText) {
                case "/start":
                    await this.bot.sendMessage(chatId, "Hello! I'm your friendly bot. How can I assist you today?");
                    break;
                case "/help":
                    await this.handleHelp(chatId);
                    break;
                case "/status":
                    await this.handleStatus(chatId);
                    break;
                default:
                    if (messageText.startsWith("/export")) {
                        await this.handleExport(chatId, messageText);
                        return;
                    }
                    await this.bot.sendMessage(chatId, "I'm sorry, I didn't understand that command. Type /help for a list of commands.");
                    break;
            }
        } catch (error: any) {}
    }

    async handleHelp(chatId: number) {
        const helpMessage =
            "Here are the commands you can use:\n" +
            "/start - Start interacting with the bot\n" +
            "/help - Get help using the bot\n" +
            "/status - Get solar panel status\n" +
            "/export - Export data\n\n" +
            "optional: /export [start_date] [end_date], format: YYYY-MM-DD\n" +
            "If no dates are provided, data from the last 24 hours will be exported.";
        await this.bot.sendMessage(chatId, helpMessage);
    }

    async handleStatus(chatId: number) {
        const authToken = await getAccessToken();
        const status = await getCurrentData("Bearer " + authToken.token);
        const statusMessage =
            `Solar Panel Status:\n` +
            `Voltage: ${status!.voltage}V\n` +
            `Current: ${status!.current}A\n` +
            `Power Output: ${status!.current * status!.voltage}W\n` +
            `Temperature: ${status!.temperature}°C\n` +
            `Light Intensity: ${status!.light} lux`;

        await this.bot.sendMessage(chatId, statusMessage);
    }

    async handleExport(chatId: number, msg: string) {
        const [p1, p2] = msg.split(" ").slice(1);
        if (p1 && !moment(p1, "YYYY-MM-DD", true).isValid()) {
            await this.bot.sendMessage(chatId, "Invalid start date format. Please use YYYY-MM-DD.");
            return;
        }

        if (p2 && !moment(p2, "YYYY-MM-DD", true).isValid()) {
            await this.bot.sendMessage(chatId, "Invalid end date format. Please use YYYY-MM-DD.");
            return;
        }

        const start = p1 ? moment(p1, "YYYY-MM-DD").startOf("day").valueOf() : moment().subtract(1, "days").valueOf();
        const end = p2 ? moment(p2, "YYYY-MM-DD").endOf("day").valueOf() : moment().valueOf();

        const authToken = await getAccessToken();
        const data = await exportData("Bearer " + authToken.token, start, end);
        if (!data) {
            await this.bot.sendMessage(chatId, "No data available for the specified date range.");
            return;
        }
        const csvBuffer = Buffer.from(data, "utf8");
        const filename = `solar_panel_data_${new Date().toISOString().split("T")[0]}.csv`;
        await this.bot.sendDocument(chatId, csvBuffer, {}, { filename, contentType: "text/csv" });
    }
}

async function init() {
    if (process.env.TELEGRAM_BOT_TOKEN) {
        const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, {
            polling: true,
        });

        console.log("Telegram bot initialized.");
        new Handler(bot);
        return bot;
    }
    throw new Error("TELEGRAM_BOT_TOKEN is not set in environment variables.");
}

init();
