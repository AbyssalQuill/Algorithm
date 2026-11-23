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
        {/*
          pencil-a：边框 / 面板本体。
          - 位移变小、频率变低：线条只是“微微晃”，不再一抖一抖；
          - 位移之后轻轻模糊，再把透明度拉回清晰：位移图本身是“最近邻取样”，直接用会出阶梯状锯齿，这一步把边缘抗锯齿了；
          - 石墨颗粒只留在边框那一圈（内部用腐蚀后的轮廓保持实心），按钮和面板里面不再有沙粒，字更干净。
        */}
        <filter id="pencil-a" x="-8%" y="-8%" width="116%" height="116%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.028" numOctaves="2" seed="4" result="warp" />
          <feDisplacementMap in="SourceGraphic" in2="warp" scale="2.6" xChannelSelector="R" yChannelSelector="G" result="d" />
          <feGaussianBlur in="d" stdDeviation="0.55" result="b" />
          <feComponentTransfer in="b" result="w">
            <feFuncA type="linear" slope="1.8" intercept="-0.4" />
          </feComponentTransfer>
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="9" result="n" />
          <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  2.4 0 0 0 -0.12" result="g" />
          <feMorphology in="SourceAlpha" operator="erode" radius="3" result="core" />
          <feComposite in="g" in2="core" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" result="mask" />
          <feComposite in="w" in2="mask" operator="in" />
        </filter>
        <filter id="pencil-b" x="-8%" y="-8%" width="116%" height="116%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.024" numOctaves="2" seed="11" result="warp" />
          <feDisplacementMap in="SourceGraphic" in2="warp" scale="3.4" xChannelSelector="R" yChannelSelector="G" result="d" />
          <feGaussianBlur in="d" stdDeviation="0.45" result="b" />
          <feComponentTransfer in="b" result="w">
            <feFuncA type="linear" slope="1.5" intercept="-0.22" />
          </feComponentTransfer>
          <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="2" seed="3" result="n" />
          <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  2.8 0 0 0 -0.3" result="g" />
          <feComposite in="w" in2="g" operator="in" />
        </filter>
      </defs>
    </svg>
  )
}
