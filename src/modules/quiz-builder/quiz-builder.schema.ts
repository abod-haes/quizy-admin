import { z } from 'zod'

import { arrayOfUuid, nonNegativeInt, requiredString, uuidField } from '@/shared/validation/primitives'

export const quizAnswerSchema = z.object({
  title: requiredString(),
  isCorrect: z.boolean(),
})

export const quizQuestionSchema = z.object({
  title: requiredString(),
  hint: z.string().default(''),
  description: z.string().default(''),
  lessonIds: z.array(uuidField()).min(1, 'validation.lessonRequired'),
  answers: z.array(quizAnswerSchema).min(2, 'validation.answersRequired'),
  order: nonNegativeInt(),
  fileIds: arrayOfUuid(),
}).refine((question) => question.answers.some((answer) => answer.isCorrect), {
  message: 'validation.correctAnswerRequired',
  path: ['answers'],
})

export const quizCreateSchema = z.object({
  teacherId: requiredString(),
  timeExpiration: nonNegativeInt(),
  isFree: z.boolean(),
  entityIds: arrayOfUuid(),
  questions: z.array(quizQuestionSchema).min(1, 'validation.questionsRequired'),
})

export type QuizAnswerForm = z.infer<typeof quizAnswerSchema>
export type QuizQuestionForm = z.infer<typeof quizQuestionSchema>
export type QuizCreateForm = z.infer<typeof quizCreateSchema>
