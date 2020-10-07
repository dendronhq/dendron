import {Plugin} from 'unified' // eslint-disable-line import/no-extraneous-dependencies

declare namespace remarkMath {
  interface RemarkMathOptions {
    inlineMathDouble?: boolean
  }

  type Math = Plugin<[RemarkMathOptions?]>
}

declare const remarkMath: remarkMath.Math

export = remarkMath
