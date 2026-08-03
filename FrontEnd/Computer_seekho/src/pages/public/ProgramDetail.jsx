import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getCourseById, getActiveBatchesByCourse } from '../../api/courses';
import { Loading } from '../../components/ui/ui';

const TABS = ['Overview', 'Syllabus', 'Fees', 'Upcoming Batches', 'FAQs'];

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
function formatTime(t) {
  if (!t) return '';
  const [h, m] = t.split(':');
  const hour = Number(h);
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const hr12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hr12}:${m} ${suffix}`;
}

export default function ProgramDetail() {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [batches, setBatches] = useState([]);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('Overview');

  useEffect(() => {
    setCourse(null);
    setError('');
    getCourseById(id).then(setCourse).catch((e) => setError(e.message));
    getActiveBatchesByCourse(id).then(setBatches).catch(() => setBatches([]));
  }, [id]);

  if (error) {
    return (
      <div className="container section">
        <p className="alert alert-danger">{error}</p>
        <Link to="/programs" className="btn btn-outline" style={{ marginTop: 16 }}>← Back to programs</Link>
      </div>
    );
  }
  if (!course) return <div className="container section"><Loading label="Loading program…" /></div>;

  const syllabusPoints = (course.courseSyllabus || '')
    .split(/\n|•|;/)
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <div className="container section">
      <p className="breadcrumb muted">
        <Link to="/">Home</Link> / <Link to="/programs">Programs</Link> / {course.courseName}
      </p>

      <div className="detail-head">
        <div>
          <p className="pill">{course.courseIsActive ? 'Active program' : 'Program'}</p>
          <h1 className="h2">{course.courseName}</h1>
          <p className="lede">{course.courseDescription || 'A practical, industry-oriented program from Computer Seekho.'}</p>
          <div className="detail-meta">
            <div><b>{course.courseDuration ? `${course.courseDuration} months` : '—'}</b><span>Duration</span></div>
            <div><b>{course.courseFees ? `₹${Number(course.courseFees).toLocaleString('en-IN')}` : 'On request'}</b><span>Current fee</span></div>
            <div><b>{course.ageGrpType || '—'}</b><span>Eligibility group</span></div>
            <div><b>Certificate</b><span>On completion</span></div>
          </div>
        </div>
        <div className="detail-img" style={course.coverPhoto ? { backgroundImage: `url(${course.coverPhoto})` } : {}}>
          {!course.coverPhoto && <span>{course.courseName?.[0]}</span>}
        </div>
      </div>

      <div className="tabs">
        {TABS.map((t) => (
          <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      <div className="detail-body">
        <div className="card card-pad">
          {tab === 'Overview' && (
            <>
              <h3>Program overview</h3>
              <p className="body-text" style={{ marginTop: 10 }}>
                {course.courseDescription || 'Details for this program will appear here once added from the admin panel.'}
              </p>
              <h3 style={{ marginTop: 28 }}>Category</h3>
              <p className="body-text" style={{ marginTop: 10 }}>{course.courseCategory}</p>
            </>
          )}
          {tab === 'Syllabus' && (
            <>
              <h3>Syllabus highlights</h3>
              {syllabusPoints.length ? (
                <ul className="bullet-list" style={{ marginTop: 12 }}>
                  {syllabusPoints.map((p, i) => <li key={i}>{p}</li>)}
                </ul>
              ) : (
                <p className="muted" style={{ marginTop: 12 }}>Syllabus details haven't been published for this program yet.</p>
              )}
            </>
          )}
          {tab === 'Fees' && (
            <>
              <h3>Fee details</h3>
              <div className="fee-grid">
                <div><span className="muted">Current fee</span><b>{course.courseFees ? `₹${Number(course.courseFees).toLocaleString('en-IN')}` : 'On request'}</b></div>
                <div><span className="muted">Valid from</span><b>{formatDate(course.courseFeesFrom)}</b></div>
                <div><span className="muted">Valid to</span><b>{formatDate(course.courseFeesTo)}</b></div>
              </div>
              <p className="muted" style={{ marginTop: 16 }}>Fees can be paid by cash, cheque, DD or bank transfer at the time of admission.</p>
            </>
          )}
          {tab === 'Upcoming Batches' && (
            <>
              <h3>All upcoming batches</h3>
              {batches.length === 0 && <p className="muted" style={{ marginTop: 12 }}>No upcoming batches published yet — enquire and we'll notify you.</p>}
              <div className="stack" style={{ marginTop: 12 }}>
                {batches.map((b) => (
                  <div className="batch-row-full" key={b.batchId}>
                    <b>{b.batchName}</b>
                    <span className="muted">{formatTime(b.batchStartTime)} – {formatTime(b.batchEndTime)}</span>
                    <span className="badge badge-ok">Active</span>
                  </div>
                ))}
              </div>
            </>
          )}
          {tab === 'FAQs' && (
            <div className="faq-list">
              <div><b>How do I apply?</b><p>Submit an admission enquiry from this site or visit the campus. Our admissions team follows up to confirm your batch and eligibility.</p></div>
              <div><b>What happens after I enquire?</b><p>A staff member reaches out at your preferred time, usually within a few working days, to answer questions and, if you're ready, schedule your registration.</p></div>
              <div><b>How are fees paid?</b><p>Cash, cheque, demand draft or bank transfer are all accepted at the time of admission, and a receipt is issued immediately.</p></div>
            </div>
          )}
        </div>

        <div className="card card-pad side-card">
          <h4>Upcoming batches</h4>
          <div className="stack" style={{ marginTop: 12 }}>
            {batches.slice(0, 3).map((b) => (
              <div className="batch-row" key={b.batchId}>
                <span>{b.batchName}</span>
                <b className="badge badge-ok">Active</b>
              </div>
            ))}
            {batches.length === 0 && <p className="muted">To be announced.</p>}
          </div>
          <Link to="/enquiry" className="btn btn-primary btn-block" style={{ marginTop: 16 }}>
            Enquire for this program
          </Link>
        </div>
      </div>
    </div>
  );
}
