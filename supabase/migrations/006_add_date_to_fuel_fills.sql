-- Add date column to fuel_fills table
ALTER TABLE fuel_fills ADD COLUMN date DATE NOT NULL DEFAULT CURRENT_DATE;

-- Create index for better query performance
CREATE INDEX idx_fuel_fills_date ON fuel_fills(date);
