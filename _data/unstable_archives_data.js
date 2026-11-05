const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

module.exports = function() {
  const csvPath = path.join(__dirname, 'unstable_archives.csv');

  // Check if CSV file exists
  if (!fs.existsSync(csvPath)) {
    console.warn('Warning: unstable_archives.csv not found');
    return [];
  }

  const csv = fs.readFileSync(csvPath, 'utf8');
  const records = parse(csv, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
    trim: true
  });

  // Create a lookup object by pid for easy access
  const dataByPid = {};
  records.forEach(record => {
    if (record.pid) {
      dataByPid[record.pid] = record;
    }
  });

  return {
    items: records,
    byPid: dataByPid
  };
};
