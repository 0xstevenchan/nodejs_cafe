document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('dialogueForm');
    const statusMessage = document.createElement('div');
    statusMessage.className = 'status-message';
    form.parentNode.insertBefore(statusMessage, form.nextSibling);

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Disable form submission while processing
        const submitButton = form.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        statusMessage.textContent = '正在發送...';
        statusMessage.className = 'status-message pending';

        try {
            const formData = {
                name: form.name.value,
                email: form.email.value,
                subject: form.subject.value,
                message: form.message.value
            };

            const response = await fetch('/handleDialogue', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (result.success) {
                statusMessage.textContent = result.message;
                statusMessage.className = 'status-message success';
                form.reset();
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            statusMessage.textContent = error.message || '發送失敗，請稍後再試。';
            statusMessage.className = 'status-message error';
        } finally {
            submitButton.disabled = false;
        }
    });
});
