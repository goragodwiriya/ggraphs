/**
 * GGraphs is a versatile class for rendering various types of SVG-based graphs, including line, bar, pie, donut, and gauge charts.
 * For more information, visit {@link https://www.kotchasan.com/}.
 *
 * @file GGraphs class implementation.
 * @fileoverview This file contains the implementation of the GGraphs class.
 * @link https://www.kotchasan.com/
 * @copyright 2024 Goragod.com
 * @license https://www.kotchasan.com/license/
 */
class GGraphs {
  /**
   * Creates an instance of GGraphs.
   * @param {string} containerId - The ID of the container element where the graph will be rendered.
   * @param {Object} [options={}] - Configuration options for the graph.
   */
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      throw new Error(`Container with ID "${containerId}" not found.`);
    }

    this.width = this.container.clientWidth;
    this.height = this.container.clientHeight;
    this.createSVG();

    const containerStyles = window.getComputedStyle(this.container);
    const defaultFontSize = parseInt(containerStyles.fontSize, 10);
    const defaultFontFamily = containerStyles.fontFamily;
    const defaultTextColor = containerStyles.color;
    const defaultBackgroundColor = containerStyles.backgroundColor;

    this.options = {
      colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F9ED69', '#F08A5D', '#B83B5E', '#6A2C70', '#00B8A9', '#F8F3D4', '#3F72AF'],
      backgroundColor: defaultBackgroundColor,
      showGrid: true,
      gridColor: '#E0E0E0',
      axisColor: '#333333',
      curveType: 'linear',
      maxGaugeValue: 100,
      centerText: null,
      showCenterText: true,
      gap: 2,
      borderWidth: 1,
      borderColor: '#000000',
      pointRadius: 4,
      lineWidth: 2,
      fillArea: false,
      fillOpacity: 0.1,
      fontFamily: defaultFontFamily,
      textColor: defaultTextColor,
      fontSize: defaultFontSize,
      showAxisLabels: true,
      showAxis: true,
      animationDuration: 1000,
      donutThickness: 50,
      gaugeCurveWidth: 20,
      showLegend: true,
      legendPosition: 'bottom',
      showTooltip: true,
      tooltipFormatter: null,
      showDataLabels: true,
      animation: true,
      maxDataPoints: 20,
      type: 'line',
      table: null,
      data: null,
      onClick: null,
      ...options
    };

    this.validateOptions(this.options);

    this.data = [];
    this.minValue = 0;
    this.maxValue = 0;
    this.currentChartType = this.options.type;
    this.legend = null;
    this.calculateFontSize();

    this.setMargins();
    this.visibleDataCount = this.calculateVisibleDataCount();

    if (this.options.table) {
      this.initialize();
    } else if (this.options.data) {
      this.setData(this.options.data);
      this.renderGraph();
    }

    this.handleResize = this.debounce(this.handleResize.bind(this), 200);
    window.addEventListener('resize', this.handleResize);
  }

  /**
   * Validates the provided options object.
   * @param {Object} options - The options to validate.
   */
  validateOptions(options) {
    if (options.colors && !Array.isArray(options.colors)) {
      throw new TypeError('Option "colors" must be an array.');
    }
    if (typeof options.showGrid !== 'boolean') {
      throw new TypeError('Option "showGrid" must be a boolean.');
    }
    if (typeof options.legendPosition !== 'string') {
      throw new TypeError('Option "legendPosition" must be a string.');
    }
    if (typeof options.maxGaugeValue !== 'number') {
      throw new TypeError('Option "maxGaugeValue" must be a number.');
    }
    // Add more validations as needed
  }

  /**
   * Creates an SVG element and appends it to the container.
   */
  createSVG() {
    this.svg = this.createSVGElement('svg', {
      width: '100%',
      height: '100%',
      viewBox: `0 0 ${this.width} ${this.height}`,
      role: 'img',
      'aria-label': 'SVG Data Graph'
    });
    this.container.appendChild(this.svg);
  }

  /**
   * Creates an SVG element with the specified attributes.
   * @param {string} type - The type of SVG element to create.
   * @param {Object} [attributes={}] - The attributes to set on the SVG element.
   * @returns {SVGElement} The created SVG element.
   */
  createSVGElement(type, attributes = {}) {
    const elem = document.createElementNS('http://www.w3.org/2000/svg', type);
    Object.keys(attributes).forEach(attr => elem.setAttribute(attr, attributes[attr]));
    return elem;
  }

  /**
   * Clears the existing SVG content and creates a new SVG element.
   */
  clear() {
    if (this.svg && this.container.contains(this.svg)) {
      this.container.removeChild(this.svg);
    }
    this.createSVG();
  }

  /**
   * Creates a debounced version of the provided function.
   * @param {Function} func - The function to debounce.
   * @param {number} wait - The debounce interval in milliseconds.
   * @returns {Function} The debounced function.
   */
  debounce(func, wait) {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  /**
   * Calculates and sets the font size based on the container dimensions.
   */
  calculateFontSize() {
    const minDimension = Math.min(this.width, this.height);
    this.options.fontSize = Math.max(10, Math.min(this.options.fontSize, minDimension / 20));
    this.options.labelFontSize = this.options.fontSize * 0.8;
  }

  /**
   * Calculates the number of visible data points based on the configuration.
   * @returns {number} The number of visible data points.
   */
  calculateVisibleDataCount() {
    if (!this.data || this.data.length === 0 || !this.data[0].data) {
      return 0;
    }
    if (this.options.maxDataPoints === 0) {
      return this.data[0].data.length;
    }
    return Math.min(this.options.maxDataPoints, this.data[0].data.length);
  }

  /**
   * Handles window resize events by updating dimensions and redrawing the graph.
   */
  handleResize() {
    this.width = this.container.clientWidth;
    this.height = this.container.clientHeight;
    this.svg.setAttribute('viewBox', `0 0 ${this.width} ${this.height}`);
    this.calculateFontSize();
    this.setMargins();
    this.visibleDataCount = this.calculateVisibleDataCount();
    this.redrawGraph();
  }

  /**
   * Initializes the graph by loading data from a table or the provided data array.
   */
  initialize() {
    this.clear();
    this.calculateFontSize();
    this.setMargins();

    if (this.options.table) {
      const table = document.getElementById(this.options.table);
      if (table) {
        const tableData = this.loadFromTable(table);
        const seriesData = this.processTableData(tableData);
        this.setData(seriesData);
      } else {
        console.warn(`Table with ID "${this.options.table}" not found.`);
      }
    } else if (this.options.data) {
      this.setData(this.options.data);
    }

    this.renderGraph();
  }

  /**
   * Loads raw data from an HTML table.
   * @param {HTMLTableElement} table - The table element to load data from.
   * @returns {Object} The raw table data.
   */
  loadFromTable(table) {
    const rawData = {
      headers: {
        title: '',
        items: []
      },
      rows: []
    };

    const headerCells = table.querySelectorAll('thead > tr:first-child > th');
    headerCells.forEach((cell, index) => {
      if (index === 0) {
        rawData.headers.title = cell.textContent.trim();
      } else {
        rawData.headers.items.push({
          text: cell.textContent.trim(),
          href: cell.querySelector('a') ? cell.querySelector('a').getAttribute('href') : null,
          target: cell.querySelector('a') ? cell.querySelector('a').getAttribute('target') : null
        });
      }
    });

    const bodyRows = table.querySelectorAll('tbody > tr');
    bodyRows.forEach(tr => {
      const row = {
        title: '',
        items: []
      };
      const cells = tr.querySelectorAll('th, td');
      cells.forEach((cell, index) => {
        if (cell.tagName === 'TH') {
          row.title = cell.textContent.trim();
        } else {
          const value = cell.dataset.value ? parseFloat(cell.dataset.value) : parseFloat(cell.textContent.replace(/,/g, ''));
          const tooltip = cell.dataset.tooltip ? cell.dataset.tooltip : `${rawData.headers.title} ${rawData.headers.items[index - 1].text} ${row.title} ${value}`;
          row.items.push({
            value: value,
            tooltip: tooltip,
            label: row.title,
            color: cell.dataset.color || null
          });
        }
      });
      rawData.rows.push(row);
    });

    return rawData;
  }

  /**
   * Processes raw table data into a series data format suitable for the graph.
   * @param {Object} rawData - The raw table data.
   * @returns {Array} The processed series data.
   */
  processTableData(rawData) {
    const processedData = [];

    rawData.headers.items.forEach((header, seriesIndex) => {
      const series = {
        name: header.text,
        color: this.options.colors[seriesIndex % this.options.colors.length],
        data: []
      };

      rawData.rows.forEach(row => {
        const point = row.items[seriesIndex];
        if (point) {
          series.data.push({
            label: row.title,
            value: point.value,
            tooltip: point.tooltip,
            color: point.color
          });
        }
      });

      processedData.push(series);
    });

    return processedData;
  }

  /**
   * Sets the data for the graph and updates the range.
   * @param {Array} data - The data to set.
   */
  setData(data) {
    if (!Array.isArray(data)) {
      throw new Error('Data must be an array of series.');
    }
    this.data = data;
    const allValues = data.flatMap(series => series.data.map(point => point.value));
    this.minValue = Math.min(...allValues);
    this.maxValue = Math.max(...allValues);
    this.calculateNiceRange();
    this.visibleDataCount = this.calculateVisibleDataCount();
    this.renderGraph();
  }

  /**
   * Calculates a "nice" range for the y-axis based on the data.
   */
  calculateNiceRange() {
    const range = this.maxValue - this.minValue;
    if (range === 0) {
      this.minNice = this.minValue - 1;
      this.maxNice = this.maxValue + 1;
      return;
    }
    const roughStep = range / 5;
    const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
    const niceStep = Math.ceil(roughStep / magnitude) * magnitude;

    this.minNice = Math.floor(this.minValue / niceStep) * niceStep;
    this.maxNice = Math.ceil(this.maxValue / niceStep) * niceStep;

    if (this.minValue > 0) {
      if (this.minValue === this.minNice) {
        this.minNice = Math.max(0, this.minNice - niceStep);
      }
      if (this.maxValue === this.maxNice) {
        this.maxNice += niceStep;
      }
    }

    if (this.maxValue < 0) {
      if (this.maxValue === this.maxNice) {
        this.maxNice = Math.min(0, this.maxNice + niceStep);
      }
      if (this.minValue === this.minNice) {
        this.minNice -= niceStep;
      }
    }
  }

  /**
   * Draws the axes on the graph.
   */
  drawAxes() {
    const axesGroup = this.createSVGElement('g', {class: 'axes'});

    let yBase = 0;
    if (this.minNice > 0) {
      yBase = this.minNice;
    } else if (this.maxNice < 0) {
      yBase = this.maxNice;
    }

    const xAxis = this.createSVGElement('line', {
      x1: this.margin.left,
      y1: this.getPointY(yBase),
      x2: this.width - this.margin.right,
      y2: this.getPointY(yBase),
      stroke: this.options.axisColor,
      'stroke-width': '2'
    });
    axesGroup.appendChild(xAxis);

    const yAxis = this.createSVGElement('line', {
      x1: this.margin.left,
      y1: this.margin.top,
      x2: this.margin.left,
      y2: this.height - this.margin.bottom,
      stroke: this.options.axisColor,
      'stroke-width': '2'
    });
    axesGroup.appendChild(yAxis);

    if (this.options.showAxisLabels) {
      this.drawYAxisLabels(axesGroup);
    }

    this.svg.appendChild(axesGroup);
  }

  /**
   * Draws the Y-axis labels.
   * @param {SVGElement} axesGroup - The group element to append the labels to.
   */
  drawYAxisLabels(axesGroup) {
    const steps = 5;
    for (let i = 0; i <= steps; i++) {
      const value = this.minNice + (i / steps) * (this.maxNice - this.minNice);
      const y = this.getPointY(value);

      const label = this.createSVGElement('text', {
        x: this.margin.left - 10,
        y: y,
        'text-anchor': 'end',
        'alignment-baseline': 'middle',
        'font-size': this.options.labelFontSize,
        'font-family': this.options.fontFamily,
        fill: this.options.textColor
      });
      label.textContent = this.formatValue(value);
      axesGroup.appendChild(label);
    }
  }

  /**
   * Draws vertical grid lines at the specified x positions.
   * @param {Array<number>} xPositions - The x positions for the grid lines.
   */
  drawVerticalGridLines(xPositions) {
    const gridGroup = this.createSVGElement('g', {class: 'vertical-grid'});

    xPositions.forEach(x => {
      const line = this.createSVGElement('line', {
        x1: x,
        y1: this.margin.top,
        x2: x,
        y2: this.height - this.margin.bottom,
        stroke: this.options.gridColor,
        'stroke-dasharray': '5,5'
      });
      gridGroup.appendChild(line);
    });

    this.svg.appendChild(gridGroup);
  }

  /**
   * Draws a horizontal grid line at the specified y position.
   * @param {number} y - The y position for the grid line.
   */
  drawHorizontalGridLines(y) {
    const gridLine = this.createSVGElement('line', {
      x1: this.margin.left,
      y1: y,
      x2: this.width - this.margin.right,
      y2: y,
      stroke: this.options.gridColor,
      'stroke-width': '1',
      'stroke-dasharray': '5,5'
    });
    this.svg.appendChild(gridLine);
  }

  /**
   * Draws a label at the specified position with optional rotation.
   * @param {number} x - The x position of the label.
   * @param {number} y - The y position of the label.
   * @param {string} text - The text content of the label.
   * @param {boolean} rotate - Whether to rotate the label by 45 degrees.
   */
  drawLabel(x, y, text, rotate) {
    const label = this.createSVGElement('text', {
      x: x,
      y: y,
      'text-anchor': 'middle',
      'font-size': this.options.labelFontSize,
      'font-family': this.options.fontFamily,
      fill: this.options.textColor
    });
    label.textContent = text;
    if (rotate) {
      label.setAttribute('transform', `rotate(45, ${x}, ${y})`);
    }
    this.svg.appendChild(label);
  }

  /**
   * Adds an animation to an SVG element.
   * @param {SVGElement} element - The SVG element to animate.
   * @param {Object} attributes - The attributes to animate.
   */
  addAnimation(element, attributes) {
    if (this.options.animation) {
      const animate = this.createSVGElement('animate');
      for (const [key, value] of Object.entries(attributes)) {
        animate.setAttribute(key, value);
      }
      element.appendChild(animate);
    }
  }

  /**
   * Renders the graph based on the current chart type.
   * @param {boolean} [animation=this.options.animation] - Whether to animate the rendering.
   */
  renderGraph(animation = this.options.animation) {
    try {
      const previousAnimation = this.options.animation;
      this.options.animation = animation;
      this.clear();
      this.setMargins();
      switch (this.currentChartType) {
        case 'line':
          this.drawLineGraph();
          break;
        case 'bar':
          this.drawBarGraph();
          break;
        case 'pie':
          this.drawPieChart(false);
          break;
        case 'donut':
          this.drawPieChart(true);
          break;
        case 'gauge':
          this.drawGauge();
          break;
        default:
          throw new Error(`Unknown chart type: ${this.currentChartType}`);
      }
      if (this.options.showLegend) {
        this.drawLegend();
      }
      this.options.animation = previousAnimation;
    } catch (error) {
      console.error('Error in renderGraph():', error);
    }
  }

  /**
   * Redraws the graph without animation.
   * @param {boolean} [animation=this.options.animation] - Whether to animate the redrawing.
   */
  redrawGraph(animation = this.options.animation) {
    this.renderGraph(animation);
  }

  /**
   * Calculates the x-coordinate for a data point based on its index.
   * @param {number} index - The index of the data point.
   * @returns {number} The x-coordinate.
   */
  getPointX(index) {
    if (this.visibleDataCount <= 1) {
      return this.margin.left + (this.width - this.margin.left - this.margin.right) / 2;
    }
    const availableWidth = this.width - this.margin.left - this.margin.right;
    return this.margin.left + (index / (this.visibleDataCount - 1)) * availableWidth;
  }

  /**
   * Calculates the y-coordinate for a data value.
   * @param {number} value - The data value.
   * @returns {number} The y-coordinate.
   */
  getPointY(value) {
    const availableHeight = this.height - this.margin.top - this.margin.bottom;
    if (this.maxNice === this.minNice) {
      return this.margin.top + availableHeight / 2;
    }
    return this.margin.top + ((this.maxNice - value) / (this.maxNice - this.minNice)) * availableHeight;
  }

  /**
   * Generates a linear path string for a series of data points.
   * @param {Array<Object>} data - The data points.
   * @returns {string} The path string.
   */
  getLinearPath(data) {
    return data.map((point, index) =>
      `${index === 0 ? 'M' : 'L'}${this.getPointX(index)},${this.getPointY(point.value)}`
    ).join(' ');
  }

  /**
   * Generates a curved path string for a series of data points.
   * @param {Array<Object>} data - The data points.
   * @returns {string} The curved path string.
   */
  getCurvePath(data) {
    if (data.length === 0) return '';
    let path = `M${this.getPointX(0)},${this.getPointY(data[0].value)}`;

    for (let i = 1; i < data.length; i++) {
      const x1 = this.getPointX(i - 1);
      const y1 = this.getPointY(data[i - 1].value);
      const x2 = this.getPointX(i);
      const y2 = this.getPointY(data[i].value);

      const controlX1 = x1 + (x2 - x1) / 3;
      const controlX2 = x2 - (x2 - x1) / 3;

      path += ` C${controlX1},${y1} ${controlX2},${y2} ${x2},${y2}`;
    }

    return path;
  }

  /**
   * Describes an arc path.
   * @param {number} x - The x-coordinate of the center.
   * @param {number} y - The y-coordinate of the center.
   * @param {number} radius - The radius of the arc.
   * @param {number} startAngle - The start angle in radians.
   * @param {number} endAngle - The end angle in radians.
   * @returns {string} The SVG path data for the arc.
   */
  describeArc(x, y, radius, startAngle, endAngle) {
    const start = this.polarToCartesian(x, y, radius, endAngle);
    const end = this.polarToCartesian(x, y, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= Math.PI ? "0" : "1";
    return [
      "M", start.x, start.y,
      "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y
    ].join(" ");
  }

  /**
   * Converts polar coordinates to Cartesian coordinates.
   * @param {number} centerX - The x-coordinate of the center.
   * @param {number} centerY - The y-coordinate of the center.
   * @param {number} radius - The radius.
   * @param {number} angleInRadians - The angle in radians.
   * @returns {Object} The Cartesian coordinates.
   */
  polarToCartesian(centerX, centerY, radius, angleInRadians) {
    return {
      x: centerX + (radius * Math.cos(angleInRadians)),
      y: centerY + (radius * Math.sin(angleInRadians))
    };
  }

  /**
   * Adds multiple data points to the graph.
   * @param {Array<Object>} newDataPoints - The new data points to add.
   */
  addDataPoints(newDataPoints) {
    newDataPoints.forEach(({seriesIndex, data}) => {
      if (seriesIndex >= this.data.length) {
        console.error(`Series index ${seriesIndex} out of range.`);
        return;
      }

      this.data[seriesIndex].data.push(data);
      if (this.options.maxDataPoints !== 0 && this.data[seriesIndex].data.length > this.options.maxDataPoints) {
        const removed = this.data[seriesIndex].data.shift();
        if (removed.value === this.minValue || removed.value === this.maxValue) {
          const allValues = this.data.flatMap(series => series.data.map(point => point.value));
          this.minValue = Math.min(...allValues);
          this.maxValue = Math.max(...allValues);
        }
      } else {
        this.minValue = Math.min(this.minValue, data.value);
        this.maxValue = Math.max(this.maxValue, data.value);
      }
    });

    this.calculateNiceRange();
    this.visibleDataCount = this.calculateVisibleDataCount();
    this.redrawGraph(false);
  }

  /**
   * Adds a single data point to a specific series.
   * @param {Object} newData - The new data point to add.
   * @param {number} [seriesIndex=0] - The index of the series to add the data point to.
   */
  addDataPoint(newData, seriesIndex = 0) {
    if (seriesIndex >= this.data.length) {
      console.error('Series index out of range.');
      return;
    }

    this.data[seriesIndex].data.push(newData);
    if (this.options.maxDataPoints !== 0 && this.data[seriesIndex].data.length > this.options.maxDataPoints) {
      const removed = this.data[seriesIndex].data.shift();
      if (removed.value === this.minValue || removed.value === this.maxValue) {
        const allValues = this.data.flatMap(series => series.data.map(point => point.value));
        this.minValue = Math.min(...allValues);
        this.maxValue = Math.max(...allValues);
      }
    } else {
      this.minValue = Math.min(this.minValue, newData.value);
      this.maxValue = Math.max(this.maxValue, newData.value);
    }

    this.calculateNiceRange();
    this.visibleDataCount = this.calculateVisibleDataCount();
    this.redrawGraph();
  }

  /**
   * Draws a line graph based on the current data.
   */
  drawLineGraph() {
    const visibleDataCount = this.visibleDataCount;
    if (visibleDataCount === 0) {
      return;
    }

    const seriesCount = this.data.length;
    const margin = this.margin;
    const availableWidth = this.width - margin.left - margin.right;

    if (this.options.showGrid) {
      const steps = 5;
      for (let i = 0; i <= steps; i++) {
        const y = this.getPointY(this.minNice + (i / steps) * (this.maxNice - this.minNice));
        this.drawHorizontalGridLines(y);
      }

      const xPositionsSet = new Set();
      for (let i = 0; i < visibleDataCount; i++) {
        const x = this.getPointX(i);
        xPositionsSet.add(x);
      }

      const xPositions = Array.from(xPositionsSet);
      this.drawVerticalGridLines(xPositions);
    }

    if (this.options.showAxisLabels && seriesCount > 0) {
      const labels = this.data[0].data.slice(0, this.visibleDataCount).map(point => point.label);
      const labelText = labels.join(' ');
      const estimatedWidth = this.estimateTextWidth(labelText);
      const totalLabelWidth = estimatedWidth + (visibleDataCount * 10);
      const rotate = availableWidth < totalLabelWidth;

      labels.forEach((label, i) => {
        const x = this.getPointX(i);
        this.drawLabel(x, this.height - this.margin.bottom + 20, label, rotate);
      });
    }

    if (this.options.showAxis) {
      this.drawAxes();
    }

    const lineGroup = this.createSVGElement('g', {class: 'lines'});

    const clipPathId = `clipPath-${Date.now()}`;
    const clipPath = this.createSVGElement('clipPath', {id: clipPathId});

    if (this.options.animation) {
      const clipRect = this.createSVGElement('rect', {
        x: margin.left,
        y: margin.top,
        width: '0',
        height: this.height - margin.top - margin.bottom
      });

      const animateClip = this.createSVGElement('animate', {
        attributeName: 'width',
        from: '0',
        to: availableWidth,
        dur: `${this.options.animationDuration}ms`,
        fill: 'freeze'
      });
      clipRect.appendChild(animateClip);
      clipPath.appendChild(clipRect);
      this.svg.appendChild(clipPath);
    }

    this.data.forEach((series, seriesIndex) => {
      const color = series.color || this.options.colors[seriesIndex % this.options.colors.length];
      const linePath = this.createSVGElement('path', {
        d: this.options.curveType === 'curve'
          ? this.getCurvePath(series.data.slice(0, this.visibleDataCount))
          : this.getLinearPath(series.data.slice(0, this.visibleDataCount)),
        stroke: color,
        fill: 'none',
        'stroke-width': this.options.lineWidth
      });

      if (this.options.fillArea) {
        const fillPath = this.createSVGElement('path', {fill: color, 'fill-opacity': this.options.fillOpacity, 'clip-path': `url(#${clipPathId})`});
        const fillY = this.minNice >= 0
          ? this.getPointY(this.minNice)
          : this.maxNice <= 0
            ? this.getPointY(this.maxNice)
            : this.getPointY(0);

        const finalD = `${linePath.getAttribute('d')} L${this.getPointX(this.visibleDataCount - 1)},${fillY} L${this.getPointX(0)},${fillY} Z`;
        let initialD = '';

        if (this.options.animation) {
          linePath.setAttribute('clip-path', `url(#${clipPathId})`);
          initialD = series.data.slice(0, this.visibleDataCount).map((point, index) =>
            `${index === 0 ? 'M' : 'L'}${this.getPointX(index)},${fillY}`
          ).join(' ') + ' Z';
          fillPath.setAttribute('d', initialD);
          const animateFill = this.createSVGElement('animate', {
            attributeName: 'd',
            from: initialD,
            to: finalD,
            dur: `${this.options.animationDuration}ms`,
            fill: 'freeze'
          });
          fillPath.appendChild(animateFill);
        } else {
          fillPath.setAttribute('d', finalD);
        }

        lineGroup.appendChild(fillPath);
      }

      if (this.options.animation) {
        const length = linePath.getTotalLength();
        linePath.setAttribute('stroke-dasharray', length);
        linePath.setAttribute('stroke-dashoffset', length);

        const animate = this.createSVGElement('animate', {
          attributeName: 'stroke-dashoffset',
          from: length,
          to: '0',
          dur: `${this.options.animationDuration}ms`,
          fill: 'freeze'
        });
        linePath.appendChild(animate);
      }

      if (typeof this.options.onClick === 'function') {
        linePath.style.cursor = 'pointer';
        linePath.addEventListener('click', () => {
          this.options.onClick({
            type: 'line',
            series: series,
            data: series.data.slice(0, this.visibleDataCount)
          });
        });
      }

      lineGroup.appendChild(linePath);
    });

    this.svg.appendChild(lineGroup);

    const pointsGroup = this.createSVGElement('g', {class: 'points'});

    this.data.forEach((series, seriesIndex) => {
      const color = series.color || this.options.colors[seriesIndex % this.options.colors.length];
      series.data.slice(0, this.visibleDataCount).forEach((point, index) => {
        const x = this.getPointX(index);
        const y = this.getPointY(point.value);

        const verticalLineHeight = -15;
        const horizontalLineLength = 5;

        const verticalLineXEnd = x + horizontalLineLength;
        const verticalLineYEnd = y + verticalLineHeight;

        const lineVertical = this.createSVGElement('line', {
          x1: x,
          y1: y,
          x2: verticalLineXEnd,
          y2: verticalLineYEnd,
          stroke: color,
          'stroke-width': '1'
        });

        if (this.options.animation) {
          const animateVerticalLine = this.createSVGElement('animate', {
            attributeName: 'y2',
            from: y,
            to: verticalLineYEnd,
            dur: '0.5s',
            fill: 'freeze'
          });
          lineVertical.appendChild(animateVerticalLine);
        }

        pointsGroup.appendChild(lineVertical);

        const horizontalLineXEnd = verticalLineXEnd + horizontalLineLength;
        const lineHorizontal = this.createSVGElement('line', {
          x1: verticalLineXEnd,
          y1: verticalLineYEnd,
          y2: verticalLineYEnd,
          stroke: color,
          'stroke-width': '1'
        });

        if (this.options.animation) {
          lineHorizontal.setAttribute('x2', verticalLineXEnd);
          const animateHorizontalLine = this.createSVGElement('animate', {
            attributeName: 'x2',
            from: verticalLineXEnd,
            to: horizontalLineXEnd,
            dur: '0.5s',
            begin: '0.5s',
            fill: 'freeze'
          });
          lineHorizontal.appendChild(animateHorizontalLine);
        } else {
          lineHorizontal.setAttribute('x2', horizontalLineXEnd);
        }

        pointsGroup.appendChild(lineHorizontal);

        if (this.options.showDataLabels) {
          const label = this.createSVGElement('text', {
            x: horizontalLineXEnd,
            y: verticalLineYEnd,
            'text-anchor': horizontalLineXEnd > x ? 'start' : 'end',
            'alignment-baseline': 'middle',
            'font-size': this.options.labelFontSize,
            'font-family': this.options.fontFamily,
            fill: color
          });
          label.textContent = this.getLabelContent(series, point);

          if (this.options.animation) {
            label.setAttribute('opacity', '0');

            const animateOpacity = this.createSVGElement('animate', {
              attributeName: 'opacity',
              from: '0',
              to: '1',
              dur: '0.5s',
              begin: '0.5s',
              fill: 'freeze'
            });
            label.appendChild(animateOpacity);

            const animatePosition = this.createSVGElement('animateTransform', {
              attributeName: 'transform',
              type: 'translate',
              from: `0,0`,
              to: `${horizontalLineLength},0`,
              dur: '0.5s',
              begin: '0.5s',
              fill: 'freeze'
            });
            label.appendChild(animatePosition);
          }

          pointsGroup.appendChild(label);
        }

        const circle = this.createSVGElement('circle', {
          cx: x,
          cy: y,
          r: this.options.animation ? '0' : this.options.pointRadius,
          fill: this.options.backgroundColor,
          stroke: color,
          'stroke-width': 2
        });

        if (this.options.showTooltip) {
          const title = this.createSVGElement('title');
          title.textContent = this.getTooltipContent(series, point);
          circle.appendChild(title);
          circle.setAttribute('cursor', 'pointer');
        }

        if (typeof this.options.onClick === 'function') {
          circle.style.cursor = 'pointer';
          circle.addEventListener('click', () => {
            this.options.onClick({
              type: 'point',
              series: series,
              data: point
            });
          });
        }

        if (this.options.animation) {
          const animateRadius = this.createSVGElement('animate', {
            attributeName: 'r',
            from: '0',
            to: this.options.pointRadius,
            dur: `${this.options.animationDuration}ms`,
            fill: 'freeze'
          });
          circle.appendChild(animateRadius);

          const animateOpacity = this.createSVGElement('animate', {
            attributeName: 'opacity',
            from: '0',
            to: '1',
            dur: `${this.options.animationDuration}ms`,
            fill: 'freeze'
          });
          circle.appendChild(animateOpacity);
        }

        pointsGroup.appendChild(circle);
      });
    });

    this.svg.appendChild(pointsGroup);

    if (this.options.showCenterText) {
      const centerText = this.createSVGElement('text', {
        x: this.width / 2,
        y: this.height / 2,
        'text-anchor': 'middle',
        'font-size': this.options.fontSize,
        'font-family': this.options.fontFamily,
        fill: this.options.textColor,
        'font-weight': 'bold'
      });
      centerText.textContent = this.options.centerText || '';
      this.svg.appendChild(centerText);
    }
  }

  /**
   * Draws a bar graph based on the current data.
   */
  drawBarGraph() {
    const visibleDataCount = this.visibleDataCount;
    if (visibleDataCount === 0) {
      return;
    }

    const seriesCount = this.data.length;
    const margin = this.margin;
    const availableWidth = this.width - margin.left - margin.right;
    const groupWidth = availableWidth / visibleDataCount;
    const barWidth = groupWidth / (seriesCount + 1);
    const barGap = (groupWidth - seriesCount * barWidth) / (seriesCount + 1);
    const zeroY = this.getPointY(0);

    if (this.options.showGrid) {
      const steps = 5;
      for (let i = 0; i <= steps; i++) {
        const y = this.getPointY(this.minNice + (i / steps) * (this.maxNice - this.minNice));
        this.drawHorizontalGridLines(y);
      }
    }

    const xPositions = [];
    for (let i = 0; i < visibleDataCount; i++) {
      const x = margin.left + i * groupWidth;
      xPositions.push(x);
    }

    if (this.options.showGrid) {
      this.drawVerticalGridLines(xPositions.map(x => x + groupWidth));
    }

    if (this.options.showAxisLabels && this.data.length > 0) {
      const labels = this.data[0].data.slice(0, this.visibleDataCount).map(point => point.label);
      const labelText = labels.join(' ');
      const estimatedWidth = this.estimateTextWidth(labelText);
      const totalLabelWidth = estimatedWidth + (visibleDataCount * 10);
      const rotate = availableWidth < totalLabelWidth;

      labels.forEach((label, i) => {
        const x = xPositions[i] + groupWidth / 2;
        this.drawLabel(x, this.height - margin.bottom + 20, label, rotate);
      });
    }

    if (this.options.showAxis) {
      this.drawAxes();
    }

    this.data.forEach((series, seriesIndex) => {
      series.data.slice(0, visibleDataCount).forEach((point, index) => {
        const x = xPositions[index] + barGap + seriesIndex * (barWidth + barGap);
        let y, height;
        const yValue = this.getPointY(point.value);
        if (this.minNice >= 0 && this.maxNice >= 0) {
          y = yValue;
          height = this.getPointY(this.minNice) - yValue;
        } else if (this.minNice <= 0 && this.maxNice <= 0) {
          y = this.getPointY(this.maxNice);
          height = yValue - y;
        } else {
          y = Math.min(zeroY, yValue);
          height = Math.abs(zeroY - yValue);
        }

        const color = point.color || series.color || this.options.colors[seriesIndex % this.options.colors.length];

        const bar = this.createSVGElement('rect', {
          x: x,
          width: barWidth,
          height: this.options.animation ? '0' : height,
          fill: color
        });

        if (this.options.borderColor) {
          bar.setAttribute('stroke', this.options.borderColor);
          bar.setAttribute('stroke-width', this.options.borderWidth);
        }

        if (this.options.showTooltip) {
          const title = this.createSVGElement('title');
          title.textContent = this.getTooltipContent(series, point);
          bar.appendChild(title);
          bar.setAttribute('cursor', 'pointer');
        }

        if (typeof this.options.onClick === 'function') {
          bar.style.cursor = 'pointer';
          bar.addEventListener('click', () => {
            this.options.onClick({
              type: 'bar',
              series: series,
              data: point
            });
          });
        }

        let yForm;
        if (this.minNice >= 0 && this.maxNice >= 0) {
          yForm = this.getPointY(this.minNice);
        } else if (this.minNice < 0 && this.maxNice < 0) {
          yForm = this.getPointY(this.maxNice);
        } else {
          yForm = this.getPointY(0);
        }

        if (this.options.animation) {
          bar.setAttribute('y', y);
          const animHeight = this.createSVGElement('animate', {
            attributeName: 'height',
            from: '0',
            to: height,
            dur: `${this.options.animationDuration}ms`,
            fill: 'freeze'
          });
          bar.appendChild(animHeight);

          const animY = this.createSVGElement('animate', {
            attributeName: 'y',
            from: yForm,
            to: y,
            dur: `${this.options.animationDuration}ms`,
            fill: 'freeze'
          });
          bar.appendChild(animY);
        } else {
          bar.setAttribute('y', y);
          bar.setAttribute('height', height);
        }

        this.svg.appendChild(bar);

        if (this.options.showDataLabels) {
          const label = this.createSVGElement('text', {
            x: x + barWidth / 2,
            'text-anchor': 'middle',
            'font-size': this.options.labelFontSize,
            'font-family': this.options.fontFamily,
            fill: color
          });
          label.textContent = this.getLabelContent(series, point);

          if (point.value >= 0) {
            label.setAttribute('y', y - 5);
            if (this.options.animation) {
              const animLabelY = this.createSVGElement('animate', {
                attributeName: 'y',
                from: yForm - 5,
                to: y - 5,
                dur: `${this.options.animationDuration}ms`,
                fill: 'freeze'
              });
              label.appendChild(animLabelY);
            }
          } else {
            label.setAttribute('y', y + height + 15);
            if (this.options.animation) {
              const animLabelY = this.createSVGElement('animate', {
                attributeName: 'y',
                from: yForm + 15,
                to: y + height + 15,
                dur: `${this.options.animationDuration}ms`,
                fill: 'freeze'
              });
              label.appendChild(animLabelY);
            }
          }

          this.svg.appendChild(label);
        }
      });
    });
  }

  /**
   * Draws a pie or donut chart based on the current data.
   * @param {boolean} isDonut - Whether to draw a donut chart instead of a pie chart.
   */
  drawPieChart(isDonut = false) {
    if (!this.data || !this.data.length) return;

    const radius = this.options.showLegend
      ? Math.min(this.width - this.margin.left - this.margin.right, this.height - this.margin.top - this.margin.bottom) / 1.6
      : Math.min(this.width - this.margin.left - this.margin.right, this.height - this.margin.top - this.margin.bottom) / 2.2;

    const centerX = this.margin.left + (this.width - this.margin.left - this.margin.right) / 2;
    const centerY = this.margin.top + (this.height - this.margin.top - this.margin.bottom) / 2;

    let startAngle = -Math.PI / 2;

    const total = this.data.reduce((sum, series) => sum + series.data.reduce((s, p) => s + p.value, 0), 0);
    if (total === 0) {
      console.warn('Total value of pie chart is 0. Cannot draw pie chart.');
      return;
    }
    const pieGroup = this.createSVGElement('g', {class: 'pie-group'});

    this.data.forEach((series, seriesIndex) => {
      series.data.forEach((point, index) => {
        const sliceAngle = (point.value / total) * 2 * Math.PI;
        const endAngle = startAngle + sliceAngle;
        const midAngle = startAngle + sliceAngle / 2;
        const color = point.color || series.color || this.options.colors[index % this.options.colors.length];

        const x1 = centerX + radius * Math.cos(startAngle);
        const y1 = centerY + radius * Math.sin(startAngle);
        const x2 = centerX + radius * Math.cos(endAngle);
        const y2 = centerY + radius * Math.sin(endAngle);

        const largeArcFlag = sliceAngle > Math.PI ? "1" : "0";

        const pathData = [
          `M ${centerX} ${centerY}`,
          `L ${x1} ${y1}`,
          `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
          'Z'
        ].join(' ');

        const slice = this.createSVGElement('path', {
          d: pathData,
          fill: color,
          stroke: this.options.gap > 0 ? this.options.backgroundColor : (this.options.borderWidth > 0 ? (this.options.borderColor || '#000') : null),
          'stroke-width': this.options.gap > 0 || this.options.borderWidth > 0 ? this.options.gap > 0 ? this.options.gap : this.options.borderWidth : null
        });

        if (this.options.showTooltip) {
          const title = this.createSVGElement('title');
          title.textContent = this.getTooltipContent(series, point);
          slice.appendChild(title);
          slice.setAttribute('cursor', 'pointer');
        }

        if (typeof this.options.onClick === 'function') {
          slice.style.cursor = 'pointer';
          slice.addEventListener('click', () => {
            this.options.onClick({
              type: 'pie',
              series: series,
              data: point
            });
          });
        }

        if (this.options.animation) {
          const pathLength = slice.getTotalLength();
          slice.setAttribute('stroke-dasharray', pathLength);
          slice.setAttribute('stroke-dashoffset', pathLength);

          const animateSlice = this.createSVGElement('animate', {
            attributeName: 'stroke-dashoffset',
            from: pathLength,
            to: '0',
            dur: `${this.options.animationDuration}ms`,
            fill: 'freeze'
          });
          slice.appendChild(animateSlice);
        }

        pieGroup.appendChild(slice);

        if (this.options.showDataLabels) {
          const labelRadius = radius * 1.2;
          const labelX = centerX + labelRadius * Math.cos(midAngle);
          const labelY = centerY + labelRadius * Math.sin(midAngle);

          const x = centerX + radius * Math.cos(midAngle);
          const y = centerY + radius * Math.sin(midAngle);

          const lineVertical = this.createSVGElement('line', {
            x1: x,
            y1: y,
            x2: labelX,
            y2: labelY,
            stroke: color,
            'stroke-width': '1'
          });

          if (this.options.animation) {
            const animateVerticalLineX = this.createSVGElement('animate', {
              attributeName: 'x2',
              from: x,
              to: labelX,
              dur: '0.5s',
              fill: 'freeze'
            });
            lineVertical.appendChild(animateVerticalLineX);

            const animateVerticalLine = this.createSVGElement('animate', {
              attributeName: 'y2',
              from: y,
              to: labelY,
              dur: '0.5s',
              fill: 'freeze'
            });
            lineVertical.appendChild(animateVerticalLine);
          }
          pieGroup.appendChild(lineVertical);

          const horizontalLineLength = 5;
          const horizontalLineXEnd = labelX > centerX ? labelX + horizontalLineLength : labelX - horizontalLineLength;

          const lineHorizontal = this.createSVGElement('line', {
            x1: labelX,
            y1: labelY,
            y2: labelY,
            stroke: color,
            'stroke-width': '1'
          });

          if (this.options.animation) {
            lineHorizontal.setAttribute('x2', labelX);
            const animateHorizontalLine = this.createSVGElement('animate', {
              attributeName: 'x2',
              from: labelX,
              to: horizontalLineXEnd,
              dur: '0.5s',
              begin: `${this.options.animationDuration / 2}ms`,
              fill: 'freeze'
            });
            lineHorizontal.appendChild(animateHorizontalLine);
          } else {
            lineHorizontal.setAttribute('x2', horizontalLineXEnd);
          }
          pieGroup.appendChild(lineHorizontal);

          const label = this.createSVGElement('text', {
            x: horizontalLineXEnd + (labelX > centerX ? 5 : -5),
            y: labelY,
            'text-anchor': labelX > centerX ? 'start' : 'end',
            'alignment-baseline': 'middle',
            'font-size': this.options.labelFontSize,
            fill: color
          });
          label.textContent = this.getLabelContent(series, point);

          if (this.options.animation) {
            label.setAttribute('opacity', '0');

            const animateOpacity = this.createSVGElement('animate', {
              attributeName: 'opacity',
              from: '0',
              to: '1',
              dur: '0.5s',
              begin: `${this.options.animationDuration / 2}ms`,
              fill: 'freeze'
            });
            label.appendChild(animateOpacity);

            const animatePosition = this.createSVGElement('animateTransform', {
              attributeName: 'transform',
              type: 'translate',
              to: `0,0`,
              from: labelX > centerX ? `-${horizontalLineLength + 5},0` : `${horizontalLineLength + 5},0`,
              dur: '0.5s',
              begin: `${this.options.animationDuration / 2}ms`,
              fill: 'freeze'
            });
            label.appendChild(animatePosition);
          }

          pieGroup.appendChild(label);
        }

        startAngle = endAngle;
      });
    });

    if (isDonut) {
      const donutHole = this.createSVGElement('circle', {
        cx: centerX,
        cy: centerY,
        r: Math.max(0, radius - this.options.donutThickness),
        fill: this.options.backgroundColor
      });

      if (this.options.gap <= 0 && this.options.borderWidth > 0) {
        donutHole.setAttribute('stroke', this.options.borderColor || '#000');
        donutHole.setAttribute('stroke-width', this.options.borderWidth);
      }

      pieGroup.appendChild(donutHole);
    }

    if (this.options.showCenterText) {
      const centerText = this.createSVGElement('text', {
        x: centerX,
        y: centerY,
        'text-anchor': 'middle',
        'alignment-baseline': 'middle',
        'font-size': this.options.fontSize,
        fill: this.options.textColor,
        'font-weight': 'bold'
      });
      centerText.textContent = this.options.centerText !== null
        ? this.options.centerText
        : isDonut ? `Total: ${total}` : '';
      this.svg.appendChild(centerText);
    }

    this.svg.appendChild(pieGroup);
  }

  /**
   * Draws a gauge chart based on the current data.
   */
  drawGauge() {
    const centerX = this.margin.left + (this.width - this.margin.left - this.margin.right) / 2;
    const centerY = this.margin.top + (this.height - this.margin.top - this.margin.bottom) / 2;

    const radius = this.options.showLegend
      ? Math.min(this.width - this.margin.left - this.margin.right, this.height - this.margin.top - this.margin.bottom) / 1.8
      : Math.min(this.width - this.margin.left - this.margin.right, this.height - this.margin.top - this.margin.bottom) / 2;

    const startAngle = -Math.PI * 0.75;
    const endAngle = Math.PI * 0.75;

    const background = this.createSVGElement('path', {
      d: this.describeArc(centerX, centerY, radius, startAngle, endAngle),
      fill: 'none',
      stroke: this.options.gridColor,
      'stroke-width': this.options.gaugeCurveWidth
    });
    this.svg.appendChild(background);

    const value = this.data[0].data[0].value;
    const maxValue = this.options.maxGaugeValue || 100;
    const percentage = (value / maxValue) * 100;
    const valueAngle = startAngle + (percentage / 100) * (endAngle - startAngle);

    const valuePath = this.createSVGElement('path', {
      d: this.describeArc(centerX, centerY, radius, startAngle, valueAngle),
      fill: 'none',
      stroke: this.data[0].color || this.options.colors[0],
      'stroke-width': this.options.gaugeCurveWidth,
      'stroke-linecap': 'round'
    });

    if (typeof this.options.onClick === 'function') {
      valuePath.style.cursor = 'pointer';
      valuePath.addEventListener('click', () => {
        this.options.onClick({
          type: 'gauge',
          series: this.data[0],
          data: this.data[0].data[0]
        });
      });
    }

    if (this.options.animation) {
      const length = valuePath.getTotalLength();
      valuePath.setAttribute('stroke-dasharray', length);
      valuePath.setAttribute('stroke-dashoffset', length);

      const animateGauge = this.createSVGElement('animate', {
        attributeName: 'stroke-dashoffset',
        from: length,
        to: '0',
        dur: `${this.options.animationDuration}ms`,
        fill: 'freeze'
      });
      valuePath.appendChild(animateGauge);
    }

    this.svg.appendChild(valuePath);

    if (this.options.showCenterText) {
      const centerText = this.createSVGElement('text', {
        x: centerX,
        y: centerY,
        'text-anchor': 'middle',
        'dominant-baseline': 'middle',
        'font-size': this.options.fontSize,
        'font-family': this.options.fontFamily,
        fill: this.options.textColor,
        'font-weight': 'bold'
      });
      centerText.textContent = this.options.centerText !== null
        ? this.options.centerText
        : `${this.formatValue(percentage)}%`;
      this.svg.appendChild(centerText);

      const label = this.createSVGElement('text', {
        x: centerX,
        y: centerY + 30,
        'text-anchor': 'middle',
        'font-size': this.options.labelFontSize,
        'font-family': this.options.fontFamily,
        fill: this.options.textColor
      });
      label.textContent = this.data[0].data[0].label || '';
      this.svg.appendChild(label);
    }
  }

  /**
   * Draws the legend for the graph.
   */
  drawLegend() {
    if (!this.options.showLegend) {
      return;
    }

    if (this.legend && this.legend.parentNode === this.svg) {
      this.svg.removeChild(this.legend);
    }

    this.legend = this.createSVGElement('g', {class: 'legend'});

    let startX, startY, stepX, stepY;
    const padding = 10;

    switch (this.options.legendPosition) {
      case 'top':
        startX = this.margin.left;
        startY = padding;
        stepX = 120;
        stepY = 0;
        break;
      case 'bottom':
        startX = this.margin.left;
        startY = this.height - padding;
        stepX = 120;
        stepY = 0;
        break;
      case 'left':
        startX = padding;
        startY = this.margin.top;
        stepX = 0;
        stepY = 25;
        break;
      case 'right':
        startX = this.width - this.margin.right - 100 - padding;
        startY = this.margin.top;
        stepX = 0;
        stepY = 25;
        break;
      default:
        startX = this.margin.left;
        startY = this.height - padding;
        stepX = 120;
        stepY = 0;
    }

    this.data.forEach((series, index) => {
      const color = series.color || this.options.colors[index % this.options.colors.length];
      const x = startX + index * stepX;
      const y = startY + index * stepY;

      const rect = this.createSVGElement('rect', {
        x: x,
        y: y - 10,
        width: 20,
        height: 20,
        fill: color
      });

      const text = this.createSVGElement('text', {
        x: x + 25,
        y: y + 5,
        'font-size': this.options.labelFontSize,
        'font-family': this.options.fontFamily,
        fill: this.options.textColor
      });
      text.textContent = series.name || `Series ${index + 1}`;

      this.legend.appendChild(rect);
      this.legend.appendChild(text);
    });

    this.svg.appendChild(this.legend);
  }

  /**
   * Retrieves the tooltip content for a data point.
   * @param {Object} series - The data series.
   * @param {Object} point - The data point.
   * @returns {string} The tooltip content.
   */
  getTooltipContent(series, point) {
    if (this.options.tooltipFormatter) {
      return this.options.tooltipFormatter(series, point);
    }
    return `${series.name}: ${point.label} - ${point.value}`;
  }

  /**
   * Retrieves the label content for a data point.
   * @param {Object} series - The data series.
   * @param {Object} point - The data point.
   * @returns {string} The label content.
   */
  getLabelContent(series, point) {
    if (this.currentChartType === 'pie' || this.currentChartType === 'donut') {
      return `${point.label}: ${this.formatValue((point.value / this.getTotal(series)) * 100)}%`;
    } else {
      return this.formatValue(point.value);
    }
  }

  /**
   * Formats a numerical value for display.
   * @param {number} value - The value to format.
   * @returns {string} The formatted value.
   */
  formatValue(value) {
    if (Number.isInteger(value)) {
      return value.toString();
    }
    return value.toFixed(1);
  }

  /**
   * Estimates the width of a given text string.
   * @param {string} text - The text to measure.
   * @returns {number} The estimated width in pixels.
   */
  estimateTextWidth(text) {
    const tempText = this.createSVGElement('text', {
      'font-size': this.options.labelFontSize,
      'font-family': this.options.fontFamily
    });
    tempText.textContent = text;
    this.svg.appendChild(tempText);
    const bbox = tempText.getBBox();
    this.svg.removeChild(tempText);
    return bbox.width;
  }

  /**
   * Retrieves the total value of a series.
   * @param {Object} series - The data series.
   * @returns {number} The total value.
   */
  getTotal(series) {
    return series.data.reduce((sum, point) => sum + point.value, 0);
  }

  /**
   * Sets the margins of the graph based on the presence of the legend and other options.
   */
  setMargins() {
    let margin = {top: 50, right: 50, bottom: 50, left: 50};

    if (this.options.showLegend) {
      switch (this.options.legendPosition) {
        case 'top':
          margin.top += 50;
          break;
        case 'bottom':
          margin.bottom += 50;
          break;
        case 'left':
          margin.left += 100;
          break;
        case 'right':
          margin.right += 100;
          break;
        default:
          margin.bottom += 50;
      }
    } else {
      if (['pie', 'donut'].includes(this.options.type)) {
        margin = {top: 20, right: 20, bottom: 20, left: 20};
      } else if (!this.options.showAxisLabels) {
        margin = {top: 10, right: 10, bottom: 10, left: 10};
      }
    }

    this.margin = margin;
  }

  /**
   * Loads and processes data from an HTML table.
   * @param {HTMLTableElement} table - The table element to load data from.
   * @returns {Array} The processed series data.
   */
  loadAndProcessTableData(table) {
    const tableData = this.loadFromTable(table);
    return this.processTableData(tableData);
  }

  /**
   * Calculates a nice range for the y-axis and updates the internal state.
   */
  calculateNiceRange() {
    const range = this.maxValue - this.minValue;
    if (range === 0) {
      this.minNice = this.minValue - 1;
      this.maxNice = this.maxValue + 1;
      return;
    }
    const roughStep = range / 5;
    const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
    const niceStep = Math.ceil(roughStep / magnitude) * magnitude;

    this.minNice = Math.floor(this.minValue / niceStep) * niceStep;
    this.maxNice = Math.ceil(this.maxValue / niceStep) * niceStep;

    if (this.minValue > 0) {
      if (this.minValue === this.minNice) {
        this.minNice = Math.max(0, this.minNice - niceStep);
      }
      if (this.maxValue === this.maxNice) {
        this.maxNice += niceStep;
      }
    }

    if (this.maxValue < 0) {
      if (this.maxValue === this.maxNice) {
        this.maxNice = Math.min(0, this.maxNice + niceStep);
      }
      if (this.minValue === this.minNice) {
        this.minNice -= niceStep;
      }
    }
  }

  /**
   * Loads data from a table and renders the graph.
   */
  initialize() {
    this.clear();
    this.calculateFontSize();
    this.setMargins();

    if (this.options.table) {
      const table = document.getElementById(this.options.table);
      if (table) {
        const processedData = this.loadAndProcessTableData(table);
        this.setData(processedData);
      } else {
        console.warn(`Table with ID "${this.options.table}" not found.`);
      }
    } else if (this.options.data) {
      this.setData(this.options.data);
    }

    this.renderGraph();
  }
}
