
Cypress.on('uncaught:exception', (_err, _runnable) => {
  return false
})

describe('테스트', () => {
  before(() => {
    cy.login()
  })

  beforeEach(() => {
    Cypress.Cookies.preserveOnce('Authorization', 'PackageType', 'CMPLang')
  })
})
