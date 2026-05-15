import React, { useEffect, useRef, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

const CertificateScanner = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const scanTimerRef = useRef(null);
  const streamRef = useRef(null);
  const [manualCode, setManualCode] = useState('');
  const [studentIdInput, setStudentIdInput] = useState('');
  const [studentCertificates, setStudentCertificates] = useState([]);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [searchingStudent, setSearchingStudent] = useState(false);
  const [result, setResult] = useState(null);
  const [cameraSupported] = useState(() => Boolean(window.BarcodeDetector));

  useEffect(() => {
    return () => stopCamera();
  }, []);

  const stopCamera = () => {
    if (scanTimerRef.current) {
      window.clearInterval(scanTimerRef.current);
      scanTimerRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    setScanning(false);
  };

  const verifyCode = async (code) => {
    const scannedCode = String(code || '').trim();
    if (!scannedCode) {
      toast.error('Please enter or scan a QR code');
      return;
    }

    setVerifying(true);
    try {
      const response = await api.post('/admin/certificates/verify', { code: scannedCode });
      setResult(response.data);
      toast.success('Certificate verified');
      stopCamera();
    } catch (error) {
      setResult({
        valid: false,
        message: error.response?.data?.message || 'Certificate verification failed'
      });
      toast.error(error.response?.data?.message || 'Certificate verification failed');
    } finally {
      setVerifying(false);
    }
  };

  const startCamera = async () => {
    if (!window.BarcodeDetector) {
      toast.error('Camera QR scanning is not supported in this browser. Use manual verification.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setScanning(true);

      const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
      scanTimerRef.current = window.setInterval(async () => {
        if (!videoRef.current || !canvasRef.current || verifying) return;

        const video = videoRef.current;
        if (!video.videoWidth || !video.videoHeight) return;

        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);

        try {
          const codes = await detector.detect(canvas);
          if (codes.length > 0) {
            verifyCode(codes[0].rawValue);
          }
        } catch (error) {
          stopCamera();
          toast.error('Unable to scan from camera. Use manual verification.');
        }
      }, 800);
    } catch (error) {
      toast.error('Camera permission denied or unavailable');
      stopCamera();
    }
  };

  const fetchStudentCertificates = async () => {
    if (!studentIdInput.trim()) {
      toast.error('Enter a Student ID');
      return;
    }

    setSearchingStudent(true);
    try {
      const response = await api.get(`/admin/student-profile/${studentIdInput.trim()}`);
      setStudentCertificates(response.data.certificates || []);
      toast.success('Student certificates loaded');
    } catch (error) {
      setStudentCertificates([]);
      toast.error(error.response?.data?.message || 'Failed to fetch certificates');
    } finally {
      setSearchingStudent(false);
    }
  };

  const certificate = result?.certificate;
  const student = certificate?.student;
  const issuedBy = certificate?.issuedBy;

  return (
    <div className="-m-6 min-h-screen bg-[#edf0f7] pb-10">
      <h1 className="mb-6 bg-[#D9D9D9] p-3 text-center text-4xl font-semibold text-[#3a53a5]">
        VERIFY CERTIFICATE
      </h1>

      <div className="mx-6 grid grid-cols-1 gap-8 lg:mx-9 xl:grid-cols-2">
        <section className="rounded-2xl bg-white p-6 shadow-lg">
          <div className="mb-5">
            <h2 className="text-xl font-semibold text-gray-900">QR Scanner</h2>
            <p className="text-sm text-gray-500">Scan a certificate QR code or paste its QR data below.</p>
          </div>

          <div className="overflow-hidden bg-[#edf0f7]">
            <video ref={videoRef} className="aspect-video w-full bg-gray-900 object-cover" muted playsInline />
            <canvas ref={canvasRef} className="hidden" />
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={scanning ? stopCamera : startCamera}
              disabled={!cameraSupported}
              className="h-11 flex-1 bg-[#3a53a5] px-4 text-sm font-semibold text-white transition hover:bg-[#2a3a85] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {scanning ? 'Stop Camera' : 'Start Camera Scan'}
            </button>
            <button
              type="button"
              onClick={() => {
                setManualCode('');
                setResult(null);
              }}
              className="h-11 flex-1 border border-gray-300 px-4 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              Clear
            </button>
          </div>

          {!cameraSupported && (
            <p className="mt-3 text-sm text-yellow-700">
              Your browser does not support built-in camera QR detection. Manual verification is available below.
            </p>
          )}

          <form
            className="mt-6 space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              verifyCode(manualCode);
            }}
          >
            <label className="block text-sm font-semibold text-gray-700">Manual QR Data</label>
            <textarea
              value={manualCode}
              onChange={(event) => setManualCode(event.target.value)}
              className="min-h-28 w-full border border-gray-300 p-3 text-sm outline-none focus:border-[#3a53a5]"
              placeholder="Paste scanned QR data, certificate ID, or certificate QR value"
            />
            <button
              type="submit"
              disabled={verifying}
              className="h-11 w-full bg-[#3a53a5] px-4 text-sm font-semibold text-white transition hover:bg-[#2a3a85] disabled:opacity-50"
            >
              {verifying ? 'Verifying...' : 'Verify Certificate'}
            </button>
          </form>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-lg">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Certificate Info</h2>
              <p className="text-sm text-gray-500">Verification result appears here.</p>
            </div>
            <span className={`px-4 py-2 text-sm font-semibold ${
              result?.valid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {result ? (result.valid ? 'VALID' : 'INVALID') : 'WAITING'}
            </span>
          </div>

          {!result ? (
            <div className="border-l-4 border-[#3a53a5] bg-[#edf0f7] p-5 text-sm text-gray-600">
              Start camera scanning or paste QR data to verify a certificate.
            </div>
          ) : !result.valid ? (
            <div className="border-l-4 border-red-500 bg-red-50 p-5 text-sm text-red-700">
              {result.message || 'Certificate could not be verified.'}
            </div>
          ) : (
            <div className="space-y-4">
              {[
                ['Student Name', student?.fullName],
                ['Student ID', student?.studentId],
                ['Email', student?.email],
                ['Event', certificate?.eventName],
                ['Event Date', certificate?.eventDate ? new Date(certificate.eventDate).toLocaleDateString() : ''],
                ['Status', certificate?.status],
                ['Issued By', issuedBy?.fullName],
                ['Issued On', certificate?.createdAt ? new Date(certificate.createdAt).toLocaleString() : '']
              ].map(([label, value]) => (
                <div key={label} className="border-l-4 border-[#3a53a5] bg-[#edf0f7] p-4">
                  <p className="text-xs font-semibold uppercase text-gray-500">{label}</p>
                  <p className="mt-1 font-semibold text-gray-900">{value || '-'}</p>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 rounded-lg bg-slate-100 p-4 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900">Search by Student ID</h2>
            <div className="mt-3">
              <input
                type="text"
                placeholder="Enter Student ID"
                value={studentIdInput}
                onChange={(event) => setStudentIdInput(event.target.value)}
                className="w-full border p-2"
              />
              <button
                onClick={fetchStudentCertificates}
                disabled={searchingStudent}
                className="mt-2 w-full bg-[#3a53a5] p-2 text-sm font-semibold text-white hover:bg-[#2a3a85] disabled:opacity-50"
              >
                {searchingStudent ? 'Searching...' : 'Search'}
              </button>
            </div>

            <div className="mt-5">
              <h3 className="mb-4 text-lg font-semibold">CERTIFICATES ({studentCertificates.length})</h3>
              <div className="flex gap-4 overflow-x-auto">
                {studentCertificates.map((cert) => (
                  <div key={cert.certificateId} className="w-32 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => setSelectedCertificate(cert)}
                      className="flex h-32 w-32 items-center justify-center rounded-lg bg-gray-300 text-6xl text-[#3a53a5]"
                    >
                      <svg className="h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0119 9.414V19a2 2 0 01-2 2z" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedCertificate(cert)}
                      className="mt-2 w-32 text-center text-xs text-[#3a53a5] hover:underline"
                    >
                      {cert.certificateId}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>

      {selectedCertificate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md bg-white p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-gray-900">{selectedCertificate.eventName || 'Certificate'}</h2>
            <div className="mt-4 space-y-3 text-sm">
              <p><strong>ID:</strong> {selectedCertificate.certificateId}</p>
              <p><strong>Date Generated:</strong> {selectedCertificate.DateGenerated ? new Date(selectedCertificate.DateGenerated).toLocaleDateString() : '-'}</p>
              <p><strong>Created By:</strong> {selectedCertificate.CreatedBy || '-'}</p>
              <p><strong>Status:</strong> {selectedCertificate.status || '-'}</p>
            </div>
            <div className="mt-5 text-right">
              <button onClick={() => setSelectedCertificate(null)} className="bg-[#3a53a5] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2a3a85]">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CertificateScanner;
