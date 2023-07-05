<template>
  <li :class="['region-card card', { 'is-no-exposed': !isExposed }]">
    <section class="card-section">
      <header class="card-header">
        <h3 class="card-number-text">
          {{ data.index }}
        </h3>
        <div class="card-title-row">
          <h2
            class="card-displayname"
            style="margin-left: 10px"
          >
            {{ data.displayName }}
          </h2>
          <el-switch
            style="margin-right: 3px"
            v-model="isExposed"
            @change="$emit('switch', data.regionName, $event)"
          />
        </div>
      </header>
      <p style="color: #3e57c9; margin-top: 10px">
        {{ data.regionName }}
      </p>
      <div class="all-regions-row">
        <p>{{ $v('전체 가용 영역') }}</p>
        <span> {{ data.availableZones.length }}</span>
      </div>
    </section>
    <div class="divider" />
    <section class="card-section">
      <div style="margin-top: 20px">
        <p>
          {{ $v('기본 가용 영역') }}
          <i
            @click="updateRegions(data.availableZones, data.regionName)"
            class="el-icon-edit"
          />
        </p>
      </div>
      <div
        v-if="data.availableZones.length"
        style="margin-top: 15px; height: 35px; overflow: hidden"
      >
        <el-tag
          v-for="tag in defaultZones"
          :key="tag.zoneName"
        >
          {{ tag.zoneName }}
        </el-tag>
      </div>
    </section>
  </li>
</template>

<script>
export default {
  props: {
    data: {
      type: Object,
      default: () => {}
    }
  },
  watch: {
    data: {
      deep: true,
      immediate: true,
      handler (newVal) {
      }
    }
  },
  computed: {
    defaultZones () {
      const defaultZones = this.data.availableZones
        .filter((z) => z.selected)
        .slice(0, 2)
      return defaultZones
    }
  },
  created () {
    const ran = Math.random()
    if (ran > 0.5) this.isExposed = true
    this.isExposed = this.data.isExposed
  },
  methods: {
    filterDefaultZones (availableZones) {
      const result = availableZones.filter((zone) => zone.selected).slice(0, 2)
      return result || []
    },
    updateRegions (availableZones, id) {
      this.$emit('update-regions', availableZones, id)
    }
  },
  data () {
    return {
      obj: {},
      isExposed: false
    }
  }
}
</script>

<style lang="scss" scoped>
.card {
  position: relative;
  width: 20%;
  width: calc(20% - 10px);
  height: 210px;
  background: #0a0c20;
  padding: 0 20px;
  box-sizing: border-box;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  &.is-no-exposed {
    background: #2a2d44;
    color: #727797;
  }

  .divider {
    width: 100%;
    margin: auto;
    height: 1px;
    background: #3d435e;
  }

  .card-section {
    margin: 2px;
    height: 50%;
    display: flex;
    flex-direction: column;

    .all-regions-row {
      display: flex;
      justify-content: space-between;
      height: 100%;
      align-items: flex-end;
      margin-bottom: 10px;
    }

    .card-header {
      display: flex;
      height: 38px;

      .card-number-text {
        width: 26px;
        height: 38px;
        line-height: 50px;
        text-align: center;
        background: #3e57c9;
      }

      .card-title-row {
        width: 100%;
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        .card-displayname {
          font-size:16px;
        }
      }
    }
  }
}

.el-icon-edit {
  cursor: pointer;
  margin-left: 10px;
}
</style>

<style lang="scss">
.region-availability-zone {
  .el-tag {
    padding: 0 10px;
    font-size: 10px;
  }
  .card.is-no-exposed {
    .el-tag {
      background: #3d435e !important;
      color: #727797;
    }
  }
}
</style>
