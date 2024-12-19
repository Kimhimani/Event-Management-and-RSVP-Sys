// Required packages
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = 3000;

// Middleware configuration
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Data storage
let attendees = []; // Array to store all attendees

// Queue class implementation (FCFS)
class Queue {
    constructor() {
        this.items = [];
    }
    enqueue(element) {
        this.items.push(element); // Add to the end (FCFS)
    }
    dequeue() {
        if (this.isEmpty()) return 'Queue is empty';
        return this.items.shift(); // Remove from the front (FCFS)
    }
    isEmpty() {
        return this.items.length === 0;
    }
}

let rsvpQueue = new Queue(); // Queue to manage event access

// Priority-based sorting function
function getPriority(role) {
    // Custom priority logic: Speaker > Listener > Dancer > others (random)
    const priorityOrder = {
        Speaker: 1,
        Listener: 2,
        Dancer: 3
    };
    return priorityOrder[role] || Math.random(); // Random priority for others
}

// Routes
app.get('/', (req, res) => {
    res.send('<h1>Welcome to the Event Management System</h1>');
});

// RSVP Route - Attendees can RSVP with name, preference, and role
app.post('/rsvp', (req, res) => {
    const { name, preference, role } = req.body;
    if (name && preference && role) {
        const attendee = { name, preference, role, status: 'Pending' };
        attendees.push(attendee); // Store attendee in the general list
        rsvpQueue.enqueue(attendee); // Add to the queue for FCFS order
        res.json({ message: 'RSVP successfully added!' });
    } else {
        res.status(400).json({ message: 'Please provide all required details.' });
    }
});

// Route to fetch all attendees (sorted by preference)
app.get('/attendees', (req, res) => {
    // Sort attendees based on preference first (vegetarian/non-vegetarian, etc.)
    const sortedByPreference = attendees.sort((a, b) => a.preference.localeCompare(b.preference));
    res.json(sortedByPreference); // Return sorted attendees
});

// Route to fetch attendees sorted by priority (Speaker > Listener > Dancer > others random)
app.get('/attendees-priority', (req, res) => {
    const sortedByPriority = attendees.sort((a, b) => {
        return getPriority(a.role) - getPriority(b.role); // Sort by role priority
    });
    res.json(sortedByPriority); // Return sorted by priority
});

// Route to fetch the RSVP queue (FCFS order)
app.get('/rsvp-queue', (req, res) => {
    res.json(rsvpQueue.items); // Queue items are already in FCFS order
});

// Admin endpoint to update the status of an attendee (e.g., Confirmed, Waitlisted)
app.put('/admin/attendees/:name/status', (req, res) => {
    const { name } = req.params;
    const { status } = req.body; // Expected status: 'Confirmed' or 'Waitlisted'

    if (!status || !['Confirmed', 'Waitlisted'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status. Choose either "Confirmed" or "Waitlisted".' });
    }

    const attendee = attendees.find(attendee => attendee.name === name);
    if (attendee) {
        attendee.status = status;
        res.json({ message: `Attendee ${name} marked as ${status}` });
    } else {
        res.status(404).json({ message: 'Attendee not found.' });
    }
});

// Admin endpoint to delete an attendee
app.delete('/admin/attendees/:name', (req, res) => {
    const { name } = req.params;
    const index = attendees.findIndex(attendee => attendee.name === name);

    if (index !== -1) {
        // Remove from attendees array and queue
        attendees.splice(index, 1);
        rsvpQueue.items = rsvpQueue.items.filter(attendee => attendee.name !== name);
        res.json({ message: `Attendee ${name} has been removed.` });
    } else {
        res.status(404).json({ message: 'Attendee not found.' });
    }
});

// Start server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
