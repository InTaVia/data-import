# intavia data import

this is a module to import local data into the [intavia frontend](https://github.com/InTaVia/web) using an excel template.

you can find more info about the project on the [intavia website](https://intavia.eu).

## template

An excel template (for the example of Duerer's biography) is in `public/data`.

More detailed information follows.

## how to use

how to use within the [intavia frontend](https://github.com/InTaVia/web) with FileReader (binary file):

```ts
example follows
```

how to use within node with file buffer (see `scripts/xlsx2json2intavia.ts`; run with `npm run generate:xlsx2json2intavia`):

```ts
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { format } from "prettier";
import * as XLSX from "xlsx";
import { readDataFromXlsxWorkbook, transformData } from "../src";

async function generate(path: any) {
    const buffer = await readFile(path);
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const idPrefix = basename(path).replace(/\.xlsx$/, "");
    const importedData = readDataFromXlsxWorkbook(workbook, idPrefix);
    const transformedData = transformData(importedData, idPrefix);

    const fixturesFolder = join(process.cwd(), "public", "fixtures");
    await mkdir(fixturesFolder, { recursive: true });

    await writeFile(
        join(fixturesFolder, `${idPrefix}.json`),
        format(JSON.stringify(transformedData), { parser: "json" }),
        { encoding: "utf-8" }
    );
}

generate("public/data/data-duerer.xlsx")
    .then(() => {
        console.log(`Successfully generated data.`);
    })
    .catch((error) => {
        console.log(`Failed to generate data.\n`, String(error));
    });
```
