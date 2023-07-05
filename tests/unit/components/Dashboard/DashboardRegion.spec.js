import { treeFindChild } from '@/components/Utils/TreeUtils'

// 단순 함수 테스트 먼저 작성
const mock = [
  {
    cateIdx: 2,
    cateName: '마포',
    cateKey: '마포',
    cateCode: null,
    children: [
      {
        cateIdx: 4,
        cateName: 'LEGACY',
        cateKey: '마포-Legacy',
        cateCode: null,
        children: [
          {
            cateIdx: 8,
            cateName: '내부',
            cateKey: '마포-Legacy-내부',
            cateCode: 'i',
            children: null,
            upperCatogoryIdx: 4,
            isOpen: true
          },
          {
            cateIdx: 9,
            cateName: '외부',
            cateKey: '마포-Legacy-외부',
            cateCode: 'e',
            children: null,
            upperCatogoryIdx: 4,
            isOpen: true
          }
        ],
        upperCatogoryIdx: 2,
        isOpen: true
      },
      {
        cateIdx: 5,
        cateName: 'SDN',
        cateKey: '마포-SDN',
        cateCode: null,
        children: [
          {
            cateIdx: 11,
            cateName: '내부',
            cateKey: '마포-SDN-내부',
            cateCode: 'i',
            children: null,
            upperCatogoryIdx: 5,
            isOpen: true
          },
          {
            cateIdx: 12,
            cateName: '외부',
            cateKey: '마포-SDN-외부',
            cateCode: 'e',
            children: null,
            upperCatogoryIdx: 5,
            isOpen: true
          },
          {
            cateIdx: 13,
            cateName: 'NAT',
            cateKey: '마포-SDN-NAT',
            cateCode: 'n',
            children: null,
            upperCatogoryIdx: 5,
            isOpen: true
          },
          {
            cateIdx: 20,
            cateName: 'DEV',
            cateKey: '마포-SDN-DEV',
            cateCode: 'd',
            children: null,
            upperCatogoryIdx: 5,
            isOpen: true
          },
          {
            cateIdx: 22,
            cateName: 'DB',
            cateKey: '김포-SDN-DB',
            cateCode: 'b',
            children: null,
            upperCatogoryIdx: 5,
            isOpen: true
          }
        ],
        upperCatogoryIdx: 2,
        isOpen: true
      }
    ],
    upperCatogoryIdx: 0,
    isOpen: true
  },
  {
    cateIdx: 3,
    cateName: '송도',
    cateKey: '송도',
    cateCode: null,
    children: [
      {
        cateIdx: 6,
        cateName: 'LEGACY',
        cateKey: '송도-Legacy',
        cateCode: null,
        children: [
          {
            cateIdx: 14,
            cateName: '내부',
            cateKey: '송도-Legacy-내부',
            cateCode: 'i',
            children: null,
            upperCatogoryIdx: 6,
            isOpen: true
          },
          {
            cateIdx: 15,
            cateName: '외부',
            cateKey: '송도-Legacy-외부',
            cateCode: 'e',
            children: null,
            upperCatogoryIdx: 6,
            isOpen: true
          }
        ],
        upperCatogoryIdx: 3,
        isOpen: true
      },
      {
        cateIdx: 7,
        cateName: 'SDN',
        cateKey: '송도-SDN',
        cateCode: null,
        children: [
          {
            cateIdx: 17,
            cateName: '내부',
            cateKey: '송도-SDN-내부',
            cateCode: 'i',
            children: null,
            upperCatogoryIdx: 7,
            isOpen: true
          },
          {
            cateIdx: 18,
            cateName: '외부',
            cateKey: '송도-SDN-외부',
            cateCode: 'e',
            children: null,
            upperCatogoryIdx: 7,
            isOpen: true
          },
          {
            cateIdx: 19,
            cateName: 'NAT',
            cateKey: '송도-SDN-NAT',
            cateCode: 'n',
            children: null,
            upperCatogoryIdx: 7,
            isOpen: true
          },
          {
            cateIdx: 21,
            cateName: 'DEV',
            cateKey: '송도-SDN-DEV',
            cateCode: 'd',
            children: null,
            upperCatogoryIdx: 7,
            isOpen: true
          },
          {
            cateIdx: 23,
            cateName: 'DB',
            cateKey: '송도-SDN-DB',
            cateCode: 'b',
            children: null,
            upperCatogoryIdx: 7,
            isOpen: true
          }
        ],
        upperCatogoryIdx: 3,
        isOpen: true
      }
    ],
    upperCatogoryIdx: 0,
    isOpen: true
  }
]

const getCateTreeName = (tree, cateIdx) => {
  for (let i = 0; i < tree.length; i++) {
    const cate = tree[i]
    if (cate.children) return getCateTreeName(cate.children, cateIdx)
    else {
      if (cate.cateIdx === cateIdx) return cate
    }
  }
}

describe('DashboardRegion.vue', () => {
  it('getCateTreeName // 첫번째 배열에서 찾을 때', () => {
    const stepOne = getCateTreeName(mock, 8)
    expect(stepOne).toBeDefined()
    expect(stepOne.cateIdx).toBe(8)
  })

  it('getCateTreeName // 두번째 배열부터 실패 -> treeFindChild로 찾기', () => {
    const stepOne = treeFindChild(mock, 'cateIdx', 11)
    expect(stepOne).toBeDefined()
    expect(stepOne.cateIdx).toBe(11)

    const stepTwo = treeFindChild(mock, 'cateIdx', 19)
    expect(stepTwo).toBeDefined()
    expect(stepTwo.cateIdx).toBe(19)

    // 해당 부분 값이 존재하는데 못찾고 null 반환
    const stepThree = getCateTreeName(mock, 21)
    expect(stepThree).not.toBeDefined()
  })

  it('treeFindChild - 없는 cateIdx 찾을 때', () => {
    const stepOne = treeFindChild(mock, 'cateIdx', 999)
    expect(stepOne).toBeNull()
    expect(stepOne).not.toBe(999)
  })
})
