import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import { toast } from 'react-hot-toast';
import { Plus, Edit2, Trash2, X, Calendar, BookOpen, GraduationCap, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const BatchManagement = () => {
  const [batches, setBatches] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    course: '',
    trainers: [],
    students: [],
    startDate: '',
    endDate: '',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const batchRes = await API.get('/admin/batches');
      setBatches(batchRes.data);

      const trainerRes = await API.get('/admin/trainers');
      setTrainers(trainerRes.data);

      const studentRes = await API.get('/admin/students');
      setStudents(studentRes.data);
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
      trainers: [],
      students: [],
      startDate: '',
      endDate: '',
    });
    setModalOpen(true);
  };

  const openEditModal = (batch) => {
    setEditingBatch(batch);
    setFormData({
      name: batch.name,
      course: batch.course,
      trainers: batch.trainers.map(t => t._id),
      students: batch.students.map(s => s._id),
      startDate: batch.startDate ? new Date(batch.startDate).toISOString().split('T')[0] : '',
      endDate: batch.endDate ? new Date(batch.endDate).toISOString().split('T')[0] : '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingBatch) {
        await API.put(`/admin/batches/${editingBatch._id}`, formData);
        toast.success('Batch updated successfully!');
      } else {
        await API.post('/admin/batches', formData);
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

  const handleCheckboxChange = (id, field) => {
    const list = formData[field];
    if (list.includes(id)) {
      setFormData({ ...formData, [field]: list.filter(item => item !== id) });
    } else {
      setFormData({ ...formData, [field]: [...list, id] });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Batch Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Configure active training groups and enroll users</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-md shadow-indigo-500/20"
        >
          <Plus size={16} />
          <span>Create Batch</span>
        </button>
      </div>

      {/* Grid of Batches */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
          {Array(2).fill(0).map((_, i) => (
            <div key={i} className="h-60 bg-gray-200 dark:bg-gray-800 rounded-3xl" />
          ))}
        </div>
      ) : batches.length === 0 ? (
        <div className="text-center py-10 bg-white/60 dark:bg-[#12131a]/60 border border-gray-250 dark:border-gray-800 rounded-3xl p-6 text-gray-500">
          No batches defined. Click Create Batch to get started.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {batches.map((batch) => (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              key={batch._id}
              className="bg-white/60 dark:bg-[#12131a]/60 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between"
            >
              <div>
                {/* Title & Actions */}
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      <BookOpen size={20} className="text-indigo-600 dark:text-indigo-400" />
                      {batch.name}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{batch.course}</p>
                  </div>
                  <div className="flex space-x-1.5">
                    <button
                      onClick={() => openEditModal(batch)}
                      className="p-1.5 hover:bg-gray-150 dark:hover:bg-gray-800 rounded-lg text-gray-500 hover:text-indigo-600"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(batch._id)}
                      className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg text-gray-505 hover:text-red-650"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Timeline */}
                <div className="mt-4 flex items-center space-x-2 text-xs text-gray-500">
                  <Calendar size={14} />
                  <span>
                    {new Date(batch.startDate).toLocaleDateString()} - {new Date(batch.endDate).toLocaleDateString()}
                  </span>
                </div>

                <hr className="my-4 border-gray-200 dark:border-gray-850" />

                {/* Assigned List */}
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <p className="font-semibold text-gray-400 uppercase tracking-wider text-[10px] mb-2 flex items-center gap-1">
                      <GraduationCap size={13} />
                      Trainers ({batch.trainers?.length || 0})
                    </p>
                    <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1">
                      {batch.trainers?.length === 0 ? (
                        <span className="italic text-gray-400">None assigned</span>
                      ) : (
                        batch.trainers.map(t => (
                          <div key={t._id} className="bg-indigo-50/40 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 p-1.5 rounded-lg font-medium truncate">
                            {t.name}
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="font-semibold text-gray-400 uppercase tracking-wider text-[10px] mb-2 flex items-center gap-1">
                      <Users size={13} />
                      Students ({batch.students?.length || 0})
                    </p>
                    <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1">
                      {batch.students?.length === 0 ? (
                        <span className="italic text-gray-400">None assigned</span>
                      ) : (
                        batch.students.map(s => (
                          <div key={s._id} className="bg-gray-100 dark:bg-gray-900/50 p-1.5 rounded-lg truncate text-gray-700 dark:text-gray-300">
                            {s.name}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
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
              className="fixed inset-0 m-auto max-w-2xl h-[85vh] overflow-y-auto bg-white dark:bg-[#12131a] rounded-3xl shadow-2xl z-50 border border-gray-200 dark:border-gray-800 p-6 space-y-6"
            >
              <div className="flex items-center justify-between border-b pb-3 border-gray-150 dark:border-gray-850">
                <h3 className="text-lg font-bold">{editingBatch ? 'Edit Batch' : 'Create Batch'}</h3>
                <button onClick={() => setModalOpen(false)} className="text-gray-500">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider block mb-1">Batch Name</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl bg-transparent dark:border-gray-850 text-sm focus:outline-none"
                      placeholder="e.g. MERN-2026-A"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider block mb-1">Course Title</label>
                    <input
                      type="text"
                      required
                      value={formData.course}
                      onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl bg-transparent dark:border-gray-850 text-sm focus:outline-none"
                      placeholder="e.g. Full Stack MERN"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider block mb-1">Start Date</label>
                    <input
                      type="date"
                      required
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl bg-transparent dark:border-gray-850 text-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider block mb-1">End Date</label>
                    <input
                      type="date"
                      required
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl bg-transparent dark:border-gray-850 text-sm focus:outline-none"
                    />
                  </div>
                </div>

                <hr className="border-gray-200 dark:border-gray-850" />

                {/* Checklist for Trainers */}
                <div>
                  <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider block mb-2">Assign Trainers</label>
                  <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border dark:border-gray-850 p-3 rounded-xl">
                    {trainers.map(t => (
                      <label key={t._id} className="flex items-center space-x-2 text-xs font-medium cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.trainers.includes(t._id)}
                          onChange={() => handleCheckboxChange(t._id, 'trainers')}
                          className="rounded text-indigo-600"
                        />
                        <span>{t.name} ({t.role.replace(' Trainer', '')})</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Checklist for Students */}
                <div>
                  <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider block mb-2">Enroll Students</label>
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border dark:border-gray-850 p-3 rounded-xl">
                    {students.map(s => (
                      <label key={s._id} className="flex items-center space-x-2 text-xs font-medium cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.students.includes(s._id)}
                          onChange={() => handleCheckboxChange(s._id, 'students')}
                          className="rounded text-indigo-600"
                        />
                        <span>{s.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 mt-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/20"
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
