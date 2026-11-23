import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="container page notfound">
      <div className="nf-code">404</div>
      <h1>找不到这个页面</h1>
      <p>链接可能输入有误，也可能这部分内容还没有上线。</p>
      <div className="cta-row">
        <Link to="/learn" className="btn btn-primary">
          开始学习
        </Link>
        <Link to="/" className="btn btn-ghost">
          回首页
        </Link>
      </div>
    </div>
  )
}
