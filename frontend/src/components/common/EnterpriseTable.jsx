import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter as FilterIcon, 
  ArrowUpDown, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight, 
  X, 
  RotateCcw,
  SlidersHorizontal,
  AlertCircle,
  FileSpreadsheet,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * EnterpriseTable - High-Performance, Accessible, Reusable Data Table Component
 * 
 * Props:
 *  - columns: Array of { key, header, render, width, align, sortable, priority }
 *  - data: Array of data objects
 *  - searchableFields: Array of string keys or accessor functions
 *  - filterDefinitions: Array of { key, label, type ('select'|'text'), options: [{label, value}] }
 *  - sortOptions: Array of { label, key, direction ('asc'|'desc') }
 *  - rowKey: String or Function (default: '_id' or 'id')
 *  - loading: Boolean
 *  - error: String | null
 *  - onRetry: Function
 *  - actions: Function (row) => JSX or Array of action objects
 *  - emptyMessage: String
 *  - initialPageSize: Number (default: 10)
 *  - mobileCardRender: Function (row) => JSX (optional custom mobile card)
 *  - title: String (optional)
 *  - headerActions: JSX (optional top right buttons like Export/Add)
 */
const EnterpriseTable = ({
  columns = [],
  data = [],
  searchableFields = [],
  filterDefinitions = [],
  sortOptions = [
    { label: 'Default', key: null, direction: 'asc' },
    { label: 'Name: A → Z', key: 'name', direction: 'asc' },
    { label: 'Name: Z → A', key: 'name', direction: 'desc' },
    { label: 'Date: Newest', key: 'date', direction: 'desc' },
    { label: 'Date: Oldest', key: 'date', direction: 'asc' },
    { label: 'Score: Highest', key: 'score', direction: 'desc' },
    { label: 'Score: Lowest', key: 'score', direction: 'asc' },
  ],
  rowKey = '_id',
  loading = false,
  error = null,
  onRetry = null,
  emptyMessage = 'No records found',
  initialPageSize = 10,
  mobileCardRender = null,
  title = null,
  headerActions = null,
}) => {
  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [showSortPanel, setShowSortPanel] = useState(false);
  const [activeFilters, setActiveFilters] = useState({});
  const [draftFilters, setDraftFilters] = useState({});
  const [selectedSortIndex, setSelectedSortIndex] = useState(0);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  // Helper to extract nested values
  const getValueByPath = (obj, path) => {
    if (!obj || !path) return undefined;
    if (typeof path === 'function') return path(obj);
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
  };

  // Open filter panel initialized with current active filters
  const handleOpenFilterPanel = () => {
    setDraftFilters({ ...activeFilters });
    setShowFilterPanel(!showFilterPanel);
    setShowSortPanel(false);
  };

  const handleApplyFilters = () => {
    setActiveFilters({ ...draftFilters });
    setShowFilterPanel(false);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setDraftFilters({});
    setActiveFilters({});
    setSearchTerm('');
    setShowFilterPanel(false);
    setCurrentPage(1);
  };

  const activeFilterCount = Object.keys(activeFilters).filter(
    (k) => activeFilters[k] && activeFilters[k] !== 'All' && activeFilters[k] !== ''
  ).length;

  // Filter & Search Logic
  const filteredData = useMemo(() => {
    if (!Array.isArray(data)) return [];

    return data.filter((item) => {
      // 1. Search Query Filter
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesSearch = searchableFields.some((field) => {
          const val = getValueByPath(item, field);
          if (val === null || val === undefined) return false;
          return String(val).toLowerCase().includes(query);
        });
        if (!matchesSearch) return false;
      }

      // 2. Dynamic Attribute Filters
      for (const [key, filterValue] of Object.entries(activeFilters)) {
        if (!filterValue || filterValue === 'All' || filterValue === '') continue;

        const itemVal = getValueByPath(item, key);
        if (itemVal === null || itemVal === undefined) {
          if (filterValue !== 'All') return false;
        } else {
          const strItemVal = String(itemVal).toLowerCase();
          const strFilterVal = String(filterValue).toLowerCase();
          if (strItemVal !== strFilterVal && !strItemVal.includes(strFilterVal)) {
            return false;
          }
        }
      }

      return true;
    });
  }, [data, searchTerm, activeFilters, searchableFields]);

  // Sort Logic
  const sortedData = useMemo(() => {
    const currentSort = sortOptions[selectedSortIndex] || sortOptions[0];
    if (!currentSort || !currentSort.key) return filteredData;

    const key = currentSort.key;
    const isAsc = currentSort.direction === 'asc';

    return [...filteredData].sort((a, b) => {
      let valA = getValueByPath(a, key);
      let valB = getValueByPath(b, key);

      if (valA === null || valA === undefined) valA = '';
      if (valB === null || valB === undefined) valB = '';

      if (typeof valA === 'number' && typeof valB === 'number') {
        return isAsc ? valA - valB : valB - valA;
      }

      const dateA = Date.parse(valA);
      const dateB = Date.parse(valB);
      if (!isNaN(dateA) && !isNaN(dateB) && typeof valA !== 'number') {
        return isAsc ? dateA - dateB : dateB - dateA;
      }

      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      return isAsc ? strA.localeCompare(strB) : strB.localeCompare(strA);
    });
  }, [filteredData, sortOptions, selectedSortIndex]);

  // Pagination Math
  const totalRecords = sortedData.length;
  const totalPages = Math.ceil(totalRecords / pageSize) || 1;
  const safeCurrentPage = Math.min(Math.max(currentPage, 1), totalPages);

  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalRecords);
  const paginatedData = sortedData.slice(startIndex, endIndex);

  // Helper for row ID extraction
  const getRowId = (item, idx) => {
    if (typeof rowKey === 'function') return rowKey(item);
    return item[rowKey] || item._id || item.id || `row-${idx}`;
  };

  return (
    <div className="w-full space-y-4 font-sans text-slate-800">
      {/* HEADER BAR (Optional Title & Actions) */}
      {(title || headerActions) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
          {title && <h2 className="text-lg font-bold text-slate-900 tracking-tight">{title}</h2>}
          {headerActions && <div className="flex items-center gap-2">{headerActions}</div>}
        </div>
      )}

      {/* SMART CONTROL BAR */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-3 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 relative z-20">
        {/* Left: Search input */}
        <div className="relative flex-1 min-w-[240px]">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search records..."
            className="w-full pl-9 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Right: Filter, Sort, Clear buttons */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Filter Popover Trigger */}
          <div className="relative">
            <button
              onClick={handleOpenFilterPanel}
              className={`flex items-center gap-1.5 px-3 py-2 border rounded-xl text-xs font-semibold transition-all ${
                activeFilterCount > 0
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-xs'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <FilterIcon size={14} className={activeFilterCount > 0 ? 'text-indigo-600' : 'text-slate-500'} />
              <span>Filter</span>
              {activeFilterCount > 0 && (
                <span className="bg-indigo-600 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ml-1">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Filter Panel Dropdown */}
            <AnimatePresence>
              {showFilterPanel && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 sm:left-0 md:left-auto top-full mt-2 w-72 sm:w-80 bg-white border border-slate-200 rounded-2xl shadow-xl p-4 z-50 space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                      <SlidersHorizontal size={14} className="text-indigo-600" />
                      Filter Options
                    </span>
                    <button
                      onClick={() => setShowFilterPanel(false)}
                      className="text-slate-400 hover:text-slate-600 rounded-lg p-1"
                    >
                      <X size={14} />
                    </button>
                  </div>

                  {filterDefinitions.length > 0 ? (
                    <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                      {filterDefinitions.map((def) => (
                        <div key={def.key} className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-600">{def.label}</label>
                          {def.type === 'select' ? (
                            <select
                              value={draftFilters[def.key] || 'All'}
                              onChange={(e) =>
                                setDraftFilters({ ...draftFilters, [def.key]: e.target.value })
                              }
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            >
                              <option value="All">All {def.label}s</option>
                              {def.options?.map((opt) => (
                                <option
                                  key={typeof opt === 'object' ? opt.value : opt}
                                  value={typeof opt === 'object' ? opt.value : opt}
                                >
                                  {typeof opt === 'object' ? opt.label : opt}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type="text"
                              value={draftFilters[def.key] || ''}
                              onChange={(e) =>
                                setDraftFilters({ ...draftFilters, [def.key]: e.target.value })
                              }
                              placeholder={`Filter by ${def.label.toLowerCase()}...`}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic py-2 text-center">No additional filters available.</p>
                  )}

                  <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-2">
                    <button
                      onClick={handleClearFilters}
                      className="text-xs font-semibold text-slate-500 hover:text-slate-800 px-2 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      Clear All
                    </button>
                    <button
                      onClick={handleApplyFilters}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-1.5 rounded-xl transition-all shadow-xs"
                    >
                      Apply
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sort Popover Trigger */}
          <div className="relative">
            <button
              onClick={() => {
                setShowSortPanel(!showSortPanel);
                setShowFilterPanel(false);
              }}
              className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all"
            >
              <ArrowUpDown size={14} className="text-slate-500" />
              <span>Sort: <strong className="text-indigo-600">{sortOptions[selectedSortIndex]?.label || 'Default'}</strong></span>
            </button>

            {/* Sort Panel Dropdown */}
            <AnimatePresence>
              {showSortPanel && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 z-50"
                >
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-3 py-1.5 border-b border-slate-100">
                    Sort By Column
                  </div>
                  <div className="py-1 space-y-0.5">
                    {sortOptions.map((opt, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setSelectedSortIndex(idx);
                          setShowSortPanel(false);
                          setCurrentPage(1);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs text-left font-medium transition-colors ${
                          selectedSortIndex === idx
                            ? 'bg-indigo-50 text-indigo-700 font-bold'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span>{opt.label}</span>
                        {selectedSortIndex === idx && <Check size={14} className="text-indigo-600" />}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Reset Filters / Clear All */}
          {(activeFilterCount > 0 || searchTerm) && (
            <button
              onClick={handleClearFilters}
              title="Clear search and filters"
              className="flex items-center gap-1 px-2.5 py-2 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors"
            >
              <RotateCcw size={13} />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* TABLE DATA CONTAINER */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        {/* DESKTOP / TABLET DATA TABLE */}
        <div className="overflow-x-auto relative">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200/80 sticky top-0 z-10 backdrop-blur-xs">
                {columns.map((col) => (
                  <th
                    key={col.key || col.header}
                    style={{ width: col.width || 'auto' }}
                    className={`py-3.5 px-4 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider ${
                      col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                    } ${col.priority === 'low' ? 'hidden lg:table-cell' : ''}`}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-xs">
              {/* LOADING STATE */}
              {loading && (
                Array.from({ length: pageSize > 5 ? 5 : pageSize }).map((_, idx) => (
                  <tr key={`skeleton-${idx}`} className="animate-pulse">
                    {columns.map((col, cIdx) => (
                      <td key={cIdx} className="py-4 px-4">
                        <div className="h-4 bg-slate-200/70 rounded-md w-3/4"></div>
                      </td>
                    ))}
                  </tr>
                ))
              )}

              {/* ERROR STATE */}
              {!loading && error && (
                <tr>
                  <td colSpan={columns.length} className="py-12 px-4 text-center">
                    <div className="max-w-md mx-auto flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
                        <AlertCircle size={24} />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-sm">Unable to load data</h4>
                        <p className="text-slate-500 text-xs mt-1">{error}</p>
                      </div>
                      {onRetry && (
                        <button
                          onClick={onRetry}
                          className="mt-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-xs"
                        >
                          Retry Loading
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}

              {/* EMPTY STATE */}
              {!loading && !error && paginatedData.length === 0 && (
                <tr>
                  <td colSpan={columns.length} className="py-14 px-4 text-center">
                    <div className="max-w-sm mx-auto flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                        <FileSpreadsheet size={24} />
                      </div>
                      <h4 className="font-extrabold text-slate-800 text-sm mt-1">{emptyMessage}</h4>
                      <p className="text-slate-400 text-xs">No records matched your current query or filters.</p>
                      {(activeFilterCount > 0 || searchTerm) && (
                        <button
                          onClick={handleClearFilters}
                          className="mt-3 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3.5 py-1.5 rounded-xl border border-indigo-200 transition-colors"
                        >
                          Clear Filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}

              {/* RECORD ROWS */}
              {!loading && !error && paginatedData.map((row, rIdx) => {
                const rId = getRowId(row, rIdx);
                return (
                  <tr
                    key={rId}
                    className="hover:bg-indigo-50/30 transition-colors group border-b border-slate-100/80"
                  >
                    {columns.map((col) => {
                      const cellVal = getValueByPath(row, col.key);
                      const rendered = col.render ? col.render(row, cellVal, rIdx) : cellVal;

                      return (
                        <td
                          key={col.key || col.header}
                          className={`py-3.5 px-4 align-middle text-slate-700 font-medium ${
                            col.align === 'right'
                              ? 'text-right'
                              : col.align === 'center'
                              ? 'text-center'
                              : 'text-left'
                          } ${col.priority === 'low' ? 'hidden lg:table-cell' : ''}`}
                        >
                          {typeof rendered === 'string' || typeof rendered === 'number' ? (
                            <span
                              className="truncate block max-w-[220px]"
                              title={String(rendered)}
                            >
                              {rendered}
                            </span>
                          ) : (
                            rendered
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* MOBILE CARD LAYOUT (Fallback view for small screens) */}
        {!loading && !error && paginatedData.length > 0 && (
          <div className="block md:hidden divide-y divide-slate-100 bg-slate-50/50">
            {paginatedData.map((row, rIdx) => {
              const rId = getRowId(row, rIdx);
              if (mobileCardRender) {
                return <div key={rId} className="p-4 bg-white">{mobileCardRender(row, rIdx)}</div>;
              }
              return null;
            })}
          </div>
        )}

        {/* PAGINATION CONTROL BAR */}
        <div className="bg-slate-50/90 border-t border-slate-200/80 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          {/* Records count indicator */}
          <div className="flex items-center gap-3">
            <span className="font-medium text-slate-500">
              Showing <strong className="text-slate-900">{totalRecords > 0 ? startIndex + 1 : 0}</strong>–
              <strong className="text-slate-900">{endIndex}</strong> of{' '}
              <strong className="text-slate-900">{totalRecords}</strong> records
            </span>

            {/* Page size dropdown */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-400 font-semibold uppercase">Show</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={safeCurrentPage === 1}
              title="First Page"
              className="p-1.5 border border-slate-200 rounded-lg bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white transition-colors"
            >
              <ChevronsLeft size={16} />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safeCurrentPage === 1}
              title="Previous Page"
              className="p-1.5 border border-slate-200 rounded-lg bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white transition-colors"
            >
              <ChevronLeft size={16} />
            </button>

            <span className="px-3 py-1 font-bold text-slate-800 bg-white border border-slate-200 rounded-lg text-xs">
              Page {safeCurrentPage} of {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={safeCurrentPage === totalPages}
              title="Next Page"
              className="p-1.5 border border-slate-200 rounded-lg bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white transition-colors"
            >
              <ChevronRight size={16} />
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={safeCurrentPage === totalPages}
              title="Last Page"
              className="p-1.5 border border-slate-200 rounded-lg bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white transition-colors"
            >
              <ChevronsRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnterpriseTable;
