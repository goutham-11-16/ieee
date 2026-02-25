-- Add a boolean flag to indicate if the fee is per person for team events
ALTER TABLE events ADD COLUMN is_fee_per_person BOOLEAN DEFAULT false;
