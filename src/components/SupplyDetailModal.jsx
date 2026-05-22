// SupplyDetailModal — tap a supply card to see this focused detail view.
// Closes on backdrop click, ✕ button, or the Edit button (which also
// triggers edit mode on the parent SupplyTagCard via onEdit()).

export default function SupplyDetailModal({ supply, onClose, onEdit }) {
  function handleBackdropClick(e) {
    if (e.target === e.currentTarget) onClose();
  }

  function handleEdit() {
    onClose();   // dismiss modal first so edit form appears inline
    onEdit();
  }

  const hasPhoto        = Boolean(supply.photo_url);
  const hasInstructions = supply.instructions && supply.instructions.trim().length > 0;

  return (
    <div className="supply-detail-overlay" onClick={handleBackdropClick}>
      <div className="supply-detail-modal">

        {/* ── Close button ── */}
        <button className="supply-detail-close" onClick={onClose} aria-label="Close">
          ✕
        </button>

        {/* ── Photo ── */}
        <div className="supply-detail-photo-wrap">
          {hasPhoto
            ? <img src={supply.photo_url} alt={supply.name_en} className="supply-detail-photo" />
            : <span className="supply-detail-photo-fallback">🧴</span>
          }
        </div>

        {/* ── Names ── */}
        <div className="supply-detail-names">
          <div className="supply-detail-name-en">{supply.name_en}</div>
          {supply.name_de && (
            <div className="supply-detail-name-de">{supply.name_de}</div>
          )}
        </div>

        {/* ── Instructions ── */}
        <div className="supply-detail-section">
          <div className="supply-detail-instructions-label">How to use</div>
          {hasInstructions
            ? <p className="supply-detail-instructions-text">{supply.instructions}</p>
            : <p className="supply-detail-instructions-empty">
                No instructions yet — tap Edit to add some.
              </p>
          }
        </div>

        {/* ── Actions ── */}
        <div className="supply-detail-actions">
          <button className="btn btn-primary" onClick={handleEdit}>
            ✏️&nbsp; Edit
          </button>
        </div>

      </div>
    </div>
  );
}
