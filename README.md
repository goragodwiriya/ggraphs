# GGraphs

GGraphs is a versatile JavaScript library for creating interactive SVG-based graphs and charts.

## Author

[Goragod Wiriya](https://github.com/goragodwiriya)

## Features

- **Chart Types**: Supports line, bar, pie, donut, and gauge charts
- **Customization**: Extensive options for colors, fonts, styles, and animations
- **Responsive**: Automatically adjusts to container size
- **Data Visualization**:
  - Data labels
  - Tooltips
  - Legends
  - Axis labels and grid lines
- **Interactivity**: Click events for data points and chart elements
- **Animation**: Smooth transitions when rendering and updating charts
- **Flexibility**: Load data from JavaScript objects or HTML tables

## Installation

Include the GGraphs.js file in your HTML:

```html
<script src="path/to/GGraphs.js"></script>
```

## Usage

1. Create a container element:

```html
<div id="chart-container" style="width: 600px; height: 400px;"></div>
```

2. Initialize GGraphs with data and options:

```javascript
const graph = new GGraphs('chart-container', {
  type: 'line',
  data: [
    {
      name: 'Sales',
      color: '#FF6B6B',
      data: [
        { label: 'Jan', value: 10 },
        { label: 'Feb', value: 20 },
        { label: 'Mar', value: 15 },
        { label: 'Apr', value: 25 }
      ]
    }
  ],
  showGrid: true,
  showDataLabels: true,
  curveType: 'curve',
  animation: true
});
```

## Key Options

- `type`: Chart type ('line', 'bar', 'pie', 'donut', 'gauge')
- `colors`: Array of colors for data series
- `showGrid`: Display grid lines
- `showDataLabels`: Show data point labels
- `curveType`: Line chart style ('linear' or 'curve')
- `animation`: Enable animations
- `showLegend`: Display chart legend
- `legendPosition`: Position of legend ('top', 'bottom', 'left', 'right')
- `maxDataPoints`: Limit visible data points
- `onClick`: Callback function for click events

Refer to the source code for the complete list of options and their default values.

## Methods

- `setData(data)`: Update chart data
- `addDataPoint(newData, seriesIndex)`: Add a single data point
- `addDataPoints(newDataPoints)`: Add multiple data points
- `redrawGraph()`: Redraw the entire graph

## Browser Support

GGraphs uses SVG for rendering, which is supported in all modern browsers.

## Documentation

For comprehensive usage guide and detailed documentation, visit:
[GGraphs Documentation](https://www.kotchasan.com/knowledge/comprehensive_ggraphs_usage_guide_create_dynamic_svg_charts_with.html)

## Examples

To see GGraphs in action and explore various chart types and configurations, visit our demo page:
[GGraphs Demo](https://goragodwiriya.github.io/ggraphs/)

## Contributing

Contributions are welcome! For more information on how to contribute, please visit:
[Contributing to Kotchasan Projects](https://kotchasan.com)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Links

- [GitHub Repository](https://github.com/goragodwiriya/ggraphs)
- [Author's GitHub](https://github.com/goragodwiriya)
- [Kotchasan Website](https://kotchasan.com)