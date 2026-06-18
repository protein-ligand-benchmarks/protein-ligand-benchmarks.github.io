import './Table.css';
import React from 'react';
import { useState } from 'react';

function Favicon({ url }) {
  const domain = new URL(url).hostname;
  const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;

  return <img src={faviconUrl} alt="favicon" width={20} height={20} />;
} //This function should retrieve the favicon for the website using googles services

export default function Table({columns, modelData, func}){

let rawData = [...modelData]; //This makes a copy of modelData, if you had done rawData=modelaData it would have altered model Data whenever you change rawData
var [sortOn, setsortOn] = useState();
var holder = null;

var header_text = {
	"name": "Method",
	"category": "Category",
	"description": "Description",
	"references": "References",
	"code": "Sources",
	"percentError": "Relative error",
	"rawError": "MUE"
}
  
if (sortOn !== null || sortOn !== holder){
      holder = sortOn;
    rawData.sort((a, b) => {
      if (a[sortOn] < b[sortOn]) {  
        return -1;
      }
      if (a[sortOn] > b[sortOn]) {
        return 1;
      }
      return 0;
    });
  }
  

  return (
        <table className="table" >
    <thead className ="header">
      <tr>
        {columns.map((col) => { if (col === "percentError" || col === "category"){ return(
          <th key={col} className = {"cell"+col}>
            <button onClick = {() => {func(col); setsortOn(col)}} className="sort-button">
            {header_text[col]}
            </button>
          </th>)
        }else{
          return (
            <th key={col} className = {"cell"+col}>
              {header_text[col]}
            </th>
          )
        }
      })}
      </tr>
    </thead>
    <tbody >
      {rawData.map((row, idx) => (
        <tr key={idx}
        className={row.category === "SQM" ? "highlight-sqm" : row.category === "ML" ? "highlight-ml" : row.category === "SQM+ML" ? "highlight-sqmml" : row.category === "DFT" ? "highlight-dft" : ""}
        >
          {columns.map((col) => (
            <td className = {"cell cell"+col}  key={col}>
              { 
              ((col === "code" || col === "references") && Array.isArray(row[col]))? 
                row[col].map((url, idx) => (
                  <a key = {idx} href={url} target="_blank" rel="noreferrer"> 
                    <Favicon url={url} />
                  </a>
                )) 
                : (col === "percentError") ? (row[col].toFixed(2) +" %")
                : (col === "rawError") ? (row[col].toFixed(1) +" kcal/mol")
                : (typeof row[col] === "object" && row[col] !== null)? (JSON.stringify(row[col]))
                : row[col]
              }
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  </table>

  );

 
}
