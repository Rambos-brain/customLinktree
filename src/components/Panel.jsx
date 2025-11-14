import React from "react";

export default function Panel({ title, link, img, fallback }) {
  const handleClick = (e) => {
    if (!link) return;

    const elem = e.currentTarget;

    // 🔥 Trigger the global expanding void
    if (window.__VOID__) {
      window.__VOID__.trigger(link, elem);
      return; // stop normal opening
    }

    // fallback (shouldn't happen)
    window.open(link, "_blank", "noopener,noreferrer");
  };

  return (
    <div
      className="panel panel-hover right-tile relative cursor-pointer"
      onClick={handleClick}
      title={title}
    >
      <img
        src={img || fallback}
        alt={title}
        onError={(e) => (e.target.src = fallback)}
        className="absolute inset-0 w-full h-full object-cover"
      />

      <div className="panel-title absolute left-0 bottom-0 w-full text-white">
        {title}
      </div>
    </div>
  );
}
