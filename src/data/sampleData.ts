// Sample data extracted from the BOM Comparison.txt files for testing
import fullBomData from './fullBomData.json';

// Create a modified version with added/deleted items for demonstration
function createModifiedVersion(baseData: any) {
  const modified = JSON.parse(JSON.stringify(baseData)); // Deep clone

  // BOM-level deletion: Remove QASB2 sub-BOM entirely
  if (modified.bom_items) {
    modified.bom_items = modified.bom_items.filter(
      (item: any) => item.sub_bom?.bom_code !== 'QASB2'
    );
  }

  // Remove RM2 and RM3 from bomSample2 (simulate deletions)
  if (modified.bom_items && modified.bom_items[0]?.sub_bom_items) {
    const subBomItems = modified.bom_items[0].sub_bom_items;
    if (subBomItems[0]?.sub_bom_items) {
      // Filter out RM2 and RM3
      subBomItems[0].sub_bom_items = subBomItems[0].sub_bom_items.filter(
        (item: any) => item.raw_material_item?.code !== 'RM2' && item.raw_material_item?.code !== 'RM3'
      );

      // Add new items (simulate additions)
      // Item 1: RM5
      subBomItems[0].sub_bom_items.push({
        entry_id: "new-item-rm5-id",
        bom_item_id: "new-rm5-bom-item-id",
        sub_bom: null,
        sub_bom_items: null,
        raw_material_item: {
          enterprise_item_id: "new-rm5-enterprise-id",
          code: "RM5",
          name: "Resistor 10K Ohm",
          measurement_units: {
            item_measurement_units: [{
              abbreviation: "pcs",
              measurement_unit_id: "21213178-90a1-4663-bd7c-8b79dedc295a",
              measurement_unit_category: "UNITS",
              measurement_unit_value_type: "DECIMAL",
              measurement_unit_primary_name: "Pieces"
            }]
          },
          tags: ["Resistor", "Electronics"]
        },
        alternates: [],
        quantity: 5,
        cost_per_unit: 2.5,
        measurement_unit: {
          measurement_unit_id: "21213178-90a1-4663-bd7c-8b79dedc295a",
          measurement_unit_primary_name: "Pieces",
          measurement_unit_category: "UNITS",
          measurement_unit_value_type: "DECIMAL",
          abbreviation: "pcs"
        },
        selected: false,
        custom_sections: [],
        delivery_schedule: []
      });

      // Item 2: RM6
      subBomItems[0].sub_bom_items.push({
        entry_id: "new-item-rm6-id",
        bom_item_id: "new-rm6-bom-item-id",
        sub_bom: null,
        sub_bom_items: null,
        raw_material_item: {
          enterprise_item_id: "new-rm6-enterprise-id",
          code: "RM6",
          name: "Transistor NPN 2N2222",
          measurement_units: {
            item_measurement_units: [{
              abbreviation: "pcs",
              measurement_unit_id: "21213178-90a1-4663-bd7c-8b79dedc295a",
              measurement_unit_category: "UNITS",
              measurement_unit_value_type: "DECIMAL",
              measurement_unit_primary_name: "Pieces"
            }]
          },
          tags: ["Transistor", "Semiconductor"]
        },
        alternates: [],
        quantity: 3,
        cost_per_unit: 1.2,
        measurement_unit: {
          measurement_unit_id: "21213178-90a1-4663-bd7c-8b79dedc295a",
          measurement_unit_primary_name: "Pieces",
          measurement_unit_category: "UNITS",
          measurement_unit_value_type: "DECIMAL",
          abbreviation: "pcs"
        },
        selected: false,
        custom_sections: [],
        delivery_schedule: []
      });

      // Item 3: RM7
      subBomItems[0].sub_bom_items.push({
        entry_id: "new-item-rm7-id",
        bom_item_id: "new-rm7-bom-item-id",
        sub_bom: null,
        sub_bom_items: null,
        raw_material_item: {
          enterprise_item_id: "new-rm7-enterprise-id",
          code: "RM7",
          name: "Inductor 10uH",
          measurement_units: {
            item_measurement_units: [{
              abbreviation: "pcs",
              measurement_unit_id: "21213178-90a1-4663-bd7c-8b79dedc295a",
              measurement_unit_category: "UNITS",
              measurement_unit_value_type: "DECIMAL",
              measurement_unit_primary_name: "Pieces"
            }]
          },
          tags: ["Inductor", "Passive"]
        },
        alternates: [],
        quantity: 2,
        cost_per_unit: 0.8,
        measurement_unit: {
          measurement_unit_id: "21213178-90a1-4663-bd7c-8b79dedc295a",
          measurement_unit_primary_name: "Pieces",
          measurement_unit_category: "UNITS",
          measurement_unit_value_type: "DECIMAL",
          abbreviation: "pcs"
        },
        selected: false,
        custom_sections: [],
        delivery_schedule: []
      });

      // Modify existing items (simulate changes)
      // Change quantity and cost for RM1
      const rm1Item = subBomItems[0].sub_bom_items.find(
        (item: any) => item.raw_material_item?.code === 'RM1'
      );
      if (rm1Item) {
        rm1Item.quantity = 15; // Increase from original
        rm1Item.cost_per_unit = 12.5; // Change cost
      }

      // Change quantity for RM4
      const rm4Item = subBomItems[0].sub_bom_items.find(
        (item: any) => item.raw_material_item?.code === 'RM4'
      );
      if (rm4Item) {
        rm4Item.quantity = 8; // Increase from original
      }
    }

    // BOM-level changes: Add a new sub-bom at the top level
    if (modified.bom_items) {
      // Add a completely new sub-BOM called "NEW-SUB-BOM" to bom_items (top-level sub-BOM)
      modified.bom_items.push({
        entry_id: "new-sub-bom-entry",
        bom_item_id: "new-sub-bom-item-id",
        sub_bom: {
          enterprise_bom_id: "new-sub-bom-enterprise-id",
          bom_code: "NEW-SUB-BOM",
          bom_name: "New Additional Sub-BOM"
        },
        sub_bom_items: [
          {
            entry_id: "new-sub-bom-rm-001",
            bom_item_id: "new-sub-bom-rm-bom-001",
            sub_bom: null,
            sub_bom_items: null,
            raw_material_item: {
              enterprise_item_id: "new-sub-bom-item-001",
              code: "RM-NEW-001",
              name: "New Component for New Sub-BOM",
              measurement_units: {
                item_measurement_units: [{
                  abbreviation: "pcs",
                  measurement_unit_id: "21213178-90a1-4663-bd7c-8b79dedc295a",
                  measurement_unit_category: "UNITS",
                  measurement_unit_value_type: "DECIMAL",
                  measurement_unit_primary_name: "Pieces"
                }]
              },
              tags: ["New", "Component"]
            },
            alternates: [],
            quantity: 10,
            cost_per_unit: 5.0,
            measurement_unit: {
              measurement_unit_id: "21213178-90a1-4663-bd7c-8b79dedc295a",
              measurement_unit_primary_name: "Pieces",
              measurement_unit_category: "UNITS",
              measurement_unit_value_type: "DECIMAL",
              abbreviation: "pcs"
            },
            selected: false,
            custom_sections: [],
            delivery_schedule: []
          }
        ],
        quantity: 1,
        cost_per_unit: 0,
        measurement_unit: {
          measurement_unit_id: "21213178-90a1-4663-bd7c-8b79dedc295a",
          measurement_unit_primary_name: "Pieces",
          measurement_unit_category: "UNITS",
          measurement_unit_value_type: "DECIMAL",
          abbreviation: "pcs"
        },
        selected: false,
        custom_sections: [],
        delivery_schedule: []
      });
    }

    // Modify an existing sub-BOM's quantity (this will show as "changed" at BOM level)
    if (modified.bom_items && modified.bom_items[0]) {
      modified.bom_items[0].quantity = 2; // Changed from 1
    }
  }

  return modified;
}

