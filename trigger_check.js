import 'dotenv/config';
import { checkContractsAndNotify } from './server/services/notificationChecker.js';

console.log('--- TRIGGERING NOTIFICATION CHECK ---');
checkContractsAndNotify().then(() => {
    console.log('--- CHECK COMPLETE ---');
    process.exit(0);
}).catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
