import sql from "@/app/api/utils/sql";

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    
    if (!file) {
      return Response.json({ error: 'No file provided' }, { status: 400 });
    }
    
    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      return Response.json({ error: 'File must contain header and at least one data row' }, { status: 400 });
    }
    
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const requiredHeaders = ['unit_number', 'reading_date', 'water_usage'];
    
    // Validate headers
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    if (missingHeaders.length > 0) {
      return Response.json({ 
        error: `Missing required headers: ${missingHeaders.join(', ')}` 
      }, { status: 400 });
    }
    
    let importedCount = 0;
    let errors = [];
    
    // Process each data row
    for (let i = 1; i < lines.length; i++) {
      try {
        const values = lines[i].split(',').map(v => v.trim());
        const rowData = {};
        
        headers.forEach((header, index) => {
          rowData[header] = values[index] || '';
        });
        
        // Validate required fields
        if (!rowData.unit_number || !rowData.reading_date || !rowData.water_usage) {
          errors.push(`Row ${i + 1}: Missing required fields`);
          continue;
        }
        
        // Parse and validate data
        const waterUsage = parseFloat(rowData.water_usage);
        const electricityUsage = parseFloat(rowData.electricity_usage || '0');
        
        if (isNaN(waterUsage) || waterUsage < 0) {
          errors.push(`Row ${i + 1}: Invalid water usage value`);
          continue;
        }
        
        // Check if unit exists, create if not
        let unit = await sql`
          SELECT id FROM units WHERE unit_number = ${rowData.unit_number}
        `;
        
        if (unit.length === 0) {
          // Create new unit (assuming community_id = 1 for simplicity)
          const newUnit = await sql`
            INSERT INTO units (community_id, unit_number)
            VALUES (1, ${rowData.unit_number})
            RETURNING id
          `;
          unit = newUnit;
        }
        
        const unitId = unit[0].id;
        
        // Insert or update consumption reading
        await sql`
          INSERT INTO consumption_readings (unit_id, reading_date, water_usage, electricity_usage)
          VALUES (${unitId}, ${rowData.reading_date}, ${waterUsage}, ${electricityUsage})
          ON CONFLICT (unit_id, reading_date)
          DO UPDATE SET 
            water_usage = EXCLUDED.water_usage,
            electricity_usage = EXCLUDED.electricity_usage
        `;
        
        importedCount++;
      } catch (rowError) {
        errors.push(`Row ${i + 1}: ${rowError.message}`);
      }
    }
    
    return Response.json({
      success: true,
      importedCount,
      totalRows: lines.length - 1,
      errors: errors.slice(0, 10) // Limit error messages
    });
    
  } catch (error) {
    console.error('Upload error:', error);
    return Response.json({ error: 'Failed to process upload' }, { status: 500 });
  }
}