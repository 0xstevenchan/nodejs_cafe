document.addEventListener('DOMContentLoaded', function() {
    // Check Msg button handler
    const checkMsgBtn = document.getElementById('checkMsgBtn');
    const msgStats = document.getElementById('msgStats');
    const msgStatsContent = document.getElementById('msgStatsContent');

    if (checkMsgBtn) {
        checkMsgBtn.addEventListener('click', async () => {
            try {
                const response = await fetch('/api/messages/stats');
                const data = await response.json();
                
                msgStatsContent.innerHTML = `
                    <p>Total Messages: ${data.totalMessages || 0}</p>
                    <p>New Messages: ${data.newMessages || 0}</p>
                `;
                msgStats.style.display = 'block';
            } catch (error) {
                console.error('Error fetching message stats:', error);
                showAlert('danger', 'Failed to fetch message statistics');
            }
        });
    }

    // Helper function to show alerts
    function showAlert(type, message) {
        const alert = document.getElementById('alert');
        alert.className = `alert alert-${type}`;
        alert.textContent = message;
        alert.style.display = 'block';
        
        setTimeout(() => {
            alert.style.display = 'none';
        }, 5000);
    }
});
