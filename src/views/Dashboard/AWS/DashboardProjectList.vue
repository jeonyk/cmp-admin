<template>
  <div class="dashboard-project-list-wrapper">
    <h3
      class="section-title3"
      ref="project-list"
    >
      {{ $v('프로젝트 리스트') }}

      <small>({{ rawSources.length | locale }}{{ $v('개') }})</small>
    </h3>

    <div>
      <div class="ticket-options">
        <el-select
          class="options"
          v-model="sort"
          :placeholder="$v('프로젝트명 정렬')"
          :popper-append-to-body="false"
          @change="orderChange"
        >
          <el-option
            v-for="item in options"
            :key="item.label"
            :label="item.label"
            :value="item.value"
          />
        </el-select>

        <search-bar
          :placeholder="$v('프로젝트를 검색해주세요.')"
          @change="searchProject"
          @refresh="searchProject"
        />
      </div>

      <div class="project-list-tickets">
        <span class="sync-time">{{ $v('동기화 시간 :') }} {{ time }}</span>
        <!-- /. 동기화 시간 -->

        <div
          v-if="items.length"
          class="tickets-wrap"
        >
          <project-ticket
            v-for="ticket of itemWithPaginate"
            :key="ticket.projectIdx"
            :data="ticket"
          />
        </div>

        <div
          v-else
          class="empty-data"
        >
          <!-- 데이터가 없습니다. -->
          {{ $t('common.PLACEHOLDER.noData') }}
        </div>
      </div>

      <div
        v-if="items.length > 0"
        class="ticket-pagination"
      >
        <div class="buttons">
          <a @click="changePage(false)"><i class="mdi mdi-chevron-left" /></a>

          <div> <b>{{ currPage }}</b> / {{ totalPage }} </div>

          <a @click="changePage(true)"><i class="mdi mdi-chevron-right" /></a>
        </div>
      </div>
      <!-- /. 페이지네이션 -->
    </div>
  </div>
</template>

<script>
import ProjectTicket from './DashboardProjectList/ProjectTicket'
import SearchBar from '@/components/SearchBar/SearchBar'
import { cloneDeep } from 'lodash'

export default {
  name: 'DashboardProjectList',
  components: {
    'project-ticket': ProjectTicket,
    'search-bar': SearchBar
  },
  props: {
    time: {
      type: String,
      default: undefined
    },
    rawSources: {
      type: Array,
      default: () => []
    }
  },
  computed: {
    totalPage () {
      const raw = this.items.length
      const size = this.perPage

      const test = raw / size
      if (raw < size) return 1
      return (raw % size === 0) ? parseInt(test) : parseInt(test) + 1
    },
    itemWithPaginate () {
      const start = (this.currPage - 1) * this.perPage
      const end = start + this.perPage

      return cloneDeep(this.items.slice(start, end))
    }
  },
  watch: {
    rawSources (data) {
      this.setProjectTickets(data, 'asc')
    }
  },
  methods: {
    /**
     * 프로젝트 티켓 데이터 세팅 (오름차순/내림차순), (문자 검색)
     */
    setProjectTickets (data = this.rawSources, sort = this.sort, text = this.searchText) {
      let clone = cloneDeep(data)

      // 1. 검색문자열이 있으면 일단 먼저 텍스트 기반으로 찾은 후
      if (text) {
        clone = cloneDeep(data).filter(item => {
          const regex = new RegExp(text, 'g')
          return regex.test(item.projectName)
        })
      }

      // console.log(sort, text)

      const condition = {
        asc: ({ projectName: name1 }, { projectName: name2 }) => {
          if (name1 > name2) return 1
          if (name1 < name2) return -1
          return 0
        },
        desc: ({ projectName: name1 }, { projectName: name2 }) => {
          if (name1 < name2) return 1
          if (name1 > name2) return -1
          return 0
        },
        'price-asc': ({ bill: bill1 }, { bill: bill2 }) => {
          if (bill1 > bill2) return 1
          if (bill1 < bill2) return -1
          return 0
        },
        'price-desc': ({ bill: bill1 }, { bill: bill2 }) => {
          if (bill1 < bill2) return 1
          if (bill1 > bill2) return -1
          return 0
        }
      }[sort]

      // 2. 프로젝트 오름차순 정렬 (기본)
      const sortedData = clone.sort(condition)

      this.items = cloneDeep(sortedData)
    },
    /**
     * 프로젝트 목록 페이지네이션 변경 이벤트
     * @param { Boolean } action true(+) / false(-)
     */
    changePage (action) {
      if (action && this.currPage < this.totalPage) this.currPage++
      if (!action && this.currPage > 1) this.currPage--

      // 클릭할때마다 상단으로 올라감
      this.$refs['project-list'].scrollIntoView({ behavior: 'smooth' })
      return action
    },
    /**
     * 프로젝트 티켓 설정하기 (오름/내림차순)
     */
    orderChange (sort = this.sort) {
      this.setProjectTickets(this.rawSources, sort, this.searchText)
    },
    /** */
    searchProject (text) {
      this.currPage = 1
      this.searchText = text
      this.setProjectTickets(this.rawSources, this.sort, this.searchText)
    }
  },
  data () {
    return {
      currPage: 1,
      perPage: 9,
      sort: 'asc',
      searchText: undefined,
      items: [],
      options: [
        { label: this.$v('프로젝트 명 오름차 순'), value: 'asc' },
        { label: this.$v('프로젝트 명 내림차 순'), value: 'desc' },
        { label: this.$v('예상 청구 비용 오름차순'), value: 'price-asc' },
        { label: this.$v('예상 청구 비용 내림차순'), value: 'price-desc' }
      ]
    }
  }
}
</script>

<style lang="scss" scoped>
.ticket-options {
  display: flex;
  align-items: center;
  margin-bottom: $gap;

  .options {
    width: 190px;
    margin-right: $gap-m;
  }
}

.project-list-tickets {
  position: relative;
}
.tickets-wrap {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  grid-template-rows: auto auto auto;
  column-gap: 20px;
  row-gap: 20px;
  position: relative;
}

.ticket-pagination {
  margin-top: 50px;
  display: flex;
  align-items: center;
  justify-content: center;

  .buttons {
    display: flex;
    align-items: center;

    > div {
      margin: 0 30px;
      color: #727797;
      font-weight: 300;

      b {
        color: $white;
        font-weight: 500;
      }
    }
  }

  a {
    background: transparent;
    color: $white;
    border: 1px solid rgba(114, 119, 151, 0.28);
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
  }
}

.empty-data {
  height: 300px;
  border: 1px solid $purple-gray;
  border-radius: 6px;
}
</style>
