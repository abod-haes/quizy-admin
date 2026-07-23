export type AiChatSettings = {
  freeDailyTokenLimit: number
  freeDailyMessageLimit: number
  maxInputCharacters: number
  plusDailyTokenLimit: number
  plusDailyMessageLimit: number
  proDailyTokenLimit: number
  proDailyMessageLimit: number
  ultraDailyTokenLimit: number
  ultraDailyMessageLimit: number
}

export const EMPTY_AI_CHAT_SETTINGS: AiChatSettings = {
  freeDailyTokenLimit: 1,
  freeDailyMessageLimit: 1,
  maxInputCharacters: 1,
  plusDailyTokenLimit: 1,
  plusDailyMessageLimit: 1,
  proDailyTokenLimit: 1,
  proDailyMessageLimit: 1,
  ultraDailyTokenLimit: 1,
  ultraDailyMessageLimit: 1,
}
