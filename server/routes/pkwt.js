import express from 'express';
import multer from 'multer';
import csv from 'csv-parser';
import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import pool from '../db.js';

const router = express.Router();
// Multer config to preserve extension for easier type checking
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.resolve('uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir)
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname)) // Append extension
    }
})
const upload = multer({ storage: storage });

// Create uploads directory if it doesn't exist
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

// Get all PKWT records
router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM pkwt ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create single PKWT record
router.post('/', async (req, res) => {
    const {
        name, position, work_location, contract_number,
        start_date, end_date, duration, compensation_pay_date, notes
    } = req.body;

    try {
        const newPkwt = await pool.query(
            `INSERT INTO pkwt (
                name, position, work_location, contract_number,
                start_date, end_date, duration, compensation_pay_date, notes
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
            [name, position, work_location, contract_number, start_date, end_date, duration, compensation_pay_date, notes]
        );

        res.status(201).json(newPkwt.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update PKWT record
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const {
        name, position, work_location, contract_number,
        start_date, end_date, duration, compensation_pay_date, status, notes
    } = req.body;

    try {
        const updatedPkwt = await pool.query(
            `UPDATE pkwt SET
                name = $1, position = $2, work_location = $3, contract_number = $4,
                start_date = $5, end_date = $6, duration = $7,
                compensation_pay_date = $8, status = $9, notes = $10
            WHERE id = $11 RETURNING *`,
            [name, position, work_location, contract_number, start_date, end_date,
                duration, compensation_pay_date, status, notes, id]
        );

        if (updatedPkwt.rows.length === 0) {
            return res.status(404).json({ message: 'PKWT not found' });
        }

        res.json(updatedPkwt.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete PKWT record
router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const deletedPkwt = await pool.query(
            'DELETE FROM pkwt WHERE id = $1 RETURNING *',
            [id]
        );

        if (deletedPkwt.rows.length === 0) {
            return res.status(404).json({ message: 'PKWT not found' });
        }

        res.json({ message: 'PKWT deleted successfully', data: deletedPkwt.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});


// Helper function to insert data
const insertData = async (data) => {
    let successCount = 0;
    let errorCount = 0;

    for (const row of data) {
        try {
            // Normalize keys if needed (e.g. if Excel headers have spaces)
            // Assuming headers match DB columns for simplicity or basic mapping
            const name = row.name || row.Name;
            const position = row.position || row.Position;
            const work_location = row.work_location || row['Work Location'];
            const contract_number = row.contract_number || row['Contract Number'];
            const start_date = row.start_date || row['Start Date'];
            const end_date = row.end_date || row['End Date'];
            const duration = row.duration || row.Duration;
            const compensation_pay_date = row.compensation_pay_date || row['Compensation Pay Date'];
            const notes = row.notes || row.Notes;

            if (!name || !start_date || !end_date) {
                errorCount++;
                continue;
            }

            await pool.query(
                `INSERT INTO pkwt (
                    name, position, work_location, contract_number,
                    start_date, end_date, duration, compensation_pay_date, notes
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                [
                    name, position, work_location, contract_number,
                    start_date, end_date, duration, compensation_pay_date, notes
                ]
            );
            successCount++;
        } catch (err) {
            console.error('Error inserting row:', row, err);
            errorCount++;
        }
    }
    return { successCount, errorCount };
};

// Bulk upload via CSV or XLSX
router.post('/upload', (req, res) => {
    upload.single('file')(req, res, async (err) => {
        if (err) {
            console.error('Multer/Upload Error:', err);
            return res.status(500).json({ message: 'File upload failed', error: err.message });
        }

        console.log('Upload request received');

        if (!req.file) {
            console.error('No file uploaded');
            return res.status(400).json({ message: 'No file uploaded' });
        }

        console.log('File uploaded:', req.file);

        const filePath = req.file.path;
        const ext = path.extname(req.file.originalname).toLowerCase();

        try {
            if (ext === '.xlsx' || ext === '.xls') {
                console.log('Processing Excel file...');
                const workbook = XLSX.readFile(filePath);
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const data = XLSX.utils.sheet_to_json(worksheet, { raw: false, dateNF: 'yyyy-mm-dd' });

                const { successCount, errorCount } = await insertData(data);

                // Delete temp file
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

                console.log(`Excel processed. Success: ${successCount}, Failed: ${errorCount}`);
                res.json({
                    message: 'Excel processing completed',
                    summary: {
                        total: data.length,
                        success: successCount,
                        failed: errorCount
                    }
                });

            } else {
                console.log('Processing CSV file...');
                const results = [];
                fs.createReadStream(filePath)
                    .pipe(csv())
                    .on('data', (data) => results.push(data))
                    .on('end', async () => {
                        const { successCount, errorCount } = await insertData(results);

                        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

                        console.log(`CSV processed. Success: ${successCount}, Failed: ${errorCount}`);
                        res.json({
                            message: 'CSV processing completed',
                            summary: {
                                total: results.length,
                                success: successCount,
                                failed: errorCount
                            }
                        });
                    })
                    .on('error', (csvErr) => {
                        console.error('CSV Parsing Error:', csvErr);
                        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                        res.status(500).json({ message: 'Error processing CSV file: ' + csvErr.message });
                    });
            }
        } catch (procErr) {
            console.error('Processing Logic Error:', procErr);
            if (req.file && fs.existsSync(req.file.path)) {
                try { fs.unlinkSync(req.file.path); } catch (ignore) { }
            }
            res.status(500).json({ message: 'Internal Server Error', error: procErr.message });
        }
    }); // End of upload.single callback
});

export default router;
