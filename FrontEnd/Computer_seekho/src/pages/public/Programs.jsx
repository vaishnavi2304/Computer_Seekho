import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getActiveCourses, searchCourses } from '../../api/courses';
import { Loading, EmptyState } from '../../components/ui/ui';

export default function Programs() {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') || '';
  const [courses, setCourses] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setCourses(null);
    const request = q ? searchCourses(q) : getActiveCourses();
    request.then(setCourses).catch((e) => setError(e.message));
  }, [q]);

  const groups = useMemo(() => {
    if (!courses) return [];
    const byType = {};
    courses.forEach((c) => {
      if (q && c.courseIsActive === false) return; // search endpoint isn't active-only
      const key = c.ageGrpType || 'Other programs';
      byType[key] = byType[key] || [];
      byType[key].push(c);
    });
    return Object.entries(byType);
  }, [courses, q]);

  return (
    <div className="container section">
      <div className="page-head">
        <div>
          <p className="eyebrow">Programs</p>
          <h1 className="h2">{q ? `Results for "${q}"` : 'All active programs'}</h1>
          <p className="body-text">Only active courses are shown. Fees and duration are set by the institute and kept current here automatically.</p>
        </div>
        <form
          className="inline-search"
          onSubmit={(e) => {
            e.preventDefault();
            const val = e.target.elements.q.value;
            setParams(val ? { q: val } : {});
          }}
        >
          <input name="q" defaultValue={q} placeholder="Search by name or category" className="input" />
          <button className="btn btn-outline btn-sm" type="submit">Search</button>
          {q && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setParams({})}>
              Clear
            </button>
          )}
        </form>
      </div>

      {error && <p className="alert alert-danger">{error}</p>}
      {!courses && !error && <Loading label="Loading programs…" />}

      {courses && groups.length === 0 && (
        <EmptyState
          title="No programs found"
          description={q ? 'Try a different search term.' : 'Programs will appear here once published from the admin panel.'}
        />
      )}

      {groups.map(([group, list]) => (
        <div key={group} className="program-group">
          <h3 className="program-group-title">{group}</h3>
          <div className="program-card-grid">
            {list.map((c) => (
              <Link to={`/programs/${c.courseId}`} className="card card-hover program-card" key={c.courseId}>
                <div className="program-card-img" style={c.coverPhoto ? { backgroundImage: `url(${c.coverPhoto})` } : {}}>
                  {!c.coverPhoto && <span>{c.courseName?.[0] || 'C'}</span>}
                </div>
                <div className="card-pad-sm">
                  <div className="program-card-row">
                    <h4>{c.courseName}</h4>
                    {c.isFeatured && <span className="badge badge-blue">Featured</span>}
                  </div>
                  <p className="muted" style={{ fontSize: 'var(--text-sm)', margin: '4px 0 10px' }}>
                    {c.courseDescription?.slice(0, 100) || c.courseCategory}
                  </p>
                  <div className="program-card-meta">
                    <span>{c.courseDuration ? `${c.courseDuration} months` : '—'}</span>
                    <span>{c.courseFees ? `₹${Number(c.courseFees).toLocaleString('en-IN')}` : 'Fee on request'}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
