document.addEventListener('DOMContentLoaded', () => {
  const userList = document.getElementById('userList');
  const form = document.getElementById('userForm');
  const nameInput = document.getElementById('name');
  const ageInput = document.getElementById('age');

  function loadUsers() {
    fetch('/api/users')
      .then(res => res.json())
      .then(data => {
        userList.innerHTML = '';
        data.forEach((user, index) => {
          const li = document.createElement('li');
          li.className = 'list-group-item d-flex justify-content-between align-items-center';
          li.innerHTML = `
            <span>${user.name} (${user.age})</span>
            <button class="btn btn-danger btn-sm" onclick="deleteUser(${index})">Delete</button>
          `;
          userList.appendChild(li);
        });
      });
  }

  window.deleteUser = (index) => {
    fetch(`/api/users/${index}`, { method: 'DELETE' })
      .then(() => loadUsers());
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const user = {
      name: nameInput.value.trim(),
      age: parseInt(ageInput.value)
    };
    fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user)
    }).then(() => {
      form.reset();
      loadUsers();
    });
  });

  loadUsers();
});
