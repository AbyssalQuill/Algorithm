import type { CSSProperties } from 'react'
import type { usePlayer } from '../engine/usePlayer'
import { IconNext, IconPause, IconPlay, IconPrev, IconRestart } from './icons'

export function Player({ p, total }: { p: ReturnType<typeof usePlayer>; total: number }) {
  const pct = p.last === 0 ? 0 : (p.index / p.last) * 100
  return (
    <div className="player">
      <div className="p-row">
        <button className="p-btn" onClick={p.restart} aria-label="回到开头" title="回到开头 (Home)">
          <IconRestart />
        </button>
        <button className="p-btn" onClick={p.prev} disabled={p.index === 0} aria-label="上一步" title="上一步 (←)">
          <IconPrev />
        </button>
        <button className="p-btn p-main" onClick={p.toggle} aria-label={p.playing ? '暂停' : '播放'} title="播放 / 暂停 (空格)">
          {p.playing ? <IconPause /> : <IconPlay />}
        </button>
        <button className="p-btn" onClick={p.next} disabled={p.atEnd} aria-label="下一步" title="下一步 (→)">
          <IconNext />
        </button>
        <div className="p-speed" role="group" aria-label="播放速度">
          {[0.5, 1, 2, 4].map((s) => (
            <button key={s} className={p.speed === s ? 'on' : ''} onClick={() => p.setSpeed(s)}>
              {s}×
            </button>
          ))}
        </div>
      </div>
      <div className="p-track">
        <input
          type="range"
          className="p-range"
          min={0}
          max={p.last}
          value={p.index}
          onChange={(e) => p.seek(Number(e.target.value))}
          style={{ '--p': `${pct}%` } as CSSProperties}
          aria-label="拖动查看任意一步"
        />
        <span className="p-count">
          {p.index + 1} / {total}
        </span>
      </div>
    </div>
  )
}
