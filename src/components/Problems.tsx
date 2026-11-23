import type { Problem } from '../engine/types'
import { IconExternal } from './icons'

const DIFF_LABEL = ['暂无评定', '入门', '普及−', '普及/提高−', '普及+/提高', '提高+/省选−', '省选/NOI−', 'NOI/NOI+/CTSC']

export function Problems({ list }: { list: Problem[] }) {
  return (
    <div className="problems">
      {list.map((p) => (
        <a key={p.pid} className="prob" href={`https://www.luogu.com.cn/problem/${p.pid}`} target="_blank" rel="noopener noreferrer">
          <div className="prob-top">
            <span className="prob-pid">{p.pid}</span>
            <span className="prob-title">{p.title}</span>
            <span className="prob-go">
              去洛谷做题 <IconExternal />
            </span>
          </div>
          {p.diff != null && (
            <div className="prob-meta">
              <span className="diff-dots" aria-hidden="true">
                {Array.from({ length: 7 }, (_, i) => (
                  <i key={i} className={i < p.diff! ? `on d${p.diff}` : ''} />
                ))}
              </span>
              <span className="diff-label">洛谷难度 · {DIFF_LABEL[p.diff] ?? DIFF_LABEL[0]}</span>
            </div>
          )}
          <p className="prob-why">{p.why}</p>
        </a>
      ))}
    </div>
  )
}
