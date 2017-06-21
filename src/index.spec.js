/* eslint-env mocha */

import chai from 'chai'
import * as babel from 'babel-core'
import plugin from './index'
import R from 'ramda'

describe('Babel Plugin', () => {

  const options = {
    plugins: [
      plugin
    ]
  }

  it('should wrap function composition with a named function', () => {
    const code = `
      const incZero = R.pipe(
        R.always(0),
        R.inc
      )
    `

    const incZero = (new Function('R', `
      ${babel.transform(code, options).code}
      return incZero
    `))(R);

    chai.expect(incZero.name).to.equal('incZero')
    chai.expect(incZero()).to.equal(1)
  })

  it('should not wrap function which returns a number', () => {
    const code = `
      const valOne = R.prop(
        'value', {
          value: 1
        }
      )
    `

    const valOne = (new Function('R', `
      ${babel.transform(code, options).code}
      return valOne
    `))(R);

    chai.expect(valOne).to.equal(1)
  })

  it('should not wrap function around a number', () => {
    const code = `
      const valTwo = 2
    `

    const valTwo = (new Function(`
      ${babel.transform(code, options).code}
      return valTwo
    `))();

    chai.expect(valTwo).to.equal(2)
  })

  it('should not wrap function around a string', () => {
    const code = `
      const valFour = 'four'
    `

    const valFour = (new Function(`
      ${babel.transform(code, options).code}
      return valFour
    `))();

    chai.expect(valFour).to.equal('four')
  })

  it('should not wrap function around an object', () => {
    const code = `
      const valThree = {
        value: 3
      }
    `

    const valThree = (new Function(`
      ${babel.transform(code, options).code}
      return valThree
    `))();

    chai.expect(valThree).to.have.property('value', 3)
  })

  it('should not wrap function declaration', () => {
    const code = `
      const getFive = function () {
        return 5
      }
    `

    const getFive = (new Function(`
      ${babel.transform(code, options).code}
      return getFive
    `))();

    chai.expect(getFive.name).to.equal('getFive')
    chai.expect(getFive()).to.equal(5)
  })

  it('should not wrap self-executing function which returns a number', () => {
    const code = `
      const valSix = (function () {
        return 6
      })()
    `

    const valSix = (new Function(`
      ${babel.transform(code, options).code}
      return valSix
    `))();

    chai.expect(valSix).to.equal(6)
  })

  it('should wrap self-executing function which returns another function', () => {
    const code = `
      const getSeven = (function () {
        return function () {
          return 'seven'
        }
      })()
    `

    const getSeven = (new Function(`
      ${babel.transform(code, options).code}
      return getSeven
    `))();

    chai.expect(getSeven.name).to.equal('getSeven')
    chai.expect(getSeven()).to.equal('seven')
  })

})
