import "https://deno.land/x/dotenv@v3.2.0/load.ts";
import { Bot } from "https://deno.land/x/grammy@v1.10.1/mod.ts";
import { InlineQueryResult } from "https://deno.land/x/grammy@v1.10.1/platform.deno.ts";

const token = Deno.env.get("DECIDE_ROBOT_TOKEN");
const pic_id = Deno.env.get("REPLY_PIC_ID");

if (token === undefined || token === null) {
  console.warn("Bot token is not set. Aborting...");
  Deno.exit(1);
}

const yesOrNoOptions = ["Да", "Нет"];
const rouletteOptions = [
  "*Бах!*",
  "*Клик*",
  "*Клик*",
  "*Клик*",
  "*Клик*",
  "*Клик*",
];
const elkOptions = [
  "Да",
  "Нет",
  "Это не важно",
  "Спок, бро",
  "Толсто",
  "Да, хотя зря",
  "Никогда",
  "100%",
  "1 из 100",
  "Еще разок",
];

const choice = <T>(variants: Array<T>): T =>
  variants[Math.floor(Math.random() * variants.length)];
const capitalizeFirstLetter = (str: string): string =>
  str.charAt(0).toUpperCase() + str.slice(1);
const yesOrNo = (): string => choice(yesOrNoOptions);
const roulette = (): string => choice(rouletteOptions);
const elk = (): string => choice(elkOptions);
const formatQuery = (query: string): string =>
  capitalizeFirstLetter(query.replaceAll("?", "").trim());

function generateInlineReply(
  title: string,
  question: string,
  answer: string,
): InlineQueryResult {
  return {
    type: "article",
    id: crypto.randomUUID(),
    title: title,
    input_message_content: {
      message_text: `${question}? <b>${answer}.</b>`,
      parse_mode: "HTML",
    },
  };
}

const bot = new Bot(token);

bot.inlineQuery(/.*( или .*)+/, async (ctx) => {
  const query = formatQuery(ctx.inlineQuery.query);
  const options = query.split(" или ").map(
    capitalizeFirstLetter,
  );

  await ctx.answerInlineQuery([
    generateInlineReply(
      "Выбрать из вариантов.",
      options.join(" или "),
      choice(options),
    ),
    generateInlineReply("Да или нет?", query, yesOrNo()),
    generateInlineReply("Рулетка.", query, roulette()),
    generateInlineReply("Сакральный олень.", query, elk()),
  ], { cache_time: 0 });
});

bot.on("inline_query", async (ctx) => {
  const query = formatQuery(ctx.inlineQuery.query);

  if (query === "") {
    await ctx.answerInlineQuery([], { cache_time: 30 * 24 * 3600 });
  }

  await ctx.answerInlineQuery([
    generateInlineReply("Да или нет?", query, yesOrNo()),
    generateInlineReply("Рулетка.", query, roulette()),
    generateInlineReply("Сакральный олень.", query, elk()),
  ], { cache_time: 0 });
});

const sosat_regex = /[рp][уy][сc]ня ?([--—] ?)?[сc][oо][cс][aа]ть/;

if (typeof pic_id === 'string') {
  bot.on("message:text", async (ctx) => {
    if (sosat_regex.test(ctx.msg.text.toLowerCase())) {
      await bot.api.sendSticker(ctx.chat.id, pic_id, {
        reply_to_message_id: ctx.msg.message_id,
      });
    }
  });
}

await bot.init();
console.log(`${bot.botInfo.username} is running...`);
await bot.start();
