import { test } from "uvu";
import * as assert from "uvu/assert";

import fs from "fs";
import * as XLSX from "xlsx";
import { readDataFromXlsxWorkbook } from "../src/read-xlsx-workbook";
import { transformData } from "../src/transform-data";

test("read xlsx from workbook", () => {
    const buffer = fs.readFileSync("public/data/data-duerer.xlsx");
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const idPrefix = "duerer";
    const importedData = readDataFromXlsxWorkbook(workbook, idPrefix);
    const transformedData = transformData({ input: importedData, idPrefix });

    // TODO Test Entities and Events
});

test.run();
