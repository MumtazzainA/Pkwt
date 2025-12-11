// Test file untuk debug perhitungan sisa hari
// Jalankan di browser console

function testCalculateRemainingDays() {
    // Simulasi data dari database
    const endDateFromDB = '2025-12-31T00:00:00.000Z'; // atau '2025-12-31'

    // Get today's date at midnight
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Parse end date
    const dateStr = endDateFromDB.split('T')[0];
    const [year, month, day] = dateStr.split('-').map(num => parseInt(num));
    const end = new Date(year, month - 1, day);

    // Calculate difference
    const diffMs = end - today;
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    console.log('========== DEBUG CALCULATION ==========');
    console.log('End Date dari DB:', endDateFromDB);
    console.log('Hari ini (today):', today.toLocaleDateString('id-ID'), '|', today.toISOString());
    console.log('End Date (parsed):', end.toLocaleDateString('id-ID'), '|', end.toISOString());
    console.log('Selisih ms:', diffMs);
    console.log('Selisih hari (Math.round):', diffDays);
    console.log('=====================================');

    // Manual verification
    console.log('\n Manual Check:');
    console.log('Tanggal hari ini:', now.getDate(), 'Desember 2025');
    console.log('Tanggal selesai: 31 Desember 2025');
    console.log('Seharusnya: 31 - ' + now.getDate() + ' = ' + (31 - now.getDate()) + ' hari');

    return diffDays;
}

// Jalankan test
const result = testCalculateRemainingDays();
console.log('\n⭐ HASIL:', result, 'hari');
