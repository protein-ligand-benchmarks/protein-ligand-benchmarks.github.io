import Chart from "chart.js/auto";
import { Bar } from "react-chartjs-2";
import { useMemo, useRef, useState } from "react";

function cloneChartData(data) {
  return {
    labels: [...(data.labels || [])],
    datasets: (data.datasets || []).map((dataset) => ({
      ...dataset,
      data: Array.isArray(dataset.data) ? [...dataset.data] : dataset.data,
      backgroundColor: Array.isArray(dataset.backgroundColor)
        ? [...dataset.backgroundColor]
        : dataset.backgroundColor,
    })),
  };
}

function createExportCanvas(chart) {
  const renderCanvas = document.createElement("canvas");
  renderCanvas.width = DISPLAY_WIDTH;
  renderCanvas.height = DISPLAY_HEIGHT;

  const exportChart = new Chart(renderCanvas, {
    type: chart.config.type,
    data: cloneChartData(chart.config.data),
    options: {
      ...chart.config.options,
      responsive: false,
      maintainAspectRatio: false,
      animation: false,
      devicePixelRatio: EXPORT_PIXEL_RATIO,
    },
  });

  const exportCanvas = document.createElement("canvas");
  exportCanvas.width = renderCanvas.width;
  exportCanvas.height = renderCanvas.height;

  const context = exportCanvas.getContext("2d");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
  context.drawImage(renderCanvas, 0, 0);
  exportChart.destroy();

  return exportCanvas;
}

export function buildSvgDocument(pngDataUrl) {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<svg xmlns="http://www.w3.org/2000/svg" width="' +
      DISPLAY_WIDTH +
      '" height="' +
      DISPLAY_HEIGHT +
      '" viewBox="0 0 ' +
      DISPLAY_WIDTH +
      " " +
      DISPLAY_HEIGHT +
      '">',
    '<rect width="100%" height="100%" fill="#ffffff"/>',
    '<image href="' +
      pngDataUrl +
      '" width="' +
      DISPLAY_WIDTH +
      '" height="' +
      DISPLAY_HEIGHT +
      '"/>',
    "</svg>",
  ].join("");
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export const BarChart = ({
  chartData,
  options,
  title,
  downloadBaseName = "benchmark-chart",
  children,
}) => {
  const chartRef = useRef(null);
  const [readyChartKey, setReadyChartKey] = useState(null);
  const chartKey = JSON.stringify({
    chartData,
    title,
    yAxisTitle: options?.scales?.y?.title?.text,
  });
  const hasData = Boolean(chartData?.labels?.length && chartData?.datasets?.[0]?.data?.length);
  const canDownload = hasData && readyChartKey === chartKey;
  const chartOptions = useMemo(
    () => ({
      plugins: {
        title: {
          display: true,
          text: title || "Error of tested methods",
          font: {
            size: 16,
          },
        },
        legend: {
          display: false,
        },
      },
      ...options,
      animation: {
        ...(options?.animation || {}),
        onComplete: (...args) => {
          options?.animation?.onComplete?.(...args);
          setReadyChartKey(chartKey);
        },
      },
    }),
    [chartKey, options, title]
  );

  const getPngDataUrl = () => {
    if (!chartRef.current) {
      return null;
    }

    return createExportCanvas(chartRef.current).toDataURL("image/png");
  };

  const handleSvgDownload = () => {
    const pngDataUrl = getPngDataUrl();
    if (!pngDataUrl) {
      return;
    }

    const svg = buildSvgDocument(pngDataUrl);
    downloadBlob(
      new Blob([svg], { type: "image/svg+xml;charset=utf-8" }),
      downloadBaseName + ".svg"
    );
  };

  const handlePdfDownload = async () => {
    const pngDataUrl = getPngDataUrl();
    if (!pngDataUrl) {
      return;
    }

    const { jsPDF } = await import("jspdf");
    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "px",
      format: [DISPLAY_WIDTH, DISPLAY_HEIGHT],
      hotfixes: ["px_scaling"],
      compress: true,
    });
    pdf.addImage(pngDataUrl, "PNG", 0, 0, DISPLAY_WIDTH, DISPLAY_HEIGHT);
    pdf.save(downloadBaseName + ".pdf");
  };

  return (
    <>
      <div
        className="chart-panel"
        style={{ height: DISPLAY_HEIGHT, width: DISPLAY_WIDTH, margin: "auto" }}
      >
        <Bar ref={chartRef} data={chartData} options={chartOptions} />
      </div>
      {children}
      <div className="chart-export-links">
        Export in{""}
        <button
          type="button"
          className="buttonP"
          onClick={handlePdfDownload}
          disabled={!canDownload}
        >
          pdf
        </button>
        or{""}
        <button
          type="button"
          className="buttonP"
          onClick={handleSvgDownload}
          disabled={!canDownload}
        >
          svg
        </button>
      </div>
    </>
  );
};

const DISPLAY_WIDTH = 800;
const DISPLAY_HEIGHT = 600;
const EXPORT_PIXEL_RATIO = 5;
