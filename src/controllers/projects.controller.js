const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const getProjects = async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        creator: { select: { id: true, name: true, role: true } },
        _count: { select: { tasks: true } },
      },
    });
    res.json({ projects });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
};

const getProjectById = async (req, res) => {
  try {
    const { id } = req.params;
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        creator: { select: { id: true, name: true, role: true } },
        tasks: {
          where: { parentId: null },
          include: {
            children: {
              include: {
                children: true,
                progressLogs: {
                  orderBy: { timestamp: 'desc' },
                  take: 1,
                },
              },
            },
            progressLogs: {
              orderBy: { timestamp: 'desc' },
              take: 1,
            },
          },
          orderBy: { plannedStart: 'asc' },
        },
        _count: { select: { inventories: true } },
      },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({ project });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
};

const createProject = async (req, res) => {
  try {
    const { name, location, description, startDate, endDate } = req.body;

    if (!name || !location || !startDate || !endDate) {
      return res.status(400).json({ error: 'Name, location, startDate, and endDate are required' });
    }

    const project = await prisma.project.create({
      data: {
        name,
        location,
        description,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        createdBy: req.user.id,
      },
      include: {
        creator: { select: { id: true, name: true, role: true } },
      },
    });

    res.status(201).json({ project });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
};

const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, location, description, startDate, endDate, status } = req.body;

    const project = await prisma.project.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(location && { location }),
        ...(description !== undefined && { description }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate && { endDate: new Date(endDate) }),
        ...(status && { status }),
      },
    });

    res.json({ project });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
};

module.exports = { getProjects, getProjectById, createProject, updateProject };
