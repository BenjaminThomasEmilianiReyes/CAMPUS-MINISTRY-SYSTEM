import React, { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

const emptyTemplate = {
  templateTitle: '',
  certBgImgKey: '',
  certEventYearLevel: '',
  certEventType: '',
  certEventTheme: '',
  certEventDate: '',
  certEventVenue: '',
  certDirectorName: '',
  certSigImgKey: ''
};

const eventTypes = ['Onsite event', 'Online event', 'Onsite Recollection', 'Online Recollection', 'Onsite Retreat', 'Online Retreat'];

const CertificateTemplates = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState({ open: false, mode: 'add', template: null });
  const [formData, setFormData] = useState(emptyTemplate);

  const fetchTemplates = async () => {
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.append('keyword', search.trim());
      const response = await api.get(`/admin/certificate-templates?${params.toString()}`);
      setTemplates(response.data || []);
    } catch (error) {
      toast.error('Failed to load certificate templates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const filteredTemplates = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return templates;
    return templates.filter((template) =>
      [template.templateTitle, template.certEventType, template.certEventTheme].some((value) =>
        String(value || '').toLowerCase().includes(keyword)
      )
    );
  }, [templates, search]);

  const openAdd = () => {
    setFormData(emptyTemplate);
    setModal({ open: true, mode: 'add', template: null });
  };

  const openEdit = (template) => {
    setFormData({
      templateTitle: template.templateTitle || '',
      certBgImgKey: template.certBgImgKey || '',
      certEventYearLevel: template.certEventYearLevel || '',
      certEventType: template.certEventType || '',
      certEventTheme: template.certEventTheme || '',
      certEventDate: template.certEventDate || '',
      certEventVenue: template.certEventVenue || '',
      certDirectorName: template.certDirectorName || '',
      certSigImgKey: template.certSigImgKey || ''
    });
    setModal({ open: true, mode: 'edit', template });
  };

  const closeModal = () => {
    setFormData(emptyTemplate);
    setModal({ open: false, mode: 'add', template: null });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const required = ['templateTitle', 'certEventYearLevel', 'certEventType', 'certEventTheme', 'certEventDate', 'certEventVenue', 'certDirectorName'];
    if (required.some((field) => !formData[field])) {
      toast.error('Please fill in all required template fields');
      return;
    }

    setSaving(true);
    try {
      if (modal.mode === 'edit' && modal.template?._id) {
        await api.put(`/admin/certificate-templates/${modal.template._id}`, formData);
        toast.success('Template updated successfully');
      } else {
        await api.post('/admin/certificate-templates', formData);
        toast.success('Template created successfully');
      }
      closeModal();
      fetchTemplates();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (templateId) => {
    if (!window.confirm('Delete this template? This cannot be undone.')) return;
    try {
      await api.delete(`/admin/certificate-templates/${templateId}`);
      toast.success('Template deleted successfully');
      fetchTemplates();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete template');
    }
  };

  if (loading) {
    return (
      <div className="-m-6 flex min-h-screen items-center justify-center bg-[#edf0f7]">
        <div className="h-24 w-24 animate-spin rounded-full border-b-2 border-[#3a53a5]" />
      </div>
    );
  }

  return (
    <div className="-m-6 min-h-screen bg-[#edf0f7] pb-10">
      <h1 className="mb-6 bg-[#D9D9D9] p-3 text-center text-4xl font-semibold text-[#3a53a5]">
        CERTIFICATE TEMPLATES
      </h1>

      <div className="mx-6 space-y-8 lg:mx-9">
        <section className="overflow-hidden rounded-2xl bg-white shadow-lg">
          <div className="flex flex-col justify-between gap-4 border-b px-6 py-4 lg:flex-row lg:items-center">
            <button onClick={openAdd} className="bg-[#3a53a5] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2a3a85]">
              Add Template
            </button>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search" className="h-10 w-full border border-gray-300 px-3 text-sm outline-none focus:border-[#3a53a5] sm:w-64" />
          </div>

          <div className="grid grid-cols-1 gap-5 bg-[#D9D9D9] p-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredTemplates.map((template) => (
              <div key={template._id} className="relative min-h-44 rounded-md border border-[#3a53a5] bg-white p-6 shadow">
                <div className="absolute right-3 top-3 flex gap-3">
                  <button onClick={() => openEdit(template)} className="text-sm font-semibold text-[#3a53a5] hover:underline">Edit</button>
                  <button onClick={() => handleDelete(template._id)} className="text-sm font-semibold text-red-600 hover:underline">Delete</button>
                </div>
                <h2 className="mt-8 text-lg font-bold text-gray-900">{template.templateTitle}</h2>
                <p className="mt-2 text-sm text-gray-600">{template.certEventType}</p>
                <p className="text-sm text-gray-600">{template.certEventTheme}</p>
                <p className="mt-3 text-xs font-semibold uppercase text-[#3a53a5]">{template.certEventDate}</p>
              </div>
            ))}
            {filteredTemplates.length === 0 && <div className="col-span-full py-10 text-center text-gray-600">No certificate templates found.</div>}
          </div>
        </section>
      </div>

      {modal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto bg-white p-6 shadow-2xl">
            <h2 className="mb-4 text-xl font-bold text-gray-900">{modal.mode === 'edit' ? 'Edit Template' : 'Add Template'}</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input value={formData.templateTitle} onChange={(event) => setFormData({ ...formData, templateTitle: event.target.value })} placeholder="Template Title" className="h-10 w-full border px-3" />
              <input value={formData.certBgImgKey} onChange={(event) => setFormData({ ...formData, certBgImgKey: event.target.value })} placeholder="Certificate Background Image URL" className="h-10 w-full border px-3" />
              <select value={formData.certEventYearLevel} onChange={(event) => setFormData({ ...formData, certEventYearLevel: event.target.value })} className="h-10 w-full border px-3">
                <option value="">Select Year Level</option>
                <option value="1st">1st</option>
                <option value="2nd">2nd</option>
                <option value="3rd">3rd</option>
                <option value="4th">4th</option>
              </select>
              <select value={formData.certEventType} onChange={(event) => setFormData({ ...formData, certEventType: event.target.value })} className="h-10 w-full border px-3">
                <option value="">Select Event Type</option>
                {eventTypes.map((type) => <option key={type} value={type}>{type}</option>)}
              </select>
              <input value={formData.certEventTheme} onChange={(event) => setFormData({ ...formData, certEventTheme: event.target.value })} placeholder="Event Theme" className="h-10 w-full border px-3" />
              <input value={formData.certEventDate} onChange={(event) => setFormData({ ...formData, certEventDate: event.target.value })} placeholder="Event Date or Range" className="h-10 w-full border px-3" />
              <input value={formData.certEventVenue} onChange={(event) => setFormData({ ...formData, certEventVenue: event.target.value })} placeholder="Event Venue" className="h-10 w-full border px-3" />
              <input value={formData.certDirectorName} onChange={(event) => setFormData({ ...formData, certDirectorName: event.target.value })} placeholder="Director Name" className="h-10 w-full border px-3" />
              <input value={formData.certSigImgKey} onChange={(event) => setFormData({ ...formData, certSigImgKey: event.target.value })} placeholder="Director Signature Image URL" className="h-10 w-full border px-3" />
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={closeModal} className="bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600">Cancel</button>
                <button type="submit" disabled={saving} className="bg-[#3a53a5] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2a3a85] disabled:opacity-60">
                  {saving ? 'Saving...' : modal.mode === 'edit' ? 'Update Template' : 'Add Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CertificateTemplates;
