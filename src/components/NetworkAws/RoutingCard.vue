<template>
  <li class="card">
    <p class="ip">
      {{ data.destinationCidrBlock }}
    </p>
    <p class="resource-id">
      {{ data.gatewayId || data.natGatewayId }}
    </p>
  </li>
</template>

<script>
export default {
  props: {
    data: {
      type: Object,
      default: () => {}
    }
  }
}
</script>

<style scoped>
.card {
  width: 390px;
  height: 80px;
  border-radius: 6px;
  background: #0a0c20;
  padding: 22px;
  overflow: hidden;
  box-sizing: border-box;
}

.ip {
  color: #fff;
}
.resource-id {
  color: #e1e1e1;
  color:grey;
  margin-top: 10px;
}
</style>
