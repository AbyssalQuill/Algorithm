/**
 * 铅笔线条用的 SVG 滤镜（只定义一次，CSS 里用 filter:url(#pencil-a) 引用）：
 * 1. feDisplacementMap 让直线微微发抖，像手画的；
 * 2. 再用高频噪点把线条“咬”出石墨颗粒感。
 * 只用在边框、阴影线、涂鸦上，文字和代码区不会被滤镜处理。
 */
export function SketchDefs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
      <defs>
        <filter id="pencil-a" x="-8%" y="-8%" width="116%" height="116%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="4" result="warp" />
          <feDisplacementMap in="SourceGraphic" in2="warp" scale="3.2" xChannelSelector="R" yChannelSelector="G" result="w" />
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="9" result="n" />
          <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  3 0 0 0 -0.42" result="g" />
          <feComposite in="w" in2="g" operator="in" />
        </filter>
        <filter id="pencil-b" x="-8%" y="-8%" width="116%" height="116%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.028" numOctaves="2" seed="11" result="warp" />
          <feDisplacementMap in="SourceGraphic" in2="warp" scale="4.2" xChannelSelector="R" yChannelSelector="G" result="w" />
          <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="2" seed="3" result="n" />
          <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  3.4 0 0 0 -0.55" result="g" />
          <feComposite in="w" in2="g" operator="in" />
        </filter>
      </defs>
    </svg>
  )
}
