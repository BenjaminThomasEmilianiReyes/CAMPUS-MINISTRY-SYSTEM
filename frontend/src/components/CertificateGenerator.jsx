import React, { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

const collegeDepartments = {
  Agriculture: ['Agriculture'],
  ArtsScience: ['Arts and Science', 'Psychology', 'Communication'],
  BusinessManagement: ['Business Management'],
  ComputerStudies: ['Computer Studies'],
  Education: ['Education'],
  Engineering: ['Engineering'],
  Nursing: ['Nursing']
};

const majors = ['BSIT', 'BSCS', 'BSIS', 'AB Communication', 'Nursing', 'Engineering', 'Education', 'Agriculture', 'Business Management'];

const emptyStudent = {
  studentId: '',
  firstName: '',
  lastName: '',
  college: '',
  department: '',
  major: '',
  yearStanding: '',
  email: ''
};

const parseCsv = (text) => {
  const [headerLine, ...lines] = text.split(/\r?\n/).filter(Boolean);
  if (!headerLine) return [];
  const headers = headerLine.split(',').map((header) => header.trim());

  return lines.map((line) => {
    const values = line.split(',').map((value) => value.trim());
    return headers.reduce((row, header, index) => ({ ...row, [header]: values[index] || '' }), {});
  });
};

const CertificateGenerator = () => {
  const [mode, setMode] = useState('generate');
  const [students, setStudents] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [stagedStudents, setStagedStudents] = useState([]);
  const [mailData, setMailData] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [studentForm, setStudentForm] = useState(emptyStudent);
  const [csvFileName, setCsvFileName] = useState('');
  const [generating, setGenerating] = useState(false);

  const fetchData = async () => {
    const [studentResponse, templateResponse] = await Promise.all([
      api.get('/admin/students'),
      api.get('/admin/certificate-templates')
    ]);
    setStudents(studentResponse.data || []);
    setTemplates(templateResponse.data || []);
  };

  useEffect(() => {
    fetchData().catch(() => toast.error('Failed to load certificate data'));
  }, []);

  const selectedTemplate = useMemo(
    () => templates.find((template) => template._id === selectedTemplateId),
    [templates, selectedTemplateId]
  );

  const resetContext = () => {
    setMode('generate');
    setStagedStudents([]);
    setMailData([]);
    setSelectedTemplateId('');
    setStudentForm(emptyStudent);
    setCsvFileName('');
  };

  const validateStudent = (student) => {
    if (!student.studentId || !student.firstName || !student.lastName || !student.college || !student.department || !student.major || !student.yearStanding || !student.email) {
      toast.error('Please fill out all student fields');
      return false;
    }
    if (!/^\d+$/.test(student.studentId)) {
      toast.error('Student ID must contain only numbers');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(student.email)) {
      toast.error('Please enter a valid email address');
      return false;
    }
    return true;
  };

  const handleUploadSolo = () => {
    if (!validateStudent(studentForm)) return;
    setStagedStudents([{ ...studentForm, id: studentForm.studentId }]);
    toast.success('Upload successful');
  };

  const handleCsvUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setCsvFileName(file.name);

    const text = await file.text();
    const rows = parseCsv(text).map((row) => ({
      id: row.studentId || row.StudentID || row['Student ID'],
      studentId: row.studentId || row.StudentID || row['Student ID'] || '',
      firstName: row.firstName || row.FirstName || row['First Name'] || '',
      lastName: row.lastName || row.LastName || row['Last Name'] || '',
      college: row.college || row.College || '',
      department: row.department || row.Department || '',
      major: row.major || row.Major || '',
      yearStanding: row.yearStanding || row.YearStanding || row['Year Standing'] || '',
      email: row.email || row.Email || ''
    })).filter((row) => row.studentId);

    setStagedStudents(rows);
    toast.success(`${rows.length} student${rows.length === 1 ? '' : 's'} uploaded`);
  };

  const assignCertificateIds = () => {
    if (stagedStudents.length === 0) {
      toast.error('Upload student data first');
      return;
    }

    setMailData(stagedStudents.map((student) => ({
      ...student,
      certificateId: `CERT-${student.studentId}-${Date.now()}`
    })));
    setMode('mail');
    toast.success('Certificates have been assigned successfully');
  };

  const findOrCreateStudent = async (student) => {
    const existing = students.find((item) => item.studentId === student.studentId);
    if (existing) return existing;

    const response = await api.post('/admin/students', student);
    await fetchData();
    return response.data;
  };

  const generateCertificates = async () => {
    if (!selectedTemplate) {
      toast.error('Please select a certificate template');
      return;
    }

    setGenerating(true);
    try {
      const eventName = selectedTemplate.certEventType || selectedTemplate.templateTitle;
      const eventDate = selectedTemplate.certEventDate || new Date().toISOString().slice(0, 10);

      for (const student of mailData) {
        const savedStudent = await findOrCreateStudent(student);
        await api.post('/admin/certificates', {
          studentId: savedStudent._id,
          eventName,
          eventDate
        });
      }

      toast.success('Certificates generated. Emails will be sent out shortly.');
      resetContext();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to generate certificates');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="-m-6 min-h-screen bg-[#edf0f7] pb-10">
      <h1 className="mb-6 bg-[#D9D9D9] p-3 text-center text-4xl font-semibold text-[#3a53a5]">
        GENERATE CERTIFICATE
      </h1>

      <div className="mx-auto max-w-5xl px-6">
        <section className="rounded-lg bg-white p-8 shadow-lg">
          {mode === 'generate' && (
            <>
              <h2 className="mb-10 text-center text-2xl font-semibold">GENERATION MODE</h2>
              <div className="flex flex-col items-center justify-center gap-8 md:flex-row">
                <button onClick={() => setMode('solo')} className="flex h-56 w-56 flex-col items-center justify-center rounded-lg bg-[#3a53a5] p-6 text-white shadow-lg hover:bg-[#2a3a85]">
                  <svg className="mb-4 h-14 w-14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15.75 7.5a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 20.25a7.5 7.5 0 0115 0" />
                  </svg>
                  <span className="text-xl font-semibold">SOLO</span>
                </button>
                <span className="text-xl text-gray-600">OR</span>
                <button onClick={() => setMode('batch')} className="flex h-56 w-56 flex-col items-center justify-center rounded-lg bg-[#3a53a5] p-6 text-white shadow-lg hover:bg-[#2a3a85]">
                  <svg className="mb-4 h-14 w-14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20.25a5.25 5.25 0 00-10.5 0M12 12.75a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5zM20.25 19.5a4.5 4.5 0 00-3.75-4.43M3.75 19.5a4.5 4.5 0 013.75-4.43" />
                  </svg>
                  <span className="text-xl font-semibold">BATCH</span>
                </button>
              </div>
            </>
          )}

          {mode === 'solo' && (
            <>
              <div className="mb-4 flex items-center">
                <button onClick={resetContext} className="text-[#3a53a5] hover:underline">Back</button>
                <h2 className="flex-grow text-center text-2xl font-semibold">SOLO GENERATION</h2>
              </div>
              <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
                <input placeholder="STUDENT ID NO." value={studentForm.studentId} onChange={(event) => setStudentForm({ ...studentForm, studentId: event.target.value })} className="rounded-lg border-2 p-3" />
                <input placeholder="FIRST NAME" value={studentForm.firstName} onChange={(event) => setStudentForm({ ...studentForm, firstName: event.target.value })} className="rounded-lg border-2 p-3" />
                <input placeholder="LAST NAME" value={studentForm.lastName} onChange={(event) => setStudentForm({ ...studentForm, lastName: event.target.value })} className="rounded-lg border-2 p-3" />
                <select value={studentForm.college} onChange={(event) => setStudentForm({ ...studentForm, college: event.target.value, department: '' })} className="rounded-lg border-2 p-3">
                  <option value="">Select College</option>
                  {Object.keys(collegeDepartments).map((college) => <option key={college} value={college}>{college.replace(/([A-Z])/g, ' $1').trim()}</option>)}
                </select>
                <select value={studentForm.department} onChange={(event) => setStudentForm({ ...studentForm, department: event.target.value })} className="rounded-lg border-2 p-3" disabled={!studentForm.college}>
                  <option value="">Select Department</option>
                  {(collegeDepartments[studentForm.college] || []).map((department) => <option key={department} value={department}>{department}</option>)}
                </select>
                <select value={studentForm.major} onChange={(event) => setStudentForm({ ...studentForm, major: event.target.value })} className="rounded-lg border-2 p-3">
                  <option value="">Select Major</option>
                  {majors.map((major) => <option key={major} value={major}>{major}</option>)}
                </select>
                <select value={studentForm.yearStanding} onChange={(event) => setStudentForm({ ...studentForm, yearStanding: event.target.value })} className="rounded-lg border-2 p-3">
                  <option value="">Select Year Level</option>
                  <option value="1">1st</option>
                  <option value="2">2nd</option>
                  <option value="3">3rd</option>
                  <option value="4">4th</option>
                </select>
                <input placeholder="XU EMAIL" value={studentForm.email} onChange={(event) => setStudentForm({ ...studentForm, email: event.target.value })} className="rounded-lg border-2 p-3 md:col-span-2" />
              </div>
              <button onClick={handleUploadSolo} disabled={stagedStudents.length > 0} className="rounded-lg bg-[#3a53a5] px-4 py-2 font-semibold text-white hover:bg-[#2a3a85] disabled:opacity-50">Upload</button>
              <StudentPreview rows={stagedStudents} />
              <div className="text-right">
                <button onClick={assignCertificateIds} disabled={stagedStudents.length === 0} className="rounded bg-green-600 px-4 py-2 font-semibold text-white hover:bg-green-700 disabled:opacity-50">Assign Certificate IDs</button>
              </div>
            </>
          )}

          {mode === 'batch' && (
            <>
              <div className="mb-4 flex items-center">
                <button onClick={resetContext} className="text-[#3a53a5] hover:underline">Back</button>
                <h2 className="flex-grow text-center text-2xl font-semibold">BATCH GENERATION</h2>
              </div>
              <label className="mb-2 block text-sm font-bold text-gray-700">Please upload CSV file</label>
              <input type="file" accept=".csv,text/csv" onChange={handleCsvUpload} className="rounded border px-3 py-2" />
              {csvFileName && <p className="mt-2 text-sm text-gray-500">{csvFileName}</p>}
              <div className="mt-4 flex gap-3">
                <button onClick={() => document.querySelector('input[type=file]')?.click()} className="rounded bg-[#3a53a5] px-4 py-2 font-semibold text-white hover:bg-[#2a3a85]">Upload</button>
                <button onClick={assignCertificateIds} disabled={stagedStudents.length === 0} className="rounded bg-green-600 px-4 py-2 font-semibold text-white hover:bg-green-700 disabled:opacity-50">Create Certificates</button>
              </div>
              <StudentPreview rows={stagedStudents} />
            </>
          )}

          {mode === 'mail' && (
            <>
              <div className="mb-5 flex items-center justify-between rounded-lg bg-white p-5 shadow-sm ring-1 ring-gray-100">
                <input value={selectedTemplateId} readOnly placeholder="Selected Template ID" className="h-11 flex-1 border px-3" />
                <button onClick={() => setTemplateModalOpen(true)} className="ml-4 rounded bg-[#3a53a5] px-4 py-2 font-semibold text-white hover:bg-[#2a3a85]">Select Template</button>
              </div>
              <StudentPreview rows={mailData} showCertificate />
              <div className="mt-5 text-right">
                <button onClick={generateCertificates} disabled={generating || !selectedTemplateId} className="rounded bg-[#3a53a5] px-4 py-2 font-semibold text-white hover:bg-[#2a3a85] disabled:opacity-50">
                  {generating ? 'Generating...' : 'Generate Certificates'}
                </button>
              </div>
            </>
          )}
        </section>
      </div>

      {templateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="max-h-[80vh] w-full max-w-4xl overflow-y-auto bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Select Template</h2>
              <button onClick={() => setTemplateModalOpen(false)} className="text-sm font-semibold text-red-600">Close</button>
            </div>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              {templates.map((template) => (
                <button
                  key={template._id}
                  onClick={() => {
                    setSelectedTemplateId(template._id);
                    setTemplateModalOpen(false);
                  }}
                  className="relative min-h-40 rounded-md border border-[#3a53a5] bg-white p-8 text-center hover:bg-blue-50"
                  style={template.certBgImgKey ? { backgroundImage: `url(${template.certBgImgKey})`, backgroundSize: 'cover' } : undefined}
                >
                  <span className="absolute inset-0 bg-white/60" />
                  <span className="relative font-bold text-gray-900">{template.templateTitle}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StudentPreview = ({ rows, showCertificate = false }) => (
  <div className="my-4 overflow-x-auto">
    <table className="min-w-full divide-y divide-gray-200 border">
      <thead className="bg-gray-50">
        <tr>
          {(showCertificate ? ['Certificate ID', 'Student ID', 'First Name', 'Last Name', 'Email'] : ['Student ID', 'First Name', 'Last Name', 'Email']).map((heading) => (
            <th key={heading} className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">{heading}</th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200 bg-white">
        {rows.map((student) => (
          <tr key={student.certificateId || student.id || student.studentId}>
            {showCertificate && <td className="px-4 py-3 text-sm font-mono">{student.certificateId}</td>}
            <td className="px-4 py-3 text-sm">{student.studentId}</td>
            <td className="px-4 py-3 text-sm">{student.firstName}</td>
            <td className="px-4 py-3 text-sm">{student.lastName}</td>
            <td className="px-4 py-3 text-sm">{student.email}</td>
          </tr>
        ))}
      </tbody>
    </table>
    {rows.length === 0 && <div className="border border-t-0 py-10 text-center text-gray-500">No uploaded students yet.</div>}
  </div>
);

export default CertificateGenerator;
