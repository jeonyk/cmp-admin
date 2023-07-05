<template>
  <div class="ami-empty">
    AMI를 선택해주세요.
  </div>
</template>

<script>
export default {
  name: 'AmiEmpty'
}
</script>

<style lang="scss" scoped>
.ami-empty {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 44px;
  background-color: #fcfcfc;
  border: 1px dashed $input-stroke;
  border-radius: 6px;
  color: $text-lighter-gray;
}
</style>
