import { useEffect, useState } from 'react';
import ResourceTab from '../../components/admin/ResourceTab';
import { BackendGapNotice, Loading } from '../../components/ui/ui';
import * as coursesApi from '../../api/courses';
import * as staffApi from '../../api/staff';
import * as contentApi from '../../api/content';
import * as enquiriesApi from '../../api/enquiries';

const TABS = ['Courses', 'Batches', 'Staff', 'Recruiters', 'Albums', 'Images', 'Announcements', 'Payment Types', 'Closure Reasons'];


export default function Content() {
  const [tab, setTab] = useState('Courses');
  const [courses, setCourses] = useState(null);
  const [albums, setAlbums] = useState(null);

  useEffect(() => {
    coursesApi.getAllCourses().then(setCourses).catch(() => setCourses([]));
    contentApi.getAllAlbums().then(setAlbums).catch(() => setAlbums([]));
  }, []);

  if (courses === null || albums === null) return <Loading label="Loading content manager…" />;

  return (
    <div>
      <div className="admin-title-row">
        <div>
          <h1>Content Manager</h1>
          <p className="muted">Every master table behind the public site — changes here appear on the public pages immediately.</p>
        </div>
      </div>

      <div className="content-tabs">
        {TABS.map((t) => (
          <button key={t} className={`content-tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {tab === 'Courses' && <ResourceTab config={coursesConfig()} />}
      {tab === 'Batches' && <ResourceTab config={batchesConfig(courses)} />}
      {tab === 'Staff' && <ResourceTab config={staffConfig()} />}
      {tab === 'Recruiters' && <ResourceTab config={recruitersConfig()} />}
      {tab === 'Albums' && <ResourceTab config={albumsConfig()} />}
      {tab === 'Images' && <ResourceTab config={imagesConfig(albums)} />}
      {tab === 'Announcements' && <ResourceTab config={announcementsConfig()} />}
      {tab === 'Payment Types' && (
        <BackendGapNotice>
          <code>PaymentTypeController.java</code> exists but has no endpoints implemented — there's nowhere for this
          tab to read from or save to yet. The table and form here are ready as soon as the controller is built out.
        </BackendGapNotice>
      )}
      {tab === 'Closure Reasons' && <ResourceTab config={closureReasonsConfig()} />}
    </div>
  );
}

function money(v) { return v ? `₹${Number(v).toLocaleString('en-IN')}` : '—'; }

function coursesConfig() {
  return {
    idKey: 'courseId',
    title: 'Courses',
    singular: 'Course',
    searchKeys: ['courseName', 'courseCategory'],
    columns: [
      { key: 'courseName', label: 'Course' },
      { key: 'courseCategory', label: 'Category' },
      { key: 'ageGrpType', label: 'Type' },
      { key: 'courseDuration', label: 'Duration', render: (i) => (i.courseDuration ? `${i.courseDuration} mo` : '—') },
      { key: 'courseFees', label: 'Fees', render: (i) => money(i.courseFees) },
      { key: 'courseIsActive', label: 'Status' },
    ],
    fields: [
      { key: 'courseName', label: 'Course name', type: 'text', required: true },
      { key: 'courseCategory', label: 'Category', type: 'text', required: true },
      { key: 'ageGrpType', label: 'Type', type: 'select', options: [{ value: 'PG Diploma', label: 'PG Diploma' }, { value: 'Certification', label: 'Certification' }, { value: 'Short-term', label: 'Short-term' }] },
      { key: 'courseDuration', label: 'Duration (months)', type: 'number' },
      { key: 'courseFees', label: 'Fees (INR)', type: 'number' },
      { key: 'courseFeesFrom', label: 'Fee valid from', type: 'date' },
      { key: 'courseFeesTo', label: 'Fee valid to', type: 'date' },
      { key: 'coverPhoto', label: 'Cover photo URL', type: 'text' },
      { key: 'courseDescription', label: 'Description', type: 'textarea' },
      { key: 'courseSyllabus', label: 'Syllabus (one point per line)', type: 'textarea' },
      { key: 'isFeatured', label: 'Featured on homepage', type: 'checkbox' },
    ],
    api: { list: coursesApi.getAllCourses, create: coursesApi.createCourse, update: coursesApi.updateCourse },
    statusToggle: { key: 'courseIsActive', run: (item, next) => coursesApi.updateCourseStatus(item.courseId, next) },
    canDelete: false, // backend has no delete endpoint for courses, only the status toggle
    toForm: (c) => ({ ...c }),
    toPayload: (f) => ({ ...f, courseDuration: f.courseDuration ? Number(f.courseDuration) : null, courseFees: f.courseFees ? Number(f.courseFees) : null }),
    emptyForm: { courseName: '', courseCategory: '', ageGrpType: '', courseDuration: '', courseFees: '', courseFeesFrom: '', courseFeesTo: '', coverPhoto: '', courseDescription: '', courseSyllabus: '', isFeatured: false },
  };
}

function batchesConfig(courses) {
  const courseOptions = courses.map((c) => ({ value: c.courseId, label: c.courseName }));
  return {
    idKey: 'batchId',
    title: 'Batches',
    singular: 'Batch',
    searchKeys: ['batchName', 'courseName'],
    columns: [
      { key: 'batchName', label: 'Batch' },
      { key: 'courseName', label: 'Course' },
      { key: 'batchStartTime', label: 'Start' },
      { key: 'batchEndTime', label: 'End' },
      { key: 'batchIsActive', label: 'Status' },
    ],
    fields: [
      { key: 'batchName', label: 'Batch name', type: 'text', required: true },
      { key: 'courseId', label: 'Course', type: 'select', required: true, options: courseOptions },
      { key: 'batchStartTime', label: 'Start time', type: 'time' },
      { key: 'batchEndTime', label: 'End time', type: 'time' },
    ],
    api: { list: coursesApi.getAllBatches, create: coursesApi.createBatch, update: coursesApi.updateBatch },
    statusToggle: { key: 'batchIsActive', run: (item, next) => coursesApi.updateBatchStatus(item.batchId, next) },
    canDelete: false,
    toForm: (b) => ({ ...b, courseId: b.courseId }),
    toPayload: (f) => ({ ...f, courseId: Number(f.courseId) }),
    emptyForm: { batchName: '', courseId: '', batchStartTime: '', batchEndTime: '' },
  };
}

function staffConfig() {
  return {
    idKey: 'staffId',
    title: 'Staff',
    singular: 'Staff member',
    searchKeys: ['staffName', 'staffRole', 'staffEmail'],
    columns: [
      { key: 'staffName', label: 'Name' },
      { key: 'staffRole', label: 'Role' },
      { key: 'staffMobile', label: 'Mobile' },
      { key: 'staffEmail', label: 'Email' },
    ],
    fields: [
      { key: 'staffName', label: 'Full name', type: 'text', required: true },
      { key: 'staffRole', label: 'Role / designation', type: 'text' },
      { key: 'staffMobile', label: 'Mobile', type: 'text' },
      { key: 'staffEmail', label: 'Email', type: 'text' },
      { key: 'photoUrl', label: 'Photo URL', type: 'text' },
      { key: 'description', label: 'Bio / description', type: 'textarea' },
      { key: 'staffUsername', label: 'Login username', type: 'text', required: true },
      { key: 'staffPassword', label: 'Password (leave blank to keep unchanged)', type: 'password' },
    ],
    api: { list: staffApi.getAllStaff, create: staffApi.createStaff, update: staffApi.updateStaff, remove: staffApi.deleteStaff },
    toForm: (s) => ({ ...s, staffPassword: '' }),
    toPayload: (f) => {
      const { staffPassword, ...rest } = f;
      return staffPassword ? { ...rest, staffPassword } : rest;
    },
    emptyForm: { staffName: '', staffRole: '', staffMobile: '', staffEmail: '', photoUrl: '', description: '', staffUsername: '', staffPassword: '' },
  };
}

function recruitersConfig() {
  return {
    idKey: 'recruiterId',
    title: 'Recruiters',
    singular: 'Recruiter',
    searchKeys: ['recruiterName'],
    columns: [
      { key: 'recruiterName', label: 'Recruiter' },
      { key: 'description', label: 'Notes' },
    ],
    fields: [
      { key: 'recruiterName', label: 'Recruiter name', type: 'text', required: true },
      { key: 'photoUrl', label: 'Logo URL', type: 'text' },
      { key: 'description', label: 'Notes', type: 'textarea' },
    ],
    api: { list: contentApi.getAllRecruiters, create: contentApi.createRecruiter, update: contentApi.updateRecruiter, remove: contentApi.deleteRecruiter },
    toForm: (r) => ({ ...r }),
    toPayload: (f) => f,
    emptyForm: { recruiterName: '', photoUrl: '', description: '' },
  };
}

function albumsConfig() {
  return {
    idKey: 'albumId',
    title: 'Albums',
    singular: 'Album',
    searchKeys: ['albumName'],
    columns: [
      { key: 'albumName', label: 'Album' },
      { key: 'startDate', label: 'Start' },
      { key: 'endDate', label: 'End' },
      { key: 'albumIsActive', label: 'Status' },
    ],
    fields: [
      { key: 'albumName', label: 'Album name', type: 'text', required: true },
      { key: 'albumDescription', label: 'Description', type: 'textarea' },
      { key: 'startDate', label: 'Start date', type: 'date', required: true },
      { key: 'endDate', label: 'End date', type: 'date', required: true },
      { key: 'albumIsActive', label: 'Active (shown on public site)', type: 'checkbox' },
    ],
    api: { list: contentApi.getAllAlbums, create: contentApi.createAlbum, update: contentApi.updateAlbum, remove: contentApi.deleteAlbum },
    toForm: (a) => ({
      ...a,
      startDate: a.startDate ? a.startDate.slice(0, 10) : '',
      endDate: a.endDate ? a.endDate.slice(0, 10) : '',
    }),
    toPayload: (f) => ({
      ...f,
      startDate: f.startDate ? `${f.startDate.slice(0, 10)}T00:00:00` : null,
      endDate: f.endDate ? `${f.endDate.slice(0, 10)}T00:00:00` : null,
    }),
    emptyForm: { albumName: '', albumDescription: '', startDate: '', endDate: '', albumIsActive: true },
  };
}

function imagesConfig(albums) {
  const albumOptions = albums.map((a) => ({ value: a.albumId, label: a.albumName }));
  const albumName = (id) => albums.find((a) => a.albumId === id)?.albumName || '—';
  return {
    idKey: 'imageId',
    title: 'Images',
    singular: 'Image',
    searchKeys: ['imagePath'],
    columns: [
      { key: 'imagePath', label: 'Image URL', render: (i) => <span className="mono" style={{ fontSize: 'var(--text-xs)' }}>{i.imagePath?.slice(0, 40)}</span> },
      { key: 'albumId', label: 'Album', render: (i) => albumName(i.albumId) },
      { key: 'isAlbumCover', label: 'Cover' },
      { key: 'imageIsActive', label: 'Status' },
    ],
    fields: [
      { key: 'imagePath', label: 'Image URL', type: 'text', required: true },
      { key: 'albumId', label: 'Album', type: 'select', required: true, options: albumOptions },
      { key: 'isAlbumCover', label: 'Use as album cover', type: 'checkbox' },
      { key: 'imageIsActive', label: 'Active (shown on public site)', type: 'checkbox' },
    ],
    api: { list: contentApi.getAllImages, create: contentApi.createImage, update: contentApi.updateImage, remove: contentApi.deleteImage },
    toForm: (i) => ({ ...i }),
    toPayload: (f) => ({ ...f, albumId: Number(f.albumId) }),
    emptyForm: { imagePath: '', albumId: '', isAlbumCover: false, imageIsActive: true },
  };
}

function announcementsConfig() {
  return {
    idKey: 'announcementId',
    title: 'Announcements',
    singular: 'Announcement',
    searchKeys: ['title'],
    columns: [
      { key: 'title', label: 'Title' },
      { key: 'publishDate', label: 'Publish' },
      { key: 'expiryDate', label: 'Expires' },
    ],
    fields: [
      { key: 'title', label: 'Title', type: 'text', required: true },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'publishDate', label: 'Publish date', type: 'date' },
      { key: 'expiryDate', label: 'Expiry date', type: 'date' },
    ],
    api: { list: contentApi.getAllAnnouncements, create: contentApi.createAnnouncement, update: contentApi.updateAnnouncement, remove: contentApi.deleteAnnouncement },
    toForm: (a) => ({ ...a }),
    toPayload: (f) => f,
    emptyForm: { title: '', description: '', publishDate: '', expiryDate: '' },
  };
}

function closureReasonsConfig() {
  return {
    idKey: 'closureReasonId',
    title: 'Closure Reasons',
    singular: 'Closure reason',
    searchKeys: ['closureReasonDesc'],
    columns: [{ key: 'closureReasonDesc', label: 'Reason' }],
    fields: [{ key: 'closureReasonDesc', label: 'Reason', type: 'text', required: true }],
    api: { list: enquiriesApi.getAllClosureReasons, create: enquiriesApi.createClosureReason, remove: enquiriesApi.deleteClosureReason },
    canUpdate: false, // no PUT endpoint on the backend for this resource
    toForm: (r) => ({ ...r }),
    toPayload: (f) => f,
    emptyForm: { closureReasonDesc: '' },
  };
}
