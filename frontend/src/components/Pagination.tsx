export default function Pagination({ meta, onPage }) {
  if (!meta) return null;
  const { page, lastPage } = meta;
  return (
    <div className="flex gap-2 items-center">
      <button disabled={page<=1} onClick={() => onPage(page-1)}>Prev</button>
      <div>Page {page} / {lastPage}</div>
      <button disabled={page>=lastPage} onClick={() => onPage(page+1)}>Next</button>
    </div>
  );
}