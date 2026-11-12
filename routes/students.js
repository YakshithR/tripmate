const express = require("express");
const { PrismaClient, Prisma } = require("@prisma/client");
const { randomBytes } = require("crypto");

const router = express.Router();
const prisma = new PrismaClient();

function requireAdmin(req, res, next) {
  if (req.session.isAdmin !== true) {
    return res.status(401).json({ error: "Admin login required." });
  }
  next();
}

router.post("/register", async (req, res, next) => {
  try {
    const {
      studentName, className, section, rollNumber,
      parentName, parentPhone, tripId
    } = req.body || {};

    const values = [studentName, className, section, rollNumber, parentName, parentPhone];
    if (values.some(value => typeof value !== "string" || !value.trim()) || !tripId) {
      return res.status(400).json({ error: "Please complete every field." });
    }
    if (!/^[0-9]{7,15}$/.test(parentPhone.trim())) {
      return res.status(400).json({ error: "Enter a valid parent phone number (7–15 digits)." });
    }

    const trip = await prisma.trip.findUnique({ where: { id: Number(tripId) } });
    if (!trip) return res.status(400).json({ error: "Please select a valid trip." });

    const studentKey = {
      class_name_section_roll_number: {
        class_name: className.trim(),
        section: section.trim().toUpperCase(),
        roll_number: rollNumber.trim()
      }
    };

    const registration = await prisma.$transaction(async tx => {
      const student = await tx.student.upsert({
        where: studentKey,
        update: {
          student_name: studentName.trim(),
          parent_name: parentName.trim(),
          parent_phone: parentPhone.trim()
        },
        create: {
          student_name: studentName.trim(),
          class_name: className.trim(),
          section: section.trim().toUpperCase(),
          roll_number: rollNumber.trim(),
          parent_name: parentName.trim(),
          parent_phone: parentPhone.trim()
        }
      });

      return tx.registration.create({
        data: {
          registration_id: `TRIP-${randomBytes(5).toString("hex").toUpperCase()}`,
          student_id: student.id,
          trip_id: trip.id
        },
        include: { trip: true }
      });
    });

    return res.status(201).json({
      message: "Registration successful.",
      registrationId: registration.registration_id,
      tripName: registration.trip.trip_name
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return res.status(409).json({ error: "This student is already registered for this trip." });
    }
    next(error);
  }
});

router.get("/", requireAdmin, async (_req, res, next) => {
  try {
    const registrations = await prisma.registration.findMany({
      orderBy: { created_at: "desc" },
      include: { student: true, trip: true }
    });
    res.json(registrations);
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", requireAdmin, async (req, res, next) => {
  try {
    await prisma.registration.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: "Registration deleted." });
  } catch (error) {
    if (error.code === "P2025") return res.status(404).json({ error: "Registration not found." });
    next(error);
  }
});

module.exports = router;
