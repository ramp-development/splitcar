-- Add date column to trips table
ALTER TABLE trips ADD COLUMN date DATE NOT NULL DEFAULT CURRENT_DATE;

-- Create index for better query performance
CREATE INDEX idx_trips_date ON trips(date);
