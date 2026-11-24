import type { Problem } from '../engine/types'
import { IconExternal } from './icons'

export const DIFF_LABEL = ['暂无评定', '入门', '普及−', '普及/提高−', '普及+/提高', '提高+/省选−', '省选/NOI−', 'NOI/NOI+/CTSC']

/** 洛谷的难度颜色说明：题号和难度都按这个颜色显示，和洛谷网站上的一致 */
export function DiffLegend({ levels = [1, 2, 3, 4, 5, 6, 7] }: { levels?: number[] }) {
  return (
    <div className="diff-legend" aria-label="难度颜色说明">
      {levels.map((d) => (
        <span key={d} className={`diff-tag d${d}`}>
          {DIFF_LABEL[d]}
        </span>
      ))}
    </div>
  )
}

export function Problems({ list }: { list: Problem[] }) {
  return (
    <div className="problems">
      {list.map((p) => (
        <a key={p.pid} className={`prob d${p.diff ?? 0}`} href={`https://www.luogu.com.cn/problem/${p.pid}`} target="_blank" rel="noopener noreferrer">
          <div className="prob-top">
            <span className="prob-pid">{p.pid}</span>
            {p.diff != null && <span className={`diff-tag d${p.diff}`}>{DIFF_LABEL[p.diff] ?? DIFF_LABEL[0]}</span>}
            <span className="prob-go">
              去洛谷做题 <IconExternal />
            </span>
          </div>
          <div className="prob-title">{p.title}</div>
          <p className="prob-why">{p.why}</p>
        </a>
      ))}
    </div>
  )
}
