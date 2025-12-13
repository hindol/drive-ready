import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Question } from './data/questions'
import { questionBank, getReferenceLink } from './data/questions'
import './App.css'
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignOutButton,
  UserButton,
} from '@clerk/clerk-react'

type Stat = {
  label: string
  value: string
}

type SupportedStateCode = 'WA'

type StateContent = {
  available: boolean
  hero: {
    title: string
    description: string
  }
  stats: Stat[]
  checklist: string[]
  supportNote?: string
}

type ReviewRating = 'again' | 'hard' | 'good' | 'easy'

type ReviewCard = {
  id: Question['id']
  ease: number
  interval: number
  due: string
  lastReviewed: string
  streak: number
  totalReviews: number
}

type ReviewStore = Record<string, Record<number, ReviewCard>>

type PracticeHistory = Record<string, number>

type PracticeCalendarDay = {
  date: Date
  key: string
  questions: number
  isToday: boolean
  isPast: boolean
  isFuture: boolean
}

const REVIEW_STORAGE_KEY = 'driveready-srs-v1'
const LEGACY_REVIEW_STORAGE_KEY = 'drivingtestapp-srs-v1'
const INITIAL_EASE = 2.5
const MIN_EASE = 1.3
const SESSION_STORAGE_KEY = 'driveready-session-v1'
const LEGACY_SESSION_STORAGE_KEY = 'drivingtestapp-session-v1'
const PRACTICE_GOAL_QUESTIONS = 10
const PRACTICE_GOAL_QUERY_PARAM = 'practiceGoal'
const MOCK_QUESTION_COUNT_QUERY_PARAM = 'mockQuestions'
const PRACTICE_CALENDAR_DAYS_IN_WEEK = 7
const PRACTICE_HISTORY_STORAGE_KEY = 'driveready-practice-history-v1'
const LEGACY_PRACTICE_HISTORY_STORAGE_KEY = 'drivingtestapp-practice-history-v1'
const EMPTY_REVIEW_DATA: Record<number, ReviewCard> = {}
const DEFAULT_TIME_ZONE = 'UTC'

type PersistedTestState = {
  status: 'idle' | 'in-progress' | 'complete'
  questionIds: number[]
  currentQuestionIndex: number
  responses: Record<number, number>
  questionExposure?: Record<number, number>
  presentedQuestions?: Question[]
}

type PersistedReviewState = {
  status: 'idle' | 'reviewing' | 'complete'
  queueIds: number[]
  index: number
  revealed: boolean
  selectedChoice: number | null
  log: ReviewRating[]
}

type PersistedSession = {
  id: string
  stateCode?: SupportedStateCode
  test?: PersistedTestState
  review?: PersistedReviewState
  practiceHistory?: PracticeHistory
  timeZone?: string
  testDayKey?: string
}

const detectBrowserTimeZone = (): string | undefined => {
  if (typeof window === 'undefined') {
    return undefined
  }
  if (
    typeof Intl === 'undefined' ||
    typeof Intl.DateTimeFormat !== 'function'
  ) {
    return undefined
  }
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch {
    return undefined
  }
}

const toISODateString = (date: Date): string => date.toISOString().slice(0, 10)

const getDateFromKey = (key: string): Date => new Date(`${key}T00:00:00.000Z`)

const shiftDateKey = (key: string, offset: number): string => {
  if (offset === 0) {
    return key
  }
  const cursor = getDateFromKey(key)
  cursor.setUTCDate(cursor.getUTCDate() + offset)
  return toISODateString(cursor)
}

const createSessionId = (): string => {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return crypto.randomUUID()
  }
  return `session-${Math.random().toString(36).slice(2, 10)}`
}
const ratingLabels: Record<ReviewRating, { label: string; className: string }> =
  {
    again: { label: 'Again', className: 'text-bg-danger' },
    hard: { label: 'Hard', className: 'text-bg-warning' },
    good: { label: 'Good', className: 'text-bg-primary' },
    easy: { label: 'Easy', className: 'text-bg-success' },
  }

const getStartOfToday = (timeZone?: string): Date => {
  if (!timeZone) {
    const date = new Date()
    date.setHours(0, 0, 0, 0)
    return date
  }
  const todayKey = getDateKey(new Date(), timeZone)
  return getDateFromKey(todayKey)
}

const addDays = (date: Date, days: number): Date => {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  result.setHours(0, 0, 0, 0)
  return result
}

const computeNextReviewCard = (
  questionId: Question['id'],
  existing: ReviewCard | undefined,
  rating: ReviewRating,
  timeZone?: string,
): ReviewCard => {
  const today = getStartOfToday(timeZone)
  const lastInterval = existing?.interval ?? 0
  let ease = existing?.ease ?? INITIAL_EASE
  let nextInterval = lastInterval > 0 ? lastInterval : 1

  switch (rating) {
    case 'again':
      nextInterval = 1
      ease = Math.max(MIN_EASE, ease - 0.2)
      break
    case 'hard':
      nextInterval = Math.max(
        1,
        lastInterval === 0 ? 1 : Math.round(lastInterval * 1.2),
      )
      ease = Math.max(MIN_EASE, ease - 0.15)
      break
    case 'good':
      if (lastInterval === 0) {
        nextInterval = 1
      } else if (lastInterval === 1) {
        nextInterval = 3
      } else {
        nextInterval = Math.max(1, Math.round(lastInterval * ease))
      }
      break
    case 'easy':
      nextInterval =
        lastInterval === 0
          ? 4
          : Math.max(1, Math.round(lastInterval * ease * 1.3))
      ease = Math.min(2.8, ease + 0.15)
      break
    default:
      break
  }

  const normalizedInterval = Math.max(1, Math.round(nextInterval))
  const dueDate = addDays(today, normalizedInterval)

  return {
    id: questionId,
    ease: Number(ease.toFixed(2)),
    interval: normalizedInterval,
    due: dueDate.toISOString(),
    lastReviewed: today.toISOString(),
    streak: rating === 'again' ? 0 : (existing?.streak ?? 0) + 1,
    totalReviews: (existing?.totalReviews ?? 0) + 1,
  }
}

const shuffleQuestions = <T,>(items: T[], count: number): T[] => {
  const copy = [...items]
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapWith = Math.floor(Math.random() * (index + 1))
    ;[copy[index], copy[swapWith]] = [copy[swapWith], copy[index]]
  }
  return copy.slice(0, count)
}

const shuffleAll = <T,>(items: T[]): T[] =>
  shuffleQuestions(items, items.length)

const shuffleQuestionChoices = (question: Question): Question => {
  const choiceCount = question.choices.length
  if (choiceCount <= 1) {
    return { ...question, choices: [...question.choices] }
  }

  const indices = question.choices.map(
    (_choice: string, index: number): number => index,
  )
  for (let position = indices.length - 1; position > 0; position -= 1) {
    const swapWith = Math.floor(Math.random() * (position + 1))
    ;[indices[position], indices[swapWith]] = [
      indices[swapWith],
      indices[position],
    ]
  }

  const shuffledChoices = indices.map(
    (originalIndex: number) => question.choices[originalIndex],
  )
  const shuffledAnswerIndex = indices.indexOf(question.answerIndex)

  return {
    ...question,
    choices: shuffledChoices,
    answerIndex: shuffledAnswerIndex,
  }
}

const ACTIVE_STATE_CODE: SupportedStateCode = 'WA'

const washingtonContent: StateContent = {
  available: true,
  hero: {
    title: 'Washington Driving Test Mock Exam Suite',
    description:
      'Recreate Washington knowledge and driving exams with targeted study modules, detailed answer explanations, and free community resources.',
  },
  stats: [
    { label: 'Knowledge test questions', value: '40' },
    { label: 'Passing score', value: '80%' },
    { label: 'Time limit', value: '45 minutes' },
  ],
  checklist: [
    'Bring photo ID, proof of Washington residency, and your driver training certificate.',
    'Practice parallel parking, hill starts, and backing around a corner before exam day.',
    'Plan to arrive 15 minutes early at your testing location to complete paperwork.',
    'Review Right of Way rules for four-way stops and flashing yellow arrows.',
    'Confirm that your testing vehicle meets safety requirements and has valid insurance.',
  ],
  supportNote: 'Aligned with Washington driver testing guidelines.',
}

const QUESTIONS_PER_ATTEMPT = 10

