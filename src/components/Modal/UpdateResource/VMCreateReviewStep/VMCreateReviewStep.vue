<!--
  * 파일명 : VMCreateReviewStep.vue
  * 파일 기능 : VM 생성 -> 리뷰 스텝 컴포넌트
  * License By Shinsegae I&C
 -->
<template>
  <div class="vm-create-review-step">
    <article
      class="review-area"
      v-if="defaultInfo"
      :class="{'-is-horizon': isPage}"
    >
      <h5 class="title">
        자원 기본 정보
      </h5>
      <div class="review-table">
        <i
          class="-edit-icon"
          @click="$emit('fix-default', defaultInfo)"
        />
        <vertical-table
          :data="defaultInfo"
          :columns="defaultColumns.map(col => ({
            ...col,
            required: false,
            subTitle: null
          }))"
          :title-width-px="140"
          table-type="input"
          type="horizontal"
          label-align="flex-start"
          no-border
        >
          <template #projectInfo>
            {{ defaultInfo.projectInfo | projectInfo }}
          </template>

          <template #servicePart>
            {{ defaultInfo.servicePartName }}
          </template>

          <template #serviceType>
            {{ defaultInfo.serviceTypeName }}
          </template>

          <template #esxi>
            {{ defaultInfo.esxi ? defaultInfo.esxi.name : '-' }}
          </template>

          <template #networkCate>
            <ul v-if="defaultInfo.networkCates && defaultInfo.networkCates.length">
              <li
                v-for="(net, netIdx) in defaultInfo.networkCates"
                :key="netIdx"
              >
                {{ net.cateKey }}
              </li>
            </ul>

            <span v-else>-</span>
          </template>

          <template #networkInfo>
            <ul v-if="defaultInfo.networkCates && defaultInfo.networkCates.length">
              <li
                v-for="(net, netIdx) in defaultInfo.networkCates"
                :key="netIdx"
              >
                {{ net.deviceName }}&nbsp;
                <small>{{ net.cateKey ? `(${net.cateKey})` : '' }}</small>
              </li>
            </ul>

            <span v-else>-</span>
          </template>
          <!-- 네트워크 정보 -->

          <template #datastore>
            {{ defaultInfo.datastore ? defaultInfo.datastore.name : '-' }}
          </template>
          <!-- 데이터스토어 -->

          <template #image>
            <set-os-icon
              v-if="defaultInfo.selectImage"
              :os-name="`${defaultInfo.selectImage.osType} (${defaultInfo.selectImage.osBit})`"
            />
            <span v-else>-</span>
          </template>

          <template #spec>
            <p>CPU:&nbsp;{{ defaultInfo.spec.flavorCpu }}Core</p>
            <p>Memory:&nbsp;{{ defaultInfo.spec.flavorRam || 0 }}GB</p>
            <p>RootDisk:&nbsp;{{ defaultInfo.spec.flavorDisk }}GB</p>
          </template>

          <template #externalDisk>
            <div v-if="defaultInfo.externalDisk.length">
              <div
                v-for="(disk,diskIdx) in defaultInfo.externalDisk"
                :key="diskIdx"
              >
                <span>{{ disk.diskName || disk.name }}&nbsp; {{ disk.size }} GB </span>
              </div>
            </div>
            <small v-else>-</small>
          </template>

          <template #installProgramList>
            <div
              v-for="(pkg,pkgIdx) in defaultInfo.installProgramList"
              :key="pkgIdx"
            >
              {{ pkg.softwareName }} {{ pkg.versionName }}
            </div>
          </template>

          <template #serviceDate>
            <span v-if="defaultInfo.serviceDate">{{ defaultInfo.serviceDate | date('YYYY.MM.DD HH:mm') }}</span>
            <span v-else>-</span>
          </template>
          <!-- 서비스 개시일 -->

          <template #createDate>
            <span v-if="defaultInfo.createDate">{{ defaultInfo.createDate | date }}</span>
            <span v-else>-</span>
          </template>
          <!-- 자원 생성일 -->
        </vertical-table>
      </div>
    </article>

    <article
      class="review-area"
      :class="{'-is-horizon': isPage}"
      v-if="metaInfo"
    >
      <h5 class="title">
        메타 정보
      </h5>
      <div class="review-table">
        <i
          class="-edit-icon"
          @click="$emit('fix-meta', metaInfo)"
        />
        <vertical-table
          :data="metaInfo"
          :columns="metaColumns.map(col => ({...col, required: false}))"
          :title-width-px="140"
          table-type="input"
          type="horizontal"
          no-border
          label-align="flex-start"
        >
          <template #appManageTeam>
            {{ metaInfo.appManageTeam ? metaInfo.appManageTeam.groupName : '-' }}
          </template>
          <template #appTaskUser>
            <span v-html="appTaskUserStr" />
          </template>
          <template #svManager>
            {{ metaInfo.roleName || '-' }}
          </template>
        </vertical-table>
      </div>
    </article>
  </div>
</template>

<script>
import { SetOSIcon } from '@sd-fe/cmp-core'
export default {
  name: 'VMCreateReviewStep',
  components: { 'set-os-icon': SetOSIcon },
  props: {
    defaultInfo: {
      type: Object,
      default: null,
      required: true
    },
    metaInfo: {
      type: Object,
      default: null
    },
    defaultColumns: {
      type: Array,
      default: () => []
    },
    metaColumns: {
      type: Array,
      default: () => []
    },
    isPage: {
      type: Boolean,
      default: false
    }
  },
  watch: {
    defaultInfo: {
      immediate: true,
      deep: true,
      handler (val) {
        console.log('defaultInfo:: ', this.defaultInfo)
      }
    }
  },
  computed: {
    networkCatesStr () {
      const { networkCates } = this.defaultInfo
      const str = networkCates?.length
        ? networkCates.map(net => net.cateKey)
          .join('<br>')
        : '-'
      return str
    },
    appTaskUserStr () {
      const { appTaskUser } = this.metaInfo

      const arr = []
      if (appTaskUser) {
        appTaskUser.forEach(user => {
          arr.push(`${user.userName}(${this.$options.filters.maskingName(user.userId)})`)
        })
      }
      const str = arr.length
        ? arr.join('<br>')
        : '-'
      return str
    }
  },
  data: () => ({

  })
}
</script>

<style lang="scss" scoped>
  .review-area {
    padding: 20px 0;
    > .title { font-size: 14px; line-height: 14px; font-weight: 700; }
    .review-table {
      position: relative;
      margin-top: $gap-s;
      padding: 30px;
      background-color: #0A0C20; //
      border-radius: $radius;
    }
    .-edit-icon {
      position: absolute;
      top: $gap;
      right: $gap;
      cursor: pointer;
    }

    &.-is-horizon {
      display: flex;
      align-items: flex-start;
      > .title {
        min-width: 130px;
        font-size: 18px;
        font-weight: 500;
        line-height: 32px;
        letter-spacing: -0.9px;
        color: #fff; //
        display: flex;
        align-items: center;
      }
      .review-table { margin: 0 0 0 20px; }
    }
  }
  .vertical-table {
    .register-contents.-input {
      &::v-deep .contents-title {
        > .contents-title-text {
          color: #999 !important;
        }
      }
    }
  }
</style>
