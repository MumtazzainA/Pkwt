import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';

const PKWTList = () => {
    const [pkwtData, setPkwtData] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [editedData, setEditedData] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPKWTData();
    }, []);

    const fetchPKWTData = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/pkwt');
            const data = await response.json();
            setPkwtData(data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching PKWT data:', error);
            setLoading(false);
        }
    };

    // Helper function to format date for input[type="date"]
    const formatDateForInput = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const handleEdit = (row) => {
        setEditingId(row.id);
        // Format dates for input fields
        setEditedData({
            ...row,
            start_date: formatDateForInput(row.start_date),
            end_date: formatDateForInput(row.end_date),
            compensation_pay_date: formatDateForInput(row.compensation_pay_date)
        });
    };

    const handleCancel = () => {
        setEditingId(null);
        setEditedData({});
    };

    const handleSave = async () => {
        try {
            const response = await fetch(`http://localhost:5000/api/pkwt/${editingId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(editedData),
            });

            if (response.ok) {
                await fetchPKWTData();
                setEditingId(null);
                setEditedData({});
                alert('Data berhasil diupdate!');
            } else {
                alert('Gagal update data');
            }
        } catch (error) {
            console.error('Error updating data:', error);
            alert('Error saat update data');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Apakah Anda yakin ingin menghapus data ini?')) {
            try {
                const response = await fetch(`http://localhost:5000/api/pkwt/${id}`, {
                    method: 'DELETE',
                });

                if (response.ok) {
                    await fetchPKWTData();
                    alert('Data berhasil dihapus!');
                } else {
                    alert('Gagal menghapus data');
                }
            } catch (error) {
                console.error('Error deleting data:', error);
                alert('Error saat menghapus data');
            }
        }
    };

    const handleChange = (field, value) => {
        setEditedData({ ...editedData, [field]: value });
    };

    const calculateRemainingDays = (endDate) => {
        // Create date from current local time (Indonesia timezone)
        const today = new Date();
        const todayYear = today.getFullYear();
        const todayMonth = today.getMonth();
        const todayDay = today.getDate();
        const todayLocal = new Date(todayYear, todayMonth, todayDay); // Local date at midnight

        // Parse end date properly to avoid timezone issues
        let endLocal;
        if (typeof endDate === 'string') {
            // Parse YYYY-MM-DD format
            const parts = endDate.split('T')[0].split('-');
            endLocal = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        } else {
            const end = new Date(endDate);
            endLocal = new Date(end.getFullYear(), end.getMonth(), end.getDate());
        }

        const diffTime = endLocal - todayLocal;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        // Add 1 to fix timezone offset issue (WIB UTC+7)
        return diffDays + 1;
    };

    const getRemainingDaysDisplay = (endDate, status) => {
        const days = calculateRemainingDays(endDate);

        if (days < 0) {
            return <span style={{ color: '#dc2626', fontWeight: 'bold' }}>Sudah Lewat ({Math.abs(days)} hari)</span>;
        } else if (days === 0) {
            return <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>Hari Terakhir</span>;
        } else if (days <= 7) {
            return <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>{days} hari (Segera Habis!)</span>;
        } else if (days <= 30) {
            return <span style={{ color: '#3b82f6', fontWeight: '600' }}>{days} hari</span>;
        } else {
            return <span>{days} hari</span>;
        }
    };

    // Auto-update status when data is fetched
    useEffect(() => {
        if (pkwtData.length > 0) {
            pkwtData.forEach(async (row) => {
                const remainingDays = calculateRemainingDays(row.end_date);

                // If contract expired but status is still Active, update it
                if (remainingDays < 0 && row.status === 'Active') {
                    try {
                        await fetch(`http://localhost:5000/api/pkwt/${row.id}`, {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                ...row,
                                status: 'Expired'
                            }),
                        });
                        // Refresh data after update
                        fetchPKWTData();
                    } catch (error) {
                        console.error('Error auto-updating status:', error);
                    }
                }
            });
        }
    }, [pkwtData]);


    if (loading) {
        return (
            <div className="dashboard-layout">
                <Sidebar />
                <main className="main-content">
                    <div className="loading">Loading...</div>
                </main>
            </div>
        );
    }

    return (
        <div className="dashboard-layout">
            <Sidebar />
            <main className="main-content">
                <div className="header-glass">
                    <h1>Data PKWT</h1>
                </div>

                <div className="table-container glass-card">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Nama</th>
                                <th>Posisi</th>
                                <th>Lokasi Kerja</th>
                                <th>No. PKWT</th>
                                <th>Tanggal Mulai</th>
                                <th>Tanggal Selesai</th>
                                <th>Durasi</th>
                                <th>Sisa Hari</th>
                                <th>Tgl Bayar Kompensasi</th>
                                <th>Status</th>
                                <th>Catatan</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pkwtData.length === 0 ? (
                                <tr>
                                    <td colSpan="12" className="text-center">Belum ada data PKWT</td>
                                </tr>
                            ) : (
                                pkwtData.map((row) => (
                                    <tr key={row.id}>
                                        <td>
                                            {editingId === row.id ? (
                                                <input
                                                    type="text"
                                                    value={editedData.name || ''}
                                                    onChange={(e) => handleChange('name', e.target.value)}
                                                    className="edit-input"
                                                />
                                            ) : (
                                                row.name
                                            )}
                                        </td>
                                        <td>
                                            {editingId === row.id ? (
                                                <input
                                                    type="text"
                                                    value={editedData.position || ''}
                                                    onChange={(e) => handleChange('position', e.target.value)}
                                                    className="edit-input"
                                                />
                                            ) : (
                                                row.position
                                            )}
                                        </td>
                                        <td>
                                            {editingId === row.id ? (
                                                <input
                                                    type="text"
                                                    value={editedData.work_location || ''}
                                                    onChange={(e) => handleChange('work_location', e.target.value)}
                                                    className="edit-input"
                                                />
                                            ) : (
                                                row.work_location
                                            )}
                                        </td>
                                        <td>
                                            {editingId === row.id ? (
                                                <input
                                                    type="text"
                                                    value={editedData.contract_number || ''}
                                                    onChange={(e) => handleChange('contract_number', e.target.value)}
                                                    className="edit-input"
                                                />
                                            ) : (
                                                row.contract_number
                                            )}
                                        </td>
                                        <td>
                                            {editingId === row.id ? (
                                                <input
                                                    type="date"
                                                    value={editedData.start_date || ''}
                                                    onChange={(e) => handleChange('start_date', e.target.value)}
                                                    className="edit-input"
                                                />
                                            ) : (
                                                new Date(row.start_date).toLocaleDateString('id-ID')
                                            )}
                                        </td>
                                        <td>
                                            {editingId === row.id ? (
                                                <input
                                                    type="date"
                                                    value={editedData.end_date || ''}
                                                    onChange={(e) => handleChange('end_date', e.target.value)}
                                                    className="edit-input"
                                                />
                                            ) : (
                                                new Date(row.end_date).toLocaleDateString('id-ID')
                                            )}
                                        </td>
                                        <td>
                                            {editingId === row.id ? (
                                                <input
                                                    type="text"
                                                    value={editedData.duration || ''}
                                                    onChange={(e) => handleChange('duration', e.target.value)}
                                                    className="edit-input"
                                                />
                                            ) : (
                                                row.duration
                                            )}
                                        </td>
                                        <td className="remaining-days">
                                            {getRemainingDaysDisplay(row.end_date, row.status)}
                                        </td>
                                        <td>
                                            {editingId === row.id ? (
                                                <input
                                                    type="date"
                                                    value={editedData.compensation_pay_date || ''}
                                                    onChange={(e) => handleChange('compensation_pay_date', e.target.value)}
                                                    className="edit-input"
                                                />
                                            ) : (
                                                row.compensation_pay_date ? new Date(row.compensation_pay_date).toLocaleDateString('id-ID') : '-'
                                            )}
                                        </td>
                                        <td>
                                            {editingId === row.id ? (
                                                <select
                                                    value={editedData.status || 'Active'}
                                                    onChange={(e) => handleChange('status', e.target.value)}
                                                    className="edit-input"
                                                >
                                                    <option value="Active">Active</option>
                                                    <option value="Expired">Expired</option>
                                                    <option value="Pending">Pending</option>
                                                </select>
                                            ) : (
                                                <span className={`status-badge status-${row.status?.toLowerCase()}`}>
                                                    {row.status}
                                                </span>
                                            )}
                                        </td>
                                        <td>
                                            {editingId === row.id ? (
                                                <textarea
                                                    value={editedData.notes || ''}
                                                    onChange={(e) => handleChange('notes', e.target.value)}
                                                    className="edit-input"
                                                    rows="2"
                                                />
                                            ) : (
                                                row.notes || '-'
                                            )}
                                        </td>
                                        <td className="action-cell">
                                            {editingId === row.id ? (
                                                <div className="action-buttons">
                                                    <button onClick={handleSave} className="btn-save">
                                                        💾 Save
                                                    </button>
                                                    <button onClick={handleCancel} className="btn-cancel">
                                                        ✖ Cancel
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="action-buttons">
                                                    <button onClick={() => handleEdit(row)} className="btn-edit">
                                                        ✏️ Edit
                                                    </button>
                                                    <button onClick={() => handleDelete(row.id)} className="btn-delete">
                                                        🗑️ Delete
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </main>
        </div>
    );
};

export default PKWTList;
