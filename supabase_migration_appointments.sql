-- キャリアセンター相談予約システム マイグレーション

CREATE TABLE IF NOT EXISTS appointment_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid REFERENCES career_center_staff(id) ON DELETE CASCADE NOT NULL,
  staff_email text NOT NULL,
  university text NOT NULL,
  starts_at timestamptz NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 30,
  max_bookings integer NOT NULL DEFAULT 1,
  notes text,
  is_cancelled boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE appointment_slots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff can manage own university slots" ON appointment_slots;
CREATE POLICY "staff can manage own university slots"
  ON appointment_slots FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM career_center_staff
      WHERE user_id = auth.uid()
        AND university = appointment_slots.university
    )
  );

DROP POLICY IF EXISTS "students can read available slots" ON appointment_slots;
CREATE POLICY "students can read available slots"
  ON appointment_slots FOR SELECT
  USING (
    is_cancelled = false
    AND EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
        AND university = appointment_slots.university
    )
  );

CREATE TABLE IF NOT EXISTS appointment_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_id uuid REFERENCES appointment_slots(id) ON DELETE CASCADE NOT NULL,
  student_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  university text NOT NULL,
  student_message text,
  status text NOT NULL DEFAULT 'confirmed'
    CHECK (status IN ('confirmed', 'cancelled_by_student', 'cancelled_by_staff')),
  cancelled_at timestamptz,
  cancelled_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(slot_id, student_user_id)
);

ALTER TABLE appointment_bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "students can manage own bookings" ON appointment_bookings;
CREATE POLICY "students can manage own bookings"
  ON appointment_bookings FOR ALL
  USING (auth.uid() = student_user_id);

DROP POLICY IF EXISTS "staff can manage own university bookings" ON appointment_bookings;
CREATE POLICY "staff can manage own university bookings"
  ON appointment_bookings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM career_center_staff
      WHERE user_id = auth.uid()
        AND university = appointment_bookings.university
    )
  );

CREATE INDEX IF NOT EXISTS idx_appointment_slots_university_starts_at
  ON appointment_slots(university, starts_at);
CREATE INDEX IF NOT EXISTS idx_appointment_bookings_slot_id
  ON appointment_bookings(slot_id);
CREATE INDEX IF NOT EXISTS idx_appointment_bookings_student_user_id
  ON appointment_bookings(student_user_id);
