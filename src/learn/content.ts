/** 课文按需加载：每一课是独立的一份 markdown，打开哪课才下载哪课 */
const files = import.meta.glob('../content/*/*.md', { query: '?raw', import: 'default' }) as Record<string, () => Promise<string>>

export function loadLesson(trackId: string, slug: string): Promise<string> | null {
  const f = files[`../content/${trackId}/${slug}.md`]
  return f ? f() : null
}
