import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { useGetCommunitiesQuery, useCreateCommunityMutation } from '../../store/api/communityApi'

const TYPE_OPTIONS = [
  { value: 'custom', label: 'Custom' },
  { value: 'show', label: 'Show / Movie' },
  { value: 'artist', label: 'Artist / Band' },
  { value: 'genre', label: 'Genre' }
]

function CreateCommunityForm({ onClose }) {
  const [createCommunity, { isLoading }] = useCreateCommunityMutation()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', description: '', type: 'custom', isPublic: true })
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return setError('Name is required')
    setError('')
    try {
      const result = await createCommunity(form).unwrap()
      navigate(`/community/${result.community.slug}`)
    } catch (err) {
      setError(err.data?.message || 'Failed to create community')
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Create a Community</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="modal-field">
            <label>Name</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. BreakingBadFans"
              maxLength={50}
            />
          </div>
          <div className="modal-field">
            <label>Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="What is this community about?"
              rows={3}
              maxLength={300}
            />
          </div>
          <div className="modal-field">
            <label>Type</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              {TYPE_OPTIONS.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <label className="modal-checkbox-label">
            <input
              type="checkbox"
              checked={form.isPublic}
              onChange={(e) => setForm({ ...form, isPublic: e.target.checked })}
            />
            <span>Public</span>
          </label>
          {error && <p className="form-error">{error}</p>}
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Community'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const TYPE_LABELS = { show: 'Show', artist: 'Artist', genre: 'Genre', custom: 'Custom' }

function CommunityCard({ community }) {
  const navigate = useNavigate()
  return (
    <div className="community-card" onClick={() => navigate(`/community/${community.slug}`)}>
      <div className="community-card-banner">
        {community.bannerUrl
          ? <img src={community.bannerUrl} alt={community.name} />
          : <div className="community-card-banner-placeholder">{community.name[0].toUpperCase()}</div>
        }
        <span className="community-card-type">{TYPE_LABELS[community.type] || community.type}</span>
      </div>
      <div className="community-card-info">
        <h3>w/{community.name}</h3>
        {community.description && <p>{community.description}</p>}
        <span className="community-card-members">{community.memberCount} {community.memberCount === 1 ? 'member' : 'members'}</span>
      </div>
    </div>
  )
}

export default function CommunitiesPage() {
  const { isAuthenticated } = useSelector((state) => state.auth)
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [submitted, setSubmitted] = useState('')
  const [showCreate, setShowCreate] = useState(false)

  const { data, isLoading } = useGetCommunitiesQuery({ q: submitted })

  const communities = data?.docs || []

  const handleCreateClick = () => {
    if (!isAuthenticated) return navigate('/login')
    setShowCreate(true)
  }

  return (
    <div className="communities-page">
      <div className="communities-header">
        <div>
          <h2>Communities</h2>
          <p className="communities-subtitle">Find your people</p>
        </div>
        <button className="btn-primary" onClick={handleCreateClick}>
          + Create Community
        </button>
      </div>

      <form className="communities-search" onSubmit={(e) => { e.preventDefault(); setSubmitted(search.trim()) }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search communities..."
        />
        <button type="submit" className="search-btn">Search</button>
      </form>

      {isLoading ? (
        <p className="placeholder-text">Loading communities...</p>
      ) : communities.length === 0 ? (
        <p className="placeholder-text">
          {submitted ? `No communities matching "${submitted}"` : 'No communities yet — be the first to create one!'}
        </p>
      ) : (
        <div className="community-grid">
          {communities.map(c => <CommunityCard key={c._id} community={c} />)}
        </div>
      )}

      {showCreate && <CreateCommunityForm onClose={() => setShowCreate(false)} />}
    </div>
  )
}
