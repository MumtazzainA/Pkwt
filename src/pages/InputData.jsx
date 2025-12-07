import React, { useState, useRef } from 'react';
import Sidebar from '../components/Sidebar';

const InputData = () => {
    const [activeTab, setActiveTab] = useState('manual');
    const [file, setFile] = useState(null);
    const [uploadStatus, setUploadStatus] = useState(null);
    const fileInputRef = useRef(null);
    const [formData, setFormData] = useState({
        name: '',
        position: '',
        work_location: '',
        contract_number: '',
        start_date: '',
        end_date: '',
        duration: '',
        compensation_pay_date: '',
        notes: ''
    });

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleFileChange = (e) => {
        if (e.target.files) {
            setFile(e.target.files[0]);
            setUploadStatus(null);
        }
    };

    const handleManualSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/pkwt', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            const text = await response.text();
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                console.error('Non-JSON response:', text);
                alert(`Error: Server returned HTML/invalid response:\n\n${text}`);
                return;
            }

            if (response.ok) {
                alert('Data saved successfully!');
                setFormData({
                    name: '', position: '', work_location: '', contract_number: '',
                    start_date: '', end_date: '', duration: '', compensation_pay_date: '', notes: ''
                });
            } else {
                alert(`Failed to save data: ${data.message || 'Unknown error'}`);
            }
        } catch (err) {
            console.error(err);
            alert(`Error connecting to server: ${err.message}`);
        }
    };

    const handleFileUpload = async () => {
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/pkwt/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            const text = await response.text();
            let result;
            try {
                result = JSON.parse(text);
            } catch (e) {
                console.error('Server returned non-JSON:', text);
                // Show full response for debugging
                setUploadStatus({ type: 'error', message: `Server Error (HTML Response): ${text}` });
                return;
            }

            if (response.ok) {
                setUploadStatus({
                    type: 'success',
                    message: `Upload complete! Processed: ${result.summary.total}, Success: ${result.summary.success}, Failed: ${result.summary.failed}`
                });
                setFile(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
            } else {
                setUploadStatus({ type: 'error', message: result.message || 'Upload failed' });
            }
        } catch (err) {
            console.error(err);
            setUploadStatus({ type: 'error', message: 'Server connection error: ' + err.message });
        }
    };

    const generateTemplate = () => {
        const headers = ["name", "position", "work_location", "contract_number", "start_date", "end_date", "duration", "compensation_pay_date", "notes"];
        const example = ["John Doe", "Developer", "Jakarta", "123/PKWT/2025", "2025-01-01", "2025-12-31", "12 Months", "2025-01-25", "No Notes"];

        const csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n" + example.join(","); // Add example row

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "pkwt_template.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="dashboard-layout">
            <Sidebar />
            <main className="main-content">
                <div className="header-glass">
                    <h1>Input Data PKWT</h1>
                </div>

                <div className="content-area">
                    <div className="tabs glass-card" style={{ marginBottom: '20px', padding: '10px' }}>
                        <button
                            className={`tab-btn ${activeTab === 'manual' ? 'active' : ''}`}
                            onClick={() => setActiveTab('manual')}
                            style={{ marginRight: '10px', padding: '10px 20px', background: activeTab === 'manual' ? '#007bff' : 'transparent', color: activeTab === 'manual' ? '#fff' : '#333', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                        >
                            Manual Input
                        </button>
                        <button
                            className={`tab-btn ${activeTab === 'csv' ? 'active' : ''}`}
                            onClick={() => setActiveTab('csv')}
                            style={{ padding: '10px 20px', background: activeTab === 'csv' ? '#007bff' : 'transparent', color: activeTab === 'csv' ? '#fff' : '#333', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                        >
                            Import CSV
                        </button>
                    </div>

                    {activeTab === 'manual' ? (
                        <div className="glass-card form-container">
                            <form onSubmit={handleManualSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div className="form-group">
                                    <label className="form-label">Full Name</label>
                                    <input type="text" name="name" className="form-input" value={formData.name} onChange={handleInputChange} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Position</label>
                                    <input type="text" name="position" className="form-input" value={formData.position} onChange={handleInputChange} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Work Location</label>
                                    <input type="text" name="work_location" className="form-input" value={formData.work_location} onChange={handleInputChange} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Contract Number</label>
                                    <input type="text" name="contract_number" className="form-input" value={formData.contract_number} onChange={handleInputChange} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Start Date</label>
                                    <input type="date" name="start_date" className="form-input" value={formData.start_date} onChange={handleInputChange} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">End Date</label>
                                    <input type="date" name="end_date" className="form-input" value={formData.end_date} onChange={handleInputChange} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Duration</label>
                                    <input type="text" name="duration" className="form-input" placeholder="e.g. 12 Months" value={formData.duration} onChange={handleInputChange} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Compensation Pay Date</label>
                                    <input type="date" name="compensation_pay_date" className="form-input" value={formData.compensation_pay_date} onChange={handleInputChange} />
                                </div>
                                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                    <label className="form-label">Notes</label>
                                    <textarea name="notes" className="form-input" rows="3" value={formData.notes} onChange={handleInputChange}></textarea>
                                </div>
                                <div style={{ gridColumn: 'span 2', textAlign: 'right' }}>
                                    <button type="submit" className="btn-primary">Save Record</button>
                                </div>
                            </form>
                        </div>
                    ) : (
                        <div className="glass-card upload-container" style={{ textAlign: 'center', padding: '40px' }}>
                            <h3>Upload CSV or Excel File</h3>
                            <p style={{ marginBottom: '20px' }}>Upload a CSV or Excel (.xlsx) file containing bulk PKWT data.</p>

                            <div style={{ marginBottom: '30px' }}>
                                <button onClick={generateTemplate} style={{ border: '1px dashed #007bff', background: '#f0f8ff', padding: '10px', color: '#007bff', cursor: 'pointer', borderRadius: '5px' }}>
                                    Download Template CSV
                                </button>
                            </div>

                            <input
                                type="file"
                                accept=".csv, .xlsx, .xls"
                                onChange={handleFileChange}
                                ref={fileInputRef}
                                style={{ display: 'none' }}
                                id="csvInput"
                            />
                            <label htmlFor="csvInput" className="btn-secondary" style={{ cursor: 'pointer', padding: '10px 20px', display: 'inline-block', marginBottom: '15px' }}>
                                {file ? file.name : "Choose File"}
                            </label>

                            <br />

                            <button
                                onClick={handleFileUpload}
                                className="btn-primary"
                                disabled={!file}
                                style={{ opacity: !file ? 0.6 : 1, marginTop: '10px' }}
                            >
                                Upload & Process
                            </button>

                            {uploadStatus && (
                                <div style={{ marginTop: '20px', padding: '10px', borderRadius: '5px', backgroundColor: uploadStatus.type === 'success' ? '#d4edda' : '#f8d7da', color: uploadStatus.type === 'success' ? '#155724' : '#721c24' }}>
                                    {uploadStatus.message}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default InputData;
