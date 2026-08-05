import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAllPlacements } from '../../api/misc';
import { getAllBatches } from '../../api/courses';
import { getAllRecruiters } from '../../api/content';
import { getAllStudents } from '../../api/students';
import { Avatar, EmptyState, Loading, Stat } from '../../components/ui/ui';

function formatINR(n) {
  if (n === null || n === undefined) return '—';
  const num = Number(n);
  if (num >= 100000) return `₹${(num / 100000).toFixed(1)}L`;
  return `₹${num.toLocaleString('en-IN')}`;
}

export default function Placements() {
  const [placements, setPlacements] = useState(null);
  const [batches, setBatches] = useState([]);
  const [recruiterCount, setRecruiterCount] = useState(null);
  const [studentCount, setStudentCount] = useState(null);
  const [search, setSearch] = useState('');
  const [course, setCourse] = useState('');
  const [batch, setBatch] = useState('');

  useEffect(() => {
    getAllPlacements().then(setPlacements).catch(() => setPlacements([]));
    getAllBatches().then(setBatches).catch(() => setBatches([]));
    getAllRecruiters().then((r) => setRecruiterCount(r.length)).catch(() => {});
    getAllStudents().then((s) => setStudentCount(s.length)).catch(() => {});
  }, []);

  const batchMap = useMemo(() => Object.fromEntries(batches.map((b) => [b.batchId, b])), [batches]);

  const enriched = useMemo(() => {
    if (!placements) return [];
    return placements.map((p) => ({ ...p, courseName: batchMap[p.batchId]?.courseName || '' }));
  }, [placements, batchMap]);

  const courseOptions = useMemo(() => [...new Set(enriched.map((p) => p.courseName).filter(Boolean))], [enriched]);
  const batchOptions = useMemo(
    () => [...new Set(enriched.filter((p) => !course || p.courseName === course).map((p) => p.batchName).filter(Boolean))],
    [enriched, course]
  );

  const filtered = enriched.filter((p) => {
    if (course && p.courseName !== course) return false;
    if (batch && p.batchName !== batch) return false;
    if (search && !(`${p.placedStudentName} ${p.recruiterName}`.toLowerCase().includes(search.toLowerCase()))) return false;
    return true;
  });

  const packages = enriched.map((p) => Number(p.placementPackage)).filter((n) => !Number.isNaN(n));
  const highest = packages.length ? Math.max(...packages) : null;
  const average = packages.length ? packages.reduce((a, b) => a + b, 0) / packages.length : null;
  // placed_student has no foreign key back to student, so this is an
  // approximation (placement record count vs. total admitted students),
  // not a guaranteed 1:1 ratio - clamp to 100% since a rate can never
  // logically exceed that, regardless of how the two counts compare.
  const placementRate = studentCount ? Math.min(100, Math.round((enriched.length / studentCount) * 100)) : null;

  const buckets = useMemo(() => {
    const ranges = [
      [0, 300000], [300000, 500000], [500000, 700000], [700000, 900000], [900000, 1200000], [1200000, Infinity],
    ];
    return ranges.map(([lo, hi]) => ({
      label: hi === Infinity ? `${lo / 100000}L+` : `${lo / 100000}-${hi / 100000}L`,
      count: packages.filter((p) => p >= lo && p < hi).length,
    }));
  }, [packages]);
  const maxCount = Math.max(1, ...buckets.map((b) => b.count));

  return (
    <div className="container section">
      <div className="page-head">
        <div>
          <p className="eyebrow">Outcomes</p>
          <h1 className="h2">Batchwise placements</h1>
          <p className="body-text">Select a batch to see placed students and recruiter details.</p>
        </div>
        <div className="segmented">
          <Link to="/placements" className="active">Batchwise Placement</Link>
          <Link to="/recruiters">Our Recruiters</Link>
        </div>
      </div>

      <div className="stat-row">
        <Stat value={placementRate !== null ? `${placementRate}%` : '—'} label="Placement rate" />
        <Stat value={formatINR(highest)} label="Highest package" tone="brass" />
        <Stat value={formatINR(average)} label="Average package" />
        <Stat value={recruiterCount ?? '—'} label="Recruiters" tone="brass" />
      </div>

      <div className="card card-pad-sm filter-bar">
        <input className="input" placeholder="Search student or recruiter" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="select" value={course} onChange={(e) => { setCourse(e.target.value); setBatch(''); }}>
          <option value="">All courses</option>
          {courseOptions.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="select" value={batch} onChange={(e) => setBatch(e.target.value)}>
          <option value="">All batches</option>
          {batchOptions.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
      </div>

      {placements === null && <Loading label="Loading placements…" />}
      {placements && placements.length === 0 && (
        <EmptyState title="No placements published yet" description="Batchwise placement records will appear here once added." />
      )}

      {placements && placements.length > 0 && (
        <>
          <div className="card table-wrap">
            <table className="data-table">
              <thead>
                <tr><th>Student</th><th>Batch</th><th>Recruiter</th><th>Package</th></tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.placedStudentId}>
                    <td>
                      <div className="student-cell">
                        <Avatar name={p.placedStudentName} size={30} />
                        <b>{p.placedStudentName}</b>
                      </div>
                    </td>
                    <td>{p.courseName ? `${p.courseName} · ` : ''}{p.batchName}</td>
                    <td>{p.recruiterName}</td>
                    <td>{formatINR(p.placementPackage)}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={4} className="muted" style={{ textAlign: 'center', padding: '24px' }}>No results match your filters.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="placement-bottom">
            <div className="card card-pad chart-box">
              <b style={{ fontSize: 'var(--text-sm)' }}>Package distribution</b>
              <div className="bar-chart">
                {buckets.map((b) => (
                  <div className="bar-col" key={b.label}>
                    <div className="bar" style={{ height: `${(b.count / maxCount) * 100}%` }} title={`${b.count} placements`} />
                    <span>{b.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="card card-pad legend-list">
              <b style={{ fontSize: 'var(--text-sm)' }}>Summary</b>
              <div className="legend-item"><span>Students trained</span><b>{studentCount ?? '—'}</b></div>
              <div className="legend-item"><span>Students placed</span><b>{enriched.length}</b></div>
              <div className="legend-item"><span>Active recruiters</span><b>{recruiterCount ?? '—'}</b></div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}