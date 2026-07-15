import RoomAllocation from '../models/RoomAllocation.js';
import Room from '../models/Room.js';
import Batch from '../models/Batch.js';
import User from '../models/User.js';

// Helper to check time overlap (HH:MM strings)
const isTimeOverlapping = (startA, endA, startB, endB) => {
  return startA < endB && endA > startB;
};

// Helper to check room, trainer and batch conflicts
const checkConflicts = async (roomId, trainerId, batchIds, date, startTime, endTime, excludeAllocationId = null) => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  // Find all allocations for that day
  const dayAllocations = await RoomAllocation.find({
    date: { $gte: startOfDay, $lte: endOfDay },
    _id: excludeAllocationId ? { $ne: excludeAllocationId } : { $exists: true }
  }).populate('room batch trainer');

  const roomConflict = dayAllocations.find(a => 
    a.room._id.toString() === roomId.toString() &&
    isTimeOverlapping(startTime, endTime, a.startTime, a.endTime)
  );

  const trainerConflict = dayAllocations.find(a => 
    a.trainer._id.toString() === trainerId.toString() &&
    isTimeOverlapping(startTime, endTime, a.startTime, a.endTime)
  );

  const stringBatchIds = batchIds.map(id => id.toString());
  const batchConflict = dayAllocations.find(a => 
    a.batch && Array.isArray(a.batch) && a.batch.some(b => stringBatchIds.includes(b._id.toString())) &&
    isTimeOverlapping(startTime, endTime, a.startTime, a.endTime)
  );

  const formatBatchNames = (batchField) => {
    if (!batchField) return 'Unknown Batch';
    if (Array.isArray(batchField)) {
      return batchField.map(b => b.name).filter(Boolean).join(', ');
    }
    return batchField.name || 'Unknown Batch';
  };

  return {
    roomConflict: roomConflict ? {
      allocationId: roomConflict._id,
      batchName: formatBatchNames(roomConflict.batch),
      trainerName: roomConflict.trainer?.name || 'Unknown Trainer',
      timeSlot: `${roomConflict.startTime} - ${roomConflict.endTime}`
    } : null,
    trainerConflict: trainerConflict ? {
      allocationId: trainerConflict._id,
      roomName: trainerConflict.room?.name || 'Unknown Room',
      batchName: formatBatchNames(trainerConflict.batch),
      timeSlot: `${trainerConflict.startTime} - ${trainerConflict.endTime}`
    } : null,
    batchConflict: batchConflict ? {
      allocationId: batchConflict._id,
      roomName: batchConflict.room?.name || 'Unknown Room',
      batchName: formatBatchNames(batchConflict.batch),
      timeSlot: `${batchConflict.startTime} - ${batchConflict.endTime}`
    } : null
  };
};

// Helper to check trainer availability slots
const checkTrainerAvailability = async (trainerId, date, startTime, endTime) => {
  const trainer = await User.findById(trainerId);
  if (!trainer) return null;

  // If trainer has no availability set, default to no warnings
  if (!trainer.trainerAvailability || trainer.trainerAvailability.length === 0) {
    return null;
  }

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayOfWeek = days[new Date(date).getDay()];

  const daySlots = trainer.trainerAvailability.filter(s => s.dayOfWeek.toLowerCase() === dayOfWeek.toLowerCase());

  if (daySlots.length === 0) {
    return `Trainer "${trainer.name}" has no availability slots configured on ${dayOfWeek}s.`;
  }

  const isAvailable = daySlots.some(s => startTime >= s.startTime && endTime <= s.endTime);
  if (!isAvailable) {
    const slotsText = daySlots.map(s => `${s.startTime} - ${s.endTime}`).join(', ');
    return `Trainer "${trainer.name}" is scheduled outside their availability for ${dayOfWeek} (Preferred slots: ${slotsText}).`;
  }

  return null;
};

