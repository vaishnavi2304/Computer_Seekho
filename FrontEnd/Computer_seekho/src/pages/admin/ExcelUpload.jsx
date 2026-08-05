import { useRef, useState } from 'react';
import { validateExcel, uploadExcel, validateRecruiterExcel, uploadRecruiterExcel } from '../../api/misc';

const OTHER_TABLES = ['Courses', 'Batches', 'Staff'];

// Loaded on demand (not at the top of the bundle) — this library is ~700KB
// and is only ever needed on this one admin page, never on the public site.
let xlsxPromise;
function loadXLSX() {
  if (!xlsxPromise) xlsxPromise = import('xlsx');
  return xlsxPromise;
}

const TABLES = {
  placements: {
    label: 'Placements',
    blurb: 'Student, package, recruiter and batch — bulk-linked in one go.',
    columns: ['Student Name', 'Package', 'Recruiter ID', 'Batch ID'],
    templateRow: ['Asha Patil', 650000, 1, 1],
    templateName: 'computer-seekho-placements-template.xlsx',
    previewHeaders: ['Student', 'Package', 'Recruiter', 'Batch'],
    toPreviewRow: (r) => ({
      cols: [r[0] ?? '', r[1] ?? '', r[2] ?? '', r[3] ?? ''],
      valid: Boolean(r[0]) && Boolean(r[2]) && Boolean(r[3]),
    }),
    validate: validateExcel,
    upload: uploadExcel,
  },
  recruiters: {
    label: 'Recruiters',
    blurb: 'Company name, description and logo URL — new placement partners in one go.',
    columns: ['Recruiter Name', 'Description', 'Photo URL'],
    templateRow: ['Tata Consultancy Services', 'Global IT services and consulting.', ''],
    templateName: 'computer-seekho-recruiters-template.xlsx',
    previewHeaders: ['Recruiter', 'Description', 'Photo URL'],
    toPreviewRow: (r) => ({
      cols: [r[0] ?? '', r[1] ?? '', r[2] ?? ''],
      valid: Boolean(r[0]),
    }),
    validate: validateRecruiterExcel,
    upload: uploadRecruiterExcel,
  },
};

