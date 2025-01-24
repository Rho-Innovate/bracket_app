import { createClient } from '@supabase/supabase-js';
import React, { useState } from 'react';

// Initialize the Supabase client with environment variables
const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL || '',
  process.env.REACT_APP_SUPABASE_ANON_KEY || ''
);

const EventCreationPage: React.FC = () => {
  // State variables to store user input for event details
  const [eventName, setEventName] = useState<string>('');
  const [eventDate, setEventDate] = useState<string>('');
  const [eventLocation, setEventLocation] = useState<string>('');
  const [eventDescription, setEventDescription] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Function to handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent default form submission behavior

    try {
      // Insert the event details into the 'events' table in Supabase
      const { data, error } = await supabase
        .from('events')
        .insert([
          {
            name: eventName,
            date: eventDate,
            location: eventLocation,
            description: eventDescription,
          },
        ]);

      if (error) {
        throw error; // Throw an error if insertion fails
      }

      // Display success message and reset the form fields
      setSuccessMessage('Event created successfully!');
      setEventName('');
      setEventDate('');
      setEventLocation('');
      setEventDescription('');
    } catch (error: any) {
      // Display error message if any issues occur
      setErrorMessage(error.message);
    }
  };

  return (
    <div className="event-creation-container">
      <h1>Create Event</h1>
      {/* Display success or error messages */}
      {successMessage && <p className="success-message">{successMessage}</p>}
      {errorMessage && <p className="error-message">{errorMessage}</p>}

      {/* Form for event creation */}
      <form onSubmit={handleSubmit} className="event-form">
        <div className="form-group">
          <label htmlFor="eventName">Event Name</label>
          {/* Input field for event name */}
          <input
            type="text"
            id="eventName"
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="eventDate">Event Date</label>
          {/* Input field for event date */}
          <input
            type="date"
            id="eventDate"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="eventLocation">Event Location</label>
          {/* Input field for event location */}
          <input
            type="text"
            id="eventLocation"
            value={eventLocation}
            onChange={(e) => setEventLocation(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="eventDescription">Event Description</label>
          {/* Textarea for event description */}
          <textarea
            id="eventDescription"
            value={eventDescription}
            onChange={(e) => setEventDescription(e.target.value)}
            required
          ></textarea>
        </div>

        {/* Submit button */}
        <button type="submit" className="submit-button">Create Event</button>
      </form>
    </div>
  );
};

export default EventCreationPage;