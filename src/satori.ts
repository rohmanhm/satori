import type { ReactNode } from 'react'

import getYoga, { init } from './yoga'
import layout from './layout'
import FontLoader, { FontOptions } from './font'
import svg from './builder/svg'

// We don't need to initialize the opentype instances every time.
const fontCache = new WeakMap<FontOptions[], FontLoader>()

export interface SatoriOptions {
  width: number
  height: number
  fonts: FontOptions[]
  embedFont?: boolean
  debug?: boolean
  graphemeImages?: Record<string, string>
  fontManager?: FontLoader
}

export { init }

export function initFontManager(fonts: FontOptions[]) {
  let font: FontLoader
  if (fontCache.has(fonts)) {
    font = fontCache.get(fonts)
  } else {
    fontCache.set(fonts, (font = new FontLoader(fonts)))
  }
  return font
}

export default function satori(
  element: ReactNode,
  options: SatoriOptions
): string {
  const Yoga = getYoga()
  if (!Yoga) throw new Error('Satori is not initialized.')

  console.time('Satori - FontLoader')

  const font = options.fontManager || initFontManager(options.fonts)

  console.timeEnd('Satori - FontLoader')

  console.time('Satori - BuildLayout')

  const root = Yoga.Node.create()
  root.setWidth(options.width)
  root.setHeight(options.height)
  root.setFlexDirection(Yoga.FLEX_DIRECTION_ROW)
  root.setFlexWrap(Yoga.WRAP_WRAP)
  root.setAlignContent(Yoga.ALIGN_AUTO)
  root.setAlignItems(Yoga.ALIGN_FLEX_START)
  root.setJustifyContent(Yoga.JUSTIFY_FLEX_START)

  const handler = layout(element, {
    id: 1,
    parentStyle: {},
    inheritedStyle: {
      fontSize: 16,
      fontWeight: 'normal',
      fontFamily: 'serif',
      fontStyle: 'normal',
      lineHeight: 1.2,
      color: 'black',
      opacity: 1,
    },
    parent: root,
    font,
    embedFont: options.embedFont,
    debug: options.debug,
    graphemeImages: options.graphemeImages,
  })
  handler.next()

  console.timeEnd('Satori - BuildLayout')

  console.time('Satori - CalcLayout')
  root.calculateLayout(options.width, options.height, Yoga.DIRECTION_LTR)
  console.timeEnd('Satori - CalcLayout')

  console.time('Satori - BuildSVG')
  const content = handler.next([0, 0]).value
  console.timeEnd('Satori - BuildSVG')

  return svg({ width: options.width, height: options.height, content })
}
