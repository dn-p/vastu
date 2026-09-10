const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const getMaterials = async (req, res) => {
  try {
    const materials = await prisma.material.findMany({
      orderBy: { name: 'asc' },
    });
    res.json({ materials });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch materials' });
  }
};

const createMaterial = async (req, res) => {
  try {
    const { name, unit, minStock, description } = req.body;

    if (!name || !unit) {
      return res.status(400).json({ error: 'Name and unit are required' });
    }

    const material = await prisma.material.create({
      data: { 
        name, 
        unit, 
        minStock: parseFloat(minStock) || 0, 
        description 
      },
    });

    res.status(201).json({ material });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Material with this name already exists' });
    }
    res.status(500).json({ error: 'Failed to create material' });
  }
};

module.exports = { getMaterials, createMaterial };
