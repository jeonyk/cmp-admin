<template>
  <div class="section-input">
    <el-input
      v-model="searchValue"
      ref="tagSearchInput"
      class="tag-search-input resource-search-input"
      :class="{'section-input__is-focus' : isFoucsed}"
      placeholder="자원태그 검색"
      @keypress.enter.native="handleKeypressEnter"
      @focus.passive="handleFoucsInput"
      @blur.passive="handleBlurInput"
    />
    <a
      class="search-link"
      @click="handleClickSearchIcon"
    >
      <search-icon
        class="search-icon"
      />
    </a>
  </div>
</template>

<script>
import SearchIcon from '@/components/Icons/SearchIcon.vue'
export default {
  components: {
    SearchIcon
  },
  watch: {
    '$route.params.searchValue': {
      handler (val) {
        this.setSearchInputValue()
      }
    }
  },
  created () {
    this.searchValue = this.$route.params.searchValue
  },
  methods: {
    /** EVENT_HANDLER */
    handleFoucsInput () {
      this.isFoucsed = true
    },
    /** EVENT_HANDLER  */
    handleBlurInput () {
      this.isFoucsed = false
    },
    setSearchInputValue () {
      this.searchValue = this.$route.params.searchValue
    },
    /** EVENT_HANDLER (검색) 아이콘을 클릭했을때 라우팅한다. */
    handleClickSearchIcon () {
      if (this.searchValue) {
        this.routeToSearchPage(this.searchValue)
        this.$emit('search', this.searchValue)
      } else {
        this.$alert('태그 검색어를 입력해주세요')
      }
    },
    routeToSearchPage (text) {
      this.$router.push({ name: 'resource-tag-search', params: { searchValue: text } })
    },
    handleKeypressEnter () {
      console.log('handleKeypressEnter')
      if (this.searchValue) {
        this.routeToSearchPage(this.searchValue)
        this.$emit('search', this.searchValue)
      } else {
        this.$alert('태그 검색어를 입력해주세요')
      }
    }
  },

  data () {
    return {
      isFoucsed: false,
      searchValue: ''
    }
  }
}
</script>

<style lang="scss" scoped>
  .tag-search-input {
    height: 36px;
    border-bottom: 2px solid $gray;
    transition: border-bottom 0.15s ease-in-out;
    &.section-input__is-focus {
     border-bottom: 2px solid white;
    }
    &:hover {
     border-bottom: 2px solid white;
    }
    &::v-deep {
      .el-input__inner {
        box-sizing: border-box;
        border: 0px;
        padding: 0px;
        padding-right: 60px;
        padding-left: 4px;
        font-size: 16px;
        background: none !important;
        color: white !important;
      }
    }
  }
    .section-input{
      position:relative;
      .resource-search-input {
        width: 100%;
      }
      .search-link {
        position: absolute;
        top: 0px;
        right: 0px;
        width: 40px;
        height: 40px;

        .search-icon {
          position: absolute;
          top: 50%;
          left: 50%;
          transform:translate(-50%,-70%) scale(1.5);
        }
      }
    }
</style>
