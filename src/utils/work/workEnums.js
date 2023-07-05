export const ReviewStates = Object.freeze({
  REVIEW: 'REVIEW',
  CANCELED_AT_REVIEW: 'CANCELED_AT_REVIEW',
  APPROVAL1: 'APPROVAL1',
  APPROVAL1_REJECTED: 'APPROVAL1_REJECTED'
})

export const TodoStates = Object.freeze({
  TODO: 'TODO',
  CANCELED_AT_TODO: 'CANCELED_AT_TODO',
  TODO_FINISHED: 'TODO_FINISHED',
  APPROVAL2: 'APPROVAL2',
  APPROVAL2_REJECTED: 'APPROVAL2_REJECTED'
})

export const DoneStates = Object.freeze({
  DONE: 'DONE',
  DONE_BY_CANCELED: 'DONE_BY_CANCELED'
})

export const WorkItemStates = Object.freeze({
  INIT: 'INIT', // 신규
  CANCELED_AT_REVIEW: 'CANCELED_AT_REVIEW', // 사전협의에서 작업취소
  CANCELED_AT_TODO: 'CANCELED_AT_TODO', // 할일에서의 작업취소
  READY_TO_WORK: 'READY_TO_WORK', // 수동작업대기
  SCHEDULED: 'SCHEDULED', // 자동작업대기
  SCHEDULE_PAUSED: 'SCHEDULE_PAUSED', // 자동작업중지
  WORKING: 'WORKING', // 작업중
  FAILING: 'FAILING', // 실패 중인 상태
  FAIL_CONFIRMED: 'FAIL_CONFIRMED', // 실패-실패처리
  FAIL_AS_SUCCESS: 'FAIL_AS_SUCCESS', // 실패-성공처리
  SUCCESS: 'SUCCESS' // 성공
})

export const CanRunSuccessStates = Object.freeze({
  INIT: 'INIT', // 신규
  FAILING: 'FAILING' // 실패 중인 상태
})
