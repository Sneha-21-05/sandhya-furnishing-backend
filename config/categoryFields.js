module.exports = {
  Curtains: [
    { key: "length", label: "Length (ft)", type: "number" },
    { key: "width", label: "Width (ft)", type: "number" },
    { key: "material", label: "Material", type: "text" },
    { key: "color", label: "Color", type: "text" },
    { key: "pattern", label: "Pattern", type: "text" },
    { key: "lining", label: "Lining (Yes/No)", type: "text" },
    { key: "fabric_gsm", label: "Fabric GSM", type: "number" }
  ],

  Pillows: [
    { key: "size", label: "Size (e.g., 16x16)", type: "text" },
    { key: "fabric", label: "Fabric", type: "text" },
    { key: "filling_material", label: "Filling Material", type: "text" },
    { key: "color", label: "Color", type: "text" }
  ],

  Mattress: [
    { key: "thickness", label: "Thickness (inches)", type: "number" },
    { key: "dimensions", label: "Dimensions (Queen/King/Single)", type: "text" },
    { key: "material", label: "Material Type", type: "text" },
    { key: "firmness", label: "Firmness (Soft/Medium/Hard)", type: "text" },
    { key: "warranty", label: "Warranty", type: "text" }
  ],

  Sofa: [
    { key: "size", label: "Size (2-seater / 3-seater / L-shape)", type: "text" },
    { key: "fabric", label: "Fabric", type: "text" },
    { key: "color", label: "Color", type: "text" },
    { key: "foam_density", label: "Foam Density", type: "number" },
    { key: "frame_material", label: "Frame Material", type: "text" },
    { key: "warranty", label: "Warranty", type: "text" }
  ]
};