export default function ExcelUpload() {
  const [table, setTable] = useState('placements');
  const [step, setStep] = useState(1);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [serverValidation, setServerValidation] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef(null);

  const spec = TABLES[table];

  async function downloadTemplate() {
    const XLSX = await loadXLSX();
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([spec.columns, spec.templateRow]);
    XLSX.utils.book_append_sheet(wb, ws, spec.label);
    XLSX.writeFile(wb, spec.templateName);
  }

  function chooseTable(key) {
    setTable(key);
    setStep(2);
  }

  function handleFile(f) {
    if (!f) return;
    if (!f.name.endsWith('.xlsx')) {
      setError('Only .xlsx files are accepted.');
      return;
    }
    setError('');
    setFile(f);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const XLSX = await loadXLSX();
        const wb = XLSX.read(e.target.result, { type: 'array' });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }).slice(1);
        setPreview(rows.map((r) => spec.toPreviewRow(r)));
      } catch {
        setError('Could not read that file — make sure it is a valid .xlsx workbook.');
      }
    };
    reader.readAsArrayBuffer(f);
    setStep(3);

    spec.validate(f).then(setServerValidation).catch((err) => setError(err.message));
  }

  async function onImport() {
    setBusy(true);
    setError('');
    try {
      const res = await spec.upload(file);
      setImportResult(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setStep(1); setFile(null); setPreview(null); setServerValidation(null); setImportResult(null); setError('');
  }

  return (
    <div>
      <div className="admin-title-row">
        <div>
          <h1>Excel Data Upload</h1>
          <p className="muted">Bulk-import placement or recruiter records from a spreadsheet.</p>
        </div>
      </div>

      <div className="upload-steps">
        {['Choose table', 'Upload file', 'Validate & import'].map((label, i) => (
          <div className={`upload-step ${step === i + 1 ? 'active' : step > i + 1 ? 'done' : ''}`} key={label}>
            <span>{i + 1}</span>{label}
          </div>
        ))}
      </div>

      {error && <p className="alert alert-danger">{error}</p>}

      {step === 1 && (
        <div className="card card-pad">
          <h3>What are you importing?</h3>
          <div className="table-choice-grid">
            <button className={`table-choice ${table === 'placements' ? 'active' : ''}`} onClick={() => chooseTable('placements')}>
              <b>Placements</b>
              <span>{TABLES.placements.blurb}</span>
            </button>
            <button className={`table-choice ${table === 'recruiters' ? 'active' : ''}`} onClick={() => chooseTable('recruiters')}>
              <b>Recruiters</b>
              <span>{TABLES.recruiters.blurb}</span>
            </button>
            {OTHER_TABLES.map((t) => (
              <div className="table-choice disabled" key={t} title="Not wired to a bulk-import endpoint yet">
                <b>{t}</b>
                <span>Add these individually from Content Manager for now.</span>
              </div>
            ))}
          </div>
          <div className="form-actions">
            <button className="btn btn-outline" onClick={downloadTemplate}>Download {spec.label} Template</button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="card card-pad">
          <h3>Upload {spec.label.toLowerCase()} spreadsheet</h3>
          <div
            className={`dropzone ${dragOver ? 'drag' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
            onClick={() => inputRef.current.click()}
          >
            <p><b>Drag and drop your .xlsx file here</b></p>
            <p className="muted">or click to browse</p>
            <input ref={inputRef} type="file" accept=".xlsx" hidden onChange={(e) => handleFile(e.target.files[0])} />
          </div>
          <div className="form-actions">
            <button className="btn btn-ghost" onClick={() => setStep(1)}>Back</button>
            <button className="btn btn-outline" onClick={downloadTemplate}>Download Template</button>
          </div>
        </div>
      )}

      {step === 3 && file && (
        <div className="card card-pad">
          <h3>Validate &amp; import {spec.label} — {file.name}</h3>

          {serverValidation && (
            <div className="stat-row" style={{ marginTop: 16, marginBottom: 16 }}>
              <div className="stat-tile"><b>{serverValidation.totalRecords}</b><span>Total rows</span></div>
              <div className="stat-tile"><b style={{ color: 'var(--ok-600)' }}>{serverValidation.validRecords}</b><span>Valid</span></div>
              <div className="stat-tile"><b style={{ color: 'var(--danger-600)' }}>{serverValidation.invalidRecords}</b><span>Invalid</span></div>
            </div>
          )}
          {serverValidation?.errors?.length > 0 && (
            <div className="alert alert-danger" style={{ marginBottom: 16 }}>
              {serverValidation.errors.slice(0, 5).map((e, i) => <div key={i}>{e}</div>)}
              {serverValidation.errors.length > 5 && <div>…and {serverValidation.errors.length - 5} more.</div>}
            </div>
          )}

          {preview && (
            <div className="table-wrap" style={{ marginBottom: 16 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    {spec.previewHeaders.map((h) => <th key={h}>{h}</th>)}
                    <th>Row status</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.slice(0, 12).map((r, i) => (
                    <tr key={i}>
                      {r.cols.map((c, j) => <td key={j}>{c}</td>)}
                      <td>{r.valid ? <span className="badge badge-ok">Valid</span> : <span className="badge badge-danger">Missing data</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {importResult ? (
            <div className={`alert ${importResult.success ? 'alert-ok' : 'alert-danger'}`}>
              <b>{importResult.message || (importResult.success ? 'Import complete.' : 'Import failed.')}</b>
              <p style={{ marginTop: 6 }}>{importResult.importedRecords} imported, {importResult.failedRecords} failed, of {importResult.totalRecords} total.</p>
              {importResult.errors?.length > 0 && (
                <div style={{ marginTop: 10 }}>
                  {importResult.errors.slice(0, 5).map((e, i) => <div key={i}>{e}</div>)}
                  {importResult.errors.length > 5 && <div>…and {importResult.errors.length - 5} more.</div>}
                </div>
              )}
            </div>
          ) : (
            <div className="form-actions">
              <button className="btn btn-ghost" onClick={reset}>Start over</button>
              <button className="btn btn-primary" onClick={onImport} disabled={busy || !serverValidation?.success}>
                {busy ? <span className="spinner" /> : 'Import Valid Rows'}
              </button>
            </div>
          )}
          {importResult && <div className="form-actions"><button className="btn btn-outline" onClick={reset}>Upload another file</button></div>}
        </div>
      )}
    </div>
  );
}