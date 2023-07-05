Cypress.on('uncaught:exception', (_err, _runnable) => {
  return false
})

// patch Cypress top.onerror
// Object.defineProperty(top, 'onerror', {
//   value: window.onerror
// })

describe('테스트', () => {
  before(() => {
    cy.login()
  })

  beforeEach(() => {
    Cypress.Cookies.preserveOnce('Authorization', 'PackageType', 'CMPLang')
  })

  it('업무 > 사전협의 트켓 설정', () => {
    cy.get('.expand-menu-icon').click()
    cy.get('.tree-wrapper > :nth-child(2) > .node-item-label').click()
    cy.get('.ticket-panel-list > li:nth-child(1)').click()
  })

  it('주문번호 선택', () => {
    cy.get('.conf-source ul.-lists > :nth-child(1)').click()
  })
})
