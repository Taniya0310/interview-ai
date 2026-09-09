const domainService = require("../services/domainManagementService");

async function getDomains(req, res) {
  try {
    const domains = await domainService.listDomains();
    res.json({ domains });
  } catch (error) {
    res.status(500).json({
      message: "Failed to load domains",
    });
  }
}

async function createDomain(req, res) {
  try {
    const { name, description } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({
        message: "Domain name is required",
      });
    }

    const domain = await domainService.createDomain(
      name,
      description
    );

    res.status(201).json({ domain });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create domain",
    });
  }
}

async function updateDomain(req, res) {
  try {
    const { name, description } = req.body;

    const domain = await domainService.updateDomain(
      req.params.id,
      name,
      description
    );

    res.json({ domain });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update domain",
    });
  }
}

async function deleteDomain(req, res) {
  try {
    const domain = await domainService.deleteDomain(
      req.params.id
    );

    res.json({ domain });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete domain",
    });
  }
}

module.exports = {
  getDomains,
  createDomain,
  updateDomain,
  deleteDomain,
};