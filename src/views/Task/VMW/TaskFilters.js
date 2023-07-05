
import API from '@/components/Apis/'
import { cloneDeep } from 'lodash'

export default {
  data: () => ({
    currPage: 1
  }),
  computed: {
    // 현재 쿼리 확인
    viewList () { return this.$route.query.type || 'ticket' },
    page () { return Number(this.$route.query?.page) || 1 }
  },
  watch: {
    page (page) {
      this.currPage = page
      this.setGridPage()
      this.$forceUpdate()
    }
  },
  methods: {
    /**
     * 소유관계사 관련한 트리들을 가지고 와서 필터링 데이터 내부 options 들을 설정합니다.
     */
    async getGroupManageTree () {
      this.loading.filter = true
      try {
        // const response = await API.iam.getGroupList({ groupUpper: 0, isDelete: false })
        const response = await API.iam.getGroupList({ groupUpper: 0, isDelete: false })
        this.groupList = response?.map(data => { return { groupIdx: data.groupIdx, groupName: data.groupName } })
        // this.filteringOptions.relCorp = this.groupList?.filter(data => data.groupName !== '공통')
        this.filteringOptions.relCorp = cloneDeep(this.groupList)
        this.filteringOptions.relCorp.unshift({ groupIdx: undefined, groupName: this.$t('main.DASHBOARD.all') })
      } catch (error) {
        console.error('# Lists : @ getGroupManageTree', error)
      }
      this.loading.filter = false
    },
    /**
       * @param {String} company 선택된 소유관계사를 가지고옵니다.
       * @return 소유관계사가 선택될 때마다 filterAction을 호출합니다.
       */
    getDepartment (company) {
      // console.log('@@ company : ', this.selectedFilter)
      return this.filterAction(this.selectedFilter)
    },
    /**
     * 사전협의 리스트에서 모든 처리상태 를 가져와서, 존재하는 처리 상태의 목록만 [필터링 > 처리상태] options 에 뿌려줍니다.
     */
    getAllProcessType () {
      const isDoneList = /task-done/g.test(this.$route.name)
      let status
      if (isDoneList) status = [this.$t('task.STATE.complete')] // 한일은 무조건 Done
      else status = Array.from(new Set(this.taskData.map(data => data?.taskStatus.split(' ')[1])))

      this.filteringOptions.proceedState = status.map(value => { return { value: value || this.$t('task.STATE.unde') } })
      this.filteringOptions.proceedState.unshift({ label: this.$t('main.DASHBOARD.all'), value: undefined })
    },
    /**
     * @param { Object } filter 선택된 필터의 정보를 object 형태로 가져옴
     */
    filterAction (filter = this.selectedFilter, rel) {
      let result = [...this.rawData]

      if (filter?.company) result = result.filter(list => list.ownerCompanyIdx === filter.company)
      if (filter?.depart) result = result.filter(list => list.part === filter.depart)
      if (filter?.process) {
        result = result.filter(list => {
          const processTexts = list.taskStatus.split(' ')
          const location = processTexts.length < 2 ? 0 : 1
          return processTexts[location] === filter.process
        })
      }

      // console.log(result, '=== 선택된 모든 filter 정보')
      this.taskData = result
      this.$forceUpdate()
    },
    resetData () {
      this.selectedFilter = {}
      this.filteringOptions.department = []
      this.taskData = [...this.rawData]
      this.$forceUpdate()
    },

    /* 사전협의, 할일, 한일 공통 */

    /**
     * [티켓으로 보기 / 목록으로 보기] 변경시 발생
     */
    changeListType (type) {
      // this.viewList = type
      this.grid = null
      this.resetCurrPageNum() // 페이지 리셋
    },
    /**
     * [목록으로 보기] 일때 페이지 변경 저장
     */
    gridChangePage (page) {
      this.currPage = page
      this.setQuery({ type: this.viewList, page })
    },
    /**
     * 페이징 초기화
     */
    resetCurrPageNum () {
      this.currPage = 1
      this.setQuery({ type: this.viewList, page: this.currPage })
    },
    /**
     * 라우터에 쿼리 추가
     */
    setQuery ({ type, page }) {
      return this.$router.push({ query: { type, page } })
    },
    /**
     * [목록으로 보기] 일때 그리드 페이지 세팅
     */
    setGridPage () {
      // "page" 쿼리가 있다면 쿼리에 맞춰서 페이지 설정
      const { page } = this.$route.query
      if (!page) return

      this.$nextTick(() => {
        if (this.gridData) this.gridData.moveToPage(Number(page) - 1)
      })
    }
  }
}
