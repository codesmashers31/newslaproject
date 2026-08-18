import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import { toast } from 'react-hot-toast';
import { Plus, Edit2, Trash2, X, BookOpen, Users, Upload, FileSpreadsheet, FileDown, GraduationCap, Calendar, Clock, Search, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import { useAuth } from '../../context/AuthContext';

const BatchManagement = () => {
  const { user } = useAuth();
  const [batches, setBatches] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [excelFile, setExcelFile] = useState(null);

  // Category Filter & Search States
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (modalOpen || importModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [modalOpen, importModalOpen]);

  const downloadTemplate = () => {
    const templateData = [
      {
        'Batch Name': 'Elite Full Stack Web Dev Batch A',
        'Assignment Trainers': 'Bala, Selva',
        'Batch ID': 'BAT-001'
      },
      {
        'Batch Name': 'APT1',
        'Assignment Trainers': 'Softlogic',
        'Batch ID': 'BAT-002'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');
    XLSX.writeFile(workbook, 'Batch_Import_Template.xlsx');
    toast.success('Template downloaded successfully!');
  };

  const [importingExcel, setImportingExcel] = useState(false);

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
      const { data } = await API.post('/admin/batches/import', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success(data.message || 'Imported batches successfully!');
      setImportModalOpen(false);
      setExcelFile(null);
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error importing Excel sheet');
    } finally {
      setImportingExcel(false);
    }
  };

  const [editingBatch, setEditingBatch] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    batchId: '',
    status: 'Active',
    technicalTrainer: '',
    communicationTrainer: '',
    aptitudeTrainer: '',
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [batchRes, trainerRes] = await Promise.all([
        API.get('/admin/batches'),
        API.get('/trainer/trainers').catch(() => ({ data: [] }))
      ]);
      setBatches(batchRes.data);
      setTrainers(trainerRes.data || []);
    } catch (error) {
      toast.error('Failed to load batch data');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredBatchesForDisplay = () => {
    let result = batches;

    // Filter by User Role if Trainer
    if (user && user.role !== 'Super Admin' && user.role !== 'Admin') {
      result = result.filter(batch => {
        const isAssigned = batch.trainers?.some(t => {
          const tId = typeof t === 'object' ? t?._id : t;
          return String(tId) === String(user?._id);
        }) || batch.trainerName?.toLowerCase().includes(user?.name?.toLowerCase());
        return isAssigned;
      });
    }

    // Category Filter Tab
    if (categoryFilter === 'Technical') {
      result = result.filter(b => 
        b.department === 'Technical' || 
        !(b.course || '').toLowerCase().includes('communication') && !(b.course || '').toLowerCase().includes('aptitude')
      );
    } else if (categoryFilter === 'Communication') {
      result = result.filter(b => 
        b.department === 'Communication' || 
        (b.course || '').toLowerCase().includes('communication') ||
        (b.batchId || '').toLowerCase().includes('comm')
      );
    } else if (categoryFilter === 'Aptitude') {
      result = result.filter(b => 
        b.department === 'Aptitude' || 
        (b.course || '').toLowerCase().includes('aptitude') ||
        (b.batchId || '').toLowerCase().includes('apti')
      );
    }

    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(b =>
        b.name?.toLowerCase().includes(q) ||
        b.batchId?.toLowerCase().includes(q) ||
        b.course?.toLowerCase().includes(q) ||
        b.trainerName?.toLowerCase().includes(q)
      );
    }

    return result;
  };

  useEffect(() => {
    loadData();
  }, []);

  const exportToExcel = () => {
    if (batches.length === 0) {
      toast.error('No batch data to export');
      return;
    }

    const dataToExport = batches.map(b => ({
      'Batch ID': b.batchId || 'N/A',
      'Batch Name': b.name,
      'Department / Course': b.course || b.department || 'Technical',
      'Schedule': b.schedule || 'Mon - Fri',
      'Trainer Name': b.trainerName || 'Unassigned',
      'Start Date': b.startDate ? new Date(b.startDate).toLocaleDateString() : '',
      'End Date': b.endDate ? new Date(b.endDate).toLocaleDateString() : '',
      'Status': b.status || 'Active'
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Batches');
    XLSX.writeFile(workbook, 'Batches_Directory_Report.xlsx');
    toast.success('Excel file downloaded!');
  };

  const exportToPDF = () => {
    if (batches.length === 0) {
      toast.error('No batch data to export');
      return;
    }

    const doc = new jsPDF();
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('SLA System - Batches Directory Report', 14, 20);
    doc.setFontSize(10);
    doc.setFont('Helvetica', 'normal');
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 26);

    let yPosition = 35;
    doc.setFillColor(124, 58, 237);
    doc.rect(14, yPosition, 182, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('Helvetica', 'bold');
    doc.text('Batch ID', 16, yPosition + 6);
    doc.text('Batch Name', 45, yPosition + 6);
    doc.text('Course', 105, yPosition + 6);
    doc.text('Schedule', 145, yPosition + 6);
    doc.text('Status', 175, yPosition + 6);

    yPosition += 8;
    doc.setTextColor(0, 0, 0);
    doc.setFont('Helvetica', 'normal');

    batches.forEach((b, index) => {
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }
      if (index % 2 === 0) {
        doc.setFillColor(243, 244, 246);
        doc.rect(14, yPosition, 182, 8, 'F');
      }

      doc.text((b.batchId || 'N/A').substring(0, 12), 16, yPosition + 6);
      doc.text(b.name.substring(0, 24), 45, yPosition + 6);
      doc.text((b.course || 'Technical').substring(0, 18), 105, yPosition + 6);
      doc.text((b.startTime ? `${b.startTime}-${b.endTime}` : 'TBD').substring(0, 14), 145, yPosition + 6);
      doc.text(b.status || 'Active', 175, yPosition + 6);
      yPosition += 8;
    });

    doc.save('Batches_Directory_Report.pdf');
    toast.success('PDF report downloaded!');
  };

  const openAddModal = () => {
    setEditingBatch(null);
    setFormData({
      name: '',
      batchId: '',
      status: 'Active',
      technicalTrainer: '',
      communicationTrainer: '',
      aptitudeTrainer: '',
      startDate: '',
      endDate: '',
      startTime: '',
      endTime: '',
    });
    setModalOpen(true);
  };

  // Helper: Converts 12-hour "10:00 AM" or "02:00 PM" to 24-hour "10:00" or "14:00" for HTML <input type="time" />
  const convertTo24HourTime = (timeStr) => {
    if (!timeStr) return '';
    const str = timeStr.trim();
    if (/^\d{2}:\d{2}$/.test(str)) return str;
    if (/^\d{1}:\d{2}$/.test(str)) return `0${str}`;

    const match = str.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!match) return '';

    let [_, hours, minutes, modifier] = match;
    let h = parseInt(hours, 10);
    if (modifier.toUpperCase() === 'PM' && h < 12) h += 12;
    if (modifier.toUpperCase() === 'AM' && h === 12) h = 0;

    const hStr = h < 10 ? `0${h}` : `${h}`;
    return `${hStr}:${minutes}`;
  };

  // Helper: Converts 24-hour "14:00" to 12-hour "02:00 PM"
  const convertTo12HourTime = (time24) => {
    if (!time24) return '';
    const str = time24.trim();
    if (/AM|PM/i.test(str)) return str;

    const match = str.match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return str;

    let [_, hours, minutes] = match;
    let h = parseInt(hours, 10);
    const modifier = h >= 12 ? 'PM' : 'AM';
    if (h === 0) h = 12;
    if (h > 12) h -= 12;

    const hStr = h < 10 ? `0${h}` : `${h}`;
    return `${hStr}:${minutes} ${modifier}`;
  };

  const openEditModal = (batch) => {
    setEditingBatch(batch);
    const trainerList = batch.trainers || [];

    const findTrainerId = (roleName) => {
      const found = trainerList.find(t => typeof t === 'object' && t.role === roleName);
      if (found) return found._id;
      return '';
    };

    const techT = batch.technicalTrainer || findTrainerId('Technical Trainer') || (trainerList[0]?._id || '');
    const commT = batch.communicationTrainer || findTrainerId('Communication Trainer') || '';
    const aptiT = batch.aptitudeTrainer || findTrainerId('Aptitude Trainer') || '';

    const formatDate = (dateVal) => {
      if (!dateVal) return '';
      return new Date(dateVal).toISOString().split('T')[0];
    };

    setFormData({
      name: batch.name,
      batchId: batch.batchId || '',
      status: batch.status || 'Active',
      technicalTrainer: techT,
      communicationTrainer: commT,
      aptitudeTrainer: aptiT,
      startDate: formatDate(batch.startDate),
      endDate: formatDate(batch.endDate),
      startTime: convertTo24HourTime(batch.startTime),
      endTime: convertTo24HourTime(batch.endTime),
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      const selectedTrainers = [
        formData.technicalTrainer,
        formData.communicationTrainer,
        formData.aptitudeTrainer
      ].filter(Boolean);

      let courseValue = 'Technical Training';
      if (formData.technicalTrainer) {
        courseValue = 'Technical Training';
      } else if (formData.communicationTrainer) {
        courseValue = 'Communication Skills';
      } else if (formData.aptitudeTrainer) {
        courseValue = 'Aptitude & Reasoning';
      }

      const formattedStartTime = convertTo12HourTime(formData.startTime);
      const formattedEndTime = convertTo12HourTime(formData.endTime);
      let scheduleString = '';
      if (formattedStartTime && formattedEndTime) {
        scheduleString = `Mon - Fri • ${formattedStartTime} – ${formattedEndTime}`;
      } else if (formattedStartTime) {
        scheduleString = `Mon - Fri • ${formattedStartTime}`;
      }

      const submitData = {
        name: formData.name,
        batchId: formData.batchId,
        course: courseValue,
        status: formData.status,
        trainers: selectedTrainers,
        technicalTrainer: formData.technicalTrainer || null,
        communicationTrainer: formData.communicationTrainer || null,
        aptitudeTrainer: formData.aptitudeTrainer || null,
        startDate: formData.startDate || null,
        endDate: formData.endDate || null,
        startTime: formattedStartTime,
        endTime: formattedEndTime,
        schedule: scheduleString
      };

      if (editingBatch) {
        await API.put(`/admin/batches/${editingBatch._id}`, submitData);
        toast.success('Batch updated successfully!');
      } else {
        await API.post('/admin/batches', submitData);
        toast.success('Batch created successfully!');
      }
      setModalOpen(false);
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error processing batch request');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this batch? All assigned students will remain but their batch link will clear.')) {
      try {
        await API.delete(`/admin/batches/${id}`);
        toast.success('Batch deleted successfully');
        loadData();
      } catch (error) {
        toast.error('Failed to delete batch');
      }
    }
  };

  const displayedBatches = getFilteredBatchesForDisplay();

  return (
    <div className="space-y-6">
      {/* Header Container */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-[#12131a] p-6 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white font-sans">
              Batch Management
            </h1>
            <span className="bg-violet-100 dark:bg-violet-950/60 text-violet-800 dark:text-violet-300 px-3 py-1 rounded-full text-xs font-black">
              {batches.length} Batches
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">
            Configure active domain training groups, schedules, and trainer assignments
          </p>
        </div>

        {(user?.role === 'Super Admin' || user?.role === 'Admin') && (
          <div className="flex flex-wrap gap-2.5 items-center">
            <button
              onClick={openAddModal}
              className="flex-1 sm:flex-none flex items-center justify-center space-x-2 bg-[#7C3AED] hover:bg-[#6d28d9] text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold shadow-md shadow-violet-500/20 transition-all active:scale-95 cursor-pointer"
            >
              <Plus size={16} />
              <span>Create Batch</span>
            </button>

            <button
              onClick={() => setImportModalOpen(true)}
              className="flex-1 sm:flex-none flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold shadow-md shadow-indigo-500/20 transition-all active:scale-95 cursor-pointer"
            >
              <Upload size={16} />
              <span>Import Excel</span>
            </button>

            <button
              onClick={exportToExcel}
              className="flex items-center justify-center space-x-2 border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-900 text-gray-700 dark:text-gray-200 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              <FileSpreadsheet size={16} className="text-emerald-600" />
              <span className="hidden sm:inline">Export Excel</span>
            </button>

            <button
              onClick={exportToPDF}
              className="flex items-center justify-center space-x-2 border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-900 text-gray-700 dark:text-gray-200 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              <FileDown size={16} className="text-rose-600" />
              <span className="hidden sm:inline">Export PDF</span>
            </button>
          </div>
        )}
      </div>

      {/* Category Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-[#12131a] p-3.5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { key: 'All', label: 'All Batches' },
            { key: 'Technical', label: 'Technical Batches' },
            { key: 'Communication', label: 'Communication Batches' },
            { key: 'Aptitude', label: 'Aptitude Batches' },
          ].map(c => (
            <button
              key={c.key}
              onClick={() => setCategoryFilter(c.key)}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center gap-1.5 ${
                categoryFilter === c.key
                  ? 'bg-[#7C3AED] text-white shadow-md shadow-violet-500/20'
                  : 'bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300 hover:border-violet-500'
              }`}
            >
              <BookOpen size={14} />
              <span>{c.label}</span>
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search batch by name, ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50 dark:bg-gray-900/40 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500 w-full text-gray-800 dark:text-white"
          />
        </div>
      </div>

      {/* Grid of Batches */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
          {Array(2).fill(0).map((_, i) => (
            <div key={i} className="h-44 bg-gray-200 dark:bg-gray-800 rounded-3xl" />
          ))}
        </div>
      ) : displayedBatches.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-[#12131a] border border-gray-200 dark:border-gray-800 rounded-3xl p-6 text-gray-500 font-bold text-sm">
          No batches found matching your filter criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {displayedBatches.map((batch) => (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              key={batch._id}
              className="bg-white/70 dark:bg-[#12131a]/80 border border-gray-200 dark:border-gray-800/80 rounded-[24px] p-6 shadow-sm hover:shadow-md hover:shadow-violet-500/5 hover:-translate-y-1 duration-300 transition-all flex flex-col justify-between"
            >
              <div>
                {/* Title & Actions */}
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <BookOpen size={20} className="text-violet-500" />
                        {batch.name}
                      </h3>
                      {batch.batchId && (
                        <span className="bg-violet-50 dark:bg-violet-950/30 text-violet-800 dark:text-violet-400 text-[9px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">
                          ID: {batch.batchId}
                        </span>
                      )}
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                        batch.status === 'Active'
                          ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400'
                          : 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400'
                      }`}>
                        {batch.status || 'Active'}
                      </span>
                    </div>
                  </div>
                  {(user?.role === 'Super Admin' || user?.role === 'Admin') && (
                    <div className="flex space-x-1.5 bg-gray-50 dark:bg-[#181922] p-1 rounded-xl border border-gray-100 dark:border-gray-800">
                      <button
                        onClick={() => openEditModal(batch)}
                        className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg text-gray-500 hover:text-violet-500 transition-colors cursor-pointer"
                        title="Edit Batch"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={() => handleDelete(batch._id)}
                        className="p-2 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg text-gray-400 hover:text-rose-600 transition-colors cursor-pointer"
                        title="Delete Batch"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )}
                </div>

                <hr className="my-4 border-gray-200 dark:border-gray-800" />

                {/* Students Count Box */}
                <div className="bg-gray-50/50 dark:bg-[#181922] p-4 rounded-xl border border-gray-200 dark:border-gray-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 font-bold text-gray-700 dark:text-gray-300">
                    <Users size={16} className="text-violet-500" />
                    <span>Enrolled Students</span>
                  </div>
                  <span className="bg-violet-50 dark:bg-violet-950/20 text-violet-800 dark:text-violet-400 px-3 py-1 rounded-lg font-extrabold text-[11px] shadow-sm">
                    {batch.students?.length || 0} Students
                  </span>
                </div>

                {/* Schedule Details Box */}
                <div className="mt-3 bg-violet-50/20 dark:bg-violet-950/5 border border-violet-100/50 dark:border-violet-950/30 p-3.5 rounded-xl text-xs space-y-2">
                  <div className="flex justify-between items-center text-gray-600 dark:text-gray-400 font-semibold">
                    <span className="flex items-center gap-1.5"><Calendar size={13} className="text-violet-500" /> Duration Dates</span>
                    <span className="font-extrabold text-gray-850 dark:text-gray-200">
                      {batch.startDate ? new Date(batch.startDate).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'}) : 'N/A'} - {batch.endDate ? new Date(batch.endDate).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'}) : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-gray-600 dark:text-gray-400 font-semibold">
                    <span className="flex items-center gap-1.5"><Clock size={13} className="text-violet-500" /> Daily Shift Hours</span>
                    <span className="font-extrabold text-gray-850 dark:text-gray-200">
                      {batch.startTime ? batch.startTime : 'N/A'} - {batch.endTime ? batch.endTime : 'N/A'}
                    </span>
                  </div>
                </div>

                {/* Allotments Trainers List Box */}
                <div className="mt-3 bg-gray-50/20 dark:bg-[#181922]/40 p-3.5 rounded-xl border border-gray-200 dark:border-gray-800/60 text-xs">
                  <p className="text-[10px] font-extrabold text-violet-500 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                    <GraduationCap size={13} />
                    <span>Allotments Trainers List</span>
                  </p>
                  <p className="text-xs text-gray-700 dark:text-gray-300 font-semibold leading-relaxed">
                    {batch.trainers && batch.trainers.length > 0
                      ? batch.trainers.map(t => `${t.name} (${t.role})`).join(' • ')
                      : batch.trainerName
                      ? batch.trainerName
                      : 'No trainers assigned yet.'}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* CREATE & EDIT BATCH MODAL */}
      <AnimatePresence>
        {modalOpen && (
          <>
            {/* Dark blur backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40" 
              onClick={() => setModalOpen(false)} 
            />
            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="fixed inset-0 m-auto max-w-md w-[calc(100%-2rem)] md:w-full h-fit max-h-[90vh] bg-white dark:bg-[#12131a] rounded-[28px] shadow-2xl z-50 border border-gray-200 dark:border-gray-800 p-6 overflow-y-auto focus:outline-none scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b pb-4 border-gray-200 dark:border-gray-800">
                <div>
                  <h3 className="text-lg font-black text-gray-900 dark:text-white">
                    {editingBatch ? 'Edit Batch Details' : 'Create New Batch'}
                  </h3>
                  <p className="text-[10px] text-gray-400 mt-0.5">Configure schedule parameters and select trainers</p>
                </div>
                <button onClick={() => setModalOpen(false)} className="text-gray-500 dark:text-gray-400 hover:text-rose-500 duration-200 cursor-pointer">
                  <X size={20} />
                </button>
              </div>

              {/* Form wrapper */}
              <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Batch ID</label>
                  <input
                    type="text"
                    required
                    value={formData.batchId}
                    onChange={(e) => setFormData({ ...formData, batchId: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-805 rounded-xl bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-violet-800 text-gray-900 dark:text-white font-semibold"
                    placeholder="e.g. MERN001"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Batch Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-805 rounded-xl bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-violet-800 text-gray-900 dark:text-white font-semibold"
                    placeholder="e.g. Elite Full Stack Web Dev Batch A"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Batch Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-805 rounded-xl bg-white dark:bg-[#12131a] text-sm focus:outline-none focus:ring-2 focus:ring-violet-800 text-gray-900 dark:text-white cursor-pointer font-semibold"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                {/* Start Date & End Date fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Start Date</label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-805 rounded-xl bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-violet-800 text-gray-955 dark:text-white font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">End Date</label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-805 rounded-xl bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-violet-800 text-gray-955 dark:text-white font-semibold"
                    />
                  </div>
                </div>

                {/* Start Time & End Time fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Start Time</label>
                    <input
                      type="time"
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-850 rounded-xl bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-violet-800 text-gray-955 dark:text-white font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">End Time</label>
                    <input
                      type="time"
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-850 rounded-xl bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-violet-800 text-gray-955 dark:text-white font-semibold"
                    />
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <label className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider block">Assign Trainers (Multiple Select)</label>
                  
                  {/* Technical Trainer Select */}
                  <div>
                    <label className="text-[10px] font-bold text-violet-500 uppercase tracking-wide block mb-1">Technical Trainer</label>
                    <select
                      value={formData.technicalTrainer}
                      onChange={(e) => setFormData({ ...formData, technicalTrainer: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-gray-200 dark:border-gray-805 rounded-xl bg-white dark:bg-[#12131a] text-xs focus:outline-none focus:ring-2 focus:ring-violet-800 text-gray-900 dark:text-white cursor-pointer font-semibold"
                    >
                      <option value="">Select Technical Trainer (Optional)</option>
                      {trainers.filter(t => t.role === 'Technical Trainer').map(t => (
                        <option key={t._id} value={t._id}>{t.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Communication Trainer Select */}
                  <div>
                    <label className="text-[10px] font-bold text-violet-500 uppercase tracking-wide block mb-1">Communication Trainer</label>
                    <select
                      value={formData.communicationTrainer}
                      onChange={(e) => setFormData({ ...formData, communicationTrainer: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-gray-200 dark:border-gray-805 rounded-xl bg-white dark:bg-[#12131a] text-xs focus:outline-none focus:ring-2 focus:ring-violet-800 text-gray-900 dark:text-white cursor-pointer font-semibold"
                    >
                      <option value="">Select Communication Trainer (Optional)</option>
                      {trainers.filter(t => t.role === 'Communication Trainer').map(t => (
                        <option key={t._id} value={t._id}>{t.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Aptitude Trainer Select */}
                  <div>
                    <label className="text-[10px] font-bold text-violet-500 uppercase tracking-wide block mb-1">Aptitude Trainer</label>
                    <select
                      value={formData.aptitudeTrainer}
                      onChange={(e) => setFormData({ ...formData, aptitudeTrainer: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-gray-200 dark:border-gray-850 rounded-xl bg-white dark:bg-[#12131a] text-xs focus:outline-none focus:ring-2 focus:ring-violet-800 text-gray-900 dark:text-white cursor-pointer font-semibold"
                    >
                      <option value="">Select Aptitude Trainer (Optional)</option>
                      {trainers.filter(t => t.role === 'Aptitude Trainer').map(t => (
                        <option key={t._id} value={t._id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Footer submit button naturally following content */}
                <div className="pt-4 border-t border-gray-200 dark:border-gray-800 mt-6 font-sans">
                  <button
                    type="submit"
                    disabled={submitLoading}
                    className="w-full py-3.5 bg-violet-800 hover:bg-indigo-550 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg shadow-violet-500/20 cursor-pointer flex items-center justify-center gap-2 text-xs"
                  >
                    {submitLoading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      editingBatch ? 'Save Changes' : 'Create Batch'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* IMPORT FROM EXCEL MODAL */}
      {importModalOpen && (
        <>
          <div className="fixed inset-0 bg-black/55 z-40" onClick={() => setImportModalOpen(false)} />
          <div className="fixed inset-0 m-auto max-w-md h-fit bg-white dark:bg-[#12131a] rounded-3xl shadow-2xl z-50 border border-gray-200 dark:border-gray-800 p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-3">
              <h3 className="text-lg font-bold">Import Batches from Excel</h3>
              <button onClick={() => setImportModalOpen(false)} className="text-gray-500 dark:text-gray-400">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleExcelImport} className="space-y-4">
              {/* Excel Template Download Card */}
              <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-900/40 p-3.5 rounded-2xl border border-gray-150 dark:border-gray-800/80">
                <div className="pr-2">
                  <p className="text-xs font-bold text-gray-700 dark:text-gray-300">Excel Template</p>
                  <p className="text-[10px] text-gray-400">Minimal required columns template</p>
                </div>
                <button
                  type="button"
                  onClick={downloadTemplate}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors cursor-pointer shrink-0"
                >
                  <FileSpreadsheet size={13} />
                  <span>Download Model</span>
                </button>
              </div>

              <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl p-6 text-center hover:bg-violet-50/10 transition-colors relative cursor-pointer">
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={(e) => setExcelFile(e.target.files[0])}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="space-y-2">
                  <div className="h-10 w-10 bg-violet-50 dark:bg-violet-950/20 text-violet-800 dark:text-violet-400 rounded-xl flex items-center justify-center mx-auto">
                    <FileSpreadsheet size={24} />
                  </div>
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                    {excelFile ? excelFile.name : 'Click or Drag Excel sheet here'}
                  </p>
                  <p className="text-[10px] text-gray-400">Supported files: .xlsx or .xls (Columns: Batch Name, Assignment Trainers, Batch ID)</p>
                </div>
              </div>

              <button
                type="submit"
                disabled={!excelFile || importingExcel}
                className="w-full py-2.5 bg-violet-800 hover:bg-violet-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold shadow-lg shadow-violet-500/10 flex items-center justify-center gap-2"
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
        </>
      )}
    </div>
  );
};

export default BatchManagement;
