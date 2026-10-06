// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
import 'jest-canvas-mock';


// src/setupTests.js

jest.mock('react-chartjs-2', () => {
  const React = require('react');

  return {
    Bar: React.forwardRef(function MockBar({ data, options }, ref) {
      const canvasRef = React.useRef(null);

      React.useImperativeHandle(ref, () => ({
        get canvas() {
          return canvasRef.current;
        },
        config: {
          type: "bar",
          data,
          options,
        },
      }));

      React.useEffect(() => {
        options?.animation?.onComplete?.();
      }, [options]);

      return React.createElement('canvas', { ref: canvasRef });
    }),
  };
});

HTMLCanvasElement.prototype.getContext = () => {
  return {
    // optionally mock any methods your code might call on the context
    fillRect: () => {},
    clearRect: () => {},
    getImageData: () => ({ data: [] }),
    putImageData: () => {},
    createImageData: () => [],
    setTransform: () => {},
    drawImage: () => {},
    save: () => {},
    fillText: () => {},
    restore: () => {},
    beginPath: () => {},
    moveTo: () => {},
    lineTo: () => {},
    closePath: () => {},
    stroke: () => {},
    translate: () => {},
    scale: () => {},
    rotate: () => {},
    arc: () => {},
    fill: () => {},
    measureText: () => ({ width: 0 }),
    transform: () => {},
    rect: () => {},
    clip: () => {},
  };
};



