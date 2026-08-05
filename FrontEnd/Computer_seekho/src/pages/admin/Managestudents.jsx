import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getActiveBatchesByCourse } from '../../api/courses';
import { recordOfflinePayment, createRazorpayOrder, verifyRazorpayAdmission, getPaymentSummary, getPaymentsByStudent, searchStudents } from '../../api/students';
import { Loading } from '../../components/ui/ui';

const PAYMENT_TYPES = ['Cash', 'Cheque', 'Demand Draft', 'Bank Transfer', 'UPI', 'Net Banking'];
const ONLINE_PAYMENT_TYPES = ['Bank Transfer', 'UPI', 'Net Banking'];
const RAZORPAY_METHOD_BY_TYPE = {
  'Bank Transfer': 'netbanking',
  'Net Banking': 'netbanking',
  UPI: 'upi',
};

function loadRazorpayScript() {
  if (window.Razorpay) return Promise.resolve();
  if (loadRazorpayScript._promise) return loadRazorpayScript._promise;
  loadRazorpayScript._promise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Could not load the Razorpay payment gateway. Check your connection and try again.'));
    document.body.appendChild(script);
  });
  return loadRazorpayScript._promise;
}

const SEARCH_MODES = [
  ['name', 'Name'],
  ['mobile', 'Mobile'],
  ['studentId', 'Student ID'],
  ['admissionId', 'Admission ID'],
];