// @desc    Create a new room allocation
// @route   POST /api/allocations
// @access  Private/SuperAdmin
export const createAllocation = async (req, res) => {
  const { room: roomId, batch: batchId, trainer: trainerId, date, startTime, endTime, status } = req.body;

  try {
    // 1. Verify Room exists and is Active
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    if (room.status === 'Inactive') {
      return res.status(400).json({ message: 'Cannot allocate inactive room' });
    }

    // 2. Verify Batch(es) & Trainer exists
    const batchIds = Array.isArray(batchId) ? batchId : [batchId];
    if (batchIds.length === 0 || !batchIds[0]) {
      return res.status(400).json({ message: 'At least one batch must be selected' });
    }

    const batches = await Batch.find({ _id: { $in: batchIds } });
    if (batches.length !== batchIds.length) {
      return res.status(404).json({ message: 'One or more selected batches not found' });
    }

    const trainer = await User.findById(trainerId);
    if (!trainer) {
      return res.status(404).json({ message: 'Trainer not found' });
    }

    // 3. Check conflicts
    const { roomConflict, trainerConflict, batchConflict } = await checkConflicts(roomId, trainerId, batchIds, date, startTime, endTime);

    if (roomConflict) {
      return res.status(400).json({ 
        message: `Room Conflict: This room is already allocated to Batch "${roomConflict.batchName}" at ${roomConflict.timeSlot}.`,
        conflict: roomConflict
      });
    }

    if (trainerConflict) {
      return res.status(400).json({ 
        message: `Trainer Conflict: Trainer "${trainer.name}" is already allocated to Room "${trainerConflict.roomName}" at ${trainerConflict.timeSlot}.`,
        conflict: trainerConflict
      });
    }

    if (batchConflict) {
      return res.status(400).json({ 
        message: `Batch Conflict: Selected batch "${batchConflict.batchName}" is already scheduled in Room "${batchConflict.roomName}" at ${batchConflict.timeSlot}.`,
        conflict: batchConflict
      });
    }

    // 4. Create allocation
    const allocation = await RoomAllocation.create({
      room: roomId,
      batch: batchIds,
      trainer: trainerId,
      date: new Date(date),
      startTime,
      endTime,
      status: status || 'Reserved'
    });

    const populatedAllocation = await RoomAllocation.findById(allocation._id)
      .populate('room batch trainer');

    res.status(201).json(populatedAllocation);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all room allocations (with filters)
// @route   GET /api/allocations
// @access  Private/SuperAdmin
export const getAllocations = async (req, res) => {
  const { room, trainer, batch, date, startDate, endDate } = req.query;

  try {
    let query = {};

    if (room) query.room = room;
    if (trainer) query.trainer = trainer;
    if (batch) {
      query.batch = batch;
    }
    
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      query.date = { $gte: startOfDay, $lte: endOfDay };
    } else if (startDate && endDate) {
      query.date = { 
        $gte: new Date(startDate), 
        $lte: new Date(endDate) 
      };
    }

    const allocations = await RoomAllocation.find(query)
      .populate('room batch trainer')
      .sort({ date: 1, startTime: 1 });

    res.json(allocations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a room allocation (supports drag-and-drop rescheduling)
// @route   PUT /api/allocations/:id
// @access  Private/SuperAdmin
export const updateAllocation = async (req, res) => {
  const { room: roomId, batch: batchId, trainer: trainerId, date, startTime, endTime, status } = req.body;

  try {
    const allocation = await RoomAllocation.findById(req.params.id);
    if (!allocation) {
      return res.status(404).json({ message: 'Allocation not found' });
    }

    const finalRoomId = roomId || allocation.room;
    const finalTrainerId = trainerId || allocation.trainer;
    const finalBatchId = batchId || allocation.batch;
    const finalDate = date ? new Date(date) : allocation.date;
    const finalStartTime = startTime || allocation.startTime;
    const finalEndTime = endTime || allocation.endTime;

    const finalBatchIds = Array.isArray(finalBatchId) ? finalBatchId : [finalBatchId];

    // Check conflicts excluding the current allocation itself
    const { roomConflict, trainerConflict, batchConflict } = await checkConflicts(
      finalRoomId, 
      finalTrainerId, 
      finalBatchIds,
      finalDate, 
      finalStartTime, 
      finalEndTime, 
      allocation._id
    );

    if (roomConflict) {
      return res.status(400).json({ 
        message: `Conflict: Room is already booked for Batch "${roomConflict.batchName}" at ${roomConflict.timeSlot}.`,
        conflict: roomConflict
      });
    }

    if (trainerConflict) {
      return res.status(400).json({ 
        message: `Conflict: Trainer is already scheduled for Room "${trainerConflict.roomName}" at ${trainerConflict.timeSlot}.`,
        conflict: trainerConflict
      });
    }

    if (batchConflict) {
      return res.status(400).json({ 
        message: `Conflict: Selected batch "${batchConflict.batchName}" is already scheduled in Room "${batchConflict.roomName}" at ${batchConflict.timeSlot}.`,
        conflict: batchConflict
      });
    }

    // Verify room is active if room changed
    if (roomId && roomId !== allocation.room.toString()) {
      const roomObj = await Room.findById(roomId);
      if (!roomObj || roomObj.status === 'Inactive') {
        return res.status(400).json({ message: 'Cannot allocate to inactive or non-existent room' });
      }
    }

    // If batch ID is provided, verify it
    if (batchId) {
      const batches = await Batch.find({ _id: { $in: finalBatchIds } });
      if (batches.length !== finalBatchIds.length) {
        return res.status(404).json({ message: 'One or more selected batches not found' });
      }
      allocation.batch = finalBatchIds;
    }

    allocation.room = finalRoomId;
    allocation.trainer = finalTrainerId;
    allocation.date = finalDate;
    allocation.startTime = finalStartTime;
    allocation.endTime = finalEndTime;
    allocation.status = status || allocation.status;

    const updatedAllocation = await allocation.save();
    const populated = await RoomAllocation.findById(updatedAllocation._id)
      .populate('room batch trainer');

    res.json(populated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a room allocation
// @route   DELETE /api/allocations/:id
// @access  Private/SuperAdmin
export const deleteAllocation = async (req, res) => {
  try {
    const allocation = await RoomAllocation.findById(req.params.id);
    if (!allocation) {
      return res.status(404).json({ message: 'Allocation not found' });
    }

    await allocation.deleteOne();
    res.json({ message: 'Allocation cancelled successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Check room availability and recommend the best room
// @route   POST /api/allocations/check-availability
// @access  Private/SuperAdmin
export const checkAvailability = async (req, res) => {
  const { date, startTime, endTime, trainerId, batchId, floor, capacity } = req.body;

  try {
    if (!date || !startTime || !endTime) {
      return res.status(400).json({ message: 'Date, startTime, and endTime are required' });
    }

    // Determine target capacity based on input or batch sizes
    let targetCapacity = Number(capacity) || 0;
    const batchIds = Array.isArray(batchId) ? batchId : batchId ? [batchId] : [];
    if (batchIds.length > 0) {
      const batchObjs = await Batch.find({ _id: { $in: batchIds } });
      targetCapacity = batchObjs.reduce((sum, b) => sum + (b.students ? b.students.length : 0), 0);
    }

    // Fetch active rooms
    let roomQuery = { status: 'Active' };
    if (floor !== undefined && floor !== '') {
      roomQuery.floor = Number(floor);
    }
    const allRooms = await Room.find(roomQuery);

    // Fetch allocations on the selected date
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const dayAllocations = await RoomAllocation.find({
      date: { $gte: startOfDay, $lte: endOfDay }
    }).populate('room batch trainer');

    const formatBatchNames = (batchField) => {
      if (!batchField) return 'Unknown Batch';
      if (Array.isArray(batchField)) {
        return batchField.map(b => b.name).filter(Boolean).join(', ');
      }
      return batchField.name || 'Unknown Batch';
    };

    // Check if the trainer has overlapping allocation conflict
    let trainerConflict = null;
    if (trainerId) {
      const trainerAlloc = dayAllocations.find(a => 
        a.trainer?._id.toString() === trainerId.toString() &&
        isTimeOverlapping(startTime, endTime, a.startTime, a.endTime)
      );
      if (trainerAlloc) {
        trainerConflict = {
          trainerName: trainerAlloc.trainer?.name || 'Trainer',
          roomName: trainerAlloc.room?.name || 'Another Room',
          timeSlot: `${trainerAlloc.startTime} - ${trainerAlloc.endTime}`,
          batchName: formatBatchNames(trainerAlloc.batch)
        };
      }
    }

    // Check if any of the selected batches are busy
    let batchConflict = null;
    if (batchIds.length > 0) {
      const stringBatchIds = batchIds.map(id => id.toString());
      const busyAlloc = dayAllocations.find(a => 
        a.batch && Array.isArray(a.batch) && a.batch.some(b => stringBatchIds.includes(b._id.toString())) &&
        isTimeOverlapping(startTime, endTime, a.startTime, a.endTime)
      );
      if (busyAlloc) {
        batchConflict = {
          batchName: formatBatchNames(busyAlloc.batch),
          roomName: busyAlloc.room?.name || 'Another Room',
          timeSlot: `${busyAlloc.startTime} - ${busyAlloc.endTime}`
        };
      }
    }

    // Check trainer working hours / availability timeslots warning
    let trainerAvailabilityWarning = null;
    if (trainerId) {
      trainerAvailabilityWarning = await checkTrainerAvailability(trainerId, date, startTime, endTime);
    }

    const availableRooms = [];
    const alternativeRooms = [];
    const conflictRooms = [];

    allRooms.forEach(room => {
      // Find overlaps for this specific room
      const roomAllocations = dayAllocations.filter(a => a.room?._id.toString() === room._id.toString());
      
      const overlappingAlloc = roomAllocations.find(a => 
        isTimeOverlapping(startTime, endTime, a.startTime, a.endTime)
      );

      const statusInfo = overlappingAlloc 
        ? { status: 'Occupied', color: 'Red', currentClass: formatBatchNames(overlappingAlloc.batch) }
        : roomAllocations.length > 0 
          ? { status: 'Reserved', color: 'Orange', currentClass: null }
          : { status: 'Available', color: 'Green', currentClass: null };

      const roomData = {
        _id: room._id,
        name: room.name,
        roomNumber: room.roomNumber,
        floor: room.floor,
        capacity: room.capacity,
        facilities: room.facilities,
        liveStatus: statusInfo.status,
        color: statusInfo.color,
        currentClass: statusInfo.currentClass,
        allocationsToday: roomAllocations.map(a => ({
          timeSlot: `${a.startTime} - ${a.endTime}`,
          batch: formatBatchNames(a.batch),
          trainer: a.trainer?.name
        }))
      };

      if (overlappingAlloc) {
        conflictRooms.push({
          ...roomData,
          conflictDetails: {
            batchName: formatBatchNames(overlappingAlloc.batch),
            trainerName: overlappingAlloc.trainer?.name,
            timeSlot: `${overlappingAlloc.startTime} - ${overlappingAlloc.endTime}`
          }
        });
      } else {
        // Rooms that are free during the slot
        if (room.capacity >= targetCapacity) {
          availableRooms.push(roomData);
        } else {
          alternativeRooms.push({
            ...roomData,
            warning: `Capacity (${room.capacity}) is less than combined batches size (${targetCapacity})`
          });
        }
      }
    });

    // Suggestion logic: Sort available rooms by capacity fit (closest to targetCapacity without going under)
    availableRooms.sort((a, b) => a.capacity - b.capacity);

    res.json({
      suggestedRoom: availableRooms[0] || null,
      availableRooms, // Rooms that fit capacity and have no conflicts
      alternativeRooms, // Rooms that have no conflicts but are too small
      conflictRooms, // Rooms that are occupied
      trainerConflict,
      batchConflict,
      trainerAvailabilityWarning
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};
