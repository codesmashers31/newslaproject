import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import { toast } from 'react-hot-toast';
import { Plus, Edit2, Trash2, X, BookOpen, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const BatchManagement = () => {
  const [batches, setBatches] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    course: '',
    status: 'Active',
    trainers: [],
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

  useEffect(() => {
    loadData();
  }, []);

  const openAddModal = () => {
    setEditingBatch(null);
    setFormData({
      name: '',
      course: '',
      status: 'Active',
      trainers: [],
    });
    setModalOpen(true);
  };

  const openEditModal = (batch) => {
    setEditingBatch(batch);
    setFormData({
      name: batch.name,
      course: batch.course,
      status: batch.status || 'Active',
      trainers: batch.trainers?.map(t => typeof t === 'object' ? t._id : t) || [],
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = {
        name: formData.name,
        course: formData.course,
        status: formData.status,
        trainers: formData.trainers,
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">Batch Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">Configure active training groups and status trackers</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-md shadow-indigo-500/20 duration-200 cursor-pointer"
        >
          <Plus size={16} />
          <span>Create Batch</span>
        </button>
      </div>

      {/* Grid of Batches */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
          {Array(2).fill(0).map((_, i) => (
            <div key={i} className="h-44 bg-gray-200 dark:bg-gray-800 rounded-3xl" />
          ))}
        </div>
      ) : batches.length === 0 ? (
        <div className="text-center py-10 bg-white/70 dark:bg-[#12131a]/80 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 text-gray-500">
          No batches defined. Click Create Batch to get started.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {batches.map((batch) => (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              key={batch._id}
              className="bg-white/70 dark:bg-[#12131a]/80 border border-gray-200 dark:border-gray-800/80 rounded-[24px] p-6 shadow-sm hover:shadow-md hover:shadow-indigo-500/5 hover:-translate-y-1 duration-300 transition-all flex flex-col justify-between"
            >
              <div>
                {/* Title & Actions */}
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <BookOpen size={20} className="text-indigo-500" />
                        {batch.name}
                      </h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                        batch.status === 'Active'
                          ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400'
                          : 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400'
                      }`}>
                        {batch.status || 'Active'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 font-semibold uppercase tracking-wider">{batch.course}</p>
                  </div>
                  <div className="flex space-x-1.5 bg-gray-50 dark:bg-[#181922] p-1 rounded-xl border border-gray-100 dark:border-gray-800">
                    <button
                      onClick={() => openEditModal(batch)}
                      className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg text-gray-500 hover:text-indigo-500 transition-colors cursor-pointer"
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
                </div>

                <hr className="my-4 border-gray-200 dark:border-gray-800" />

                {/* Students Count Box */}
                <div className="bg-gray-50/50 dark:bg-[#181922] p-4 rounded-xl border border-gray-200 dark:border-gray-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 font-bold text-gray-700 dark:text-gray-300">
                    <Users size={16} className="text-indigo-500" />
                    <span>Enrolled Students</span>
                  </div>
                  <span className="bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-lg font-extrabold text-[11px] shadow-sm">
                    {batch.students?.length || 0} Students
                  </span>
                </div>

                {/* Assigned Trainers Box */}
                <div className="mt-3 bg-gray-50/20 dark:bg-[#181922]/40 p-3.5 rounded-xl border border-gray-200 dark:border-gray-800/60 text-xs">
                  <p className="text-[10px] font-extrabold text-indigo-500 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                    <GraduationCap size={13} />
                    <span>Assigned Trainers</span>
                  </p>
                  <p className="text-xs text-gray-700 dark:text-gray-300 font-semibold leading-relaxed">
                    {batch.trainers && batch.trainers.length > 0
                      ? batch.trainers.map(t => `${t.name} (${t.role})`).join(' • ')
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
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={() => setModalOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 m-auto max-w-md h-fit bg-white dark:bg-[#12131a] rounded-[24px] shadow-2xl z-50 border border-gray-200 dark:border-gray-800 p-6 space-y-6"
            >
              <div className="flex items-center justify-between border-b pb-3 border-gray-200 dark:border-gray-800">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{editingBatch ? 'Edit Batch Details' : 'Create New Batch'}</h3>
                <button onClick={() => setModalOpen(false)} className="text-gray-500 dark:text-gray-400 hover:text-rose-500 duration-200 cursor-pointer">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider block mb-1">Batch Name</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-800 rounded-xl bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 text-gray-900 dark:text-white"
                      placeholder="e.g. MERN-2026-A"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider block mb-1">Course Title</label>
                    <input
                      type="text"
                      required
                      value={formData.course}
                      onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-800 rounded-xl bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 text-gray-900 dark:text-white"
                      placeholder="e.g. Full Stack MERN"
                    />
                  </div>
                   <div>
                    <label className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider block mb-1">Batch Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-[#12131a] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 text-gray-900 dark:text-white cursor-pointer"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider block mb-1">Assign Trainers (Multiple Select)</label>
                    <div className="max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-800 rounded-xl p-3 bg-gray-50 dark:bg-[#181922] space-y-3">
                      {['Technical Trainer', 'Communication Trainer', 'Aptitude Trainer'].map(role => {
                        const roleTrainers = trainers.filter(t => t.role === role);
                        if (roleTrainers.length === 0) return null;
                        return (
                          <div key={role} className="space-y-1">
                            <p className="text-[10px] font-extrabold text-indigo-500 uppercase tracking-wide border-b border-gray-100 dark:border-gray-850 pb-0.5 mb-1.5">{role}s</p>
                            {roleTrainers.map(t => {
                              const isChecked = formData.trainers?.includes(t._id);
                              return (
                                <label key={t._id} className="flex items-center space-x-2 text-xs font-semibold text-gray-700 dark:text-gray-300 cursor-pointer select-none py-0.5">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={(e) => {
                                      const updatedTrainers = e.target.checked
                                        ? [...(formData.trainers || []), t._id]
                                        : (formData.trainers || []).filter(id => id !== t._id);
                                      setFormData({ ...formData, trainers: updatedTrainers });
                                    }}
                                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                                  />
                                  <span>{t.name}</span>
                                </label>
                              );
                            })}
                          </div>
                        );
                      })}
                      {trainers.length === 0 && (
                        <p className="text-xs text-gray-400 italic">No trainers available.</p>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 mt-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 cursor-pointer"
                >
                  {editingBatch ? 'Save Changes' : 'Create Batch'}
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BatchManagement;
