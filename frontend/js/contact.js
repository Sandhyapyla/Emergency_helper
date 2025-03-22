document.addEventListener('DOMContentLoaded', () => {
    const contactForm = document.getElementById('serviceForm');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message';
    contactForm.appendChild(messageDiv);

    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = {
            name: document.getElementById('name').value,
            email: document.getElementById('email').value,
            message: document.getElementById('message').value
        };

        try {
            const response = await fetch('http://localhost:5001/api/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();
            
            if (response.ok) {
                const successMessage = data.stored 
                    ? 'Message sent and stored in database successfully!' 
                    : 'Message sent but not stored in database';
                messageDiv.textContent = successMessage;
                messageDiv.className = 'message success';
                contactForm.reset();
                
                if (data.data) {
                    console.log('Stored data:', data.data);
                }
            } else {
                throw new Error(data.message || 'Failed to send message');
            }
        } catch (error) {
            messageDiv.textContent = error.message;
            messageDiv.className = 'message error';
        }

        setTimeout(() => {
            messageDiv.textContent = '';
            messageDiv.className = 'message';
        }, 5000);
    });
});