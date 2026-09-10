const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const getTasksByProject = async (req, res) => {
  try {
    const { projectId } = req.params;

    const tasks = await prisma.task.findMany({
      where: { projectId, parentId: null },
      include: {
        children: {
          include: {
            children: true,
            progressLogs: {
              orderBy: { timestamp: 'desc' },
              take: 1,
              select: { percentage: true, approvalStatus: true, timestamp: true },
            },
          },
        },
        progressLogs: {
          orderBy: { timestamp: 'desc' },
          take: 1,
          select: { percentage: true, approvalStatus: true, timestamp: true },
        },
      },
      orderBy: { plannedStart: 'asc' },
    });

    res.json({ tasks });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
};

const getTaskById = async (req, res) => {
  try {
    const { id } = req.params;

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, name: true } },
        parent: { select: { id: true, name: true } },
        children: true,
        progressLogs: {
          orderBy: { timestamp: 'desc' },
          include: {
            reporter: { select: { id: true, name: true, role: true } },
            approvedBy: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({ task });
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ error: 'Failed to fetch task' });
  }
};

const createTask = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { name, description, parentId, weightPercent, plannedStart, plannedEnd } = req.body;

    if (!name || !plannedStart || !plannedEnd) {
      return res.status(400).json({ error: 'Name, plannedStart, and plannedEnd are required' });
    }

    const task = await prisma.task.create({
      data: {
        projectId,
        parentId: parentId || null,
        name,
        description,
        weightPercent: weightPercent || 0,
        plannedStart: new Date(plannedStart),
        plannedEnd: new Date(plannedEnd),
      },
    });

    res.status(201).json({ task });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
};

module.exports = { getTasksByProject, getTaskById, createTask };
