// TypeScript interfaces based on exact data from .txt files

// BOM Data Structures
export interface IMeasurementUnit {
  abbreviation: string;
  measurement_unit_id: string;
  measurement_unit_category: string;
  measurement_unit_value_type: string;
  measurement_unit_primary_name: string;
}

export interface IEnterpriseItem {
  enterprise_item_id: string;
  code: string;
  name: string;
  measurement_units: {
    item_measurement_units: IMeasurementUnit[];
  };
  tags: string[];
}

export interface IEnterpriseBOM {
  enterprise_bom_id: string;
  bom_code: string;
  bom_name: string;
  enterprise_item: IEnterpriseItem;
}

export interface ICustomField {
  custom_field_id: string;
  name: string;
  type: string;
  value: any;
  attachments: any[];
  description: string;
  is_locked: boolean;
  is_required: boolean;
  is_visible: boolean;
  is_negotiable: boolean;
  is_mandatory: boolean;
}

export interface ICustomSection {
  custom_section_id: string;
  name: string;
  section_type: string;
  status: string;
  custom_fields: ICustomField[];
  approve_users: any[];
  edit_users: any[];
  view_users: any[];
}

export interface IDeliveryScheduleItem {
  delivery_schedule_item_id: string;
  quantity: number;
  delivery_date: string | null;
  fulfilment_information: {
    draft_rfq: string;
    ongoing_rfq: string;
    project_excess: string;
    project_pending: string;
  };
}

export interface IBOMItemAlternate {
  entry_id: string;
  bom_item_id: string;
  sub_bom: any;
  sub_bom_items: any;
  raw_material_item: IEnterpriseItem;
  alternates: any[];
  quantity: number;
  measurement_unit: string;
  cost_per_unit: number;
  delivery_schedule: IDeliveryScheduleItem[];
  custom_sections: ICustomSection[];
  selected: boolean;
}

export interface IBOMItem {
  entry_id: string;
  bom_item_id: string;
  sub_bom: IEnterpriseBOM | null;
  sub_bom_items: IBOMItem[] | null;
  raw_material_item: IEnterpriseItem | null;
  alternates: IBOMItemAlternate[];
  quantity: number;
  measurement_unit: string;
  cost_per_unit: number;
  delivery_schedule: IDeliveryScheduleItem[];
  custom_sections: ICustomSection[];
  selected: boolean;
}

export interface IProjectBOMResponse {
  entry_id: string;
  base_bom_module_linkage_id: string;
  created_datetime: string;
  modified_datetime: string;
  deleted_datetime: string | null;
  created_by_user_id: string;
  modified_by_user_id: string;
  deleted_by_user_id: string | null;
  enterprise_bom: IEnterpriseBOM;
  quantity: number;
  measurement_unit: {
    measurement_unit_id: string;
    measurement_unit_primary_name: string;
    measurement_unit_category: string;
    measurement_unit_value_type: string;
    abbreviation: string;
  };
  currency_id: string;
  total: number;
  custom_sections: ICustomSection[];
  bom_items: IBOMItem[];
  slabs: Array<{
    entry_id: string;
    quantity: number;
  }>;
}

// Quote Data Structures
export interface IQuoteCustomSection {
  custom_section_id: string;
  name: string;
  custom_fields: ICustomField[];
  assigned_users: any[];
  edit_users: any[];
  view_users: any[];
  start_time: string | null;
  last_modified_time: string | null;
  submission_time: string | null;
  status: string;
  section_type: string;
}

export interface ICurrencyDetails {
  currency_code_abbreviation: string;
  currency_name: string;
  currency_symbol: string;
  entry_id: string;
  decimals: number;
}

export interface IEntityDetails {
  entity_id: string;
  entity_name: string;
}

export interface IUserDetails {
  user_id: string;
  name: string;
}

export interface IProjectDetails {
  project_id: string;
  project_code: string;
  project_name: string;
}

export interface IAdditionalCostFormula {
  operands: Array<{
    field: string;
    value: any;
    field_name: string;
    formula_id: any;
    operand_type: string;
    operator_type: string | null;
  }>;
  formula_string: string;
}

export interface IAdditionalCost {
  conversion_rate: number;
  additional_cost_linkage_id: string;
  additional_cost_id: string;
  source_currency_id: string;
  source_currency_currency_code_abbreviation: string;
  source_currency_currency_symbol: string;
  cost_name: string;
  cost_type: string;
  allocation_type: string | null;
  cost_value: number;
  cost_per_unit: any;
  cost_total: any;
  source_value: number | null;
  cost_source: string;
  formula: IAdditionalCostFormula | null;
  is_calculated: boolean;
  sequence: any;
}

export interface IAttributeValue {
  attribute_value_linkage_id: string;
  attribute_value_id: any;
  value: string;
  measurement_unit: any;
  currency: any;
}

export interface IAttribute {
  attribute_linkage_id: string;
  attribute_id: string;
  attribute_name: string;
  attribute_type: string;
  attribute_values: IAttributeValue[];
}

export interface IProcurementInformation {
  lead_time: number;
  lead_time_period: string;
}

export interface IBOMItemReference {
  entry_id: string;
  quantity: number;
  measurement_unit: string;
  measurement_unit_name: string;
  measurement_unit_abbreviation: string;
  enterprise_bom: {
    entry_id: string;
    bom_code: string;
    quantity: number;
    measurement_unit: string;
    measurement_unit_name: string;
    measurement_unit_abbreviation: string;
    parent_bom_module_linkage: string;
  };
  sub_bom: {
    bom_code: string;
  } | null;
  parent_sub_bom_item: any;
  index: number;
  parent_bom_item_module_linkage: string;
  bom_item: {
    quantity: number;
  };
  alternate_parent_bom_item: any;
}