// Create PCB Assembly BOM data - Version 1
const pcbAssemblyBomV1 = {
  entry_id: "3b32d9b8-7fc7-4e38-a2d7-28907b77bcc9",
  base_bom_module_linkage_id: "d0cf0be9-5e84-477c-a5a8-fb98d2550ea5",
  created_datetime: "2025-09-30T12:49:05.277144Z",
  modified_datetime: "2025-09-30T12:49:05.277165Z",
  deleted_datetime: null,
  created_by_user_id: null,
  modified_by_user_id: null,
  deleted_by_user_id: null,
  enterprise_bom: {
    enterprise_bom_id: "95d993b1-05d9-4f83-bdde-d4d9cdc5fad9",
    bom_code: "PCB001",
    bom_name: "PCB Assembly - Motor Control Board"
  },
  quantity: 1,
  measurement_unit: {
    measurement_unit_id: "21213178-90a1-4663-bd7c-8b79dedc295a",
    measurement_unit_primary_name: "Pieces",
    measurement_unit_category: "UNITS",
    measurement_unit_value_type: "DECIMAL",
    abbreviation: "pcs"
  },
  currency_id: "a8c3e3fd-b05f-4d09-bd2f-9fedd07d0ec3",
  total: 450,
  custom_sections: [],
  bom_valid: true,
  has_sub_boms: true,
  sub_boms_valid: true,
  bom_items: [
    {
      entry_id: "pcb-sub-1",
      bom_item_id: "pcb-sub-bom-1",
      sub_bom: {
        enterprise_bom_id: "sub-pcb-001",
        bom_code: "PCB-SUB-001",
        bom_name: "Power Supply Module"
      },
      sub_bom_items: [
        {
          entry_id: "pcb-rm-001",
          bom_item_id: "pcb-rm-bom-001",
          sub_bom: null,
          sub_bom_items: null,
          raw_material_item: {
            enterprise_item_id: "pcb-item-001",
            code: "PCB-CAP-001",
            name: "Capacitor 100uF 25V",
            measurement_units: {
              item_measurement_units: [{
                abbreviation: "pcs",
                measurement_unit_id: "21213178-90a1-4663-bd7c-8b79dedc295a",
                measurement_unit_category: "UNITS",
                measurement_unit_value_type: "DECIMAL",
                measurement_unit_primary_name: "Pieces"
              }]
            },
            tags: ["Capacitor", "Electronics", "Power"]
          },
          alternates: [],
          quantity: 4,
          cost_per_unit: 1.5,
          measurement_unit: {
            measurement_unit_id: "21213178-90a1-4663-bd7c-8b79dedc295a",
            measurement_unit_primary_name: "Pieces",
            measurement_unit_category: "UNITS",
            measurement_unit_value_type: "DECIMAL",
            abbreviation: "pcs"
          },
          selected: false,
          custom_sections: [],
          delivery_schedule: []
        },
        {
          entry_id: "pcb-rm-002",
          bom_item_id: "pcb-rm-bom-002",
          sub_bom: null,
          sub_bom_items: null,
          raw_material_item: {
            enterprise_item_id: "pcb-item-002",
            code: "PCB-RES-001",
            name: "Resistor 1K Ohm 1/4W",
            measurement_units: {
              item_measurement_units: [{
                abbreviation: "pcs",
                measurement_unit_id: "21213178-90a1-4663-bd7c-8b79dedc295a",
                measurement_unit_category: "UNITS",
                measurement_unit_value_type: "DECIMAL",
                measurement_unit_primary_name: "Pieces"
              }]
            },
            tags: ["Resistor", "Electronics"]
          },
          alternates: [],
          quantity: 8,
          cost_per_unit: 0.5,
          measurement_unit: {
            measurement_unit_id: "21213178-90a1-4663-bd7c-8b79dedc295a",
            measurement_unit_primary_name: "Pieces",
            measurement_unit_category: "UNITS",
            measurement_unit_value_type: "DECIMAL",
            abbreviation: "pcs"
          },
          selected: false,
          custom_sections: [],
          delivery_schedule: []
        },
        {
          entry_id: "pcb-rm-003",
          bom_item_id: "pcb-rm-bom-003",
          sub_bom: null,
          sub_bom_items: null,
          raw_material_item: {
            enterprise_item_id: "pcb-item-003",
            code: "PCB-LED-001",
            name: "LED Red 5mm",
            measurement_units: {
              item_measurement_units: [{
                abbreviation: "pcs",
                measurement_unit_id: "21213178-90a1-4663-bd7c-8b79dedc295a",
                measurement_unit_category: "UNITS",
                measurement_unit_value_type: "DECIMAL",
                measurement_unit_primary_name: "Pieces"
              }]
            },
            tags: ["LED", "Indicator"]
          },
          alternates: [],
          quantity: 2,
          cost_per_unit: 0.75,
          measurement_unit: {
            measurement_unit_id: "21213178-90a1-4663-bd7c-8b79dedc295a",
            measurement_unit_primary_name: "Pieces",
            measurement_unit_category: "UNITS",
            measurement_unit_value_type: "DECIMAL",
            abbreviation: "pcs"
          },
          selected: false,
          custom_sections: [],
          delivery_schedule: []
        }
      ],
      quantity: 1,
      cost_per_unit: 0,
      measurement_unit: {
        measurement_unit_id: "21213178-90a1-4663-bd7c-8b79dedc295a",
        measurement_unit_primary_name: "Pieces",
        measurement_unit_category: "UNITS",
        measurement_unit_value_type: "DECIMAL",
        abbreviation: "pcs"
      },
      selected: false,
      custom_sections: [],
      delivery_schedule: []
    },
    {
      entry_id: "pcb-sub-2",
      bom_item_id: "pcb-sub-bom-2",
      sub_bom: {
        enterprise_bom_id: "sub-pcb-002",
        bom_code: "PCB-SUB-002",
        bom_name: "Control Circuit Module"
      },
      sub_bom_items: [
        {
          entry_id: "pcb-rm-004",
          bom_item_id: "pcb-rm-bom-004",
          sub_bom: null,
          sub_bom_items: null,
          raw_material_item: {
            enterprise_item_id: "pcb-item-004",
            code: "PCB-IC-001",
            name: "Microcontroller ATmega328P",
            measurement_units: {
              item_measurement_units: [{
                abbreviation: "pcs",
                measurement_unit_id: "21213178-90a1-4663-bd7c-8b79dedc295a",
                measurement_unit_category: "UNITS",
                measurement_unit_value_type: "DECIMAL",
                measurement_unit_primary_name: "Pieces"
              }]
            },
            tags: ["IC", "Microcontroller", "Control"]
          },
          alternates: [],
          quantity: 1,
          cost_per_unit: 25.0,
          measurement_unit: {
            measurement_unit_id: "21213178-90a1-4663-bd7c-8b79dedc295a",
            measurement_unit_primary_name: "Pieces",
            measurement_unit_category: "UNITS",
            measurement_unit_value_type: "DECIMAL",
            abbreviation: "pcs"
          },
          selected: false,
          custom_sections: [],
          delivery_schedule: []
        },
        {
          entry_id: "pcb-rm-005",
          bom_item_id: "pcb-rm-bom-005",
          sub_bom: null,
          sub_bom_items: null,
          raw_material_item: {
            enterprise_item_id: "pcb-item-005",
            code: "PCB-OSC-001",
            name: "Crystal Oscillator 16MHz",
            measurement_units: {
              item_measurement_units: [{
                abbreviation: "pcs",
                measurement_unit_id: "21213178-90a1-4663-bd7c-8b79dedc295a",
                measurement_unit_category: "UNITS",
                measurement_unit_value_type: "DECIMAL",
                measurement_unit_primary_name: "Pieces"
              }]
            },
            tags: ["Oscillator", "Timing"]
          },
          alternates: [],
          quantity: 1,
          cost_per_unit: 2.0,
          measurement_unit: {
            measurement_unit_id: "21213178-90a1-4663-bd7c-8b79dedc295a",
            measurement_unit_primary_name: "Pieces",
            measurement_unit_category: "UNITS",
            measurement_unit_value_type: "DECIMAL",
            abbreviation: "pcs"
          },
          selected: false,
          custom_sections: [],
          delivery_schedule: []
        }
      ],
      quantity: 1,
      cost_per_unit: 0,
      measurement_unit: {
        measurement_unit_id: "21213178-90a1-4663-bd7c-8b79dedc295a",
        measurement_unit_primary_name: "Pieces",
        measurement_unit_category: "UNITS",
        measurement_unit_value_type: "DECIMAL",
        abbreviation: "pcs"
      },
      selected: false,
      custom_sections: [],
      delivery_schedule: []
    }
  ]
};

