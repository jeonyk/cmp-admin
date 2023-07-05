<!--
  * 파일명 : ServerClusterComp.vue
  * 파일 기능 : 랙실장도 임시 (현재 사용하지 않음)
  * 작성자 : 정재은
  * 최종 작성일 : 2020-10-12
  * License By Shinsegae I&C
  * 2020-10-12 fix: 랙 실장도 임시 디자인 스타일 수정
 -->

<template>
  <div>
    <div class="cluster-sect">
      <!-- <div class="between mdi mdi-chevron-double-right" /> -->

      <article class="clster-lists-rght">
        <!-- <h5 class="group-title">
          {김포 IDC : Main 통합 인프라 2세대(Legacy Network)}
        </h5> -->

        <!-- 선택... -->
        <!-- <div>
          <el-select
            v-model="arrangeCluster"
            placeholder="선택"
            size="mini"
            :popper-append-to-body="false"
          >
            <el-option
              v-for="item in arrangeClusterLists"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </div> -->

        <div class="clstr-cont-right cont-wrap">
          <slick-carousel
            v-bind="clusterSlideSettings"
            class="cluster-lists-slick"
          >
            <div
              v-for="(cluster) in clusterSampleData"
              :key="`cluster-${cluster.id}`"
              class="vm-list"
            >
              <strong class="-name">{{ cluster.name }}</strong>

              <div class="indiv-clst">
                <div class="ipmi-info">
                  <p>10G #1</p>
                  <p>10G #2</p>
                  <p class="-ipmi">
                    IPMI
                  </p>
                </div>

                <div class="node-lists tiny-scroll">
                  <ul>
                    <li
                      v-for="n in 16"
                      :key="'node_' + n"
                      class="indiv-node"
                    >
                      {{ n }}
                    </li>
                  </ul>
                </div>

                <div class="-detail-pro">
                  <div class="progrs -vcpu">
                    <p>
                      <span>VCPU</span>
                      <span>{{ cluster.vcpu }} 개</span>
                    </p>
                    <el-progress
                      :text-inside="true"
                      :stroke-width="15"
                      :percentage="70"
                    />
                  </div>
                  <div class="progrs -memory">
                    <p>
                      <span>Memory</span>
                      <span>{{ cluster.memory }} GB</span>
                    </p>
                    <el-progress
                      :text-inside="true"
                      :stroke-width="15"
                      :percentage="100"
                      status="success"
                    />
                  </div>
                  <div class="progrs -storage">
                    <p>
                      <span>Storage</span>
                      <span>{{ cluster.storage }} TB</span>
                    </p>
                    <el-progress
                      :text-inside="true"
                      :stroke-width="15"
                      :percentage="80"
                      status="warning"
                    />
                  </div>
                </div>

                <div class="-volume">
                  <p> RX 76Kb/s </p>
                  <p> TX 3005Kb/s </p>
                </div>
              </div>
            </div>
            <!-- <div>2</div> -->
          </slick-carousel>
        </div>
      </article>
      <!-- /.clster-lists-rght -->
    </div>
  </div>
</template>

<script>
export default {
  name: 'ServeerClusterComp',
  props: {
    clusterSlideSettings: {
      type: Object,
      default: () => {
        return {
          dots: false,
          focusOnSelect: true,
          infinite: true,
          speed: 500,
          slidesToShow: 7,
          slidesToScroll: 4,
          touchThreshold: 5
        }
      }
    }
  },
  data () {
    return {
      arrangeClusterLists: [{
        value: 'name',
        label: '이름순'
      }, {
        value: 'svnetMax',
        label: '서브넷 여유 많은 순'
      }, {
        value: 'svnetMin',
        label: '서브넷 여유 적은 순'
      }, {
        value: 'availableMax',
        label: '가용자원 여유 많은 순'
      }, {
        value: 'availableMin',
        label: '가용자원 여유 적은 순'
      }],
      arrangeCluster: '',
      value: '',
      clusterSampleData: [
        { id: 0, name: '내부망A', node: 16, vm: 15, vcpu: 0, memory: 0, storage: 1.15 },
        { id: 1, name: '내부망B', node: 12, vm: 12, vcpu: 0, memory: 0, storage: 1.15 },
        { id: 2, name: '내부망C', node: 11, vm: 8, vcpu: 0, memory: 0, storage: 1.15 },
        { id: 3, name: '내부망D', node: 17, vm: 11, vcpu: 0, memory: 0, storage: 1.15 },
        { id: 4, name: '내부망E', node: 13, vm: 15, vcpu: 0, memory: 0, storage: 1.15 },
        { id: 5, name: '내부망F', node: 12, vm: 19, vcpu: 0, memory: 0, storage: 1.15 },
        { id: 6, name: '내부망G', node: 16, vm: 15, vcpu: 0, memory: 0, storage: 1.15 },
        { id: 7, name: '내부망H', node: 12, vm: 7, vcpu: 0, memory: 0, storage: 1.15 },
        { id: 8, name: '내부망I', node: 11, vm: 12, vcpu: 0, memory: 0, storage: 1.15 },
        { id: 9, name: '내부망J', node: 17, vm: 10, vcpu: 0, memory: 0, storage: 1.15 },
        { id: 10, name: '내부망K', node: 13, vm: 2, vcpu: 0, memory: 0, storage: 1.15 },
        { id: 11, name: '내부망L', node: 12, vm: 3, vcpu: 0, memory: 0, storage: 1.15 }
      ],
      options: [
        { value: 'node1', label: '노드1' },
        { value: 'node2', label: '노드2' },
        { value: 'node3', label: '노드3' },
        { value: 'node4', label: '노드4' }
      ],
      computeSetCluster: [ // sample...
        { id: 0, selectedCluster: '', node: '' },
        { id: 0, selectedCluster: '', node: '' },
        { id: 0, selectedCluster: '', node: '' },
        { id: 0, selectedCluster: '', node: '' },
        { id: 0, selectedCluster: '', node: '' },
        { id: 0, selectedCluster: '', node: '' },
        { id: 0, selectedCluster: '', node: '' },
        { id: 0, selectedCluster: '', node: '' },
        { id: 0, selectedCluster: '', node: '' },
        { id: 0, selectedCluster: '', node: '' }
      ]
    }
  }
}
</script>

