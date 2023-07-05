<template>
  <div
    class="add-model-btn"
    @click="$emit('click')"
  >
    <i class="el-icon el-icon-circle-plus-outline" />
    <span>
      {{ text }}
    </span>
  </div>
</template>

<script>
export default {
  props: {
    text: {
      type: String,
      default: '추가'
    }
  }
}
</script>

<style lang="scss" scoped>
.add-model-btn {
  font-weight: normal;
  font-size: 14px;
  margin: $gap-s 0;
  padding: $gap-s;
  background-color: rgba(196, 196, 196, 0.05);
  text-align: center;
  border-radius: $radius;
  border: 1px dashed $gray;
  cursor: pointer;

  &:hover {
    & .el-icon {
      color: $white;
    }
  }

  & span {
    vertical-align: middle;
  }

  & .el-icon {
    color: #9596a0;
    font-size: 25px;
    vertical-align: middle;
    margin-right: $gap-s * 0.5;
  }
}
</style>
