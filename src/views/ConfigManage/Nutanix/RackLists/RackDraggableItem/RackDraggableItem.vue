<!--
  * 파일명 : RackDraggableItem.vue
  * 파일 기능 : 랙실장도 내부 드래그 가능한 label 컴포넌트 (호스트: block 형태, 네트워크 장비: 삭제 가능 label 형태)
  * 작성자 : 김예담 외 1명
  * 최종 작성일 : 2021-01-13
  * License By Shinsegae I&C
  * 2021-01-13 fix: [랙실장도] - block 타입 지정 (1개일 때, 2개일 때, 3개 이상일 때)
 -->

<template>
  <div
    class="rack-draggable-item"
    :class="{'-active': active}"
    :style="`background-color: ${backgroundColor}; border-color: ${borderColor}`"
    @click="clickEvent"
  >
    <section class="draggable-contents">
      <template v-if="type === 'block'">
        <div class="title-area">
          <a
            class="-draggable-icon"
            :class="{'not-draggable': rackMode === 'default'}"
          />
          <div class="name-cluster">
            {{ cluster.clusterName }}
          </div>
          <div class="add-area">
            <a
              class="icon-add"
              @click="e => selectedCreateBlock(e)"
            />
          </div>
        </div>
        <draggable
          :list="cluster.blocks"
          :group="{name: 'blockGroup'}"
          data-zone="blockGroup"
          handle=".-draggable-block"
          filter=".ignore-elements"
          :nested="true"
          :sort="true"
          :ghost-class="(cluster && cluster.length)? '' :'ghost'"
          @start="onDragStart"
          @end="e => onDragEnd(e, selectedRack, cluster)"
        >
          <div
            v-for="(block, idx_block) in cluster.blocks"
            :key="idx_block"
            class="block-draggable-item"
            :class="{'-active': active}"
          >
            <div
              class="block-area"
            >
              <a
                class="-draggable-icon -draggable-block"
                :class="{'not-draggable': rackMode === 'default'}"
              />
              <div class="name-block">
                {{ block.rackBlockName }}
                <div class="edit-area">
                  <a
                    class="icon-edit"
                    @click="editBlock(block, idx_block)"
                  />
                  <a
                    class="icon-delete"
                    @click="deleteBlock(block, idx_block)"
                  />
                </div>
              </div>
              <span
                class="block-wrap"
                :class="`-type${setBlockType(block.maxCount)}`"
              >
                <i
                  v-for="(item, idx) in block.hostList"
                  class="node-block"
                  :class="[
                    { '-empty': item.nodeCount === 3 },
                    { '-wide': setBlockType(block.maxCount) === 1 },
                    `-type${setBlockType(block.maxCount)}`
                  ]"
                  :key="idx"
                  @click.stop="item == undefined ? null : findHost(item)"
                >
                  <slot
                    name="blockName"
                    :props="item"
                  >
                    <el-tooltip
                      v-if="!(item == undefined)"
                      :content="item.nodeName"
                      placement="top-end"
                      effect="light"
                    >
                      <span style="width: 100%; text-align: center;">{{ idx + 1 }}</span>
                    </el-tooltip>
                  </slot>
                </i>
                <i
                  class="node-block -empty"
                  v-if="block.nodeCount === 3"
                />
              </span>
            </div>
          </div>
        </draggable>
      </template>

      <template v-else>
        <div class="network-item">
          <a
            class="-draggable-icon"
            :class="{'not-draggable': rackMode === 'default'}"
          />
          <slot :item="copiedData">
            <span>{{ data.name }}</span>
          </slot>
          <div
            class="edit-area"
          >
            <a
              class="icon-edit"
              @click="editNetworkItem"
            />
            <a
              class="icon-delete"
              @click="deleteNetworkItem"
            />
          </div>
        </div>
      </template>
    </section>
  </div>
