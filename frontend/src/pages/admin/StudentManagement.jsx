import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import { toast } from 'react-hot-toast';
import { 
  Plus, 
  Search, 
  Filter, 
  Trash2, 
  Edit2, 
  Eye, 
  Upload, 
  FileDown, 
  FileSpreadsheet, 
  UserCheck, 
  X,
  Calendar,
  Briefcase
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import { motion, AnimatePresence } from 'framer-motion';

const StudentManagement = () => {
  const [students, setStudents] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedPlacement, setSelectedPlacement] = useState('');

  // Modals & Drawers States
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [excelFile, setExcelFile] = useState(null);

  // Forms
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    password: '',
    batchId: '',
  });

  const [editFormData, setEditFormData] = useState({
    id: '',
    name: '',
    email: '',
    mobile: '',
    status: 'Active',
    collegeName: '',
    degree: '',
    department: '',
    yearOfPassing: '',
    gender: '',
    address: '',
    skills: '',
    bio: '',
    linkedin: '',
    github: '',
    batchId: '',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const batchRes = await API.get('/admin/batches');
      setBatches(batchRes.data);

      const params = {};
      if (search) params.search = search;
      if (selectedBatch) params.batchId = selectedBatch;
      if (selectedPlacement) params.placementStatus = selectedPlacement;

      const studentRes = await API.get('/admin/students', { params });
      setStudents(studentRes.data);
    } catch (error) {
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedBatch, selectedPlacement]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadData();
  };

  // Add student submit
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post('/admin/students', formData);
      toast.success('Student added successfully!');
      setCreateModalOpen(false);
      setFormData({ name: '', email: '', mobile: '', password: '', batchId: '' });
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error adding student');
    }
  };

  // Edit student submit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.put(`/admin/students/${editFormData.id}`, editFormData);
      toast.success('Student updated successfully!');
      setEditModalOpen(false);
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error updating student');
    }
  };

  // Delete student
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this student? This will clear all attendance and scorecard metrics.')) {
      try {
        await API.delete(`/admin/students/${id}`);
        toast.success('Student deleted successfully');
        loadData();
      } catch (error) {
        toast.error('Error deleting student');
      }
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

    try {
      const { data } = await API.post('/admin/students/import', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success(data.message || 'Imported students successfully!');
      setImportModalOpen(false);
      setExcelFile(null);
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error importing Excel sheet');
    }
  };

  // Export to Excel client-side
  const exportToExcel = () => {
    if (students.length === 0) {
      toast.error('No student data to export');
      return;
    }

    const dataToExport = students.map(s => ({
      'Full Name': s.name,
      'Email': s.email,
      'Mobile': s.mobile,
      'Status': s.status,
      'Batch': s.batch ? s.batch.name : 'Unassigned',
      'Course': s.batch ? s.batch.course : 'N/A',
      'College': s.profile?.collegeName || '',
      'Degree': s.profile?.degree || '',
      'Department': s.profile?.department || '',
      'Year of Passing': s.profile?.yearOfPassing || '',
      'Placement Status': s.placement?.status || 'Not Started',
      'Company Placed': s.placement?.companyName || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');
    XLSX.writeFile(workbook, 'Students_Report.xlsx');
    toast.success('Excel file downloaded!');
  };

  // Export to PDF client-side
  const exportToPDF = () => {
    if (students.length === 0) {
      toast.error('No student data to export');
      return;
    }

    const doc = new jsPDF();
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('LCP System - Students Enrollment Report', 14, 20);
    doc.setFontSize(10);
    doc.setFont('Helvetica', 'normal');
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 26);

    let yPosition = 35;
    
    doc.setFillColor(99, 102, 241); // Indigo color header
    doc.rect(14, yPosition, 182, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('Helvetica', 'bold');
    doc.text('Name', 16, yPosition + 6);
    doc.text('Email', 55, yPosition + 6);
    doc.text('Mobile', 105, yPosition + 6);
    doc.text('Batch', 138, yPosition + 6);
    doc.text('Placement Status', 165, yPosition + 6);

    yPosition += 8;
    doc.setTextColor(0, 0, 0);
    doc.setFont('Helvetica', 'normal');

    students.forEach((s, index) => {
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }
      
      // Zebra striping
      if (index % 2 === 0) {
        doc.setFillColor(243, 244, 246);
        doc.rect(14, yPosition, 182, 8, 'F');
      }

      doc.text(s.name.substring(0, 18), 16, yPosition + 6);
      doc.text(s.email.substring(0, 24), 55, yPosition + 6);
      doc.text(s.mobile, 105, yPosition + 6);
      doc.text(s.batch ? s.batch.name : 'Unassigned', 138, yPosition + 6);
      doc.text(s.placement ? s.placement.status : 'Not Started', 165, yPosition + 6);
      yPosition += 8;
    });

    doc.save('Students_Report.pdf');
    toast.success('PDF report downloaded!');
  };

  const openEditModal = (student) => {
    setSelectedStudent(student);
    setEditFormData({
      id: student._id,
      name: student.name,
      email: student.email,
      mobile: student.mobile,
      status: student.status,
      collegeName: student.profile?.collegeName || '',
      degree: student.profile?.degree || '',
      department: student.profile?.department || '',
      yearOfPassing: student.profile?.yearOfPassing || '',
      gender: student.profile?.gender || '',
      address: student.profile?.address || '',
      skills: student.profile?.skills?.join(', ') || '',
      bio: student.profile?.bio || '',
      linkedin: student.profile?.linkedin || '',
      github: student.profile?.github || '',
      batchId: student.batch?._id || '',
    });
    setEditModalOpen(true);
  };

  const openDetailsModal = (student) => {
    setSelectedStudent(student);
    setDetailsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Students Directory</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Enroll, edit, and audit student scores and portfolios</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-md shadow-indigo-500/20"
          >
            <Plus size={16} />
            <span>Add Student</span>
          </button>

          <button 
            onClick={() => setImportModalOpen(true)}
            className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-md shadow-purple-500/20"
          >
            <Upload size={16} />
            <span>Import Excel</span>
          </button>

          <button 
            onClick={exportToExcel}
            className="flex items-center space-x-2 border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#12131a] px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-900"
          >
            <FileSpreadsheet size={16} className="text-emerald-600" />
            <span>Export Excel</span>
          </button>

          <button 
            onClick={exportToPDF}
            className="flex items-center space-x-2 border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#12131a] px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-900"
          >
            <FileDown size={16} className="text-rose-600" />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <form onSubmit={handleSearchSubmit} className="bg-white/60 dark:bg-[#12131a]/60 border border-gray-200 dark:border-gray-800 p-4 rounded-2xl backdrop-blur-md grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
        {/* Search */}
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Search by name, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-400"
          />
        </div>

        {/* Batch Filter */}
        <div>
          <select
            value={selectedBatch}
            onChange={(e) => setSelectedBatch(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#12131a] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-400"
          >
            <option value="">All Batches</option>
            {batches.map(b => (
              <option key={b._id} value={b._id}>{b.name}</option>
            ))}
          </select>
        </div>

        {/* Placement Filter */}
        <div>
          <select
            value={selectedPlacement}
            onChange={(e) => setSelectedPlacement(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#12131a] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-400"
          >
            <option value="">All Placement Statuses</option>
            <option value="Not Started">Not Started</option>
            <option value="Pending">Pending/Interviewing</option>
            <option value="Selected">Selected</option>
            <option value="Offer Received">Offer Received</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>

        {/* Search Action */}
        <button 
          type="submit"
          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold flex items-center justify-center space-x-2 shadow-lg shadow-indigo-500/10"
        >
          <Filter size={16} />
          <span>Apply Filters</span>
        </button>
      </form>

      {/* Students Table */}
      <div className="bg-white/60 dark:bg-[#12131a]/60 border border-gray-200 dark:border-gray-800 rounded-3xl backdrop-blur-md overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800 text-gray-500 text-xs font-semibold uppercase tracking-wider bg-gray-50/50 dark:bg-gray-900/30">
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4">Mobile</th>
                <th className="px-6 py-4">Batch</th>
                <th className="px-6 py-4">Placement</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-850">
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-10">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto"></div>
                    <span className="text-xs text-gray-400 mt-2 block">Loading students directory...</span>
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-10 text-gray-500 dark:text-gray-450 text-sm">
                    No students match the criteria.
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr key={student._id} className="hover:bg-gray-50/30 dark:hover:bg-gray-900/10 transition-colors">
                    <td className="px-6 py-4 flex items-center space-x-3">
                      <div className="h-9 w-9 rounded-lg bg-indigo-100 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center">
                        {student.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{student.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{student.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {student.mobile}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {student.batch ? (
                        <div>
                          <p className="font-semibold text-gray-800 dark:text-gray-300">{student.batch.name}</p>
                          <p className="text-[10px] text-gray-500">{student.batch.course}</p>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                        student.placement?.status === 'Offer Received' || student.placement?.status === 'Selected'
                          ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400'
                          : student.placement?.status === 'Pending'
                          ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400'
                          : student.placement?.status === 'Rejected'
                          ? 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                      }`}>
                        {student.placement?.status || 'Not Started'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                        student.status === 'Active' 
                          ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400'
                          : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
                      }`}>
                        {student.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button 
                        onClick={() => openDetailsModal(student)}
                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-500 hover:text-indigo-600 transition-colors"
                        title="View Scorecards"
                      >
                        <Eye size={16} />
                      </button>
                      <button 
                        onClick={() => openEditModal(student)}
                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-500 hover:text-indigo-650 transition-colors"
                        title="Edit Profile"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(student._id)}
                        className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg text-gray-505 hover:text-red-650 transition-colors"
                        title="Delete Student"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE STUDENT MODAL */}
      <AnimatePresence>
        {createModalOpen && (
          <>
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={() => setCreateModalOpen(false)} />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 m-auto max-w-lg h-fit bg-white dark:bg-[#12131a] rounded-3xl shadow-2xl z-50 overflow-hidden border border-gray-200 dark:border-gray-800 p-6 space-y-6"
            >
              <div className="flex items-center justify-between border-b border-gray-150 dark:border-gray-850 pb-3">
                <h3 className="text-lg font-bold">Add Student</h3>
                <button onClick={() => setCreateModalOpen(false)} className="text-gray-500 dark:text-gray-400">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreateSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider block mb-1.5">Full Name</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-850 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-indigo-650"
                      placeholder="Name"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider block mb-1.5">Mobile Number</label>
                    <input
                      type="tel"
                      required
                      value={formData.mobile}
                      onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-850 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-indigo-650"
                      placeholder="Mobile"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider block mb-1.5">Email Address</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-850 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-indigo-650"
                    placeholder="email@domain.com"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider block mb-1.5">Initial Password</label>
                    <input
                      type="password"
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-850 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-indigo-650"
                      placeholder="password123"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider block mb-1.5">Assign Batch</label>
                    <select
                      value={formData.batchId}
                      onChange={(e) => setFormData({ ...formData, batchId: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-850 bg-white dark:bg-[#12131a] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-650"
                    >
                      <option value="">No Batch Assigned</option>
                      {batches.map(b => (
                        <option key={b._id} value={b._id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-500/20"
                >
                  Create Student Account
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* EDIT STUDENT MODAL / DRAWER */}
      <AnimatePresence>
        {editModalOpen && (
          <>
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={() => setEditModalOpen(false)} />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 max-w-xl w-full bg-white dark:bg-[#12131a] shadow-2xl z-50 overflow-y-auto border-l border-gray-200 dark:border-gray-800 p-6 space-y-6"
            >
              <div className="flex items-center justify-between border-b border-gray-150 dark:border-gray-850 pb-3">
                <h3 className="text-lg font-bold">Edit Student Details</h3>
                <button onClick={() => setEditModalOpen(false)} className="text-gray-500 dark:text-gray-400">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-4 text-xs font-semibold text-gray-600 dark:text-gray-400">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1.5 uppercase">Full Name</label>
                    <input
                      type="text"
                      required
                      value={editFormData.name}
                      onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl bg-transparent dark:border-gray-850 text-gray-900 dark:text-gray-100 text-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block mb-1.5 uppercase">Mobile Number</label>
                    <input
                      type="text"
                      required
                      value={editFormData.mobile}
                      onChange={(e) => setEditFormData({ ...editFormData, mobile: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl bg-transparent dark:border-gray-850 text-gray-900 dark:text-gray-100 text-sm focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1.5 uppercase">Email Address</label>
                    <input
                      type="email"
                      required
                      value={editFormData.email}
                      onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl bg-transparent dark:border-gray-850 text-gray-900 dark:text-gray-100 text-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block mb-1.5 uppercase">Status</label>
                    <select
                      value={editFormData.status}
                      onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl bg-white dark:bg-[#12131a] dark:border-gray-850 text-gray-900 dark:text-gray-100 text-sm focus:outline-none"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1.5 uppercase">Assign Batch</label>
                    <select
                      value={editFormData.batchId}
                      onChange={(e) => setEditFormData({ ...editFormData, batchId: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl bg-white dark:bg-[#12131a] dark:border-gray-850 text-gray-900 dark:text-gray-100 text-sm focus:outline-none"
                    >
                      <option value="">No Batch Assigned</option>
                      {batches.map(b => (
                        <option key={b._id} value={b._id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block mb-1.5 uppercase">College Name</label>
                    <input
                      type="text"
                      value={editFormData.collegeName}
                      onChange={(e) => setEditFormData({ ...editFormData, collegeName: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl bg-transparent dark:border-gray-850 text-gray-900 dark:text-gray-100 text-sm focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block mb-1.5 uppercase">Degree</label>
                    <input
                      type="text"
                      value={editFormData.degree}
                      onChange={(e) => setEditFormData({ ...editFormData, degree: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl bg-transparent dark:border-gray-850 text-gray-900 dark:text-gray-100 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block mb-1.5 uppercase">Department</label>
                    <input
                      type="text"
                      value={editFormData.department}
                      onChange={(e) => setEditFormData({ ...editFormData, department: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl bg-transparent dark:border-gray-850 text-gray-900 dark:text-gray-100 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block mb-1.5 uppercase">YOP (Year)</label>
                    <input
                      type="text"
                      value={editFormData.yearOfPassing}
                      onChange={(e) => setEditFormData({ ...editFormData, yearOfPassing: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl bg-transparent dark:border-gray-850 text-gray-900 dark:text-gray-100 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block mb-1.5 uppercase">Skills (comma-separated)</label>
                  <input
                    type="text"
                    value={editFormData.skills}
                    onChange={(e) => setEditFormData({ ...editFormData, skills: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl bg-transparent dark:border-gray-850 text-gray-900 dark:text-gray-100 text-sm"
                    placeholder="React, CSS, Express, MongoDB"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1.5 uppercase">LinkedIn</label>
                    <input
                      type="text"
                      value={editFormData.linkedin}
                      onChange={(e) => setEditFormData({ ...editFormData, linkedin: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl bg-transparent dark:border-gray-850 text-gray-900 dark:text-gray-100 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block mb-1.5 uppercase">GitHub</label>
                    <input
                      type="text"
                      value={editFormData.github}
                      onChange={(e) => setEditFormData({ ...editFormData, github: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl bg-transparent dark:border-gray-850 text-gray-900 dark:text-gray-100 text-sm"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 mt-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-500/20"
                >
                  Save Profile Changes
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* IMPORT FROM EXCEL MODAL */}
      <AnimatePresence>
        {importModalOpen && (
          <>
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={() => setImportModalOpen(false)} />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 m-auto max-w-md h-fit bg-white dark:bg-[#12131a] rounded-3xl shadow-2xl z-50 border border-gray-200 dark:border-gray-800 p-6 space-y-6"
            >
              <div className="flex items-center justify-between border-b border-gray-150 dark:border-gray-850 pb-3">
                <h3 className="text-lg font-bold">Import Students from Excel</h3>
                <button onClick={() => setImportModalOpen(false)} className="text-gray-500 dark:text-gray-400">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleExcelImport} className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl p-6 text-center hover:bg-indigo-50/10 transition-colors relative cursor-pointer">
                  <input
                    type="file"
                    accept=".xlsx, .xls"
                    onChange={(e) => setExcelFile(e.target.files[0])}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="space-y-2">
                    <div className="h-10 w-10 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center mx-auto">
                      <FileSpreadsheet size={24} />
                    </div>
                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                      {excelFile ? excelFile.name : 'Click or Drag Excel sheet here'}
                    </p>
                    <p className="text-[10px] text-gray-400">Supported files: .xlsx or .xls (Columns: Name, Email, Mobile)</p>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!excelFile}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-500/10"
                >
                  Upload & Import
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* STUDENT PROFILE & PROGRESS DETAILS MODAL */}
      <AnimatePresence>
        {detailsModalOpen && selectedStudent && (
          <>
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={() => setDetailsModalOpen(false)} />
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed inset-0 m-auto max-w-4xl w-full max-h-[85vh] overflow-y-auto bg-white dark:bg-[#12131a] rounded-3xl shadow-2xl z-50 border border-gray-200 dark:border-gray-800 p-6 space-y-6"
            >
              <div className="flex items-center justify-between border-b border-gray-150 dark:border-gray-850 pb-3">
                <div>
                  <h3 className="text-lg font-bold">{selectedStudent.name}'s Student File</h3>
                  <p className="text-xs text-gray-500">{selectedStudent.batch ? `${selectedStudent.batch.name} • ${selectedStudent.batch.course}` : 'Unassigned Batch'}</p>
                </div>
                <button onClick={() => setDetailsModalOpen(false)} className="text-gray-500 dark:text-gray-400">
                  <X size={20} />
                </button>
              </div>

              {/* Grid content */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Profile detail card */}
                <div className="bg-gray-50/50 dark:bg-gray-900/30 p-5 rounded-2xl border border-gray-150 dark:border-gray-850 space-y-4">
                  <div className="h-20 w-20 rounded-full bg-indigo-100 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 text-3xl font-bold flex items-center justify-center mx-auto shadow-md">
                    {selectedStudent.name.charAt(0)}
                  </div>
                  <div className="text-center">
                    <h4 className="font-bold text-sm">{selectedStudent.name}</h4>
                    <p className="text-xs text-gray-400 mt-0.5">{selectedStudent.email}</p>
                    <p className="text-xs text-gray-400">{selectedStudent.mobile}</p>
                  </div>
                  <hr className="border-gray-200 dark:border-gray-800" />
                  <div className="space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">College:</span>
                      <span className="font-semibold text-right">{selectedStudent.profile?.collegeName || 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Degree/Dept:</span>
                      <span className="font-semibold text-right">
                        {selectedStudent.profile?.degree ? `${selectedStudent.profile.degree} - ${selectedStudent.profile.department || ''}` : 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Passing Year:</span>
                      <span className="font-semibold">{selectedStudent.profile?.yearOfPassing || 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Skills:</span>
                      <div className="flex flex-wrap gap-1 justify-end max-w-[150px]">
                        {selectedStudent.profile?.skills?.length > 0 ? (
                          selectedStudent.profile.skills.map(sk => (
                            <span key={sk} className="bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 text-[9px] px-1.5 py-0.5 rounded-full font-medium">{sk}</span>
                          ))
                        ) : 'None listed'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Scorecards timeline */}
                <div className="md:col-span-2 space-y-4">
                  <h4 className="font-bold text-sm flex items-center gap-1.5">
                    <Briefcase size={16} className="text-indigo-600 dark:text-indigo-400" />
                    Student Milestones & Portfolios
                  </h4>

                  {/* Placement preparation log */}
                  <div className="bg-indigo-50/20 dark:bg-indigo-950/10 p-5 rounded-2xl border border-indigo-100/30 dark:border-indigo-900/10">
                    <h5 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mb-4 uppercase tracking-wider">Placement milestones</h5>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div className="flex items-center space-x-2">
                        <span className={`h-2 w-2 rounded-full ${selectedStudent.placement?.resumeUploaded ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                        <span className="text-gray-500">Resume Uploaded:</span>
                        <span className="font-semibold">{selectedStudent.placement?.resumeUploaded ? 'Yes' : 'No'}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`h-2 w-2 rounded-full ${selectedStudent.placement?.mockInterviewCompleted ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                        <span className="text-gray-500">Mock Interview:</span>
                        <span className="font-semibold">{selectedStudent.placement?.mockInterviewCompleted ? 'Completed' : 'Pending'}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`h-2 w-2 rounded-full ${selectedStudent.placement?.technicalInterviewCompleted ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                        <span className="text-gray-500">Tech Interview:</span>
                        <span className="font-semibold">{selectedStudent.placement?.technicalInterviewCompleted ? 'Completed' : 'Pending'}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`h-2 w-2 rounded-full ${selectedStudent.placement?.hrInterviewCompleted ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                        <span className="text-gray-500">HR Interview:</span>
                        <span className="font-semibold">{selectedStudent.placement?.hrInterviewCompleted ? 'Completed' : 'Pending'}</span>
                      </div>
                    </div>

                    {selectedStudent.placement?.status === 'Offer Received' || selectedStudent.placement?.status === 'Selected' ? (
                      <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-xl text-xs flex items-center justify-between">
                        <div>
                          <p className="font-bold text-emerald-600 dark:text-emerald-400">Placed successfully!</p>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400">Company: {selectedStudent.placement?.companyName}</p>
                        </div>
                        {selectedStudent.placement?.joiningDate && (
                          <span className="text-[10px] text-gray-400 block">Joining: {new Date(selectedStudent.placement.joiningDate).toLocaleDateString()}</span>
                        )}
                      </div>
                    ) : null}
                  </div>

                  {/* Standard instructions about student progress */}
                  <div className="p-4 bg-gray-50 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-800 rounded-2xl text-xs space-y-2">
                    <p className="font-semibold text-gray-500 uppercase tracking-wider text-[10px]">Academic scorecards Summary</p>
                    <p className="text-gray-500 dark:text-gray-400">
                      Module updating is managed by respective trainers. Student evaluations are conducted across Aptitude, Communication, and Technical tracks.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StudentManagement;
