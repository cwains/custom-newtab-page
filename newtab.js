// --- clock & date ---
function updateClock() {
  const now = new Date();
  const clock = document.getElementById('clock');
  const date = document.getElementById('date');
  clock.textContent = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  date.textContent = now.toLocaleDateString();
}
setInterval(updateClock, 1000);
updateClock();

// --- draggable widgets ---
const draggables = document.querySelectorAll('.draggable');
draggables.forEach(w => {
  w.onmousedown = dragMouseDown;
});

function dragMouseDown(e) {
  e.preventDefault();
  const elm = e.target;
  let shiftX = e.clientX - elm.getBoundingClientRect().left;
  let shiftY = e.clientY - elm.getBoundingClientRect().top;

  function moveAt(x, y) {
    elm.style.left = x - shiftX + 'px';
    elm.style.top = y - shiftY + 'px';
  }

  function onMouseMove(e) {
    moveAt(e.clientX, e.clientY);
  }

  document.addEventListener('mousemove', onMouseMove);

  elm.onmouseup = function() {
    document.removeEventListener('mousemove', onMouseMove);
    elm.onmouseup = null;
    saveWidgetPositions();
  };
}

// --- save & load widget positions ---
function saveWidgetPositions() {
  let positions = {};
  draggables.forEach(w => {
    positions[w.id] = { left: w.style.left, top: w.style.top };
  });
  chrome.storage.local.set({ widgetPositions: positions });
}

function loadWidgetPositions() {
  chrome.storage.local.get('widgetPositions', data => {
    if(data.widgetPositions){
      for(let id in data.widgetPositions){
        let w = document.getElementById(id);
        if(w){
          w.style.left = data.widgetPositions[id].left;
          w.style.top = data.widgetPositions[id].top;
        }
      }
    }
  });
}
loadWidgetPositions();

// --- presets ---
const presets = {
  minimal: { widgets: ['clock','date'], background: '#222' },
  productivity: { widgets: ['clock','date','todo'], background: 'linear-gradient(135deg, #89f7fe, #66a6ff)' },
  vibe: { widgets: ['clock','date','todo'], background: 'linear-gradient(45deg, #ff9a9e, #fad0c4)' }
};

const presetSelect = document.getElementById('preset-select');
presetSelect.onchange = () => {
  applyPreset(presetSelect.value);
  chrome.storage.local.set({ activePreset: presetSelect.value });
};

function applyPreset(name){
  const p = presets[name];
  draggables.forEach(w => w.style.display = p.widgets.includes(w.id) ? 'block' : 'none');
  document.getElementById('background').style.background = p.background;
}

chrome.storage.local.get('activePreset', data => {
  if(data.activePreset) presetSelect.value = data.activePreset;
  applyPreset(presetSelect.value);
});

// --- GIF uploader ---
const gifInput = document.getElementById('gifUpload');
gifInput.addEventListener('change', function(){
  const file = this.files[0];
  if(file && file.type === 'image/gif'){
    const reader = new FileReader();
    reader.onload = function(e){
      document.getElementById('background').style.backgroundImage = `url(${e.target.result})`;
      chrome.storage.local.set({ gifBackground: e.target.result });
    }
    reader.readAsDataURL(file);
  }
});

chrome.storage.local.get('gifBackground', data => {
  if(data.gifBackground){
    document.getElementById('background').style.backgroundImage = `url(${data.gifBackground})`;
  }
});

// --- todo list ---
const todoInput = document.getElementById('todo-input');
const todoList = document.getElementById('todo-list');

todoInput.addEventListener('keypress', e => {
  if(e.key === 'Enter' && todoInput.value.trim() !== ''){
    addTodo(todoInput.value.trim());
    todoInput.value = '';
  }
});

function addTodo(text){
  const li = document.createElement('li');
  li.textContent = text;
  li.addEventListener('click', () => {
    li.remove();
    saveTodos();
  });
  todoList.appendChild(li);
  saveTodos();
}

function saveTodos(){
  const tasks = Array.from(todoList.children).map(li => li.textContent);
  chrome.storage.local.set({ todos: tasks });
}

function loadTodos(){
  chrome.storage.local.get('todos', data => {
    if(data.todos){
      data.todos.forEach(addTodo);
    }
  });
}
loadTodos();