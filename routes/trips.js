const express = require("express");
const { PrismaClient } = require("@prisma/client");

const router = express.Router();
const prisma = new PrismaClient();

function requireAdmin(req, res, next) {
  if (req.session.isAdmin !== true) {
    return res.status(401).json({ error: "Admin login required." });
  }
  next();
}

router.get("/", async (_req, res, next) => {
  try {
    const trips = await prisma.trip.findMany({ orderBy: { trip_date: "asc" } });
    res.json(trips);
  } catch (error) {
    next(error);
  }
});

router.post("/", requireAdmin, async (req, res, next) => {
  try {
    const { tripName, destination, tripDate } = req.body || {};
    if (![tripName, destination, tripDate].every(value => typeof value === "string" && value.trim())) {
      return res.status(400).json({ error: "Trip name, destination and date are required." });
    }
    const date = new Date(`${tripDate}T00:00:00.000Z`);
    if (Number.isNaN(date.getTime())) return res.status(400).json({ error: "Enter a valid trip date." });

    const trip = await prisma.trip.create({
      data: {
        trip_name: tripName.trim(),
        destination: destination.trim(),
        trip_date: date
      }
    });
    res.status(201).json(trip);
  } catch (error) {
    next(error);
  }
});

router.get("/summary", requireAdmin, async (_req, res, next) => {
  try {
    const [totalRegistrations, trips] = await Promise.all([
      prisma.registration.count(),
      prisma.trip.findMany({
        orderBy: { trip_date: "asc" },
        include: { _count: { select: { registrations: true } } }
      })
    ]);
    res.json({
      totalRegistrations,
      trips: trips.map(trip => ({
        id: trip.id,
        tripName: trip.trip_name,
        destination: trip.destination,
        tripDate: trip.trip_date,
        totalStudents: trip._count.registrations
      }))
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
