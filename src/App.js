import Chart from "chart.js/auto";
import React, { useEffect, useMemo, useState } from "react";
import { CategoryScale } from "chart.js";
import { BarChart } from "./components/BarChart.js";
import "./App.css";
import Video from "./components/Video.js";
import Table from "./components/Table.js";
import logo from "./github-mark.png";

Chart.register(CategoryScale);

const columns = ["name", "category", "description", "references", "code", "percentError", "rawError"];
const hiddenDatasetIds = ["s66"]; // "pl-rex_1k"
const hiddenDatasetIdSet = new Set(hiddenDatasetIds.map((id) => id.toLowerCase()));

export default function App() {
  const [datasets, setDatasets] = useState([]);
  const [activeDatasetId, setActiveDatasetId] = useState(null);
  const [chartMetric, setChartMetric] = useState("percent");
  const [chartData, setChartData] = useState({ labels: [], datasets: [] });
  const [options, setOptions] = useState({
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        title: {
          font: { size: 17 },
          display: true,
          text: "Method",
        },
        ticks: { font: { size: 15 } },
      },
      y: {
        ticks: {
          font: { size: 15 },
          callback: function (value) {
            return value;
          },
        },
        title: {
          font: { size: 17 },
          display: true,
          text: "Relative Error (%)",
        },
      },
    },
  });
  const [isAnimating, setIsAnimating] = useState(true);

  useEffect(() => {
    fetch("/data.json?v=" + Date.now(), {
      headers: { Accept: "application/json" },
    })
      .then((response) => response.json())
      .then((data) => {
        const datasetList = (data.datasets || [])
          .filter((dataset) => !hiddenDatasetIdSet.has((dataset.id || "").toLowerCase()))
          .slice()
          .sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: "base" }));
        setDatasets(datasetList);
        if (datasetList.length) {
          setActiveDatasetId((prev) => {
            if (prev) {
              return prev;
            }

            const pla15Dataset = datasetList.find(
              (dataset) => dataset.id.toLowerCase() === "pla15"
            );
            return (pla15Dataset && pla15Dataset.id) || datasetList[0].id;
          });
        }
      })
      .catch((error) => console.error("Error loading JSON:", error));
  }, []);

  const colors = useMemo(() => {
    return {
      SQM: "rgba(240, 130, 130, 1)",
      ML: "rgba(160, 221, 241, 1)",
      "SQM+ML": "#86fab6ff",
      default: "#fdfeffff",
    };
  }, []);

  const activeDataset = useMemo(
    () => datasets.find((dataset) => dataset.id === activeDatasetId),
    [datasets, activeDatasetId]
  );

  const modelData = useMemo(() => activeDataset?.methods ?? [], [activeDataset]);
  const sortedModelData = useMemo(() => {
    const categoryOrder = { SQM: 0, ML: 1, "SQM+ML": 2 };
    const metricKey = chartMetric === "percent" ? "percentError" : "rawError";

    return modelData
      .slice()
      .sort((a, b) => {
        const categoryDifference =
          (categoryOrder[a.category] ?? Number.MAX_SAFE_INTEGER) -
          (categoryOrder[b.category] ?? Number.MAX_SAFE_INTEGER);

        if (categoryDifference !== 0) {
          return categoryDifference;
        }

        const valueA =
          typeof a[metricKey] === "number" ? a[metricKey] : Number.NEGATIVE_INFINITY;
        const valueB =
          typeof b[metricKey] === "number" ? b[metricKey] : Number.NEGATIVE_INFINITY;

        return valueB - valueA;
      });
  }, [modelData, chartMetric]);

  useEffect(() => {
    if (!sortedModelData.length) {
      setChartData({ labels: [], datasets: [] });
      return;
    }

    const isPercentMetric = chartMetric === "percent";
    const metricLabel = isPercentMetric ? "Relative error (%)" : "Mean Unsigned Error (kcal/mol)";
    const metricKey = isPercentMetric ? "percentError" : "rawError";

    setChartData({
      labels: sortedModelData.map((data) => data.name),
      datasets: [
        {
          label: metricLabel,
          data: sortedModelData.map((data) => data[metricKey]),
          backgroundColor: sortedModelData.map((data) => colors[data.category] || colors.default),
        },
      ],
    });

    setOptions({
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          title: {
            font: { size: 17 },
            display: true,
            text: "Method",
          },
          ticks: { font: { size: 15 } },
        },
        y: {
          ticks: {
            font: { size: 15 },
            callback: function (value) {
              return value;
            },
          },
          title: {
            font: { size: 17 },
            display: true,
            text: isPercentMetric ? "Relative Error (%)" : "Mean Unsigned Error (kcal/mol)",
          },
        },
      },
    });
  }, [sortedModelData, colors, chartMetric]);

  function handleTable() {
    setIsAnimating(false);
    setTimeout(() => setIsAnimating(true), 10);
  }

  const headerTitle =
    activeDataset?.title || "Protein-ligand interaction energy benchmarks";

  return (
    <div className="App">
      <h1 className="header1">
        <div className="header-text">
          <strong>{headerTitle}</strong>
        </div>
        <a
          className="logo"
          href="https://github.com/protein-ligand-benchmarks/protein-ligand-benchmarks.github.io"
          target="_blank"
          rel="noreferrer"
        >
          <img className="gh-logo-icon" src={logo} alt="Source at GitHub" />
        </a>
      </h1>

      {datasets.length > 1 && (
        <div className="dataset-tabs" role="tablist">
          {datasets.map((dataset) => (
            <button
              key={dataset.id}
              role="tab"
              aria-selected={dataset.id === activeDatasetId}
              className={`dataset-tab ${
                dataset.id === activeDatasetId ? "dataset-tab-active" : ""
              }`}
              onClick={() => {
                setActiveDatasetId(dataset.id);
                setChartMetric("percent");
              }}
            >
              {dataset.label}
            </button>
          ))}
        </div>
      )}

      <div className="contain1">
        <div className="chart-container">
          <div className="chart1">
            <BarChart
              chartData={chartData}
              options={options}
              title={activeDataset?.chartTitle}
            />
          </div>
          <div className="buttonContainer">
            The Mean Unsigned Error can be displayed as{" "}
            <button
              className="buttonP"
              onClick={() => setChartMetric("percent")}
              disabled={chartMetric === "percent"}
            >
              percentage of the interaction energy
            </button>{" "}
            or in{" "}
            <button
              className="buttonP"
              onClick={() => setChartMetric("raw")}
              disabled={chartMetric === "raw"}
            >
              kcal/mol
            </button>
          </div>
          <div className="Table">
            <div className="table-note-text">
              <br /> *Please select either accuracy or category to sort by.*
            </div>
            <br />
            <div>
              <div className={`box ${isAnimating ? "animate" : ""}`}>
                <Table
                  className="Tablemain"
                  columns={columns}
                  modelData={sortedModelData}
                  func={() => handleTable()}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="BP1">
          <div className="Inner-Text">
            <p>
              This website collects the results of approximate computational chemistry methods
              and machine learning potentials computed in the{" "}
              <a href="https://doi.org/10.1021/acs.jcim.9b01171">PLA15 benchmark data set</a>.
            </p>
            <p>
              The PLA15 dataset features 15 models of protein-ligand complexes covering the
              interaction of the ligand with nearby amino acid residues. The systems range in size
              from 280 to 580 atoms. Reference interaction energies were obtained from
              fragment-based DLPNO-CCSD(T) calculations and represent the most accurate benchmark
              available for biomolecular systems of this size.
            </p>
            <p>
              The error of the tested method is expressed as a mean unsigned error and listed in
              kcal/mol or in percent relative to the average magnitude of the reference interaction
              energy in the set. The methods are divided into three categories: semiempirical
              quantum-mechanical calculations (SQM), atomistic machine learning potentials (ML), and
              the hybrid methods combining both approaches (SQM+ML).
            </p>
            <p>
              More results can be added via the{" "}
              <a href="https://github.com/protein-ligand-benchmarks/protein-ligand-benchmarks.github.io">
                GitHub repository
              </a>
              , which also provides the PLA15 structures and a sample code performing the
              calculations on them. Contributions of new data are welcome!
            </p>
            <Video />
          </div>
        </div>
      </div>

      <div className="ending">
        <p>
          Built by <a href="https://github.com/Danielk5924">Daniel Konvicka</a>{" "}
          during his internship in{" "}
          <a href="https://rezac.group.uochb.cz/en">Jan Řezáč group</a> at{" "}
          <a href="https://www.uochb.cz/en">IOCB Prague</a>
        </p>
        <p>
          Extended by <a href="https://github.com/tobiasmarek">Marek Tobiáš</a>{" "}
        </p>
      </div>
    </div>
  );
}
