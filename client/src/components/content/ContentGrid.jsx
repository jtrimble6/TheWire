import ContentCard from './ContentCard'

export default function ContentGrid({ items, loading, emptyMessage = 'No results found.' }) {
  if (loading) return <div className="grid-loading">Searching...</div>
  if (!items || items.length === 0) return <p className="grid-empty">{emptyMessage}</p>

  return (
    <div className="content-grid">
      {items.map((item, i) => (
        <ContentCard key={item._id || item.externalId || i} item={item} />
      ))}
    </div>
  )
}
