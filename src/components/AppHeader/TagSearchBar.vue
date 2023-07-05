<template>
  <div
    class="tag-search-bar"
    :class="{'input--selected': isSelected}"
  >
    <el-input
      v-model="searchValue"
      ref="tagSearchInput"
      class="tag-search-input"
      placeholder="자원태그 검색"
      @blur="handleBlurSearch"
      @keypress.enter.native="handleKeypressEnter"
      @keyup.esc.native="handleKeyPressEsc"
    />
    <a
      class="search-icon"
      @click="handleClickSearchIcon"
    >
      <search-icon />
    </a>
  </div>
</template>

<script>
import { createNamespacedHelpers } from 'vuex'
import SearchIcon from '../Icons/SearchIcon.vue'

const { mapMutations } = createNamespacedHelpers('cloud')
export default {
  components: { SearchIcon },
  methods: {
    ...mapMutations({
      setIsRenderCloudSwitch: 'SET_IS_RENDER_CLOUD_SWITCH'
    }),
    /** EVENT_HANDLER (검색) 아이콘을 클릭했을때 라우팅한다. */
    handleClickSearchIcon () {
      this.setIsRenderCloudSwitch(false)
      console.log('handleClickSearchIcon')
      if (this.searchValue) {
        this.routeToSearchPage(this.searchValue)
        setTimeout(() => {
          this.searchValue = ''
        }, 200)
        this.isSelected = false
      } else {
        this.$refs.tagSearchInput.focus()
        this.isSelected = true
      }
    },
    handleBlurSearch () {
      if (!this.$route.path.includes('resource-tag-search') && !this.searchValue) {
        // this.setIsRenderCloudSwitch(true)
      }
      if (!this.searchValue) { this.isSelected = false }
    },
    handleKeypressEnter () {
      this.setIsRenderCloudSwitch(false)
      console.log('handleKeypressEnter')
      if (this.searchValue) {
        this.routeToSearchPage(this.searchValue)
        this.isSelected = false
        setTimeout(() => {
          this.searchValue = ''
        }, 200)
      }
    },
    handleKeyPressEsc () {
      this.searchValue = ''
      this.isSelected = false
    },
    routeToSearchPage (text) {
      this.$router.push({ name: 'resource-tag-search', params: { searchValue: text } })
    }
  },
  data () {
    return {
      searchValue: '',
      isSelected: false
    }
  }
}
</script>

<style lang="scss" scoped>
.tag-search-bar {
      width: 0px;
  // border: 1px solid red;
  position: relative;
  margin-left: 40px;
  transition: 0.3s all ease-in-out;
  height: 36px;
  .tag-search-input {
    width: 0px;
    height: 36px;
    &::v-deep {
      .el-input__inner {
        border: 0px;
        padding: 0px;
        background: none;
        color: white;
      }
    }
      transition: 0.3s all ease-in-out;
  }

  .search-icon {
    position: absolute;
    cursor: pointer;
    right: 0px;
    top: 60%;
    transform: translateY(-50%) scale(1.5);
  }
  &.input--selected {
    width: 120px;
    border-bottom: 1px solid $gray;
    .tag-search-input {
      width: 90px;
      &::v-deep {
        .el-input__inner {
          border: 0px;
          padding: 0px;
          background: none;
          color: white;
        }
      }
    }

    .search-icon {
      position: absolute;
      right: 0px;
      top: 50%;
      transform: translateY(-50%) scale(1);
    }
  }
}
</style>
