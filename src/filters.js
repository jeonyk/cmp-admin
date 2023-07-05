/**
  * 파일명 : filters.js
  * 파일 기능 :
  * 작성자 : 이경환 외 3명
  * 최종 작성일 : 2021-02-18
  * License By Shinsegae I&C
  * 2021-02-18 fix: 업무 > 사전협의, 할일 처리 상태 날짜 표기 오류 수정
 **/

import Vue from 'vue'
import Dayjs from 'dayjs'
import DayOfYear from 'dayjs/plugin/dayOfYear'
import i18n from './i18n'
// import { max } from 'lodash'

Dayjs.extend(DayOfYear)

/**
@return { number } 0: today, interval < 0 : 대기, interval > 0 : 지연
**/
Vue.filter('interval', function (today, date) {
  const sameDay = today.dayOfYear() === date.dayOfYear()
  let interval = sameDay ? 0 : today.diff(date, 'days')

  if (!sameDay && interval >= 0) interval++

  return interval
})

Vue.filter('capitalize', function (value) {
  if (!value) return ''
  value = value.toString().toLowerCase()
  return value.charAt(0).toUpperCase() + value.slice(1)
})

Vue.filter('log', function (value, char) {
  char = char || '↵'
  return value.replace(/\n/g, '<br>')
})

Vue.filter('vmName', function (vms) {
  if (!vms) return ''
  let result = ''
  for (let i = 0; i < vms.length; i++) {
    if (i > 0)result += ', '
    result = vms[i].computeName
  }
  return result
})

Vue.filter('search', function (source, search) {
  if (!source) return ''
  const regex = new RegExp(search, 'i')
  const isMatch = source.match(regex)
  if (isMatch) {
    return source.replace(regex, '<span class="strong">' + search + '</span>')
  }
  return source
})
Vue.filter('inServiceLife', function (source) {
  if (!source) return '0 년'
  return Math.floor(source / 1000 / 60 / 60 / 24 / 365) + ' 년'
})

Vue.filter('date', function (source, format = 'YYYY.MM.DD HH:mm:ss', dateTransform = false) {
  if (!source) return ''
  /**
   * 사파리 버그
   * Dayjs('2020.12.18 08:59:59') 크롬에서 아주 잘 변환됩니다.
   * 사파리에서 YYYY.MM.DD 포맷은 Invalid Date 입니다.
   * 반환하기 전 YYYY-MM-DD 꼴로 변환시켜야 합니다.
   */
  if (dateTransform) {
    const arrSource = source.split(' ')
    arrSource[0] = arrSource[0].replace(/\./g, '-')
    source = arrSource.join(' ')
  }
  return Dayjs(source).format(format)
})

Vue.filter('dateSimple', function (source, format = 'YYYY.MM.DD') {
  if (!source) return ''
  return Dayjs(source).format(format)
})

Vue.filter('stringToPercent', function (source, fixed = 2) {
  if (!source) return ''
  try {
    let number = Number(source)
    number /= 10000
    return number.toFixed(fixed) + ' %'
  } catch (error) {
    console.error(error)
    return '0 %'
  }
})

Vue.filter('percent', function (source, fixed = 2) {
  if (!source) return 0
  try {
    let number = Number(source)
    number /= 10000
    return number.toFixed(fixed)
  } catch (error) {
    console.error(error)
    return 0
  }
})

Vue.filter('percentAndRound', function (source, fixed = 0, total = 10000) {
  if (!source) return 0
  try {
    const number = Number(source)
    total = Number(total)
    const result = (number / total) * 100
    return Math.round(result)
  } catch (error) {
    console.error(error)
    return 0
  }
})

Vue.filter('externalDiskInfo', function (disks) {
  if (!disks?.length) return
  let result = ''
  for (let i = 0; i < disks.length; i++) {
    if (disks[i].isCdrom) continue
    result += (disks[i].name || disks[i].diskName || disks[i].deviceBus + '.' + (disks[i].deviceIndex || disks[i].diskIndex || 0)) + ' , ' + (disks[i].diskSize || disks[i].size) + ' GB \n'
  }
  return result
})

