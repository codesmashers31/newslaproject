import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import {
  Users,
  UserPlus,
  Search,
  CheckCircle2,
  X,
  Edit3,
  Trash2,
  Clock,
  ChevronDown,
  ChevronUp,
  Upload,
  FileSpreadsheet,
  Filter
} from 'lucide-react';
import * as XLSX from 'xlsx';
import EnterpriseTable from '../../components/common/EnterpriseTable';

const TrainerStudentsPage = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [batches, setBatches] = useState([]);
  const [openDropdownAdd, setOpenDropdownAdd] = useState(null); // 'tech', 'comm', 'apti'
  const [openDropdownEdit, setOpenDropdownEdit] = useState(null); // 'tech', 'comm', 'apti'
  const [techSearchAdd, setTechSearchAdd] = useState('');
  const [commSearchAdd, setCommSearchAdd] = useState('');
  const [aptiSearchAdd, setAptiSearchAdd] = useState('');
  const [techSearchEdit, setTechSearchEdit] = useState('');
  const [commSearchEdit, setCommSearchEdit] = useState('');
  const [aptiSearchEdit, setAptiSearchEdit] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedBatchFilter, setSelectedBatchFilter] = useState('All');
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [excelFile, setExcelFile] = useState(null);
  const [importingExcel, setImportingExcel] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [todayRecords, setTodayRecords] = useState([]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, selectedBatchFilter]);

  // Add Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    slaeId: '',
    name: '',
    email: '',
    mobile: '',
    technicalTrainer: '',
    technicalBatch: '',
    communicationBatch: '',
    aptitudeBatch: '',
    status: 'Active'
  });
  const [submitting, setSubmitting] = useState(false);

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [editFormData, setEditFormData] = useState({
    slaeId: '',
    name: '',
    email: '',
    mobile: '',
    technicalTrainer: '',
    technicalBatch: '',
    communicationBatch: '',
    aptitudeBatch: '',
    status: 'Active'
  });
  const [updating, setUpdating] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const [studentsRes, batchesRes, attendanceRes] = await Promise.all([
        API.get('/trainer/students'),
        API.get('/trainer/batches'),
        API.get(`/trainer/attendance?date=${todayStr}`)
      ]);
      setStudents(studentsRes.data || []);
      setBatches(batchesRes.data || []);
      setTodayRecords(attendanceRes.data || []);
    } catch (error) {
      toast.error('Failed to load students directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const handleCloseDropdowns = () => {
      setOpenDropdownAdd(null);
      setOpenDropdownEdit(null);
    };
    window.addEventListener('click', handleCloseDropdowns);
    return () => window.removeEventListener('click', handleCloseDropdowns);
  }, []);

  const getBatchSchedule = (batchName) => {
    if (!batchName) return '';
    const found = batches.find(b =>
      String(b.name || '').trim().toLowerCase() === String(batchName).trim().toLowerCase() ||
      String(b._id) === String(batchName)
    );
    return found?.schedule || '09:00 AM - 11:00 AM (Mon - Fri)';
  };

  const renderStudentBatchStatus = (student, batchName, trainerField) => {
    const batchId = getBatchIdByName(batchName);
    const record = todayRecords?.find(r => 
      String(r?.student?._id || r?.student) === String(student?._id) &&
      (batchId && String(r?.batch?._id || r?.batch) === String(batchId))
    );

    const schedule = getBatchSchedule(batchName);

    return (
      <div className="space-y-1.5">
        <div>
          <div className="font-extrabold text-slate-800 dark:text-white text-xs">
            {batchName || 'Unassigned'}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Trainer: {student[trainerField] || 'Unassigned'}
          </div>
          {batchName && (
            <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-semibold">
              <Clock size={11} className="text-violet-400" />
              <span>{schedule || '09:00 AM - 11:00 AM (Mon - Fri)'}</span>
            </div>
          )}
        </div>

        {batchId && (
          <div className="flex flex-wrap items-center gap-1.5 mt-1">
            {record ? (
              <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                record.status === 'Present'
                  ? 'bg-emerald-100 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-450 border border-emerald-500/15'
                  : record.status === 'Late'
                  ? 'bg-amber-100 dark:bg-amber-950/20 text-amber-700 dark:text-amber-450 border border-amber-500/15'
                  : 'bg-rose-100 dark:bg-rose-950/20 text-rose-700 dark:text-rose-450 border border-rose-500/15'
              }`}>
                {record.status}
              </span>
            ) : (
              <span className="text-[9px] font-bold text-slate-450 dark:text-slate-500 italic bg-slate-50 dark:bg-slate-900/30 px-1.5 py-0.5 rounded border border-slate-200/50 dark:border-slate-800/50">
                Not Checked In
              </span>
            )}
            
            {record && (
              <span className="text-[9px] text-slate-500 dark:text-slate-400 font-mono font-bold">
                {new Date(record.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            {record?.scannedBatch && (
              <span className="text-[8px] font-black text-indigo-750 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/20 px-1 py-0.5 rounded border border-violet-500/10 uppercase">
                Scanned: {record.scannedBatch.name || record.scannedBatch}
              </span>
            )}
          </div>
        )}
      </div>
    );
  };

  const getBatchIdByName = (batchName) => {
    if (!batchName) return null;
    const b = batches.find(x => x.name.toLowerCase() === batchName.toLowerCase());
    return b ? b._id : null;
  };

  const getDomainBatches = (domainType) => {
    return batches.filter(b => {
      if (domainType === 'Technical') {
        return b.course === 'Technical Training' || (!b.course?.includes('Communication') && !b.course?.includes('Aptitude'));
      }
      if (domainType === 'Communication') {
        return b.course === 'Communication Skills' || b.course?.includes('Communication');
      }
      if (domainType === 'Aptitude') {
        return b.course === 'Aptitude & Reasoning' || b.course?.includes('Aptitude');
      }
      return true;
    });
  };

  // CREATE STUDENT
  const handleCreateStudent = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      toast.error('Student Name and Email are required');
      return;
    }

    setSubmitting(true);
    try {
      await API.post('/trainer/students', formData);
      toast.success('Student added successfully!');
      setShowAddModal(false);
      setFormData({
        slaeId: '',
        name: '',
        email: '',
        mobile: '',
        technicalTrainer: '',
        technicalBatch: '',
        communicationBatch: '',
        aptitudeBatch: '',
        status: 'Active'
      });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add student');
    } finally {
      setSubmitting(false);
    }
  };

  // OPEN EDIT MODAL
  const handleOpenEdit = (student) => {
    setEditingStudent(student);
    setEditFormData({
      slaeId: student.slaeId || '',
      name: student.name || '',
      email: student.email || '',
      mobile: student.mobile || '',
      technicalTrainer: student.technicalTrainer || '',
      technicalBatch: student.technicalBatch || '',
      communicationBatch: student.communicationBatch || '',
      aptitudeBatch: student.aptitudeBatch || '',
      status: student.status || 'Active'
    });
    setShowEditModal(true);
  };

  // UPDATE STUDENT
  const handleUpdateStudent = async (e) => {
    e.preventDefault();
    if (!editingStudent) return;
    if (!editFormData.name.trim() || !editFormData.email.trim()) {
      toast.error('Student Name and Email are required');
      return;
    }

    setUpdating(true);
    try {
      await API.put(`/trainer/students/${editingStudent._id}`, editFormData);
      toast.success('Student updated successfully!');
      setShowEditModal(false);
      setEditingStudent(null);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update student');
    } finally {
      setUpdating(false);
    }
  };

  // DELETE STUDENT
  const handleDeleteStudent = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete student "${name}"?`)) {
      return;
    }

    try {
      await API.delete(`/trainer/students/${id}`);
      toast.success('Student deleted successfully!');
      setStudents(prev => prev.filter(s => s._id !== id));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete student');
    }
  };

  // Trigger Excel Import
  const handleExcelImport = async (e) => {
    e.preventDefault();
    if (!excelFile) {
      toast.error('Please select a file first');
      return;
    }
    const uploadData = new FormData();
    uploadData.append('file', excelFile);

    setImportingExcel(true);
    try {
      const { data } = await API.post('/trainer/students/import', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success(data.message || 'Imported students successfully!');
      setImportModalOpen(false);
      setExcelFile(null);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error importing Excel sheet');
    } finally {
      setImportingExcel(false);
    }
  };

  // Export to Excel client-side
  const exportToExcel = () => {
    if (filteredStudents.length === 0) {
      toast.error('No student data to export');
      return;
    }

    const dataToExport = filteredStudents.map(s => ({
      'SLAEID': s.slaeId || '',
      'Name': s.name || '',
      'Email': s.email || '',
      'Mobile': s.mobile || '',
      'Status': s.status || 'Active',
      'Technical Batch': s.technicalBatch || 'Unassigned',
      'Communication Batch': s.communicationBatch || 'Unassigned',
      'Aptitude Batch': s.aptitudeBatch || 'Unassigned'
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');
    XLSX.writeFile(workbook, 'Students_Report.xlsx');
    toast.success('Excel file downloaded!');
  };

  const downloadTemplate = () => {
    const templateData = [
      {
        'SLAEID': 'SLA001',
        'Name': 'John Doe',
        'Technical Batch ID': 'TECH-001',
        'Communication Batch ID': 'COMM-001',
        'Aptitude Batch ID': 'APTI-001'
      },
      {
        'SLAEID': 'SLA002',
        'Name': '',
        'Technical Batch ID': '',
        'Communication Batch ID': '',
        'Aptitude Batch ID': ''
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');
    XLSX.writeFile(workbook, 'Student_Import_Template.xlsx');
    toast.success('Template downloaded successfully!');
  };

  const studentBelongsToBatchFilter = (student, batchIdOrName) => {
    if (!batchIdOrName || batchIdOrName === 'All') return true;

    const bObj = batches.find(b => String(b._id) === String(batchIdOrName) || b.name === batchIdOrName);
    const targetName = bObj ? bObj.name.trim().toLowerCase() : String(batchIdOrName).trim().toLowerCase();
    const targetId = bObj ? String(bObj._id) : String(batchIdOrName);

    const techName = student.technicalBatch?.trim()?.toLowerCase();
    const commName = student.communicationBatch?.trim()?.toLowerCase();
    const aptiName = student.aptitudeBatch?.trim()?.toLowerCase();
    const legacyName = student.batch?.trim()?.toLowerCase();

    if (techName && (techName.includes(targetName) || targetName.includes(techName))) return true;
    if (commName && (commName.includes(targetName) || targetName.includes(commName))) return true;
    if (aptiName && (aptiName.includes(targetName) || targetName.includes(aptiName))) return true;
    if (legacyName && (legacyName.includes(targetName) || targetName.includes(legacyName))) return true;

    if (Array.isArray(student.batches)) {
      return student.batches.some(b => {
        const bIdStr = String(b?._id || b);
        const bNameStr = (b?.name || String(b)).trim().toLowerCase();
        return bIdStr === targetId || bNameStr === targetName || bNameStr.includes(targetName) || targetName.includes(bNameStr);
      });
    }

    return false;
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch =
      searchQuery === '' ||
      student.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.slaeId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.mobile?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'All' || student.status === statusFilter;

    const matchesBatch =
      selectedBatchFilter === 'All' || studentBelongsToBatchFilter(student, selectedBatchFilter);

    return matchesSearch && matchesStatus && matchesBatch;
  });

  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const paginatedStudents = filteredStudents.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white font-sans">
            Students & Multi-Batch Mapping
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-sans">
            Map students to separate Technical, Communication, and Aptitude batches across different time slots.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-extrabold shadow-md shadow-purple-500/25 transition flex items-center gap-2 cursor-pointer w-fit"
          >
            <UserPlus size={16} />
            <span>Add Student Mapping</span>
          </button>

          <button
            onClick={() => setImportModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold shadow-md shadow-emerald-500/25 transition flex items-center gap-2 cursor-pointer w-fit"
          >
            <Upload size={16} />
            <span>Import Excel</span>
          </button>

          <button
            onClick={exportToExcel}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold shadow-md shadow-blue-500/25 transition flex items-center gap-2 cursor-pointer w-fit"
          >
            <FileSpreadsheet size={16} />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* Main Card with Toolbar & Table */}
      <div className="bg-white dark:bg-[#12131a] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Students Enterprise Table */}
        <div className="p-4 sm:p-6">
          <EnterpriseTable
            title="Enrolled Students Roster"
            data={students}
            loading={loading}
            searchableFields={['name', 'email', 'mobile', 'slaeId', 'technicalBatch.name', 'communicationBatch.name', 'aptitudeBatch.name']}
            filterDefinitions={[
              {
                key: 'status',
                label: 'Status',
                type: 'select',
                options: ['Active', 'Enrolled', 'Completed', 'Inactive'],
              },
              {
                key: 'batches',
                label: 'Batch',
                type: 'select',
                options: batches.map(b => ({ label: `${b.name} (${b.course || 'Training'})`, value: b._id })),
              },
            ]}
            sortOptions={[
              { label: 'Default', key: null, direction: 'asc' },
              { label: 'Name: A → Z', key: 'name', direction: 'asc' },
              { label: 'Name: Z → A', key: 'name', direction: 'desc' },
              { label: 'SLAE ID', key: 'slaeId', direction: 'asc' },
            ]}
            columns={[
              {
                key: 'slaeId',
                header: 'SLAE ID',
                width: '120px',
                render: (row) => (
                  <span className="font-mono font-bold text-indigo-600">
                    {row.slaeId || `SLA-${row._id?.toString().slice(-5).toUpperCase()}`}
                  </span>
                ),
              },
              {
                key: 'name',
                header: 'Student Name',
                width: '200px',
                render: (row) => (
                  <div>
                    <div className="font-extrabold text-slate-900 text-sm">{row.name}</div>
                    <div className="text-[11px] text-slate-400 font-normal">{row.mobile || row.email}</div>
                  </div>
                ),
              },
              {
                key: 'technicalBatch',
                header: 'Technical Batch',
                width: '180px',
                render: (row) => renderStudentBatchStatus(row, row.technicalBatch, 'technicalTrainer'),
              },
              {
                key: 'communicationBatch',
                header: 'Communication Batch',
                width: '180px',
                render: (row) => renderStudentBatchStatus(row, row.communicationBatch, 'communicationTrainer'),
              },
              {
                key: 'aptitudeBatch',
                header: 'Aptitude Batch',
                width: '180px',
                render: (row) => renderStudentBatchStatus(row, row.aptitudeBatch, 'aptitudeTrainer'),
              },
              {
                key: 'status',
                header: 'Status',
                align: 'center',
                width: '110px',
                render: (row) => (
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold inline-flex items-center gap-1 ${
                    row.status === 'Active' || row.status === 'Enrolled'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : row.status === 'Completed'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}>
                    <CheckCircle2 size={11} />
                    {row.status || 'Active'}
                  </span>
                ),
              },
              {
                key: 'actions',
                header: 'Actions',
                align: 'right',
                width: '100px',
                render: (row) => (
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => handleOpenEdit(row)}
                      title="Edit Student"
                      className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteStudent(row._id, row.name)}
                      title="Delete Student"
                      className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ),
              },
            ]}
          />
        </div>
      </div>

      {/* Add Student Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 overflow-y-auto">
            <div className="bg-white dark:bg-[#12131a] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 w-full max-w-lg my-8">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
                    <UserPlus size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-800 dark:text-white">Add Student & Multi-Batch Mapping</h3>
                    <p className="text-xs text-slate-500">Map student to Technical, Communication, and Aptitude batches</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateStudent} className="mt-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                      SLAEID
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. SLAE-2026-01"
                      value={formData.slaeId}
                      onChange={(e) => setFormData({ ...formData, slaeId: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
                    >
                      <option value="Active">Active</option>
                      <option value="Enrolled">Enrolled</option>
                      <option value="Completed">Completed</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                    Student Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Arjun Kumar"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="student@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                      Mobile Number
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. +91 9876543210"
                      value={formData.mobile}
                      onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-3">
                  <h4 className="text-xs font-extrabold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                    {user?.role === 'Communication Trainer' ? 'Batch Slot Allocation (Communication Domain)' :
                     user?.role === 'Aptitude Trainer' ? 'Batch Slot Allocation (Aptitude Domain)' :
                     user?.role === 'Technical Trainer' ? 'Batch Slot Allocation (Technical Domain)' :
                     'Multi-Batch Slot Allocation (3 Domains)'}
                  </h4>

                  {(user?.role !== 'Communication Trainer' && user?.role !== 'Aptitude Trainer') && (
                    <div className="space-y-1.5 relative">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        1. Technical Training Batch
                      </label>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenDropdownAdd(openDropdownAdd === 'tech' ? null : 'tech');
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-xs font-bold text-slate-805 dark:text-white flex items-center justify-between cursor-pointer"
                      >
                        <span className="truncate">{formData.technicalBatch || '-- Select Technical Batches --'}</span>
                        {openDropdownAdd === 'tech' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                      
                      {openDropdownAdd === 'tech' && (
                        <div 
                          onClick={(e) => e.stopPropagation()}
                          className="absolute z-50 mt-1 w-full border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 bg-white dark:bg-[#12131a] shadow-xl space-y-2"
                        >
                          <input
                            type="text"
                            placeholder="Search technical batch..."
                            value={techSearchAdd}
                            onChange={(e) => setTechSearchAdd(e.target.value)}
                            className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-900/40 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-purple-500"
                          />
                          <div className="max-h-28 overflow-y-auto space-y-1.5">
                            {getDomainBatches('Technical')
                              .filter(b => (b.name || '').toLowerCase().includes(techSearchAdd.toLowerCase()))
                              .map(b => {
                                const currentBatches = formData.technicalBatch ? formData.technicalBatch.split(', ').filter(Boolean) : [];
                                const isChecked = currentBatches.includes(b.name);
                                return (
                                  <label key={b._id} className="flex items-center space-x-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer select-none py-0.5">
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={(e) => {
                                        const newList = e.target.checked
                                          ? [...currentBatches, b.name]
                                          : currentBatches.filter(name => name !== b.name);
                                        setFormData({ ...formData, technicalBatch: newList.join(', ') });
                                      }}
                                      className="rounded border-slate-300 text-purple-650 focus:ring-purple-600 h-3.5 w-3.5 cursor-pointer"
                                    />
                                    <span>{b.name} <span className="text-[10px] text-slate-400 font-medium">({b.schedule || '09:00 AM - 11:00 AM'})</span></span>
                                  </label>
                                );
                              })}
                            {getDomainBatches('Technical').filter(b => (b.name || '').toLowerCase().includes(techSearchAdd.toLowerCase())).length === 0 && (
                              <p className="text-[11px] text-slate-400 italic p-1">No matching batches.</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {(user?.role !== 'Technical Trainer' && user?.role !== 'Aptitude Trainer') && (
                    <div className="space-y-1.5 relative">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        2. Communication Skills Batch
                      </label>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenDropdownAdd(openDropdownAdd === 'comm' ? null : 'comm');
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-xs font-bold text-slate-805 dark:text-white flex items-center justify-between cursor-pointer"
                      >
                        <span className="truncate">{formData.communicationBatch || '-- Select Communication Batches --'}</span>
                        {openDropdownAdd === 'comm' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                      
                      {openDropdownAdd === 'comm' && (
                        <div 
                          onClick={(e) => e.stopPropagation()}
                          className="absolute z-50 mt-1 w-full border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 bg-white dark:bg-[#12131a] shadow-xl space-y-2"
                        >
                          <input
                            type="text"
                            placeholder="Search communication batch..."
                            value={commSearchAdd}
                            onChange={(e) => setCommSearchAdd(e.target.value)}
                            className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-900/40 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-purple-500"
                          />
                          <div className="max-h-28 overflow-y-auto space-y-1.5">
                            {getDomainBatches('Communication')
                              .filter(b => (b.name || '').toLowerCase().includes(commSearchAdd.toLowerCase()))
                              .map(b => {
                                const currentBatches = formData.communicationBatch ? formData.communicationBatch.split(', ').filter(Boolean) : [];
                                const isChecked = currentBatches.includes(b.name);
                                return (
                                  <label key={b._id} className="flex items-center space-x-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer select-none py-0.5">
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={(e) => {
                                        const newList = e.target.checked
                                          ? [...currentBatches, b.name]
                                          : currentBatches.filter(name => name !== b.name);
                                        setFormData({ ...formData, communicationBatch: newList.join(', ') });
                                      }}
                                      className="rounded border-slate-300 text-purple-650 focus:ring-purple-600 h-3.5 w-3.5 cursor-pointer"
                                    />
                                    <span>{b.name} <span className="text-[10px] text-slate-400 font-medium">({b.schedule || '02:00 PM - 03:30 PM'})</span></span>
                                  </label>
                                );
                              })}
                            {getDomainBatches('Communication').filter(b => (b.name || '').toLowerCase().includes(commSearchAdd.toLowerCase())).length === 0 && (
                              <p className="text-[11px] text-slate-400 italic p-1">No matching batches.</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {(user?.role !== 'Technical Trainer' && user?.role !== 'Communication Trainer') && (
                    <div className="space-y-1.5 relative">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        3. Aptitude & Reasoning Batch
                      </label>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenDropdownAdd(openDropdownAdd === 'apti' ? null : 'apti');
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-xs font-bold text-slate-805 dark:text-white flex items-center justify-between cursor-pointer"
                      >
                        <span className="truncate">{formData.aptitudeBatch || '-- Select Aptitude Batches --'}</span>
                        {openDropdownAdd === 'apti' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                      
                      {openDropdownAdd === 'apti' && (
                        <div 
                          onClick={(e) => e.stopPropagation()}
                          className="absolute z-50 mt-1 w-full border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 bg-white dark:bg-[#12131a] shadow-xl space-y-2"
                        >
                          <input
                            type="text"
                            placeholder="Search aptitude batch..."
                            value={aptiSearchAdd}
                            onChange={(e) => setAptiSearchAdd(e.target.value)}
                            className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-900/40 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-purple-500"
                          />
                          <div className="max-h-28 overflow-y-auto space-y-1.5">
                            {getDomainBatches('Aptitude')
                              .filter(b => (b.name || '').toLowerCase().includes(aptiSearchAdd.toLowerCase()))
                              .map(b => {
                                const currentBatches = formData.aptitudeBatch ? formData.aptitudeBatch.split(', ').filter(Boolean) : [];
                                const isChecked = currentBatches.includes(b.name);
                                return (
                                  <label key={b._id} className="flex items-center space-x-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer select-none py-0.5">
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={(e) => {
                                        const newList = e.target.checked
                                          ? [...currentBatches, b.name]
                                          : currentBatches.filter(name => name !== b.name);
                                        setFormData({ ...formData, aptitudeBatch: newList.join(', ') });
                                      }}
                                      className="rounded border-slate-300 text-purple-650 focus:ring-purple-600 h-3.5 w-3.5 cursor-pointer"
                                    />
                                    <span>{b.name} <span className="text-[10px] text-slate-400 font-medium">({b.schedule || '04:00 PM - 05:00 PM'})</span></span>
                                  </label>
                                );
                              })}
                            {getDomainBatches('Aptitude').filter(b => (b.name || '').toLowerCase().includes(aptiSearchAdd.toLowerCase())).length === 0 && (
                              <p className="text-[11px] text-slate-400 italic p-1">No matching batches.</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md shadow-purple-500/25 cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? 'Adding...' : 'Save Student Mapping'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showEditModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 overflow-y-auto">
            <div className="bg-white dark:bg-[#12131a] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 w-full max-w-lg my-8">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
                    <Edit3 size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-800 dark:text-white">Edit Student Mapping</h3>
                    <p className="text-xs text-slate-500">Update cohort allocations & status</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleUpdateStudent} className="mt-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      SLAEID (Unique ID) *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. SLA001"
                      value={editFormData.slaeId}
                      onChange={(e) => setEditFormData({ ...editFormData, slaeId: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-xs font-semibold text-slate-850 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Student Name *
                    </label>
                    <input
                      type="text"
                      placeholder="Enter name"
                      value={editFormData.name}
                      onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-xs font-semibold text-slate-850 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      placeholder="email@example.com"
                      value={editFormData.email}
                      onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-xs font-semibold text-slate-850 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Mobile Number
                    </label>
                    <input
                      type="text"
                      placeholder="Enter mobile"
                      value={editFormData.mobile}
                      onChange={(e) => setEditFormData({ ...editFormData, mobile: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-xs font-semibold text-slate-850 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <div className="space-y-3.5 bg-slate-50 dark:bg-slate-900/20 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <h4 className="text-xs font-extrabold text-purple-650 uppercase tracking-wider mb-2">Cohort Group Assignments</h4>
                  
                  {(user?.role !== 'Communication Trainer' && user?.role !== 'Aptitude Trainer') && (
                    <div className="space-y-1.5 relative">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        1. Technical Training Batch
                      </label>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenDropdownEdit(openDropdownEdit === 'tech' ? null : 'tech');
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-xs font-bold text-slate-800 dark:text-white flex items-center justify-between cursor-pointer"
                      >
                        <span className="truncate">{editFormData.technicalBatch || '-- No Technical Batch Assigned --'}</span>
                        {openDropdownEdit === 'tech' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                      
                      {openDropdownEdit === 'tech' && (
                        <div 
                          onClick={(e) => e.stopPropagation()}
                          className="absolute z-50 mt-1 w-full border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 bg-white dark:bg-[#12131a] shadow-xl space-y-2"
                        >
                          <input
                            type="text"
                            placeholder="Search technical batch..."
                            value={techSearchEdit}
                            onChange={(e) => setTechSearchEdit(e.target.value)}
                            className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-900/40 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-purple-500"
                          />
                          <div className="max-h-28 overflow-y-auto space-y-1.5">
                            {getDomainBatches('Technical')
                              .filter(b => (b.name || '').toLowerCase().includes(techSearchEdit.toLowerCase()))
                              .map(b => {
                                const currentBatches = editFormData.technicalBatch ? editFormData.technicalBatch.split(', ').filter(Boolean) : [];
                                const isChecked = currentBatches.includes(b.name);
                                return (
                                  <label key={b._id} className="flex items-center space-x-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer select-none py-0.5">
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={(e) => {
                                        const newList = e.target.checked
                                          ? [...currentBatches, b.name]
                                          : currentBatches.filter(name => name !== b.name);
                                        setEditFormData({ ...editFormData, technicalBatch: newList.join(', ') });
                                      }}
                                      className="rounded border-slate-300 text-purple-650 focus:ring-purple-600 h-3.5 w-3.5 cursor-pointer"
                                    />
                                    <span>{b.name} <span className="text-[10px] text-slate-400 font-medium">({b.schedule || '09:00 AM - 12:00 PM'})</span></span>
                                  </label>
                                );
                              })}
                            {getDomainBatches('Technical').filter(b => (b.name || '').toLowerCase().includes(techSearchEdit.toLowerCase())).length === 0 && (
                              <p className="text-[11px] text-slate-400 italic p-1">No matching batches.</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {(user?.role !== 'Technical Trainer' && user?.role !== 'Aptitude Trainer') && (
                    <div className="space-y-1.5 relative">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        2. Communication Skills Batch
                      </label>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenDropdownEdit(openDropdownEdit === 'comm' ? null : 'comm');
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-xs font-bold text-slate-800 dark:text-white flex items-center justify-between cursor-pointer"
                      >
                        <span className="truncate">{editFormData.communicationBatch || '-- No Communication Batch Assigned --'}</span>
                        {openDropdownEdit === 'comm' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                      
                      {openDropdownEdit === 'comm' && (
                        <div 
                          onClick={(e) => e.stopPropagation()}
                          className="absolute z-50 mt-1 w-full border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 bg-white dark:bg-[#12131a] shadow-xl space-y-2"
                        >
                          <input
                            type="text"
                            placeholder="Search communication batch..."
                            value={commSearchEdit}
                            onChange={(e) => setCommSearchEdit(e.target.value)}
                            className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-900/40 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-purple-500"
                          />
                          <div className="max-h-28 overflow-y-auto space-y-1.5">
                            {getDomainBatches('Communication')
                              .filter(b => (b.name || '').toLowerCase().includes(commSearchEdit.toLowerCase()))
                              .map(b => {
                                const currentBatches = editFormData.communicationBatch ? editFormData.communicationBatch.split(', ').filter(Boolean) : [];
                                const isChecked = currentBatches.includes(b.name);
                                return (
                                  <label key={b._id} className="flex items-center space-x-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer select-none py-0.5">
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={(e) => {
                                        const newList = e.target.checked
                                          ? [...currentBatches, b.name]
                                          : currentBatches.filter(name => name !== b.name);
                                        setEditFormData({ ...editFormData, communicationBatch: newList.join(', ') });
                                      }}
                                      className="rounded border-slate-300 text-purple-650 focus:ring-purple-600 h-3.5 w-3.5 cursor-pointer"
                                    />
                                    <span>{b.name} <span className="text-[10px] text-slate-400 font-medium">({b.schedule || '02:00 PM - 03:30 PM'})</span></span>
                                  </label>
                                );
                              })}
                            {getDomainBatches('Communication').filter(b => (b.name || '').toLowerCase().includes(commSearchEdit.toLowerCase())).length === 0 && (
                              <p className="text-[11px] text-slate-400 italic p-1">No matching batches.</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {(user?.role !== 'Technical Trainer' && user?.role !== 'Communication Trainer') && (
                    <div className="space-y-1.5 relative">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        3. Aptitude & Reasoning Batch
                      </label>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenDropdownEdit(openDropdownEdit === 'apti' ? null : 'apti');
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-xs font-bold text-slate-800 dark:text-white flex items-center justify-between cursor-pointer"
                      >
                        <span className="truncate">{editFormData.aptitudeBatch || '-- No Aptitude Batch Assigned --'}</span>
                        {openDropdownEdit === 'apti' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                      
                      {openDropdownEdit === 'apti' && (
                        <div 
                          onClick={(e) => e.stopPropagation()}
                          className="absolute z-50 mt-1 w-full border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 bg-white dark:bg-[#12131a] shadow-xl space-y-2"
                        >
                          <input
                            type="text"
                            placeholder="Search aptitude batch..."
                            value={aptiSearchEdit}
                            onChange={(e) => setAptiSearchEdit(e.target.value)}
                            className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-900/40 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-purple-500"
                          />
                          <div className="max-h-28 overflow-y-auto space-y-1.5">
                            {getDomainBatches('Aptitude')
                              .filter(b => (b.name || '').toLowerCase().includes(aptiSearchEdit.toLowerCase()))
                              .map(b => {
                                const currentBatches = editFormData.aptitudeBatch ? editFormData.aptitudeBatch.split(', ').filter(Boolean) : [];
                                const isChecked = currentBatches.includes(b.name);
                                return (
                                  <label key={b._id} className="flex items-center space-x-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer select-none py-0.5">
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={(e) => {
                                        const newList = e.target.checked
                                          ? [...currentBatches, b.name]
                                          : currentBatches.filter(name => name !== b.name);
                                        setEditFormData({ ...editFormData, aptitudeBatch: newList.join(', ') });
                                      }}
                                      className="rounded border-slate-300 text-purple-650 focus:ring-purple-600 h-3.5 w-3.5 cursor-pointer"
                                    />
                                    <span>{b.name} <span className="text-[10px] text-slate-400 font-medium">({b.schedule || '04:00 PM - 05:00 PM'})</span></span>
                                  </label>
                                );
                              })}
                            {getDomainBatches('Aptitude').filter(b => (b.name || '').toLowerCase().includes(aptiSearchEdit.toLowerCase())).length === 0 && (
                              <p className="text-[11px] text-slate-400 italic p-1">No matching batches.</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updating}
                    className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md shadow-purple-500/25 cursor-pointer disabled:opacity-50"
                  >
                    {updating ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      {/* Excel Import Modal */}
      {importModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-[#12131a] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 w-full max-w-md my-8 relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                  <Upload size={18} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-800 dark:text-white">Import Students List</h3>
                  <p className="text-xs text-slate-500">Upload bulk data template sheet</p>
                </div>
              </div>
              <button
                onClick={() => setImportModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200/60 dark:border-slate-800/40">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Download Template File</h4>
                <p className="text-[11px] text-slate-500 mb-3">Download the excel format with correct headers (SLAEID, Name, BatchID) first.</p>
                <button
                  onClick={downloadTemplate}
                  className="flex items-center gap-1.5 px-3 py-2 bg-violet-50 dark:bg-violet-950/40 hover:bg-violet-100 dark:hover:bg-violet-950/40 text-violet-800 dark:text-violet-400 rounded-lg text-xs font-bold transition cursor-pointer"
                >
                  <FileSpreadsheet size={14} />
                  <span>Download Excel Template</span>
                </button>
              </div>

              <form onSubmit={handleExcelImport} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Choose Excel Document *
                  </label>
                  <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-6 text-center hover:border-purple-500/50 transition relative">
                    <input
                      type="file"
                      accept=".xlsx, .xls"
                      onChange={(e) => setExcelFile(e.target.files[0])}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      required
                    />
                    <div className="flex flex-col items-center gap-2">
                      <div className="p-3 bg-purple-50 dark:bg-purple-950/40 text-purple-650 rounded-full">
                        <FileSpreadsheet size={24} />
                      </div>
                      <p className="text-xs font-semibold text-slate-650 dark:text-slate-400">
                        {excelFile ? excelFile.name : 'Click or Drag Excel sheet here'}
                      </p>
                      <p className="text-[10px] text-slate-400">Supported formats: .xlsx or .xls (Columns: SLAEID, Name, Technical Batch ID, Communication Batch ID, Aptitude Batch ID)</p>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!excelFile || importingExcel}
                  className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-xl text-xs font-extrabold shadow-lg shadow-purple-500/20 cursor-pointer transition flex items-center justify-center gap-2"
                >
                  {importingExcel ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Importing...</span>
                    </>
                  ) : (
                    <span>Upload & Import</span>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrainerStudentsPage;
