-- Add UPDATE_DATA to approval_action_type enum
ALTER TYPE approval_action_type ADD VALUE IF NOT EXISTS 'UPDATE_DATA';