const getDateKey = (date: Date, timeZone?: string): string => {
  if (
    timeZone &&
    typeof Intl !== 'undefined' &&
    typeof Intl.DateTimeFormat === 'function'
  ) {
    try {
      return new Intl.DateTimeFormat('en-CA', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(date)
    } catch {
      // fall back to ISO string
    }
  }
  return toISODateString(date)
}

const buildPracticeWeek = (
  history: PracticeHistory,
  weekOffset: number,
  timeZone?: string,
): PracticeCalendarDay[] => {
  const todayKey = getDateKey(new Date(), timeZone)
  const anchorKey = shiftDateKey(
    todayKey,
    weekOffset * PRACTICE_CALENDAR_DAYS_IN_WEEK,
  )
  const days: PracticeCalendarDay[] = []

  for (let dayOffset = -3; dayOffset <= 3; dayOffset += 1) {
    const key = shiftDateKey(anchorKey, dayOffset)
    const date = getDateFromKey(key)
    days.push({
      date,
      key,
      questions: history[key] ?? 0,
      isToday: key === todayKey,
      isPast: key < todayKey,
      isFuture: key > todayKey,
    })
  }

  return days
}

const computePracticeStreak = (
  history: PracticeHistory,
  goal: number,
  timeZone?: string,
): number => {
  let streak = 0
  const cursor = getDateFromKey(getDateKey(new Date(), timeZone))

  while (streak < 365) {
    const key = toISODateString(cursor)
    if ((history[key] ?? 0) >= goal) {
      streak += 1
      cursor.setUTCDate(cursor.getUTCDate() - 1)
    } else {
      break
    }
  }

  return streak
}

function App() {
  const [userTimeZone, setUserTimeZone] = useState<string | undefined>(() =>
    detectBrowserTimeZone(),
  )
  const [practiceWeekOffset, setPracticeWeekOffset] = useState(0)
  const stateCode: SupportedStateCode = ACTIVE_STATE_CODE
  const content = washingtonContent
  const fallbackTimeZone = useMemo(() => detectBrowserTimeZone(), [])
  const resolvedTimeZone = userTimeZone ?? fallbackTimeZone ?? DEFAULT_TIME_ZONE
  const activeQuestionBank = useMemo<Question[]>(
    () => questionBank[stateCode] ?? [],
    [stateCode],
  )
  const practiceGoalTarget = useMemo(() => {
    if (typeof window === 'undefined') {
      return PRACTICE_GOAL_QUESTIONS
    }
    const params = new URLSearchParams(window.location.search)
    const overrideValue = params.get(PRACTICE_GOAL_QUERY_PARAM)
    if (!overrideValue) {
      return PRACTICE_GOAL_QUESTIONS
    }
    const parsed = Number(overrideValue)
    if (
      Number.isFinite(parsed) &&
      parsed >= 1 &&
      parsed <= PRACTICE_GOAL_QUESTIONS
    ) {
      return Math.round(parsed)
    }
    return PRACTICE_GOAL_QUESTIONS
  }, [])
  const questionCountOverride = useMemo(() => {
    if (typeof window === 'undefined') {
      return undefined
    }
    const params = new URLSearchParams(window.location.search)
    const overrideValue = params.get(MOCK_QUESTION_COUNT_QUERY_PARAM)
    if (!overrideValue) {
      return undefined
    }
    const parsed = Number(overrideValue)
    if (
      Number.isFinite(parsed) &&
      parsed >= 1 &&
      parsed <= QUESTIONS_PER_ATTEMPT
    ) {
      return Math.round(parsed)
    }
    return undefined
  }, [])
  const questionTargetCount = activeQuestionBank.length
    ? Math.min(
        questionCountOverride ?? QUESTIONS_PER_ATTEMPT,
        activeQuestionBank.length,
      )
    : 0
  const [testStatus, setTestStatus] = useState<
    'idle' | 'in-progress' | 'complete'
  >('idle')
  const [testQuestions, setTestQuestions] = useState<Question[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [responses, setResponses] = useState<Record<Question['id'], number>>({})
  const [questionExposureCounts, setQuestionExposureCounts] = useState<
    Record<number, number>
  >({})
  const [reviewStore, setReviewStore] = useState<ReviewStore>({})
  const [reviewStatus, setReviewStatus] = useState<
    'idle' | 'reviewing' | 'complete'
  >('idle')
  const [reviewQueue, setReviewQueue] = useState<Question[]>([])
  const [reviewIndex, setReviewIndex] = useState(0)
  const [reviewRevealed, setReviewRevealed] = useState(false)
  const [reviewSelectedChoice, setReviewSelectedChoice] = useState<
    number | null
  >(null)
  const [reviewLog, setReviewLog] = useState<ReviewRating[]>([])
  const [manualAdjustments, setManualAdjustments] = useState<
    Record<number, ReviewRating>
  >({})
  const [practiceHistory, setPracticeHistory] = useState<PracticeHistory>({})
  const [sessionId, setSessionId] = useState('')
  const [isHydratingSession, setIsHydratingSession] = useState(true)
  const [testDayKey, setTestDayKey] = useState<string | undefined>(undefined)
  const [isReviewStoreHydrated, setIsReviewStoreHydrated] = useState(false)
  const [isPracticeHistoryHydrated, setIsPracticeHistoryHydrated] =
    useState(false)
  const [showResetDialog, setShowResetDialog] = useState(false)
  const [isResettingProgress, setIsResettingProgress] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') {
      setIsHydratingSession(false)
      setIsPracticeHistoryHydrated(true)
      return
    }
    let storedSession = window.localStorage.getItem(SESSION_STORAGE_KEY)
    let usedLegacySessionKey = false
    if (!storedSession) {
      storedSession = window.localStorage.getItem(LEGACY_SESSION_STORAGE_KEY)
      if (storedSession) {
        usedLegacySessionKey = true
      }
    }
    let parsedSession: PersistedSession | undefined
    if (storedSession) {
      try {
        parsedSession = JSON.parse(storedSession) as PersistedSession
      } catch {
        window.localStorage.removeItem(SESSION_STORAGE_KEY)
        window.localStorage.removeItem(LEGACY_SESSION_STORAGE_KEY)
      }
    }
    if (!parsedSession) {
      parsedSession = { id: createSessionId(), stateCode }
    }
    if (!parsedSession.id) {
      parsedSession.id = createSessionId()
    }
    const browserTimeZone = detectBrowserTimeZone()
    const sessionTimeZone =
      parsedSession.timeZone ?? browserTimeZone ?? DEFAULT_TIME_ZONE
    parsedSession.timeZone = sessionTimeZone
    const todayKey = getDateKey(new Date(), sessionTimeZone)
    setUserTimeZone(sessionTimeZone)
    setSessionId(parsedSession.id)
    const persistedStateCode = parsedSession.stateCode ?? stateCode
    const persistedQuestionBank: Question[] =
      questionBank[persistedStateCode] ?? []
    const questionMap = new Map<number, Question>()
    persistedQuestionBank.forEach((question) => {
      questionMap.set(question.id, question)
    })

    if (parsedSession.test) {
      let hydratedQuestions: Question[] | undefined
      if (parsedSession.test.presentedQuestions?.length) {
        hydratedQuestions = parsedSession.test.presentedQuestions
      } else if (parsedSession.test.questionIds?.length) {
        const rebuiltQuestions = parsedSession.test.questionIds
          .map((id) => questionMap.get(id))
          .filter((question): question is Question => Boolean(question))
        if (rebuiltQuestions.length) {
          hydratedQuestions = rebuiltQuestions
          parsedSession.test.presentedQuestions = rebuiltQuestions
        }
      }

      if (hydratedQuestions?.length) {
        setTestQuestions(hydratedQuestions)
        setTestStatus(parsedSession.test.status ?? 'idle')
        const normalizedIndex = Math.min(
          parsedSession.test.currentQuestionIndex ?? 0,
          hydratedQuestions.length - 1,
        )
        setCurrentQuestionIndex(Math.max(0, normalizedIndex))
        const filteredResponses = Object.entries(
          parsedSession.test.responses ?? {},
        ).reduce<Record<number, number>>((acc, [key, value]) => {
          const numericKey = Number(key)
          if (questionMap.has(numericKey)) {
            acc[numericKey] = value as number
          }
          return acc
        }, {})
        setResponses(filteredResponses)
        const hydratedExposure = Object.entries(
          parsedSession.test.questionExposure ?? {},
        ).reduce<Record<number, number>>((acc, [key, value]) => {
          const numericKey = Number(key)
          if (questionMap.has(numericKey)) {
            acc[numericKey] = value as number
          }
          return acc
        }, {})
        setQuestionExposureCounts(hydratedExposure)
      }
    }

    if (parsedSession.review && parsedSession.review.queueIds?.length) {
      const hydratedQueue = parsedSession.review.queueIds
        .map((id) => questionMap.get(id))
        .filter((question): question is Question => Boolean(question))
      if (hydratedQueue.length) {
        setReviewQueue(hydratedQueue)
        setReviewStatus(parsedSession.review.status ?? 'idle')
        const normalizedIndex = Math.min(
          parsedSession.review.index ?? 0,
          hydratedQueue.length - 1,
        )
        setReviewIndex(Math.max(0, normalizedIndex))
        setReviewRevealed(parsedSession.review.revealed ?? false)
        setReviewSelectedChoice(parsedSession.review.selectedChoice ?? null)
        setReviewLog(parsedSession.review.log ?? [])
      }
    }

    let storedPracticeHistory = window.localStorage.getItem(
      PRACTICE_HISTORY_STORAGE_KEY,
    )
    let usedLegacyPracticeHistoryKey = false
    if (!storedPracticeHistory) {
      storedPracticeHistory = window.localStorage.getItem(
        LEGACY_PRACTICE_HISTORY_STORAGE_KEY,
      )
      if (storedPracticeHistory) {
        usedLegacyPracticeHistoryKey = true
      }
    }
    let dedicatedPracticeHistory: PracticeHistory = {}
    if (storedPracticeHistory) {
      try {
        const parsed = JSON.parse(storedPracticeHistory) as PracticeHistory
        if (parsed && typeof parsed === 'object') {
          dedicatedPracticeHistory = parsed
          if (usedLegacyPracticeHistoryKey) {
            window.localStorage.setItem(
              PRACTICE_HISTORY_STORAGE_KEY,
              JSON.stringify(parsed),
            )
            window.localStorage.removeItem(LEGACY_PRACTICE_HISTORY_STORAGE_KEY)
          }
        }
      } catch {
        window.localStorage.removeItem(PRACTICE_HISTORY_STORAGE_KEY)
        window.localStorage.removeItem(LEGACY_PRACTICE_HISTORY_STORAGE_KEY)
      }
    }
    const persistedPracticeHistory =
      parsedSession.practiceHistory &&
      typeof parsedSession.practiceHistory === 'object'
        ? parsedSession.practiceHistory
        : {}
    const mergedPracticeHistory = {
      ...persistedPracticeHistory,
      ...dedicatedPracticeHistory,
    }
    const hydratedTestDayKey = parsedSession.test
      ? (parsedSession.testDayKey ??
        ((mergedPracticeHistory[todayKey] ?? 0) > 0
          ? todayKey
          : shiftDateKey(todayKey, -1)))
      : undefined
    setTestDayKey(hydratedTestDayKey)
    parsedSession.testDayKey = hydratedTestDayKey
    setPracticeHistory((previous) => {
      if (!Object.keys(previous).length) {
        return mergedPracticeHistory
      }
      return { ...mergedPracticeHistory, ...previous }
    })
    setIsPracticeHistoryHydrated(true)

    setIsHydratingSession(false)
    const normalizedSession = {
      ...parsedSession,
      stateCode: persistedStateCode,
      practiceHistory: mergedPracticeHistory,
      timeZone: sessionTimeZone,
      testDayKey: hydratedTestDayKey,
    }
    window.localStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify(normalizedSession),
    )
    if (usedLegacySessionKey) {
      window.localStorage.removeItem(LEGACY_SESSION_STORAGE_KEY)
    }
  }, [stateCode])

  useEffect(() => {
    if (typeof window === 'undefined' || !isPracticeHistoryHydrated) {
      return
    }
    if (!Object.keys(practiceHistory).length) {
      window.localStorage.removeItem(PRACTICE_HISTORY_STORAGE_KEY)
      return
    }
    window.localStorage.setItem(
      PRACTICE_HISTORY_STORAGE_KEY,
      JSON.stringify(practiceHistory),
    )
  }, [practiceHistory, isPracticeHistoryHydrated])

  useEffect(() => {
    if (typeof window === 'undefined') {
      setIsReviewStoreHydrated(true)
      return
    }
    let stored = window.localStorage.getItem(REVIEW_STORAGE_KEY)
    let usedLegacyReviewKey = false
    if (!stored) {
      stored = window.localStorage.getItem(LEGACY_REVIEW_STORAGE_KEY)
      if (stored) {
        usedLegacyReviewKey = true
      }
    }
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as ReviewStore
        setReviewStore(parsed)
        if (usedLegacyReviewKey) {
          window.localStorage.setItem(REVIEW_STORAGE_KEY, stored)
          window.localStorage.removeItem(LEGACY_REVIEW_STORAGE_KEY)
        }
      } catch {
        window.localStorage.removeItem(REVIEW_STORAGE_KEY)
        window.localStorage.removeItem(LEGACY_REVIEW_STORAGE_KEY)
      }
    }
    setIsReviewStoreHydrated(true)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined' || !isReviewStoreHydrated) {
      return
    }
    if (!Object.keys(reviewStore).length) {
      window.localStorage.removeItem(REVIEW_STORAGE_KEY)
      return
    }
    window.localStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify(reviewStore))
  }, [reviewStore, isReviewStoreHydrated])

  const totalQuestions = testQuestions.length
  const answeredCount = Object.keys(responses).length
  const correctCount = testQuestions.filter(
    (question) => responses[question.id] === question.answerIndex,
  ).length
  const progressPercent =
    totalQuestions === 0
      ? 0
      : Math.round((answeredCount / totalQuestions) * 100)
  const currentQuestion = testQuestions[currentQuestionIndex]
  const currentQuestionId = currentQuestion?.id
  const currentReferenceUrl = currentQuestion
    ? getReferenceLink(currentQuestion.reference)
    : undefined
  const todayKey = getDateKey(new Date(), resolvedTimeZone)
  const todayQuestionCount = practiceHistory[todayKey] ?? 0
  const hasMetPracticeGoal = todayQuestionCount >= practiceGoalTarget
  const practiceStreak = useMemo(
    () =>
      computePracticeStreak(
        practiceHistory,
        practiceGoalTarget,
        resolvedTimeZone,
      ),
    [practiceGoalTarget, practiceHistory, resolvedTimeZone],
  )
  const practiceCalendar = useMemo(() => {
    const days = buildPracticeWeek(
      practiceHistory,
      practiceWeekOffset,
      resolvedTimeZone,
    )
    const completedDays = days.filter(
      (day) => day.questions >= practiceGoalTarget,
    ).length
    return { days, completedDays, totalDays: days.length }
  }, [practiceGoalTarget, practiceHistory, practiceWeekOffset, resolvedTimeZone])
  const weekdayFormatter = useMemo(() => {
    if (
      typeof Intl === 'undefined' ||
      typeof Intl.DateTimeFormat !== 'function'
    ) {
      return undefined
    }
    return new Intl.DateTimeFormat(undefined, {
      weekday: 'narrow',
      timeZone: resolvedTimeZone,
    })
  }, [resolvedTimeZone])
  const dayNumberFormatter = useMemo(() => {
    if (
      typeof Intl === 'undefined' ||
      typeof Intl.DateTimeFormat !== 'function'
    ) {
      return undefined
    }
    return new Intl.DateTimeFormat(undefined, {
      day: 'numeric',
      timeZone: resolvedTimeZone,
    })
  }, [resolvedTimeZone])
  const weekRangeFormatter = useMemo(() => {
    if (
      typeof Intl === 'undefined' ||
      typeof Intl.DateTimeFormat !== 'function'
    ) {
      return undefined
    }
    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    })
  }, [])
  const isPracticeCalendarHydrating =
    isHydratingSession || !isPracticeHistoryHydrated
  const todayGoalPercent = Math.min(
    100,
    Math.round(
      (Math.min(todayQuestionCount, practiceGoalTarget) / practiceGoalTarget) *
        100,
    ),
  )
  const isLastQuestion = currentQuestionIndex === totalQuestions - 1
  const hasActiveTest = testStatus !== 'idle' && totalQuestions > 0
  const canAdvance = currentQuestion
    ? responses[currentQuestion.id] !== undefined
    : false
  const canNavigateForward =
    testStatus === 'complete' ? !isLastQuestion : canAdvance
  const selectedAnswerIndex = currentQuestion
    ? responses[currentQuestion.id]
    : undefined
  const hasSeenCurrentQuestionBefore = currentQuestionId
    ? (questionExposureCounts[currentQuestionId] ?? 0) > 1
    : false

  const activeReviewData = useMemo(
    () => reviewStore[stateCode] ?? EMPTY_REVIEW_DATA,
    [reviewStore, stateCode],
  )
  const dueQuestions = useMemo(() => {
    const todayTime = getStartOfToday(resolvedTimeZone).getTime()
    const dueList: { question: Question; dueTime: number }[] = []

    activeQuestionBank.forEach((question) => {
      const card = activeReviewData[question.id]
      if (!card) {
        dueList.push({ question, dueTime: todayTime - 1 })
        return
      }
      const dueTime = new Date(card.due).getTime()
      if (Number.isNaN(dueTime)) {
        dueList.push({ question, dueTime: todayTime - 1 })
        return
      }
      if (dueTime <= todayTime) {
        dueList.push({ question, dueTime })
      }
    })

    dueList.sort((a, b) => a.dueTime - b.dueTime)
    return dueList.map((entry) => entry.question)
  }, [activeQuestionBank, activeReviewData, resolvedTimeZone])

  const newQuestions = useMemo(
    () =>
      activeQuestionBank.filter((question) => !activeReviewData[question.id]),
    [activeQuestionBank, activeReviewData],
  )

  const upcomingWithinWeek = useMemo(() => {
    const todayTime = getStartOfToday(resolvedTimeZone).getTime()
    const oneWeek = 7 * 24 * 60 * 60 * 1000
    return activeQuestionBank.reduce((count, question) => {
      const card = activeReviewData[question.id]
      if (!card) {
        return count
      }
      const dueTime = new Date(card.due).getTime()
      if (Number.isNaN(dueTime)) {
        return count
      }
      if (dueTime > todayTime && dueTime - todayTime <= oneWeek) {
        return count + 1
      }
      return count
    }, 0)
  }, [activeQuestionBank, activeReviewData, resolvedTimeZone])

  const nextDueDate = useMemo(() => {
    const todayTime = getStartOfToday(resolvedTimeZone).getTime()
    const candidates = Object.values(activeReviewData)
      .map((card) => new Date(card.due).getTime())
      .filter((time) => !Number.isNaN(time) && time > todayTime)
    if (!candidates.length) {
      return null
    }
    return new Date(Math.min(...candidates))
  }, [activeReviewData, resolvedTimeZone])

  const nextDueLabel = useMemo(() => {
    if (!nextDueDate) {
      return 'All caught up'
    }
    return nextDueDate.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    })
  }, [nextDueDate])

  const reviewQueueCandidates = useMemo(() => {
    const seen = new Set<number>()
    const combined: Question[] = []
    ;[dueQuestions, newQuestions, activeQuestionBank].forEach((collection) => {
      collection.forEach((question) => {
        if (seen.has(question.id)) {
          return
        }
        combined.push(question)
        seen.add(question.id)
      })
    })
    return combined
  }, [dueQuestions, newQuestions, activeQuestionBank])

  const reviewReadyCount = reviewQueueCandidates.length
  const dueTodayCount = dueQuestions.length
  const newCardCount = newQuestions.length
  const dueQuestionIdSet = useMemo(
    () => new Set(dueQuestions.map((question) => question.id)),
    [dueQuestions],
  )
  const newQuestionIdSet = useMemo(
    () => new Set(newQuestions.map((question) => question.id)),
    [newQuestions],
  )
  const reviewInProgressQuestion = reviewQueue[reviewIndex]
  const reviewReferenceUrl = reviewInProgressQuestion
    ? getReferenceLink(reviewInProgressQuestion.reference)
    : undefined
  const ratingSummary = useMemo(() => {
    return reviewLog.reduce<Record<ReviewRating, number>>(
      (summary, rating) => {
        summary[rating] = (summary[rating] ?? 0) + 1
        return summary
      },
      {} as Record<ReviewRating, number>,
    )
  }, [reviewLog])

  const buildAdaptivePool = useCallback((): Question[] => {
    const seen = new Set<number>()
    const todayTime = getStartOfToday(resolvedTimeZone).getTime()
    const strugglingSet = new Set<number>()
    const strugglingQuestions = activeQuestionBank.filter((question) => {
      const card = activeReviewData[question.id]
      if (!card || dueQuestionIdSet.has(question.id)) {
        return false
      }
      const dueTime = new Date(card.due).getTime()
      const dueSoon =
        !Number.isNaN(dueTime) &&
        dueTime > todayTime &&
        dueTime - todayTime <= 3 * 24 * 60 * 60 * 1000
      const needsHelp = card.ease <= MIN_EASE + 0.2 || card.streak <= 1
      if (dueSoon || needsHelp) {
        strugglingSet.add(question.id)
        return true
      }
      return false
    })
    const laterQuestions = activeQuestionBank.filter(
      (question) =>
        !dueQuestionIdSet.has(question.id) &&
        !strugglingSet.has(question.id) &&
        !newQuestionIdSet.has(question.id),
    )
    const buckets = [
      shuffleAll(dueQuestions),
      shuffleAll(strugglingQuestions),
      shuffleAll(newQuestions),
      shuffleAll(laterQuestions),
    ]
    const merged: Question[] = []
    buckets.forEach((bucket) => {
      bucket.forEach((question) => {
        if (!seen.has(question.id)) {
          merged.push(question)
          seen.add(question.id)
        }
      })
    })
    return merged
  }, [
    activeQuestionBank,
    activeReviewData,
    dueQuestionIdSet,
    newQuestionIdSet,
    dueQuestions,
    newQuestions,
    resolvedTimeZone,
  ])

  const applyReviewRating = (questionId: number, rating: ReviewRating) => {
    setReviewStore((previous) => {
      const stateRecords = previous[stateCode] ? { ...previous[stateCode] } : {}
      const updatedCard = computeNextReviewCard(
        questionId,
        stateRecords[questionId],
        rating,
        resolvedTimeZone,
      )
      return {
        ...previous,
        [stateCode]: { ...stateRecords, [questionId]: updatedCard },
      }
    })
  }

  const incrementDailyQuestionProgress = () => {
    const key = getDateKey(new Date(), resolvedTimeZone)
    setPracticeHistory((previous) => {
      const current = previous[key] ?? 0
      return { ...previous, [key]: current + 1 }
    })
  }

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    if (isHydratingSession || !sessionId) {
      return
    }
    const persistedTest: PersistedTestState | undefined = testQuestions.length
      ? {
          status: testStatus,
          questionIds: testQuestions.map((question) => question.id),
          currentQuestionIndex: Math.min(
            currentQuestionIndex,
            Math.max(testQuestions.length - 1, 0),
          ),
          responses,
          questionExposure: questionExposureCounts,
          presentedQuestions: testQuestions,
        }
      : undefined

    const persistedReview: PersistedReviewState | undefined = reviewQueue.length
      ? {
          status: reviewStatus,
          queueIds: reviewQueue.map((question) => question.id),
          index: Math.min(reviewIndex, Math.max(reviewQueue.length - 1, 0)),
          revealed: reviewRevealed,
          selectedChoice: reviewSelectedChoice,
          log: reviewLog,
        }
      : undefined

    const persistedPracticeHistory = Object.keys(practiceHistory).length
      ? practiceHistory
      : undefined

    const payload: PersistedSession = {
      id: sessionId,
      stateCode,
      test: persistedTest,
      review: persistedReview,
      practiceHistory: persistedPracticeHistory,
      timeZone: resolvedTimeZone,
      testDayKey,
    }
    window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(payload))
  }, [
    currentQuestionIndex,
    isHydratingSession,
    practiceHistory,
    reviewIndex,
    reviewLog,
    reviewQueue,
    reviewRevealed,
    reviewSelectedChoice,
    reviewStatus,
    responses,
    questionExposureCounts,
    resolvedTimeZone,
    sessionId,
    stateCode,
    testDayKey,
    testQuestions,
    testStatus,
  ])

  const resetReviewInteractionState = () => {
    setReviewRevealed(false)
    setReviewSelectedChoice(null)
  }

  const handleStartReview = () => {
    if (!reviewQueueCandidates.length) {
      return
    }
    const limit = 15
    const queue = reviewQueueCandidates.slice(0, limit)
    const randomizedQueue = queue.map((question) =>
      shuffleQuestionChoices(question),
    )
    setReviewQueue(randomizedQueue)
    setReviewIndex(0)
    resetReviewInteractionState()
    setReviewStatus('reviewing')
    setReviewLog([])
  }

  const handleSelectReviewChoice = (choiceIndex: number) => {
    if (reviewRevealed) {
      return
    }
    const question = reviewQueue[reviewIndex]
    if (!question) {
      return
    }
    setReviewSelectedChoice(choiceIndex)
    setReviewRevealed(true)
  }

  const handleReviewRate = (rating: ReviewRating) => {
    const question = reviewQueue[reviewIndex]
    if (!question) {
      return
    }
    applyReviewRating(question.id, rating)
    setReviewLog((previous) => [...previous, rating])

    const isLastCard = reviewIndex === reviewQueue.length - 1
    if (rating === 'again') {
      setReviewQueue((previousQueue) => [
        ...previousQueue,
        shuffleQuestionChoices(question),
      ])
    }

    if (isLastCard) {
      if (rating === 'again') {
        setReviewIndex((previous) => previous + 1)
        resetReviewInteractionState()
        return
      }
      setReviewStatus('complete')
      resetReviewInteractionState()
      return
    }

    setReviewIndex((previous) => previous + 1)
    resetReviewInteractionState()
  }

  const handleExitReview = () => {
    setReviewStatus('idle')
    setReviewQueue([])
    setReviewIndex(0)
    resetReviewInteractionState()
    setReviewLog([])
  }

  useEffect(() => {
    if (!currentQuestionId || !hasActiveTest) {
      return
    }
    setQuestionExposureCounts((previous) => {
      const previousCount = previous[currentQuestionId] ?? 0
      return { ...previous, [currentQuestionId]: previousCount + 1 }
    })
  }, [currentQuestionId, hasActiveTest])

  const resetMockTestProgress = useCallback(() => {
    setTestQuestions([])
    setResponses({})
    setQuestionExposureCounts({})
    setCurrentQuestionIndex(0)
    setTestStatus('idle')
    setManualAdjustments({})
  }, [])

  const handleStartTest = useCallback(() => {
    if (!activeQuestionBank.length) {
      return
    }
    const sampleCount = questionTargetCount || activeQuestionBank.length
    const adaptivePool = buildAdaptivePool()
    let selection = adaptivePool.slice(0, sampleCount)
    if (selection.length < sampleCount) {
      const fallback = shuffleQuestions(
        activeQuestionBank,
        activeQuestionBank.length,
      ).filter((question) => !selection.some((item) => item.id === question.id))
      selection = [...selection, ...fallback].slice(0, sampleCount)
    }
    const randomizedSample = selection.map((question) =>
      shuffleQuestionChoices(question),
    )
    setTestQuestions(randomizedSample)
    setResponses({})
    setQuestionExposureCounts({})
    setCurrentQuestionIndex(0)
    setTestStatus('in-progress')
    setManualAdjustments({})
    const nextDayKey = getDateKey(new Date(), resolvedTimeZone)
    setTestDayKey(nextDayKey)
  }, [
    activeQuestionBank,
    buildAdaptivePool,
    questionTargetCount,
    resolvedTimeZone,
  ])

  const handleRestartTest = () => {
    handleStartTest()
  }

  useEffect(() => {
    if (isHydratingSession || !testDayKey) {
      return
    }
    const latestDayKey = getDateKey(new Date(), resolvedTimeZone)
    if (latestDayKey === testDayKey) {
      return
    }
    if (hasActiveTest) {
      resetMockTestProgress()
    }
    setTestDayKey(latestDayKey)
  }, [
    hasActiveTest,
    isHydratingSession,
    resetMockTestProgress,
    resolvedTimeZone,
    testDayKey,
  ])

  const handleSelectOption = (answerIndex: number) => {
    if (
      !currentQuestion ||
      testStatus === 'complete' ||
      responses[currentQuestion.id] !== undefined
    ) {
      return
    }
    setResponses((previous) => ({
      ...previous,
      [currentQuestion.id]: answerIndex,
    }))
    const rating: ReviewRating =
      answerIndex === currentQuestion.answerIndex ? 'good' : 'again'
    applyReviewRating(currentQuestion.id, rating)
    setManualAdjustments((prior) => ({
      ...prior,
      [currentQuestion.id]: rating,
    }))
    incrementDailyQuestionProgress()
  }

  const handleNextQuestion = () => {
    if (!currentQuestion) {
      return
    }
    if (isLastQuestion) {
      setTestStatus('complete')
    } else {
      setCurrentQuestionIndex((previous) => previous + 1)
    }
  }

  const handlePrevQuestion = () => {
    if (currentQuestionIndex === 0) {
      return
    }
    setCurrentQuestionIndex((previous) => previous - 1)
  }

  const handleOpenResetDialog = () => {
    setShowResetDialog(true)
  }

  const handleCloseResetDialog = () => {
    if (isResettingProgress) {
      return
    }
    setShowResetDialog(false)
  }

  const handleConfirmReset = () => {
    if (typeof window === 'undefined') {
      return
    }
    setIsResettingProgress(true)
    try {
      const storageKeys = [
        SESSION_STORAGE_KEY,
        LEGACY_SESSION_STORAGE_KEY,
        REVIEW_STORAGE_KEY,
        LEGACY_REVIEW_STORAGE_KEY,
        PRACTICE_HISTORY_STORAGE_KEY,
        LEGACY_PRACTICE_HISTORY_STORAGE_KEY,
      ]
      storageKeys.forEach((key) => {
        window.localStorage.removeItem(key)
      })

      setTestStatus('idle')
      setTestQuestions([])
      setCurrentQuestionIndex(0)
      setResponses({})
      setReviewStatus('idle')
      setReviewQueue([])
      setReviewIndex(0)
      setReviewRevealed(false)
      setReviewSelectedChoice(null)
      setReviewLog([])
      setManualAdjustments({})
      setReviewStore({})
      setPracticeHistory({})
      setQuestionExposureCounts({})
      setTestDayKey(undefined)
      setSessionId(createSessionId())
      setShowResetDialog(false)
    } finally {
      setIsResettingProgress(false)
    }
  }

  const questionAnswers = currentQuestion?.choices ?? []
  const remainingCount = Math.max(totalQuestions - answeredCount, 0)
  const passingPercentage =
    totalQuestions === 0 ? 0 : Math.round((correctCount / totalQuestions) * 100)
  const liveScoreMetrics = [
    {
      label: 'Answered',
      value: `${answeredCount} / ${totalQuestions || questionTargetCount}`,
    },
    {
      label: 'Remaining',
      value: hasActiveTest ? remainingCount : questionTargetCount,
    },
    {
      label: 'Correct',
      value: hasActiveTest ? correctCount : 0,
    },
    {
      label: 'Score',
      value: hasActiveTest ? `${passingPercentage}%` : '—',
    },
  ]

  return (
    <div className="app d-flex flex-column min-vh-100 bg-light">
      <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
        <div className="container">
          <a className="navbar-brand fw-semibold" href="#">
            DriveReady Mock Exams
          </a>
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#mainNav"
            aria-controls="mainNav"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon" />
          </button>
          <div className="collapse navbar-collapse" id="mainNav">
            <ul className="navbar-nav ms-auto mb-2 mb-lg-0">
              <li className="nav-item">
                <a
                  className="nav-link active"
                  aria-current="page"
                  href="#overview"
                >
                  Overview
                </a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="#mock-test">
                  Mock Test
                </a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="#review">
                  Review
                </a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="#checklist">
                  Checklist
                </a>
              </li>
              <li className="nav-item">
                <a
                  className="nav-link d-flex align-items-center justify-content-center"
                  href="https://github.com/hindol/drive-ready"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="View DriveReady source on GitHub"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    role="img"
                    aria-hidden="true"
                    width="20"
                    height="20"
                    fill="currentColor"
                  >
                    <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48 0-.24-.01-.87-.01-1.71-2.5.46-3.03-1.06-3.03-1.06-.45-1.14-1.1-1.45-1.1-1.45-.9-.61.07-.6.07-.6 1 .07 1.53 1.04 1.53 1.04.89 1.52 2.34 1.08 2.91.82.09-.65.35-1.08.63-1.33-1.99-.23-4.09-1-4.09-4.44 0-.98.35-1.78.93-2.41-.09-.23-.4-1.16.09-2.41 0 0 .75-.24 2.45.92a8.47 8.47 0 0 1 4.46 0c1.7-1.16 2.45-.92 2.45-.92.49 1.25.18 2.18.09 2.41.58.63.93 1.43.93 2.41 0 3.45-2.1 4.21-4.11 4.43.36.31.68.92.68 1.86 0 1.34-.01 2.42-.01 2.75 0 .27.18.58.69.48A10 10 0 0 0 12 2Z" />
                  </svg>
                </a>
              </li>
            </ul>
            <div className="d-flex flex-column flex-lg-row align-items-lg-center gap-2 ms-lg-3">
              <SignedOut>
                <SignInButton mode="modal">
                  <button
                    className="btn btn-light text-primary border-0 shadow-sm fw-semibold w-100 w-lg-auto"
                    type="button"
                  >
                    Admin Sign In
                  </button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <div className="d-flex flex-column flex-lg-row align-items-lg-center gap-2 w-100 w-lg-auto">
                  <SignOutButton redirectUrl="/">
                    <button
                      className="btn btn-outline-light fw-semibold w-100"
                      type="button"
                    >
                      Logout
                    </button>
                  </SignOutButton>
                  <UserButton
                    afterSignOutUrl="/"
                    appearance={{
                      elements: {
                        userButtonAvatarBox: { width: '36px', height: '36px' },
                      },
                    }}
                  />
                </div>
              </SignedIn>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-grow-1">
        <header className="hero-section text-white text-center">
          <div className="overlay" />
          <div className="container position-relative">
            <div className="row justify-content-center">
              <div className="col-lg-9">
                <h1 className="display-5 fw-bold mb-3">{content.hero.title}</h1>
                <p className="lead mb-4">{content.hero.description}</p>
                <div className="state-selector card border-0 shadow-sm mx-auto">
                  <div className="card-body text-start">
                    <p className="text-uppercase small fw-semibold text-primary mb-1">
                      Mock exam state
                    </p>
                    <p className="h4 fw-bold mb-2">Washington</p>
                    <p className="text-muted mb-3">
                      DriveReady currently focuses on Washington's written
                      knowledge exam. Additional states will ship later.
                    </p>
                    <a className="btn btn-lg btn-primary" href="#mock-test">
                      Start Practicing
                    </a>
                    <p className="mt-3 mb-0 text-muted small">
                      {content.supportNote}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <section id="overview" className="py-5 bg-white">
          <div className="container">
            <div className="row g-4">
              {content.stats.map((stat) => (
                <div key={stat.label} className="col-md-4">
                  <div className="stat-card h-100 shadow-sm">
                    <p className="stat-value mb-1">{stat.value}</p>
                    <p className="text-muted mb-0">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section id="mock-test" className="py-5 bg-white">
          <div className="container">
            <div className="text-center mb-5">
              <h2 className="fw-bold">Mock Knowledge Test</h2>
              <p className="text-muted m-0">
                {questionTargetCount
                  ? `Take a ${questionTargetCount}-question practice run with live scoring and instant feedback.`
                  : 'We are adding more questions to this state. Check back soon for full-length practice.'}
              </p>
            </div>
            {!activeQuestionBank.length ? (
              <div className="alert alert-warning text-center" role="status">
                We are curating the first question set for Washington. New
                practice items arrive shortly.
              </div>
            ) : (
              <div className="row g-4 align-items-start">
                <div className="col-lg-4 order-2 order-lg-1">
                  <div className="card h-100 border-0 shadow-sm live-score-card">
                    <div className="card-body py-2">
                      <div className="d-flex align-items-center justify-content-between gap-2 mb-1">
                        <p className="tiny-label text-muted mb-0">Live Score</p>
                        <p className="tiny-label text-primary fw-semibold mb-0">
                          {hasActiveTest ? `${progressPercent}%` : '0%'}
                        </p>
                      </div>
                      <div
                        className="progress progress-thin mb-2"
                        role="progressbar"
                        aria-valuenow={hasActiveTest ? progressPercent : 0}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      >
                        <div
                          className="progress-bar bg-primary"
                          style={{
                            width: `${hasActiveTest ? progressPercent : 0}%`,
                          }}
                        />
                      </div>
                      <div className="score-stat-row compact mb-1">
                        {liveScoreMetrics.map((metric) => (
                          <div key={metric.label} className="score-stat-chip">
                            <span className="score-stat-label">
                              {metric.label}
                            </span>
                            <span className="score-stat-value">
                              {metric.value}
                            </span>
                          </div>
                        ))}
                      </div>
                      <p className="tiny-label text-muted mb-0">
                        Pass goal 80%
                      </p>
                    </div>
                  </div>
                  <div className="card border-0 shadow-sm mt-4">
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <h3 className="h6 fw-semibold mb-1">
                            Daily 10-question habit
                          </h3>
                          <p className="text-muted small mb-0">
                            {practiceStreak
                              ? `Current streak: ${practiceStreak} day${practiceStreak === 1 ? '' : 's'}`
                              : `Solve ${practiceGoalTarget} questions to start your streak.`}
                          </p>
                        </div>
                        <span
                          className={`badge ${hasMetPracticeGoal ? 'text-bg-success' : 'text-bg-primary'} rounded-pill`}
                        >
                          {hasMetPracticeGoal ? 'Done' : 'In progress'}
                        </span>
                      </div>
                      <div className="mt-3">
                        <div className="d-flex justify-content-between align-items-center">
                          <span className="small text-muted">Today</span>
                          <span className="small fw-semibold">
                            {Math.min(todayQuestionCount, practiceGoalTarget)} /{' '}
                            {practiceGoalTarget} questions
                          </span>
                        </div>
                        <div
                          className="progress progress-thin my-2"
                          role="progressbar"
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-valuenow={todayGoalPercent}
                        >
                          <div
                            className="progress-bar bg-primary"
                            style={{ width: `${todayGoalPercent}%` }}
                          />
                        </div>
                        <small className="d-block text-muted">
                          {hasMetPracticeGoal
                            ? `We already logged today’s ${practiceGoalTarget} solved questions. Keep the streak alive tomorrow.`
                            : `We log it automatically as soon as you answer ${practiceGoalTarget} questions today.`}
                        </small>
                      </div>
                      <div className="practice-calendar mt-2">
                        <div className="d-flex align-items-center justify-content-between gap-2 mb-2">
                          <p className="tiny-label text-muted mb-0">Week view</p>
                          <span className="text-primary fw-semibold small">
                            {practiceCalendar.completedDays}/
                            {practiceCalendar.totalDays}
                          </span>
                        </div>
                        <div className="d-flex align-items-center justify-content-between gap-2 mb-2">
                          <span className="text-muted small">
                            {practiceCalendar.days.length && weekRangeFormatter
                              ? `${weekRangeFormatter.format(practiceCalendar.days[0].date)}–${weekRangeFormatter.format(practiceCalendar.days[practiceCalendar.days.length - 1].date)}`
                              : ''}
                          </span>
                          <div
                            className="btn-group btn-group-sm"
                            role="group"
                            aria-label="Practice calendar week navigation"
                          >
                            <button
                              type="button"
                              className="btn btn-outline-primary"
                              onClick={() => setPracticeWeekOffset((current) => current - 1)}
                            >
                              Previous
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline-primary"
                              disabled={practiceWeekOffset === 0}
                              onClick={() =>
                                setPracticeWeekOffset((current) =>
                                  Math.min(0, current + 1),
                                )
                              }
                            >
                              Next
                            </button>
                            {practiceWeekOffset !== 0 && (
                              <button
                                type="button"
                                className="btn btn-outline-primary"
                                onClick={() => setPracticeWeekOffset(0)}
                              >
                                This week
                              </button>
                            )}
                          </div>
                        </div>
                        <div
                          className="practice-calendar-grid"
                          aria-live="polite"
                        >
                          {isPracticeCalendarHydrating
                            ? Array.from({
                                length: PRACTICE_CALENDAR_DAYS_IN_WEEK,
                              }).map((_, index) => (
                                <span
                                  key={`practice-day-loading-${index}`}
                                  className="practice-day practice-day--loading"
                                  aria-hidden="true"
                                />
                              ))
                            : practiceCalendar.days.map((day) => {
                                const isMet =
                                  day.questions >= practiceGoalTarget
                                const dayClasses = ['practice-day']
                                if (isMet) {
                                  dayClasses.push('practice-day--met')
                                }
                                if (day.isToday) {
                                  dayClasses.push('practice-day--today')
                                }
                                if (day.isFuture) {
                                  dayClasses.push('practice-day--future')
                                }
                                if (day.isPast && !isMet) {
                                  dayClasses.push('practice-day--missed')
                                }
                                return (
                                  <span
                                    key={day.key}
                                    className={dayClasses.join(' ')}
                                  >
                                    <span className="practice-day-letter">
                                      {weekdayFormatter
                                        ? weekdayFormatter.format(day.date)
                                        : day.date.toLocaleDateString(
                                            undefined,
                                            { weekday: 'narrow' },
                                          )}
                                    </span>
                                    <span className="practice-day-date">
                                      {dayNumberFormatter
                                        ? dayNumberFormatter.format(day.date)
                                        : day.date.getUTCDate()}
                                    </span>
                                    {isMet && (
                                      <>
                                        <span
                                          className="practice-day-dot"
                                          aria-hidden="true"
                                        />
                                        <span className="visually-hidden">
                                          Practice goal met
                                        </span>
                                      </>
                                    )}
                                  </span>
                                )
                              })}
                        </div>
                      </div>
                      <div className="reset-progress-cta border-top pt-3 mt-4">
                        <p className="tiny-label text-muted mb-2">
                          Need a fresh start?
                        </p>
                        <button
                          className="btn btn-outline-danger w-100"
                          type="button"
                          onClick={handleOpenResetDialog}
                        >
                          Reset Progress
                        </button>
                        <small className="text-muted d-block mt-2">
                          Clears your mock tests, Smart Review cards, and
                          practice streak history.
                        </small>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-lg-8 order-1 order-lg-2">
                  {testStatus === 'idle' ? (
                    <div className="card border-0 shadow-sm h-100">
                      <div className="card-body d-flex flex-column justify-content-center text-center">
                        <h3 className="h5 fw-semibold mb-3">
                          Ready to try the official-style knowledge test?
                        </h3>
                        <p className="text-muted">
                          You will get {questionTargetCount} random questions
                          each attempt with instant explanations and official
                          guide references after every answer.
                        </p>
                        <div className="d-flex flex-column flex-sm-row justify-content-center gap-3 mt-3">
                          <button
                            className="btn btn-primary btn-lg"
                            type="button"
                            onClick={handleStartTest}
                          >
                            Start Mock Test
                          </button>
                        </div>
                        <p className="small text-muted mt-3 mb-0">
                          Questions reshuffle every time you restart.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="card border-0 shadow-sm">
                      <div className="card-body">
                        {!currentQuestion ? (
                          <div className="text-center text-muted">
                            All questions completed. Restart to try again.
                          </div>
                        ) : (
                          <>
                            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
                              <span className="badge text-bg-primary">
                                Question {currentQuestionIndex + 1} of{' '}
                                {totalQuestions}
                              </span>
                              <button
                                className="btn btn-sm btn-outline-secondary"
                                type="button"
                                onClick={handleRestartTest}
                              >
                                Restart
                              </button>
                            </div>
                            {hasSeenCurrentQuestionBefore &&
                              (dueQuestionIdSet.has(currentQuestion.id) ||
                                manualAdjustments[currentQuestion.id]) && (
                                <div
                                  className="alert alert-warning d-flex align-items-center gap-2"
                                  role="status"
                                >
                                  <span className="badge text-bg-warning text-dark">
                                    Review card
                                  </span>
                                  <span>
                                    {manualAdjustments[currentQuestion.id]
                                      ? `Re-rated as ${manualAdjustments[currentQuestion.id]} from the review queue.`
                                      : 'Scheduled in your Smart Review queue today.'}
                                  </span>
                                </div>
                              )}
                            {currentQuestion.image && (
                              <div className="question-image-frame">
                                <img
                                  src={currentQuestion.image}
                                  alt={
                                    currentQuestion.imageAlt ??
                                    'Road sign illustration'
                                  }
                                />
                              </div>
                            )}
                            <h3 className="h5 fw-semibold mb-3">
                              {currentQuestion.prompt}
                            </h3>
                            <div className="list-group mb-4">
                              {questionAnswers.map(
                                (answer: string, index: number) => {
                                  const revealAnswers =
                                    selectedAnswerIndex !== undefined ||
                                    testStatus === 'complete'
                                  const isSelected =
                                    selectedAnswerIndex === index
                                  const isCorrectChoice =
                                    revealAnswers &&
                                    currentQuestion.answerIndex === index
                                  const isIncorrectSelection =
                                    revealAnswers &&
                                    isSelected &&
                                    !isCorrectChoice
                                  const itemClasses = [
                                    'list-group-item',
                                    'list-group-item-action',
                                    'd-flex',
                                    'justify-content-between',
                                    'align-items-center',
                                    'gap-3',
                                  ]
                                  if (isCorrectChoice) {
                                    itemClasses.push(
                                      'border-success',
                                      'bg-success-subtle',
                                    )
                                  }
                                  if (isIncorrectSelection) {
                                    itemClasses.push(
                                      'border-danger',
                                      'bg-danger-subtle',
                                    )
                                  }
                                  const shouldShowFullBorder =
                                    isCorrectChoice || isIncorrectSelection
                                  return (
                                    <button
                                      key={`${currentQuestion.id}-${index}`}
                                      className={itemClasses.join(' ')}
                                      type="button"
                                      onClick={() => handleSelectOption(index)}
                                      disabled={revealAnswers}
                                      style={
                                        shouldShowFullBorder
                                          ? { borderTopWidth: '1px' }
                                          : undefined
                                      }
                                    >
                                      <span className="text-start">
                                        {answer}
                                      </span>
                                      {isCorrectChoice && (
                                        <span className="badge text-bg-success">
                                          Correct
                                        </span>
                                      )}
                                      {isIncorrectSelection && (
                                        <span className="badge text-bg-danger">
                                          Your choice
                                        </span>
                                      )}
                                    </button>
                                  )
                                },
                              )}
                            </div>
                            {selectedAnswerIndex !== undefined &&
                              currentQuestion && (
                                <div className="alert alert-info" role="status">
                                  <strong>Explanation:</strong>{' '}
                                  {currentQuestion.explanation}
                                  <br />
                                  <strong>Based on the official guide:</strong>{' '}
                                  <em>{currentQuestion.quote}</em>
                                  <br />
                                  <small className="text-muted">
                                    Source:{' '}
                                    {currentReferenceUrl ? (
                                      <a
                                        href={currentReferenceUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                      >
                                        {currentQuestion.reference}
                                      </a>
                                    ) : (
                                      currentQuestion.reference
                                    )}
                                  </small>
                                </div>
                              )}
                            <div className="d-flex flex-column flex-md-row justify-content-between align-items-stretch align-items-md-center gap-3 mt-4">
                              <button
                                className="btn btn-outline-secondary"
                                type="button"
                                onClick={handlePrevQuestion}
                                disabled={currentQuestionIndex === 0}
                              >
                                Previous Question
                              </button>
                              <div className="d-flex gap-2 justify-content-end">
                                <button
                                  className="btn btn-outline-secondary"
                                  type="button"
                                  onClick={handleRestartTest}
                                >
                                  Start Over
                                </button>
                                <button
                                  className="btn btn-primary"
                                  type="button"
                                  onClick={handleNextQuestion}
                                  disabled={!canNavigateForward}
                                >
                                  {isLastQuestion
                                    ? testStatus === 'complete'
                                      ? 'Review Complete'
                                      : 'Finish Test'
                                    : 'Save & Next'}
                                </button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>

        <section id="review" className="py-5">
          <div className="container">
            <div className="text-center mb-5">
              <h2 className="fw-bold">Smart Review</h2>
              <p className="text-muted m-0">
                {
                  "Build long-term memory with spaced repetition tuned for Washington's exam."
                }
              </p>
            </div>
            {!activeQuestionBank.length ? (
              <div className="alert alert-warning text-center" role="status">
                Add questions to begin smart reviews for Washington.
              </div>
            ) : (
              <>
                <div className="row g-4 mb-4">
                  <div className="col-md-3">
                    <div className="card h-100 border-0 shadow-sm">
                      <div className="card-body">
                        <p className="text-muted text-uppercase small mb-1">
                          Due Today
                        </p>
                        <p className="display-6 fw-bold mb-0">
                          {dueTodayCount}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="card h-100 border-0 shadow-sm">
                      <div className="card-body">
                        <p className="text-muted text-uppercase small mb-1">
                          New Cards
                        </p>
                        <p className="display-6 fw-bold mb-0">{newCardCount}</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="card h-100 border-0 shadow-sm">
                      <div className="card-body">
                        <p className="text-muted text-uppercase small mb-1">
                          Due Soon
                        </p>
                        <p className="display-6 fw-bold mb-0">
                          {upcomingWithinWeek}
                        </p>
                        <p className="text-muted small mb-0">
                          next: {nextDueLabel}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="card h-100 border-0 shadow-sm">
                      <div className="card-body">
                        <p className="text-muted text-uppercase small mb-1">
                          Ready Now
                        </p>
                        <p className="display-6 fw-bold mb-0">
                          {reviewReadyCount}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                {reviewStatus === 'idle' && (
                  <div className="card border-0 shadow-sm">
                    <div className="card-body d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
                      <div>
                        <h3 className="h5 fw-semibold mb-2">
                          Run an Anki-style review session
                        </h3>
                        <p className="text-muted mb-0">
                          We prioritise due cards, then introduce new questions
                          when you are caught up.
                        </p>
                        {reviewReadyCount === 0 && (
                          <p className="text-muted small mb-0 mt-2">
                            All cards are scheduled. Check back when new reviews
                            unlock.
                          </p>
                        )}
                      </div>
                      <div className="d-flex flex-column flex-sm-row gap-2">
                        <button
                          className="btn btn-primary btn-lg"
                          type="button"
                          onClick={handleStartReview}
                          disabled={reviewReadyCount === 0}
                        >
                          Start Smart Review
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                {reviewStatus === 'reviewing' &&
                  (reviewInProgressQuestion ? (
                    <div className="card border-0 shadow-sm">
                      <div className="card-body">
                        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
                          <span className="badge text-bg-primary">
                            Card {reviewIndex + 1} of {reviewQueue.length}
                          </span>
                          <button
                            className="btn btn-sm btn-outline-secondary"
                            type="button"
                            onClick={handleExitReview}
                          >
                            End Session
                          </button>
                        </div>
                        {reviewInProgressQuestion.image && (
                          <div className="question-image-frame">
                            <img
                              src={reviewInProgressQuestion.image}
                              alt={
                                reviewInProgressQuestion.imageAlt ??
                                'Road sign illustration'
                              }
                            />
                          </div>
                        )}
                        <h3 className="h5 fw-semibold mb-3">
                          {reviewInProgressQuestion.prompt}
                        </h3>
                        <div className="list-group mb-4">
                          {reviewInProgressQuestion.choices.map(
                            (choice: string, index: number) => {
                              const isCorrectChoice =
                                index === reviewInProgressQuestion.answerIndex
                              const isUserSelection =
                                reviewSelectedChoice === index
                              const showReveal = reviewRevealed
                              const itemClasses = [
                                'list-group-item',
                                'list-group-item-action',
                                'd-flex',
                                'justify-content-between',
                                'align-items-center',
                                'gap-3',
                                'text-start',
                              ]
                              if (showReveal && isCorrectChoice) {
                                itemClasses.push(
                                  'border-success',
                                  'bg-success-subtle',
                                )
                              }
                              if (
                                showReveal &&
                                isUserSelection &&
                                !isCorrectChoice
                              ) {
                                itemClasses.push(
                                  'border-danger',
                                  'bg-danger-subtle',
                                )
                              }
                              return (
                                <button
                                  key={`${reviewInProgressQuestion.id}-${index}`}
                                  type="button"
                                  className={itemClasses.join(' ')}
                                  style={
                                    showReveal && isCorrectChoice
                                      ? { borderTopWidth: '1px' }
                                      : undefined
                                  }
                                  onClick={() =>
                                    handleSelectReviewChoice(index)
                                  }
                                  disabled={reviewRevealed}
                                >
                                  <span className="text-start">{choice}</span>
                                  {showReveal && isCorrectChoice && (
                                    <span className="badge text-bg-success">
                                      Correct
                                    </span>
                                  )}
                                  {showReveal &&
                                    isUserSelection &&
                                    !isCorrectChoice && (
                                      <span className="badge text-bg-danger">
                                        Your choice
                                      </span>
                                    )}
                                </button>
                              )
                            },
                          )}
                        </div>
                        {!reviewRevealed ? (
                          <p className="text-muted fst-italic">
                            Tap an answer choice to reveal the explanation.
                          </p>
                        ) : (
                          <>
                            <div className="alert alert-info" role="status">
                              <strong>Explanation:</strong>{' '}
                              {reviewInProgressQuestion.explanation}
                              <br />
                              <strong>Based on the official guide:</strong>{' '}
                              <em>{reviewInProgressQuestion.quote}</em>
                              <br />
                              <small className="text-muted">
                                Source:{' '}
                                {reviewReferenceUrl ? (
                                  <a
                                    href={reviewReferenceUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    {reviewInProgressQuestion.reference}
                                  </a>
                                ) : (
                                  reviewInProgressQuestion.reference
                                )}
                              </small>
                            </div>
                            <div className="d-flex flex-wrap gap-2">
                              <button
                                className="btn btn-outline-danger"
                                type="button"
                                onClick={() => handleReviewRate('again')}
                              >
                                Again
                              </button>
                              <button
                                className="btn btn-outline-warning"
                                type="button"
                                onClick={() => handleReviewRate('hard')}
                              >
                                Hard
                              </button>
                              <button
                                className="btn btn-outline-primary"
                                type="button"
                                onClick={() => handleReviewRate('good')}
                              >
                                Good
                              </button>
                              <button
                                className="btn btn-outline-success"
                                type="button"
                                onClick={() => handleReviewRate('easy')}
                              >
                                Easy
                              </button>
                              {manualAdjustments[
                                reviewInProgressQuestion.id
                              ] && (
                                <div
                                  className="alert alert-warning mt-3 w-100"
                                  role="status"
                                >
                                  <strong>Manual Adjustment:</strong> This card
                                  was re-rated as{' '}
                                  <span className="text-capitalize">
                                    {
                                      manualAdjustments[
                                        reviewInProgressQuestion.id
                                      ]
                                    }
                                  </span>
                                  {' during the mock test.'}
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="card border-0 shadow-sm">
                      <div className="card-body text-center text-muted">
                        No cards queued. End the session and launch a new
                        review.
                      </div>
                    </div>
                  ))}
                {reviewStatus === 'complete' && (
                  <div className="card border-0 shadow-sm">
                    <div className="card-body">
                      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-3">
                        <div>
                          <h3 className="h5 fw-semibold mb-2">
                            Session complete
                          </h3>
                          <p className="text-muted mb-0">
                            You rated {reviewLog.length}{' '}
                            {reviewLog.length === 1 ? 'card' : 'cards'}.
                          </p>
                        </div>
                        <div className="d-flex flex-column flex-sm-row gap-2">
                          <button
                            className="btn btn-outline-secondary"
                            type="button"
                            onClick={handleExitReview}
                          >
                            Close
                          </button>
                          <button
                            className="btn btn-primary"
                            type="button"
                            onClick={handleStartReview}
                            disabled={reviewReadyCount === 0}
                          >
                            Review Again
                          </button>
                        </div>
                      </div>
                      {reviewLog.length === 0 ? (
                        <p className="text-muted mb-0">
                          No cards were reviewed in this session.
                        </p>
                      ) : (
                        <div className="row g-3">
                          {(
                            ['again', 'hard', 'good', 'easy'] as ReviewRating[]
                          ).map((rating) => (
                            <div key={rating} className="col-sm-3">
                              <div className="card h-100 border-0 bg-light">
                                <div className="card-body text-center">
                                  <span
                                    className={`badge ${ratingLabels[rating].className} mb-2`}
                                  >
                                    {ratingLabels[rating].label}
                                  </span>
                                  <p className="display-6 fw-bold mb-0">
                                    {ratingSummary[rating] ?? 0}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        <section id="checklist" className="py-5">
          <div className="container">
            <div className="text-center mb-5">
              <h2 className="fw-bold">Pre-Exam Checklist</h2>
              <p className="text-muted m-0">
                {
                  'Make exam day smooth with this Washington-specific readiness list.'
                }
              </p>
            </div>
            <div className="row g-3">
              {content.checklist.map((item) => (
                <div key={item} className="col-md-6">
                  <div className="card h-100 border-0 shadow-sm checklist-card">
                    <div className="card-body">
                      <p className="mb-0">{item}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
        {showResetDialog && (
          <div
            className="reset-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reset-modal-title"
            onClick={handleCloseResetDialog}
          >
            <div
              className="reset-modal-card card border-0 shadow-lg"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="card-body">
                <div className="d-flex align-items-center gap-2 mb-3">
                  <span className="badge text-bg-warning text-dark">
                    Warning
                  </span>
                  <h3 className="h5 fw-semibold mb-0" id="reset-modal-title">
                    Reset all saved progress?
                  </h3>
                </div>
                <p className="text-muted mb-3">
                  This wipes your mock tests, Smart Review history, adjustments,
                  and daily practice log from this device. You will start fresh
                  with a new session ID.
                </p>
                <div className="alert alert-danger" role="status">
                  This action cannot be undone.
                </div>
                <div className="d-flex flex-column flex-sm-row justify-content-end gap-2">
                  <button
                    className="btn btn-outline-secondary"
                    type="button"
                    onClick={handleCloseResetDialog}
                    disabled={isResettingProgress}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-danger"
                    type="button"
                    onClick={handleConfirmReset}
                    disabled={isResettingProgress}
                  >
                    {isResettingProgress ? 'Resetting…' : 'Erase everything'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="bg-primary text-white py-4 mt-auto">
        <div className="container d-flex flex-column flex-sm-row justify-content-between align-items-center gap-3">
          <small>
            © {new Date().getFullYear()} DriveReady Mock Exams. All rights
            reserved.
          </small>
          <div className="d-flex gap-3 align-items-center">
            <a className="text-white text-decoration-none" href="#privacy">
              Privacy
            </a>
            <a className="text-white text-decoration-none" href="#terms">
              Terms
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
