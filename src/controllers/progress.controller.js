const { PrismaClient } = require('@prisma/client');
const path = require('path');

const prisma = new PrismaClient();

const submitProgress = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { percentage, description, gpsLat, gpsLng, gpsAddress } = req.body;

    if (!percentage || !description || gpsLat === undefined || gpsLng === undefined) {
      return res.status(400).json({ 
        error: 'percentage, description, gpsLat, and gpsLng are required' 
      });
    }

    const pct = parseFloat(percentage);
    if (pct < 0 || pct > 100) {
      return res.status(400).json({ error: 'percentage must be between 0 and 100' });
    }

    // Collect uploaded photo paths
    const photoUrls = req.files
      ? req.files.map(f => `/uploads/progress/${f.filename}`)
      : [];

    const progressLog = await prisma.progressLog.create({
      data: {
        taskId,
        reporterId: req.user.id,
        percentage: pct,
        description,
        photoUrls: JSON.stringify(photoUrls),
        gpsLat: parseFloat(gpsLat),
        gpsLng: parseFloat(gpsLng),
        gpsAddress: gpsAddress || null,
        approvalStatus: 'PENDING',
      },
      include: {
        reporter: { select: { id: true, name: true, role: true } },
        task: { select: { id: true, name: true } },
      },
    });

    // Parse photoUrls back for response
    const result = {
      ...progressLog,
      photoUrls: JSON.parse(progressLog.photoUrls),
    };

    res.status(201).json({ progressLog: result });
  } catch (error) {
    console.error('Submit progress error:', error);
    res.status(500).json({ error: 'Failed to submit progress' });
  }
};

const getProgressByTask = async (req, res) => {
  try {
    const { taskId } = req.params;

    const logs = await prisma.progressLog.findMany({
      where: { taskId },
      orderBy: { timestamp: 'desc' },
      include: {
        reporter: { select: { id: true, name: true, role: true } },
        approvedBy: { select: { id: true, name: true } },
      },
    });

    const parsedLogs = logs.map(log => ({
      ...log,
      photoUrls: JSON.parse(log.photoUrls || '[]'),
    }));

    res.json({ logs: parsedLogs });
  } catch (error) {
    console.error('Get progress error:', error);
    res.status(500).json({ error: 'Failed to fetch progress logs' });
  }
};

const approveProgress = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // APPROVED or REJECTED

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ error: 'Status must be APPROVED or REJECTED' });
    }

    const log = await prisma.progressLog.update({
      where: { id },
      data: {
        approvalStatus: status,
        approvedById: req.user.id,
      },
    });

    res.json({ progressLog: log });
  } catch (error) {
    console.error('Approve progress error:', error);
    res.status(500).json({ error: 'Failed to update approval status' });
  }
};

module.exports = { submitProgress, getProgressByTask, approveProgress };
