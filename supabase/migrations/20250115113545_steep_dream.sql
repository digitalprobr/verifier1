/*
  # Create and populate email templates

  1. New Tables
    - `email_templates`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `subject` (text)
      - `content` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `email_templates` table
    - Add policy for authenticated users to read templates
*/

-- Create email templates table
CREATE TABLE IF NOT EXISTS email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  subject text NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

-- Create policy for reading templates
CREATE POLICY "Allow read access to email templates"
  ON email_templates
  FOR SELECT
  TO authenticated
  USING (true);

-- Insert default templates
INSERT INTO email_templates (name, subject, content)
VALUES 
  (
    'welcome_email',
    'Welcome to Email Validator',
    '<h2>Welcome to Email Validator!</h2>
     <p>Thank you for signing up. We are excited to have you on board.</p>
     <p>Click the link below to verify your email:</p>
     <p><a href="{{ .ConfirmationURL }}">Verify Email Address</a></p>'
  ),
  (
    'reset_password',
    'Reset Your Password',
    '<h2>Password Reset Request</h2>
     <p>A password reset was requested for your account.</p>
     <p>Click the link below to reset your password:</p>
     <p><a href="{{ .ConfirmationURL }}">Reset Password</a></p>
     <p>If you did not request this change, you can ignore this email.</p>'
  );

-- Create function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON email_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();