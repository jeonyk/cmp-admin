<template>
  <div class="cloud-switch">
    <div class="cloud-switch-group">
      <div
        class="cloud-switch-group__button"
        :class="{ active: activePrivate }"
        @click="toggleActive('private')"
      >
        <span> Private ({{ privateClouds.length }}) </span>
      </div>
      <div
        class="cloud-switch-group__button"
        :class="{ active: activePublic }"
        @click="toggleActive('public')"
      >
        <span> Public ({{ publicClouds.length }}) </span>
      </div>
    </div>
    <div class="cloud-switch-select">
      <!-- v-model="currentCloud" -->
      <el-select
        :value="currentCloud"
        class="switch-select"
        @change="onChangeCloud"
      >
        <template
          v-if="currentCloud"
          #prefix
        >
          <img
            :src="getImgUrlByLabel(currentCloud)"
            alt="cloud"
            class="prefix-cloud-image"
          >
        </template>
        <el-option
          v-for="cloud in currentCloudOptions"
          :key="cloud.label"
          :label="cloud.displayLabel"
          :value="cloud.label"
        >
          <img
            :src="
              getImgUrl(
                cloud.label.toLowerCase() === 'aws'
                  ? cloud.images[1]
                  : cloud.images[0]
              )
            "
            class="prefix-cloud-image-option"
          >
          <span>{{ cloud.displayLabel }}</span>
        </el-option>
      </el-select>
    </div>
  </div>
</template>

<script>
import { createNamespacedHelpers } from 'vuex'
import { cloneDeep } from 'lodash'

const { mapGetters, mapActions } = createNamespacedHelpers('cloud')

export default {
  name: 'CloudSwitch',
  computed: {
    ...mapGetters({
      cloud: 'getCloud',
      cloudType: 'getCloudType',
      shortlyCloud: 'getShortlyCloud',
      moduleInfo: 'getModuleInfo'
    }),
    currentCloudOptions () {
      return this.activePrivate ? this.privateClouds : this.publicClouds
    },
    currentCloudType () {
      return this.activePrivate ? 'private' : 'public'
    }
  },
  watch: {},
  created () {
    this.cloudInfo = cloneDeep(this.moduleInfo)
    this.$nextTick(() => {
      delete this.cloudInfo.network
      this.publicClouds = Object.values(this.cloudInfo).filter((el) => el.type === 'public')
      this.privateClouds = Object.values(this.cloudInfo).filter((el) => el.type === 'private')
      this.activePrivate = this.cloudType === 'private'
      this.activePublic = this.cloudType === 'public'
      this.setCurrnetCloud()
      this.$store.watch(
        (state, _getters) => state.cloud.cloud,
        this.handleRouteToDashboard,
        { deep: true }
      ) // cloud store state 값의 변경 사항이 감지되면 대시보드로 이동
    })
  },
  methods: {
    ...mapActions({
      changeCloud: 'changeCloud'
    }),
    setCurrnetCloud () {
      this.currentCloud = this.currentCloudOptions.find(cloud => {
        return cloud.label.toLowerCase() === this.cloud.toLowerCase()
      })?.label
    },
    toggleActive (type) {
      if (type === 'public') {
        if (!process.env.VUE_APP_SHOW_PUBLIC) {
          return this.$alert('해당 기능은 4월 내에 오픈 예정입니다.')
        }
      }
      const defaultCloud = type === 'private' ? 'Nutanix' : 'AWS'
      this.$confirm(this.$t('common.CONFIRM.BASE.038', { cloud: defaultCloud }))
        .then(() => {
          if (type === 'private' && !this.activePrivate) {
            this.activePrivate = true
            this.activePublic = false
            this.changeCloud({
              cloudType: 'private',
              cloud: this.cloudInfo.nutanix.label,
              shortlyCloud: this.cloudInfo.nutanix.shortlyLabel
            })
          } else if (type === 'public' && !this.activePublic) {
            this.activePrivate = false
            this.activePublic = true
            this.changeCloud({
              cloudType: 'public',
              cloud: this.cloudInfo.aws.label,
              shortlyCloud: this.cloudInfo.aws.shortlyLabel
            })
          }
        })
        .catch(() => false)
    },
    getImgUrl (imgName) {
      return require('../../assets/images/clouds/' + imgName.toLowerCase())
    },
    getImgUrlByLabel (label) {
      label = label.toLowerCase()
      return label === 'aws'
        ? require('../../assets/images/clouds/aws-white.png')
        : require('../../assets/images/clouds/' + label + '.png')
    },
    onChangeCloud (e) {
      this.$confirm(this.$t('common.CONFIRM.BASE.038', { cloud: e }))
        .then(() => {
          const arrCloudInfo = [
            ...Object.keys(this.cloudInfo).map(key => this.cloudInfo[key])
          ]
          const cloud = arrCloudInfo.find(
            cloud => cloud.label.toLowerCase() === e.toLowerCase()
          )

          this.changeCloud({
            cloudType: cloud.type,
            cloud: cloud.label,
            shortlyCloud: cloud.shortlyLabel
          })
        })
        .catch(() => false)
    },
    handleRouteToDashboard () {
      window.location.replace(`/main/${this.shortlyCloud}/dashboard`)
    }
  },
  data () {
    return {
      activePrivate: false,
      activePublic: false,
      currentCloud: '',
      cloudInfo: {},
      publicClouds: [],
      privateClouds: []
    }
  }
}
</script>

<style lang="scss" scoped>
.prefix-cloud-image-option {
  margin-right: 5px;
}

.cloud-switch {
  display: flex;
  align-items: center;

  &-group {
    display: flex;
    align-items: center;
    background-color: $main-gray;
    border-radius: 50px;

    &__button {
      display: flex;
      align-items: center;
      cursor: pointer;
      height: 28px;
      padding: 2px 12px;
      background-color: $main-gray;
      border-radius: 50px;
      transition: background-color 300ms ease;
      will-change: background-color;

      &.active {
        background-color: $primary;
        box-shadow: 4px 4px 10px #1d2b69;
      }
    }
  }

  &-select {
    & .switch-select {
      max-width: 120px;
      margin-left: $gap-s;

      &::v-deep > .el-input {
        &.is-focus {
          .el-input__inner {
            color: $white;
            background-color: transparent;
          }

          .el-input__suffix {
            .el-select__caret {
              color: $white;
            }
          }
        }

        .el-input__suffix {
          right: 0;

          .el-select__caret {
            width: 15px !important;
          }
        }

        input {
          border: none;
          border-bottom: 1px solid $purple-gray;
          font-size: 15px;
          font-weight: bold;

          &:focus {
            background-color: transparent;
            border: none;
            border-bottom: 1px solid $purple-gray;
          }
        }

        .el-input__prefix {
          top: 9px;
        }
      }
    }
  }
}
</style>