// Create PCB Assembly BOM data - Version 2 (with changes)
const pcbAssemblyBomV2 = JSON.parse(JSON.stringify(pcbAssemblyBomV1)); // Deep clone

// Modify Version 2 to create changes
// 1. Remove PCB-LED-001 (deleted)
pcbAssemblyBomV2.bom_items[0].sub_bom_items = pcbAssemblyBomV2.bom_items[0].sub_bom_items.filter(
  (item: any) => item.raw_material_item?.code !== 'PCB-LED-001'
);

// 2. Add new items (added)
pcbAssemblyBomV2.bom_items[0].sub_bom_items.push({
  entry_id: "pcb-rm-new-001",
  bom_item_id: "pcb-rm-bom-new-001",
  sub_bom: null,
  sub_bom_items: null,
  raw_material_item: {
    enterprise_item_id: "pcb-item-new-001",
    code: "PCB-DIODE-001",
    name: "Diode 1N4007",
    measurement_units: {
      item_measurement_units: [{
        abbreviation: "pcs",
        measurement_unit_id: "21213178-90a1-4663-bd7c-8b79dedc295a",
        measurement_unit_category: "UNITS",
        measurement_unit_value_type: "DECIMAL",
        measurement_unit_primary_name: "Pieces"
      }]
    },
    tags: ["Diode", "Protection"]
  },
  alternates: [],
  quantity: 4,
  cost_per_unit: 0.3,
  measurement_unit: {
    measurement_unit_id: "21213178-90a1-4663-bd7c-8b79dedc295a",
    measurement_unit_primary_name: "Pieces",
    measurement_unit_category: "UNITS",
    measurement_unit_value_type: "DECIMAL",
    abbreviation: "pcs"
  },
  selected: false,
  custom_sections: [],
  delivery_schedule: []
});