</template>
<script>
import draggable from 'vuedraggable'
export default {
  name: 'RackDraggableItem',
  props: {
    data: {
      type: Object,
      default: () => {}
    },
    rackMode: {
      type: String,
      default: 'default'
    },
    selectedRack: {
      type: Object,
      default: () => {}
    },
    cluster: {
      type: Object,
      default: () => {}
    },
    type: { // 'block' 이면 블럭 설정..
      type: String,
      default: ''
    },
    blockType: {
      type: Number, // 1, 2, 3
      default: 1
    },
    backgroundColor: {
      type: String,
      default: '#461949'
    },
    borderColor: {
      type: String,
      default: '#36476D'
    }
    // switchData: {
    //   type: Array,
    //   default: () => []
    // }
    // nodeCount: {
    //   type: Number,
    //   default: 4
    // }
  },
  components: {
    draggable
  },
  created () {
    this.copiedData = JSON.parse(JSON.stringify(this.data))
  },
  watch: {
    data (newVal) {
      this.copiedData = JSON.parse(JSON.stringify(newVal))
    }
  },
  methods: {
    selectedCreateBlock (el) {
      this.$emit('create-in-cluster', el)
    },
    setBlockType (maxCount) {
      // :block-type="item.maxCount <= 2 ? (item.maxCount === 1 ? 1 : 2) : 3"
      return maxCount <= 2 ? (maxCount === 1 ? 1 : 2) : 3
    },
    clickEvent () {
      this.active = !this.active
      this.$emit('click', this.active ? this.data : null)
    },
    findHost (item) {
      this.$emit('click-block', item?.hostUuid)
    },
    deleteNetworkItem () { // 네트워크 삭제
      this.$emit('delete-network', this.data.elementIdx)
    },
    editNetworkItem () { // 네트워크 수정
      this.$emit('edit-network', this.data.elementIdx)
    },
    deleteBlock (block, idx) { // 블록 삭제
      const payload = {
        idx: idx,
        block: block
      }
      this.$emit('delete-block', payload)
    },
    editBlock (block, idx) { // 블록 수정
      const payload = {
        idx: idx,
        block: block
      }
      this.$emit('edit-block', payload)
    },
    // 드래그 이벤트
    // onDragMove (e) {
    //   console.log(e)
    // },
    onDragEnter (e) {
      e.preventDefault()
      e.target.classList.add('-drag-over')
    },
    onDragLeave (e) {
      e.preventDefault()
      e.target.classList.remove('-drag-over')
    },
    onDragStart (e) {
      // console.log('dragStart', e)
      e.item.classList.add('-active')
    },
    /**
     * 드래그가 끝났을 때, 모든 .empty-zone 의 '-drag-over' 클래스를 제거합니다.
     * @param {event} e 드래그 끝났을 때, 커스텀 event
     * @param {Object} cluster 드래그 되는 영역의 클러스터 정보
     * @return 드래그 끝났을 때, 랙실장도 전체 데이터를 저장합니다.
     */
    onDragEnd (e, rack, cluster) {
      rack.clusters.forEach((item, idx) => {
        if (item.blocks?.length === 0) {
          rack.clusters.splice(idx, 1)
        }
      })

      e.item.classList.remove('-active')
      const emptyNodes = document.querySelectorAll('.empty-zone')

      emptyNodes.forEach(el => {
        el.classList.remove('-drag-over')
      })

      this.$emit('drag-end')

      const alert = (message, callback) => {
        this.$alert(message, '알림', {
          confirmButtonText: this.$t('common.BTN.confirm'),
          callback: callback
        })
      }

      const targetName = e.item._underlying_vm_.name
      // const targetArea = e.to.querySelectorAll('.name-block')
      const targetCluster = e.to.closest('.draggable-contents').querySelector('.name-cluster').innerText
      let hasNodeName = false
      const filteredNodeNames = []
      this.cluster.blocks.forEach(item => {
        if (item.name === targetCluster) {
          item.hosts.forEach(block => {
            if (block.name === targetName) {
              filteredNodeNames.push(block.name)
            }
          })
        }
      })
      hasNodeName = filteredNodeNames.length > 1

      if (hasNodeName) alert(this.$v('중복된 블록명이 있습니다.'), () => false)
    }
  },
  data () {
    return {
      active: false,
      copiedData: {}
      // nodeList: []
    }
  }
}
</script>
<style lang="scss" scoped>
  .rack-draggable-item {
    // display: flex;
    // flex-flow: column nowrap;
    // align-items: center;
    position: relative;
    // padding: $gap-s;
    border-style: solid;
    border-radius: $radius-s;
    border-width: 1px;
    // width: calc(100% - 20px);
    min-height: 32px;
    color: $white;
    box-sizing: border-box;
    transition: all .3s;
    .-draggable-icon {
      display: inline-block;
      width: 15px;
      height: 15px;
      vertical-align: middle;
      background-position: center;
      background-size: contain;
      background-repeat: no-repeat;
      background-image: url('../../../../../assets/images/icon-dragndrop.png');
      &.not-draggable{
        pointer-events: none;
      }
    }
    .draggable-contents {
      position: relative;
      padding: $gap-s;
      border-radius: $radius-s;
      .title-area{
        position: relative;
        display: flex;
        justify-content: flex-start;
        align-items: center;
        width: 100%;
        line-height: 16px;
        .name-cluster{
          padding-left: 5px;
          font-size: 12px;
          font-weight: 700;
          color: #fff;
        }
        .add-area{
          display: none;
          position: absolute;
          right: 0;
          top: 50%;
          transform: translateY(-50%);
          .icon-add{
            display: block;
            width: 16px;
            height: 16px;
            border-radius: 8px;
            background: #36476D url('../../../../../assets/images/icon-rack-add-w.svg') no-repeat 50% 50%;
            background-size: 10px 10px;
          }
        }
      }
      .block-area {
        position: relative;
        margin-top: $gap-s;
        padding: $gap-s $gap-s $gap-s $gap-m;
        background-color: #365283;
        .-draggable-icon{
          position: absolute;
          left: 10px;
          top: 50%;
          transform: translateY(-50%);
        }
        .name-block{
          position: relative;
          padding-bottom: 5px;
          font-size: 12px;
          font-weight: 700;
          color: $white;
          .edit-area{
            display: none;
            position: absolute;
            top: 0;
            right: 0;
            // display: flex;
            align-items: center;
            .icon-edit{
              display: block;
              width: 15px;
              height: 15px;
              background: url('../../../../../assets/images/icon-rack-edit.svg') no-repeat 50% 50%;
              background-size: 15px 15px;
            }
            .icon-delete{
              display: block;
              width: 15px;
              height: 15px;
              background: url('../../../../../assets/images/icon-rack-delete.svg') no-repeat 50% 50%;
              background-size: 15px 15px;
            }
          }
        }
        .block-wrap {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          width: 100%;
          height: 100%;
          &.-type1 {}
          &.-type2 {
            display: grid;
            grid-template-columns: 50% 50%;
            grid-gap: 1px;
            // column-gap: 1px;
          }
          &.-type3 {
            display: grid;
            grid-template-columns: 50% 50%;
            // row-gap: 1px;
            // column-gap: 1px;
            grid-gap: 2px;
            > .node-block {
              font-size: 12px;
              white-space: nowrap;
              height: 16px;
              line-height: 16px;
            }

            .-empty{
              display: flex !important;
            }
          }
          .node-block {
            display: flex;
            align-items: center;
            justify-content: center;
            box-sizing: border-box;
            // padding: 3px 0;
            height: 26px;
            font-style: normal;
            font-size: 12px;
            font-weight: 400;
            color: #e1e1e1;
            // background-color: rgba(#89d3f0, .2);
            background-color: #082049;
            border: none;
            border-radius: $radius-s;
            &:not(.-empty) {
              cursor: pointer;
              &:hover { background-color: lighten(#365283, 10%); }
            }
            &.-wide {width: 100%;}
            &.-empty {
              display: none;
              background-color: transparent;
              border: 1px dashed #8C9CB9;
            }
          }
        }
      }

      .network-item {
        display: flex;
        align-items: center;
        .name-block{
          padding-left: 5px;
          line-height: 16px;
          font-size: 12px;
          font-weight: 700;
          color: $white;
        }
        .-delete-item {
          // display: none;
          position: absolute;
          top: 0;
          right: 0;
        }
        .edit-area{
          display: none;
          position: absolute;
          top: 50%;
          right: 10px;
          transform: translateY(-50%);
          align-items: center;
          .icon-edit{
            display: block;
            width: 15px;
            height: 15px;
            background: url('../../../../../assets/images/icon-rack-edit.svg') no-repeat 50% 50%;
            background-size: 15px 15px;
          }
          .icon-delete{
            display: block;
            width: 15px;
            height: 15px;
            background: url('../../../../../assets/images/icon-rack-delete.svg') no-repeat 50% 50%;
            background-size: 15px 15px;
          }
        }
      }
    }
  }
  .mode-edit{
    .edit-area{
      display: flex !important;
    }
    .add-area{
      display: block !important;
    }
    .buttons-footer{
      display: block;
    }
  }
</style>
