import { useState, useRef } from 'react'
import { useImportCSVMutation } from '../../store/api/importApi'

export default function ImportPage() {
  const [importCSV, { isLoading }] = useImportCSVMutation()
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [dragging, setDragging] = useState(false)
  const fileRef = useRef(null)

  const handleFile = async (file) => {
    if (!file) return
    if (!file.name.endsWith('.csv')) {
      setError('Please upload a .csv file.')
      return
    }
    setError(null)
    setResult(null)
    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await importCSV(formData).unwrap()
      setResult(res)
    } catch (err) {
      setError(err?.data?.message || 'Import failed. Please check your file and try again.')
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    handleFile(file)
  }

  return (
    <div className="import-page">
      <h2>Import Watch History</h2>
      <p className="import-subtitle">
        Import your ratings and reviews from <strong>Letterboxd</strong> or <strong>IMDb</strong>.
        Export a CSV from their site and upload it here.
      </p>

      <div className="import-instructions">
        <div className="import-source">
          <strong>Letterboxd</strong>
          <ol>
            <li>Go to letterboxd.com → Settings → Import & Export</li>
            <li>Click <em>Export Your Data</em> and download the ZIP</li>
            <li>Upload <code>ratings.csv</code> or <code>reviews.csv</code> below</li>
          </ol>
        </div>
        <div className="import-source">
          <strong>IMDb</strong>
          <ol>
            <li>Go to imdb.com → Your Ratings → Export</li>
            <li>Download <code>ratings.csv</code></li>
            <li>Upload it below</li>
          </ol>
        </div>
      </div>

      <div
        className={`import-dropzone${dragging ? ' import-dropzone--active' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && fileRef.current?.click()}
        aria-label="Upload CSV file"
      >
        <input
          ref={fileRef}
          type="file"
          accept=".csv"
          className="import-file-input"
          onChange={(e) => handleFile(e.target.files[0])}
        />
        {isLoading
          ? <p>Importing... this may take a minute for large files.</p>
          : <p>Drop your CSV here or <span className="import-browse">browse</span></p>
        }
      </div>

      {error && <p className="form-error">{error}</p>}

      {result && (
        <div className="import-result">
          <h3>Import Complete</h3>
          <div className="import-summary">
            <div className="import-stat import-stat--success">
              <span className="import-stat-num">{result.imported}</span>
              <span className="import-stat-label">Imported</span>
            </div>
            <div className="import-stat import-stat--skip">
              <span className="import-stat-num">{result.skipped}</span>
              <span className="import-stat-label">Skipped</span>
            </div>
            <div className="import-stat import-stat--error">
              <span className="import-stat-num">{result.errors}</span>
              <span className="import-stat-label">Errors</span>
            </div>
            <div className="import-stat">
              <span className="import-stat-num">{result.total}</span>
              <span className="import-stat-label">Total rows</span>
            </div>
          </div>

          {result.details?.filter(d => d.status !== 'imported').length > 0 && (
            <details className="import-details">
              <summary>Show skipped/errors</summary>
              <ul className="import-detail-list">
                {result.details.filter(d => d.status !== 'imported').map((d, i) => (
                  <li key={i} className={`import-detail-item import-detail--${d.status}`}>
                    <span>{d.title || 'Unknown'}</span>
                    <span className="import-detail-reason">{d.reason}</span>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}
    </div>
  )
}
