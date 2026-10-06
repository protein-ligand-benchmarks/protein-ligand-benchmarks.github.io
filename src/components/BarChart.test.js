import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { jsPDF } from "jspdf";
import { BarChart, buildSvgDocument } from "./BarChart";

jest.mock("chart.js/auto", () => {
  class MockChart {
    constructor(canvas) {
      canvas.width = 4000;
      canvas.height = 3000;
    }

    destroy() {}
  }

  return {
    __esModule: true,
    default: MockChart,
  };
});

const mockAddImage = jest.fn();
const mockSave = jest.fn();

jest.mock("jspdf", () => ({
  jsPDF: jest.fn(),
}));

const chartData = {
  labels: ["Method A"],
  datasets: [
    {
      label: "Mean Unsigned Error (kcal/mol)",
      data: [2.5],
      backgroundColor: ["#123456"],
    },
  ],
};

const options = {
  scales: {
    x: { title: { text: "Method" } },
    y: { title: { text: "Mean Unsigned Error (kcal/mol)" } },
  },
};

describe("BarChart downloads", () => {
  beforeEach(() => {
    jsPDF.mockImplementation(() => ({
      addImage: mockAddImage,
      save: mockSave,
    }));
    HTMLCanvasElement.prototype.toDataURL = jest.fn(() => "data:image/png;base64,test");
    mockAddImage.mockClear();
    mockSave.mockClear();
  });

  test("keeps downloads disabled without chart data", () => {
    render(<BarChart chartData={{ labels: [], datasets: [] }} options={options} />);

    expect(screen.getByRole("button", { name: "svg" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "pdf" })).toBeDisabled();
  });

  test("enables downloads after animation and creates a chart-sized PDF", async () => {
    render(
      <BarChart
        chartData={chartData}
        options={options}
        title="Test chart"
        downloadBaseName="dataset-kcal-mol"
      />
    );

    const pdfButton = screen.getByRole("button", { name: "pdf" });
    await waitFor(() => expect(pdfButton).toBeEnabled());
    fireEvent.click(pdfButton);

    await waitFor(() =>
      expect(mockAddImage).toHaveBeenCalledWith(
      expect.stringMatching(/^data:image\/png/),
      "PNG",
      0,
      0,
        800,
        600
      )
    );
    expect(mockSave).toHaveBeenCalledWith("dataset-kcal-mol.pdf");
  });

  test("builds an 800 by 600 SVG with a white background and embedded image", () => {
    const svg = buildSvgDocument("data:image/png;base64,example");

    expect(svg).toContain('width="800" height="600"');
    expect(svg).toContain('viewBox="0 0 800 600"');
    expect(svg).toContain('fill="#ffffff"');
    expect(svg).toContain('href="data:image/png;base64,example"');
  });
});
