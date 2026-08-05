import { useEffect, useState } from 'react';
import { EmptyState, Loading, StatusBadge } from '../ui/ui';

/*
  Config-driven CRUD table for one master resource (Courses, Batches,
  Staff, Recruiters, Albums, Images, Announcements, Closure Reasons,
  Students).
  Payment Types renders as a BackendGapNotice instead — see Content.jsx.

  config shape:
  {
    idKey: 'courseId',
    columns: [{ key, label, render?(item) }],
    fields: [{ key, label, type: 'text'|'number'|'textarea'|'date'|'select'|'checkbox', options?, required? }],
    api: { list, create?, update?, remove? },
    searchKeys: ['courseName', ...],
    filters?: [{ key, label, options: [{ value, label }] }],  // optional dropdown filters, ANDed with search
    toForm(item) -> formState,      // item -> editable form shape
    toPayload(form) -> apiPayload,  // form -> request body
    emptyForm,
    canCreate: boolean (default true),  // hides "+ Add" when false - api.create not required in that case
    canUpdate: boolean (default true),
    canDelete: boolean (default true),
  }
*/
export default function ResourceTab({ config }) {
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterValues, setFilterValues] = useState({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(config.pageSize || 10);
  const [editing, setEditing] = useState(null); // form state or null
  const [editingId, setEditingId] = useState(null); // null = creating new
  const [saving, setSaving] = useState(false);

  function load() {
    config.api.list().then(setItems).catch((e) => setError(e.message));
  }
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function startCreate() {
    setEditingId('new');
    setEditing(config.emptyForm);
    setError('');
  }
  function startEdit(item) {
    setEditingId(item[config.idKey]);
    setEditing(config.toForm(item));
    setError('');
  }
  function cancelEdit() {
    setEditingId(null);
    setEditing(null);
  }

  // Checks every field marked required against the current form state.
  // Returns the list of field labels that are still empty.
  function findMissingFields() {
    return config.fields
      .filter((f) => f.required)
      .filter((f) => {
        const v = editing[f.key];
        if (f.type === 'checkbox') return false; // a checkbox is never "empty"
        return v === undefined || v === null || String(v).trim() === '';
      })
      .map((f) => f.label);
  }

  async function onSave(e) {
    e.preventDefault();
    setError('');

    const missing = findMissingFields();
    if (missing.length > 0) {
      setError(`Please fill in: ${missing.join(', ')}.`);
      return;
    }

    setSaving(true);
    try {
      const payload = config.toPayload(editing);
      if (editingId === 'new') await config.api.create(payload);
      else await config.api.update(editingId, payload);
      cancelEdit();
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(item) {
    if (!window.confirm(`Delete this record? This can't be undone.`)) return;
    try {
      await config.api.remove(item[config.idKey]);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  const filtered = (items || []).filter((item) => {
    if (search && !config.searchKeys.some((k) => String(item[k] ?? '').toLowerCase().includes(search.toLowerCase()))) {
      return false;
    }
    if (config.filters) {
      for (const f of config.filters) {
        const active = filterValues[f.key];
        if (active && String(item[f.key] ?? '') !== String(active)) return false;
      }
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginated = pageSize === Infinity ? filtered : filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  function updateSearch(v) {
    setSearch(v);
    setPage(1);
  }
  function updateFilter(key, v) {
    setFilterValues({ ...filterValues, [key]: v });
    setPage(1);
  }
  function updatePageSize(v) {
    setPageSize(v === 'all' ? Infinity : Number(v));
    setPage(1);
  }

  return (
    <div>
      <div className="filterbar">
        <input className="filter-input search" placeholder={`Search ${config.title.toLowerCase()}`} value={search} onChange={(e) => updateSearch(e.target.value)} />
        {config.filters?.map((f) => (
          <select
            key={f.key}
            className="select"
            style={{ width: 'auto', minWidth: 160 }}
            value={filterValues[f.key] ?? ''}
            onChange={(e) => updateFilter(f.key, e.target.value)}
          >
            <option value="">All {f.label}</option>
            {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        ))}
        {config.canCreate !== false && <button className="btn btn-primary btn-sm" onClick={startCreate}>+ Add {config.singular}</button>}
      </div>

      {error && <p className="alert alert-danger">{error}</p>}
      {items === null && <Loading label={`Loading ${config.title.toLowerCase()}…`} />}
      {items && items.length === 0 && <EmptyState title={`No ${config.title.toLowerCase()} yet`} />}
      {items && items.length > 0 && filtered.length === 0 && <EmptyState title="No matches" description="Try a different search term or filter." />}

      {filtered.length > 0 && (
        <div className="card table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                {config.columns.map((c) => <th key={c.key}>{c.label}</th>)}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((item) => (
                <tr key={item[config.idKey]}>
                  {config.columns.map((c) => (
                    <td key={c.key}>{c.render ? c.render(item) : formatCell(item[c.key])}</td>
                  ))}
                  <td>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {config.canUpdate !== false && <button className="tag-btn" onClick={() => startEdit(item)}>Edit</button>}
                      {config.statusToggle && (
                        <button
                          className="tag-btn"
                          onClick={async () => {
                            try { await config.statusToggle.run(item, !item[config.statusToggle.key]); load(); }
                            catch (err) { setError(err.message); }
                          }}
                        >
                          {item[config.statusToggle.key] ? 'Deactivate' : 'Activate'}
                        </button>
                      )}
                      {config.canDelete !== false && <button className="tag-btn tag-btn-danger" onClick={() => onDelete(item)}>Delete</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtered.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 4px 4px', flexWrap: 'wrap', gap: 10 }}>
              <span className="muted" style={{ fontSize: 'var(--text-sm)' }}>
                {pageSize === Infinity
                  ? `Showing all ${filtered.length}`
                  : `Showing ${(safePage - 1) * pageSize + 1}–${Math.min(safePage * pageSize, filtered.length)} of ${filtered.length}`}
              </span>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <label className="muted" style={{ fontSize: 'var(--text-sm)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  Rows per page:
                  <select
                    className="select"
                    style={{ width: 'auto' }}
                    value={pageSize === Infinity ? 'all' : pageSize}
                    onChange={(e) => updatePageSize(e.target.value)}
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value="all">All</option>
                  </select>
                </label>
                {totalPages > 1 && pageSize !== Infinity && (
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <button type="button" className="btn btn-outline btn-sm" disabled={safePage <= 1} onClick={() => setPage(safePage - 1)}>← Prev</button>
                    <span className="muted mono" style={{ fontSize: 'var(--text-sm)' }}>Page {safePage} of {totalPages}</span>
                    <button type="button" className="btn btn-outline btn-sm" disabled={safePage >= totalPages} onClick={() => setPage(safePage + 1)}>Next →</button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {editingId && (
        <form className="card form-section" onSubmit={onSave} noValidate>
          <b style={{ fontSize: 'var(--text-sm)' }}>{editingId === 'new' ? `New ${config.singular}` : `Editing record`}</b>
          <div className="form-grid-3" style={{ marginTop: 12 }}>
            {config.fields.map((f) => (
              <FieldInput key={f.key} field={f} value={editing[f.key]} onChange={(v) => setEditing({ ...editing, [f.key]: v })} />
            ))}
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-outline" onClick={cancelEdit}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? <span className="spinner" /> : 'Save Record'}</button>
          </div>
        </form>
      )}
    </div>
  );
}

function FieldInput({ field, value, onChange }) {
  const wide = field.type === 'textarea' || field.type === 'photo' ? 'full' : '';
  if (field.type === 'checkbox') {
    return (
      <label className="checkbox-row" style={{ alignSelf: 'end', paddingBottom: 10 }}>
        <input type="checkbox" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} /> {field.label}
      </label>
    );
  }
  if (field.type === 'photo') {
    const inputId = `photo-file-${field.key}`;
    return (
      <div className={`field ${wide}`}>
        <label>{field.label}{field.required ? ' *' : ''}</label>
        <div className="photo-upload" style={{ marginBottom: 8 }}>
          {value ? <img src={value} alt="" /> : <span className="muted">No photo set</span>}
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => document.getElementById(inputId).click()}>Browse…</button>
          {value && <button type="button" className="btn btn-ghost btn-sm" onClick={() => onChange('')}>Remove</button>}
        </div>
        <input
          id={inputId}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = ''; // allow picking the same file again later
            if (!file) return;
            if (!file.type.startsWith('image/')) {
              window.alert('Please choose an image file.');
              return;
            }
            if (file.size > 2 * 1024 * 1024) {
              window.alert('Image is too large — please choose one under 2 MB.');
              return;
            }
            const reader = new FileReader();
            reader.onload = () => onChange(reader.result);
            reader.onerror = () => window.alert('Could not read that image file. Please try another.');
            reader.readAsDataURL(file);
          }}
        />
        <input
          className="input"
          placeholder="…or paste an image URL"
          value={value?.startsWith('data:') ? '' : (value ?? '')}
          onChange={(e) => onChange(e.target.value)}
        />
        {value?.startsWith('data:') && (
          <span className="muted" style={{ fontSize: 'var(--text-xs)', display: 'block', marginTop: 4 }}>
            Using browsed image — clear it above to paste a URL instead.
          </span>
        )}
      </div>
    );
  }
  if (field.type === 'select') {
    return (
      <div className={`field ${wide}`}>
        <label>{field.label}{field.required ? ' *' : ''}</label>
        <select className="select" value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
          <option value="">Select…</option>
          {field.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
    );
  }
  if (field.type === 'textarea') {
    return (
      <div className={`field ${wide}`}>
        <label>{field.label}{field.required ? ' *' : ''}</label>
        <textarea className="textarea" rows={3} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
      </div>
    );
  }
  return (
    <div className={`field ${wide}`}>
      <label>{field.label}{field.required ? ' *' : ''}</label>
      <input
        className="input"
        type={field.type || 'text'}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function formatCell(v) {
  if (v === true) return <StatusBadge status="active" />;
  if (v === false) return <StatusBadge status="inactive" />;
  if (v === null || v === undefined || v === '') return <span className="muted">—</span>;
  return String(v);
}