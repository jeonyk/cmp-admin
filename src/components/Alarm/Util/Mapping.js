function _map (dto, batchCycle) {
  const convertDay = (day) => {
    return {
      MONDAY: '월',
      TUESDAY: '화',
      WEDNESDAY: '수',
      THURSDAY: '목',
      FRIDAY: '금',
      SATURDAY: '토',
      SUNDAY: '일'
    }[day]
  }
  let displayLabel = ''
  const convertWeekDay = dto.weekDay.map(convertDay)

  switch (dto.alarmCycle) {
    case CYCLE_ENUM.EVERY_DAY:
    case CYCLE_ENUM.LAST_DAY_OF_MONTH:
      displayLabel = `${batchCycle.codeName} ${dto.alarmCycleTime}`
      break
    case CYCLE_ENUM.EVERY_WEEK: {
      displayLabel = `${batchCycle.codeName} ${convertWeekDay.join(', ')} ${dto.alarmCycleTime}`
      break
    }
    case CYCLE_ENUM.MONTHLY:
      displayLabel = `${batchCycle.codeName} ${dto.date}일 ${dto.alarmCycleTime}`
      break
    default:
      break
  }

  const _dto = {
    ...dto,
    alarmCycleTime: dto.alarmCycleTime.slice(0, dto.alarmCycleTime.length - 3)
  }

  const slicedDisplayLabel = displayLabel.slice(0, displayLabel.length - 3)

  return {
    convertWeekDay,
    displayLabel,
    slicedDisplayLabel,
    dtoRaw: _dto
  }
}

/**
 * 매일: 0
 * 매주: 1
 * 매월: 2
 * 매월 말일: 3
 */
export const CYCLE_ENUM = {
  EVERY_DAY: 'EVERY_DAY',
  EVERY_WEEK: 'EVERY_WEEK',
  MONTHLY: 'EVERY_MONTH',
  LAST_DAY_OF_MONTH: 'EVERY_MONTH_LAST_DATE'
}

export const WEEK_ENUM = {
  MONDAY: 0,
  TUESDAY: 1,
  WEDNESDAY: 2,
  THURSDAY: 3,
  FRIDAY: 4,
  SATURDAY: 5,
  SUNDAY: 6
}

/**
 * API 데이터를 한국어 포맷으로 변환한다.
 * alarmCycleDto -> '매일 15:00:00'
 */
export function mapAlarmCycleDto (alarmCycleDto, code) {
  if (!alarmCycleDto || !code) return {}
  return _map(alarmCycleDto, code)
}
