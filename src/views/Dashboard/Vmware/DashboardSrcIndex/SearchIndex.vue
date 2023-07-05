<template>
  <div class="search-index-wrap">
    <h6
      :class="['tit', { '-route' : routeTo }]"
      @click="routeTo ? $router.push(routeTo) : null"
    >
      <span>{{ title }}</span>
      <i class="mdi mdi-chevron-right" />
    </h6>

    <div class="search-area">
      <el-input
        v-model="searchText"
        :placeholder="$t('common.PLACEHOLDER.searchEnter')"
        @input="getSearchResult"
      />
      <i class="search-icon" />
    </div>
    <!-- /. 검색 영역 -->

    <div class="result-lists">
      <ul v-if="result.length">
        <li
          v-for="(item, idx) in result"
          :key="`searched_${idx}`"
          @click="clickEvent(item, idx)"
          :class="[{'-active': selectedItem === `${item.name}_${item.uuid}`}, `-over${item.exceeded}`]"
        >
          {{ item.name }}
        </li>
      </ul>

      <p
        class="-empty"
        v-else
      >
        {{ $t('common.PLACEHOLDER.noData') }}
        <!-- 데이터가 없습니다 -->
      </p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SearchIndex',
  props: {
    title: {
      type: String,
      default: undefined
    },
    routeTo: {
      type: Object,
      default: undefined
    },
    data: {
      type: Array,
      default: () => []
    }
  },
  watch: {
    data (data) {
      this.rawData = [...data]
      this.result = [...this.rawData]

      const result = data.length ? this.result[0] : null
      this.clickEvent(result, 0)

      this.searchText = ''
    }
  },
  created () {
  },
  methods: {
    clickEvent (item, idx) {
      // console.log(item, item.uuid)
      this.selectedItem = `${item?.name}_${item.uuid}`
      return this.$emit('change', item)
    },
    getSearchResult (text) {
      const regex = new RegExp(text, 'gi') // text 찾기
      const exceptAll = /all/gi // all 제외

      this.result = this.rawData.filter(data => {
        const name = data?.name
        const onlyMatch = name.match(regex)
        const exceptAllMatch = name.match(regex) && !name.match(exceptAll)
        return text ? exceptAllMatch : onlyMatch
      })
    }
  },
  data () {
    return {
      rawData: [],
      result: [],
      searchText: '',
      selectedItem: undefined
    }
  }
}
</script>

<style lang="scss" scoped>
.search-index-wrap {
  padding: 35px;
  box-sizing: border-box;

  .tit {
    color: $white;
    font-size: 14px;
    display: flex;
    align-items: center;

    span {
      display: block;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      width: 150px;
    }

    &.-route { cursor: pointer }

    .mdi { &::before { margin-left: 5px; font-size: 18px; } }
  }

  .search-area {
    height: 30px;
    margin: $gap 0;
    position: relative;

    .search-icon {
      position: absolute;
      top: 5px; right: 0;
      width: 15px; height: 15px;
      cursor: pointer;

      &::before,
      &::after {
        content: '';
        position: absolute;
      }
      &::before {
        width: 13px; height: 13px;
        top: 0; right: 0;
        border: 2px solid $input-placeholder;
        border-radius: 50%;
      }
      &::after {
        width: 2px; height: 6px;
        top: 13px; right: 0;
        transform: rotate(-45deg);
        background-color: $input-placeholder;
      }
    }
  }

  .result-lists {
    height: 600px;
    > ul {
      height: inherit;
      overflow-y: auto;

      li {
        cursor: pointer;
        font-size: 13px;
        line-height: 30px;

        &.-active {
          font-weight: bold;
        }

        &.-over1 { color: $yellow; }
        &.-over2 { color: $main-red; }
      }
    }

    > .-empty {
      height: inherit;
      display: flex;
      align-items: center;
      justify-content: center;
      color: $input-placeholder;
    }
  }
}
</style>

<style lang="scss">
.search-index-wrap {
  .search-area {
    .el-input {
      .el-input__inner {
        border: none;
        border-bottom: 1px solid $input-placeholder;
        color: $white;
        padding: 0 25px 0 0 ;

        &::placeholder { color: $input-placeholder }
        &:focus { background: none; }
      }
    }
  }
}
</style>