Vue.filter('locale', function (source) {
  if (!source) return 0
  return source.toLocaleString()
})

Vue.filter('localeSign', function (source) {
  if (!source) return 0
  return source > 0 ? '+' + source.toLocaleString() : source.toLocaleString()
})

Vue.filter('maxlength', function (source, length = 500) {
  source = source + ''
  return source.slice(0, length)
})

Vue.filter('password', function (source) {
  source = source + ''
  let result = ''
  for (let i = 0; i < source.length; i++) {
    result += '*'
  }
  return result
})

Vue.filter('KBps', function (bytes, decimals = 1) {
  if (isNaN(bytes)) return 'N/A'
  bytes = Number(bytes)
  if (!bytes) return '0 KBps'
  else if (bytes === 0) return bytes + ' KBps'
  else if (bytes < 0) return 'N/A'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['KBps', 'MBps', 'GBps', 'TBps', 'PBps', 'EBps', 'ZBps', 'YBps']

  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
})

Vue.filter('byte', function (bytes, decimals = 2) {
  if (isNaN(bytes)) return '-'
  bytes = Number(bytes)
  if (!bytes) return '0 Bytes'
  else if (bytes === 0) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
})

Vue.filter('MB', function (mb, decimals = 2) { // MegaBytes
  if (mb === 0) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

  const i = Math.floor(Math.log(mb) / Math.log(k))

  return parseFloat((mb / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
})

Vue.filter('onlyGB', function (mb, decimals = 0, useUnit = true) { // MegaBytes
  if (!mb) return '0 GB'

  const k = (1024 * 1024 * 1024)
  const dm = mb / k

  if (useUnit) return dm.toFixed(decimals) + ' GB'
  else return dm.toFixed(decimals)
})

Vue.filter('toLowerCase', function (value) { // MegaBytes
  if (!value) return value

  return value.toLowerCase()
})

Vue.filter('displayLoadbalance', function (source) {
  if (!source) return ''
  if (source === 'none') {
    return i18n.t('common.TERMS.notSelected')// '선택 안 함'
  } else if (source === 'l4') {
    return 'L4'
  } else if (source === 'l7') {
    return 'L7'
  } else {

  }
})

Vue.filter('byteToGb', function (bytes) {
  if (bytes === 0) return 0
  if (!bytes) return 0
  try {
    const res = Math.floor((bytes / 1024 / 1024 / 1024))
    return res
  } catch (error) {
    return 0
  }
})

Vue.filter('timestamp', function (source, format = 'YYYY-MM-DDTHH:mm:ss.000+0000') {
  if (!source) return ''
  return Dayjs(source).format(format)
})

Vue.filter('timeWithoutSecond', function (source, format = 'YYYY.MM.DD HH:mm') {
  if (!source) return ''
  return Dayjs(source).format(format)
})
Vue.filter('gbToByte', function (bytes) {
  if (bytes === 0) return 0
  if (!bytes) return 0
  try {
    const res = Math.floor((bytes * 1024 * 1024 * 1024))
    return res
  } catch (error) {
    return 0
  }
})

Vue.filter('guestOsVersion', function (version) {
  try {
    const result = {}
    const splitGuestOsVersion = version.split(':')

    if (splitGuestOsVersion[0]) {
      result.osType = splitGuestOsVersion[0]
    }
    if (splitGuestOsVersion[1]) {
      result.osBit = splitGuestOsVersion[1]
    }
    if (splitGuestOsVersion[2]) {
      result.osName = splitGuestOsVersion[2]
    }
    return result
  } catch (error) {
    console.error(error)
    return {}
  }
})

Vue.filter('MB', function (mb, decimals = 2) { // MegaBytes
  if (mb === 0) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

  const i = Math.floor(Math.log(mb) / Math.log(k))

  return parseFloat((mb / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
})
Vue.filter('GB', function (mb, decimals = 0) { // MegaBytes
  if (!mb) return '0 GB'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

  const i = Math.floor(Math.log(mb) / Math.log(k))

  return parseFloat((mb / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
})
Vue.filter('volumnGroupSize', function (disks, key = 'diskSize') {
  if (!disks?.length) return

  let sumDiskSize = 0
  for (let i = 0; i < disks.length; i++) {
    sumDiskSize += disks[i][key]
  }
  // sumDiskSize = disks.reduce((a, b) => a.vmDiskSizeBytes + b.vmDiskSizeBytes)

  return sumDiskSize
})

Vue.filter('moneyFormat', function (value) { // moneyFormat
  if (!value) return value
  if (typeof value === 'number') {
    return value.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')
  } else if (typeof value === 'string') {
    return value.toLocaleString()
  }
  return value
})

Vue.filter('dateAdd', function (source, type = 'month', count = 1) {
  if (!source) return ''
  return Dayjs(source).add(count, type)
})

Vue.filter('maskingName', function (userId) {
  // const maskingId = userId.length <= 4
  //   ? userId.slice(0, 1) + userId.slice(1, -1).replace(/./g, '*') + userId.slice(-1)
  //   : userId.slice(0, 2) + userId.slice(2, -2).replace(/./g, '*') + userId.slice(-2)
  // return `${maskingId}`
  if (!userId) return ''
  return '**' + userId.substring(2)
})

Vue.filter('maskingNameHistory', function (userId) {
  if (!userId) return
  const str = userId.split('(')
  const maskedId = '**' + str[1]?.substring(2)
  const result = str[0] + '(' + maskedId
  return result
})

Vue.filter('clearComma', function (string) {
  const result = string.replace(',', '')
  return result
})

Vue.filter('vpcTag', function (projectName = 'projectName', environment = 'environment') {
  if (environment === 'DEV') environment = '개발'
  if (environment === 'STG') environment = '스테이징'
  if (environment === 'PRD') environment = '운영'
  const result = `${projectName}_${environment}_VPC`
  return result
})

Vue.filter('subnetBandwidth', function (startIp, endIp) {
  if (startIp && endIp) return `${startIp}~${endIp}`
  else return 'NOT FOUND'
})

Vue.filter('subnetTag', function (projectName = 'project', isPublic = false, index = 1) {
  return `${projectName}_${isPublic}_서브넷_${index}`
})

Vue.filter('routingTag', function (projectName = 'projectName', index = '') {
  const result = `${projectName}_라우팅테이블${index}`
  return result
})

Vue.filter('internetGatewayTag', function (projectName = 'projectName') {
  const result = `${projectName}_인터넷 게이트웨이`
  return result
})

Vue.filter('natGatewayTag', function (projectName = 'projectName') {
  const result = `${projectName}_NAT_게이트웨이`
  return result
})

Vue.filter('networkAclTag', function (projectName = 'projectName') {
  const result = `${projectName}_NetworkAclTag`
  return result
})

Vue.filter('securityGroupTag', function (projectName = 'projectName') {
  const result = `${projectName}_보안그룹`
  return result
})

Vue.filter('typeCategory', function (val) {
  if (!val) return ''
  val = val.toUpperCase()
  if (val === 'DEV') return '개발'
  if (val === 'PRD') return '운영'
  if (val === 'STG') return '스테이징'
  return val
})

Vue.filter('orderByCreatedTime', function (timeList, direction) {
  return timeList.sort(function (a, b) {
    if (a.createDate > b.createDate) return direction === 'ascend' ? -1 : 1
    else return direction === 'ascend' ? 1 : -1
  })
})

Vue.filter('projectInfo', function (info) {
  const companyName = info?.company?.companyName || ''
  const groupName = info?.group?.groupName || ''
  const projectName = info?.project?.projectName || ''
  const companyGroupName = companyName && groupName ? `${companyName} > ${groupName} > ` : ''
  return companyGroupName ? companyGroupName + projectName : projectName
})

// 특정 문자 사이(startChar ~ endChar)의 텍스트를 추출합니다.
Vue.filter('textBetween', function (text, startChar, endChar) {
  if (!text) return ''

  const startIndex = text.indexOf(startChar) + 1
  const endIndex = text.indexOf(endChar)

  return text.substring(startIndex, endIndex)
})
export default {}
