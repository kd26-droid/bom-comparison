# QAB1 BOM — Developer Spec and Comparison (Sample BOM 1 vs 2)

## Scope
Two JSON payloads represent the same enterprise BOM **QAB1** at different production scales. This document defines the data model, the nesting rules, counting semantics, and a level‑by‑level comparison. Use this to build parsing, validation, UI, and analytics.

---

## Canonical Object Shape
Top‑level payload is a **Project BOM** instance (one record per price/quantity scenario):

```jsonc
{
  "entry_id": string,
  "base_bom_module_linkage_id": string,
  "created_datetime": ISO8601,
  "modified_datetime": ISO8601,
  "deleted_datetime": ISO8601|null,
  "created_by_user_id": string,
  "modified_by_user_id": string,
  "deleted_by_user_id": string|null,
  "enterprise_bom": {
    "enterprise_bom_id": string,
    "bom_code": string,          // e.g., "QAB1"
    "bom_name": string,          // e.g., "QAB1"
    "enterprise_item": {
      "enterprise_item_id": string,
      "code": string,            // e.g., "A MAIN BOM"
      "name": string,            // e.g., "A MAIN BOM"
      "measurement_units": {
        "item_measurement_units": [
          {
            "measurement_unit_id": string,
            "measurement_unit_primary_name": string, // "Units"
            "measurement_unit_category": string,     // "UNITS"
            "measurement_unit_value_type": string,   // "DECIMAL"
            "abbreviation": string                   // "units"
          }
        ]
      },
      "tags": string[]
    }
  },
  "quantity": number,             // project BOM quantity for this quote/slab
  "measurement_unit": {           // mirrors enterprise_item unit (e.g., Units)
    "measurement_unit_id": string,
    "measurement_unit_primary_name": string,
    "measurement_unit_category": string,
    "measurement_unit_value_type": string,
    "abbreviation": string
  },
  "currency_id": string,
  "total": number,                // priced total for the BOM instance
  "custom_sections": [            // BOM-level custom data
    {
      "custom_section_id": string,
      "name": "BOM",
      "section_type": "BOM",
      "status": "DRAFT"|"FINAL",
      "custom_fields": [
        { "custom_field_id": string, "name": string, "type": "FLOAT"|..., "value": any, ... }
      ],
      "approve_users": [], "edit_users": [], "view_users": []
    }
  ],
  "bom_items": BOMItem[],         // direct children of QAB1
  "slabs": [ { "entry_id": string, "quantity": number } ] // alternative quantity breaks
}
```

`BOMItem` can be:

```ts
// A child may be a nested BOM (sub‑BOM), or a raw‑material line
interface BOMItem {
  entry_id: string
  bom_item_id: string
  sub_bom: SubBOM | null           // present when item is a nested BOM node
  sub_bom_items: BOMItem[] | null  // children of this sub‑BOM node
  raw_material_item: EnterpriseItem | null // present when this item is a leaf raw material
  alternates: BOMItem[]            // alternate raw materials (leaf nodes) for this position
  quantity: number                 // quantity at **this** node's level
  measurement_unit: string         // refers to a measurement_unit_id (e.g., Pieces)
  cost_per_unit: number            // unit cost at this node
  delivery_schedule: Delivery[]
  custom_sections: CustomSection[]
  selected: boolean                // business selection flag
}

interface SubBOM {
  enterprise_bom_id: string
  bom_code: string
  bom_name: string
  enterprise_item: EnterpriseItem
}

interface EnterpriseItem {
  enterprise_item_id: string
  code: string
  name: string
  measurement_units: { item_measurement_units: MeasurementUnit[] }
  tags: string[]
}

interface MeasurementUnit {
  measurement_unit_id: string
  measurement_unit_primary_name: string // e.g., "Pieces"
  measurement_unit_category: string     // e.g., "UNITS"
  measurement_unit_value_type: string   // e.g., "DECIMAL"
  abbreviation: string                  // e.g., "pcs"
}

interface Delivery {
  delivery_schedule_item_id: string
  quantity: number
  delivery_date: string | null
  fulfilment_information: {
    draft_rfq: string|number,
    ongoing_rfq: string|number,
    project_excess: string|number,
    project_pending: string|number
  }
}
```

---

## Hierarchy and Counting Rules
**Direct items under QAB1** are the elements of `bom_items` at the top level. Do **not** count grandchildren within `sub_bom_items` when reporting direct counts.

