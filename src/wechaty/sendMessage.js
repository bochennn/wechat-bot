import dotenv from 'dotenv'
// 加载环境变量
dotenv.config()
const env = dotenv.config().parsed // 环境参数

// 从环境变量中导入机器人的名称
const botName = env.BOT_NAME

// 从环境变量中导入需要自动回复的消息前缀，默认配空串或不配置则等于无前缀
const autoReplyPrefix = env.AUTO_REPLY_PREFIX ? env.AUTO_REPLY_PREFIX : ''

// 从环境变量中导入联系人白名单
const senderWhiteList = env.ALIAS_WHITELIST ? env.ALIAS_WHITELIST.split(',') : []

// 从环境变量中导入群聊白名单
const groupWhiteList = env.ROOM_WHITELIST ? env.ROOM_WHITELIST.split(',') : []

import { getServe } from './serve.js'

/**
 * 默认消息发送
 * @param msg
 * @param bot
 * @param ServiceType 服务类型 'GPT' | 'Kimi'
 * @returns {Promise<void>}
 */
export async function defaultMessage(msg, bot, ServiceType = 'GPT') {
  // const getReply = getServe(ServiceType)
  const sender = msg.talker()
  // const receiver = msg.to()
  const content = msg.text() // 消息内容

  const senderName = await sender.name() || null // wechat name
  const groupName = (await msg.room()?.topic()) || null

  const isBotSelf = botName === senderName
  const inWhiteList = senderWhiteList.includes(senderName) ||
    (groupWhiteList.includes(groupName) && content.includes(`${botName}`))
  const replySender = !isBotSelf && inWhiteList

  if (!replySender) return
  try {
    // message type: wechaty-puppet/src/schemas/message.ts
    if (msg.type() === bot.Message.Type.Text) {
      console.log('Sender', senderName)
      // const response = await getReply(content)
      // setTimeout(() => console.log('sleep 10s'), 10000);
      console.log('Text Message', content)
    }
    // 区分群聊和私聊
    // if (isRoom && room) {
    //   const question = (await msg.mentionText()) || content.replace(`${botName}`, '') // 去掉艾特的消息主体
    //   console.log('🌸🌸🌸 / question: ', question)
    //   const response = await getReply(question)
    //   await room.say(response)
    // }
    // // 私人聊天，白名单内的直接发送
    // if (isAlias && !room) {
    //   console.log('🌸🌸🌸 / content: ', content)
    //   const response = await getReply(content)
    //   await contact.say(response)
    // }
  } catch (e) {
    console.error(e)
  }
}

/**
 * 分片消息发送
 * @param message
 * @param bot
 * @returns {Promise<void>}
 */
export async function shardingMessage(message, bot) {
  const talker = message.talker()
  const isText = message.type() === bot.Message.Type.Text // 消息类型是否为文本
  if (talker.self() || message.type() > 10 || (talker.name() === '微信团队' && isText)) {
    return
  }
  const text = message.text()
  const room = message.room()
  if (!room) {
    console.log(`Chat GPT Enabled User: ${talker.name()}`)
    const response = await getChatGPTReply(text)
    await trySay(talker, response)
    return
  }
  let realText = splitMessage(text)
  // 如果是群聊但不是指定艾特人那么就不进行发送消息
  if (text.indexOf(`${botName}`) === -1) {
    return
  }
  realText = text.replace(`${botName}`, '')
  const topic = await room.topic()
  const response = await getChatGPTReply(realText)
  const result = `${realText}\n ---------------- \n ${response}`
  await trySay(room, result)
}

// 分片长度
const SINGLE_MESSAGE_MAX_SIZE = 500

/**
 * 发送
 * @param talker 发送哪个  room为群聊类 text为单人
 * @param msg
 * @returns {Promise<void>}
 */
async function trySay(talker, msg) {
  const messages = []
  let message = msg
  while (message.length > SINGLE_MESSAGE_MAX_SIZE) {
    messages.push(message.slice(0, SINGLE_MESSAGE_MAX_SIZE))
    message = message.slice(SINGLE_MESSAGE_MAX_SIZE)
  }
  messages.push(message)
  for (const msg of messages) {
    await talker.say(msg)
  }
}

/**
 * 分组消息
 * @param text
 * @returns {Promise<*>}
 */
async function splitMessage(text) {
  let realText = text
  const item = text.split('- - - - - - - - - - - - - - -')
  if (item.length > 1) {
    realText = item[item.length - 1]
  }
  return realText
}
