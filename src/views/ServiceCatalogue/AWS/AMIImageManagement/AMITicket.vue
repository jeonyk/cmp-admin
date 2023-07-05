<template>
  <dynamic-scroller
    v-if="imageTickets.length"
    class="ami-items"
    key-field="imageId"
    :items="imageTickets"
    :min-item-size="270"
  >
    <template v-slot="{ item, index, active }">
      <dynamic-scroller-item
        :item="item"
        :active="active"
        :data-index="index"
        class="ami-item-wrapper"
      >
        <li
          :class="['ami-item', { '-selected': selectedImageID === item.imageId }]"
          @click="selectedAMI(item)"
        >
          <div class="-name">
            <strong>{{ item.name }}</strong>
            <!-- 🌸 적용 :: {{ item.amiScriptHistoryIdx }} -->
            <i
              v-if="!isExt"
              :class="['-dot', { '-has-script': item.amiScriptHistoryIdx }]"
            />
          </div>
          <span>{{ item.imageId }} ({{ item.architecture ? setImageBitInfo(item) : '-' }})</span>

          <el-switch
            class="-switch -user-exposure"
            v-if="!isExt"
            v-model="item.isShownUser"
            :disabled="!item.amiScriptHistoryIdx"
            @click.native.stop="amiShowUser(item.isShownUser, item)"
          />
          <!-- /. on/off -->

          <button
            v-if="!isExt"
            :class="['button -switch -bastion-host', { '-checked': item.isBastion }]"
            :type="item.isBastion ? 'is-primary' : 'is-anti'"
            :disabled="!item.amiScriptHistoryIdx"
            @click.stop="$emit('set-bastion', item)"
          >
            <i
              v-if="item.isBastion"
              class="-checked"
            />
            <!-- {{ item.isBastion ? 'Bation 이미지' : 'Bation 이미지로 설정' }} -->
            {{ item.isBastion ? $t('service.AMIImage.BTN.bastionImage') : $t('service.AMIImage.BTN.setBastionImage') }}
          </button>
          <!-- /. Bastion 설정 버튼 -->

          <textarea
            class="description tiny-scroll"
            readonly
            :value="item.description"
          />

          <div
            v-if="item.defaultInstanceType"
            class="bastion-info"
          >
            <span>Bastion Spec : {{ item.defaultInstanceType }}</span>
          </div>

          <div class="tags flex-wrap">
            <dl
              class="flex-wrap"
              v-for="tag in item._tags"
              :key="`${tag.dt}_${item.imageId}`"
            >
              <dt>{{ tag.dt }}</dt>
              <!-- <dd>{{ typeof tag.dd === 'boolean' ? (tag.dd ? '예' : '아니오') : tag.dd }}</dd> -->
              <dd>{{ typeof tag.dd === 'boolean' ? (tag.dd ? $t('common.TERMS.yes') : $t('common.TERMS.no')) : tag.dd }}</dd>
            </dl>
          </div>
        </li>
      </dynamic-scroller-item>
    </template>
  </dynamic-scroller>
</template>

<script>
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'
import { DynamicScroller, DynamicScrollerItem } from 'vue-virtual-scroller'
import API from '@sd-fe/cmp-core'

