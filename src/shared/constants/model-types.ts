export const MODEL_TYPES = {
TEST: 'test', 
} as const

export type ModelType = (typeof MODEL_TYPES)[keyof typeof MODEL_TYPES]
