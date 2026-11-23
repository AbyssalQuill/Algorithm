export function Stats({ items }: { items: [string, string | number][] }) {
  return (
    <div className="stats">
      {items.map(([k, v]) => (
        <div className="stat" key={k}>
          <span className="stat-k">{k}</span>
          <span className="stat-v">{v}</span>
        </div>
      ))}
    </div>
  )
}
