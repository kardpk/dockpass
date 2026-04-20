-- Batch I: Add Compliance Score to boats table
ALTER TABLE boats ADD COLUMN compliance_score INT DEFAULT 0;
