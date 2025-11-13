import React from 'react'

/**
 * Generic static panel for right-column tiles
 * Props:
 *  - title
 *  - link
 *  - img (url or local path)
 *  - fallback (local path)
 */
export default function Panel({ title, link, img, fallback }) {
  const handleClick = (e) => {
    // open in new tab
    if (link) window.open(link, '_blank', 'noopener,noreferrer')
  }

  return (
    <div
      className="panel panel-hover right-tile relative cursor-pointer"
      onClick={handleClick}
      title={title}
    >
      <img
        src={img || fallback}
        alt={title}
        onError={(e) => { e.target.src = fallback }}
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="panel-title absolute left-0 bottom-0 w-full text-white">
        {title}
      </div>
    </div>
  )
}
