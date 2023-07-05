<template>
  <div class="network-cate-breadcrumb">
    <el-breadcrumb
      class="ncb-breadcrumb"
      separator-class="el-icon-arrow-right"
    >
      <el-breadcrumb-item
        v-for="(item, index) in netCateBreadcrumb"
        :class="{'-current': netCateBreadcrumb.length - 1 === index }"
        :key="index"
      >
        {{ item }}
      </el-breadcrumb-item>
    </el-breadcrumb>
  </div>
</template>

<script>
export default {
  props: {
    selectedTreeItem: {
      type: Object,
      default () {
        return {}
      }
    }
  },
  computed: {
    netCateBreadcrumb () {
      return this.selectedTreeItem?.cateKey?.split('-') || []
    }
  }
}
</script>

<style lang="scss" scoped>
.network-cate-breadcrumb {
  display: flex;
  justify-content: flex-start;
  height: 36px;
  .ncb-breadcrumb {
    &::v-deep {
      * {
        font-size: 16px !important;
      }
      .el-breadcrumb__item:nth-of-type(2){
        .el-breadcrumb__inner{
          text-transform: none;
        }
      }
    }
  }
}
</style>
