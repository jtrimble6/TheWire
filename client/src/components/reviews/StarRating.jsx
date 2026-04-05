import { useState } from 'react'

export default function StarRating({ value = 0, onChange, readOnly = false, size = 'md' }) {
  const [hovered, setHovered] = useState(0)
  const display = hovered || value

  return (
    <div className={`star-rating star-rating-${size} ${readOnly ? 'readonly' : ''}`}>
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
        <button
          key={score}
          type="button"
          className={`star ${score <= display ? 'filled' : ''}`}
          onMouseEnter={() => !readOnly && setHovered(score)}
          onMouseLeave={() => !readOnly && setHovered(0)}
          onClick={() => !readOnly && onChange && onChange(score)}
          disabled={readOnly}
          aria-label={`Rate ${score}`}
        >
          ★
        </button>
      ))}
      {display > 0 && <span className="star-value">{display}/10</span>}
    </div>
  )
}
