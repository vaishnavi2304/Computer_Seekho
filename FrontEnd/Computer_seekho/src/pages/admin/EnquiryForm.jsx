import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  getEnquiryById, createEnquiry, updateEnquiry, assignStaffToEnquiry,
  getFollowupHistory, logFollowup, getAllClosureReasons, deleteEnquiry,
} from '../../api/enquiries';
import { getActiveCourses } from '../../api/courses';
import { getAllStaff } from '../../api/staff';
import { Loading, StatusBadge } from '../../components/ui/ui';
import { extractFreeText, extractProgramInterest, extractPreferredTime, deriveEnquiryStatus, STATUS_COPY } from '../../utils/enquiry';

const emptyDetails = { name: '', mobile: '', altMobile: '', email: '', address: '', source: 'Walk-in', course: '', time: '', query: '' };

export default function EnquiryForm() {
  const { id } = useParams();
  const isNew = !id;
  const navigate = useNavigate();
  const { staff } = useAuth();

  const [enquiry, setEnquiry] = useState(null);
  const [details, setDetails] = useState(emptyDetails);
  const [courses, setCourses] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [assignedStaffId, setAssignedStaffId] = useState('');
  const [history, setHistory] = useState([]);
  const [closureReasons, setClosureReasons] = useState([]);

  const [followMsg, setFollowMsg] = useState('');
  const [nextDate, setNextDate] = useState(defaultNextDate());
  const [closureReasonId, setClosureReasonId] = useState('');
  const [otherReason, setOtherReason] = useState('');

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    getActiveCourses().then(setCourses).catch(() => setCourses([]));
    getAllStaff().then(setStaffList).catch(() => setStaffList([]));
    getAllClosureReasons().then(setClosureReasons).catch(() => setClosureReasons([]));
  }, []);

  useEffect(() => {
    if (isNew) return;
    setLoading(true);
    Promise.all([getEnquiryById(id), getFollowupHistory(id)])
      .then(([e, hist]) => {
        setEnquiry(e);
        setAssignedStaffId(e.staff?.staffId || '');
        setDetails({
          name: e.enquirerName || '',
          mobile: e.enquirerMobile || '',
          altMobile: e.enquirerAlternateMobile || '',
          email: e.enquirerEmailId || '',
          address: e.enquirerAddress || '',
          source: e.enquirySource || 'Walk-in',
          course: extractProgramInterest(e.enquirerQuery),
          time: extractPreferredTime(e.enquirerQuery),
          query: extractFreeText(e.enquirerQuery),
        });
        setHistory(Array.isArray(hist) ? hist : []);
        if (e.followupDate) setNextDate(e.followupDate);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id, isNew]);

  function buildQuery(d) {
    const header = [
      d.course && `Program interested in: ${d.course}`,
      d.time && `Preferred time to call: ${d.time}`,
    ].filter(Boolean).join('\n');
    return [header, d.query].filter(Boolean).join('\n\n') || null;
  }

  async function onSaveDetails(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const payload = {
        enquirerName: details.name,
        enquirerAddress: details.address || null,
        enquirerMobile: Number(details.mobile),
        enquirerAlternateMobile: details.altMobile ? Number(details.altMobile) : null,
        enquirerEmailId: details.email || null,
        enquirerQuery: buildQuery(details),
        enquiryProcessedFlag: enquiry?.enquiryProcessedFlag ?? false,
        inquiryCounter: enquiry?.inquiryCounter ?? 0,
        followupDate: enquiry?.followupDate || defaultNextDate(),
        enquirySource: details.source,
      };
      if (isNew) {
        const created = await createEnquiry(payload);
        navigate(`/admin/enquiries/${created.enquiryId}`, { replace: true });
      } else {
        const updated = await updateEnquiry(id, { ...enquiry, ...payload });
        setEnquiry(updated);
        setNotice('Enquiry details saved.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function onAssignStaff() {
    if (!assignedStaffId) return;
    try {
      const updated = await assignStaffToEnquiry(id, { staffId: Number(assignedStaffId), remarks: '' });
      setEnquiry(updated);
      setNotice('Staff assigned.');
    } catch (err) {
      setError(err.message);
    }
  }

  async function onSaveFollowup() {
    if (!followMsg.trim()) { setError('Enter a follow-up message before saving.'); return; }
    setSaving(true);
    setError('');
    try {
      await logFollowup({ enquiryId: Number(id), followupMsg: followMsg, nextFollowupDate: nextDate }, staff.staffId);
      const [freshEnquiry, freshHistory] = await Promise.all([getEnquiryById(id), getFollowupHistory(id)]);
      setEnquiry(freshEnquiry);
      setHistory(Array.isArray(freshHistory) ? freshHistory : []);
      setFollowMsg('');
      setNextDate(defaultNextDate());
      setNotice('Follow-up saved.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function onCloseEnquiry() {
    if (!closureReasonId && !otherReason.trim()) { setError('Choose a closure reason or enter one.'); return; }
    setSaving(true);
    setError('');
    try {
      const updated = await updateEnquiry(id, {
        ...enquiry,
        enquiryProcessedFlag: true,
        closureReason: closureReasonId ? { closureReasonId: Number(closureReasonId) } : null,
        closureReasonText: otherReason || null,
      });
      setEnquiry(updated);
      setNotice('Enquiry closed.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function onDeleteEnquiry() {
    if (!window.confirm('Delete this enquiry permanently? This cannot be undone.')) return;
    setSaving(true);
    setError('');
    try {
      await deleteEnquiry(id);
      navigate('/admin/enquiries', { replace: true });
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  if (loading) return <Loading label="Loading enquiry…" />;

  const status = enquiry ? deriveEnquiryStatus(enquiry) : 'new';
  const isDone = status === 'registered' || status === 'closed';

  return (
    <div>
      <div className="admin-title-row">
        <div>
          <h1>{isNew ? 'Add Enquiry' : `Add / Update Enquiry`}</h1>
          <p className="muted">
            {isNew ? 'Every enquiry — however it arrives — should be entered here.' : 'Prefilled from the existing record. Save every contact as follow-up history.'}
          </p>
        </div>
        {enquiry && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <StatusBadge status={status}>{STATUS_COPY[status]}</StatusBadge>
            {!isDone && history.length > 0 && (
              <span className="muted" style={{ fontSize: 13 }}>Last contacted: <b>{history[0].followupDate}</b></span>
            )}
            {!isDone && enquiry.followupDate && (
              <span className="muted" style={{ fontSize: 13 }}>Next follow-up due: <b>{enquiry.followupDate}</b></span>
            )}
            <button type="button" className="btn btn-danger-outline btn-sm" onClick={onDeleteEnquiry} disabled={saving}>Delete</button>
          </div>
        )}
      </div>

      {error && <p className="alert alert-danger">{error}</p>}
      {notice && <p className="alert alert-ok">{notice}</p>}

      <div className="two-col-layout">
        <div>
          <form className="card form-section" onSubmit={onSaveDetails}>
            <h3>Enquiry details</h3>
            <div className="form-grid-3" style={{ marginTop: 14 }}>
              <div className="field">
                <label>Source</label>
                <select className="select" value={details.source} onChange={(e) => setDetails({ ...details, source: e.target.value })}>
                  <option>Walk-in</option><option>Telephonic</option><option>Online</option><option>Email</option><option>Fax</option>
                </select>
              </div>
              <div className="field"><label>Enquirer name *</label><input className="input" required value={details.name} onChange={(e) => setDetails({ ...details, name: e.target.value })} /></div>
              <div className="field"><label>Mobile *</label><input className="input" required value={details.mobile} onChange={(e) => setDetails({ ...details, mobile: e.target.value.replace(/\D/g, '') })} maxLength={10} /></div>
              <div className="field"><label>Alternate mobile</label><input className="input" value={details.altMobile} onChange={(e) => setDetails({ ...details, altMobile: e.target.value.replace(/\D/g, '') })} maxLength={10} /></div>
              <div className="field"><label>Email</label><input className="input" value={details.email} onChange={(e) => setDetails({ ...details, email: e.target.value })} /></div>
              <div className="field">
                <label>Course enquired *</label>
                <select className="select" required value={details.course} onChange={(e) => setDetails({ ...details, course: e.target.value })}>
                  <option value="">Select course</option>
                  {courses.map((c) => <option key={c.courseId} value={c.courseName}>{c.courseName}</option>)}
                </select>
                <span className="hint">Stored in the query notes — this backend has no dedicated course field on enquiries.</span>
              </div>
              <div className="field">
                <label>Assigned staff</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <select className="select" value={assignedStaffId} onChange={(e) => setAssignedStaffId(e.target.value)} disabled={isNew}>
                    <option value="">Unassigned</option>
                    {staffList.map((s) => <option key={s.staffId} value={s.staffId}>{s.staffName}</option>)}
                  </select>
                  {!isNew && <button type="button" className="btn btn-outline btn-sm" onClick={onAssignStaff}>Assign</button>}
                </div>
              </div>
              <div className="field full"><label>Address</label><input className="input" value={details.address} onChange={(e) => setDetails({ ...details, address: e.target.value })} /></div>
              <div className="field full">
                <label>Message</label>
                <textarea
                  className="textarea"
                  rows={3}
                  value={details.query}
                  readOnly
                />
              </div>
            </div>
            <div className="form-actions">
              <button className="btn btn-primary" type="submit" disabled={saving}>{isNew ? 'Create Enquiry' : 'Save Details'}</button>
            </div>
          </form>

          {!isNew && !isDone && (
            <div className="card form-section">
              <h3>Add follow-up</h3>
              <p className="muted" style={{ marginTop: 4 }}>
                Follow-up {Math.min((enquiry?.inquiryCounter || 0) + 1, 3)} of 3 — the enquiry closes
                automatically after the 3rd follow-up if it's still undecided.
              </p>
              <div className="two-col" style={{ marginTop: 14 }}>
                <div className="field"><label>Follow-up message</label><textarea className="textarea" rows={3} value={followMsg} onChange={(e) => setFollowMsg(e.target.value)} /></div>
                <div>
                  <div className="field" style={{ marginBottom: 12 }}><label>Next follow-up date</label><input type="date" className="input" value={nextDate} onChange={(e) => setNextDate(e.target.value)} /></div>
                  <p className="hint">Defaults to current date + 3 days — adjust the date above if needed.</p>
                </div>
              </div>
              <div className="form-actions">
                <button className="btn btn-outline" onClick={onSaveFollowup} disabled={saving}>Save Follow-up</button>
                <Link to={`/admin/admissions/${id}`} className="btn btn-primary">Register Student</Link>
              </div>
            </div>
          )}

          {!isNew && !isDone && (
            <div className="card form-section">
              <h3>Close enquiry</h3>
              <div className="field" style={{ marginTop: 14, marginBottom: 12 }}>
                <label>Closure reason</label>
                <select className="select" value={closureReasonId} onChange={(e) => setClosureReasonId(e.target.value)}>
                  <option value="">Select predefined reason</option>
                  {closureReasons.map((r) => <option key={r.closureReasonId} value={r.closureReasonId}>{r.closureReasonDesc}</option>)}
                </select>
              </div>
              <div className="field"><label>Other reason</label><textarea className="textarea" rows={2} value={otherReason} onChange={(e) => setOtherReason(e.target.value)} /></div>
              <div className="form-actions">
                <button className="btn btn-danger-outline" onClick={onCloseEnquiry} disabled={saving}>Close Enquiry</button>
              </div>
            </div>
          )}
        </div>

        <div>
          {!isNew && (
            <div className="card form-section">
              <h3>Follow-up history</h3>
              {history.length === 0 ? (
                <p className="muted">No follow-up logged yet.</p>
              ) : (
                <div className="table-wrap" style={{ marginTop: 12 }}>
                  <table className="data-table">
                    <thead>
                      <tr><th>Date</th><th>Staff</th><th>Message</th></tr>
                    </thead>
                    <tbody>
                      {history.slice().reverse().map((h) => (
                        <tr key={h.followupId}>
                          <td>{h.followupDate}</td>
                          <td>{h.staff?.staffName || 'System'}</td>
                          <td>{h.followupMsg}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
          {isDone && enquiry?.closureReasonText && (
            <div className="card form-section">
              <h3>Closure notes</h3>
              <p className="body-text" style={{ marginTop: 10 }}>{enquiry.closureReasonText}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function defaultNextDate() {
  const d = new Date();
  d.setDate(d.getDate() + 3);
  return d.toISOString().slice(0, 10);
}