import { test } from "uvu";
import * as assert from "uvu/assert";

import * as XLSX from "xlsx";
import { readDataFromXlsxWorkbook } from "../src/read-xlsx-workbook";

import fs from "fs";
import { transformData } from "../src/transform-data";

// const file = new File();

test("read xlsx from workbook", () => {
    const buffer = fs.readFileSync("public/data/data-duerer.xlsx");
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const idPrefix = "duerer";
    const importedData = readDataFromXlsxWorkbook(workbook, idPrefix);
    const transformedData = transformData(importedData, idPrefix);

    if (!fs.existsSync("test/output")) {
        fs.mkdirSync("test/output");
    }
    const fNImporedData = "test/output/xlsx-as-json.json";
    fs.existsSync(fNImporedData) && fs.unlinkSync(fNImporedData);
    fs.writeFileSync(fNImporedData, JSON.stringify(importedData, null, 4));

    const fNTransformedData = "test/output/data-duerer.json";
    fs.existsSync(fNTransformedData) && fs.unlinkSync(fNTransformedData);
    fs.writeFileSync(fNTransformedData, JSON.stringify(transformedData, null, 4));
});

test.run();
