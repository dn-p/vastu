const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const getInventoryByProject = async (req, res) => {
  try {
    const { projectId } = req.params;

    const inventories = await prisma.inventory.findMany({
      where: { projectId },
      include: {
        material: true,
        _count: { select: { logs: true } },
      },
      orderBy: { material: { name: 'asc' } },
    });

    // Add low stock flag
    const enriched = inventories.map(inv => ({
      ...inv,
      isLowStock: inv.currentStock <= inv.material.minStock,
    }));

    res.json({ inventories: enriched });
  } catch (error) {
    console.error('Get inventory error:', error);
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
};

const addMaterialToProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { materialId, initialStock } = req.body;

    if (!materialId) {
      return res.status(400).json({ error: 'materialId is required' });
    }

    const inventory = await prisma.inventory.upsert({
      where: { projectId_materialId: { projectId, materialId } },
      update: {},
      create: {
        projectId,
        materialId,
        currentStock: parseFloat(initialStock) || 0,
      },
      include: { material: true },
    });

    res.status(201).json({ inventory });
  } catch (error) {
    console.error('Add material error:', error);
    res.status(500).json({ error: 'Failed to add material to project' });
  }
};

const logMaterial = async (req, res) => {
  try {
    const { inventoryId } = req.params;
    const { type, quantity, note, supplierName, taskId } = req.body;

    if (!type || !quantity) {
      return res.status(400).json({ error: 'type (IN/OUT) and quantity are required' });
    }

    if (!['IN', 'OUT'].includes(type)) {
      return res.status(400).json({ error: 'type must be IN or OUT' });
    }

    const qty = parseFloat(quantity);
    if (qty <= 0) {
      return res.status(400).json({ error: 'quantity must be positive' });
    }

    // Get current inventory
    const inventory = await prisma.inventory.findUnique({
      where: { id: inventoryId },
      include: { material: true },
    });

    if (!inventory) {
      return res.status(404).json({ error: 'Inventory not found' });
    }

    // Check sufficient stock for OUT
    if (type === 'OUT' && inventory.currentStock < qty) {
      return res.status(400).json({ 
        error: `Insufficient stock. Available: ${inventory.currentStock} ${inventory.material.unit}` 
      });
    }

    // Create log and update stock atomically
    const [materialLog, updatedInventory] = await prisma.$transaction([
      prisma.materialLog.create({
        data: {
          inventoryId,
          type,
          quantity: qty,
          note: note || null,
          supplierName: type === 'IN' ? supplierName : null,
          taskId: type === 'OUT' ? taskId || null : null,
          createdById: req.user.id,
        },
        include: {
          createdBy: { select: { id: true, name: true } },
          task: { select: { id: true, name: true } },
        },
      }),
      prisma.inventory.update({
        where: { id: inventoryId },
        data: {
          currentStock: type === 'IN' 
            ? inventory.currentStock + qty 
            : inventory.currentStock - qty,
        },
        include: { material: true },
      }),
    ]);

    const isLowStock = updatedInventory.currentStock <= updatedInventory.material.minStock;

    res.status(201).json({ 
      materialLog, 
      inventory: { ...updatedInventory, isLowStock } 
    });
  } catch (error) {
    console.error('Log material error:', error);
    res.status(500).json({ error: 'Failed to log material' });
  }
};

const getMaterialLogs = async (req, res) => {
  try {
    const { inventoryId } = req.params;

    const logs = await prisma.materialLog.findMany({
      where: { inventoryId },
      orderBy: { timestamp: 'desc' },
      include: {
        createdBy: { select: { id: true, name: true, role: true } },
        task: { select: { id: true, name: true } },
        inventory: { include: { material: { select: { name: true, unit: true } } } },
      },
    });

    res.json({ logs });
  } catch (error) {
    console.error('Get logs error:', error);
    res.status(500).json({ error: 'Failed to fetch material logs' });
  }
};

module.exports = { 
  getInventoryByProject, 
  addMaterialToProject, 
  logMaterial, 
  getMaterialLogs 
};
