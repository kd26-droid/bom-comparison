# Data Comparison Tool

A powerful React-based  -style side-by-side comparison component for BOM (Bill of Materials) data structures. Features deep nested object comparison with visual diff highlighting similar to Git/ .

![React](https://img.shields.io/badge/React-18.2.0-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5.2.2-blue) ![Material-UI](https://img.shields.io/badge/Material--UI-5.14.17-blue)

## 🚀 Features

- ** -style Diff Visualization**: True side-by-side comparison with red/green highlighting
- **Deep Nested Comparison**: Handles complex nested objects, arrays, and sub-structures
- **Smart Array Matching**: Matches array items by ID fields for intelligent comparison
- **Material-UI Integration**: Clean, professional UI with Material Design principles
- **TypeScript Support**: Full type safety with interfaces based on real backend data
- **Error Handling**: Comprehensive error detection and user feedback
- **Performance Optimized**: Handles large datasets with efficient comparison algorithms

## 📊 Supported Data Types

### BOM (Bill of Materials)
- Complex nested BOMs with sub-BOMs and items
- Custom fields and sections
- Quantity, pricing, and measurement units
- Delivery schedules and fulfillment information

Note: Quote and Event comparison has been removed.

## 🛠️ Installation

```bash
# Clone or download the project
cd comparison

# Install dependencies
npm install

# Start development server
npm start

# Open browser to http://localhost:3000
```

## 💻 Usage

### Basic Usage

```tsx
import { DataComparison } from './components/DataComparison';

function MyApp() {
  return (
    <DataComparison
      leftData={bomVersion1}
      rightData={bomVersion2}
      leftLabel="BOM Version 1.0"
      rightLabel="BOM Version 1.1"
      dataType="bom"
      showUnchanged={true}
      onComparisonComplete={(summary) => {
        console.log(`Found ${summary.changedFields} changes`);
      }}
    />
  );
}
```

### Props Interface

```tsx
interface IDataComparisonProps {
  leftData: any;                    // Left side data object
  rightData: any;                   // Right side data object
  leftLabel?: string;               // Label for left side (default: "Left Data")
  rightLabel?: string;              // Label for right side (default: "Right Data")
  dataType?: 'bom' | 'auto'; // Data type hint

  // Display Options
  showUnchanged?: boolean;          // Show unchanged fields (default: true)
  expandAll?: boolean;              // Expand all sections (default: false)
  maxDepth?: number;                // Maximum comparison depth (default: 10)

  // Filtering
  customFields?: string[];          // Focus on specific fields only
  excludeFields?: string[];         // Fields to ignore (e.g., timestamps)

  // Callbacks
  onComparisonComplete?: (summary: IComparisonSummary) => void;
  onError?: (error: string) => void;
}
```

## 🎨 Visual Features

### Change Types
- 🟢 **Added**: New fields/values (green background, green border)
- 🔴 **Removed**: Deleted fields/values (red background, red border)
- 🟡 **Modified**: Changed values (yellow background, yellow border)
- ⚪ **Unchanged**: Identical values (transparent background)

### UI Components
- **Expandable Sections**: Group related fields for better organization
- **Tooltips**: Detailed information on hover
- **Change Indicators**: Icons showing the type of change
- **Summary Statistics**: Overview of total changes found
- **Error Handling**: Clear error messages and suggestions

## 📁 Project Structure

```
comparison/
├── src/
│   ├── components/
│   │   ├── DataComparison.tsx      # Main comparison component
│   │   ├── FieldRenderer.tsx       # Individual field rendering
│   │   └── ComparisonSummary.tsx   # Results summary
│   ├── utils/
│   │   └── deepCompare.ts          # Comparison algorithms
│   ├── types/
│   │   └── interfaces.ts           # TypeScript interfaces
│   ├── data/
│   │   └── sampleData.ts           # Sample data from .txt files
│   └── App.tsx                     # Demo application
├── public/
├── package.json
└── README.md
```

## 🔍 Comparison Algorithm

The tool uses a sophisticated deep comparison algorithm:

1. **Type Detection**: Automatically identifies BOM data
2. **Path Tracking**: Maintains full field paths for nested objects
3. **Smart Array Matching**: Matches by ID fields (entry_id, bom_item_id, etc.)
4. **Circular Reference Handling**: Prevents infinite loops
5. **Performance Optimization**: Efficient memory usage for large datasets

## 📊 Sample Data

The project includes real sample data extracted from your .txt files:

- **BOM Samples**: Multiple versions showing quantity and custom field changes

## 🛡️ Error Handling

- **Data Validation**: Checks for malformed JSON and missing fields
- **Comparison Errors**: Handles circular references and deep nesting
- **Performance Monitoring**: Timeout handling for large comparisons
- **User Feedback**: Clear error messages with suggested fixes

## 🎯 Real-World Scenarios

### Version Comparison
```tsx
// Compare two versions of the same BOM
<DataComparison
  leftData={bomV1}
  rightData={bomV2}
  leftLabel="Current Version"
  rightLabel="Updated Version"
  excludeFields={['modified_datetime', 'created_datetime']}
/>
```

// Quote and Event examples removed

## 🚀 Performance Tips

1. **Exclude Timestamps**: Use `excludeFields` to ignore `created_datetime`, `modified_datetime`
2. **Limit Depth**: Set `maxDepth` for very large nested objects
3. **Hide Unchanged**: Set `showUnchanged={false}` for faster rendering
4. **Custom Fields**: Use `customFields` to focus on specific areas

## 📈 Advanced Features

### Custom Field Filtering
```tsx
// Focus only on pricing fields
<DataComparison
  leftData={bom1}
  rightData={bom2}
  customFields={['total', 'cost_per_unit', 'quantity']}
/>
```

### Batch Comparison
```tsx
// Handle comparison results
const handleResults = (summary: IComparisonSummary) => {
  if (summary.changedFields > 0) {
    // Send alert to stakeholders
    notifyStakeholders(summary);
  }
};
```

## 🤝 Contributing

1. Follow the existing code structure
2. Add TypeScript interfaces for new data types
3. Include comprehensive error handling
4. Test with real backend data
5. Update documentation

## 📝 License

This project is proprietary software for internal use.

## 🐛 Troubleshooting

### Common Issues

**Large Dataset Performance**
- Increase `maxDepth` limit
- Use `excludeFields` for unnecessary data
- Enable `showUnchanged={false}`

**Memory Issues**
- Check for circular references in data
- Limit comparison depth
- Consider data preprocessing

**Type Errors**
- Ensure data matches interface definitions
- Use `dataType="auto"` for mixed data
- Check sample data format

### Getting Help

1. Check the technical specification in `DATA_COMPARISON_COMPONENT.md`
2. Review sample data in `src/data/sampleData.ts`
3. Examine the demo in `src/App.tsx`

---

Built with ❤️ using React + Material-UI