export default function ManageStudents() {
  const [searchMode, setSearchMode] = useState('name');
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const [student, setStudent] = useState(null);
  const [summary, setSummary] = useState(null);
  const [history, setHistory] = useState(null);
  const [loadingStudent, setLoadingStudent] = useState(false);

  const [batches, setBatches] = useState([]);
  const [payment, setPayment] = useState({ type: 'Cash', date: new Date().toISOString().slice(0, 10), amount: '', remarks: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const q = search.trim();
    const minLen = searchMode === 'name' ? 2 : 1;
    if (q.length < minLen) {
      setResults([]);
      return;
    }
    setSearching(true);
    const timer = setTimeout(() => {
      let params;
      if (searchMode === 'mobile') params = { mobile: q };
      else if (searchMode === 'studentId') params = { studentId: q };
      else if (searchMode === 'admissionId') params = { admissionId: q };
      else params = { name: q };

      searchStudents(params)
        .then(setResults)
        .catch(() => setResults([]))
        .finally(() => setSearching(false));
    }, 350);
    return () => clearTimeout(timer);
  }, [search, searchMode]);

  useEffect(() => {
    if (student?.batchId || student?.courseId) {
      getActiveBatchesByCourse(student.courseId).then(setBatches).catch(() => setBatches([]));
    }
  }, [student]);

  async function selectStudent(s) {
    setError('');
    setSearch('');
    setResults([]);
    setLoadingStudent(true);
    setStudent(s);
    setPayment({ type: 'Cash', date: new Date().toISOString().slice(0, 10), amount: '', remarks: '' });
    await refresh(s.studentId);
    setLoadingStudent(false);
  }

  async function refresh(studentId) {
    try {
      const [s, h] = await Promise.all([
        getPaymentSummary(studentId),
        getPaymentsByStudent(studentId).catch(() => []),
      ]);
      setSummary(s);
      setHistory(h);
      setPayment((p) => ({ ...p, amount: s.fullyPaid ? '' : String(s.pendingAmount) }));
    } catch (err) {
      setError(err.message);
    }
  }

  function backToSearch() {
    setStudent(null);
    setSummary(null);
    setHistory(null);
    setBatches([]);
    setError('');
  }

  const fullyPaid = Boolean(summary?.fullyPaid);
  const isOnline = ONLINE_PAYMENT_TYPES.includes(payment.type);

  async function onCollectOffline() {
    setError('');
    if (!payment.amount || Number(payment.amount) <= 0) {
      setError('Enter the amount to collect.');
      return;
    }
    setSaving(true);
    try {
      const receipt = await recordOfflinePayment({
        studentId: student.studentId,
        courseId: student.courseId,
        batchId: student.batchId,
        paymentType: payment.type,
        amount: Number(payment.amount),
        remarks: payment.remarks || null,
      });
      await refresh(receipt.studentId);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function onCollectOnline() {
    setError('');
    if (!payment.amount || Number(payment.amount) <= 0) {
      setError('Enter the amount to collect.');
      return;
    }
    const razorpayMethod = RAZORPAY_METHOD_BY_TYPE[payment.type];
    if (!razorpayMethod) {
      setError('Select Bank Transfer, UPI or Net Banking to pay through Razorpay.');
      return;
    }

    setSaving(true);
    try {
      await loadRazorpayScript();

      const order = await createRazorpayOrder({
        studentId: student.studentId,
        courseId: student.courseId,
        batchId: student.batchId,
        amount: Number(payment.amount),
      });

      const rzp = new window.Razorpay({
        key: order.keyId,
        amount: order.amountInPaise,
        currency: order.currency,
        name: 'Computer Seekho',
        description: `${student.courseName || 'Course'} - installment`,
        order_id: order.razorpayOrderId,
        method: { [razorpayMethod]: true },
        prefill: {
          name: student.studentName,
          contact: student.studentMobile,
          email: student.studentEmail || undefined,
        },
        theme: { color: '#0D9488' },
        handler: async (response) => {
          try {
            const receipt = await verifyRazorpayAdmission({
              studentId: student.studentId,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              courseId: student.courseId,
              batchId: student.batchId,
              remarks: payment.remarks || null,
            });
            await refresh(receipt.studentId);
          } catch (err) {
            setError(`Payment was received, but could not be recorded: ${err.message}. Reference payment ID: ${response.razorpay_payment_id}.`);
          } finally {
            setSaving(false);
          }
        },
        modal: { ondismiss: () => setSaving(false) },
      });

      rzp.on('payment.failed', () => {
        setError('Payment failed. Nothing has been charged — you can try again.');
        setSaving(false);
      });

      rzp.open();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="admin-title-row">
        <div>
          <h1>Manage Student</h1>
          <p className="muted">Look up any admitted student, review their full payment history, and collect further installments.</p>
        </div>
        {student && (
          <button className="btn btn-outline btn-sm" type="button" onClick={backToSearch}>← Back to search</button>
        )}
      </div>

      {error && <p className="alert alert-danger">{error}</p>}

      {!student && (
        <div className="card card-pad-sm" style={{ position: 'relative' }}>
          <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
            {SEARCH_MODES.map(([mode, label]) => (
              <button
                key={mode}
                type="button"
                className={`btn btn-sm ${searchMode === mode ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => { setSearchMode(mode); setSearch(''); setResults([]); }}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="filterbar" style={{ marginBottom: 0 }}>
            <input
              className="filter-input search"
              placeholder={
                searchMode === 'name' ? 'Search by student name'
                : searchMode === 'mobile' ? 'Search by exact mobile number'
                : searchMode === 'studentId' ? 'Search by exact Student ID (e.g. 42)'
                : 'Search by exact Admission ID / Enquiry ID (e.g. 17)'
              }
              value={search}
              onChange={(e) => {
                const v = e.target.value;
                setSearch(searchMode === 'name' ? v : v.replace(/\D/g, ''));
              }}
            />
          </div>
          {searching && <p className="muted" style={{ marginTop: 8, fontSize: 'var(--text-sm)' }}>Searching…</p>}
          {results.length > 0 && (
            <div className="search-results">
              {results.map((s) => (
                <button className="search-result-row" key={s.studentId} onClick={() => selectStudent(s)}>
                  <div><b>{s.studentName}</b><span className="muted mono" style={{ marginLeft: 8 }}>STU-{s.studentId} · {s.studentMobile}</span></div>
                  <span className="muted">{s.courseName || '—'} {s.batchName ? `/ ${s.batchName}` : ''}</span>
                </button>
              ))}
            </div>
          )}
          {search.trim().length >= (searchMode === 'name' ? 2 : 1) && !searching && results.length === 0 && (
            <p className="muted" style={{ marginTop: 8, fontSize: 'var(--text-sm)' }}>No admitted students match "{search.trim()}".</p>
          )}
        </div>
      )}

      {loadingStudent && <Loading label="Loading student…" />}

      {student && !loadingStudent && (
        <div className="admission-layout">
          <div>
            <div className="card form-section">
              <h3>Student</h3>
              <div className="admission-grid">
                <div className="field">
                  <label>Photo</label>
                  <div className="photo-upload">
                    {student.photoUrl ? <img src={student.photoUrl} alt="" /> : <span className="muted">No photo</span>}
                  </div>
                </div>
                <div className="two-col" style={{ gridColumn: 'span 2' }}>
                  <div className="field"><label>Name</label><input className="input" value={student.studentName || ''} disabled /></div>
                  <div className="field"><label>Student ID</label><input className="input" value={`STU-${student.studentId}`} disabled /></div>
                  <div className="field"><label>Mobile</label><input className="input" value={student.studentMobile || ''} disabled /></div>
                  <div className="field"><label>Email</label><input className="input" value={student.studentEmail || '—'} disabled /></div>
                  <div className="field"><label>Course</label><input className="input" value={student.courseName || '—'} disabled /></div>
                  <div className="field"><label>Batch</label><input className="input" value={student.batchName || '—'} disabled /></div>
                  <div className="field"><label>Admission ref</label><input className="input" value={student.enquiryId ? `ENQ-${student.enquiryId}` : '—'} disabled /></div>
                </div>
              </div>
            </div>

            <div className="card form-section">
              <h3>{fullyPaid ? 'Fully paid' : 'Collect an installment'}</h3>
              {!fullyPaid && (
                <>
                  <div className="form-grid-3" style={{ marginTop: 14 }}>
                    <div className="field">
                      <label>Payment type</label>
                      <select className="select" value={payment.type} onChange={(e) => setPayment({ ...payment, type: e.target.value })}>
                        {PAYMENT_TYPES.map((t) => <option key={t}>{t}</option>)}
                      </select>
                    </div>
                    <div className="field"><label>Payment date</label><input type="date" className="input" value={payment.date} onChange={(e) => setPayment({ ...payment, date: e.target.value })} /></div>
                    <div className="field" style={{ maxWidth: 260 }}>
                      <label>Amount to collect (INR)</label>
                      <input className="input" style={{ fontSize: 'var(--text-lg)', fontWeight: 600 }} value={payment.amount} onChange={(e) => setPayment({ ...payment, amount: e.target.value.replace(/\D/g, '') })} />
                    </div>
                    <div className="field"><label>Remarks (optional)</label><input className="input" value={payment.remarks} onChange={(e) => setPayment({ ...payment, remarks: e.target.value })} /></div>
                  </div>
                  <div className="form-actions">
                    {isOnline ? (
                      <button className="btn btn-primary" type="button" onClick={onCollectOnline} disabled={saving}>
                        {saving ? <span className="spinner" /> : 'Collect via Razorpay'}
                      </button>
                    ) : (
                      <button className="btn btn-primary" type="button" onClick={onCollectOffline} disabled={saving}>
                        {saving ? <span className="spinner" /> : 'Record installment'}
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="card receipt-preview" style={{ minWidth: 0 }}>
            <div className="panel-head">
              <h3>History</h3>
              <span className="badge badge-plain">{fullyPaid ? 'Fully paid' : 'Active'}</span>
            </div>

            {summary && (
              <div className="stat-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }}>
                <div className="stat-tile" style={{ minWidth: 0 }}><b style={{ fontSize: 20, whiteSpace: 'nowrap' }}>₹{Number(summary.courseFee).toLocaleString('en-IN')}</b><span>Total course fee</span></div>
                <div className="stat-tile" style={{ minWidth: 0 }}><b style={{ color: 'var(--ok-600)', fontSize: 20, whiteSpace: 'nowrap' }}>₹{Number(summary.totalPaid).toLocaleString('en-IN')}</b><span>Total paid</span></div>
                <div className="stat-tile" style={{ minWidth: 0 }}>
                  <b style={{ color: summary.fullyPaid ? 'var(--ok-600)' : 'var(--danger-600)', fontSize: 20, whiteSpace: 'nowrap' }}>₹{Number(summary.pendingAmount).toLocaleString('en-IN')}</b>
                  <span>{summary.fullyPaid ? 'Fully paid' : 'Remaining fee'}</span>
                </div>
              </div>
            )}

            {history && history.length > 0 ? (
              <div className="table-wrap" style={{ marginTop: 16, overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ whiteSpace: 'nowrap' }}>Receipt No</th>
                      <th style={{ whiteSpace: 'nowrap' }}>Date</th>
                      <th style={{ whiteSpace: 'nowrap' }}>Paid Fee</th>
                      <th style={{ whiteSpace: 'nowrap' }}>Remaining Fee</th>
                      <th style={{ whiteSpace: 'nowrap' }}>Mode</th>
                      <th style={{ whiteSpace: 'nowrap' }}>Transaction ID</th>
                      <th style={{ whiteSpace: 'nowrap' }}>Status</th>
                      <th style={{ whiteSpace: 'nowrap' }}>Collected By</th>
                      <th>Remarks</th>
                      <th style={{ whiteSpace: 'nowrap' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((p) => (
                      <tr key={p.paymentId}>
                        <td style={{ whiteSpace: 'nowrap' }}>{p.receiptId ? `RCPT-${p.receiptId}` : '—'}</td>
                        <td style={{ whiteSpace: 'nowrap' }}>{p.paymentDate ? new Date(p.paymentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</td>
                        <td style={{ whiteSpace: 'nowrap' }}>₹{Number(p.amountPaid || 0).toLocaleString('en-IN')}</td>
                        <td style={{ whiteSpace: 'nowrap' }}>₹{Number(p.remainingFeeAfter || 0).toLocaleString('en-IN')}</td>
                        <td style={{ whiteSpace: 'nowrap' }}>{p.paymentMode || '—'}</td>
                        <td className="mono" style={{ fontSize: 'var(--text-xs)', whiteSpace: 'nowrap' }}>{p.transactionId || '—'}</td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          <span className={`badge ${p.status === 'Success' ? 'badge-ok' : p.status === 'Failed' ? 'badge-danger' : 'badge-plain'}`}>
                            {p.status}
                          </span>
                        </td>
                        <td style={{ whiteSpace: 'nowrap' }}>{p.collectedBy || '—'}</td>
                        <td style={{ maxWidth: 160, whiteSpace: 'normal' }}>{p.remarks || '—'}</td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          {p.receiptId ? (
                            <Link to={`/admin/receipt/${p.receiptId}`} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm">
                              View / Print
                            </Link>
                          ) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="muted" style={{ marginTop: 12, fontSize: 'var(--text-sm)' }}>No payments recorded yet for this student.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}