pcbAssemblyBomV2.bom_items[1].sub_bom_items.push({
  entry_id: "pcb-rm-new-002",
  bom_item_id: "pcb-rm-bom-new-002",
  sub_bom: null,
  sub_bom_items: null,
  raw_material_item: {
    enterprise_item_id: "pcb-item-new-002",
    code: "PCB-CAP-002",
    name: "Capacitor 22pF Ceramic",
    measurement_units: {
      item_measurement_units: [{
        abbreviation: "pcs",
        measurement_unit_id: "21213178-90a1-4663-bd7c-8b79dedc295a",
        measurement_unit_category: "UNITS",
        measurement_unit_value_type: "DECIMAL",
        measurement_unit_primary_name: "Pieces"
      }]
    },
    tags: ["Capacitor", "Ceramic"]
  },
  alternates: [],
  quantity: 2,
  cost_per_unit: 0.2,
  measurement_unit: {
    measurement_unit_id: "21213178-90a1-4663-bd7c-8b79dedc295a",
    measurement_unit_primary_name: "Pieces",
    measurement_unit_category: "UNITS",
    measurement_unit_value_type: "DECIMAL",
    abbreviation: "pcs"
  },
  selected: false,
  custom_sections: [],
  delivery_schedule: []
});

// 3. Modify existing items (changed)
// Change quantity and cost of PCB-CAP-001
const capItem = pcbAssemblyBomV2.bom_items[0].sub_bom_items.find(
  (item: any) => item.raw_material_item?.code === 'PCB-CAP-001'
);
if (capItem) {
  capItem.quantity = 6; // Changed from 4
  capItem.cost_per_unit = 1.8; // Changed from 1.5
}

