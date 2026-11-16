const form = document.getElementById('login-form');
const msg = document.getElementById('msg');

if(localStorage.getItem('token')){
    window.location.href = 'dashboard.html';
}

form.addEventListener('submit', async (e)=>{
    e.preventDefault();

    const user = document.getElementById('username').value.trim();
    const pass = document.getElementById('password').value;

    try{
        const res = await fetch('/api/admin/login',{
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({user , pass})
        });

        const data = await res.json();

        if(!res.ok){
            msg.textContent = data.msg;
            msg.className = 'msg error';
            return;
        }

        localStorage.setItem('token', data.token);
        window.location.href = 'dashboard.html';

    } catch(err){
        msg.textContent = 'Server not reachable'
        msg.className = 'msg error';
    }
})
