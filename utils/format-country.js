import { createReadStream, writeFileSync } from 'fs'
import csv from 'csv-parser'

const results = []

createReadStream('../public/data/country.csv')
  .pipe(csv())
  .on('data', data => {
    results.push({
      country_zh: data.country_zh,
      country_en: data.country_en,
      counts: parseInt(data.counts.replace(/"/g, '')),
      area: parseFloat(parseFloat(data.area).toFixed(2)),
    })
  })
  .on('end', () => {
    writeFileSync('../public/data/country.json', JSON.stringify(results, null, 2))
    console.log('CSV file successfully processed and converted to JSON')
  })