export default {
  name: 'AMITicket',
  components: {
    'dynamic-scroller': DynamicScroller,
    'dynamic-scroller-item': DynamicScrollerItem
  },
  props: {
    isExt: { // [AMI 등록] 모달에서 사용하는 내용일때 (아마존에서 내려주는 AMI 인경우) true 로 설정
      type: Boolean,
      default: false
    },
    region: {
      type: String,
      default: undefined
    },
    data: {
      type: Array,
      default: () => []
    }
  },
  watch: {
    region () {
      this.selectedImageID = undefined
    },
    data (items) {
      if (!this.isExt) {
        this.imageTickets = []
        this.selectedImageID = undefined
        setTimeout(() => this.setImageTicketData(items), 10)
      }
    }
  },
  created () {
    if (this.data.length) this.setImageTicketData(this.data)
  },
  methods: {
    setImageTicketData (data) {
      this.imageTickets = data.map(ticket => {
        // console.log(ticket.platformDetails)
        const _tags = [
          { dt: this.$t('service.AMIImage.platform'), dd: ticket.platformDetail || ticket.platformDetails }, // 플랫폼
          { dt: this.$t('service.AMIImage.rootDeviceType'), dd: ticket.rootDeviceType }, // 루트디바이스유형
          { dt: this.$t('service.AMIImage.virtualize'), dd: ticket.virtualizationType }, // 가상화
          { dt: this.$t('service.AMIImage.ENAActivated'), dd: ticket.enaSupport } // ENA 활성화됨
        ]

        if (!this.isExt) _tags.unshift({ dt: this.$t('service.AMIImage.owner'), dd: ticket.imageOwnerAlias }) // 소유자

        return { ...ticket, _tags }
      })
    },
    /**
     * ami 티켓을 클릭했을 때 발생하는 이벤트입니다.
     */
    selectedAMI (image) {
      this.selectedImageID = image.imageId
      this.$emit('selected-image', image)
    },
    /**
     * ami 사용자 노출여부 설정
     * @param {Boolean} isShownUser
     * @param {Object} imageId
     */
    async amiShowUser (isShownUser, { imageId }) {
      // console.log(isShownUser, imageId)
      try {
        await API.aws.setAMIUser({ isShownUser, imageId })
      } catch (error) {
        console.error(error)
        const message = {
          'Not exist init script': this.$t('service.AMIImage.ALERT.013') // init script 가 등록되지 않았습니다.
        }[error.response.data.message] || this.$t('service.AMIImage.ALERT.002') // 변경하는데 실패했습니다. <br> 다시 시도해주세요.

        this.$alert(message, '', { dangerouslyUseHTMLString: true, callback: () => false })
      }
    }
  },
  data () {
    return {
      imageTickets: [],
      selectedImageID: undefined,
      setImageBitInfo ({ architecture }) {
        const arch = architecture.split('_')
        const bit = this.$t('admin.PREF.bit') // 비트
        return `${arch[1]}${bit}(${arch[0]})`
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.ami-item-wrapper {
  padding-bottom: $gap-s;
}
.ami-item {
  box-sizing: border-box;
  width: 100%;
  min-height: 270px;
  padding: 25px 30px 30px;
  background: #0A0C20;
  border-radius: 6px;
  cursor: pointer;
  transition: 0.3s background-color ease;
  position: relative;

  .-name {
    position: relative;
    display: inline-block;

    strong {
      color: $white;
      display: block;
      transition: 0.3s color ease;
      max-width: 450px;
      text-overflow: ellipsis;
      height: 14px;
      white-space: nowrap;
      overflow: hidden;
    }

    .-dot {
      position: absolute;
      display: block;
      top: -2px; right: -7px;
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background-color: $main-red;
      &.-has-script { background-color: $sea-blue; }
    }
  }

  span {
    margin: $gap-s 0 $gap 0;
    display: block;
    font-size: 13px;
    color: $text-lighter-gray;
    font-weight: normal;
    line-height: 13px;
    height: 13px;
    transition: 0.3s color ease;
  }

  .-switch {
    position: absolute;

    &.-user-exposure { top: 20px; right: 30px; }
    &.-bastion-host {
      top: 15px; right: 95px;
      width: 150px;
      padding: 0;
      border: 1px solid $primary;
      color: $primary;

      &.-checked { color: $white; }
      &[disabled=disabled] {
        background-color: transparent;
        border: 1px solid $input-placeholder;
        color: $input-placeholder;
      }
    }

    .-checked {
      position: relative;
      display: inline-block;
      width: 10px; height: 10px;
      margin-right: 5px;
      &::before, &::after {
        position: absolute;
        content: '';
        display: block;
        background-color: $white;
      }
      &::before {
        top: 5px; left: 0;
        width: 5px; height: 2px;
        transform: rotate(50deg)
      }
      &::after {
        top: 5px; right: -1px;
        width: 8px; height: 2px;
        transform: rotate(-35deg)
      }
    }
  }

  .description {
    margin-top: $gap;
    height: 130px;
    border: 1px solid $purple-gray;
    border-radius: 5px;
    box-sizing: border-box;
    padding: 15px;
    overflow-y: auto;
    font-size: 13px;
    color: $light-gray;
    background-color: transparent;
    display: block;
    width: 100%;
    line-height: 1.5;
    resize: none;
    margin-bottom: 15px;
    transition: 0.3s background-color ease;
    cursor: pointer;

    &:focus { outline: none;}
  }

  .tags {
    color: $text-lighter-gray;
    font-size: 12px;

    dl {
      height: 10px;
      border-right: 1px solid $text-lighter-gray;
      padding-right: $gap-s;
      margin-right: $gap-s;

      dd {
        font-weight: normal;
        margin-left: 5px;
      }
      &:last-child {
        border: none;
        margin: 0;
        padding: 0;
      }
    }
  }

  .bastion-info {
    margin-bottom: 10px;
    display: block;
    span {
      display: inline-block;
      background-color: $purple-gray;
      line-height: 25px;
      height: 25px;
      padding: 0 15px;
      font-size: 12px;
      border-radius: 3px;
      margin: 0;
    }
  }

  &:last-child { margin: 0; }

  &.-selected {
    background-color: $white;

    .-switch {
      &.-bastion-host {
        color: $text-black;
        &.-checked { color: $white; }
        &[disabled=disabled] { color: $input-placeholder; }
      }
    }

    strong,
    .description { color: $text-black; }

    .description {
      background: #F6F6F6;
      border: none;
    }

    .tags { color: $text-dark-gray; }

    .bastion-info {
      span {
        display: inline-block;
        background-color: $light-gray;
        line-height: 25px;
        height: 25px;
        padding: 0 15px;
        font-size: 12px;
        border-radius: 3px;
        margin: 0;
        color: $input-placeholder;
      }
    }
  }
}
</style>
