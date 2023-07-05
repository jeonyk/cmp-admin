/**
 * 모니터링 > 필터 시간 관련 유틸리티 함수 작성
 */
import dayjs from 'dayjs'

export const formatted = day => {
  return dayjs(day).format('YYYY-MM-DD HH:mm:ss')
}

/**
 * 현재 시간으로부터 n 시간 전 정보를 반환
 * @param {Date} current - 현재 Date
 * @param {number} hour - 몇 시간 전
 */
export const diffHours = (current, hour, format = true) => {
  const result = dayjs(current).subtract(hour, 'hours')
  return format ? formatted(result) : result
}
