import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="container page notfound">
      <div className="nf-code">404</div>
      <h1>这一页还没有写出来</h1>
      <p>可能是链接打错了，或者这个演示还在准备中。</p>
      <div className="cta-row">
        <Link to="/lab" className="btn btn-primary">
          去动画实验室
        </Link>
        <Link to="/" className="btn btn-ghost">
          回首页
        </Link>
      </div>
    </div>
  )
}