Node types:
- **Main BOM**: the top object (QAB1).
- **Sub‑BOM**: a `bom_items` element with `sub_bom != null` and `sub_bom_items` populated (e.g., QASB1, QASB2).
- **Sub‑Sub‑BOM**: a child of a Sub‑BOM that again has `sub_bom != null` (e.g., QASSB1 inside QASB1).
- **Raw Material**: `raw_material_item != null` and `sub_bom == null`.
- **Alternate**: a leaf under `alternates` of a leaf.

Counting policy examples:
- “How many direct items in QAB1?” → count items in `bom_items` ignoring any `sub_bom_items`.
- “How many direct items in QASB1?” → count children in its `sub_bom_items` only.
- “Total raw materials in QASSB1 ignoring alternates” → count `sub_bom_items` where `raw_material_item != null`.

---

## Tree for Sample BOM 1
```
QAB1 (Main BOM)
├─ QASB1 (Sub‑BOM)
│  ├─ QASSB1 (Sub‑Sub‑BOM)
│  │  ├─ RM1  (alternates: RM10, RM100)
│  │  ├─ RM2
│  │  └─ RM3
│  ├─ RM3
│  └─ RM4
├─ QASB2 (Sub‑BOM)
│  ├─ RM5
│  └─ RM6
├─ RM7
└─ RM8
```

**Direct items under QAB1**: 4 → { QASB1, QASB2, RM7, RM8 }

**Direct items under QASB1**: 3 → { QASSB1, RM3, RM4 }

**Direct items under QASSB1**: 3 raw materials → { RM1, RM2, RM3 } with alternates on RM1.

**Direct items under QASB2**: 2 raw materials → { RM5, RM6 }.

---

## Tree for Sample BOM 2
Same structure and names. Quantities and some numeric fields are scaled up.

```
QAB1 (Main BOM)
├─ QASB1 (Sub‑BOM)
│  ├─ QASSB1 (Sub‑Sub‑BOM)
│  │  ├─ RM1  (alternates: RM10, RM100)
│  │  ├─ RM2
│  │  └─ RM3
│  ├─ RM3
│  └─ RM4
├─ QASB2 (Sub‑BOM)
│  ├─ RM5
│  └─ RM6
├─ RM7
└─ RM8
```

---

## Level‑by‑Level Numbers

### Main BOM (QAB1)
- **Sample 1**: `quantity = 10`, `total = 1840`.
- **Sample 2**: `quantity = 20`, `total = 3680`.
- **Custom fields** at BOM level: `Glueing (sec)`, `Consumables`, `Potting (sec)`.
  - Sample 1 values: 1 each.
  - Sample 2 values: 4 each.
- **Slabs** present: quantities 10 and 20.

### Direct items under QAB1
| Child | Type | S1 qty | S1 CPU | S2 qty | S2 CPU |
|---|---|---:|---:|---:|---:|
| QASB1 | Sub‑BOM | 100 | 15 | 200 | 15 |
| QASB2 | Sub‑BOM | 20 | 6 | 40 | 6 |
| RM7   | Raw    | 20 | 1 | 40 | 1 |
| RM8   | Raw    | 20 | 2 | 40 | 2 |

> CPU = cost_per_unit at the node. Quantities are node‑level, not expanded through children.

### Sub‑BOM QASB1 → children
| Child | Type | S1 qty | S1 CPU | S2 qty | S2 CPU |
|---|---|---:|---:|---:|---:|
| QASSB1 | Sub‑Sub‑BOM | 20 | 83 | 40 | 83 |
| RM3    | Raw          | 40 | 2  | 80 | 2  |
| RM4    | Raw          | 80 | 1  | 160| 1  |

### Sub‑Sub‑BOM QASSB1 → children
| Raw Material | S1 qty | S1 CPU | Alternates | S2 qty | S2 CPU |
|---|---:|---:|---|---:|---:|
| RM1 | 500 | 1 | RM10 (500,1), RM100 (500,1) | 1000 | 1 |
| RM2 | 500 | 1 | — | 1000 | 1 |
| RM3 | 500 | 1 | — | 1000 | 1 |

### Sub‑BOM QASB2 → children
| Raw Material | S1 qty | S1 CPU | S2 qty | S2 CPU |
|---|---:|---:|---:|---:|
| RM5 | 40 | 1 | 80 | 1 |
| RM6 | 40 | 2 | 80 | 2 |

---

## Semantics and Edge Cases
- **Totals** are pre‑computed at the BOM instance. Do not re‑derive by naive `Σ(quantity×CPU)` because nested nodes contribute at different levels and alternates may be selectable/non‑selectable. Use the supplied `total` for the instance.
- **Measurement units**: two common units appear:
  - `Units` for BOM level and nested BOM nodes.
  - `Pieces (pcs)` for raw materials.
