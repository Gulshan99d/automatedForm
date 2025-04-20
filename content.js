// Container
const app = document.createElement('div');
app.style.fontFamily = 'sans-serif';
app.style.position = 'fixed';
app.style.top = '50px';
app.style.right = '20px';
app.style.background = '#f4f4f4';
app.style.padding = '20px';
app.style.boxShadow = '0 0 10px rgba(0,0,0,0.2)';
app.style.zIndex = '10000';
document.body.appendChild(app);

// Heading
const heading = document.createElement('h3');
heading.innerText = 'Todo App';
app.appendChild(heading);

// Input
const input = document.createElement('input');
input.placeholder = 'Enter task';
input.style.padding = '8px';
input.style.width = '200px';
input.style.marginRight = '10px';
app.appendChild(input);

// Button
const addBtn = document.createElement('button');
addBtn.innerText = 'Add';
addBtn.style.padding = '8px 12px';
addBtn.style.background = '#007bff';
addBtn.style.color = '#fff';
addBtn.style.border = 'none';
addBtn.style.cursor = 'pointer';
app.appendChild(addBtn);

// List
const list = document.createElement('ul');
list.style.marginTop = '20px';
list.style.padding = '0';
list.style.listStyle = 'none';
app.appendChild(list);

// Add Task
addBtn.onclick = () => {
	if (!input.value.trim()) return;
	const li = document.createElement('li');
	li.innerText = input.value;
	li.style.padding = '6px 0';
	li.style.display = 'flex';
	li.style.justifyContent = 'space-between';

	const del = document.createElement('button');
	del.innerText = 'X';
	del.style.marginLeft = '10px';
	del.style.background = 'red';
	del.style.color = 'white';
	del.style.border = 'none';
	del.style.cursor = 'pointer';
	del.onclick = () => li.remove();

	li.appendChild(del);
	list.appendChild(li);
	input.value = '';
};
