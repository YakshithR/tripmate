CREATE TABLE "trips" (
    "id" SERIAL NOT NULL,
    "trip_name" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "trip_date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "trips_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "students" (
    "id" SERIAL NOT NULL,
    "student_name" TEXT NOT NULL,
    "class_name" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "roll_number" TEXT NOT NULL,
    "parent_name" TEXT NOT NULL,
    "parent_phone" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "registrations" (
    "id" SERIAL NOT NULL,
    "registration_id" TEXT NOT NULL,
    "student_id" INTEGER NOT NULL,
    "trip_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "registrations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "students_class_name_section_roll_number_key"
ON "students"("class_name", "section", "roll_number");

CREATE UNIQUE INDEX "registrations_registration_id_key"
ON "registrations"("registration_id");

CREATE UNIQUE INDEX "registrations_student_id_trip_id_key"
ON "registrations"("student_id", "trip_id");

CREATE INDEX "registrations_trip_id_idx" ON "registrations"("trip_id");

ALTER TABLE "registrations"
ADD CONSTRAINT "registrations_student_id_fkey"
FOREIGN KEY ("student_id") REFERENCES "students"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "registrations"
ADD CONSTRAINT "registrations_trip_id_fkey"
FOREIGN KEY ("trip_id") REFERENCES "trips"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