- **Alternates**: appear only under raw‑material leaves (e.g., RM1 has RM10, RM100). Treat each alternate as a valid substitute leaf with its own quantity, CPU, and delivery schedule. One of them can be the chosen supply path.
- **Delivery schedule**: arrays per leaf with `fulfilment_information` fields. Values may be strings using scientific notation like `"0E-20"` or negatives. Normalize to numbers where needed, but keep original for audit.
- **Custom sections**: `section_type` is `BOM` at BOM and nested BOM nodes; `ITEM` at raw leaves. Status is often `DRAFT` in samples and should not affect parsing.
- **Selected flag**: many leaves include `selected: true`. Use it for UI defaults or costing roll‑ups that only include chosen alternates.
- **Slabs**: provide cross‑references between alternative quantities (e.g., 10 vs 20). Use to choose the correct BOM instance for a requested production batch.

---

## Deterministic Traversal Rules

### Identify direct children of any node
- If the node is Main BOM or a Sub‑BOM: iterate `sub_bom_items` (for Sub‑BOM) or top‑level `bom_items` (for Main BOM).
- Count each element regardless of whether it is a Sub‑BOM or a raw leaf.

### Identify raw materials under a given node
- Traverse its children.
- Include a child when `raw_material_item != null` and `sub_bom == null`.
- Exclude alternates unless explicitly requested.

### Expand alternates
- For each raw leaf `L`, union `{L}` with `L.alternates` when building a “possible supply” set.

---

## JSONPath Cheatsheet
- Main BOM name: `$.enterprise_bom.bom_name` → "QAB1".
- Direct children under QAB1: `$.bom_items[*]`.
- QASB1 node: `$.bom_items[?(@.sub_bom && @.sub_bom.bom_code=="QASB1")]`.
- QASB1 children: `$.bom_items[?(@.sub_bom.bom_code=="QASB1")].sub_bom_items[*]`.
- QASSB1 raw materials: `...sub_bom_items[?(@.sub_bom && @.sub_bom.bom_code=="QASSB1")].sub_bom_items[?(@.raw_material_item)]`.
- Alternates for RM1: append `.alternates[*]` to the RM1 leaf.

---

## Validation Rules to Implement
1. **Structure**
   - A node must satisfy exactly one of:
     - `sub_bom != null` and `raw_material_item == null`, or
     - `sub_bom == null` and `raw_material_item != null`.
   - If `sub_bom != null`, then `sub_bom_items` is an array (may be empty), else `null`.
2. **Units**
   - BOM nodes use `Units`; raw leaves use `Pieces`.
   - `measurement_unit` on a leaf must equal a known `measurement_unit_id` from its `raw_material_item.measurement_units.item_measurement_units` set.
3. **Quantities**
   - All quantities are non‑negative integers.
   - For alternates, quantities should match their parent leaf’s planning baseline unless business rules dictate otherwise.
4. **Costs**
   - `cost_per_unit` is numeric ≥ 0.
   - If a node has `alternates`, cost roll‑up should include only the **selected** path.
5. **Delivery**
   - `delivery_schedule[*].quantity` is numeric ≥ 0.
   - `fulfilment_information` fields parseable as numbers; preserve original string form for audit.

---

## Diff Summary: Sample 1 vs Sample 2
- **Structure**: identical.
- **Quantities**: Sample 2 is exactly ×2 of Sample 1 at all shown levels.
- **Totals**: Sample 2 total is ×2 of Sample 1.
- **Custom fields**: BOM‑level values increase from 1→4 between Sample 1 and Sample 2. Nested BOM nodes show proportional patterns (e.g., 2→3 or 3→2 depending on level in samples). Treat these as per‑level process time/consumable parameters.

---

## Implementation Hints
- Treat this as a **tree**. Use DFS with callbacks for roll‑ups (cost, quantities, counts).
- Keep **direct count** and **expanded count** separate.
- Persist `slabs` as selectable variants for pricing and capacity planning.
- Normalize numeric strings; keep raw JSON for audits.

---

## Glossary
- **Main BOM**: Top‑level QAB1 instance.
- **Sub‑BOM**: Child node with its own `sub_bom` object.
- **Sub‑Sub‑BOM**: A Sub‑BOM nested inside another Sub‑BOM.
- **Raw Material**: Leaf node with `raw_material_item` populated.
- **Alternate**: Substitute raw material leaf listed under `alternates` of a leaf.
- **Direct items**: Children at the current node’s immediate depth, not including grandchildren.