export interface IQuoteDeliveryScheduleItem {
  delivery_schedule_item_id: string;
  quantity: number;
  delivery_date: string | null;
  bom_item: IBOMItemReference;
  project_id: any;
  project_code: any;
  cost_centre_id: any;
  cost_centre_name: any;
  general_ledger_id: any;
  general_ledger_code: any;
  customer_entity: any;
  parent_delivery_schedule_item: any;
  project_delivery_schedule_item: any;
  fulfilment_information: any;
}

export interface IRFQBidItemDetails {
  rfq_bid_item_id: string;
  pricing_information: {
    price: number;
    total_price: number;
    currency_name: string;
    currency_symbol: string;
    currency_code_id: string;
    shipping_per_unit: number;
    additional_charges: any[];
    landed_total_price: number;
    currency_code_abbreviation: string;
    landed_item_additional_costs_total: number;
  };
  additional_costs: Array<{
    additional_cost_linkage_id: string;
    additional_cost_id: string;
    cost_name: string;
    cost_type: string;
    allocation_type: string;
    cost_value: any;
    source_currency_id: any;
    source_value: any;
    formula: any;
    is_calculated: boolean;
  }>;
}

export interface IRFQEventDetails {
  event_id: string;
  custom_event_id: string;
  event_name: string;
  rfq_entry_id: string;
}

export interface IQuoteItem {
  costing_sheet_item_id: string;
  measurement_unit_details: {
    measurement_unit_id: string;
    measurement_unit_primary_name: string;
  };
  rfq_event_item_id: string;
  rfq_event_details: IRFQEventDetails;
  rfq_bid_item_details: IRFQBidItemDetails;
  enterprise_item_details: {
    enterprise_item_id: string;
    code: string;
    name: string;
    description: string;
    measurement_units: {
      item_measurement_units: IMeasurementUnit[];
    };
    tags: string[];
    attributes: {
      attributes: Array<{
        attribute_name: string;
        attribute_value: string[];
        attribute_exclude: boolean;
      }>;
    };
    custom_ids: {
      custom_ids: any[];
    };
  };
  quantity: number;
  delivery_schedule: IQuoteDeliveryScheduleItem[];
  rate: number;
  additional_costs: IAdditionalCost[];
  taxes: any[];
  discounts: any[];
  other_discounts: any[];
  procurement_information: IProcurementInformation;
  notes: any;
  internal_customer_notes: any;
  external_customer_notes: any;
  attributes: IAttribute[];
  custom_sections: IQuoteCustomSection[];
  custom_fields: any;
  custom_fields_negotiate: {
    section_list: any[];
  };
  conversion_rate: number;
  vendor_entity_details: IEntityDetails;
  vendor_currency_details: ICurrencyDetails;
  vendor_rate: number;
  latest_po_item_details: any[];
  projects: IProjectDetails[];
  attachments: any[];
  created_datetime: string;
  modified_datetime: string;
  deleted_datetime: string | null;
}

export interface IQuoteResponse {
  costing_sheet_id: string;
  custom_costing_sheet_id: string;
  seller_entity_details: IEntityDetails;
  customer_entity_details: IEntityDetails | null;
  customer_contacts: any[];
  internal_notes: any;
  external_notes: any;
  internal_customer_notes: any;
  external_customer_notes: any;
  status_notes: any;
  name: string;
  version: number;
  status: string;
  currency_details: ICurrencyDetails;
  deadline_datetime: string | null;
  validity_datetime: string | null;
  access: string;
  view: string;
  total: number;
  additional_costs: any[];
  attachments: any[];
  additional_details: {
    template_id: string;
  };
  custom_sections: IQuoteCustomSection[];
  custom_fields: any;
  custom_fields_negotiate: {
    section_list: any[];
  };
  created_datetime: string;
  modified_datetime: string;
  modified_by_user_details: IUserDetails;
  deleted_datetime: string | null;
  created_by_user_details: IUserDetails;
  project_details: IProjectDetails;
}

// Event Data Structures
export interface IEventCustomField {
  name: string;
  type: string;
  value: any;
  is_locked: boolean;
  is_visible: boolean;
  description: string;
  is_required: boolean;
  is_negotiable: boolean;
}

export interface IEventCustomSection {
  name: string;
  fields: IEventCustomField[];
}

export interface IEventResponse {
  custom_fields: {
    section_list: IEventCustomSection[];
  };
}

// Comparison Types
export type ComparisonDataType = 'bom';

export interface IComparisonResult {
  path: string;
  leftValue: any;
  rightValue: any;
  changeType: 'added' | 'removed' | 'modified' | 'unchanged';
  dataType: string;
  isNested: boolean;
}

export interface IComparisonSummary {
  totalFields: number;
  changedFields: number;
  addedFields: number;
  removedFields: number;
  modifiedFields: number;
  unchangedFields: number;
  changes: IComparisonResult[];
  errors: string[];
}

export interface IDataComparisonProps {
  leftData: IProjectBOMResponse;
  rightData: IProjectBOMResponse;
  leftLabel?: string;
  rightLabel?: string;
  dataType?: ComparisonDataType | 'auto';
  showUnchanged?: boolean;
  expandAll?: boolean;
  maxDepth?: number;
  customFields?: string[];
  excludeFields?: string[];
  onComparisonComplete?: (summary: IComparisonSummary) => void;
  onError?: (error: string) => void;
}
