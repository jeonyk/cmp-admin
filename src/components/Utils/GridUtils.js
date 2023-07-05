import Dayjs from 'dayjs'
import { SortDescription } from '@grapecity/wijmo'

export default {
  /**
 * 칼럼 dataMap 설정
 * @param {String} binding column의 binding 값
 * @param {Object} Array 그리드 전체 데이터
 * @param {String} type 반환 타입 ('date', 'byte' ...)
 */
  setColumnDataMap (binding, gridData, type = binding) {
    const changeValue = (type, value) => { // 타입
      return {
        date: this.filter('date', value),
        byte: this.filter('byte', value),
        undefined: null
      }[type]
    }

    if (!gridData) {
      return [{ value: null, caption: null }]
    } else {
      const arr = gridData.map(item => {
        return {
          value: item[binding] ? item[binding] : null,
          caption: item[binding] ? changeValue(type, item[binding]) : null
        }
      })
      return Array.from(new Set(arr))
    }
  },
  filter (type, value) {
    const returnSize = (val) => {
      if (!val) return 0
      const bytes = Number(val)
      const k = 1024
      const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    return {
      date: value ? Dayjs(value).format('YYYY.MM.DD HH:mm:ss') : '',
      byte: returnSize(value)
    }[type]
  },

  /**
    * 그리드 sorting/filtering 리턴
    *  @param {wjGrid} grid
    *  @param {wjGridFilter} filter
    *  @return {Object} state 그리드 sorting/filtering 상태
    */
  onSaveGridState ({ grid, filter }) {
    if (!grid?.collectionView || !filter) return
    const state = {
      filterDefinition: filter.filterDefinition,
      sortDescriptions: grid.collectionView.sortDescriptions.map((sortDesc) => {
        return {
          property: sortDesc.property,
          ascending: sortDesc.ascending
        }
      })
    }
    return JSON.stringify(state)
  },
  /**
    * 저장 되었던 그리드 sorting/filtering 복구
    * @param {wjGrid} grid
    * @param {wjGridFilter} filter
    * @param {Object} state 그리드 저장할 sorting/filtering 상태
    */
  onRestoreGridState ({ grid, filter }, gridState) {
    const json = gridState
    if (!json) return
    const state = JSON.parse(json)
    filter.filterDefinition = state.filterDefinition

    const view = grid.collectionView
    if (!view) return
    view.deferUpdate(() => {
      view.sortDescriptions.clear()
      for (let i = 0; i < state.sortDescriptions.length; i++) {
        const sortDesc = state.sortDescriptions[i]
        view.sortDescriptions.push(
          new SortDescription(sortDesc.property, sortDesc.ascending)
        )
      }
    })
  }

}
