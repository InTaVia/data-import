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

    fs.writeFileSync("test/output/xlsx-as-json.json", JSON.stringify(importedData, null, 4));

    fs.writeFileSync("test/output/data-duerer.json", JSON.stringify(transformedData, null, 4));
});

test.run();
