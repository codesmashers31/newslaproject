import Room from '../models/Room.js';

// @desc    Create a new room
// @route   POST /api/rooms
// @access  Private/SuperAdmin
export const createRoom = async (req, res) => {
  const { name, roomNumber, floor, capacity, facilities } = req.body;

  try {
    const roomExists = await Room.findOne({ roomNumber });

    if (roomExists) {
      return res.status(400).json({ message: 'Room number already exists' });
    }

    const room = await Room.create({
      name,
      roomNumber,
      floor: Number(floor),
      capacity: Number(capacity),
      facilities: Array.isArray(facilities) ? facilities : facilities.split(',').map(f => f.trim()).filter(Boolean),
    });

    res.status(201).json(room);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all rooms (with filters)
// @route   GET /api/rooms
// @access  Private/SuperAdmin
export const getRooms = async (req, res) => {
  const { search, floor, status, minCapacity, facilities } = req.query;

  try {
    let query = {};

    // Search filter (by name or number)
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { roomNumber: { $regex: search, $options: 'i' } }
      ];
    }

    // Floor filter
    if (floor !== undefined && floor !== '') {
      query.floor = Number(floor);
    }

    // Status filter
    if (status) {
      query.status = status;
    }

    // Capacity filter
    if (minCapacity) {
      query.capacity = { $gte: Number(minCapacity) };
    }

    // Facilities filter
    if (facilities) {
      const facilitiesArray = Array.isArray(facilities) 
        ? facilities 
        : facilities.split(',').map(f => f.trim()).filter(Boolean);
      
      if (facilitiesArray.length > 0) {
        query.facilities = { $all: facilitiesArray };
      }
    }

    const rooms = await Room.find(query).sort({ floor: 1, roomNumber: 1 });
    res.json(rooms);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a room
// @route   PUT /api/rooms/:id
// @access  Private/SuperAdmin
export const updateRoom = async (req, res) => {
  const { name, roomNumber, floor, capacity, status, facilities } = req.body;

  try {
    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Check if room number is taken by another room
    if (roomNumber && roomNumber !== room.roomNumber) {
      const roomExists = await Room.findOne({ roomNumber });
      if (roomExists) {
        return res.status(400).json({ message: 'Room number already exists' });
      }
    }

    room.name = name || room.name;
    room.roomNumber = roomNumber || room.roomNumber;
    room.floor = floor !== undefined ? Number(floor) : room.floor;
    room.capacity = capacity !== undefined ? Number(capacity) : room.capacity;
    room.status = status || room.status;
    
    if (facilities !== undefined) {
      room.facilities = Array.isArray(facilities) 
        ? facilities 
        : facilities.split(',').map(f => f.trim()).filter(Boolean);
    }

    const updatedRoom = await room.save();
    res.json(updatedRoom);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Toggle room status (Active/Inactive)
// @route   PUT /api/rooms/:id/status
// @access  Private/SuperAdmin
export const toggleRoomStatus = async (req, res) => {
  const { status } = req.body;

  try {
    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    if (status && ['Active', 'Inactive'].includes(status)) {
      room.status = status;
    } else {
      room.status = room.status === 'Active' ? 'Inactive' : 'Active';
    }

    const updatedRoom = await room.save();
    res.json(updatedRoom);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};
