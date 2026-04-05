import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useGetMyListsQuery, useCreateListMutation, useDeleteListMutation } from '../../store/api/listApi'

function CreateListModal({ onClose }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [createList, { isLoading }] = useCreateListMutation()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim()) return
    await createList({ title, description, isPublic })
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Create New List</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="modal-field">
            <label>Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Best Movies of 2024"
              autoFocus
            />
          </div>
          <div className="modal-field">
            <label>Description <span className="modal-field-optional">(optional)</span></label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this list about?"
              rows={3}
            />
          </div>
          <label className="modal-visibility-toggle" htmlFor="isPublic">
            <input
              type="checkbox"
              id="isPublic"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
            />
            <span className="modal-visibility-info">
              <span className="modal-visibility-label">Make this list public</span>
              <span className="modal-visibility-hint">Anyone can view public lists</span>
            </span>
            <span className={`list-badge ${isPublic ? 'public' : 'private'}`}>
              {isPublic ? 'Public' : 'Private'}
            </span>
          </label>
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={!title.trim() || isLoading}>
              {isLoading ? 'Creating...' : 'Create List'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function ListsPage() {
  const navigate = useNavigate()
  const { data, isLoading } = useGetMyListsQuery()
  const [deleteList] = useDeleteListMutation()
  const [showCreate, setShowCreate] = useState(false)

  const lists = data?.lists || []

  return (
    <div className="page-layout">
      <div className="page-main">
        <div className="feed-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>My Lists</h2>
          <button className="btn-primary" onClick={() => setShowCreate(true)}>+ New List</button>
        </div>

        {isLoading ? (
          <p className="placeholder-text">Loading...</p>
        ) : lists.length === 0 ? (
          <p className="placeholder-text">No lists yet. Create one to start curating your favorites!</p>
        ) : (
          <div className="lists-grid">
            {lists.map(list => (
              <div
                key={list._id}
                className="list-card"
                onClick={() => navigate(`/lists/${list._id}`)}
                style={{ cursor: 'pointer' }}
              >
                <p className="list-card-title">{list.title}</p>
                {list.description && <p className="list-card-desc">{list.description}</p>}
                <div className="list-card-meta">
                  <span>{list.items.length} {list.items.length === 1 ? 'item' : 'items'}</span>
                  <span className={`list-badge ${list.isPublic ? 'public' : 'private'}`}>
                    {list.isPublic ? 'Public' : 'Private'}
                  </span>
                </div>
                <div className="list-card-previews">
                  {list.items.slice(0, 4).map(item => item.posterUrl && (
                    <img key={item._id} src={item.posterUrl} alt={item.title} className="list-card-thumb" />
                  ))}
                </div>
                <button
                  className="list-delete-btn"
                  onClick={(e) => { e.stopPropagation(); if (window.confirm('Delete this list?')) deleteList(list._id) }}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="page-sidebar">
        <div className="sidebar-widget">
          <div className="sidebar-widget-header">About Lists</div>
          <div className="sidebar-widget-body">
            <p className="sidebar-about">
              Create curated lists of your favorite movies, shows, music, and more. Share them publicly or keep them private.
            </p>
          </div>
        </div>
      </div>

      {showCreate && <CreateListModal onClose={() => setShowCreate(false)} />}
    </div>
  )
}
