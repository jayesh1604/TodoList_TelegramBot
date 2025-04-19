const TelegramBot = require('node-telegram-bot-api');
const token = 'ADD_TOKEN';
const bot = new TelegramBot(token, { polling: true });
const schedule = require('node-schedule');
const userTodos = {};

bot.onText(/\/start/, msg => {
  bot.sendMessage(msg.chat.id, 'Welcome! Use /add [TASK | HH:MM], /list, /remove [TASK NUMBER]');
});

bot.onText(/\/add (.+)\s\|\s(\d{1,2}:\d{2})/, (msg, match) => {
  const chatId = msg.chat.id;
  const task = match[1];
  const time = match[2];

  if (!userTodos[chatId]) userTodos[chatId] = [];

  const now = new Date();
  const [hours, minutes] = time.split(':').map(Number);
  const reminderTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0);

  if (reminderTime < now) {
    bot.sendMessage(chatId, 'That time is already passed today. Try again.');
    return;
  }

  userTodos[chatId].push({ task, time });

  // Schedule reminder
  schedule.scheduleJob(reminderTime, () => {
    bot.sendMessage(chatId, `⏰ Reminder: "${task}"`);
  });

  bot.sendMessage(chatId, `Added: "${task}" at ${time}`);
});

bot.onText(/\/list/, msg => {
  const chatId = msg.chat.id;
  const todos = userTodos[chatId] || [];

  if (todos.length === 0) {
    bot.sendMessage(chatId, 'No tasks yet!');
  } else {
    const list = todos.map((t, i) => `${i + 1}. ${t.task} at ${t.time}`).join('\n');
    bot.sendMessage(chatId, 'Your tasks:\n' + list);
  }
});

bot.onText(/\/remove (\d+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const index = parseInt(match[1]) - 1;

  if (userTodos[chatId] && userTodos[chatId][index]) {
    const removed = userTodos[chatId].splice(index, 1);
    bot.sendMessage(chatId, `Removed: "${msg}"`);
  } else {
    bot.sendMessage(chatId, 'Invalid task number.');
  }
});