// Change cost of PCB-IC-001
const icItem = pcbAssemblyBomV2.bom_items[1].sub_bom_items.find(
  (item: any) => item.raw_material_item?.code === 'PCB-IC-001'
);
if (icItem) {
  icItem.cost_per_unit = 28.0; // Changed from 25.0
}

// BOM-level changes for PCB Assembly
// 1. Add a new sub-BOM (Testing Module)
pcbAssemblyBomV2.bom_items.push({
  entry_id: "pcb-sub-3",
  bom_item_id: "pcb-sub-bom-3",
  sub_bom: {
    enterprise_bom_id: "sub-pcb-003",
    bom_code: "PCB-SUB-003",
    bom_name: "Testing & Diagnostic Module"
  },
  sub_bom_items: [
    {
      entry_id: "pcb-rm-006",
      bom_item_id: "pcb-rm-bom-006",
      sub_bom: null,
      sub_bom_items: null,
      raw_material_item: {
        enterprise_item_id: "pcb-item-006",
        code: "PCB-LED-002",
        name: "LED Green 5mm",
        measurement_units: {
          item_measurement_units: [{
            abbreviation: "pcs",
            measurement_unit_id: "21213178-90a1-4663-bd7c-8b79dedc295a",
            measurement_unit_category: "UNITS",
            measurement_unit_value_type: "DECIMAL",
            measurement_unit_primary_name: "Pieces"
          }]
        },
        tags: ["LED", "Indicator", "Testing"]
      },
      alternates: [],
      quantity: 1,
      cost_per_unit: 0.8,
      measurement_unit: {
        measurement_unit_id: "21213178-90a1-4663-bd7c-8b79dedc295a",
        measurement_unit_primary_name: "Pieces",
        measurement_unit_category: "UNITS",
        measurement_unit_value_type: "DECIMAL",
        abbreviation: "pcs"
      },
      selected: false,
      custom_sections: [],
      delivery_schedule: []
    }
  ],
  quantity: 1,
  cost_per_unit: 0,
  measurement_unit: {
    measurement_unit_id: "21213178-90a1-4663-bd7c-8b79dedc295a",
    measurement_unit_primary_name: "Pieces",
    measurement_unit_category: "UNITS",
    measurement_unit_value_type: "DECIMAL",
    abbreviation: "pcs"
  },
  selected: false,
  custom_sections: [],
  delivery_schedule: []
});

// 2. Modify quantity of Control Circuit Module (BOM-level change)
pcbAssemblyBomV2.bom_items[1].quantity = 2; // Changed from 1

// BOM Sample Data - Multiple variants for comparison
export const bomList: Array<{ id: string; name: string; data: any }> = [
  {
    id: 'bom1',
    name: 'QAB1 - Version 1 (Baseline)',
    data: fullBomData.bomSample1
  },
  {
    id: 'bom2',
    name: 'QAB1 - Version 2 (With Changes)',
    data: createModifiedVersion(fullBomData.bomSample1)  // Use bomSample1 as base
  },
  {
    id: 'bom3',
    name: 'PCB Assembly - Version 1 (Baseline)',
    data: pcbAssemblyBomV1
  },
  {
    id: 'bom4',
    name: 'PCB Assembly - Version 2 (With Changes)',
    data: pcbAssemblyBomV2
  },
];

// Export the full BOM samples for reference
export const bomSample1 = fullBomData.bomSample1;
export const bomSample2 = createModifiedVersion(fullBomData.bomSample1);
