import React, { useState, useEffect } from 'react';
import API, { BACKEND_URL } from '../../services/api';
import { toast } from 'react-hot-toast';
import { Briefcase, CheckSquare, Square, X, Calendar, Edit2, Upload, FileDown, Clock, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PlacementManagement = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Forms
  const [formData, setFormData] = useState({
    resumeUploaded: false,
    mockInterviewCompleted: false,
    technicalInterviewCompleted: false,
    hrInterviewCompleted: false,
    companyName: '',
    interviewDate: '',
    status: 'Not Started',
    joiningDate: '',
  });
  const [offerLetterFile, setOfferLetterFile] = useState(null);

  const loadStudents = async () => {
    setLoading(true);
    try {
      const { data } = await API.get('/admin/students');
      setStudents(data);
    } catch (error) {
      toast.error('Failed to load students placement log');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const openUpdateModal = (student) => {
    setSelectedStudent(student);
    const p = student.placement || {};
    setFormData({
      resumeUploaded: p.resumeUploaded || false,
      mockInterviewCompleted: p.mockInterviewCompleted || false,
      technicalInterviewCompleted: p.technicalInterviewCompleted || false,
      hrInterviewCompleted: p.hrInterviewCompleted || false,
      companyName: p.companyName || '',
      interviewDate: p.interviewDate ? new Date(p.interviewDate).toISOString().split('T')[0] : '',
      status: p.status || 'Not Started',
      joiningDate: p.joiningDate ? new Date(p.joiningDate).toISOString().split('T')[0] : '',
    });
    setOfferLetterFile(null);
    setModalOpen(true);
  };

  const handleCheckboxChange = (field) => {
    setFormData(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const updateData = new FormData();
    updateData.append('resumeUploaded', formData.resumeUploaded);
    updateData.append('mockInterviewCompleted', formData.mockInterviewCompleted);
    updateData.append('technicalInterviewCompleted', formData.technicalInterviewCompleted);
    updateData.append('hrInterviewCompleted', formData.hrInterviewCompleted);
    updateData.append('companyName', formData.companyName);
    updateData.append('status', formData.status);
    if (formData.interviewDate) updateData.append('interviewDate', formData.interviewDate);
    if (formData.joiningDate) updateData.append('joiningDate', formData.joiningDate);
    if (offerLetterFile) updateData.append('offerLetter', offerLetterFile);

    try {
      await API.put(`/admin/placements/${selectedStudent._id}`, updateData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Placement details updated successfully!');
      setModalOpen(false);
      loadStudents();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error updating placement log');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">Placement Pipeline</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">Audit mock schedules, update interview tracks, and upload offer letters</p>
      </div>

      {/* Pipeline Grid */}
      <div className="bg-white/70 dark:bg-[#12131a]/80 border border-gray-200 dark:border-gray-800 rounded-[24px] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider bg-gray-50/50 dark:bg-gray-900/30">
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4">Preparation Checklist</th>
                <th className="px-6 py-4">Company Details</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {loading ? (
                <tr>
                  <td colSpan="5" className="text-center py-10">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto"></div>
                    <span className="text-xs text-gray-400 mt-2 block font-semibold">Loading placement records...</span>
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-10 text-gray-500 dark:text-gray-400 text-sm">
                    No student placement records found.
                  </td>
                </tr>
              ) : (
                students.map((student) => {
                  const p = student.placement || {};
                  return (
                    <tr key={student._id} className="hover:bg-gray-50/30 dark:hover:bg-gray-900/10 transition-colors">
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-gray-800 dark:text-white">{student.name}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 font-semibold">{student.batch ? student.batch.name : 'Unassigned Batch'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-gray-500 dark:text-gray-400 font-semibold">
                          <div className="flex items-center gap-1">
                            {p.resumeUploaded ? <CheckCircle size={13} className="text-emerald-500" /> : <Square size={13} className="text-gray-300 dark:text-gray-700" />}
                            <span>Resume</span>
                          </div>
                          <div className="flex items-center gap-1">
                            {p.mockInterviewCompleted ? <CheckCircle size={13} className="text-emerald-500" /> : <Square size={13} className="text-gray-300 dark:text-gray-700" />}
                            <span>Mock</span>
                          </div>
                          <div className="flex items-center gap-1">
                            {p.technicalInterviewCompleted ? <CheckCircle size={13} className="text-emerald-500" /> : <Square size={13} className="text-gray-300 dark:text-gray-700" />}
                            <span>Technical</span>
                          </div>
                          <div className="flex items-center gap-1">
                            {p.hrInterviewCompleted ? <CheckCircle size={13} className="text-emerald-500" /> : <Square size={13} className="text-gray-300 dark:text-gray-700" />}
                            <span>HR</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold">
                        {p.companyName ? (
                          <div>
                            <p className="font-extrabold text-gray-800 dark:text-white">{p.companyName}</p>
                            {p.interviewDate && (
                              <p className="text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5 font-medium">
                                <Clock size={11} className="text-indigo-500" />
                                Interview: {new Date(p.interviewDate).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-600 italic">No schedules logged</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                          p.status === 'Offer Received' || p.status === 'Selected'
                            ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400'
                            : p.status === 'Pending'
                            ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400'
                            : p.status === 'Rejected'
                            ? 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-500'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                        }`}>
                          {p.status || 'Not Started'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => openUpdateModal(student)}
                          className="px-3.5 py-2 border border-gray-200 dark:border-gray-800 rounded-xl text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-900 inline-flex items-center gap-1.5 text-xs font-bold transition-all duration-200 cursor-pointer"
                        >
                          <Edit2 size={13} />
                          <span>Update</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* UPDATE PLACEMENT DETAILS MODAL */}
      <AnimatePresence>
        {modalOpen && selectedStudent && (
          <>
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={() => setModalOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 m-auto max-w-lg h-[80vh] overflow-y-auto bg-white dark:bg-[#12131a] rounded-[24px] shadow-2xl z-50 border border-gray-200 dark:border-gray-800 p-6 space-y-6"
            >
              <div className="flex items-center justify-between border-b pb-3 border-gray-200 dark:border-gray-800">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Update Placement Details</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-medium">Log training completions and interview details for {selectedStudent.name}</p>
                </div>
                <button onClick={() => setModalOpen(false)} className="text-gray-500 dark:text-gray-400 hover:text-rose-500 duration-200">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Checkboxes */}
                <div>
                  <label className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider block mb-2">Checklist Milestones</label>
                  <div className="grid grid-cols-2 gap-3.5 p-3.5 border border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50/50 dark:bg-gray-900/10">
                    <label className="flex items-center space-x-2.5 text-xs font-semibold text-gray-700 dark:text-gray-300 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={formData.resumeUploaded}
                        onChange={() => handleCheckboxChange('resumeUploaded')}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                      />
                      <span>Resume Uploaded</span>
                    </label>
                    <label className="flex items-center space-x-2.5 text-xs font-semibold text-gray-700 dark:text-gray-300 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={formData.mockInterviewCompleted}
                        onChange={() => handleCheckboxChange('mockInterviewCompleted')}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                      />
                      <span>Mock Interview</span>
                    </label>
                    <label className="flex items-center space-x-2.5 text-xs font-semibold text-gray-700 dark:text-gray-300 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={formData.technicalInterviewCompleted}
                        onChange={() => handleCheckboxChange('technicalInterviewCompleted')}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                      />
                      <span>Technical Interview</span>
                    </label>
                    <label className="flex items-center space-x-2.5 text-xs font-semibold text-gray-700 dark:text-gray-300 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={formData.hrInterviewCompleted}
                        onChange={() => handleCheckboxChange('hrInterviewCompleted')}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                      />
                      <span>HR Interview</span>
                    </label>
                  </div>
                </div>

                {/* Company Name & status */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider block mb-1">Company Name</label>
                    <input
                      type="text"
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-800 rounded-xl bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 text-gray-900 dark:text-white"
                      placeholder="e.g. Google"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider block mb-1">Placement Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-[#12131a] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 text-gray-900 dark:text-white"
                    >
                      <option value="Not Started">Not Started</option>
                      <option value="Pending">Pending / Interviewing</option>
                      <option value="Selected">Selected</option>
                      <option value="Offer Received">Offer Received</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider block mb-1">Interview Date</label>
                    <input
                      type="date"
                      value={formData.interviewDate}
                      onChange={(e) => setFormData({ ...formData, interviewDate: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-800 rounded-xl bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider block mb-1">Joining Date</label>
                    <input
                      type="date"
                      value={formData.joiningDate}
                      onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-800 rounded-xl bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Offer Letter document upload */}
                <div>
                  <label className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider block mb-1.5">Offer Letter Document</label>
                  <div className="border border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-4 text-center relative hover:bg-indigo-50/10 dark:hover:bg-indigo-950/10 cursor-pointer duration-200 transition-colors">
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={(e) => setOfferLetterFile(e.target.files[0])}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="flex items-center justify-center space-x-2 text-xs text-gray-500 dark:text-gray-400 font-bold">
                      <Upload size={14} className="text-indigo-500" />
                      <span>{offerLetterFile ? offerLetterFile.name : 'Select PDF or Image File'}</span>
                    </div>
                  </div>
                  {selectedStudent.placement?.offerLetterUrl && (
                    <a 
                      href={`${BACKEND_URL}${selectedStudent.placement.offerLetterUrl}`} 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline mt-2 flex items-center gap-1 font-bold"
                    >
                      <FileDown size={11} />
                      <span>View existing offer letter document</span>
                    </a>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full py-3 mt-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 cursor-pointer"
                >
                  Save Placement Progress
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PlacementManagement;
