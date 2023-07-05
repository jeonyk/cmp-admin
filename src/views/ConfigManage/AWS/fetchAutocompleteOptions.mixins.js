import { includes, uniqBy } from 'lodash'

export default {
  methods: {
    /**
      * AWS > 구성관리 > 리스트 > 검색어 입력 > 자동 검색 옵션을 세팅합니다. (el-autocomplete)
      * @param
      * @param {Array} baseGridData 기본 그리드 데이터
      * @param {Array} searchableCols 검색 가능한 컬럼 :: [{
        l abel: 'EFS 이름', binding: 'fileSystemName'
        }] 의 형태
     */
    fetchAutocompleteOptions (
      { searchText, callback },
      baseGridData,
      searchableCols
    ) {
      if (!searchText) return callback(undefined)
      const createFilter = (queryString) => {
        return (link) => {
          return (includes(link.text, queryString))
        }
      }

      const options = []

      baseGridData.forEach(row => {
        for (const [key, value] of Object.entries(row)) {
          const sameCol = searchableCols.find(col => col.binding === key)

          if (sameCol) {
            if (includes(value, searchText)) {
              options.push({
                text: value,
                value: sameCol.label + ': ' + value,
                binding: sameCol.binding
              })
            }
          } else {
            if (includes(value, searchText)) {
              options.push({
                text: value,
                value: '전체: ' + value,
                binding: 'all'
              })
            }
          }
        }
      })
      options.sort((a, b) => {
        if (a.binding > b.binding) return 1
        else if (a.binding < b.binding) return -1
        else return 0
      })

      const results = searchText ? options.filter(createFilter(searchText)) : options
      const uniqResult = uniqBy(results, 'value')

      callback(uniqResult)
    }
  }
}