<style lang="scss" scoped>
.cluster-sect {
  display: flex;
  box-sizing: border-box;

  .cont-wrap {
    border: 1px solid #444;
    overflow: hidden;
  }

  .group-title {
    font-size: 15px;
    display: block;
    margin-bottom: $gap;
  }

  .clster-components-lft {
    flex: 0 0 400px;
    overflow-y: hidden;

    .compute-components {
      overflow-y: scroll;
      overflow-x: hidden;
      height: 500px;

      > li {
        padding: $gap-s 0;
        display: flex;
        height: 90px;
        align-items: center;
        border-bottom: 1px solid #d9d9d9;
        background-color: transparent;

        .-name {
          line-height: 80px;
          font-weight: normal;
          flex: 0 0 42%;
          display: block;
          text-align: center;
        }

        .border {
          flex: 0 0 4%;
          height: 100%;
          display: flex;
          align-items: center;
          position: relative;
          &:after {
            content: '';
            position: absolute;
            top: 5%; left: 50%;
            border-left: 1px solid #ddd;
            height: 90%;
          }

          > button {
            cursor: pointer;
            background-color: #F5F6FA;
            border: none;
            border-radius: 50%;
            height: 30px;
            z-index: 2;

            &:before {
              text-align: center;
              padding-left: 5px;
            }
          }
        }

        .select-cluster {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 0 10px;
          flex: 0 0 50%;
          height: 100%;
          box-sizing: border-box;
        }
      }
    }
  }

  .between {
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 50px;
    &:before {
      font-size: 30px;
    }
  }

  .clster-lists-rght {
    flex: 1 1 auto;
    .clstr-cont-right {
      padding: 5px 0;
    }
  }
}

.vm-list {
  > .-name {
    display: block;
    line-height: 3;
    text-align: center;
  }
}
.indiv-clst {
  border: 1px solid $gray;
  // background-color: $white;
  border-radius: $radius;
  padding: $gap $gap-s;
  box-sizing:border-box;
  margin: 0 5px;

  .ipmi-info {
    > p {
      font-family: 'Roboto';
      background-color: $main-black;
      border-radius: 5px;
      line-height: 1.5;
      text-align: center;
      margin-bottom: 5px;
      &.-ipmi {
        background-color: $ticket-back-color;
      }
    }
  }

  .node-lists {
    margin-top: $gap-s;
    overflow-y: auto;
    height: 200px;
    border-radius: $radius;

    > ul {
      display: grid;
      grid-template-columns: 50% 50%;
      .indiv-node {
        text-align: center;
        width: 100%;
        line-height: 2;
        background-color: $navy;
      }
    }
  }

  .-detail-pro {
    margin: $gap-s 0;
    .progrs {
      padding-bottom: $gap-s;
      p {
        padding-bottom: 5px;
        font-size: 10px;
        display: flex;
        justify-content: space-between;
      }
    }
  }

  .-volume {
    font-size: 13px;
    > p {
      line-height: 1.5;
    }
  }
}
</style>

<style lang="scss">

// server
h5.task-title {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: $gap-m;
}

// slick - server page
.cluster-lists-slick {
  width: 100%;

  .slick-list {
    display: flex;
    height: 545px;

    .slick-track {
      position: absolute;
    }

    .slick-slide {
      > div {
        .vm-list {
          border: 2px solid transparent;
          border-radius: $radius;
          transition: .3s ease;
          cursor: pointer;
          &:focus {
            outline: none;
            border: 2px solid $lighter-gray;
          }
        }
      }
      .el-progress-bar__outer {
        background-color: transparent;
      }
      .el-progress-bar__inner {
        background-color: $emerald;
      }

      .is-success {
        .el-progress-bar__inner {
          background-color: $purple-blue;
        }
      }
      .is-warning {
        .el-progress-bar__inner {
          background-color: $main-blue;
        }
      }
    }
  }
  .slick-arrow {
    border :none;
    width: 30px; height: 30px;
    font-size: 0;
    border-radius: 50%;
    position: absolute;
    top: calc(50% - 15px);
    z-index: 1;
    cursor: pointer;

    &.slick-prev {
      left: 2%; transform: rotate(-45deg);
    }
    &.slick-next {
      right: 2%; transform: rotate(135deg);
    }

    &.slick-prev,
    &.slick-next {
      &::after,
      &::before {
        content: '';
        position: absolute;
        background-color: #333;
      }

      &::after,
      &::before { top: 11px; left: 11px; }
      &::after { width: 10px; height: 2px; }
      &::before { height: 10px; width: 2px; }
    }
  }
}
</style>
