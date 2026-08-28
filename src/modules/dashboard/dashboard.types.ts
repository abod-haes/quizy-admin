export type DashboardSummary = {
  studentsCount: number
  teachersCount: number
  quizzesCount: number
  questionsCount: number
  coursesCount: number
  qrCodesCount: number
  employeesCount: number
}

export type DashboardTrendPoint = {
  date: string
  count: number
}

export type DashboardOverview = {
  summary: DashboardSummary
  periodDays: number
  performance: {
    quizSessionsCount: number
    answeredQuestionsCount: number
    accuracyPercentage: number
  }
  studentGrowth: DashboardTrendPoint[]
  quizActivity: DashboardTrendPoint[]
}
