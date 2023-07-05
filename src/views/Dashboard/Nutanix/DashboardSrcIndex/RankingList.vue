<template>
  <article class="ranking-list-wrapper">
    <div class="ranking-header">
      <h6>{{ indexTitle }}</h6>
      <h4>{{ srcTitle }}</h4>

      <span
        class="sorting"
        @click="setSorting"
      >
        <i class="sort-icon" />
        {{ asc ? $t('main.DASHBOARD.sortlower') : $t('main.DASHBOARD.sortHigher') }}
        <!-- {{ asc ? '낮은 순' : '높은 순' }} -->
      </span>
    </div>

    <ul
      class="rankings"
      v-if="result.length"
    >
      <li
        v-for="(item, idx) in result"
        :key="`rank_${idx}`"
        @click="$emit('selectedNode', item)"
      >
        <strong :class="['rank', `rank_${idx + 1}`]">{{ idx + 1 }}</strong>
        <p class="text">
          {{ item.name }}

          <span class="percentage">
            <b>{{ item.value }}/</b>
            {{ item.max }}%
          </span>
        </p>
      </li>
    </ul>

    <span
      v-else
      class="-empty"
    >
      {{ $t('common.PLACEHOLDER.noData') }}
    </span>
  </article>
</template>

<script>
export default {
  name: 'RankingList',
  props: {
    indexTitle: {
      type: String,
      default: undefined
    },
    srcTitle: {
      type: String,
      default: undefined
    },
    data: {
      type: Array,
      default: () => []
    }
  },
  watch: {
    data (data) {
      this.rawData = []
      this.rawData = data
      this.setRankingData(this.rawData)
    }
  },
  methods: {
    /**
     * 높은순/낮은순 데이터를 세팅합니다.
     */
    setSorting () {
      this.asc = !this.asc
      const reverseRawData = this.rawData.reverse()

      this.setRankingData(reverseRawData)
    },
    setRankingData (rawData = this.rawData) {
      const temp = []
      for (let i = 0; i < 10; i++) {
        if (rawData[i]) temp.push(rawData[i])
      }
      this.result = temp
    }
  },
  data () {
    return {
      asc: true,
      rawData: [],
      result: []
    }
  }
}
</script>

<style lang="scss" scoped>
.ranking-list-wrapper {
  box-sizing: border-box;
  padding: 40px;
  flex: 0 0 100%;

  .ranking-header {
    position: relative;
    margin-bottom: $gap-m;
    color: $white;

    h6 {
      color: $input-placeholder;
      font-size: 13px;
      margin-bottom: 5px;
    }
    h4 { font-size: 18px; }

    .sorting {
      position: absolute;
      top: 0; right: 0;
      cursor: pointer;
      font-size: 13px;
      display: flex;
      line-height: 13px;
      align-items: center;

      .sort-icon {
        margin-right: 5px;
        width: 13px;
        height: 13px;
        display: block;
        background: url('../../../../assets/images/dashboard/sort.svg') no-repeat;
      }
    }
  }

  .rankings {

    li {
      border-bottom: 1px solid #2B2D51;
      height: 55px;
      display: flex;
      align-items: center;

      .rank {
        color: $white;
        display: block;
        text-align: center;
        line-height: 30px;
        width: 30px;
        height: 30px;
        border-radius: 3px;
        font-size: 16px;
        margin-right: 15px;

        &.rank_1 { background: linear-gradient(134.16deg, $main-red -9.13%, #FF969F 104.23%); }
        &.rank_2 { background: linear-gradient(130.52deg, $yellow 3.92%, #F9BD50 78.33%); }
        &.rank_3 { background: linear-gradient(130.79deg, $sea-blue -5.89%, #6EA2D8 108.05%); }
      }
    }

    .text {
      display: flex;
      flex: 1 1 auto;
      justify-content: space-between;
      align-items: center;
      cursor: pointer;

      .percentage {
        font-weight: 300;
        b { font-size: 16px; font-weight: 700; }
      }
    }
  }
  .-empty {
    height: 80%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: $input-placeholder;
  }
}
</style>
