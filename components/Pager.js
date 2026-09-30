export default function Pager({ pagination, onChange }) {
  if (!pagination || pagination.totalPages < 2) return null;
  const { page, totalPages, total } = pagination;

  return (
    <div className="pager">
      {page > 1 && (
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => onChange(page - 1)}>
          ← Prev
        </button>
      )}
      <span>
        Page {page} of {totalPages} · {total} total
      </span>
      {page < totalPages && (
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => onChange(page + 1)}>
          Next →
        </button>
      )}
    </div>
  );
}
